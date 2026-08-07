-- Reproduit le schéma RÉEL de production (relevé le 03/08/2026) sur un
-- Postgres nu, pour tester 003 sans toucher à Supabase.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$ BEGIN CREATE ROLE anon;          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE storage.buckets (id TEXT PRIMARY KEY, name TEXT, public BOOLEAN DEFAULT FALSE);
CREATE TABLE storage.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT, name TEXT, owner UUID
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID
LANGUAGE SQL STABLE AS $$
  SELECT NULLIF(current_setting('test.uid', true), '')::UUID;
$$;

-- ---------- public.profiles (avec role, PAS is_admin) ----------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE,
  country TEXT DEFAULT 'FR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  role TEXT DEFAULT 'user' CHECK (role IN ('user','mod','admin'))
);

-- ---------- public.cards (schéma enrichi de prod) ----------
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  set_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  lang TEXT NOT NULL,
  country TEXT NOT NULL,
  card_number TEXT NOT NULL,
  rarity TEXT NOT NULL,
  variant TEXT NOT NULL,
  note TEXT DEFAULT '',
  image_url TEXT,
  is_owned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','disputed','rejected')),
  source TEXT,
  source_url TEXT,
  ai_confidence TEXT CHECK (ai_confidence IN ('high','medium','low')),
  ai_verdict TEXT CHECK (ai_verdict IN ('official','likely_official','unsure','fake')),
  back_image_url TEXT,
  image_needs_verification BOOLEAN NOT NULL DEFAULT FALSE,
  image_verified_by UUID REFERENCES auth.users(id),
  image_verified_at TIMESTAMPTZ,
  pipeline_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (pipeline_status IN ('draft','sourced','image_ok','verified','live','rejected')),
  pipeline_checks JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('card','item','correction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_by UUID REFERENCES auth.users(id),
  contributor_name TEXT,
  contributor_email TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

CREATE TABLE card_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL REFERENCES cards(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vote TEXT NOT NULL CHECK (vote IN ('official','fake','unsure')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists     ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_votes    ENABLE ROW LEVEL SECURITY;

-- is_admin() tel qu'il existe en prod
CREATE OR REPLACE FUNCTION is_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM profiles WHERE id = uid AND role IN ('admin','mod')); $$;

-- Policies telles qu'elles existent en prod (celles que 003 doit corriger)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "cards_select" ON cards FOR SELECT USING (true);
CREATE POLICY "cards_insert" ON cards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cards_admin_update" ON cards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','mod')));
CREATE POLICY "cards_admin_delete" ON cards FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "contributions_insert" ON contributions FOR INSERT WITH CHECK (true);
CREATE POLICY "contributions_select" ON contributions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "wishlists_select" ON wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlists_insert" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlists_delete" ON wishlists FOR DELETE USING (auth.uid() = user_id);

-- Données d'exemple reproduisant la répartition réelle (EN/DE/JP/ZH,
-- source masterlist/tcgdex, 'Normal' majoritaire, quelques sans-image).
INSERT INTO cards (id, set_name, year, lang, country, card_number, rarity, variant, note, image_url, source, verification_status, is_owned) VALUES
 ('base1-EN-1999-63','Base Set',1999,'EN','US','63/102','Common','Normal','','https://assets.tcgdex.net/en/base/base1/63/high.webp','masterlist','verified',TRUE),
 ('base1-1st-EN-1999-63','Base Set',1999,'EN','US','63/102','Common','1st Edition','','https://assets.tcgdex.net/en/base/base1/63/high.webp','masterlist','verified',FALSE),
 ('base1-DE-1999-63','Grundset',1999,'DE','DE','63/102','Häufig','Normal','','https://assets.tcgdex.net/de/base/base1/63/high.webp','tcgdex','pending',FALSE),
 ('evolutions-EN-2016-22','Évolutions',2016,'EN','US','22/108','Common','Reverse Holo','Réimpression',NULL,'masterlist','verified',FALSE),
 ('advp-55-JP-2004-55','ADV-P Promotional cards',2004,'JP','JP','55','Promo','Normal','','https://pokecardex-scans.b-cdn.net/sets_jp/ADVP/55.jpg?class=hd','masterlist','verified',FALSE),
 ('vsc-JP-2023-52','Venusaur & Charizard & Blastoise Special Deck Set ex',2023,'JP','JP','52','Holo','Holo','',NULL,'masterlist','pending',FALSE),
 ('zh-1-ZH-2023-7','中文版',2023,'ZH','TW','007','C','Normal','',NULL,'tcgdex','pending',FALSE);

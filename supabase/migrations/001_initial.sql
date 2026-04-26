-- ============================================================
-- La Maison de Carapuce — Initial Schema
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE,
  country TEXT DEFAULT 'FR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards (master catalogue)
CREATE TABLE IF NOT EXISTS cards (
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
  created_by UUID REFERENCES auth.users(id)
);

-- Contributions (form submissions from community)
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('card', 'item', 'correction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by UUID REFERENCES auth.users(id),
  contributor_name TEXT,
  contributor_email TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- ============================================================
-- Contributor stats — SECURITY DEFINER function (bypasses RLS
-- safely; only exposes aggregated public data, no emails)
-- ============================================================
CREATE OR REPLACE FUNCTION get_contributor_stats()
RETURNS TABLE(
  handle          TEXT,
  country         TEXT,
  created_at      TIMESTAMPTZ,
  cards_contributed BIGINT,
  items_donated   BIGINT,
  rank            BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(p.handle, 'anonyme') AS handle,
    COALESCE(p.country, 'FR')     AS country,
    p.created_at,
    COUNT(DISTINCT c.id) FILTER (WHERE c.type = 'card' AND c.status = 'approved') AS cards_contributed,
    COUNT(DISTINCT c.id) FILTER (WHERE c.type = 'item' AND c.status = 'approved') AS items_donated,
    RANK() OVER (
      ORDER BY (
        COUNT(DISTINCT c.id) FILTER (WHERE c.type = 'card' AND c.status = 'approved') +
        COUNT(DISTINCT c.id) FILTER (WHERE c.type = 'item' AND c.status = 'approved')
      ) DESC
    ) AS rank
  FROM profiles p
  LEFT JOIN contributions c ON c.submitted_by = p.id
  GROUP BY p.id, p.handle, p.country, p.created_at
  ORDER BY rank;
$$;

-- ============================================================
-- Site stats function (used on homepage)
-- ============================================================
CREATE OR REPLACE FUNCTION get_site_stats()
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_cards',   (SELECT COUNT(*) FROM cards),
    'total_langs',   (SELECT COUNT(DISTINCT lang) FROM cards),
    'total_sets',    (SELECT COUNT(DISTINCT set_name) FROM cards),
    'contributors',  (SELECT COUNT(*) FROM profiles),
    'items_received',(SELECT COUNT(*) FROM contributions WHERE type = 'item' AND status = 'approved'),
    'years_covered', '1996 — 2026'
  );
$$;

-- ============================================================
-- Auto-create profile on sign-up
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, handle)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'handle', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, owner write
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Cards: public read, auth insert
CREATE POLICY "cards_select" ON cards FOR SELECT USING (true);
CREATE POLICY "cards_insert" ON cards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Contributions: anyone can insert, auth users can view all
CREATE POLICY "contributions_insert" ON contributions FOR INSERT WITH CHECK (true);
CREATE POLICY "contributions_select" ON contributions FOR SELECT USING (auth.uid() IS NOT NULL);

-- Wishlists: own only
CREATE POLICY "wishlists_select" ON wishlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlists_insert" ON wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlists_delete" ON wishlists FOR DELETE USING (auth.uid() = user_id);

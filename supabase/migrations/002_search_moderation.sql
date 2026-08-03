-- ============================================================
-- La Maison de Carapuce — 002
-- Recherche, modération, images, correctifs RLS
-- ============================================================
-- À exécuter dans Supabase > SQL Editor, après 001_initial.sql.
-- Idempotent : réexécutable sans danger.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm  WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- ============================================================
-- 1. Rôle administrateur (conservateur)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Lit is_admin en contournant la RLS pour éviter la récursion de policy.
CREATE OR REPLACE FUNCTION is_curator()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()),
    FALSE
  );
$$;

-- ============================================================
-- 2. Colonnes catalogue : provenance, images, vérification
-- ============================================================

ALTER TABLE cards ADD COLUMN IF NOT EXISTS name_local   TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS set_id       TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS illustrator  TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS source       TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS external_id  TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS official_image_url TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS scan_url     TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_verified  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cards ADD COLUMN IF NOT EXISTS search_text  TEXT;

-- Certains sets promo n'ont pas de date de sortie connue : mieux vaut une
-- année NULL affichée « année inconnue » qu'une année inventée.
ALTER TABLE cards ALTER COLUMN year DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE cards ADD CONSTRAINT cards_source_check
    CHECK (source IN ('manual', 'tcgdex', 'community'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Les cartes historiques saisies à la main sont considérées vérifiées.
UPDATE cards SET is_verified = TRUE WHERE source = 'manual' AND is_verified = FALSE;

-- ============================================================
-- 3. Recherche : normalisation accent-insensible
-- ============================================================
-- On maintient search_text par trigger plutôt qu'en colonne générée :
-- unaccent() n'est pas IMMUTABLE, donc inutilisable dans un GENERATED.

CREATE OR REPLACE FUNCTION mdc_normalize(input TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
SET search_path = extensions, public
AS $$
  SELECT lower(unaccent(COALESCE(input, '')));
$$;

CREATE OR REPLACE FUNCTION cards_refresh_search_text()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_text := mdc_normalize(
    concat_ws(' ',
      NEW.id, NEW.set_name, NEW.set_id, NEW.name_local, NEW.year::TEXT,
      NEW.lang, NEW.country, NEW.card_number, NEW.rarity, NEW.variant,
      NEW.illustrator, NEW.note
    )
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cards_search_text_trigger ON cards;
CREATE TRIGGER cards_search_text_trigger
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION cards_refresh_search_text();

-- Backfill des lignes existantes
UPDATE cards SET id = id WHERE search_text IS NULL;

CREATE INDEX IF NOT EXISTS cards_search_text_idx
  ON cards USING GIN (search_text extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cards_lang_idx    ON cards (lang);
CREATE INDEX IF NOT EXISTS cards_year_idx    ON cards (year);
CREATE INDEX IF NOT EXISTS cards_variant_idx ON cards (variant);

-- ============================================================
-- 4. RPC de recherche : multi-mots (ET), filtres, tri, pagination
-- ============================================================

DROP FUNCTION IF EXISTS search_cards(TEXT, TEXT[], TEXT[], BOOLEAN, INT, INT, TEXT, INT, INT);
DROP FUNCTION IF EXISTS search_cards(TEXT, TEXT[], TEXT[], BOOLEAN, INT, INT, TEXT, INT, INT, BOOLEAN);
CREATE FUNCTION search_cards(
  q          TEXT    DEFAULT '',
  langs      TEXT[]  DEFAULT NULL,
  variants   TEXT[]  DEFAULT NULL,
  owned      BOOLEAN DEFAULT NULL,
  year_min   INT     DEFAULT NULL,
  year_max   INT     DEFAULT NULL,
  sort       TEXT    DEFAULT 'year_asc',
  lim        INT     DEFAULT 60,
  off        INT     DEFAULT 0,
  -- TRUE = uniquement les fiches sans aucun visuel (appel à contribution).
  missing_image BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id TEXT, set_name TEXT, year INTEGER, lang TEXT, country TEXT,
  card_number TEXT, rarity TEXT, variant TEXT, note TEXT,
  image_url TEXT, official_image_url TEXT, scan_url TEXT,
  is_owned BOOLEAN, is_verified BOOLEAN, source TEXT,
  name_local TEXT, illustrator TEXT, set_id TEXT,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  WITH tokens AS (
    SELECT ARRAY(
      SELECT '%' || t || '%'
      FROM unnest(string_to_array(mdc_normalize(q), ' ')) AS t
      WHERE t <> ''
    ) AS pats
  ),
  matched AS (
    SELECT c.*
    FROM cards c, tokens
    WHERE (cardinality(tokens.pats) = 0 OR c.search_text LIKE ALL (tokens.pats))
      AND (langs    IS NULL OR c.lang    = ANY (langs))
      AND (variants IS NULL OR c.variant = ANY (variants))
      AND (owned    IS NULL OR c.is_owned = owned)
      AND (year_min IS NULL OR c.year >= year_min)
      AND (year_max IS NULL OR c.year <= year_max)
      AND (missing_image IS NULL OR missing_image = (
             c.scan_url IS NULL AND c.image_url IS NULL AND c.official_image_url IS NULL))
  )
  SELECT
    m.id, m.set_name, m.year, m.lang, m.country,
    m.card_number, m.rarity, m.variant, m.note,
    m.image_url, m.official_image_url, m.scan_url,
    m.is_owned, m.is_verified, m.source,
    m.name_local, m.illustrator, m.set_id,
    m.created_at,
    COUNT(*) OVER () AS total_count
  FROM matched m
  ORDER BY
    CASE WHEN sort = 'year_asc'  THEN m.year END ASC,
    CASE WHEN sort = 'year_desc' THEN m.year END DESC,
    CASE WHEN sort = 'set_asc'   THEN m.set_name END ASC,
    m.set_name, m.lang, m.card_number, m.variant
  LIMIT  GREATEST(1, LEAST(lim, 200))
  OFFSET GREATEST(0, off);
$$;

-- ============================================================
-- 5. Facettes pour l'UI (valeurs réellement présentes en base)
-- ============================================================

CREATE OR REPLACE FUNCTION get_catalogue_facets()
RETURNS JSONB
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'langs',    (SELECT COALESCE(jsonb_agg(x ORDER BY x->>'value'), '[]'::jsonb)
                 FROM (SELECT jsonb_build_object('value', lang, 'count', COUNT(*)) AS x
                       FROM cards GROUP BY lang) s),
    'variants', (SELECT COALESCE(jsonb_agg(x ORDER BY x->>'value'), '[]'::jsonb)
                 FROM (SELECT jsonb_build_object('value', variant, 'count', COUNT(*)) AS x
                       FROM cards GROUP BY variant) s),
    'years',    jsonb_build_object(
                  'min', (SELECT MIN(year) FROM cards),
                  'max', (SELECT MAX(year) FROM cards)
                ),
    'total',    (SELECT COUNT(*) FROM cards),
    'owned',    (SELECT COUNT(*) FROM cards WHERE is_owned),
    'missing_image', (SELECT COUNT(*) FROM cards
                       WHERE scan_url IS NULL AND image_url IS NULL
                         AND official_image_url IS NULL)
  );
$$;

-- ============================================================
-- 6. Détection de doublons (appelée avant soumission)
-- ============================================================

CREATE OR REPLACE FUNCTION find_similar_cards(
  p_set_name    TEXT,
  p_card_number TEXT DEFAULT NULL,
  p_lang        TEXT DEFAULT NULL
)
RETURNS TABLE (
  id TEXT, set_name TEXT, year INTEGER, lang TEXT,
  card_number TEXT, variant TEXT, similarity REAL
)
LANGUAGE SQL
STABLE
SET search_path = public, extensions
AS $$
  SELECT c.id, c.set_name, c.year, c.lang, c.card_number, c.variant,
         similarity(c.search_text, mdc_normalize(
           concat_ws(' ', p_set_name, p_card_number, p_lang))) AS similarity
  FROM cards c
  WHERE
    (p_card_number IS NOT NULL AND p_card_number <> ''
     AND mdc_normalize(c.card_number) = mdc_normalize(p_card_number)
     AND (p_lang IS NULL OR p_lang = '' OR mdc_normalize(c.lang) = mdc_normalize(p_lang)))
    OR
    (p_set_name IS NOT NULL AND p_set_name <> ''
     AND c.search_text % mdc_normalize(p_set_name))
  ORDER BY similarity DESC
  LIMIT 5;
$$;

-- ============================================================
-- 7. Modération : approuver / rejeter une contribution
-- ============================================================

ALTER TABLE contributions ADD COLUMN IF NOT EXISTS reviewed_by    UUID REFERENCES auth.users(id);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMPTZ;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS review_note    TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS created_card_id TEXT REFERENCES cards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS contributions_status_idx ON contributions (status, created_at DESC);

-- Approuve une contribution de type 'card' et crée la fiche correspondante.
CREATE OR REPLACE FUNCTION approve_contribution(
  p_id      UUID,
  p_card_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c            contributions%ROWTYPE;
  d            JSONB;
  new_id       TEXT;
  v_year       INTEGER;
BEGIN
  IF NOT is_curator() THEN
    RAISE EXCEPTION 'Réservé aux conservateurs.';
  END IF;

  SELECT * INTO c FROM contributions WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribution introuvable.';
  END IF;
  IF c.status <> 'pending' THEN
    RAISE EXCEPTION 'Contribution déjà traitée (%).', c.status;
  END IF;

  IF c.type = 'card' THEN
    d := c.data;

    -- Année : on refuse une contribution inexploitable plutôt que d'insérer du bruit.
    BEGIN
      v_year := (NULLIF(d->>'year', ''))::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Année invalide : %', d->>'year';
    END;
    IF v_year IS NULL OR v_year < 1996 OR v_year > EXTRACT(YEAR FROM NOW()) + 1 THEN
      RAISE EXCEPTION 'Année invalide : %', COALESCE(d->>'year', '(vide)');
    END IF;

    new_id := COALESCE(
      NULLIF(p_card_id, ''),
      upper(regexp_replace(
        concat_ws('-',
          COALESCE(NULLIF(d->>'set_name', ''), 'SET'),
          COALESCE(NULLIF(d->>'card_number', ''), '0'),
          COALESCE(NULLIF(d->>'lang', ''), 'XX'),
          v_year::TEXT
        ), '[^a-zA-Z0-9]+', '-', 'g'))
    );

    IF EXISTS (SELECT 1 FROM cards WHERE cards.id = new_id) THEN
      RAISE EXCEPTION 'Une carte porte déjà l''identifiant % — modifiez-le.', new_id;
    END IF;

    INSERT INTO cards (
      id, set_name, year, lang, country, card_number, rarity, variant,
      note, image_url, source, is_verified, is_owned, created_by
    ) VALUES (
      new_id,
      COALESCE(NULLIF(d->>'set_name', ''), 'Inconnu'),
      v_year,
      upper(COALESCE(NULLIF(d->>'lang', ''), 'XX')),
      upper(COALESCE(NULLIF(d->>'country', ''), 'XX')),
      COALESCE(NULLIF(d->>'card_number', ''), '—'),
      COALESCE(NULLIF(d->>'rarity', ''), '—'),
      COALESCE(NULLIF(d->>'variant', ''), '—'),
      COALESCE(d->>'note', ''),
      NULLIF(d->>'scan_url', ''),
      'community',
      TRUE,
      FALSE,
      c.submitted_by
    );

    UPDATE contributions
       SET status = 'approved', reviewed_by = auth.uid(),
           reviewed_at = NOW(), created_card_id = new_id
     WHERE id = p_id;

    RETURN new_id;
  END IF;

  -- item / correction : pas de création de fiche automatique
  UPDATE contributions
     SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = NOW()
   WHERE id = p_id;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION reject_contribution(p_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_curator() THEN
    RAISE EXCEPTION 'Réservé aux conservateurs.';
  END IF;

  UPDATE contributions
     SET status = 'rejected', reviewed_by = auth.uid(),
         reviewed_at = NOW(), review_note = p_reason
   WHERE id = p_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribution introuvable ou déjà traitée.';
  END IF;
END;
$$;

-- ============================================================
-- 8. CORRECTIFS RLS
-- ============================================================

-- 8a. FUITE DE DONNÉES : la policy d'origine laissait n'importe quel
--     compte authentifié lire contributor_email de tout le monde.
DROP POLICY IF EXISTS "contributions_select" ON contributions;

CREATE POLICY "contributions_select_own" ON contributions
  FOR SELECT USING (submitted_by IS NOT NULL AND auth.uid() = submitted_by);

CREATE POLICY "contributions_select_curator" ON contributions
  FOR SELECT USING (is_curator());

CREATE POLICY "contributions_update_curator" ON contributions
  FOR UPDATE USING (is_curator());

-- 8b. MODÉRATION CONTOURNABLE : la policy d'origine autorisait tout
--     compte authentifié à écrire directement dans le catalogue.
DROP POLICY IF EXISTS "cards_insert" ON cards;

CREATE POLICY "cards_insert_curator" ON cards
  FOR INSERT WITH CHECK (is_curator());
CREATE POLICY "cards_update_curator" ON cards
  FOR UPDATE USING (is_curator());
CREATE POLICY "cards_delete_curator" ON cards
  FOR DELETE USING (is_curator());

-- 8c. Les profils exposaient is_admin en lecture publique : on restreint
--     les colonnes sensibles via une vue publique dédiée.
CREATE OR REPLACE VIEW public_profiles
WITH (security_invoker = true)
AS SELECT id, handle, country, created_at FROM profiles;

GRANT SELECT ON public_profiles TO anon, authenticated;

-- 8d. ESCALADE DE PRIVILÈGES : la policy "profiles_update" autorise chacun à
--     modifier SA ligne — is_admin compris. N'importe quel inscrit pouvait
--     donc se sacrer conservateur, puis écrire dans le catalogue.
--     Deux verrous indépendants :

--     (1) Privilège colonne : le rôle applicatif ne peut écrire que handle/country.
REVOKE UPDATE ON profiles FROM anon, authenticated;
GRANT  UPDATE (handle, country) ON profiles TO authenticated;

--     (2) Garde-fou applicatif, si un GRANT ALL ultérieur écrasait (1).
CREATE OR REPLACE FUNCTION protect_curator_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND auth.uid() IS NOT NULL   -- NULL = SQL Editor / service_role (amorçage)
     AND NOT is_curator()
  THEN
    RAISE EXCEPTION 'Seul un conservateur peut accorder ce statut.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_curator_flag ON profiles;
CREATE TRIGGER profiles_protect_curator_flag
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_curator_flag();

-- ============================================================
-- 9. Statistiques : ne compter que les cartes vérifiées
-- ============================================================

CREATE OR REPLACE FUNCTION get_site_stats()
RETURNS JSONB
LANGUAGE SQL
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_cards',   (SELECT COUNT(*) FROM cards),
    'total_langs',   (SELECT COUNT(DISTINCT lang) FROM cards),
    'total_sets',    (SELECT COUNT(DISTINCT set_name) FROM cards),
    'total_owned',   (SELECT COUNT(*) FROM cards WHERE is_owned),
    'contributors',  (SELECT COUNT(*) FROM profiles),
    'pending',       (SELECT COUNT(*) FROM contributions WHERE status = 'pending'),
    'items_received',(SELECT COUNT(*) FROM contributions WHERE type = 'item' AND status = 'approved'),
    'years_covered', COALESCE(
      (SELECT MIN(year)::TEXT || ' — ' || MAX(year)::TEXT FROM cards), '—')
  );
$$;

-- ============================================================
-- 10. Bucket de stockage des scans communautaires
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('scans', 'scans', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "scans_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "scans_auth_upload"   ON storage.objects;
DROP POLICY IF EXISTS "scans_curator_purge" ON storage.objects;

CREATE POLICY "scans_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'scans');

CREATE POLICY "scans_auth_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scans');

CREATE POLICY "scans_curator_purge" ON storage.objects
  FOR DELETE USING (bucket_id = 'scans' AND is_curator());

-- ============================================================
-- 11. Se nommer conservateur
-- ============================================================
-- Crée ton compte sur /auth, puis exécute (avec TON email) :
--
--   UPDATE profiles SET is_admin = TRUE
--    WHERE id = (SELECT id FROM auth.users WHERE email = 'ton@email.fr');
-- ============================================================

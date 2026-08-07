-- ============================================================
-- La Maison de Carapuce — 003
-- Recherche Postgres + durcissement RLS
-- ============================================================
-- Écrite d'après le schéma RÉEL de production (relevé le 03/08/2026),
-- qui a divergé de 001 : profiles.role (user/mod/admin), cards.verification_status,
-- cards.pipeline_status, tables card_votes / card_sightings / card_errors /
-- image_verifications.
--
-- Remplace 002_search_moderation.sql, qui supposait un schéma obsolète et
-- aurait échoué (contrainte CHECK sur source, colonne is_admin redondante).
--
-- Idempotent. N'ajoute aucune colonne métier : réutilise l'existant.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm  WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- ============================================================
-- 1. Normalisation pour la recherche
-- ============================================================

CREATE OR REPLACE FUNCTION mdc_normalize(input TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
SET search_path = extensions, public
AS $$
  SELECT lower(unaccent(COALESCE(input, '')));
$$;

ALTER TABLE cards ADD COLUMN IF NOT EXISTS search_text TEXT;

-- Colonne maintenue par trigger : unaccent() n'est pas IMMUTABLE, donc
-- inutilisable dans une colonne générée ou un index fonctionnel.
CREATE OR REPLACE FUNCTION cards_refresh_search_text()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_text := mdc_normalize(
    concat_ws(' ',
      NEW.id, NEW.set_name, NEW.year::TEXT, NEW.lang, NEW.country,
      NEW.card_number, NEW.rarity, NEW.variant, NEW.note, NEW.source
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cards_search_text_trigger ON cards;
CREATE TRIGGER cards_search_text_trigger
  BEFORE INSERT OR UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION cards_refresh_search_text();

-- Backfill des lignes existantes (déclenche le trigger sans rien modifier).
UPDATE cards SET id = id WHERE search_text IS NULL;

CREATE INDEX IF NOT EXISTS cards_search_text_idx
  ON cards USING GIN (search_text extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cards_lang_idx    ON cards (lang);
CREATE INDEX IF NOT EXISTS cards_year_idx    ON cards (year);
CREATE INDEX IF NOT EXISTS cards_variant_idx ON cards (variant);

-- ============================================================
-- 2. Recherche : multi-mots (ET), sans accent, filtres, pagination
-- ============================================================

DROP FUNCTION IF EXISTS search_cards(TEXT, TEXT[], TEXT[], BOOLEAN, INT, INT, TEXT, INT, INT, BOOLEAN);
CREATE FUNCTION search_cards(
  q             TEXT    DEFAULT '',
  langs         TEXT[]  DEFAULT NULL,
  variants      TEXT[]  DEFAULT NULL,
  owned         BOOLEAN DEFAULT NULL,
  year_min      INT     DEFAULT NULL,
  year_max      INT     DEFAULT NULL,
  sort          TEXT    DEFAULT 'year_asc',
  lim           INT     DEFAULT 60,
  off           INT     DEFAULT 0,
  missing_image BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id TEXT, set_name TEXT, year INTEGER, lang TEXT, country TEXT,
  card_number TEXT, rarity TEXT, variant TEXT, note TEXT,
  image_url TEXT, back_image_url TEXT,
  is_owned BOOLEAN, verification_status TEXT, pipeline_status TEXT,
  source TEXT, source_url TEXT,
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
      AND (owned    IS NULL OR COALESCE(c.is_owned, FALSE) = owned)
      AND (year_min IS NULL OR c.year >= year_min)
      AND (year_max IS NULL OR c.year <= year_max)
      AND (missing_image IS NULL OR missing_image = (c.image_url IS NULL))
  )
  SELECT
    m.id, m.set_name, m.year, m.lang, m.country,
    m.card_number, m.rarity, m.variant, m.note,
    m.image_url, m.back_image_url,
    m.is_owned, m.verification_status, m.pipeline_status,
    m.source, m.source_url,
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
-- 3. Facettes du catalogue
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
                  'max', (SELECT MAX(year) FROM cards)),
    'total',         (SELECT COUNT(*) FROM cards),
    'owned',         (SELECT COUNT(*) FROM cards WHERE is_owned),
    'missing_image', (SELECT COUNT(*) FROM cards WHERE image_url IS NULL)
  );
$$;

-- ============================================================
-- 4. Détection de doublons (avant soumission d'une contribution)
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
         similarity(c.search_text,
                    mdc_normalize(concat_ws(' ', p_set_name, p_card_number, p_lang))) AS similarity
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
-- 5. Traçabilité de la modération
-- ============================================================

ALTER TABLE contributions ADD COLUMN IF NOT EXISTS reviewed_by     UUID REFERENCES auth.users(id);
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS reviewed_at     TIMESTAMPTZ;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS review_note     TEXT;
ALTER TABLE contributions ADD COLUMN IF NOT EXISTS created_card_id TEXT REFERENCES cards(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS contributions_status_idx ON contributions (status, created_at DESC);

-- approve_contribution() existe déjà et vérifie role IN ('admin','mod') :
-- on la complète pour horodater la revue et lier la fiche créée.
CREATE OR REPLACE FUNCTION approve_contribution(contribution_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c           contributions%ROWTYPE;
  d           JSONB;
  new_card_id TEXT;
  v_year      INT;
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  SELECT * INTO c FROM contributions WHERE id = contribution_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'contribution_not_found'; END IF;
  IF c.status <> 'pending' THEN RAISE EXCEPTION 'contribution_already_processed'; END IF;

  d := c.data;

  IF c.type = 'card' AND d ? 'set_name' AND d ? 'year' AND d ? 'lang' AND d ? 'card_number' THEN
    -- Une année non numérique faisait planter la version précédente avec une
    -- erreur de cast illisible ; on refuse explicitement.
    BEGIN
      v_year := NULLIF(d->>'year', '')::INT;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'invalid_year: %', d->>'year';
    END;
    IF v_year IS NULL OR v_year < 1996 OR v_year > EXTRACT(YEAR FROM NOW())::INT + 1 THEN
      RAISE EXCEPTION 'invalid_year: %', COALESCE(d->>'year', '(vide)');
    END IF;

    new_card_id := concat_ws('-',
      UPPER(regexp_replace(COALESCE(d->>'set_name', 'CARD'), '[^A-Za-z0-9]', '', 'g')),
      regexp_replace(COALESCE(d->>'card_number', '0'), '[^0-9]', '', 'g'),
      UPPER(COALESCE(d->>'lang', 'XX')),
      v_year::TEXT,
      UPPER(substr(md5(random()::text || clock_timestamp()::text), 1, 4)));

    INSERT INTO cards (
      id, set_name, year, lang, country, card_number, rarity, variant, note,
      image_url, verification_status, pipeline_status, source, created_by
    ) VALUES (
      new_card_id,
      COALESCE(d->>'set_name', ''),
      v_year,
      UPPER(COALESCE(d->>'lang', '')),
      UPPER(COALESCE(d->>'country', '')),
      COALESCE(d->>'card_number', ''),
      COALESCE(d->>'rarity', ''),
      COALESCE(d->>'variant', ''),
      COALESCE(d->>'note', ''),
      NULLIF(d->>'scan_url', ''),
      'pending',
      CASE WHEN NULLIF(d->>'scan_url', '') IS NULL THEN 'draft' ELSE 'sourced' END,
      'community',
      c.submitted_by
    );
  END IF;

  UPDATE contributions
     SET status = 'approved', reviewed_by = auth.uid(),
         reviewed_at = NOW(), created_card_id = new_card_id
   WHERE id = contribution_id;

  RETURN jsonb_build_object('ok', true,
    'contribution_id', contribution_id, 'created_card_id', new_card_id);
END;
$$;

CREATE OR REPLACE FUNCTION reject_contribution(contribution_id UUID, reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  UPDATE contributions
     SET status = 'rejected', reviewed_by = auth.uid(),
         reviewed_at = NOW(), review_note = reason
   WHERE id = contribution_id AND status = 'pending';

  IF NOT FOUND THEN RAISE EXCEPTION 'contribution_not_found_or_processed'; END IF;
  RETURN jsonb_build_object('ok', true, 'contribution_id', contribution_id);
END;
$$;

-- ============================================================
-- 6. CORRECTIFS RLS
-- ============================================================

-- 6a. MODÉRATION CONTOURNABLE : "cards_insert" acceptait tout compte
--     authentifié, donc n'importe quel inscrit pouvait écrire directement
--     dans le catalogue sans passer par la file de contributions.
DROP POLICY IF EXISTS "cards_insert" ON cards;
CREATE POLICY "cards_insert_curator" ON cards
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- 6b. FUITE DE DONNÉES : "contributions_select" laissait tout compte
--     authentifié lire contributor_email de tous les contributeurs.
DROP POLICY IF EXISTS "contributions_select" ON contributions;
CREATE POLICY "contributions_select_own" ON contributions
  FOR SELECT USING (submitted_by IS NOT NULL AND auth.uid() = submitted_by);
CREATE POLICY "contributions_select_curator" ON contributions
  FOR SELECT USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "contributions_update_curator" ON contributions;
CREATE POLICY "contributions_update_curator" ON contributions
  FOR UPDATE USING (is_admin(auth.uid()));

-- 6c. ESCALADE DE PRIVILÈGES : "profiles_update" autorise chacun à modifier
--     SA ligne — colonne `role` comprise. Tout inscrit pouvait donc se
--     passer role='admin' et obtenir les droits de conservation.
--     Deux verrous indépendants.

--     (1) Privilège de colonne : le rôle applicatif n'écrit que handle/country.
REVOKE UPDATE ON profiles FROM anon, authenticated;
GRANT  UPDATE (handle, country) ON profiles TO authenticated;

--     (2) Garde-fou si un GRANT ultérieur écrasait (1).
CREATE OR REPLACE FUNCTION protect_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL          -- NULL = SQL Editor / service_role
     AND NOT is_admin(auth.uid())
  THEN
    RAISE EXCEPTION 'role_change_forbidden';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_role ON profiles;
CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_role_change();

-- ============================================================
-- 7. Statistiques du site
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
-- 8. Bucket des scans communautaires
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
  FOR DELETE USING (bucket_id = 'scans' AND is_admin(auth.uid()));

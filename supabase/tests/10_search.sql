\set ON_ERROR_STOP on
\pset pager off

-- Les droits sont posés par 05_grants.sql (cf. run.sh) : ne rien re-grant ici,
-- cela annulerait les restrictions de colonne posées par 002.

\echo '=== 1. RECHERCHE SANS ACCENT ==='
\echo '-- "evolutions" doit trouver "Évolutions" :'
SELECT count(*) AS hits FROM search_cards('evolutions');
\echo '-- "edition 1" (sans accent) doit trouver "Édition 1" :'
SELECT count(*) AS hits FROM search_cards('edition 1');
\echo '-- casse indifferente :'
SELECT count(*) AS hits FROM search_cards('BASE SET');

\echo ''
\echo '=== 2. MULTI-MOTS = ET (pas OU) ==='
\echo '-- "base" seul :'
SELECT count(*) FROM search_cards('base');
\echo '-- "base fr" doit etre un sous-ensemble strict :'
SELECT count(*) FROM search_cards('base fr');
\echo '-- mot absurde ajoute => 0 :'
SELECT count(*) FROM search_cards('base zzzznotexist');

\echo ''
\echo '=== 3. RECHERCHE SUR CHAMPS AUTREFOIS IGNORES ==='
\echo '-- illustrateur (impossible avant) :'
SELECT count(*) FROM search_cards('arita');
\echo '-- numero de carte :'
SELECT count(*) FROM search_cards('63/102');
\echo '-- rarete :'
SELECT count(*) FROM search_cards('commune');

\echo ''
\echo '=== 4. FILTRES ==='
SELECT 'langs=FR' AS f, count(*) FROM search_cards('', ARRAY['FR'])
UNION ALL SELECT 'langs=FR,EN', count(*) FROM search_cards('', ARRAY['FR','EN'])
UNION ALL SELECT 'variant=Reverse', count(*) FROM search_cards('', NULL, ARRAY['Reverse'])
UNION ALL SELECT 'owned=true', count(*) FROM search_cards('', NULL, NULL, TRUE)
UNION ALL SELECT 'annees 1996-2000', count(*) FROM search_cards('', NULL, NULL, NULL, 1996, 2000);

\echo ''
\echo '=== 4 bis. FILTRE "SANS VISUEL" (appel a contribution) ==='
-- On lit total_count (total reel) et non count(*), plafonne a 200 lignes/page.
SELECT
  (SELECT DISTINCT total_count FROM search_cards('',NULL,NULL,NULL,NULL,NULL,'year_asc',1,0)) AS toutes,
  (SELECT DISTINCT total_count FROM search_cards('',NULL,NULL,NULL,NULL,NULL,'year_asc',1,0,TRUE))  AS sans_visuel,
  (SELECT DISTINCT total_count FROM search_cards('',NULL,NULL,NULL,NULL,NULL,'year_asc',1,0,FALSE)) AS avec_visuel;
\echo '    ^ sans_visuel + avec_visuel doit egaler toutes'
\echo '-- coherence avec la facette :'
SELECT get_catalogue_facets()->'missing_image' AS facette_sans_visuel;

\echo ''
\echo '=== 5. TOTAL_COUNT ET PAGINATION ==='
\echo '-- total_count doit valoir le total global, pas la taille de page :'
SELECT DISTINCT total_count AS total_reel, count(*) OVER () AS lignes_page
FROM search_cards('', NULL, NULL, NULL, NULL, NULL, 'year_asc', 10, 0);
\echo '-- page 2 renvoie des ids differents de la page 1 :'
SELECT count(*) AS chevauchement FROM (
  SELECT id FROM search_cards('', NULL,NULL,NULL,NULL,NULL,'year_asc',10,0)
  INTERSECT
  SELECT id FROM search_cards('', NULL,NULL,NULL,NULL,NULL,'year_asc',10,10)
) x;

\echo ''
\echo '=== 6. TRI ==='
SELECT 'year_asc'  AS tri, min(year) AS premiere FROM (SELECT year FROM search_cards('',NULL,NULL,NULL,NULL,NULL,'year_asc',1,0)) a
UNION ALL
SELECT 'year_desc', min(year) FROM (SELECT year FROM search_cards('',NULL,NULL,NULL,NULL,NULL,'year_desc',1,0)) b;

\echo ''
\echo '=== 7. DOUBLONS ==='
SELECT id, set_name, lang, round(similarity::numeric,2) AS score
FROM find_similar_cards('Set de Base', '63/102', 'FR');

\echo ''
\echo '=== 8. FACETTES ==='
SELECT jsonb_pretty(jsonb_build_object(
  'total', get_catalogue_facets()->'total',
  'owned', get_catalogue_facets()->'owned',
  'annees', get_catalogue_facets()->'years',
  'nb_langues', jsonb_array_length(get_catalogue_facets()->'langs'),
  'variantes', get_catalogue_facets()->'variants'
));

\echo ''
\echo '=== 9. STATS SITE ==='
SELECT jsonb_pretty(get_site_stats());

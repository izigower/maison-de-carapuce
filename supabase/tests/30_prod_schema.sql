\pset pager off

\echo '=== RECHERCHE ==='
\echo '-- "evolutions" sans accent doit trouver "Évolutions" :'
SELECT count(*) FROM search_cards('evolutions');
\echo '-- multi-mots = ET : "base" puis "base set" (sous-ensemble) puis mot absurde :'
SELECT (SELECT count(*) FROM search_cards('base'))      AS base,
       (SELECT count(*) FROM search_cards('base set'))  AS base_set,
       (SELECT count(*) FROM search_cards('base zzzz')) AS absurde;
\echo '-- champs autrefois non cherchables (numero, rarete) :'
SELECT (SELECT count(*) FROM search_cards('63/102')) AS par_numero,
       (SELECT count(*) FROM search_cards('promo'))  AS par_rarete;
\echo '-- filtres :'
SELECT (SELECT count(*) FROM search_cards('', ARRAY['JP']))               AS jp,
       (SELECT count(*) FROM search_cards('', NULL, ARRAY['1st Edition'])) AS ed1,
       (SELECT count(*) FROM search_cards('', NULL, NULL, TRUE))           AS possedees,
       (SELECT DISTINCT total_count FROM search_cards('',NULL,NULL,NULL,NULL,NULL,'year_asc',1,0,TRUE)) AS sans_image;
\echo '-- facettes coherentes :'
SELECT get_catalogue_facets()->'total' AS total,
       get_catalogue_facets()->'missing_image' AS sans_image;
\echo '-- doublons :'
SELECT id, similarity::numeric(4,2) FROM find_similar_cards('Base Set','63/102','EN');

\echo ''
\echo '################ SECURITE ################'
INSERT INTO auth.users (id,email) VALUES
 ('11111111-1111-1111-1111-111111111111','lambda@test.fr'),
 ('22222222-2222-2222-2222-222222222222','despi@carapuce.fr') ON CONFLICT DO NOTHING;
INSERT INTO profiles (id,handle,role) VALUES
 ('11111111-1111-1111-1111-111111111111','lambda','user'),
 ('22222222-2222-2222-2222-222222222222','despi','admin') ON CONFLICT (id) DO UPDATE SET role=EXCLUDED.role;
INSERT INTO contributions (id,type,submitted_by,contributor_name,contributor_email,data)
VALUES ('33333333-3333-3333-3333-333333333333','card',
        '11111111-1111-1111-1111-111111111111','Lambda','lambda@test.fr',
        '{"set_name":"Team Rocket","year":"2000","lang":"FR","card_number":"13/82","variant":"Holo"}'::jsonb)
ON CONFLICT DO NOTHING;

SET ROLE authenticated;
SET test.uid = '11111111-1111-1111-1111-111111111111';

\echo ''
\echo '--- A. lambda ecrit-il dans le catalogue ? (doit echouer) ---'
INSERT INTO cards (id,set_name,year,lang,country,card_number,rarity,variant)
VALUES ('PIRATE','Pirate',2020,'FR','FR','1/1','C','Normal');

\echo ''
\echo '--- B. lambda lit-il les emails des autres ? ---'
SELECT count(*) AS visibles FROM contributions;
\echo '    ^ doit valoir 1 (la sienne) et non le total'

\echo ''
\echo '--- C. lambda approuve-t-il sa contribution ? (doit echouer) ---'
SELECT approve_contribution('33333333-3333-3333-3333-333333333333');

\echo ''
\echo '--- D. lambda se donne-t-il role=admin ? (doit echouer) ---'
UPDATE profiles SET role='admin' WHERE id='11111111-1111-1111-1111-111111111111';
RESET ROLE; RESET test.uid;
SELECT role AS role_final FROM profiles WHERE id='11111111-1111-1111-1111-111111111111';
\echo '    ^ doit rester user'

\echo ''
\echo '--- E. verrou 2 : et si un GRANT rouvrait la colonne ? ---'
GRANT UPDATE ON profiles TO authenticated;
SET ROLE authenticated; SET test.uid='11111111-1111-1111-1111-111111111111';
UPDATE profiles SET role='admin' WHERE id='11111111-1111-1111-1111-111111111111';
RESET ROLE; RESET test.uid;
SELECT role AS role_final FROM profiles WHERE id='11111111-1111-1111-1111-111111111111';
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (handle,country) ON profiles TO authenticated;

\echo ''
\echo '--- F. lambda change-t-il son pseudo ? (doit reussir) ---'
SET ROLE authenticated; SET test.uid='11111111-1111-1111-1111-111111111111';
UPDATE profiles SET handle='lambda2' WHERE id='11111111-1111-1111-1111-111111111111';
RESET ROLE; RESET test.uid;
SELECT handle FROM profiles WHERE id='11111111-1111-1111-1111-111111111111';

\echo ''
\echo '--- G. despi (admin) approuve ---'
SET ROLE authenticated; SET test.uid='22222222-2222-2222-2222-222222222222';
SELECT approve_contribution('33333333-3333-3333-3333-333333333333');
RESET ROLE; RESET test.uid;
SELECT id, set_name, lang, source, pipeline_status FROM cards WHERE source='community';
SELECT status, created_card_id IS NOT NULL AS fiche_liee, reviewed_by IS NOT NULL AS relecteur
FROM contributions WHERE id='33333333-3333-3333-3333-333333333333';

\echo ''
\echo '--- H. double approbation refusee ---'
SET ROLE authenticated; SET test.uid='22222222-2222-2222-2222-222222222222';
SELECT approve_contribution('33333333-3333-3333-3333-333333333333');
RESET ROLE; RESET test.uid;

\echo ''
\echo '--- I. annee aberrante refusee ---'
INSERT INTO contributions (id,type,data) VALUES
 ('44444444-4444-4444-4444-444444444444','card',
  '{"set_name":"Faux","year":"1850","lang":"FR","card_number":"1/1"}'::jsonb) ON CONFLICT DO NOTHING;
SET ROLE authenticated; SET test.uid='22222222-2222-2222-2222-222222222222';
SELECT approve_contribution('44444444-4444-4444-4444-444444444444');
RESET ROLE; RESET test.uid;

\echo ''
\echo '--- J. la nouvelle fiche est indexee pour la recherche ---'
SELECT count(*) AS trouvee FROM search_cards('team rocket');

\set ON_ERROR_STOP off
\pset pager off

-- Deux comptes : un visiteur inscrit lambda, un conservateur.
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'lambda@test.fr'),
  ('22222222-2222-2222-2222-222222222222', 'curator@test.fr')
ON CONFLICT DO NOTHING;

UPDATE profiles SET is_admin = TRUE WHERE id = '22222222-2222-2222-2222-222222222222';

-- Contribution deposee par lambda, avec son email.
INSERT INTO contributions (id, type, submitted_by, contributor_name, contributor_email, data)
VALUES ('33333333-3333-3333-3333-333333333333', 'card',
        '11111111-1111-1111-1111-111111111111', 'Lambda', 'lambda@test.fr',
        '{"set_name":"Team Rocket","year":"2000","lang":"FR","card_number":"13/82","variant":"Holo"}'::jsonb)
ON CONFLICT DO NOTHING;

\echo '################ VISITEUR LAMBDA (authentifie, non admin) ################'
SET ROLE authenticated;
SET test.uid = '11111111-1111-1111-1111-111111111111';

\echo ''
\echo '--- A. Peut-il ecrire directement dans le catalogue ? (AVANT: OUI = modération contournable) ---'
INSERT INTO cards (id, set_name, year, lang, country, card_number, rarity, variant)
VALUES ('PIRATE-1', 'Set pirate', 2020, 'FR', 'FR', '1/1', 'C', 'Normale');
\echo '    ^ doit afficher une violation de policy'

\echo ''
\echo '--- B. Peut-il modifier une fiche existante ? ---'
UPDATE cards SET set_name = 'Detourne' WHERE id = 'BS-63-FR-1999';
\echo '    ^ doit afficher UPDATE 0'

\echo ''
\echo '--- C. Peut-il supprimer une fiche ? ---'
DELETE FROM cards WHERE id = 'BS-63-FR-1999';
\echo '    ^ doit afficher DELETE 0'

\echo ''
\echo '--- D. Peut-il lire les emails des autres contributeurs ? (AVANT: OUI = fuite RGPD) ---'
SELECT count(*) AS contributions_visibles, count(contributor_email) AS emails_lisibles
FROM contributions;
\echo '    ^ il ne doit voir que SES propres contributions'

\echo ''
\echo '--- E. Peut-il approuver sa propre contribution ? ---'
SELECT approve_contribution('33333333-3333-3333-3333-333333333333');
\echo '    ^ doit lever "Reserve aux conservateurs"'

\echo ''
\echo '--- F. Peut-il se promouvoir conservateur ? (verrou 1 : privilege colonne) ---'
UPDATE profiles SET is_admin = TRUE WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT is_admin AS toujours_admin FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111';
\echo '    ^ doit lever "permission denied" et rester false'

RESET ROLE;
RESET test.uid;

\echo ''
\echo '--- F bis. Et si un GRANT malencontreux rouvrait la colonne ? (verrou 2 : trigger) ---'
GRANT UPDATE ON profiles TO authenticated;   -- simule une regression de droits
SET ROLE authenticated;
SET test.uid = '11111111-1111-1111-1111-111111111111';
UPDATE profiles SET is_admin = TRUE WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT is_admin AS toujours_admin FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111';
\echo '    ^ le trigger doit lever "Seul un conservateur..." et is_admin rester false'
RESET ROLE;
RESET test.uid;
-- On restaure la restriction pour la suite des tests.
REVOKE UPDATE ON profiles FROM authenticated;
GRANT  UPDATE (handle, country) ON profiles TO authenticated;

\echo ''
\echo '--- F ter. Un contributeur peut-il toujours changer son pseudo ? ---'
SET ROLE authenticated;
SET test.uid = '11111111-1111-1111-1111-111111111111';
UPDATE profiles SET handle = 'nouveau-pseudo' WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT handle FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111';
\echo '    ^ doit reussir : on ne bloque que is_admin'
RESET ROLE;
RESET test.uid;

\echo ''
\echo '################ CONSERVATEUR ################'
SET ROLE authenticated;
SET test.uid = '22222222-2222-2222-2222-222222222222';

\echo ''
\echo '--- G. Voit-il la file de moderation ? ---'
SELECT count(*) AS en_attente FROM contributions WHERE status = 'pending';

\echo ''
\echo '--- H. Approuve la contribution => la fiche doit etre creee ---'
SELECT approve_contribution('33333333-3333-3333-3333-333333333333') AS fiche_creee;

RESET ROLE;
RESET test.uid;

\echo ''
\echo '--- I. Verification de la fiche creee ---'
SELECT id, set_name, year, lang, variant, source, is_verified
FROM cards WHERE source = 'community';

\echo ''
\echo '--- J. La contribution est-elle bien tracee ? ---'
SELECT status, created_card_id, reviewed_by IS NOT NULL AS a_un_relecteur
FROM contributions WHERE id = '33333333-3333-3333-3333-333333333333';

\echo ''
\echo '--- K. Double approbation refusee ? ---'
SET ROLE authenticated;
SET test.uid = '22222222-2222-2222-2222-222222222222';
SELECT approve_contribution('33333333-3333-3333-3333-333333333333');
\echo '    ^ doit lever "deja traitee"'
RESET ROLE;
RESET test.uid;

\echo ''
\echo '--- L. Annee invalide refusee ? (anti-pollution du catalogue) ---'
INSERT INTO contributions (id, type, data) VALUES
  ('44444444-4444-4444-4444-444444444444', 'card',
   '{"set_name":"Faux","year":"1850","lang":"FR","card_number":"1/1"}'::jsonb)
ON CONFLICT DO NOTHING;
SET ROLE authenticated;
SET test.uid = '22222222-2222-2222-2222-222222222222';
SELECT approve_contribution('44444444-4444-4444-4444-444444444444');
\echo '    ^ doit lever "Annee invalide"'
RESET ROLE;
RESET test.uid;

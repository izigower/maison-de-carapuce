# Mission Claude Code — catalogue mondial Carapuce

Tu travailles dans le dépôt `maison-de-carapuce`. Ta mission est de transformer les recherches déjà produites par plusieurs agents en une base canonique, vérifiable et importable sans doublons dans Supabase, puis de récupérer ou signaler les images manquantes.

Ne pars pas du principe que les chiffres annoncés (`310 cartes`, `150 nouvelles`) sont vrais. Recalcule tout à partir des données, de la base réellement connectée et des preuves disponibles. Une ligne n'est acceptée que si son identité, sa catégorie et sa provenance sont défendables.

## Résultat attendu

À la fin, nous devons disposer de quatre inventaires explicitement séparés :

1. cartes Pokémon TCG physiques dont Carapuce/Squirtle est le sujet principal ;
2. cartes Pokémon TCG physiques où Carapuce apparaît seulement dans l'illustration (`cameo`) ;
3. cartes et stickers officiels hors Pokémon TCG : Topps, Carddass, Panini, Merlin, etc. ;
4. cartes Pokémon TCG Pocket numériques, conservées dans un inventaire séparé et jamais comptées dans le total physique.

Les nombres finaux doivent être calculés, pas forcés à atteindre 310 ou 150.

## Fichiers à examiner

### Sortie Antigravity

- `recherche_cartes/base_mondiale_carapuce_complete.json` — 310 lignes annoncées.
- `recherche_cartes/TOUTES_LES_CARTES_CARAPUCE_DU_MONDE.md` — masterlist humaine.
- `recherche_cartes/nouvelles_cartes_a_ajouter.json` — ancienne petite liste manuelle de 16 pistes.
- `recherche_cartes/RECHERCHE_CARAPUCE_MASTERLIST.md` — version antérieure de la recherche.
- `scripts/build-complete-squirtle-world-database.js`
- `scripts/build-complete-squirtle-world-database-v2.js`
- `scripts/generate-cards-research.js`

### Sortie Codex à réconcilier avec Antigravity

- `outputs/019fdbac-bcf2-77a2-b3c8-0e870f4e19fc/recherche-carapuce.json`
- `outputs/019fdbac-bcf2-77a2-b3c8-0e870f4e19fc/recherche-cartes-carapuce-2026-08-07.xlsx`
- `outputs/019fdbac-bcf2-77a2-b3c8-0e870f4e19fc/images-manquantes-finales/` — 73 fichiers déjà récupérés.
- `outputs/019fdbac-bcf2-77a2-b3c8-0e870f4e19fc/73-images-cartes-carapuce.zip` — archive équivalente ; préfère le dossier non compressé.

### Catalogue, application et Supabase

- `chats/catalogue-current.json` — capture de 160 lignes du catalogue réel au moment de l'audit.
- `supabase/migrations/001_initial.sql`
- `supabase/seed.sql`
- `src/types/index.ts`
- `src/app/catalogue/page.tsx`
- `src/app/catalogue/CatalogueClient.tsx`
- `src/components/CardPlaceholder.tsx`
- `src/app/carte/[id]/page.tsx`
- catalogue public : <https://maison-de-carapuce.vercel.app/catalogue>

Inspecte également le schéma Supabase réellement connecté, car le snapshot contient déjà des colonnes absentes de `001_initial.sql`. Ne montre jamais les secrets contenus dans les fichiers d'environnement.

## Constats préliminaires déjà mesurés

Ces chiffres servent de tests de départ. Reproduis-les avant de modifier les données et explique tout écart.

- `base_mondiale_carapuce_complete.json` contient 310 lignes, mais 146 ont `is_in_bdd: true` et 164 ont `is_in_bdd: false`. Il ne contient donc pas `160 existantes + 150 nouvelles`.
- La clé Antigravity `set_name|card_number|lang|variant` a écrasé 14 lignes existantes légitimes : 7 sous-variantes de `XY176` et 7 sous-variantes de `SM231` ont disparu, une seule ligne de chaque groupe de huit ayant été conservée.
- Quatre identifiants sont utilisés deux fois dans le JSON Antigravity :
  - `lang-KR-ScarletViolet151KR151-007/165` ;
  - `lang-RU-XYEvolutions-22/108` ;
  - `lang-NL-BasissetBaseSetNL-63/102` ;
  - `manual-JP-BandaiCarddassPocketMonstersPart1-#007`.
- Le fichier Antigravity possède 228 `image_url` et 82 images manquantes. Parmi les 164 lignes marquées nouvelles, 102 ont une URL d'image et 62 n'en ont pas.
- Les 164 lignes nouvelles ont toutes une `source_url`, mais 46 renvoient seulement vers la page d'accueil d'un domaine. Une homepage, une recherche générique ou la page du propre catalogue ne constitue pas une preuve de carte.
- Les catégories Antigravity se réduisent à 303 lignes `Carte TCG Officielle` et 7 lignes `Non-TCG / Topps / Carddass`. Les cameos et Pocket n'y sont pas modélisés proprement.
- La sortie Codex contient 84 candidats physiques absents selon son rapprochement : 73 cartes nommées Carapuce et 11 cameos. Elle contient aussi 22 lignes Pocket séparées.
- Le dossier `images-manquantes-finales` contient exactement 73 fichiers, 5 289 951 octets et aucun groupe de doublons SHA-256 exact. Cela ne dispense pas du contrôle visuel et perceptuel.
- La capture actuelle a 20 `image_url` nulles, 60 lignes avec `image_needs_verification: true`, et l'audit Codex recense 34 URL d'image non nulles en échec de pipeline.
- Deux cartes Pocket sont actuellement mélangées au catalogue physique : `P-A-DE-2024-033` et `A1-DE-2024-053`.
- Les groupes `XY176` et `SM231` ont chacun huit impressions/sous-variantes. La vraie distinction (`Staff`, `Champion`, `Finalist`, `Semi-Finalist`, `Quarter Finalist`, `Top Sixteen`, `Top Thirty-Two`, version standard) est stockée dans `note`, tandis que `variant` vaut partout `Normal`. Ne les supprime pas comme doublons.
- Le snapshot expose 11 champs qui ne figurent pas dans la migration initiale : `verification_status`, `source`, `source_url`, `ai_confidence`, `ai_verdict`, `back_image_url`, `image_needs_verification`, `image_verified_by`, `image_verified_at`, `pipeline_status`, `pipeline_checks`. Il y a donc une dérive de schéma à capturer proprement.
- Il n'existe actuellement pas de `supabase/config.toml`. Ne suppose pas que la pile Supabase locale est initialisée.

### Écart entre les deux recherches

Le rapprochement automatique a associé 70 des 84 candidats physiques Codex à une ligne Antigravity. Quatorze n'ont pas été rapprochés ; l'un d'eux est en réalité la même carte chinoise `Leaf's/Green's Exploration 033/024`, mais avec une langue et un numéro mal normalisés dans Antigravity. Les treize pistes suivantes semblent donc réellement absentes de sa masterlist et doivent être vérifiées :

- chinois traditionnel : Pokémon 151 `007`, Pokémon GO `015`, Pokémon 151 AR `170` ;
- `Team Rocket's Meowth` 18, Wizards Black Star Promos ;
- `Flower Shop Lady` 74/90, Undaunted ;
- `Chansey` 46/68, Hidden Fates ;
- `Misty's Cerulean City Gym` 61/68, Hidden Fates ;
- `Pikachu` 279/XY-P ;
- `M Sachiko-EX` 298/XY-P ;
- `Green's Exploration` 196/173, Tag All Stars ;
- jumbo `Pikachu's Summer Vacation`, sans numéro ;
- jumbo `Pokémon Valley`, sans numéro ;
- jumbo `Tropical Present`, sans numéro, ©2001.

Ne les ajoute pas automatiquement : vérifie l'apparition visuelle de Carapuce et l'identité de chaque impression.

## Défauts connus des scripts existants

Ne réutilise pas leurs résultats sans corriger ces défauts :

- `build-complete-squirtle-world-database-v2.js` charge le JSON final existant puis lui ajoute quelques lignes. Il ne sait donc pas régénérer les 310 lignes à partir de sources brutes.
- La signature de déduplication emploie le nom localisé du set et ignore le marché, le code canonique du set, le support, la finition, le tampon, la distribution, le dos et la taille.
- Lorsqu'une réponse TCGdex indique `variants.reverse: true`, le premier script fabrique une seule ligne `Reverse Holo`. Ce booléen indique potentiellement l'existence d'une variante supplémentaire ; il ne faut pas remplacer l'impression normale par la reverse.
- Plusieurs identifiants manuels sont construits sans la variante, ce qui explique les collisions de clés.
- Certaines lignes mélangent la rareté dans `card_number`, par exemple `033/024 SR`.
- Les codes de langue chinoise sont incohérents : `CN`, `ZH`, `ZHT`, `ZH-CN`, `ZH-TW`.
- Des variantes réellement distinctes sont agrégées dans un seul texte, par exemple `Blue Logo / Red Logo / Black Logo` ou `Tekno / Sparkle / Spectra`. Elles doivent devenir des lignes variantes séparées si les preuves confirment qu'il s'agit d'objets distincts.
- Les champs multilingues tels que `EN / JP / FR` ne sont pas des langues valides pour une impression. Une impression physique n'a qu'une langue et un marché.
- Les scripts traitent parfois une carte où Carapuce est un cameo comme si son nom était Carapuce. Le nom canonique doit rester celui de la carte imprimée ; l'apparition de Carapuce est une relation séparée.

## Modèle d'identité à appliquer

Ne déduplique jamais sur le nom seul et ne déduplique jamais uniquement sur le hash de l'image.

Le modèle final doit représenter au minimum ces trois niveaux, dans des tables séparées ou dans une structure additive équivalente compatible avec l'application actuelle :

1. **Œuvre / design** : identité de l'illustration et de la carte de base.
2. **Impression** : système, marché, langue, set canonique, numéro de collection et date.
3. **Variante physique** : finition, édition, tampon, récompense, canal de distribution, format/taille, différence de dos.

Une clé canonique de variante doit être dérivée de champs normalisés équivalents à :

```text
card_system
| market
| language
| canonical_set_code
| normalized_collector_number
| finish
| edition
| stamp_or_award
| distribution
| size
| back_variant
```

Le `set_name` localisé est un libellé, pas une clé. Le numéro de collection ne doit contenir ni la rareté ni la finition. Les valeurs absentes doivent être explicites et normalisées ; n'utilise pas des variantes libres comme `—`, chaîne vide et `Normal` indifféremment.

Ajoute une représentation explicite de l'apparition :

- `primary_subject` pour une carte Carapuce ;
- `cameo` lorsque Carapuce est visible sur une autre carte ;
- nom réel de la carte dans `printed_name` ;
- `pokemon_dex_id = 7` pour l'apparition de Carapuce ;
- une note factuelle sur la position ou la forme de l'apparition, appuyée par une image.

Préserve les identifiants historiques nécessaires aux wishlists et aux routes. Si tu introduis de nouvelles tables ou clés, crée un mapping `legacy_id -> canonical_variant_id` et migre de manière additive. Aucun `DELETE`, aucun changement destructif de clé primaire et aucune perte de wishlist.

## Règles de normalisation et de rapprochement

1. Normalise Unicode en NFC, les espaces, tirets, apostrophes et la casse.
2. Utilise des codes de langue contrôlés (`fr`, `en`, `de`, `es`, `it`, `pt-BR`, `ja`, `ko`, `ru`, `nl`, `zh-Hans`, `zh-Hant`, `th`, `id`) tout en conservant la valeur historique dans un champ source si nécessaire.
3. Crée une table d'alias des sets localisés vers un code canonique. Ne rapproche pas deux sets seulement parce que leurs noms se ressemblent.
4. Sépare numéro local, total imprimé et préfixe promo. Conserve l'affichage original.
5. Classe chaque comparaison dans une valeur contrôlée :
   - `EXACT_MATCH` ;
   - `SAME_WORK_DIFFERENT_PRINTING` ;
   - `SAME_PRINTING_DIFFERENT_VARIANT` ;
   - `POSSIBLE_DUPLICATE` ;
   - `NEW_CONFIRMED` ;
   - `REJECTED_OR_MISIDENTIFIED` ;
   - `OUT_OF_SCOPE_DIGITAL` ;
   - `NEEDS_MANUAL_REVIEW`.
6. Ne fusionne ou ne supprime automatiquement aucune ligne ambiguë.
7. Compare d'abord les 160 identifiants du snapshot avec la base réelle. Chaque ligne existante doit avoir un mapping ou une exception documentée.

## Niveau de preuve requis

Ordre de préférence :

1. base officielle Pokémon propre à la langue ou liste officielle du set ;
2. API TCGdex avec endpoint précis de carte, PokéCardex ou archive spécialisée reconnue ;
3. Pokumon, Bulbapedia et ressources historiques détaillées ;
4. site marchand ou marketplace uniquement comme preuve secondaire et comme source de scan.

Une seule source officielle précise peut suffire. Pour une promo rare, un cameo, une variante non-TCG ou une information provenant seulement d'un marchand, exige deux preuves indépendantes, ou une archive spécialisée avec un scan lisible recto/verso. Remplace les liens de homepage et les recherches génériques par des URL profondes et exactes.

Marque honnêtement `unverified` si la preuve manque. N'invente jamais une langue, un numéro, une année, un tampon ou une image par analogie avec une impression anglaise ou japonaise.

### Pistes à très haut risque à contrôler

- Toutes les lignes russes, notamment les prétendues éditions `Team Up`, `Unbroken Bonds` et `Vivid Voltage`.
- Base Set japonais : déterminer si `007` est seulement le numéro Pokédex visible sur la carte, et non un numéro de collection.
- `290/S-P`, dont le nom Antigravity mentionne à tort `024/S-P`.
- `050/XY-P` et la description « World Cup 2014 Pikachu & Squirtle ».
- Korean Base Set 1999, Dutch Base Set, promos chinoises et taïwanaises.
- Les quatre numéros de l'Intro Pack japonais et leurs vraies identités.
- Les affirmations de cameo concernant Bulbasaur 151, Charmander 151, Southern Islands Slowking, Kanazawa Pikachu et toute silhouette supposée. La présence de Carapuce doit être visible, pas seulement déduite d'une scène reliée.
- Les cartes hors-TCG actuellement regroupées : chaque finition, couleur de logo, dos ou réfracteur distinct doit être prouvé et individualisé.

## Audit et récupération des images

Pour chaque variante acceptée, crée un enregistrement d'asset séparé avec au minimum : recto/verso, URL source originale, URL de téléchargement, chemin local ou Storage, statut, date du contrôle, type MIME, octets, largeur, hauteur, SHA-256 et hash perceptuel.

Contrôles obligatoires :

- suivre les redirections et exiger un statut HTTP exploitable ;
- refuser HTML, placeholder, miniature cassée et fichier vide déguisé en image ;
- vérifier type MIME, taille, dimensions et décodage réel ;
- vérifier visuellement la langue, le set, le numéro, la finition et, pour un cameo, la présence de Carapuce ;
- calculer SHA-256 et pHash ;
- signaler les images identiques ou quasi identiques, mais ne pas conclure qu'une carte est un doublon sur cette seule base ;
- ne jamais utiliser le scan d'une autre langue comme image finale ; à défaut, marquer `missing` ou `placeholder_wrong_language` ;
- conserver l'URL de provenance même si l'image est rapatriée dans Supabase Storage ou `public/` ;
- ne pas dépendre durablement d'un hotlink marchand susceptible de disparaître.

Commence par réutiliser et valider les 73 fichiers de `images-manquantes-finales`. Ne les renomme ou ne les déplace qu'après avoir produit un manifeste ancien chemin -> clé canonique -> nouveau chemin.

Les onze candidats Codex encore sans `imageUrl` sont :

| Langue | Set | Numéro | Carte |
|---|---|---:|---|
| EN | My First Battle | 25 | Squirtle |
| FR | Collection McDonald's 2021 | 17 | Carapuce |
| ES | MEP Black Star Promos | 039 | Squirtle |
| ES | Cartas de promoción ESES | SWSH233 | Squirtle |
| IT | MEP Black Star Promos | 039 | Squirtle |
| IT | Set Base | 63 | Squirtle |
| PT | MEP Black Star Promos | 039 | Squirtle |
| PT | ESES Promos | SWSH233 | Squirtle |
| zh-Hant | Pokémon 151 | 170 | 傑尼龜 |
| ID | Kartu Pokémon 151 | 170 | Squirtle |
| TH | Pokémon Card 151 | 170 | เซนิกาเมะ |

Cherche ces images, mais n'accepte une image que si elle correspond exactement à la langue et à l'impression. Les 62 autres nouvelles cartes nommées et les 11 cameos disposent déjà d'un fichier local à vérifier.

## Déroulement demandé

### Phase 1 — inventaire reproductible, sans écriture distante

- Inspecte le dépôt, l'état Git et le schéma réel.
- Reproduis les constats chiffrés ci-dessus avec un script déterministe.
- Sauvegarde les données brutes de chaque source dans un cache horodaté ou versionné afin que la génération ne dépende pas du JSON final précédent.
- Ne modifie pas encore la base distante.

### Phase 2 — recherches parallèles si des sous-agents sont disponibles

Distribue des lots non chevauchants et impose à chaque agent de rendre des lignes structurées avec preuves :

1. TCG occidental par langue et variantes ;
2. Japon vintage, promos, decks et jumbo ;
3. Chine simplifiée, chinois traditionnel, Corée, Thaïlande et Indonésie ;
4. Russie et néerlandais, avec priorité à la validation d'existence ;
5. cameos avec contrôle visuel ;
6. Topps, Carddass, Panini, Merlin et autres hors-TCG ;
7. images, hashes et détection de doublons.

Un agent de synthèse doit ensuite rejouer les règles canoniques. N'accepte pas un résultat uniquement parce que deux agents ont recopié la même source secondaire.

### Phase 3 — réconciliation et revue

- Produis les clés canoniques et les clusters de rapprochement.
- Conserve une file de revue manuelle pour chaque ambiguïté.
- Corrige les données certaines, mais ne transforme pas une hypothèse en fait.
- Le statut `is_in_bdd` doit venir d'une comparaison avec la base réelle, pas du fichier d'entrée.
- Calcule les totaux par système, rôle d'apparition, langue, marché, set, finition et statut de validation.

### Phase 4 — préparation Supabase locale

- Utilise des migrations SQL versionnées et additives dans `supabase/migrations/`.
- Sépare migration de schéma et backfill/import de données.
- Capture la dérive du schéma réel au lieu de la masquer.
- Active et vérifie RLS sur toute nouvelle table exposée. Lecture publique et écriture administrative doivent rester séparées ; n'élargis pas les droits existants.
- Préserve `wishlists.card_id` et tous les identifiants utilisés dans les URLs.
- Ajoute de vraies contraintes uniques sur les clés canoniques une fois les ambiguïtés résolues.
- Prépare un import idempotent : un deuxième dry-run ne doit insérer aucune ligne supplémentaire.
- Régénère ou adapte les types TypeScript dans l'emplacement existant.
- Adapte les requêtes et l'interface seulement après stabilisation du contrat de données. Les filtres doivent distinguer physique, Pocket, cameo et hors-TCG.
- Si la pile locale est configurée sans danger, teste avec migrations locales, reset, lint et build. Sinon, valide le SQL statiquement et documente ce qui n'a pas pu être exécuté.

### Phase 5 — point d'arrêt obligatoire

Présente le rapport, les migrations, le payload d'import, le résultat du dry-run et le diff applicatif. Demande une confirmation explicite avant toute action distante.

Tu ne dois pas exécuter sans cette confirmation :

- `supabase db push` ou toute écriture sur la base hébergée ;
- upload/remplacement/suppression dans un bucket Storage distant ;
- déploiement Vercel ;
- commit, push Git ou pull request ;
- suppression ou fusion destructive de cartes existantes.

## Livrables obligatoires

Crée un dossier `recherche_cartes/claude/` contenant :

- `reconciliation_report.md` — méthode, écarts, nombres recalculés, décisions et limites ;
- `canonical_cards.json` — toutes les entités acceptées dans le schéma canonique documenté ;
- `source_evidence.csv` — une ligne par preuve avec URL profonde et verdict ;
- `image_audit.csv` — contrôle de chaque asset, hash, dimensions et statut ;
- `manual_review_queue.csv` — ambiguïtés et action humaine demandée avec case `approved` ;
- `legacy_id_mapping.csv` — mapping des 160 identifiants actuels vers les variantes canoniques ;
- `import_payload.json` — uniquement les lignes validées et importables ;
- `import_plan.md` — ordre des migrations, backfill, rollback logique et commandes de test ;
- `final_summary.md` — synthèse lisible pour le propriétaire du site.

Ajoute également :

- un script reproductible de réconciliation dans `scripts/` ;
- un script reproductible d'audit/téléchargement des images dans `scripts/` ;
- les migrations additives nécessaires dans `supabase/migrations/` ;
- les tests automatisés correspondants.

N'écrase pas les fichiers de recherche bruts. Tes scripts doivent produire les fichiers de `recherche_cartes/claude/` à partir des entrées, pas relire leurs propres sorties comme source de vérité.

## Critères d'acceptation

Le travail est prêt à être proposé pour intégration seulement si :

- 100 % des 160 lignes historiques ont un mapping ou une exception expliquée ;
- il n'existe aucun doublon exact de clé canonique de variante ;
- aucun identifiant primaire proposé n'est dupliqué ;
- `XY176` et `SM231` conservent chacun leurs huit sous-variantes tant qu'une preuve contraire n'existe pas ;
- Pocket ne figure pas dans le total physique ;
- chaque cameo accepté a été contrôlé visuellement ;
- chaque ligne rare, asiatique, russe, néerlandaise ou hors-TCG a une preuve suffisante ;
- chaque image acceptée est valide et correspond à la bonne impression, sinon elle apparaît clairement dans la file manuelle ;
- les URL de homepage ne sont plus considérées comme preuves suffisantes ;
- l'import est idempotent et ne casse ni wishlist ni route existante ;
- RLS et droits Storage sont explicitement testés ;
- `npm run build` réussit après les changements applicatifs ;
- le rapport final donne les vrais totaux calculés, y compris les rejets, sans chercher artificiellement à conserver `310` ou `150`.

Commence par la Phase 1 et rends d'abord le pré-audit reproductible. Ne commence aucune migration distante pendant l'audit.

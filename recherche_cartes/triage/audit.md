# Tri des recherches Antigravity + Codex

Chiffres recalculés depuis les fichiers, pas repris des annonces.
Catalogue de référence : 160 lignes (empreinte vérifiée identique à Supabase).

## Antigravity

- 310 lignes, dont 146 marquées déjà en base et 164 marquées nouvelles.
  Ce n'est donc pas « 160 existantes + 150 nouvelles ».
- 4 identifiants utilisés plusieurs fois : `lang-KR-ScarletViolet151KR151-007/165`, `lang-RU-XYEvolutions-22/108`, `lang-NL-BasissetBaseSetNL-63/102`, `manual-JP-BandaiCarddassPocketMonstersPart1-#007`
- Catégories : Carte TCG Officielle = 303 · Non-TCG / Topps / Carddass = 7
- 228 lignes avec image, 82 sans.
- Sous-variantes concours : catalogue XY176 = 8, SM231 = 8 ; Antigravity XY176 = 1, SM231 = 1.
  **Sa clé de déduplication écrase des lignes légitimes** (Staff, Champion, Finalist…),
  car la distinction est dans `note` alors que `variant` vaut partout `Normal`.
- Codes langue distincts : 16. Codes chinois utilisés : ZH, CN, ZHT.

## Codex

- 165 lignes dans `rows`, 160 lignes de catalogue capturées.
- Champs : type, format, language, languageLabel, country, name, set, setId, cardNumber, year, rarity, variant, note, source, sourceUrl, imageUrl, tcgdexId, currentIds, matchMethod, catalogueStatus, addApproved, imageApproved, uniqueKey, duplicateKeyCount

## Résultat du tri

| Sort | Lignes |
|---|---:|
| **À valider par toi** | 139 |
| Écarté — DEJA_AU_CATALOGUE | 98 |
| Écarté — POCKET_NUMERIQUE | 46 |
| Écarté — DOUBLON_ENTRE_SOURCES | 46 |

### Répartition des candidats retenus par niveau de preuve

- **forte** : 79
- **moyenne** : 28
- **faible** : 32

- 46 candidats retenus n'ont aucune image.
- 32 reposent sur une preuve faible : à ne pas importer sans contrôle.

## Images livrées par Codex

- 73 fichiers, 5.0 Mo.
- Types réels (signature, pas extension) : webp = 70 · jpeg = 3
- 0 fichier(s) suspects (HTML déguisé, format inconnu ou < 3 Ko).

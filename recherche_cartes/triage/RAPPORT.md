# Tri des recherches Antigravity + Codex

Ce que j'ai vérifié, ce que j'ai jeté, ce qu'il te reste à valider.
Aucune écriture en base : rien n'a été importé.

---

## Ce qu'il te reste à valider : 139 candidats

`recherche_cartes/triage/a_valider.json`

| Verdict | Lignes | Ce que ça veut dire |
|---|---:|---|
| `CONFIRME` | 96 | L'API TCGdex confirme que la carte existe et porte bien le nom de Carapuce dans cette langue. |
| `NON_VERIFIABLE` | 39 | Pas d'URL TCGdex — je n'ai pas pu confirmer automatiquement, contrôle humain requis. |
| `CAMEO_A_VERIFIER` | 4 | La carte existe mais porte un autre nom. Reste à confirmer à l'œil que Carapuce apparaît. |

Répartition par langue : FR 45 · IT 20 · ES 18 · PT 15 · EN 9 · JP 9 · KR 6 · RU 6
· ZH-Hant 4 · ID 4 · TH 4 · DE 2 · ZH-Hans 2 · NL 2 · INT 1.

**93 ont une image, 46 n'en ont aucune.**

Chaque ligne porte `preuve` (`forte` / `moyenne` / `faible`) et `priorite` (1 à 3).
Commence par `priorite: 1` + `verdict: CONFIRME` : c'est le lot le plus sûr.

Les **32 lignes en preuve `faible`** s'appuient sur une page d'accueil
(`https://pokecardex.com`, `https://pokemon-card.id`, `https://questcorner.fr`)
et non sur une fiche précise. Elles peuvent être vraies, mais rien ne le prouve
en l'état.

---

## Ce que j'ai écarté : 190 lignes

`recherche_cartes/triage/rejets.json` — chaque ligne a son motif.

| Motif | Lignes |
|---|---:|
| `DEJA_AU_CATALOGUE` | 98 |
| `POCKET_NUMERIQUE` | 46 |
| `DOUBLON_ENTRE_SOURCES` | 46 |

Pokémon Pocket est un jeu numérique : ces 46 lignes ne doivent jamais entrer
dans le total physique. Deux s'y trouvent déjà (`P-A-DE-2024-033`,
`A1-DE-2024-053`) — à sortir de ton catalogue.

---

## Défauts trouvés dans leur travail

### Antigravity

- **Sa clé de déduplication détruit des lignes légitimes.** Le catalogue a
  8 sous-variantes `XY176` et 8 `SM231` (Staff, Champion, Finalist,
  Quarter Finalist, Top Sixteen…). Antigravity n'en garde **qu'une de chaque**,
  parce que la distinction est stockée dans `note` alors que `variant` vaut
  partout `Normal`. Importer son fichier en remplacement effacerait 14 fiches.
- **4 identifiants sont utilisés deux fois** : `lang-KR-ScarletViolet151KR151-007/165`,
  `lang-RU-XYEvolutions-22/108`, `lang-NL-BasissetBaseSetNL-63/102`,
  `manual-JP-BandaiCarddassPocketMonstersPart1-#007`.
- **Des années sont fabriquées.** Les cartes Pocket `A1-053`, `A1-232` et
  `A3-215` sont datées **2000** alors que ces sets sont de 2024-2025.
- **Codes de langue incohérents** : `ZH`, `CN` et `ZHT` cohabitent pour le chinois.
- Le compte annoncé est faux : 310 lignes = 146 marquées en base + 164 nouvelles,
  pas « 160 existantes + 150 nouvelles ».

### Codex

Travail nettement plus propre : rapprochement explicite, statut par ligne,
Pocket déjà séparé, et **les 73 images livrées sont toutes valides** (70 WebP,
3 JPEG, aucun HTML déguisé, aucun fichier tronqué).

Reproche principal : les URL de preuve renvoient parfois vers une page d'accueil
plutôt que vers une fiche.

---

## Ce que j'ai supprimé

- `chats/spreadsheet-work/node_modules` — **326 Mo** de dépendances commitées par
  erreur, dont des binaires Windows (`.dll`, `skia.node`, pnpm). Aucun rapport
  avec le projet.
- `73-images-cartes-carapuce.zip` — doublon exact du dossier non compressé.
- `*.xlsx.inspect.ndjson` — artefact de debug de 1,6 Mo.

Résultat : `chats/` passe de 327 Mo à 868 Ko, et le nombre de fichiers suivis
par git de ~7 970 à 314.

J'ai gardé les deux dossiers d'images (`images-manquantes` 145 fichiers et
`images-manquantes-finales` 73) : le second est contenu dans le premier, mais
11 Mo ne justifient pas de prendre le risque d'en perdre.

> **Le dépôt `.git` pèse encore 94 Mo** : l'historique conserve les blobs
> supprimés. Les purger demande une réécriture d'historique
> (`git filter-repo`), qui casse les clones existants. À faire seulement si tu
> le décides — dis-le-moi.

---

## Reproduire

```bash
node scripts/triage-recherches.mjs   # tri hors-ligne, déterministe
node scripts/verifier-preuves.mjs    # vérifie les URLs TCGdex (réseau)
```

Le tri repart toujours des fichiers bruts d'Antigravity et Codex, jamais de ses
propres sorties. Le catalogue de référence est `chats/catalogue-current.json`,
dont j'ai vérifié que l'empreinte des 160 identifiants est identique à Supabase.

---

## Ce que je n'ai pas fait

Le handoff demandait un modèle canonique en trois niveaux
(œuvre / impression / variante), des migrations, un import idempotent et un
audit perceptuel des images. Je ne l'ai pas fait : tu m'as demandé un tri, et
ces chantiers-là méritent d'être décidés après que tu aies vu ce qui reste.

Je n'ai pas non plus contrôlé visuellement les images une par une — je n'ai
vérifié que leur validité technique (signature de fichier, taille, format).
Qu'un scan corresponde bien à la bonne langue et à la bonne impression reste à
faire, et c'est justement ce que ta page de validation permet.

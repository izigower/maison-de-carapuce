#!/usr/bin/env node
/**
 * Tri des recherches Antigravity + Codex.
 *
 *   node scripts/triage-recherches.mjs
 *
 * Ne modifie AUCUNE donnée distante. Produit dans recherche_cartes/triage/ :
 *   - audit.md           constats recalculés (les chiffres annoncés ne sont pas repris tels quels)
 *   - a_valider.json     candidats retenus, prêts pour la page de validation
 *   - rejets.json        lignes écartées, avec le motif
 *
 * Source de vérité du catalogue : chats/catalogue-current.json, dont
 * l'empreinte a été vérifiée identique à la base Supabase (160 lignes).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'recherche_cartes', 'triage');

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

// ---------------------------------------------------------------- normalisation

/** Codes langue contrôlés. Les variantes chinoises étaient incohérentes. */
const LANG = {
  FR: 'FR', EN: 'EN', DE: 'DE', ES: 'ES', IT: 'IT', JP: 'JP', JA: 'JP',
  KO: 'KR', KR: 'KR', RU: 'RU', NL: 'NL', PT: 'PT', 'PT-BR': 'PT',
  TH: 'TH', ID: 'ID',
  CN: 'ZH-HANS', 'ZH-CN': 'ZH-HANS', ZHS: 'ZH-HANS', 'ZH-HANS': 'ZH-HANS',
  ZHT: 'ZH-HANT', 'ZH-TW': 'ZH-HANT', TW: 'ZH-HANT', 'ZH-HANT': 'ZH-HANT',
  ZH: 'ZH-HANT', // le catalogue actuel utilise ZH pour du chinois traditionnel
};
const lang = (v) => LANG[String(v ?? '').trim().toUpperCase()] ?? String(v ?? '').trim().toUpperCase();

const norm = (v) => String(v ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Numéro de collection : on isole la partie locale et on retire la rareté
 * collée dedans (« 033/024 SR »), qui n'appartient pas au numéro.
 */
function localNumber(v) {
  let s = String(v ?? '').trim();
  if (!s) return '';
  s = s.replace(/\s+(SR|UR|RR|AR|SAR|CHR|CSR|HR|PROMO)$/i, '');
  const head = s.split('/')[0].trim();
  const digits = head.replace(/^0+/, '');
  return (digits || head).toLowerCase();
}

/** Jetons du nom de set, pour un rapprochement souple (les libellés sont localisés). */
const setTokens = (v) => new Set(norm(v).split(' ').filter(t => t.length > 2));

function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n / Math.min(a.size, b.size);
}

// ---------------------------------------------------------------- chargement

const current = read('chats/catalogue-current.json');
const anti = read('recherche_cartes/base_mondiale_carapuce_complete.json');
const codexFile = readdirSync(join(ROOT, 'outputs'))
  .map(d => join('outputs', d, 'recherche-carapuce.json'))
  .find(p => existsSync(join(ROOT, p)));
const codex = read(codexFile);

const currentIndex = current.map(c => ({
  id: c.id,
  lang: lang(c.lang),
  num: localNumber(c.card_number),
  set: setTokens(c.set_name),
  variant: norm(c.variant),
  note: norm(c.note),
  raw: c,
}));

/**
 * Un candidat est-il déjà au catalogue ?
 *
 * Le numéro seul ne suffit pas : « 1 » existe dans des dizaines de decks.
 * On exige le numéro ET une parenté de set, sinon on préfère renvoyer le
 * candidat en revue humaine plutôt que de l'écarter à tort.
 */
function matchCurrent(cand) {
  const L = lang(cand.lang), N = localNumber(cand.card_number), S = setTokens(cand.set_name);
  const Y = Number(cand.year) || null;
  let best = null;

  for (const c of currentIndex) {
    if (c.lang !== L) continue;
    if (!N || !c.num || c.num !== N) continue;      // numéro obligatoire
    const ov = overlap(S, c.set);
    const sameYear = Y && c.raw.year && Math.abs(Y - c.raw.year) <= 1;
    // Numéro + set proche, ou numéro + set faiblement proche mais même année.
    const ok = ov >= 0.4 || (ov >= 0.2 && sameYear);
    if (!ok) continue;
    const score = 0.5 + ov * 0.5;
    if (!best || score > best.score) best = { score, row: c };
  }
  return best;
}

// ---------------------------------------------------------------- preuves

const WEAK_HOST_ONLY = /^https?:\/\/[^/]+\/?$/i;
const SEARCH_LIKE = /[?&](q|s|query|search|keyword)=|\/search|\/recherche|\/s\?/i;
const SELF = /maison-de-carapuce\.vercel\.app/i;

/** Une homepage, une recherche générique ou notre propre site ne prouvent rien. */
function evidence(url) {
  if (!url) return { level: 'aucune', why: 'pas de source_url' };
  if (SELF.test(url)) return { level: 'nulle', why: 'renvoie vers notre propre catalogue' };
  if (WEAK_HOST_ONLY.test(url)) return { level: 'faible', why: 'page d\'accueil, pas une fiche' };
  if (SEARCH_LIKE.test(url)) return { level: 'faible', why: 'recherche générique, pas une fiche' };
  if (/api\.tcgdex\.net\/v2\/[a-z-]+\/cards\/.+/i.test(url)) return { level: 'forte', why: 'endpoint TCGdex précis' };
  if (/pokecardex|bulbapedia|pokumon|pokellector|serebii/i.test(url)) return { level: 'moyenne', why: 'archive spécialisée' };
  if (/ebay|mercari|yahoo|cardmarket|tcgplayer|pricecharting/i.test(url)) return { level: 'marchand', why: 'marchand — preuve secondaire seulement' };
  return { level: 'moyenne', why: 'URL profonde, source à confirmer' };
}

// ---------------------------------------------------------------- audit chiffré

const lines = [];
const say = (s = '') => lines.push(s);

say('# Tri des recherches Antigravity + Codex');
say();
say('Chiffres recalculés depuis les fichiers, pas repris des annonces.');
say(`Catalogue de référence : ${current.length} lignes (empreinte vérifiée identique à Supabase).`);
say();

// --- Antigravity
const antiIds = anti.map(r => r.id);
const dupIds = [...new Set(antiIds.filter((v, i) => antiIds.indexOf(v) !== i))];
const inBdd = anti.filter(r => r.is_in_bdd === true).length;
const notInBdd = anti.filter(r => r.is_in_bdd === false).length;
const cats = {};
for (const r of anti) cats[r.category ?? '(vide)'] = (cats[r.category ?? '(vide)'] ?? 0) + 1;

say('## Antigravity');
say();
say(`- ${anti.length} lignes, dont ${inBdd} marquées déjà en base et ${notInBdd} marquées nouvelles.`);
say(`  Ce n'est donc pas « 160 existantes + 150 nouvelles ».`);
say(`- ${dupIds.length} identifiants utilisés plusieurs fois : ${dupIds.map(d => `\`${d}\``).join(', ') || 'aucun'}`);
say(`- Catégories : ${Object.entries(cats).map(([k, v]) => `${k} = ${v}`).join(' · ')}`);
say(`- ${anti.filter(r => r.image_url).length} lignes avec image, ${anti.filter(r => !r.image_url).length} sans.`);

// Sous-variantes écrasées : le catalogue a 8 XY176 et 8 SM231, Antigravity ?
const countBy = (rows, pred) => rows.filter(pred).length;
const antiXY = countBy(anti, r => localNumber(r.card_number) === 'xy176' || norm(r.card_number).includes('xy176'));
const antiSM = countBy(anti, r => norm(r.card_number).includes('sm231'));
const curXY = countBy(current, r => norm(r.card_number).includes('xy176'));
const curSM = countBy(current, r => norm(r.card_number).includes('sm231'));
say(`- Sous-variantes concours : catalogue XY176 = ${curXY}, SM231 = ${curSM} ; Antigravity XY176 = ${antiXY}, SM231 = ${antiSM}.`);
if (antiXY < curXY || antiSM < curSM) {
  say(`  **Sa clé de déduplication écrase des lignes légitimes** (Staff, Champion, Finalist…),`);
  say(`  car la distinction est dans \`note\` alors que \`variant\` vaut partout \`Normal\`.`);
}

// Langues incohérentes
const antiLangs = {};
for (const r of anti) antiLangs[r.lang] = (antiLangs[r.lang] ?? 0) + 1;
const chineseCodes = Object.keys(antiLangs).filter(l => /^(cn|zh|zht|zh-cn|zh-tw|tw)$/i.test(l));
say(`- Codes langue distincts : ${Object.keys(antiLangs).length}. Codes chinois utilisés : ${chineseCodes.join(', ') || 'aucun'}.`);
const multiLang = anti.filter(r => /[\/,]/.test(String(r.lang ?? '')));
if (multiLang.length) say(`- ${multiLang.length} lignes ont une langue multiple (ex. \`EN / JP\`) : impossible pour une impression physique.`);

say();

// --- Codex
const codexRows = codex.rows ?? [];
say('## Codex');
say();
say(`- ${codexRows.length} lignes dans \`rows\`, ${(codex.current ?? []).length} lignes de catalogue capturées.`);
const codexKeys = codexRows.length ? Object.keys(codexRows[0]) : [];
say(`- Champs : ${codexKeys.join(', ')}`);

// ---------------------------------------------------------------- tri

const retenus = [];
const rejets = [];

/**
 * Les deux agents n'utilisent pas le même nommage : Antigravity est en
 * snake_case, Codex en camelCase. On ramène tout à une forme commune avant
 * de comparer, sinon les champs Codex sont lus comme `undefined`.
 */
function adapt(row, origine) {
  if (origine === 'codex') {
    return {
      id: row.uniqueKey ?? row.tcgdexId ?? null,
      name: row.name,
      set_name: row.set,
      year: row.year,
      lang: row.language,
      card_number: row.cardNumber,
      variant: row.variant,
      rarity: row.rarity,
      note: row.note ?? '',
      image_url: row.imageUrl ?? null,
      source_url: row.sourceUrl ?? null,
      category: row.type ?? row.format ?? '',
      _codex: row,
    };
  }
  return row;
}

function classify(raw, origine) {
  const row = adapt(raw, origine);
  const L = lang(row.lang);
  const num = localNumber(row.card_number);
  const url = row.source_url ?? null;
  const ev = evidence(url);
  const name = row.name ?? '';
  const cat = row.category ?? '';

  // Pocket = jeu numérique, jamais dans le total physique.
  // Se reconnaît au CODE de set (A1, A2a, B1, P-A…), pas au libellé :
  // « Genetic Apex » ou « Puissance Génétique » ne contiennent pas « Pocket ».
  // Le code peut être en tête (`A1`) ou noyé dans un identifiant composite
  // (`tcgdex-en-A3-215`) ou dans l'URL (`/cards/A1-053`).
  const codeHaystack = `${raw.setId ?? ''} ${raw.tcgdexId ?? ''} ${row.id ?? ''} ${url ?? ''}`;
  const POCKET_CODE = /(?:^|[-/\s])(A\d+[a-z]?|B\d+[a-z]?|P-A)-\d/i;
  const isPocket =
    /pocket/i.test(`${cat} ${row.set_name ?? ''} ${row.note ?? ''}`) ||
    POCKET_CODE.test(codeHaystack) ||
    String(raw.format ?? '').toLowerCase() === 'pocket';

  const m = matchCurrent(row);

  const base = {
    origine,
    id_propose: row.id ?? null,
    nom: name,
    set_name: row.set_name ?? null,
    annee: row.year ?? null,
    langue: L,
    langue_source: row.lang ?? null,
    numero: row.card_number ?? null,
    numero_normalise: num,
    variante: row.variant ?? null,
    note: row.note ?? '',
    image_url: row.image_url ?? null,
    source_url: url,
    preuve: ev.level,
    preuve_motif: ev.why,
    // Codex a déjà fait son propre rapprochement : on le conserve pour arbitrage.
    codex_statut: raw.catalogueStatus ?? null,
    codex_methode: raw.matchMethod ?? null,
  };

  if (isPocket) {
    rejets.push({ ...base, motif: 'POCKET_NUMERIQUE', detail: 'Jeu numérique — inventaire séparé, hors total physique.' });
    return;
  }
  if (m) {
    rejets.push({ ...base, motif: 'DEJA_AU_CATALOGUE', detail: `Correspond à \`${m.row.id}\` (score ${m.score.toFixed(2)}).` });
    return;
  }
  if (ev.level === 'nulle' || ev.level === 'aucune') {
    rejets.push({ ...base, motif: 'SANS_PREUVE', detail: ev.why });
    return;
  }
  // Année manifestement fabriquée : Antigravity date des sets 2024 en « 2000 ».
  const y = Number(row.year);
  const anneeSuspecte = !y || y < 1996 || y > new Date().getFullYear() + 1
    ? 'année hors bornes'
    : null;

  retenus.push({
    ...base,
    a_verifier_visuellement: !row.image_url,
    annee_suspecte: anneeSuspecte,
    priorite: ev.level === 'forte' ? 1 : ev.level === 'moyenne' ? 2 : 3,
  });
}

for (const r of anti) if (r.is_in_bdd !== true) classify(r, 'antigravity');
for (const r of codexRows) classify(r, 'codex');

// Dédoublonnage entre les deux sources sur la clé canonique.
const seen = new Map();
const retenusUniques = [];
for (const r of retenus.sort((a, b) => a.priorite - b.priorite)) {
  const key = [r.langue, r.numero_normalise, norm(r.set_name), norm(r.variante)].join('|');
  if (seen.has(key)) {
    rejets.push({ ...r, motif: 'DOUBLON_ENTRE_SOURCES', detail: `Déjà proposé par ${seen.get(key)}.` });
    continue;
  }
  seen.set(key, r.origine);
  retenusUniques.push(r);
}

// ---------------------------------------------------------------- images

const imgDir = codexFile ? join(ROOT, dirname(codexFile), 'images-manquantes-finales') : null;
let imgReport = [];
if (imgDir && existsSync(imgDir)) {
  for (const f of readdirSync(imgDir)) {
    const p = join(imgDir, f);
    const st = statSync(p);
    if (!st.isFile()) continue;
    const buf = readFileSync(p);
    // Signature réelle du fichier : une image doit décoder, pas juste porter l'extension.
    let type = 'inconnu';
    if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') type = 'png';
    else if (buf[0] === 0xff && buf[1] === 0xd8) type = 'jpeg';
    else if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') type = 'webp';
    else if (buf.slice(0, 14).toString('ascii').toLowerCase().includes('<!doctype') ||
             buf.slice(0, 6).toString('ascii').toLowerCase().includes('<html')) type = 'HTML';
    imgReport.push({ fichier: f, octets: st.size, type, suspect: type === 'inconnu' || type === 'HTML' || st.size < 3000 });
  }
}

// ---------------------------------------------------------------- sortie

say();
say('## Résultat du tri');
say();
say(`| Sort | Lignes |`);
say(`|---|---:|`);
say(`| **À valider par toi** | ${retenusUniques.length} |`);
for (const motif of [...new Set(rejets.map(r => r.motif))]) {
  say(`| Écarté — ${motif} | ${rejets.filter(r => r.motif === motif).length} |`);
}
say();
say('### Répartition des candidats retenus par niveau de preuve');
say();
for (const lvl of ['forte', 'moyenne', 'marchand', 'faible']) {
  const n = retenusUniques.filter(r => r.preuve === lvl).length;
  if (n) say(`- **${lvl}** : ${n}`);
}
say();
say(`- ${retenusUniques.filter(r => !r.image_url).length} candidats retenus n'ont aucune image.`);
say(`- ${retenusUniques.filter(r => r.preuve === 'faible').length} reposent sur une preuve faible : à ne pas importer sans contrôle.`);

if (imgReport.length) {
  say();
  say('## Images livrées par Codex');
  say();
  say(`- ${imgReport.length} fichiers, ${(imgReport.reduce((s, i) => s + i.octets, 0) / 1048576).toFixed(1)} Mo.`);
  const byType = {};
  for (const i of imgReport) byType[i.type] = (byType[i.type] ?? 0) + 1;
  say(`- Types réels (signature, pas extension) : ${Object.entries(byType).map(([k, v]) => `${k} = ${v}`).join(' · ')}`);
  const bad = imgReport.filter(i => i.suspect);
  say(`- ${bad.length} fichier(s) suspects (HTML déguisé, format inconnu ou < 3 Ko).`);
  for (const b of bad.slice(0, 10)) say(`  - \`${b.fichier}\` — ${b.type}, ${b.octets} o`);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'audit.md'), lines.join('\n') + '\n', 'utf8');
writeFileSync(join(OUT, 'a_valider.json'), JSON.stringify(retenusUniques, null, 2), 'utf8');
writeFileSync(join(OUT, 'rejets.json'), JSON.stringify(rejets, null, 2), 'utf8');
if (imgReport.length) writeFileSync(join(OUT, 'images.json'), JSON.stringify(imgReport, null, 2), 'utf8');

console.log(lines.join('\n'));
console.log(`\n→ recherche_cartes/triage/ : a_valider.json (${retenusUniques.length}), rejets.json (${rejets.length})`);

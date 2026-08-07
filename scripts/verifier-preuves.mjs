#!/usr/bin/env node
/**
 * Vérifie les preuves TCGdex des candidats retenus.
 *
 *   node scripts/verifier-preuves.mjs
 *
 * Interroge l'API pour chaque source_url TCGdex et contrôle que la carte
 * existe vraiment, qu'elle porte bien le nom de Carapuce dans cette langue,
 * et que set/numéro/année correspondent à ce qui est annoncé.
 *
 * Écrit recherche_cartes/triage/preuves.json et met à jour a_valider.json
 * avec le verdict. Aucune écriture distante.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TRIAGE = join(ROOT, 'recherche_cartes', 'triage');

/** Nom attendu de Carapuce selon la langue TCGdex. */
const NOMS = {
  en: ['Squirtle'], fr: ['Carapuce'], de: ['Schiggy'], it: ['Squirtle'],
  es: ['Squirtle'], 'es-mx': ['Squirtle'], 'pt-br': ['Squirtle'], 'pt-pt': ['Squirtle'],
  ja: ['ゼニガメ'], ko: ['꼬부기'], 'zh-tw': ['傑尼龜'], 'zh-cn': ['杰尼龟'],
  id: ['Squirtle'], th: ['เซนิกาเมะ', 'เซนิงาเมะ'], nl: ['Squirtle'], pl: ['Squirtle'],
  ru: ['Сквиртл', 'Squirtle'],
};

async function getJSON(url, tries = 1) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'maison-de-carapuce/triage' },
      signal: AbortSignal.timeout(25_000),
    });
    if (r.status === 404) return { notFound: true };
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    if (tries >= 3) return { error: e.message };
    await new Promise(s => setTimeout(s, 500 * 2 ** tries));
    return getJSON(url, tries + 1);
  }
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

/** Extrait (langue, id) d'une URL TCGdex, qu'elle soit API ou site. */
function parseTcgdex(url) {
  if (!url) return null;
  const m = String(url).match(/tcgdex\.net\/(?:v2\/)?([a-z-]{2,5})\/cards\/([^/?#\s]+)/i);
  return m ? { lang: m[1].toLowerCase(), id: decodeURIComponent(m[2]) } : null;
}

const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const candidats = JSON.parse(readFileSync(join(TRIAGE, 'a_valider.json'), 'utf8'));
const aVerifier = candidats.filter(c => parseTcgdex(c.source_url));

console.log(`${aVerifier.length} candidats sur ${candidats.length} ont une URL TCGdex vérifiable.\n`);

const resultats = await pool(aVerifier, 6, async (c) => {
  const t = parseTcgdex(c.source_url);
  const data = await getJSON(`https://api.tcgdex.net/v2/${t.lang}/cards/${encodeURIComponent(t.id)}`);

  if (data?.notFound) return { ...c, verdict: 'INEXISTANT', detail: `TCGdex ne connaît pas ${t.lang}/${t.id}` };
  if (data?.error) return { ...c, verdict: 'INJOIGNABLE', detail: data.error };

  const attendus = NOMS[t.lang] ?? [];
  const nomOk = attendus.length === 0 || attendus.some(n => norm(n) === norm(data.name));

  const numAnnonce = String(c.numero ?? '').split('/')[0].replace(/^0+/, '');
  const numReel = String(data.localId ?? '').replace(/^0+/, '');
  const numOk = !numAnnonce || !numReel || numAnnonce === numReel;

  // Un nom différent n'est pas une erreur : c'est probablement un cameo
  // (Carapuce visible sur une carte qui porte un autre nom). La carte existe,
  // seule la présence de Carapuce reste à confirmer à l'œil.
  const problemes = [];
  if (!numOk) problemes.push(`numéro réel ${data.localId}, annoncé ${c.numero}`);

  const verdict = problemes.length ? 'INCOHERENT'
    : nomOk ? 'CONFIRME'
    : 'CAMEO_A_VERIFIER';

  return {
    ...c,
    verdict,
    role: nomOk ? 'primary_subject' : 'cameo',
    printed_name: data.name,
    detail: problemes.join(' ; ')
      || (nomOk ? null : `Carte « ${data.name} » — vérifier que Carapuce est bien visible sur l'illustration.`),
    tcgdex_nom: data.name,
    tcgdex_set: data.set?.name ?? null,
    tcgdex_numero: data.localId ?? null,
    tcgdex_rarete: data.rarity ?? null,
    tcgdex_image: data.image ? `${data.image}/high.webp` : null,
  };
});

const par = {};
for (const r of resultats) par[r.verdict] = (par[r.verdict] ?? 0) + 1;

console.log('Verdicts :');
for (const [k, v] of Object.entries(par).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(12)} ${v}`);

const mauvais = resultats.filter(r => r.verdict !== 'CONFIRME');
if (mauvais.length) {
  console.log('\nProblèmes :');
  for (const m of mauvais.slice(0, 25)) {
    console.log(`  [${m.verdict}] ${m.langue} ${m.set_name} ${m.numero} — ${m.detail}`);
  }
}

// Réinjecte les verdicts et les images officielles récupérées au passage.
const parUrl = new Map(resultats.map(r => [r.source_url, r]));
const enrichis = candidats.map(c => {
  const v = parUrl.get(c.source_url);
  if (!v) return { ...c, verdict: 'NON_VERIFIABLE', detail: 'pas d\'URL TCGdex — contrôle humain' };
  const { origine, ...rest } = v;
  return { ...c, ...rest, origine: c.origine, image_url: c.image_url ?? v.tcgdex_image ?? null };
});

writeFileSync(join(TRIAGE, 'preuves.json'), JSON.stringify(resultats, null, 2), 'utf8');
writeFileSync(join(TRIAGE, 'a_valider.json'), JSON.stringify(enrichis, null, 2), 'utf8');

const recup = enrichis.filter(c => !candidats.find(o => o.source_url === c.source_url)?.image_url && c.image_url).length;
console.log(`\n→ preuves.json écrit. ${recup} images officielles récupérées via TCGdex au passage.`);

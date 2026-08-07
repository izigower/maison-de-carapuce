#!/usr/bin/env node
/**
 * Import du catalogue Carapuce depuis TCGdex (https://tcgdex.dev).
 *
 *   node scripts/import-tcgdex.mjs            # génère supabase/seed_tcgdex.sql
 *   node scripts/import-tcgdex.mjs --json     # écrit aussi le JSON brut
 *
 * Une entrée TCGdex = une carte imprimée dans une langue. Chaque carte
 * existe souvent en plusieurs variantes physiques (normale, reverse, holo,
 * édition 1, promo) : on éclate chacune en une ligne, puisque l'archive
 * recense les variantes et pas seulement les références.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.tcgdex.net/v2';

/** Nom localisé de Carapuce, par langue TCGdex. */
const POKEMON_NAME = {
  en: 'Squirtle',
  fr: 'Carapuce',
  de: 'Schiggy',
  it: 'Squirtle',
  es: 'Squirtle',
  'es-mx': 'Squirtle',
  'pt-br': 'Squirtle',
  ja: 'ゼニガメ',
  ko: '꼬부기',
  'zh-tw': '傑尼龜',
  'zh-cn': '杰尼龟',
  id: 'Squirtle',
  th: 'เซนิงาเมะ',
  nl: 'Squirtle',
  pl: 'Squirtle',
};

/** Code langue affiché sur le site + pays d'édition par défaut. */
const LANG_META = {
  en: { lang: 'EN', country: 'US' },
  fr: { lang: 'FR', country: 'FR' },
  de: { lang: 'DE', country: 'DE' },
  it: { lang: 'IT', country: 'IT' },
  es: { lang: 'ES', country: 'ES' },
  'es-mx': { lang: 'ES', country: 'MX' },
  'pt-br': { lang: 'PT', country: 'BR' },
  ja: { lang: 'JP', country: 'JP' },
  ko: { lang: 'KR', country: 'KR' },
  'zh-tw': { lang: 'ZH', country: 'TW' },
  'zh-cn': { lang: 'ZH', country: 'CN' },
  id: { lang: 'ID', country: 'ID' },
  th: { lang: 'TH', country: 'TH' },
  nl: { lang: 'NL', country: 'NL' },
  pl: { lang: 'PL', country: 'PL' },
};

/** Libellés de variante, en français (langue du site). */
const VARIANT_LABEL = {
  normal: 'Normale',
  reverse: 'Reverse',
  holo: 'Holo',
  firstEdition: 'Édition 1',
  wPromo: 'Promo',
};

const CONCURRENCY = 8;

async function fetchJSON(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'maison-de-carapuce/1.0 (+github.com/izigower/maison-de-carapuce)' },
      signal: AbortSignal.timeout(30_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise(r => setTimeout(r, 400 * 2 ** attempt));
    return fetchJSON(url, attempt + 1);
  }
}

/** Exécute `worker` sur chaque item, `limit` en parallèle. */
async function pool(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        out[i] = await worker(items[i], i);
      } catch (err) {
        console.warn(`  ! ${items[i]?.id ?? i} : ${err.message}`);
        out[i] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out.filter(Boolean);
}

const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();

async function collectLanguage(apiLang) {
  const target = POKEMON_NAME[apiLang];
  const list = await fetchJSON(`${API}/${apiLang}/cards`);
  if (!list) return [];

  const stubs = list.filter(c => c.name === target);
  if (stubs.length === 0) return [];

  const details = await pool(stubs, CONCURRENCY, s =>
    fetchJSON(`${API}/${apiLang}/cards/${encodeURIComponent(s.id)}`));

  const meta = LANG_META[apiLang];
  const rows = [];

  for (const card of details) {
    if (!card) continue;

    // Une ligne par variante physique réellement éditée.
    const active = Object.entries(card.variants ?? {})
      .filter(([, on]) => on === true)
      .map(([key]) => key);
    if (active.length === 0) active.push('normal');

    for (const v of active) {
      rows.push({
        id: `${slug(card.id)}-${meta.lang}-${slug(VARIANT_LABEL[v] ?? v)}`,
        set_name: card.set?.name ?? 'Inconnu',
        set_id: card.set?.id ?? null,
        year: null, // complété plus bas depuis la date de sortie du set
        lang: meta.lang,
        country: meta.country,
        card_number: card.localId
          ? `${card.localId}${card.set?.cardCount?.official ? '/' + card.set.cardCount.official : ''}`
          : '—',
        rarity: card.rarity ?? '—',
        variant: VARIANT_LABEL[v] ?? v,
        name_local: card.name,
        illustrator: card.illustrator ?? null,
        official_image_url: card.image ?? null,
        external_id: card.id,
        note: '',
        _setId: card.set?.id ?? null,
        _apiLang: apiLang,
      });
    }
  }
  return rows;
}

/** Les fiches carte ne portent pas l'année : on la lit sur le set. */
async function resolveYears(rows) {
  const pairs = [...new Set(rows.filter(r => r._setId).map(r => `${r._apiLang}|${r._setId}`))];
  const years = new Map();

  await pool(pairs, CONCURRENCY, async pair => {
    const [apiLang, setId] = pair.split('|');
    const set = await fetchJSON(`${API}/${apiLang}/sets/${encodeURIComponent(setId)}`);
    const date = set?.releaseDate;
    if (date) years.set(pair, Number(String(date).slice(0, 4)));
    return pair;
  });

  for (const r of rows) {
    r.year = years.get(`${r._apiLang}|${r._setId}`) ?? null;
  }
  return rows;
}

const sq = v => (v === null || v === undefined || v === '')
  ? 'NULL'
  : `'${String(v).replace(/'/g, "''")}'`;

function toSQL(rows) {
  const values = rows.map(r => '  (' + [
    sq(r.id), sq(r.set_name), r.year, sq(r.lang), sq(r.country),
    sq(r.card_number), sq(r.rarity), sq(r.variant), sq(r.note),
    sq(r.name_local), sq(r.set_id), sq(r.illustrator),
    sq(r.official_image_url), sq(r.external_id),
  ].join(', ') + ')').join(',\n');

  return `-- ============================================================
-- Seed généré depuis TCGdex — ${rows.length} lignes
-- Régénérer :  node scripts/import-tcgdex.mjs
-- NE PAS ÉDITER À LA MAIN.
-- ============================================================
-- Prérequis : 002_search_moderation.sql doit être appliqué.

INSERT INTO cards (
  id, set_name, year, lang, country, card_number, rarity, variant, note,
  name_local, set_id, illustrator, official_image_url, external_id
) VALUES
${values}
ON CONFLICT (id) DO UPDATE SET
  set_name           = EXCLUDED.set_name,
  year               = EXCLUDED.year,
  rarity             = EXCLUDED.rarity,
  name_local         = EXCLUDED.name_local,
  set_id             = EXCLUDED.set_id,
  illustrator        = EXCLUDED.illustrator,
  official_image_url = EXCLUDED.official_image_url,
  external_id        = EXCLUDED.external_id;

-- Provenance + vérification : ces lignes viennent d'une base de référence.
UPDATE cards SET source = 'tcgdex', is_verified = TRUE
 WHERE external_id IS NOT NULL AND source <> 'community';
`;
}

async function main() {
  const langs = Object.keys(POKEMON_NAME);
  console.log(`Interrogation de TCGdex sur ${langs.length} langues…\n`);

  const all = [];
  for (const l of langs) {
    const rows = await collectLanguage(l);
    console.log(`  ${l.padStart(6)} : ${String(rows.length).padStart(4)} lignes`);
    all.push(...rows);
  }

  if (all.length === 0) {
    console.error('\nAucune carte récupérée — import interrompu, seed inchangé.');
    process.exitCode = 1;
    return;
  }

  console.log('\nRésolution des années depuis les sets…');
  await resolveYears(all);

  // Dédoublonnage : un même id peut sortir deux fois si TCGdex liste un doublon.
  const byId = new Map();
  for (const r of all) if (!byId.has(r.id)) byId.set(r.id, r);
  const rows = [...byId.values()].sort((a, b) =>
    (a.year ?? 9999) - (b.year ?? 9999) || a.set_name.localeCompare(b.set_name) ||
    a.lang.localeCompare(b.lang) || a.id.localeCompare(b.id));

  const missingYear = rows.filter(r => !r.year).length;

  await mkdir(join(ROOT, 'supabase'), { recursive: true });
  await writeFile(join(ROOT, 'supabase', 'seed_tcgdex.sql'), toSQL(rows), 'utf8');

  if (process.argv.includes('--json')) {
    const clean = rows.map(({ _setId, _apiLang, ...rest }) => rest);
    await writeFile(join(ROOT, 'supabase', 'seed_tcgdex.json'),
      JSON.stringify(clean, null, 2), 'utf8');
  }

  const langCount = rows.reduce((m, r) => m.set(r.lang, (m.get(r.lang) ?? 0) + 1), new Map());
  console.log(`\n${rows.length} lignes → supabase/seed_tcgdex.sql`);
  console.log([...langCount].sort((a, b) => b[1] - a[1])
    .map(([l, n]) => `${l}:${n}`).join('  '));
  if (missingYear) console.log(`\n! ${missingYear} lignes sans année (set sans date de sortie).`);
}

main().catch(err => {
  console.error('Import échoué :', err);
  process.exit(1);
});

// Vérifie que le repli JS reproduit la sémantique de search_cards.
//   node --experimental-strip-types scripts/searchFallback.test.mjs
import { filterCards, sortCards, computeFacets } from '../src/lib/searchFallback.ts';

const card = (o) => ({
  id: 'x', set_name: '', year: 2000, lang: 'EN', country: 'US', card_number: '1/1',
  rarity: '', variant: 'Normal', note: '', image_url: null, back_image_url: null,
  is_owned: false, verification_status: 'verified', pipeline_status: 'live',
  source: 'masterlist', source_url: null, created_at: '', ...o,
});

// Jeu calqué sur les données réelles (IDs minuscules, accents, sets JP).
const cards = [
  card({ id: 'base1-EN-1999-63', set_name: 'Base Set', year: 1999, lang: 'EN',
         variant: '1st Edition', image_url: 'https://assets.tcgdex.net/en/base/base1/63/high.webp' }),
  card({ id: 'base1-DE-1999-63', set_name: 'Grundset', year: 1999, lang: 'DE',
         variant: 'Normal', image_url: 'https://assets.tcgdex.net/de/base/base1/63/high.webp' }),
  card({ id: 'evolutions-EN-2016-22', set_name: 'Évolutions', year: 2016, lang: 'EN',
         variant: 'Reverse Holo', is_owned: true }),
  card({ id: 'advp-55-JP-2004-55', set_name: 'ADV-P Promotional cards', year: 2004,
         lang: 'JP', rarity: 'Promo', variant: 'Normal', source: 'tcgdex' }),
];

const base = { q: '', langs: [], variants: [], owned: null, yearMin: null,
               yearMax: null, missingImage: null, sort: 'year_asc', page: 1 };
const ids = (p) => filterCards(cards, { ...base, ...p }).map(c => c.id);

let fails = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? 'OK ' : 'KO '} ${label}  →  ${JSON.stringify(got)}${ok ? '' : `  (attendu ${JSON.stringify(want)})`}`);
};

check('accent : "evolutions" trouve Évolutions', ids({ q: 'evolutions' }), ['evolutions-EN-2016-22']);
check('casse : minuscules = majuscules', ids({ q: 'base set' }), ids({ q: 'BASE SET' }));
// "base" est dans les deux ids ; ajouter "grundset" doit restreindre à l'allemand.
check('multi-mots : 1 terme', ids({ q: 'base' }).length, 2);
check('multi-mots = ET (restreint)', ids({ q: 'base grundset' }), ['base1-DE-1999-63']);
check('mot absurde => vide', ids({ q: 'base zzz' }), []);
check('rarete cherchable', ids({ q: 'promo' }), ['advp-55-JP-2004-55']);
check('source cherchable', ids({ q: 'tcgdex' }), ['advp-55-JP-2004-55']);
check('filtre langue', ids({ langs: ['JP'] }), ['advp-55-JP-2004-55']);
check('filtre variante', ids({ variants: ['1st Edition'] }), ['base1-EN-1999-63']);
check('filtre possedee', ids({ owned: true }), ['evolutions-EN-2016-22']);
check('periode', ids({ yearMin: 1999, yearMax: 2004 }).length, 3);
check('sans visuel', ids({ missingImage: true }), ['evolutions-EN-2016-22', 'advp-55-JP-2004-55']);

check('tri croissant', sortCards(cards, 'year_asc').map(c => c.year), [1999, 1999, 2004, 2016]);
check('tri decroissant', sortCards(cards, 'year_desc').map(c => c.year)[0], 2016);

const f = computeFacets(cards);
check('facette total', f.total, 4);
check('facette owned', f.owned, 1);
check('facette sans visuel', f.missing_image, 2);
check('facette annees', f.years, { min: 1999, max: 2016 });
check('facette langues', f.langs.map(l => `${l.value}:${l.count}`), ['DE:1', 'EN:2', 'JP:1']);

console.log(fails === 0 ? '\nTous les tests passent.' : `\n${fails} test(s) en echec.`);
process.exit(fails ? 1 : 0);

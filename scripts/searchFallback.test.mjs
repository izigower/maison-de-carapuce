// Vérifie que le repli JS reproduit la sémantique de search_cards.
import { filterCards, sortCards, computeFacets } from '/home/hugo/maison-de-carapuce/src/lib/searchFallback.ts';

const card = (o) => ({
  id: 'x', set_name: '', year: 2000, lang: 'EN', country: 'US', card_number: '1/1',
  rarity: '', variant: 'Normale', note: '', image_url: null, official_image_url: null,
  scan_url: null, is_owned: false, is_verified: true, source: 'tcgdex',
  name_local: null, illustrator: null, set_id: null, created_at: '', ...o,
});

// Jeu proche des données réelles (IDs minuscules, accents, année manquante).
const cards = [
  card({ id: 'base1-63-FR', set_name: 'Set de Base', year: 1999, lang: 'FR', variant: 'Édition 1', illustrator: 'Mitsuhiro Arita', official_image_url: 'https://a/b' }),
  card({ id: 'base1-63-EN', set_name: 'Base Set', year: 1999, lang: 'EN', variant: 'Normale', illustrator: 'Mitsuhiro Arita', image_url: 'https://c/d' }),
  card({ id: 'evo-22-FR', set_name: 'Évolutions', year: 2016, lang: 'FR', variant: 'Reverse', is_owned: true }),
  card({ id: 'promo-JP', set_name: 'Promo', year: null, lang: 'JP', variant: 'Promo' }),
];

const base = { q: '', langs: [], variants: [], owned: null, yearMin: null, yearMax: null, missingImage: null, sort: 'year_asc', page: 1 };
const ids = (p) => filterCards(cards, { ...base, ...p }).map(c => c.id);

let fails = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? 'OK ' : 'KO '} ${label}  →  ${JSON.stringify(got)}${ok ? '' : `  (attendu ${JSON.stringify(want)})`}`);
};

check('accent : "evolutions" trouve Évolutions', ids({ q: 'evolutions' }), ['evo-22-FR']);
check('accent : "edition" trouve Édition 1',      ids({ q: 'edition' }),    ['base1-63-FR']);
// "Set de Base" contient bien "base" ET "set" : les deux doivent sortir.
check('casse indifferente',                        ids({ q: 'BASE SET' }),   ['base1-63-FR', 'base1-63-EN']);
check('casse : minuscules = majuscules',           ids({ q: 'base set' }),   ids({ q: 'BASE SET' }));
check('multi-mots = ET',                           ids({ q: 'base fr' }),    ['base1-63-FR']);
check('mot absurde => vide',                       ids({ q: 'base zzz' }),   []);
check('illustrateur cherchable',                   ids({ q: 'arita' }),      ['base1-63-FR', 'base1-63-EN']);
check('filtre langue',                             ids({ langs: ['FR'] }),   ['base1-63-FR', 'evo-22-FR']);
check('filtre variante',                           ids({ variants: ['Reverse'] }), ['evo-22-FR']);
check('filtre possedee',                           ids({ owned: true }),     ['evo-22-FR']);
check('filtre manquante',                          ids({ owned: false }).length, 3);
check('periode 1999-2000',                         ids({ yearMin: 1999, yearMax: 2000 }), ['base1-63-FR', 'base1-63-EN']);
check('sans visuel (annee nulle incluse)',         ids({ missingImage: true }), ['evo-22-FR', 'promo-JP']);

const sorted = sortCards(cards, 'year_asc').map(c => c.year);
check('tri croissant, annee nulle en dernier', sorted, [1999, 1999, 2016, null]);
check('tri decroissant', sortCards(cards, 'year_desc').map(c => c.year)[0], null);

const f = computeFacets(cards);
check('facette total', f.total, 4);
check('facette owned', f.owned, 1);
check('facette sans visuel', f.missing_image, 2);
check('facette annees', f.years, { min: 1999, max: 2016 });
check('facette langues', f.langs.map(l => `${l.value}:${l.count}`), ['EN:1', 'FR:2', 'JP:1']);

console.log(fails === 0 ? '\nTous les tests passent.' : `\n${fails} test(s) en echec.`);
process.exit(fails ? 1 : 0);

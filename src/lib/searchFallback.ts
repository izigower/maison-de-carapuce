import type { Card, CatalogueFacets, SearchParamsShape } from '@/types';

/**
 * Repli JS pour le cas où la migration 002 n'est pas encore appliquée :
 * la RPC `search_cards` n'existe alors pas et le catalogue serait vide.
 *
 * Reproduit la sémantique de search_cards (normalisation sans accent,
 * multi-mots en ET, mêmes filtres) sur les lignes déjà chargées. Correct
 * jusqu'à quelques milliers de cartes ; au-delà, c'est la RPC qui doit servir.
 */

export const normalize = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Mêmes champs que le trigger cards_refresh_search_text côté Postgres. */
function haystack(c: Card): string {
  return normalize([
    c.id, c.set_name, c.year, c.lang, c.country,
    c.card_number, c.rarity, c.variant, c.note, c.source,
  ].filter(Boolean).join(' '));
}

const hasImage = (c: Card): boolean => Boolean(c.image_url);

export function filterCards(cards: Card[], p: SearchParamsShape): Card[] {
  const tokens = normalize(p.q).split(' ').filter(Boolean);

  return cards.filter(c => {
    // Une fiche masquée l'est aussi en mode dégradé, sinon elle réapparaîtrait
    // dans le catalogue public dès que la RPC Postgres échoue.
    if (c.masquee) return false;
    if (tokens.length) {
      const h = haystack(c);
      if (!tokens.every(t => h.includes(t))) return false;
    }
    if (p.langs.length && !p.langs.includes(c.lang)) return false;
    if (p.variants.length && !p.variants.includes(c.variant)) return false;
    if (p.owned !== null && Boolean(c.is_owned) !== p.owned) return false;
    if (p.yearMin !== null && (c.year ?? -Infinity) < p.yearMin) return false;
    if (p.yearMax !== null && (c.year ?? Infinity) > p.yearMax) return false;
    if (p.missingImage && hasImage(c)) return false;
    return true;
  });
}

export function sortCards(cards: Card[], sort: SearchParamsShape['sort']): Card[] {
  const byYear = (a: Card, b: Card) => (a.year ?? 9999) - (b.year ?? 9999);
  // Même illustration à la suite, ordre manuel prioritaire — comme la RPC.
  const byDesign = (a: Card, b: Card) =>
    (a.ordre_manuel ?? Infinity) - (b.ordre_manuel ?? Infinity)
    || String(a.oeuvre ?? '').localeCompare(String(b.oeuvre ?? ''));
  const tie = (a: Card, b: Card) =>
    a.set_name.localeCompare(b.set_name) ||
    a.lang.localeCompare(b.lang) ||
    a.card_number.localeCompare(b.card_number);

  return [...cards].sort((a, b) => {
    if (sort === 'design') return byDesign(a, b) || byYear(a, b) || tie(a, b);
    if (sort === 'year_desc') return -byYear(a, b) || tie(a, b);
    if (sort === 'set_asc') return tie(a, b);
    return byYear(a, b) || tie(a, b);
  });
}

export function computeFacets(all: Card[]): CatalogueFacets {
  const cards = all.filter(c => !c.masquee);
  const tally = (key: (c: Card) => string) => {
    const m = new Map<string, number>();
    for (const c of cards) {
      const v = key(c);
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m].sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count }));
  };

  const years = cards.map(c => c.year).filter((y): y is number => typeof y === 'number');

  return {
    langs: tally(c => c.lang),
    variants: tally(c => c.variant),
    years: {
      min: years.length ? Math.min(...years) : null,
      max: years.length ? Math.max(...years) : null,
    },
    total: cards.length,
    owned: cards.filter(c => c.is_owned).length,
    missing_image: cards.filter(c => !hasImage(c)).length,
  };
}

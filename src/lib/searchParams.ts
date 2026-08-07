import type { SearchParamsShape } from '@/types';

export const PAGE_SIZE = 60;

const SORTS = ['year_asc', 'year_desc', 'set_asc'] as const;

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v) ?? '';

/** Une liste est encodée « FR,EN » dans l'URL. */
const list = (v: string | string[] | undefined): string[] =>
  first(v).split(',').map(s => s.trim()).filter(Boolean);

function int(v: string | string[] | undefined): number | null {
  const n = Number.parseInt(first(v), 10);
  return Number.isFinite(n) ? n : null;
}

export function parseSearchParams(raw: RawParams): SearchParamsShape {
  const ownedRaw = first(raw.owned);
  const sortRaw = first(raw.sort) as SearchParamsShape['sort'];

  return {
    q: first(raw.q).slice(0, 120),
    langs: list(raw.langs),
    variants: list(raw.variants),
    owned: ownedRaw === '1' ? true : ownedRaw === '0' ? false : null,
    yearMin: int(raw.from),
    yearMax: int(raw.to),
    missingImage: first(raw.sansvisuel) === '1' ? true : null,
    sort: SORTS.includes(sortRaw) ? sortRaw : 'year_asc',
    page: Math.max(1, int(raw.page) ?? 1),
  };
}

/** Inverse de parseSearchParams — n'écrit que ce qui diffère du défaut. */
export function toQueryString(s: SearchParamsShape): string {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.langs.length) p.set('langs', s.langs.join(','));
  if (s.variants.length) p.set('variants', s.variants.join(','));
  if (s.owned !== null) p.set('owned', s.owned ? '1' : '0');
  if (s.yearMin !== null) p.set('from', String(s.yearMin));
  if (s.yearMax !== null) p.set('to', String(s.yearMax));
  if (s.missingImage) p.set('sansvisuel', '1');
  if (s.sort !== 'year_asc') p.set('sort', s.sort);
  if (s.page > 1) p.set('page', String(s.page));
  return p.toString();
}

export function hasActiveFilters(s: SearchParamsShape): boolean {
  return Boolean(
    s.q || s.langs.length || s.variants.length ||
    s.owned !== null || s.yearMin !== null || s.yearMax !== null ||
    s.missingImage
  );
}

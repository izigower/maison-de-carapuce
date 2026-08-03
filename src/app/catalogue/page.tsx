import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { parseSearchParams, PAGE_SIZE } from '@/lib/searchParams';
import CatalogueClient from './CatalogueClient';
import type { Card, CatalogueFacets, SearchResultCard } from '@/types';

export const metadata: Metadata = {
  title: 'Catalogue — La Maison de Carapuce',
  description: 'Toutes les cartes Carapuce recensées : langues, sets, variantes.',
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const EMPTY_FACETS: CatalogueFacets = {
  langs: [], variants: [], years: { min: null, max: null },
  total: 0, owned: 0, missing_image: 0,
};

export default async function CataloguePage({ searchParams }: Props) {
  const params = parseSearchParams(await searchParams);
  const supabase = await createClient();

  const [{ data: rows, error }, { data: facetData }] = await Promise.all([
    supabase.rpc('search_cards', {
      q: params.q,
      langs: params.langs.length ? params.langs : null,
      variants: params.variants.length ? params.variants : null,
      owned: params.owned,
      year_min: params.yearMin,
      year_max: params.yearMax,
      sort: params.sort,
      lim: PAGE_SIZE,
      off: (params.page - 1) * PAGE_SIZE,
      missing_image: params.missingImage,
    }),
    supabase.rpc('get_catalogue_facets'),
  ]);

  const results: SearchResultCard[] = rows ?? [];
  // total_count est identique sur toutes les lignes (window function).
  const total = results[0]?.total_count ?? 0;
  const cards: Card[] = results.map(({ total_count: _t, ...card }) => card);

  return (
    <CatalogueClient
      cards={cards}
      total={Number(total)}
      params={params}
      facets={(facetData as CatalogueFacets) ?? EMPTY_FACETS}
      failed={Boolean(error)}
    />
  );
}

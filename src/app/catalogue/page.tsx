import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { parseSearchParams, PAGE_SIZE } from '@/lib/searchParams';
import { filterCards, sortCards, computeFacets } from '@/lib/searchFallback';
import CatalogueClient from './CatalogueClient';
import type { Card, CatalogueFacets, SearchParamsShape, SearchResultCard } from '@/types';

export const metadata: Metadata = {
  title: 'Catalogue — La Maison de Carapuce',
  description: 'Toutes les cartes Carapuce recensées : langues, sets, variantes.',
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface CatalogueData {
  cards: Card[];
  total: number;
  facets: CatalogueFacets;
  degraded: boolean;
}

/** Chemin normal : tout le travail est fait par Postgres. */
async function fetchViaRpc(
  supabase: SupabaseClient,
  params: SearchParamsShape,
): Promise<CatalogueData | null> {
  const [{ data: rows, error }, { data: facetData, error: facetError }] = await Promise.all([
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

  if (error || facetError) return null;

  const results: SearchResultCard[] = rows ?? [];
  // total_count est identique sur toutes les lignes (window function).
  const total = Number(results[0]?.total_count ?? 0);

  return {
    cards: results.map(({ total_count: _t, ...card }) => card),
    total,
    facets: facetData as CatalogueFacets,
    degraded: false,
  };
}

/**
 * Repli tant que la migration 002 n'est pas appliquée : on charge le catalogue
 * et on filtre en JS. Le site reste utilisable au lieu d'afficher une page vide.
 */
async function fetchFallback(
  supabase: SupabaseClient,
  params: SearchParamsShape,
): Promise<CatalogueData> {
  const { data } = await supabase.from('cards').select('*');
  const all: Card[] = data ?? [];

  const matched = sortCards(filterCards(all, params), params.sort);
  const start = (params.page - 1) * PAGE_SIZE;

  return {
    cards: matched.slice(start, start + PAGE_SIZE),
    total: matched.length,
    facets: computeFacets(all),
    degraded: true,
  };
}

export default async function CataloguePage({ searchParams }: Props) {
  const params = parseSearchParams(await searchParams);
  const supabase = await createClient();

  const result = (await fetchViaRpc(supabase, params)) ?? (await fetchFallback(supabase, params));

  return (
    <CatalogueClient
      cards={result.cards}
      total={result.total}
      params={params}
      facets={result.facets}
      degraded={result.degraded}
    />
  );
}

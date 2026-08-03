export interface Card {
  id: string;
  set_name: string;
  /** NULL pour les sets promo dont la date de sortie est inconnue. */
  year: number | null;
  lang: string;
  country: string;
  card_number: string;
  rarity: string;
  variant: string;
  note: string;
  /** Image déposée directement sur la fiche. */
  image_url: string | null;
  /** Visuel de référence TCGdex (URL sans extension, cf. lib/cardImage). */
  official_image_url: string | null;
  /** Scan envoyé par un contributeur (Supabase Storage). */
  scan_url: string | null;
  is_owned: boolean;
  is_verified: boolean;
  source: 'manual' | 'tcgdex' | 'community';
  name_local: string | null;
  illustrator: string | null;
  set_id: string | null;
  created_at: string;
}

/** Ligne renvoyée par la RPC search_cards : une Card + le total du jeu de résultats. */
export interface SearchResultCard extends Card {
  total_count: number;
}

export interface Contribution {
  id: string;
  type: 'card' | 'item' | 'correction';
  status: 'pending' | 'approved' | 'rejected';
  submitted_by: string | null;
  contributor_name: string | null;
  contributor_email: string | null;
  data: Record<string, unknown>;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_card_id: string | null;
}

export interface Profile {
  id: string;
  handle: string;
  country: string;
  is_admin: boolean;
  created_at: string;
}

export interface ContributorStat {
  handle: string;
  country: string;
  created_at: string;
  cards_contributed: number;
  items_donated: number;
  rank: number;
}

export interface SiteStats {
  total_cards: number;
  total_langs: number;
  total_sets: number;
  total_owned: number;
  contributors: number;
  pending: number;
  items_received: number;
  years_covered: string;
}

export interface Facet {
  value: string;
  count: number;
}

export interface CatalogueFacets {
  langs: Facet[];
  variants: Facet[];
  years: { min: number | null; max: number | null };
  total: number;
  owned: number;
}

/** Filtres de recherche, sérialisés dans l'URL du catalogue. */
export interface SearchParamsShape {
  q: string;
  langs: string[];
  variants: string[];
  owned: boolean | null;
  yearMin: number | null;
  yearMax: number | null;
  sort: 'year_asc' | 'year_desc' | 'set_asc';
  page: number;
}

export interface SimilarCard {
  id: string;
  set_name: string;
  year: number | null;
  lang: string;
  card_number: string;
  variant: string;
  similarity: number;
}

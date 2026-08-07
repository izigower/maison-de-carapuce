/** Rôles applicatifs (colonne profiles.role). */
export type Role = 'user' | 'mod' | 'admin';

/** Un conservateur = admin ou modérateur (cf. fonction SQL is_admin()). */
export const isCurator = (role: string | null | undefined): boolean =>
  role === 'admin' || role === 'mod';

export interface Card {
  id: string;
  set_name: string;
  year: number;
  lang: string;
  country: string;
  card_number: string;
  rarity: string;
  variant: string;
  note: string;
  /** Visuel recto — URL complète (TCGdex, Pokécardex, PriceCharting, scan…). */
  image_url: string | null;
  back_image_url: string | null;
  is_owned: boolean;
  verification_status: 'pending' | 'verified' | 'disputed' | 'rejected';
  pipeline_status: 'draft' | 'sourced' | 'image_ok' | 'verified' | 'live' | 'rejected';
  source: string | null;
  source_url: string | null;
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
  role: Role;
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
  missing_image: number;
}

/** Filtres de recherche, sérialisés dans l'URL du catalogue. */
export interface SearchParamsShape {
  q: string;
  langs: string[];
  variants: string[];
  owned: boolean | null;
  yearMin: number | null;
  yearMax: number | null;
  /** true = seulement les fiches sans visuel. */
  missingImage: boolean | null;
  sort: 'year_asc' | 'year_desc' | 'set_asc';
  page: number;
}

/** Ligne de la file de tri des recherches (table research_candidates). */
export interface ResearchCandidate {
  id: string;
  kind: 'tcg' | 'non_tcg';
  nom: string;
  serie: string | null;
  numero: string | null;
  annee: number | null;
  langue: string | null;
  pays: string | null;
  type_objet: string | null;
  officiel: boolean | null;
  image_url: string | null;
  /** URL d'origine conservée quand elle est inutilisable côté serveur. */
  image_url_source: string | null;
  /**
   * ok = URL vérifiée, renvoie une vraie image ;
   * bloquee = l'image existe mais l'hôte refuse tout accès serveur (403) ;
   * morte = URL trouvée mais qui ne répond plus ; absente = rien trouvé.
   */
  image_statut: 'ok' | 'bloquee' | 'absente' | 'morte';
  source_url: string | null;
  preuve: 'forte' | 'moyenne' | 'faible' | 'marchand' | 'aucune' | null;
  verdict: string | null;
  origine: string | null;
  note: string | null;
  statut: 'a_trier' | 'garde' | 'rejete' | 'importe';
  created_at: string;
}

export interface ResearchStats {
  tcg_a_trier: number;
  non_tcg_a_trier: number;
  sans_image: number;
  image_bloquee: number;
  gardes: number;
  rejetes: number;
  types: Facet[];
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

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
  image_url: string | null;
  is_owned: boolean;
  created_at: string;
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
}

export interface Profile {
  id: string;
  handle: string;
  country: string;
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
  contributors: number;
  items_received: number;
  years_covered: string;
}

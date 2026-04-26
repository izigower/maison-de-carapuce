export const p = {
  bg: '#f3efe7',
  ink: '#1a1f2c',
  inkSoft: '#5a5e6a',
  rule: '#1a1f2c',
  brass: '#a07a3a',
  water: '#2a4a6e',
  card: '#fbf8f1',
} as const;

export const VARIANT_COLORS: Record<string, string> = {
  'Édition 1': '#a07a3a',
  '1st Edition': '#a07a3a',
  '1. Auflage': '#a07a3a',
  '1ère Édition': '#a07a3a',
  Shadowless: '#5a5e6a',
  'No Rarity': '#2a4a6e',
  'Reverse Holo': '#7a4a8a',
  Reverse: '#7a4a8a',
  Holo: '#a8485a',
  'Holo Foil': '#a8485a',
  'Holo Rare': '#a8485a',
  'Foil Sticker': '#a8485a',
  Foil: '#a8485a',
  'Master Ball Foil': '#5a3878',
  'Poké Ball Foil': '#a85838',
  'Movie Promo': '#d8a050',
  '20th Anniversary': '#a07a3a',
  Unlimited: '#5a5e6a',
  'Dark Squirtle': '#3a3060',
  'Carapuce Obscur': '#3a3060',
};

export const CARD_VARIANTS = [
  'wave', 'drop', 'shell', 'ripple', 'depth', 'current',
] as const;

export type CardVariant = typeof CARD_VARIANTS[number];

export const CARD_PALETTES: Record<string, [string, string, string]> = {
  wave: ['#cfd8e0', '#7a96b3', '#2a4a6e'],
  drop: ['#e8d8b8', '#c2a05a', '#7a5a28'],
  shell: ['#f0e0c8', '#b88858', '#5a3a1a'],
  ripple: ['#d8e4dc', '#7a9a8a', '#2a5a48'],
  depth: ['#c8d4e8', '#5a78a8', '#1a2a4a'],
  current: ['#dad0e0', '#8a78a8', '#4a3868'],
  hero: ['#d8e4ec', '#5a8aae', '#1a3858'],
};

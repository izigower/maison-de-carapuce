// Mock catalogue of Carapuce / Squirtle cards across languages and sets.
// Used by all three design directions. No images — we render abstract
// placeholders to avoid reproducing copyrighted artwork.

window.CARAPUCE_CARDS = [
  { id: "BS-63-EN-1999", set: "Base Set", year: 1999, lang: "EN", country: "US", number: "63/102", rarity: "Common", variant: "Shadowless", note: "1st English print" },
  { id: "BS-63-FR-1999", set: "Set de Base", year: 1999, lang: "FR", country: "FR", number: "63/102", rarity: "Commune", variant: "Édition 1", note: "Première impression FR" },
  { id: "BS-63-DE-1999", set: "Basis-Set", year: 1999, lang: "DE", country: "DE", number: "63/102", rarity: "Häufig", variant: "1. Auflage", note: "" },
  { id: "BS-63-JP-1996", set: "拡張パック", year: 1996, lang: "JP", country: "JP", number: "—", rarity: "★", variant: "No Rarity", note: "Original Japanese release" },
  { id: "JU-68-EN-2000", set: "Jungle", year: 2000, lang: "EN", country: "US", number: "68/64", rarity: "Common", variant: "Unlimited", note: "" },
  { id: "TR-13-EN-2000", set: "Team Rocket", year: 2000, lang: "EN", country: "US", number: "13/82", rarity: "Holo Rare", variant: "Dark Squirtle", note: "Dark Carapuce" },
  { id: "TR-13-FR-2000", set: "Team Rocket", year: 2000, lang: "FR", country: "FR", number: "13/82", rarity: "Rare Holo", variant: "Carapuce Obscur", note: "" },
  { id: "EX-26-EN-2003", set: "EX Sandstorm", year: 2003, lang: "EN", country: "US", number: "26/100", rarity: "Reverse", variant: "Reverse Holo", note: "" },
  { id: "DP-93-JP-2007", set: "Diamond & Pearl", year: 2007, lang: "JP", country: "JP", number: "93/—", rarity: "C", variant: "1st Edition", note: "" },
  { id: "HG-29-EN-2010", set: "HeartGold SoulSilver", year: 2010, lang: "EN", country: "US", number: "29/123", rarity: "Common", variant: "—", note: "" },
  { id: "BW-25-EN-2011", set: "Black & White", year: 2011, lang: "EN", country: "US", number: "25/114", rarity: "Common", variant: "—", note: "" },
  { id: "XY-24-EN-2014", set: "XY Base", year: 2014, lang: "EN", country: "US", number: "24/146", rarity: "Common", variant: "—", note: "" },
  { id: "XY-24-IT-2014", set: "XY", year: 2014, lang: "IT", country: "IT", number: "24/146", rarity: "Comune", variant: "—", note: "" },
  { id: "XY-24-ES-2014", set: "XY", year: 2014, lang: "ES", country: "ES", number: "24/146", rarity: "Común", variant: "—", note: "" },
  { id: "EV-22-EN-2016", set: "Evolutions", year: 2016, lang: "EN", country: "US", number: "22/108", rarity: "Common", variant: "20th Anniversary", note: "Reprint of Base Set art" },
  { id: "EV-22-KR-2016", set: "Evolutions", year: 2016, lang: "KR", country: "KR", number: "22/108", rarity: "C", variant: "—", note: "" },
  { id: "DET-7-EN-2019", set: "Detective Pikachu", year: 2019, lang: "EN", country: "US", number: "7/18", rarity: "Holo", variant: "Movie Promo", note: "" },
  { id: "SH-37-EN-2020", set: "Vivid Voltage", year: 2020, lang: "EN", country: "US", number: "37/185", rarity: "Common", variant: "—", note: "" },
  { id: "151-7-JP-2023", set: "ポケモンカード151", year: 2023, lang: "JP", country: "JP", number: "007/165", rarity: "C", variant: "Master Ball Foil", note: "Highly sought" },
  { id: "151-7-EN-2023", set: "Scarlet & Violet 151", year: 2023, lang: "EN", country: "US", number: "007/165", rarity: "Common", variant: "Poké Ball Foil", note: "" },
  { id: "TPS-1-EN-1999", set: "Topps TV Animation", year: 1999, lang: "EN", country: "US", number: "#7", rarity: "Sticker", variant: "Foil Sticker", note: "Topps card-sticker" },
  { id: "TPS-2-EN-2000", set: "Topps Series 2", year: 2000, lang: "EN", country: "US", number: "#7", rarity: "Sticker", variant: "Holo Foil", note: "Topps holo variant" },
  { id: "MRD-7-EN-1999", set: "Merlin Sticker Album", year: 1999, lang: "EN", country: "UK", number: "#212", rarity: "Sticker", variant: "Foil", note: "Merlin/Topps EU" },
  { id: "PAN-7-EN-2014", set: "Panini Sticker", year: 2014, lang: "EN", country: "INT", number: "#7", rarity: "Sticker", variant: "—", note: "Panini XY collection" },
];

window.CARAPUCE_LANGS = [
  { code: "ALL", label: "Toutes" },
  { code: "FR", label: "Français" },
  { code: "EN", label: "English" },
  { code: "JP", label: "日本語" },
  { code: "DE", label: "Deutsch" },
  { code: "IT", label: "Italiano" },
  { code: "ES", label: "Español" },
  { code: "KR", label: "한국어" },
];

window.CARAPUCE_STATS = {
  totalCards: 412,
  totalLangs: 11,
  totalSets: 84,
  contributors: 1247,
  itemsReceived: 89,
  yearsCovered: "1996 — 2026",
};

// Cards already in the owner's personal collection (so contributors don't send duplicates)
window.CARAPUCE_OWNED = new Set([
  "BS-63-FR-1999",
  "BS-63-EN-1999",
  "TR-13-FR-2000",
  "EV-22-EN-2016",
  "151-7-EN-2023",
  "DET-7-EN-2019",
  "TPS-1-EN-1999",
  "XY-24-EN-2014",
]);

// Top contributors — leaderboard data
window.CARAPUCE_CONTRIBUTORS = [
  { rank: 1, handle: "kaori_water", country: "JP", cards: 87, items: 12, since: "2024-01" },
  { rank: 2, handle: "lucienb",    country: "FR", cards: 64, items: 8,  since: "2024-03" },
  { rank: 3, handle: "shellfan",   country: "US", cards: 58, items: 5,  since: "2024-02" },
  { rank: 4, handle: "marie.l",    country: "FR", cards: 41, items: 9,  since: "2024-05" },
  { rank: 5, handle: "topps_dad",  country: "UK", cards: 36, items: 14, since: "2023-11" },
  { rank: 6, handle: "berndi",     country: "DE", cards: 28, items: 3,  since: "2024-06" },
  { rank: 7, handle: "rin_jp",     country: "JP", cards: 24, items: 2,  since: "2025-01" },
  { rank: 8, handle: "leandro",    country: "IT", cards: 19, items: 4,  since: "2024-09" },
  { rank: 9, handle: "kim.s",      country: "KR", cards: 17, items: 1,  since: "2025-02" },
  { rank: 10, handle: "carla.r",   country: "ES", cards: 15, items: 6,  since: "2024-08" },
];

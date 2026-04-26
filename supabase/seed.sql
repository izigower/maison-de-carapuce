-- ============================================================
-- Seed: Carapuce card catalogue (mock data)
-- Run this after the migration to populate the database.
-- ============================================================

INSERT INTO cards (id, set_name, year, lang, country, card_number, rarity, variant, note, is_owned) VALUES
  ('BS-63-EN-1999', 'Base Set', 1999, 'EN', 'US', '63/102', 'Common', 'Shadowless', '1st English print', FALSE),
  ('BS-63-FR-1999', 'Set de Base', 1999, 'FR', 'FR', '63/102', 'Commune', 'Édition 1', 'Première impression FR', TRUE),
  ('BS-63-DE-1999', 'Basis-Set', 1999, 'DE', 'DE', '63/102', 'Häufig', '1. Auflage', '', FALSE),
  ('BS-63-JP-1996', '拡張パック', 1996, 'JP', 'JP', '—', '★', 'No Rarity', 'Original Japanese release', FALSE),
  ('JU-68-EN-2000', 'Jungle', 2000, 'EN', 'US', '68/64', 'Common', 'Unlimited', '', FALSE),
  ('TR-13-EN-2000', 'Team Rocket', 2000, 'EN', 'US', '13/82', 'Holo Rare', 'Dark Squirtle', 'Dark Carapuce', FALSE),
  ('TR-13-FR-2000', 'Team Rocket', 2000, 'FR', 'FR', '13/82', 'Rare Holo', 'Carapuce Obscur', '', TRUE),
  ('EX-26-EN-2003', 'EX Sandstorm', 2003, 'EN', 'US', '26/100', 'Reverse', 'Reverse Holo', '', FALSE),
  ('DP-93-JP-2007', 'Diamond & Pearl', 2007, 'JP', 'JP', '93/—', 'C', '1st Edition', '', FALSE),
  ('HG-29-EN-2010', 'HeartGold SoulSilver', 2010, 'EN', 'US', '29/123', 'Common', '—', '', FALSE),
  ('BW-25-EN-2011', 'Black & White', 2011, 'EN', 'US', '25/114', 'Common', '—', '', FALSE),
  ('XY-24-EN-2014', 'XY Base', 2014, 'EN', 'US', '24/146', 'Common', '—', '', TRUE),
  ('XY-24-IT-2014', 'XY', 2014, 'IT', 'IT', '24/146', 'Comune', '—', '', FALSE),
  ('XY-24-ES-2014', 'XY', 2014, 'ES', 'ES', '24/146', 'Común', '—', '', FALSE),
  ('EV-22-EN-2016', 'Evolutions', 2016, 'EN', 'US', '22/108', 'Common', '20th Anniversary', 'Reprint of Base Set art', TRUE),
  ('EV-22-KR-2016', 'Evolutions', 2016, 'KR', 'KR', '22/108', 'C', '—', '', FALSE),
  ('DET-7-EN-2019', 'Detective Pikachu', 2019, 'EN', 'US', '7/18', 'Holo', 'Movie Promo', '', TRUE),
  ('SH-37-EN-2020', 'Vivid Voltage', 2020, 'EN', 'US', '37/185', 'Common', '—', '', FALSE),
  ('151-7-JP-2023', 'ポケモンカード151', 2023, 'JP', 'JP', '007/165', 'C', 'Master Ball Foil', 'Highly sought', FALSE),
  ('151-7-EN-2023', 'Scarlet & Violet 151', 2023, 'EN', 'US', '007/165', 'Common', 'Poké Ball Foil', '', TRUE),
  ('TPS-1-EN-1999', 'Topps TV Animation', 1999, 'EN', 'US', '#7', 'Sticker', 'Foil Sticker', 'Topps card-sticker', TRUE),
  ('TPS-2-EN-2000', 'Topps Series 2', 2000, 'EN', 'US', '#7', 'Sticker', 'Holo Foil', 'Topps holo variant', FALSE),
  ('MRD-7-EN-1999', 'Merlin Sticker Album', 1999, 'EN', 'UK', '#212', 'Sticker', 'Foil', 'Merlin/Topps EU', FALSE),
  ('PAN-7-EN-2014', 'Panini Sticker', 2014, 'EN', 'INT', '#7', 'Sticker', '—', 'Panini XY collection', FALSE)
ON CONFLICT (id) DO NOTHING;

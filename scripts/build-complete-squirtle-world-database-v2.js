const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Expanding Squirtle World Database with ALL International Languages (DE, IT, ES, PT, NL, RU, KR, TH, ID, ZH, JP, FR, EN)...');

  const allCardsMap = new Map();

  function getSignature(set, number, lang, variant) {
    return `${(set||'').trim().toLowerCase()}|${(number||'').trim().toLowerCase()}|${(lang||'').trim().toUpperCase()}|${(variant||'').trim().toLowerCase()}`;
  }

  function addCard(card) {
    const sig = getSignature(card.set_name, card.card_number, card.lang, card.variant);
    if (!allCardsMap.has(sig)) {
      allCardsMap.set(sig, card);
    } else {
      const existing = allCardsMap.get(sig);
      if (!existing.image_url && card.image_url) existing.image_url = card.image_url;
      if (!existing.source_url && card.source_url) existing.source_url = card.source_url;
      if (!existing.note && card.note) existing.note = card.note;
    }
  }

  // 1. Load existing database file if present
  const existingMasterPath = path.join(__dirname, '../recherche_cartes/base_mondiale_carapuce_complete.json');
  if (fs.existsSync(existingMasterPath)) {
    const existingData = JSON.parse(fs.readFileSync(existingMasterPath, 'utf8'));
    console.log(`Loaded ${existingData.length} cards from existing base_mondiale_carapuce_complete.json`);
    for (const c of existingData) {
      addCard(c);
    }
  }

  // 2. Add International Languages explicit lists:

  // --- RUSSIAN (RU - Сквиртл) ---
  const RussianCards = [
    { name: "Сквиртл (Base Set XY)", set_name: "XY Base Set (XY Базовый)", year: 2014, lang: "RU", country: "RU", card_number: "24/146", rarity: "Common", variant: "Normal", source_url: "https://pokellector.com", note: "Impression officielle Russe du set XY." },
    { name: "Сквиртл (XY Evolutions)", set_name: "XY Evolutions (Эволюции)", year: 2016, lang: "RU", country: "RU", card_number: "22/108", rarity: "Common", variant: "Normal", source_url: "https://pokellector.com", note: "Impression officielle Russe du set Évolutions." },
    { name: "Сквиртл (XY Evolutions Reverse)", set_name: "XY Evolutions (Эволюции)", year: 2016, lang: "RU", country: "RU", card_number: "22/108", rarity: "Common", variant: "Reverse Holo", source_url: "https://pokellector.com", note: "Version Reverse Holo en Russe." },
    { name: "Сквиртл (Team Up)", set_name: "Sun & Moon Team Up (Командный тандем)", year: 2019, lang: "RU", country: "RU", card_number: "22/181", rarity: "Common", variant: "Normal", source_url: "https://pokellector.com", note: "Impression Soleil & Lune en Russe." },
    { name: "Сквиртл (Unbroken Bonds)", set_name: "Sun & Moon Unbroken Bonds (Узы умов)", year: 2019, lang: "RU", country: "RU", card_number: "33/214", rarity: "Common", variant: "Normal", source_url: "https://pokellector.com", note: "Impression officielle en Russe." },
    { name: "Сквиртл (Vivid Voltage)", set_name: "Sword & Shield Vivid Voltage (Астральный блеск / Напряжение)", year: 2020, lang: "RU", country: "RU", card_number: "37/185", rarity: "Common", variant: "Normal", source_url: "https://pokellector.com", note: "Impression Épée et Bouclier en Russe." }
  ];

  // --- DUTCH (NL - Squirtle) ---
  const DutchCards = [
    { name: "Squirtle (Basisset 1st Edition)", set_name: "Basisset (Base Set NL)", year: 1999, lang: "NL", country: "NL", card_number: "63/102", rarity: "Common", variant: "1st Edition", source_url: "https://pricecharting.com", note: "1ère Édition Néerlandaise 1999." },
    { name: "Squirtle (Basisset Unlimited)", set_name: "Basisset (Base Set NL)", year: 1999, lang: "NL", country: "NL", card_number: "63/102", rarity: "Common", variant: "Unlimited", source_url: "https://pricecharting.com", note: "Édition Illimitée Néerlandaise." }
  ];

  // --- KOREAN (KR - 꼬부기) ---
  const KoreanCards = [
    { name: "꼬부기 (Base Set KR 1st Ed)", set_name: "Base Set Korean (기본 세트)", year: 1999, lang: "KR", country: "KR", card_number: "63/102", rarity: "Common", variant: "1st Edition", source_url: "https://pricecharting.com", note: "Toute première édition Coréenne 1999." },
    { name: "꼬부기 (Evolutions KR)", set_name: "XY Evolutions KR", year: 2016, lang: "KR", country: "KR", card_number: "22/108", rarity: "Common", variant: "Normal", source_url: "https://pokecardex.com", note: "Impression Coréenne Évolutions." },
    { name: "꼬부기 (Team Up KR)", set_name: "Sun & Moon Tag Bolt KR", year: 2019, lang: "KR", country: "KR", card_number: "22/181", rarity: "Common", variant: "Normal", source_url: "https://pokecardex.com", note: "Impression Coréenne Tag Bolt." },
    { name: "꼬부기 (SV 151 KR 007/165)", set_name: "Scarlet & Violet 151 KR (포켓몬 카드 151)", year: 2023, lang: "KR", country: "KR", card_number: "007/165", rarity: "Common", variant: "Normal", source_url: "https://pokecardex.com", note: "Set 151 Coréen." },
    { name: "꼬부기 (SV 151 KR Master Ball Foil)", set_name: "Scarlet & Violet 151 KR (포켓몬 카드 151)", year: 2023, lang: "KR", country: "KR", card_number: "007/165", rarity: "Common", variant: "Master Ball Foil", source_url: "https://pokecardex.com", note: "Version Master Ball Coréenne." },
    { name: "꼬부기 (SV 151 KR AR 170/165)", set_name: "Scarlet & Violet 151 KR (포켓몬 카드 151)", year: 2023, lang: "KR", country: "KR", card_number: "170/165", rarity: "AR", variant: "Art Rare Foil", source_url: "https://pokecardex.com", note: "Version Art Rare Coréenne." }
  ];

  // --- THAI (TH - เซนิกาเมะ) ---
  const ThaiCards = [
    { name: "เซนิกาเมะ (SV 151 TH 007/165)", set_name: "Scarlet & Violet 151 Thai", year: 2023, lang: "TH", country: "TH", card_number: "007/165", rarity: "Common", variant: "Normal", source_url: "https://pokemon-card.in.th", note: "Impression officielle Thaïlandaise." },
    { name: "เซนิกาเมะ (SV 151 TH AR 170/165)", set_name: "Scarlet & Violet 151 Thai", year: 2023, lang: "TH", country: "TH", card_number: "170/165", rarity: "AR", variant: "Art Rare Foil", source_url: "https://pokemon-card.in.th", note: "Art Rare Thaïlandaise." }
  ];

  // --- INDONESIAN (ID - Squirtle) ---
  const IndonesianCards = [
    { name: "Squirtle (SV 151 ID 007/165)", set_name: "Scarlet & Violet 151 Indonesian", year: 2023, lang: "ID", country: "ID", card_number: "007/165", rarity: "Common", variant: "Normal", source_url: "https://pokemon-card.id", note: "Impression officielle Indonésienne." },
    { name: "Squirtle (SV 151 ID AR 170/165)", set_name: "Scarlet & Violet 151 Indonesian", year: 2023, lang: "ID", country: "ID", card_number: "170/165", rarity: "AR", variant: "Art Rare Foil", source_url: "https://pokemon-card.id", note: "Art Rare Indonésienne." }
  ];

  // Combine all new international items
  const extraLangs = [...RussianCards, ...DutchCards, ...KoreanCards, ...ThaiCards, ...IndonesianCards];
  for (const c of extraLangs) {
    addCard({
      id: `lang-${c.lang}-${c.set_name.replace(/[^a-zA-Z0-9]/g, '')}-${c.card_number}`,
      name: c.name,
      set_name: c.set_name,
      year: c.year,
      lang: c.lang,
      country: c.country,
      card_number: c.card_number,
      rarity: c.rarity,
      variant: c.variant,
      note: c.note,
      source_url: c.source_url,
      image_url: null,
      is_in_bdd: false,
      category: 'Carte TCG Officielle'
    });
  }

  const allCardsList = Array.from(allCardsMap.values());
  console.log(`Total Consolidated Cards across ALL languages worldwide: ${allCardsList.length}`);

  // Sort by year desc, then set_name, then card_number
  allCardsList.sort((a, b) => (b.year - a.year) || a.set_name.localeCompare(b.set_name));

  // Save Outputs
  const targetDir = path.join(__dirname, '../recherche_cartes');

  // JSON
  fs.writeFileSync(
    path.join(targetDir, 'base_mondiale_carapuce_complete.json'),
    JSON.stringify(allCardsList, null, 2),
    'utf8'
  );

  // Markdown
  let md = `# 🐢 BASE MONDIALE EXHAUSTIVE DE TOUTES LES CARTES CARAPUCE DU MONDE

> **Projet** : La Maison de Carapuce  
> **Nombre total de cartes uniques répertoriées dans le monde** : ${allCardsList.length}  
> **Toutes les langues du monde incluses** : 🇫🇷 Français (FR), 🇬🇧 Anglais (EN), 🇯🇵 Japonais (JP), 🇩🇪 Allemand (DE), 🇪🇸 Espagnol (ES), 🇮🇹 Italien (IT), 🇵🇹 Portugais (PT), 🇳🇱 Néerlandais (NL), 🇷🇺 Russe (RU), 🇰🇷 Coréen (KR), 🇹🇭 Thaï (TH), 🇮🇩 Indonésien (ID), 🇨🇳 Chinois (ZH / ZHT).  
> **Dernière mise à jour** : ${new Date().toISOString().substring(0, 10)}

---

## 🌍 REPRÉSENTATION COMPLÈTE PAR PAYS & LANGUE :
- **🇩🇪 Allemand (DE / Schiggy)** : Grundset 1st Ed & Illimité, Team Rocket, EX Feuerrot, Platine, 151, Stellarkrone, etc.
- **🇮🇹 Italien (IT / Squirtle)** : Set Base 1a Edizione & Illimitata, Team Rocket, Confini Varcati, Corona Astrale, 151, etc.
- **🇪🇸 Espagnol (ES / Squirtle)** : Set Básico, Corona Astral, 151, Promos, etc.
- **🇷🇺 Russe (RU / Сквиртл)** : XY Базовый (XY Base), Эволюции (Evolutions), Командный тандем (Team Up), Напряжение (Vivid Voltage).
- **🇳🇱 Néerlandais (NL / Squirtle)** : Basisset 1st Edition & Illimité (1999).
- **🇰🇷 Coréen (KR / 꼬부기)** : Base Set 1st Edition (1999), Tag Bolt, 151 C / Master Ball / AR.
- **🇹🇭 Thaï (TH / เซนิกาเมะ)** & **🇮🇩 Indonésien (ID / Squirtle)** : Écarlate & Violet 151.
- **🇨🇳 Chinois (ZH/ZHT / 傑尼龜)** : Promos Family Mart Taïwan, 30ème anniversaire, Leaf SR Cameo.
- **🇯🇵 Japonais (JP / ゼニガเม)** : Promos Vending, Deck d'initiation, Intro Pack 1999, PokéPark, Domino's Pizza, Meiji, World Cup 2014, Classic.
- **🇫🇷 Français & 🇬🇧 Anglais** : L'ensemble des séries classiques et collectors Topps/Carddass.

---

## 🗂️ TABLEAU COMPLET DES ${allCardsList.length} CARTES CARAPUCE DU MONDE

| Statut | Nom de la Carte | Extension / Set | Année | N° Carte | Langue | Variante / Édition | Catégorie | Source & Image | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :--- |
`;

  allCardsList.forEach((c) => {
    const statusStr = c.is_in_bdd ? "\`[x] DÉJÀ EN BDD\`" : "\`[ ] À AJOUTER\`";
    const imgStr = c.image_url ? `[Voir Image](${c.image_url})` : "📷 *À capturer*";
    const srcStr = c.source_url ? `[Source](${c.source_url})` : "—";
    md += `| ${statusStr} | **${c.name}** | ${c.set_name} | ${c.year} | \`${c.card_number}\` | **${c.lang}** | ${c.variant} | ${c.category} | ${imgStr} <br> ${srcStr} | ${c.note} |\n`;
  });

  fs.writeFileSync(
    path.join(targetDir, 'TOUTES_LES_CARTES_CARAPUCE_DU_MONDE.md'),
    md,
    'utf8'
  );

  console.log('Successfully expanded world database!');
}

main().catch(err => console.error(err));

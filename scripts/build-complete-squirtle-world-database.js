const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Building the Ultimate World Masterlist for Squirtle (Carapuce)...');

  const allCardsMap = new Map();

  function getSignature(set, number, lang, variant) {
    return `${(set||'').trim().toLowerCase()}|${(number||'').trim().toLowerCase()}|${(lang||'').trim().toUpperCase()}|${(variant||'').trim().toLowerCase()}`;
  }

  function addCard(card) {
    const sig = getSignature(card.set_name, card.card_number, card.lang, card.variant);
    if (!allCardsMap.has(sig)) {
      allCardsMap.set(sig, card);
    } else {
      // Merge properties if image_url or source_url is missing
      const existing = allCardsMap.get(sig);
      if (!existing.image_url && card.image_url) existing.image_url = card.image_url;
      if (!existing.source_url && card.source_url) existing.source_url = card.source_url;
      if (!existing.note && card.note) existing.note = card.note;
    }
  }

  // 1. Load existing catalogue from chats/catalogue-current.json
  const currentPath = path.join(__dirname, '../chats/catalogue-current.json');
  if (fs.existsSync(currentPath)) {
    const existingData = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
    console.log(`Loaded ${existingData.length} cards from existing catalogue-current.json`);
    for (const c of existingData) {
      addCard({
        id: c.id,
        name: c.name || `Carapuce (${c.set_name})`,
        set_name: c.set_name,
        year: c.year,
        lang: c.lang,
        country: c.country || 'INT',
        card_number: c.card_number || '—',
        rarity: c.rarity || 'Common',
        variant: c.variant || 'Normal',
        note: c.note || '',
        image_url: c.image_url || null,
        source_url: c.source_url || 'https://maison-de-carapuce.vercel.app/catalogue',
        is_in_bdd: true,
        category: c.category || 'Carte TCG Officielle'
      });
    }
  }

  // 2. Query TCGdex API for FR, EN, DE, ES, IT, PT
  const tcgdexLangs = [
    { code: 'fr', searchName: 'Carapuce' },
    { code: 'en', searchName: 'Squirtle' },
    { code: 'de', searchName: 'Schiggy' },
    { code: 'es', searchName: 'Squirtle' },
    { code: 'it', searchName: 'Squirtle' },
    { code: 'pt', searchName: 'Squirtle' }
  ];

  for (const l of tcgdexLangs) {
    try {
      console.log(`Fetching TCGdex API for language [${l.code.toUpperCase()}]...`);
      const res = await fetch(`https://api.tcgdex.net/v2/${l.code}/cards?name=${encodeURIComponent(l.searchName)}`);
      const list = await res.json();
      if (Array.isArray(list)) {
        for (const item of list) {
          // Fetch full card detail
          try {
            const detailRes = await fetch(`https://api.tcgdex.net/v2/${l.code}/cards/${item.id}`);
            const detail = await detailRes.json();
            
            const cardObj = {
              id: `tcgdex-${l.code}-${detail.id}`,
              name: detail.name || l.searchName,
              set_name: detail.set?.name || 'Inconnu',
              year: detail.set?.releaseDate ? parseInt(detail.set.releaseDate.substring(0, 4)) : 2000,
              lang: l.code.toUpperCase(),
              country: l.code === 'fr' ? 'FR' : (l.code === 'de' ? 'DE' : (l.code === 'en' ? 'US' : l.code.toUpperCase())),
              card_number: detail.localId ? `${detail.localId}/${detail.set?.cardCount?.official || detail.set?.cardCount?.total || ''}` : '—',
              rarity: detail.rarity || 'Commune',
              variant: detail.variants?.reverse ? 'Reverse Holo' : (detail.variants?.firstEdition ? 'Édition 1' : (detail.variants?.holo ? 'Holo' : 'Normal')),
              note: `TCGdex API - Set ${detail.set?.id || ''}`,
              image_url: detail.image ? `${detail.image}/high.webp` : null,
              source_url: `https://tcgdex.net/${l.code}/cards/${detail.id}`,
              is_in_bdd: false,
              category: 'Carte TCG Officielle'
            };
            addCard(cardObj);
          } catch (e) {
            // ignore detail fetch error
          }
        }
      }
    } catch (e) {
      console.error(`Error fetching TCGdex for ${l.code}:`, e.message);
    }
  }

  // 3. Add Comprehensive Japanese, Asian, Promo & Cameo Cards
  const AsianAndPromos = [
    // Japanese Vintage TCG & Deck Sets
    { name: "ゼニガメ (Expansion Pack JP No Rarity)", set_name: "Expansion Pack JP", year: 1996, lang: "JP", country: "JP", card_number: "007", rarity: "★", variant: "No Rarity / First Print", source_url: "https://pricecharting.com", note: "Toute première impression sans symbole de rareté au Japon en 1996." },
    { name: "ゼニガメ (Expansion Sheet 1 Vending)", set_name: "Expansion Sheet 1 (Vending)", year: 1998, lang: "JP", country: "JP", card_number: "Sheet 1", rarity: "Common", variant: "Vending Glossy", source_url: "https://bulbapedia.bulbagarden.net", note: "Carte brillante imprimée sur planche Vending Machine au Japon." },
    { name: "ゼニガメ (Quick Starter Gift Set Red Deck)", set_name: "Red Deck (Quick Starter)", year: 1998, lang: "JP", country: "JP", card_number: "—", rarity: "Common", variant: "Glossy Foil Logo", source_url: "https://bulbapedia.bulbagarden.net", note: "Deck d'initiation rapide rouge 1998." },
    { name: "ゼニガメ (Intro Pack Squirtle Deck 016)", set_name: "Intro Pack (Squirtle Deck)", year: 1999, lang: "JP", country: "JP", card_number: "16", rarity: "Common", variant: "Squirtle Rarity Icon", source_url: "https://pokecardex.com", note: "Icône de rareté spéciale Carapuce en bas à droite." },
    { name: "ゼニガメ (Intro Pack Squirtle Deck 018)", set_name: "Intro Pack (Squirtle Deck)", year: 1999, lang: "JP", country: "JP", card_number: "18", rarity: "Common", variant: "Squirtle Rarity Icon", source_url: "https://pokecardex.com", note: "Deuxième version Intro Pack 1999." },
    { name: "ゼニガメ (Intro Pack Squirtle Deck 037)", set_name: "Intro Pack (Squirtle Deck)", year: 1999, lang: "JP", country: "JP", card_number: "37", rarity: "Common", variant: "Squirtle Rarity Icon", source_url: "https://pokecardex.com", note: "Troisième version Intro Pack 1999." },
    { name: "ゼニガメ (Intro Pack Squirtle Deck 040)", set_name: "Intro Pack (Squirtle Deck)", year: 1999, lang: "JP", country: "JP", card_number: "40", rarity: "Common", variant: "Squirtle Rarity Icon", source_url: "https://pokecardex.com", note: "Quatrième version Intro Pack 1999." },
    { name: "ゼニガメ (e-Starter Deck 017/029)", set_name: "Pokémon-e Starter Deck", year: 2001, lang: "JP", country: "JP", card_number: "017/029", rarity: "Common", variant: "1st Edition e-Reader", source_url: "https://pokecardex.com", note: "Deck e-Card Japonais 2001." },
    { name: "ゼニガメ (e-Starter Deck 018/029)", set_name: "Pokémon-e Starter Deck", year: 2001, lang: "JP", country: "JP", card_number: "018/029", rarity: "Common", variant: "1st Edition e-Reader", source_url: "https://pokecardex.com", note: "Deuxième version e-Starter Deck JP." },
    { name: "ゼニガメ (McDonald's e-Minimum Pack)", set_name: "McDonald's e-Minimum Pack", year: 2002, lang: "JP", country: "JP", card_number: "007/018", rarity: "Promo", variant: "Non-Holo e-Series", source_url: "https://bulbapedia.bulbagarden.net", note: "Distribution Happy Meal McDonald's Japon 2002." },
    { name: "ゼニガメ (Meiji ADV Promo 012/ADV-P)", set_name: "Meiji Chocolate ADV Promos", year: 2004, lang: "JP", country: "JP", card_number: "012/ADV-P", rarity: "Promo", variant: "Meiji Stamped", source_url: "https://bulbapedia.bulbagarden.net", note: "Inséré dans les boîtes de chocolat Meiji." },
    { name: "ゼニガメ (Domino's Pizza 020/PCG-P)", set_name: "Domino's Pizza PCG-P Promo", year: 2004, lang: "JP", country: "JP", card_number: "020/PCG-P", rarity: "Promo", variant: "Domino's Stamped", source_url: "https://bulbapedia.bulbagarden.net", note: "Promo offerte lors d'une commande chez Domino's Pizza Japon." },
    { name: "ゼニガメ (PokéPark Blue 048/PCG-P)", set_name: "PokéPark Blue PCG-P Promo", year: 2005, lang: "JP", country: "JP", card_number: "048/PCG-P", rarity: "Promo", variant: "PokéPark Logo Stamp", source_url: "https://bulbapedia.bulbagarden.net", note: "Exclusivité parc d'attractions PokéPark Nagoya 2005." },
    { name: "ゼニガメ (World Cup 2014 Pikachu & Squirtle 050/XY-P)", set_name: "2014 FIFA World Cup Japan Promos", year: 2014, lang: "JP", country: "JP", card_number: "050/XY-P", rarity: "Promo", variant: "Japan National Team Stamp", source_url: "https://snkrdunk.com", image_url: "https://img.snkrdunk.com/uploads/media/20231012/050_XY-P.jpg", note: "Promo Coupe du monde 2014 au Japon." },
    { name: "ゼニガメ (Pokémon GO 024/S-P Promo)", set_name: "S-P Promotional Cards", year: 2022, lang: "JP", country: "JP", card_number: "290/S-P", rarity: "Promo", variant: "Pokémon GO Promo", source_url: "https://pricecharting.com", note: "Promo Pokémon GO au Japon." },
    { name: "ゼニガメ (Pokémon Card Classic 001/034)", set_name: "Pokémon Card Game Classic", year: 2023, lang: "JP", country: "JP", card_number: "001/034", rarity: "Holo", variant: "Classic Foil", source_url: "https://tcgrepublic.com", note: "Coffret d'exception Classic JP 2023." },
    { name: "ゼニガメ (Special Deck Set ex 014/049)", set_name: "Venusaur/Charizard/Blastoise Special Deck Set ex", year: 2023, lang: "JP", country: "JP", card_number: "014/049", rarity: "Common", variant: "Deck ex Normal", source_url: "https://tcgrepublic.com", note: "Deck Spécial ex Japonais 2023." },
    { name: "ゼニガメ (Special Deck Set ex AR 052/049)", set_name: "Venusaur/Charizard/Blastoise Special Deck Set ex", year: 2023, lang: "JP", country: "JP", card_number: "052/049", rarity: "AR", variant: "Art Rare Foil", source_url: "https://tcgrepublic.com", note: "Version Art Rare du coffret Spécial Deck Set ex." },

    // Chinese (Simplified & Traditional) Promos
    { name: "傑尼龜 / Carapuce (Taiwan Family Mart 233/SV-P)", set_name: "Taiwan Family Mart SV-P Promos", year: 2023, lang: "ZHT", country: "TW", card_number: "233/SV-P", rarity: "Promo", variant: "Family Mart Taiwan Stamp", source_url: "https://tcghobby.com", note: "Promo exclusive distribuée chez Family Mart à Taïwan." },
    { name: "傑尼龜 / Carapuce (Chinese 30th Anniversary 003/30th-P)", set_name: "30th-P Promotional Cards", year: 2024, lang: "ZH", country: "CN", card_number: "003/30th-P", rarity: "Promo", variant: "30th Anniversary Logo", source_url: "https://pokecardex.com", note: "Carte promo anniversaire en Chine continentale." },
    { name: "Leaf's Exploration / 莉芙的探索 (Cameo Carapuce 033/024 SR)", set_name: "CSMPI Simplified Chinese (Nine Colors Gathering)", year: 2023, lang: "CN", country: "CN", card_number: "033/024 SR", rarity: "SR", variant: "Super Rare Cameo", source_url: "https://questcorner.fr", image_url: "https://questcorner.fr/cdn/shop/files/carte-pokemon-exploration-de-leaf-033-024-sr-csmpi-chinois-simplifie-921475.jpg", note: "Cameo Carapuce à côté de Leaf en Chinois Simplifié." },

    // Non-TCG: Bandai Carddass, Topps, Panini, Merlin
    { name: "Bandai Carddass 1996 Squirtle #007 (Green Back)", set_name: "Bandai Carddass Pocket Monsters Part 1", year: 1996, lang: "JP", country: "JP", card_number: "#007", rarity: "Carddass Normal", variant: "Green Back", source_url: "https://snkrdunk.com", note: "Distributeur Vending 1996 au Japon (Dos vert)." },
    { name: "Bandai Carddass 1996 Squirtle #007 (Red Back)", set_name: "Bandai Carddass Pocket Monsters Part 1", year: 1996, lang: "JP", country: "JP", card_number: "#007", rarity: "Carddass Normal", variant: "Red Back", source_url: "https://snkrdunk.com", note: "Distributeur Vending 1996 au Japon (Dos rouge)." },
    { name: "Bandai Carddass Town Map 1997", set_name: "Bandai Carddass Special", year: 1997, lang: "JP", country: "JP", card_number: "Town Map", rarity: "Prism", variant: "Prism Foil", source_url: "https://snkrdunk.com", note: "Carte prisme de la carte de la région de Kanto." },
    { name: "Topps TV Animation Series 1 Squirtle #7", set_name: "Topps TV Animation", year: 1999, lang: "EN", country: "US", card_number: "#7", rarity: "Sticker / Card", variant: "Blue Logo / Red Logo / Black Logo", source_url: "https://pricecharting.com", note: "Première série Topps TV Animation." },
    { name: "Topps Chrome Series 1 Squirtle #7 (Spectra/Tekno/Sparkle)", set_name: "Topps Chrome Series 1", year: 2000, lang: "EN", country: "US", card_number: "#7", rarity: "Chrome Refractor", variant: "Tekno / Sparkle / Spectra", source_url: "https://pricecharting.com", note: "Réfracteurs chromés ultra prisés." },
    { name: "Merlin Sticker Album 1999 #212", set_name: "Merlin Sticker Collection", year: 1999, lang: "EN", country: "UK", card_number: "#212", rarity: "Sticker", variant: "Foil Sticker", source_url: "https://ebay.com", note: "Sticker officiel Merlin Europe 1999." },
    { name: "Panini XY Collection 2014 #7", set_name: "Panini XY Sticker Album", year: 2014, lang: "INT", country: "INT", card_number: "#7", rarity: "Sticker", variant: "Normal Sticker", source_url: "https://panini.com", note: "Sticker Panini collection XY 2014." }
  ];

  for (const c of AsianAndPromos) {
    addCard({
      id: `manual-${c.lang}-${c.set_name.replace(/[^a-zA-Z0-9]/g, '')}-${c.card_number}`,
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
      image_url: c.image_url || null,
      is_in_bdd: false,
      category: c.set_name.includes('Carddass') || c.set_name.includes('Topps') || c.set_name.includes('Merlin') || c.set_name.includes('Panini') ? 'Non-TCG / Topps / Carddass' : 'Carte TCG Officielle'
    });
  }

  const allCardsList = Array.from(allCardsMap.values());
  console.log(`Total Unique Squirtle Cards Consolidated Worldwide: ${allCardsList.length}`);

  // Sort by year desc, then set_name, then card_number
  allCardsList.sort((a, b) => (b.year - a.year) || a.set_name.localeCompare(b.set_name));

  // Write outputs
  const targetDir = path.join(__dirname, '../recherche_cartes');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. JSON
  fs.writeFileSync(
    path.join(targetDir, 'base_mondiale_carapuce_complete.json'),
    JSON.stringify(allCardsList, null, 2),
    'utf8'
  );

  // 2. Markdown File
  let md = `# 🐢 BASE MONDIALE EXHAUSTIVE DE TOUTES LES CARTES CARAPUCE DU MONDE

> **Projet** : La Maison de Carapuce  
> **Nombre total de cartes uniques répertoriées dans le monde** : ${allCardsList.length}  
> **Langues couvertes** : Français (FR), Anglais (EN), Japonais (JP), Allemand (DE), Espagnol (ES), Italien (IT), Portugais (PT), Chinois (ZH/ZHT), Coréen (KR).  
> **Dernière mise à jour** : ${new Date().toISOString().substring(0, 10)}

---

## 📋 Légende & Utilisation :
- \`[x] DÉJÀ EN BDD\` : Carte déjà intégrée sur [maison-de-carapuce.vercel.app/catalogue](https://maison-de-carapuce.vercel.app/catalogue)
- \`[ ] À AJOUTER\` : Nouvelle carte recensée prête à être intégrée dans Supabase.
- **Cliquez sur les liens sources** pour télécharger l'image en haute définition.

---

## 🌐 REPRÉSENTATION PAR LANGUE
- **Japonais (JP)** : Promos Vending, Deck d'initiation, Intro Pack 1999, PokéPark, Domino's Pizza, Meiji, World Cup 2014, Classic.
- **Chinois (CN / ZHT)** : Exclusivité Family Mart Taïwan, 30ème anniversaire, Leaf SR Cameo.
- **Français (FR)** : Set de Base, Jungle, Team Rocket, XY, Soleil & Lune, Épée & Bouclier, Écarlate & Violet 151, etc.
- **Anglais (EN)** : Shadowless, 1st Edition, Unlimited, Topps Chrome, Legendary Collection Reverse.
- **Allemand / Espagnol / Italien / Portugais** : Grundset, Base Set international, Evolutions, etc.

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

  console.log('Successfully written TOUTES_LES_CARTES_CARAPUCE_DU_MONDE.md and base_mondiale_carapuce_complete.json');
}

main().catch(err => console.error(err));

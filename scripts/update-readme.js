const fs = require('fs');
const path = require('path');

const SEED_PATH = path.join(__dirname, '..', 'supabase', 'seed.sql');
const README_PATH = path.join(__dirname, '..', 'README.md');

const LANG_MAP = {
  'FR': { name: 'Français', flag: '🇫🇷' },
  'EN': { name: 'English', flag: '🇺🇸' },
  'JP': { name: '日本語', flag: '🇯🇵' },
  'DE': { name: 'Deutsch', flag: '🇩🇪' },
  'IT': { name: 'Italiano', flag: '🇮🇹' },
  'ES': { name: 'Español', flag: '🇪🇸' },
  'KR': { name: '한국어', flag: '🇰🇷' },
  'UK': { name: 'English (UK)', flag: '🇬🇧' },
  'INT': { name: 'International', flag: '🌐' }
};

function getProgressChar(percent) {
  const width = 20;
  const progress = Math.round((percent / 100) * width);
  const empty = width - progress;
  return '█'.repeat(progress) + '░'.repeat(empty);
}

function parseCardsFromSeed() {
  if (!fs.existsSync(SEED_PATH)) {
    console.error('Seed file not found at:', SEED_PATH);
    return [];
  }

  const seedContent = fs.readFileSync(SEED_PATH, 'utf8');
  // Match lines inside INSERT INTO cards
  const cardRegex = /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(TRUE|FALSE)\s*\)/g;

  const cards = [];
  let match;
  while ((match = cardRegex.exec(seedContent)) !== null) {
    cards.push({
      id: match[1],
      set_name: match[2],
      year: parseInt(match[3]),
      lang: match[4],
      country: match[5],
      card_number: match[6],
      rarity: match[7],
      variant: match[8],
      note: match[9],
      is_owned: match[10] === 'TRUE'
    });
  }
  return cards;
}

function generateStatsMarkdown(cards) {
  const totalCards = cards.length;
  const ownedCards = cards.filter(c => c.is_owned).length;
  const ownedPercent = totalCards > 0 ? ((ownedCards / totalCards) * 100).toFixed(1) : '0.0';

  // Group by language
  const langStats = {};
  cards.forEach(c => {
    if (!langStats[c.lang]) {
      langStats[c.lang] = { total: 0, owned: 0 };
    }
    langStats[c.lang].total++;
    if (c.is_owned) {
      langStats[c.lang].owned++;
    }
  });

  // Sort languages by total cards descending
  const sortedLangs = Object.keys(langStats).sort((a, b) => langStats[b].total - langStats[a].total);

  // Generate languages table
  let tableMarkdown = '| Langue | Cartes Référencées | Cartes Possédées | Progression | Complété |\n';
  tableMarkdown += '| :--- | :---: | :---: | :---: | :---: |\n';

  sortedLangs.forEach(lang => {
    const info = LANG_MAP[lang] || { name: lang, flag: '🏳️' };
    const stats = langStats[lang];
    const pct = stats.total > 0 ? ((stats.owned / stats.total) * 100).toFixed(0) : '0';
    const bar = getProgressChar(parseInt(pct));
    tableMarkdown += `| ${info.flag} **${info.name}** (${lang}) | ${stats.total} | ${stats.owned} | \`${bar}\` | **${pct}%** |\n`;
  });

  // Group by set
  const setStats = {};
  cards.forEach(c => {
    if (!setStats[c.set_name]) {
      setStats[c.set_name] = { total: 0, owned: 0, year: c.year };
    }
    setStats[c.set_name].total++;
    if (c.is_owned) {
      setStats[c.set_name].owned++;
    }
  });

  // Sort sets by year ascending
  const sortedSets = Object.keys(setStats).sort((a, b) => setStats[a].year - setStats[b].year);
  
  let setTableMarkdown = '| Set / Série | Année | Cartes Référencées | Cartes Possédées | Complété |\n';
  setTableMarkdown += '| :--- | :---: | :---: | :---: | :---: |\n';
  sortedSets.forEach(set => {
    const stats = setStats[set];
    const pct = stats.total > 0 ? ((stats.owned / stats.total) * 100).toFixed(0) : '0';
    setTableMarkdown += `| 📦 **${set}** | ${stats.year} | ${stats.total} | ${stats.owned} | **${pct}%** |\n`;
  });

  const progressBar = getProgressChar(parseFloat(ownedPercent));

  // Visual Markdown output
  return `
### 📊 Progression Générale de la Collection
Voici l'état actuel de la collection physique de la **Maison de Carapuce** :

\`\`\`text
Progression : [${progressBar}] ${ownedPercent}% (${ownedCards} / ${totalCards} cartes)
\`\`\`

---

### 🌐 Répartition par Langues
<details open>
<summary><b>Cliquez pour voir les statistiques détaillées par langue</b></summary>

${tableMarkdown}
</details>

---

### 📦 Répartition par Sets & Séries
<details>
<summary><b>Cliquez pour voir les statistiques détaillées par set</b></summary>

${setTableMarkdown}
</details>

*Dernière mise à jour automatique des statistiques : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}*
`;
}

function updateReadme() {
  const cards = parseCardsFromSeed();
  if (cards.length === 0) {
    console.error('No cards parsed. Aborting README update.');
    return;
  }

  console.log(`Parsed ${cards.length} cards from seed.sql.`);

  const statsMarkdown = generateStatsMarkdown(cards);

  if (!fs.existsSync(README_PATH)) {
    console.error('README.md not found at:', README_PATH);
    return;
  }

  let readmeContent = fs.readFileSync(README_PATH, 'utf8');
  
  const startPlaceholder = '<!-- START_STATS -->';
  const endPlaceholder = '<!-- END_STATS -->';

  const startIndex = readmeContent.indexOf(startPlaceholder);
  const endIndex = readmeContent.indexOf(endPlaceholder);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find stats placeholders in README.md.');
    return;
  }

  const before = readmeContent.substring(0, startIndex + startPlaceholder.length);
  const after = readmeContent.substring(endIndex);

  const newReadmeContent = before + '\n' + statsMarkdown + '\n' + after;

  fs.writeFileSync(README_PATH, newReadmeContent, 'utf8');
  console.log('README.md updated successfully with latest statistics!');
}

updateReadme();

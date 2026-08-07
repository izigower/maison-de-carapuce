import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const currentPath = path.join(workspace, "chats", "catalogue-current.json");
const outputDir = path.join(workspace, "outputs", "019fdbac-bcf2-77a2-b3c8-0e870f4e19fc");
const imageDir = path.join(outputDir, "images-manquantes-finales");
await fs.mkdir(imageDir, { recursive: true });

const current = JSON.parse(await fs.readFile(currentPath, "utf8"));
const languages = [
  { api: "en", code: "EN", country: "INT", query: "Squirtle", label: "English" },
  { api: "fr", code: "FR", country: "FR", query: "Carapuce", label: "Français" },
  { api: "de", code: "DE", country: "DE", query: "Schiggy", label: "Deutsch" },
  { api: "es", code: "ES", country: "ES", query: "Squirtle", label: "Español" },
  { api: "it", code: "IT", country: "IT", query: "Squirtle", label: "Italiano" },
  { api: "pt", code: "PT", country: "PT/BR", query: "Squirtle", label: "Português" },
  { api: "ja", code: "JP", country: "JP", query: "ゼニガメ", label: "日本語" },
  { api: "ko", code: "KR", country: "KR", query: "꼬부기", label: "한국어" },
  { api: "zh-tw", code: "ZH-TW", country: "TW/HK", query: "傑尼龜", label: "繁體中文" },
  { api: "zh-cn", code: "ZH-CN", country: "CN", query: "杰尼龟", label: "简体中文" },
  { api: "id", code: "ID", country: "ID", query: "Squirtle", label: "Bahasa Indonesia" },
  { api: "th", code: "TH", country: "TH", query: "เซนิกาเมะ", label: "ไทย" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const response = await fetch(url, { headers: { "user-agent": "Maison-de-Carapuce research/1.0" } });
    if (response.ok) return response.json();
    if (attempt === retries) throw new Error(`${response.status} ${url}`);
    await sleep(250 * attempt);
  }
}

async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) break;
      results[index] = await task(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const clean = (value) => String(value ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const localNumber = (value) => {
  const first = String(value ?? "").split("/")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
  return first.replace(/^0+(?=\d)/, "");
};
const tcgdexAssetKey = (url) => {
  const match = String(url ?? "").match(/assets\.tcgdex\.net\/([^?]+?)(?:\/high\.webp|\/low\.webp)?(?:\?.*)?$/i);
  return match ? match[1].replace(/\/$/, "").toLowerCase() : null;
};

const currentByAsset = new Map();
for (const card of current) {
  const key = tcgdexAssetKey(card.image_url);
  if (key) {
    const list = currentByAsset.get(key) ?? [];
    list.push(card.id);
    currentByAsset.set(key, list);
  }
}

const discovered = [];
const sourceNotes = [];
const setCache = new Map();
for (const language of languages) {
  const searchUrl = `https://api.tcgdex.net/v2/${language.api}/cards?name=${encodeURIComponent(language.query)}`;
  let summaries = [];
  try {
    summaries = await fetchJson(searchUrl);
  } catch (error) {
    sourceNotes.push({ source: "TCGdex", language: language.code, url: searchUrl, status: "Erreur", note: error.message });
    continue;
  }
  sourceNotes.push({ source: "TCGdex", language: language.code, url: searchUrl, status: "OK", note: `${summaries.length} résultat(s) nommé(s)` });
  const details = await mapLimit(summaries, 8, (card) => fetchJson(`https://api.tcgdex.net/v2/${language.api}/cards/${card.id}`));
  for (const detail of details) {
    const setId = detail.set?.id ?? "";
    const setKey = `${language.api}:${setId}`;
    if (!setCache.has(setKey)) {
      setCache.set(setKey, fetchJson(`https://api.tcgdex.net/v2/${language.api}/sets/${setId}`).catch(() => null));
    }
  }
  const sets = new Map();
  for (const [key, promise] of setCache) {
    if (key.startsWith(`${language.api}:`)) sets.set(key.split(":")[1], await promise);
  }
  for (const detail of details) {
    const set = sets.get(detail.set?.id) ?? {};
    const releaseDate = set.releaseDate || set.release_date || null;
    const year = releaseDate ? Number(String(releaseDate).slice(0, 4)) : null;
    const imageUrl = detail.image ? `${detail.image}/high.webp` : null;
    const assetKey = tcgdexAssetKey(detail.image);
    let currentIds = assetKey ? (currentByAsset.get(assetKey) ?? []) : [];
    let matchMethod = currentIds.length ? "image TCGdex identique" : "";
    if (!currentIds.length) {
      const number = localNumber(detail.localId);
      const loose = current.filter((card) => card.lang === language.code && localNumber(card.card_number) === number && (!year || Number(card.year) === year));
      if (loose.length === 1) {
        currentIds = [loose[0].id];
        matchMethod = "langue + année + numéro uniques";
      } else if (loose.length > 1) {
        const setName = clean(detail.set?.name);
        const closer = loose.filter((card) => {
          const candidateSet = clean(card.set_name);
          return candidateSet.includes(setName) || setName.includes(candidateSet);
        });
        if (closer.length) {
          currentIds = closer.map((card) => card.id);
          matchMethod = "langue + année + numéro + set";
        }
      }
    }
    const serieId = String(set.serie?.id ?? set.series?.id ?? "").toLowerCase();
    const isPocket = serieId === "tcgp" || /^(a\d|p-a|b\d)/i.test(detail.set?.id ?? "");
    const variantFlags = Object.entries(detail.variants ?? {}).filter(([, value]) => value).map(([key]) => key).join(", ");
    discovered.push({
      type: "Carte nommée Carapuce",
      format: isPocket ? "Pokémon TCG Pocket (numérique)" : "Pokémon TCG physique",
      language: language.code,
      languageLabel: language.label,
      country: language.country,
      name: detail.name,
      set: detail.set?.name ?? "",
      setId: detail.set?.id ?? "",
      cardNumber: detail.localId ?? "",
      year,
      rarity: detail.rarity ?? "",
      variant: variantFlags || "non détaillée",
      note: isPocket ? "Conserver séparé du catalogue physique" : "Une ligne par dessin/langue; impressions et stamps à éclater après contrôle humain",
      source: "TCGdex",
      sourceUrl: `https://api.tcgdex.net/v2/${language.api}/cards/${detail.id}`,
      imageUrl,
      tcgdexId: detail.id,
      currentIds,
      matchMethod,
      catalogueStatus: currentIds.length ? "Déjà au catalogue" : (isPocket ? "Hors périmètre physique" : "Manquante"),
      addApproved: false,
      imageApproved: false,
      uniqueKey: `named|${language.code}|${detail.id}`,
    });
  }
}

// Known catalogue aliases/corrections that cannot be inferred from the localized set name alone.
const knownCurrentMatches = new Map([
  ["EN|2021swsh-17", ["mcd-25th-holo-EN-2021-17", "mcd-25th-EN-2021-17"]],
  ["EN|mep-039", ["mep-promo-EN-2024-39"]],
  ["JP|PMCG1-023", ["base-JP-1996-"]],
]);
for (const row of discovered) {
  const knownIds = knownCurrentMatches.get(`${row.language}|${row.tcgdexId}`);
  if (knownIds) {
    row.currentIds = knownIds;
    row.matchMethod = "alias contrôlé manuellement";
    row.catalogueStatus = "Déjà au catalogue";
    if (row.tcgdexId === "PMCG1-023") row.note += "; le numéro actuel 007 semble être le Pokédex, à corriger en 023";
    if (row.tcgdexId === "mep-039") row.note += "; l'année 2024 du catalogue actuel est à revérifier (TCGdex indique 2025)";
  }
  if (row.language === "FR" && row.tcgdexId === "mep-039" && !row.imageUrl) {
    row.imageUrl = "https://pokecardex-scans.b-cdn.net/sets/MEP/FR/39.jpg?class=hd";
    row.note += "; scan PokéCardex disponible";
  }
}

const manualCameos = [
  {
    name: "Team Rocket's Meowth", set: "Wizards Black Star Promos", cardNumber: "18", year: 2000, language: "EN", country: "US", variant: "Normal", note: "Carapuce apparaît dans l'illustration", source: "TCGdex", sourceUrl: "https://api.tcgdex.net/v2/en/cards/basep-18", imageUrl: "https://assets.tcgdex.net/en/base/basep/18/high.webp",
  },
  {
    name: "Flower Shop Lady", set: "Undaunted", cardNumber: "74/90", year: 2010, language: "EN", country: "US", variant: "Normal", note: "Caméo Carapuce; arrosoir Squirtbottle", source: "TCGdex", sourceUrl: "https://api.tcgdex.net/v2/en/cards/hgss3-74", imageUrl: "https://assets.tcgdex.net/en/hgss/hgss3/74/high.webp",
  },
  {
    name: "Chansey", set: "Hidden Fates", cardNumber: "46/68", year: 2019, language: "EN", country: "US", variant: "Normal / Reverse à confirmer", note: "Caméo Carapuce sous forme d'arrosoir", source: "TCGdex", sourceUrl: "https://api.tcgdex.net/v2/en/cards/sm115-46", imageUrl: "https://assets.tcgdex.net/en/sm/sm115/46/high.webp",
  },
  {
    name: "Misty’s Cerulean City Gym", set: "Hidden Fates", cardNumber: "61/68", year: 2019, language: "EN", country: "US", variant: "Normal / Reverse à confirmer", note: "Carapuce apparaît sur une enseigne dans l'illustration", source: "TCGdex", sourceUrl: "https://api.tcgdex.net/v2/en/cards/sm115-61", imageUrl: "https://assets.tcgdex.net/en/sm/sm115/61/high.webp",
  },
  {
    name: "Pikachu", set: "XY-P Promotional cards", cardNumber: "279/XY-P", year: 2016, language: "JP", country: "JP", variant: "Promo", note: "Caméo Carapuce", source: "PokéCardex", sourceUrl: "https://www.pokecardex.com/series/jp/XYP", imageUrl: "https://pokecardex-scans.b-cdn.net/sets_jp/XYP/279.jpg?class=hd",
  },
  {
    name: "M Sachiko-EX", set: "XY-P Promotional cards", cardNumber: "298/XY-P", year: 2016, language: "JP", country: "JP", variant: "Promo", note: "Caméo Carapuce", source: "PokéCardex", sourceUrl: "https://www.pokecardex.com/series/jp/XYP", imageUrl: "https://pokecardex-scans.b-cdn.net/sets_jp/XYP/298.jpg?class=hd",
  },
  {
    name: "Green's Exploration", set: "Tag All Stars", cardNumber: "196/173", year: 2019, language: "JP", country: "JP", variant: "SR", note: "Caméo Carapuce; illustration de référence de l'impression chinoise", source: "PokéCardex", sourceUrl: "https://www.pokecardex.com/series/jp/SM12A", imageUrl: "https://pokecardex-scans.b-cdn.net/sets_jp/SM12A/196.jpg?class=hd",
  },
  {
    name: "Exploration de Leaf / Green's Exploration", set: "Battle Party Set Reward Pack (CSMPiC)", cardNumber: "033/024", year: 2021, language: "ZH-CN", country: "CN", variant: "SR", note: "Carte signalée par l'utilisateur; caméo Carapuce; impression chinoise simplifiée distincte", source: "Quest Corner + PokéCardex", sourceUrl: "https://questcorner.fr/products/carte-pokemon-exploration-de-leaf-033-024-sr-csmpi-chinois-simplifie?variant=55944724349276", imageUrl: "https://pokecardex-scans.b-cdn.net/sets_chn/CSMPIC/33.jpg?class=hd",
  },
  {
    name: "Pikachu’s Summer Vacation", set: "CoroCoro Comic promo", cardNumber: "Unnumbered", year: 1998, language: "JP", country: "JP", variant: "Jumbo non-holo", note: "Caméo Carapuce; format jumbo", source: "Pokumon", sourceUrl: "https://pokumon.com/card/pikachus-summer-vacation-corocoro-1998-unnumbered/", imageUrl: "https://cdn6966.templcdn.com/wp-content/uploads/2021/03/JP_U047Unnumbered.jpg",
  },
  {
    name: "Pokémon Valley", set: "Bessatsu CoroCoro Comic promo", cardNumber: "Unnumbered", year: 1999, language: "JP", country: "JP", variant: "Jumbo non-holo", note: "Caméo Carapuce; format jumbo", source: "Pokumon", sourceUrl: "https://pokumon.com/card/pokemon-valley-corocoro-1999-unnumbered/", imageUrl: "https://cdn6966.templcdn.com/wp-content/uploads/2021/03/JP_U105Unnumbered.jpg",
  },
  {
    name: "Tropical Present", set: "Pokémon Card Fan Club promo", cardNumber: "Unnumbered ©2001", year: 2001, language: "JP", country: "JP", variant: "Jumbo non-holo", note: "Caméo Carapuce; format jumbo", source: "Pokumon", sourceUrl: "https://pokumon.com/card/tropical-present-pokemon-card-fan-club-2001-unnumbered/", imageUrl: "https://cdn6966.templcdn.com/wp-content/uploads/2021/03/JP_U187Unnumbered.jpg",
  },
].map((card) => {
  const key = tcgdexAssetKey(card.imageUrl);
  const currentIds = key ? (currentByAsset.get(key) ?? []) : [];
  return {
    type: "Caméo Carapuce",
    format: /jumbo/i.test(card.variant) ? "Pokémon TCG physique — Jumbo" : "Pokémon TCG physique",
    languageLabel: languages.find((item) => item.code === card.language)?.label ?? card.language,
    rarity: "",
    currentIds,
    matchMethod: currentIds.length ? "image TCGdex identique" : "",
    catalogueStatus: currentIds.length ? "Déjà au catalogue" : "Manquante",
    addApproved: false,
    imageApproved: false,
    uniqueKey: `cameo|${card.language}|${clean(card.set)}|${localNumber(card.cardNumber)}|${clean(card.variant)}`,
    ...card,
  };
});

const allRows = [...discovered, ...manualCameos];
const keyCounts = new Map();
for (const row of allRows) keyCounts.set(row.uniqueKey, (keyCounts.get(row.uniqueKey) ?? 0) + 1);
for (const row of allRows) row.duplicateKeyCount = keyCounts.get(row.uniqueKey);

function safeFilename(row, index) {
  const stem = `${String(index + 1).padStart(3, "0")}_${row.language}_${row.set}_${row.cardNumber}_${row.name}`
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").slice(0, 150);
  return stem.replace(/^-|-$/g, "") || `image-${index + 1}`;
}

const missingRows = allRows.filter((row) => row.catalogueStatus === "Manquante");
await mapLimit(missingRows, 6, async (row, index) => {
  if (!row.imageUrl) {
    row.imageDownloadStatus = "Image non trouvée";
    return;
  }
  try {
    const response = await fetch(row.imageUrl, { headers: { "user-agent": "Mozilla/5.0 Maison-de-Carapuce/1.0" } });
    const contentType = response.headers.get("content-type") ?? "";
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!response.ok || !contentType.startsWith("image/") || bytes.length < 2000) {
      throw new Error(`HTTP ${response.status}, ${contentType || "type inconnu"}, ${bytes.length} octets`);
    }
    const extension = contentType.includes("webp") ? "webp" : contentType.includes("png") ? "png" : "jpg";
    const filename = `${safeFilename(row, index)}.${extension}`;
    await fs.writeFile(path.join(imageDir, filename), bytes);
    row.localImage = path.join(imageDir, filename);
    row.imageDownloadStatus = `Téléchargée (${bytes.length} octets)`;
    row.imageApproved = false;
  } catch (error) {
    row.imageDownloadStatus = `Échec: ${error.message}`;
  }
});

const duplicateCurrentIds = [];
const idMap = new Map();
for (const card of current) {
  const list = idMap.get(card.id) ?? [];
  list.push(card);
  idMap.set(card.id, list);
}
for (const [key, cards] of idMap) if (cards.length > 1) duplicateCurrentIds.push({ key, ids: cards.map((card) => card.id), reason: "ID exact dupliqué" });

const identityMap = new Map();
for (const card of current) {
  const key = [card.lang, clean(card.set_name), localNumber(card.card_number), clean(card.variant), card.year].join("|");
  const list = identityMap.get(key) ?? [];
  list.push(card);
  identityMap.set(key, list);
}
const duplicateCurrentIdentity = [];
for (const [key, cards] of identityMap) {
  if (cards.length > 1) duplicateCurrentIdentity.push({
    key,
    ids: cards.map((card) => card.id),
    notes: cards.map((card) => card.note),
    reason: "Même langue/set/numéro/variante/année; les notes semblent porter la vraie sous-variante",
  });
}

const currentDigital = current.filter((card) => /^(A\d|P-A)-/i.test(card.id) || /tcgp/i.test(card.source_url ?? ""));
const currentBrokenImages = current.filter((card) =>
  card.pipeline_checks?.image_exists?.pass === false || card.pipeline_checks?.image_size?.pass === false
);
const summary = {
  generatedAt: new Date().toISOString(),
  currentCount: current.length,
  currentLanguages: Object.fromEntries(Object.entries(current.reduce((acc, card) => { acc[card.lang] = (acc[card.lang] ?? 0) + 1; return acc; }, {})).sort()),
  currentMissingImages: current.filter((card) => !card.image_url).length,
  currentNeedsImageVerification: current.filter((card) => card.image_needs_verification).length,
  namedRows: discovered.length,
  namedMissingPhysical: discovered.filter((row) => row.catalogueStatus === "Manquante" && row.format === "Pokémon TCG physique").length,
  namedPocketSeparate: discovered.filter((row) => row.format.includes("Pocket")).length,
  cameoRows: manualCameos.length,
  cameoMissing: manualCameos.filter((row) => row.catalogueStatus === "Manquante").length,
  missingRows: missingRows.length,
  missingRowsWithDownloadedImage: missingRows.filter((row) => row.localImage).length,
  missingRowsWithoutDownloadedImage: missingRows.filter((row) => !row.localImage).length,
  currentDigitalCount: currentDigital.length,
  currentBrokenImageCount: currentBrokenImages.length,
};

const payload = {
  summary,
  rows: allRows,
  current,
  audits: {
    duplicateCurrentIds,
    duplicateCurrentIdentity,
    currentDigital,
    currentBrokenImages,
  },
  sourceNotes,
};
await fs.writeFile(path.join(outputDir, "recherche-carapuce.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));

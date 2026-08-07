import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workspace = "C:/Users/hugob/Documents/Projet codage perso/maison-de-carapuce";
const outputDir = path.join(workspace, "outputs", "019fdbac-bcf2-77a2-b3c8-0e870f4e19fc");
const data = JSON.parse(await fs.readFile(path.join(outputDir, "recherche-carapuce.json"), "utf8"));
await fs.mkdir(path.join(outputDir, "previews"), { recursive: true });

const colors = {
  cream: "#F3EFE7",
  paper: "#FBF8F1",
  ink: "#1A1F2C",
  inkSoft: "#5A5E6A",
  water: "#2A4A6E",
  gold: "#A07A3A",
  green: "#2A6A4A",
  red: "#A8485A",
  purple: "#7A4A8A",
  paleBlue: "#DDE8F0",
  paleGreen: "#DDECE4",
  paleRed: "#F3DEE2",
  paleGold: "#EEE3CF",
  line: "#D5CFC4",
};

const workbook = Workbook.create();
const summarySheet = workbook.worksheets.add("Synthèse");
const candidatesSheet = workbook.worksheets.add("Candidats");
const imagesSheet = workbook.worksheets.add("À trouver images");
const pocketSheet = workbook.worksheets.add("Pocket séparé");
const currentSheet = workbook.worksheets.add("Catalogue actuel");
const auditSheet = workbook.worksheets.add("Audit doublons");
const sourcesSheet = workbook.worksheets.add("Sources");

function paintTitle(sheet, title, subtitle, endColumn) {
  sheet.showGridLines = false;
  sheet.getRange(`A1:${endColumn}1`).merge();
  sheet.getRange("A1").values = [[title]];
  sheet.getRange(`A1:${endColumn}1`).format = {
    fill: colors.ink,
    font: { bold: true, color: colors.paper, size: 20 },
    verticalAlignment: "center",
  };
  sheet.getRange(`A1:${endColumn}1`).format.rowHeight = 32;
  sheet.getRange(`A2:${endColumn}2`).merge();
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange(`A2:${endColumn}2`).format = {
    fill: colors.cream,
    font: { italic: true, color: colors.inkSoft, size: 10 },
    wrapText: true,
    verticalAlignment: "center",
    borders: { bottom: { style: "thin", color: colors.gold } },
  };
  sheet.getRange(`A2:${endColumn}2`).format.rowHeight = 30;
}

function styleHeader(range) {
  range.format = {
    fill: colors.water,
    font: { bold: true, color: "#FFFFFF", size: 10 },
    verticalAlignment: "center",
    wrapText: true,
    borders: { bottom: { style: "medium", color: colors.ink } },
  };
  range.format.rowHeight = 28;
}

function addDataTable(sheet, rangeAddress, name) {
  const table = sheet.tables.add(rangeAddress, true, name);
  table.style = "TableStyleMedium2";
  table.showBandedRows = true;
  table.showFilterButton = true;
  return table;
}

function setWidths(sheet, lastRow, widths) {
  for (const [column, width] of Object.entries(widths)) {
    sheet.getRange(`${column}1:${column}${lastRow}`).format.columnWidth = width;
  }
}

function applyCheckboxValidation(range) {
  range.dataValidation = { rule: { type: "list", values: ["☐", "☑"] } };
  range.conditionalFormats.add("containsText", { text: "☑", format: { fill: colors.paleGreen, font: { bold: true, color: colors.green } } });
  range.conditionalFormats.add("containsText", { text: "☐", format: { fill: colors.paleGold, font: { color: colors.gold } } });
}

const missingCandidates = data.rows
  .filter((row) => row.catalogueStatus === "Manquante")
  .sort((a, b) => `${a.type}|${a.language}|${a.year ?? 9999}|${a.set}|${a.cardNumber}`.localeCompare(`${b.type}|${b.language}|${b.year ?? 9999}|${b.set}|${b.cardNumber}`, "fr"));
const candidateHeaders = [
  "Clé anti-doublon", "Type", "Format", "Langue", "Pays", "Nom de la carte", "Set / série", "Année", "Numéro", "Rareté",
  "Variantes indiquées", "Statut catalogue", "Image récupérée", "Validation image", "Validation ajout BDD", "Source", "Lien source",
  "Lien image", "Fichier local", "Note de recherche", "Occurrences de la clé",
];
const candidateRows = missingCandidates.map((row) => [
  row.uniqueKey, row.type, row.format, row.language, row.country, row.name, row.set, row.year, row.cardNumber, row.rarity,
  row.variant, row.catalogueStatus, row.localImage ? "Oui" : "Non", "☐", "☐", row.source, row.sourceUrl, row.imageUrl,
  row.localImage, row.note, row.duplicateKeyCount,
]);
paintTitle(candidatesSheet, "Candidats manquants — Maison de Carapuce", "Une ligne par dessin/langue. Ne pas importer automatiquement avant validation des impressions, stamps et variantes.", "U");
candidatesSheet.getRange("A4:U4").merge();
candidatesSheet.getRange("A4").values = [["☐ = à contrôler · ☑ = validé manuellement · les liens et chemins d’image restent auditables"]];
candidatesSheet.getRange("A4:U4").format = { fill: colors.paleGold, font: { color: colors.ink, size: 10 }, verticalAlignment: "center" };
candidatesSheet.getRange("A5:U5").values = [candidateHeaders];
candidatesSheet.getRange(`A6:U${candidateRows.length + 5}`).values = candidateRows;
styleHeader(candidatesSheet.getRange("A5:U5"));
candidatesSheet.freezePanes.freezeRows(5);
candidatesSheet.freezePanes.freezeColumns(6);
addDataTable(candidatesSheet, `A5:U${candidateRows.length + 5}`, "CandidatesTable");
applyCheckboxValidation(candidatesSheet.getRange(`N6:O${candidateRows.length + 5}`));
candidatesSheet.getRange(`M6:M${candidateRows.length + 5}`).conditionalFormats.add("containsText", { text: "Oui", format: { fill: colors.paleGreen, font: { color: colors.green } } });
candidatesSheet.getRange(`M6:M${candidateRows.length + 5}`).conditionalFormats.add("containsText", { text: "Non", format: { fill: colors.paleRed, font: { bold: true, color: colors.red } } });
candidatesSheet.getRange(`U6:U${candidateRows.length + 5}`).conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 1, format: { fill: colors.paleRed, font: { bold: true, color: colors.red } } });
candidatesSheet.getRange(`A6:U${candidateRows.length + 5}`).format.verticalAlignment = "top";
candidatesSheet.getRange(`F6:G${candidateRows.length + 5}`).format.wrapText = true;
candidatesSheet.getRange(`T6:T${candidateRows.length + 5}`).format.wrapText = true;
candidatesSheet.getRange(`H6:H${candidateRows.length + 5}`).format.numberFormat = "0";
setWidths(candidatesSheet, candidateRows.length + 5, { A: 34, B: 22, C: 26, D: 9, E: 10, F: 26, G: 30, H: 9, I: 14, J: 15, K: 24, L: 18, M: 14, N: 15, O: 17, P: 16, Q: 42, R: 42, S: 42, T: 50, U: 12 });

const imageMissingRows = missingCandidates.filter((row) => !row.localImage).map((row) => [
  row.uniqueKey, row.language, row.name, row.set, row.year, row.cardNumber, row.variant, row.sourceUrl, row.imageUrl || "", "☐", "☐", row.note,
]);
paintTitle(imagesSheet, "Images restant à récupérer", "Checklist manuelle demandée : ouvre le lien source, enregistre le bon recto, puis coche les deux validations.", "L");
imagesSheet.getRange("A4:L4").merge();
imagesSheet.getRange("A4").values = [["Conseil : nommer l’image avec la clé anti-doublon de la colonne A pour éviter les collisions."]];
imagesSheet.getRange("A4:L4").format = { fill: colors.paleRed, font: { color: colors.red, bold: true }, wrapText: true };
const imageHeaders = ["Clé anti-doublon", "Langue", "Nom", "Set / série", "Année", "Numéro", "Variante", "Lien où la carte a été vue", "Lien image candidat", "Image enregistrée", "Bonne image confirmée", "Note"];
imagesSheet.getRange("A5:L5").values = [imageHeaders];
imagesSheet.getRange(`A6:L${imageMissingRows.length + 5}`).values = imageMissingRows;
styleHeader(imagesSheet.getRange("A5:L5"));
imagesSheet.freezePanes.freezeRows(5);
imagesSheet.freezePanes.freezeColumns(4);
addDataTable(imagesSheet, `A5:L${imageMissingRows.length + 5}`, "MissingImagesTable");
applyCheckboxValidation(imagesSheet.getRange(`J6:K${imageMissingRows.length + 5}`));
imagesSheet.getRange(`C6:D${imageMissingRows.length + 5}`).format.wrapText = true;
imagesSheet.getRange(`L6:L${imageMissingRows.length + 5}`).format.wrapText = true;
setWidths(imagesSheet, imageMissingRows.length + 5, { A: 34, B: 9, C: 24, D: 30, E: 9, F: 14, G: 24, H: 50, I: 42, J: 18, K: 20, L: 50 });

const pocketRows = data.rows
  .filter((row) => row.format?.includes("Pocket"))
  .sort((a, b) => `${a.language}|${a.year}|${a.set}|${a.cardNumber}`.localeCompare(`${b.language}|${b.year}|${b.set}|${b.cardNumber}`, "fr"))
  .map((row) => [row.uniqueKey, row.language, row.name, row.set, row.year, row.cardNumber, row.catalogueStatus, row.currentIds?.join(", "), row.sourceUrl, row.imageUrl, row.note]);
paintTitle(pocketSheet, "Pokémon TCG Pocket — séparé du physique", "Ces entrées numériques ne doivent pas partager la même clé ni le même total que les cartes physiques imprimées.", "K");
const pocketHeaders = ["Clé", "Langue", "Nom", "Set", "Année", "Numéro", "Statut", "ID actuel éventuel", "Source", "Image", "Note"];
pocketSheet.getRange("A5:K5").values = [pocketHeaders];
pocketSheet.getRange(`A6:K${pocketRows.length + 5}`).values = pocketRows;
styleHeader(pocketSheet.getRange("A5:K5"));
pocketSheet.freezePanes.freezeRows(5);
addDataTable(pocketSheet, `A5:K${pocketRows.length + 5}`, "PocketTable");
pocketSheet.getRange(`G6:G${pocketRows.length + 5}`).conditionalFormats.add("containsText", { text: "Déjà", format: { fill: colors.paleRed, font: { bold: true, color: colors.red } } });
pocketSheet.getRange(`K6:K${pocketRows.length + 5}`).format.wrapText = true;
setWidths(pocketSheet, pocketRows.length + 5, { A: 30, B: 9, C: 22, D: 28, E: 9, F: 14, G: 22, H: 30, I: 45, J: 42, K: 46 });

const ambiguousIds = new Set(data.audits.duplicateCurrentIdentity.flatMap((item) => item.ids));
const digitalIds = new Set(data.audits.currentDigital.map((card) => card.id));
const brokenIds = new Set(data.audits.currentBrokenImages.map((card) => card.id));
const currentRows = [...data.current]
  .sort((a, b) => `${a.lang}|${a.year}|${a.set_name}|${a.card_number}|${a.variant}`.localeCompare(`${b.lang}|${b.year}|${b.set_name}|${b.card_number}|${b.variant}`, "fr"))
  .map((card) => {
    const imageState = !card.image_url ? "Absente" : brokenIds.has(card.id) ? "Cassée" : card.image_needs_verification ? "À vérifier" : "OK";
    const audit = [];
    if (digitalIds.has(card.id)) audit.push("TCG Pocket mêlé au physique");
    if (ambiguousIds.has(card.id)) audit.push("Sous-variante stockée dans la note");
    if (brokenIds.has(card.id)) audit.push("Contrôle image en échec");
    return [
      card.id, card.lang, card.country, card.set_name, card.year, card.card_number, card.rarity, card.variant, card.note,
      imageState, card.pipeline_status, card.source, card.source_url, card.image_url, card.is_owned ? "Oui" : "Non", audit.join(" · "),
    ];
  });
paintTitle(currentSheet, "Catalogue actuel — photographie au 7 août 2026", "Extraction en lecture seule du catalogue public : 160 lignes. Les anomalies sont signalées, rien n’a été modifié en base.", "P");
const currentHeaders = ["ID", "Langue", "Pays", "Set", "Année", "Numéro", "Rareté", "Variante", "Note", "État image", "Pipeline", "Source", "Lien source", "Lien image", "Possédée", "Audit"];
currentSheet.getRange("A5:P5").values = [currentHeaders];
currentSheet.getRange(`A6:P${currentRows.length + 5}`).values = currentRows;
styleHeader(currentSheet.getRange("A5:P5"));
currentSheet.freezePanes.freezeRows(5);
currentSheet.freezePanes.freezeColumns(4);
addDataTable(currentSheet, `A5:P${currentRows.length + 5}`, "CurrentCatalogueTable");
for (const [text, fill, font] of [["OK", colors.paleGreen, colors.green], ["Absente", colors.paleRed, colors.red], ["Cassée", colors.paleRed, colors.red], ["À vérifier", colors.paleGold, colors.gold]]) {
  currentSheet.getRange(`J6:J${currentRows.length + 5}`).conditionalFormats.add("containsText", { text, format: { fill, font: { color: font, bold: text !== "OK" } } });
}
currentSheet.getRange(`P6:P${currentRows.length + 5}`).conditionalFormats.add("notContainsBlanks", { format: { fill: colors.paleRed, font: { color: colors.red } } });
currentSheet.getRange(`D6:D${currentRows.length + 5}`).format.wrapText = true;
currentSheet.getRange(`I6:I${currentRows.length + 5}`).format.wrapText = true;
currentSheet.getRange(`P6:P${currentRows.length + 5}`).format.wrapText = true;
setWidths(currentSheet, currentRows.length + 5, { A: 32, B: 9, C: 9, D: 32, E: 9, F: 14, G: 18, H: 20, I: 44, J: 14, K: 14, L: 14, M: 42, N: 42, O: 11, P: 42 });

const auditRows = [];
for (const group of data.audits.duplicateCurrentIdentity) {
  auditRows.push(["Clé anti-doublon ambiguë", "Haute", group.ids.join(", "), "EN", group.key.split("|")[1], group.key.split("|")[4], group.key.split("|")[2], group.reason, "Conserver les lignes, mais déplacer Staff/Champion/Finalist/etc. de note vers un champ sous_variante ou stamp"]);
}
for (const card of data.audits.currentDigital) {
  auditRows.push(["Pocket mélangé au physique", "Haute", card.id, card.lang, card.set_name, card.year, card.card_number, "Carte numérique TCG Pocket dans le même catalogue que les impressions physiques", "Déplacer vers une table/collection format=tcg_pocket"]);
}
for (const card of data.audits.currentBrokenImages) {
  auditRows.push(["Image absente ou cassée", "Moyenne", card.id, card.lang, card.set_name, card.year, card.card_number, card.pipeline_checks?.image_exists?.reason || card.pipeline_checks?.image_size?.reason || "Contrôle image en échec", "Remplacer l’URL et valider visuellement la langue et la variante"]);
}
auditRows.push(["Métadonnée à corriger", "Haute", "base-JP-1996-", "JP", "Expansion Pack", 1996, "007 → 023", "007 semble être le numéro Pokédex; TCGdex et les checklists indiquent 023 pour la carte", "Vérifier le scan puis corriger card_number en 023"]);
auditRows.push(["Métadonnée à vérifier", "Moyenne", "mep-promo-EN-2024-39", "EN", "MEP Black Star Promos", 2024, "039", "TCGdex date l’entrée de 2025; certaines fiches commerciales l’appellent 2026", "Conserver une date de sortie officielle par région, pas l’année d’achat"]);
paintTitle(auditSheet, "Audit anti-doublon et qualité", "Les groupes ci-dessous sont des anomalies à traiter, pas des suppressions automatiques.", "I");
const auditHeaders = ["Catégorie", "Priorité", "ID concerné(s)", "Langue", "Set", "Année", "Numéro", "Constat", "Action proposée"];
auditSheet.getRange("A5:I5").values = [auditHeaders];
auditSheet.getRange(`A6:I${auditRows.length + 5}`).values = auditRows;
styleHeader(auditSheet.getRange("A5:I5"));
auditSheet.freezePanes.freezeRows(5);
addDataTable(auditSheet, `A5:I${auditRows.length + 5}`, "AuditTable");
auditSheet.getRange(`B6:B${auditRows.length + 5}`).conditionalFormats.add("containsText", { text: "Haute", format: { fill: colors.paleRed, font: { bold: true, color: colors.red } } });
auditSheet.getRange(`B6:B${auditRows.length + 5}`).conditionalFormats.add("containsText", { text: "Moyenne", format: { fill: colors.paleGold, font: { color: colors.gold } } });
auditSheet.getRange(`C6:C${auditRows.length + 5}`).format.wrapText = true;
auditSheet.getRange(`H6:I${auditRows.length + 5}`).format.wrapText = true;
setWidths(auditSheet, auditRows.length + 5, { A: 28, B: 12, C: 44, D: 9, E: 32, F: 9, G: 15, H: 58, I: 58 });

const extraSources = [
  ["Catalogue public", "Toutes", "https://maison-de-carapuce.vercel.app/catalogue", "Extraction du catalogue actuel", "160 lignes au 2026-08-07"],
  ["Bulbapedia", "EN/JP", "https://bulbapedia.bulbagarden.net/wiki/Squirtle_(TCG)", "Liste des dessins de cartes nommées Squirtle", "Base de contrôle, pas une liste de toutes les variantes régionales"],
  ["TCGdex", "Multilingue", "https://tcgdex.dev/", "API de cartes, sets et images localisées", "Couverture variable selon la langue; zéro résultat ne prouve pas l'absence"],
  ["RotomAmiti via Scribd", "EN + exclusivités", "https://www.scribd.com/document/909814191/RotomAmiti-s-Cameo-Pokemon-Card-Database", "Base de caméos, mise à jour 2025-08-11", "Source secondaire; vérification carte par carte effectuée via TCGdex/PokéCardex/Pokumon"],
  ["Elite Fourum", "EN", "https://www.elitefourum.com/t/list-of-all-pokemon-tcg-cameos-english/31105", "Liste communautaire de caméos anglais", "Confirme notamment 10 caméos anglais historiques"],
  ["Quest Corner", "ZH-CN", "https://questcorner.fr/products/carte-pokemon-exploration-de-leaf-033-024-sr-csmpi-chinois-simplifie?variant=55944724349276", "Signalement Exploration de Leaf 033/024", "Page commerciale; identité recoupée avec PokéCardex"],
  ["PokéCardex", "ZH-CN", "https://www.pokecardex.com/series/chn/CSMPIC", "Battle Party Set Reward Pack / CSMPiC", "Image du 033/024 récupérée"],
  ["PokéCardex", "JP", "https://www.pokecardex.com/series/jp/XYP", "Promos XY-P 279 et 298", "Images récupérées"],
  ["PokéCardex", "JP", "https://www.pokecardex.com/series/jp/SM12A", "Tag All Stars 196/173", "Image récupérée"],
  ["Pokumon", "JP", "https://pokumon.com/card/pikachus-summer-vacation-corocoro-1998-unnumbered/", "Jumbo Pikachu’s Summer Vacation", "Image récupérée"],
  ["Pokumon", "JP", "https://pokumon.com/card/pokemon-valley-corocoro-1999-unnumbered/", "Jumbo Pokémon Valley", "Image récupérée"],
  ["Pokumon", "JP", "https://pokumon.com/card/tropical-present-pokemon-card-fan-club-2001-unnumbered/", "Jumbo Tropical Present ©2001", "Image récupérée"],
];
const sourceRows = [
  ...data.sourceNotes.map((item) => [item.source, item.language, item.url, "Recherche par nom localisé", `${item.status} — ${item.note}`]),
  ...extraSources,
];
paintTitle(sourcesSheet, "Sources et couverture", "URLs en clair pour que chaque ligne du tableau puisse être auditée ou actualisée.", "E");
const sourceHeaders = ["Source", "Langue / région", "URL", "Utilisation", "Limite / résultat"];
sourcesSheet.getRange("A5:E5").values = [sourceHeaders];
sourcesSheet.getRange(`A6:E${sourceRows.length + 5}`).values = sourceRows;
styleHeader(sourcesSheet.getRange("A5:E5"));
sourcesSheet.freezePanes.freezeRows(5);
addDataTable(sourcesSheet, `A5:E${sourceRows.length + 5}`, "SourcesTable");
sourcesSheet.getRange(`D6:E${sourceRows.length + 5}`).format.wrapText = true;
setWidths(sourcesSheet, sourceRows.length + 5, { A: 24, B: 16, C: 62, D: 50, E: 60 });

paintTitle(summarySheet, "Recherche mondiale des cartes Carapuce", "État au 7 août 2026 · cartes physiques nommées Carapuce et caméos · TCG Pocket isolé", "H");
summarySheet.getRange("A4:H4").merge();
summarySheet.getRange("A4").values = [["Résultat : une base de travail dédupliquée et vérifiable, pas une promesse d’exhaustivité absolue — les bases asiatiques restent incomplètes et de nouvelles promotions paraissent régulièrement."]];
summarySheet.getRange("A4:H4").format = { fill: colors.paleGold, font: { color: colors.ink, bold: true, size: 10 }, wrapText: true, verticalAlignment: "center" };
summarySheet.getRange("A4:H4").format.rowHeight = 38;

const candidateLast = candidateRows.length + 5;
const currentLast = currentRows.length + 5;
const pocketLast = pocketRows.length + 5;
const cards = [
  ["Catalogue actuel", `=COUNTA('Catalogue actuel'!A6:A${currentLast})`, colors.water],
  ["Candidats physiques manquants", `=COUNTA('Candidats'!A6:A${candidateLast})`, colors.gold],
  ["Images récupérées", `=COUNTIF('Candidats'!M6:M${candidateLast},"Oui")`, colors.green],
  ["Images à trouver", `=COUNTIF('Candidats'!M6:M${candidateLast},"Non")`, colors.red],
];
for (let i = 0; i < cards.length; i += 1) {
  const startCol = String.fromCharCode(65 + i * 2);
  const valueCol = String.fromCharCode(66 + i * 2);
  summarySheet.getRange(`${startCol}6:${valueCol}6`).merge();
  summarySheet.getRange(`${startCol}6`).values = [[cards[i][0]]];
  summarySheet.getRange(`${startCol}7:${valueCol}8`).merge();
  summarySheet.getRange(`${startCol}7`).formulas = [[cards[i][1]]];
  summarySheet.getRange(`${startCol}6:${valueCol}8`).format = { fill: colors.paper, borders: { preset: "outside", style: "medium", color: cards[i][2] }, verticalAlignment: "center" };
  summarySheet.getRange(`${startCol}6:${valueCol}6`).format.font = { bold: true, color: colors.inkSoft, size: 10 };
  summarySheet.getRange(`${startCol}7:${valueCol}8`).format.font = { bold: true, color: cards[i][2], size: 22 };
  summarySheet.getRange(`${startCol}7:${valueCol}8`).format.horizontalAlignment = "center";
}

summarySheet.getRange("A10:H10").values = [["Cartes nommées", null, "Caméos", null, "Pocket séparé", null, "Images actuelles cassées", null]];
for (const cell of ["A10:B10", "C10:D10", "E10:F10", "G10:H10"]) summarySheet.getRange(cell).merge();
for (const cell of ["A11:B12", "C11:D12", "E11:F12", "G11:H12"]) summarySheet.getRange(cell).merge();
summarySheet.getRange("A11").formulas = [[`=COUNTIF('Candidats'!B6:B${candidateLast},"Carte nommée Carapuce")`]];
summarySheet.getRange("C11").formulas = [[`=COUNTIF('Candidats'!B6:B${candidateLast},"Caméo Carapuce")`]];
summarySheet.getRange("E11").formulas = [[`=COUNTA('Pocket séparé'!A6:A${pocketLast})`]];
summarySheet.getRange("G11").formulas = [[`=COUNTIF('Catalogue actuel'!J6:J${currentLast},"Cassée")`]];
summarySheet.getRange("A10:H10").format = { fill: colors.water, font: { bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", wrapText: true };
for (const cell of ["A11:B12", "C11:D12", "E11:F12", "G11:H12"]) summarySheet.getRange(cell).format = { fill: colors.paleBlue, font: { bold: true, color: colors.water, size: 18 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "outside", style: "thin", color: colors.line } };

summarySheet.getRange("A14:D14").values = [["Langue", "Déjà au catalogue", "Candidats manquants", "Images à trouver"]];
styleHeader(summarySheet.getRange("A14:D14"));
const summaryLanguages = ["EN", "FR", "DE", "ES", "IT", "PT", "JP", "KR", "ZH-CN", "ZH-TW", "ID", "TH"];
summarySheet.getRange(`A15:A${14 + summaryLanguages.length}`).values = summaryLanguages.map((language) => [language]);
for (let index = 0; index < summaryLanguages.length; index += 1) {
  const row = 15 + index;
  summarySheet.getRange(`B${row}`).formulas = [[`=COUNTIF('Catalogue actuel'!B6:B${currentLast},A${row})`]];
  summarySheet.getRange(`C${row}`).formulas = [[`=COUNTIF('Candidats'!D6:D${candidateLast},A${row})`]];
  summarySheet.getRange(`D${row}`).formulas = [[`=COUNTIFS('Candidats'!D6:D${candidateLast},A${row},'Candidats'!M6:M${candidateLast},"Non")`]];
}
addDataTable(summarySheet, `A14:D${14 + summaryLanguages.length}`, "LanguageSummaryTable");
summarySheet.getRange(`B15:D${14 + summaryLanguages.length}`).format.numberFormat = "0";
summarySheet.getRange("F14:H14").merge();
summarySheet.getRange("F14").values = [["Règle anti-doublon recommandée"]];
summarySheet.getRange("F14:H14").format = { fill: colors.gold, font: { bold: true, color: "#FFFFFF" }, horizontalAlignment: "center" };
summarySheet.getRange("F15:H22").merge();
summarySheet.getRange("F15").values = [["Clé de dessin : type + langue + identifiant TCGdex (ou set + numéro pour les exclusivités).\n\nClé d’impression : clé de dessin + finition + stamp + édition + distribution.\n\nNe jamais utiliser le nom seul. Les variantes Staff/Champion/Finalist doivent quitter le champ note et devenir une sous-variante structurée."]];
summarySheet.getRange("F15:H22").format = { fill: colors.paper, font: { color: colors.ink, size: 11 }, wrapText: true, verticalAlignment: "top", borders: { preset: "outside", style: "thin", color: colors.gold } };
summarySheet.getRange("F24:H24").merge();
summarySheet.getRange("F24").values = [["Périmètre et limites"]];
summarySheet.getRange("F24:H24").format = { fill: colors.inkSoft, font: { bold: true, color: "#FFFFFF" }, horizontalAlignment: "center" };
summarySheet.getRange("F25:H29").merge();
summarySheet.getRange("F25").values = [["Inclus : cartes Pokémon TCG physiques, cartes nommées Carapuce, caméos documentés et jumbos.\nSéparé : Pokémon TCG Pocket.\nNon traité dans ce lot : Topps, Carddass, stickers, cartes de jeux non-TCG et reproductions.\nCouverture KR et ZH-CN : recherche manuelle à poursuivre, car TCGdex renvoie zéro résultat par nom localisé."]];
summarySheet.getRange("F25:H29").format = { fill: colors.cream, font: { color: colors.inkSoft, size: 10 }, wrapText: true, verticalAlignment: "top", borders: { preset: "outside", style: "thin", color: colors.line } };
summarySheet.freezePanes.freezeRows(4);
setWidths(summarySheet, 30, { A: 18, B: 16, C: 22, D: 17, E: 4, F: 22, G: 22, H: 22 });

const summaryInspect = await workbook.inspect({ kind: "table", range: "Synthèse!A1:H29", include: "values,formulas", tableMaxRows: 30, tableMaxCols: 8 });
console.log(summaryInspect.ndjson);
const errorInspect = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
console.log(errorInspect.ndjson);

const previewRanges = {
  "Synthèse": "A1:H29",
  "Candidats": `A1:U${Math.min(candidateLast, 24)}`,
  "À trouver images": `A1:L${Math.min(imageMissingRows.length + 5, 20)}`,
  "Pocket séparé": `A1:K${Math.min(pocketLast, 24)}`,
  "Catalogue actuel": `A1:P24`,
  "Audit doublons": `A1:I24`,
  "Sources": `A1:E${Math.min(sourceRows.length + 5, 24)}`,
};
for (const [sheetName, range] of Object.entries(previewRanges)) {
  const preview = await workbook.render({ sheetName, range, scale: 1.25, format: "png" });
  const filename = sheetName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  await fs.writeFile(path.join(outputDir, "previews", `${filename}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
const workbookPath = path.join(outputDir, "recherche-cartes-carapuce-2026-08-07.xlsx");
await output.save(workbookPath);
console.log(JSON.stringify({ workbookPath, sheets: Object.keys(previewRanges), candidates: candidateRows.length, imagesMissing: imageMissingRows.length }));

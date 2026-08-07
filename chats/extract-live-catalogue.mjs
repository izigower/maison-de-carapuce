import fs from "node:fs/promises";

const inputPath = new URL("./catalogue-live.html", import.meta.url);
const outputPath = new URL("./catalogue-current.json", import.meta.url);
const html = await fs.readFile(inputPath, "utf8");

const chunks = [];
const scriptPattern = /self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g;
for (const match of html.matchAll(scriptPattern)) {
  try {
    const payload = JSON.parse(match[1]);
    if (payload[0] === 1 && typeof payload[1] === "string") chunks.push(payload[1]);
  } catch {
    // Ignore non-JSON script payloads.
  }
}

const rsc = chunks.join("");
const marker = '{"cards":[';
const markerIndex = rsc.indexOf(marker);
if (markerIndex < 0) throw new Error("Catalogue cards payload not found");

const arrayStart = markerIndex + marker.length - 1;
let depth = 0;
let inString = false;
let escaped = false;
let arrayEnd = -1;
for (let index = arrayStart; index < rsc.length; index += 1) {
  const char = rsc[index];
  if (inString) {
    if (escaped) escaped = false;
    else if (char === "\\") escaped = true;
    else if (char === '"') inString = false;
    continue;
  }
  if (char === '"') inString = true;
  else if (char === "[") depth += 1;
  else if (char === "]") {
    depth -= 1;
    if (depth === 0) {
      arrayEnd = index + 1;
      break;
    }
  }
}

if (arrayEnd < 0) throw new Error("Catalogue cards array is incomplete");
const cards = JSON.parse(rsc.slice(arrayStart, arrayEnd));
await fs.writeFile(outputPath, `${JSON.stringify(cards, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ cards: cards.length, output: outputPath.pathname }));

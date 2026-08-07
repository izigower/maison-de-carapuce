#!/usr/bin/env node
/**
 * Récupère au navigateur les images que curl ne peut pas obtenir.
 *
 *   node scripts/capturer-images.mjs /tmp/verif/a-capturer.txt
 *
 * Certains hôtes (Bulbagarden en tête) renvoient 403 à tout client qui n'est
 * pas un vrai navigateur : l'image existe, mais un hotlink direct est refusé.
 * On passe donc par Chrome, et on écrit le résultat dans public/captures/
 * pour que le site les serve lui-même au lieu de dépendre d'un hôte hostile.
 *
 * Chaque fichier est vérifié après écriture (signature + dimensions) : une
 * page d'erreur déguisée en .jpg ne doit pas passer pour une image.
 */

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'captures');

// Puppeteer est installé globalement : on résout depuis là.
const require = createRequire(import.meta.url);
let puppeteer;
for (const p of ['puppeteer', '/usr/lib/node_modules/puppeteer', '/usr/local/lib/node_modules/puppeteer']) {
  try { puppeteer = require(p); break; } catch { /* essai suivant */ }
}
if (!puppeteer) {
  console.error('puppeteer introuvable. Essaie : npm i -g puppeteer');
  process.exit(1);
}

const liste = process.argv[2] ?? '/tmp/verif/a-capturer.txt';
const urls = readFileSync(liste, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);

/** Nom de fichier stable et court, dérivé de l'URL. */
function nomFichier(url, ext) {
  const h = createHash('sha1').update(url).digest('hex').slice(0, 12);
  const base = decodeURIComponent(url.split('/').pop() ?? '')
    .replace(/\?.*$/, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFD').replace(/\p{M}+/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60).toLowerCase();
  return `${base || 'img'}-${h}.${ext}`;
}

/** Une image valide décode et fait plus de 40px de côté. */
function valider(chemin) {
  try {
    const out = execFileSync('identify', ['-format', '%m %w %h', chemin], { encoding: 'utf8' });
    const [format, w, h] = out.trim().split(/\s+/);
    if (Number(w) < 40 || Number(h) < 40) return { ok: false, raison: `trop petite (${w}x${h})` };
    return { ok: true, format, w: Number(w), h: Number(h) };
  } catch {
    return { ok: false, raison: 'ne décode pas comme une image' };
  }
}

mkdirSync(OUT, { recursive: true });

const navigateur = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const resultats = [];

try {
  const page = await navigateur.newPage();
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  for (const [i, url] of urls.entries()) {
    const etiquette = `[${i + 1}/${urls.length}]`;
    try {
      // Le Referer du wiki lève le blocage anti-hotlink sur les archives.
      const referer = url.includes('bulbagarden') ? 'https://bulbapedia.bulbagarden.net/' : undefined;
      const reponse = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
        referer,
      });

      if (!reponse || !reponse.ok()) {
        resultats.push({ url, ok: false, raison: `HTTP ${reponse?.status() ?? '?'}` });
        console.log(`${etiquette} ✗ HTTP ${reponse?.status() ?? '?'}`);
        continue;
      }

      const type = reponse.headers()['content-type'] ?? '';
      if (!type.startsWith('image/')) {
        resultats.push({ url, ok: false, raison: `réponse ${type || 'inconnue'}, pas une image` });
        console.log(`${etiquette} ✗ ${type || 'type inconnu'}`);
        continue;
      }

      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
      const fichier = nomFichier(url, ext);
      const chemin = join(OUT, fichier);
      writeFileSync(chemin, await reponse.buffer());

      const v = valider(chemin);
      if (!v.ok) {
        resultats.push({ url, ok: false, raison: v.raison });
        console.log(`${etiquette} ✗ ${v.raison}`);
        continue;
      }

      resultats.push({
        url, ok: true, fichier,
        chemin_public: `/captures/${fichier}`,
        octets: statSync(chemin).size,
        dimensions: `${v.w}x${v.h}`,
      });
      console.log(`${etiquette} ✓ ${fichier}  ${v.w}x${v.h}`);
    } catch (e) {
      resultats.push({ url, ok: false, raison: e.message.split('\n')[0] });
      console.log(`${etiquette} ✗ ${e.message.split('\n')[0]}`);
    }
  }
} finally {
  await navigateur.close();
}

writeFileSync('/tmp/verif/captures.json', JSON.stringify(resultats, null, 2), 'utf8');

const ok = resultats.filter(r => r.ok);
console.log(`\n${ok.length}/${resultats.length} récupérées → public/captures/`);
for (const r of resultats.filter(r => !r.ok)) console.log(`  échec : ${r.raison} — ${r.url}`);

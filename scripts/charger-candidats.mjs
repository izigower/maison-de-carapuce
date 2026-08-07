#!/usr/bin/env node
/**
 * Génère le SQL d'insertion des candidats dans research_candidates.
 *
 *   node scripts/charger-candidats.mjs                                  # triage TCG
 *   node scripts/charger-candidats.mjs chemin/fichier.json non_tcg      # rendu d'agent
 *
 * N'écrit RIEN à distance : produit recherche_cartes/triage/charger.sql.
 *
 * Deux garde-fous contre les doublons :
 *  1. dedup_key, contrainte UNIQUE côté base — impossible d'insérer deux fois
 *     la même combinaison langue|numéro|série|type ;
 *  2. ce script écarte en plus tout ce qui correspond déjà au catalogue.
 *
 * Le catalogue n'est jamais modifié : il sert uniquement de référence.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [, , fichier = 'recherche_cartes/triage/a_valider.json', kind = 'tcg'] = process.argv;

/**
 * Normalisation Unicode : on retire les diacritiques et la ponctuation, mais
 * on GARDE les lettres de tous les alphabets. Une classe [^a-z0-9] effacerait
 * entièrement « 拡張パック » ou « 寶可夢卡牌 », et deux sets japonais distincts
 * se retrouveraient avec la même clé.
 */
const norm = (v) => String(v ?? '')
  .normalize('NFD').replace(/\p{M}+/gu, '')
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/** Numéro local, sans la rareté parfois collée dedans (« 033/024 SR »). */
function localNumber(v) {
  let s = String(v ?? '').trim();
  if (!s) return '';
  s = s.replace(/\s+(SR|UR|RR|AR|SAR|CHR|CSR|HR|PROMO)$/i, '');
  return (s.split('/')[0].trim().replace(/^0+/, '') || s).toLowerCase();
}

const setTokens = (v) => new Set(String(v ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .split(/[^a-z0-9]+/).filter(t => t.length > 2));

function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0; for (const t of a) if (b.has(t)) n++;
  return n / Math.min(a.size, b.size);
}

const catalogue = JSON.parse(readFileSync(join(ROOT, 'chats/catalogue-current.json'), 'utf8'))
  .map(c => ({
    id: c.id, lang: norm(c.lang), num: localNumber(c.card_number),
    set: setTokens(c.set_name),
  }));

const rows = JSON.parse(readFileSync(join(ROOT, fichier), 'utf8'));
const sq = (v) => (v === null || v === undefined || v === '')
  ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

const seen = new Set();
const values = [];
const ecartes = [];

for (const r of rows) {
  // Les rendus d'agents et le triage TCG n'ont pas le même nommage.
  const nom = r.nom ?? r.name ?? 'Carapuce';
  const serie = r.serie ?? r.set_name ?? null;
  const numero = r.numero ?? r.card_number ?? null;
  const langue = String(r.langue ?? r.lang ?? '').toUpperCase() || null;
  const annee = Number(r.annee ?? r.year) || null;
  const typeObjet = r.type_objet ?? r.type ?? (kind === 'tcg' ? 'carte' : null);
  const variante = r.variante ?? r.variant ?? null;

  // La variante DOIT entrer dans la clé : « Base Set 63 FR Normal » et
  // « Base Set 63 FR Reverse Holo » sont deux objets distincts. C'est
  // précisément la faute qui fait perdre 14 lignes à Antigravity.
  const key = [norm(langue), localNumber(numero), norm(serie), norm(variante), norm(typeObjet)].join('|');

  if (seen.has(key)) { ecartes.push({ motif: 'doublon interne' }); continue; }

  // Écarte ce qui correspond déjà au catalogue : numéro identique ET set apparenté.
  // Le numéro seul ne suffit pas — « 1 » existe dans des dizaines de decks.
  if (kind === 'tcg') {
    const N = localNumber(numero), S = setTokens(serie), L = norm(langue);
    const hit = catalogue.find(c => c.lang === L && N && c.num === N && overlap(S, c.set) >= 0.4);
    if (hit) { ecartes.push({ motif: 'déjà au catalogue' }); continue; }
  }

  // Les agents répètent parfois la même note de méthode sur chaque ligne :
  // elle n'apporte rien par ligne et gonfle inutilement le SQL.
  const noteBrute = String(r.note ?? '').trim();
  const note = noteBrute.length > 120 || /une ligne par dessin/i.test(noteBrute)
    ? null
    : noteBrute || null;

  seen.add(key);
  values.push('  (' + [
    sq(kind), sq(nom), sq(serie), sq(numero), annee ?? 'NULL',
    sq(langue), sq(r.pays ?? r.country), sq(typeObjet),
    r.officiel === undefined || r.officiel === null ? 'NULL' : (r.officiel ? 'TRUE' : 'FALSE'),
    sq(r.image_url), sq(r.source_url), sq(r.preuve), sq(r.verdict),
    sq(r.origine ?? 'agent'), sq(note), sq(key),
  ].join(', ') + ')');
}

const sql = values.length
  ? `INSERT INTO research_candidates (
  kind, nom, serie, numero, annee, langue, pays, type_objet, officiel,
  image_url, source_url, preuve, verdict, origine, note, dedup_key
) VALUES
${values.join(',\n')}
ON CONFLICT (dedup_key) DO NOTHING;
`
  : '-- aucune ligne à insérer\n';

writeFileSync(join(ROOT, 'recherche_cartes/triage/charger.sql'), sql, 'utf8');

const parMotif = {};
for (const e of ecartes) parMotif[e.motif] = (parMotif[e.motif] ?? 0) + 1;

console.log(`${values.length} lignes prêtes (kind=${kind}), ${ecartes.length} écartées.`);
for (const [m, n] of Object.entries(parMotif)) console.log(`  - ${n} × ${m}`);
console.log('→ recherche_cartes/triage/charger.sql');

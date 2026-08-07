'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { p } from '@/lib/palette';
import type { CarteMasquee, ResearchStats } from '@/types';

const th: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 10, letterSpacing: 1.8,
  textTransform: 'uppercase', color: p.inkSoft, fontWeight: 500,
  borderBottom: `1px solid ${p.rule}`, whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, verticalAlign: 'middle',
  borderBottom: `1px solid rgba(26,31,44,0.1)`,
};

function chip(active: boolean, accent?: string): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
    border: `1px solid ${active ? (accent ?? p.ink) : 'rgba(26,31,44,0.22)'}`,
    background: active ? (accent ?? p.ink) : 'transparent',
    color: active ? p.bg : (accent ?? p.ink),
    whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block',
  };
}

/** Ajout d'une image sur une fiche du catalogue : URL collée ou fichier envoyé. */
function AjoutImage({ carte, onFait }: { carte: CarteMasquee; onFait: () => void }) {
  const supabase = createClient();
  const [ouvert, setOuvert] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function appliquer(valeur: string) {
    setBusy(true); setErr(null);
    const { error } = await supabase.rpc('definir_image_carte', { p_id: carte.id, p_url: valeur });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setOuvert(false); setUrl('');
    onFait();
  }

  async function envoyerFichier(file: File | undefined) {
    if (!file) return;
    setBusy(true); setErr(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const chemin = `catalogue/${carte.id}.${ext}`;
    const { error } = await supabase.storage.from('scans')
      .upload(chemin, file, { upsert: true, cacheControl: '3600' });
    if (error) { setBusy(false); setErr(error.message); return; }
    await appliquer(supabase.storage.from('scans').getPublicUrl(chemin).data.publicUrl);
  }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} style={{ ...chip(false, p.brass), fontSize: 11 }}>
        + image
      </button>
    );
  }

  return (
    <div style={{ minWidth: 260, padding: 10, border: `1px solid ${p.rule}`, background: p.card }}>
      <input
        value={url} onChange={e => setUrl(e.target.value)}
        placeholder="Coller une URL d'image"
        style={{ width: '100%', fontSize: 12, padding: '6px 0', border: 'none',
                 borderBottom: `1px solid rgba(26,31,44,0.25)`, background: 'transparent',
                 color: p.ink, outline: 'none', fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <button disabled={busy || !url.trim()} onClick={() => appliquer(url.trim())}
          style={{ ...chip(true), fontSize: 11 }}>
          {busy ? '…' : 'Valider'}
        </button>
        <label style={{ ...chip(false), fontSize: 11 }}>
          {busy ? '…' : 'Fichier'}
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => envoyerFichier(e.target.files?.[0])} />
        </label>
        <button onClick={() => setOuvert(false)} style={{ ...chip(false), fontSize: 11, border: 'none', color: p.inkSoft }}>
          Annuler
        </button>
      </div>
      {err && <div style={{ marginTop: 8, fontSize: 11, color: '#a8485a' }}>{err}</div>}
    </div>
  );
}

export default function CatalogueACorriger({
  cartes,
  stats,
}: {
  cartes: CarteMasquee[];
  stats: ResearchStats;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [faites, setFaites] = useState<string[]>([]);

  const n = (s: unknown) => String(s ?? '').normalize('NFD')
    .replace(/[̀-ͯ]/g, '').toLowerCase();
  const mots = n(q).split(' ').filter(Boolean);
  const filtrees = cartes.filter(c => {
    if (faites.includes(c.id)) return false;
    if (!mots.length) return true;
    const h = n([c.id, c.set_name, c.card_number, c.lang, c.year, c.variant, c.note].join(' '));
    return mots.every(m => h.includes(m));
  });

  return (
    <main style={{ padding: '50px 40px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 12 }}>
            Catalogue · fiches retirées du public faute de visuel
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 46, fontWeight: 400, letterSpacing: -1 }}>
            Images à ajouter
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link href="/verification?kind=tcg" style={chip(false)}>
            Cartes TCG <span style={{ opacity: 0.6 }}>{stats.tcg_a_trier}</span>
          </Link>
          <Link href="/verification?kind=non_tcg" style={chip(false)}>
            Stickers / Topps / pins <span style={{ opacity: 0.6 }}>{stats.non_tcg_a_trier}</span>
          </Link>
          <Link href="/verification?kind=catalogue" style={chip(true, p.brass)}>
            Catalogue <span style={{ opacity: 0.6 }}>{cartes.length}</span>
          </Link>
        </div>
      </div>

      <p style={{ marginTop: 22, fontSize: 14, color: p.inkSoft, lineHeight: 1.6, maxWidth: 720 }}>
        Les 84 URL d&apos;image du catalogue ont été téléchargées et décodées une par une : toutes
        fonctionnent. Ces {cartes.length} fiches-ci n&apos;ont simplement aucun visuel et
        n&apos;affichaient qu&apos;un placeholder. Elles sont <strong>masquées du catalogue public</strong> et
        ressortent automatiquement dès que tu leur donnes une image. Rien n&apos;a été supprimé.
      </p>

      <div style={{ margin: '26px 0 18px', paddingBottom: 18, borderBottom: `1px solid ${p.rule}` }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Filtrer : set, numéro, langue…"
          style={{ width: '100%', maxWidth: 420, padding: '9px 0', border: 'none',
                   borderBottom: `1px solid ${p.rule}`, background: 'transparent',
                   fontSize: 14, outline: 'none', color: p.ink, fontFamily: 'inherit' }} />
        <span style={{ marginLeft: 16, fontSize: 12, color: p.inkSoft }}>
          {filtrees.length} affichée{filtrees.length !== 1 ? 's' : ''}
          {faites.length > 0 && ` · ${faites.length} corrigée${faites.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr>
              <th style={th}>Set</th>
              <th style={th}>Numéro</th>
              <th style={th}>Langue</th>
              <th style={th}>Année</th>
              <th style={th}>Variante</th>
              <th style={th}>Fiche</th>
              <th style={{ ...th, textAlign: 'right' }}>Image</th>
            </tr>
          </thead>
          <tbody>
            {filtrees.map(c => (
              <tr key={c.id}>
                <td style={{ ...td, fontWeight: 500 }}>
                  {c.set_name}
                  {c.note && <div style={{ fontSize: 11, color: p.inkSoft, fontWeight: 400 }}>{c.note}</div>}
                </td>
                <td style={{ ...td, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
                  {c.card_number || '—'}
                </td>
                <td style={td}>{c.lang}</td>
                <td style={{ ...td, color: p.inkSoft }}>{c.year ?? '—'}</td>
                <td style={{ ...td, color: p.inkSoft }}>{c.variant}</td>
                <td style={td}>
                  <Link href={`/carte/${c.id}`} target="_blank"
                    style={{ color: p.water, fontSize: 12 }}>voir ↗</Link>
                  {c.source_url && (
                    <>
                      {' · '}
                      <a href={c.source_url} target="_blank" rel="noreferrer noopener"
                        style={{ color: p.water, fontSize: 12 }}>source ↗</a>
                    </>
                  )}
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <AjoutImage carte={c} onFait={() => {
                    setFaites(f => [...f, c.id]);
                    router.refresh();
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtrees.length === 0 && (
        <div style={{ textAlign: 'center', padding: '70px 0', color: p.inkSoft, fontSize: 14 }}>
          {cartes.length === 0
            ? 'Aucune fiche masquée : toutes les cartes du catalogue ont un visuel.'
            : 'Rien à corriger avec ce filtre.'}
        </div>
      )}
    </main>
  );
}

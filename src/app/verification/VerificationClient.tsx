'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { p } from '@/lib/palette';
import type { ResearchCandidate, ResearchStats } from '@/types';

const PREUVE_COULEUR: Record<string, string> = {
  forte: '#2a6a4a', moyenne: '#a07a3a', marchand: '#a85838',
  faible: '#a8485a', aucune: '#a8485a',
};

const STATUT_LABEL: Record<string, string> = {
  a_trier: 'À trier', garde: 'Gardée', rejete: 'Rejetée', importe: 'Importée',
};

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
    whiteSpace: 'nowrap',
  };
}

/** Libellés lisibles des types d'objet, pour séparer cartes et autocollants. */
const TYPE_LABEL: Record<string, string> = {
  carte: 'Cartes', sticker: 'Autocollants', tazo: 'Tazos / Flippos',
  carddass: 'Carddass', pins: 'Pin\'s', figurine: 'Figurines',
  deck: 'Decks', autre: 'Autres',
};

const IMAGE_STATUT: Record<string, { label: string; couleur: string; aide: string }> = {
  ok: { label: '', couleur: '', aide: '' },
  bloquee: {
    label: 'à récupérer', couleur: '#a07a3a',
    aide: "L'image existe mais l'hôte refuse tout accès serveur (403). Ouvre-la dans ton navigateur, enregistre-la, puis ajoute-la ici.",
  },
  morte: {
    label: 'lien mort', couleur: '#a8485a',
    aide: "L'URL trouvée ne répond plus (404 ou domaine injoignable).",
  },
  absente: { label: 'aucune image', couleur: p.inkSoft, aide: 'Aucune image trouvée par la recherche.' },
};

/**
 * Aperçu agrandi au survol. Position fixe suivant le curseur, recadrée pour
 * ne jamais sortir de l'écran — sur les dernières lignes du tableau, un panneau
 * ancré vers le bas serait coupé.
 */
function ApercuZoom({ src, legende, x, y }: { src: string; legende: string; x: number; y: number }) {
  const L = 300, H = 420, M = 12;
  const gauche = typeof window !== 'undefined' && x + L + M > window.innerWidth
    ? Math.max(M, x - L - 60)
    : x;
  const haut = typeof window !== 'undefined'
    ? Math.min(Math.max(M, y), window.innerHeight - H - M)
    : y;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed', left: gauche, top: haut, width: L, zIndex: 200,
        pointerEvents: 'none', background: p.bg, border: `1px solid ${p.ink}`,
        boxShadow: '0 24px 60px rgba(20,30,50,0.28)', padding: 8,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={legende}
        style={{ width: '100%', height: H - 40, objectFit: 'contain', display: 'block', background: p.card }} />
      <div style={{ fontSize: 11, color: p.inkSoft, marginTop: 6, textAlign: 'center',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {legende}
      </div>
    </div>
  );
}

/** Vignette, ou bouton d'ajout si la ligne n'a pas encore d'image. */
function Vignette({ c, onSet }: { c: ResearchCandidate; onSet: (url: string) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const supabase = createClient();

  async function envoyerFichier(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const chemin = `candidats/${c.id}.${ext}`;
    const { error } = await supabase.storage.from('scans')
      .upload(chemin, file, { upsert: true, cacheControl: '3600' });
    if (!error) {
      onSet(supabase.storage.from('scans').getPublicUrl(chemin).data.publicUrl);
      setOuvert(false);
    }
    setBusy(false);
  }

  if (c.image_url && !ouvert) {
    return (
      <>
        <button
          onClick={() => setOuvert(true)}
          onMouseEnter={e => {
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setZoom({ x: r.right, y: r.top });
          }}
          onMouseMove={e => setZoom({ x: e.clientX + 24, y: e.clientY - 140 })}
          onMouseLeave={() => setZoom(null)}
          title="Survoler pour agrandir · cliquer pour remplacer"
          style={{ border: 'none', background: 'none', padding: 0, cursor: 'zoom-in', display: 'block' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.image_url} alt={c.nom}
            style={{ width: 44, height: 60, objectFit: 'contain', background: p.card,
                     border: `1px solid ${p.rule}`, display: 'block' }} />
        </button>

        {zoom && <ApercuZoom src={c.image_url} legende={c.nom} x={zoom.x} y={zoom.y} />}
      </>
    );
  }

  if (!ouvert) {
    const st = IMAGE_STATUT[c.image_statut] ?? IMAGE_STATUT.absente;
    return (
      <div style={{ display: 'grid', gap: 3, width: 78 }}>
        <button onClick={() => setOuvert(true)} title={st.aide}
          style={{ ...chip(false, st.couleur || p.brass), width: 78, height: 52,
                   fontSize: 10, lineHeight: 1.25, padding: 2, cursor: 'pointer' }}>
          + image
        </button>
        {c.image_statut !== 'absente' && (
          <span style={{ fontSize: 9, color: st.couleur, textAlign: 'center' }}>{st.label}</span>
        )}
        {c.image_url_source && (
          <a href={c.image_url_source} target="_blank" rel="noreferrer noopener"
             title="S'ouvre dans ton navigateur, où l'hôte ne bloque pas"
             style={{ fontSize: 9, color: p.water, textAlign: 'center' }}>
            voir la source ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: 220, padding: 10, border: `1px solid ${p.rule}`, background: p.card }}>
      <input
        value={url} onChange={e => setUrl(e.target.value)}
        placeholder="Coller une URL d'image"
        style={{ width: '100%', fontSize: 12, padding: '6px 0', border: 'none',
                 borderBottom: `1px solid rgba(26,31,44,0.25)`, background: 'transparent',
                 color: p.ink, outline: 'none', fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <button disabled={busy || !url.trim()}
          onClick={() => { onSet(url.trim()); setOuvert(false); setUrl(''); }}
          style={{ ...chip(true), fontSize: 11 }}>Valider</button>
        <label style={{ ...chip(false), fontSize: 11, display: 'inline-block' }}>
          {busy ? '…' : 'Fichier'}
          <input type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => envoyerFichier(e.target.files?.[0])} />
        </label>
        <button onClick={() => setOuvert(false)} style={{ ...chip(false), fontSize: 11, border: 'none', color: p.inkSoft }}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function VerificationClient({
  candidats,
  stats,
  kind,
  statut,
  nbMasquees,
}: {
  candidats: ResearchCandidate[];
  stats: ResearchStats;
  kind: 'tcg' | 'non_tcg';
  statut: string;
  nbMasquees: number;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [lignes, setLignes] = useState(candidats);

  // useState ne relit son argument qu'au montage : sans cette resynchronisation,
  // les donnees fraiches renvoyees par router.refresh() n'atteignaient jamais
  // l'affichage, et une ligne triee pouvait resurgir.
  useEffect(() => { setLignes(candidats); }, [candidats]);
  const [q, setQ] = useState('');
  const [langue, setLangue] = useState<string | null>(null);
  const [preuve, setPreuve] = useState<string | null>(null);
  const [sansImage, setSansImage] = useState(false);
  const [type, setType] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const langues = useMemo(
    () => [...new Set(lignes.map(c => c.langue).filter(Boolean))].sort() as string[],
    [lignes]);

  /** Types réellement présents dans cet onglet, avec leur effectif. */
  const types = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of lignes) {
      if (c.statut !== 'a_trier') continue;
      const t = c.type_objet ?? 'autre';
      m.set(t, (m.get(t) ?? 0) + 1);
    }
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [lignes]);

  const filtrees = useMemo(() => {
    const n = (s: unknown) => String(s ?? '').normalize('NFD')
      .replace(/[̀-ͯ]/g, '').toLowerCase();
    const mots = n(q).split(' ').filter(Boolean);
    return lignes.filter(c => {
      // Le statut est déjà filtré côté serveur : on ne le refiltre pas ici.
      if (langue && c.langue !== langue) return false;
      if (preuve && c.preuve !== preuve) return false;
      if (type && (c.type_objet ?? 'autre') !== type) return false;
      if (sansImage && c.image_statut === 'ok') return false;
      if (mots.length) {
        const h = n([c.nom, c.serie, c.numero, c.langue, c.annee, c.type_objet, c.note].join(' '));
        if (!mots.every(m => h.includes(m))) return false;
      }
      return true;
    });
  }, [lignes, q, langue, preuve, sansImage, type]);

  async function trier(id: string, s: 'garde' | 'rejete' | 'a_trier') {
    setErreur(null);
    const avant = lignes;
    const ligne = lignes.find(c => c.id === id);

    // Retrait immédiat de la liste, puis on demande au serveur de confirmer.
    setLignes(l => l.filter(c => c.id !== id));

    const { error } = await supabase.rpc('trier_candidat', { p_id: id, p_statut: s });
    if (error) {
      setLignes(avant);
      setErreur(`Impossible de trier « ${ligne?.nom ?? id} » : ${error.message}`);
      return;
    }
    setConfirmation(
      `${ligne?.nom ?? 'Ligne'} — ${s === 'garde' ? 'gardée' : s === 'rejete' ? 'rejetée' : 'remise à trier'}.`,
    );
    router.refresh();
  }

  async function definirImage(id: string, url: string) {
    setErreur(null);
    const avant = lignes;
    setLignes(l => l.map(c => (c.id === id ? { ...c, image_url: url } : c)));
    const { error } = await supabase.rpc('definir_image_candidat', { p_id: id, p_url: url });
    if (error) { setLignes(avant); setErreur(error.message); }
  }

  return (
    <main style={{ padding: '50px 40px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 12 }}>
            File de tri · aucune de ces lignes n&apos;est au catalogue
          </div>
          <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 46, fontWeight: 400, letterSpacing: -1 }}>
            Vérification
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link href="/verification?kind=tcg" style={{ ...chip(kind === 'tcg'), textDecoration: 'none' }}>
            Cartes TCG <span style={{ opacity: 0.6 }}>{stats.tcg_a_trier}</span>
          </Link>
          <Link href="/verification?kind=non_tcg" style={{ ...chip(kind === 'non_tcg'), textDecoration: 'none' }}>
            Stickers / Topps / pins <span style={{ opacity: 0.6 }}>{stats.non_tcg_a_trier}</span>
          </Link>
          <Link href="/verification?kind=catalogue"
            title="Fiches du catalogue masquées faute de visuel"
            style={{ ...chip(false, p.brass), textDecoration: 'none' }}>
            Catalogue <span style={{ opacity: 0.6 }}>{nbMasquees}</span>
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 24, fontSize: 12, color: p.inkSoft, flexWrap: 'wrap' }}>
        <span><strong style={{ color: p.ink }}>{filtrees.length}</strong> affichée{filtrees.length !== 1 ? 's' : ''}</span>
        <span>{stats.sans_image} sans image utilisable</span>
        <span>{stats.image_bloquee} à récupérer à la main</span>
        <span>{stats.gardes} gardées</span>
        <span>{stats.rejetes} rejetées</span>
      </div>

      {/* Séparation par type d'objet : cartes / autocollants / tazos… */}
      {types.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
          <button onClick={() => setType(null)} style={chip(type === null)}>
            Tout <span style={{ opacity: 0.6 }}>{types.reduce((s, [, n]) => s + n, 0)}</span>
          </button>
          {types.map(([t, n]) => (
            <button key={t} onClick={() => setType(type === t ? null : t)} style={chip(type === t)}>
              {TYPE_LABEL[t] ?? t} <span style={{ opacity: 0.6 }}>{n}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                    margin: '24px 0', paddingBottom: 18, borderBottom: `1px solid ${p.rule}` }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Filtrer : nom, série, numéro…"
          style={{ flex: 1, minWidth: 220, padding: '9px 0', border: 'none',
                   borderBottom: `1px solid ${p.rule}`, background: 'transparent',
                   fontSize: 14, outline: 'none', color: p.ink, fontFamily: 'inherit' }} />

        <select value={statut}
          onChange={e => router.push(`/verification?kind=${kind}&statut=${e.target.value}`)}
          style={{ ...chip(false), cursor: 'pointer' }}>
          <option value="a_trier">À trier</option>
          <option value="garde">Gardées</option>
          <option value="rejete">Rejetées</option>
          <option value="tous">Toutes</option>
        </select>

        <button onClick={() => setSansImage(v => !v)} style={chip(sansImage, p.brass)}>
          Image à faire <span style={{ opacity: 0.6 }}>{stats.sans_image}</span>
        </button>

        {(['forte', 'moyenne', 'faible'] as const).map(niv => (
          <button key={niv} onClick={() => setPreuve(preuve === niv ? null : niv)}
            style={chip(preuve === niv, PREUVE_COULEUR[niv])}>
            Preuve {niv}
          </button>
        ))}

        <select value={langue ?? ''} onChange={e => setLangue(e.target.value || null)}
          style={{ ...chip(Boolean(langue)), cursor: 'pointer' }}>
          <option value="">Toutes langues</option>
          {langues.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {erreur && (
        <div style={{ padding: '10px 14px', border: '1px solid #a8485a', color: '#a8485a',
                      fontSize: 13, marginBottom: 16 }}>{erreur}</div>
      )}
      {confirmation && !erreur && (
        <div style={{ padding: '10px 14px', border: `1px solid #2a6a4a`, color: '#2a6a4a',
                      fontSize: 13, marginBottom: 16, display: 'flex',
                      justifyContent: 'space-between', gap: 12 }}>
          <span>{confirmation}</span>
          <button onClick={() => setConfirmation(null)}
            style={{ border: 'none', background: 'none', color: '#2a6a4a', cursor: 'pointer', fontSize: 12 }}>
            ✕
          </button>
        </div>
      )}

      {/* Datatable */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={th}>Image</th>
              <th style={th}>Nom</th>
              <th style={th}>Série</th>
              <th style={th}>Numéro</th>
              <th style={th}>Langue</th>
              <th style={th}>Année</th>
              <th style={th}>Preuve</th>
              <th style={th}>Lien</th>
              <th style={{ ...th, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtrees.map(c => (
              <tr key={c.id} style={{ opacity: c.statut === 'rejete' ? 0.45 : 1 }}>
                <td style={td}>
                  <Vignette c={c} onSet={url => definirImage(c.id, url)} />
                </td>
                <td style={{ ...td, fontWeight: 500 }}>
                  {c.nom}
                  {c.type_objet && c.type_objet !== 'carte' && (
                    <span style={{ color: p.inkSoft, fontSize: 11 }}> · {c.type_objet}</span>
                  )}
                  {c.officiel === false && (
                    <span style={{ color: '#a8485a', fontSize: 11 }}> · non officiel</span>
                  )}
                </td>
                <td style={{ ...td, color: p.inkSoft }}>{c.serie ?? '—'}</td>
                <td style={{ ...td, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
                  {c.numero ?? '—'}
                </td>
                <td style={td}>{c.langue ?? '—'}</td>
                <td style={{ ...td, color: p.inkSoft }}>{c.annee ?? '—'}</td>
                <td style={td}>
                  {c.preuve && (
                    <span style={{ fontSize: 11, color: PREUVE_COULEUR[c.preuve] ?? p.inkSoft }}>
                      {c.preuve}
                    </span>
                  )}
                </td>
                <td style={td}>
                  {c.source_url
                    ? <a href={c.source_url} target="_blank" rel="noreferrer noopener"
                        style={{ color: p.water, fontSize: 12 }}>source ↗</a>
                    : <span style={{ color: p.inkSoft, fontSize: 12 }}>—</span>}
                </td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {c.statut === 'a_trier' ? (
                    <>
                      <button onClick={() => trier(c.id, 'garde')}
                        style={{ ...chip(false, '#2a6a4a'), fontSize: 11, marginRight: 6 }}>Garder</button>
                      <button onClick={() => trier(c.id, 'rejete')}
                        style={{ ...chip(false, '#a8485a'), fontSize: 11 }}>Rejeter</button>
                    </>
                  ) : (
                    <button onClick={() => trier(c.id, 'a_trier')}
                      style={{ ...chip(false), fontSize: 11, color: p.inkSoft, border: 'none' }}>
                      {STATUT_LABEL[c.statut]} · annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtrees.length === 0 && (
        <div style={{ textAlign: 'center', padding: '70px 0', color: p.inkSoft, fontSize: 14 }}>
          Rien à trier ici avec ces filtres.
        </div>
      )}
    </main>
  );
}

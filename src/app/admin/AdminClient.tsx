'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { p } from '@/lib/palette';
import type { Contribution } from '@/types';

const TYPE_LABEL: Record<Contribution['type'], string> = {
  card: 'Carte à recenser',
  item: 'Don physique',
  correction: 'Correction',
};

/** Champs qu'on affiche en priorité, dans cet ordre, avec un libellé lisible. */
const FIELD_LABELS: Record<string, string> = {
  set_name: 'Set',
  year: 'Année',
  lang: 'Langue',
  card_number: 'Numéro',
  variant: 'Variante',
  rarity: 'Rareté',
  country: 'Pays',
  note: 'Notes',
  scan_url: 'Scan',
  card_id: 'Carte visée',
  error_description: 'Erreur signalée',
  source: 'Source / preuve',
  item_type: "Type d'item",
  description: 'Description',
  name: 'Nom',
  email: 'Email',
  receipt: 'Accusé',
};

/** Les RPC renvoient des codes stables ; on les traduit pour l'écran. */
function humanError(raw: string): string {
  if (raw.includes('insufficient_privilege')) return "Ton compte n'a pas les droits de conservation.";
  if (raw.includes('contribution_already_processed')) return 'Cette contribution a déjà été traitée.';
  if (raw.includes('contribution_not_found')) return 'Contribution introuvable ou déjà traitée.';
  const year = raw.match(/invalid_year: (.*)/);
  if (year) return `Année invalide (« ${year[1].trim()} ») — corrige la fiche avant d'approuver.`;
  return raw;
}

function btn(primary: boolean, tone: 'ink' | 'danger' = 'ink'): React.CSSProperties {
  const color = tone === 'danger' ? '#a8485a' : p.ink;
  return {
    background: primary ? color : 'transparent',
    color: primary ? p.bg : color,
    border: `1px solid ${color}`,
    fontFamily: 'inherit',
    fontSize: 12,
    padding: '9px 16px',
    cursor: 'pointer',
    letterSpacing: 0.3,
  };
}

function ContributionCard({
  c,
  onDone,
}: {
  c: Contribution;
  onDone: (id: string, message: string) => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const data = (c.data ?? {}) as Record<string, unknown>;
  const entries = Object.entries(data).filter(([, v]) => v !== '' && v != null);

  async function approve() {
    setBusy(true); setError(null);
    const { data: res, error } = await supabase.rpc('approve_contribution', {
      contribution_id: c.id,
    });
    setBusy(false);
    if (error) { setError(humanError(error.message)); return; }
    const newId = (res as { created_card_id?: string } | null)?.created_card_id;
    onDone(c.id, newId ? `Fiche ${newId} créée.` : 'Contribution approuvée.');
    router.refresh();
  }

  async function reject() {
    setBusy(true); setError(null);
    const { error } = await supabase.rpc('reject_contribution', {
      contribution_id: c.id,
      reason: reason.trim() || null,
    });
    setBusy(false);
    if (error) { setError(humanError(error.message)); return; }
    onDone(c.id, 'Contribution rejetée.');
    router.refresh();
  }

  return (
    <article style={{ border: `1px solid ${p.rule}`, background: p.card, padding: 26, marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', color: p.brass }}>
          {TYPE_LABEL[c.type]}
        </div>
        <div style={{ fontSize: 11, color: p.inkSoft }}>
          {new Date(c.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
          {c.contributor_name && <> · par <strong>{c.contributor_name}</strong></>}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 18, fontSize: 14 }}>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k} style={{ borderTop: `1px solid rgba(26,31,44,0.12)` }}>
              <td style={{ padding: '9px 0', color: p.inkSoft, width: 180, verticalAlign: 'top' }}>
                {FIELD_LABELS[k] ?? k}
              </td>
              <td style={{ padding: '9px 0', wordBreak: 'break-word' }}>
                {k === 'scan_url'
                  ? <a href={String(v)} target="_blank" rel="noreferrer noopener" style={{ color: p.water }}>Voir le scan ↗</a>
                  : String(v)}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td style={{ padding: '9px 0', color: p.inkSoft }}>Aucune donnée transmise.</td></tr>
          )}
        </tbody>
      </table>

      {c.type === 'card' && (
        <div style={{ marginTop: 18, fontSize: 12, color: p.inkSoft, lineHeight: 1.55 }}>
          À l&apos;approbation, la fiche est créée avec <code>verification_status = pending</code> :
          elle entre dans ton pipeline de vérification, elle n&apos;est pas publiée telle quelle.
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, padding: '10px 14px', border: '1px solid #a8485a', color: '#a8485a', fontSize: 13 }}>
          {error}
        </div>
      )}

      {rejecting ? (
        <div style={{ marginTop: 20 }}>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Motif du rejet (visible par toi seul)"
            style={{
              width: '100%', padding: '9px 0', border: 'none',
              borderBottom: `1px solid rgba(26,31,44,0.25)`, background: 'transparent',
              fontSize: 14, color: p.ink, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button onClick={() => setRejecting(false)} disabled={busy} style={btn(false)}>Annuler</button>
            <button onClick={reject} disabled={busy} style={btn(true, 'danger')}>
              {busy ? '…' : 'Confirmer le rejet'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={() => setRejecting(true)} disabled={busy} style={btn(false, 'danger')}>Rejeter</button>
          <button onClick={approve} disabled={busy} style={btn(true)}>
            {busy ? 'Traitement…' : c.type === 'card' ? 'Approuver et créer la fiche' : 'Approuver'}
          </button>
        </div>
      )}
    </article>
  );
}

export default function AdminClient({
  pending,
  recent,
  curator,
}: {
  pending: Contribution[];
  recent: Contribution[];
  curator: string;
}) {
  const [done, setDone] = useState<Record<string, string>>({});
  const queue = pending.filter(c => !done[c.id]);

  return (
    <main style={{ padding: '70px 56px 120px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 16 }}>
        Salle de conservation · {curator}
      </div>
      <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 52, fontWeight: 400, letterSpacing: -1.2 }}>
        Vérification
      </h1>
      <p style={{ color: p.inkSoft, fontSize: 15, marginTop: 16, maxWidth: 560, lineHeight: 1.6 }}>
        Rien n&apos;entre dans le catalogue sans passer par ici. Approuver une carte
        crée sa fiche et la marque comme vérifiée.
      </p>

      <div style={{ marginTop: 48, marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, fontWeight: 400 }}>
          En attente
        </h2>
        <span style={{ fontSize: 13, color: p.inkSoft }}>{queue.length}</span>
      </div>

      {queue.length === 0 ? (
        <div style={{ padding: '50px 0', color: p.inkSoft, fontSize: 14, textAlign: 'center', border: `1px dashed rgba(26,31,44,0.2)` }}>
          La file est vide. Tout est traité.
        </div>
      ) : (
        queue.map(c => (
          <ContributionCard key={c.id} c={c}
            onDone={(id, msg) => setDone(d => ({ ...d, [id]: msg }))} />
        ))
      )}

      {Object.keys(done).length > 0 && (
        <div style={{ marginTop: 28, padding: '14px 18px', border: `1px solid ${p.water}`, fontSize: 13, color: p.water }}>
          {Object.values(done).map((m, i) => <div key={i}>{m}</div>)}
        </div>
      )}

      {recent.length > 0 && (
        <section style={{ marginTop: 80, paddingTop: 40, borderTop: `1px solid ${p.rule}` }}>
          <h2 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, fontWeight: 400, marginBottom: 20 }}>
            Traitées récemment
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {recent.map(c => (
                <tr key={c.id} style={{ borderTop: `1px solid rgba(26,31,44,0.12)` }}>
                  <td style={{ padding: '11px 0', color: p.inkSoft, width: 110 }}>
                    {c.reviewed_at ? new Date(c.reviewed_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '11px 0' }}>{TYPE_LABEL[c.type]}</td>
                  <td style={{ padding: '11px 0', color: c.status === 'approved' ? '#2a6a4a' : '#a8485a' }}>
                    {c.status === 'approved' ? 'approuvée' : 'rejetée'}
                  </td>
                  <td style={{ padding: '11px 0' }}>
                    {c.created_card_id
                      ? <Link href={`/carte/${c.created_card_id}`} style={{ color: p.water }}>{c.created_card_id}</Link>
                      : <span style={{ color: p.inkSoft }}>{c.review_note ?? '—'}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

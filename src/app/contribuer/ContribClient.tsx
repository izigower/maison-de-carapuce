'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import CardPlaceholder from '@/components/CardPlaceholder';
import { p } from '@/lib/palette';
import { createClient } from '@/lib/supabase/client';
import type { Card, SimilarCard } from '@/types';

const MAX_SCAN_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

const VARIANTS = ['wave', 'drop', 'shell', 'ripple', 'depth', 'current'] as const;

function museumBtn(primary: boolean): React.CSSProperties {
  return {
    background: primary ? p.ink : 'transparent',
    color: primary ? p.bg : p.ink,
    border: `1px solid ${p.ink}`,
    fontFamily: 'inherit',
    fontSize: 13,
    padding: '12px 22px',
    cursor: 'pointer',
    letterSpacing: 0.3,
  };
}

function FormField({
  label,
  placeholder,
  textarea,
  name,
  onBlur,
  required,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  textarea?: boolean;
  name: string;
  onBlur?: () => void;
  required?: boolean;
  type?: string;
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    marginTop: 8,
    padding: '10px 0',
    fontSize: 14,
    border: 'none',
    borderBottom: `1px solid ${p.rule}`,
    background: 'transparent',
    color: p.ink,
    outline: 'none',
  };

  return (
    <label style={{ display: 'block', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: p.inkSoft }}>
      {label}
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={4} onBlur={onBlur}
          required={required} style={{ ...baseStyle, resize: 'vertical' }} />
      ) : (
        <input name={name} type={type} placeholder={placeholder} onBlur={onBlur}
          required={required} style={baseStyle} />
      )}
    </label>
  );
}

/** Aperçu des cartes déjà recensées qui ressemblent à la saisie en cours. */
function DuplicateWarning({ matches }: { matches: SimilarCard[] }) {
  if (matches.length === 0) return null;
  return (
    <div style={{
      marginTop: 20, padding: '16px 20px',
      border: `1px solid ${p.brass}`, background: 'rgba(160,122,58,0.06)',
    }}>
      <div style={{ fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', color: p.brass, marginBottom: 10 }}>
        Déjà dans l&apos;archive ?
      </div>
      <div style={{ fontSize: 13, color: p.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
        Ces fiches ressemblent à ta saisie. Si l&apos;une correspond, inutile de la
        recenser — mais une <strong>variante différente</strong> (reverse, édition 1,
        autre langue) mérite bien sa propre fiche.
      </div>
      <ul style={{ listStyle: 'none', display: 'grid', gap: 6, fontSize: 13 }}>
        {matches.map(m => (
          <li key={m.id}>
            <Link href={`/carte/${m.id}`} target="_blank" style={{ color: p.water, textDecoration: 'none' }}>
              {m.set_name} · {m.lang} · {m.card_number} · {m.variant}
              {m.year ? ` (${m.year})` : ''} ↗
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContribFormCard({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [matches, setMatches] = useState<SimilarCard[]>([]);
  const [scan, setScan] = useState<{ file: File; preview: string } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const supabase = createClient();

  /** Cherche les doublons dès que le set / le numéro / la langue sont renseignés. */
  async function checkDuplicates() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const setName = String(fd.get('set_name') ?? '').trim();
    const number = String(fd.get('card_number') ?? '').trim();
    const lang = String(fd.get('lang') ?? '').trim();
    if (!setName && !number) { setMatches([]); return; }

    const { data } = await supabase.rpc('find_similar_cards', {
      p_set_name: setName,
      p_card_number: number,
      p_lang: lang,
    });
    setMatches((data as SimilarCard[]) ?? []);
  }

  function pickScan(file: File | undefined) {
    setScanError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setScanError('Format accepté : JPG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_SCAN_BYTES) {
      setScanError(`Fichier trop lourd (${(file.size / 1e6).toFixed(1)} Mo, max 8 Mo).`);
      return;
    }
    setScan({ file, preview: URL.createObjectURL(file) });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg(null);

    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, unknown>;
    delete data.scan; // le fichier est envoyé au Storage, pas dans le JSON

    if (scan) {
      setUploading(true);
      const ext = scan.file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `contributions/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('scans')
        .upload(path, scan.file, { cacheControl: '3600', upsert: false });
      setUploading(false);

      if (upErr) {
        setStatus('error');
        setErrorMsg(`Envoi du scan impossible : ${upErr.message}`);
        return;
      }
      data.scan_url = supabase.storage.from('scans').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('contributions').insert({ type: 'card', data });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    setStatus('done');
  }

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, marginBottom: 12 }}>
          Merci pour votre contribution !
        </div>
        <div style={{ color: p.inkSoft, fontSize: 14 }}>
          Votre fiche sera examinée par nos conservateurs avant publication.
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, marginBottom: 8 }}>
        Recenser une carte
      </div>
      <div style={{ color: p.inkSoft, fontSize: 13, marginBottom: 28 }}>
        Renseigne au minimum le set, l&apos;année, la langue et le numéro. Un conservateur
        vérifie avant publication.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <FormField label="Nom du set" placeholder="ex. Set de Base, Évolutions…" name="set_name" onBlur={checkDuplicates} required />
        <FormField label="Année" placeholder="1999" name="year" type="number" required />
        <FormField label="Langue" placeholder="FR / EN / JP / DE…" name="lang" onBlur={checkDuplicates} required />
        <FormField label="Numéro de carte" placeholder="63/102" name="card_number" onBlur={checkDuplicates} required />
        <FormField label="Variante" placeholder="Édition 1, Reverse, Shadowless…" name="variant" />
        <FormField label="Pays d'édition" placeholder="FR" name="country" />
      </div>
      <div style={{ marginTop: 24 }}>
        <FormField label="Notes (optionnel)" placeholder="Tout ce qui vous semble important." textarea name="note" />
      </div>

      <DuplicateWarning matches={matches} />

      {/* ---------- Scan ---------- */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: p.inkSoft, marginBottom: 10 }}>
          Photo / scan {isLoggedIn ? '(optionnel)' : ''}
        </div>

        {!isLoggedIn ? (
          <div style={{
            padding: '18px 22px', border: `1.5px dashed rgba(26,31,44,0.3)`,
            color: p.inkSoft, fontSize: 13, lineHeight: 1.55,
          }}>
            <Link href="/auth" style={{ color: p.water }}>Connecte-toi</Link> pour joindre
            un scan. Sans compte, tu peux quand même envoyer la fiche — on ajoutera
            l&apos;image plus tard.
          </div>
        ) : scan ? (
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', border: `1px solid ${p.rule}`, padding: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scan.preview} alt="Aperçu du scan"
              style={{ width: 96, height: 128, objectFit: 'contain', background: p.bg, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: p.inkSoft, flex: 1 }}>
              <div style={{ color: p.ink, wordBreak: 'break-all' }}>{scan.file.name}</div>
              <div style={{ marginTop: 4 }}>{(scan.file.size / 1e6).toFixed(2)} Mo</div>
              <button type="button"
                onClick={() => { URL.revokeObjectURL(scan.preview); setScan(null); }}
                style={{ ...museumBtn(false), marginTop: 12, padding: '7px 14px', fontSize: 12 }}>
                Retirer
              </button>
            </div>
          </div>
        ) : (
          <label style={{
            display: 'block', padding: '22px 24px', textAlign: 'center',
            border: `1.5px dashed rgba(26,31,44,0.35)`, color: p.inkSoft,
            fontSize: 13, cursor: 'pointer',
          }}>
            Choisir une photo recto (JPG, PNG ou WebP — 8 Mo max, 300 dpi recommandé)
            <input type="file" name="scan" accept={ACCEPTED.join(',')}
              onChange={e => pickScan(e.target.files?.[0])}
              style={{ display: 'none' }} />
          </label>
        )}

        {scanError && <div style={{ marginTop: 10, color: '#a8485a', fontSize: 13 }}>{scanError}</div>}
      </div>

      {status === 'error' && (
        <div style={{ marginTop: 16, padding: '12px 16px', border: '1px solid #a8485a', color: '#a8485a', fontSize: 13 }}>
          {errorMsg ?? 'Une erreur est survenue. Réessayez ou contactez-nous.'}
        </div>
      )}

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button type="submit" disabled={status === 'loading'} style={museumBtn(true)}>
          {uploading ? 'Envoi du scan…' : status === 'loading' ? 'Envoi…' : 'Soumettre pour validation'}
        </button>
      </div>
    </form>
  );
}

function ContribFormItem() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('contributions').insert({
      type: 'item',
      contributor_name: fd.get('name') as string,
      contributor_email: fd.get('email') as string,
      data: Object.fromEntries(fd.entries()),
    });
    setStatus(error ? 'error' : 'done');
  }

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, marginBottom: 12 }}>
          Annonce reçue, merci !
        </div>
        <div style={{ color: p.inkSoft, fontSize: 14 }}>
          Un accusé de réception vous sera envoyé dès réception de l'item.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, marginBottom: 8 }}>
        Offrir un item
      </div>
      <div style={{ color: p.inkSoft, fontSize: 13, marginBottom: 28 }}>
        Adresse de réception : <em>La Maison de Carapuce, BP 007, France</em>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <FormField label="Votre nom" placeholder="Pour le mur des donateurs" name="name" />
        <FormField label="Votre email" placeholder="vous@exemple.fr" name="email" />
        <FormField label="Type d'item" placeholder="Carte / Sticker Topps / Objet dérivé" name="item_type" />
        <FormField label="Accusé de réception ?" placeholder="Oui / Non" name="receipt" />
      </div>
      <div style={{ marginTop: 24 }}>
        <FormField label="Description de l'item" placeholder="Set, langue, état…" textarea name="description" />
      </div>
      {status === 'error' && (
        <div style={{ marginTop: 16, color: '#a8485a', fontSize: 13 }}>
          Une erreur est survenue. Réessayez ou contactez-nous.
        </div>
      )}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" disabled={status === 'loading'} style={museumBtn(true)}>
          {status === 'loading' ? 'Envoi…' : 'Annoncer mon envoi'}
        </button>
      </div>
    </form>
  );
}

function ContribFormCorrection() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from('contributions').insert({
      type: 'correction',
      data: Object.fromEntries(fd.entries()),
    });
    setStatus(error ? 'error' : 'done');
  }

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, marginBottom: 12 }}>
          Correction reçue !
        </div>
        <div style={{ color: p.inkSoft, fontSize: 14 }}>
          Elle sera revue par deux conservateurs avant publication.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, marginBottom: 8 }}>
        Corriger une notice
      </div>
      <div style={{ color: p.inkSoft, fontSize: 13, marginBottom: 28 }}>
        Toute correction est revue par deux conservateurs avant publication.
      </div>
      <FormField label="Identifiant de la carte" placeholder="ex. BS-63-FR-1999" name="card_id" />
      <div style={{ marginTop: 24 }}>
        <FormField label="Quelle information est incorrecte ?" placeholder="" textarea name="error_description" />
      </div>
      <div style={{ marginTop: 24 }}>
        <FormField label="Source / preuve" placeholder="Lien, scan, référence éditoriale…" name="source" />
      </div>
      {status === 'error' && (
        <div style={{ marginTop: 16, color: '#a8485a', fontSize: 13 }}>
          Une erreur est survenue. Réessayez ou contactez-nous.
        </div>
      )}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" disabled={status === 'loading'} style={museumBtn(true)}>
          {status === 'loading' ? 'Envoi…' : 'Envoyer la correction'}
        </button>
      </div>
    </form>
  );
}

function OwnedCollectionPreview({ ownedCards }: { ownedCards: Card[] }) {
  return (
    <section style={{ marginTop: 100, paddingTop: 60, borderTop: `1px solid ${p.rule}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, gap: 40 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 14 }}>
            Avant d'envoyer — la collection physique
          </div>
          <h2 style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 40,
            fontWeight: 400,
            letterSpacing: -0.8,
          }}>
            Voici ce qui se trouve déjà<br />dans le coffret du conservateur.
          </h2>
          <p style={{ fontSize: 14, color: p.inkSoft, marginTop: 18, maxWidth: 540 }}>
            Ces cartes ne sont <strong>pas</strong> nécessaires — gardez-les pour vous, ou échangez-les avec un autre fan.
            Toute autre carte de l'archive est la bienvenue.
          </p>
        </div>
        <div style={{ textAlign: 'right', paddingTop: 8, flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 56, lineHeight: 1, letterSpacing: -1.5 }}>
            {ownedCards.length}
          </div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: p.inkSoft, marginTop: 6 }}>
            cartes en main
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {ownedCards.map((card, i) => (
          <Link key={card.id} href={`/carte/${card.id}`} style={{ display: 'block', textDecoration: 'none', position: 'relative' }}>
            <div style={{ aspectRatio: '3/4', position: 'relative' }}>
              <CardPlaceholder card={card} variant={VARIANTS[i % 6]} owned />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(243,239,231,0.55)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%) rotate(-8deg)',
                padding: '6px 14px',
                background: p.ink,
                color: p.bg,
                fontSize: 10,
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontFamily: 'ui-monospace, monospace',
                whiteSpace: 'nowrap',
              }}>
                déjà reçue
              </div>
            </div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: p.brass, marginTop: 10 }}>
              {card.lang} · {card.year}
            </div>
            <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 15, marginTop: 4, letterSpacing: -0.2 }}>
              {card.set_name}
            </div>
            <div style={{ color: p.inkSoft, fontSize: 12, marginTop: 3 }}>
              {card.variant} · {card.card_number}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ContribClient({
  ownedCards,
  isLoggedIn,
}: {
  ownedCards: Card[];
  isLoggedIn: boolean;
}) {
  const [step, setStep] = useState(1);

  const VOIES = [
    { n: 'I', t: 'Recenser une carte', d: 'Ajoutez une carte manquante à la base : photo, set, langue, variante.' },
    { n: 'II', t: 'Offrir un item', d: 'Envoyez une carte, un sticker ou un objet pour agrandir la collection physique.' },
    { n: 'III', t: 'Corriger une notice', d: 'Vous avez repéré une erreur ? Suggérez une correction.' },
  ];

  return (
    <main style={{ padding: '80px 56px 120px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 18 }}>
        Devenir contributeur
      </div>
      <h1 style={{
        fontFamily: 'var(--font-playfair), Georgia, serif',
        fontSize: 64,
        fontWeight: 400,
        letterSpacing: -1.5,
      }}>
        La Maison s'agrandit<br />avec vous.
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: p.inkSoft, marginTop: 24, maxWidth: 600 }}>
        Vous possédez une carte qui n'est pas dans l'archive ? Vous voulez offrir un
        item à la collection ? Choisissez votre voie.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 60 }}>
        {VOIES.map((c, i) => (
          <button
            key={i}
            onClick={() => setStep(i + 1)}
            style={{
              textAlign: 'left',
              padding: '32px 28px',
              background: step === i + 1 ? p.ink : p.card,
              color: step === i + 1 ? p.bg : p.ink,
              border: `1px solid ${p.ink}`,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.6 }}>VOIE {c.n}</div>
            <div style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 22,
              marginTop: 14,
              letterSpacing: -0.2,
            }}>
              {c.t}
            </div>
            <div style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5, opacity: 0.85 }}>{c.d}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 60, padding: 40, border: `1px solid ${p.rule}`, background: p.card }}>
        {step === 1 && <ContribFormCard isLoggedIn={isLoggedIn} />}
        {step === 2 && <ContribFormItem />}
        {step === 3 && <ContribFormCorrection />}
      </div>

      <OwnedCollectionPreview ownedCards={ownedCards} />
    </main>
  );
}

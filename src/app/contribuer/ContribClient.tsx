'use client';

import { useState } from 'react';
import Link from 'next/link';
import CardPlaceholder from '@/components/CardPlaceholder';
import { p } from '@/lib/palette';
import { createClient } from '@/lib/supabase/client';
import type { Card } from '@/types';

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
}: {
  label: string;
  placeholder: string;
  textarea?: boolean;
  name: string;
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
        <textarea name={name} placeholder={placeholder} rows={4} style={{ ...baseStyle, resize: 'vertical' }} />
      ) : (
        <input name={name} placeholder={placeholder} style={baseStyle} />
      )}
    </label>
  );
}

function ContribFormCard() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const { error } = await supabase.from('contributions').insert({
      type: 'card',
      data,
    });
    setStatus(error ? 'error' : 'done');
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
    <form onSubmit={handleSubmit}>
      <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, marginBottom: 8 }}>
        Recenser une carte
      </div>
      <div style={{ color: p.inkSoft, fontSize: 13, marginBottom: 28 }}>
        Tous les champs sauf indication sont requis.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <FormField label="Nom du set" placeholder="ex. Set de Base, Évolutions…" name="set_name" />
        <FormField label="Année" placeholder="1999" name="year" />
        <FormField label="Langue" placeholder="FR / EN / JP / DE…" name="lang" />
        <FormField label="Numéro de carte" placeholder="63/102" name="card_number" />
        <FormField label="Variante" placeholder="Édition 1, Reverse, Shadowless…" name="variant" />
        <FormField label="Pays d'édition" placeholder="FR" name="country" />
      </div>
      <div style={{ marginTop: 24 }}>
        <FormField label="Notes (optionnel)" placeholder="Tout ce qui vous semble important." textarea name="note" />
      </div>
      <div style={{
        marginTop: 24,
        padding: '20px 24px',
        border: `1.5px dashed ${p.rule}`,
        textAlign: 'center',
        color: p.inkSoft,
        fontSize: 13,
      }}>
        Glissez-déposez les photos recto/verso ici (300 dpi recommandé)
      </div>
      {status === 'error' && (
        <div style={{ marginTop: 16, color: '#a8485a', fontSize: 13 }}>
          Une erreur est survenue. Réessayez ou contactez-nous.
        </div>
      )}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button type="button" style={museumBtn(false)}>Sauvegarder en brouillon</button>
        <button type="submit" disabled={status === 'loading'} style={museumBtn(true)}>
          {status === 'loading' ? 'Envoi…' : 'Soumettre pour validation'}
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

export default function ContribClient({ ownedCards }: { ownedCards: Card[] }) {
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
        {step === 1 && <ContribFormCard />}
        {step === 2 && <ContribFormItem />}
        {step === 3 && <ContribFormCorrection />}
      </div>

      <OwnedCollectionPreview ownedCards={ownedCards} />
    </main>
  );
}

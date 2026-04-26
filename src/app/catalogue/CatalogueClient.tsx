'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import CardPlaceholder from '@/components/CardPlaceholder';
import { p } from '@/lib/palette';
import type { Card } from '@/types';

const LANGS = [
  { code: 'ALL', label: 'Toutes' },
  { code: 'FR', label: 'Français' },
  { code: 'EN', label: 'English' },
  { code: 'JP', label: '日本語' },
  { code: 'DE', label: 'Deutsch' },
  { code: 'IT', label: 'Italiano' },
  { code: 'ES', label: 'Español' },
  { code: 'KR', label: '한국어' },
];

const VARIANTS = ['wave', 'drop', 'shell', 'ripple', 'depth', 'current'] as const;

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
    </span>
  );
}

export default function CatalogueClient({ cards }: { cards: Card[] }) {
  const [lang, setLang] = useState('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => cards.filter(c => {
    if (lang !== 'ALL' && c.lang !== lang) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!(c.set_name + c.variant + c.year + c.lang).toLowerCase().includes(q)) return false;
    }
    return true;
  }), [cards, lang, query]);

  return (
    <main style={{ padding: '60px 56px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 12 }}>
            L'archive complète
          </div>
          <h1 style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 56,
            fontWeight: 400,
            letterSpacing: -1,
          }}>
            Catalogue
          </h1>
        </div>
        <div style={{ fontSize: 13, color: p.inkSoft }}>
          {filtered.length} carte{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''} sur {cards.length}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 20,
        alignItems: 'center',
        marginBottom: 40,
        paddingBottom: 24,
        borderBottom: `1px solid ${p.rule}`,
        flexWrap: 'wrap',
      }}>
        <input
          placeholder="Rechercher un set, une année, une variante…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '12px 0',
            border: 'none',
            borderBottom: `1px solid ${p.rule}`,
            background: 'transparent',
            fontSize: 15,
            outline: 'none',
            color: p.ink,
          }}
        />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                padding: '8px 14px',
                fontSize: 12,
                border: `1px solid ${lang === l.code ? p.ink : 'transparent'}`,
                background: lang === l.code ? p.ink : 'transparent',
                color: lang === l.code ? p.bg : p.ink,
                cursor: 'pointer',
                letterSpacing: 0.3,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: 18,
        alignItems: 'center',
        marginBottom: 36,
        fontSize: 11,
        color: p.inkSoft,
        flexWrap: 'wrap',
      }}>
        <span style={{ letterSpacing: 2, textTransform: 'uppercase' }}>Légende :</span>
        <LegendDot color="#1a1f2c" label="Langue" />
        <LegendDot color="#a07a3a" label="Édition 1" />
        <LegendDot color="#5a5e6a" label="Shadowless / Unlimited" />
        <LegendDot color="#7a4a8a" label="Reverse" />
        <LegendDot color="#a8485a" label="Holo / Sticker" />
        <LegendDot color="#2a6a4a" label="✓ Déjà dans la collection" />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: p.inkSoft }}>
          <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 28, marginBottom: 12 }}>
            Aucune carte trouvée
          </div>
          <div style={{ fontSize: 13 }}>Essayez un autre filtre ou terme de recherche.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 36, rowGap: 60 }}>
          {filtered.map((card, i) => (
            <Link key={card.id} href={`/carte/${card.id}`} style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ aspectRatio: '3/4', marginBottom: 14, position: 'relative' }}>
                <CardPlaceholder card={card} variant={VARIANTS[i % 6]} owned={card.is_owned} />
              </div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: p.brass }}>
                {card.lang} · {card.year}
              </div>
              <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 17, marginTop: 4, letterSpacing: -0.2 }}>
                {card.set_name}
              </div>
              <div style={{ color: p.inkSoft, fontSize: 12, marginTop: 4 }}>
                {card.variant} · {card.card_number}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

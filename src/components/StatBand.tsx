'use client';

import { useEffect, useState } from 'react';
import { p } from '@/lib/palette';
import type { SiteStats } from '@/types';

export default function StatBand({ stats }: { stats: SiteStats }) {
  const [animated, setAnimated] = useState({ cards: 0, langs: 0, contrib: 0 });

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1400);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimated({
        cards: Math.round(stats.total_cards * eased),
        langs: Math.round(stats.total_langs * eased),
        contrib: Math.round(stats.contributors * eased),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stats]);

  const items = [
    { n: animated.cards, l: 'cartes recensées' },
    { n: animated.langs, l: 'langues couvertes' },
    { n: animated.contrib, l: 'contributeurs' },
    { n: stats.items_received, l: 'items reçus pour la collection' },
  ];

  return (
    <section style={{
      borderTop: `1px solid ${p.rule}`,
      borderBottom: `1px solid ${p.rule}`,
      padding: '44px 56px',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 40,
    }}>
      {items.map((s, i) => (
        <div
          key={i}
          style={{
            borderLeft: i === 0 ? 'none' : `1px solid ${p.rule}`,
            paddingLeft: i === 0 ? 0 : 30,
          }}
        >
          <div style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 56,
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: -1.5,
          }}>
            {s.n.toLocaleString('fr-FR')}
          </div>
          <div style={{ fontSize: 12, color: p.inkSoft, marginTop: 10, letterSpacing: 0.3 }}>
            {s.l}
          </div>
        </div>
      ))}
    </section>
  );
}

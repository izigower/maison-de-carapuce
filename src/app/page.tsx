import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CardPlaceholder from '@/components/CardPlaceholder';
import StatBand from '@/components/StatBand';
import { p } from '@/lib/palette';
import type { Card, SiteStats } from '@/types';

const VARIANTS = ['wave', 'drop', 'shell', 'ripple', 'depth', 'current'] as const;

const FALLBACK_STATS: SiteStats = {
  total_cards: 412,
  total_langs: 11,
  total_sets: 84,
  contributors: 1247,
  items_received: 89,
  years_covered: '1996 — 2026',
};

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
    display: 'inline-block',
    textDecoration: 'none',
  };
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: recentCards }, { data: statsData }] = await Promise.all([
    supabase.from('cards').select('*').order('created_at', { ascending: false }).limit(6),
    supabase.rpc('get_site_stats'),
  ]);

  const cards: Card[] = recentCards ?? [];
  const stats: SiteStats = statsData ?? FALLBACK_STATS;

  return (
    <main>
      {/* HERO */}
      <section style={{
        padding: '100px 56px 120px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: 80,
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 28 }}>
            № 007 · L'archive
          </div>
          <h1 style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 'clamp(52px, 6vw, 88px)',
            lineHeight: 0.95,
            fontWeight: 400,
            letterSpacing: -2,
          }}>
            Toutes les<br />
            <em style={{ fontStyle: 'italic', color: p.water }}>cartes Carapuce</em><br />
            jamais imprimées.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: p.inkSoft, marginTop: 36, maxWidth: 460 }}>
            Une archive vivante, recensée par celles et ceux qui aiment Carapuce
            plus que tout. Toutes les langues, tous les sets, toutes les variantes —
            jusqu'aux stickers Topps et aux promos oubliées.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 40 }}>
            <Link href="/catalogue" style={museumBtn(true)}>Parcourir le catalogue →</Link>
            <Link href="/contribuer" style={museumBtn(false)}>Contribuer</Link>
          </div>
        </div>

        <div style={{ position: 'relative', aspectRatio: '3/4' }}>
          {cards[0] ? (
            <CardPlaceholder card={cards[0]} variant="hero" large />
          ) : (
            <CardPlaceholder variant="hero" large />
          )}
          <div style={{
            position: 'absolute',
            bottom: -22,
            left: -22,
            padding: '14px 18px',
            background: p.card,
            border: `1px solid ${p.ink}`,
            fontSize: 11,
            lineHeight: 1.5,
            maxWidth: 240,
          }}>
            <div style={{ letterSpacing: 2, textTransform: 'uppercase', fontSize: 9, color: p.brass, marginBottom: 6 }}>
              Cartel №1
            </div>
            <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 14 }}>
              Carapuce, Set de Base
            </div>
            <div style={{ color: p.inkSoft }}>
              Wizards of the Coast, 1999<br />Édition 1, Shadowless
            </div>
          </div>
        </div>
      </section>

      {/* STAT BAND */}
      <StatBand stats={stats} />

      {/* RECENT ACQUISITIONS */}
      <section style={{ padding: '100px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 50 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 12 }}>
              Acquisitions récentes
            </div>
            <h2 style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 44,
              fontWeight: 400,
              letterSpacing: -0.8,
            }}>
              Ajoutées par la communauté<br />ce mois-ci.
            </h2>
          </div>
          <Link href="/catalogue" style={{ ...museumBtn(false), padding: '12px 22px' }}>
            Tout voir →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, rowGap: 70 }}>
          {cards.length > 0 ? cards.map((card, i) => (
            <Link key={card.id} href={`/carte/${card.id}`} style={{ cursor: 'pointer', display: 'block', textDecoration: 'none' }}>
              <div style={{ aspectRatio: '3/4', marginBottom: 18 }}>
                <CardPlaceholder card={card} variant={VARIANTS[i % 6]} />
              </div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: p.brass }}>
                № {String(i + 1).padStart(3, '0')}
              </div>
              <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 22, marginTop: 6, letterSpacing: -0.3 }}>
                {card.set_name}
              </div>
              <div style={{ color: p.inkSoft, fontSize: 13, marginTop: 6 }}>
                {card.year} · {card.lang} · {card.variant}
              </div>
            </Link>
          )) : (
            // Placeholder grid when no cards yet
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div style={{ aspectRatio: '3/4', marginBottom: 18 }}>
                  <CardPlaceholder variant={VARIANTS[i % 6]} />
                </div>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: p.brass }}>
                  № {String(i + 1).padStart(3, '0')}
                </div>
                <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 22, marginTop: 6, color: p.inkSoft }}>
                  À venir…
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* MANIFESTE */}
      <section style={{ padding: '120px 56px', background: p.water, color: p.bg }}>
        <div style={{ maxWidth: 780 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 28 }}>
            Manifeste
          </div>
          <p style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 'clamp(24px, 3vw, 36px)',
            lineHeight: 1.25,
            fontWeight: 400,
            letterSpacing: -0.5,
          }}>
            « Une carte n'est pas un objet de spéculation.
            C'est un fragment de notre enfance, une preuve qu'on a aimé
            quelque chose à fond. Cette maison existe pour les ranger
            toutes — même celles que personne n'a vues depuis vingt ans. »
          </p>
          <div style={{ marginTop: 36, fontSize: 13, opacity: 0.8 }}>
            — L'équipe de la Maison
          </div>
        </div>
      </section>
    </main>
  );
}

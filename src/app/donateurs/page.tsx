import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { p } from '@/lib/palette';
import type { ContributorStat } from '@/types';

export const metadata: Metadata = {
  title: 'Donateurs — La Maison de Carapuce',
  description: 'Le mur des donateurs — classement des contributeurs de l\'archive.',
};

function th(): React.CSSProperties {
  return {
    textAlign: 'left',
    padding: '14px 12px',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: p.inkSoft,
    fontWeight: 500,
  };
}

function td(): React.CSSProperties {
  return { padding: '18px 12px' };
}

export default async function DonateursPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .rpc('get_contributor_stats')
    .limit(50);

  const list: ContributorStat[] = data ?? [];
  const top3 = list.slice(0, 3);

  return (
    <main style={{ padding: '80px 56px 120px' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 18 }}>
        Mur des donateurs
      </div>
      <h1 style={{
        fontFamily: 'var(--font-playfair), Georgia, serif',
        fontSize: 64,
        fontWeight: 400,
        letterSpacing: -1.5,
        maxWidth: 800,
      }}>
        Sans eux,<br />
        <em style={{ color: p.water }}>la Maison serait vide.</em>
      </h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, color: p.inkSoft, marginTop: 24, maxWidth: 580 }}>
        Classement par contributions cumulées — fiches recensées et items envoyés.
        Mis à jour chaque lundi.
      </p>

      {/* Podium */}
      {top3.length >= 3 && (
        <div style={{
          marginTop: 70,
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr 1fr',
          gap: 24,
          alignItems: 'end',
        }}>
          {[top3[1], top3[0], top3[2]].map(c => {
            const isFirst = c.rank === 1;
            return (
              <div
                key={c.handle}
                style={{
                  padding: isFirst ? '40px 28px' : '30px 24px',
                  background: isFirst ? p.ink : p.card,
                  color: isFirst ? p.bg : p.ink,
                  border: `1px solid ${p.ink}`,
                  minHeight: isFirst ? 280 : 220,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 14 }}>
                    № 0{c.rank}{isFirst && ' · conservateur'}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontSize: isFirst ? 38 : 28,
                    lineHeight: 1,
                    letterSpacing: -0.5,
                  }}>
                    @{c.handle}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, letterSpacing: 0.3 }}>
                    {c.country} · depuis {new Date(c.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 28, fontSize: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 32, lineHeight: 1 }}>
                      {c.cards_contributed}
                    </div>
                    <div style={{ opacity: 0.7, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>fiches</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 32, lineHeight: 1 }}>
                      {c.items_donated}
                    </div>
                    <div style={{ opacity: 0.7, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>items</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div style={{ marginTop: 80 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 16 }}>
          Tous les donateurs
        </div>
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: p.inkSoft }}>
            <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 24, marginBottom: 12 }}>
              Soyez le premier à contribuer.
            </div>
            <div style={{ fontSize: 13 }}>Le classement s'affichera dès la première contribution approuvée.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${p.rule}` }}>
                <th style={th()}>№</th>
                <th style={th()}>Donateur</th>
                <th style={th()}>Pays</th>
                <th style={{ ...th(), textAlign: 'right' }}>Fiches</th>
                <th style={{ ...th(), textAlign: 'right' }}>Items</th>
                <th style={{ ...th(), textAlign: 'right' }}>Depuis</th>
              </tr>
            </thead>
            <tbody>
              {list.map(c => (
                <tr key={c.handle} style={{ borderBottom: `1px solid ${p.rule}33` }}>
                  <td style={td()}>{String(c.rank).padStart(2, '0')}</td>
                  <td style={{ ...td(), fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 17 }}>
                    @{c.handle}
                  </td>
                  <td style={td()}>{c.country}</td>
                  <td style={{ ...td(), textAlign: 'right' }}>{c.cards_contributed}</td>
                  <td style={{ ...td(), textAlign: 'right' }}>{c.items_donated}</td>
                  <td style={{ ...td(), textAlign: 'right', color: p.inkSoft }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

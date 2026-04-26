import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CardPlaceholder from '@/components/CardPlaceholder';
import WishlistButton from '@/components/WishlistButton';
import { p } from '@/lib/palette';
import type { Card } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${id} — La Maison de Carapuce`,
  };
}

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

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data }, { data: { user } }] = await Promise.all([
    supabase.from('cards').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ]);

  if (!data) notFound();

  const card: Card = data;

  const fields = [
    ['Année', card.year],
    ['Langue', card.lang],
    ["Pays d'édition", card.country],
    ['Numéro', card.card_number],
    ['Rareté', card.rarity],
    ['Variante', card.variant],
    ['Identifiant interne', card.id],
  ] as const;

  return (
    <main style={{ padding: '40px 56px 120px' }}>
      <Link href="/catalogue" style={{ ...museumBtn(false), marginBottom: 40, padding: '8px 14px', fontSize: 12, display: 'inline-block' }}>
        ← Retour au catalogue
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, marginTop: 40 }}>
        <div style={{ aspectRatio: '3/4', position: 'relative' }}>
          <CardPlaceholder card={card} variant="hero" large owned={card.is_owned} />
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 20 }}>
            Cartel · Notice
          </div>
          <h1 style={{
            fontFamily: 'var(--font-playfair), Georgia, serif',
            fontSize: 64,
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: -1.5,
          }}>
            Carapuce
          </h1>
          <div style={{
            fontSize: 22,
            fontStyle: 'italic',
            color: p.water,
            marginTop: 6,
            fontFamily: 'var(--font-playfair), Georgia, serif',
          }}>
            {card.set_name}
          </div>

          <table style={{ marginTop: 50, width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <tbody>
              {fields.map(([key, val]) => (
                <tr key={key} style={{ borderTop: `1px solid ${p.rule}` }}>
                  <td style={{ padding: '16px 0', color: p.inkSoft, width: 200, letterSpacing: 0.2 }}>{key}</td>
                  <td style={{ padding: '16px 0', fontWeight: 500 }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {card.note && (
            <p style={{
              marginTop: 30,
              fontStyle: 'italic',
              color: p.inkSoft,
              fontSize: 14,
              paddingLeft: 16,
              borderLeft: `2px solid ${p.brass}`,
            }}>
              « {card.note} »
            </p>
          )}

          <div style={{ marginTop: 50, display: 'flex', gap: 12 }}>
            <WishlistButton cardId={card.id} isLoggedIn={!!user} />
            <button style={museumBtn(false)}>Signaler une variante</button>
          </div>
        </div>
      </div>
    </main>
  );
}

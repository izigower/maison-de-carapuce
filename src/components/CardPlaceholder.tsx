import Image from 'next/image';
import { CARD_PALETTES, p } from '@/lib/palette';
import CardTags from './CardTags';
import type { Card } from '@/types';

type Variant = keyof typeof CARD_PALETTES;

interface Props {
  card?: Card;
  variant?: Variant;
  large?: boolean;
  tagPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showTags?: boolean;
  owned?: boolean;
}

export default function CardPlaceholder({
  card,
  variant = 'wave',
  large = false,
  tagPosition = 'top-right',
  showTags = true,
  owned = false,
}: Props) {
  const [c1, c2, c3] = CARD_PALETTES[variant] || CARD_PALETTES.wave;

  if (card?.image_url) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${p.ink}`,
        boxShadow: large ? '0 30px 80px rgba(20,30,50,0.15)' : 'none',
      }}>
        <Image
          src={card.image_url}
          alt={`${card.set_name} ${card.lang} ${card.variant}`}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {showTags && <CardTags card={card} owned={owned} position={tagPosition} small={!large} />}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      background: c1,
      border: `1px solid ${p.ink}`,
      boxShadow: large ? '0 30px 80px rgba(20,30,50,0.15)' : 'none',
    }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 300 400"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id={`g-${variant}-${card?.id ?? 'x'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c2} stopOpacity="0.4" />
            <stop offset="100%" stopColor={c3} stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect width="300" height="400" fill={`url(#g-${variant}-${card?.id ?? 'x'})`} />
        {[0, 1, 2, 3, 4].map(i => (
          <circle
            key={i}
            cx="150"
            cy="240"
            r={40 + i * 30}
            fill="none"
            stroke={c3}
            strokeOpacity={0.2 - i * 0.03}
            strokeWidth="1"
          />
        ))}
        <line x1="20" y1="100" x2="280" y2="100" stroke={c3} strokeOpacity="0.4" strokeWidth="0.8" />
        <circle cx="220" cy="80" r="14" fill={c1} stroke={c3} strokeOpacity="0.5" />
      </svg>

      <div style={{ position: 'absolute', inset: 12, border: `1px solid ${c3}`, opacity: 0.5 }} />

      {card && showTags && (
        <CardTags card={card} owned={owned} position={tagPosition} small={!large} />
      )}

      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        textAlign: 'center',
        fontSize: 9,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: c3,
        fontFamily: 'ui-monospace, Menlo, monospace',
      }}>
        photo de carte<br />
        <span style={{ opacity: 0.6 }}>{card ? card.id : 'à remplacer'}</span>
      </div>
    </div>
  );
}

import { VARIANT_COLORS } from '@/lib/palette';
import type { Card } from '@/types';

type Position = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface Props {
  card: Card;
  owned?: boolean;
  position?: Position;
  small?: boolean;
}

function tagColor(kind: 'lang' | 'sticker' | 'variant', value?: string): string {
  if (kind === 'lang') return '#1a1f2c';
  if (kind === 'sticker') return '#a8485a';
  if (kind === 'variant' && value) return VARIANT_COLORS[value] || '#5a5e6a';
  return '#5a5e6a';
}

export default function CardTags({ card, owned = false, position = 'top-right', small = false }: Props) {
  const isSticker = card.rarity === 'Sticker';
  const sz = small
    ? { fs: 8, py: 2, px: 5, gap: 3 }
    : { fs: 9, py: 3, px: 7, gap: 4 };

  const posStyles: Record<Position, React.CSSProperties> = {
    'top-right': { top: 8, right: 8, alignItems: 'flex-end' },
    'top-left': { top: 8, left: 8, alignItems: 'flex-start' },
    'bottom-right': { bottom: 8, right: 8, alignItems: 'flex-end' },
    'bottom-left': { bottom: 8, left: 8, alignItems: 'flex-start' },
  };

  function tagStyle(bg: string, fg = '#fbf8f1'): React.CSSProperties {
    return {
      background: bg,
      color: fg,
      border: 'none',
      padding: `${sz.py}px ${sz.px}px`,
      fontSize: sz.fs,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      fontWeight: 600,
      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      whiteSpace: 'nowrap',
      lineHeight: 1,
    };
  }

  return (
    <div style={{
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      gap: sz.gap,
      zIndex: 5,
      ...posStyles[position],
    }}>
      <span style={tagStyle(tagColor('lang'))}>{card.lang}</span>
      {isSticker && <span style={tagStyle(tagColor('sticker'))}>Sticker</span>}
      {card.variant && card.variant !== '—' && (
        <span style={tagStyle(tagColor('variant', card.variant))}>
          {card.variant.length > 14 ? card.variant.slice(0, 12) + '…' : card.variant}
        </span>
      )}
      {owned && <span style={tagStyle('#2a6a4a')}>✓ collection</span>}
    </div>
  );
}

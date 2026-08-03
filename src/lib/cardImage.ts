import type { Card } from '@/types';

/**
 * TCGdex renvoie une URL d'image *sans* extension
 * (ex. https://assets.tcgdex.net/fr/base/base1/63).
 * Il faut suffixer la qualité et le format pour obtenir un fichier.
 */
export type Quality = 'low' | 'high';

export function tcgdexImage(base: string, quality: Quality = 'high'): string {
  const clean = base.replace(/\/+$/, '');
  return quality === 'low' ? `${clean}/low.webp` : `${clean}/high.png`;
}

export interface ResolvedImage {
  src: string;
  /** 'scan' = photo d'un contributeur, 'official' = visuel de référence TCGdex. */
  kind: 'scan' | 'official';
}

/** Le strict nécessaire pour choisir un visuel (évite d'exiger une Card complète). */
export type ImageSource = Pick<Card, 'scan_url' | 'image_url' | 'official_image_url'>;

/**
 * Ordre de priorité : scan communautaire > image envoyée sur la fiche >
 * visuel officiel TCGdex. Renvoie null s'il faut retomber sur le placeholder.
 */
export function resolveCardImage(card: ImageSource, quality: Quality = 'high'): ResolvedImage | null {
  if (card.scan_url) return { src: card.scan_url, kind: 'scan' };
  if (card.image_url) return { src: card.image_url, kind: 'scan' };
  if (card.official_image_url) {
    return { src: tcgdexImage(card.official_image_url, quality), kind: 'official' };
  }
  return null;
}

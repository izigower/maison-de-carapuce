import type { Card } from '@/types';

/** Le strict nécessaire pour choisir un visuel (évite d'exiger une Card complète). */
export type ImageSource = Pick<Card, 'image_url' | 'back_image_url'>;

export interface ResolvedImage {
  src: string;
  face: 'recto' | 'verso';
}

/**
 * Les image_url en base sont des URLs complètes, extension comprise
 * (TCGdex `/high.webp`, Pokécardex `.jpg?class=hd`, PriceCharting…).
 * Rien à reconstruire : on les sert telles quelles.
 *
 * Tout hôte servi ici doit figurer dans `next.config.ts` → sinon
 * l'optimiseur Next répond 400 et l'image reste vide.
 */
export function resolveCardImage(card: ImageSource): ResolvedImage | null {
  if (card.image_url) return { src: card.image_url, face: 'recto' };
  if (card.back_image_url) return { src: card.back_image_url, face: 'verso' };
  return null;
}

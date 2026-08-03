import type { NextConfig } from 'next';

/**
 * Hôtes d'images autorisés pour l'optimiseur Next.
 *
 * Un hôte absent de cette liste ne provoque PAS un placeholder : l'optimiseur
 * répond 400 (INVALID_IMAGE_OPTIMIZE_REQUEST) et la carte reste vide.
 * Toute nouvelle source d'`image_url` doit donc être ajoutée ici.
 */
const IMAGE_HOSTS = [
  'assets.tcgdex.net',           // visuels de référence TCGdex
  'images.pokemontcg.io',        // Pokémon TCG API
  'pokecardex-scans.b-cdn.net',  // Pokécardex (scans FR/JP)
  'storage.googleapis.com',      // PriceCharting
  'tcgrepublic.com',
  'tcgplayer-cdn.tcgplayer.com',
  'ik.imagekit.io',
  'www.cardshunter.fr',
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Scans communautaires (Supabase Storage)
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      ...IMAGE_HOSTS.map(hostname => ({
        protocol: 'https' as const,
        hostname,
        pathname: '/**',
      })),
    ],
  },
};

export default nextConfig;

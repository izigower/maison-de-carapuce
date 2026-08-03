import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Visuels de référence TCGdex (cf. lib/cardImage.ts)
        protocol: 'https',
        hostname: 'assets.tcgdex.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

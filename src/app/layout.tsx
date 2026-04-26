import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'La Maison de Carapuce',
  description:
    'Archive communautaire de toutes les cartes Carapuce jamais imprimées — toutes les langues, tous les sets, toutes les variantes.',
  openGraph: {
    title: 'La Maison de Carapuce',
    description: 'Archive communautaire · Catalogue Carapuce · Est. 1996',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Nav user={user} />
        {children}
        <Footer />
      </body>
    </html>
  );
}

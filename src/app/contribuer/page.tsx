import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ContribClient from './ContribClient';
import type { Card } from '@/types';

export const metadata: Metadata = {
  title: 'Contribuer — La Maison de Carapuce',
  description: 'Ajoutez une carte à l\'archive, offrez un item, ou corrigez une notice.',
};

export default async function ContribuerPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cards')
    .select('*')
    .eq('is_owned', true);

  const ownedCards: Card[] = data ?? [];

  return <ContribClient ownedCards={ownedCards} />;
}

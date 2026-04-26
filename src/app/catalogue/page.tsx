import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import CatalogueClient from './CatalogueClient';
import type { Card } from '@/types';

export const metadata: Metadata = {
  title: 'Catalogue — La Maison de Carapuce',
  description: 'Toutes les cartes Carapuce recensées : langues, sets, variantes.',
};

export default async function CataloguePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cards')
    .select('*')
    .order('year', { ascending: true })
    .order('set_name', { ascending: true });

  const cards: Card[] = data ?? [];

  return <CatalogueClient cards={cards} />;
}

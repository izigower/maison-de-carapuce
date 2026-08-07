import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { p } from '@/lib/palette';
import VerificationClient from './VerificationClient';
import CatalogueACorriger from './CatalogueACorriger';
import { isCurator, type CarteMasquee, type ResearchCandidate, type ResearchStats } from '@/types';

export const metadata: Metadata = {
  title: 'Vérification — La Maison de Carapuce',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const EMPTY: ResearchStats = {
  tcg_a_trier: 0, non_tcg_a_trier: 0, sans_image: 0,
  image_bloquee: 0, gardes: 0, rejetes: 0, types: [],
};

type Onglet = 'tcg' | 'non_tcg' | 'catalogue';

export default async function VerificationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const brut = Array.isArray(sp.kind) ? sp.kind[0] : sp.kind;
  const onglet: Onglet =
    brut === 'non_tcg' ? 'non_tcg' : brut === 'catalogue' ? 'catalogue' : 'tcg';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/verification');

  const { data: profile } = await supabase
    .from('profiles').select('role, handle').eq('id', user.id).single();

  if (!isCurator(profile?.role)) {
    return (
      <main style={{ padding: '120px 56px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 40, fontWeight: 400 }}>
          Réservé aux conservateurs
        </h1>
        <Link href="/catalogue" style={{ display: 'inline-block', marginTop: 24, color: p.water }}>
          ← Retour au catalogue
        </Link>
      </main>
    );
  }

  const [{ data: stats }, { data: masquees }] = await Promise.all([
    supabase.rpc('get_research_stats'),
    supabase.rpc('get_cartes_masquees'),
  ]);

  const nbMasquees = (masquees as CarteMasquee[] | null)?.length ?? 0;

  if (onglet === 'catalogue') {
    return (
      <CatalogueACorriger
        cartes={(masquees ?? []) as CarteMasquee[]}
        stats={(stats as ResearchStats) ?? EMPTY}
      />
    );
  }

  const { data: rows } = await supabase
    .from('research_candidates').select('*')
    .eq('kind', onglet)
    .order('preuve', { ascending: true })
    .order('langue', { ascending: true })
    .order('annee', { ascending: true });

  return (
    <VerificationClient
      candidats={(rows ?? []) as ResearchCandidate[]}
      stats={(stats as ResearchStats) ?? EMPTY}
      kind={onglet}
      nbMasquees={nbMasquees}
    />
  );
}

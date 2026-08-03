import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { p } from '@/lib/palette';
import AdminClient from './AdminClient';
import type { Contribution } from '@/types';

export const metadata: Metadata = {
  title: 'Conservation — La Maison de Carapuce',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, handle')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <main style={{ padding: '120px 56px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 16 }}>
          Accès réservé
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 42, fontWeight: 400 }}>
          Réservé aux conservateurs
        </h1>
        <p style={{ color: p.inkSoft, marginTop: 20, fontSize: 15, lineHeight: 1.6 }}>
          Ton compte n&apos;a pas les droits de conservation. Si c&apos;est ton archive,
          exécute dans le SQL Editor de Supabase :
        </p>
        <pre style={{
          textAlign: 'left', marginTop: 20, padding: 18, background: p.card,
          border: `1px solid ${p.rule}`, fontSize: 12, overflowX: 'auto',
        }}>
{`UPDATE profiles SET is_admin = TRUE
 WHERE id = '${user.id}';`}
        </pre>
        <Link href="/catalogue" style={{ display: 'inline-block', marginTop: 28, color: p.water, fontSize: 14 }}>
          ← Retour au catalogue
        </Link>
      </main>
    );
  }

  const [{ data: pending }, { data: recent }] = await Promise.all([
    supabase.from('contributions').select('*')
      .eq('status', 'pending').order('created_at', { ascending: true }),
    supabase.from('contributions').select('*')
      .neq('status', 'pending').order('reviewed_at', { ascending: false }).limit(20),
  ]);

  return (
    <AdminClient
      pending={(pending ?? []) as Contribution[]}
      recent={(recent ?? []) as Contribution[]}
      curator={profile.handle ?? 'conservateur'}
    />
  );
}

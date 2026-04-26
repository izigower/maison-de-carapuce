'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { p } from '@/lib/palette';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const NAV_ITEMS = [
  { href: '/', label: 'Accueil' },
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/donateurs', label: 'Donateurs' },
  { href: '/contribuer', label: 'Contribuer' },
];

export default function Nav({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleAuth() {
    if (user) {
      await supabase.auth.signOut();
      router.refresh();
    } else {
      router.push('/auth');
    }
  }

  return (
    <header style={{
      borderBottom: `1px solid ${p.rule}`,
      padding: '22px 56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: p.bg,
      zIndex: 50,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 14, textDecoration: 'none' }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `1.5px solid ${p.ink}`,
          position: 'relative',
          flexShrink: 0,
          alignSelf: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: p.water }} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 20, fontWeight: 500, letterSpacing: -0.3 }}>
            La Maison de Carapuce
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: p.inkSoft, marginTop: 1 }}>
            Catalogue communautaire · Est. 1996
          </div>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              background: 'none',
              fontFamily: 'inherit',
              fontSize: 13,
              padding: '8px 16px',
              color: active ? p.ink : p.inkSoft,
              borderBottom: active ? `1.5px solid ${p.brass}` : '1.5px solid transparent',
              letterSpacing: 0.2,
              textDecoration: 'none',
              display: 'inline-block',
            }}>
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleAuth}
          style={{
            marginLeft: 18,
            background: p.ink,
            color: p.bg,
            border: 'none',
            fontFamily: 'inherit',
            fontSize: 12,
            padding: '10px 18px',
            cursor: 'pointer',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {user ? 'Se déconnecter' : 'Se connecter'}
        </button>
      </nav>
    </header>
  );
}

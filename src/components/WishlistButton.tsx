'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { p } from '@/lib/palette';

export default function WishlistButton({ cardId, isLoggedIn }: { cardId: string; isLoggedIn: boolean }) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleClick() {
    if (!isLoggedIn) {
      router.push('/auth');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    await supabase.from('wishlists').upsert({ user_id: user.id, card_id: cardId });
    setAdded(true);
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || added}
      style={{
        background: added ? '#2a6a4a' : p.ink,
        color: p.bg,
        border: `1px solid ${added ? '#2a6a4a' : p.ink}`,
        fontFamily: 'inherit',
        fontSize: 13,
        padding: '12px 22px',
        cursor: added || loading ? 'default' : 'pointer',
        letterSpacing: 0.3,
        transition: 'background 0.2s',
      }}
    >
      {added ? '✓ Dans ma wishlist' : loading ? '…' : '♡ Ajouter à ma wishlist'}
    </button>
  );
}

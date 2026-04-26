import Link from 'next/link';
import { p } from '@/lib/palette';

export default function NotFound() {
  return (
    <main style={{ padding: '120px 56px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 20 }}>
        404 · Introuvable
      </div>
      <h1 style={{
        fontFamily: 'var(--font-playfair), Georgia, serif',
        fontSize: 64,
        fontWeight: 400,
        letterSpacing: -1.5,
        marginBottom: 24,
      }}>
        Cette carte n'existe pas<br />dans l'archive.
      </h1>
      <p style={{ color: p.inkSoft, marginBottom: 40 }}>
        Elle manque peut-être ? Contribuez à l'agrandir.
      </p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        <Link href="/catalogue" style={{
          background: p.ink, color: p.bg, border: `1px solid ${p.ink}`,
          padding: '12px 22px', fontSize: 13, letterSpacing: 0.3,
        }}>
          ← Retour au catalogue
        </Link>
        <Link href="/contribuer" style={{
          background: 'transparent', color: p.ink, border: `1px solid ${p.ink}`,
          padding: '12px 22px', fontSize: 13, letterSpacing: 0.3,
        }}>
          Contribuer
        </Link>
      </div>
    </main>
  );
}

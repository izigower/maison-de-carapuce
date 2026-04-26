'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { p } from '@/lib/palette';

function museumBtn(primary: boolean, disabled = false): React.CSSProperties {
  return {
    background: primary ? p.ink : 'transparent',
    color: primary ? p.bg : p.ink,
    border: `1px solid ${p.ink}`,
    fontFamily: 'inherit',
    fontSize: 13,
    padding: '14px 28px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: 0.3,
    width: '100%',
    opacity: disabled ? 0.6 : 1,
    marginTop: 8,
  };
}

function FormField({ label, type, value, onChange }: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: 'block', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: p.inkSoft, marginBottom: 24 }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        style={{
          display: 'block',
          width: '100%',
          marginTop: 8,
          padding: '10px 0',
          fontSize: 15,
          border: 'none',
          borderBottom: `1px solid ${p.rule}`,
          background: 'transparent',
          color: p.ink,
          outline: 'none',
        }}
      />
    </label>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { handle: handle || email.split('@')[0] },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setDone(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    }

    setLoading(false);
  }

  if (done) {
    return (
      <main style={{ padding: '120px 56px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 20 }}>
          Inscription envoyée
        </div>
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: 56, fontWeight: 400, letterSpacing: -1, marginBottom: 20 }}>
          Vérifiez votre email.
        </h1>
        <p style={{ color: p.inkSoft, maxWidth: 480, margin: '0 auto' }}>
          Un lien de confirmation vous a été envoyé à <strong>{email}</strong>.
          Cliquez dessus pour activer votre compte et rejoindre la communauté.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: '100px 56px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: p.brass, marginBottom: 20 }}>
          {mode === 'signin' ? 'Connexion' : 'Inscription'}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-playfair), Georgia, serif',
          fontSize: 48,
          fontWeight: 400,
          letterSpacing: -1,
          marginBottom: 48,
        }}>
          {mode === 'signin' ? 'Bon retour à la Maison.' : 'Rejoindre la communauté.'}
        </h1>

        <form onSubmit={handleSubmit}>
          <FormField label="Adresse email" type="email" value={email} onChange={setEmail} />
          {mode === 'signup' && (
            <FormField label="Pseudo (optionnel)" type="text" value={handle} onChange={setHandle} />
          )}
          <FormField label="Mot de passe" type="password" value={password} onChange={setPassword} />

          {error && (
            <div style={{ marginBottom: 16, color: '#a8485a', fontSize: 13, padding: '12px 0', borderBottom: `1px solid #a8485a33` }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={museumBtn(true, loading)}>
            {loading ? 'Chargement…' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: p.inkSoft }}>
          {mode === 'signin' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: p.ink, cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
              >
                S'inscrire
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <button
                onClick={() => setMode('signin')}
                style={{ background: 'none', border: 'none', color: p.ink, cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}
              >
                Se connecter
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

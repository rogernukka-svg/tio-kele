'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function JokerPayLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Ingresá un correo y contraseña.');
        setLoading(false);
        return;
      }

      if (isSignup) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;
      }

      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(180deg, #00150F, #003223, #000)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 20,
          padding: '32px 26px 36px',
          border: '2px solid rgba(20,255,150,0.25)',
          boxShadow: '0 0 25px rgba(0,255,120,0.15)',
          backdropFilter: 'blur(9px)',
          textAlign: 'center',
          animation: 'fadeIn .7s ease-out',
        }}
      >
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* ✨ TEXTO PRINCIPAL (SIN JOKERPAY) */}
        <p
          style={{
            color: '#FFE269',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 22,
          }}
        >
          Tu suerte está a un clic 🎲
        </p>

        {/* FORMULARIO */}
        <form onSubmit={handleAuth} style={{ display: 'grid', gap: 14 }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            style={{
              padding: '12px 14px',
              background: '#02140F',
              borderRadius: 14,
              border: '2px solid #0DD47C',
              color: '#CFFFEA',
              fontSize: 15,
              boxShadow: '0 0 8px rgba(0,255,120,0.15)',
              outline: 'none',
            }}
          />

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            style={{
              padding: '12px 14px',
              background: '#02140F',
              borderRadius: 14,
              border: '2px solid #0DD47C',
              color: '#CFFFEA',
              fontSize: 15,
              boxShadow: '0 0 8px rgba(0,255,120,0.15)',
              outline: 'none',
            }}
          />

          {error && (
            <div style={{ color: '#ff7474', fontSize: 13 }}>{error}</div>
          )}

          <button
            disabled={loading}
            type="submit"
            style={{
              background: 'linear-gradient(180deg,#FFD943,#E6B500)',
              padding: '12px 0',
              border: '2px solid #C49A00',
              boxShadow: '0 4px 0 #8A6D00',
              borderRadius: 14,
              fontWeight: 900,
              fontSize: 17,
              letterSpacing: 1,
              color: '#000',
              marginTop: 6,
            }}
          >
            {loading ? 'Procesando...' : isSignup ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        {/* SWITCH LOGIN / SIGNUP */}
        <div style={{ marginTop: 18, fontSize: 13, color: '#D0FDE8' }}>
          {isSignup ? (
            <>
              ¿Ya tenés cuenta?{' '}
              <button
                onClick={() => setIsSignup(false)}
                style={{
                  color: '#FFE269',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Iniciar sesión
              </button>
            </>
          ) : (
            <>
              ¿No tenés cuenta?{' '}
              <button
                onClick={() => setIsSignup(true)}
                style={{
                  color: '#FFE269',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Crear cuenta
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: 20, fontSize: 11, color: '#6EA590' }}>
          © {new Date().getFullYear()} JokerPay · Tu suerte, tu momento
        </div>
      </div>
    </div>
  );
}

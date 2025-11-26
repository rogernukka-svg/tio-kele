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
        setError('Ingresá un correo y una contraseña.');
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
        background: 'radial-gradient(circle at 20% 20%, #3B0E6E, #1B0A2A)',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 20,
          boxShadow: '0 0 25px rgba(0,0,0,0.4)',
          padding: '24px 26px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          textAlign: 'center',
        }}
      >
        {/* 🎭 Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>🎭</span>
          <h1
            style={{
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: 0.5,
              background: 'linear-gradient(90deg, #FFD54F, #FFB300)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            JokerPay
          </h1>
        </div>

        {/* ✨ Frase */}
        <p style={{ color: '#FFD54F', fontSize: 14, fontWeight: 500, marginBottom: 18 }}>
          Tu suerte te espera 🎲
        </p>

        {/* Formulario */}
        <form onSubmit={handleAuth} style={{ display: 'grid', gap: 12 }}>
          <input
            className="input"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 14,
            }}
          />
          <input
            className="input"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 14,
            }}
          />

          {error && <div style={{ color: '#ff9b9b', fontSize: 13 }}>{error}</div>}

          <button
            disabled={loading}
            type="submit"
            style={{
              marginTop: 6,
              background: 'linear-gradient(90deg, #FFD54F, #FFB300)',
              border: 'none',
              color: '#2B0A4D',
              fontWeight: 900,
              borderRadius: 12,
              padding: '10px 0',
              fontSize: 15,
              transition: 'all .2s ease-in-out',
            }}
          >
            {loading ? 'Procesando...' : isSignup ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>

        {/* Cambiar modo */}
        <div style={{ marginTop: 14, fontSize: 13, color: '#bbb' }}>
          {isSignup ? (
            <>
              ¿Ya tenés cuenta?{' '}
              <button
                onClick={() => setIsSignup(false)}
                style={{
                  color: '#FFD54F',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Iniciar sesión
              </button>
            </>
          ) : (
            <>
              ¿Sin cuenta?{' '}
              <button
                onClick={() => setIsSignup(true)}
                style={{
                  color: '#FFD54F',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Crear cuenta
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: 18, fontSize: 11, color: '#777' }}>
          © {new Date().getFullYear()} JokerPay · Tu suerte, tu momento
        </div>
      </div>
    </div>
  );
}

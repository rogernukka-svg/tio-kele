'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export function JokerPayHeader() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/login');
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'linear-gradient(90deg, #2a0f3a, #3a134f 80%)',
        color: '#fff',
        fontWeight: 700,
      }}
    >
      <div
        onClick={() => router.replace('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '1.2rem',
        }}
      >
        <div style={{ fontSize: '1.6rem' }}>🎭</div>
        <div>
          <span>Joker</span>
          <span style={{ color: '#FFD33D' }}>Pay</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {user ? (
          <>
            <span style={{ opacity: 0.8 }}>{user.email}</span>
            <button
              onClick={handleLogout}
              style={{
                background: '#FFD33D',
                color: '#1b1426',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Salir
            </button>
          </>
        ) : (
          <button
            onClick={() => router.replace('/login')}
            style={{
              background: '#FFD33D',
              color: '#1b1426',
              border: 'none',
              borderRadius: '999px',
              padding: '6px 12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  );
}

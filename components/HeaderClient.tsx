'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function HeaderClient() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setUsername(
        data.session?.user?.user_metadata?.username ?? null
      );
      setLoading(false);
    });

    // Cambios de sesión (login / logout)
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUsername(
          session?.user?.user_metadata?.username ?? null
        );
      }
    );

    return () => {
      sub.subscription?.unsubscribe();
    };
  }, []);

  // 🔐 LOGOUT REAL
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });

      // Limpia estado local
      setUsername(null);

      // Redirige al login
      window.location.href = '/login';
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        background:
          'linear-gradient(90deg, #064E3B 0%, #0f8a5f 50%, #0c593f 100%)',
        borderBottom: '2px solid #FACC15',
        boxShadow: '0 0 18px rgba(250, 204, 21, 0.25)',
      }}
    >
      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="/logo-kele.png"
          alt="Logo El Código"
          style={{
            height: 46,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.4))',
          }}
        />
      </div>

      {/* ACCIONES */}
      {!loading && (
        <>
          {username ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.35)',
                  border: '2px solid #FACC15',
                  color: '#FACC15',
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                👤 {username}
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: '#7f1d1d',
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <a
              href="/login"
              style={{
                background: 'linear-gradient(180deg,#FACC15,#D8A600)',
                color: '#1A1A1A',
                padding: '10px 20px',
                fontWeight: 800,
                borderRadius: 12,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(250,204,21,0.3)',
              }}
            >
              Iniciar sesión
            </a>
          )}
        </>
      )}
    </header>
  );
}

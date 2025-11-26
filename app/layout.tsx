import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'El Código | Información instantánea',
  description: 'Raspadita digital con estilo verde + dorado.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          background: 'radial-gradient(circle at top, #022C22, #020617)',
          color: 'white',
          fontFamily: '"Poppins", sans-serif',
        }}
      >
        {/* 🌟 HEADER NUEVO */}
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
              src="/logo-kele.png"      // ← CAMBIAR AQUÍ EL NOMBRE DEL LOGO
              alt="Logo El Código"
              style={{
                height: 46,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.4))',
              }}
            />
          </div>

          {/* BOTÓN LOGIN */}
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
        </header>

        {/* CONTENIDO */}
        <main
          style={{
            minHeight: 'calc(100vh - 120px)',
            paddingBottom: '40px',
          }}
        >
          {children}
        </main>

        {/* FOOTER */}
        <footer
          className="site-footer"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.15)',
            padding: '16px',
            textAlign: 'center',
            color: '#bbb',
            fontSize: '0.9rem',
            background: 'linear-gradient(180deg,#022C22,#011a13)',
          }}
        >
          <div>© {new Date().getFullYear()} <strong>El Código</strong> · Información instantánea</div>
          <div style={{ marginTop: '4px', fontWeight: 700 }}>+18</div>
        </footer>
      </body>
    </html>
  );
}

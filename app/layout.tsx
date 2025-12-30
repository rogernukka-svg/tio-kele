import './globals.css';
import type { Metadata } from 'next';
import HeaderClient from '../components/HeaderClient';


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
        {/* 🌟 HEADER DINÁMICO */}
        <HeaderClient />

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
          <div>
            © {new Date().getFullYear()} <strong>El Código</strong> · Información
            instantánea
          </div>
          <div style={{ marginTop: '4px', fontWeight: 700 }}>+18</div>
        </footer>
      </body>
    </html>
  );
}

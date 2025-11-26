'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

type Role = 'admin' | 'cashier' | 'user' | null;

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Guard de rol (admin o cashier)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      setEmail(session?.user?.email ?? null);
      if (!session?.user?.id) { router.replace('/login'); return; }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      const r = (!error && data?.role ? (data.role as Role) : 'user');
      setRole(r);
      setLoading(false);

      if (r !== 'cashier' && r !== 'admin') router.replace('/'); // solo cajero/admin
    })();
    return () => { mounted = false; };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const isActive = (href: string) => (pathname === href);

  if (loading || (role !== 'cashier' && role !== 'admin')) {
    return (
      <div className="container">
        <div className="card">Verificando permisos…</div>
      </div>
    );
  }

  return (
    <div className="cashier-shell" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ borderRight: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo" style={{ height: 36, width: 36, borderRadius: 10, background: 'linear-gradient(180deg,#3a134f,#2a0f3a)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,.08)' }}>💵</div>
          <div className="brand" style={{ fontWeight: 900, fontSize: 18 }}>
            Cajero <span className="text-gold">RasPay</span>
          </div>
        </div>

        <nav style={{ padding: 12, display: 'grid', gap: 6 }}>
          <NavItem href="/cashier" label="Validar ticket" active={isActive('/cashier')} icon="✅" />
          <NavItem href="/cashier/lookup" label="Consultar premio" active={isActive('/cashier/lookup')} icon="🔎" />
          <NavItem href="/cashier/history" label="Historial" active={isActive('/cashier/history')} icon="🧾" />
        </nav>

        <div style={{ padding: 12, marginTop: 'auto' }}>
          <div className="card">
            <div className="small">Sesión</div>
            <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4 }}>{email ?? '—'}</div>
            <button className="btn" style={{ marginTop: 10, width: '100%' }} onClick={signOut}>Salir</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <section style={{ display: 'grid', gridTemplateRows: '56px 1fr' }}>
        <Topbar />
        <main style={{ padding: 16 }}>
          {children}
        </main>
      </section>
    </div>
  );
}

function Topbar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
      borderBottom: '1px solid rgba(255,255,255,.08)', background: 'linear-gradient(180deg, #241336 0%, #1E0F2C 100%)'
    }}>
      <div style={{ fontWeight: 900 }}>Panel Cajero</div>
      <div style={{ flex: 1 }} />
      <Link href="/" className="btn">🏠 Ir al juego</Link>
    </div>
  );
}

function NavItem({ href, label, active, icon }: { href: string; label: string; active?: boolean; icon?: string }) {
  return (
    <Link
      href={href}
      className="btn"
      style={{
        justifyContent: 'flex-start',
        background: active ? 'var(--brand)' : '#2b1a40',
        color: active ? '#1b1426' : '#fff',
        borderColor: active ? 'transparent' : 'rgba(255,255,255,.10)',
        fontWeight: 800
      }}
    >
      <span style={{ width: 20, textAlign: 'center' }}>{icon ?? '•'}</span>
      {label}
    </Link>
  );
}

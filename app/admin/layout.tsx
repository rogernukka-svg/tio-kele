'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

type Role = 'admin' | 'cashier' | 'user' | null;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Guard de rol (solo admin)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      setEmail(session?.user?.email ?? null);
      if (!session?.user?.id) {
        router.replace('/login'); // o '/'
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      const r = (!error && data?.role ? (data.role as Role) : 'user');
      setRole(r);
      setLoading(false);

      if (r !== 'admin') router.replace('/'); // saca a no-admin
    })();

    return () => { mounted = false; };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const isActive = (href: string) => (pathname === href);

  if (loading || role !== 'admin') {
    return (
      <div className="container">
        <div className="card">Verificando permisos…</div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ borderRight: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo" style={{ height: 36, width: 36, borderRadius: 10, background: 'linear-gradient(180deg,#3a134f,#2a0f3a)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,.08)' }}>🎰</div>
          <div className="brand" style={{ fontWeight: 900, fontSize: 18 }}>
            <span>Ras</span><span className="text-gold">Pay</span> <span className="brand-chip" style={{ marginLeft: 8 }}>Admin</span>
          </div>
        </div>

        <nav style={{ padding: 12, display: 'grid', gap: 6 }}>
          <NavItem href="/admin" label="Dashboard" active={isActive('/admin')} icon="📊" />
          <NavItem href="/admin/users" label="Usuarios" active={isActive('/admin/users')} icon="👥" />
          <NavItem href="/admin/tickets" label="Tickets" active={isActive('/admin/tickets')} icon="🎫" />
          <NavItem href="/admin/winners" label="Ganadores" active={isActive('/admin/winners')} icon="🏆" />
          <NavItem href="/admin/settings" label="Ajustes" active={isActive('/admin/settings')} icon="⚙️" />
        </nav>

        <div style={{ padding: 12, marginTop: 'auto' }}>
          <div className="card">
            <div className="small">Sesión</div>
            <div style={{ fontWeight: 800, fontSize: 13, marginTop: 4 }}>
              {email ?? '—'}
            </div>
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
      <div style={{ fontWeight: 900 }}>Panel de Administración</div>
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

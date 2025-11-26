'use client';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="container">
      <div className="header" style={{ marginBottom: 16 }}>
        <div className="logo">🛠</div>
        <div style={{ fontWeight: 900, fontSize: 20 }}>
          <span>Panel </span><span className="text-gold">Admin</span>
        </div>
        <div style={{ flex: 1 }} />
        <Link className="btn" href="/">⬅ Volver al juego</Link>
      </div>

      <div className="main-grid">
        <div className="card-strong">
          <h2 style={{ marginBottom: 6 }}>Acciones rápidas</h2>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Aquí vamos a agregar: crear usuarios (sin email), crear cajeros, asignar monedas / saldo, etc.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button className="btn btn-gold" disabled>➕ Crear usuario (próx.)</button>
            <button className="btn" disabled>👔 Crear cajero (próx.)</button>
            <button className="btn" disabled>💰 Cargar monedas (próx.)</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Resumen (demo)</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Usuarios: —</li>
            <li>Cajeros: —</li>
            <li>Monedas disponibles: —</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

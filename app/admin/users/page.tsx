'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

/**
 * Admin: crear usuarios sin email real (nombre + teléfono + contraseña)
 * - Genera un "email ficticio" a partir del teléfono: `${phone}@raspay.local`
 * - Crea el user en Auth (con password) y guarda profile { id, email, name, phone, role }
 *
 * Nota: supabase.auth.admin.createUser requiere la clave de servicio (service_role) en el backend.
 * Si estás ejecutando esto desde el cliente en dev, solo funcionará si tu cliente permite admin.createUser.
 * Recomendación segura: mover la creación real a una función server-side (RPC o endpoint).
 */

type Role = 'admin' | 'cashier' | 'user';

interface UserRow {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: Role;
}

function normalizePhone(p: string) {
  // limpiar espacios, paréntesis, guiones; dejar solo dígitos y prefijo + si viene
  let s = (p || '').trim();
  s = s.replace(/\s+/g, '');
  s = s.replace(/[()\-\.]/g, '');
  // si no empieza con +, puedes asumir país (ej: +595) o exigir el +
  if (!s.startsWith('+')) {
    // aquí asumimos Paraguay +595 si el usuario entrega sin prefijo
    if (s.length === 8 || s.length === 9) s = '+595' + s;
    else s = '+' + s;
  }
  return s;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, phone, role')
      .order('created_at', { ascending: false });
    if (!error && data) setUsers(data as UserRow[]);
  }

  function makePseudoEmailFromPhone(phoneNormalized: string) {
    // Reemplaza caracteres problemáticos para que sea un correo válido
    // Uso: +595981234567 -> +595981234567@raspay.local
    return `${phoneNormalized}@raspay.local`.replace(/\+/g, 'plus'); // cambia + por 'plus' para evitar problemas
  }

  const createUser = async () => {
    const phoneRaw = phone.trim();
    const nameRaw = name.trim();
    const passRaw = password;

    if (!nameRaw) return alert('Ingresá un nombre');
    if (!phoneRaw) return alert('Ingresá un teléfono');
    if (!passRaw || passRaw.length < 6) return alert('Ingresá una contraseña de al menos 6 caracteres');

    setLoading(true);

    const phoneNorm = normalizePhone(phoneRaw);
    const pseudoEmail = makePseudoEmailFromPhone(phoneNorm); // ej: plus595981234567@raspay.local

    try {
      /**
       * Opción A (rápida): usar supabase.auth.admin.createUser (solo con service_role key)
       * Si tu cliente no permite llamar admin desde el frontend por seguridad, mover esta lógica a un endpoint server-side.
       */
      // @ts-ignore - admin API
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: pseudoEmail,
        password: passRaw,
        email_confirm: true,
        user_metadata: { name: nameRaw, phone: phoneNorm }
      });

      if (authErr) {
        console.error('auth error', authErr);
        alert('Error creando usuario: ' + authErr.message);
        setLoading(false);
        return;
      }
      if (!authData?.user?.id) {
        alert('No se recibió id de usuario al crear auth');
        setLoading(false);
        return;
      }

      // Insertar en profiles
      const profile = {
        id: authData.user.id,
        email: pseudoEmail,
        name: nameRaw,
        phone: phoneNorm,
        role
      };

      const { error: pErr } = await supabase.from('profiles').insert([profile]);
      if (pErr) {
        console.error('profiles insert error', pErr);
        alert('Error guardando perfil: ' + pErr.message);
        setLoading(false);
        return;
      }

      // actualizar listado local
      setUsers(u => [{ id: profile.id, email: profile.email, name: profile.name, phone: profile.phone, role: profile.role }, ...u]);
      setName(''); setPhone(''); setPassword(''); setRole('user');
      alert('Usuario creado correctamente');
    } catch (err) {
      console.error(err);
      alert('Error inesperado creando usuario');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Eliminar usuario? Esto borrará su perfil y acceso.')) return;
    setLoading(true);
    try {
      // ELIMINAR profile (cascade si tienes FK wallets)
      const { error: delProfileErr } = await supabase.from('profiles').delete().eq('id', id);
      if (delProfileErr) { alert('Error borrando perfil: ' + delProfileErr.message); setLoading(false); return; }

      // ELIMINAR user de auth: requiere admin API o server-side
      // @ts-ignore
      const { error: delAuthErr } = await supabase.auth.admin.deleteUser(id);
      if (delAuthErr) {
        console.warn('No se pudo borrar auth user desde cliente: ', delAuthErr.message);
        // Si no podés borrar desde cliente, tu backend SERVER debe limpiar auth
      }

      setUsers(u => u.filter(x => x.id !== id));
    } catch (e) {
      console.error(e);
      alert('Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16 }}>👥 Gestión de usuarios (nombre + teléfono)</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Nuevo usuario (sin email)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 220px 150px', gap: 8, alignItems: 'center' }}>
          <input className="input" placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} />
          <input className="input" placeholder="Teléfono (ej: 981234567)" value={phone} onChange={e => setPhone(e.target.value)} />
          <input className="input" placeholder="Contraseña (min 6)" value={password} onChange={e => setPassword(e.target.value)} />
          <select className="input" value={role} onChange={e => setRole(e.target.value as Role)}>
            <option value="user">Usuario</option>
            <option value="cashier">Cajero</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-gold" disabled={loading} onClick={createUser}>Crear usuario</button>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
          <strong>Info:</strong> el teléfono se normaliza y se usa para generar un email ficticio interno.
        </div>
      </div>

      <div className="card">
        <h2>Usuarios existentes</h2>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Nombre</th><th>Teléfono</th><th>Email interno</th><th>Rol</th><th></th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name ?? '—'}</td>
                <td>{u.phone ?? '—'}</td>
                <td style={{ fontFamily: 'monospace', opacity: .9 }}>{u.email}</td>
                <td>{u.role}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn" onClick={() => deleteUser(u.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ opacity:.8 }}>No hay usuarios aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

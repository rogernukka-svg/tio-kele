// lib/useProfileRole.ts
'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export type Role = 'admin' | 'cashier' | 'user' | null;

export function useProfileRole() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setEmail(null); setRole(null); setUserId(null); setLoading(false);
      return;
    }
    setEmail(user.email ?? null);
    setUserId(user.id);
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single(); // 👈 importante

    if (error) {
      console.warn('No se pudo leer profiles.role', error);
      setRole('user'); // fallback
    } else {
      setRole((data?.role as Role) ?? 'user');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, _session) => load());
    return () => { sub.subscription?.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmail(null); setRole(null); setUserId(null);
  };

  return { email, role, roleLoading: loading, userId, signOut, reload: load };
}

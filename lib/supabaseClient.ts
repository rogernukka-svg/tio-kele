'use client';
import { createClient } from '@supabase/supabase-js';

// ✅ Variables de entorno (definidas en .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 🚀 Cliente Supabase con manejo automático de sesión
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'raspay-auth', // 👈 nombre personalizado para evitar conflictos con otras apps
  },
});

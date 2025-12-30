import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,      // guarda sesión en el navegador
      autoRefreshToken: true,    // renueva token automáticamente
      detectSessionInUrl: true,  // necesario para redirects / login
    },
  }
);

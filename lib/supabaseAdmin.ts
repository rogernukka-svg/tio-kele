import { createClient } from "@supabase/supabase-js";

// ⚠️ También usa SERVICE ROLE para operaciones de administrador (API delete, update)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { createClient } from "@supabase/supabase-js";

// Servicio admin → requiere SERVICE ROLE
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

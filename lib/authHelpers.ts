import { supabaseServer } from "./supabaseServer";

export async function requireAdmin(req: Request) {
  // Crear instancia de supabase por request
  const supabase = supabaseServer();

  // Obtener usuario autenticado
  const { data, error } = await supabase.auth.getUser();

  // Si no hay sesión → null
  if (error || !data?.user) return null;

  // Validar rol admin dentro del user_metadata
  const role = data.user.user_metadata?.role;

  if (role !== "admin") return null;

  return data.user;
}

// Conversión de teléfono a pseudo-email
export function phoneToPseudoEmail(phoneNormalized: string) {
  return `${phoneNormalized}@raspay.local`.replace(/\+/g, "plus");
}

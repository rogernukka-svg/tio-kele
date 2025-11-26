import { supabaseServer } from "./supabaseServer";

export async function requireAdmin(req: Request) {
  const { data, error } = await supabaseServer.auth.getUser();

  if (error || !data.user) return null;

  if (data.user.user_metadata.role !== "admin") return null;

  return data.user;
}


export function phoneToPseudoEmail(phoneNormalized: string) {
  // +595981234567 -> plus595981234567@raspay.local
  return `${phoneNormalized}@raspay.local`.replace(/\+/g, 'plus');
}

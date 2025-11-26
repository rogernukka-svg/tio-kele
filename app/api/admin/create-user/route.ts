import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { normalizePhone, phoneToPseudoEmail } from '@/lib/authHelpers';

type Role = 'admin' | 'cashier' | 'user';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name: string = (body?.name || '').trim();
    const phoneRaw: string = (body?.phone || '').trim();
    const password: string = (body?.password || '').trim();
    const role: Role = body?.role ?? 'user';

    if (!name || !phoneRaw || !password || password.length < 6) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Guard: solo admin
    const sb = supabaseServer();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: meProfile } = await sb.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
    if (meProfile?.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 });

    // Crear auth + perfil
    const phone = normalizePhone(phoneRaw);
    const pseudoEmail = phoneToPseudoEmail(phone);

    const { data: authRes, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: pseudoEmail,
      password,
      email_confirm: true,
      user_metadata: { name, phone }
    });
    if (authErr || !authRes?.user?.id) {
      return NextResponse.json({ error: authErr?.message || 'Error creando auth' }, { status: 400 });
    }

    const profile = { id: authRes.user.id, email: pseudoEmail, name, phone, role };
    const { error: pErr } = await supabaseAdmin.from('profiles').insert([profile]);
    if (pErr) {
      await supabaseAdmin.auth.admin.deleteUser(authRes.user.id);
      return NextResponse.json({ error: pErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: { id: profile.id, ...profile } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 });
  }
}

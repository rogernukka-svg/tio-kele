import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;

    // Guard: solo admin
    const sb = supabaseServer();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const { data: meProfile } = await sb.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
    if (meProfile?.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 });

    // Borrar perfil y auth
    await supabaseAdmin.from('profiles').delete().eq('id', userId);
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 });
  }
}

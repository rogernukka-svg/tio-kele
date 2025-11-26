import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const target_id: string = body?.target_id;
    const qty: number = Number(body?.qty);

    if (!target_id || !qty || qty <= 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Guard: solo admin
    const sb = supabaseServer();
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    const { data: meProfile } = await sb.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
    if (meProfile?.role !== 'admin') return NextResponse.json({ error: 'Solo admin' }, { status: 403 });

    // Ejecutar RPC de emisión
    const { error } = await supabaseAdmin.rpc('give_coins', { target_id, qty });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error inesperado' }, { status: 500 });
  }
}

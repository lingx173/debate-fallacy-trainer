import { NextRequest, NextResponse } from 'next/server';
import { clientErrorMessage } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('id, name, avatar_emoji, created_at')
      .eq('id', params.id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = getSupabase();
    const { error } = await sb.from('profiles').delete().eq('id', params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 500 });
  }
}

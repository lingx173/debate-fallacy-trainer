import { NextRequest, NextResponse } from 'next/server';
import { clientErrorMessage } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .select('id, name, avatar_emoji, created_at')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: unknown) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, avatar_emoji } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profiles')
      .insert({ name: name.slice(0, 40), avatar_emoji: avatar_emoji || '🎓' })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 500 });
  }
}

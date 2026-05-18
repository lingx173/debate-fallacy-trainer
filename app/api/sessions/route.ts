import { NextRequest, NextResponse } from 'next/server';
import { clientErrorMessage } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, mode, topic, difficulty, target_fallacy } = body;
    if (!profile_id || !mode || !difficulty) {
      return NextResponse.json({ error: 'profile_id, mode, difficulty required' }, { status: 400 });
    }
    const sb = getSupabase();
    const { data, error } = await sb
      .from('sessions')
      .insert({
        profile_id,
        mode,
        topic: topic ?? null,
        difficulty,
        target_fallacy: target_fallacy ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get('profile_id');
    if (!profileId) {
      return NextResponse.json({ error: 'profile_id required' }, { status: 400 });
    }
    const sb = getSupabase();
    const { data, error } = await sb
      .from('sessions')
      .select('*')
      .eq('profile_id', profileId)
      .order('started_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 500 });
  }
}

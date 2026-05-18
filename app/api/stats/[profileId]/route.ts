import { NextRequest, NextResponse } from 'next/server';
import { clientErrorMessage } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { profileId: string } }) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('profile_fallacy_stats')
      .select('*')
      .eq('profile_id', params.profileId)
      .order('accuracy_pct', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 500 });
  }
}

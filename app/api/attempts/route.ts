import { NextRequest, NextResponse } from 'next/server';
import { clientErrorMessage } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      session_id,
      profile_id,
      question_index,
      fallacy_slug,
      fallacy_name,
      argument_text,
      options,
      selected_slug,
      is_correct,
      explanation,
    } = body;

    if (!session_id || !profile_id || question_index === undefined || !fallacy_slug) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }
    const sb = getSupabase();
    const { data, error } = await sb
      .from('attempts')
      .insert({
        session_id,
        profile_id,
        question_index,
        fallacy_slug,
        fallacy_name,
        argument_text,
        options,
        selected_slug,
        is_correct,
        explanation,
        answered_at: selected_slug ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 500 });
  }
}

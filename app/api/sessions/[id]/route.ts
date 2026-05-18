import { NextRequest, NextResponse } from 'next/server';
import { clientErrorMessage } from '@/lib/errors';
import { getSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = getSupabase();
    const { data: session, error: e1 } = await sb
      .from('sessions')
      .select('*')
      .eq('id', params.id)
      .single();
    if (e1) throw e1;

    const { data: attempts, error: e2 } = await sb
      .from('attempts')
      .select('*')
      .eq('session_id', params.id)
      .order('question_index', { ascending: true });
    if (e2) throw e2;

    return NextResponse.json({ session, attempts: attempts ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const sb = getSupabase();
    const update: any = {};
    if (body.finished_at) update.finished_at = body.finished_at;
    if (typeof body.total_questions === 'number') update.total_questions = body.total_questions;
    if (typeof body.correct_count === 'number') update.correct_count = body.correct_count;
    const { data, error } = await sb
      .from('sessions')
      .update(update)
      .eq('id', params.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: clientErrorMessage(e) }, { status: 500 });
  }
}

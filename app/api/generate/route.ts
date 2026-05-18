import { NextRequest, NextResponse } from 'next/server';
import { clientErrorMessage } from '@/lib/errors';
import { getOpenAI, OPENAI_MODEL } from '@/lib/openai';
import { FALLACY_BY_ID, buildOptions, pickRandomFallacies } from '@/lib/fallacies';

export const runtime = 'nodejs';
export const maxDuration = 60;

type GenInput = {
  mode: 'practice' | 'test';
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetFallacy?: string; // for practice; if omitted, picks random
  excludeFallacies?: string[]; // ids to avoid (for test variety)
};

type GenOutput = {
  fallacy_slug: string;
  fallacy_name: string;
  argument_text: string;
  explanation: string;
  options: { id: string; name: string }[];
};

const DIFFICULTY_GUIDANCE: Record<string, string> = {
  easy: 'OBVIOUS and clearly labeled. The fallacy should be unmistakable — exaggerate it slightly. Use simple vocabulary appropriate for a 12-13 year old (7th grade). Keep sentences short.',
  medium:
    'Moderately subtle. The fallacy is clearly present but mixed with one piece of actual reasoning or a real-sounding statistic so the student has to focus. Vocabulary at an 8th-9th grade level.',
  hard: 'Subtle and sophisticated. The fallacy is woven into otherwise-reasonable argumentation. Include real-sounding facts, a counter-acknowledgment, and varied sentence structure. Should fool a casual listener. Vocabulary at a 10th-12th grade level.',
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenInput;
    const { mode, topic, difficulty } = body;

    if (!mode || !difficulty) {
      return NextResponse.json({ error: 'mode and difficulty required' }, { status: 400 });
    }

    // Pick the target fallacy
    let fallacyId: string;
    if (mode === 'practice' && body.targetFallacy) {
      if (!FALLACY_BY_ID[body.targetFallacy]) {
        return NextResponse.json({ error: 'unknown fallacy' }, { status: 400 });
      }
      fallacyId = body.targetFallacy;
    } else {
      const [picked] = pickRandomFallacies(1, body.excludeFallacies ?? []);
      fallacyId = picked.id;
    }
    const fallacy = FALLACY_BY_ID[fallacyId];

    const debateTopic =
      topic && topic.trim().length > 0
        ? topic.trim().slice(0, 500)
        : 'a Public Forum debate topic of your choice that a middle schooler would find interesting (school policy, technology, environment, sports, social media, etc.)';

    const sys = `You generate short Public Forum (PF) debate crossfire snippets that DELIBERATELY contain a specific logical fallacy, for a fallacy-identification practice tool used by middle/high school debaters.

PF crossfire = a 3-minute period where two debaters question each other directly. Output style: 2-4 short conversational exchanges OR a single 60-100 word constructive-style statement that fits crossfire context. NOT a full speech.

CRITICAL RULES:
1. The output MUST clearly contain the specified fallacy as its primary flaw.
2. Do NOT mention or name the fallacy anywhere in the argument_text.
3. Do NOT include hints like "this is fallacious" or "logical fallacy".
4. The explanation must teach: name the fallacy, quote/point to the exact phrase from argument_text where it appears, explain WHY it's fallacious, and (in 1 sentence) what a debater could say in response.
5. Return ONLY valid JSON. No markdown, no preface.`;

    const usr = `Generate a PF crossfire snippet on the topic: ${debateTopic}

It must contain this fallacy as its primary logical flaw:
- Fallacy: ${fallacy.name}
- Definition: ${fallacy.short_definition}
- How it looks: ${fallacy.how_to_spot_in_crossfire}
- Example pattern: ${fallacy.example_debate}

Difficulty: ${difficulty.toUpperCase()} — ${DIFFICULTY_GUIDANCE[difficulty]}

Return JSON in EXACTLY this schema:
{
  "argument_text": "<the crossfire snippet, 2-4 short exchanges with speaker labels like 'Pro:' / 'Con:' OR a single short statement. 60-180 words.>",
  "explanation": "<2-4 sentences. Name the fallacy. Quote or paraphrase the exact phrase that contains it. Explain why it's flawed reasoning. End with one sentence on how to push back in crossfire.>"
}`;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: usr },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.85,
      max_tokens: 700,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response from OpenAI');

    let parsed: { argument_text?: string; explanation?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('OpenAI returned invalid JSON');
    }
    if (!parsed.argument_text || !parsed.explanation) {
      throw new Error('OpenAI response missing required fields');
    }

    const options = buildOptions(fallacyId);
    const out: GenOutput = {
      fallacy_slug: fallacyId,
      fallacy_name: fallacy.name,
      argument_text: parsed.argument_text.trim(),
      explanation: parsed.explanation.trim(),
      options,
    };
    return NextResponse.json(out);
  } catch (e: any) {
    console.error('Generate error:', e);
    return NextResponse.json(
      { error: clientErrorMessage(e) || 'Generation failed' },
      { status: 500 },
    );
  }
}

'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProfile } from '@/components/ProfileContext';
import { FALLACIES, FALLACY_BY_ID } from '@/lib/fallacies';
import { QuestionCard, GeneratedQuestion } from '@/components/QuestionCard';
import { Sparkles, Shuffle, ArrowLeft, Loader2 } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

function PracticeInner() {
  const { profile, loading } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFallacy = searchParams.get('fallacy') || '';

  const [fallacyId, setFallacyId] = useState(initialFallacy);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [current, setCurrent] = useState<GeneratedQuestion | null>(null);
  const [generating, setGenerating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [streak, setStreak] = useState({ correct: 0, total: 0 });

  if (loading) return <div className="container-narrow py-12 text-text-muted">Loading…</div>;
  if (!profile) {
    return (
      <div className="container-narrow py-16 text-center">
        <p className="text-text-muted mb-4">Pick a profile first.</p>
        <Link href="/" className="btn-primary">
          Go home
        </Link>
      </div>
    );
  }

  async function startOrNext(targetFallacyId: string) {
    setErr(null);
    setGenerating(true);
    try {
      // Lazily start a session on first generation
      let sid = sessionId;
      if (!sid) {
        const r = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_id: profile!.id,
            mode: 'practice',
            topic: topic || null,
            difficulty,
            target_fallacy: targetFallacyId,
          }),
        });
        const sd = await r.json();
        if (!r.ok) throw new Error(sd.error || 'Could not start session');
        sid = sd.id;
        setSessionId(sid);
      }

      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'practice',
          topic: topic || undefined,
          difficulty,
          targetFallacy: targetFallacyId,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Generation failed');
      setCurrent(data as GeneratedQuestion);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function recordAttempt(selectedId: string, isCorrect: boolean) {
    if (!current || !sessionId) return;
    setStreak((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
    try {
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          profile_id: profile!.id,
          question_index: questionIndex,
          fallacy_slug: current.fallacy_slug,
          fallacy_name: current.fallacy_name,
          argument_text: current.argument_text,
          options: current.options,
          selected_slug: selectedId,
          is_correct: isCorrect,
          explanation: current.explanation,
        }),
      });
      // Bump session totals
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_questions: questionIndex + 1,
          correct_count: streak.correct + (isCorrect ? 1 : 0),
        }),
      });
    } catch {
      /* non-fatal */
    }
  }

  function nextQuestion() {
    setQuestionIndex((i) => i + 1);
    setCurrent(null);
    if (fallacyId) void startOrNext(fallacyId);
  }

  function endSession() {
    if (sessionId) {
      void fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finished_at: new Date().toISOString() }),
      });
    }
    router.push('/history');
  }

  // Setup screen (before first generation)
  if (!current && !generating) {
    return (
      <div className="container-narrow py-10 animate-in">
        <Link href="/" className="btn-ghost mb-6">
          <ArrowLeft size={16} /> Home
        </Link>

        <header className="mb-8">
          <span className="badge badge-primary mb-3">Practice</span>
          <h1 className="font-display text-[clamp(1.75rem,1rem+2vw,2.75rem)] mb-2">
            Drill one fallacy at a time
          </h1>
          <p className="text-text-muted">
            Pick a fallacy and a debate topic. We&apos;ll generate as many fresh crossfire examples as
            you want until you can spot it cold.
          </p>
        </header>

        {err && <div className="alert alert-error mb-4">{err}</div>}

        <div className="card space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Which fallacy do you want to drill?</label>
            <select
              className="select"
              value={fallacyId}
              onChange={(e) => setFallacyId(e.target.value)}
            >
              <option value="">— Pick a fallacy —</option>
              {FALLACIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
            {fallacyId && (
              <p className="text-text-muted text-sm mt-2">{FALLACY_BY_ID[fallacyId].short_definition}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Debate topic or context <span className="text-text-faint font-normal">(optional)</span>
            </label>
            <textarea
              className="textarea"
              placeholder="e.g. School cell phone bans, climate policy, social media regulation…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={500}
            />
            <p className="text-text-faint text-xs mt-1">
              Leave blank to let the AI pick a topic appropriate for your level.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`p-3 rounded-md border-2 capitalize font-medium transition ${
                    difficulty === d
                      ? 'border-primary bg-primary-highlight text-primary'
                      : 'border-border bg-surface hover:border-text-muted'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => fallacyId && startOrNext(fallacyId)}
            disabled={!fallacyId}
            className="btn-primary w-full"
          >
            <Sparkles size={16} />
            Generate first example
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow py-8 animate-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={endSession} className="btn-ghost">
          <ArrowLeft size={16} /> End session
        </button>
        <div className="text-text-muted text-sm">
          <b className="text-text">{streak.correct}</b> / {streak.total} correct
          {streak.total > 0 && (
            <> · {Math.round((streak.correct / streak.total) * 100)}%</>
          )}
        </div>
      </div>

      {generating && (
        <div className="card flex items-center gap-3 text-text-muted">
          <Loader2 size={18} className="animate-spin text-primary" />
          Generating a fresh crossfire snippet about {FALLACY_BY_ID[fallacyId]?.name}…
        </div>
      )}

      {current && !generating && (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="badge badge-primary">Drilling: {FALLACY_BY_ID[fallacyId]?.name}</span>
            <span className="badge capitalize">{difficulty}</span>
          </div>
          <QuestionCard
            q={current}
            onAnswered={recordAttempt}
            onNext={nextQuestion}
            nextLabel="Generate another"
          />
        </>
      )}

      {err && <div className="alert alert-error mt-4">{err}</div>}

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => {
            // Random-fallacy variant
            const ids = FALLACIES.map((f) => f.id);
            const next = ids[Math.floor(Math.random() * ids.length)];
            setFallacyId(next);
            setCurrent(null);
            void startOrNext(next);
          }}
          className="btn-secondary"
          disabled={generating}
        >
          <Shuffle size={16} />
          Switch to a random fallacy
        </button>
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="container-narrow py-12 text-text-muted">Loading…</div>}>
      <PracticeInner />
    </Suspense>
  );
}

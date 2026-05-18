'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/components/ProfileContext';
import { QuestionCard, GeneratedQuestion } from '@/components/QuestionCard';
import { ClipboardCheck, ArrowLeft, Loader2, Trophy, Target, BookOpen } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'setup' | 'running' | 'done';
const TOTAL_QUESTIONS = 10;

type AnsweredQ = GeneratedQuestion & { selected: string; correct: boolean };

export default function TestPage() {
  const { profile, loading } = useProfile();

  const [phase, setPhase] = useState<Phase>('setup');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [current, setCurrent] = useState<GeneratedQuestion | null>(null);
  const [history, setHistory] = useState<AnsweredQ[]>([]);
  const [generating, setGenerating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  async function startTest() {
    setErr(null);
    setGenerating(true);
    try {
      const r = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile!.id,
          mode: 'test',
          topic: topic || null,
          difficulty,
        }),
      });
      const sd = await r.json();
      if (!r.ok) throw new Error(sd.error || 'Could not start test');
      setSessionId(sd.id);
      setPhase('running');
      setQuestionIndex(0);
      setHistory([]);
      await generateNext(sd.id, [], 0);
    } catch (e: any) {
      setErr(e.message);
      setGenerating(false);
    }
  }

  async function generateNext(sid: string, excludeIds: string[], idx: number) {
    setGenerating(true);
    setCurrent(null);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'test',
          topic: topic || undefined,
          difficulty,
          excludeFallacies: excludeIds,
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
    const newHistory: AnsweredQ[] = [
      ...history,
      { ...current, selected: selectedId, correct: isCorrect },
    ];
    setHistory(newHistory);
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
    } catch {
      /* non-fatal */
    }
  }

  async function nextOrFinish() {
    const next = questionIndex + 1;
    if (next >= TOTAL_QUESTIONS) {
      // Finish
      setPhase('done');
      if (sessionId) {
        const correct = history.filter((h) => h.correct).length;
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            finished_at: new Date().toISOString(),
            total_questions: TOTAL_QUESTIONS,
            correct_count: correct,
          }),
        });
      }
      return;
    }
    setQuestionIndex(next);
    if (sessionId) {
      const excludeIds = history.map((h) => h.fallacy_slug);
      await generateNext(sessionId, excludeIds, next);
    }
  }

  // ===== SETUP =====
  if (phase === 'setup') {
    return (
      <div className="container-narrow py-10 animate-in">
        <Link href="/" className="btn-ghost mb-6">
          <ArrowLeft size={16} /> Home
        </Link>
        <header className="mb-8">
          <span className="badge badge-primary mb-3">Test</span>
          <h1 className="font-display text-[clamp(1.75rem,1rem+2vw,2.75rem)] mb-2">
            10-question fallacy challenge
          </h1>
          <p className="text-text-muted">
            Mixed fallacies, multiple choice. Immediate feedback after each. At the end you&apos;ll see
            which fallacies you need more practice on.
          </p>
        </header>

        {err && <div className="alert alert-error mb-4">{err}</div>}

        <div className="card space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Debate topic <span className="text-text-faint font-normal">(optional)</span>
            </label>
            <textarea
              className="textarea"
              placeholder="e.g. School policy, technology, climate, social media…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={500}
            />
            <p className="text-text-faint text-xs mt-1">
              Leave blank for a mix of topics across questions.
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

          <button onClick={startTest} disabled={generating} className="btn-primary w-full">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
            Start the test
          </button>
        </div>
      </div>
    );
  }

  // ===== RUNNING =====
  if (phase === 'running') {
    return (
      <div className="container-narrow py-8 animate-in">
        <div className="mb-6 flex items-center justify-between">
          <span className="badge badge-primary">Test in progress</span>
          <span className="badge capitalize">{difficulty}</span>
        </div>

        {generating && (
          <div className="card flex items-center gap-3 text-text-muted">
            <Loader2 size={18} className="animate-spin text-primary" />
            Generating question {questionIndex + 1} of {TOTAL_QUESTIONS}…
          </div>
        )}

        {current && !generating && (
          <QuestionCard
            q={current}
            onAnswered={recordAttempt}
            onNext={nextOrFinish}
            showCounter={{ current: questionIndex + 1, total: TOTAL_QUESTIONS }}
            nextLabel={questionIndex + 1 >= TOTAL_QUESTIONS ? 'See results' : 'Next question'}
          />
        )}

        {err && <div className="alert alert-error mt-4">{err}</div>}
      </div>
    );
  }

  // ===== RESULTS =====
  const correct = history.filter((h) => h.correct).length;
  const pct = Math.round((correct / TOTAL_QUESTIONS) * 100);
  const weak = aggregateWeak(history);

  return (
    <div className="container-default py-10 animate-in">
      <header className="text-center mb-10">
        <Trophy size={48} className="mx-auto text-accent mb-4" />
        <h1 className="font-display text-[clamp(2rem,1.2rem+2.5vw,3.5rem)] mb-2">
          {pct >= 80 ? 'Strong run!' : pct >= 50 ? 'Solid effort.' : 'Good start.'}
        </h1>
        <p className="text-text-muted">
          You got <b className="text-text">{correct}</b> out of {TOTAL_QUESTIONS} ({pct}%)
        </p>
      </header>

      <div className="card mb-8">
        <h2 className="font-display text-lg mb-1 flex items-center gap-2">
          <Target size={18} className="text-primary" />
          Where to focus next
        </h2>
        <p className="text-text-muted text-sm mb-4">
          Fallacies you missed or got tripped up by — review these and try again.
        </p>

        {weak.misses.length === 0 ? (
          <p className="text-success font-medium">Perfect run on the fallacies that appeared.</p>
        ) : (
          <div className="space-y-2">
            {weak.misses.map((m) => (
              <Link
                key={m.slug}
                href={`/learn/${m.slug}`}
                className="card-hover card !p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-text-muted text-xs">
                    You answered &quot;{m.youSaid}&quot;
                  </div>
                </div>
                <BookOpen size={16} className="text-primary" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card mb-8">
        <h2 className="font-display text-lg mb-4">Question breakdown</h2>
        <ol className="space-y-2">
          {history.map((h, i) => (
            <li key={i} className="flex items-start gap-3 py-2 border-b border-divider last:border-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  h.correct
                    ? 'bg-success-highlight text-success'
                    : 'bg-error-highlight text-error'
                }`}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{h.fallacy_name}</div>
                {!h.correct && (
                  <div className="text-text-muted text-xs">
                    You picked {h.options.find((o) => o.id === h.selected)?.name}
                  </div>
                )}
              </div>
              <Link href={`/learn/${h.fallacy_slug}`} className="text-primary text-sm hover:underline">
                Review
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => {
            setPhase('setup');
            setHistory([]);
            setSessionId(null);
            setCurrent(null);
            setQuestionIndex(0);
          }}
          className="btn-primary"
        >
          Take another test
        </button>
        <Link href="/practice" className="btn-secondary">
          Drill a specific fallacy
        </Link>
        <Link href="/history" className="btn-secondary">
          See history
        </Link>
      </div>
    </div>
  );
}

function aggregateWeak(history: AnsweredQ[]) {
  const misses = history
    .filter((h) => !h.correct)
    .map((h) => ({
      slug: h.fallacy_slug,
      name: h.fallacy_name,
      youSaid: h.options.find((o) => o.id === h.selected)?.name ?? '',
    }));
  return { misses };
}

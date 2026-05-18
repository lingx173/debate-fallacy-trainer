'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useProfile } from '@/components/ProfileContext';
import { DemoExampleCard, DemoExample } from '@/components/DemoExampleCard';
import { FALLACIES, FALLACY_BY_ID } from '@/lib/fallacies';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

function DemoInner() {
  const { profile, loading } = useProfile();
  const searchParams = useSearchParams();
  const [fallacyId, setFallacyId] = useState(searchParams.get('fallacy') || '');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [current, setCurrent] = useState<DemoExample | null>(null);
  const [generating, setGenerating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) {
    return <div className="container-narrow py-12 text-text-muted">Loading…</div>;
  }
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

  async function generate() {
    if (!fallacyId) return;
    setErr(null);
    setGenerating(true);
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'practice',
          topic: topic || undefined,
          difficulty,
          targetFallacy: fallacyId,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Generation failed');
      setCurrent({
        fallacy_slug: data.fallacy_slug,
        fallacy_name: data.fallacy_name,
        argument_text: data.argument_text,
        explanation: data.explanation,
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  function backToSetup() {
    setCurrent(null);
    setErr(null);
  }

  if (!current && !generating) {
    return (
      <div className="container-narrow py-10 animate-in">
        <Link href="/" className="btn-ghost mb-6">
          <ArrowLeft size={16} /> Home
        </Link>

        <header className="mb-8">
          <span className="badge badge-primary mb-3">Demo</span>
          <h1 className="font-display text-[clamp(1.75rem,1rem+2vw,2.75rem)] mb-2">
            See the fallacy in action
          </h1>
          <p className="text-text-muted">
            Choose a fallacy you&apos;re studying and optional debate context. We&apos;ll generate a
            crossfire example for you to read — no quiz, just the snippet and an explanation when
            you&apos;re ready.
          </p>
        </header>

        {err && <div className="alert alert-error mb-4">{err}</div>}

        <div className="card space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Which fallacy?</label>
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
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
            type="button"
            onClick={() => generate()}
            disabled={!fallacyId}
            className="btn-primary w-full"
          >
            <Sparkles size={16} />
            Generate example
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow py-8 animate-in">
      <div className="flex items-center justify-between mb-6">
        <button type="button" onClick={backToSetup} className="btn-ghost">
          <ArrowLeft size={16} /> Change settings
        </button>
        <span className="badge capitalize">{difficulty}</span>
      </div>

      {generating && (
        <div className="card flex items-center gap-3 text-text-muted">
          <Loader2 size={18} className="animate-spin text-primary" />
          Generating a fresh crossfire example…
        </div>
      )}

      {current && !generating && (
        <DemoExampleCard
          example={current}
          onAnother={() => generate()}
          anotherLabel="Another example"
          busy={generating}
        />
      )}

      {err && <div className="alert alert-error mt-4">{err}</div>}
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="container-narrow py-12 text-text-muted">Loading…</div>}>
      <DemoInner />
    </Suspense>
  );
}

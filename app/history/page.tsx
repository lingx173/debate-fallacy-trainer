'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/components/ProfileContext';
import { BarChart3, BookOpen, ChevronRight, ClipboardCheck, Dumbbell, ArrowLeft, Target } from 'lucide-react';

type Session = {
  id: string;
  mode: 'practice' | 'test';
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  target_fallacy: string | null;
  started_at: string;
  finished_at: string | null;
  total_questions: number;
  correct_count: number;
};

type Stat = {
  fallacy_slug: string;
  fallacy_name: string;
  total_attempts: number;
  correct: number;
  accuracy_pct: number;
};

export default function HistoryPage() {
  const { profile, loading } = useProfile();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading || !profile) return;
    setFetching(true);
    Promise.all([
      fetch(`/api/sessions?profile_id=${profile.id}`).then((r) => r.json()),
      fetch(`/api/stats/${profile.id}`).then((r) => r.json()),
    ])
      .then(([s, st]) => {
        if (Array.isArray(s)) setSessions(s);
        if (Array.isArray(st)) setStats(st);
      })
      .finally(() => setFetching(false));
  }, [profile, loading]);

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

  const totalAnswered = stats.reduce((a, s) => a + s.total_attempts, 0);
  const totalCorrect = stats.reduce((a, s) => a + s.correct, 0);
  const overallPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  const sortedStats = [...stats].sort((a, b) => a.accuracy_pct - b.accuracy_pct);
  const weakest = sortedStats.slice(0, 5);
  const strongest = [...stats]
    .filter((s) => s.total_attempts >= 2)
    .sort((a, b) => b.accuracy_pct - a.accuracy_pct)
    .slice(0, 5);

  return (
    <div className="container-default py-10 animate-in">
      <Link href="/" className="btn-ghost mb-6">
        <ArrowLeft size={16} /> Home
      </Link>

      <header className="mb-8">
        <span className="badge badge-primary mb-3">{profile.avatar_emoji} {profile.name}</span>
        <h1 className="font-display text-[clamp(1.75rem,1rem+2vw,2.75rem)] mb-2">Your progress</h1>
        <p className="text-text-muted">
          Track which fallacies you&apos;ve mastered and which ones still trip you up.
        </p>
      </header>

      {fetching ? (
        <div className="space-y-3">
          <div className="skeleton h-24" />
          <div className="skeleton h-48" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-12">
          <BarChart3 size={40} className="mx-auto text-text-faint mb-4" />
          <h2 className="font-display text-lg mb-2">No history yet</h2>
          <p className="text-text-muted mb-6">Run a practice session or take a test to start tracking.</p>
          <div className="flex gap-2 justify-center">
            <Link href="/practice" className="btn-primary">
              Start practicing
            </Link>
            <Link href="/test" className="btn-secondary">
              Take a test
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            <SummaryStat label="Sessions" value={sessions.length} />
            <SummaryStat label="Questions answered" value={totalAnswered} />
            <SummaryStat
              label="Overall accuracy"
              value={overallPct !== null ? `${overallPct}%` : '—'}
            />
          </div>

          {/* Weak areas */}
          {weakest.length > 0 && (
            <section className="mb-10">
              <h2 className="font-display text-lg mb-3 flex items-center gap-2">
                <Target size={18} className="text-primary" />
                Areas needing more practice
              </h2>
              <p className="text-text-muted text-sm mb-4">
                Sorted by accuracy, lowest first. Tap to review or drill in practice mode.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {weakest.map((s) => (
                  <FallacyStatCard key={s.fallacy_slug} s={s} />
                ))}
              </div>
            </section>
          )}

          {/* Strongest */}
          {strongest.length > 0 && (
            <section className="mb-10">
              <h2 className="font-display text-lg mb-3 flex items-center gap-2">
                <BarChart3 size={18} className="text-success" />
                Strongest fallacies
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {strongest.map((s) => (
                  <FallacyStatCard key={s.fallacy_slug} s={s} highlight />
                ))}
              </div>
            </section>
          )}

          {/* Recent sessions */}
          <section>
            <h2 className="font-display text-lg mb-3">Recent sessions</h2>
            <div className="card !p-0 overflow-hidden">
              <ul>
                {sessions.slice(0, 20).map((s, i) => (
                  <li
                    key={s.id}
                    className={`p-4 flex items-center gap-3 ${
                      i < sessions.length - 1 ? 'border-b border-divider' : ''
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                        s.mode === 'test'
                          ? 'bg-primary-highlight text-primary'
                          : 'bg-accent-highlight text-accent'
                      }`}
                    >
                      {s.mode === 'test' ? <ClipboardCheck size={16} /> : <Dumbbell size={16} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium capitalize text-sm">
                        {s.mode} ·{' '}
                        <span className="text-text-muted font-normal">{s.difficulty}</span>
                      </div>
                      <div className="text-text-faint text-xs truncate">
                        {s.topic || 'Mixed topics'} ·{' '}
                        {new Date(s.started_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold tabular-nums">
                        {s.correct_count}/{s.total_questions || '—'}
                      </div>
                      <div className="text-text-faint text-xs">
                        {s.total_questions > 0
                          ? `${Math.round((s.correct_count / s.total_questions) * 100)}%`
                          : 'In progress'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card !py-5">
      <div className="text-text-muted text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-2xl tabular-nums">{value}</div>
    </div>
  );
}

function FallacyStatCard({ s, highlight }: { s: Stat; highlight?: boolean }) {
  const pct = s.accuracy_pct ?? 0;
  return (
    <Link href={`/learn/${s.fallacy_slug}`} className="card card-hover block group">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-display text-base leading-tight">{s.fallacy_name}</h3>
        <span
          className={`badge ${
            highlight ? 'badge-success' : pct < 50 ? 'badge-error' : 'badge-accent'
          } tabular-nums`}
        >
          {pct}%
        </span>
      </div>
      <div className="text-text-muted text-xs mb-3">
        {s.correct} correct out of {s.total_attempts} attempts
      </div>
      <div className="h-1.5 bg-surface-offset rounded-full overflow-hidden">
        <div
          className={`h-full ${highlight ? 'bg-success' : pct < 50 ? 'bg-error' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          <BookOpen size={12} /> Review
        </span>
        <span className="text-text-faint">or drill in practice</span>
      </div>
    </Link>
  );
}

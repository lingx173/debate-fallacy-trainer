'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProfile, Profile } from '@/components/ProfileContext';
import { BookOpen, Dumbbell, ClipboardCheck, BarChart3, ChevronRight, Plus, Presentation } from 'lucide-react';

const AVATAR_CHOICES = ['🎓', '⚖️', '📚', '🦉', '🦊', '🐢', '🦁', '🐱', '🦄', '🌟'];

export default function HomePage() {
  const { profile, setProfile, loading } = useProfile();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎓');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    fetch('/api/profiles')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProfiles(data);
        else setErr(data?.error || 'Could not load profiles');
      })
      .catch((e) => setErr(e.message));
  }, [loading]);

  async function createProfile() {
    if (!newName.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), avatar_emoji: newEmoji }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Failed');
      setProfiles((p) => [...p, data]);
      setProfile(data);
      setShowNew(false);
      setNewName('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (profile) {
    return <SignedInHome />;
  }

  return (
    <div className="container-narrow py-16 animate-in">
      <div className="text-center mb-12">
        <span className="badge badge-primary mb-4">For Public Forum Debaters</span>
        <h1 className="font-display text-[clamp(2rem,1.2rem+2.5vw,3.5rem)] font-semibold mb-4">
          Spot fallacies. Win crossfire.
        </h1>
        <p className="text-text-muted max-w-md mx-auto">
          A practice tool for sharpening logical reasoning. Identify common debate fallacies in
          AI-generated crossfire snippets — then take the test to see what you&apos;ve mastered.
        </p>
      </div>

      <div className="card">
        <h2 className="font-display text-lg mb-1">Who&apos;s practicing today?</h2>
        <p className="text-text-muted text-sm mb-6">Pick your profile to start.</p>

        {err && (
          <div className="alert alert-error mb-4">{err}</div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfile(p)}
              className="card-hover card !p-4 flex items-center gap-3 text-left"
            >
              <span className="text-3xl">{p.avatar_emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-text-faint text-xs">Continue</div>
              </div>
              <ChevronRight size={18} className="text-text-faint" />
            </button>
          ))}

          {!showNew && (
            <button
              onClick={() => setShowNew(true)}
              className="card-hover card !p-4 flex items-center gap-3 border-dashed text-text-muted"
            >
              <span className="w-10 h-10 rounded-full bg-surface-offset flex items-center justify-center">
                <Plus size={18} />
              </span>
              <span className="font-medium">Add a profile</span>
            </button>
          )}
        </div>

        {showNew && (
          <div className="mt-4 p-4 border border-border rounded-lg bg-surface-2">
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              className="input mb-3"
              placeholder="e.g. Mia"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={40}
              autoFocus
            />
            <label className="block text-sm font-medium mb-2">Pick an avatar</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {AVATAR_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={`text-2xl w-10 h-10 rounded-md border flex items-center justify-center transition ${
                    newEmoji === e
                      ? 'border-primary bg-primary-highlight'
                      : 'border-border bg-surface hover:border-text-muted'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={createProfile} disabled={busy || !newName.trim()} className="btn-primary">
                {busy ? 'Creating…' : 'Create profile'}
              </button>
              <button onClick={() => setShowNew(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SignedInHome() {
  const { profile } = useProfile();
  return (
    <div className="container-default py-12 animate-in">
      <div className="mb-10">
        <p className="text-text-muted text-sm mb-1">Welcome back,</p>
        <h1 className="font-display text-[clamp(1.75rem,1rem+2vw,2.75rem)] flex items-center gap-3">
          <span>{profile?.avatar_emoji}</span>
          <span>{profile?.name}</span>
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Tile
          href="/demo"
          icon={<Presentation size={22} />}
          title="Demo"
          body="Choose a fallacy and topic. See AI-generated crossfire examples with explanations."
          accent
        />
        <Tile
          href="/practice"
          icon={<Dumbbell size={22} />}
          title="Practice"
          body="Random fallacy each round. One multiple-choice question at a time — identify the type."
        />
        <Tile
          href="/test"
          icon={<ClipboardCheck size={22} />}
          title="Test"
          body="10 mixed questions. Immediate feedback after each, plus a weak-area summary."
        />
        <Tile
          href="/learn"
          icon={<BookOpen size={22} />}
          title="Learn"
          body="Browse all 25 fallacies — definitions, debate examples, and crossfire counters."
        />
        <Tile
          href="/history"
          icon={<BarChart3 size={22} />}
          title="History"
          body="Past sessions and where you most often slip up."
        />
      </div>
    </div>
  );
}

function Tile({
  href,
  icon,
  title,
  body,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <Link href={href} className={`card card-hover block group ${accent ? '!border-primary/40' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`w-10 h-10 rounded-md flex items-center justify-center ${
            accent ? 'bg-primary text-text-inverse' : 'bg-surface-offset text-primary'
          }`}
        >
          {icon}
        </span>
        <h2 className="font-display text-lg">{title}</h2>
        <ChevronRight
          size={18}
          className="ml-auto text-text-faint group-hover:text-primary group-hover:translate-x-0.5 transition"
        />
      </div>
      <p className="text-text-muted text-sm">{body}</p>
    </Link>
  );
}

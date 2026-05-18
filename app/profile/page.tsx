'use client';
import Link from 'next/link';
import { useProfile } from '@/components/ProfileContext';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { profile, setProfile, loading } = useProfile();
  if (loading) return <div className="container-narrow py-12 text-text-muted">Loading…</div>;
  if (!profile) {
    return (
      <div className="container-narrow py-16 text-center">
        <p className="text-text-muted mb-4">No profile selected.</p>
        <Link href="/" className="btn-primary">
          Pick a profile
        </Link>
      </div>
    );
  }
  return (
    <div className="container-narrow py-10 animate-in">
      <Link href="/" className="btn-ghost mb-6">
        <ArrowLeft size={16} /> Home
      </Link>
      <header className="text-center mb-8">
        <div className="text-6xl mb-3">{profile.avatar_emoji}</div>
        <h1 className="font-display text-2xl">{profile.name}</h1>
      </header>

      <div className="card mb-4">
        <h2 className="font-display text-lg mb-2">Quick links</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/demo" className="btn-secondary">Demo</Link>
          <Link href="/practice" className="btn-secondary">Practice</Link>
          <Link href="/test" className="btn-secondary">Test</Link>
          <Link href="/learn" className="btn-secondary">Learn</Link>
          <Link href="/history" className="btn-secondary col-span-2">History</Link>
        </div>
      </div>

      <button
        onClick={() => setProfile(null)}
        className="btn-secondary w-full !text-error !border-error/30 hover:!bg-error-highlight"
      >
        <LogOut size={16} />
        Switch profile
      </button>
    </div>
  );
}

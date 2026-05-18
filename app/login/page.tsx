'use client';

import { FormEvent, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get('next') || '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Login failed');
      router.replace(next.startsWith('/') ? next : '/');
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-narrow py-16 animate-in">
      <div className="max-w-md mx-auto card">
        <div className="flex items-center gap-2 mb-2 text-primary">
          <Lock size={20} />
          <span className="font-display text-lg">Site access</span>
        </div>
        <p className="text-text-muted text-sm mb-6">
          Enter the family password to use Fallacy Forum.
        </p>

        {err && <div className="alert alert-error mb-4">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>
          <button type="submit" disabled={busy || !password} className="btn-primary w-full">
            {busy ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-narrow py-16 text-text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

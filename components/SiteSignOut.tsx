'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function SiteSignOut() {
  const router = useRouter();

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-text-muted hover:text-text hover:bg-surface-offset transition-colors"
      title="Sign out of site"
    >
      <LogOut size={14} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}

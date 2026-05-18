'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProfile } from './ProfileContext';
import { User } from 'lucide-react';
import { SiteSignOut } from './SiteSignOut';

const links = [
  { href: '/', label: 'Home' },
  { href: '/learn', label: 'Learn' },
  { href: '/demo', label: 'Demo' },
  { href: '/practice', label: 'Practice' },
  { href: '/test', label: 'Test' },
  { href: '/history', label: 'History' },
];

export function Nav({ siteGateEnabled = false }: { siteGateEnabled?: boolean }) {
  const pathname = usePathname();
  const { profile } = useProfile();

  return (
    <div className="flex items-center gap-6 flex-1 min-w-0">
      <Link href="/" className="flex items-center gap-2 group">
        <Logo />
        <span className="font-display text-lg font-semibold tracking-tight">Fallacy Forum</span>
      </Link>
      <nav className="hidden md:flex items-center gap-1">
        {links.slice(1).map((l) => {
          const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-highlight text-primary'
                  : 'text-text-muted hover:text-text hover:bg-surface-offset'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-1">
        {profile && (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-offset hover:bg-primary-highlight text-sm font-medium"
          >
            <User size={14} />
            <span className="hidden sm:inline">{profile.name}</span>
          </Link>
        )}
        {siteGateEnabled && <SiteSignOut />}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
      <path
        d="M10 12 L16 20 L22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" className="text-accent" />
    </svg>
  );
}

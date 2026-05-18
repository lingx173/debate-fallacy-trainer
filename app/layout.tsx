import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { ProfileProvider } from '@/components/ProfileContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Nav } from '@/components/Nav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

export const metadata: Metadata = {
  title: 'Fallacy Forum — Debate Crossfire Trainer',
  description:
    'Practice spotting logical fallacies in Public Forum debate crossfire. Built for sharper thinking.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf9f4' },
    { media: '(prefers-color-scheme: dark)', color: '#15171c' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <ProfileProvider>
          <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-40">
            <div className="container-wide flex items-center justify-between py-4">
              <Nav />
              <ThemeToggle />
            </div>
          </header>
          <main className="min-h-[calc(100dvh-72px)]">{children}</main>
          <footer className="border-t border-border mt-20">
            <div className="container-wide py-6 text-text-faint text-xs flex items-center justify-between flex-wrap gap-2">
              <span>Fallacy Forum · Built for sharper thinking</span>
              <span>Practice, not perfection.</span>
            </div>
          </footer>
        </ProfileProvider>
      </body>
    </html>
  );
}

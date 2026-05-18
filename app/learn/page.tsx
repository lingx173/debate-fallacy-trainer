'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FALLACIES, FALLACY_CATEGORIES, Fallacy } from '@/lib/fallacies';
import { Search, ChevronRight } from 'lucide-react';

const CAT_COLOR: Record<string, string> = {
  Relevance: 'badge-primary',
  Presumption: 'badge-accent',
  'Weak Induction': 'badge',
  Causal: 'badge-error',
  Ambiguity: 'badge-success',
  Formal: 'badge',
};

export default function LearnPage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return FALLACIES.filter((f) => {
      if (cat && f.category !== cat) return false;
      if (!needle) return true;
      const hay = `${f.name} ${f.also_known_as.join(' ')} ${f.short_definition}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q, cat]);

  return (
    <div className="container-default py-10 animate-in">
      <header className="mb-8">
        <span className="badge badge-primary mb-3">Reference</span>
        <h1 className="font-display text-[clamp(1.75rem,1rem+2vw,2.75rem)] mb-2">The Fallacy Library</h1>
        <p className="text-text-muted max-w-2xl">
          25 logical fallacies that show up most often in Public Forum debate — especially during
          crossfire. Each entry includes a kid-friendly definition, a real debate example, and how to
          push back when you hear one.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            className="input !pl-10"
            placeholder="Search by name or definition…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCat(null)}
            className={`badge whitespace-nowrap ${
              cat === null ? 'badge-primary' : ''
            } cursor-pointer hover:bg-primary-highlight`}
          >
            All
          </button>
          {FALLACY_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c === cat ? null : c)}
              className={`badge whitespace-nowrap cursor-pointer hover:bg-primary-highlight ${
                cat === c ? 'badge-primary' : ''
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="text-text-faint text-sm mb-4">
        Showing {filtered.length} of {FALLACIES.length} fallacies
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((f) => (
          <FallacyCard key={f.id} f={f} />
        ))}
        {filtered.length === 0 && (
          <p className="text-text-muted col-span-full py-8 text-center">No fallacies match.</p>
        )}
      </div>
    </div>
  );
}

function FallacyCard({ f }: { f: Fallacy }) {
  return (
    <Link href={`/learn/${f.id}`} className="card card-hover block group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h2 className="font-display text-lg leading-tight">{f.name}</h2>
        <span className={`badge ${CAT_COLOR[f.category] || ''}`}>{f.category}</span>
      </div>
      <p className="text-text-muted text-sm">{f.short_definition}</p>
      <div className="mt-3 text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
        Read more <ChevronRight size={14} />
      </div>
    </Link>
  );
}

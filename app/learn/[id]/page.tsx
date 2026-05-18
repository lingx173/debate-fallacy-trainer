'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FALLACY_BY_ID } from '@/lib/fallacies';
import { ArrowLeft, Sparkles, Quote, MessagesSquare, Shield, AlertCircle } from 'lucide-react';

export default function FallacyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const f = FALLACY_BY_ID[id];

  if (!f) {
    return (
      <div className="container-narrow py-16 text-center">
        <p className="text-text-muted">Fallacy not found.</p>
        <Link href="/learn" className="btn-secondary mt-4">
          Back to library
        </Link>
      </div>
    );
  }

  return (
    <article className="container-default py-10 animate-in">
      <button onClick={() => router.back()} className="btn-ghost mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="badge badge-primary">{f.category}</span>
          {f.also_known_as.length > 0 && (
            <span className="text-text-faint text-xs">
              Also known as: {f.also_known_as.join(', ')}
            </span>
          )}
        </div>
        <h1 className="font-display text-[clamp(1.75rem,1rem+2vw,2.75rem)] mb-3">{f.name}</h1>
        <p className="text-text-muted text-lg leading-relaxed">{f.short_definition}</p>
      </header>

      <Section icon={<Sparkles size={18} />} title="What it actually is">
        <p>{f.full_explanation}</p>
      </Section>

      <Section icon={<MessagesSquare size={18} />} title="How to spot it in crossfire">
        <p>{f.how_to_spot_in_crossfire}</p>
      </Section>

      <Section icon={<Quote size={18} />} title="Example in debate">
        <blockquote className="border-l-4 border-primary pl-4 italic text-text">
          {f.example_debate}
        </blockquote>
      </Section>

      <Section icon={<Shield size={18} />} title="How to respond">
        <p>{f.counter_response}</p>
      </Section>

      {f.common_confusions.length > 0 && (
        <Section icon={<AlertCircle size={18} />} title="Commonly confused with">
          <div className="flex flex-wrap gap-2">
            {f.common_confusions.map((name) => {
              const other = Object.values(FALLACY_BY_ID).find((x) => x.name === name);
              if (other) {
                return (
                  <Link
                    key={name}
                    href={`/learn/${other.id}`}
                    className="badge badge-primary cursor-pointer hover:opacity-80"
                  >
                    {name}
                  </Link>
                );
              }
              return (
                <span key={name} className="badge">
                  {name}
                </span>
              );
            })}
          </div>
        </Section>
      )}

      <div className="mt-10 p-6 border border-primary/30 rounded-lg bg-primary-highlight/30 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-display text-lg mb-1">Ready to practice?</h3>
          <p className="text-text-muted text-sm">
            Generate examples of <b>{f.name}</b> on any topic you choose.
          </p>
        </div>
        <Link href={`/practice?fallacy=${f.id}`} className="btn-primary">
          Practice this fallacy
        </Link>
      </div>
    </article>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-lg mb-2 flex items-center gap-2 text-primary">
        {icon}
        {title}
      </h2>
      <div className="text-text leading-relaxed">{children}</div>
    </section>
  );
}

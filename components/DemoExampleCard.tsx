'use client';
import { useEffect, useState } from 'react';
import { MessagesSquare, ArrowRight, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export type DemoExample = {
  fallacy_slug: string;
  fallacy_name: string;
  argument_text: string;
  explanation: string;
};

type Props = {
  example: DemoExample;
  onAnother: () => void;
  anotherLabel?: string;
  busy?: boolean;
};

export function DemoExampleCard({
  example,
  onAnother,
  anotherLabel = 'Another example',
  busy = false,
}: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [example.argument_text]);

  function another() {
    setRevealed(false);
    onAnother();
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="card">
        <div className="flex items-center gap-2 mb-3 text-text-muted text-sm">
          <MessagesSquare size={16} />
          <span>Crossfire example</span>
        </div>
        <div className="whitespace-pre-wrap text-text leading-relaxed font-[450]">
          {example.argument_text}
        </div>
      </div>

      {!revealed ? (
        <div className="flex flex-wrap gap-3 justify-end">
          <button type="button" onClick={() => setRevealed(true)} className="btn-secondary">
            <Lightbulb size={16} />
            Reveal explanation
          </button>
        </div>
      ) : (
        <div className="card border-2 border-primary/30 bg-primary-highlight/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-primary" />
            <h3 className="font-display text-lg">Why this is fallacious</h3>
          </div>
          <p className="leading-relaxed mb-4">{example.explanation}</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/learn/${example.fallacy_slug}`}
              className="btn-ghost text-primary hover:!text-primary"
            >
              Read more in the library →
            </Link>
            <button type="button" onClick={another} disabled={busy} className="btn-primary">
              {anotherLabel}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
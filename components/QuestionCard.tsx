'use client';
import { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, MessagesSquare } from 'lucide-react';
import Link from 'next/link';

export type GeneratedQuestion = {
  fallacy_slug: string;
  fallacy_name: string;
  argument_text: string;
  explanation: string;
  options: { id: string; name: string }[];
};

type Props = {
  q: GeneratedQuestion;
  onAnswered: (selectedId: string, isCorrect: boolean) => void;
  onNext: () => void;
  nextLabel?: string;
  showCounter?: { current: number; total: number };
};

export function QuestionCard({ q, onAnswered, onNext, nextLabel = 'Next', showCounter }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (!selected) return;
    setSubmitted(true);
    onAnswered(selected, selected === q.fallacy_slug);
  }

  const isCorrect = submitted && selected === q.fallacy_slug;

  return (
    <div className="space-y-6 animate-in">
      {showCounter && (
        <div className="flex items-center justify-between text-text-muted text-sm">
          <span>
            Question {showCounter.current} of {showCounter.total}
          </span>
          <div className="flex-1 mx-4 h-1.5 bg-surface-offset rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(showCounter.current / showCounter.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-2 mb-3 text-text-muted text-sm">
          <MessagesSquare size={16} />
          <span>Crossfire snippet — what fallacy is going on here?</span>
        </div>
        <div className="whitespace-pre-wrap text-text leading-relaxed font-[450]">
          {q.argument_text}
        </div>
      </div>

      <div className="space-y-2">
        {q.options.map((opt) => {
          const isPicked = selected === opt.id;
          const isAnswer = opt.id === q.fallacy_slug;
          let stateClass = 'border-border bg-surface hover:border-primary';
          if (submitted) {
            if (isAnswer) stateClass = 'border-success bg-success-highlight';
            else if (isPicked) stateClass = 'border-error bg-error-highlight';
            else stateClass = 'border-border bg-surface opacity-60';
          } else if (isPicked) {
            stateClass = 'border-primary bg-primary-highlight';
          }
          return (
            <button
              key={opt.id}
              disabled={submitted}
              onClick={() => setSelected(opt.id)}
              className={`w-full text-left p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${stateClass} disabled:cursor-default`}
            >
              <span
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  isPicked || (submitted && isAnswer)
                    ? 'border-current'
                    : 'border-text-faint text-text-faint'
                }`}
              >
                {submitted && isAnswer ? (
                  <CheckCircle2 size={16} className="text-success" />
                ) : submitted && isPicked ? (
                  <XCircle size={16} className="text-error" />
                ) : (
                  String.fromCharCode(65 + q.options.indexOf(opt))
                )}
              </span>
              <span className="font-medium">{opt.name}</span>
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <div className="flex justify-end">
          <button onClick={submit} disabled={!selected} className="btn-primary">
            Submit answer
          </button>
        </div>
      ) : (
        <div
          className={`card border-2 ${
            isCorrect ? '!border-success bg-success-highlight/30' : '!border-error bg-error-highlight/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            {isCorrect ? (
              <>
                <CheckCircle2 size={20} className="text-success" />
                <h3 className="font-display text-lg text-success">Correct</h3>
              </>
            ) : (
              <>
                <XCircle size={20} className="text-error" />
                <h3 className="font-display text-lg text-error">Not quite</h3>
              </>
            )}
            <span className="badge ml-auto">{q.fallacy_name}</span>
          </div>
          <p className="leading-relaxed mb-4">{q.explanation}</p>
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/learn/${q.fallacy_slug}`}
              className="btn-ghost text-primary hover:!text-primary"
            >
              Read more about {q.fallacy_name} →
            </Link>
            <button onClick={onNext} className="btn-primary">
              {nextLabel}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

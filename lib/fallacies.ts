import data from './fallacies.json';

export type Fallacy = {
  id: string;
  name: string;
  also_known_as: string[];
  category: 'Relevance' | 'Ambiguity' | 'Presumption' | 'Weak Induction' | 'Formal' | 'Causal';
  short_definition: string;
  full_explanation: string;
  how_to_spot_in_crossfire: string;
  example_debate: string;
  counter_response: string;
  common_confusions: string[];
};

export const FALLACIES = data as Fallacy[];

export const FALLACY_BY_ID: Record<string, Fallacy> = Object.fromEntries(
  FALLACIES.map((f) => [f.id, f]),
);

export const FALLACY_BY_NAME: Record<string, Fallacy> = Object.fromEntries(
  FALLACIES.map((f) => [f.name, f]),
);

export const FALLACY_CATEGORIES = Array.from(new Set(FALLACIES.map((f) => f.category)));

export function getFallacy(id: string): Fallacy | undefined {
  return FALLACY_BY_ID[id];
}

/** Pick `count` random fallacies, optionally excluding some ids. */
export function pickRandomFallacies(count: number, exclude: string[] = []): Fallacy[] {
  const pool = FALLACIES.filter((f) => !exclude.includes(f.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Build 4 MCQ options: the correct fallacy + 3 plausible distractors (common confusions preferred). */
export function buildOptions(correctId: string): { id: string; name: string }[] {
  const correct = FALLACY_BY_ID[correctId];
  if (!correct) throw new Error(`Unknown fallacy: ${correctId}`);

  // Prefer fallacies listed as common confusions
  const confusionIds = correct.common_confusions
    .map((name) => FALLACY_BY_NAME[name]?.id)
    .filter((id): id is string => !!id && id !== correctId);

  const distractors: string[] = [];
  for (const id of confusionIds) {
    if (distractors.length < 3) distractors.push(id);
  }
  // Fill remaining with random fallacies, preferring same category
  if (distractors.length < 3) {
    const sameCat = FALLACIES.filter(
      (f) =>
        f.category === correct.category && f.id !== correctId && !distractors.includes(f.id),
    ).sort(() => Math.random() - 0.5);
    for (const f of sameCat) {
      if (distractors.length < 3) distractors.push(f.id);
    }
  }
  if (distractors.length < 3) {
    const rest = FALLACIES.filter(
      (f) => f.id !== correctId && !distractors.includes(f.id),
    ).sort(() => Math.random() - 0.5);
    for (const f of rest) {
      if (distractors.length < 3) distractors.push(f.id);
    }
  }

  const all = [correctId, ...distractors].sort(() => Math.random() - 0.5);
  return all.map((id) => ({ id, name: FALLACY_BY_ID[id].name }));
}

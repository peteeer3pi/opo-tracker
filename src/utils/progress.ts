import type { Category, Topic } from "../store/useStore";

export function topicProgress(topic: Topic, totalCategories: number): number {
  if (totalCategories === 0) return 0;
  const done = Object.values(topic.checks).filter(Boolean).length;
  return done / totalCategories;
}

export function categoryProgress(topics: Topic[], categoryId: string): number {
  const total = topics.length;
  if (total === 0) return 0;
  const done = topics.filter((t) => !!t.checks[categoryId]).length;
  return done / total;
}

export function globalProgress(
  topics: Topic[],
  categories: Category[]
): number {
  const totalCells = topics.length * categories.length;
  if (totalCells === 0) return 0;
  const done = topics.reduce(
    (acc, t) => acc + Object.values(t.checks).filter(Boolean).length,
    0
  );
  return done / totalCells;
}

import type { Category, Topic, Bulletin } from "../store/useStore";

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

export function folderProgress(
  topics: Topic[],
  categories: Category[],
  folderId?: string
): number {
  const subset = topics.filter((t) =>
    folderId ? t.folderId === folderId : !t.folderId
  );
  return globalProgress(subset, categories);
}

export function folderTotals(
  topics: Topic[],
  categories: Category[],
  folderId?: string
): { done: number; total: number } {
  const subset = topics.filter((t) =>
    folderId ? t.folderId === folderId : !t.folderId
  );
  const total = subset.length * categories.length;
  const done = subset.reduce(
    (acc, t) => acc + Object.values(t.checks).filter(Boolean).length,
    0
  );
  return { done, total };
}

export function bulletinProgress(bulletin: Bulletin): number {
  if (bulletin.exerciseCount === 0) return 0;
  const completed = Object.values(bulletin.completedExercises).filter(
    Boolean
  ).length;
  return completed / bulletin.exerciseCount;
}

export function globalProgressWithBulletins(
  topics: Topic[],
  categories: Category[],
  bulletins: Bulletin[]
): number {
  const topicCells = topics.length * categories.length;
  const bulletinCells = bulletins.reduce((acc, b) => acc + b.exerciseCount, 0);
  const totalCells = topicCells + bulletinCells;

  if (totalCells === 0) return 0;

  const topicsDone = topics.reduce(
    (acc, t) => acc + Object.values(t.checks).filter(Boolean).length,
    0
  );
  const bulletinsDone = bulletins.reduce(
    (acc, b) =>
      acc + Object.values(b.completedExercises).filter(Boolean).length,
    0
  );

  return (topicsDone + bulletinsDone) / totalCells;
}

export function bulletinsOnlyProgress(bulletins: Bulletin[]): number {
  const totalExercises = bulletins.reduce((acc, b) => acc + b.exerciseCount, 0);
  if (totalExercises === 0) return 0;

  const completedExercises = bulletins.reduce(
    (acc, b) =>
      acc + Object.values(b.completedExercises).filter(Boolean).length,
    0
  );

  return completedExercises / totalExercises;
}

export function folderProgressWithBulletins(
  topics: Topic[],
  categories: Category[],
  bulletins: Bulletin[],
  folderId?: string
): number {
  const topicSubset = topics.filter((t) =>
    folderId ? t.folderId === folderId : !t.folderId
  );
  const bulletinSubset = bulletins.filter((b) =>
    folderId ? b.folderId === folderId : !b.folderId
  );

  const topicCells = topicSubset.length * categories.length;
  const bulletinCells = bulletinSubset.reduce(
    (acc, b) => acc + b.exerciseCount,
    0
  );
  const totalCells = topicCells + bulletinCells;

  if (totalCells === 0) return 0;

  const topicsDone = topicSubset.reduce(
    (acc, t) => acc + Object.values(t.checks).filter(Boolean).length,
    0
  );
  const bulletinsDone = bulletinSubset.reduce(
    (acc, b) =>
      acc + Object.values(b.completedExercises).filter(Boolean).length,
    0
  );

  return (topicsDone + bulletinsDone) / totalCells;
}

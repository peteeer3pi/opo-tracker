import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOPIC_TITLES } from "../data/titles";

export type Category = {
  id: string;
  name: string;
};

export type Topic = {
  id: string;
  title: string;
  checks: Record<string, boolean>; // key: categoryId
  note?: string;
  updatedAt?: number;
  reviewCount: number;
};

export type StoreState = {
  categories: Category[];
  topics: Topic[];
  selectedOpposition?: string;
  hasHydrated: boolean;
  addCategory: (name: string) => void;
  removeCategory: (categoryId: string) => void;
  renameCategory: (categoryId: string, name: string) => void;
  moveCategory: (categoryId: string, toIndex: number) => void;
  reorderCategories: (orderedIds: string[]) => void;
  setOpposition: (name: string) => void;
  addTopic: (title: string) => void;
  bulkAddTopics: (titles: string[]) => void;
  removeTopic: (topicId: string) => void;
  toggleCheck: (topicId: string, categoryId: string) => void;
  renameTopic: (topicId: string, title: string) => void;
  setTopicNote: (topicId: string, note: string) => void;
  incrementReview: (topicId: string) => void;
  decrementReview: (topicId: string) => void;
  resetAll: () => void;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "resumido", name: "Resumido" },
  { id: "estudiado", name: "Estudiado" },
  { id: "repasado", name: "Repasado" },
];

const DEFAULT_OPPOSITION = "Oposición Física y Química";

const seedTopics = (
  categories: Category[],
  oppositionName?: string
): Topic[] => {
  const now = Date.now();
  const titles = oppositionName ? TOPIC_TITLES[oppositionName] ?? [] : [];
  return titles.map((title, idx) => ({
    id: `t_${idx + 1}`,
    title,
    checks: Object.fromEntries(categories.map((c) => [c.id, false])),
    updatedAt: now,
    reviewCount: 0,
  }));
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      selectedOpposition: undefined,
      topics: [],
      hasHydrated: false,

      setOpposition: (name) => {
        const clean = name.trim();
        if (!clean) return;
        const categories = get().categories;
        const topics = seedTopics(categories, clean);
        set({ selectedOpposition: clean, topics });
      },

      addCategory: (name) => {
        const clean = name.trim();
        if (!clean) return;
        const id = clean.toLowerCase().replace(/\s+/g, "-");
        const exists = get().categories.some((c) => c.id === id);
        if (exists) return;
        const newCategory: Category = { id, name: clean };
        const categories = [...get().categories, newCategory];
        const topics = get().topics.map((t) => ({
          ...t,
          checks: { ...t.checks, [newCategory.id]: false },
        }));
        set({ categories, topics });
      },

      removeCategory: (categoryId) => {
        const categories = get().categories.filter((c) => c.id !== categoryId);
        const topics = get().topics.map((t) => {
          const { [categoryId]: _omit, ...rest } = t.checks;
          return { ...t, checks: rest, updatedAt: Date.now() };
        });
        set({ categories, topics });
      },

      renameCategory: (categoryId, name) => {
        const categories = get().categories.map((c) =>
          c.id === categoryId ? { ...c, name: name.trim() } : c
        );
        set({ categories });
      },

      moveCategory: (categoryId, toIndex) => {
        const list = [...get().categories];
        const fromIndex = list.findIndex((c) => c.id === categoryId);
        if (fromIndex === -1) return;
        const clampedTo = Math.max(0, Math.min(toIndex, list.length - 1));
        const [item] = list.splice(fromIndex, 1);
        list.splice(clampedTo, 0, item);
        set({ categories: list });
      },

      reorderCategories: (orderedIds) => {
        const map = new Map(get().categories.map((c) => [c.id, c]));
        const ordered = orderedIds
          .map((id) => map.get(id))
          .filter((c): c is Category => !!c);
        // In case some categories are not included, append them at the end
        const remaining = get().categories.filter(
          (c) => !orderedIds.includes(c.id)
        );
        set({ categories: [...ordered, ...remaining] });
      },

      addTopic: (title) => {
        const clean = title.trim();
        if (!clean) return;
        const id = `t_${Date.now()}`;
        const checks = Object.fromEntries(
          get().categories.map((c) => [c.id, false])
        );
        const topic: Topic = {
          id,
          title: clean,
          checks,
          updatedAt: Date.now(),
          reviewCount: 0,
        };
        set({ topics: [...get().topics, topic] });
      },

      bulkAddTopics: (titles) => {
        const cleanTitles = titles.map((t) => t.trim()).filter((t) => !!t);
        if (cleanTitles.length === 0) return;
        const existing = new Set(get().topics.map((t) => t.title));
        const categories = get().categories;
        const now = Date.now();
        const newTopics: Topic[] = cleanTitles
          .filter((title) => !existing.has(title))
          .map((title, idx) => ({
            id: `t_${now}_${idx}`,
            title,
            checks: Object.fromEntries(categories.map((c) => [c.id, false])),
            updatedAt: now,
            reviewCount: 0,
          }));
        if (newTopics.length === 0) return;
        set({ topics: [...get().topics, ...newTopics] });
      },

      removeTopic: (topicId) => {
        set({ topics: get().topics.filter((t) => t.id !== topicId) });
      },

      toggleCheck: (topicId, categoryId) => {
        const topics = get().topics.map((t) => {
          if (t.id !== topicId) return t;
          const current = !!t.checks[categoryId];
          const next = !current;
          let reviewCount = t.reviewCount ?? 0;
          if (categoryId === "repasado") {
            reviewCount = next ? (reviewCount > 0 ? reviewCount : 1) : 0;
          }
          return {
            ...t,
            checks: { ...t.checks, [categoryId]: next },
            reviewCount,
            updatedAt: Date.now(),
          };
        });
        set({ topics });
      },

      renameTopic: (topicId, title) => {
        const topics = get().topics.map((t) =>
          t.id === topicId
            ? { ...t, title: title.trim(), updatedAt: Date.now() }
            : t
        );
        set({ topics });
      },

      setTopicNote: (topicId, note) => {
        const topics = get().topics.map((t) =>
          t.id === topicId ? { ...t, note, updatedAt: Date.now() } : t
        );
        set({ topics });
      },

      incrementReview: (topicId) => {
        const topics = get().topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                reviewCount: (t.reviewCount ?? 0) + 1,
                updatedAt: Date.now(),
              }
            : t
        );
        set({ topics });
      },

      decrementReview: (topicId) => {
        const topics = get().topics.map((t) =>
          t.id === topicId
            ? {
                ...t,
                reviewCount: Math.max(0, (t.reviewCount ?? 0) - 1),
                updatedAt: Date.now(),
              }
            : t
        );
        set({ topics });
      },

      resetAll: () => {
        const categories = DEFAULT_CATEGORIES;
        set({ categories, topics: [], selectedOpposition: undefined });
      },
    }),
    {
      name: "opo-tracker-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        categories: state.categories,
        topics: state.topics,
        selectedOpposition: state.selectedOpposition,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hasHydrated: true });
      },
    }
  )
);

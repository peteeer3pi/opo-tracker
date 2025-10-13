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
  folderId?: string;
};

export type Folder = {
  id: string;
  name: string;
};

export type StoreState = {
  categories: Category[];
  topics: Topic[];
  folders: Folder[];
  folderCategories: Record<string, Category[]>; // folderId -> categories
  folderCategoryOrder: Record<string, string[]>; // folderId -> ordered list of effective category ids (global+local)
  folderHiddenGlobals: Record<string, string[]>; // folderId -> list of global category ids hidden in this folder
  selectedOpposition?: string;
  hasHydrated: boolean;
  addCategory: (name: string) => void;
  removeCategory: (categoryId: string) => void;
  renameCategory: (categoryId: string, name: string) => void;
  moveCategory: (categoryId: string, toIndex: number) => void;
  reorderCategories: (orderedIds: string[]) => void;
  addFolderCategory: (folderId: string, name: string) => void;
  removeFolderCategory: (folderId: string, categoryId: string) => void;
  renameFolderCategory: (
    folderId: string,
    categoryId: string,
    name: string
  ) => void;
  moveFolderCategory: (
    folderId: string,
    categoryId: string,
    toIndex: number
  ) => void; // local-only reorder
  // Folder view mixed-order actions
  moveFolderEffective: (
    folderId: string,
    categoryId: string,
    toIndex: number
  ) => void; // reorder overlay across globals+locals
  hideGlobalInFolder: (folderId: string, categoryId: string) => void;
  unhideGlobalInFolder: (folderId: string, categoryId: string) => void;
  setOpposition: (name: string) => void;
  addTopic: (title: string) => void;
  bulkAddTopics: (titles: string[]) => void;
  removeTopic: (topicId: string) => void;
  toggleCheck: (topicId: string, categoryId: string) => void;
  renameTopic: (topicId: string, title: string) => void;
  setTopicNote: (topicId: string, note: string) => void;
  incrementReview: (topicId: string) => void;
  decrementReview: (topicId: string) => void;
  addFolder: (name: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  removeFolder: (folderId: string) => void;
  moveTopicToFolder: (topicId: string, folderId?: string) => void;
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
      folders: [],
      folderCategories: {},
      folderCategoryOrder: {},
      folderHiddenGlobals: {},
      hasHydrated: false,

      setOpposition: (name) => {
        const clean = name.trim();
        if (!clean) return;
        const categories = get().categories;
        const topics = seedTopics(categories, clean);
        set({ selectedOpposition: clean, topics });
      },

      // Folder-specific categories CRUD
      addFolderCategory: (folderId, name) => {
        const clean = name.trim();
        if (!clean) return;
        const id = makeFolderCategoryId(folderId, clean);
        const map = get().folderCategories;
        const existing = (map[folderId] ?? []).some((c) => c.id === id);
        if (existing) return;
        const newCat: Category = { id, name: clean };
        const next = { ...map, [folderId]: [...(map[folderId] ?? []), newCat] };
        // Append to per-folder order overlay at the end
        const orderMap = { ...get().folderCategoryOrder };
        orderMap[folderId] = [...(orderMap[folderId] ?? []), id];
        // Add check key for topics currently in this folder
        const topics = get().topics.map((t) =>
          t.folderId === folderId
            ? { ...t, checks: { ...t.checks, [id]: false } }
            : t
        );
        set({ folderCategories: next, folderCategoryOrder: orderMap, topics });
      },

      removeFolderCategory: (folderId, categoryId) => {
        const map = get().folderCategories;
        const list = (map[folderId] ?? []).filter((c) => c.id !== categoryId);
        const next = { ...map, [folderId]: list };
        // Remove from per-folder ordering as well
        const orderMap = { ...get().folderCategoryOrder };
        orderMap[folderId] = (orderMap[folderId] ?? []).filter(
          (id) => id !== categoryId
        );
        // Remove check key from topics in this folder
        const topics = get().topics.map((t) => {
          if (t.folderId !== folderId) return t;
          const { [categoryId]: _omit, ...rest } = t.checks;
          return { ...t, checks: rest, updatedAt: Date.now() };
        });
        set({ folderCategories: next, folderCategoryOrder: orderMap, topics });
      },

      renameFolderCategory: (folderId, categoryId, name) => {
        const clean = name.trim();
        if (!clean) return;
        const map = get().folderCategories;
        const list = (map[folderId] ?? []).map((c) =>
          c.id === categoryId ? { ...c, name: clean } : c
        );
        set({ folderCategories: { ...map, [folderId]: list } });
      },

      moveFolderCategory: (folderId, categoryId, toIndex) => {
        const list = [...(get().folderCategories[folderId] ?? [])];
        const from = list.findIndex((c) => c.id === categoryId);
        if (from === -1) return;
        const clampedTo = Math.max(0, Math.min(toIndex, list.length - 1));
        const [item] = list.splice(from, 1);
        list.splice(clampedTo, 0, item);
        set({
          folderCategories: { ...get().folderCategories, [folderId]: list },
        });
      },

      moveFolderEffective: (folderId, categoryId, toIndex) => {
        const globals = get().categories;
        const locals = get().folderCategories[folderId] ?? [];
        const order = get().folderCategoryOrder[folderId] ?? [];
        const hidden = get().folderHiddenGlobals[folderId] ?? [];
        const effective = getEffectiveCategories(
          globals,
          locals,
          order,
          hidden
        ).map((c) => c.id);
        const fromIndex = effective.findIndex((id) => id === categoryId);
        if (fromIndex === -1) return;
        const clampedTo = Math.max(0, Math.min(toIndex, effective.length - 1));
        if (fromIndex === clampedTo) return;
        effective.splice(clampedTo, 0, ...effective.splice(fromIndex, 1));
        set({
          folderCategoryOrder: {
            ...get().folderCategoryOrder,
            [folderId]: effective,
          },
        });
      },

      addCategory: (name) => {
        // global categories
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
          folderId: undefined,
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
            folderId: undefined,
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

      addFolder: (name) => {
        const clean = name.trim();
        if (!clean) return;
        const id = `f_${Date.now()}`;
        const folder: Folder = { id, name: clean };
        set({
          folders: [...get().folders, folder],
          folderCategories: { ...get().folderCategories, [id]: [] },
          folderCategoryOrder: { ...get().folderCategoryOrder, [id]: [] },
          folderHiddenGlobals: { ...get().folderHiddenGlobals, [id]: [] },
        });
      },

      renameFolder: (folderId, name) => {
        const clean = name.trim();
        if (!clean) return;
        const folders = get().folders.map((f) =>
          f.id === folderId ? { ...f, name: clean } : f
        );
        set({ folders });
      },

      removeFolder: (folderId) => {
        const folders = get().folders.filter((f) => f.id !== folderId);
        const topics = get().topics.map((t) => {
          if (t.folderId !== folderId) return t;
          // prune checks for folder-specific categories of this folder
          const prunedChecks = Object.fromEntries(
            Object.entries(t.checks).filter(
              ([key]) => !key.startsWith(`fcat_${folderId}_`)
            )
          );
          return { ...t, folderId: undefined, checks: prunedChecks };
        });
        const folderCategories = { ...get().folderCategories };
        delete folderCategories[folderId];
        const folderCategoryOrder = { ...get().folderCategoryOrder };
        delete folderCategoryOrder[folderId];
        const folderHiddenGlobals = { ...get().folderHiddenGlobals };
        delete folderHiddenGlobals[folderId];
        set({
          folders,
          topics,
          folderCategories,
          folderCategoryOrder,
          folderHiddenGlobals,
        });
      },

      hideGlobalInFolder: (folderId, categoryId) => {
        const globals = get().categories;
        const isGlobal = globals.some((c) => c.id === categoryId);
        if (!isGlobal) return;
        const hidden = get().folderHiddenGlobals[folderId] ?? [];
        if (hidden.includes(categoryId)) return;
        const nextHidden = {
          ...get().folderHiddenGlobals,
          [folderId]: [...hidden, categoryId],
        };
        set({ folderHiddenGlobals: nextHidden });
      },

      unhideGlobalInFolder: (folderId, categoryId) => {
        const hidden = get().folderHiddenGlobals[folderId] ?? [];
        const nextHidden = {
          ...get().folderHiddenGlobals,
          [folderId]: hidden.filter((id) => id !== categoryId),
        };
        set({ folderHiddenGlobals: nextHidden });
      },

      moveTopicToFolder: (topicId, folderId) => {
        const current = get();
        const topics = current.topics.map((t) => {
          if (t.id !== topicId) return t;
          const prevFolder = t.folderId;
          let checks = { ...t.checks };
          // prune old folder-specific checks when leaving a folder
          if (prevFolder && prevFolder !== folderId) {
            checks = Object.fromEntries(
              Object.entries(checks).filter(
                ([k]) => !k.startsWith(`fcat_${prevFolder}_`)
              )
            );
          }
          // add missing checks for new folder's categories
          if (folderId) {
            const fCats = current.folderCategories[folderId] ?? [];
            for (const c of fCats) {
              if (!(c.id in checks)) checks[c.id] = false;
            }
          }
          return { ...t, folderId, checks };
        });
        set({ topics });
      },

      resetAll: () => {
        const categories = DEFAULT_CATEGORIES;
        set({
          categories,
          topics: [],
          folders: [],
          folderCategories: {},
          folderCategoryOrder: {},
          folderHiddenGlobals: {},
          selectedOpposition: undefined,
        });
      },
    }),
    {
      name: "opo-tracker-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        categories: state.categories,
        topics: state.topics,
        folders: state.folders,
        folderCategories: state.folderCategories,
        folderCategoryOrder: state.folderCategoryOrder,
        folderHiddenGlobals: state.folderHiddenGlobals,
        selectedOpposition: state.selectedOpposition,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hasHydrated: true });
      },
    }
  )
);

// Helpers to generate folder category IDs
export const makeFolderCategoryId = (folderId: string, name: string) => {
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
  return `fcat_${folderId}_${slug}`;
};

// Compute ordered effective categories for a folder view
export const getEffectiveCategories = (
  globals: Category[],
  locals: Category[] | undefined,
  order: string[] | undefined,
  hiddenGlobals?: string[]
): Category[] => {
  const presentMap = new Map<string, Category>();
  globals.forEach((c) => {
    if (!hiddenGlobals || !hiddenGlobals.includes(c.id)) {
      presentMap.set(c.id, c);
    }
  });
  (locals ?? []).forEach((c) => presentMap.set(c.id, c));
  if (!order || order.length === 0) {
    return Array.from(presentMap.values());
  }
  const ordered: Category[] = [];
  // Place by order if exists
  for (const id of order) {
    const c = presentMap.get(id);
    if (c) {
      ordered.push(c);
      presentMap.delete(id);
    }
  }
  // Append any remaining not in order
  for (const c of presentMap.values()) ordered.push(c);
  return ordered;
};

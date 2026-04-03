import { create } from "zustand";
import { Preferences } from "@capacitor/preferences";
import { v4 as uuid } from "uuid";
import type {
  LegoSet,
  Minifig,
  MissingPart,
  SetPhoto,
  CollectionStats,
} from "../types";

// Storage keys
const KEYS = {
  sets: "legotracker_sets",
  minifigs: "legotracker_minifigs",
  missingParts: "legotracker_missing_parts",
  photos: "legotracker_photos",
  apiKey: "legotracker_api_key",
} as const;

async function loadData<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    if (value === null || value === undefined) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function saveData<T>(key: string, data: T): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(data) });
}

interface AppState {
  // Data
  sets: LegoSet[];
  minifigs: Minifig[];
  missingParts: MissingPart[];
  photos: SetPhoto[];
  rebrickableApiKey: string;
  initialized: boolean;

  // Actions
  init: () => Promise<void>;

  // Sets CRUD
  addSet: (
    set: Omit<LegoSet, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateSet: (id: string, updates: Partial<LegoSet>) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;

  // Minifigs CRUD
  addMinifig: (fig: Omit<Minifig, "id" | "createdAt">) => Promise<void>;
  deleteMinifig: (id: string) => Promise<void>;

  // Missing Parts
  addMissingPart: (
    part: Omit<MissingPart, "id" | "createdAt" | "resolved">
  ) => Promise<void>;
  resolveMissingPart: (id: string) => Promise<void>;

  // Photos
  addPhoto: (photo: Omit<SetPhoto, "id" | "createdAt">) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  // Settings
  setApiKey: (key: string) => Promise<void>;

  // Stats
  getStats: () => CollectionStats;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  sets: [],
  minifigs: [],
  missingParts: [],
  photos: [],
  rebrickableApiKey: "",
  initialized: false,

  init: async () => {
    const [sets, minifigs, missingParts, photos, apiKey] = await Promise.all([
      loadData<LegoSet[]>(KEYS.sets, []),
      loadData<Minifig[]>(KEYS.minifigs, []),
      loadData<MissingPart[]>(KEYS.missingParts, []),
      loadData<SetPhoto[]>(KEYS.photos, []),
      loadData<string>(KEYS.apiKey, ""),
    ]);
    set({
      sets,
      minifigs,
      missingParts,
      photos,
      rebrickableApiKey: apiKey,
      initialized: true,
    });
  },

  // Sets CRUD
  addSet: async (input) => {
    const now = new Date().toISOString();
    const newSet: LegoSet = {
      ...input,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...get().sets, newSet];
    set({ sets: updated });
    await saveData(KEYS.sets, updated);
  },

  updateSet: async (id, updates) => {
    const updated = get().sets.map((s) =>
      s.id === id
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s
    );
    set({ sets: updated });
    await saveData(KEYS.sets, updated);
  },

  deleteSet: async (id) => {
    const updatedSets = get().sets.filter((s) => s.id !== id);
    // Also clean up related missing parts and photos
    const updatedParts = get().missingParts.filter((p) => p.userSetId !== id);
    const updatedPhotos = get().photos.filter((p) => p.userSetId !== id);
    set({
      sets: updatedSets,
      missingParts: updatedParts,
      photos: updatedPhotos,
    });
    await Promise.all([
      saveData(KEYS.sets, updatedSets),
      saveData(KEYS.missingParts, updatedParts),
      saveData(KEYS.photos, updatedPhotos),
    ]);
  },

  // Minifigs CRUD
  addMinifig: async (input) => {
    const newFig: Minifig = {
      ...input,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().minifigs, newFig];
    set({ minifigs: updated });
    await saveData(KEYS.minifigs, updated);
  },

  deleteMinifig: async (id) => {
    const updated = get().minifigs.filter((f) => f.id !== id);
    set({ minifigs: updated });
    await saveData(KEYS.minifigs, updated);
  },

  // Missing Parts
  addMissingPart: async (input) => {
    const newPart: MissingPart = {
      ...input,
      id: uuid(),
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().missingParts, newPart];
    set({ missingParts: updated });
    await saveData(KEYS.missingParts, updated);
  },

  resolveMissingPart: async (id) => {
    const updated = get().missingParts.map((p) =>
      p.id === id ? { ...p, resolved: true } : p
    );
    set({ missingParts: updated });
    await saveData(KEYS.missingParts, updated);
  },

  // Photos
  addPhoto: async (input) => {
    const newPhoto: SetPhoto = {
      ...input,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().photos, newPhoto];
    set({ photos: updated });
    await saveData(KEYS.photos, updated);
  },

  deletePhoto: async (id) => {
    const updated = get().photos.filter((p) => p.id !== id);
    set({ photos: updated });
    await saveData(KEYS.photos, updated);
  },

  // Settings
  setApiKey: async (key) => {
    set({ rebrickableApiKey: key });
    await saveData(KEYS.apiKey, key);
  },

  // Stats
  getStats: () => {
    const { sets, minifigs } = get();
    const ownedSets = sets.filter((s) => s.status === "owned");

    // Theme breakdown
    const themeMap = new Map<string, { count: number; pieces: number }>();
    for (const s of ownedSets) {
      const theme = s.theme ?? "Unknown";
      const existing = themeMap.get(theme) ?? { count: 0, pieces: 0 };
      themeMap.set(theme, {
        count: existing.count + s.quantity,
        pieces: existing.pieces + (s.numParts ?? 0) * s.quantity,
      });
    }
    const themeBreakdown = Array.from(themeMap.entries())
      .map(([theme, data]) => ({ theme, ...data }))
      .sort((a, b) => b.count - a.count);

    // Year breakdown
    const yearMap = new Map<number, number>();
    for (const s of ownedSets) {
      if (s.year !== null) {
        yearMap.set(s.year, (yearMap.get(s.year) ?? 0) + s.quantity);
      }
    }
    const yearBreakdown = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    // Estimated value from purchase prices
    let estimatedValue = 0;
    for (const s of ownedSets) {
      if (s.purchasePrice) {
        const parsed = parseFloat(s.purchasePrice);
        if (!isNaN(parsed)) {
          estimatedValue += parsed * s.quantity;
        }
      }
    }

    return {
      totalSets: ownedSets.reduce((sum, s) => sum + s.quantity, 0),
      totalPieces: ownedSets.reduce(
        (sum, s) => sum + (s.numParts ?? 0) * s.quantity,
        0
      ),
      totalMinifigs: minifigs.reduce((sum, f) => sum + f.quantity, 0),
      estimatedValue,
      ownedSets: sets.filter((s) => s.status === "owned").length,
      wishlistSets: sets.filter((s) => s.status === "wishlist").length,
      wantedSets: sets.filter((s) => s.status === "wanted").length,
      builtSets: ownedSets.filter((s) => s.buildStatus === "built").length,
      sealedSets: ownedSets.filter((s) => s.buildStatus === "sealed").length,
      themeBreakdown,
      yearBreakdown,
    };
  },
}));

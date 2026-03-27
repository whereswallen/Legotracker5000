import { eq } from "drizzle-orm";
import { db } from "./db";
import { rebrickableCache } from "./db/schema";
import type {
  RebrickableSet,
  RebrickableMinifig,
  RebrickablePart,
  RebrickableSearchResponse,
} from "@/types";

const BASE_URL = "https://rebrickable.com/api/v3/lego";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class RebrickableClient {
  private apiKey: string;
  private lastRequestTime = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Enforce a minimum 1-second gap between API requests.
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Check the cache for a given key. Returns parsed data if cache hit
   * is within TTL, otherwise null.
   */
  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const cached = await db.query.rebrickableCache.findFirst({
        where: eq(rebrickableCache.cacheKey, key),
      });

      if (!cached) return null;

      const fetchedAt = new Date(cached.fetchedAt!).getTime();
      if (Date.now() - fetchedAt > CACHE_TTL_MS) {
        // Cache expired, delete stale entry
        await db
          .delete(rebrickableCache)
          .where(eq(rebrickableCache.cacheKey, key));
        return null;
      }

      return JSON.parse(cached.data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Store data in cache with the current timestamp.
   */
  private async setCache(key: string, data: unknown): Promise<void> {
    try {
      await db
        .insert(rebrickableCache)
        .values({
          cacheKey: key,
          data: JSON.stringify(data),
        })
        .onConflictDoUpdate({
          target: rebrickableCache.cacheKey,
          set: {
            data: JSON.stringify(data),
            fetchedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
          },
        });
    } catch {
      // Cache write failure is non-fatal
    }
  }

  /**
   * Make an authenticated request to the Rebrickable API.
   */
  private async request<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    const cacheKey = url.toString();

    // Check cache first
    const cached = await this.getCached<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Rate limit before making the request
    await this.rateLimit();

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `key ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Rebrickable API error ${response.status}: ${errorText}`
      );
    }

    const data = (await response.json()) as T;

    // Store in cache
    await this.setCache(cacheKey, data);

    return data;
  }

  /**
   * Search for LEGO sets by query string.
   */
  async searchSets(
    query: string,
    page = 1
  ): Promise<RebrickableSearchResponse<RebrickableSet>> {
    return this.request<RebrickableSearchResponse<RebrickableSet>>(
      "/sets/",
      {
        search: query,
        page: String(page),
        page_size: "20",
      }
    );
  }

  /**
   * Get a specific set by set number (e.g., "75192-1").
   */
  async getSet(setNum: string): Promise<RebrickableSet> {
    return this.request<RebrickableSet>(`/sets/${setNum}/`);
  }

  /**
   * Get the parts inventory for a specific set.
   */
  async getSetParts(
    setNum: string,
    page = 1
  ): Promise<
    RebrickableSearchResponse<{
      id: number;
      inv_part_id: number;
      part: RebrickablePart;
      color: { id: number; name: string; rgb: string; is_trans: boolean };
      set_num: string;
      quantity: number;
      is_spare: boolean;
      element_id: string | null;
      num_sets: number;
    }>
  > {
    return this.request(`/sets/${setNum}/parts/`, {
      page: String(page),
      page_size: "100",
    });
  }

  /**
   * Get all minifigs included in a specific set.
   */
  async getSetMinifigs(
    setNum: string
  ): Promise<
    RebrickableSearchResponse<{
      id: number;
      set_num: string;
      set_name: string;
      quantity: number;
      set_img_url: string | null;
    }>
  > {
    return this.request(`/sets/${setNum}/minifigs/`);
  }

  /**
   * Search for minifigs by query string.
   */
  async searchMinifigs(
    query: string,
    page = 1
  ): Promise<RebrickableSearchResponse<RebrickableMinifig>> {
    return this.request<RebrickableSearchResponse<RebrickableMinifig>>(
      "/minifigs/",
      {
        search: query,
        page: String(page),
        page_size: "20",
      }
    );
  }
}

/**
 * Create a RebrickableClient instance. Uses the provided API key,
 * or falls back to the REBRICKABLE_API_KEY environment variable.
 */
export function getRebrickableClient(apiKey?: string): RebrickableClient {
  const key = apiKey || process.env.REBRICKABLE_API_KEY;
  if (!key) {
    throw new Error(
      "Rebrickable API key is required. Provide it as an argument or set the REBRICKABLE_API_KEY environment variable."
    );
  }
  return new RebrickableClient(key);
}

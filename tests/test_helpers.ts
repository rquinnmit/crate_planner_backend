/**
 * Test Helper Functions
 *
 * Shared utilities for test suites
 */

import "@std/dotenv/load";
import { CamelotKey, Track } from "../src/core/track.ts";

/**
 * Load LLM configuration from environment variables
 */
export function loadLLMConfig(): { apiKey: string } {
  const apiKey = Deno.env.get("GEMINI_API_KEY");

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY not found in environment. " +
        "Please copy env.template to .env and add your API key.",
    );
  }

  return { apiKey };
}

/**
 * Load Spotify configuration from environment variables
 */
export function loadSpotifyConfig(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify credentials not found in environment. " +
        "Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env",
    );
  }

  return { clientId, clientSecret };
}

/**
 * Check if LLM config is available
 */
export function hasLLMConfig(): boolean {
  return !!Deno.env.get("GEMINI_API_KEY");
}

/**
 * Check if Spotify config is available
 */
export function hasSpotifyConfig(): boolean {
  return !!Deno.env.get("SPOTIFY_CLIENT_ID") &&
    !!Deno.env.get("SPOTIFY_CLIENT_SECRET");
}

/**
 * Shared In-Memory MongoDB Mock Collection
 * Used for testing without actual MongoDB connection
 */
export class InMemoryCollection<T extends { id: string }> {
  private data = new Map<string, T>();

  insertMany(docs: T[]) {
    docs.forEach((d) => this.data.set(d.id, d));
  }

  insertOne(doc: T) {
    this.data.set(doc.id, doc);
  }

  findOne(query: { id: string }): Promise<T | null> {
    return Promise.resolve(this.data.get(query.id) ?? null);
  }

  find(query: Record<string, unknown>) {
    const all = Array.from(this.data.values());
    let limitValue: number | undefined;

    const cursor = {
      limit: (n: number) => {
        limitValue = n;
        return cursor;
      },
      toArray: () => {
        let result = all;

        // Apply filtering if query is not empty
        if (Object.keys(query).length > 0) {
          result = all.filter((item: T) => {
            return applyQueryFilter(item, query);
          });
        }

        // Apply limit if specified
        if (limitValue !== undefined) {
          result = result.slice(0, limitValue);
        }

        return Promise.resolve(result);
      },
    };

    return cursor;
  }

  // Helper methods for tests
  clear() {
    this.data.clear();
  }

  getAll(): T[] {
    return Array.from(this.data.values());
  }

  size(): number {
    return this.data.size;
  }
}

// Helper function for query filtering
function applyQueryFilter<T extends { id: string }>(
  item: T,
  query: Record<string, unknown>,
): boolean {
  // Handle $in operator for id field
  if (query.id && typeof query.id === "object" && "$in" in query.id) {
    const idSet = new Set((query.id as { $in: string[] }).$in);
    if (!idSet.has(item.id)) return false;
  } else if (query.id && item.id !== query.id) {
    return false;
  }

  // Handle other Track-specific fields
  const track = item as unknown as Track;

  // Genre filter with $regex
  if (
    query.genre && typeof query.genre === "object" &&
    "$regex" in query.genre
  ) {
    const regex = (query.genre as { $regex: RegExp }).$regex;
    if (!track.genre || !regex.test(track.genre)) return false;
  }

  // BPM range filter
  if (query.bpm && typeof query.bpm === "object") {
    const bpmFilter = query.bpm as { $gte?: number; $lte?: number };
    if (bpmFilter.$gte !== undefined && track.bpm < bpmFilter.$gte) {
      return false;
    }
    if (bpmFilter.$lte !== undefined && track.bpm > bpmFilter.$lte) {
      return false;
    }
  }

  // Key filter with $in
  if (query.key) {
    if (typeof query.key === "object" && "$in" in query.key) {
      const keySet = new Set((query.key as { $in: string[] }).$in);
      if (!keySet.has(track.key)) return false;
    } else if (track.key !== query.key) {
      return false;
    }
  }

  // Energy range filter
  if (query.energy && typeof query.energy === "object") {
    const energyFilter = query.energy as { $gte?: number; $lte?: number };
    if (!track.energy) return false;
    if (
      energyFilter.$gte !== undefined && track.energy < energyFilter.$gte
    ) return false;
    if (
      energyFilter.$lte !== undefined && track.energy > energyFilter.$lte
    ) return false;
  }

  // Duration range filter
  if (query.duration_sec && typeof query.duration_sec === "object") {
    const durationFilter = query.duration_sec as {
      $gte?: number;
      $lte?: number;
    };
    if (
      durationFilter.$gte !== undefined &&
      track.duration_sec < durationFilter.$gte
    ) return false;
    if (
      durationFilter.$lte !== undefined &&
      track.duration_sec > durationFilter.$lte
    ) return false;
  }

  // Artist filter with $in, $nin, $regex
  if (query.artist) {
    const artistFilter = query.artist as {
      $in?: RegExp[];
      $nin?: RegExp[];
      $regex?: RegExp;
    };
    if (artistFilter.$in) {
      const regexes = artistFilter.$in as RegExp[];
      if (!regexes.some((re) => re.test(track.artist))) return false;
    } else if (artistFilter.$nin) {
      const regexes = artistFilter.$nin as RegExp[];
      if (regexes.some((re) => re.test(track.artist))) return false;
    } else if (artistFilter.$regex) {
      if (!artistFilter.$regex.test(track.artist)) return false;
    }
  }

  return true;
}

/**
 * Shared In-Memory MongoDB Mock Database
 * Maintains collection instances across calls
 */
export class InMemoryDb {
  private collections = new Map<string, InMemoryCollection<{ id: string }>>();

  collection<T extends { id: string }>(name: string): InMemoryCollection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new InMemoryCollection<T>());
    }
    return this.collections.get(name)! as InMemoryCollection<T>;
  }

  // Helper methods for tests
  clearAllCollections() {
    this.collections.forEach((coll) => coll.clear());
  }

  dropCollection(name: string) {
    this.collections.delete(name);
  }

  // Type-safe access for testing
  [key: string]: unknown;
}

/**
 * Create a sample track for testing
 */
export function createSampleTrack(
  id: string,
  overrides?: Partial<Track>,
): Track {
  return {
    id,
    artist: "Test Artist",
    title: "Test Track",
    genre: "Tech House",
    duration_sec: 360,
    bpm: 128,
    key: "8A" as CamelotKey,
    energy: 3,
    ...overrides,
  };
}

/**
 * Create multiple sample tracks for testing
 */
export function createSampleTracks(
  count: number,
  baseId: string = "track",
): Track[] {
  return Array.from(
    { length: count },
    (_, i) =>
      createSampleTrack(`${baseId}-${String(i + 1).padStart(3, "0")}`, {
        bpm: 120 + (i % 20),
        key: (["8A", "8B", "9A", "9B", "10A"] as CamelotKey[])[i % 5],
        energy: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      }),
  );
}

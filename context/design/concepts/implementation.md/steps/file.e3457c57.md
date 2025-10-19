---
timestamp: 'Fri Oct 17 2025 13:15:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251017_131505.9c68c64a.md]]'
content_id: e3457c5781685e6344e3241c035f21da72968212aa0b5e4becc99b2d4e2aeca4
---

# file: src/core/crate/\_planner.test.ts

```typescript
import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert";
import { describe, it, beforeEach, afterEach } from "jsr:@std/testing/bdd";
import {
  returnsNext,
  spy,
  stub,
  type Stub,
} from "jsr:@std/testing/mock";
import { type Collection, type Db } from "npm:mongodb";
import { CratePlanner, type CratePlan, type CratePrompt, type DerivedIntent, type CandidatePool } from "./_planner.ts";
import { GeminiLLM } from "../llm/gemini-llm.ts";
import { SpotifySearchService } from "../llm/spotify_search_service.ts";
import { type Track } from "./track.ts";

// #region Mocks and Test Data
const mockTracks: Track[] = [
  { id: "track1", artist: "Artist A", title: "Song A", bpm: 120, key: "5A", duration_sec: 240, genre: "House" },
  { id: "track2", artist: "Artist B", title: "Song B", bpm: 122, key: "5A", duration_sec: 250, genre: "House" },
  { id: "track3", artist: "Artist C", title: "Song C", bpm: 125, key: "6A", duration_sec: 300, genre: "Techno" },
  { id: "track4", artist: "Artist D", title: "Song D", bpm: 128, key: "7A", duration_sec: 280, genre: "Techno" },
  { id: "track5", artist: "Artist A", title: "Song E", bpm: 95, key: "10A", duration_sec: 200, genre: "Hip Hop" },
];

class MockGeminiLLM {
  executeLLM = spy(async (_prompt: string): Promise<string> => {
    return "Default mock LLM response";
  });
}

class MockSpotifySearchService {
  searchTracksForIntent = spy(async (_intent: DerivedIntent, _limit: number): Promise<Track[]> => {
    return [
      { id: "spotify1", artist: "Spotify Artist", title: "Found Track", bpm: 124, key: "6A", duration_sec: 260 },
    ];
  });
}

const createMockDb = (): Db => {
  const mockCollection: Partial<Collection<Track>> = {
    findOne: (filter: any) => Promise.resolve(mockTracks.find(t => t.id === filter.id) || null),
    find: (filter: any = {}) => {
      let results = [...mockTracks];
      if (filter.id && filter.id.$in) {
        results = mockTracks.filter(t => filter.id.$in.includes(t.id));
      }
      if (filter.bpm && filter.bpm.$gte) {
        results = results.filter(t => t.bpm >= filter.bpm.$gte);
      }
      if (filter.bpm && filter.bpm.$lte) {
        results = results.filter(t => t.bpm <= filter.bpm.$lte);
      }
      return {
        toArray: () => Promise.resolve(results),
        // deno-lint-ignore no-explicit-any
      } as any;
    },
  };

  return {
    collection: () => mockCollection as Collection<Track>,
  } as Db;
};
// #endregion

describe("CratePlanner", () => {
  let planner: CratePlanner;
  let mockDb: Db;
  let mockLlm: MockGeminiLLM;
  let mockSpotify: MockSpotifySearchService;
  let consoleErrorStub: Stub<Console>;

  beforeEach(() => {
    mockDb = createMockDb();
    mockLlm = new MockGeminiLLM();
    mockSpotify = new MockSpotifySearchService();
    planner = new CratePlanner(mockDb);
    consoleErrorStub = stub(console, "error");
  });
  
  afterEach(() => {
    consoleErrorStub.restore();
  });

  describe("Deterministic Planning", () => {
    it("createPlan should create a valid plan with seed tracks and sorted candidates", async () => {
      const prompt: CratePrompt = {
        tempoRange: { min: 120, max: 130 },
        targetDuration: 700, // seconds
      };
      const seedTracks = ["track1"];
      const plan = await planner.createPlan(prompt, seedTracks);

      assertExists(plan);
      assertEquals(plan.trackList[0], "track1");
      // track2 (122) and track3 (125) are candidates, sorted by BPM. track4 is out of range.
      assertEquals(plan.trackList, ["track1", "track2", "track3"]);
      assertEquals(plan.planDetails.usedAI, false);
      assertEquals(plan.totalDuration, 240 + 250 + 300); // 790
      assert(plan.totalDuration >= prompt.targetDuration!);
    });

    it("createPlan should throw an error if a seed track is not found", async () => {
      const prompt: CratePrompt = {};
      const seedTracks = ["track_not_found"];
      await assertRejects(
        () => planner.createPlan(prompt, seedTracks),
        Error,
        "Seed track track_not_found not found in database",
      );
    });
  });

  describe("LLM-Powered Planning", () => {
    it("deriveIntentLLM should derive a structured intent from a valid LLM response", async () => {
        const mockResponse = JSON.stringify({
            tempoRange: { min: 120, max: 128 },
            allowedKeys: ["5A", "6A"],
            targetGenres: ["House", "Techno"],
            duration: 3600,
            mixStyle: "smooth"
        });
        mockLlm.executeLLM.mockImplementation(() => Promise.resolve(mockResponse));
        
        const intent = await planner.deriveIntentLLM({}, [], mockLlm as unknown as GeminiLLM);
        
        assertEquals(intent.tempoRange, { min: 120, max: 128 });
        assertEquals(intent.targetGenres, ["House", "Techno"]);
        assertEquals(mockLlm.executeLLM.calls.length, 1);
    });

    it("deriveIntentLLM should use a fallback intent if the LLM response is unparsable", async () => {
        mockLlm.executeLLM.mockImplementation(() => Promise.resolve("This is not JSON"));
        const prompt: CratePrompt = { targetDuration: 1800 };
        const intent = await planner.deriveIntentLLM(prompt, [], mockLlm as unknown as GeminiLLM);
        
        assertEquals(intent.duration, 1800); // from fallback
        assertEquals(intent.mixStyle, "smooth");
        assert(consoleErrorStub.calls.length > 0);
    });

    describe("generateCandidatePoolLLM", () => {
      it("should use Spotify service and LLM to select tracks when available", async () => {
        planner.setSpotifySearchService(mockSpotify as unknown as SpotifySearchService);
        const mockResponse = JSON.stringify({
            selectedTrackIds: ["spotify1"],
            reasoning: "Selected based on intent."
        });
        mockLlm.executeLLM.mockImplementation(() => Promise.resolve(mockResponse));
        
        const intent: DerivedIntent = { tempoRange: { min: 120, max: 130 }, duration: 3600, targetGenres: ["House"], mixStyle: "smooth", allowedKeys: [], mustIncludeArtists:[], avoidArtists: [], mustIncludeTracks: [], avoidTracks: [] };
        const pool = await planner.generateCandidatePoolLLM(intent, mockLlm as unknown as GeminiLLM);

        assertEquals(mockSpotify.searchTracksForIntent.calls.length, 1);
        assertEquals(mockLlm.executeLLM.calls.length, 1);
        assertEquals(Array.from(pool.tracks), ["spotify1"]);
        assertEquals(pool.filtersApplied, "Selected based on intent.");
      });

      it("should use database fallback if Spotify is not available", async () => {
        const mockResponse = JSON.stringify({
            selectedTrackIds: ["track1", "track3"],
            reasoning: "Selected from DB."
        });
        mockLlm.executeLLM.mockImplementation(() => Promise.resolve(mockResponse));
        
        const intent: DerivedIntent = { tempoRange: { min: 120, max: 130 }, duration: 3600, targetGenres: ["House", "Techno"], mixStyle: "smooth", allowedKeys: [], mustIncludeArtists:[], avoidArtists: [], mustIncludeTracks: [], avoidTracks: [] };
        const pool = await planner.generateCandidatePoolLLM(intent, mockLlm as unknown as GeminiLLM);

        assertEquals(mockSpotify.searchTracksForIntent.calls.length, 0);
        assertEquals(Array.from(pool.tracks), ["track1", "track3"]);
      });
    });

    it("sequencePlanLLM should return an ordered plan based on LLM response", async () => {
      const mockResponse = JSON.stringify({
          orderedTrackIds: ["track3", "track1", "track2"],
          reasoning: "Sequenced for energy."
      });
      mockLlm.executeLLM.mockImplementation(() => Promise.resolve(mockResponse));

      const intent: DerivedIntent = { tempoRange: { min: 120, max: 130 }, duration: 3600, targetGenres: ["House", "Techno"], mixStyle: "smooth", allowedKeys: [], mustIncludeArtists:[], avoidArtists: [], mustIncludeTracks: [], avoidTracks: [] };
      const pool: CandidatePool = { sourcePrompt: {}, tracks: new Set(["track1", "track2", "track3"]), filtersApplied: ""};
      
      const plan = await planner.sequencePlanLLM(intent, pool, [], mockLlm as unknown as GeminiLLM);
      
      assertEquals(plan.trackList, ["track3", "track1", "track2"]);
      assertEquals(plan.annotations, "Sequenced for energy.");
      assertEquals(plan.planDetails.usedAI, true);
    });

    it("revisePlanLLM should throw an error for invalid instructions", async () => {
      const plan: CratePlan = { prompt: {}, trackList: ["track1"], annotations: "", totalDuration: 240, planDetails: { usedAI: false }, isFinalized: false };
      
      await assertRejects(() => planner.revisePlanLLM(plan, "add", mockLlm as unknown as GeminiLLM), Error, "Revision instructions must be at least 5 characters");
    });
  });

  describe("Plan Management", () => {
    let plan: CratePlan;

    beforeEach(() => {
        plan = {
            prompt: { targetDuration: 500 },
            trackList: ["track1", "track2"],
            annotations: "Test plan",
            totalDuration: 490, // 240 + 250
            planDetails: { usedAI: false },
            isFinalized: false
        };
    });

    it("validate should return true for a valid plan", async () => {
        const result = await planner.validate(plan, 60); // 1 minute tolerance
        assertEquals(result.isValid, true);
        assertEquals(result.errors.length, 0);
    });

    it("validate should return false for a plan with a non-existent track", async () => {
        plan.trackList.push("track_not_found");
        const result = await planner.validate(plan);
        assertEquals(result.isValid, false);
        assert(result.errors.includes("Track track_not_found not found in database"));
    });

    it("validate should return false for duplicate tracks", async () => {
        plan.trackList.push("track1");
        const result = await planner.validate(plan);
        assertEquals(result.isValid, false);
        assert(result.errors.includes("Plan contains duplicate tracks"));
    });

    it("finalize should succeed for a valid plan", async () => {
        await planner.finalize(plan);
        assertEquals(plan.isFinalized, true);
        assertEquals(planner.getFinalizedPlans()[0], plan);
    });

    it("finalize should throw an error for an invalid plan", async () => {
        plan.trackList.push("track1"); // Make it invalid
        await assertRejects(() => planner.finalize(plan), Error, "Cannot finalize invalid plan");
    });
  });
});
```

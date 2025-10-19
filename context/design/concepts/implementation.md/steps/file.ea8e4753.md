---
timestamp: 'Fri Oct 17 2025 13:18:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251017_131813.76681aed.md]]'
content_id: ea8e4753147ecf9b4e6ef3d6932517784b2b13044c259114924e88c82dbe7aa9
---

# file: src/core/crate/\_planner.test.ts

```typescript
import {
  assert,
  assertEquals,
  assertExists,
  assertRejects,
} from "jsr:@std/assert";
import { stub, type Stub } from "jsr:@std/testing/mock";
import { type Collection, type Db } from "npm:mongodb";
import {
  CratePlanner,
  type CandidatePool,
  type CratePlan,
  type CratePrompt,
  type DerivedIntent,
} from "./_planner.ts";
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

// Mock LLM class to control its responses in tests
class MockGeminiLLM {
  executeLLM = async (_prompt: string): Promise<string> => {
    // This method will be stubbed in each test to provide specific responses
    return "Default mock LLM response";
  };
}

// Mock Spotify service to control its responses in tests
class MockSpotifySearchService {
  searchTracksForIntent = async (_intent: DerivedIntent, _limit: number): Promise<Track[]> => {
    // This method can be stubbed if needed, but a default is provided
    return [
      { id: "spotify1", artist: "Spotify Artist", title: "Found Track", bpm: 124, key: "6A", duration_sec: 260 },
    ];
  };
}

// Helper function to create a mock MongoDB Db instance
const createMockDb = (): Db => {
  const mockCollection: Partial<Collection<Track>> = {
    findOne: (filter: any) => Promise.resolve(mockTracks.find((t) => t.id === filter.id) || null),
    find: (filter: any = {}) => {
      let results = [...mockTracks];
      if (filter.id && filter.id.$in) {
        results = mockTracks.filter((t) => filter.id.$in.includes(t.id));
      }
      if (filter.bpm && filter.bpm.$gte) {
        results = results.filter((t) => t.bpm >= filter.bpm.$gte);
      }
      if (filter.bpm && filter.bpm.$lte) {
        results = results.filter((t) => t.bpm <= filter.bpm.$lte);
      }
      return {
        toArray: () => Promise.resolve(results),
      } as any;
    },
  };

  return {
    collection: () => mockCollection as Collection<Track>,
  } as Db;
};
// #endregion

Deno.test("CratePlanner", async (t) => {
  // These variables are scoped to the main test function and will be reset for each step group
  let planner: CratePlanner;
  let mockDb: Db;
  let mockLlm: MockGeminiLLM;
  let mockSpotify: MockSpotifySearchService;
  let consoleErrorStub: Stub<Console>;
  let llmStub: Stub<MockGeminiLLM>;
  let spotifyStub: Stub<MockSpotifySearchService>;

  // A setup function to run before each test step, ensuring isolation
  const setup = () => {
    mockDb = createMockDb();
    mockLlm = new MockGeminiLLM();
    mockSpotify = new MockSpotifySearchService();
    planner = new CratePlanner(mockDb);
    consoleErrorStub = stub(console, "error");
    llmStub = stub(mockLlm, "executeLLM");
    spotifyStub = stub(mockSpotify, "searchTracksForIntent");
  };

  // A teardown function to clean up after each test step
  const teardown = () => {
    consoleErrorStub.restore();
    llmStub.restore();
    spotifyStub.restore();
  };

  await t.step("Deterministic Planning", async (t) => {
    await t.step("createPlan should create a valid plan with seed tracks and sorted candidates", async () => {
      setup();
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
      teardown();
    });

    await t.step("createPlan should throw an error if a seed track is not found", async () => {
      setup();
      const prompt: CratePrompt = {};
      const seedTracks = ["track_not_found"];
      await assertRejects(
        () => planner.createPlan(prompt, seedTracks),
        Error,
        "Seed track track_not_found not found in database",
      );
      teardown();
    });
  });

  await t.step("LLM-Powered Planning", async (t) => {
    await t.step("deriveIntentLLM should derive a structured intent from a valid LLM response", async () => {
      setup();
      const mockResponse = JSON.stringify({
        tempoRange: { min: 120, max: 128 },
        allowedKeys: ["5A", "6A"],
        targetGenres: ["House", "Techno"],
        duration: 3600,
        mixStyle: "smooth",
      });
      llmStub.resolves(mockResponse);

      const intent = await planner.deriveIntentLLM({}, [], mockLlm as unknown as GeminiLLM);

      assertEquals(intent.tempoRange, { min: 120, max: 128 });
      assertEquals(intent.targetGenres, ["House", "Techno"]);
      assertEquals(llmStub.calls.length, 1);
      teardown();
    });

    await t.step("deriveIntentLLM should use a fallback intent if the LLM response is unparsable", async () => {
      setup();
      llmStub.resolves("This is not JSON");
      const prompt: CratePrompt = { targetDuration: 1800 };
      const intent = await planner.deriveIntentLLM(prompt, [], mockLlm as unknown as GeminiLLM);

      assertEquals(intent.duration, 1800); // from fallback
      assertEquals(intent.mixStyle, "smooth");
      assert(consoleErrorStub.calls.length > 0);
      teardown();
    });

    await t.step("generateCandidatePoolLLM", async (t) => {
      await t.step("should use Spotify service and LLM to select tracks when available", async () => {
        setup();
        planner.setSpotifySearchService(mockSpotify as unknown as SpotifySearchService);
        const mockResponse = JSON.stringify({
          selectedTrackIds: ["spotify1"],
          reasoning: "Selected based on intent.",
        });
        llmStub.resolves(mockResponse);

        const intent: DerivedIntent = { tempoRange: { min: 120, max: 130 }, duration: 3600, targetGenres: ["House"], mixStyle: "smooth", allowedKeys: [], mustIncludeArtists: [], avoidArtists: [], mustIncludeTracks: [], avoidTracks: [] };
        const pool = await planner.generateCandidatePoolLLM(intent, mockLlm as unknown as GeminiLLM);

        assertEquals(spotifyStub.calls.length, 1);
        assertEquals(llmStub.calls.length, 1);
        assertEquals(Array.from(pool.tracks), ["spotify1"]);
        assertEquals(pool.filtersApplied, "Selected based on intent.");
        teardown();
      });

      await t.step("should use database fallback if Spotify is not available", async () => {
        setup();
        const mockResponse = JSON.stringify({
          selectedTrackIds: ["track1", "track3"],
          reasoning: "Selected from DB.",
        });
        llmStub.resolves(mockResponse);

        const intent: DerivedIntent = { tempoRange: { min: 120, max: 130 }, duration: 3600, targetGenres: ["House", "Techno"], mixStyle: "smooth", allowedKeys: [], mustIncludeArtists: [], avoidArtists: [], mustIncludeTracks: [], avoidTracks: [] };
        const pool = await planner.generateCandidatePoolLLM(intent, mockLlm as unknown as GeminiLLM);

        assertEquals(spotifyStub.calls.length, 0);
        assertEquals(Array.from(pool.tracks), ["track1", "track3"]);
        teardown();
      });
    });

    await t.step("sequencePlanLLM should return an ordered plan based on LLM response", async () => {
      setup();
      const mockResponse = JSON.stringify({
        orderedTrackIds: ["track3", "track1", "track2"],
        reasoning: "Sequenced for energy.",
      });
      llmStub.resolves(mockResponse);

      const pool: CandidatePool = { sourcePrompt: {}, tracks: new Set(["track1", "track2", "track3"]), filtersApplied: "" };
      const intent: DerivedIntent = { tempoRange: { min: 120, max: 130 }, duration: 3600, targetGenres: ["House", "Techno"], mixStyle: "smooth", allowedKeys: [], mustIncludeArtists: [], avoidArtists: [], mustIncludeTracks: [], avoidTracks: [] };
      const plan = await planner.sequencePlanLLM(intent, pool, [], mockLlm as unknown as GeminiLLM);

      assertEquals(plan.trackList, ["track3", "track1", "track2"]);
      assertEquals(plan.annotations, "Sequenced for energy.");
      assertEquals(plan.planDetails.usedAI, true);
      teardown();
    });
  });

  await t.step("Plan Management", async (t) => {
    await t.step("validate should return true for a valid plan", async () => {
      setup();
      const plan: CratePlan = {
        prompt: { targetDuration: 500 },
        trackList: ["track1", "track2"],
        annotations: "Test plan",
        totalDuration: 490,
        planDetails: { usedAI: false },
        isFinalized: false,
      };
      const result = await planner.validate(plan, 60);
      assertEquals(result.isValid, true);
      assertEquals(result.errors.length, 0);
      teardown();
    });

    await t.step("validate should return false for a non-existent track", async () => {
      setup();
      const plan: CratePlan = { prompt: {}, trackList: ["track1", "track_not_found"], annotations: "", totalDuration: 0, planDetails: { usedAI: false }, isFinalized: false };
      const result = await planner.validate(plan);
      assertEquals(result.isValid, false);
      assert(result.errors.includes("Track track_not_found not found in database"));
      teardown();
    });

    await t.step("finalize should succeed for a valid plan", async () => {
      setup();
      const plan: CratePlan = { prompt: {}, trackList: ["track1"], annotations: "", totalDuration: 240, planDetails: { usedAI: false }, isFinalized: false };
      await planner.finalize(plan);
      assertEquals(plan.isFinalized, true);
      assertEquals(planner.getFinalizedPlans()[0], plan);
      teardown();
    });

    await t.step("finalize should throw an error for an invalid plan", async () => {
      setup();
      const plan: CratePlan = { prompt: {}, trackList: ["track1", "track1"], annotations: "", totalDuration: 480, planDetails: { usedAI: false }, isFinalized: false }; // Invalid
      await assertRejects(() => planner.finalize(plan), Error, "Cannot finalize invalid plan");
      teardown();
    });
  });
});
```

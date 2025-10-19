/**
 * CratePlanner LLM-backed tests (mocked LLM)
 */

import { assert, assertEquals } from "jsr:@std/assert";
import { Db } from "mongodb";
import {
  CratePlanner,
  CratePrompt,
  DerivedIntent,
} from "../src/core/crate_planner.ts";
import { Track } from "../src/core/track.ts";
import { GeminiLLM } from "../src/llm/gemini-llm.ts";
import { createSampleTrack, InMemoryDb } from "./test_helpers.ts";

function seedTracks(db: InMemoryDb) {
  const coll = db.collection<Track>("tracks");
  coll.insertMany([
    createSampleTrack("s1", {
      artist: "A1",
      title: "T1",
      genre: "House",
      duration_sec: 200,
      bpm: 120,
      key: "8A",
      energy: 2,
    }),
    createSampleTrack("s2", {
      artist: "A2",
      title: "T2",
      genre: "House",
      duration_sec: 220,
      bpm: 122,
      key: "9A",
      energy: 3,
    }),
    createSampleTrack("s3", {
      artist: "A3",
      title: "T3",
      genre: "Tech House",
      duration_sec: 240,
      bpm: 124,
      key: "10A",
      energy: 4,
    }),
  ]);
}

// Mock LLM that returns deterministic JSON/text
class MockLLM extends GeminiLLM {
  constructor() {
    // @ts-ignore bypass constructor requirements
    super({ apiKey: "mock" });
  }
  override async executeLLM(prompt: string): Promise<string> {
    if (prompt.includes("derive a detailed intent")) {
      const intent: Partial<DerivedIntent> = {
        tempoRange: { min: 120, max: 124 },
        allowedKeys: ["8A" as any],
        targetGenres: ["House"],
        duration: 600,
        mixStyle: "smooth",
        mustIncludeArtists: [],
        avoidArtists: [],
        mustIncludeTracks: [],
        avoidTracks: [],
        energyCurve: "linear",
      };
      return JSON.stringify(intent);
    }

    if (prompt.includes("Your task: Select tracks")) {
      // candidate pool selection
      return JSON.stringify({
        selectedTrackIds: ["s1", "s2"],
        reasoning: "Match BPM range and genre",
      });
    }

    if (prompt.includes("Create an ordered tracklist")) {
      // sequence plan
      return JSON.stringify({
        orderedTrackIds: ["s1", "s2"],
        reasoning: "Seed order maintained with smooth BPM",
      });
    }

    if (prompt.includes("You are explaining why a DJ crate")) {
      return "Cohesive flow explanation.";
    }

    if (prompt.includes("You are revising a DJ crate")) {
      return JSON.stringify({
        revisedTrackIds: ["s2", "s1"],
        changesExplanation: "Swapped order for smoother energy",
      });
    }

    return "{}";
  }
}

Deno.test("CratePlanner LLM flow - derive intent and candidate pool", async () => {
  const db = new InMemoryDb();
  seedTracks(db);
  const planner = new CratePlanner(db as unknown as Db);
  const llm = new MockLLM();

  const prompt: CratePrompt = {
    notes: "Sunset set",
    tempoRange: { min: 118, max: 126 },
    targetGenre: "House",
    targetDuration: 600,
  };

  const intent = await planner.deriveIntentLLM(prompt, ["s1"], llm);
  assertEquals(intent.mixStyle, "smooth");

  const pool = await planner.generateCandidatePoolLLM(intent, llm);
  assertEquals(pool.tracks.has("s1"), true);
});

Deno.test("CratePlanner LLM flow - sequence, explain, revise", async () => {
  const db = new InMemoryDb();
  seedTracks(db);
  const planner = new CratePlanner(db as unknown as Db);
  const llm = new MockLLM();

  const intent: DerivedIntent = {
    tempoRange: { min: 120, max: 124 },
    allowedKeys: ["8A" as any],
    targetGenres: ["House"],
    duration: 600,
    mixStyle: "smooth",
    mustIncludeArtists: [],
    avoidArtists: [],
    mustIncludeTracks: [],
    avoidTracks: [],
    energyCurve: "linear",
  };

  const pool = {
    sourcePrompt: { targetGenre: "House", tempoRange: intent.tempoRange },
    tracks: new Set(["s1", "s2"]),
    filtersApplied: "",
  };
  const plan = await planner.sequencePlanLLM(intent, pool, ["s1"], llm);
  assertEquals(plan.trackList.length > 0, true);

  const explained = await planner.explainPlanLLM(plan, llm);
  assert(explained.annotations.length > 0);

  const revised = await planner.revisePlanLLM(explained, "Swap order", llm);
  assertEquals(revised.trackList.length, plan.trackList.length);
});

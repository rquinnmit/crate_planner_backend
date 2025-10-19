/**
 * Validation Constraints Tests
 */

import { assert, assertEquals } from "jsr:@std/assert";
import {
  getConstraintViolations,
  satisfiesAllConstraints,
  validateCratePlan,
  validateCratePrompt,
  validateDerivedIntent,
  validatePlanForFinalization,
  validateTrack,
  validateTrackFilePath,
  validateTrackFilter,
} from "../src/validation/constraints.ts";

import { CamelotKey, Track } from "../src/core/track.ts";

function track(overrides: Partial<Track> = {}): Track {
  return {
    id: "t1",
    artist: "A",
    title: "T",
    duration_sec: 300,
    bpm: 128,
    key: "8A" as CamelotKey,
    ...overrides,
  };
}

Deno.test("Validation - track basics", () => {
  const ok = validateTrack(track());
  assert(ok.isValid);
  const bad = validateTrack({ id: "x" } as any);
  assertEquals(bad.isValid, false);
});

Deno.test("Validation - file path required for export", () => {
  const res1 = validateTrackFilePath(track());
  assertEquals(res1.isValid, false);
  const res2 = validateTrackFilePath(track({ filePath: "/tmp/file.mp3" }));
  assertEquals(res2.isValid, true);
});

Deno.test("Validation - prompt and intent", () => {
  const prompt = validateCratePrompt({
    tempoRange: { min: 120, max: 130 },
    targetKey: "8A" as CamelotKey,
    targetDuration: 3600,
  });
  assert(prompt.isValid);

  const intent = validateDerivedIntent({
    tempoRange: { min: 120, max: 124 },
    allowedKeys: ["8A" as CamelotKey],
    targetGenres: ["House"],
    duration: 3600,
    mixStyle: "smooth",
    mustIncludeArtists: [],
    avoidArtists: [],
    mustIncludeTracks: [],
    avoidTracks: [],
  } as any);
  assert(intent.isValid);
});

Deno.test("Validation - plan basics and finalization", () => {
  const plan = {
    prompt: { targetDuration: 3600 },
    trackList: ["a", "b", "a"],
    annotations: "",
    totalDuration: 3500,
    planDetails: { usedAI: false },
    isFinalized: false,
  } as any;

  const res = validateCratePlan(plan);
  assertEquals(res.isValid, false); // duplicates + duration diff
  const fin = validatePlanForFinalization({ ...plan, isFinalized: true });
  assertEquals(fin.isValid, false);
});

Deno.test("Validation - filter constraints and checks", () => {
  const t1 = track({ bpm: 120, energy: 3, genre: "Tech House" });
  const filter = {
    bpmRange: { min: 118, max: 122 },
    energyRange: { min: 3, max: 4 },
    genre: "Tech House",
  } as any;

  const filterRes = validateTrackFilter(filter);
  assertEquals(filterRes.isValid, true);
  assertEquals(satisfiesAllConstraints(t1, filter), true);
  const violations = getConstraintViolations(
    track({ bpm: 140, key: "10A" as CamelotKey, genre: "Techno" }),
    {
      bpmRange: { min: 118, max: 122 },
      genre: "Tech House",
      key: "8A" as CamelotKey,
    },
  );
  assert(violations.length >= 2);
});

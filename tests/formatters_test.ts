/**
 * Formatter Utilities Tests
 */

import { assert, assertEquals } from "jsr:@std/assert";
import {
  formatBPMRange,
  formatDurationCompact,
  formatDurationDifference,
  formatDurationLong,
  formatDurationWithTolerance,
  formatMinutes,
  formatMMSS,
  formatPercentage,
  formatTrackPosition,
  parseMMSS,
} from "../src/utils/time_formatters.ts";

import {
  formatBPMRange as fmtBPM,
  formatCrateTracks,
  formatDuration as fmtDuration,
  formatKeyList,
  formatSeedTrackIds,
  formatSeedTracks,
  formatTrackList,
} from "../src/prompts/formatters.ts";

import { CamelotKey, Track } from "../src/core/track.ts";

Deno.test("Time formatters - MMSS and parsing", () => {
  assertEquals(formatMMSS(225), "3:45");
  assertEquals(parseMMSS("12:03"), 723);
});

Deno.test("Time formatters - long and compact", () => {
  assertEquals(formatDurationLong(5400), "90 minutes");
  assertEquals(formatDurationLong(7200), "2 hours");
  assertEquals(formatDurationCompact(5400), "1h 30m");
});

Deno.test("Time formatters - helpers", () => {
  assertEquals(formatMinutes(300), "5 min");
  assertEquals(formatDurationWithTolerance(3600, 300), "60 min ± 5 min");
  assertEquals(formatDurationDifference(3900, 3600), "+5 min");
  assertEquals(formatBPMRange(128, 128), "128 BPM");
  assertEquals(formatBPMRange(120, 130), "120-130 BPM");
  assertEquals(formatTrackPosition(5, 20), "Track 5 of 20");
  assertEquals(formatPercentage(50, 200), "25%");
});

function t(id: string, o?: Partial<Track>): Track {
  return {
    id,
    artist: "A",
    title: id,
    duration_sec: 120,
    bpm: 128,
    key: "8A" as CamelotKey,
    ...o,
  };
}

Deno.test("Prompt formatters - seed tracks & ids", () => {
  const tracks = [t("1", { energy: 3 }), t("2")];
  const seeds = formatSeedTracks(tracks);
  assert(seeds.includes("A - 1 (128 BPM, 8A, Energy: 3)"));
  const ids = formatSeedTrackIds(tracks);
  assert(ids.includes("1: A - 1"));
});

Deno.test("Prompt formatters - track list & crate tracks", () => {
  const tracks = [t("1"), t("2")];
  const list = formatTrackList(tracks, { withDuration: true });
  assert(list.includes("1: A - 1 (128 BPM, 8A, 120s, Energy"));
  const crate = formatCrateTracks(tracks, true);
  assert(crate.includes("1. 1: A - 1 (128 BPM, 8A, Energy"));
});

Deno.test("Prompt formatters - simple helpers", () => {
  assertEquals(fmtDuration(5400), "90 minutes");
  assertEquals(fmtBPM(120, 124), "120-124 BPM");
  assertEquals(formatKeyList(["8A", "8B", "9A"]), "8A, 8B, 9A");
  assertEquals(formatKeyList([]), "Any");
});

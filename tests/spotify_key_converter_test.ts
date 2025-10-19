/**
 * Spotify Key Converter Tests
 */

import { assert, assertEquals } from "jsr:@std/assert";
import {
  camelotToSpotifyKey,
  getCompatibleKeys,
  isValidSpotifyKey,
  spotifyKeyToCamelot,
  spotifyKeyToStandard,
} from "../src/import/spotify_key_converter.ts";

import { CamelotKey } from "../src/core/track.ts";

Deno.test("Spotify key -> Camelot", () => {
  assertEquals(spotifyKeyToCamelot(0, 1), "8B" as CamelotKey);
  assertEquals(spotifyKeyToCamelot(9, 0), "8A" as CamelotKey);
  assertEquals(spotifyKeyToCamelot(-1, 0), null);
  assertEquals(spotifyKeyToCamelot(0, 2 as any), null);
});

Deno.test("Camelot -> Spotify key/mode", () => {
  assertEquals(camelotToSpotifyKey("8B" as CamelotKey), { key: 0, mode: 1 });
  assertEquals(camelotToSpotifyKey("8A" as CamelotKey), { key: 9, mode: 0 });
  assertEquals(camelotToSpotifyKey("13A" as any), null);
});

Deno.test("Spotify key standard notation & validation", () => {
  assertEquals(spotifyKeyToStandard(0, 1), "C major");
  assertEquals(spotifyKeyToStandard(9, 0), "A minor");
  assertEquals(spotifyKeyToStandard(12, 1), null);
  assertEquals(isValidSpotifyKey(0, 1), true);
  assertEquals(isValidSpotifyKey(3, 0), true);
  assertEquals(isValidSpotifyKey(12, 0), false);
  assertEquals(isValidSpotifyKey(0, 3), false);
});

Deno.test("Compatible keys from Spotify key", () => {
  const compat = getCompatibleKeys(9, 0); // A minor = 8A
  assertEquals(compat.includes("8A" as CamelotKey), true);
  assertEquals(compat.length, 4);
});

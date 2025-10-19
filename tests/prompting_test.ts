/**
 * Prompting Workflow Tests
 *
 * Tests the user prompting functionality including:
 * - Prompt generation
 * - Intent parsing
 * - Field extraction
 * - Validation
 */

import { assert, assertEquals, assertThrows } from "jsr:@std/assert";
import { createDeriveIntentPrompt } from "../src/prompts/crate_prompting.ts";
import {
  parseDerivedIntent,
  validateBPMRange,
  validateDuration,
} from "../src/llm/parsers.ts";
import { CamelotKey } from "../src/core/track.ts";

/**
 * Test Suite: Prompt Generation
 */
Deno.test("Prompting - Prompt Generation", async (t) => {
  await t.step("createDeriveIntentPrompt generates valid prompt", () => {
    const cratePrompt = {
      tempoRange: { min: 120, max: 124 },
      targetGenre: "Tech House",
      targetDuration: 3600,
      notes: "Rooftop sunset party, smooth vibes, building energy",
    };

    const seedInfo = "- Artist - Track (120 BPM, 8A, Energy: 3)";
    const prompt = createDeriveIntentPrompt(cratePrompt, seedInfo);

    assert(prompt.includes("You are an expert DJ assistant"));
    assert(prompt.includes("Rooftop sunset party"));
    assert(prompt.includes("120-124 BPM"));
    assert(prompt.includes("Tech House"));
    assert(prompt.includes("Return ONLY a JSON object"));
    assert(prompt.includes("tempoRange"));
    console.log("  Prompt structure validated");
  });
});

/**
 * Test Suite: Intent Parsing
 */
Deno.test("Prompting - Parse Complete Intent", async (t) => {
  await t.step("Parse complete valid response", () => {
    const llmResponse = `
        {
            "tempoRange": { "min": 120, "max": 124 },
            "allowedKeys": ["8A", "7A", "9A", "8B"],
            "targetGenres": ["Tech House", "Deep House"],
            "duration": 3600,
            "mixStyle": "smooth",
            "mustIncludeArtists": [],
            "avoidArtists": [],
            "mustIncludeTracks": [],
            "avoidTracks": [],
            "energyCurve": "linear",
            "targetEnergy": 0.6,
            "minPopularity": 40,
            "targetKeyCamelot": "8A"
        }
        `;

    const intent = parseDerivedIntent(llmResponse);

    assertEquals(intent.tempoRange, { min: 120, max: 124 });
    assertEquals(intent.duration, 3600);
    assertEquals(intent.mixStyle, "smooth");
    assertEquals(intent.energyCurve, "linear");
    assertEquals(intent.allowedKeys.length, 4);
    assertEquals(intent.targetGenres.length, 2);
    console.log("  Complete intent parsed successfully");
  });

  await t.step("Capture optional Spotify fields", () => {
    const llmResponse = `
        {
            "tempoRange": { "min": 120, "max": 130 },
            "allowedKeys": [],
            "targetGenres": ["Techno"],
            "duration": 7200,
            "mixStyle": "energetic",
            "mustIncludeArtists": [],
            "avoidArtists": [],
            "mustIncludeTracks": [],
            "avoidTracks": [],
            "energyCurve": "peak",
            "targetEnergy": 0.8,
            "minPopularity": 30,
            "targetKeyCamelot": "10A"
        }
        `;

    const intent = parseDerivedIntent(llmResponse);

    assertEquals(intent.targetEnergy, 0.8);
    assertEquals(intent.minPopularity, 30);
    assertEquals(intent.targetKeyCamelot, "10A");
    console.log("  Spotify fields captured correctly");
  });

  await t.step("Handle missing optional fields", () => {
    const llmResponse = `
        {
            "tempoRange": { "min": 100, "max": 140 },
            "allowedKeys": [],
            "targetGenres": ["House"],
            "duration": 3600,
            "mixStyle": "smooth",
            "mustIncludeArtists": [],
            "avoidArtists": [],
            "mustIncludeTracks": [],
            "avoidTracks": [],
            "energyCurve": "linear"
        }
        `;

    const intent = parseDerivedIntent(llmResponse);

    assertEquals(intent.targetEnergy, undefined);
    assertEquals(intent.minPopularity, undefined);
    assertEquals(intent.targetKeyCamelot, undefined);
    console.log("  Optional fields handled correctly");
  });

  await t.step("Apply defaults for missing fields", () => {
    const llmResponse = `
        {
            "tempoRange": { "min": 120, "max": 124 },
            "duration": 3600,
            "targetGenres": ["Tech House"]
        }
        `;

    const intent = parseDerivedIntent(llmResponse);

    assertEquals(intent.mixStyle, "smooth");
    assertEquals(intent.energyCurve, "linear");
    assert(Array.isArray(intent.allowedKeys));
    assert(Array.isArray(intent.mustIncludeArtists));
    console.log("  Defaults applied correctly");
  });

  await t.step("Handle LLM response with extra text", () => {
    const llmResponse = `
        Here's the derived intent based on your prompt:
        
        {
            "tempoRange": { "min": 120, "max": 124 },
            "allowedKeys": ["8A"],
            "targetGenres": ["Tech House"],
            "duration": 3600,
            "mixStyle": "smooth",
            "mustIncludeArtists": [],
            "avoidArtists": [],
            "mustIncludeTracks": [],
            "avoidTracks": [],
            "energyCurve": "linear"
        }
        
        This should work well for your event!
        `;

    const intent = parseDerivedIntent(llmResponse);

    assertEquals(intent.tempoRange, { min: 120, max: 124 });
    console.log("  JSON extracted despite extra text");
  });
});

/**
 * Test Suite: Validation
 */
Deno.test("Prompting - Validation", async (t) => {
  await t.step("Validate correct BPM range", () => {
    const range = validateBPMRange({ min: 120, max: 124 });
    assertEquals(range, { min: 120, max: 124 });
    console.log("  Valid BPM range accepted");
  });

  await t.step("Reject invalid BPM range (min > max)", () => {
    assertThrows(
      () => validateBPMRange({ min: 130, max: 120 }),
      Error,
      "min <= max",
    );
    console.log("  Invalid BPM range rejected");
  });

  await t.step("Reject negative BPM values", () => {
    assertThrows(
      () => validateBPMRange({ min: -10, max: 120 }),
      Error,
      "positive",
    );
    console.log("  Negative BPM values rejected");
  });

  await t.step("Validate correct duration", () => {
    const duration = validateDuration(3600);
    assertEquals(duration, 3600);
    console.log("  Valid duration accepted");
  });

  await t.step("Reject negative duration", () => {
    assertThrows(
      () => validateDuration(-100),
      Error,
      "positive",
    );
    console.log("  Negative duration rejected");
  });
});

/**
 * Test Suite: Error Handling
 */
Deno.test("Prompting - Error Handling", async (t) => {
  await t.step("Throw on invalid JSON", () => {
    const invalidResponse = "This is not JSON at all";

    assertThrows(
      () => parseDerivedIntent(invalidResponse),
      Error,
      "Failed to parse",
    );
    console.log("  Invalid JSON throws error");
  });

  await t.step("Throw on missing required fields", () => {
    const incompleteResponse = `
        {
            "tempoRange": { "min": 120, "max": 124 }
        }
        `;

    assertThrows(
      () => parseDerivedIntent(incompleteResponse),
      Error,
      "duration",
    );
    console.log("  Missing required fields throws error");
  });
});

/**
 * Test Suite: Prompt Guidelines
 */
Deno.test("Prompting - Prompt Includes Guidelines", async (t) => {
  await t.step("Include all field guidelines", () => {
    const cratePrompt = {
      notes: "Test event",
    };

    const prompt = createDeriveIntentPrompt(cratePrompt, "No seeds");

    assert(prompt.includes("tempoRange"));
    assert(prompt.includes("allowedKeys"));
    assert(prompt.includes("targetGenres"));
    assert(prompt.includes("mixStyle"));
    assert(prompt.includes("energyCurve"));
    assert(prompt.includes("targetEnergy"));
    assert(prompt.includes("minPopularity"));
    assert(prompt.includes("Guidelines"));
    console.log("  All field guidelines present");
  });
});

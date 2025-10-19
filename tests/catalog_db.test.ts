/**
 * MusicAssetCatalog MongoDB Tests
 *
 * Comprehensive tests for the MongoDB-backed catalog functionality including:
 * - Track management (add, remove, update, get)
 * - Search and filtering
 * - Statistics and analytics
 * - Import/export functionality
 * - Key compatibility queries
 */

// Load environment variables from .env file
import "@std/dotenv/load";

import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import { MusicAssetCatalogDB } from "../src/core/catalog_db.ts";
import { CamelotKey, Track } from "../src/core/track.ts";
import { testDb } from "../src/utils/database.ts";

// --- Test Setup ---
let db: import("mongodb").Db;
let client: import("mongodb").MongoClient;
let catalog: MusicAssetCatalogDB;

async function setup() {
  if (!Deno.env.get("MONGODB_URL") || !Deno.env.get("DB_NAME")) {
    console.log("⏭️  Skipping DB test: MONGODB_URL/DB_NAME not set");
    return false;
  }
  try {
    const conn = await testDb();
    db = conn[0];
    client = conn[1];
    catalog = new MusicAssetCatalogDB(db);
    return true;
  } catch (e) {
    console.log("⏭️  Skipping DB test: " + (e as Error).message);
    return false;
  }
}

const canRun = await setup();

/**
 * Helper function to create a sample track
 */
function createSampleTrack(id: string, overrides?: Partial<Track>): Track {
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
 * Test Suite: Basic Track Management
 */
Deno.test({
  name: "Catalog DB - Basic Track Management",
  ignore: !canRun,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step("Add track to catalog", async () => {
      const track1 = createSampleTrack("track-001");
      const addedTrack = await catalog.addTrack(track1);

      assertExists(addedTrack.registeredAt);
      assertExists(addedTrack.updatedAt);
      console.log(`  Added track: ${addedTrack.artist} - ${addedTrack.title}`);
    });

    await t.step("Get track by ID", async () => {
      const retrievedTrack = await catalog.getTrack("track-001");
      assertExists(retrievedTrack);
      assertEquals(retrievedTrack?.id, "track-001");
      console.log(
        `  Retrieved: ${retrievedTrack?.artist} - ${retrievedTrack?.title}`,
      );
    });

    await t.step("Check if track exists", async () => {
      assert(await catalog.hasTrack("track-001"));
      assert(!(await catalog.hasTrack("non-existent")));
      console.log("  Track existence check passed");
    });

    await t.step("Get track count", async () => {
      const count = await catalog.getTrackCount();
      assertEquals(count, 1);
      console.log(`  Track count: ${count}`);
    });

    await t.step("Update track metadata", async () => {
      const updatedTrack = await catalog.updateTrack("track-001", {
        title: "Updated Title",
        bpm: 130,
      });

      assertExists(updatedTrack);
      assertEquals(updatedTrack?.title, "Updated Title");
      assertEquals(updatedTrack?.bpm, 130);
      console.log(
        `  Updated track: ${updatedTrack?.title} @ ${updatedTrack?.bpm} BPM`,
      );
    });

    await t.step("Remove track from catalog", async () => {
      const removed = await catalog.removeTrack("track-001");
      assert(removed);
      assert(!(await catalog.hasTrack("track-001")));
      console.log("  Track removed successfully");
    });

    await t.step("Get non-existent track returns null", async () => {
      const nonExistent = await catalog.getTrack("does-not-exist");
      assertEquals(nonExistent, null);
      console.log("  Non-existent track handling correct");
    });
  },
});

/**
 * Test Suite: Search and Filtering
 */
Deno.test({
  name: "Catalog DB - Search and Filtering",
  ignore: !canRun,
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    // Add diverse test tracks
    await catalog.addTrack(createSampleTrack("track-001", {
      artist: "Artist A",
      genre: "Tech House",
      bpm: 120,
      key: "8A" as CamelotKey,
      energy: 2,
    }));

    await catalog.addTrack(createSampleTrack("track-002", {
      artist: "Artist A",
      genre: "Tech House",
      bpm: 122,
      key: "8A" as CamelotKey,
      energy: 3,
    }));

    await catalog.addTrack(createSampleTrack("track-003", {
      artist: "Artist B",
      genre: "Deep House",
      bpm: 125,
      key: "9A" as CamelotKey,
      energy: 3,
    }));

    await catalog.addTrack(createSampleTrack("track-004", {
      artist: "Artist C",
      genre: "Tech House",
      bpm: 128,
      key: "10A" as CamelotKey,
      energy: 4,
    }));

    await catalog.addTrack(createSampleTrack("track-005", {
      artist: "Artist B",
      genre: "Deep House",
      bpm: 130,
      key: "9B" as CamelotKey,
      energy: 5,
    }));

    await t.step("Get all tracks", async () => {
      const allTracks = await catalog.getAllTracks();
      assertEquals(allTracks.length, 5);
      console.log(`  Found ${allTracks.length} tracks`);
    });

    await t.step("Filter by genre", async () => {
      const techHouseTracks = await catalog.searchTracks({
        genre: "Tech House",
      });
      assertEquals(techHouseTracks.length, 3);
      console.log(`  Found ${techHouseTracks.length} Tech House tracks`);
    });

    await t.step("Filter by BPM range", async () => {
      const bpmFiltered = await catalog.searchTracks({
        bpmRange: { min: 120, max: 125 },
      });
      assertEquals(bpmFiltered.length, 3);
      console.log(`  Found ${bpmFiltered.length} tracks in 120-125 BPM range`);
    });

    await t.step("Filter by single key", async () => {
      const keyFiltered = await catalog.searchTracks({
        key: "8A" as CamelotKey,
      });
      assertEquals(keyFiltered.length, 2);
      console.log(`  Found ${keyFiltered.length} tracks in key 8A`);
    });

    await t.step("Filter by multiple keys", async () => {
      const multiKeyFiltered = await catalog.searchTracks({
        keys: ["8A" as CamelotKey, "9A" as CamelotKey],
      });
      assertEquals(multiKeyFiltered.length, 3);
      console.log(`  Found ${multiKeyFiltered.length} tracks in keys 8A or 9A`);
    });

    await t.step("Filter by artist", async () => {
      const artistFiltered = await catalog.searchTracks({ artist: "Artist A" });
      assertEquals(artistFiltered.length, 2);
      console.log(`  Found ${artistFiltered.length} tracks by Artist A`);
    });

    await t.step("Filter by energy range", async () => {
      const energyFiltered = await catalog.searchTracks({
        energyRange: { min: 3, max: 4 },
      });
      assertEquals(energyFiltered.length, 3);
      console.log(`  Found ${energyFiltered.length} tracks with energy 3-4`);
    });

    await t.step("Exclude artists", async () => {
      const excludeFiltered = await catalog.searchTracks({
        excludeArtists: ["Artist B"],
      });
      assertEquals(excludeFiltered.length, 3);
      console.log(
        `  Found ${excludeFiltered.length} tracks excluding Artist B`,
      );
    });

    await t.step("Combined filters (genre + BPM + energy)", async () => {
      const combinedFiltered = await catalog.searchTracks({
        genre: "Tech House",
        bpmRange: { min: 120, max: 125 },
        energyRange: { min: 2, max: 3 },
      });
      assertEquals(combinedFiltered.length, 2);
      console.log(
        `  Found ${combinedFiltered.length} tracks matching all criteria`,
      );
    });

    await t.step("Filter by specific IDs", async () => {
      const idFiltered = await catalog.searchTracks({
        ids: ["track-001", "track-003", "track-005"],
      });
      assertEquals(idFiltered.length, 3);
      console.log(`  Found ${idFiltered.length} tracks by ID`);
    });

    await t.step("Cleanup test data", async () => {
      await catalog.clear();
      console.log("  Test data cleaned up");
    });
  },
});

/**
 * Test Suite: Key Compatibility
 */
Deno.test({
  name: "Catalog DB - Key Compatibility",
  ignore: !canRun,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Add tracks with various keys
    await catalog.addTrack(
      createSampleTrack("track-8a-1", { key: "8A" as CamelotKey }),
    );
    await catalog.addTrack(
      createSampleTrack("track-8a-2", { key: "8A" as CamelotKey }),
    );
    await catalog.addTrack(
      createSampleTrack("track-8b", { key: "8B" as CamelotKey }),
    );
    await catalog.addTrack(
      createSampleTrack("track-9a", { key: "9A" as CamelotKey }),
    );
    await catalog.addTrack(
      createSampleTrack("track-7a", { key: "7A" as CamelotKey }),
    );
    await catalog.addTrack(
      createSampleTrack("track-10a", { key: "10A" as CamelotKey }),
    );

    await t.step("Get compatible keys", async () => {
      const compatibleKeys = catalog.getCompatibleKeys("8A" as CamelotKey);
      // Should include: 8A (same), 8B (relative), 9A (next), 7A (prev)
      assertEquals(compatibleKeys.length, 4);
      console.log(`  Compatible keys: ${compatibleKeys.join(", ")}`);
    });

    await t.step("Get tracks with compatible keys", async () => {
      const compatibleTracks = await catalog.getTracksWithCompatibleKeys(
        "8A" as CamelotKey,
      );
      assertEquals(compatibleTracks.length, 5);
      console.log(
        `  Found ${compatibleTracks.length} harmonically compatible tracks`,
      );
    });

    await t.step("Get tracks by specific key", async () => {
      const tracks8A = await catalog.getTracksByKey("8A" as CamelotKey);
      assertEquals(tracks8A.length, 2);
      console.log(`  Found ${tracks8A.length} tracks in key 8A`);
    });

    await t.step("Cleanup test data", async () => {
      await catalog.clear();
      console.log("  Test data cleaned up");
    });
  },
});

/**
 * Test Suite: Statistics and Analytics
 */
Deno.test({
  name: "Catalog DB - Statistics",
  ignore: !canRun,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Add diverse tracks
    await catalog.addTrack(createSampleTrack("track-001", {
      genre: "Tech House",
      bpm: 120,
      key: "8A" as CamelotKey,
      duration_sec: 300,
    }));

    await catalog.addTrack(createSampleTrack("track-002", {
      genre: "Tech House",
      bpm: 125,
      key: "8A" as CamelotKey,
      duration_sec: 360,
    }));

    await catalog.addTrack(createSampleTrack("track-003", {
      genre: "Deep House",
      bpm: 122,
      key: "9A" as CamelotKey,
      duration_sec: 400,
    }));

    await catalog.addTrack(createSampleTrack("track-004", {
      genre: "Tech House",
      bpm: 128,
      key: "8A" as CamelotKey,
      duration_sec: 340,
    }));

    await t.step("Get catalog statistics", async () => {
      const stats = await catalog.getStatistics();

      assertEquals(stats.totalTracks, 4);
      console.log(`  Total tracks: ${stats.totalTracks}`);
    });

    await t.step("Genre distribution", async () => {
      const stats = await catalog.getStatistics();
      assertEquals(stats.genres.get("Tech House"), 3);
      assertEquals(stats.genres.get("Deep House"), 1);
      console.log(`  Tech House: ${stats.genres.get("Tech House")}`);
      console.log(`  Deep House: ${stats.genres.get("Deep House")}`);
    });

    await t.step("BPM range", async () => {
      const stats = await catalog.getStatistics();
      assertEquals(stats.bpmRange.min, 120);
      assertEquals(stats.bpmRange.max, 128);
      console.log(`  BPM range: ${stats.bpmRange.min}-${stats.bpmRange.max}`);
    });

    await t.step("Average BPM", async () => {
      const stats = await catalog.getStatistics();
      const expectedAvg = (120 + 125 + 122 + 128) / 4;
      assert(Math.abs(stats.averageBPM - expectedAvg) < 0.5);
      console.log(`  Average BPM: ${stats.averageBPM}`);
    });

    await t.step("Key distribution", async () => {
      const stats = await catalog.getStatistics();
      assertEquals(stats.keyDistribution.get("8A" as CamelotKey), 3);
      console.log(
        `  Key 8A: ${stats.keyDistribution.get("8A" as CamelotKey)} tracks`,
      );
    });

    await t.step("Empty catalog statistics", async () => {
      const emptyCatalog = new MusicAssetCatalogDB(db);
      await emptyCatalog.clear();
      const emptyStats = await emptyCatalog.getStatistics();
      assertEquals(emptyStats.totalTracks, 0);
      console.log("  Empty catalog handled correctly");
    });

    await t.step("Cleanup test data", async () => {
      await catalog.clear();
      console.log("  Test data cleaned up");
    });
  },
});

/**
 * Test Suite: Bulk Operations
 */
Deno.test({
  name: "Catalog DB - Bulk Operations",
  ignore: !canRun,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await t.step("Import multiple tracks", async () => {
      const tracksToImport: Track[] = [
        createSampleTrack("bulk-001"),
        createSampleTrack("bulk-002"),
        createSampleTrack("bulk-003"),
      ];
      const importCount = await catalog.importTracks(tracksToImport);
      assertEquals(importCount, 3);
      assertEquals(await catalog.getTrackCount(), 3);
      console.log(`  Imported ${importCount} tracks`);
    });

    await t.step("Get multiple tracks by IDs", async () => {
      const multipleTracks = await catalog.getTracks(["bulk-001", "bulk-003"]);
      assertEquals(multipleTracks.length, 2);
      console.log(`  Retrieved ${multipleTracks.length} tracks`);
    });

    await t.step("Clear catalog", async () => {
      await catalog.clear();
      assertEquals(await catalog.getTrackCount(), 0);
      console.log("  Catalog cleared successfully");
    });
  },
});

/**
 * Test Suite: Import/Export JSON
 */
Deno.test({
  name: "Catalog DB - Import/Export JSON",
  ignore: !canRun,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Create a fresh catalog instance for this test
    const testCatalog = new MusicAssetCatalogDB(db);

    // Add some tracks
    await testCatalog.addTrack(
      createSampleTrack("json-001", { title: "Track 1" }),
    );
    await testCatalog.addTrack(
      createSampleTrack("json-002", { title: "Track 2" }),
    );

    // Store JSON export in a variable that persists across steps
    let jsonExport: string;

    await t.step("Export to JSON", async () => {
      jsonExport = await testCatalog.exportToJSON();
      const parsed = JSON.parse(jsonExport);
      assert(Array.isArray(parsed));
      assertEquals(parsed.length, 2);
      console.log(`  Exported ${parsed.length} tracks to JSON`);
    });

    await t.step("Import from JSON", async () => {
      const newCatalog = new MusicAssetCatalogDB(db);
      await newCatalog.clear();

      const importCount = await newCatalog.importFromJSON(jsonExport);
      assertEquals(importCount, 2);
      assertEquals(await newCatalog.getTrackCount(), 2);
      console.log(`  Imported ${importCount} tracks from JSON`);
    });

    await t.step("Verify imported data", async () => {
      const newCatalog = new MusicAssetCatalogDB(db);
      const importedTrack = await newCatalog.getTrack("json-001");
      assertExists(importedTrack);
      assertEquals(importedTrack?.title, "Track 1");
      console.log("  Imported data verified successfully");
    });

    await t.step("Handle invalid JSON import", async () => {
      const newCatalog = new MusicAssetCatalogDB(db);
      try {
        await newCatalog.importFromJSON("invalid json");
        throw new Error("Should have thrown error");
      } catch (error) {
        assert((error as Error).message.includes("Failed to import"));
        console.log("  Invalid JSON handled correctly");
      }
    });

    await t.step("Cleanup test data", async () => {
      await testCatalog.clear();
      console.log("  Test data cleaned up");
    });
  },
});

/**
 * Test Suite: Helper Methods
 */
Deno.test({
  name: "Catalog DB - Helper Methods",
  ignore: !canRun,
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Add test data
    await catalog.addTrack(createSampleTrack("helper-001", {
      genre: "Tech House",
      artist: "Artist A",
      bpm: 125,
    }));
    await catalog.addTrack(createSampleTrack("helper-002", {
      genre: "Tech House",
      artist: "Artist B",
      bpm: 128,
    }));
    await catalog.addTrack(createSampleTrack("helper-003", {
      genre: "Deep House",
      artist: "Artist A",
      bpm: 120,
    }));

    await t.step("Get tracks by genre", async () => {
      const genreTracks = await catalog.getTracksByGenre("Tech House");
      assertEquals(genreTracks.length, 2);
      console.log(`  Found ${genreTracks.length} Tech House tracks`);
    });

    await t.step("Get tracks by artist", async () => {
      const artistTracks = await catalog.getTracksByArtist("Artist A");
      assertEquals(artistTracks.length, 2);
      console.log(`  Found ${artistTracks.length} tracks by Artist A`);
    });

    await t.step("Get tracks by BPM range", async () => {
      const bpmTracks = await catalog.getTracksByBPMRange(120, 126);
      assertEquals(bpmTracks.length, 2);
      console.log(`  Found ${bpmTracks.length} tracks in 120-126 BPM`);
    });

    await t.step("Cleanup test data", async () => {
      await catalog.clear();
      console.log("  Test data cleaned up");
    });
  },
});

// --- Teardown ---
Deno.test({
  name: "Close DB connection",
  ignore: !canRun,
  async fn() {
    await client.close();
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

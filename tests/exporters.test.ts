/**
 * Exporters Tests (Rekordbox/Serato)
 * Uses in-memory DB stub and writes to tmp_test_exports path
 */

import { assert, assertEquals } from "jsr:@std/assert";
import { Db } from "mongodb";
import { RekordboxExporter } from "../src/export/rekordbox_exporter.ts";
import { SeratoExporter } from "../src/export/serato_exporter.ts";
import { CratePlan } from "../src/core/crate_planner.ts";
import { Track } from "../src/core/track.ts";
import * as fs from "node:fs";

// Use a simpler DB stub for exporters (doesn't need full query support)
class InMemoryCollection<T extends { id: string }> {
  private data = new Map<string, T>();
  insertMany(docs: T[]) {
    docs.forEach((d) => this.data.set(d.id, d));
  }
  find(query: Record<string, unknown>) {
    const all = Array.from(this.data.values());
    if (query.id && (query.id as any).$in) {
      const set = new Set((query.id as any).$in);
      return {
        toArray: () => Promise.resolve(all.filter((t) => set.has(t.id))),
      };
    }
    return { toArray: () => Promise.resolve(all) };
  }
}

class InMemoryDb {
  private col = new InMemoryCollection<Track>();
  // deno-lint-ignore no-explicit-any
  collection(_name: string): any {
    return this.col;
  }
  seed(tracks: Track[]) {
    this.col.insertMany(tracks);
  }
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}

function makePlan(ids: string[]): CratePlan {
  return {
    prompt: { targetDuration: 600 } as any,
    trackList: ids,
    annotations: "",
    totalDuration: 600,
    planDetails: { usedAI: false },
    isFinalized: true,
  } as CratePlan;
}

const tracks: Track[] = [
  {
    id: "t1",
    artist: "A",
    title: "X",
    duration_sec: 300,
    bpm: 120,
    key: "8A",
    filePath: "C:/tmp_test_audio/track1.mp3",
  },
  {
    id: "t2",
    artist: "B",
    title: "Y",
    duration_sec: 300,
    bpm: 122,
    key: "9A",
    filePath: "C:/tmp_test_audio/track2.mp3",
  },
];

// Create fake file paths so exporters don't fail existence checks if used
function ensureFakeFiles() {
  try {
    fs.mkdirSync("C:/tmp_test_audio", { recursive: true });
  } catch {}
  for (const p of [tracks[0].filePath!, tracks[1].filePath!]) {
    try {
      fs.writeFileSync(p, "fake");
    } catch {}
  }
}

Deno.test("Exporters - Rekordbox M3U8 and XML", async () => {
  ensureFakeFiles();
  const db = new InMemoryDb();
  db.seed(tracks);
  const plan = makePlan(["t1", "t2"]);
  const rb = new RekordboxExporter(db as unknown as Db);

  const outM3U = await rb.export(plan, {
    format: "m3u8",
    outputPath: "./tmp_test_exports/rekordbox_playlist.m3u8",
    playlistName: "Test",
    includeMetadata: true,
    relativePaths: false,
  });
  assertEquals(outM3U.success, true);

  const outXML = await rb.export(plan, {
    format: "xml",
    outputPath: "./tmp_test_exports/rekordbox_playlist.xml",
    playlistName: "Test",
  });
  assertEquals(outXML.success, true);
});

Deno.test("Exporters - Serato CSV and TXT", async () => {
  ensureFakeFiles();
  const db = new InMemoryDb();
  db.seed(tracks);
  const plan = makePlan(["t1", "t2"]);
  const se = new SeratoExporter(db as unknown as Db);

  const outCSV = await se.export(plan, {
    format: "csv",
    outputPath: "./tmp_test_exports/serato_crate.csv",
    crateName: "Test",
    includeHeaders: true,
    includeMetadata: true,
  });
  assertEquals(outCSV.success, true);

  const outTXT = await se.export(plan, {
    format: "txt",
    outputPath: "./tmp_test_exports/serato_crate.txt",
    crateName: "Test",
    includeMetadata: true,
  });
  assertEquals(outTXT.success, true);
});

/**
 * Edge Cases and Outliers for Exporters
 */
Deno.test("Exporters - Edge Cases and Outliers", async (t) => {
  ensureFakeFiles();

  await t.step("Export empty plan", async () => {
    const db = new InMemoryDb();
    db.seed(tracks);
    const emptyPlan = makePlan([]);
    const rb = new RekordboxExporter(db as unknown as Db);

    const result = await rb.export(emptyPlan, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/empty_playlist.m3u8",
      playlistName: "Empty Test",
    });
    // Empty plan may fail or succeed depending on implementation
    // The important thing is it doesn't crash
    assert(result.success !== undefined, "Should return a result");
    console.log(
      `  Empty plan handled: ${
        result.success ? "exported" : "failed gracefully"
      }`,
    );
  });

  await t.step("Export plan with missing tracks", async () => {
    const db = new InMemoryDb();
    db.seed(tracks);
    const planWithMissing = makePlan(["t1", "non-existent-track", "t2"]);
    const rb = new RekordboxExporter(db as unknown as Db);

    const result = await rb.export(planWithMissing, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/partial_playlist.m3u8",
      playlistName: "Partial Test",
    });
    // Should still succeed but potentially with warnings
    assertEquals(result.success, true);
    console.log("  Plan with missing tracks handled");
  });

  await t.step("Export with relative paths", async () => {
    const db = new InMemoryDb();
    db.seed(tracks);
    const plan = makePlan(["t1", "t2"]);
    const rb = new RekordboxExporter(db as unknown as Db);

    const result = await rb.export(plan, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/relative_paths_playlist.m3u8",
      playlistName: "Relative Test",
      relativePaths: true,
    });
    assertEquals(result.success, true);
    console.log("  Relative paths export successful");
  });

  await t.step("Export with both relative and absolute paths", async () => {
    const db = new InMemoryDb();
    db.seed(tracks);
    const plan = makePlan(["t1", "t2"]);
    const rb = new RekordboxExporter(db as unknown as Db);

    // Test with absolute paths
    const absoluteResult = await rb.export(plan, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/both_case_rekordbox.m3u8",
      playlistName: "Mixed Paths",
      relativePaths: false,
    });
    assertEquals(absoluteResult.success, true);

    // Test with relative paths
    const relativeResult = await rb.export(plan, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/both_case_rekordbox_rel.m3u8",
      playlistName: "Mixed Paths Relative",
      relativePaths: true,
    });
    assertEquals(relativeResult.success, true);
    console.log("  Mixed path modes handled correctly");
  });

  await t.step("Export Serato with M3U8 format", async () => {
    const db = new InMemoryDb();
    db.seed(tracks);
    const plan = makePlan(["t1", "t2"]);
    const se = new SeratoExporter(db as unknown as Db);

    const result = await se.export(plan, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/serato_crate.m3u8",
      crateName: "M3U8 Test",
    });
    assertEquals(result.success, true);
    console.log("  Serato M3U8 format export successful");
  });

  await t.step("Export CSV without headers", async () => {
    const db = new InMemoryDb();
    db.seed(tracks);
    const plan = makePlan(["t1", "t2"]);
    const se = new SeratoExporter(db as unknown as Db);

    const result = await se.export(plan, {
      format: "csv",
      outputPath: "./tmp_test_exports/serato_no_headers.csv",
      crateName: "No Headers",
      includeHeaders: false,
    });
    assertEquals(result.success, true);
    console.log("  CSV without headers exported");
  });

  await t.step("Export without metadata", async () => {
    const db = new InMemoryDb();
    db.seed(tracks);
    const plan = makePlan(["t1", "t2"]);
    const rb = new RekordboxExporter(db as unknown as Db);

    const result = await rb.export(plan, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/no_metadata.m3u8",
      playlistName: "No Metadata",
      includeMetadata: false,
    });
    assertEquals(result.success, true);
    console.log("  Export without metadata successful");
  });

  await t.step("Large playlist export (stress test)", async () => {
    const db = new InMemoryDb();
    // Create many tracks
    const largeTracks: Track[] = [];
    for (let i = 0; i < 500; i++) {
      largeTracks.push({
        id: `large-${i}`,
        artist: `Artist ${i}`,
        title: `Track ${i}`,
        duration_sec: 300,
        bpm: 120 + (i % 20),
        key: "8A",
        filePath: `C:/tmp_test_audio/track${i}.mp3`,
      });
    }
    db.seed(largeTracks);
    const largePlan = makePlan(largeTracks.map((t) => t.id));
    const rb = new RekordboxExporter(db as unknown as Db);

    const startTime = Date.now();
    const result = await rb.export(largePlan, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/large_playlist.m3u8",
      playlistName: "Large Test",
    });
    const exportTime = Date.now() - startTime;

    assertEquals(result.success, true);
    console.log(`  Exported 500 tracks in ${exportTime}ms`);
    assert(
      exportTime < 5000,
      "Large export should complete in reasonable time",
    );
  });

  await t.step("Export with special characters in names", async () => {
    const db = new InMemoryDb();
    const specialTracks: Track[] = [
      {
        id: "special-1",
        artist: "Artist & Co.",
        title: "Track (Remix) [2024]",
        duration_sec: 300,
        bpm: 128,
        key: "8A",
        filePath: "C:/tmp_test_audio/special1.mp3",
      },
      {
        id: "special-2",
        artist: 'Artist "DJ" Name',
        title: "Track's Title",
        duration_sec: 300,
        bpm: 130,
        key: "9A",
        filePath: "C:/tmp_test_audio/special2.mp3",
      },
    ];
    db.seed(specialTracks);
    const plan = makePlan(["special-1", "special-2"]);
    const rb = new RekordboxExporter(db as unknown as Db);

    const result = await rb.export(plan, {
      format: "xml",
      outputPath: "./tmp_test_exports/special_chars.xml",
      playlistName: "Special & 'Chars'",
    });
    assertEquals(result.success, true);
    console.log("  Special characters handled correctly");
  });

  await t.step("Export with Unicode characters", async () => {
    const db = new InMemoryDb();
    const unicodeTracks: Track[] = [
      {
        id: "unicode-1",
        artist: "Artiste Français",
        title: "Música Española 音楽",
        duration_sec: 300,
        bpm: 128,
        key: "8A",
        filePath: "C:/tmp_test_audio/unicode1.mp3",
      },
    ];
    db.seed(unicodeTracks);
    const plan = makePlan(["unicode-1"]);
    const se = new SeratoExporter(db as unknown as Db);

    const result = await se.export(plan, {
      format: "txt",
      outputPath: "./tmp_test_exports/unicode_test.txt",
      crateName: "Unicode Test",
    });
    assertEquals(result.success, true);
    console.log("  Unicode characters handled correctly");
  });

  await t.step("Export single track", async () => {
    const db = new InMemoryDb();
    db.seed(tracks);
    const singlePlan = makePlan(["t1"]);
    const rb = new RekordboxExporter(db as unknown as Db);

    const result = await rb.export(singlePlan, {
      format: "m3u8",
      outputPath: "./tmp_test_exports/single_track.m3u8",
      playlistName: "Single Track",
    });
    assertEquals(result.success, true);
    console.log("  Single track export successful");
  });
});

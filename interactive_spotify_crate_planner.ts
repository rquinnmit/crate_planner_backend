/**
 * Interactive Spotify Crate Planner
 *
 * Full end-to-end testing with real Spotify data:
 * User prompt → LLM → Spotify track selection → Crate generation
 */

import { GeminiLLM } from "./src/llm/gemini-llm.ts";
import {
  CratePlan,
  CratePlanner,
  CratePrompt,
} from "./src/core/crate_planner.ts";
import { SpotifyImporter } from "./src/import/spotify_importer.ts";
import { SpotifySearchService } from "./src/llm/spotify_search_service.ts";
import { CamelotKey, Track } from "./src/core/track.ts";
import { loadLLMConfig, loadSpotifyConfig } from "./tests/test_helpers.ts";
import { getDb } from "./src/utils/database.ts";
import { Db, MongoClient } from "mongodb";
import * as readline from "node:readline";
import process from "node:process";

/**
 * Load configuration from environment variables
 */
function loadConfig() {
  try {
    const llmConfig = loadLLMConfig();
    return {
      apiKey: llmConfig.apiKey,
      model: "gemini-2.5-flash-lite",
      temperature: 0.7,
    };
  } catch (_error) {
    console.error("❌ Error loading LLM configuration");
    console.error("   Please set GEMINI_API_KEY environment variable");
    process.exit(1);
  }
}

/**
 * Check if Spotify credentials are available
 */
function checkSpotifyCredentials(): {
  clientId?: string;
  clientSecret?: string;
} {
  try {
    const spotifyConfig = loadSpotifyConfig();
    return {
      clientId: spotifyConfig.clientId,
      clientSecret: spotifyConfig.clientSecret,
    };
  } catch (_error) {
    return {};
  }
}

/**
 * Initialize database and Spotify services
 */
async function initializeServices(): Promise<{
  db: Db;
  client: MongoClient | null;
  spotifyImporter?: SpotifyImporter;
}> {
  // Try to initialize MongoDB connection
  console.log("💾 Connecting to MongoDB...");
  let db: Db;
  let client: MongoClient | null = null;

  try {
    const result = await getDb();
    db = result[0] as Db;
    client = result[1] as MongoClient;
    console.log("✅ MongoDB connected!\n");
  } catch (error) {
    console.log(`⚠️ MongoDB connection failed: ${(error as Error).message}`);
    console.log("   Using in-memory database for this session...\n");

    // Create an in-memory mock database
    const { InMemoryDb } = await import("./tests/test_helpers.ts");
    db = new InMemoryDb() as unknown as Db;
  }

  const credentials = checkSpotifyCredentials();

  if (!credentials.clientId || !credentials.clientSecret) {
    console.log(
      "⚠️ Spotify credentials not found. Using local database only.",
    );
    console.log(
      "   Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables to use real Spotify data.",
    );
    return { db, client };
  }

  console.log("🎵 Initializing Spotify services...");

  try {
    const spotifyImporter = new SpotifyImporter(db, {
      clientId: credentials.clientId!,
      clientSecret: credentials.clientSecret!,
      baseURL: "https://api.spotify.com/v1",
    });

    // Test Spotify connection with a more reliable query
    console.log("   Testing Spotify API connection...");
    const genreSeeds = await spotifyImporter.getAvailableGenreSeeds();
    if (genreSeeds.length === 0) {
      throw new Error(
        "Failed to fetch genre seeds - API authentication likely failed",
      );
    }
    console.log(
      `   ✅ Spotify API connected successfully (${genreSeeds.length} genre seeds available)`,
    );

    return {
      db,
      client,
      spotifyImporter,
    };
  } catch (error) {
    console.log(`❌ Spotify connection failed: ${(error as Error).message}`);
    console.log("   Falling back to local database only...\n");
    return { db, client };
  }
}

/**
 * Add sample tracks to database for testing
 */
async function addSampleTracks(db: Db): Promise<void> {
  const tracksCollection = db.collection<Track>("tracks");

  // Check if we already have tracks (only for real MongoDB)
  try {
    const existingCount = await tracksCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`📚 Database already has ${existingCount} tracks\n`);
      return;
    }
  } catch (_error) {
    // countDocuments not available (in-memory DB), proceed to add tracks
  }

  const sampleTracks: Track[] = [
    {
      id: "sunset-vibes-001",
      artist: "Sunset Collective",
      title: "Sunset Vibes",
      genre: "Tech House",
      duration_sec: 360,
      bpm: 120,
      key: "8A" as CamelotKey,
      energy: 2,
      album: "Sunset Sessions",
      year: 2023,
    },
    {
      id: "deep-groove-002",
      artist: "Deep Groove",
      title: "Deep Groove",
      genre: "Tech House",
      duration_sec: 330,
      bpm: 121,
      key: "8A" as CamelotKey,
      energy: 2,
      album: "Underground Sounds",
      year: 2023,
    },
    {
      id: "evening-flow-003",
      artist: "Flow Masters",
      title: "Evening Flow",
      genre: "Tech House",
      duration_sec: 345,
      bpm: 122,
      key: "9A" as CamelotKey,
      energy: 3,
      album: "Flow State",
      year: 2023,
    },
    {
      id: "peak-energy-004",
      artist: "Energy Boost",
      title: "Peak Energy",
      genre: "Progressive House",
      duration_sec: 380,
      bpm: 128,
      key: "10A" as CamelotKey,
      energy: 4,
      album: "Peak Hours",
      year: 2023,
    },
    {
      id: "chill-out-005",
      artist: "Chill Masters",
      title: "Chill Out",
      genre: "Deep House",
      duration_sec: 320,
      bpm: 118,
      key: "7A" as CamelotKey,
      energy: 1,
      album: "Chill Sessions",
      year: 2023,
    },
  ];

  await tracksCollection.insertMany(sampleTracks);
  console.log(`📚 Added ${sampleTracks.length} sample tracks to database\n`);
}

/**
 * Offer revision loop to user
 */
function offerRevision(
  currentPlan: CratePlan,
  planner: CratePlanner,
  llm: GeminiLLM,
  rl: readline.Interface,
): Promise<void> {
  return new Promise((resolve) => {
    console.log("\n" + "=".repeat(50));
    console.log("💬 Would you like to revise this crate? (yes/no)");

    rl.question("You: ", (response) => {
      if (response.toLowerCase() !== "yes") {
        resolve();
        return;
      }

      console.log("\n🔧 What would you like to change?");
      console.log("Examples:");
      console.log('  - "Avoid tracks by [Artist Name]"');
      console.log('  - "Raise energy earlier in the set"');
      console.log('  - "Add more tracks from [Genre]"');
      console.log('  - "Replace slow tracks with faster ones"');
      console.log('  - "Lower the BPM range"');

      rl.question("Revision: ", async (instructions) => {
        try {
          if (instructions.trim().length < 5) {
            console.log(
              "⚠️ Please provide more specific instructions (at least 5 characters).",
            );
            resolve();
            return;
          }

          console.log("\n🤖 Processing revision...");
          const revisedPlan = await planner.revisePlanLLM(
            currentPlan,
            instructions,
            llm,
          );

          console.log(`\n✅ Revision complete!`);
          console.log(`📝 Changes: ${revisedPlan.annotations}\n`);

          console.log("📋 Revised Crate:");
          console.log("=================");
          await planner.displayCrate();

          // Validate revised plan
          console.log("\n✅ Validating revised crate...");
          const validation = await planner.validate(revisedPlan, 300);
          if (validation.isValid) {
            console.log("✅ Validation passed!");
          } else {
            console.log("⚠️ Validation issues:");
            validation.errors.forEach((err) => console.log(`   - ${err}`));
          }

          // Recursive revision loop
          await offerRevision(revisedPlan, planner, llm, rl);
          resolve();
        } catch (error) {
          console.log(`\n❌ Revision error: ${(error as Error).message}`);
          resolve();
        }
      });
    });
  });
}

/**
 * Display available tracks in the database
 */
async function displayCatalog(db: Db): Promise<void> {
  const tracksCollection = db.collection<Track>("tracks");
  const tracks = await tracksCollection.find({}).limit(100).toArray();

  console.log("\n📚 Available Tracks in Database:");
  console.log("================================");

  if (tracks.length === 0) {
    console.log("No tracks available. Try importing from Spotify first.");
    return;
  }

  tracks.forEach((track, index) => {
    console.log(`${index + 1}. ${track.artist} - ${track.title}`);
    console.log(
      `   ${track.bpm} BPM | ${track.key} | ${
        Math.floor(track.duration_sec / 60)
      }:${(track.duration_sec % 60).toString().padStart(2, "0")} | Energy: ${
        track.energy || "N/A"
      }`,
    );
  });

  // Only show count for real MongoDB (has countDocuments)
  try {
    const totalCount = await tracksCollection.countDocuments();
    if (totalCount > 100) {
      console.log(`\n... and ${totalCount - 100} more tracks`);
    }
  } catch (_error) {
    // countDocuments not available (in-memory DB), skip
  }
  console.log("");
}

/**
 * Parse user input to extract crate planning parameters
 */
function parseUserInput(input: string): CratePrompt | null {
  // Validate minimum input length
  if (input.trim().length < 10) {
    console.log(
      "⚠️ Prompt is too short. Please provide more details about your event.",
    );
    return null;
  }

  const _lowerInput = input.toLowerCase();

  // Extract BPM range
  const bpmMatch = input.match(/(\d+)-(\d+)\s*bpm/i);
  const tempoRange = bpmMatch
    ? { min: parseInt(bpmMatch[1]), max: parseInt(bpmMatch[2]) }
    : undefined;

  // Extract duration
  const durationMatch = input.match(/(\d+)\s*min/i);
  const targetDuration = durationMatch
    ? parseInt(durationMatch[1]) * 60
    : undefined;

  // Extract genre (expanded list for Spotify)
  const genreMatch = input.match(
    /(tech house|deep house|progressive house|house|techno|trance|drum and bass|dubstep|ambient|downtempo|trap|rap|hip hop|r&b|pop|indie|rock)/i,
  );
  const targetGenre = genreMatch ? genreMatch[1] : undefined;

  // Note: Seed tracks will be determined by Spotify search, not from local catalog
  // The LLM will find matching tracks based on the intent

  return {
    tempoRange,
    targetGenre,
    targetDuration,
    notes: input,
  };
}

/**
 * Main interactive crate planning function
 */
async function startInteractiveSpotifyCratePlanner(): Promise<void> {
  console.log("🎧 Interactive Spotify Crate Planner");
  console.log("====================================\n");

  const config = loadConfig();
  const llm = new GeminiLLM(config);

  // Test LLM connection
  console.log("🔌 Testing LLM connection...");
  try {
    const connected = await llm.testConnection();
    if (!connected) {
      console.log("❌ LLM connection failed");
      return;
    }
    console.log("✅ LLM connected!\n");
  } catch (error) {
    console.log("❌ LLM connection error:", (error as Error).message);
    return;
  }

  // Initialize database and Spotify services
  const { db, client, spotifyImporter } = await initializeServices();

  // If no Spotify available, add sample tracks
  if (!spotifyImporter) {
    await addSampleTracks(db);
  }

  // Create CratePlanner with database
  const planner = new CratePlanner(db);

  // Set up Spotify search service if available
  if (spotifyImporter) {
    const spotifySearchService = new SpotifySearchService(
      spotifyImporter,
      llm,
      db,
    );
    planner.setSpotifySearchService(spotifySearchService);
    console.log(
      "✅ Spotify search service enabled - LLM will search Spotify directly\n",
    );
  } else {
    console.log("ℹ️ Using local database only - no Spotify search available\n");
  }

  // Display available tracks
  await displayCatalog(db);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Cleanup handler for MongoDB connection
  const cleanup = async () => {
    if (client) {
      console.log("\n🔌 Closing database connection...");
      await client.close();
      console.log("✅ Database connection closed.");
    }
  };

  // Handle exit signals
  rl.on("close", async () => {
    await cleanup();
    Deno.exit(0);
  });

  // Handle interrupt signal (Ctrl+C)
  Deno.addSignalListener("SIGINT", () => {
    console.log("\n\n⚠️ Received interrupt signal...");
    rl.close();
  });

  console.log("💬 Enter your crate planning prompt below.");
  console.log("Examples:");
  console.log('- "Rooftop sunset party, tech house, 120-124 BPM, 60 minutes"');
  console.log('- "Late night club set, high energy, 2 hours"');
  console.log('- "Chill lounge music, deep house, 90 minutes"');
  console.log(
    '\nType "exit" to quit, "catalog" to see tracks, "help" for examples.',
  );
  if (planner.isSpotifySearchEnabled()) {
    console.log(
      "🎵 Spotify search enabled - LLM will find tracks from Spotify's catalog!\n",
    );
  } else {
    console.log(
      "📚 Using local catalog only - set Spotify credentials for real-time search.\n",
    );
  }

  const planCrate = () => {
    rl.question("You: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        console.log("\n👋 Goodbye!");
        rl.close();
        return;
      }

      if (input.toLowerCase() === "catalog") {
        await displayCatalog(db);
        planCrate();
        return;
      }

      if (input.toLowerCase() === "help") {
        console.log("\n📖 Help - Example Prompts:");
        console.log(
          '- "Rooftop sunset party, tech house, 120-124 BPM, 60 minutes"',
        );
        console.log('- "Late night club set, high energy, 2 hours"');
        console.log('- "Chill lounge music, deep house, 90 minutes"');
        console.log('- "Sunset vibes, smooth energy build, 90 minutes"');
        console.log('- "Peak hour club set, energetic, 2 hours"');
        console.log("");
        planCrate();
        return;
      }

      if (input.trim() === "") {
        planCrate();
        return;
      }

      try {
        console.log("\n🤖 Analyzing your prompt...");

        // Parse user input
        const prompt = parseUserInput(input);
        if (!prompt) {
          console.log(
            "❌ Could not parse your prompt. Try being more specific.",
          );
          planCrate();
          return;
        }

        console.log("📋 Parsed prompt:");
        console.log(`   Genre: ${prompt.targetGenre || "Any"}`);
        console.log(
          `   BPM: ${
            prompt.tempoRange
              ? `${prompt.tempoRange.min}-${prompt.tempoRange.max}`
              : "Any"
          }`,
        );
        console.log(
          `   Duration: ${
            prompt.targetDuration
              ? `${Math.floor(prompt.targetDuration / 60)} minutes`
              : "Not specified"
          }`,
        );

        // Use LLM to derive intent and generate crate
        console.log("\n🧠 Deriving intent with LLM...");
        // Use empty seed tracks initially - Spotify search will find matching tracks
        // If database has tracks, use the first few as seeds
        const tracksCollection = db.collection<Track>("tracks");
        const dbTracks = await tracksCollection.find({}).limit(3).toArray();
        const seedTracks = dbTracks.map((t) => t.id);
        const intent = await planner.deriveIntentLLM(prompt, seedTracks, llm);

        console.log("✅ Intent derived:");
        console.log(`   Mix Style: ${intent.mixStyle}`);
        console.log(`   Energy Curve: ${intent.energyCurve}`);
        console.log(
          `   BPM Range: ${intent.tempoRange.min}-${intent.tempoRange.max}`,
        );
        console.log(`   Target Genres: ${intent.targetGenres.join(", ")}`);

        console.log("\n🎵 Generating candidate pool...");
        if (planner.isSpotifySearchEnabled()) {
          console.log(
            "   🔍 Searching Spotify for tracks matching your intent...",
          );
        } else {
          console.log("   📚 Selecting from local catalog...");
        }
        const pool = await planner.generateCandidatePoolLLM(intent, llm);
        console.log(
          `✅ Generated pool with ${pool.tracks.size} candidate tracks`,
        );
        console.log(`   Reasoning: ${pool.filtersApplied}`);

        console.log("\n🎧 Sequencing tracks with AI...");
        const plan = await planner.sequencePlanLLM(
          intent,
          pool,
          seedTracks,
          llm,
        );
        console.log(`✅ Sequenced ${plan.trackList.length} tracks`);
        console.log(
          `   Total Duration: ${Math.floor(plan.totalDuration / 60)} minutes`,
        );

        console.log("\n💡 Generating explanations...");
        const explainedPlan = await planner.explainPlanLLM(plan, llm);
        console.log("✅ Explanations generated");

        console.log("\n📋 Your AI-Generated Crate:");
        console.log("===========================");
        await planner.displayCrate();

        // Validate the plan
        console.log("\n✅ Validating crate...");
        const validation = await planner.validate(explainedPlan, 300);
        if (validation.isValid) {
          console.log("✅ Validation passed!");
        } else {
          console.log("⚠️ Validation issues:");
          validation.errors.forEach((err) => console.log(`   - ${err}`));
        }

        // Offer revision loop
        await offerRevision(explainedPlan, planner, llm, rl);
      } catch (error) {
        console.log(`\n❌ Error: ${(error as Error).message}`);
        console.log("Try a different prompt or check your input format.");
      }

      console.log("\n" + "=".repeat(50) + "\n");
      planCrate();
    });
  };

  planCrate();
}

startInteractiveSpotifyCratePlanner().catch(console.error);

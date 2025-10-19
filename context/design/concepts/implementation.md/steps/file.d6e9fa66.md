---
timestamp: 'Fri Oct 17 2025 13:14:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251017_131415.c3cad96a.md]]'
content_id: d6e9fa667b457d70b9ccfcd71565df17a8a21d1f1a586b9ea8dd5bd74f6681ac
---

# file: src\core\crate\_planner.ts

```typescript
/**
 * CratePlanner - AI-Augmented DJ Crate Planning
 *
 * Implements the CratePlanningAI concept from spec/CratePlanningAI.spec
 * Produces ordered song crates that satisfy event prompts using both
 * deterministic heuristics and optional LLM-powered planning.
 */

import { Collection, Db } from "mongodb";
import { CamelotKey, Track, TrackFilter } from "./track.ts";
import { GeminiLLM } from "../llm/gemini-llm.ts";
import { SpotifySearchService } from "../llm/spotify_search_service.ts";
import {
  parseCandidatePoolSelection,
  parseDerivedIntent,
  parsePlanRevision,
  parseTrackSequence,
} from "../llm/parsers.ts";
import {
  createCandidatePoolPrompt,
  createDeriveIntentPrompt,
  createExplainPlanPrompt,
  createRevisionPrompt,
  createSequencePlanPrompt,
} from "../prompts/crate_prompting.ts";
import {
  formatCrateTracks,
  formatSeedTrackIds,
  formatSeedTracks,
  formatTrackList,
} from "../prompts/formatters.ts";
import { formatMinutes, formatMMSS } from "../utils/time_formatters.ts";
import {
  validateCratePlan,
  ValidationResult,
} from "../validation/constraints.ts";

/**
 * User prompt for crate planning
 */
export interface CratePrompt {
  tempoRange?: { min: number; max: number };
  targetKey?: CamelotKey;
  targetGenre?: string;
  sampleTracks?: string[]; // Track IDs
  targetDuration?: number; // in seconds
  notes?: string;
}

/**
 * Derived intent from LLM analysis of the prompt
 */
export interface DerivedIntent {
  tempoRange: { min: number; max: number };
  allowedKeys: CamelotKey[];
  targetGenres: string[];
  duration: number;
  mixStyle: "smooth" | "energetic" | "eclectic";
  mustIncludeArtists: string[];
  avoidArtists: string[];
  mustIncludeTracks: string[];
  avoidTracks: string[];
  energyCurve?: "linear" | "wave" | "peak";
  // Tunables for Spotify Recommendations
  targetEnergy?: number; // 0-1
  minPopularity?: number; // 0-100
  targetKeyCamelot?: CamelotKey;
}

/**
 * Spotify Query Plan from LLM
 */
export interface SpotifyQueryPlan {
  searchQueries: string[]; // Plain text + allowed filters only
  seedGenres: string[]; // From available-genre-seeds
  seedArtists: string[]; // Artist names (will be resolved to IDs)
  seedTracks: string[]; // Track names (will be resolved to IDs)
  tunables: {
    min_tempo?: number;
    max_tempo?: number;
    target_tempo?: number;
    min_energy?: number;
    max_energy?: number;
    target_energy?: number;
    min_popularity?: number;
    target_key?: number; // Spotify key 0-11
    target_mode?: number; // 0=minor, 1=major
  };
  reasoning: string;
}

/**
 * LLM configuration settings
 */
export interface LLMSettings {
  model: string;
  temperature: number;
  promptTemplate?: string;
  outputTemplate?: string;
}

/**
 * A finalized crate plan
 */
export interface CratePlan {
  prompt: CratePrompt;
  trackList: string[]; // Ordered list of track IDs
  annotations: string;
  totalDuration: number;
  planDetails: {
    llmModel?: string;
    llmTraceId?: string;
    usedAI: boolean;
  };
  isFinalized: boolean;
}

/**
 * Candidate pool for track selection
 */
export interface CandidatePool {
  sourcePrompt: CratePrompt;
  tracks: Set<string>; // Track IDs
  filtersApplied: string;
}

/**
 * CratePlanner class - main planning engine
 */
export class CratePlanner {
  private db: Db;
  private tracksCollection: Collection<Track>;
  private currentPlan?: CratePlan;
  private llmSettings: LLMSettings;
  private finalizedPlans: CratePlan[] = [];
  private spotifySearchService?: SpotifySearchService;

  constructor(db: Db) {
    this.db = db;
    this.tracksCollection = db.collection<Track>("tracks");
    this.llmSettings = {
      model: "gemini-2.5-flash-lite",
      temperature: 0.7,
    };
  }

  /**
   * Create a plan using deterministic heuristics (no LLM)
   */
  async createPlan(
    prompt: CratePrompt,
    seedTracks: string[],
  ): Promise<CratePlan> {
    // Validate seed tracks exist
    for (const trackId of seedTracks) {
      const track = await this._getTrack(trackId);
      if (!track) {
        throw new Error(`Seed track ${trackId} not found in database`);
      }
    }

    // Generate candidate pool using deterministic filtering
    const candidates = await this._generateCandidatePoolDeterministic(prompt);

    // Create ordered track list starting with seed tracks
    const trackList = await this._sequencePlanDeterministic(
      prompt,
      candidates,
      seedTracks,
    );

    return await this._createPlanObject(
      prompt,
      trackList,
      "Plan created using deterministic heuristics",
      false,
    );
  }

  /**
   * Derive intent from prompt using LLM
   */
  async deriveIntentLLM(
    prompt: CratePrompt,
    seedTracks: string[],
    llm: GeminiLLM,
  ): Promise<DerivedIntent> {
    // Get seed track objects and format them
    const seedTrackObjects = await this._getTracks(seedTracks);

    const seedTrackInfo = formatSeedTracks(seedTrackObjects);
    const llmPrompt = createDeriveIntentPrompt(prompt, seedTrackInfo);
    const response = await llm.executeLLM(llmPrompt);

    return this._parseLLMResponse(
      response,
      parseDerivedIntent,
      (intent) => {
        // Validate and set defaults
        if (!intent.tempoRange) {
          intent.tempoRange = prompt.tempoRange || { min: 100, max: 140 };
        }
        if (!intent.duration) {
          intent.duration = prompt.targetDuration || 3600;
        }
        return intent;
      },
      () => this._createFallbackIntent(prompt),
      "intent",
    );
  }

  /**
   * Generate candidate pool using LLM with Spotify search
   */
  async generateCandidatePoolLLM(
    intent: DerivedIntent,
    llm: GeminiLLM,
  ): Promise<CandidatePool> {
    // Use Spotify search service if available, otherwise fall back to local database
    if (this.spotifySearchService) {
      return await this._generateCandidatePoolWithSpotify(intent, llm);
    } else {
      return await this._generateCandidatePoolFromDatabase(intent, llm);
    }
  }

  /**
   * Generate candidate pool using Spotify search
   */
  private async _generateCandidatePoolWithSpotify(
    intent: DerivedIntent,
    llm: GeminiLLM,
  ): Promise<CandidatePool> {
    try {
      // Search Spotify for tracks matching the intent
      const spotifyTracks = await this.spotifySearchService!
        .searchTracksForIntent(intent, 20);

      if (spotifyTracks.length === 0) {
        return {
          sourcePrompt: {
            targetGenre: intent.targetGenres[0],
            tempoRange: intent.tempoRange,
          },
          tracks: new Set(),
          filtersApplied:
            "No tracks found on Spotify matching the specified intent.",
        };
      }

      // Format track list for LLM with Spotify tracks
      const trackList = formatTrackList(spotifyTracks);
      const llmPrompt = createCandidatePoolPrompt(intent, trackList);
      const response = await llm.executeLLM(llmPrompt);

      return this._parseLLMResponse(
        response,
        parseCandidatePoolSelection,
        (result) => ({
          sourcePrompt: {
            targetGenre: intent.targetGenres[0],
            tempoRange: intent.tempoRange,
          },
          tracks: new Set(result.selectedTrackIds),
          filtersApplied: result.reasoning,
        }),
        () => {
          // Fallback: use all Spotify tracks if LLM parsing fails
          return {
            sourcePrompt: {
              targetGenre: intent.targetGenres[0],
              tempoRange: intent.tempoRange,
            },
            tracks: new Set(spotifyTracks.map((t) => t.id)),
            filtersApplied: "Using all Spotify tracks (LLM parsing failed)",
          };
        },
        "candidate pool",
      );
    } catch (error) {
      console.warn(
        "⚠️ Spotify search failed, falling back to local database:",
        (error as Error).message,
      );
      return this._generateCandidatePoolFromDatabase(intent, llm);
    }
  }

  /**
   * Generate candidate pool from local database (fallback)
   */
  private async _generateCandidatePoolFromDatabase(
    intent: DerivedIntent,
    llm: GeminiLLM,
  ): Promise<CandidatePool> {
    // Get ALL tracks from database for LLM to choose from
    let allTracks = await this._getAllTracks();

    // If no tracks available, return empty pool
    if (allTracks.length === 0) {
      return {
        sourcePrompt: {
          targetGenre: intent.targetGenres[0],
          tempoRange: intent.tempoRange,
        },
        tracks: new Set(),
        filtersApplied:
          "No tracks available to select from. Therefore, no tracks could be chosen that match the specified intent.",
      };
    }

    // Token limit protection: Pre-filter if catalog is too large
    // Each track ~50 tokens, limit to 200 tracks (~10k tokens) to stay within context window
    const MAX_TRACKS_FOR_LLM = 200;
    if (allTracks.length > MAX_TRACKS_FOR_LLM) {
      console.log(
        `⚠️  Large database detected (${allTracks.length} tracks). Pre-filtering to ${MAX_TRACKS_FOR_LLM}...`,
      );

      // First, try filtering by BPM and genre
      let filtered = await this._searchTracks({
        bpmRange: intent.tempoRange,
        genre: intent.targetGenres[0],
      });

      // If still too many, take the most recent tracks
      if (filtered.length > MAX_TRACKS_FOR_LLM) {
        filtered = filtered
          .sort((a, b) =>
            (b.registeredAt?.getTime() || 0) - (a.registeredAt?.getTime() || 0)
          )
          .slice(0, MAX_TRACKS_FOR_LLM);
      }

      // If filtering didn't help enough, just take first MAX_TRACKS_FOR_LLM
      allTracks = filtered.length > 0
        ? filtered
        : allTracks.slice(0, MAX_TRACKS_FOR_LLM);

      console.log(
        `   ✓ Reduced to ${allTracks.length} tracks for LLM selection`,
      );
    }

    // Format track list for LLM with filtered tracks
    const trackList = formatTrackList(allTracks);
    const llmPrompt = createCandidatePoolPrompt(intent, trackList);
    const response = await llm.executeLLM(llmPrompt);

    try {
      const result = parseCandidatePoolSelection(response);
      return {
        sourcePrompt: {
          targetGenre: intent.targetGenres[0],
          tempoRange: intent.tempoRange,
        },
        tracks: new Set(result.selectedTrackIds),
        filtersApplied: result.reasoning,
      };
    } catch (error) {
      console.error(
        `❌ Error parsing LLM candidate pool response:`,
        (error as Error).message,
      );
      // Fallback: use broader deterministic filtering if LLM fails
      const fallbackCandidates = await this._searchTracks({
        bpmRange: intent.tempoRange,
      });
      return {
        sourcePrompt: {
          targetGenre: intent.targetGenres[0],
          tempoRange: intent.tempoRange,
        },
        tracks: new Set(fallbackCandidates.map((t) => t.id)),
        filtersApplied: "Deterministic filtering (LLM parsing failed)",
      };
    }
  }

  /**
   * Sequence tracks using LLM
   */
  async sequencePlanLLM(
    intent: DerivedIntent,
    pool: CandidatePool,
    seedTracks: string[],
    llm: GeminiLLM,
  ): Promise<CratePlan> {
    if (pool.tracks.size === 0) {
      throw new Error("Candidate pool is empty");
    }

    // Get track objects and format them
    const candidateTracks = await this._getTracks(Array.from(pool.tracks));
    const seedTrackObjects = await this._getTracks(seedTracks);

    const trackInfo = formatTrackList(candidateTracks, { withDuration: true });
    const seedInfo = formatSeedTrackIds(seedTrackObjects);
    const llmPrompt = createSequencePlanPrompt(intent, trackInfo, seedInfo);
    const response = await llm.executeLLM(llmPrompt);

    try {
      const result = parseTrackSequence(response);
      const validTracks = await this._filterValidTrackIds(
        result.orderedTrackIds,
      );
      return await this._createPlanObject(
        pool.sourcePrompt,
        validTracks,
        result.reasoning,
        true,
        this.llmSettings.model,
      );
    } catch (error) {
      console.error(
        `❌ Error parsing LLM sequence response:`,
        (error as Error).message,
      );
      const trackList = await this._sequencePlanDeterministic(
        pool.sourcePrompt,
        candidateTracks,
        seedTracks,
      );
      return await this._createPlanObject(
        pool.sourcePrompt,
        trackList,
        "Deterministic sequencing (LLM parsing failed)",
        false,
      );
    }
  }

  /**
   * Generate explanations for a plan using LLM
   */
  async explainPlanLLM(plan: CratePlan, llm: GeminiLLM): Promise<CratePlan> {
    // Get track objects and format them
    const tracks = await this._getTracks(plan.trackList);

    const trackDetails = formatCrateTracks(tracks, false);
    const llmPrompt = createExplainPlanPrompt(trackDetails, plan.totalDuration);
    const response = await llm.executeLLM(llmPrompt);

    return {
      ...plan,
      annotations: response.trim(),
    };
  }

  /**
   * Revise a plan based on user instructions using LLM
   */
  async revisePlanLLM(
    plan: CratePlan,
    instructions: string,
    llm: GeminiLLM,
  ): Promise<CratePlan> {
    // Validate instructions
    if (!instructions || instructions.trim().length < 5) {
      throw new Error("Revision instructions must be at least 5 characters");
    }

    if (instructions.trim().length > 500) {
      throw new Error(
        "Revision instructions are too long (max 500 characters)",
      );
    }

    // Get current crate tracks and format them
    const currentTracks = await this._getTracks(plan.trackList);

    const trackDetails = formatCrateTracks(currentTracks, true);

    // Get replacement tracks - use smart filtering based on current plan
    const replacementTracks = await this._getReplacementTracks(plan, 100);
    const availableTrackInfo = formatTrackList(replacementTracks);

    const llmPrompt = createRevisionPrompt(
      trackDetails,
      instructions,
      availableTrackInfo,
      plan.totalDuration, // Add duration constraint
    );
    const response = await llm.executeLLM(llmPrompt);

    try {
      const result = parsePlanRevision(response);
      const validTracks = await this._filterValidTrackIds(
        result.revisedTrackIds,
      );

      // Warn if duration changed significantly
      const newDuration = await this._calculateTotalDuration(validTracks);
      const durationDiff = Math.abs(newDuration - plan.totalDuration);
      if (durationDiff > 600) { // > 10 minutes
        console.warn(
          `   ⚠️  Duration changed by ${Math.floor(durationDiff / 60)} minutes`,
        );
      }

      const revisedPlan: CratePlan = {
        ...plan,
        trackList: validTracks,
        annotations: result.changesExplanation,
        totalDuration: newDuration,
        isFinalized: false,
      };
      this.currentPlan = revisedPlan;
      return revisedPlan;
    } catch (error) {
      console.error(
        `❌ Error parsing LLM revision response:`,
        (error as Error).message,
      );
      throw new Error("Failed to revise plan: LLM response parsing failed");
    }
  }

  /**
   * Get smart replacement tracks for revision
   * Filters tracks similar to current plan characteristics
   */
  private async _getReplacementTracks(
    plan: CratePlan,
    maxTracks: number,
  ): Promise<Track[]> {
    const currentTracks = await this._getTracks(plan.trackList);

    if (currentTracks.length === 0) {
      const allTracks = await this._getAllTracks();
      return allTracks.slice(0, maxTracks);
    }

    // Calculate plan characteristics
    const avgBPM = currentTracks.reduce((sum, t) => sum + t.bpm, 0) /
      currentTracks.length;
    const usedGenres = new Set(
      currentTracks.map((t) => t.genre).filter((g) => g),
    );

    // Get similar tracks
    let similarTracks = await this._searchTracks({
      bpmRange: {
        min: Math.floor(avgBPM - 10),
        max: Math.ceil(avgBPM + 10),
      },
    });

    // If we have genre info, filter by that too
    if (usedGenres.size > 0) {
      const genreFiltered = similarTracks.filter((t) =>
        t.genre && usedGenres.has(t.genre)
      );
      if (genreFiltered.length > maxTracks / 2) {
        similarTracks = genreFiltered;
      }
    }

    // Limit and sort by recency
    if (similarTracks.length > maxTracks) {
      similarTracks = similarTracks
        .sort((a, b) =>
          (b.registeredAt?.getTime() || 0) - (a.registeredAt?.getTime() || 0)
        )
        .slice(0, maxTracks);
    }

    return similarTracks;
  }

  /**
   * Validate a plan
   * Uses centralized validation logic with database-specific checks
   */
  async validate(
    plan: CratePlan,
    toleranceSeconds: number = 300,
  ): Promise<ValidationResult> {
    // Use centralized validation
    const result = validateCratePlan(plan, toleranceSeconds);

    // Add database-specific validation
    for (const trackId of plan.trackList) {
      const track = await this._getTrack(trackId);
      if (!track) {
        result.errors.push(`Track ${trackId} not found in database`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Finalize a plan
   */
  async finalize(plan: CratePlan): Promise<void> {
    const validation = await this.validate(plan);

    if (!validation.isValid) {
      throw new Error(
        `Cannot finalize invalid plan: ${validation.errors.join(", ")}`,
      );
    }

    plan.isFinalized = true;
    this.finalizedPlans.push(plan);
  }

  /**
   * Set LLM settings
   */
  setLLMSettings(settings: Partial<LLMSettings>): void {
    this.llmSettings = { ...this.llmSettings, ...settings };
  }

  /**
   * Set Spotify search service for real-time track discovery
   */
  setSpotifySearchService(service: SpotifySearchService): void {
    this.spotifySearchService = service;
  }

  /**
   * Check if Spotify search is enabled
   */
  isSpotifySearchEnabled(): boolean {
    return this.spotifySearchService !== undefined;
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): CratePlan | undefined {
    return this.currentPlan;
  }

  /**
   * Get all finalized plans
   */
  getFinalizedPlans(): CratePlan[] {
    return this.finalizedPlans;
  }

  /**
   * Display current crate plan
   */
  async displayCrate(): Promise<void> {
    if (!this.currentPlan) {
      console.log("No current plan");
      return;
    }

    console.log("\n📋 Current Crate Plan");
    console.log("====================");
    console.log(
      `Total Duration: ${formatMinutes(this.currentPlan.totalDuration)}`,
    );
    console.log(`Tracks: ${this.currentPlan.trackList.length}`);
    console.log(
      `AI-Generated: ${this.currentPlan.planDetails.usedAI ? "Yes" : "No"}`,
    );
    console.log(`Finalized: ${this.currentPlan.isFinalized ? "Yes" : "No"}\n`);

    for (let index = 0; index < this.currentPlan.trackList.length; index++) {
      const trackId = this.currentPlan.trackList[index];
      const track = await this._getTrack(trackId);
      if (track) {
        console.log(`${index + 1}. ${track.artist} - ${track.title}`);
        console.log(
          `   ${track.bpm} BPM | ${track.key} | ${
            formatMMSS(track.duration_sec)
          } | Energy: ${track.energy || "N/A"}`,
        );
      }
    }

    if (this.currentPlan.annotations) {
      console.log("\n💡 Notes:");
      console.log(this.currentPlan.annotations);
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Parse LLM response with a fallback mechanism
   */
  private _parseLLMResponse<T, U>(
    response: string,
    parser: (text: string) => T,
    onSuccess: (parsed: T) => U,
    onFailure: () => U,
    errorContext: string,
  ): U {
    try {
      const parsed = parser(response);
      return onSuccess(parsed);
    } catch (error) {
      console.error(
        `❌ Error parsing LLM ${errorContext} response:`,
        (error as Error).message,
      );
      return onFailure();
    }
  }

  /**
   * Calculate total duration of a track list
   */
  private async _calculateTotalDuration(trackIds: string[]): Promise<number> {
    const tracks = await this._getTracks(trackIds);
    return tracks.reduce((sum, track) => sum + track.duration_sec, 0);
  }

  /**
   * Create a CratePlan object
   */
  private async _createPlanObject(
    prompt: CratePrompt,
    trackList: string[],
    annotations: string,
    usedAI: boolean,
    llmModel?: string,
  ): Promise<CratePlan> {
    const plan: CratePlan = {
      prompt,
      trackList,
      annotations,
      totalDuration: await this._calculateTotalDuration(trackList),
      planDetails: {
        usedAI,
        llmModel,
      },
      isFinalized: false,
    };
    this.currentPlan = plan;
    return plan;
  }

  /**
   * Generate candidate pool using deterministic filtering
   */
  private async _generateCandidatePoolDeterministic(
    prompt: CratePrompt,
  ): Promise<Track[]> {
    return await this._searchTracks({
      bpmRange: prompt.tempoRange,
      genre: prompt.targetGenre,
      key: prompt.targetKey,
    });
  }

  /**
   * Sequence tracks using deterministic heuristics
   */
  private async _sequencePlanDeterministic(
    prompt: CratePrompt,
    candidates: Track[],
    seedTracks: string[],
  ): Promise<string[]> {
    const result: string[] = [];
    const used = new Set<string>();

    // Add seed tracks first
    for (const seedId of seedTracks) {
      if (!used.has(seedId)) {
        result.push(seedId);
        used.add(seedId);
      }
    }

    // Sort remaining candidates by BPM
    const remaining = candidates
      .filter((t) => !used.has(t.id))
      .sort((a, b) => a.bpm - b.bpm);

    // Add tracks until we reach target duration
    const targetDuration = prompt.targetDuration || 3600;
    const seedTracksData = await this._getTracks(result);
    let currentDuration = seedTracksData.reduce(
      (sum, track) => sum + track.duration_sec,
      0,
    );

    for (const track of remaining) {
      if (currentDuration >= targetDuration) break;
      result.push(track.id);
      used.add(track.id);
      currentDuration += track.duration_sec;
    }

    return result;
  }

  /**
   * Create fallback intent when LLM fails
   */
  private _createFallbackIntent(prompt: CratePrompt): DerivedIntent {
    return {
      tempoRange: prompt.tempoRange || { min: 100, max: 140 },
      allowedKeys: [], // All keys allowed
      targetGenres: prompt.targetGenre ? [prompt.targetGenre] : [],
      duration: prompt.targetDuration || 3600,
      mixStyle: "smooth",
      mustIncludeArtists: [],
      avoidArtists: [],
      mustIncludeTracks: prompt.sampleTracks || [],
      avoidTracks: [],
      energyCurve: "linear",
    };
  }

  // ========== MONGODB HELPER METHODS ==========

  /**
   * Get a single track by ID from MongoDB
   */
  private async _getTrack(id: string): Promise<Track | null> {
    return await this.tracksCollection.findOne({ id });
  }

  /**
   * Get multiple tracks by IDs from MongoDB
   */
  private async _getTracks(ids: string[]): Promise<Track[]> {
    const tracks = await this.tracksCollection.find({ id: { $in: ids } })
      .toArray();
    return tracks;
  }

  /**
   * Get all tracks from MongoDB
   */
  private async _getAllTracks(): Promise<Track[]> {
    return await this.tracksCollection.find({}).toArray();
  }

  /**
   * Search tracks with filters in MongoDB
   */
  private async _searchTracks(filter: TrackFilter = {}): Promise<Track[]> {
    const query: Record<string, unknown> = {};

    // Filter by specific IDs
    if (filter.ids && filter.ids.length > 0) {
      query.id = { $in: filter.ids };
    }

    // Filter by genre (case-insensitive)
    if (filter.genre) {
      query.genre = { $regex: new RegExp(`^${filter.genre}$`, "i") };
    }

    // Filter by BPM range
    if (filter.bpmRange) {
      query.bpm = {
        $gte: filter.bpmRange.min,
        $lte: filter.bpmRange.max,
      };
    }

    // Filter by single key
    if (filter.key) {
      query.key = filter.key;
    }

    // Filter by multiple keys
    if (filter.keys && filter.keys.length > 0) {
      query.key = { $in: filter.keys };
    }

    // Filter by energy range
    if (filter.energyRange) {
      query.energy = {
        $gte: filter.energyRange.min,
        $lte: filter.energyRange.max,
      };
    }

    // Filter by duration range
    if (filter.durationRange) {
      query.duration_sec = {
        $gte: filter.durationRange.min,
        $lte: filter.durationRange.max,
      };
    }

    // Filter by single artist (case-insensitive)
    if (filter.artist) {
      query.artist = { $regex: new RegExp(`^${filter.artist}$`, "i") };
    }

    // Filter by multiple artists (case-insensitive)
    if (filter.artists && filter.artists.length > 0) {
      const artistRegexes = filter.artists.map((a) =>
        new RegExp(`^${a}$`, "i")
      );
      query.artist = { $in: artistRegexes };
    }

    // Exclude specific artists (case-insensitive)
    if (filter.excludeArtists && filter.excludeArtists.length > 0) {
      const excludeRegexes = filter.excludeArtists.map((a) =>
        new RegExp(`^${a}$`, "i")
      );
      query.artist = { $nin: excludeRegexes };
    }

    return await this.tracksCollection.find(query).toArray();
  }

  /**
   * Filter track IDs to only include valid tracks in database
   */
  private async _filterValidTrackIds(trackIds: string[]): Promise<string[]> {
    const validTracks = await this.tracksCollection.find(
      { id: { $in: trackIds } },
      { projection: { id: 1 } },
    ).toArray();
    const validIds = new Set(validTracks.map((t) => t.id));
    return trackIds.filter((id) => validIds.has(id));
  }
}

```

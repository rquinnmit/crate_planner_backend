---
timestamp: 'Fri Oct 17 2025 01:05:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251017_010512.76483002.md]]'
content_id: e0573b28310a33e899364e2caaf70f72d12b764a1aadaaebfdc1273ae4ebb7a4
---

# file: src/CratePlanningAI/CratePlanningAIConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// #############################################################################
// MOCKS FOR EXTERNAL SYSTEMS
// #############################################################################

/** A mock for an external LLM API call. */
const callLLM = async (task: string, data: unknown): Promise<any> => {
  console.log(`Mock LLM call for task: ${task}`, data);
  // In a real implementation, this would make an API call to a service like OpenAI.
  switch (task) {
    case "deriveIntent":
      return {
        tempoRange: [120, 128],
        allowedKeys: ["Am", "C", "G"],
        targetGenres: ["deep house", "tech house"],
        duration: 3600, // 1 hour in seconds
        mixStyle: "Harmonic mixing, energy progression",
        mustIncludeArtists: [],
        avoidArtists: [],
        mustIncludeTracks: (data as any).seedTracks,
        avoidTracks: [],
      };
    case "generateCandidates":
      return {
        tracks: [freshID(), freshID(), freshID(), freshID(), freshID()],
        filtersApplied: "Based on tempo, key, and genre from derived intent.",
      };
    case "sequence":
      const tracks = (data as any).pool.tracks;
      // Simple shuffle for mock sequencing
      for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
      }
      return { trackList: tracks, totalDuration: 3550 };
    case "explain":
      return {
        annotations: "This plan starts with a lower energy track and gradually builds up. The key transitions are smooth, following the circle of fifths.",
      };
    case "revise":
      const plan = (data as any).plan;
      plan.trackList.push(freshID()); // Mock revision: add a new track
      return plan;
    default:
      throw new Error(`Unknown LLM task: ${task}`);
  }
};

/** A mock for an external asset catalog/track database. */
const areTracksValid = async (trackIds: TrackId[]): Promise<boolean> => {
  console.log("Mock validation for tracks:", trackIds);
  // In a real implementation, this would query a track database.
  return true; // Assume all tracks are valid for this implementation.
};

// #############################################################################
// CONCEPT DEFINITION
// #############################################################################

const PREFIX = "CratePlanningAI" + ".";

// Generic type parameters
type TrackId = ID;
type Prompt = ID;
type DerivedIntent = ID;
type Plan = ID;
type CandidatePool = ID;

// State Interfaces, mapping the spec to TypeScript types

/**
 * a set of Prompts with...
 */
interface PromptDoc {
  _id: Prompt;
  tempoRange?: [number, number];
  targetKey?: string;
  targetGenre?: string;
  sampleTracks?: TrackId[];
  targetDuration?: number; // in seconds
  notes?: string;
}

/**
 * a set of DerivedIntents with...
 */
interface DerivedIntentDoc {
  _id: DerivedIntent;
  sourcePrompt: Prompt; // Added to link intent back to its origin
  tempoRange: [number, number];
  allowedKeys: string[];
  targetGenres: string[];
  duration: number; // in seconds
  mixStyle: string;
  mustIncludeArtists: string[];
  avoidArtists: string[];
  mustIncludeTracks: TrackId[];
  avoidTracks: TrackId[];
}

/**
 * a set of LLMSettings with...
 */
interface LLMSettingsDoc {
  _id: "default"; // Use a singleton document for global settings
  model: string;
  temperature: number;
  promptTemplate: string;
  outputTemplate: string;
}

/**
 * a set of Plans with...
 */
interface PlanDoc {
  _id: Plan;
  prompt: Prompt;
  trackList: TrackId[];
  annotations: string;
  totalDuration: number; // in seconds
  isFinalized: boolean;
  isArchived: boolean; // NEW: Added to support archivePlan()
  planDetails: {
    llmModel?: string;
    llmTraceId?: string;
  };
}

/**
 * a set of CandidatePools with...
 */
interface CandidatePoolDoc {
  _id: CandidatePool;
  sourcePrompt: Prompt;
  tracks: TrackId[];
  filtersApplied: string;
}

/**
 * concept: CratePlanningAI
 * purpose: produce an ordered song crate that satisfies the given prompt
 */
export default class CratePlanningAIConcept {
  private readonly prompts: Collection<PromptDoc>;
  private readonly derivedIntents: Collection<DerivedIntentDoc>;
  private readonly llmSettings: Collection<LLMSettingsDoc>;
  private readonly plans: Collection<PlanDoc>;
  private readonly candidatePools: Collection<CandidatePoolDoc>;

  constructor(private readonly db: Db) {
    this.prompts = db.collection(PREFIX + "prompts");
    this.derivedIntents = db.collection(PREFIX + "derivedIntents");
    this.llmSettings = db.collection(PREFIX + "llmSettings");
    this.plans = db.collection(PREFIX + "plans");
    this.candidatePools = db.collection(PREFIX + "candidatePools");
  }

  // ###########################################################################
  // ACTIONS (Original)
  // ###########################################################################

  /**
   * createPlan(prompt: Prompt, seedTracks: List<TrackId>): (plan: Plan)
   *
   * **requires** every track in seedTracks is a valid track
   * **effects** creates a draft order that satisfies the constraints and coverage of seed tracks
   */
  async createPlan({ prompt, seedTracks }: { prompt: Prompt; seedTracks: TrackId[] }): Promise<{ plan: PlanDoc } | { error: string }> {
    if (!(await areTracksValid(seedTracks))) {
      return { error: "One or more seed tracks are invalid." };
    }

    const newPlan: PlanDoc = {
      _id: freshID(),
      prompt,
      trackList: seedTracks,
      annotations: "Initial draft based on seed tracks.",
      totalDuration: 0, // In a real system, this would be calculated from track metadata.
      isFinalized: false,
      isArchived: false,
      planDetails: {},
    };

    const result = await this.plans.insertOne(newPlan);
    if (!result.acknowledged) {
      return { error: "Failed to create plan in database." };
    }

    return { plan: newPlan };
  }

  // ... (all other original actions like deriveIntentLLM, generateCandidatePool, etc. would go here) ...
  // (Omitted for brevity to highlight new actions)

  // ###########################################################################
  // ACTIONS (New Recommendations)
  // ###########################################################################

  /**
   * createPrompt(tempoRange?: Tuple<Float>, targetKey?: String, targetGenre?: String, sampleTracks?: List<TrackId>, targetDuration?: Integer, notes?: String): (prompt: Prompt)
   *
   * **requires** if sampleTracks are provided, they must be valid track IDs.
   * **effects** creates a new Prompt document with a unique ID, populates it with provided arguments, and returns the new prompt.
   */
  async createPrompt(
    args: {
      tempoRange?: [number, number];
      targetKey?: string;
      targetGenre?: string;
      sampleTracks?: TrackId[];
      targetDuration?: number;
      notes?: string;
    },
  ): Promise<{ prompt: PromptDoc } | { error: string }> {
    if (args.sampleTracks && !(await areTracksValid(args.sampleTracks))) {
      return { error: "One or more sample tracks are invalid." };
    }

    const newPrompt: PromptDoc = {
      _id: freshID(),
      ...args,
    };

    const result = await this.prompts.insertOne(newPrompt);
    if (!result.acknowledged) {
      return { error: "Failed to create prompt in database." };
    }
    return { prompt: newPrompt };
  }

  /**
   * archivePlan(plan: Plan): ()
   *
   * **requires** the plan must exist.
   * **effects** marks the specified Plan as archived, removing it from active view but preserving it.
   */
  async archivePlan({ plan }: { plan: Plan }): Promise<Empty | { error: string }> {
    const result = await this.plans.updateOne({ _id: plan }, { $set: { isArchived: true } });
    if (result.matchedCount === 0) {
      return { error: `Plan with id ${plan} not found.` };
    }
    return {};
  }

  /**
   * editCandidatePool(pool: CandidatePool, addTracks?: List<TrackId>, removeTracks?: List<TrackId>): (updatedPool: CandidatePoolDoc)
   *
   * **requires** the pool must exist and any tracks in addTracks must be valid.
   * **effects** adds and/or removes tracks from the specified candidate pool.
   */
  async editCandidatePool({ pool, addTracks, removeTracks }: { pool: CandidatePool; addTracks?: TrackId[]; removeTracks?: TrackId[] }): Promise<{ updatedPool: CandidatePoolDoc } | { error: string }> {
    if (addTracks && !(await areTracksValid(addTracks))) {
      return { error: "One or more tracks to add are invalid." };
    }

    const updateQuery: any = {};
    if (addTracks && addTracks.length > 0) {
      updateQuery.$addToSet = { tracks: { $each: addTracks } };
    }
    if (removeTracks && removeTracks.length > 0) {
      updateQuery.$pullAll = { tracks: removeTracks };
    }

    if (Object.keys(updateQuery).length === 0) {
      // Nothing to do, return the current state
      const existingPool = await this.candidatePools.findOne({ _id: pool });
      return existingPool ? { updatedPool: existingPool } : { error: `Pool with id ${pool} not found.` };
    }

    const result = await this.candidatePools.updateOne({ _id: pool }, updateQuery);
    if (result.matchedCount === 0) {
      return { error: `Pool with id ${pool} not found.` };
    }

    const updatedPool = await this.candidatePools.findOne({ _id: pool });
    if (!updatedPool) {
      return { error: "Could not retrieve updated pool." }; // Should not happen if update succeeded
    }
    return { updatedPool };
  }

  /**
   * reorderTrackInPlan(plan: Plan, track: TrackId, newIndex: Integer): (updatedPlan: PlanDoc)
   *
   * **requires** the plan exists and is not finalized; the track exists in the plan; newIndex is a valid index.
   * **effects** moves the specified track to the newIndex position in the plan's trackList.
   */
  async reorderTrackInPlan({ plan, track, newIndex }: { plan: Plan; track: TrackId; newIndex: number }): Promise<{ updatedPlan: PlanDoc } | { error: string }> {
    const planDoc = await this.plans.findOne({ _id: plan });

    if (!planDoc) return { error: `Plan with id ${plan} not found.` };
    if (planDoc.isFinalized) return { error: "Cannot reorder tracks in a finalized plan." };
    if (newIndex < 0 || newIndex >= planDoc.trackList.length) return { error: "Invalid new index." };

    const oldIndex = planDoc.trackList.indexOf(track);
    if (oldIndex === -1) return { error: `Track ${track} not found in plan.` };

    // Perform reorder in memory
    const newTrackList = [...planDoc.trackList];
    const [movedTrack] = newTrackList.splice(oldIndex, 1);
    newTrackList.splice(newIndex, 0, movedTrack);

    // Update the document in MongoDB
    await this.plans.updateOne({ _id: plan }, { $set: { trackList: newTrackList } });

    const updatedPlan = await this.plans.findOne({ _id: plan });
    if (!updatedPlan) return { error: "Could not retrieve updated plan." };

    return { updatedPlan };
  }

  /**
   * replaceTrackInPlan(plan: Plan, oldTrack: TrackId, newTrack: TrackId): (updatedPlan: PlanDoc)
   *
   * **requires** plan exists and is not finalized; oldTrack is in the plan; newTrack is valid and not already in the plan.
   * **effects** replaces oldTrack with newTrack in the plan's trackList and returns the updated plan.
   */
  async replaceTrackInPlan({ plan, oldTrack, newTrack }: { plan: Plan; oldTrack: TrackId; newTrack: TrackId }): Promise<{ updatedPlan: PlanDoc } | { error: string }> {
    if (!(await areTracksValid([newTrack]))) {
      return { error: `New track ${newTrack} is not a valid track.` };
    }

    const planDoc = await this.plans.findOne({ _id: plan });

    if (!planDoc) return { error: `Plan with id ${plan} not found.` };
    if (planDoc.isFinalized) return { error: "Cannot replace tracks in a finalized plan." };
    if (!planDoc.trackList.includes(oldTrack)) return { error: `Track to be replaced (${oldTrack}) not found in plan.` };
    if (planDoc.trackList.includes(newTrack)) return { error: `New track ${newTrack} is already in the plan.` };
    // NOTE: In a real implementation, this would trigger a recalculation of plan.totalDuration.

    const result = await this.plans.updateOne({ _id: plan, "trackList": oldTrack }, { $set: { "trackList.$": newTrack } });

    if (result.matchedCount === 0) {
      return { error: `Failed to find and replace track ${oldTrack}. It might have been removed by another operation.` };
    }

    const updatedPlan = await this.plans.findOne({ _id: plan });
    if (!updatedPlan) return { error: "Could not retrieve updated plan." };

    return { updatedPlan };
  }

  // ... (the rest of the original actions like finalize, validate, etc. would go here) ...
}
```

implement: This concept
\<concept\_spec>
concept MusicAssetCatalog \[TrackId]

purpose normalize and preserve track metadata and analysis features for a DJ’s library

principle after a track is registered, we look up its attributes and return the latest known metadata and features

state
a set of Tracks with
a set of Tags
a set of Features
the date and time the song was registered

a set of Tags with
an artistName String
a songTitle String
a songDuration Integer
an optional genre String

a set of Features with
a beatsPerMinute Float
a musicalKey String
a list of song Sections

actions
addTrack(track: Track)
requires true
effect adds the registered track to the catalog

removeTrack(id: String)
requires the track with id exists in the library
effect removes the registration of the track

getTrack(id: TrackId): (tags: Tags, features: Features)
requires the track exists
effect returns the attributes (tags and features) of a track

getTracks(ids: List<String>)
requires the tracks exist
effect retrieves an array of tracks from the catalog

getAllTracks()
requires true
effect retrieves all of the tracks from the catalog

searchTracks(filter: Filter): (ids: Set<TrackId>)
requires true
effect returns a set of tracks matching the constraints of the filter

updateTrack(id: String, updates: Partial<Track>): Track | undefined
requires track exists
effect updates the track or returns undefined if track isn't found

hasTrack(id: String)
requires true
effect returns the total number of tracks in the catalog

getTrackCount()
requires true
effect returns the total number of tracks in catalog

getTracksByGenre(genre: String)
requires true
effect returns all tracks whose genre matches genre

getTracksByArtist(artist: string)
requires true
effect returns all tracks whose artist matches artist

getTracksByBPMRange(min: number, max: number)
requires min ≤ max
effect returns all tracks with bpm in the inclusive range \[min, max]

getTracksByKey(key: CamelotKey)
requires true
effect returns all tracks whose key equals key

getCompatibleKeys(key: CamelotKey)
requires true
effect returns keys compatible with key per Camelot wheel (same, ±1, relative)

getTracksWithCompatibleKeys(key: CamelotKey)
requires true
effect returns all tracks whose key is compatible with key

getStatistics()
requires true
effect returns catalog statistics (counts, bpm range & averages, duration average, key & genre distributions) without modifying the catalog

clear()
requires true
effect removes all tracks from the catalog

importTracks(tracks: Track\[])
requires each element of tracks is a valid Track
effect adds all tracks to the catalog and returns the number imported

exportToJSON()
requires true
effect returns a JSON string encoding all tracks in the catalog

importFromJSON(json: string)
requires json is valid JSON encoding Track\[]
effect parses and imports tracks from json, returns the number imported; throws Error if parsing fails

\</concept\_spec>

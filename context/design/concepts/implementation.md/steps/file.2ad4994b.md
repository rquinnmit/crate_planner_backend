---
timestamp: 'Thu Oct 16 2025 23:45:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251016_234533.9af48e4b.md]]'
content_id: 2ad4994bbbaab75098ae5441533fe6494742b05372478cb6a86ff5d5af1e34d4
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
  isFinalized: boolean; // Added to support the immutable effect of finalize()
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
  // ACTIONS
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
      planDetails: {},
    };

    const result = await this.plans.insertOne(newPlan);
    if (!result.acknowledged) {
      return { error: "Failed to create plan in database." };
    }

    return { plan: newPlan };
  }

  /**
   * deriveIntentLLM(prompt: Prompt, seedTracks: List<TrackId>): (intent: DerivedIntent)
   *
   * **requires** plan exists and is valid
   * **effects** calls an LLM to process/analyze the information from the plan’s prompt and seed tracks; uses this information to generate a new intent that will include more structured constraints for track selection
   */
  async deriveIntentLLM({ prompt, seedTracks }: { prompt: Prompt; seedTracks: TrackId[] }): Promise<{ intent: DerivedIntentDoc } | { error: string }> {
    const promptDoc = await this.prompts.findOne({ _id: prompt });
    if (!promptDoc) {
      return { error: `Prompt with id ${prompt} not found.` };
    }

    try {
      const llmResult = await callLLM("deriveIntent", { prompt: promptDoc, seedTracks });

      const newIntent: DerivedIntentDoc = {
        _id: freshID(),
        sourcePrompt: prompt,
        ...llmResult,
      };

      const result = await this.derivedIntents.insertOne(newIntent);
      if (!result.acknowledged) {
        return { error: "Failed to save derived intent." };
      }

      return { intent: newIntent };
    } catch (e) {
      return { error: `LLM call failed: ${e.message}` };
    }
  }

  /**
   * generateCandidatePool(intent: DerivedIntent): (pool: CandidatePool)
   *
   * **requires** intent is valid
   * **effects** uses the intent and an LLM to produce a set of track candidates
   */
  async generateCandidatePool({ intent }: { intent: DerivedIntent }): Promise<{ pool: CandidatePoolDoc } | { error: string }> {
    const intentDoc = await this.derivedIntents.findOne({ _id: intent });
    if (!intentDoc) {
      return { error: `DerivedIntent with id ${intent} not found.` };
    }

    try {
      const llmResult = await callLLM("generateCandidates", { intent: intentDoc });

      const newPool: CandidatePoolDoc = {
        _id: freshID(),
        sourcePrompt: intentDoc.sourcePrompt,
        tracks: llmResult.tracks,
        filtersApplied: llmResult.filtersApplied,
      };

      const result = await this.candidatePools.insertOne(newPool);
      if (!result.acknowledged) {
        return { error: "Failed to save candidate pool." };
      }

      return { pool: newPool };
    } catch (e) {
      return { error: `LLM call failed: ${e.message}` };
    }
  }

  /**
   * sequencePlan(intent: DerivedIntent, pool: CandidatePool, seedTracks?: List<TrackId>): (plan: Plan)
   *
   * **requires** pool is nonempty
   * **effects** returns a plan with an ordered track list and duration
   */
  async sequencePlan({ intent, pool }: { intent: DerivedIntent; pool: CandidatePool }): Promise<{ plan: PlanDoc } | { error: string }> {
    const intentDoc = await this.derivedIntents.findOne({ _id: intent });
    if (!intentDoc) {
      return { error: `DerivedIntent with id ${intent} not found.` };
    }

    const poolDoc = await this.candidatePools.findOne({ _id: pool });
    if (!poolDoc || poolDoc.tracks.length === 0) {
      return { error: "Candidate pool not found or is empty." };
    }

    const planToUpdate = await this.plans.findOne({ prompt: intentDoc.sourcePrompt, isFinalized: false });
    if (!planToUpdate) {
      return { error: `An active plan for prompt ${intentDoc.sourcePrompt} not found.` };
    }

    try {
      const llmResult = await callLLM("sequence", { intent: intentDoc, pool: poolDoc });

      await this.plans.updateOne({ _id: planToUpdate._id }, { $set: { trackList: llmResult.trackList, totalDuration: llmResult.totalDuration, annotations: "Sequenced using candidate pool." } });

      const updatedPlan = await this.plans.findOne({ _id: planToUpdate._id });
      if (!updatedPlan) {
        return { error: "Could not retrieve updated plan." };
      }

      return { plan: updatedPlan };
    } catch (e) {
      return { error: `LLM call failed: ${e.message}` };
    }
  }

  /**
   * explainPlan(plan: Plan): (annotated: Plan)
   *
   * **requires** true
   * **effects** calls an LLM to generate human-readable annotations for the generated crate
   */
  async explainPlan({ plan }: { plan: Plan }): Promise<{ annotated: PlanDoc } | { error: string }> {
    const planDoc = await this.plans.findOne({ _id: plan });
    if (!planDoc) {
      return { error: `Plan with id ${plan} not found.` };
    }

    try {
      const llmResult = await callLLM("explain", { plan: planDoc });

      await this.plans.updateOne({ _id: planDoc._id }, { $set: { annotations: llmResult.annotations } });

      const annotatedPlan = await this.plans.findOne({ _id: planDoc._id });
      if (!annotatedPlan) {
        return { error: "Could not retrieve annotated plan." };
      }

      return { annotated: annotatedPlan };
    } catch (e) {
      return { error: `LLM call failed: ${e.message}` };
    }
  }

  /**
   * revisePlan(plan: Plan, instructions: String): (revised: Plan)
   *
   * **requires** the plan exists
   * **effects** calls an LLM to apply constrained edits to the plan; rechecks to make sure all applied constraints, both new and old, are conserved
   */
  async revisePlan({ plan, instructions }: { plan: Plan; instructions: string }): Promise<{ revised: PlanDoc } | { error: string }> {
    const planDoc = await this.plans.findOne({ _id: plan });
    if (!planDoc) {
      return { error: `Plan with id ${plan} not found.` };
    }
    if (planDoc.isFinalized) {
      return { error: "Cannot revise a finalized plan." };
    }

    try {
      const revisedPlanData = await callLLM("revise", { plan: planDoc, instructions });

      await this.plans.updateOne({ _id: planDoc._id }, { $set: { trackList: revisedPlanData.trackList, totalDuration: revisedPlanData.totalDuration, annotations: `Revised with instructions: "${instructions}"` } });

      const revisedPlan = await this.plans.findOne({ _id: planDoc._id });
      if (!revisedPlan) {
        return { error: "Could not retrieve revised plan." };
      }

      return { revised: revisedPlan };
    } catch (e) {
      return { error: `LLM call failed: ${e.message}` };
    }
  }

  /**
   * finalize(plan: Plan): ()
   *
   * **requires** plan.totalDuration is within tolerance and plan.trackList has no duplicate tracks
   * **effects** marks the plan as immutable and stores it for export
   */
  async finalize({ plan }: { plan: Plan }): Promise<Empty | { error: string }> {
    const validationResult = await this.validate({ plan });
    if (!validationResult.isValid) {
      return { error: `Plan is not valid for finalization: ${validationResult.errors?.join(", ")}` };
    }

    const result = await this.plans.updateOne({ _id: plan, isFinalized: false }, { $set: { isFinalized: true } });
    if (result.modifiedCount === 0) {
      return { error: "Failed to finalize plan. It might not exist or was already finalized." };
    }

    return {};
  }

  /**
   * validate(plan: Plan): (isValid: boolean, errors: List<String>?)
   *
   * **requires** the plan exists
   * **effects** checks if plan.totalDuration is within the tolerance limits, verifies that no duplicate tracks exist in plan.trackList, and verifies that all tracks exist in our asset catalog
   */
  async validate({ plan }: { plan: Plan }): Promise<{ isValid: boolean; errors?: string[] }> {
    const planDoc = await this.plans.findOne({ _id: plan });
    if (!planDoc) {
      return { isValid: false, errors: ["Plan not found."] };
    }

    const promptDoc = await this.prompts.findOne({ _id: planDoc.prompt });
    const errors: string[] = [];

    // Check 1: Duration tolerance (e.g., 10%)
    if (promptDoc?.targetDuration) {
      const tolerance = 0.1;
      const lowerBound = promptDoc.targetDuration * (1 - tolerance);
      const upperBound = promptDoc.targetDuration * (1 + tolerance);
      if (planDoc.totalDuration < lowerBound || planDoc.totalDuration > upperBound) {
        errors.push(`Total duration ${planDoc.totalDuration}s is outside the target range of ${lowerBound.toFixed(0)}-${upperBound.toFixed(0)}s.`);
      }
    }

    // Check 2: Duplicate tracks
    if (new Set(planDoc.trackList).size !== planDoc.trackList.length) {
      errors.push("Plan contains duplicate tracks.");
    }

    // Check 3: Asset catalog validity
    if (!(await areTracksValid(planDoc.trackList))) {
      errors.push("Plan contains one or more invalid tracks.");
    }

    return { isValid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  /**
   * setLLMSettings(settings: LLMSettings): ()
   *
   * **requires** true
   * **effects** updates the current settings of the LLM used
   */
  async setLLMSettings({ settings }: { settings: Omit<LLMSettingsDoc, "_id"> }): Promise<Empty> {
    await this.llmSettings.updateOne({ _id: "default" }, { $set: settings }, { upsert: true });
    return {};
  }
}
```

---
timestamp: 'Thu Oct 16 2025 23:53:44 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251016_235344.90a52882.md]]'
content_id: 5b4f6a45299cc7e61dfd5bc996e0d125d858d6ff5d248bafe08f71ca63612796
---

# response:

Of course. Based on the provided concept specification for `CratePlanningAI`, here are several recommended actions to add. These new actions focus on improving user control, lifecycle management, and providing more direct manipulation capabilities, which are often necessary to complement a purely LLM-driven workflow.

The suggested actions fall into two categories:

1. **Lifecycle and Management Actions**: To handle the creation and cleanup of the core entities.
2. **Manual Override and Direct Manipulation Actions**: To give users more fine-grained, predictable control over the plan without relying on the LLM for every small change.

***

### 1. Lifecycle and Management Actions

The current specification assumes a `Prompt` already exists when `createPlan` is called. Adding an action to create and manage prompts and plans makes the concept more self-contained and robust.

#### `createPrompt`

**Signature**: `createPrompt(tempoRange?: Tuple<Float>, targetKey?: String, targetGenre?: String, sampleTracks?: List<TrackId>, targetDuration?: Integer, notes?: String): (prompt: Prompt)`

**Rationale**: This is the logical starting point for the entire workflow. It formally creates the `Prompt` entity that all subsequent actions rely on. Without it, the application has no way to begin the crate planning process within this concept.

**Requires**:

* If `sampleTracks` are provided, they must be valid track IDs.

**Effects**:

* Creates a new `Prompt` document in the state with a unique ID.
* Populates the new `Prompt` with the provided arguments.
* Returns the ID of the newly created `Prompt`.

#### `archivePlan`

**Signature**: `archivePlan(plan: Plan): ()`

**Rationale**: Users will generate many plans, not all of which will be kept. This action provides a way to clean up old or unwanted plans. Using "archive" instead of "delete" suggests a soft-delete pattern, which is safer and allows for potential restoration later.

**Requires**:

* The `plan` must exist.

**Effects**:

* Marks the specified `Plan` as archived (e.g., by setting an `isArchived` flag to true). This removes it from active view but preserves it in the database.
* *(Note: A synchronization rule could be defined to also archive associated `CandidatePools` and `DerivedIntents` to maintain data hygiene.)*

***

### 2. Manual Override and Direct Manipulation Actions

Relying on the `revisePlan` LLM action for every small tweak can be slow, expensive, and sometimes less precise than direct manipulation. These actions empower the user to make specific, deterministic changes.

#### `editCandidatePool`

**Signature**: `editCandidatePool(pool: CandidatePool, addTracks?: List<TrackId>, removeTracks?: List<TrackId>): (updatedPool: CandidatePool)`

**Rationale**: The LLM's candidate generation is a powerful starting point, but users often have specific tracks in mind that the AI may have missed. This action allows them to manually curate the candidate pool *before* the final sequencing step, improving the quality of the final plan.

**Requires**:

* The `pool` must exist.
* Any tracks in `addTracks` must be valid track IDs.

**Effects**:

* Adds the tracks from `addTracks` to the `tracks` set of the specified `CandidatePool`.
* Removes the tracks from `removeTracks` from the `tracks` set of the specified `CandidatePool`.
* Returns the ID of the updated `CandidatePool`.

#### `reorderTrackInPlan`

**Signature**: `reorderTrackInPlan(plan: Plan, track: TrackId, newIndex: Integer): (updatedPlan: Plan)`

**Rationale**: This is a fundamental playlist feature. A user may like the tracks selected but disagree with the AI's ordering. This provides a direct, immediate way to adjust the sequence.

**Requires**:

* The `plan` must exist and not be finalized.
* The `track` must exist in the `plan.trackList`.
* `newIndex` must be a valid index within the bounds of the `plan.trackList`.

**Effects**:

* Moves the specified `track` to the `newIndex` position in the `plan.trackList`.
* Returns the ID of the updated `Plan`.

#### `replaceTrackInPlan`

**Signature**: `replaceTrackInPlan(plan: Plan, oldTrack: TrackId, newTrack: TrackId): (updatedPlan: Plan)`

**Rationale**: Allows for a direct swap of one track for another. This is more constrained and predictable than the open-ended `revisePlan` and useful when a user knows exactly which track they want to substitute.

**Requires**:

* The `plan` must exist and not be finalized.
* `oldTrack` must exist in the `plan.trackList`.
* `newTrack` must be a valid track ID and must not already be in the `plan.trackList` (to prevent duplicates).

**Effects**:

* Replaces the `oldTrack` with the `newTrack` at the same position in the `plan.trackList`.
* *(Note: This action should likely trigger a recalculation of `plan.totalDuration`.)*
* Returns the ID of the updated `Plan`.

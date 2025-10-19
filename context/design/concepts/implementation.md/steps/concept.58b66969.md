---
timestamp: 'Thu Oct 16 2025 23:45:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251016_234533.9af48e4b.md]]'
content_id: 58b669698337b12ac6a4f1176535d96d5b08e8fb17a47bef67befdc9318ea3ca
---

# concept: CratePlanningAI

* **concept**: CratePlanningAI \[TrackId, Prompt]
* **purpose**: produce an ordered song crate that satisfies the given prompt
* **principle**: a crate plan respects the constraints of the prompt, assembles a candidate pool, and selects/orders tracks to maximize the preferences in the prompt. the prompts are dissected and processed by the LLM.
* **state**:
  * a set of Prompts with an optional tempoRange Tuple<Float>, an optional targetKey String, an optional targetGenre String, an optional sampleTracks List<TrackId>, an optional targetDuration Integer, an optional notes String
  * a set of DerivedIntents with a tempoRange Tuple<Float>, an allowedKeys List<String>, a targetGenres List<String>, a duration Integer, a mixStyle String, a mustIncludeArtists List<String>, an avoidArtists List<String>, a mustIncludeTracks List<String>, an avoidTracks List<String>
  * a set of LLMSettings with a model String, a temperature Float, a promptTemplate String, an outputTemplate String
  * a set of Plans with a prompt Prompt, a trackList List<TrackId>, an annotations String, a totalDuration Integer, a planDetails with an optional llmModel String, an optional llmTraceId String
  * a set of CandidatePools with a sourcePrompt Prompt, a set of tracks Set<TrackId>, a filtersApplied String
* **actions**:
  * createPlan(prompt: Prompt, seedTracks: List<TrackId>): (plan: Plan)
  * deriveIntentLLM(prompt: Prompt, seedTracks: List<TrackId>): (intent: DerivedIntent)
  * generateCandidatePool(intent: DerivedIntent): (pool: CandidatePool)
  * sequencePlan(intent: DerivedIntent, pool: CandidatePool, seedTracks: List<TrackId>?): (plan: Plan)
  * explainPlan(plan: Plan): (annotated: Plan)
  * revisePlan(plan: Plan, instructions: String): (revised: Plan)
  * finalize(plan: Plan): ()
  * validate(plan: Plan): (isValid: boolean, errors: List<String>?)
  * setLLMSettings(settings: LLMSettings): ()

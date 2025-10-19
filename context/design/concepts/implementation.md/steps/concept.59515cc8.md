---
timestamp: 'Fri Oct 17 2025 01:09:29 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251017_010929.d52a930c.md]]'
content_id: 59515cc8be26e6e0bd604be1c7d09e40bb05623b3772dd5d4a786648ae384e18
---

# concept: ExternalAssetImport

* **concept**: ExternalAssetImport \[Track, SourceId]

* **purpose**: To provide a standardized, reliable, and rate-limit-aware mechanism for fetching track data from external APIs, normalizing it into a consistent format, and importing it into a local asset catalog.

* **principle**: A user configures the importer with the API credentials and base URL for an external service (e.g., Beatport). When the user initiates an import with a search query, the importer makes authenticated, rate-limited requests to the external API, retrieves the raw data, normalizes it into the local catalog's format, checks for duplicates, and adds the new, valid tracks to the catalog, returning a summary of how many tracks succeeded or failed.

* **state**:
  * a set of Sources with
    * a sourceName String (e.g., 'beatport', 'spotify')
    * an apiConfig with
      * a baseURL String
      * an optional apiKey String
      * an optional clientId String
      * an optional clientSecret String
    * an optional rateLimitConfig with
      * a requestsPerSecond Number
      * a requestsPerMinute Number
      * a retryAttempts Number
      * a retryDelayMs Number
    * a requestCount Integer
    * a lastRequestTime Timestamp
  * a mapping from external SourceId to internal TrackId (implicitly managed by the `generateTrackId` logic)

* **actions**:
  * **configureSource**(sourceName: String, apiConfig: APIConfig, rateLimitConfig?: RateLimitConfig): (source: Source)
    * **requires**: `apiConfig` contains a valid `baseURL`.
    * **effects**: Establishes a new import source configuration in the system's state; initializes its `requestCount` to 0; returns a handle to the configured source.

  * **searchAndImport**(source: Source, query: String, limit?: Integer): (result: ImportResult)
    * **requires**: The `source` is configured and its credentials are valid.
    * **effects**:
      * Makes one or more rate-limited requests to the external API associated with the `source`.
      * For each external track found, it normalizes the data into the local `Track` format.
      * For each normalized track, it checks if an equivalent track already exists in the local `MusicAssetCatalog`.
      * Adds any new, valid tracks to the catalog.
      * Returns an `ImportResult` summarizing the number of tracks imported, the number that failed, and any errors or warnings encountered.

  * **importById**(source: Source, externalId: SourceId): (result: ImportResult)
    * **requires**: The `source` is configured and its credentials are valid.
    * **effects**:
      * Makes a rate-limited request to the external API to fetch a single track by its `externalId`.
      * Normalizes the resulting data into the local `Track` format.
      * If the track does not already exist in the `MusicAssetCatalog`, it is added.
      * Returns an `ImportResult` detailing the outcome of the single import operation.

  * **getRequestCount**(source: Source): (count: Integer)
    * **requires**: The `source` exists.
    * **effects**: Returns the total number of API requests made using this `source` since it was configured or last reset.

  * **resetRequestCount**(source: Source): ()
    * **requires**: The `source` exists.
    * **effects**: Resets the `requestCount` for the specified `source` to 0.

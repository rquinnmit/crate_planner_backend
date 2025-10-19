---
timestamp: 'Fri Oct 17 2025 14:11:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251017_141118.d51df476.md]]'
content_id: 6a40abf47dd718f690a068aacab7d5527506c22587aa5fc4f05eb93a9b6e7f55
---

# response:

concept ExternalAssetImport \[Track, SourceId]

purpose To provide a standardized, reliable, and rate-limit-aware mechanism for fetching track data from external APIs, normalizing it into a consistent format, and importing it into a local asset catalog.

principle A user configures the importer with the API credentials and base URL for an external service. When the user initiates an import with a search query, the importer makes authenticated, rate-limited requests to the external API, retrieves the raw data, normalizes it into the local catalog's format, checks for duplicates, and adds the new, valid tracks to the catalog, returning a summary of how many tracks succeeded or failed.

state a set of Sources with a sourceName String, an apiConfig with a baseURL String, an optional apiKey String, an optional clientId String, and an optional clientSecret String. Each source also has an optional rateLimitConfig with a requestsPerSecond Number, a requestsPerMinute Number, a retryAttempts Number, and a retryDelayMs Number. Each source maintains a requestCount Integer and a lastRequestTime Timestamp. There is also a mapping from external SourceId to internal TrackId.

actions The action configureSource has the signature configureSource(sourceName: String, apiConfig: APIConfig, rateLimitConfig?: RateLimitConfig): (source: Source). It requires that the apiConfig contains a valid baseURL. Its effects are to establish a new import source configuration in the system's state, initialize its requestCount to 0, and return a handle to the configured source. The action searchAndImport has the signature searchAndImport(source: Source, query: String, limit?: Integer): (result: ImportResult). It requires that the source is configured and its credentials are valid. Its effects are to make one or more rate-limited requests to the external API associated with the source, normalize the data for each external track found into the local Track format, check if an equivalent track already exists in the local MusicAssetCatalog for each normalized track, add any new, valid tracks to the catalog, and return an ImportResult summarizing the number of tracks imported, the number that failed, and any errors or warnings encountered. The action importById has the signature importById(source: Source, externalId: SourceId): (result: ImportResult). It requires that the source is configured and its credentials are valid. Its effects are to make a rate-limited request to the external API to fetch a single track by its externalId, normalize the resulting data into the local Track format, add the track to the MusicAssetCatalog if it does not already exist, and return an ImportResult detailing the outcome of the single import operation. The action getRequestCount has the signature getRequestCount(source: Source): (count: Integer). It requires that the source exists. Its effect is to return the total number of API requests made using this source since it was configured or last reset. The action resetRequestCount has the signature resetRequestCount(source: Source): (). It requires that the source exists. Its effect is to reset the requestCount for the specified source to 0.

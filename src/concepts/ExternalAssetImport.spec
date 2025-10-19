<concept_spec>
concept ExternalAssetImport [Track, ExternalTrackData] -> Implementation in base_importer.ts, Testing in importers.test.ts

purpose to provide a standardized and reliable mechanism for fetching track data
  from external APIs, normalizing into a consistent format, and importing into a MongoDB database
    for use in DJ crate planning.

principle a user initiates an import with a database connection and API configuration. when the user
  initiates an import with a search query or specific track ID, the importer makes requests to the external API,
    retrieves raw track data, normalizes the data, checks for duplicates, and adds new valid tracks to the MongoDB collection.

state
a set of Importers with
  a database connection Db
  a tracksCollection Collection<Tracks>
  a config APIConfig

an apiConfig with
  a baseURL String
  an optional apiKey String
  an optional clientId String
  an optional clientSecret String
  an optional rateLimit

actions
createImporter(db: Db, apiConfig: APIConfig, rateLimitConfig?: RateLimitConfig): (importer: Importer)
requires apiConfig contains a valid baseURL and database connection is active
effect instantiates a new importer with the provided configuration

searchAndImport(importer: Importer, query: String, limit?: Number): (result: ImporterResult)
requires importer is properly configured, credentials are valid
effect makes one or more requeststs to an external API using the search query, retrieves track data, normalizes
  tracks into the local format, check for duplicates in the MongoDB database, and adds valid tracks to the database

importById(importer: Importer, externalId: String): (result: ImportResult)
requires importer is properly configured, credentials are valid
effect makes request to external API to fetch a single track by its externalId, normalizes, and adds the track to the MongoDB database
  if it doesn't already exist

importByIds(importer: Importer, externalIds: List<String>): (result: ImportResult)
requires importer is properly configured, credentials are valid
effect makes batch rate-limited requests to the external API for multiple track IDs, normalizes the resulting data for each track, adds new valid tracks to the MongoDB collection, and returns an ImportResult summarizing the batch import operation

importFromPlaylist(importer: Importer, playlistId: String, limit?: Integer): (result: ImportResult)
requires importer is properly configured, credentials are valid
effect makes rate-limited requests to fetch all tracks from a specific playlist, normalizes each track into the local format, adds new valid tracks to the MongoDB collection, and returns an ImportResult summarizing the playlist import operation

getRequestCount(importer: Importer): (count: Integer)
requires importer exists
effect returns the total number of API requests made using this importer since it was created or last reset

resetRequestCount(importer: Importer): ()
requires importer exists
effect resets the requestCount for the specified importer to 0

</concept_spec>
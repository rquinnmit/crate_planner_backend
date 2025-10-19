---
timestamp: 'Fri Oct 17 2025 01:06:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251017_010613.2817e601.md]]'
content_id: 95e0077d5eba1e3b1e83072a3be98ee459849342cab7af96fc66bb2769188af3
---

# concept: MusicAssetCatalog

* **concept**: MusicAssetCatalog \[TrackId]
* **purpose**: normalize and preserve track metadata and analysis features for a DJ’s library
* **principle**: after a track is registered, we look up its attributes and return the latest known metadata and features
* **state**:
  * a set of Tracks with a set of Tags, a set of Features, and the date and time the song was registered
  * a set of Tags with an artistName String, a songTitle String, a songDuration Integer, an optional genre String
  * a set of Features with a beatsPerMinute Float, a musicalKey String, and a list of song Sections
* **actions**:
  * addTrack(track: Track)
  * removeTrack(id: String)
  * getTrack(id: TrackId): (tags: Tags, features: Features)
  * getTracks(ids: List<String>)
  * getAllTracks()
  * searchTracks(filter: Filter): (ids: Set<TrackId>)
  * updateTrack(id: String, updates: Partial<Track>): Track | undefined
  * hasTrack(id: String)
  * getTrackCount()
  * getTracksByGenre(genre: String)
  * getTracksByArtist(artist: string)
  * getTracksByBPMRange(min: number, max: number)
  * getTracksByKey(key: CamelotKey)
  * getCompatibleKeys(key: CamelotKey)
  * getTracksWithCompatibleKeys(key: CamelotKey)
  * getStatistics()
  * clear()
  * importTracks(tracks: Track\[])
  * exportToJSON()
  * importFromJSON(json: string)

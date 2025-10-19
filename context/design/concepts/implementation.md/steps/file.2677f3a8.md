---
timestamp: 'Fri Oct 17 2025 01:06:13 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251017_010613.2817e601.md]]'
content_id: 2677f3a869654a8819cc34609fe7a3ce39ca1f5aabfb13838efbf15f6449e2e8
---

# file: src/MusicAssetCatalog/MusicAssetCatalogConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

const PREFIX = "MusicAssetCatalog" + ".";

// #############################################################################
// TYPE DEFINITIONS
// #############################################################################

// Generic type parameter
type TrackId = ID;

// Type for Camelot musical keys
type CamelotKey =
  | "1A" | "1B" | "2A" | "2B" | "3A" | "3B" | "4A" | "4B"
  | "5A" | "5B" | "6A" | "6B" | "7A" | "7B" | "8A" | "8B"
  | "9A" | "9B" | "10A" | "10B" | "11A" | "11B" | "12A" | "12B";

// Interface for a section of a song (e.g., intro, chorus)
interface SongSection {
  start: number; // in seconds
  end: number;   // in seconds
  name: string;
}

/**
 * a set of Tags with an artistName, songTitle, songDuration, optional genre
 */
interface Tags {
  artistName: string;
  songTitle: string;
  songDuration: number; // in seconds
  genre?: string;
}

/**
 * a set of Features with a beatsPerMinute, musicalKey, and list of song Sections
 */
interface Features {
  beatsPerMinute: number;
  musicalKey: CamelotKey;
  sections: SongSection[];
}

/**
 * Represents a Track object used for creation and updates.
 */
export type Track = {
  tags: Tags;
  features: Features;
};

/**
 * a set of Tracks with Tags, Features, and registration date
 */
interface TrackDoc extends Track {
  _id: TrackId;
  registeredAt: Date;
}

/**
 * A filter object for the searchTracks action.
 */
export type SearchFilter = {
  artistName?: string;
  songTitle?: string;
  genre?: string;
  minBPM?: number;
  maxBPM?: number;
  key?: CamelotKey;
};

// #############################################################################
// HELPER FUNCTIONS
// #############################################################################

const camelotWheel: Record<CamelotKey, { prev: CamelotKey; next: CamelotKey; relative: CamelotKey }> = {
  "1A": { prev: "12A", next: "2A", relative: "1B" }, "2A": { prev: "1A", next: "3A", relative: "2B" }, "3A": { prev: "2A", next: "4A", relative: "3B" }, "4A": { prev: "3A", next: "5A", relative: "4B" }, "5A": { prev: "4A", next: "6A", relative: "5B" }, "6A": { prev: "5A", next: "7A", relative: "6B" }, "7A": { prev: "6A", next: "8A", relative: "7B" }, "8A": { prev: "7A", next: "9A", relative: "8B" }, "9A": { prev: "8A", next: "10A", relative: "9B" }, "10A": { prev: "9A", next: "11A", relative: "10B" }, "11A": { prev: "10A", next: "12A", relative: "11B" }, "12A": { prev: "11A", next: "1A", relative: "12B" },
  "1B": { prev: "12B", next: "2B", relative: "1A" }, "2B": { prev: "1B", next: "3B", relative: "2A" }, "3B": { prev: "2B", next: "4B", relative: "3A" }, "4B": { prev: "3B", next: "5B", relative: "4A" }, "5B": { prev: "4B", next: "6B", relative: "5A" }, "6B": { prev: "5B", next: "7B", relative: "6A" }, "7B": { prev: "6B", next: "8B", relative: "7A" }, "8B": { prev: "7B", next: "9B", relative: "8A" }, "9B": { prev: "8B", next: "10B", relative: "9A" }, "10B": { prev: "9B", next: "11B", relative: "10A" }, "11B": { prev: "10B", next: "12B", relative: "11A" }, "12B": { prev: "11B", next: "1B", relative: "12A" },
};

/**
 * concept: MusicAssetCatalog
 * purpose: normalize and preserve track metadata and analysis features for a DJ’s library
 */
export default class MusicAssetCatalogConcept {
  private readonly tracks: Collection<TrackDoc>;

  constructor(private readonly db: Db) {
    this.tracks = db.collection(PREFIX + "tracks");
  }

  /**
   * addTrack(track: Track): (track: TrackDoc)
   * **requires** true
   * **effects** adds the registered track to the catalog
   */
  async addTrack({ track }: { track: Track }): Promise<{ track: TrackDoc } | { error: string }> {
    const newTrack: TrackDoc = {
      _id: freshID(),
      ...track,
      registeredAt: new Date(),
    };
    const result = await this.tracks.insertOne(newTrack);
    if (!result.acknowledged) {
      return { error: "Failed to add track to the database." };
    }
    return { track: newTrack };
  }

  /**
   * removeTrack(id: TrackId): ()
   * **requires** the track with id exists in the library
   * **effects** removes the registration of the track
   */
  async removeTrack({ id }: { id: TrackId }): Promise<Empty | { error: string }> {
    const result = await this.tracks.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return { error: `Track with id ${id} not found.` };
    }
    return {};
  }

  /**
   * getTrack(id: TrackId): (track: TrackDoc)
   * **requires** the track exists
   * **effects** returns the attributes (tags and features) of a track
   */
  async getTrack({ id }: { id: TrackId }): Promise<{ track: TrackDoc } | { error: string }> {
    const track = await this.tracks.findOne({ _id: id });
    if (!track) {
      return { error: `Track with id ${id} not found.` };
    }
    return { track };
  }

  /**
   * getTracks(ids: TrackId[]): (tracks: TrackDoc[])
   * **requires** the tracks exist
   * **effects** retrieves an array of tracks from the catalog
   */
  async getTracks({ ids }: { ids: TrackId[] }): Promise<{ tracks: TrackDoc[] }> {
    const tracks = await this.tracks.find({ _id: { $in: ids } }).toArray();
    return { tracks };
  }

  /**
   * getAllTracks(): (tracks: TrackDoc[])
   * **requires** true
   * **effects** retrieves all of the tracks from the catalog
   */
  async getAllTracks(): Promise<{ tracks: TrackDoc[] }> {
    const tracks = await this.tracks.find({}).toArray();
    return { tracks };
  }

  /**
   * searchTracks(filter: Filter): (ids: TrackId[])
   * **requires** true
   * **effects** returns a set of track IDs matching the constraints of the filter
   */
  async searchTracks({ filter }: { filter: SearchFilter }): Promise<{ ids: TrackId[] }> {
    const query: any = {};
    if (filter.artistName) query["tags.artistName"] = { $regex: filter.artistName, $options: "i" };
    if (filter.songTitle) query["tags.songTitle"] = { $regex: filter.songTitle, $options: "i" };
    if (filter.genre) query["tags.genre"] = { $regex: filter.genre, $options: "i" };
    if (filter.key) query["features.musicalKey"] = filter.key;
    if (filter.minBPM || filter.maxBPM) {
      query["features.beatsPerMinute"] = {};
      if (filter.minBPM) query["features.beatsPerMinute"].$gte = filter.minBPM;
      if (filter.maxBPM) query["features.beatsPerMinute"].$lte = filter.maxBPM;
    }

    const matchingDocs = await this.tracks.find(query, { projection: { _id: 1 } }).toArray();
    return { ids: matchingDocs.map((doc) => doc._id) };
  }

  /**
   * updateTrack(id: TrackId, updates: Partial<Track>): (track: TrackDoc)
   * **requires** track exists
   * **effects** updates the track or returns an error if track isn't found
   */
  async updateTrack({ id, updates }: { id: TrackId; updates: Partial<Track> }): Promise<{ track: TrackDoc } | { error: string }> {
    // Flatten the updates for use with $set
    const flattenedUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === "object" && value !== null) {
        for (const [subKey, subValue] of Object.entries(value)) {
          flattenedUpdates[`${key}.${subKey}`] = subValue;
        }
      } else {
        flattenedUpdates[key] = value;
      }
    }

    const result = await this.tracks.findOneAndUpdate({ _id: id }, { $set: flattenedUpdates }, { returnDocument: "after" });
    if (!result) {
      return { error: `Track with id ${id} not found.` };
    }
    return { track: result };
  }

  /**
   * hasTrack(id: TrackId): (exists: boolean)
   * **requires** true
   * **effects** returns true if a track with the given id exists, false otherwise
   * NOTE: The original spec's effect for this action was ambiguous. This implementation aligns with the action name.
   */
  async hasTrack({ id }: { id: TrackId }): Promise<{ exists: boolean }> {
    const count = await this.tracks.countDocuments({ _id: id });
    return { exists: count > 0 };
  }

  /**
   * getTrackCount(): (count: number)
   * **requires** true
   * **effects** returns the total number of tracks in the catalog
   */
  async getTrackCount(): Promise<{ count: number }> {
    const count = await this.tracks.countDocuments();
    return { count };
  }

  /**
   * getTracksByGenre(genre: String): (tracks: TrackDoc[])
   * **requires** true
   * **effects** returns all tracks whose genre matches genre
   */
  async getTracksByGenre({ genre }: { genre: string }): Promise<{ tracks: TrackDoc[] }> {
    const tracks = await this.tracks.find({ "tags.genre": genre }).toArray();
    return { tracks };
  }

  /**
   * getTracksByArtist(artist: string): (tracks: TrackDoc[])
   * **requires** true
   * **effects** returns all tracks whose artist matches artist
   */
  async getTracksByArtist({ artist }: { artist: string }): Promise<{ tracks: TrackDoc[] }> {
    const tracks = await this.tracks.find({ "tags.artistName": artist }).toArray();
    return { tracks };
  }

  /**
   * getTracksByBPMRange(min: number, max: number): (tracks: TrackDoc[])
   * **requires** min ≤ max
   * **effects** returns all tracks with bpm in the inclusive range [min, max]
   */
  async getTracksByBPMRange({ min, max }: { min: number; max: number }): Promise<{ tracks: TrackDoc[] } | { error: string }> {
    if (min > max) {
      return { error: "Minimum BPM cannot be greater than maximum BPM." };
    }
    const tracks = await this.tracks.find({ "features.beatsPerMinute": { $gte: min, $lte: max } }).toArray();
    return { tracks };
  }

  /**
   * getTracksByKey(key: CamelotKey): (tracks: TrackDoc[])
   * **requires** true
   * **effects** returns all tracks whose key equals key
   */
  async getTracksByKey({ key }: { key: CamelotKey }): Promise<{ tracks: TrackDoc[] }> {
    const tracks = await this.tracks.find({ "features.musicalKey": key }).toArray();
    return { tracks };
  }

  /**
   * getCompatibleKeys(key: CamelotKey): (keys: CamelotKey[])
   * **requires** true
   * **effects** returns keys compatible with key per Camelot wheel (same, ±1, relative)
   */
  async getCompatibleKeys({ key }: { key: CamelotKey }): Promise<{ keys: CamelotKey[] }> {
    const compatible = camelotWheel[key];
    const keys = compatible ? [key, compatible.prev, compatible.next, compatible.relative] : [key];
    return { keys };
  }

  /**
   * getTracksWithCompatibleKeys(key: CamelotKey): (tracks: TrackDoc[])
   * **requires** true
   * **effects** returns all tracks whose key is compatible with key
   */
  async getTracksWithCompatibleKeys({ key }: { key: CamelotKey }): Promise<{ tracks: TrackDoc[] }> {
    const { keys } = await this.getCompatibleKeys({ key });
    const tracks = await this.tracks.find({ "features.musicalKey": { $in: keys } }).toArray();
    return { tracks };
  }

  /**
   * getStatistics(): (stats: object)
   * **requires** true
   * **effects** returns catalog statistics without modifying the catalog
   */
  async getStatistics(): Promise<{ stats: any }> {
    const aggregationResult = await this.tracks.aggregate([
      {
        $facet: {
          totalTracks: [{ $count: "count" }],
          bpmStats: [{ $group: { _id: null, avg: { $avg: "$features.beatsPerMinute" }, min: { $min: "$features.beatsPerMinute" }, max: { $max: "$features.beatsPerMinute" } } }],
          durationStats: [{ $group: { _id: null, avg: { $avg: "$tags.songDuration" } } }],
          keyDistribution: [{ $group: { _id: "$features.musicalKey", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          genreDistribution: [{ $match: { "tags.genre": { $ne: null } } }, { $group: { _id: "$tags.genre", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        },
      },
    ]).toArray();

    const result = aggregationResult[0];
    const stats = {
      totalTracks: result.totalTracks[0]?.count ?? 0,
      bpm: {
        average: result.bpmStats[0]?.avg ?? 0,
        min: result.bpmStats[0]?.min ?? 0,
        max: result.bpmStats[0]?.max ?? 0,
      },
      duration: {
        average: result.durationStats[0]?.avg ?? 0,
      },
      keyDistribution: result.keyDistribution.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      genreDistribution: result.genreDistribution.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    };
    return { stats };
  }

  /**
   * clear(): ()
   * **requires** true
   * **effects** removes all tracks from the catalog
   */
  async clear(): Promise<Empty> {
    await this.tracks.deleteMany({});
    return {};
  }

  /**
   * importTracks(tracks: Track[]): (count: number)
   * **requires** each element of tracks is a valid Track
   * **effects** adds all tracks to the catalog and returns the number imported
   */
  async importTracks({ tracks }: { tracks: Track[] }): Promise<{ count: number } | { error: string }> {
    if (tracks.length === 0) {
      return { count: 0 };
    }
    const newDocs: TrackDoc[] = tracks.map((track) => ({
      ...track,
      _id: freshID(),
      registeredAt: new Date(),
    }));
    const result = await this.tracks.insertMany(newDocs);
    return { count: result.insertedCount };
  }

  /**
   * exportToJSON(): (json: string)
   * **requires** true
   * **effects** returns a JSON string encoding all tracks in the catalog
   */
  async exportToJSON(): Promise<{ json: string }> {
    const allTracks = await this.tracks.find({}).toArray();
    return { json: JSON.stringify(allTracks, null, 2) };
  }

  /**
   * importFromJSON(json: string): (count: number)
   * **requires** json is valid JSON encoding Track[]
   * **effects** parses and imports tracks, returns the number imported; throws Error if parsing fails
   */
  async importFromJSON({ json }: { json: string }): Promise<{ count: number } | { error: string }> {
    try {
      const tracksToImport: Track[] = JSON.parse(json);
      // Basic validation
      if (!Array.isArray(tracksToImport)) {
        return { error: "JSON does not represent an array of tracks." };
      }
      return this.importTracks({ tracks: tracksToImport });
    } catch (e) {
      return { error: `Failed to parse JSON: ${e.message}` };
    }
  }
}
```

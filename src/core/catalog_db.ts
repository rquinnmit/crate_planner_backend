/**
 * MongoDB-backed MusicAssetCatalog
 *
 * Provides the same interface as MusicAssetCatalog but persists to MongoDB
 */

import { Collection, Db } from "mongodb";
import { CamelotKey, Track, TrackFilter } from "./track.ts";
import { getCompatibleKeys } from "../utils/camelot.ts";

export class MusicAssetCatalogDB {
  private tracks: Collection<Track>;

  constructor(private db: Db) {
    this.tracks = db.collection<Track>("tracks");
  }

  /**
   * Add a track to the catalog (register)
   */
  async addTrack(track: Track): Promise<Track> {
    const now = new Date();
    const registeredTrack: Track = {
      ...track,
      registeredAt: track.registeredAt || now,
      updatedAt: now,
    };

    await this.tracks.updateOne(
      { id: track.id },
      { $set: registeredTrack },
      { upsert: true },
    );

    return registeredTrack;
  }

  /**
   * Remove a track from the catalog
   */
  async removeTrack(id: string): Promise<boolean> {
    const result = await this.tracks.deleteOne({ id });
    return result.deletedCount > 0;
  }

  /**
   * Get a single track by ID
   */
  async getTrack(id: string): Promise<Track | null> {
    return await this.tracks.findOne({ id });
  }

  /**
   * Get multiple tracks by IDs
   */
  async getTracks(ids: string[]): Promise<Track[]> {
    return await this.tracks.find({ id: { $in: ids } }).toArray();
  }

  /**
   * Get all tracks in the catalog
   */
  async getAllTracks(): Promise<Track[]> {
    return await this.tracks.find({}).toArray();
  }

  /**
   * Search tracks with filters
   */
  async searchTracks(filter: TrackFilter = {}): Promise<Track[]> {
    const query: any = {};

    // Filter by specific IDs
    if (filter.ids && filter.ids.length > 0) {
      query.id = { $in: filter.ids };
    }

    // Filter by genre (case insensitive)
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

    // Filter by single artist (case insensitive)
    if (filter.artist) {
      query.artist = { $regex: new RegExp(`^${filter.artist}$`, "i") };
    }

    // Filter by multiple artists (case insensitive)
    if (filter.artists && filter.artists.length > 0) {
      query.artist = {
        $in: filter.artists.map((a) => new RegExp(`^${a}$`, "i")),
      };
    }

    // Exclude specific artists
    if (filter.excludeArtists && filter.excludeArtists.length > 0) {
      query.artist = {
        $nin: filter.excludeArtists.map((a) => new RegExp(`^${a}$`, "i")),
      };
    }

    return await this.tracks.find(query).toArray();
  }

  /**
   * Update an existing track's metadata
   */
  async updateTrack(
    id: string,
    updates: Partial<Track>,
  ): Promise<Track | null> {
    const result = await this.tracks.findOneAndUpdate(
      { id },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Check if a track exists in the catalog
   */
  async hasTrack(id: string): Promise<boolean> {
    const count = await this.tracks.countDocuments({ id });
    return count > 0;
  }

  /**
   * Get the total number of tracks in the catalog
   */
  async getTrackCount(): Promise<number> {
    return await this.tracks.countDocuments({});
  }

  /**
   * Get tracks by genre
   */
  async getTracksByGenre(genre: string): Promise<Track[]> {
    return await this.searchTracks({ genre });
  }

  /**
   * Get tracks by artist
   */
  async getTracksByArtist(artist: string): Promise<Track[]> {
    return await this.searchTracks({ artist });
  }

  /**
   * Get tracks in a BPM range
   */
  async getTracksByBPMRange(min: number, max: number): Promise<Track[]> {
    return await this.searchTracks({ bpmRange: { min, max } });
  }

  /**
   * Get tracks with a specific key
   */
  async getTracksByKey(key: CamelotKey): Promise<Track[]> {
    return await this.searchTracks({ key });
  }

  /**
   * Get compatible keys for harmonic mixing
   */
  getCompatibleKeys(key: CamelotKey): CamelotKey[] {
    return getCompatibleKeys(key);
  }

  /**
   * Get tracks with keys compatible with the given key
   */
  async getTracksWithCompatibleKeys(key: CamelotKey): Promise<Track[]> {
    const compatibleKeys = this.getCompatibleKeys(key);
    return await this.searchTracks({ keys: compatibleKeys });
  }

  /**
   * Get catalog statistics
   */
  async getStatistics(): Promise<{
    totalTracks: number;
    genres: Map<string, number>;
    bpmRange: { min: number; max: number };
    averageBPM: number;
    averageDuration: number;
    keyDistribution: Map<CamelotKey, number>;
  }> {
    const tracks = await this.getAllTracks();

    if (tracks.length === 0) {
      return {
        totalTracks: 0,
        genres: new Map(),
        bpmRange: { min: 0, max: 0 },
        averageBPM: 0,
        averageDuration: 0,
        keyDistribution: new Map(),
      };
    }

    // Genre distribution
    const genres = new Map<string, number>();
    tracks.forEach((track) => {
      if (track.genre) {
        genres.set(track.genre, (genres.get(track.genre) || 0) + 1);
      }
    });

    // BPM statistics
    const bpms = tracks.map((t) => t.bpm);
    const minBPM = Math.min(...bpms);
    const maxBPM = Math.max(...bpms);
    const avgBPM = bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length;

    // Duration statistics
    const durations = tracks.map((t) => t.duration_sec);
    const avgDuration = durations.reduce((sum, dur) => sum + dur, 0) /
      durations.length;

    // Key distribution
    const keyDistribution = new Map<CamelotKey, number>();
    tracks.forEach((track) => {
      keyDistribution.set(track.key, (keyDistribution.get(track.key) || 0) + 1);
    });

    return {
      totalTracks: tracks.length,
      genres,
      bpmRange: { min: minBPM, max: maxBPM },
      averageBPM: Math.round(avgBPM * 10) / 10,
      averageDuration: Math.round(avgDuration),
      keyDistribution,
    };
  }

  /**
   * Clear all tracks from the catalog
   */
  async clear(): Promise<void> {
    await this.tracks.deleteMany({});
  }

  /**
   * Import tracks in bulk
   */
  async importTracks(tracks: Track[]): Promise<number> {
    if (tracks.length === 0) return 0;

    const operations = tracks.map((track) => ({
      updateOne: {
        filter: { id: track.id },
        update: {
          $set: {
            ...track,
            registeredAt: track.registeredAt || new Date(),
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await this.tracks.bulkWrite(operations);
    return result.upsertedCount + result.modifiedCount;
  }

  /**
   * Export all tracks as JSON
   */
  async exportToJSON(): Promise<string> {
    const tracks = await this.getAllTracks();
    return JSON.stringify(tracks, null, 2);
  }

  /**
   * Import tracks from JSON
   */
  async importFromJSON(json: string): Promise<number> {
    try {
      const tracks = JSON.parse(json) as Track[];
      return await this.importTracks(tracks);
    } catch (error) {
      throw new Error(
        `Failed to import tracks from JSON: ${(error as Error).message}`,
      );
    }
  }
}

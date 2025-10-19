/**
 * Export Module - Unified interface for all exporters
 *
 * Provides convenient access to Rekordbox and Serato exporters
 * with a consistent API.
 */

// Base exporter
export { BaseExporter } from "./base_exporter.ts";
export type { ExportResult } from "./base_exporter.ts";

// Rekordbox exporter
export { exportToRekordbox, RekordboxExporter } from "./rekordbox_exporter.ts";
export type { RekordboxExportOptions } from "./rekordbox_exporter.ts";

// Serato exporter
export { exportToSerato, SeratoExporter } from "./serato_exporter.ts";
export type { SeratoExportOptions } from "./serato_exporter.ts";

import { CratePlan } from "../core/crate_planner.ts";
import { Db } from "mongodb";
import { RekordboxExporter } from "./rekordbox_exporter.ts";
import { SeratoExporter } from "./serato_exporter.ts";
import { ExportResult } from "./base_exporter.ts";

/**
 * Supported DJ software platforms
 */
export type DJPlatform = "rekordbox" | "serato";

/**
 * Universal export options
 */
export interface UniversalExportOptions {
  platform: DJPlatform;
  outputPath: string;
  playlistName?: string;
  format?: "m3u8" | "xml" | "csv" | "txt";
  includeMetadata?: boolean;
  relativePaths?: boolean;
}

/**
 * Universal exporter class - handles export to any supported platform
 */
export class UniversalExporter {
  private rekordboxExporter: RekordboxExporter;
  private seratoExporter: SeratoExporter;

  constructor(db: Db) {
    this.rekordboxExporter = new RekordboxExporter(db);
    this.seratoExporter = new SeratoExporter(db);
  }

  /**
   * Export a plan to any supported platform
   *
   * @param plan - Crate plan to export
   * @param options - Export options
   * @returns Export result
   */
  export(
    plan: CratePlan,
    options: UniversalExportOptions,
  ): Promise<ExportResult> {
    if (options.platform === "rekordbox") {
      const format = (options.format === "xml" || options.format === "m3u8")
        ? options.format
        : "m3u8";

      return this.rekordboxExporter.export(plan, {
        format,
        outputPath: options.outputPath,
        playlistName: options.playlistName,
        includeMetadata: options.includeMetadata,
        relativePaths: options.relativePaths,
      });
    } else {
      const format = (options.format === "csv" || options.format === "txt" ||
          options.format === "m3u8")
        ? options.format
        : "m3u8";

      return this.seratoExporter.export(plan, {
        format,
        outputPath: options.outputPath,
        crateName: options.playlistName,
        includeMetadata: options.includeMetadata,
        relativePaths: options.relativePaths,
      });
    }
  }

  /**
   * Export to both platforms simultaneously
   *
   * @param plan - Crate plan to export
   * @param baseOutputPath - Base path for exports (will add platform suffix)
   * @param options - Common export options
   * @returns Array of export results
   */
  async exportToBoth(
    plan: CratePlan,
    baseOutputPath: string,
    options?: Partial<Omit<UniversalExportOptions, "platform" | "outputPath">>,
  ): Promise<{ rekordbox: ExportResult; serato: ExportResult }> {
    const hasExtension = /\.[^.]+$/.test(baseOutputPath);
    const rekordboxPath = hasExtension
      ? baseOutputPath.replace(/\.[^.]+$/, "_rekordbox.m3u8")
      : `${baseOutputPath}_rekordbox.m3u8`;
    const seratoPath = hasExtension
      ? baseOutputPath.replace(/\.[^.]+$/, "_serato.m3u8")
      : `${baseOutputPath}_serato.m3u8`;

    const [rekordbox, serato] = await Promise.all([
      this.export(plan, {
        platform: "rekordbox",
        outputPath: rekordboxPath,
        format: "m3u8",
        ...options,
      }),
      this.export(plan, {
        platform: "serato",
        outputPath: seratoPath,
        format: "m3u8",
        ...options,
      }),
    ]);

    return { rekordbox, serato };
  }

  /**
   * Get the appropriate exporter for a platform
   */
  getExporter(platform: DJPlatform): RekordboxExporter | SeratoExporter {
    return platform === "rekordbox"
      ? this.rekordboxExporter
      : this.seratoExporter;
  }
}

/**
 * Quick export function for any platform
 *
 * @param plan - Crate plan to export
 * @param db - MongoDB database instance
 * @param platform - Target DJ platform
 * @param outputPath - Where to save the file
 * @param format - Export format (optional, defaults to m3u8)
 * @returns Export result
 */
export function exportPlan(
  plan: CratePlan,
  db: Db,
  platform: DJPlatform,
  outputPath: string,
  format?: "m3u8" | "xml" | "csv" | "txt",
): Promise<ExportResult> {
  const exporter = new UniversalExporter(db);
  return exporter.export(plan, {
    platform,
    outputPath,
    format,
    includeMetadata: true,
    relativePaths: false,
  });
}

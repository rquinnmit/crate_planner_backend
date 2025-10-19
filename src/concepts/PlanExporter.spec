<concept_spec>
concept PlanExporter [Plan] -> Implementation in base_exporter.ts, Testing in exporters.test.ts

purpose allows the user to materialize a plan into a format that is supported by DJ software

principle exporting a finalized plan yields a playlist/crate that is suitable for import on a DJ software

state
a set of Exports with
	a success Boolean
	a filePath String
	an optional error String
	a trackExported Number

a set of M3U8ExportOptions with
	an outputPath String
	a playlistName String
	an optional includeMetadata Boolean
	an optional relativePaths Boolean

actions
export(plan: Plan, format: Format): (export: Export)
requires the plan is finalized
effect generates an exportable file for the user

exportMultiple(plans: List<Plan>, platform: String)
requires each plan in plans is valid
effect exports multiple plans as a collection

validatePlanForExport(plan: Plan)
requires plan is finalized
effect validates that a plan is ready for export

getTracksFromPlan(plan: CratePlan)
requires plan references tracks in the catalog
effect returns the tracks referenced by the plan

_exportM3U8(tracks: Track[], options: M3U8ExportOptions)
requires an output destination and readable track metadata
effect produces an M3U8 playlist and returns its file path

getM3UExtraMetadata(track: Track)
requires track metadata is available
effect formats platform-neutral metadata lines for a playlist

validateTracksForExport(plan: CratePlan)
requires access to referenced tracks and the filesystem
effect reports whether all planned tracks are exportable and lists issues

getFilePath(track: Track, relative: boolean, basePath: string)
requires the track has a known file location
effect returns the track’s absolute or basePath-relative path; errors if unknown

ensureExtension(filePath: string, extension: string)
requires a desired extension
effect returns the path with the required extension applied

escapeM3U(text: string)
requires text
effect normalizes text for M3U compatibility

escapeXML(text: string)
requires text
effect returns XML-safe text

escapeCSV(text: string)
requires text
effect returns a CSV-safe field

writeFile(outputPath: string, content: string)
requires write access to the destination
effect writes the content and returns the file path

handleExportError(error: unknown)
requires an error to standardize
effect returns a uniform export failure result


</concept_spec>
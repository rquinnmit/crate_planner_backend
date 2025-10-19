PS C:\Users\pyanq\6.104\crate_planner_backend> deno task test
Task test deno test --allow-net --allow-read --allow-env --allow-sys --allow-write
running 8 tests from ./tests/catalog_db.test.ts
Catalog DB - Basic Track Management ...
  Add track to catalog ...
------- output -------
  Added track: Test Artist - Test Track
----- output end -----
  Add track to catalog ... ok (49ms)
  Get track by ID ...
------- output -------
  Retrieved: Test Artist - Test Track
----- output end -----
  Get track by ID ... ok (17ms)
  Check if track exists ...
------- output -------
  Track existence check passed
----- output end -----
  Check if track exists ... ok (33ms)
  Get track count ...
------- output -------
  Track count: 1
----- output end -----
  Get track count ... ok (16ms)
  Update track metadata ...
------- output -------
  Updated track: Updated Title @ 130 BPM
----- output end -----
  Update track metadata ... ok (19ms)
  Remove track from catalog ...
------- output -------
  Track removed successfully
----- output end -----
  Remove track from catalog ... ok (36ms)
  Get non-existent track returns null ...
------- output -------
  Non-existent track handling correct
----- output end -----
  Get non-existent track returns null ... ok (16ms)
Catalog DB - Basic Track Management ... ok (192ms)
Catalog DB - Search and Filtering ...
  Get all tracks ...
------- output -------
  Found 5 tracks
----- output end -----
  Get all tracks ... ok (17ms)
  Filter by genre ...
------- output -------
  Found 3 Tech House tracks
----- output end -----
  Filter by genre ... ok (17ms)
  Filter by BPM range ...
------- output -------
  Found 3 tracks in 120-125 BPM range
----- output end -----
  Filter by BPM range ... ok (17ms)
  Filter by single key ...
------- output -------
  Found 2 tracks in key 8A
----- output end -----
  Filter by single key ... ok (17ms)
  Filter by multiple keys ...
------- output -------
  Found 3 tracks in keys 8A or 9A
----- output end -----
  Filter by multiple keys ... ok (17ms)
  Filter by artist ...
------- output -------
  Found 2 tracks by Artist A
----- output end -----
  Filter by artist ... ok (19ms)
  Filter by energy range ...
------- output -------
  Found 3 tracks with energy 3-4
----- output end -----
  Filter by energy range ... ok (17ms)
  Exclude artists ...
------- output -------
  Found 3 tracks excluding Artist B
----- output end -----
  Exclude artists ... ok (21ms)
  Combined filters (genre + BPM + energy) ...
------- output -------
  Found 2 tracks matching all criteria
----- output end -----
  Combined filters (genre + BPM + energy) ... ok (20ms)
  Filter by specific IDs ...
------- output -------
  Found 3 tracks by ID
----- output end -----
  Filter by specific IDs ... ok (19ms)
  Cleanup test data ...
------- output -------
  Test data cleaned up
----- output end -----
  Cleanup test data ... ok (21ms)
Catalog DB - Search and Filtering ... ok (308ms)
Catalog DB - Key Compatibility ...
  Get compatible keys ...
------- output -------
  Compatible keys: 8A, 8B, 9A, 7A
----- output end -----
  Get compatible keys ... ok (0ms)
  Get tracks with compatible keys ...
------- output -------
  Found 5 harmonically compatible tracks
----- output end -----
  Get tracks with compatible keys ... ok (16ms)
  Get tracks by specific key ...
------- output -------
  Found 2 tracks in key 8A
----- output end -----
  Get tracks by specific key ... ok (17ms)
  Cleanup test data ...
------- output -------
  Test data cleaned up
----- output end -----
  Cleanup test data ... ok (21ms)
Catalog DB - Key Compatibility ... ok (170ms)
Catalog DB - Statistics ...
  Get catalog statistics ...
------- output -------
  Total tracks: 4
----- output end -----
  Get catalog statistics ... ok (17ms)
  Genre distribution ...
------- output -------
  Tech House: 3
  Deep House: 1
----- output end -----
  Genre distribution ... ok (17ms)
  BPM range ...
------- output -------
  BPM range: 120-128
----- output end -----
  BPM range ... ok (19ms)
  Average BPM ...
------- output -------
  Average BPM: 123.8
----- output end -----
  Average BPM ... ok (19ms)
  Key distribution ...
------- output -------
  Key 8A: 3 tracks
----- output end -----
  Key distribution ... ok (18ms)
  Empty catalog statistics ...
------- output -------
  Empty catalog handled correctly
----- output end -----
  Empty catalog statistics ... ok (41ms)
  Cleanup test data ...
------- output -------
  Test data cleaned up
----- output end -----
  Cleanup test data ... ok (16ms)
Catalog DB - Statistics ... ok (226ms)
Catalog DB - Bulk Operations ...
  Import multiple tracks ...
------- output -------
  Imported 3 tracks
----- output end -----
  Import multiple tracks ... ok (46ms)
  Get multiple tracks by IDs ...
------- output -------
  Retrieved 2 tracks
----- output end -----
  Get multiple tracks by IDs ... ok (16ms)
  Clear catalog ...
------- output -------
  Catalog cleared successfully
----- output end -----
  Clear catalog ... ok (34ms)
Catalog DB - Bulk Operations ... ok (99ms)
Catalog DB - Import/Export JSON ...
  Export to JSON ...
------- output -------
  Exported 2 tracks to JSON
----- output end -----
  Export to JSON ... ok (19ms)
  Import from JSON ...
------- output -------
  Imported 2 tracks from JSON
----- output end -----
  Import from JSON ... ok (62ms)
  Verify imported data ...
------- output -------
  Imported data verified successfully
----- output end -----
  Verify imported data ... ok (18ms)
  Handle invalid JSON import ...
------- output -------
  Invalid JSON handled correctly
----- output end -----
  Handle invalid JSON import ... ok (1ms)
  Cleanup test data ...
------- output -------
  Test data cleaned up
----- output end -----
  Cleanup test data ... ok (25ms)
Catalog DB - Import/Export JSON ... ok (170ms)
Catalog DB - Helper Methods ...
  Get tracks by genre ...
------- output -------
  Found 2 Tech House tracks
----- output end -----
  Get tracks by genre ... ok (16ms)
  Get tracks by artist ...
------- output -------
  Found 2 tracks by Artist A
----- output end -----
  Get tracks by artist ... ok (17ms)
  Get tracks by BPM range ...
------- output -------
  Found 2 tracks in 120-126 BPM
----- output end -----
  Get tracks by BPM range ... ok (18ms)
  Cleanup test data ...
------- output -------
  Test data cleaned up
----- output end -----
  Cleanup test data ... ok (20ms)
Catalog DB - Helper Methods ... ok (131ms)
Close DB connection ... ok (6ms)
running 2 tests from ./tests/crate_planner.test.ts
CratePlanner LLM flow - derive intent and candidate pool ... ok (3ms)
CratePlanner LLM flow - sequence, explain, revise ... ok (2ms)
running 3 tests from ./tests/exporters.test.ts
Exporters - Rekordbox M3U8 and XML ... ok (6ms)
Exporters - Serato CSV and TXT ... ok (16ms)
Exporters - Edge Cases and Outliers ...
  Export empty plan ...
------- post-test output -------
  Empty plan handled: failed gracefully
----- post-test output end -----
  Export empty plan ... ok (1ms)
  Export plan with missing tracks ...
------- post-test output -------
  Plan with missing tracks handled
----- post-test output end -----
  Export plan with missing tracks ... ok (1ms)
  Export with relative paths ...
------- post-test output -------
  Relative paths export successful
----- post-test output end -----
  Export with relative paths ... ok (2ms)
  Export with both relative and absolute paths ...
------- post-test output -------
  Mixed path modes handled correctly
----- post-test output end -----
  Export with both relative and absolute paths ... ok (2ms)
  Export Serato with M3U8 format ...
------- post-test output -------
  Serato M3U8 format export successful
----- post-test output end -----
  Export Serato with M3U8 format ... ok (1ms)
  Export CSV without headers ...
------- post-test output -------
  CSV without headers exported
----- post-test output end -----
  Export CSV without headers ... ok (2ms)
  Export without metadata ...
------- post-test output -------
  Export without metadata successful
----- post-test output end -----
  Export without metadata ... ok (1ms)
  Large playlist export (stress test) ...
------- post-test output -------
  Exported 500 tracks in 3ms
----- post-test output end -----
  Large playlist export (stress test) ... ok (4ms)
  Export with special characters in names ...
------- post-test output -------
  Special characters handled correctly
----- post-test output end -----
  Export with special characters in names ... ok (1ms)
  Export with Unicode characters ...
------- post-test output -------
  Unicode characters handled correctly
----- post-test output end -----
  Export with Unicode characters ... ok (1ms)
  Export single track ...
------- post-test output -------
  Single track export successful
----- post-test output end -----
  Export single track ... ok (2ms)
Exporters - Edge Cases and Outliers ... ok (26ms)
running 6 tests from ./tests/formatters_test.ts
Time formatters - MMSS and parsing ... ok (0ms)
Time formatters - long and compact ... ok (0ms)
Time formatters - helpers ... ok (0ms)
Prompt formatters - seed tracks & ids ... ok (0ms)
Prompt formatters - track list & crate tracks ... ok (0ms)
Prompt formatters - simple helpers ... ok (0ms)
running 21 tests from ./tests/importers.test.ts
BaseImporter - Track ID generation ... ok (0ms)
BaseImporter - Track validation ... ok (0ms)
BaseImporter - Import tracks with duplicate detection ... ok (0ms)
BaseImporter - Request count tracking ... ok (0ms)
BaseImporter - Import by ID not found ... ok (0ms)
SpotifyImporter - Real API: Authentication and token refresh ...
------- post-test output -------
  ℹ️  Initial token: none
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
  ✓ Token acquired: BQDPnqX33-GIBgrzIXAX...
----- post-test output end -----
SpotifyImporter - Real API: Authentication and token refresh ... ok (641ms)
SpotifyImporter - Real API: Search and import tracks ...
------- post-test output -------
   ℹ️  5 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 5 tracks)
  ℹ️  Import result: 5 imported, 0 failed
  ℹ️  Warnings: 0
  ✓ Sample track: Daft Punk, Pharrell Williams, Nile Rodgers - Get Lucky (feat. Pharrell Williams and Nile Rodgers) (126 BPM, 9A)
----- post-test output end -----
SpotifyImporter - Real API: Search and import tracks ... ok (590ms)
SpotifyImporter - Real API: Import by ID ...
------- post-test output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
  ℹ️  Import result: 1 imported, 0 failed
  ✓ Track imported: Daft Punk, Pharrell Williams, Nile Rodgers - Get Lucky (Radio Edit) [feat. Pharrell Williams and Nile Rodgers]
----- post-test output end -----
SpotifyImporter - Real API: Import by ID ... ok (413ms)
SpotifyImporter - Real API: Import multiple tracks by IDs ...
------- post-test output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  2 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 2 tracks)
  ℹ️  Import result: 2 imported, 0 failed
----- post-test output end -----
SpotifyImporter - Real API: Import multiple tracks by IDs ... ok (472ms)
SpotifyImporter - Real API: Import from playlist ...
------- post-test output -------
  ℹ️  Import result: 0 imported, 0 failed
  ℹ️  Warnings: 0
  ✓ Playlist import handled gracefully
----- post-test output end -----
SpotifyImporter - Real API: Import from playlist ... ok (800ms)
SpotifyImporter - Real API: Search with no results ...
------- post-test output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
  ℹ️  Imported: 1, Warnings: 0
  ✓ Handled obscure search correctly
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
----- post-test output end -----
SpotifyImporter - Real API: Search with no results ... ok (553ms)
SpotifyImporter - Real API: Get available genre seeds ...
------- post-test output -------
  ℹ️  Available genres: 33
⚠️  Genre seeds endpoint unavailable, using fallback list
  ℹ️  Sample genres: house, tech-house, deep-house, progressive-house, electro-house
----- post-test output end -----
SpotifyImporter - Real API: Get available genre seeds ... ok (203ms)
SpotifyImporter - Real API: Get recommendations ...
------- post-test output -------
  ℹ️  Recommendations: 0 imported, 0 failed
  ✓ Recommendations handled API limitation gracefully
----- post-test output end -----
SpotifyImporter - Real API: Get recommendations ... ok (202ms)
SpotifyImporter - Real API: Search artists by name ...
------- post-test output -------
  ✓ Found artist ID: 4tZwfgrHOc3mvqYlEYSvVi
----- post-test output end -----
SpotifyImporter - Real API: Search artists by name ... ok (402ms)
SpotifyImporter - Real API: Search tracks by name ...
------- post-test output -------
  ✓ Found track ID: 69kOkLUCkxIZYexIgSG8rq
----- post-test output end -----
SpotifyImporter - Real API: Search tracks by name ... ok (438ms)
SpotifyImporter - Edge Case: Invalid track ID ...
------- post-test output -------
  ✓ Invalid ID error: API request failed: 400 Bad Request
----- post-test output end -----
SpotifyImporter - Edge Case: Invalid track ID ... ok (213ms)
SpotifyImporter - Edge Case: Duplicate import prevention ...
------- post-test output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
  ✓ Duplicate prevention working: Track already exists: spotify-2Foc5Q5nqNiosCNqttzHof
----- post-test output end -----
SpotifyImporter - Edge Case: Duplicate import prevention ... ok (854ms)
SpotifyImporter - Edge Case: Recommendations without seeds ...
------- post-test output -------
  ✓ No seeds error: At least one seed (artist, track, or genre) is required
----- post-test output end -----
SpotifyImporter - Edge Case: Recommendations without seeds ... ok (123ms)
SpotifyImporter - Edge Case: Large batch import ...
------- post-test output -------
   ℹ️  50 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 50 tracks)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  10 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 10 tracks)
  ℹ️  Batch import time: 987ms
  ✓ Large batch handled: 1 imported, 59 duplicates detected
----- post-test output end -----
SpotifyImporter - Edge Case: Large batch import ... ok (987ms)
SpotifyImporter - Rate limiting: Multiple rapid requests ...
------- post-test output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
  ℹ️  3 requests completed in 796ms with rate limiting
----- post-test output end -----
SpotifyImporter - Rate limiting: Multiple rapid requests ... ok (796ms)
SpotifyImporter - Integration: Full workflow ...
------- post-test output -------
  ℹ️  Running full workflow test...
  → Searching for house music tracks...
   ℹ️  3 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 3 tracks)
  ✓ Imported 3 tracks from search
  → Importing specific track by ID...
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
  ✓ Imported 1 track by ID
  → Getting recommendations...
  ℹ️  Recommendations: unavailable with current auth
  ✓ Total tracks in database: 4
  ✓ Sample track quality check passed: Masiwei - House Music
    BPM: 138, Key: 9A, Duration: 207s
----- post-test output end -----
SpotifyImporter - Integration: Full workflow ... ok (1s)
running 7 tests from ./tests/parsing_test.ts
Parsing - JSON Extraction ...
  Extract clean JSON ...
------- post-test output -------
  Clean JSON extracted correctly
----- post-test output end -----
  Extract clean JSON ... ok (1ms)
  Extract JSON with surrounding text ...
------- post-test output -------
  JSON extracted from surrounding text
----- post-test output end -----
  Extract JSON with surrounding text ... ok (0ms)
  Extract JSON from markdown code block ...
------- post-test output -------
  JSON extracted from markdown
----- post-test output end -----
  Extract JSON from markdown code block ... ok (0ms)
  Handle missing JSON ...
------- post-test output -------
  Missing JSON detected correctly
----- post-test output end -----
  Handle missing JSON ... ok (1ms)
  Extract nested JSON ...
------- post-test output -------
  Nested JSON extracted correctly
----- post-test output end -----
  Extract nested JSON ... ok (0ms)
Parsing - JSON Extraction ... ok (15ms)
Parsing - Derived Intent ...
  Parse valid derived intent ...
------- post-test output -------
  Parsed intent: smooth style, 3600s
----- post-test output end -----
  Parse valid derived intent ... ok (1ms)
  Parse intent with surrounding text ...
------- post-test output -------
  Intent parsed from surrounded text
----- post-test output end -----
  Parse intent with surrounding text ... ok (0ms)
  Handle missing optional fields ...
------- post-test output -------
  Missing fields defaulted correctly
----- post-test output end -----
  Handle missing optional fields ... ok (0ms)
  Reject invalid tempo range ...
------- post-test output -------
  Invalid tempo range rejected
----- post-test output end -----
  Reject invalid tempo range ... ok (0ms)
  Reject missing required fields ...
------- post-test output -------
  Missing required fields rejected
----- post-test output end -----
  Reject missing required fields ... ok (1ms)
Parsing - Derived Intent ... ok (2ms)
Parsing - Track Lists ...
  Parse candidate pool selection ...
------- post-test output -------
  Parsed 3 track IDs
----- post-test output end -----
  Parse candidate pool selection ... ok (0ms)
  Parse track sequence ...
------- post-test output -------
  Track sequence parsed with correct order
----- post-test output end -----
  Parse track sequence ... ok (0ms)
  Parse plan revision ...
------- post-test output -------
  Revision parsed: Removed Artist X and added higher energy...
----- post-test output end -----
  Parse plan revision ... ok (0ms)
  Handle empty track list ...
------- post-test output -------
  Empty track list handled correctly
----- post-test output end -----
  Handle empty track list ... ok (0ms)
  Reject malformed track array ...
------- post-test output -------
  Malformed track array rejected
----- post-test output end -----
  Reject malformed track array ... ok (1ms)
Parsing - Track Lists ... ok (6ms)
Parsing - Track ID Sanitization ...
  Remove duplicate track IDs ...
------- post-test output -------
  Removed duplicates: 4 → 3
----- post-test output end -----
  Remove duplicate track IDs ... ok (1ms)
  Remove invalid track IDs ...
------- post-test output -------
  Removed invalid IDs: 6 → 2
----- post-test output end -----
  Remove invalid track IDs ... ok (1ms)
  Trim whitespace from IDs ...
------- post-test output -------
  Whitespace trimmed correctly
----- post-test output end -----
  Trim whitespace from IDs ... ok (0ms)
  Handle non-array input ...
------- post-test output -------
  Non-array input handled gracefully
----- post-test output end -----
  Handle non-array input ... ok (0ms)
  Handle empty array ...
------- post-test output -------
  Empty array handled correctly
----- post-test output end -----
  Handle empty array ... ok (0ms)
Parsing - Track ID Sanitization ... ok (4ms)
Parsing - Generic Functions ...
  Parse JSON with validator ...
------- post-test output -------
  JSON parsed with validation
----- post-test output end -----
  Parse JSON with validator ... ok (0ms)
  Safe parse with fallback ...
------- post-test output -------
⚠️ JSON parsing failed, using fallback: Failed to parse JSON: No JSON found in LLM response
  Fallback returned on parse error
----- post-test output end -----
  Safe parse with fallback ... ok (0ms)
  Check for valid JSON ...
------- post-test output -------
  JSON validity check working
----- post-test output end -----
  Check for valid JSON ... ok (0ms)
  Extract explanation text ...
------- post-test output -------
  Explanation text extracted
----- post-test output end -----
  Extract explanation text ... ok (0ms)
  Parse multiple JSON objects ...
------- post-test output -------
  Parsed 3 JSON objects
----- post-test output end -----
  Parse multiple JSON objects ... ok (0ms)
Parsing - Generic Functions ... ok (3ms)
Parsing - Validation Helpers ...
  Validate BPM range ...
------- post-test output -------
  Valid BPM range: 120-130
----- post-test output end -----
  Validate BPM range ... ok (0ms)
  Reject invalid BPM range ...
------- post-test output -------
  Invalid BPM range rejected
----- post-test output end -----
  Reject invalid BPM range ... ok (0ms)
  Validate duration ...
------- post-test output -------
  Valid duration: 3600s
----- post-test output end -----
  Validate duration ... ok (0ms)
  Reject negative duration ...
------- post-test output -------
  Negative duration rejected
----- post-test output end -----
  Reject negative duration ... ok (1ms)
  Round fractional values ...
------- post-test output -------
  Fractional duration rounded
----- post-test output end -----
  Round fractional values ... ok (0ms)
Parsing - Validation Helpers ... ok (1ms)
Parsing - Error Recovery ...
  Fix markdown code blocks ...
------- post-test output -------
  Markdown code blocks removed
----- post-test output end -----
  Fix markdown code blocks ... ok (1ms)
  Remove common prefixes ...
------- post-test output -------
  Common prefixes removed
----- post-test output end -----
  Remove common prefixes ... ok (0ms)
  Extract JSON from complex text ...
------- post-test output -------
  JSON extracted from complex text
----- post-test output end -----
  Extract JSON from complex text ... ok (0ms)
  Handle already clean JSON ...
------- post-test output -------
  Clean JSON unchanged
----- post-test output end -----
  Handle already clean JSON ... ok (0ms)
  Apply multiple fixes ...
------- post-test output -------
  Multiple fixes applied successfully
----- post-test output end -----
  Apply multiple fixes ... ok (0ms)
Parsing - Error Recovery ... ok (1ms)
running 5 tests from ./tests/prompting_test.ts
Prompting - Prompt Generation ...
  createDeriveIntentPrompt generates valid prompt ...
------- post-test output -------
  Prompt structure validated
----- post-test output end -----
  createDeriveIntentPrompt generates valid prompt ... ok (0ms)
Prompting - Prompt Generation ... ok (1ms)
Prompting - Parse Complete Intent ...
  Parse complete valid response ...
------- post-test output -------
  Complete intent parsed successfully
----- post-test output end -----
  Parse complete valid response ... ok (1ms)
  Capture optional Spotify fields ...
------- post-test output -------
  Spotify fields captured correctly
----- post-test output end -----
  Capture optional Spotify fields ... ok (0ms)
  Handle missing optional fields ...
------- post-test output -------
  Optional fields handled correctly
----- post-test output end -----
  Handle missing optional fields ... ok (0ms)
  Apply defaults for missing fields ...
------- post-test output -------
  Defaults applied correctly
----- post-test output end -----
  Apply defaults for missing fields ... ok (0ms)
  Handle LLM response with extra text ...
------- post-test output -------
  JSON extracted despite extra text
----- post-test output end -----
  Handle LLM response with extra text ... ok (1ms)
Prompting - Parse Complete Intent ... ok (13ms)
Prompting - Validation ...
  Validate correct BPM range ...
------- post-test output -------
  Valid BPM range accepted
----- post-test output end -----
  Validate correct BPM range ... ok (0ms)
  Reject invalid BPM range (min > max) ...
------- post-test output -------
  Invalid BPM range rejected
----- post-test output end -----
  Reject invalid BPM range (min > max) ... ok (1ms)
  Reject negative BPM values ...
------- post-test output -------
  Negative BPM values rejected
----- post-test output end -----
  Reject negative BPM values ... ok (0ms)
  Validate correct duration ...
------- post-test output -------
  Valid duration accepted
----- post-test output end -----
  Validate correct duration ... ok (0ms)
  Reject negative duration ...
------- post-test output -------
  Negative duration rejected
----- post-test output end -----
  Reject negative duration ... ok (0ms)
Prompting - Validation ... ok (2ms)
Prompting - Error Handling ...
  Throw on invalid JSON ...
------- post-test output -------
  Invalid JSON throws error
----- post-test output end -----
  Throw on invalid JSON ... ok (0ms)
  Throw on missing required fields ...
------- post-test output -------
  Missing required fields throws error
----- post-test output end -----
  Throw on missing required fields ... ok (0ms)
Prompting - Error Handling ... ok (0ms)
Prompting - Prompt Includes Guidelines ...
  Include all field guidelines ...
------- post-test output -------
  All field guidelines present
----- post-test output end -----
  Include all field guidelines ... ok (0ms)
Prompting - Prompt Includes Guidelines ... ok (0ms)
running 4 tests from ./tests/spotify_key_converter_test.ts
Spotify key -> Camelot ... ok (0ms)
Camelot -> Spotify key/mode ... ok (0ms)
Spotify key standard notation & validation ... ok (0ms)
Compatible keys from Spotify key ... ok (0ms)
running 5 tests from ./tests/validation_constraints_test.ts
Validation - track basics ... ok (0ms)
Validation - file path required for export ... ok (0ms)
Validation - prompt and intent ... ok (0ms)
Validation - plan basics and finalization ... ok (0ms)
Validation - filter constraints and checks ... ok (0ms)

ok | 61 passed (101 steps) | 0 failed (11s)
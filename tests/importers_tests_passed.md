PS C:\Users\pyanq\6.104\crate_planner_backend> deno test tests/importers.test.ts --allow-net --allow-env --allow-read --allow-write --allow-sys
Check file:///C:/Users/pyanq/6.104/crate_planner_backend/tests/importers.test.ts
running 21 tests from ./tests/importers.test.ts
BaseImporter - Track ID generation ... ok (0ms)
BaseImporter - Track validation ... ok (0ms)
BaseImporter - Import tracks with duplicate detection ... ok (0ms)
BaseImporter - Request count tracking ... ok (0ms)
BaseImporter - Import by ID not found ... ok (0ms)
SpotifyImporter - Real API: Authentication and token refresh ...
------- output -------
  ℹ️  Initial token: none
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
  ✓ Token acquired: BQDAvKv9wseWm3OpngAJ...
----- output end -----
SpotifyImporter - Real API: Authentication and token refresh ... ok (577ms)
SpotifyImporter - Real API: Search and import tracks ...
------- output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 5 tracks)
   ℹ️  5 track(s) missing audio features (will use smart fallback inference)
  ℹ️  Import result: 5 imported, 0 failed
  ℹ️  Warnings: 0
  ✓ Sample track: Daft Punk, Pharrell Williams, Nile Rodgers - Get Lucky (feat. Pharrell Williams and Nile Rodgers) (139 BPM, 8A)
----- output end -----
SpotifyImporter - Real API: Search and import tracks ... ok (641ms)
SpotifyImporter - Real API: Import by ID ...
------- output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
  ℹ️  Import result: 1 imported, 0 failed
  ✓ Track imported: Daft Punk, Pharrell Williams, Nile Rodgers - Get Lucky (Radio Edit) [feat. Pharrell Williams and Nile Rodgers]
----- output end -----
SpotifyImporter - Real API: Import by ID ... ok (412ms)
SpotifyImporter - Real API: Import multiple tracks by IDs ...
------- output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  2 track(s) missing audio features (will use smart fallback inference)
  ℹ️  Import result: 2 imported, 0 failed
   ⚠️  Audio features unavailable (using fallbacks for 2 tracks)
----- output end -----
SpotifyImporter - Real API: Import multiple tracks by IDs ... ok (538ms)
SpotifyImporter - Real API: Import from playlist ...
------- output -------
  ℹ️  Import result: 0 imported, 0 failed
  ℹ️  Warnings: 0
  ✓ Playlist import handled gracefully
----- output end -----
SpotifyImporter - Real API: Import from playlist ... ok (709ms)
SpotifyImporter - Real API: Search with no results ...
------- output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
  ℹ️  Imported: 1, Warnings: 0
  ✓ Handled obscure search correctly
----- output end -----
SpotifyImporter - Real API: Search with no results ... ok (600ms)
SpotifyImporter - Real API: Get available genre seeds ...
------- output -------
⚠️  Genre seeds endpoint unavailable, using fallback list
  ℹ️  Available genres: 33
  ℹ️  Sample genres: house, tech-house, deep-house, progressive-house, electro-house
----- output end -----
SpotifyImporter - Real API: Get available genre seeds ... ok (228ms)
SpotifyImporter - Real API: Get recommendations ...
------- output -------
  ℹ️  Recommendations: 0 imported, 0 failed
  ✓ Recommendations handled API limitation gracefully
----- output end -----
SpotifyImporter - Real API: Get recommendations ... ok (204ms)
SpotifyImporter - Real API: Search artists by name ...
------- output -------
  ✓ Found artist ID: 4tZwfgrHOc3mvqYlEYSvVi
----- output end -----
SpotifyImporter - Real API: Search artists by name ... ok (640ms)
SpotifyImporter - Real API: Search tracks by name ...
------- output -------
  ✓ Found track ID: 69kOkLUCkxIZYexIgSG8rq
----- output end -----
SpotifyImporter - Real API: Search tracks by name ... ok (443ms)
SpotifyImporter - Edge Case: Invalid track ID ...
------- output -------
  ✓ Invalid ID error: API request failed: 400 Bad Request
----- output end -----
SpotifyImporter - Edge Case: Invalid track ID ... ok (234ms)
SpotifyImporter - Edge Case: Duplicate import prevention ...
------- output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
  ✓ Duplicate prevention working: Track already exists: spotify-2Foc5Q5nqNiosCNqttzHof
----- output end -----
SpotifyImporter - Edge Case: Duplicate import prevention ... ok (720ms)
SpotifyImporter - Edge Case: Recommendations without seeds ...
------- output -------
  ✓ No seeds error: At least one seed (artist, track, or genre) is required
----- output end -----
SpotifyImporter - Edge Case: Recommendations without seeds ... ok (96ms)
SpotifyImporter - Edge Case: Large batch import ...
------- output -------
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  50 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 50 tracks)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  10 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 10 tracks)
  ℹ️  Batch import time: 1205ms
  ✓ Large batch handled: 1 imported, 59 duplicates detected
----- output end -----
SpotifyImporter - Edge Case: Large batch import ... ok (1s)
SpotifyImporter - Rate limiting: Multiple rapid requests ...
------- output -------
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features API error: API request failed: 403 Forbidden
  ℹ️  3 requests completed in 730ms with rate limiting
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
----- output end -----
SpotifyImporter - Rate limiting: Multiple rapid requests ... ok (731ms)
SpotifyImporter - Integration: Full workflow ...
------- output -------
  ℹ️  Running full workflow test...
  → Searching for house music tracks...
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  3 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 3 tracks)
  ✓ Imported 3 tracks from search
  → Importing specific track by ID...
   ⚠️  Audio features API error: API request failed: 403 Forbidden
   ℹ️  1 track(s) missing audio features (will use smart fallback inference)
   ⚠️  Audio features unavailable (using fallbacks for 1 tracks)
  ✓ Imported 1 track by ID
  → Getting recommendations...
  ℹ️  Recommendations: unavailable with current auth
  ✓ Total tracks in database: 4
  ✓ Sample track quality check passed: Masiwei - House Music
    BPM: 137, Key: 8A, Duration: 207s
----- output end -----
SpotifyImporter - Integration: Full workflow ... ok (1s)

ok | 21 passed | 0 failed (9s)
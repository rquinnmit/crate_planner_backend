PS C:\Users\pyanq\6.104\crate_planner_backend> deno test tests/exporters.test.ts --allow-net --allow-env --allow-read --allow-write
running 3 tests from ./tests/exporters.test.ts
Exporters - Rekordbox M3U8 and XML ... ok (5ms)
Exporters - Serato CSV and TXT ... ok (17ms)
Exporters - Edge Cases and Outliers ...
  Export empty plan ...
------- output -------
  Empty plan handled: failed gracefully
----- output end -----
  Export empty plan ... ok (1ms)
  Export plan with missing tracks ...
------- output -------
  Plan with missing tracks handled
----- output end -----
  Export plan with missing tracks ... ok (1ms)
  Export with relative paths ...
------- output -------
  Relative paths export successful
----- output end -----
  Export with relative paths ... ok (2ms)
  Export with both relative and absolute paths ...
------- output -------
  Mixed path modes handled correctly
----- output end -----
  Export with both relative and absolute paths ... ok (3ms)
  Export Serato with M3U8 format ...
------- output -------
  Serato M3U8 format export successful
----- output end -----
  Export Serato with M3U8 format ... ok (1ms)
  Export CSV without headers ...
------- output -------
  CSV without headers exported
----- output end -----
  Export CSV without headers ... ok (1ms)
  Export without metadata ...
------- output -------
  Export without metadata successful
----- output end -----
  Export without metadata ... ok (1ms)
  Large playlist export (stress test) ...
------- output -------
  Exported 500 tracks in 1ms
----- output end -----
  Large playlist export (stress test) ... ok (2ms)
  Export with special characters in names ...
------- output -------
  Special characters handled correctly
----- output end -----
  Export with special characters in names ... ok (1ms)
  Export with Unicode characters ...
------- output -------
  Unicode characters handled correctly
----- output end -----
  Export with Unicode characters ... ok (1ms)
  Export single track ...
------- output -------
  Single track export successful
----- output end -----
  Export single track ... ok (1ms)
Exporters - Edge Cases and Outliers ... ok (19ms)

ok | 3 passed (11 steps) | 0 failed (49ms)
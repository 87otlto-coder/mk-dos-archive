# P76 — three-game original-source consolidation candidate and MK3 opt-in row-graphic integration

**ACCEPTED FOLLOW-UP — 2026-11-08:** The *candidate/pending* language below is retained as the original pre-acceptance implementation record. The user's complete Windows original-DOS P76 checkpoint subsequently returned **PASS, all 6/6 groups**, including P71 three-game original/browser baseline, P72 original/Chrome comparison, and P76 original/Chrome image/export verification, against exact code commit `a5192ce0f1dca2ad765571cb6c1dae68ac30411f` and Git tree `2eac170cc3d7f79e135d71d639ed47ed3552f137`. [Read the authoritative accepted P76 original/Chrome checkpoint handoff](EXTRACTOR_P76_ACCEPTED_ORIGINAL_CHECKPOINT.md). The historical pending notes that follow have been superseded; `main` remains P16 and source assets stay private.

**Date:** 2026-11-08. **Cycle:** P72–P76, **fifth/consolidation pass**. **Branch:** `develop`. **Status:** application integration and source-only CI **VERIFIED**; new original integrated source/real Chrome and full cumulative P76 checkpoint **VALIDATION PENDING**. **Do not promote `main` or claim a fully accepted P76 release until the final original-fixture gate passes.**

## Starting baseline and problem addressed

- Accepted P71 original three-game/real-Chrome regression: MK1 **2,656**, MK2 **5,369**, MK3 **9,186**, total **17,211** asset representations, 10/10 cumulative groups. Stable `main` remains P16.
- P72 added **user-selected IFF CMAP fighter color comparisons**, not authenticated native fighter palettes. Its source CI passed but original integrated/Chrome checks were still pending.
- P73 identified 19 repeated, previously unresolved DATA.MK3 color-table candidate records.
- P74 reconstructed 14 first image streams; P75 used 32-bit row-X and compressed row-pointer arrays to qualify **all 19** source-indexed canvases: **2,050,843 indices and mask positions**, **996,697 painted pixels**, **3,015 declared rows**, **271 rows with X=-1 and no packed bytes**. Native renderer semantics, stage/animation association and palette ownership remain UNKNOWN. The **1,611,110 bytes after the row tables** remain unparsed and preserved.

## P76 changes (actually committed)

- `src/core/assets/mk3NonIffRowMappedP76.ts` is a bounded, **opt-in** original DOS MK3 DATA.MK3 decoder. Exact whole-file SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517` is required; all **416** original IFF source images and **20** raw non-IFF ranges must form a strict **9,015,508-byte partition** with valid provenance. It refuses another source version instead of generalizing.
- For each of the **19** source regions after the first differently structured raw interval, reconstructs the grayscale-indexed RGBA preview, exact original indexed bytes, binary paint mask, signed row-X table, unsigned packed-row offsets, original compressed first-stream bytes, and adjacent source RGB8 candidate **without applying its unverified colors**. Includes explicit metadata for source file, offsets, lengths, indexed-region ordinal, unexplained last byte, row counts, unparsed post-table extent, and UNKNOWN native palette/renderer/stage/animation claims.
- `src/components/AssetBrowser.tsx` adds a **user-triggered** "Show 19 recovered indexed graphics" control for the verified original MK3 **9,186**-asset collection. On success, the local visible Asset Library gains **19 separate selectable image entries (9,205 visible MK3 items)**, with filters switched to the dedicated P76 image group. Existing selected/queued assets are not silently replaced, and source changes/rescans invalidate pending recovery. Normal scans remain exactly **9,186** MK3 assets; no existing decoder, source raw gap, other game collection or P71 baseline is modified.
- `src/core/assets/export.ts` extends indexed ZIP sidecars only where evidence bytes exist: **indices**, **mask**, **firstStream**, **rowXTable**, **rowPointerTable** and **sourceAdjacentRgb8Candidate**. The index grayscale PNG remains the preview; the source candidate RGB table is stored only as a separately named original byte plane, not as `paletteRgb`, a verified native assignment or a colorized canonical image.
- No commercial game data, indexed source bytes, previews, game executable, ZIP media or source table values were committed.

## Verification performed vs pending

**SOURCE-ONLY VERIFIED** — GitHub Actions workflow `.github/workflows/p11-build-smoke.yml` source-build includes `scripts/test-p76-mk3-row-assets.cjs`, malformed-region pointer/skip/literal/terminator/sentinel refusal tests, source-only false ownership controls, indexed ZIP parity and original-baseline-no-automatic-promotion tests. CI checks syntax of the original P76/Chrome runners and Python independent oracle/checkpoint, executes P76 checkpoint refusal controls, plus inherited P72–P75 regression, tracked-file/media guard, production build, TypeScript, and source-offline Chrome boot. Record the exact successful run and code/test SHA only after checking GitHub Actions.

**P75 ORIGINAL SOURCE VERIFIED (historical):** original uploaded `mk3.zip` with 19 source-row-mapped image planes, both row tables and exact compressed bytes was independently verified in P75. This evidence does not itself execute the NEW P76 TypeScript integration.

**NEW P76 ORIGINAL INTEGRATION VALIDATION PENDING:** `scripts/verify-mk3-p76-original.cjs` loads the original DOS installation, first runs independent Python P75 original-byte oracle in a private temp folder, scans the original 9,186-asset collection, explicitly recovers 19 new indexed images, and checks **all 19** indexed/mask, compressed first-stream, row-X, row-pointer and adjacent original RGB8 hashes against independently reconstructed source data and exact ZIP sidecars. It requires 9,205 opt-in items without modifying any original baseline IDs.

**NEW P76 ACTUAL CHROME VALIDATION PENDING:** `scripts/verify-p76-browser-row-assets.cjs` opens real Chrome, loads original MK3 via the directory picker, verifies the library initially shows 9,186, explicitly adds 19, sees 9,205, downloads the first recovered indexed ZIP, then calls `scripts/verify-mk3-p76-browser-independent.py` to independently check its source bytes and PNG RGB/alpha against original DATA.MK3.

**FULL CUMULATIVE P76 GATE PENDING:** `scripts/verify-p76-checkpoint.py` mandates **six** ordered groups on a clean, audited `develop` commit/tree: (1) unchanged **P71** 10-group original three-game baseline, (2) P72 original MK3 source comparison, (3) P72 actual Chrome comparison, (4) P76 source refusals, (5) P76 full original MK3 integrated TypeScript vs independent Python evidence, (6) P76 actual Chrome opt-in indexed download vs original PNG/source oracle. Opening/closing source audits must match exactly. The gate creates a private work directory, records each step's logs/hash, fails closed and never updates `main`.

## Local acceptance commands — Windows PowerShell

All original files/derived ZIPs remain in original private folders / private temporary directory. Run on the original Windows DOS fixture machine from **one clean source checkout**. Use a **new, non-existing** `--work` directory each time.

~~~powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd ci --no-audit --no-fund

# Targeted source-only refusal controls:
node scripts/test-p76-mk3-row-assets.cjs
python scripts/test-p76-checkpoint.py

# Focused original MK3 integration, then build and actual Chrome:
node scripts/verify-mk3-p76-original.cjs "E:\GOG\Games\Mortal Kombat 3\mk3"
npm.cmd run build
$env:NODE_PATH = Join-Path $env:TEMP "mkdos-p68-driver\node_modules"
node scripts/verify-p76-browser-row-assets.cjs "E:\GOG\Games\Mortal Kombat 3\mk3"

# Complete P76 consolidation, including P71 + both P72 original/browser gates:
python scripts/verify-p76-checkpoint.py `
  --mk1 "E:\GOG\Games\Mortal Kombat 1\mk1" `
  --mk2 "E:\GOG\Games\Mortal Kombat 2\mk2" `
  --mk3 "E:\GOG\Games\Mortal Kombat 3\mk3" `
  --work "C:\Temp\mkdos-p76-original-final-NEW"
~~~

Replace the sample MK1/MK2 paths with the **actual** original installation paths on that machine; the fully-qualified paths here are examples, not newly verified paths. The real Chrome tests need Google Chrome and `playwright-core` accessible from `NODE_PATH`, as for the accepted P71 suite. Python Pillow is required for independent PNG pixel readback. The P76 original runner creates private P75 source-oracle exports under system temp and removes them after verification; it never writes original game assets into Git.

## Confidence / outstanding work

- **VERIFIED:** preserved P71 baseline on code-path and source-only tests, optional 19-image UI integration compiled, full original indexed/source sidecar metadata implemented, 16 synthetic malformed-source/provenance refusals, deterministic original-source-row interpretation inherited from verified P75.
- **INFERRED:** source row-X placement and X=-1 no-pixel interpretation until runtime EXE control flow is independently verified; this does not prevent clearly qualified indexed previews.
- **UNKNOWN:** native fighter color ownership; native stage placement/scene order; animation frame membership/timing; interpretation of the 1,611,110 post-row-table bytes.
- **VALIDATION PENDING:** P72 original file and real Chrome gates; new P76 original integrated TypeScript file scan; P76 original Chrome image/ZIP; final P76 same-source whole three-game checkpoint.

**Checkpoint decision:** preserve the current recoverable `develop` commits and independent research workbench; keep `main` at P16. Do not call the fifth pass accepted or create a full release/source ZIP until six original-fixture/browser gates pass. If P76 passes, record the exact tested code commit, tree SHA, original source/report provenance and P76 final summary in a documentation-only checkpoint, and only then consider explicit `main` promotion.

## Windows original-checkpoint P72 Chrome guard fix (2026-11-08)

In a real Windows original-DOS P76 checkpoint invocation, the first **P71 10-group three-game original/browser baseline** and **P72 original MK3 palette source comparison** completed, then the **P72 Chrome comparison** timed out awaiting the palette-comparison heading after selecting original `BLADE.FTR`. The user-provided stderr contained `â€”`, which was **Windows PowerShell mis-decoding UTF-8 log text**, not the actual source or test selector defect. Inspecting the actual committed TSX revealed the real app defect: the **P72 JSX panel condition** used a regex with a **double backslash** `/\\.FTR$/i` (matches a literal backslash before any character), unlike the adjacent correct original FTR-indexed export predicate `/\.FTR$/i`. Thus the existing verified sprite never displayed the P72 panel. This had escaped source-only P72 palette parsing controls and Chrome *boot* smoke, which do not exercise the actual original `BLADE.FTR` selection.

**FIXED:** `src/components/AssetBrowser.tsx` now uses the already-established `/\.FTR$/i` predicate for the P72 color-comparison panel. [Fix commit](https://github.com/87otlto-coder/mk-dos-archive/commit/22bf1d6212ed9860fa31590b9cf86e552e605add) changes no palette assignments or original file parsing. Added `scripts/test-p72-browser-panel-guard.cjs`, which parses **actual TSX regexp literals** to require both original FTR-only conditions accept normal DOS `BLADE.FTR` paths and reject non-FTR resources. Included in P72 source CI. No original native RGB ownership claim is introduced.

**ACCEPTANCE LIMIT:** This records a test-proven source regression fix; until the user pulls current `develop`, builds and reruns `node scripts/verify-p72-browser-cmap.cjs "<ORIGINAL_MK3_FOLDER>"`, **P72 real Chrome comparison remains PENDING**. The full P76 six-group runner must be retried with a fresh private `--work` directory after focused P72 Chrome acceptance. Earlier original P71/P72 groups were successful **on the pre-fix commit** and must not be silently transferred as a same-source full P76 checkpoint PASS.

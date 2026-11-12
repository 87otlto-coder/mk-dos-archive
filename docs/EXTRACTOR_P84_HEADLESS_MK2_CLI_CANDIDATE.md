# P84 — first headless Windows CLI, original MK2 stage-source extraction

**Date:** 2026-11-12  
**Branch:** `interim/p84-headless-mk2-stage-cli` (from P83).  
**Classification:** Source-only Windows CI **VERIFIED**, [Actions run #43294475172](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/43294475172) **SUCCESS** on exact executable source/test/workflow commit `a7a5084407c31b5264b0e5cfdbdde3bbde60c5a1`; P84 original DOS MK2 CLI scan, extract and independent verify **ACCEPTED** from the user's complete original-Windows transcript on test commit `2d4a5537c4bebb8024b37b7691e9ae87d6a0288f` and Git tree `3590c37e508357aaaa144fb6279584717039bf6b` (both GitHub-confirmed). P83 original MK2 real-Chrome import is **ACCEPTED** from the user's full original Windows result on commit `f4377c912e097ca89f559e14e55f9337b72fa4b6` (5,369 → 5,484 assets; 115 source PNGs rechecked; 939,425 original indices; three byte-exact Chrome PNG downloads).

## Why P84 exists

Start extracting without a browser, while retaining the established browser research workbench untouched. This pass creates **only a thin command interface** around the already independently established P82 native MK2 Tomb/Portal exporter and P82 source-byte/PNG verifier. No new source RLE decoder, palette interpreter, animation timer or final scene compositor is introduced. It does **not** perform the complete MK2 5,369-resource scan, nor does it support MK1/MK3 in this initial CLI.

## Committed implementation

- `scripts/mkext.py` — Python 3.11+ command-line entry point: `scan`, `extract`, `verify`. Only `--game mk2` is currently accepted.
- `scripts/test-p84-mkext-cli.py` — original-data-free synthetic controls for command surface, unsupported game, source SHA refusal, source capabilities, producer/verifier correspondence, single-stage behavior, never asserting a passing export on a failed verification, and true refusal of noncanonical dummy game files.
- Reuses `scripts/export-mk2-p82-native-stage-pack.py`, `scripts/verify-mk2-p82-native-stage-independent.py`, and the previously proven `tools/mk2_native_stage_palettes/export_o132_scene_layer_pack.py`. The last two use Pillow for PNG generation/parity; **scan does not require Pillow**. Python and Pillow are local-only dependencies, not bundled copyrighted content.
- `extract` **always** runs the independent source/PNG verifier after the P82 ZIP producer and compares original stage identities and PNG/sprite/setup totals before returning `P84_CLI_EXTRACT PASS`. An independently failing export leaves its private output in place for inspection; it does not claim success or silently overwrite.
- Original files must be canonical four-file MK2 evidence (MK2.EXE, TOMB.GRA, PORTAL.GRA, IMAGES.GRA). Their source fingerprints remain strict P82 gates. All output is exclusively created as a new `.zip` outside both the Git repository and commercial game installation. No original game EXE/GRA bytes are packaged.
- `scan` reports **supported P82 source-group coverage**, *not* a full original-game asset catalog. It does not claim any native palette ownership, stage world coordinates, camera, original animation timeline or parallax.

## Original DOS MK2 CLI acceptance — PASS (2026-11-12)

**All three P84 gates VERIFIED from the user's complete private original-Windows PowerShell transcript.** The user recorded `git rev-parse HEAD` = `2d4a5537c4bebb8024b37b7691e9ae87d6a0288f` and `git rev-parse 'HEAD^{tree}'` = `3590c37e508357aaaa144fb6279584717039bf6b`; GitHub independently confirms this exact commit/tree pair. The committed original-file verifier source and independent P82/O132 mechanisms used by P84 at that tested commit are **Git-blob identical** to their later P84 candidate branch versions.

1. **`P84_CLI_SCAN / PASS`:** Four canonical original DOS files authenticated: `MK2.EXE`, `TOMB.GRA`, `PORTAL.GRA`, `IMAGES.GRA`. Source identity `CANONICAL_P82_FOUR_ORIGINAL_FILES`; only Tomb and Portal stage-source coverage reported. Source group counts and native extents: Tomb 896×48 / 16 uncut sprites / 6 setup-local mosaics / 68 PNG outputs; Portal 896×40 / 13 / 2 / 47 respectively. `fullGameAssetCatalogScanned: false` and `nativeSceneCompositionOrAnimationClaimed: false`.
2. **`P84_CLI_EXTRACT / PASS`:** Its nested producer `P82_EXPORT / PASS` produced a **new** private ZIP under `F:\Dev\MKEXT\FIXTURES\VALIDATION`, `zipMembers: 117`, `uncompressedBytes: 396422`, 115 PNGs, 2 native full-width floors, 29 uncut sprite streams, eight setup-local layer groups and `originalSourceFilesCopiedIntoZip: 0`. Its nested **independent** `P82_INDEPENDENT / PASS` rechecked four original file fingerprints, all 115 PNGs, and **939,425** original source index positions. Stage identities were `["tomb","portal"]`. `nativeCameraOrStageCompositeClaimed` and `nativeAnimationOrParallaxTimingClaimed` both false.
3. **`P84_CLI_VERIFY / PASS`:** A second, separate invocation of the independent verifier against the same private ZIP again returned `P82_INDEPENDENT / PASS`, with four matched original fingerprints, 115 original PNGs, 939,425 indexed source positions, two floors, 29 source sprites and eight setup-local layer groups. No source EXE/GRA contents packaged.

The user then supplied the separate **later** P83 original Windows Chrome `P83_BROWSER / PASS` result on fixed UI/test commit `f4377c912e097ca89f559e14e55f9337b72fa4b6`, testing the same retained private P84 ZIP (opt-in 5,369→5,484 resources, two floor previews, three byte-exact Chrome PNG downloads). The first browser attempt on the **earlier** P84 tree failed at Portal preview due to an observed 48-vs-40 check; it remains historical and does **not** negate the independent P84 CLI results.

**Scope/confidence:** The CLI's **specific implemented MK2 Tomb/Portal source-layer operations are original-fixture VERIFIED**. This is not a complete 5,369-asset MK2 CLI, not MK1/MK3 CLI support, and not a native final stage assembly, original live palette owner, camera or animation timing. Original private media and per-run evidence are retained locally; no commercial/extracted assets committed to GitHub.

## Private Windows PowerShell acceptance

Use the established local layout. Run from a clean checkout of the candidate branch, with originals and outputs outside SOURCE:

```powershell
$ErrorActionPreference = "Stop"
Set-Location "F:\Dev\MKEXT\SOURCE\mkdosext"
git fetch origin
git switch interim/p84-headless-mk2-stage-cli
git pull --ff-only origin interim/p84-headless-mk2-stage-cli
git status --short
$env:PYTHONDONTWRITEBYTECODE = "1"
$mk2 = "F:\Dev\MKEXT\FIXTURES\mk2\mk2"
$validation = "F:\Dev\MKEXT\FIXTURES\VALIDATION"
New-Item -ItemType Directory -Path $validation -Force | Out-Null
python .\scripts\test-p84-mkext-cli.py
if ($LASTEXITCODE -ne 0) { throw "P84 source-only tests failed" }
python .\scripts\mkext.py scan --game mk2 --source "$mk2"
if ($LASTEXITCODE -ne 0) { throw "P84 original scan failed" }
$archive = Join-Path $validation ("P84-MK2-" + [guid]::NewGuid().ToString("N") + ".zip")
python .\scripts\mkext.py extract --game mk2 --source "$mk2" --stage both --out "$archive"
if ($LASTEXITCODE -ne 0) { throw "P84 independent original-source extract failed" }
python .\scripts\mkext.py verify --game mk2 --source "$mk2" --archive "$archive"
if ($LASTEXITCODE -ne 0) { throw "P84 independent ZIP replay failed" }
```

**Required original acceptance:** same original MK2 source identities, `P84_CLI_SCAN PASS`, `P84_CLI_EXTRACT PASS` backed by `P82_EXPORT PASS` and `P82_INDEPENDENT PASS`, `P84_CLI_VERIFY PASS`, exactly **two full-width floor planes**, **29** native uncropped sprite streams, **eight** setup-local mosaic groups, **115** original-index/opacity/qualified-preview PNGs (**117** ZIP members), **939,425** independently checked original index positions; original EXE/GRA files excluded. Preserve exact terminal JSON and tested source commit/tree if claiming same-tree original acceptance. Do not upload the generated ZIP, PNGs, original files or local screenshot captures to GitHub.

**P83 separate browser gate ACCEPTED (2026-11-12):** User's complete original DOS MK2 Windows output confirmed `P83_BROWSER / PASS`, original 5,369 → 5,484 optional Asset Library representations, 115 original P82 source PNGs independently rechecked, 939,425 original source index positions and three Chrome-download PNGs byte exact on the tested P83 fix. This proves the browser importer and original P82 ZIP/source verifier, **not** the independent `P84_CLI_SCAN`, `P84_CLI_EXTRACT` or `P84_CLI_VERIFY` command runs. The separate P84 CLI scan/extract/verify original Windows output has now been supplied and accepted as recorded above.

## Research confidence

- **VERIFIED inherited original P82:** user-reported independent original-source archive check, pixel parity across both native floors, sprite streams and setup-local mosaics; precise source/pack identities limited to evidence actually supplied.
- **VERIFIED source-only in hosted Windows CI:** P84 CLI syntax, synthetic refusal and CLI-contract tests, production build, inherited P81/P82/P83 regression and offline Chrome boot all passed on the exact P84 executable source SHA; no copyrighted original fixtures were present.
- **VERIFIED original-user-fixture results:** P84 CLI scan/extract/verify PASS on committed source/tree with all original source and exported PNG checks; P83 real Chrome import PASS on later fixed UI/runner commit. The actual private original files, ZIP and downloaded PNGs were not directly accessed through the GitHub connector; evidence is the complete user's test transcript and committed verifiers.
- **UNKNOWN:** original live stage palette ownership, final compositing, animated frame ordering, timing, camera and parallax.

P84 is the third interim pass in the P82–P86 cycle. Keep P86 for consolidation and a full checkpoint if justified; do not restructure or delete the browser workbench, overwrite original sources, or publish extracted copyrighted assets.

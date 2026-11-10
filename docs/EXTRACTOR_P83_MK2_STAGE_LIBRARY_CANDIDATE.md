# P83 — MK2 native-width Tomb and Portal layers in Asset Library

## P83 canonical original-file fingerprint correction — 2026-11-10

**SOURCE CORRECTION VERIFIED; ORIGINAL WINDOWS CHROME STILL PENDING.** A fresh read of the original privately supplied `mk2.zip` confirmed **614 original files** and independent SHA-256 matches for the canonical `MK2.EXE`, `TOMB.GRA`, `PORTAL.GRA` and `IMAGES.GRA`. The P83 TypeScript importer had inadvertently pinned `IMAGES.GRA` as a **51-character truncated digest** instead of the source-confirmed 64-character SHA-256. As written, P83 would reject the canonical original installation before examining the P82 stage ZIP. The P82 producer and independent Python verifier already contained the correct complete value.

- Corrected P83 fingerprint at source commit [`0c0edac`](https://github.com/87otlto-coder/mk-dos-archive/commit/0c0edacdf3baab7ea9647ce148a3f6135fd97bbe); added a source regression test ensuring all four digests are full-length and pinning the independent original `IMAGES.GRA` value at [`6160fe4`](https://github.com/87otlto-coder/mk-dos-archive/commit/6160fe466884d543040c2710ad358fcd6ed70264).
- Source-only [GitHub CI 42904870734](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42904870734) **SUCCESS** on the exact source/test commit `6160fe4`, including production build and P83 tests. This is not original DOS Chrome acceptance.
- Independently bounded raw original floor source spans: `TOMB.GRA` offset 63,776 through EOF contains 43,008 bytes (896 × 48), SHA-256 `c8b68c1b14f8c031ec55882438aff366ddcc2a254a01744febf04d19b3fc37a7`; `PORTAL.GRA` offset 56,916 through EOF contains 35,840 bytes (896 × 40), SHA-256 `eb99434188317a0adac30f378c2362b857efcba7690180bd60dc80b9432158ff`. These are **native source index bytes, not confirmed full stage renders**.
- No copyrighted extracted pixels or original files were committed. **NEXT:** run the existing P83 Windows/real Chrome fixture verifier using the privately independently verified P82 ZIP; keep the original `5,369 → 5,484` import and three PNG download acceptance explicitly **VALIDATION PENDING** until that result is observed.


Date: 2026-11-10. Branch: interim/p83-mk2-stage-library. Second interim pass in P82–P86 cycle. Source-only implementation/tests and production build verified in CI when final run completes; **actual original Windows MK2 Chrome import and ZIP download validation pending**. Stable develop retains accepted P81 and main remains unchanged. No commercial game files or extracted copyrighted PNG/ZIP outputs have been pushed.

## Objective and previously accepted evidence

P82's original DOS MK2 independent report returned P82_INDEPENDENT PASS from the user's Windows fixture: **two original stage floor planes**, **29 original uncut sprite streams**, **eight source setup-local layer mosaics**, **115 PNG files**, **939,425 source index positions** and **four original file fingerprints** verified. The separate P82_EXPORT stdout and tested source tree were not supplied, so no such exact result is claimed.

P83 makes that already independently checked private P82 ZIP browseable inside the extractor. It deliberately **imports the independently accepted ZIP**, rather than copying the O132/P82 Python RLE/palette decoder into a second unverified TypeScript implementation.

## Implementation

- src/core/assets/mk2NativeStageZipP83.ts checks all four original DOS MK2 source SHA-256 fingerprints from the user's selected game directory. It checks the separate private P82 ZIP's exact 117 ZIP-member census (115 PNGs and two original manifest JSONs), original source SHA identities, PNG hashes, native dimensions, original source layer groups, sprite/setup ownership and all uncertainty flags. It refuses altered/duplicated/missing entries, cropped floors, false stage/camera/animation claims, unknown source identities or unsafe file paths. It preserves every original PNG byte exactly in memory as a source-backed Asset, without fabricating a new index or opacity plane in metadata.
- src/components/AssetBrowser.tsx adds a visible **Import verified P82 stage-layer ZIP** file picker only after the original MK2 baseline of **5,369** resources has been scanned. The user may select the private ZIP under FIXTURES/VALIDATION and browse original full-width stage floors, separate native sprite index/opacity/RGB PNGs and setup-local mosaics in independent resource groups. Each individual PNG download preserves the original archive bytes and a unique stage-qualified filename. Source PNG preview uses a browser blob image URL only for display; indexed/opacity bytes are not silently converted to RGBA export data.
- Expected P83 optional MK2 catalogue count is **5,369 original + 115 imported source PNGs = 5,484**. The default original MK2 catalogue and accepted P81 numbers remain unchanged. This **optional count is not original Chrome accepted** until the real source test passes.
- Source breakdown: Kombat Tomb 896 × 48 native indexed floor plus qualified RGB preview; 16 uncut source sprites and six source setup-local mosaics; **68 total PNGs**. The Portal 896 × 40 floor, 13 native sprites, two setup-local mosaics; **47 PNGs**. Across both stages: **115 PNGs**, 29 native sprite streams and eight setup-local source mosaics.

## Verification and confidence

- scripts/test-p83-mk2-stage-layer-archive.cjs tests a full 115-PNG synthetic archive, correct stage inventory, source filename uniqueness, original metadata and raw PNG byte retention, and refuses missing/altered source, extra ZIP members, false animation/camera/palette claims and abort/invalid baseline cases. GitHub CI contains no commercial game data.
- scripts/verify-p83-browser-stage-layers.cjs, **ORIGINAL WINDOWS CHROME PENDING**, loads the original game through the real directory picker, confirms 5,369 original resources, imports the user-selected private P82 ZIP explicitly, checks 5,484 optional resources, previews both 896-column native floor PNGs, downloads the original Tomb and Portal indexed floor images and one original sprite opacity image, and confirms original sprite/mosaic groups remain accessible.
- scripts/verify-mk2-p83-browser-independent.py, **ORIGINAL SOURCE PENDING**, reopens all four original files and the P82 private source ZIP through the separate P82 independent verifier, rechecks the original **115 PNGs and 939,425 source index positions**, then demands byte-for-byte identity for each of three real Chrome downloaded source PNGs.
- Original live palette assignment, final multi-layer stage world placement, original camera offsets, frame sequence, timing and parallax are **UNKNOWN**. The source EXE 80-entry records are authenticated fixed-source color comparisons only. P83 does not construct a native final widescreen composite or synthesize animation.

## Original Windows reproduction

Use the user's required file layout: repo at F:\Dev\MKEXT\SOURCE\mkdosext, utilities in F:\Dev\MKEXT\TOOLS and game originals/private test output in F:\Dev\MKEXT\FIXTURES. Original MK2 is F:\Dev\MKEXT\FIXTURES\mk2\mk2. Reuse the exact private P82 ZIP already independently checked in the previous step; do not guess its filename if the PowerShell session was restarted. The P83 work directory must be a NEW, nonexisting path beneath FIXTURES\VALIDATION.

PowerShell:

    cd "F:\Dev\MKEXT\SOURCE\mkdosext"
    git fetch origin
    git switch interim/p83-mk2-stage-library
    git pull --ff-only origin interim/p83-mk2-stage-library
    git status --short
    npm.cmd run build

    $env:PYTHONDONTWRITEBYTECODE = "1"
    $env:NODE_PATH = "F:\Dev\MKEXT\TOOLS\playwright-driver\node_modules"
    $mk2 = "F:\Dev\MKEXT\FIXTURES\mk2\mk2"
    $validation = "F:\Dev\MKEXT\FIXTURES\VALIDATION"
    # $archive must be the actual private P82 ZIP that passed P82_INDEPENDENT:
    Test-Path $archive
    $work = Join-Path $validation ("P83-" + [guid]::NewGuid().ToString("N"))
    node .\scripts\verify-p83-browser-stage-layers.cjs "$mk2" "$archive" "$work"

Expected required original result after the test is run: P83_BROWSER PASS, 5,369 original MK2 resources, 115 explicit added source PNGs, 5,484 total optional resources, 115 original P82 PNGs independently rechecked, 939,425 original source index positions verified, three original Chrome downloaded PNGs byte-exact, and no native animation/camera/palette claims.

Never add original commercial game files or private extracted PNGs/ZIPs to Git. P86 is the fifth-pass consolidation; do not change stable main or develop for this interim candidate.

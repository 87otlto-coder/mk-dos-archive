# P78 candidate — 197 additional chained original MK3 indexed images in Asset Library

**Date:** 2026-11-08. **Cycle:** second interim pass, P77–P81. **Branch:** `develop`. **Status:** P78 app source, source-only synthetic/ZIP tests, build/TypeScript/offline Chrome boot **VERIFIED**; new full original DOS application test and real Chrome opt-in/ZIP download **VALIDATION PENDING**. Stable `main` P16 unchanged. No release/source bundle checkpoint.

## Dependency and reason for change

The accepted **P76** browser presented the original three-game **17,211**-asset baseline (MK1 **2,656**, MK2 **5,369**, MK3 **9,186**) and offered **19** separately recovered MK3 first-record source-indexed images by explicit opt-in (**9,205** visible MK3 assets; **17,230** optional combined). Independent original DOS **P77** source decoding subsequently established **197 additional** complete records after the first records in 19 original non-IFF intervals: **216 source images total**, **8,667,438** index/mask positions, **2,164,384** original painted indices. Its exact committed Python exporter/independent verifier **PASSED** against original private `mk3.zip` and the accepted P75 archive, including **1,296** source-sidecar byte parities and **432** PNG source pixel comparisons. P77 never altered the app.

## P78 implemented in committed source

- `src/core/assets/mk3ChainedSourceImagesP78.ts`: source-SHA-bounded additional chain recovery using the already accepted P76 row codec, with exact original 416 IFF/20 raw partition and **9,205**-item P76 opt-in prerequisite. Refuses incompatible native original SHA, accepted P76 first source planes/streams/row tables, missing or duplicated P76 identities, invalid source record count, missing bounds, altered/ambiguous provenance or row pointers. Iterates the 19 original gap chains and checks expected source counts `[2,11,50,16,5,2,6,1,4,19,4,5,5,28,2,1,4,12,39]`, **216** source-record census and **197** new source records. Exact additional original source count requirements: **6,616,595** index and mask positions per plane, **1,167,687** painted indices, **8,475** omitted source rows, **21,796** declared source rows, **1,611,110** previously unknown post-first record bytes now fully chained. New assets have individual source offsets/lengths, six exact binary planes, indexed grayscale preview, and UNKNOWN native palette/renderer/stage/animation tags. Distinct existing P76 asset IDs, raw evidence and baseline are left intact.
- `src/components/AssetBrowser.tsx`: sequential explicit buttons **“Show 19 recovered indexed graphics”** and **“Show 197 additional indexed graphics”**. Second button requires completed first P76 opt-in and creates a separate filtered image group with original source metadata and indexed ZIP export through existing evidence-preserving ZIP code. It does **not** auto-load or replace source assets, infer native frame order/timing, or colorize sprites with the adjacent unlabeled RGB8.
- `scripts/test-p78-mk3-chained-indexed.cjs`: source-only synthetic chain source row, opacity, RGB8 evidence, 6-sidecar indexed ZIP and malformed first/second-row/pointer/geometry, source identity, reset/UI opt-in guard tests.
- `scripts/verify-mk3-p78-original.cjs`: **validation pending**, actual original-data end-to-end Node/Vite TS source scan + P76 first-19 + P78 additional 197; regenerates private P75 and P77 archives, runs independent P77 original source/432 PNG verifier, then compares **all 197** P78 in-app indexed planes and **1,182** ZIP sidecars to original source hashes. It reports the exact original MK3 **9,186 → 9,205 → 9,402** source representation if successful. It does **not** constitute real Chrome acceptance.
- `scripts/verify-p78-browser-chained.cjs` and `scripts/verify-mk3-p78-browser-independent.py`: **validation pending**, actual Chrome original directory import and sequential opt-ins; check 19 first P76 assets survive, 197 separate P78 images, first additional record selection and downloaded indexed ZIP with independently checked original source row tables, index/opacity, PNG grayscale RGBA parity and native palette UNKNOWN. Only if real Chrome passes may the optional combined representation count be treated as **17,427**, with default three-game baseline unchanged.
- `.github/workflows/p11-build-smoke.yml`: source synthetic controls, original-acceptance and real Chrome test **syntax only** (commercial game fixture absent), inherited original-independent scripted controls, commercial-tracked-media guard, TypeScript, Vite build, offline Chrome boot.

## Verification classification

**SOURCE IMPLEMENTATION VERIFIED:** [GitHub Actions 42520990435](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42520990435) **SUCCESS** on commit `2b0cbc300c78f379744cca5a2c9c2639fc5d2379`, including P78 synthetic indexed stream/ZIP and refusal controls, TypeScript, Vite and offline browser boot. Earlier P77 original standalone Python extraction/independent verifier **PASSED** on original DOS `DATA.MK3` SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.

**VALIDATION PENDING:** P78 exact integrated original MK3 TypeScript scan/197 asset readback, and the actual Chrome Asset Library 19+197 workflow/download. **Do not claim 9,402 actual original in-browser assets or 17,427 accepted combined outputs yet.**

**UNKNOWN:** native palettes, source-group/native animation relationships/sequence and timing, stage compositing, runtime row placement. Original first **1,840,634** non-IFF source bytes remain undecoded and preserved.

## Windows reproduction (original DOS game stays private)

~~~powershell
cd "$HOME\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd run build
$env:NODE_PATH = Join-Path $env:TEMP "mkdos-p68-driver\node_modules"
$mk3 = 'E:\GOG\Games\Mortal Kombat 3\mk3'
node .\scripts\verify-mk3-p78-original.cjs "$mk3"
node .\scripts\verify-p78-browser-chained.cjs "$mk3"
~~~

Only mark original source and real Chrome acceptance after their **actual** respective `P78_ORIGINAL PASS` and `P78_BROWSER PASS` machine-readable results have been checked. The browser run requires Chrome, external Playwright-core, and Python/Pillow; all original data/private extracted ZIPs stay outside Git. Continue from accepted P76 without deleting/replacing its research workbench. P81 remains the consolidation checkpoint, not P78.

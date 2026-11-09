# P78 — MK3 197 additional chained source images integrated as a second opt-in collection

## P78 accepted on original Windows MK3 and Chrome

Windows original MK3 acceptance, reconciled 2026-11-09. The user confirmed two `P78_ORIGINAL PASS` runs and a separate `P78_BROWSER PASS`. The full scanner loaded 66 original files. MK3 had 9,186 default assets, 9,205 with the 19 P76 images, and 9,402 with the additional 197 P78 images. P76 asset IDs were preserved. The original runner checked 6,616,595 additional indexed positions per plane, 1,167,687 painted pixels, 8,475 source-absent rows and 1,182 sidecar hash/ZIP checks. Its independent original-source and 432-PNG oracle passed. DATA.MK3 SHA-256 was `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.

Chrome independently checked 7,950 indexed positions on the first new record, including source stream, row tables and downloaded PNG pixel parity. The original runner's `originalChromeBrowserVerified:false` describes that runner alone. Neither stdout identifies a tested Git tree. Native palette ownership, stage membership, renderer placement, animation order and timing remain unknown. Both P78 gates are accepted on user-supplied evidence. Earlier pending labels below describe pre-acceptance history.

**Date:** 2026-11-08. **Cycle:** P77–P81, second interim pass. **Branch:** `develop`. **Status:** integrated source/UI and synthetic refusal CI **PASS**; actual original DOS source *isolated exact committed TypeScript* and indexed plane parity **PASS**; complete original-data scanner plus *real Chrome browser* **VALIDATION PENDING**. This is not a new three-game checkpoint or a release.

## Accepted baseline retained

P76 is an accepted original DOS three-game and actual Chrome **6/6** consolidation on code commit `a5192ce0f1dca2ad765571cb6c1dae68ac30411f` (tree `2eac170cc3d7f79e135d71d639ed47ed3552f137`). It established MK1 2,656 + MK2 5,369 + MK3 9,186 = **17,211** default representations, plus an explicit P76 MK3 **19-image** option, making 9,205 MK3 and **17,230** optional combined representations.

P77's separately verified *original* MK3 `DATA.MK3` (SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`) has **216** successive source-indexed image records in 19 known non-IFF spans, of which 19 were already P75/P76 first records and **197 new records** occupy exactly the formerly unresolved **1,611,110 source bytes** after their row-X and row-offset tables. Source group lengths and row semantics were independently proved against original bytes. The leading **1,840,634 original non-IFF bytes remain UNKNOWN**. No native stage/compositor/animation sequence or palette attribution was proved.

## IMPLEMENT — actual committed code

- [`src/core/assets/mk3ChainedSourceImagesP78.ts`](../src/core/assets/mk3ChainedSourceImagesP78.ts) adds `decodeMK3P78ChainedGap` and `recoverMK3P78AdditionalChainedAssets`. It **reuses P76's independently accepted `decodeMK3P76SourceRowRegion`**. Recovery requires a canonical 9,205-asset P76 library with original 20 raw intervals, 416 IFF embedded-CMAP images and 19 P76 image objects. It SHA-verifies the complete original DATA.MK3 and source partition, byte-compares each original P76 first image's indices/mask/original compressed stream/row X/row pointer/adjacent unlabeled source RGB8 to avoid weakening the accepted P76 proof, then decodes each later record up to the original gap boundary.
- Every new image has original source offset/length, region ordinal, within-region source record ordinal, preceding P76 source identity, original stream/table offsets, row sentinel count, indexed plane, opacity mask, grayscale RGBA, original stream and table bytes, and unlabeled candidate RGB8. Native renderer semantics, native palette ownership, actual animation order/timing, stage or fighter association remain **UNKNOWN**. Source-record order is expressly NOT treated as game animation order.
- [`src/components/AssetBrowser.tsx`](../src/components/AssetBrowser.tsx) adds a **separate button** `Show 197 additional indexed graphics` only after the accepted `Show 19 recovered indexed graphics` P76 action. The indexed image filter then shows a dedicated `DATA.MK3 · additional chained indexed (P78)` group. P76's first 19 and the original raw 20 remain unchanged; source changes/rescans abort stale P78 work. The new images use existing deterministic PNG and indexed ZIP exports with original first compressed stream, signed X and unsigned row-pointer tables, indexed pixels and mask and comparison-only adjacent RGB bytes.
- The application counts are **9,186 default MK3 → 9,205 after original P76 opt-in → 9,402 after new P78 opt-in**, or **17,427 optionally represented across all three games**. These counts are implemented and source-tested but **not yet accepted as a real Chrome original-DOS browser result**. Existing P76 historical acceptance numbers are unchanged.
- No original DOS files, extracted graphics, RGB bytes, index planes, generated ZIPs or screenshots were committed. Existing workbench and other game decoders were not restructured.

## TEST / EVIDENCE CLASSIFICATION

**VERIFIED ORIGINAL BYTE EVIDENCE — P77**: exact, actually committed Python P77 source modules (downloaded from successful GitHub CI artifact and run against original `mk3.zip`) produced **216 source records**; the independently accepted P77 verifier checked **432 PNG image files pixel by pixel**, **1,296 source-related binary planes (20,021,844 bytes)** and first 19 record source parity with the original accepted P75 archive. [P77 handoff](EXTRACTOR_P77_MK3_CHAINED_SOURCE_IMAGES.md).

**VERIFIED ORIGINAL BYTE EVIDENCE — P78 ISOLATED CODE**: downloaded actual compiled-source TypeScript units from GitHub Actions [42521145814](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42521145814), executed *those committed TypeScript functions*, including the P76 first-image decoder, using Node TypeScript transpilation directly against the actual original `DATA.MK3`. Original IFF 416/source raw 20 spans came from the independent source readback; **the other unrelated MK3 asset slots were synthetic** to meet the accepted 9,186-item fixture boundary. Result **`P78_ORIGINAL_TYPESCRIPT_ISOLATED:PASS`**: P76 first 19 images retained; **197** new source-indexed images; **6,616,595 original indexed positions**, preview RGBA pixels checked individually; **1,167,687 explicitly painted source pixels**; **8,475 omitted-source scanlines**; **1,182** exact original plane SHA-256 matches totaling **14,839,572 original evidence bytes**; no native palette/timing/stage ownership. **This is not the full original MK3 scanner or Chrome UI test.** The exact source blobs are `23439529d4c1da685aadd395b29a78c106feee06` (P78 chained TS) and `1d04a238e3659072363364904e132b08be5cb475` (unchanged P76 original TS), checked against GitHub.

**VERIFIED SOURCE-ONLY CI:** [GitHub Actions 42521145814](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42521145814) **SUCCESS**, exact code/workflow commit `be738ffc1894b79b50ee60db195a408fefca7391`: P77 synthetic and independent-script syntax, P78 source chain/ZIP/false-sentinel/invalid stream and actual UI predicate controls, P72–P76 inherited source CI, tracked media safety guard, Vite production build, TypeScript lint, offline headless Chrome boot. No commercial assets in source-only CI.

**VALIDATION PENDING / source-only runner syntax already committed:**
- [`scripts/verify-mk3-p78-original.cjs`](../scripts/verify-mk3-p78-original.cjs) — opens the user's actual original MK3 installation, scans the **full genuine 9,186-item MK3 collection**, adds P76's 19 and P78's 197, independently recomputes the full P77 original source archive and verifies all **1,182** P78 binary planes, corresponding exact ZIP sidecars, source row metadata and legacy asset ID preservation. This has **not** yet been executed on the full original MK3 installation.
- [`scripts/verify-p78-browser-chained.cjs`](../scripts/verify-p78-browser-chained.cjs) — opens **real Chrome** on an original DOS MK3 directory, checks original baseline **9,186** → P76 **9,205** → P78 **9,402**, P76 filter preservation, P78 count **197** paginated in groups of 60, downloads P78 first new indexed ZIP, then invokes the [independent original DOS PNG/stream/row-table ZIP oracle](../scripts/verify-mk3-p78-browser-independent.py). This has **not** been executed in real Chrome.
- These are focused interim-pass acceptance gates. The next scheduled full three-game fifth-pass consolidation is P81.

## Windows PowerShell — focused original MK3 and Chrome verification

Run from `develop`, using the original local DOS MK3 directory. The user has previously verified original `$mk3` in PowerShell; if in a new session, set it to the actual MK3 folder containing `MK3.EXE`. Original installation media is read-only.

~~~powershell
cd "$HOME\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
$env:NODE_PATH = Join-Path $env:TEMP "mkdos-p68-driver\node_modules"

node scripts/test-p78-mk3-chained-indexed.cjs
node scripts/verify-mk3-p78-original.cjs "$mk3"
npm.cmd run build
node scripts/verify-p78-browser-chained.cjs "$mk3"
~~~

The original source runner creates isolated temporary P75/P77 ZIP exports and removes them after independent verification. It never writes the commercial game media to the Git repository. The original Chrome runner downloads a private source-indexed ZIP and immediately verifies original bytes and PNG pixels; original palette ownership remains UNKNOWN. The latest P78 source CI success does not imply these runs passed.

## NEXT / priority

P78 is the **second interim pass**. The current highest-value next task is to **complete focused original full-source and real Chrome acceptance** for the 197 in-app images. Afterwards, P79 can prioritize additional missing stage/background or sound/speech/music extraction capability based on actual source and fixture evidence—not speculative gameplay research. P81 should consolidate the five-pass cycle with the existing P76 baseline. No `main` promotion or full source release now.

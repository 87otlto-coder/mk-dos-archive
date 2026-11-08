# P69 — Source-preserving MK3 fighter indexed bundle export

Date: 2026-11-08. Development branch: `develop`; stable `main` remains at P16. This is the **third interim pass** of the P67–P71 cycle. P66 is the last accepted full original DOS three-game fixture checkpoint (**17,211** assets, MK1 **2,656**, MK2 **5,369**, MK3 **9,186**). P67 and P68 passed focused real Chrome directory/upload, download and same-tab switching acceptance on original game installations.

**Status: P69 source-only CI PASS and independent original MK3 sprite-source decode PASS. P69 integrated extractor ZIP/original-fixture and live browser download VALIDATION PENDING.**

## OBSERVE — export completeness gap

- Existing MK3 library `scanMK3` extracts **6,654 fighter sprite representations** from 17 original `.FTR` containers. Each sprite has a source-backed compressed byte interval and original FHDS descriptor information, a row-major indexed pixel array, a binary opacity mask and a grayscale preview. The **native fighter palette and gameplay animation sequences remain UNKNOWN**.
- P49 already provides an indexed image ZIP for the **416 DATA.MK3 IFF images with their own embedded CMAP**. It must not be generalized to the fighter FTR palette domain.
- A user can export one indexed sprite at a time or manually add hundreds of sprites to a generic selection. There was **no one-click per-original-container export** for all decoded native index and mask planes together.
- This is an extractor usability/completeness problem, not a new original-game format discovery. Reuse the verified decoder, never assign RGB palettes or group frames into hypothetical gameplay animation sequences.

## IMPLEMENT — on-demand per-FTR export (no extra registered assets)

`src/core/assets/mk3FighterIndexedBundleP69.ts` implements `buildMK3FighterIndexedBundleP69(assets,originalFtrPath)`. It works only with an original relative `.FTR` path and verified `kind:'sprite'` assets from that exact source file. It refuses missing/wrong source SHA-256, nonpositive compressed intervals, missing source descriptor fields, duplicate asset or descriptor IDs, incomplete index/mask planes, nonbinary opacity masks, forged native palette claims and inconsistent dimensions.

The generated `MK3_P69_<FTR>_ORIGINAL_INDEXED_SPRITES.zip` contains a **manifest**, a **README** and two **exact decoded source planes per FHDS frame**: `frames/00000_indices.bin` (original palette indices), `frames/00000_mask.bin` (0 transparent / 1 opaque). Its manifest records:

- The exact original FTR path and whole-file SHA-256 from the existing `scanMK3` source record.
- Original FHDS header offset, descriptor index, mode, bit depth, model/group, original descriptor-local X/Y, width/height and expanded byte size, plus exact original compressed FDAT **file-relative byte interval**. The compressed original source bytes are **not** duplicated in this ZIP; retain the installed FTR.
- Separate SHA-256 for every native index and opacity plane, original sprite ID and explicit `false` native palette, runtime animation order, timing and gameplay sprite identity claims.
- Frames are listed in **FHDS descriptor encounter order**, **not** native animation playback order, Z-order, character identity or stage placement.

`src/components/AssetBrowser.tsx` exposes **Export all original indexed sprites from this FTR** when inspecting an MK3 fighter sprite. The archive is generated **on demand** to avoid retaining a second copy of every MK3 indexed plane for all 17 FTR files at scan time. The control guards against a late export from a previously unmounted game session; it shows errors explicitly. No original extractor decoder, asset ID, raw indexed representation, native palette binding or forensic workbench behavior changes.

## TEST — source-only and independently authenticated original source

### Source-only CI — VERIFIED

[GitHub Actions 42477148423](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42477148423) **SUCCESS** on P69 code/test/workflow SHA `5c64ea3e83262f49b28d8f2f75a16b39f43d0bd1`. It ran `scripts/test-p69-mk3-ftr-indexed.cjs`: positive two-container synthetic export including original binary parity, descriptor ordering and refusal of **15** falsified source/geometry/palette/ID inputs. The original fixture runner and browser runner are syntax checked (Python via AST); TypeScript, production Vite build, existing P62–P68 source controls, source guard and offline Chrome startup also passed. **No original commercial DOS files ran in GitHub CI.**

### Independent original input probe — VERIFIED, not integrated P69 ZIP acceptance

The original **private** `mk3.zip` supplied in this conversation was inspected in the current runtime. `mk3/MK3.EXE` SHA-256 matches the canonical `8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0` (1,496,497 bytes). Independently enumerating **17 FTRs** found **6,654** FHDS frame descriptors with their expected source FDAT intervals, compression mode and geometry. A *separate Python packed-bitstream/row-decoder*, independent of the TS exporter, decoded **all 6,654** original frames without errors and reconstructed **32,675,690 indexed pixel positions** of which **11,689,513 are opaque**. This is direct original-input/decode evidence, **not proof that the new browser-selected ZIP contains those bytes**. The private original binaries and extracted pixels were not committed.

### Original extractor ZIP acceptance — VALIDATION PENDING

`scripts/verify-mk3-p69-ftr-indexed.cjs` scans the full original MK3 installation, requires the MK3 asset census **9,186** and 17 FTRs / 6,654 sprite assets, builds all **17** per-container ZIPs and checks each ZIP entry against current Asset Library arrays and original file identities. It then runs `scripts/verify-mk3-p69-ftr-independent.py` to independently re-read each original MFIL directory, FHDS descriptor, FDAT packed interval and native bitstream, check all masks/indices byte-for-byte and verify archive CRCs, hashes and explicit UNKNOWNs. A final `status:PASS` is emitted **only after the independent original-file readback succeeds**. It writes only private local output.

Reproduce (PowerShell on the updated `develop` checkout):

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd ci --no-audit --no-fund

node scripts/verify-mk3-p69-ftr-indexed.cjs `
  "E:\GOG\Games\Mortal Kombat 3\mk3" `
  "C:\Temp\mkdos-p69-original-ftr-results"
```

Expected *only if executed and observed*: `pass:"P69"`, `status:"PASS"`, `mk3Assets:9186`, `originalFtrContainers:17`, `originalIndexedSprites:6654`, `independentlyDecodedPlanes:6654`, with complete index/mask readback and original-source intervals. The generated private work folder contains manifest-provenanced FTR ZIPs and `p69-summary.json`.

### Original Chrome export acceptance — VALIDATION PENDING

`scripts/verify-p69-browser-ftr.cjs` launches an actual Chromium browser on the built extractor, uploads the original MK3 game directory, checks the 9,186-asset library, selects a BLADE.FTR indexed sprite, clicks the new **Export all original indexed sprites from this FTR** control and downloads its ZIP. `scripts/check-p69-browser-ftr.py` independently checks every downloaded BLADE frame against original MFIL/FHDS/FDAT and compressed bitstream source bytes. This browser gate was **not** performed in this chat and is distinct from offline headless Chrome boot.

```powershell
npm.cmd run build

$driverDir = Join-Path $env:TEMP 'mkdos-p68-driver'
npm.cmd install --prefix $driverDir --no-audit --no-fund playwright-core@1.62.1
$env:NODE_PATH = Join-Path $driverDir 'node_modules'

node scripts/verify-p69-browser-ftr.cjs `
  "E:\GOG\Games\Mortal Kombat 3\mk3"
```

The browser test expects `pass:"P69_BROWSER"`, `status:"PASS"` and original BLADE.FTR indexed-plane byte parity. Any failure must be reported; do not infer success from prior P68 UI evidence.

## CLASSIFY — evidence and next steps

**VERIFIED:** P69 production source/test CI and 15 synthetic refusals; canonical original MK3.EXE fingerprint; full independent original MK3/FTR frame enumeration and native indexed bitstream row decode (6,654). **VALIDATION PENDING:** integrated 17 ZIPs and original full collection on current source; actual P69 browser button/download readback; current-source full three-game regression.

**UNKNOWN / not asserted:** native fighter palette selection/ownership, animation frame timing and sequence membership, gameplay sprite names, layer draw order, global placement, original audio-event usage and original stage composition.

**Next P70:** improve one other measurable extractor gap based on completed P69 original-asset acceptance. **P71** is the next fifth-pass full MK1/MK2/MK3 original-fixture consolidation. No release packaging or `main` promotion during this interim pass; no original DOS game binaries, extracted copyrighted sprites or export ZIPs in GitHub.

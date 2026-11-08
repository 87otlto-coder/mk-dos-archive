# P72 — Original MK3 fighter indexed sprite / embedded IFF CMAP comparison

**Date:** 2026-11-08. **Cycle:** P72–P76, first interim after accepted P71. **Branch:** `develop` only; stable `main` remains at P16. **Status:** source-only CI **PASS**; original MK3 input palette inventory **VERIFIED**; integrated original-file ZIP/PNG and actual Chrome one-click acceptance **VALIDATION PENDING**. This does **not** establish native fighter palette ownership.

## OBSERVE — source interpretation boundary

P71 accepted a cumulative original MK1/MK2/MK3 regression (**17,211** total = MK1 2,656; MK2 5,369; MK3 9,186) and all P67–P70 actual Chrome workflows. Existing P69 MK3 fighter ZIPs preserve **6,654 original indexed frames** with native indices, masks, original FHDS geometry and compressed source extents. Their `palette:'UNKNOWN'` / `visualization:'GRAYSCALE_INDEX_MAP'` classification is intentional.

P49 independently verified that `DATA.MK3` IFF images carry source-explicit **RGB8 CMAPs**, but it did **not** establish MK3 fighter palette ownership, per-frame runtime selection or stage relationships. Direct inspection of the privately supplied original DOS `mk3.zip` establishes:

- Original `BLADE.FTR` **763,526 bytes**, SHA-256 `992a3bd7a659ca2531e1396bb42761c8d546b268234034b11315f6e770f6f02d`.
- Original `DATA.MK3` **9,015,508 bytes**, SHA-256 `72905bc96b752bceb0055296e26b904402909f73a1401541c0dd175135a55517`.
- Exactly **416 original IFF FORM images**, each exposing one 256-entry (768-byte RGB8) CMAP. The exact source CMAP bytes represent **125 distinct tables**; repeating an identical table in different source images does not establish native fighter ownership.
- The first original IFF FORM starts at file offset **0**, length **42,714**, CMAP SHA-256 `7eabec1e5e277166c6cd60eba80b60947aaba807002bb542855dbef1581e43e4`.
- The 17 original FTR MFIL containers expose `ATHD`, `ATAB`, `ATYP`, `FHDS`, `FDAT`, `SSMP`, `SPEC`, `CSMP`, `CLAS`, and `CDIR` tags in the observed original chunk directories; there is **no separately labeled source CMAP or PLTE chunk among those directory entries**. This observation does **not** prove there are no executable-loaded or implicitly encoded fighter palettes elsewhere.

**Decision:** An IFF palette is proven to belong to its own source IFF image, **not to an FTR fighter**. Do **not** automatically apply IFF CMAPs to FTR sprites or label any candidate "correct". An explicitly user-selected visual comparison is useful for color exploration while retaining all native source planes and clear uncertainty.

## IMPLEMENT — actual extractor comparison tool, not native recoloring

- `src/core/assets/mk3SourcePaletteComparisonP72.ts` qualifies native MK3 fighter source indices/mask/unknown palette, original FHDS coordinates and file SHA, plus a separately qualified original `DATA.MK3` embedded IFF CMAP. It refuses mixed installation path roots, invalid source paths/byte intervals, nonbinary masks, incomplete fighter geometry, partial/misclassified CMAPs and any preexisting asserted native palette.
- `listMK3IffPaletteComparisonsP72` deduplicates **only byte-identical CMAPs**, retaining a source IFF asset ID, original FORM offset and count of identical source CMAP occurrences. It does **not** rank color matches or infer gameplay association.
- `compareMK3FighterWithIffCmapP72` leaves native fighter `indices` and `mask` intact; it maps a user-selected 256-color RGB8 palette into a **separate RGBA comparison buffer**, with zero RGBA on transparent pixels. The original fighter's evidence classification remains `UNKNOWN`.
- `src/components/AssetBrowser.tsx` adds an explicit **Experimental source IFF CMAP** dropdown in the selected original MK3 FTR sprite inspector; default selection is **none** (existing grayscale preview retained). It labels the additional canvas preview "Comparison only. Native MK3 fighter palette: UNKNOWN." It does **not** add any new catalogue representation, change existing source previews, infer gameplay frame timing, or modify queued sprite exports.
- The selected comparison can be exported as `MK3_P72_<SOURCE_SPRITE>_CMAP_COMPARISON.zip`, with **6 files**: an experimental `comparison.png`, byte-identical `original/fighter-indices.bin`, byte-identical `original/fighter-mask.bin`, byte-identical `reference/iff-cmap-rgb8.bin`, `manifest.json` and `README.txt`. The manifest records original FTR/CMAP file SHA, source compressed byte interval, original FHDS descriptor header/index/X/Y/mode/group/model, original IFF FORM source extent and CMAP digest, exact RGBA digest, and explicit `nativeFighterPaletteOwnershipVerified:false`, `originalFighterOwnership:'UNKNOWN'` and comparison-only qualification. It is **not** a canonical palette-resolved native fighter export.
- The P71 research workbench, original file handling, source-indexed/opacity planes, decoding mechanisms, sprite IDs and all original asset counts are unchanged.

## TEST / EVIDENCE

### SOURCE-ONLY GITHUB CI — VERIFIED

[GitHub Actions P72 42486529226](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42486529226) **SUCCESS** on code/test/workflow SHA `04603639c0b4a4430442ca2ecb08d931c3db9069`. This includes:
- `scripts/test-p72-mk3-cmap-comparison.cjs` positive synthetic indexed/mask/CMAP to RGBA mapping, original byte-preserving ZIP sidecars and **16** falsified source/ownership inputs refused.
- Syntax checks for the original-file verifier, original independent IFF+FTR parser and real Chrome download verifier; source-only prior controls, tracked-file guard, TypeScript, production Vite build and offline Chrome startup.
- Two earlier P72 CI runs **FAILED only because the negative test for cross-installation source identity had incorrectly retained the old IFF asset ID**, triggering the expected strict IFF identity refusal before the intended source-folder refusal. The test case was corrected to maintain a valid alternate IFF asset ID, then the final run passed. No production decoder logic was loosened. The original data files were not available to CI.

### Separate ORIGINAL INPUT inspection — VERIFIED

The original private `mk3.zip` was directly inspected with a read-only, independent Python ZIP and binary header reader. Source SHA-256s, the 17 FTR MFIL tag inventories, all 416 original CMAP lengths and **125 exact distinct palette byte tables** were observed. This original-input inspection did not run the full new P72 extractor/preview/download code and is **not** a substitute for the following acceptance gates.

### Current-source original MK3 fixture and ZIP/PNG parity — VALIDATION PENDING

`scripts/verify-mk3-p72-cmap.cjs` scans the complete original MK3 installation, requires **9,186** unchanged assets, 416 embedded source CMAP images and 125 unique original palette tables. It deliberately chooses an original `BLADE.FTR` frame and original IFF FORM at DATA.MK3 offset zero and generates the comparison ZIP in a **private folder outside Git**.

`scripts/verify-mk3-p72-iff-cmap-independent.py` independently verifies all original source identities, reopens the actual original MFIL/FHDS/FDAT packed sprite using the accepted Python bitstream decoder (not the app's decoded arrays), reads the original source FORM CMAP bytes from DATA.MK3, checks the ZIP's original indexed/mask/CMAP planes, reads the **PNG pixel-by-pixel** with Pillow, and requires explicit unknown palette/runtime claims. No native fighter palette binding is asserted.

Run in Windows PowerShell:

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
npm.cmd ci --no-audit --no-fund

node scripts/verify-mk3-p72-cmap.cjs `
  "E:\GOG\Games\Mortal Kombat 3\mk3" `
  "C:\Temp\mkdos-p72-cmap-original"
```

Expected **only if actually executed**: `pass:"P72",status:"PASS"`, original 9,186 assets, 416 explicit IFF CMAPs, 125 unique source CMAPs, source-preserving FTR indices/mask and original IFF palette bytes, and independent PNG RGB/alpha exact parity. Native owner remains `UNKNOWN`.

### Real Chrome original-game comparison preview/download — VALIDATION PENDING

`scripts/verify-p72-browser-cmap.cjs` loads original MK3 into actual Chrome, selects an original BLADE.FTR sprite, verifies the explicit comparison dropdown has **125 original unique choices plus “none”**, chooses one source IFF CMAP explicitly, sees a separately labeled experimental preview, downloads the ZIP, then runs the original independent Python source oracle on the browser-downloaded archive:

```powershell
npm.cmd run build

$driverDir = Join-Path $env:TEMP 'mkdos-p68-driver'
$env:NODE_PATH = Join-Path $driverDir 'node_modules'

node scripts/verify-p72-browser-cmap.cjs `
  "E:\GOG\Games\Mortal Kombat 3\mk3"
```

Expected `pass:"P72_BROWSER",status:"PASS"` only after actual execution. This is a comparison-preview browser acceptance, **not** confirmation of original fighter palette or visually authentic colors.

## CLASSIFY / NEXT

**VERIFIED:** current P71 full original DOS three-game baseline, P72 source-only UI/export test and CI, independent original MK3 source IFF palette inventory (416 CMAP source images / 125 distinct RGB tables), exact source-provenance and comparison-only boundary.

**VALIDATION PENDING:** full original MK3 P72 source ZIP/PNG readback on current code and actual Chrome preview/download.

**UNKNOWN / not asserted:** native fighter VGA palette ownership, runtime palette selectors, character identity/variants, source association of DATA.MK3 IFF palettes to FTR sprites, native frame timing and stage compositing. Full P71 cumulative original-game regression has not been rerun on P72 changes; P76 is the next consolidation.

**P73 suggestion:** Target concrete evidence for the MK3 native palette source/selection path, using original executable/FTR evidence only where it enables authentic color extraction, rather than ranking palette candidates visually. Keep original indexed comparison workflow usable even if native palette assignment remains unknown; avoid generalized gameplay/runtime investigation.

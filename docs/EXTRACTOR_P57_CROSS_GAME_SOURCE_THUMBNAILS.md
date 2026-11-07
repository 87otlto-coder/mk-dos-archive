# P57 — source-backed cross-game Stage Gallery (interim develop pass)

Date: 2026-11-07. Baseline: P56 accepted three-game source/checkpoint `483b807ea08d250ed7b522db9e8bc1b00fcc8cd5`. Development branch `develop` only, main P16 unchanged. P57 is the first interim in the new five-pass cycle; next consolidation assessment P61.

## Problem and source-supported design

User browser evidence showed MK1 stage-header cards as decorative color gradients despite the existence of 24 normalized original background/module previews linked to 15 HDRS.GRA headers (P54/P55). User requested real extracted thumbnails in all three games. Verified sources differ, so the gallery must not represent every picture as an original gameplay stage.

**MK1:** render only exact P54-qualified O27/O54 module previews from the loaded original MK1 asset collection. A header with multiple modules keeps separate exact-ID navigation links. First module preview becomes the card thumbnail. Unqualified/missing headers retain explicit placeholders. Native arcade-stage identity and final compositing remain unknown.

**MK2:** prefer an existing decoded `kind: 'stage'` original source layer with a bounded original .GRA path and 64-character SHA-256. Prefer a 320×200 setup-local layer where one is present, then another qualified source layer. This is an extracted *layer*, not a verified full-scene render or runtime palette witness. An unqualified layer is omitted with an explicit no-thumbnail state; invalid geometry or duplicate authenticated IDs are reported. MK2's established stage resource cards and original effects laboratory are preserved.

**MK3:** there is no verified arcade-stage mapping in the current source. Instead of inventing one (and the old GRA-name based stage gallery typically had no usable matches), present the original `DATA.MK3` IFF pictures as a paged **unassigned picture archive**, 24 at a time, with embedded IFF CMAP identity/provenance and direct exact-ID navigation. P49 originally verified 416 such images; the P57 original-fixture runner asserts this count without asserting stage ownership.

## Implementation

- `src/components/stageGalleryVisualsP57.ts`: pure, no-network proof-gated selection. Uses existing P55 report validation for MK1, original source hash on MK2 images, and exact source ID plus `sourceImageOnly`, `IFF_CMAP_RGB8` and unresolved runtime ownership flags for MK3. Rejects duplicated/invalid qualified image records with explicit error messages. Does not synthesize palette/positions.
- `src/components/StageThumbnailP57.tsx`: canvas drawing of in-memory `Uint8Array` RGBA, with visible error alert on an unavailable 2D context or invalid plane. No remote artwork, game downloads or new image dependencies.
- `src/App.tsx`: shares the same decoded collection's in-memory asset references with the gallery, clearing them on source changes. Does not modify the asset registry or decoder.
- `src/components/MuseumWorkspace.tsx`, CSS: replaces generic visuals where source pixels are available, retains resource names and confidence labels, adds exact-ID links for MK2 layers and MK3 pictures, preserves MK1 module buttons and MK2 effect viewer, and pages MK3 unassigned source images.
- No modified MK1/MK2/MK3 decoder, resource format, asset count, palette table, animation scheduling, ZIP/PNG exporter or forensic research environment.
- `scripts/test-p57-cross-game-thumbnails.cjs`: source-only positive/negative fixture examples for all three games, including unknown versus invalid separation, exact MK1 source-module link, MK2 original source layer selection, MK3 embedded-CMAP evidence and rejected fabricated identities.
- `scripts/verify-p57-cross-game-gallery.cjs`: original private three-game test for unchanged 2,656/5,369/9,186 census, 24 MK1 module images / 15 headers, exact P54 digest, source-hash equality for displayed MK2 and MK3 artwork, original MK2 Tomb/Portal layer eligibility and exactly 416 MK3 unassigned IFF pictures. **The private fixture runner is committed but was NOT executed in this development session.** It must not be confused with CI syntax/load checks.

## Verified versus outstanding

**VERIFIED SOURCE ONLY:** P57 source-only model controls passed within GitHub CI on the feature candidate, including the synthetic image-provenance refusals, TypeScript/build and Chrome boot when latest CI completes. Refer to `p11-build-smoke.yml` runs and associate a complete success SHA before claiming final source build PASS.

**VALIDATION PENDING:** original three-game P57 local test using current checkout and the three commercial DOS installations; real browser thumbnail rendering/sizing and exact-ID clickthrough in all three games; no photographically verified composite scenes or live palettes inferred.

**HISTORICAL ACCEPTED BASELINE:** P56 user-local full original MK1/MK2/MK3 regression PASS (2,656 / 5,369 / 9,186). Do not describe it as a freshly executed P57 three-game regression. Keep main at P16. No extracted copyrighted assets or game binaries committed.

## Reproduction (original files outside source repo)

```powershell
git pull --ff-only origin develop
node scripts/verify-p57-cross-game-gallery.cjs "E:\GOG\Games\Mortal Kombat\mk1" "E:\GOG\Games\Mortal Kombat 2\mk2" "E:\GOG\Games\Mortal Kombat 3\mk3" "C:\Temp\mkdos-p57-results.json"
```

Then run `npm.cmd run dev`; in each game's Stage Gallery choose Asset Library → Decode & browse to load private local source imagery. Observe MK1 grouped module thumbnails and links, MK2 source layer previews with source/palette limitations, MK3 paged original IFF pictures without invented stage identities. The screenshot or user-local report must be recorded before browser acceptance is asserted.

P58–P60: further focused extractor improvements to source-qualified stage presentation/coverage, especially palettes, without changing verified source interpretation; P61 consolidation.

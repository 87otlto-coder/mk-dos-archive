# O132 — MK2 native-width stage asset layers and animation/parallax preservation contract

**Date:** 2026-10-12. **Primary priority:** MK2 extractor/compiler. **Pass accounting:** one substantive implementation and verification checkpoint (not 50 passes). **New gameplay captures:** none.

## User requirement (design contract)

The desired output is **not limited to the 320-pixel-wide view of the original DOS renderer**. It must retain whole native stage source extents for later **16:9 editing**, and any verified moving/animated background elements must remain separately addressable, with original timing and parallax semantics preserved once discovered. Runtime clipping/camera calculations remain important for faithful *playback and validation*, but must not reduce the dimensions of the underlying exported assets.

**Important fidelity distinction:** "full original source data" is not yet the same thing as "complete native-width composite of every stage layer." The current exporter is a camera-independent multi-layer source pack, NOT an authentic finished scene, a 16:9 enhanced screenshot, or an animation recovery.

## New verified export capability

`tools/mk2_native_stage_palettes/export_o132_scene_layer_pack.py` reads the user's original canonical `MK2.EXE` and an original MK2 ZIP with `TOMB.GRA`, `PORTAL.GRA`, `IMAGES.GRA` (O121/O122 verified source identities). It generates, without modifying inputs:

- **Kombat Tomb:** full uncut packed floor source **896 × 48** (43,008 source index pixels), RGBA PNG **and** lossless 8-bit index PNG. Six independent O121/O122 setup-local layers **plus all 16 original Tomb sprite streams (uncropped)**; their own RGBA, index and binary opacity PNGs; original dimensions include **896 × 56**, **896 × 48**, **850 × 224** (two variants), **800 × 30**, **320 × 80**.
- **The Portal:** full uncut packed floor source **896 × 40** (35,840 source index pixels), RGBA and 8-bit index PNGs. Two independent setup-local layers (**896 × 176**, **320 × 168**) **plus all 13 original Portal sprite streams (uncropped)** with RGBA, source index and opacity PNGs.
- A provenance manifest documenting **29 full native source sprite streams** (including sprites partly clipped by setup-local mosaics), source-accurate placement occurrences, original resource checksums, stage-specific runtime-confirmed EXE palette source records, palette/index/alpha hashes, exact source extents, and conditional setup identities.
- A **16:9 guide only** (896 × 504 pixels), **not an invented automatically positioned stage frame**. No layer is stretched or resampled; no incomplete elements are added to fill the guide.

No 320-pixel crop, guessed camera offset, screen-row clipping or screenshot-relative alignment is imposed on the native source exports. The *setup-local mosaic previews* still reproduce original O122 setup bounds and can clip sprite parts, so each individual original sprite is also exported uncut to prevent data loss. The original 896 stride remains intact. O131's destination clipping and row stepping are still relevant to the original game's rendering and must remain represented separately, without destroying the source layer data.

### Future animation / parallax constraint

The manifest records `animationFrameOrderingRecovered = false`, `animationDurationsRecovered = false`, and `parallaxMotionRulesRecovered = false` for the exported MK2 scene layers. **These values are unknown, not zero-motion claims.** No synthesized sprite animation, fabricated loop, made-up frame rate, or guessed parallax multiplier is exported. Separate opaque/transparent sprite setup mosaics, indexed planes, and source identities remain available for later reconstruction. The next stages of research must recover motion-state updates, animation frame lists, ordering, frame duration / triggering, sprite-layer parentage and parallax transforms **before** a verified animated full-scene export can be claimed. A one-frame screenshot alignment cannot prove an object's parallax behavior.

## Source/browser integration

`src/games/mk2/research/stageNativeSourceFloorO132.ts` reconstructs the **entire 896-column original floor** using canonical `MK2.EXE` palette words and the user's verified original GRA bytes, with no cropping. `MK2IndexedStageMosaicsO122.tsx` now displays and exports that full-size floor separately from the already supported indexed setup-layer PNG. For complete multi-layer indexed + opacity packs use the Python exporter. Browser-level source parity is checked with `scripts/run-mk2-o132-full-source-bridge.mjs`.

## Validation boundaries and next tasks

- Independently rederived every source index and decoded EXE RGB word in both complete floor planes against generated PNGs. Independently checked setup-local RGBA, index and opacity checksums against the O122 research corpus; file hashes and manifest claims audited.
- All 36 O132 targeted tests passed, including modified EXE/GRA rejection, source-cropping tamper, unverified animation/parallax claims, incorrect native dimensions and unsafe stage selection.
- JS/Python full source parity: 16 checks, both Tomb and Portal. Existing O122, O130 and O131 regression suites remain passing. Two O131 tests skipped by their own environmental fixture guards.
- The complete React application build and visual interaction have not yet been performed; TypeScript module isolated check passed.
- Original DOS executable and `.GRA` bytes are **not included in the source ZIP**. Generated floor/mosaic images may be delivered in a separate user-derived asset-example bundle, never in the development-source archive.

### Next high-priority source research

1. Map how the stage setup and object/update code changes stage-layer positions over time, including possible different scroll rates. Label parallax only after identifying a dynamic relationship between stage scroll and layer transforms.
2. Find which sprite setup streams, frame lists, callback processes or dynamic graphic buffers are actually used to animate scenes. Preserve source frames, ordering, timing, palette state and trigger conditions.
3. Integrate authenticated motion tracks into a **layered scene export** with both native/unclipped world content and a separate reproducible gameplay camera preview. Accept no hardcoded fake 16:9 scene placements.
4. Extend extraction beyond Tomb and Portal as palette and stage-layer identities become independently verified.

## Reproduce

```sh
python tools/mk2_native_stage_palettes/export_o132_scene_layer_pack.py --exe /path/to/MK2.EXE --game-zip /path/to/original-mk2.zip --out /fresh/native-stage-layer-export --stage both
python tools/mk2_native_stage_palettes/verify_o132_scene_layer_pack_independent.py --exe /path/to/MK2.EXE --game-zip /path/to/original-mk2.zip --bundle /fresh/native-stage-layer-export --o122-report research_outputs/O122_INDEXED_LAYER_REPORT.json --o121-report research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json
python tools/mk2_native_stage_palettes/test_o132_scene_layer_pack.py --exe /path/to/MK2.EXE --game-zip /path/to/original-mk2.zip --o122-report research_outputs/O122_INDEXED_LAYER_REPORT.json --o121-report research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json
node --experimental-strip-types scripts/run-mk2-o132-full-source-bridge.mjs /path/to/MK2.EXE /path/to/TOMB.GRA /path/to/PORTAL.GRA /fresh/native-stage-layer-export/O132_SCENE_LAYERS.json
```

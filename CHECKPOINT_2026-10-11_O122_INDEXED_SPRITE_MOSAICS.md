# O122 — MK2 Indexed Stage Sprite Mosaics and Original Portal Backdrop Witness

**Date:** 2026-10-11  
**Status:** Canonical source code/byte decoding verified; two runtime-confirmed 80-color stage palette records; 2,151 held-out *original Portal gameplay* screenshot pixels match source reconstruction exactly. **Not** a complete screen compositor nor an emulator memory trace.  
**Cadence:** 50 passes is an upper limit per research run, not a target to pad. This is one meaningful development/research checkpoint.

## New substantive findings

O121 authenticated ten stage/image setup record groups containing 135 sprite-control entries and 49 unique referenced sprite descriptors. O122 now decodes the underlying resource streams using the three original MK2.EXE-verified indexed command types: transparent skip, color RLE and aligned literals. No generic game-asset format or external palette is invented.

| Original resource | Independently decoded distinct sprites | Encoded stream span (no gaps/overlap) |
|---|---:|---:|
| TOMB.GRA | 16 | `[0,54328)` = 54,328 bytes |
| PORTAL.GRA | 13 | `[0,35912)` = 35,912 bytes |
| IMAGES.GRA | 20 | `[351472,460192)` = 108,720 bytes |
| **Total** | **49** | **198,960 original encoded bytes** |

All 49 sprite streams decode within the original resource bounds and end at the next authenticated stream offset. Each decoded stream yields a pixel-index buffer and an *independent opacity mask*, retaining transparent skips rather than interpreting them as black. Every source sprite's opaque indices fit the palette-count range implied by its conditional setup family: 1–80 for Tomb/Portal, 1–79 for IMAGES. The one-based color lookup used to visualize the 79-color IMAGES family is **provisional** (the 79-color records did not perturb Tomb/Portal in O119).

The 135 setup control placements reconstruct **ten conditional setup-local indexed mosaics**. Tomb architectural support (`0x1737C`) is 850×224 with 44 source control entries. Portal backdrop (`0x16526`) is 320×168 with 8 entries and includes the moon, central swirling portal and orange distant environment. The `IMAGES.GRA` layouts remain separately identified; no assignment of a stage resource name to these two 79-color setups is made.

## Independent gameplay comparison

The **unmodified Portal gameplay screenshot** from O113/O114 test 20 has SHA-256 `19858a54a7d9d3b09542dbcba06ff501aa29e9b9186cc07c3bbf3bdcde367f07`. The independently decoded `0x16526` Portal mosaic matches **2,151 / 2,151 visible indexed pixels** in screenshot source rectangle `x=[100,210)`, `y=[70,90)` using an observed screenshot transform of `screenX=2*sourceX-4`, `screenY=2*sourceY-18`. Five deliberately wrong shift hypotheses fail to match all these pixels. The region was chosen away from fighter occlusion. It is not a globally registered camera position, does not prove sprite-layer draw order and does not justify reconstructing the remaining final stage elements arbitrarily.

## Engineering additions

- Python: `tools/mk2_native_stage_palettes/export_o122_indexed_mosaics.py`. Enforces canonical MK2.EXE and original resource SHA-256, decodes all 49 streams, composes all 10 setup-local layers, optionally exports PNGs and always writes detailed per-layer source hashes, opacity and overdraw statistics to a fresh output directory. Original commercial game files are read-only and must be supplied by the user.
- Independently written Python decoder: `tools/mk2_native_stage_palettes/verify_o122_independent.py`. Rechecks the original O121 graph, 49 streams, 10 mosaics, stream-contiguity, palettes, RGBA/index/mask SHA-256 and the screenshot alignment, without importing the producer decoder.
- Browser: `src/games/mk2/research/stageIndexedMosaicsO122.ts` and `stageIndexedPlacementsO122.ts` verify the original resources and decode all eight 80-color Tomb/Portal stage mosaics. `src/components/MK2IndexedStageMosaicsO122.tsx` presents source-verified setup-local layers in the MK2 advanced research section. The selected user's game directory supplies all commercial files; none are bundled into the app.
- Negative tests explicitly reject forged output digests, forged counts, forged stream spans, mutated resource files and wrong executables.

## Verified numbers and reproducibility

- O122 independent structural/PNG audit: **154 assertions**; 49 sprites; 10 mosaics; **2,151 / 2,151 exact control screenshot pixels**.
- O122-specific Python regression: **20/20**.
- Existing O121 regressions: **32/32**; O120 regressions: **23/23**.
- New browser/Python byte parity: **49 checks** across eight Tomb/Portal stage layers, covering the independent SHA-256 of RGBA, indexed pixels and opacity masks, opaque/overdraw/clipping counts.
- Existing O121 browser evidence metadata: **26 checks**.
- Isolated TypeScript/TSX transpilation completed for the new decoder, data and component. Full React/Vite app build remains unverified in this offline environment (missing installed React/Vite dependencies), and requires real browser testing before the UI is considered fully production-ready.

Commands (require your own canonical original MK2.EXE, mk2.zip and Tomb/Portal files):

```sh
python tools/mk2_native_stage_palettes/export_o122_indexed_mosaics.py --exe /path/MK2.EXE --game-zip /path/mk2.zip --out /new/o122-output --pngs
python tools/mk2_native_stage_palettes/verify_o122_independent.py --exe /path/MK2.EXE --game-zip /path/mk2.zip --o121 research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json --o122 research_outputs/O122_INDEXED_LAYER_REPORT.json --portal-control evidence/mk2_o114/20.png --out /new/O122_AUDIT.json
python tools/mk2_native_stage_palettes/test_o122_indexed_mosaics.py /path/MK2.EXE /path/mk2.zip
node --experimental-strip-types scripts/run-mk2-o122-indexed-mosaic-bridge.mjs /path/MK2.EXE /path/TOMB.GRA /path/PORTAL.GRA
```

## Next research boundary

The layer decoder, binary sprite relationships and 80-color stage palettes are now well-supported. **Which setup object is selected, at what world/screen offset, in what draw order, and which live palette handle/DAC bank MK2 allocates remain unobserved.** Follow O120/O121 `0x81C4E`, `0x81C53`, `0x81DD8`, `0x81DDA`, `0x81DDF` via a narrow emulator memory trace or a carefully designed original EXE probe. No new DOSBox screenshot from the user is needed to validate O122.

The intelligent game-playing bot, HD graphics, Authentic Enhanced wrapper, and source-port ideas are deferred until MK DOS Archive reaches its first extractor/compiler milestone. Priority remains MK2 → MK1 → MK3.

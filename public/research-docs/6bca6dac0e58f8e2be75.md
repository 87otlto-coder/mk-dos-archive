# O119 — MK2 native palette record runtime perturbation evidence

**Date:** 2026-10-11. **Status:** Four user-supplied actual DOSBox gameplay screenshot captures; tests 41–44 from O118 completed. The exact visual causal link from single-word changes to game rendering is **supported**. Live palette handle/allocator bank and source-camera RAM still **unresolved**.

## Controlled experiment

O118 built four separate, completely populated MK2 test directories (614 canonical game files apiece). Test 41 vs 42 changed exactly one counted 16-bit palette word in a respective 80-color or 79-color source record, with the same chosen original source index. Tests 43 vs 44 did the same for The Portal. All four EXEs also share the identical 11-byte F9 cheat menu unlock; their `.GRA` assets are bit-for-bit original.

The value written was `0x7C1F`, rendered by DOS MK2's DAC6 + bit-replication expansion as **RGB (255, 4, 255)**. The canonical executable hash is `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

| User-labeled test | Arena | Counted palette record | Original source byte | Patched palette word physical offset | Exact injected RGB pixels in screenshot | Exact injected RGB pixels in lower-stage screenshot region |
|---|---|---|---|---|---:|---:|
| 41 | Kombat Tomb | 80 colors at `0x893C6` | 41 | `0x89418` | **24,143** | **10,479** |
| 42 | Kombat Tomb | 79 colors at `0x8CDBE` | 41 | `0x8CE0E` | **0** | 0 |
| 43 | The Portal | 80 colors at `0x891E0` | 67 | `0x89266` | **8,887** | **6,683** |
| 44 | The Portal | 79 colors at `0x8CD1E` | 67 | `0x8CDA2` | **0** | 0 |

Raw user screenshots are preserved unaltered under `evidence/mk2_o119/{41,42,43,44}.png` and their SHA256 hashes are recorded in `research_outputs/O119_80_VS_79_RUNTIME_PALETTE_IMAGES.json`. **Screenshots 42–44 are Windows-window captures** including emulator chrome/desktop; the counts are of the exact RGB across those entire images, not a pixel-by-pixel controlled frame comparison. The independent verifier recomputes counts from the untouched PNGs.

The stage lower-region bounds are screenshot-relative, manually identified by inspection, and demonstrate the injection affected stage artwork, including floors. They are **not** the native coordinate system or verified camera state. Screenshot timing and camera position vary between tests, so no per-pixel changed-area comparison is claimed.

## What this conclusively advances

- **Strong user-runtime evidence** that the counted **80-color native Tomb palette record at `0x893C6` influences the actual game rendering** of the selected Tomb fight. Its 79-color competitor at `0x8CDBE` did not show the selected magenta-color change during test 42.
- Analogous evidence for **The Portal's 80-color native record at `0x891E0`**, and a negative test for the 79-color alternative at `0x8CD1E`.
- The native EXE palette bridge introduced in O118 no longer relies *only* on static byte/color identity for the two tested record origins. Their single-word perturbation visibly affected gameplay under the documented experimental conditions.
- This does **not** prove the two 80-color records are used in every possible state, that the 79-color records are never used, or exactly when/how the renderer allocates the live VGA palette slots.

## Reproduction and independent verification

These commands require **your own original MK2 ZIP** and optionally the separately distributed O118 full game test kit. Commercial game files are not included in the source archive.

```sh
python tools/mk2_native_stage_palettes/analyze_o119_runtime_images.py \
  --evidence evidence/mk2_o119 --original-mk2 /path/to/mk2.zip \
  --kit /path/to/MK2_O118_80vs79_Palette_Runtime_Test_Kit_2026-10-11.zip \
  --out /path/to/NEW_O119_REPORT.json
python tools/mk2_native_stage_palettes/verify_o119_independent.py \
  --evidence evidence/mk2_o119 --original-mk2 /path/to/mk2.zip \
  --kit /path/to/MK2_O118_80vs79_Palette_Runtime_Test_Kit_2026-10-11.zip \
  --report research_outputs/O119_80_VS_79_RUNTIME_PALETTE_IMAGES.json \
  --out /path/to/NEW_AUDIT.json
python tools/mk2_native_stage_palettes/test_o119_runtime.py \
  /path/to/mk2.zip /path/to/MK2_O118_80vs79_Palette_Runtime_Test_Kit_2026-10-11.zip
node --experimental-strip-types scripts/run-mk2-o119-runtime-palette-source.mjs
```

Report creation has run against the actual distributed full test kit, comparing each included `MK2.EXE` against bytes rederived from the authenticated canonical EXE. A **separately written** Python/NumPy/Pillow verifier independently confirms all four images, expected patch bytes, hashes, source-record offsets, and screenshot measurements. O119-specific regressions also test deliberate report tampering. The TypeScript/Node bridge checks that the app's runtime-witness metadata agrees with this report, while refusing to equate the data with live palette-handle identity.

## Integration and next research

The browser `MK2ObservedStageFloorPanel` and the new `runtimeStagePaletteSourceO119.ts` explain that the original 80-color source-record provenance has a *runtime perturbation* witness. They still require exact-hash original `MK2.EXE` and `.GRA` files for source-floor preview and retain O116's strictly bounded cropped-floor visualization. The full React app build is **not validated** by this O119 checkpoint.

**Next most useful research:** trace the specific LE Object-1 relocations already identified in O118 for the proven 80-color palette records through their load/request call sites, candidate palette handle ownership, and DAC queue. A DOSBox debugger/memory watch (or narrowly instrumented EXE) will eventually be required to verify actual handle/bank state. No new screenshot or rerun of tests 41–44 is necessary.

**Milestone accounting:** O119 is a targeted runtime-disambiguation and source-integration checkpoint, **not an additional 50-pass research run**. Priority remains MK2 → MK1 → MK3; autonomous bots, wrapper, and enhanced runtime remain deferred.

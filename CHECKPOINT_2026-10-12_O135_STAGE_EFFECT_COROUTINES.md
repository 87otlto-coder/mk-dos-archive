# O135 — MK2 stage effect coroutine and bounded object-state code (2026-10-12)

**Project priority:** original MK2 extraction/compilation; preserve uncropped Tomb/Portal layers and future animation potential. **Research pass accounting:** one substantive verified checkpoint, below the 50-pass limit. **New gameplay recordings:** none.

## Verified original code facts

1. The registration routine at physical **`0x67222`** links a callback into scheduler state, initializes its saved counter at `+0x06` to one, and stores the function continuation at `+0x1C`. Yield at **`0x6710F`** saves a caller-supplied `AX` count and continuation; the scheduler decrement/resume path at **`0x67158`** decrements that counter and later jumps to its continuation at `0x67185`. **These counts cannot yet be converted to gameplay frames or seconds.** A reliable scheduler tick rate and live invocation have not been demonstrated.
2. The original **Kombat Tomb** initializer references the two routines at **`0x82D33`** and **`0x82D9A`** (O134). Both contain six-count scheduler yields in conditional loops (`0x82D65` and `0x82DC7`), source-data pointer assignments to Object-2 **`0x17814`** and **`0x177EC`**, and code comparisons with thresholds **48** and **108**. A later source path yields with count **96**. These are code constants, **not** frame counts for a verified sprite animation.
3. The original **Portal** callback path references **`0x8280C`**, **`0x828FF`** and **`0x8291F`**. The first reads per-object fields `+0x54` and `+0x5C`, updates a source accumulator at Object-1 offset `0x13E28` (physical `0x75A7C`), and writes it to the object at `+0x14`. Source instructions initialize **`0x3000`**, increment/decrement by **`0x300`**, and compare against **`+0x6000`** and **`-0x6000`**. Each direction has an explicit scheduler yield with `AX=1`. Simple independent arithmetic expansion of the code's limits gives **16 ascending** and **64 descending** values; **this is not a measured frame timeline, rate, repeat count, or animation length.**
4. Two additional Portal routines assign relocation-backed original data pointers at Object-2 **`0x164D8`, `0x16674` and `0x164F8`**, with an explicit second counter initialized to **2** in one of the routines. Their downstream semantics, source sprite bindings and triggering conditions remain open.
5. All five distinct original behavior-function targets are re-fingerprinted from the canonical **SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`** executable. The producer authenticates the typed LE relocation targets for source-data pointers. A separate verifier re-derives the instruction constants and coroutine behavior without importing the producer.

## Implementation and export preservation

- Added `trace_o135_stage_effect_coroutines.py`, `verify_o135_stage_effect_coroutines_independent.py`, and 34-case adversarial regression suite `test_o135_stage_effect_coroutines.py`.
- Added `stageEffectCoroutineO135.ts` and a 30-check browser/Python parity runner; a **read-only** O135 diagnostic was added to `MK2IndexedStageMosaicsO122.tsx`.
- The existing **uncropped stage-layer** exporter now includes `sourceEffectCoroutineEvidence` with independent source provenance and a stage-specific reference. Its independent verifier audits these new fields and rejects invented timing, frame sequencing and activation.
- All **115 existing stage-export PNGs remain byte-identical** to O134; the new export changes JSON metadata, **not** sprite, floor, palette-index, or opacity pixels. The export remains 896 native pixels wide for packed floors, not a 320-pixel gameplay crop.
- Original commercial game data is not included in the development-source or standalone research archives. User-supplied original MK2 files are required to reproduce outputs.

## Verification

- **172 independent O135 binary/source assertions passed.** Five distinct routine code windows authenticated.
- **34 new O135 hostile regression tests passed** (including falsified source constants, hashes, timing and sprite claims).
- **36 O131, 44 O132, 21 O133, 24 O134 inherited tests passed**, for **125 inherited + 34 new = 159** across these selected suites.
- **30 new browser/Python checks passed**, plus 40 O133 and 56 O134 bridge checks.
- The original O132 layer-pack independent verifier rechecked **78,848 source-floor indices** and **939,425 source pixels or masks**, with **115 verified assets**. Original O134 exported PNGs match **115/115** by SHA-256.
- Complete React application build and DOSBox runtime effect activation **remain unverified**.

## Next work

Prioritize tracing the relocated Tomb/Portal source-data pointer targets and registered-object structures back to sprite/graphic descriptors. Only then attempt frame-by-frame animations, timeline export, trigger modeling or parallax relationships. Distinguish scheduler counter updates from actual rendered frames; do **not** fabricate FPS, loop cadence or asset-to-routine association. Full-scene native source exports remain the default; the game's clip/viewport code remains useful for playback checks but must not crop exports.

## Reproduce

```sh
python tools/mk2_native_stage_palettes/trace_o135_stage_effect_coroutines.py --exe /path/to/original/MK2.EXE --out /fresh/O135_REPORT.json
python tools/mk2_native_stage_palettes/verify_o135_stage_effect_coroutines_independent.py --exe /path/to/original/MK2.EXE --report /fresh/O135_REPORT.json
python tools/mk2_native_stage_palettes/test_o135_stage_effect_coroutines.py --exe /path/to/original/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o135-effect-coroutine-bridge.mjs /path/to/original/MK2.EXE /fresh/O135_REPORT.json
```

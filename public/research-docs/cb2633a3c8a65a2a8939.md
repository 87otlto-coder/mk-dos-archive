# O133 — Source-backed MK2 stage movement inputs and nine renderer channels

## Purpose and scope

Continue O132's **uncropped, separate layer exports** while investigating the original MK2 stage-position and animation machinery. Do not convert static code relationships into invented animation, parallax speeds, fixed playback rates, or finished 16:9 scene layouts.

## Confirmed original executable relationships

1. The candidate stage configuration roots (O125/O130) contain a **relocation-backed pointer at root +0x14** to **nine consecutive 32-bit signed source words**. All ten stage configuration families (indices 0–9) have such input tables. The words are formatted consistently as signed **16.16 fixed point**. Within each of those ten families, the *input values* agree across the three stage-configuration mode roots examined; the roots themselves can differ.
2. The scene loader at physical `0x81F4A` reads the selected root's +0x14 input-table pointer into Object-2 global `0x75D22`. Its next field at +0x18 supplies the stage control stream, already traced in O130.
3. The executable contains several routines that populate **nine rate/update globals** at Object-2 `0x842EC` through `0x8430C` from that selected table using different transformations. Two authenticated examples are a direct nine-DWORD copy at physical `0x824A7`, and a `−5 × input` transform at `0x826D7`. **The selected transform during gameplay is not known.**
4. The renderer at physical `0x9343E` through `0x934A8` performs nine separate 32-bit accumulator updates from those globals into Object-2 `0x84310` through `0x84330`. Positive stage-stream commands carry pointers to **high 16-bit halves of these accumulators** (consumer at `0x9358C`), together with distinct object-pointer references. The stream mappings are known statically; the actual object positions, accumulation cadence, sprite frame order and stage movement during a fight are not.
5. The independent O133 verifier re-read the canonical EXE and checked **30 root candidates**, **270 input words (including mode repeats)**, **nine update sites**, and **82 positive stage commands** across indices 0–9.

### Two illustrative original source tables

| Stage | EXE Object-2 table | Nine original signed 16.16 words (human-readable value) |
|---|---|---|
| Kombat Tomb | `0x172DC` | `0, 0, 0, 0.75, 0.75, 1.125, 1.125, 1.5, 0` |
| The Portal | `0x1641C` | `0, 0, 0, 1.125, 0, 0.75, 1.125, 1.5, 0` |

**Do not describe these values as confirmed parallax ratios.** Their provenance as stage-associated numeric inputs and subsequent arithmetic is source-proven, while the live callback choice and transformation semantics remain unobserved. Similarly, these numbers do not establish a timeline or any individual animation frames.

## Development changes

- `trace_o133_stage_motion_sources.py`: bounded original-EXE producer with relocation-backed root checks, nine rate/accumulator instruction checks, per-stage source-word inventories and control-stream-to-channel links.
- `verify_o133_stage_motion_independent.py`: separately implemented executable/stream verifier; does not import the producer.
- `test_o133_stage_motion_sources.py`: positive, negative and deliberately forged-evidence regression tests.
- `export_o132_scene_layer_pack.py`: adds a **sourceMotionInputCandidate** to the Tomb and Portal scene-layer manifest; untouched RGBA, index and opacity planes remain at original native extents. Unknown animation/parallax fields remain `null`, not zero or fabricated.
- `verify_o132_scene_layer_pack_independent.py` and existing tests: independently validate the new original-word manifest fields and reject falsified timing/source claims.
- `stageMotionSourceInputsO133.ts` and browser parity: read authentic Tomb/Portal input words from user-supplied `MK2.EXE` and show them in the existing advanced stage viewer. The entire React application build remains unverified.

## Still unknown / next questions

- Which input transformation/callback is active in a specific fight; what event updates the nine accumulators; and how the generated values relate to horizontal/vertical camera position and possible multi-plane scrolling.
- The object-identity connections between the nine channels and the actual rendering sprite/setup elements in game, including dynamic updates after initialization.
- Which original stage sprite streams are **animated frames**, the order and timing of their playback, and their stage/condition triggers. **Nothing in O133 establishes those.**
- Full-world layer placements, compositing order, and reliable 16:9 extended scene reconstruction. All original assets must remain uncropped and individually addressable.

## Reproduce with the original game files

```sh
python tools/mk2_native_stage_palettes/trace_o133_stage_motion_sources.py --exe /path/to/MK2.EXE --out /new/O133_STAGE_MOTION_INPUTS.json
python tools/mk2_native_stage_palettes/verify_o133_stage_motion_independent.py --exe /path/to/MK2.EXE --report /new/O133_STAGE_MOTION_INPUTS.json
python tools/mk2_native_stage_palettes/test_o133_stage_motion_sources.py --exe /path/to/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o133-stage-motion-bridge.mjs /path/to/MK2.EXE /new/O133_STAGE_MOTION_INPUTS.json
```

This is a static, independently checked checkpoint. No DOSBox runtime state, animation timing or true parallax effect was measured. No new binary test is requested yet.

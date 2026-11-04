# O131 — Stage packed-row renderer geometry and code/source join

**Date:** 2026-10-12. **Scope:** MK2 original EXE static research, bounded model, browser read-only diagnostic. **Pass accounting:** one substantive checkpoint, not 50 passes. **New DOSBox witness:** none.

## What O131 resolves

O130 authenticated the `-1` commands in seven stage-specific control streams but did not assign semantics to their two numeric operands. O131 follows the original instruction sequence from the command interpreter (`0x9356E`, `0x93585`) into the guarded renderer (`0x9E118`) and the packed-row transfer (`0x659C6`). Physical offsets are **file offsets in the original EXE**, not loaded runtime addresses.

- `0x93575`: second scalar loaded into **EDI**. `0x9E15B–0x9E163` subtracts signed high-16 bits of global Object-2 `0x75A68` from EDI; result is the candidate **destination Y row**.
- `0x9357A`: third scalar loaded into **EBX**. `0x9E138`: `ECX = EBX` is **requested row count**. `0x9E173–0x9E18A`: unsigned comparisons clip the transfer to the **200-row** display. A wrapped negative destination fails the unsigned in-range check.
- `0x9356E–0x93573`: the first argument is an Object-2 pointer, dereferenced to obtain a **runtime DWORD**. This pointer targets `0x8432A` for six stage families and `0x84312` for Armory, **outside the original executable's file-backed Object-2 data**. It is not a static camera measurement.
- `0x9E13A–0x9E156`: only the low 16 bits of the runtime source DWORD participate in a signed 16.16 per-row correction derived from `(288 - low16) * 65536 / 112` with signed division truncating toward zero.
- `0x9E165–0x9E170`: the original stage configuration index selects a packed DWORD from Object-2 `0x2EF54` and adds it to the low16 runtime source value. For **all seven stages**, the packed value's high byte equals the original resource ID and its low 24 bits equal the exact authenticated packed suffix start offset found in O111.
- `0x659C6–0x65A38`: the packed source is resolved through the resource mapping, then `80` DWORDs (**320 bytes**) are added to a palette-base DWORD and emitted for each row; source row stride is **896 bytes**, adjusted per row by the accumulated signed 16.16 correction. The O131 Python model reproduces the established O112 `camera_positions` calculations for qualifying hypothetical inputs.

**Important nuance:** the row correction is an *accumulated per-transition offset*. It is not one fixed crop offset for the entire stage, and it is not independently measured game camera state.

## Seven authenticated commands and zero-scroll examples

These row counts assume **global `0x75A68` equals zero** and are illustrative, not gameplay observations. Other state or mode can change actual visible rows.

| Stage | Indexed source suffix | Command destination Y | Requested rows | Visible rows if scroll=0 |
| --- | ---: | ---: | ---: | ---: |
| Tomb | 63,776 | 158 | 56 | 42 |
| Battle | 59,436 | 164 | 40 | 36 |
| Tower | 56,268 | 147 | 64 | 53 |
| Forest | 198,116 | 172 | 32 | 28 |
| Armory | 126,336 | 159 | 56 | 41 |
| Portal | 56,916 | 164 | 40 | 36 |
| Arena | 90,488 | 164 | 40 | 36 |

All seven original commands extend beyond Y=200 if used with zero vertical adjustment, so clipping is part of their normal modeled treatment. At zero scroll, their clipped visible row counts fit in the respective original file-backed packed suffixes. **It is not proven that the emulator ran at zero scroll or that the gate was active in a particular fight.**

## New code

- `tools/mk2_native_stage_palettes/trace_o131_packed_draw_geometry.py`: anchored EXE source trace, original O130 control join, complete stage table and a pure hypothetical integer row model; refuses overwritten output.
- `tools/mk2_native_stage_palettes/verify_o131_packed_draw_geometry_independent.py`: independent LE relocation parser, original file-byte checks, independent stream decode and seven-original-resource lengths verification.
- `tools/mk2_native_stage_palettes/test_o131_packed_draw_geometry.py`: 36 focused regression/adversarial tests, including O112 row stepping parity and deliberate false-runtime-claim rejection.
- `src/games/mk2/research/stagePackedFloorGeometryO131.ts`: read-only TypeScript bridge and source-anchored geometry model.
- `scripts/run-mk2-o131-stage-row-geometry-bridge.mjs`: Python/browser parity and variation suite (330 checks).
- `src/components/MK2IndexedStageMosaicsO122.tsx`: adds a qualified geometry line to the existing advanced viewer.

## Validation and limitations

The independent witness re-derived the source report and seven original packed region lengths from the **canonical user-supplied original MK2 ZIP**. Do not bundle original commercial files with development source. The earlier O127–O130 Python tests and browser parity checks remain green; the O131 TypeScript module independently type-checks. The complete React application build remains **untested** because npm dependencies are absent.

This research proves **static executable dataflow, source identity and arithmetic**. It does not establish the runtime value of Object-2 `0x8432A/0x84312`, `0x75A68`, guard `0x562D4`, live palette handle, draw order, exact camera, or actual output frame. The next high-value investigation is tracing writers of the mutable first-argument storage and vertical adjustment global. If static code cannot establish their live values, targeted DOSBox instrumentation will be needed at properly translated loaded addresses.

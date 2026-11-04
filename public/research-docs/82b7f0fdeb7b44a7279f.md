# O130 — Authenticated MK2 stage-root to packed-render command streams

**Date:** 2026-10-12. **Priority:** MK2 extraction/reconstruction. **Classification:** original-executable static dataflow, independently source verified. **Run accounting:** one substantive checkpoint, below the user's 50-pass maximum. **Runtime/gameplay observations:** none added.

## What changed from O129

O129 identified three immediate-assignment command lists (Object-2 `0x13CEC`, `0x1410C`, `0x15D60`) that contain only positive pointer pairs and a zero terminator. It left the `0x81F55` dynamic command-pointer writer without a bounded source. O130 traces **a concrete producer** through the established stage-root dispatchers.

- `0x82321` resolves a stage root from one of three Object-2 mode tables. At `0x82353`, it dereferences the root pointer, and `0x8235A` calls `0x81EB2`. The separate selector `0x98BA7` resolves a root and calls the same loader at `0x98BD1`.
- The loader at `0x81EB2` saves its incoming `EAX` root pointer and uses the root's initial resource token for data loading. At `0x81EE0`, it restores the original `EAX`; subsequent field reads walk the root record.
- At `0x81F55`, the loader reads the DWORD at **root + `0x18`** and at `0x81F5A` writes it to the command-pointer global Object-2 `0x75CF6`. This is the previously unresolved O129 dynamic writer.
- The command interpreter at `0x93500` copies that global to its cursor, and the `-1` token branch at `0x9356E` supplies three subsequent DWORD parameters to a guarded renderer call at `0x93585` (`0x9E118`). As established in O128, `0x9E118` executes its body only if bit 0 of Object-2 `0x562D4` is set.

All offsets refer to the canonical **unpatched** DOS `MK2.EXE` (SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`). Object-2 offsets are not DOS real-mode physical addresses or emulator watchpoints.

## Original stage-stream census

The original LE relocation table authenticates the 31 root-pointer entries of **each** mode table, the stage root's `+0x18` stream field, and each typed command pointer. The three modes share the same stage stream for every one of the first ten configuration indices (although several have different root records).

| Index | Original resource | Stream (Object-2) | `-1` command | Raw draw parameters (second, third DWORD) |
|---:|---|---|---|---|
| 0 | `DEDPOOL.GRA` | `0x15F58` | No | — |
| 1 | `TOMB.GRA` | `0x17300` | Yes | 158, 56 |
| 2 | `BATTLE.GRA` | `0x19290` | Yes | 164, 40 |
| 3 | `TOWER.GRA` | `0x17904` | Yes | 147, 64 |
| 4 | `FOREST.GRA` | `0x16CD8` | Yes | 172, 32 |
| 5 | `ARMORY.GRA` | `0x16868` | Yes | 159, 56 |
| 6 | `PIT.GRA` | `0x18AA8` | No | — |
| 7 | `PORTAL.GRA` | `0x16440` | Yes | 164, 40 |
| 8 | `ARENA.GRA` | `0x18508` | Yes | 164, 40 |
| 9 | `CAVE.GRA` | `0x15D60` | No | — |

The seven `-1` stream families correspond **exactly** to the seven previously authenticated packed-stage source resources used by the O111/O112 editor. This is a **source-level association**, not seven independently witnessed gameplay draw calls.

The Tomb `-1` command reads a first pointer at Object-2 `0x8432A`; Portal uses the same pointer; Armory uses `0x84312`. The second and third arguments are raw DWORDs. Their semantic meaning (height, row origin, camera, clip or some other parameters) is **not established**; do not label them as measurements without further code analysis.

The full source scan covers **38 distinct roots**, **10 distinct command streams** and three 31-entry conditional mode tables. The index-10–30 configurations also resolve roots and lists, but many are not ordinary stage backgrounds; they have **not** been relabeled as arenas.

## Verification and code

- `tools/mk2_native_stage_palettes/trace_o130_dynamic_stage_streams.py`: fail-closed original-EXE graph producer; refuses output overwrite.
- `tools/mk2_native_stage_palettes/verify_o130_dynamic_stage_streams_independent.py`: independent LE parser and command interpreter; verifies **1,423 assertions** (27,004 original relocation records), including exact stream hashes and all conditional table entries.
- `tools/mk2_native_stage_palettes/test_o130_dynamic_stage_streams.py`: **36 regression tests**, including forged root pointers, commands, flags, stream hashes, parameter fields, unsupported runtime claims, and wrong-file rejection.
- `src/games/mk2/research/stageDynamicStreamsO130.ts`: original-EXE-only, read-only browser decoder. Its stage summaries match Python in **141 assertions** via `scripts/run-mk2-o130-dynamic-stage-bridge.mjs`.
- `src/components/MK2IndexedStageMosaicsO122.tsx`: displays qualified Tomb/Portal stream source and raw `-1` arguments, expressly not live game-state values.

Reproduction (requires user-supplied original EXE):

```sh
python tools/mk2_native_stage_palettes/trace_o130_dynamic_stage_streams.py --exe /path/to/MK2.EXE --out /fresh/O130_REPORT.json
python tools/mk2_native_stage_palettes/verify_o130_dynamic_stage_streams_independent.py /path/to/MK2.EXE /fresh/O130_REPORT.json
python tools/mk2_native_stage_palettes/test_o130_dynamic_stage_streams.py /path/to/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o130-dynamic-stage-bridge.mjs /path/to/MK2.EXE /fresh/O130_REPORT.json
```

## Unresolved and next work

**Static commands do not prove runtime execution.** No trace confirms that a fight selected one of these root pointers, that the guard bit was set, what palette handle was assigned, or whether a particular source was displayed in a given frame. We still lack reliable camera-state measurements and full scene ordering. No new DOSBox screenshot is requested by this source-only checkpoint.

The next targeted static investigation should examine **the two numeric `-1` operands** and the code that consumes them in `0x9E118` to determine whether they define a bounded row transfer, clipping extent or stage offset. If this cannot be resolved statically, request specific runtime instrumentation at the rooted stream pointer (`0x75CF6`), `-1` command dispatch (`0x9356E`), and guard (`0x9E118`)—**after determining the correct loaded/emulated runtime addresses**, not by assuming on-disk offsets equal runtime addresses.

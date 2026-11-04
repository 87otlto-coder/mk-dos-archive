# MK DOS Archive — Passes O110K–O110N: Palette lifetime, render gate, queue and bank consumers

**2026-10-10 | MK2 original DOS executable | INTERIM: 7/30 independently verified research passes since O110G**

This document extends O110H–O110J. Four new code-image-bounded, source-authenticated passes were implemented and independently verified. It is **not** the 30-pass checkpoint, an emulator trace, an RGB proof, or a claim that MK2 research is complete. All supplied original game files were read-only.

## O110K — Nested reset invalidates an apparent 48-color palette seed

The source-local path at physical `0x779EA` calls `0x64695`, which calls `0x64659`. The seed routine calls the allocator reset at `0x7B41F`, requests the 48-color record at virtual source `0x26CC4` via `0x7B439`, and jumps into the common setup tail `0x66D04`. Within that tail, `0x66D51` calls the **same reset routine again**. The later reset zeros all 60 eight-byte palette slots, so the earlier palette request **cannot be assumed to leave a persistent handle**. The tail calls `0x81B18` before returning; its effects on palette state are not fully bounded. If this setup call returns, the local index-6 path calls the allocator for `0x26CC4` a second time at `0x779F4`. Neither this request nor the index-5 source-local request proves handle 1 ownership.

This specifically corrects the unsupported simplifying inference that a reset followed by a default palette request necessarily seeds a persistent slot-zero palette for a later stage. The second reset breaks that inference.

Verifier: **70 checks passed**. Adversarial controls: **6/6 rejected**.

## O110L — Exact shared render-gate direct-operand census

The original executable's Object-1 code image (`0x61C54..0xA0C54`) contains **11** exact 32-bit operand occurrences of global `0x562D4`: **six writes** (one XOR of low bit, two constant-one assignments, three constant-zero assignments) and **five bit-zero tests**. The palette allocator's fresh-insertion path at `0x7B499` writes zero to this gate. The packed stage drawing function at `0x9E118` tests bit 0, and branches to its return at `0x9E197` when clear, before the packed raster call at `0x9E191`. The matching-pointer allocator fast-path bypasses the fresh-insertion gate clear.

This is a direct-reference census, **not** proof that indirect/aliased memory accesses never occur and **not** a runtime visibility trace.

Verifier: **61 checks passed**. Adversarial controls: **6/6 rejected**.

## O110M — Palette queue/update flag and draw gate dispatch

A second original mutable global, `0x563E0`, has **six** direct 32-bit operand occurrences: four assignments to one, one assignment to zero, and one nonzero test. It is set during fresh allocation at `0x7B48F` immediately before the draw gate is cleared, and cleared at `0x7B3ED` in the queue processing routine. The bounded dispatch at `0x67050..0x670DD` toggles the draw gate, tests this queue/update flag at `0x6708C`, and has a conditional route that explicitly enables the draw gate at `0x67098`, calls a draw routine at `0x670A2`, calls palette processing at `0x670A7`, and disables the gate again at `0x670B1`. The alternate branch is source-verified separately.

The meaning “pending palette update” is supported by the allocator and queue call sites; a full scheduling/alias trace remains open. No colors or frame timing were invented.

Verifier: **69 checks passed**. Adversarial controls: **6/6 rejected**.

## O110N — All exact palette-bank byte direct-operand consumers

The source code image has **11** exact occurrences of the eight-byte-stride bank-start field address `0x75B06`: **nine reads** and **two writes**. A distinctive alternate sprite path at `0x65357..0x6536C` tests `DL & 8`; the flag-set route uses `ADD AL,[EBP*8+0x75B06]` while the default route uses `MOV AL,[EBP*8+0x75B06]`. Both continue with the bank byte decrement and mask. The packed stage renderer instead reads a bank byte directly at `0x659EA` from the handle passed as EAX (literal 1 in the bounded caller), then decrements and masks it. This supports two distinct source-backed bank selection mechanics. It does **not** establish that the alternate mode runs for any particular sprite, or determine the bank record at runtime handle 1.

Verifier: **61 checks passed**. Adversarial controls: **6/6 rejected**.

## Verification and constraints

- New independent source/report assertions: **261**, zero failures.
- Deliberate evidence/source alterations rejected: **24/24** (baseline reports must verify before each tamper suite).
- Previous O110F/G/H/I/J positive and negative regression batch: **PASS**.
- Original MK2.EXE SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- No original game data, executable, or graphics file was changed.
- No active palette handle-one source, exact RGB gameplay scene, stage animation, or source-to-scene color ownership is asserted.

To reproduce from the source-root directory:

```bash
python scripts/verify-mk2-o110h-o110j-batch.py /path/to/original/mk2
python scripts/test-mk2-o110k-o110n-negatives.py /path/to/original/mk2
```

The second command validates authentic O110K/N evidence, including O110L/M, then rejects 24 deliberate mutations. Additional individual `run-mk2-o110{suffix}-*.py` producers and `verify-mk2-o110{suffix}-*.py` independent verifiers are included for each pass.

## Next substantial target: O110O

Recover *runtime* palette state through a bounded trace-capable mechanism or additional soundly linked process/callback provenance. Recording caller order, handle index, pointer, reference count and bank-base at the packed-stage blitter's entry would resolve the outstanding handle-one state directly. Without this, do not guess palette ownership from static adjacency. The separate MK2 animation/descriptor ownership and stage layer-composition questions remain open and should be pursued if runtime instrumentation is not feasible.

The agreed source/handoff consolidation cadence is **30 substantive independently verified passes**; this is only an interim 7/30 preservation point, not a formal checkpoint.

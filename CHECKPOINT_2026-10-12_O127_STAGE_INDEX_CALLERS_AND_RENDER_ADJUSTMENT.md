# MK DOS Archive — O127 stage-index source and rendering adjustment

**Date:** 2026-10-12. **Priority:** MK2. **Classification:** verified static executable relationships. **Count:** one substantive checkpoint; the 50-pass limit is not a target. **Gameplay input:** none needed for this result.

## What was independently authenticated

1. The canonical original `MK2.EXE`, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`, has **nine direct `CALL rel32` candidates** that land exactly at stage-root dispatcher physical offset `0x82321`. Every site was checked against actual bytes and the original LE code image.
2. Five code paths write a DWORD index to the shared working location Object-2 `0x75A80` **immediately before** the call: `0x771E6` writes 7, `0x77A08` writes 6, `0x77D8B` writes 5, `0x84EEE` writes 30, and `0x85FAE` writes 13. The entry-30 path restores the prior shared working value after return. The remaining four callers depend on earlier scratch, stored or computed values; notably the `0x758CC` path writes a candidate 2 *before two intervening function calls*, so 2 is not a verified immediate call input there.
3. In `0x74D4D`, the source can be `0x76512` or a conditional override from Object-2 `0x2CFF6` decremented by 1. Some nearby source-state checks compare other globals with 12, but those comparisons must not be mislabeled as an exhaustive bound for the final index.
4. The first dispatcher copies the requested index into Object-2 `0x7747F` at physical `0x82326` **before** overwriting Object-2 `0x75A80` with the selected root pointer at `0x82355`. LE relocations independently authenticate the saved-index write and a later read at `0x9E165`.
5. The gated render path beginning at `0x9E118` truncates an input operand to its low 16 bits, reads saved index `0x7747F`, then at `0x9E16A` executes an indexed **32-bit add to `ESI`**, drawing the DWORD from Object-2 `0x2EF54 + 4*index`. The source report authenticates **31 consecutive DWORDs** for the same index span as the stage root tables. This is a **packed/indexed rendering adjustment**, NOT a measured internal camera coordinate, and not a recovered semantic interpretation of the 32-bit values.
6. The other root-dispatch path at `0x98BA7` has a distinct EAX-through-stack input (`0x98B7D` push, `0x98BA6` pop). An upstream code path sets a candidate immediate 20 at `0x98AFB`, but this is not a complete control-flow proof of the value for all executions. Neither dispatcher has an *immediate local index bounds check* between scale and table dereference; earlier checks are unresolved.
7. Original stage table indices 1 and 7 continue to identify the authenticated Tomb and Portal source families, but these static links **do not** prove which path or stage was active in the user's previously recorded fights.

## Verification and implementation

- New source tool: `tools/mk2_native_stage_palettes/trace_o127_stage_index_consumers.py`.
- Independent source verifier (different relocation parser): `tools/mk2_native_stage_palettes/verify_o127_index_consumers_independent.py`.
- Adversarial regression: `tools/mk2_native_stage_palettes/test_o127_stage_index_consumers.py` — **34 passing cases**.
- Browser integration: `src/games/mk2/research/stageIndexConsumersO127.ts`, called by `src/components/MK2IndexedStageMosaicsO122.tsx`.
- Node bridge: `scripts/run-mk2-o127-stage-index-bridge.mjs` — **41 parity assertions** comparing canonical browser decoding to independently generated Python evidence.
- Independent O127 audit: **176 source assertions**, complete **27,004 relocation** census using independent parser.
- Existing O120–O126 Python regressions: **175 tests passed** using a user-supplied canonical original executable and resource ZIP.
- React application full production build and actual GUI interaction **remain unverified**; isolated TypeScript decoder type-check and Node bridge pass.

## Reproduce (with user's own original game files)

```bash
python tools/mk2_native_stage_palettes/trace_o127_stage_index_consumers.py --exe /path/to/MK2.EXE --out /tmp/O127_REPORT.json
python tools/mk2_native_stage_palettes/verify_o127_index_consumers_independent.py /path/to/MK2.EXE /tmp/O127_REPORT.json
python tools/mk2_native_stage_palettes/test_o127_stage_index_consumers.py /path/to/MK2.EXE
node --experimental-strip-types scripts/run-mk2-o127-stage-index-bridge.mjs /path/to/MK2.EXE /tmp/O127_REPORT.json
```

## Explicit limits and next investigation

- The shared scratch global `0x75A80` is reused for unrelated operations and **not** a permanent stage index.
- The `0x7747F` saved index is a source-level input to a gated rendering routine. Runtime activation, value lifetime, and relationship to absolute camera X/Y still require proof.
- A direct opcode-aware call search cannot rule out indirect calls or recover all predecessor paths; the caller census is therefore scoped to nine original code-image direct `E8` candidates and authenticated instruction boundaries.
- The 31-entry adjustment table is source-authenticated, but the screen-space semantics of its packed DWORDs are unknown. Do not promote to engine camera offsets.
- Recommended next work: trace who writes index 7 or 1 **during ordinary fight setup**, the renderer gate conditions, and whether the dispatcher-snapshot write is on the gameplay path. Runtime instrumentation eventually remains necessary for live palette handles/camera values.

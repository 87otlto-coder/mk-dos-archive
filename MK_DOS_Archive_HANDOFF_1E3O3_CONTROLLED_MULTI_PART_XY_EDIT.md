# MK DOS Archive — Pass 1E.3O.3 Controlled Multi-Part XY Edit + Lossless Write-Back

Last reconciled: **2026-09-26**

Status: **STATIC WRITE-BACK VERIFIED / RUNTIME NON-DESTRUCTIVE BEHAVIOR VERIFIED / VISUAL DISPLACEMENT INCONCLUSIVE**

## 1. Why this pass exists

1E.3O.2 established the first bounded lossless animation IR for a genuine MK1 multi-part animation. The next required compiler milestone was not another read-only discovery pass; it was to prove that a semantic canvas-position change can travel through the IR and serializer back into a playable DOS executable without collateral edits.

The controlled fixture remains Kano's heart-rip animation because its route, variable-part frame grammar, resource, palette, descriptor records, no-edit serializer and canonical provenance are already qualified.

The project goal remains:

**binary → structured/lossless IR → editable assets/canvas → deterministic compiler → binary**

1E.3O.3 is the first bounded step where the middle "editable" stage materially changes the rebuilt executable.

## 2. Accepted prerequisite

User browser artifact:

- `mk1_multi_part_frame_lossless_ir_2026-09-26T06-10-03-373Z.json`
- format: `mk1_multi_part_frame_lossless_ir_v1`
- pass: `1E.3O.2`
- source: authentic user-loaded `MK1.EXE`
- size: 1,157,222 bytes
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- status: `SUCCESS`
- all nine validation checks passed
- verdict: `MULTI_PART_FRAME_AND_BOUNDED_LOSSLESS_IR_ESTABLISHED`
- no-edit semantic serializer: 22 regions, zero whole-executable differences, exact canonical SHA restored

The verified multi-part frame used here is the primary heart-rip frame containing:

`[KHEART3A, KHEART3B, KHEART3C, 0]`

## 3. Controlled semantic edit

The pass does **not** patch an arbitrary file offset as its authoring operation. It clones the qualified `mk1_animation_ir_v1` and edits:

`KANO.HEART_RIP_MULTI.PRIMARY.frame3.part1.KHEART3B.x`

Semantic descriptor change:

- descriptor: `KHEART3B`
- Watcom offset: `0x0001BC34`
- original X: `+19`
- edited X: `-12`
- delta: `-31 px`
- Y remains `-18`
- width/height remain `13 × 16`
- packed resource reference remains unchanged
- frame record remains unchanged
- part count remains unchanged

The edited IR is then serialized through the exact same `serializeMK1BoundedAnimationIr` path established in 1E.3O.2.

## 4. Exact binary result

`KHEART3B` begins at physical `0x000A8688`.

Its signed 16-bit X field is at:

- `0x000A868C`
- `0x000A868D`

Encoding changes:

`+19 = 0x0013 = 13 00`

`-12 = 0xFFF4 = F4 FF`

Whole-executable result:

- canonical source SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- edited SHA-256: `b900d6e2071f004b409464251247c058240fcc3d629d7d47349324fb1ba2a1ce`
- changed bytes: **2 exactly**
- expected changed bytes: **2**
- unexpected changed bytes: **0**
- all non-target qualified semantic regions: byte-identical
- reverse operation: restore only the two changed bytes
- reversed SHA-256: canonical `750792...41b14`

This is the first established path in the project of:

**semantic animation IR field → bounded serializer → exact minimal executable edit**

## 5. Implementation

New core module:

`src/games/mk1/research/multiPartControlledEdit.ts`

It provides:

- `executeMultiPartControlledEdit(...)`
- `createMK1MultiPartControlledEditExport(...)`
- `buildMultiPartControlledEditBundle(...)`

The implementation fails closed unless:

- the source is an authentic non-synthetic directory source;
- the 1E.3O.2 report revalidates;
- the executable is the canonical MK1 fixture;
- the expected three-part frame still contains `KHEART3B` at structural part index 1;
- baseline `KHEART3B.x` is still +19;
- semantic serialization changes exactly the two X bytes;
- no other serialized semantic region differs;
- restoring the changed bytes recovers the canonical hash exactly.

New report format:

`mk1_multi_part_controlled_xy_edit_v1`

Decision verdict:

`BOUNDED_MULTI_PART_XY_EDIT_STATICALLY_VERIFIED`

The report intentionally remains:

`STATIC_VALIDATION_PASSED_RUNTIME_PENDING`

until the edited executable is observed in DOSBox.

## 6. UI

New component:

`src/components/MultiPartControlledEditPanel.tsx`

The research workflow is now 13 steps and 1E.3O.3 runs immediately after 1E.3O.2.

The panel shows:

- original three-part frame;
- edited IR preview on the same bounds;
- `KHEART3B` highlighted;
- semantic before/after X values;
- exact physical field offset;
- exact two-byte encoding change;
- edited SHA-256;
- unexpected byte change count;
- reversal status;
- one-click runtime bundle export.

Runtime bundle contents:

- edited `MK1.EXE`
- `mk1_multi_part_controlled_xy_edit.json`
- `mk1_multi_part_frame_lossless_ir.json`
- `mk1_animation_ir_edited.json`
- `READ_ME_FIRST.txt`

## 7. Validation performed in this implementation environment

### Core TypeScript

Targeted TypeScript compilation of `multiPartControlledEdit.ts` and its transitive project dependencies passed with a minimal `process` environment shim.

### UI TypeScript

The new panel and the modified `ResearchQuickActions.tsx` path passed targeted TypeScript compilation using minimal React/lucide declaration shims. These shims only replace absent installed package typings in this environment; they do not change project source.

### Script syntax

`node --check scripts/run-multi-part-edit.mjs` passed.

### Direct canonical-fixture execution

The compiled core implementation was executed directly against a byte-identical canonical MK1 installation and the user's accepted 1E.3O.2 JSON prerequisite.

All 1E.3O.3 export checks passed:

- `PROVENANCE_CANONICAL_REAL_USER_LOADED`
- `O2_PREREQUISITE_BOUND`
- `SEMANTIC_IR_MUTATION`
- `EXACT_TWO_BYTE_DIFF`
- `SIGNED_X_ENCODING`
- `OTHER_SEMANTIC_REGIONS_UNTOUCHED`
- `REVERSAL_CANONICAL`
- `SCOPE_BOUNDARY`

Direct result:

- status: `STATIC_VALIDATION_PASSED_RUNTIME_PENDING`
- changed bytes: 2
- changed offsets: `0x000A868C`, `0x000A868D`
- edited hash: `b900d6e2071f004b409464251247c058240fcc3d629d7d47349324fb1ba2a1ce`
- unexpected changes: 0
- reversal: exact

Full Vite/Vitest was **not** claimed in this environment because project `node_modules` are not installed.

## 8. Runtime test for the user

1. Load the untouched MK1 installation in MK DOS Archive.
2. Run **What's Needed**.
3. Confirm the new **Controlled multi-part XY edit / lossless write-back · 1E.3O.3** panel appears.
4. Download the controlled XY runtime bundle.
5. Use a separate copy of the complete MK1 installation.
6. Replace only `MK1.EXE` with the bundle copy.
7. Play as Kano and perform the heart-rip fatality.
8. Observe the brief three-part heart frame. `KHEART3B` should be displaced **31 pixels left** relative to its original position while the other two parts and the remainder of the fatality behave normally.
9. Because the frame is brief, video capture/frame stepping is recommended if the displacement is hard to catch live.
10. Return the exported `mk1_multi_part_controlled_xy_edit_*.json` and, if possible, a screenshot/video observation.
11. Restore the untouched executable afterwards.

The application does not modify the selected installation in place; the test executable is emitted only inside the downloaded bundle.

## 9. What this proves

If runtime behavior matches the edited preview, the project can promote the following bounded mechanism:

> Already-qualified WITH_XY descriptor placement fields can be edited semantically in the animation IR, serialized back into the original executable in place, and consumed by the DOS game with the expected visual effect.

That is materially closer to the final asset compiler than a byte patch, because the authoring operation is expressed as an asset property (`part.x`) and binary offsets are a serializer concern.

## 10. What this does not prove

Do not promote this pass into claims of:

- arbitrary animation recompilation;
- adding/removing parts;
- enlarging zero-terminated frame records;
- moving records to new binary locations;
- allocator/free-space semantics;
- pointer relocation;
- uGRA encoding or sprite-pixel replacement;
- universal display-list/z-order behavior;
- generic MK2/MK3 animation behavior.

The serializer is still bounded to the qualified fixed-layout heart fixture.

## 11. Recommended next pass after runtime confirmation

The safest next compiler-facing step is a **bounded descriptor placement editor** for already-qualified fixed-layout animation parts:

- expose X/Y fields rather than a fixed test value;
- preview movement on the canvas;
- constrain signed-16-bit ranges;
- compile via the same semantic serializer;
- diff and reverse every export;
- keep width/height/resource reference and part-count edits locked initially.

After that is stable, start a separate research pass for **frame-record growth / relocation / free-space and pointer-rewrite semantics**. Only once that is understood should the UI permit adding or removing visual parts.

## 12. Standing methodology

Continue using:

**OBSERVE → RECORD → HYPOTHESIZE → TEST → CLASSIFY CONFIDENCE → GENERALIZE ONLY AFTER REPETITION**

And retain the architectural rule:

**Generic in mechanics, specific in interpretation.**

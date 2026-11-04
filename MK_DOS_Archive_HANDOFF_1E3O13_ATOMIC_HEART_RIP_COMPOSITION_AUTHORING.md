# MK DOS Archive — Handoff — Pass 1E.3O.13 Atomic Heart-Rip Composition Authoring

Date: 2026-09-27

## Status

**VERIFIED — canonical user-directory model, atomic topology+placement compile, bundle integrity, semantic reparse, alias reporting and exact reversal all passed.**

Pass 1E.3O.13 composes the already-verified O12 fixed-capacity `heart_2` topology writer with the already-qualified O8 signed-int16 KHEART X/Y placement writer into one fail-closed semantic transaction. It does not introduce relocation, arbitrary pointers, new descriptor storage or generic animation allocation.

## Prerequisite closeout

O12 is now VERIFIED:

- canonical no-edit model exact;
- interactive topology `[KHEART3A,KHEART3B,KHEART3C] -> [KHEART3C,KHEART1]`;
- five independently predicted changed bytes;
- zero unexpected changes;
- semantic reparse exact;
- following `heart_3` preserved;
- supplied bundle hash matched the standalone edit report;
- reversing the five actual bundle bytes restored canonical SHA-256 exactly.

Authoritative O12 verdict:

`HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_VERIFIED`

## O13 authoring contract

New model format:

`mk1_heart_rip_atomic_composition_editor_model_v1`

New edit format:

`mk1_heart_rip_atomic_composition_edit_v1`

Target topology remains **only `heart_2`**.

Allowed in one atomic request:

- 1–4 unique qualified KHEART parts;
- add/remove/replace/reorder inside the existing 16-byte allocation;
- signed-int16 X/Y changes for descriptors present in the requested topology.

Still blocked:

- duplicate descriptor pointers;
- arbitrary descriptor pointers;
- zero parts or >4 parts;
- topology edits to any other frame;
- X/Y edits to a descriptor not selected into the authored topology;
- relocation/free-space allocation;
- sequence-vector rewrite;
- setup object-count changes;
- descriptor width/height or packed-reference mutation;
- GRA pixel encoding;
- palette mutation;
- collision, hit, world-coordinate or gameplay fields.

## Alias semantics

Descriptor-local placement remains shared-storage authoring. O13 therefore reports all affected preview keys for each placement edit.

Example: `KHEART1` is already used by `PRIMARY:0`. If O13 also selects it into `heart_2` and changes its X/Y, the placement edit intentionally affects:

- `PRIMARY:0`;
- `PRIMARY:2`.

This is reported as an alias side effect outside the target composition, not silently hidden.

## Compiler write path

`executeHeartRipAtomicCompositionEdit(...)`:

1. requires successful O13 model;
2. validates topology count 1..4 and unique qualified descriptor identities;
3. validates placement coordinates as signed-int16;
4. rejects placement edits for descriptors not selected into the requested topology;
5. rejects duplicate placement requests and total semantic no-ops;
6. fresh-reads canonical `MK1.EXE` and checks its exact SHA-256;
7. clones `mk1_animation_ir_v1`;
8. replaces only `heart_2.parts` semantically;
9. applies requested descriptor X/Y values semantically;
10. serializes established O2 semantic regions;
11. replaces only the target frame region with deterministic 16-byte O12 fixed-capacity encoding;
12. independently derives expected topology-byte changes;
13. independently derives expected X/Y-byte changes;
14. unions and sorts the expected diff set;
15. requires complete whole-EXE diff equality with that set;
16. reparses topology from the generated 16-byte record;
17. reparses requested X/Y values from generated descriptor bytes;
18. verifies following `heart_3` unchanged;
19. reverses all actual changed bytes;
20. requires exact canonical SHA-256 recovery.

## UI

New component:

`src/components/HeartRipAtomicCompositionEditor.tsx`

The panel exposes:

- ordered heart_2 part rows;
- add/remove/replace/reorder;
- numeric signed-int16 X/Y for each selected descriptor;
- baseline coordinate display;
- affected occurrence / alias display;
- reset transaction;
- atomic semantic compile;
- exact diff/reparse/reversal result;
- isolated edited MK1 bundle.

The current UI is numeric composition authoring, not yet a drag-canvas merger. A future UI pass may add direct canvas manipulation after the atomic compiler path is fixture-verified.

## Research workflow

`Run What's Needed` is now **22 stages**.

Stage 22:

`1E.3O.13 — Composing atomic heart_2 topology + placement authoring`

The quick-run exports the O13 model. User-authored transactions export separately through the O13 panel.

## Source-level validation performed

- O13 core TypeScript targeted type-check: **passed**;
- O13 React component targeted type-check with local declaration shims: **passed**;
- modified `ResearchQuickActions.tsx` targeted type-check with local declaration shims: **passed**;
- `node --check scripts/run-heart-rip-atomic-composition.mjs`: **passed**;
- package/metadata JSON parse: **passed**.

## Direct canonical-byte core validation

A canonical `MK1.EXE` byte fixture was reconstructed from the user-supplied, independently verified O12 isolated bundle by reversing its five actual reported changes. The reconstructed executable SHA-256 was then checked and matched canonical exactly:

`750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

Using the authentic exported canonical O8 and O12 models, O13 direct execution produced:

- model status: `SUCCESS`;
- all model checks: **8/8 passed**;
- model verdict: `HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_ESTABLISHED`.

Controlled direct transaction:

- topology: `[KHEART3A,KHEART3B,KHEART3C] -> [KHEART3C,KHEART1]`;
- placement: `KHEART1 (-23,-14) -> (-18,-12)`;
- topology bytes changed: 5;
- placement bytes changed: 2;
- whole-EXE changed bytes: **7**;
- expected changed bytes: **7**;
- unexpected changes: **0**;
- topology reparse: exact;
- placement reparse: exact;
- following `heart_3`: preserved;
- alias affected keys: `PRIMARY:0`, `PRIMARY:2`;
- exact reversal: canonical.

Representative fail-closed checks against the actual O13 request validator:

- zero parts;
- five parts;
- duplicate topology pointer;
- unknown topology descriptor;
- placement descriptor not selected into topology;
- duplicate placement request;
- X below int16;
- X above int16;
- fractional Y;
- total semantic no-op.

Result: **10/10 rejected correctly**.

## Remaining integration gate

The direct O13 core is strongly validated, but the new 22-stage source integration should still be executed from the normal application against the untouched user-loaded canonical MK1 directory. Export:

`mk1_heart_rip_atomic_composition_editor_model_....json`

Do not promote the complete O13 app/UI path to VERIFIED until that model is returned and independently checked.

After the model passes, one interactive O13 transaction should combine both mechanisms in one request. Recommended fixture:

- topology: `[KHEART3C,KHEART1]`;
- placement: `KHEART1 X=-18, Y=-12`.

Independent expected whole-EXE byte changes for that fixture:

- `0x00097CA8`: `28 -> 40`;
- `0x00097CAC`: `34 -> 10`;
- `0x00097CB0`: `40 -> 00`;
- `0x00097CB1`: `BC -> 00`;
- `0x00097CB2`: `01 -> 00`;
- `0x000A8668`: `E9 -> EE`;
- `0x000A866A`: `F2 -> F4`.

Expected total: **7 changed bytes**, zero unexpected changes.

## Current verdict

`HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_VERIFIED`
---

## Canonical user-directory closeout — 2026-09-27

Returned model:

`mk1_heart_rip_atomic_composition_editor_model_2026-09-27T15-00-48-559Z.json`

Returned edit:

`mk1_heart_rip_atomic_composition_edit_2026-09-27T15-02-28-432Z.json`

Returned isolated runtime bundle:

`MK1-1E3O13-heart-rip-atomic-composition-edit.zip`

### Model verification

The model was generated from the untouched canonical executable:

- size: 1,157,222 bytes;
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- no-edit rebuilt SHA-256: canonical exactly;
- no-edit mismatch count: 0;
- all 8 model checks passed;
- target remains `heart_2`, 16-byte fixed allocation, 1..4 unique qualified KHEART parts;
- topology+placement transaction is atomic;
- alias effects are explicit;
- relocation and other-frame topology remain blocked in O13.

### Controlled interactive transaction

Requested topology:

`[KHEART3A,KHEART3B,KHEART3C] -> [KHEART3C,KHEART1]`

Actual placement request entered by the user:

`KHEART1 (-23,-14) -> (-18,-112)`

The requested Y value was `-112`, not the originally suggested `-12`. This is retained as the authentic fixture rather than silently corrected. It provides a stronger signed-int16 displacement test.

Returned evidence:

- changed bytes: 7;
- expected changed bytes for the actual request: 7;
- unexpected changes: 0;
- whole-executable diff exactly expected: true;
- topology reparse: `[KHEART3C,KHEART1]`;
- topology reparse matches: true;
- placement reparse matches: true;
- following `heart_3` preserved: true;
- alias affected preview keys for `KHEART1`: `PRIMARY:0`, `PRIMARY:2`;
- reverse restores original: true;
- reversed SHA-256: canonical exactly.

Actual placement bytes included:

- `0x000A8668`: `E9 -> EE` for X `-23 -> -18`;
- `0x000A866A`: `F2 -> 90` for Y low byte `-14 -> -112`.

### Independent bundle inspection

The supplied ZIP was independently opened and integrity-tested:

- CRC/integrity: passed;
- contents: `MK1.EXE`, edit JSON, readme;
- bundled edited executable SHA-256: `3fcfba2a7e4449c2bb848d89f4ed68003892a23ecb7a33215efb31ce801e788d`;
- bundled executable hash matches the standalone report;
- embedded edit JSON matches the exported transaction;
- reversing the reported seven changes restores the canonical executable.

Final verdict:

`HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_VERIFIED`

No extra runtime gate is required solely to close O13 because O13 composes two mechanisms already grounded by O8 placement evidence and O11 full-capacity topology runtime evidence. Future authored compositions may still be runtime-tested when their visual result matters.

Generic topology editing across all heart-rip frame records remains outside O13 and is the target of the next pass.

# MK DOS Archive — Handoff — Pass 1E.3O.8 Full Heart-Rip Fixed-Layout Animation Placement Editor

Date: 2026-09-27

## Status

**VERIFIED — canonical-fixture model, controlled semantic edit, exact whole-EXE diff, semantic reparse, alias behavior and exact reversal all passed.**

Pass 1E.3O.8 deliberately broadens the verified O7 fixed-layout authoring model before opening relocation/allocation research. The complete already-qualified Kano heart-rip animation is now represented as an editable fixed-layout sequence while preserving storage aliases explicitly.

This pass does **not** reopen Rayden hit/contact work and does **not** introduce frame growth, allocation, relocation, pointer rewrite, pixel encoding or gameplay mutation.

---

## 1. Accepted prerequisite

The authoritative O7 handoff is now independently closed:

- status: **VERIFIED**;
- canonical `MK1.EXE`: 1,157,222 bytes;
- canonical SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- O7 no-edit semantic round trip: 22 regions, 0 whole-EXE mismatches, canonical hash exact;
- independent O7 edit: 3 descriptors / 4 fields / 4 changed bytes, 0 unexpected bytes;
- semantic reparse: exact;
- reversal: canonical hash exact;
- fail-closed checks: 24 passed;
- no implementation correction required.

O8 also continues to rely on the closed O2 bounded animation IR and serializer:

`mk1_animation_ir_v1 -> serializeMK1BoundedAnimationIr`

---

## 2. Why O8 comes before relocation

After O7 there were two valid branches:

1. broaden same-size fixed-layout editing to more already-qualified structure; or
2. begin separate record-growth / relocation / allocation research.

O8 chooses branch 1 because the existing `MA_KHEART` fixture already contains a useful compiler property that O7 did not expose: **timeline occurrences alias shared frame/descriptor storage**.

This can be qualified without inventing allocator policy.

---

## 3. Qualified animation scope

The O2-qualified Kano heart-rip animation contains:

- PRIMARY sequence occurrences: **5**;
- BEAT_LOOP sequence occurrences: **3**;
- total sequence occurrences: **8**;
- unique frame records: **7**;
- unique KHEART descriptors: **9**.

Qualified descriptor set:

- `KHEART1`
- `KHEART2`
- `KHEART3A`
- `KHEART3B`
- `KHEART3C`
- `KHEART4`
- `KHEART5A`
- `KHEART5B`
- `KHEART5C`

The O7 frame remains one occurrence inside this broader structure:

`PRIMARY:2 -> [KHEART3A, KHEART3B, KHEART3C, 0]`

All descriptors remain File ID 2 / `GRAPHICS/MISC.GRA` sprites under qualified `BLOOD_P` preview semantics.

---

## 4. Alias semantics made explicit

The important new structural distinction is:

**sequence occurrence != necessarily unique frame-record storage != necessarily unique descriptor storage**

The qualified fixture reuses frame record `heart_4` / `KHEART5A` in two sequence positions:

- `PRIMARY:4`
- `BEAT_LOOP:2`

O8 therefore records descriptor usage and frame-record usage in the editor model.

A `KHEART5A` X/Y edit is intentionally one descriptor-storage edit whose visual effect is expected at both qualified occurrences. The editor shows this before compile rather than presenting the two appearances as independent writable copies.

This is an IR/editor aliasing rule for the bounded fixture, not a generalized MK-DOS claim yet.

---

## 5. New semantic editor model

New implementation:

`src/games/mk1/research/heartRipAnimationCanvasEditor.ts`

New model format:

`mk1_heart_rip_animation_canvas_editor_model_v1`

Model contains:

- canonical provenance;
- O2 prerequisite identity;
- O7 prerequisite identity;
- all 8 sequence occurrences;
- all 7 unique frame records through occurrence references;
- all 9 descriptor semantic records;
- per-descriptor usage graph;
- reused-frame-record graph;
- explicit `KHEART5A` PRIMARY/BEAT_LOOP alias evidence;
- decoded preview payload for each descriptor;
- resource/palette provenance;
- common descriptor-local canvas;
- serializer capabilities and blocked operations;
- fresh full 22-region no-edit semantic round trip.

Model verdict:

`KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_ESTABLISHED`

Do not promote this verdict to direct-fixture VERIFIED until O8 itself runs against canonical fixture bytes.

---

## 6. Writable scope

O8 exposes only each qualified descriptor's signed-int16:

- X at descriptor `+0x04`;
- Y at descriptor `+0x06`.

Request shape remains semantic:

`{ symbol, x, y }`

The write path:

1. requires successful O2 and O7 prerequisites;
2. fresh-reads canonical `MK1.EXE`;
3. checks canonical SHA-256;
4. verifies source X/Y against the qualified model;
5. rejects unknown symbols, duplicates, non-int16 coordinates, empty/no-op requests;
6. clones `mk1_animation_ir_v1`;
7. changes requested descriptor X/Y only;
8. independently calculates expected changed X/Y bytes;
9. serializes all 22 bounded semantic regions;
10. diffs the entire executable;
11. requires actual byte changes to equal expected X/Y changes exactly;
12. reparses edited X/Y from the generated executable;
13. reverses actual changed bytes;
14. requires exact canonical SHA-256 recovery.

Shared descriptor usage is reported in each edit result through `affectedPreviewKeys`.

---

## 7. Explicit fail-closed boundary

Still unsupported and intentionally unavailable:

- adding/removing/duplicating parts;
- frame-record growth;
- frame-record pointer edits;
- sequence-vector edits;
- descriptor identity replacement;
- descriptor width/height edits;
- packed GRA-reference edits;
- `.GRA` pixel replacement/encoding;
- palette editing in this editor;
- free-space allocation;
- relocation;
- pointer rewrite/allocation;
- animation topology restructuring;
- collision/contact/hit detection;
- projectile/world coordinates;
- velocity, damage, move/input or other gameplay state.

O8 remains a same-size, in-place semantic authoring pass.

---

## 8. Interactive UI

New component:

`src/components/HeartRipAnimationCanvasEditor.tsx`

UI supports:

- selection among all 8 sequence occurrences;
- PRIMARY and BEAT_LOOP frames in one bounded editor;
- current frame-record identity;
- visible part selection;
- click-to-select;
- pointer dragging;
- numeric X/Y;
- one-pixel nudges;
- original-position ghosts;
- reset selected / reset all;
- PNG preview for current occurrence;
- global dirty-descriptor manifest across all 9 descriptors;
- per-descriptor usage/alias display;
- explicit warning for shared `KHEART5A`;
- semantic compile;
- exact diff/hash/reparse/reversal result;
- isolated test bundle export.

The canvas continues to show structural pointer-list order only. No universal final z-order claim is introduced.

---

## 9. Direct smoke design

New command:

`npm run smoke:heart-rip-animation-editor -- <MK1_DIRECTORY> <OUTPUT_DIRECTORY>`

Smoke deliberately exercises three storage cases:

1. `KHEART1`: +2 X — single-part, single-use descriptor;
2. `KHEART3B`: -3 Y — one component inside the known three-part frame;
3. `KHEART5A`: +4 X / +1 Y — shared descriptor used by both PRIMARY:4 and BEAT_LOOP:2.

Required smoke assertions:

- model status SUCCESS;
- 8 occurrences;
- 7 unique frame records;
- 9 descriptors;
- `KHEART5A` usage exactly `PRIMARY:4`, `BEAT_LOOP:2`;
- no-edit round trip exact;
- changed descriptors exactly 3;
- whole-executable diff exactly expected;
- zero unexpected bytes;
- edited semantic coordinate reparse exact;
- exact reversal to canonical SHA-256;
- shared edit result reports both affected preview keys.

No DOSBox test is automatically required for this static compiler qualification.

---

## 10. Source changes

Added:

- `src/games/mk1/research/heartRipAnimationCanvasEditor.ts`
- `src/components/HeartRipAnimationCanvasEditor.tsx`
- `scripts/run-heart-rip-animation-canvas-editor.mjs`
- `MK_DOS_Archive_HANDOFF_1E3O8_FULL_HEART_RIP_FIXED_LAYOUT_EDITOR.md`

Updated:

- `src/components/ResearchQuickActions.tsx`
- `src/appMetadata.ts`
- `metadata.json`
- `package.json`
- `README.md`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`
- in-archive O7 handoff replaced with the independently VERIFIED closeout supplied after Work-mode fixture validation.

The research quick-run workflow is now **17 stages** and ends by constructing the full heart-rip fixed-layout editor model.

---

## 11. Validation performed in implementation environment

Passed:

- O8 core targeted TypeScript using the project's compiler contract plus only a minimal process declaration shim;
- O8 React component targeted TypeScript using local React/lucide declaration shims;
- modified `ResearchQuickActions.tsx` path targeted TypeScript using local React/lucide declaration shims;
- `node --check scripts/run-heart-rip-animation-canvas-editor.mjs`;
- `package.json` parse;
- source archive integrity to be checked at packaging.

Not claimed:

- full `npm run lint` / Vitest / Vite build in this environment, because the supplied source snapshot has no `node_modules`;
- direct O8 execution against canonical fixture bytes, because raw project `MK1.EXE` is not exposed to this execution environment;
- browser gesture exercise;
- DOSBox runtime observation.

The initial full `npm run lint` attempt failed only because dependency packages/types were absent; a real O8 ZIP-helper field mismatch exposed during that attempt was corrected before the targeted checks passed. The temporary validation shims are not included in project source.

---

## 12. Required independent fixture closeout

Run O8 against the authentic canonical installation whose `MK1.EXE` is:

- size: 1,157,222 bytes;
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`.

Independent closeout should verify:

1. O8 source matches the delivered archive;
2. canonical fixture/resource identity;
3. exact 22-region no-edit round trip;
4. 8 occurrences / 7 unique records / 9 descriptors;
5. `KHEART5A` alias map exactly PRIMARY:4 + BEAT_LOOP:2;
6. deterministic smoke edit changes only independently expected X/Y bytes;
7. semantic reparse from edited executable matches requested coordinates;
8. shared `KHEART5A` edit metadata reports both occurrences;
9. reversal recovers canonical SHA exactly;
10. representative fail-closed requests remain rejected;
11. lint/tests/build/smoke pass if dependencies are available.

If those checks pass, classify O8 **VERIFIED** without requiring DOSBox runtime solely for closure.

---

## 13. Continuation boundary

Do not choose the next pass until O8 fixture validation closes or rejects this model.

If O8 closes, the project will have proved fixed-layout authoring across:

- single descriptor frames;
- genuine three-part composition;
- complete multi-sequence animation occurrence coverage;
- shared storage aliases.

Only then should the next decision be made between another independent semantic island and a separately qualified structural-growth / relocation pass.
---

## 14. Independent canonical-fixture closeout — 2026-09-27

**Final status: VERIFIED. O8 is safe to close from static canonical-fixture evidence.**

No implementation correction was required. The delivered `MK-DOS-1E3O8-source.zip` remains the validated implementation artifact.

### Canonical model execution

User-generated O8 model artifact:

`mk1_heart_rip_animation_canvas_editor_model_2026-09-27T11-57-41-333Z.json`

Verified:

- source kind: authentic user-loaded directory;
- `MK1.EXE` size: 1,157,222 bytes;
- canonical SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- O2 prerequisite bound and successful;
- O7 prerequisite bound and successful;
- 8 sequence occurrences;
- 7 unique frame records;
- 9 unique KHEART descriptors;
- shared `heart_4` / `KHEART5A` storage explicitly mapped to `PRIMARY:4` and `BEAT_LOOP:2`;
- no-edit serializer: 22 semantic regions, whole-EXE mismatch count 0, rebuilt SHA-256 canonical exactly;
- all 8 O8 model checks passed.

### Controlled authoring fixture

User-generated edit artifact:

`mk1_heart_rip_animation_canvas_edit_2026-09-27T12-25-17-390Z.json`

Actual semantic request:

- `KHEART1`: `(-23,-14)` -> `(-21,-14)`;
- `KHEART3B`: `(19,-18)` -> `(19,+21)`;
- `KHEART5A`: `(26,10)` -> `(30,11)`.

The `KHEART3B` target was +21 rather than the originally proposed -21. This is accepted as a valid deterministic fixture. Because the signed-int16 Y word crosses from negative to positive, both bytes of that Y field are expected to change.

Independent expected whole-EXE byte changes, calculated from the canonical O8 model rather than the compiler manifest:

| Physical EXE offset | Before | After | Semantic field |
|---|---:|---:|---|
| `0x000A8668` | `E9` | `EB` | `KHEART1.x` low byte |
| `0x000A868E` | `EE` | `15` | `KHEART3B.y` low byte |
| `0x000A868F` | `FF` | `00` | `KHEART3B.y` high byte |
| `0x000A86B0` | `1A` | `1E` | `KHEART5A.x` low byte |
| `0x000A86B2` | `0A` | `0B` | `KHEART5A.y` low byte |

Actual compiler evidence matched that set exactly:

- changed descriptors: 3;
- changed semantic fields: 4;
- changed EXE bytes: 5;
- expected changed EXE bytes: 5;
- unexpected byte changes: 0;
- whole-executable diff exactly expected: true;
- semantic reparse matches requested coordinates: true;
- edited SHA-256: `c489a9bd234de3da90f04a38f4542bc564816897e72f076b6dfbd8807db247d6`;
- reversed SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- exact reverse-to-canonical: true.

`KHEART5A` correctly reports both affected timeline occurrences:

- `PRIMARY:4`;
- `BEAT_LOOP:2`.

This confirms the O8 editor exposes shared descriptor storage rather than pretending those two appearances are independent copies.

### Preservation boundary

The edit report confirms:

- seven unique frame records remain fixed;
- eight sequence occurrences remain fixed;
- part counts unchanged;
- frame-record pointers unchanged;
- descriptor dimensions unchanged;
- packed GRA references unchanged;
- GRA pixels unchanged;
- palette unchanged;
- relocation unused;
- collision/gameplay untouched.

### Representative fail-closed validation

The actual O8 TypeScript module was transpiled ephemerally with external imports stubbed only so the exported authoring function's pre-write guards could be executed directly. No production source was modified.

10/10 representative rejection checks passed:

- empty change list;
- unknown descriptor symbol;
- duplicate descriptor edit;
- X below signed-int16 range;
- X above signed-int16 range;
- Y below signed-int16 range;
- Y above signed-int16 range;
- fractional X;
- NaN Y;
- infinite Y.

These checks exercise the real O8 request-validation path before any fixture read/write occurs.

### Closure

Verdict:

`KANO_HEART_FULL_FIXED_LAYOUT_CANVAS_EDITOR_VERIFIED`

O8 establishes fixed-layout authoring across:

- single-part frame descriptors;
- the qualified three-part composition;
- the complete PRIMARY + BEAT_LOOP occurrence set;
- explicit shared frame/descriptor aliases;
- deterministic semantic serialization;
- exact whole-EXE byte accounting;
- semantic reparse;
- exact reversal.

Runtime remains unclaimed and is not required solely to close this static compiler pass. No collision/contact investigation was performed.

The next pass may now be selected independently from the compiler roadmap.

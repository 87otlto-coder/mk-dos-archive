# MK DOS Archive — Handoff — Pass 1E.3O.12 Fixed-Capacity Heart-Rip Topology Authoring

Date: 2026-09-27

## Status

**VERIFIED — canonical model and interactive fixed-capacity topology edit both passed exact whole-EXE validation and reversal.**

Pass 1E.3O.12 promotes the runtime-verified bounded O11 3→4 mechanism into a deliberately limited authoring surface for the existing 16-byte `heart_2` frame record. It does **not** introduce relocation, allocation, arbitrary raw pointers or generic topology editing across other frame records.

## Canonical fixture

- `MK1.EXE` size: **1,157,222 bytes**
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- static-data file-image base: `0x0008CA54`
- target `heart_2` Watcom offset: `0x0000B254`
- target physical start: `0x00097CA8`
- fixed allocation: **16 bytes / four dwords**

All O12 authoring fresh-reads and hash-checks canonical `MK1.EXE` before writing.

## Prerequisite closeout

### O10

`RESHAPE_MULTI` full-capacity semantics are canonical-fixture VERIFIED:

- under-capacity records use a zero terminator and NULL_IMAGE padding;
- at four-object capacity, linked-object chain exhaustion returns before another descriptor dword is read;
- therefore a four-part frame occupies four dwords with no trailing zero.

### O11

The controlled fourth-slot write is statically exact and now runtime verified at the bounded mechanism level.

Static fixture:

- `[KHEART3A,KHEART3B,KHEART3C,0]` → `[KHEART3A,KHEART3B,KHEART3C,KHEART5B]`;
- exactly 3 expected EXE byte changes;
- 0 unexpected changes;
- semantic reparse exact;
- following `heart_3` preserved;
- exact canonical reversal.

User runtime observation:

- Kano heart-rip fatality completed normally;
- the heart looked more detailed;
- the throb appeared more prominent;
- nothing crashed and no obvious corruption was observed.

The runtime evidence is intentionally conservative: the user did not independently identify the added sprite as specifically `KHEART5B`. It verifies successful consumption/rendering of the bounded fourth linked object.

O11 runtime verdict:

`CONTROLLED_FOURTH_PART_IN_PLACE_TOPOLOGY_WRITE_RUNTIME_VERIFIED`

## O12 authoring contract

New model format:

`mk1_heart_rip_fixed_capacity_topology_editor_model_v1`

New edit format:

`mk1_heart_rip_fixed_capacity_topology_edit_v1`

Target scope is **only `heart_2`**.

Allowed:

- 1–4 parts;
- add a part;
- remove a part while keeping at least one;
- replace a part;
- reorder parts;
- choose only from the nine O8-qualified KHEART descriptors.

The nine legal descriptor identities are:

- `KHEART1`
- `KHEART2`
- `KHEART3A`
- `KHEART3B`
- `KHEART3C`
- `KHEART4`
- `KHEART5A`
- `KHEART5B`
- `KHEART5C`

Still blocked:

- zero-part frame;
- >4 parts;
- duplicate descriptor pointers;
- arbitrary raw descriptor pointers;
- any frame other than `heart_2`;
- frame-record growth;
- relocation/free-space allocation;
- sequence-vector rewrite;
- setup object-count changes;
- descriptor width/height/X/Y/packed-reference mutation from this topology editor;
- GRA pixel encoding;
- palette mutation;
- collision, hit, world-coordinate or gameplay fields.

Duplicate descriptor use is intentionally blocked because repeated-pointer semantics have not been independently qualified.

## Fixed-capacity encoding

O12 treats the existing four dwords as one fixed-capacity allocation:

- 1 part: `[p0, 0, 0, 0]`
- 2 parts: `[p0, p1, 0, 0]`
- 3 parts: `[p0, p1, p2, 0]`
- 4 parts: `[p0, p1, p2, p3]`

For 1–3 parts, the first unused dword is the semantic zero terminator and all later dwords are normalized to zero. For four parts, O10-qualified linked-object chain exhaustion provides termination.

This means all O12 edits remain inside `0x00097CA8..0x00097CB7`. The following `heart_3` record beginning at `0x00097CB8` is read-only and explicitly verified unchanged.

## Compiler write path

`executeHeartRipFixedCapacityTopologyEdit(...)`:

1. requires successful O12 editor model;
2. validates part count 1..4;
3. rejects unknown descriptors;
4. rejects duplicate descriptors;
5. rejects semantic no-op requests;
6. fresh-reads canonical `MK1.EXE` and checks exact SHA-256;
7. clones `mk1_animation_ir_v1`;
8. replaces only `heart_2.parts` in semantic IR;
9. uses O2 serializer as authority for all non-target semantic regions;
10. replaces only the target frame region with deterministic 16-byte fixed-capacity encoding;
11. independently calculates expected target-allocation bytes from the requested descriptor list;
12. diffs the complete executable and requires actual diff == independently expected diff;
13. reparses the four dwords under the refined zero-or-chain-exhaustion grammar;
14. requires reparsed semantic topology == request;
15. verifies the following `heart_3` bytes unchanged;
16. reverses every actual changed byte;
17. requires exact canonical SHA-256 recovery.

No edit is applied to the user's source directory. Runtime bundles contain a separate edited `MK1.EXE`.

## UI

New component:

`src/components/HeartRipFixedCapacityTopologyEditor.tsx`

The panel exposes:

- ordered structural-part rows;
- qualified descriptor selector per row;
- move up / move down;
- remove;
- add from currently unused qualified descriptors;
- baseline reset;
- live part-count and termination-mode display;
- semantic compile;
- exact diff/reparse/reversal summary;
- isolated test-bundle download.

The UI intentionally presents **structural pointer order**, not a universal final pixel z-order claim.

## Research workflow

`Run What's Needed` is now **21 stages**.

Stage 21:

`1E.3O.12 — Establishing fixed-capacity heart_2 topology authoring`

The quick-run stage exports the O12 model. User-authored topology edits export separately through the O12 panel.

## New files

Added:

- `src/games/mk1/research/heartRipFixedCapacityTopologyEditor.ts`
- `src/components/HeartRipFixedCapacityTopologyEditor.tsx`
- `scripts/run-heart-rip-fixed-capacity-topology.mjs`
- `MK_DOS_Archive_HANDOFF_1E3O12_FIXED_CAPACITY_HEART_RIP_TOPOLOGY_AUTHORING.md`

Updated:

- `src/components/ResearchQuickActions.tsx`
- `src/components/HeartRipFourthPartTopologyPanel.tsx`
- `src/appMetadata.ts`
- `metadata.json`
- `package.json`
- `README.md`
- `docs/CURRENT.md`
- `docs/RESEARCH.md`

The runtime-verified O11 handoff is also carried in this source snapshot.

## Source-level validation performed

Targeted TypeScript validation:

- O12 core module: **passed**;
- O12 React component with local React/lucide declaration shims: **passed**;
- modified `ResearchQuickActions.tsx` with local declaration shims: **passed**.

Script / metadata checks:

- `node --check scripts/run-heart-rip-fixed-capacity-topology.mjs`: **passed**;
- package JSON parses: **passed**;
- metadata JSON parses: **passed**.

Direct serializer exercise using the authentic canonical O8 model's `baselineIr`:

- 1-part fixture encoded to exactly 16 bytes: **passed**;
- 2-part fixture encoded to exactly 16 bytes: **passed**;
- reordered 3-part fixture encoded to exactly 16 bytes: **passed**;
- 4-part fixture encoded to exactly 16 bytes with no trailing zero: **passed**.

Observed direct encodings:

- 1 part `KHEART1`: `10 BC 01 00 00 00 00 00 00 00 00 00 00 00 00 00`
- 2 parts `KHEART3C,KHEART5A`: `40 BC 01 00 58 BC 01 00 00 00 00 00 00 00 00 00`
- 3 parts `KHEART5C,KHEART3A,KHEART2`: `70 BC 01 00 28 BC 01 00 1C BC 01 00 00 00 00 00`
- 4 parts `KHEART1,KHEART3B,KHEART5A,KHEART5C`: `10 BC 01 00 34 BC 01 00 58 BC 01 00 70 BC 01 00`

Representative fail-closed request checks against the actual O12 request validator:

- zero parts: rejected;
- five parts: rejected;
- duplicate descriptor: rejected;
- unknown descriptor: rejected;
- baseline no-op: rejected.

Result: **5/5 rejection checks passed**.

The complete npm/Vitest/Vite suite is not claimed in this snapshot because `node_modules` is absent. The supplied direct smoke script is designed for the normal development/fixture environment where project dependencies are installed.

## Direct canonical-fixture validation still required

The remaining O12 closeout step is to run the O12 build against the untouched canonical MK1 directory and export:

`mk1_heart_rip_fixed_capacity_topology_editor_model_....json`

The model should establish:

- canonical provenance;
- O8/O10/O11 prerequisites;
- target `heart_2` fixed 16-byte allocation;
- 9 qualified descriptors;
- 1..4 part policy;
- no-edit exact round trip;
- fixed-capacity/no-relocation decision;
- all model checks passed.

After the model itself closes, one user-authored edit should be exported to verify the full interactive writer path. A useful fixture is a reorder plus part-count change, for example:

`[KHEART3A,KHEART3B,KHEART3C]` → `[KHEART3C,KHEART5A]`

That exercises both reorder and removal while remaining under-capacity and should compile through a zero terminator.

Do not broaden to other frame records or relocation until O12 itself is fixture-verified.

## Verdict

Current source verdict:

`HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_IMPLEMENTED_VALIDATION_PENDING`

---

## Canonical-fixture closeout — 2026-09-27

**Final O12 compiler/editor status: VERIFIED.**

Returned model:

`mk1_heart_rip_fixed_capacity_topology_editor_model_2026-09-27T14-34-16-028Z.json`

Returned controlled edit:

`mk1_heart_rip_fixed_capacity_topology_edit_2026-09-27T14-39-13-111Z.json`

Returned isolated bundle:

`MK1-1E3O12-heart-rip-fixed-capacity-topology-edit.zip`

### Model verification

The O12 model was generated from the untouched canonical executable:

- size: 1,157,222 bytes;
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- synthetic: false;
- target: `heart_2`;
- allocation: 16 bytes;
- baseline topology: `[KHEART3A,KHEART3B,KHEART3C,0]`;
- legal part count: 1..4;
- legal descriptor set: nine qualified KHEART descriptors;
- add/remove/reorder/replace enabled;
- duplicates, arbitrary pointers, other-frame topology and relocation blocked;
- no-edit mismatch count: 0;
- no-edit rebuilt hash: canonical exactly;
- all 8 model checks passed.

### Controlled interactive authoring fixture

Requested topology:

`[KHEART3A,KHEART3B,KHEART3C]`
→
`[KHEART3C,KHEART1]`

Resulting 16-byte record:

`40 BC 01 00 10 BC 01 00 00 00 00 00 00 00 00 00`

The independently precomputed whole-EXE changes were:

- `0x00097CA8`: `28 -> 40`
- `0x00097CAC`: `34 -> 10`
- `0x00097CB0`: `40 -> 00`
- `0x00097CB1`: `BC -> 00`
- `0x00097CB2`: `01 -> 00`

Returned compiler evidence matched exactly:

- changed bytes: 5;
- expected changed bytes: 5;
- unexpected changes: 0;
- whole-EXE diff exactly expected: true;
- semantic reparse: `[KHEART3C,KHEART1]`;
- semantic reparse matches: true;
- following `heart_3` preserved: true;
- frame allocation unchanged: true;
- sequence pointers untouched: true;
- descriptor bytes untouched: true;
- GRA pixels untouched: true;
- palette untouched: true;
- relocation unused: true;
- exact reversal: true;
- reversed SHA-256: canonical exactly.

### Independent bundle inspection

The supplied runtime ZIP was independently opened and integrity-checked.

Contents:

- `MK1.EXE`
- `mk1_heart_rip_fixed_capacity_topology_edit.json`
- `READ_ME_FIRST.txt`

Results:

- ZIP CRC/integrity: passed;
- bundled `MK1.EXE` SHA-256:
  `4ad872b546bde33f8fad106aecf52f1d3bfadd7baf55869645edfdc421fd4986`;
- bundled EXE hash matches the standalone edit report: true;
- embedded edit JSON is semantically identical to the standalone exported JSON: true;
- actual bytes at all five reported offsets equal the requested edited values: true;
- reversing the five actual bundle bytes reconstructs SHA-256
  `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
  exactly;
- following `heart_3` bytes are identical before and after reversal.

### Classification

O12 proves the bounded authoring contract for `heart_2`:

- 1–3 unique qualified parts encoded as pointers followed by zero termination;
- 4 unique qualified parts encoded as four pointers with O10-qualified chain exhaustion;
- add/remove/replace/reorder inside the existing 16-byte allocation;
- deterministic whole-EXE diff accounting;
- semantic reparse;
- exact reversal;
- no relocation.

Final verdict:

`HEART2_FIXED_CAPACITY_1_TO_4_PART_TOPOLOGY_AUTHORING_VERIFIED`

No additional DOSBox run is required solely to close O12. The two termination mechanisms are already grounded by the original under-capacity animation behavior and the O11 full-capacity runtime fixture. A particular future authored composition can still be runtime-tested when visual behavior itself matters.

Generic topology authoring across arbitrary frame records remains unestablished.

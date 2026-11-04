# MK DOS Archive — Handoff — Pass 1E.3O.14 Full Heart-Rip Fixed-Layout Composition Authoring

Date: 2026-09-27

## Status

**IMPLEMENTED / DIRECT CANONICAL CORE VALIDATION PASSED / USER-DIRECTORY MODEL + INTERACTIVE FIXTURE PENDING**

Pass 1E.3O.14 broadens the VERIFIED O13 atomic topology+placement transaction from only `heart_2` across all seven unique qualified Kano heart-rip frame records, while preserving every existing record allocation.

No allocator, relocation writer, sequence rewrite or arbitrary-pointer path is introduced.

## Verified prerequisite carried forward

O13 final verdict:

`HEART2_ATOMIC_TOPOLOGY_AND_PLACEMENT_AUTHORING_VERIFIED`

The returned O13 user-directory fixture proved:

- canonical source provenance;
- exact no-edit semantic round trip;
- atomic `heart_2` topology + descriptor X/Y authoring;
- 7/7 expected executable byte changes for the actual user request;
- 0 unexpected changes;
- exact topology and placement reparse;
- explicit descriptor alias reporting;
- exact reversal to canonical SHA-256.

The authentic user request used `KHEART1 Y=-112`; that stronger signed-int16 case was retained rather than silently corrected.

## O14 fixed-layout authoring contract

Qualified unique frame records:

| Frame | Watcom | Physical | Allocation | O14 topology policy |
| --- | ---: | ---: | ---: | --- |
| `heart_0` | `0xB244` | `0x97C98` | 8 | exactly 1 qualified descriptor |
| `heart_1` | `0xB24C` | `0x97CA0` | 8 | exactly 1 qualified descriptor |
| `heart_2` | `0xB254` | `0x97CA8` | 16 | 1..4 unique qualified descriptors |
| `heart_3` | `0xB264` | `0x97CB8` | 8 | exactly 1 qualified descriptor |
| `heart_4` | `0xB26C` | `0x97CC0` | 8 | exactly 1 qualified descriptor |
| `heart_5` | `0xB274` | `0x97CC8` | 8 | exactly 1 qualified descriptor |
| `heart_6` | `0xB27C` | `0x97CD0` | 8 | exactly 1 qualified descriptor |

`heart_4` remains one shared frame record used by both:

- `PRIMARY:4`;
- `BEAT_LOOP:2`.

O14 does not split that alias.

### Encoding

For the six 8-byte records:

`[descriptor pointer, 0]`

Only the descriptor pointer may be replaced. The record remains 8 bytes and retains its zero terminator.

For `heart_2`:

- 1–3 parts: pointers followed by zero termination inside the existing 16 bytes;
- 4 parts: four pointers, terminated by O10-qualified linked-object chain exhaustion;
- duplicate pointers inside this one multi-part record remain blocked.

Descriptor reuse across **different frame records** is allowed and explicitly reported. This is consistent with the already runtime-grounded O11 case where `KHEART5B` was added to `heart_2` while remaining the descriptor used by `heart_5`.

## Placement contract

O14 retains descriptor-local signed-int16 X/Y authoring.

Placement may be changed only for a qualified descriptor that is used somewhere in the authored seven-record animation.

Because descriptor storage is shared, O14 recalculates authored usage after topology changes and reports:

- preview keys before the edit;
- preview keys after the edit;
- newly introduced preview aliases;
- whether the placement affects multiple authored occurrences;
- descriptor sharing across distinct frame records.

## Compiler write path

`executeHeartRipFullFixedLayoutCompositionEdit(...)`:

1. requires a successful O14 model;
2. requires all seven unique frame records in the semantic request;
3. requires every non-`heart_2` frame to contain exactly one qualified descriptor;
4. requires `heart_2` to contain 1..4 qualified descriptors;
5. rejects duplicate pointers within `heart_2`;
6. validates requested X/Y values as signed-int16;
7. rejects placement edits for descriptors not used by the authored animation;
8. rejects duplicate placement requests and complete semantic no-ops;
9. fresh-reads canonical `MK1.EXE` and verifies SHA-256;
10. clones the established `mk1_animation_ir_v1`;
11. applies all seven requested frame compositions semantically;
12. applies requested descriptor X/Y values semantically;
13. serializes all established O2 semantic regions;
14. replaces only the seven established frame regions with deterministic fixed-allocation encodings;
15. independently derives every expected frame-byte change;
16. independently derives every expected X/Y-byte change;
17. unions and sorts the expected byte set;
18. diffs the entire executable and requires exact equality with the expected set;
19. reparses all seven frame allocations;
20. reparses all requested descriptor coordinates;
21. requires exact semantic equality with the request;
22. reverses every actual changed byte;
23. requires exact canonical SHA-256 recovery.

## New source

Core:

`src/games/mk1/research/heartRipFullFixedLayoutCompositionEditor.ts`

UI:

`src/components/HeartRipFullFixedLayoutCompositionEditor.tsx`

Direct smoke script:

`scripts/run-heart-rip-full-fixed-layout-composition.mjs`

Quick-run integration:

- `Run What's Needed` is now 23 stages;
- stage 23 exports `mk1_heart_rip_full_fixed_layout_composition_editor_model_....json`;
- the O14 editor panel then exports authored edit reports separately.

## UI behavior

The O14 panel exposes all seven unique records.

- six single-part records use one descriptor selector each;
- `heart_2` exposes ordered add/remove/replace/reorder controls, 1..4 parts;
- a separate placement section lists every descriptor currently used by the authored animation;
- X/Y controls are descriptor-local and show all authored preview occurrences affected by that shared storage;
- the panel reports changed frame-record count, placement-edit count, total executable changes, semantic reparses, reversal and aliasing;
- a test bundle may be downloaded only after a successful compile.

## Source-level validation

Targeted TypeScript validation:

- O14 core: **passed**;
- O14 React UI: **passed**;
- modified `ResearchQuickActions.tsx`: **passed**.

Other static checks:

- `node --check scripts/run-heart-rip-full-fixed-layout-composition.mjs`: **passed**;
- `package.json`: parses;
- `metadata.json`: parses.

The source snapshot does not contain `node_modules`, so the npm/esbuild smoke entry could not be executed directly from the packaged source environment. This is not promoted as a passed npm smoke.

## Direct canonical core validation

For independent core validation, the new O14 TypeScript dependency graph was emitted with TypeScript to a temporary CommonJS tree and executed against:

- canonical `MK1.EXE`, SHA-256
  `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`;
- the authentic exported canonical O8 model;
- the authentic returned canonical O13 model.

### O14 model

Result:

- status: `SUCCESS`;
- verdict: `FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_ESTABLISHED`;
- validation: **9/9 checks passed**;
- seven unique frame records found;
- six 8-byte records and one 16-byte record confirmed;
- `heart_2` is the only 1..4-part record;
- `heart_4` shared occurrence identity preserved;
- nine qualified descriptors present;
- no-edit mismatch count: **0**;
- no-edit rebuilt SHA-256: canonical exactly;
- relocation remains disabled.

### Direct representative transaction

Request:

- `heart_0`: `KHEART1 -> KHEART2`;
- `heart_1`: remains `KHEART2`;
- `heart_2`: `[KHEART3A,KHEART3B,KHEART3C] -> [KHEART3C,KHEART1]`;
- all other frame records remain baseline;
- `KHEART2`: `(3,-10) -> (8,-9)`.

This intentionally creates authored descriptor sharing across two distinct frame records:

- `KHEART2` in `heart_0` / `PRIMARY:0`;
- `KHEART2` in `heart_1` / `PRIMARY:1`.

Returned evidence:

- changed frame records: `heart_0`, `heart_2`;
- expected changed bytes: **8**;
- actual changed bytes: **8**;
- unexpected changes: **0**;
- whole-EXE diff exactly expected: **true**;
- all seven frame records reparsed correctly: **true**;
- requested placement reparsed correctly: **true**;
- alias after-edit frame keys for `KHEART2`: `heart_0`, `heart_1`;
- alias after-edit preview keys: `PRIMARY:0`, `PRIMARY:1`;
- exact reversal: **true**;
- edited SHA-256:
  `571b369e8ec8ec90de58b7bfb1c7630e5bc8ef11766d6c9afb3af14cf8c4efef`.

Actual direct-smoke changed bytes:

- `0x00097C98`: `10 -> 1C` — `heart_0` descriptor low byte;
- `0x00097CA8`: `28 -> 40`;
- `0x00097CAC`: `34 -> 10`;
- `0x00097CB0`: `40 -> 00`;
- `0x00097CB1`: `BC -> 00`;
- `0x00097CB2`: `01 -> 00`;
- `0x000A8674`: `03 -> 08` — `KHEART2.x`;
- `0x000A8676`: `F6 -> F7` — `KHEART2.y` low byte.

The generated direct test ZIP also passed CRC/integrity checking and its bundled `MK1.EXE` hash matched the direct edit report.

### Fail-closed representative checks

The direct request validator correctly rejected **5/5** representative invalid requests:

- only six frame records supplied;
- a two-part request for an 8-byte single-part record;
- duplicate descriptor pointers inside `heart_2`;
- out-of-range signed-int16 placement;
- complete semantic no-op.

## Current epistemic boundary

O14 establishes a bounded **full-animation fixed-layout compiler/editor**, not general record growth.

Still unestablished:

- enlarging any 8-byte frame record;
- relocating a frame record;
- qualifying allocatable/free binary storage;
- rewriting inbound sequence pointers for relocated records;
- changing the four-object setup capacity;
- arbitrary descriptor pointers;
- duplicate-pointer behavior within one multi-part frame;
- pixel/uGRA encoding;
- palette authoring through this editor;
- gameplay/collision/hit semantics.

O9's storage census remains valid reconnaissance for a future pass that truly requires growth, but no zero run is promoted to safe storage.

## User-directory integration gate

Run the O14 source against the untouched canonical MK1 installation through the normal app:

1. `Run What's Needed` through **23/23**.
2. Export Latest.
3. Return:
   `mk1_heart_rip_full_fixed_layout_composition_editor_model_....json`

Do not promote the complete O14 app/UI path to VERIFIED until that returned canonical model is independently checked.

After the model passes, perform one controlled interactive O14 transaction that includes at least:

- one replacement in an 8-byte single-part frame;
- one `heart_2` topology change;
- one descriptor X/Y edit whose authored alias set can be predicted independently.

The exact fixture should be selected only after validating the returned O14 model, so the expected whole-EXE diff can be precomputed from that model before the user compiles it.

## Current verdict

`FULL_HEART_RIP_FIXED_LAYOUT_COMPOSITION_AUTHORING_IMPLEMENTED_VALIDATION_PENDING`

---

## Packaging correction — 2026-09-28

The first distributed O14 source ZIP retained one stale presentation-only constant in `src/appMetadata.ts`:

`Milestone 1 — Pass 1E.3O.13 — Atomic Heart-Rip Composition Authoring`

This caused the global application banner (and diagnostics fields that reuse `APP_MILESTONE`) to identify the build as O13 even though the O14 implementation, 23/23 quick-run stage, O14 panel, O14 model exporter and O14 edit exporter were present and active.

The returned user model confirms the actual executed pass was O14: its format is `mk1_heart_rip_full_fixed_layout_composition_editor_model_v1`, and it establishes all seven frame records with the O14 full fixed-layout authoring contract.

The corrected package changes the milestone constant to:

`Milestone 1 — Pass 1E.3O.14 — Full Heart-Rip Fixed-Layout Composition Authoring`

No compiler, parser, writer, frame-layout or export-format logic was changed by this packaging correction.

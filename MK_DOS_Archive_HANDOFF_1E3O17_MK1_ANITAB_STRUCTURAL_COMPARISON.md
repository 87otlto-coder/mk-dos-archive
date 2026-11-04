# MK DOS Archive — Handoff — Pass 1E.3O.17 MK1 ANITAB Structural Comparison

Date: 2026-09-29

## Status

**IMPLEMENTED / DIRECT CANONICAL STRUCTURAL VALIDATION PASSED / NORMAL-APP USER-DIRECTORY EXPORT PENDING**

O17 is a read-only, export-first pass. It broadens the O16 Kano animation-table census across every canonical Watcom Segment-2 DATA symbol whose name ends in `_ANITAB`. It does not write `MK1.EXE`, does not assign gameplay semantics to unknown auxiliary values, does not claim each table is a complete animation universe, and does not generalize the result to MK2/MK3.

Direct canonical verdict:

`MK1_ANITAB_STRUCTURAL_EXPORT_MECHANISM_REPEATED_ACROSS_DISCOVERED_TABLES`

## Why this pass exists

O16 established a strong structural export map for `KANO_ANITAB`, but one Kano table is still localized evidence. O17 asks whether the same already-qualified animation command grammar and frame-target representation repeat independently across the other linked MK1 fighter/boss animation tables.

The product direction is now export-first. The purpose is therefore to establish a trustworthy structural path from animation-table roots to streams, frame targets, sprite descriptors and resource files, while preserving unknown values rather than forcing them into a guessed grammar.

## Canonical fixture

- `MK1.EXE`: 1,157,222 bytes (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`
- code file-image base: `0x00050A54`
- independently rederived static-data base: `0x0008CA54`
- handle table: verified 58 entries

Direct developer execution used the byte-identical canonical executable plus authentic MK1 inventory metadata for resource names/sizes. It did not require resource-file payload bytes and therefore does not claim image decoding/export in this pass.

## Blind table-family discovery

Selection rule:

`valid Watcom Segment-2 DATA symbols whose names end in _ANITAB`

Eight tables are discovered:

| Symbol | Module | Cells |
|---|---|---:|
| `EMP_ANITAB` | `EMP.ASM` | 41 |
| `GORO_ANITAB` | `GORO.ASM` | 78 |
| `KANG_ANITAB` | `KANG.ASM` | 103 |
| `KANO_ANITAB` | `KANO.ASM` | 101 |
| `LIZ_ANITAB` | `LIZ.ASM` | 105 |
| `NINJA_ANITAB` | `NINJA.ASM` | 106 |
| `VANDAN_ANITAB` | `VANDAN.ASM` | 101 |
| `RAIDEN_ANITAB` | `RAIDEN.ASM` | 104 |

The table spans are bounded by the next same-module Watcom DATA symbol and all are dword-aligned. Their lengths are **not uniform**: 41..106 cells. No common fixed table length is assumed.

## Command grammar repetition

O17 independently rechecks the canonical `DO_NEXT_A9_FRAME` dispatcher and the already-qualified command shapes 1..6 plus ordinary `>6` frame targets and zero termination.

Across grammar-compatible stream cells, every reached frame event resolves structurally to either:

- a qualified `WITH_XY` descriptor; or
- a zero-terminated vector of qualified descriptor pointers.

No mixed direct/vector stream was observed in this direct fixture.

## Cross-table result

Across all eight symbol-bounded table spans:

- table cells inspected: **739**
- grammar-compatible stream cells: **564**
- unique stream starts: **514**
- unique frame targets: **1,144**
- unique sprite descriptors: **1,102**
- tables with multi-part descriptor-vector frames: **5/8**
- tables with cross-resource streams: **6/8**
- shared stream starts across different ANITAB tables: **0**
- shared frame targets across different ANITAB tables: **0**
- shared descriptors across different ANITAB tables: **0**

The resource paths implicated by the structural graph are:

- `GRAPHICS/EMP.GRA`
- `GRAPHICS/FONTS.GRA`
- `GRAPHICS/GGORO.GRA`
- `GRAPHICS/KANG.GRA`
- `GRAPHICS/KANO.GRA`
- `GRAPHICS/LIZ.GRA`
- `GRAPHICS/MISC.GRA`
- `GRAPHICS/NINJA.GRA`
- `GRAPHICS/RAIDEN.GRA`
- `GRAPHICS/STANCE.GRA`
- `GRAPHICS/VANDAN.GRA`
- `GRAPHICS/VICTORY.GRA`

## Multi-part repetition

O17 finds structural multi-part descriptor vectors in five independent tables:

- `GORO_ANITAB`: 12 two-part frame targets;
- `KANG_ANITAB`: 1 two-part target, combining `KANG.GRA` + `VICTORY.GRA`;
- `KANO_ANITAB`: 3 two-part targets plus the known three-part heart record;
- `LIZ_ANITAB`: 6 two-part targets;
- `VANDAN_ANITAB`: 2 two-part targets, combining `VANDAN.GRA` + `VICTORY.GRA`.

This materially broadens the evidence that zero-terminated descriptor vectors are not a Kano-heart-only phenomenon. The new candidates remain **CORROBORATED structural evidence**, not individually runtime-qualified animations.

## Important auxiliary values preserved as unknown

A first fail-closed run exposed values that should not be forced into the stream/descriptor grammar. O17 therefore records them explicitly instead of treating them as errors or guessing semantics.

### EMP_ANITAB

Six cells form small signed-int16 pairs:

- `(1,1)`
- `(0,1)`
- `(-1,1)`
- `(-1,-1)`
- `(0,-1)`
- `(1,-1)`

They are classified only as:

`PACKED_I16_PAIR_UNKNOWN`

No direction/coordinate/gameplay meaning is assigned.

### KANG_ANITAB

Three cells contain file-backed data-pointer-like values that are neither qualified animation streams nor sprite descriptors:

- index 0 → `0x130A4`
- index 93 → `0x130CC`, exact symbol `MSU_KANG`
- index 102 → `0x130A4`

They are classified only as:

`DATA_POINTER_LIKE_AUXILIARY_UNKNOWN`

This is an important warning that a symbol-bounded `_ANITAB` span can include or reference auxiliary structures whose semantics are not the normal stream grammar.

After adding those explicit unknown structural classes, all 739 cells are accounted for with zero generic unresolved cells. This does **not** mean all 739 cells are semantically understood.

## Per-table structural summary

| Table | Streams | Unique frames | Unique descriptors | Multipart | Auxiliary unknown |
|---|---:|---:|---:|---:|---:|
| EMP | 28 | 50 | 49 | 0 | 6 packed i16 pairs |
| GORO | 28 | 74 | 68 | 12 | 0 |
| KANG | 78 | 149 | 149 | 1 | 3 data-pointer-like |
| KANO | 84 | 168 | 163 | 4 | 0 |
| LIZ | 83 | 173 | 166 | 6 | 0 |
| NINJA | 95 | 209 | 200 | 0 | 0 |
| VANDAN | 81 | 157 | 150 | 2 | 0 |
| RAIDEN | 87 | 164 | 157 | 0 | 0 |

## What O17 establishes

**VERIFIED from canonical bytes / direct structural execution:**

- eight `_ANITAB` symbols exist under the blind suffix-selection rule;
- their symbol-bounded spans are independently measured and not uniform;
- the canonical DO_NEXT_A9_FRAME grammar is reproduced;
- wherever a table entry is grammar-compatible, all reached frame targets resolve through the same direct-descriptor / zero-terminated-descriptor-vector structural model;
- the mechanism repeats across all eight discovered tables;
- multi-part descriptor-vector composition repeats independently across multiple modules;
- auxiliary values exist and must remain first-class unknown data.

**Not established:**

- every table cell's gameplay/runtime purpose;
- that the next-symbol boundary is the semantic end of a pure pointer array in every module;
- that `_ANITAB` alone contains every animation/substream for any character;
- names/meanings for unknown scalar, packed-pair or auxiliary-pointer cells;
- image decode/export from the newly enumerated descriptors in this pass;
- palette ownership for every exported animation/effect;
- MK2/MK3 animation grammar.

O14/O16's known off-table Kano `BEAT_LOOP` remains explicit counterevidence to any complete-universe claim.

## Validation

Direct canonical checks pass:

1. canonical provenance;
2. static-data base rederived;
3. command grammar reproduced;
4. multiple `_ANITAB` symbols discovered;
5. all symbol spans dword-aligned;
6. all cells structurally accounted for with explicit unknown classes;
7. all grammar-compatible frame targets resolved;
8. table lengths not assumed uniform;
9. repeated structural mechanism established;
10. scope boundary preserved.

Direct report:

`mk1_fighter_animation_table_comparison_direct.json`

SHA-256:

`3d165ae968e2c099c5485569c745e77fb0faad795afb09f0a9b6daf57ce4dda3`

## Source changes

Added:

- `src/games/mk1/research/fighterAnimationTableComparison.ts`
- `scripts/run-fighter-animation-table-comparison.mjs`
- this handoff

Updated:

- `src/components/ResearchQuickActions.tsx` to 26/26;
- `src/appMetadata.ts`;
- `metadata.json`;
- `package.json`;
- `README.md`;
- `docs/CURRENT.md`;
- `docs/RESEARCH.md`.

## Current epistemic state

Core structural conclusion:

**STATICALLY VERIFIED / CANONICAL BYTES**

Normal-app user-directory stage/export:

**IMPLEMENTED / PENDING USER-DIRECTORY EXERCISE**

No runtime test is required merely to establish the repeated byte-level structure. Runtime tests should be reserved for semantic questions that static evidence cannot answer.

## Recommended continuation

The next product-critical boundary is no longer EXE structure. O17 now provides a broad MK1 animation-to-frame-to-descriptor-to-resource graph. To turn that graph into useful exported assets, the project needs the original resource-file payload bytes, especially the GRA files.

The user has stated that a complete original MK1 installation ZIP is available. The next recommended step is therefore to ingest that complete installation rather than requesting individual GRA files, then:

1. validate it against the existing inventory/canonical executable;
2. run O16/O17 against the real directory source as an integration check;
3. resolve the O17 descriptor graph against actual GRA bytes;
4. decode a representative cross-section of one-part and multi-part frames;
5. attach already-qualified palettes where ownership is established;
6. produce the first real export-oriented animation/frame reconstruction package;
7. keep unknown palette/animation semantics explicit rather than guessing.

Do not return to relocation unless an extraction requirement genuinely depends on it.

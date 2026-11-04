# MK DOS Archive — O95B MK2 Identity-Indexed Animation-Root Structural Graph

**Date:** 2026-10-07 SAST  
**Status:** VERIFIED STRUCTURAL FOUNDATION / COMMAND SEMANTICS STILL OPEN

O95B begins the MK2 animation-reconstruction blocker identified by O95A. It does not parse animation commands. It establishes the exact executable lookup mechanism and the relocation-backed root geometry that future command work must explain.

## Authenticated lookup consumers

Two adjacent MK2.EXE routines are now qualified:

### Lookup family A — physical `0x918F1`

Machine behavior:

1. read object identity from `[EDI+0x46]`;
2. use it to index the 17-slot Object-2 table at `0x1D544`;
3. read the current nested index from global `0x75A78`;
4. dereference `selectedRoot[index]`;
5. replace global `0x75A78` with the selected pointer;
6. return.

### Lookup family B — physical `0x91909`

Same mechanism, except the 17-slot Object-2 table is `0x1D588`.

The two routines are authenticated by exact code signatures and canonical `MK2.EXE` SHA-256.

This establishes **two identity-indexed nested pointer families**. It does not establish human move names or the semantics of the pointed-to records.

## Top-level relocation geometry

Both 17-slot identity tables are entirely relocation-backed Object-2 pointers.

### Family A roots

17 slots collapse to **11 unique roots**:

- slot 0 -> `0x3B8C`
- slot 1 -> `0x506C`
- slot 2 -> `0xBB64`
- slot 3 -> `0xE514`
- slots 4, 5, 16 -> shared `0x208C`
- slot 6 -> `0x11744`
- slot 7 -> `0xD080`
- slots 8, 9, 10, 14, 15 -> shared `0x9B4C`
- slot 11 -> `0xF970`
- slot 12 -> `0x12E74`
- slot 13 -> `0x10FD0`

Contiguous relocation-backed entry counts at unique roots:

- `0x208C`: 64
- `0x3B8C`: 80
- `0x506C`: 71
- `0x9B4C`: 64
- `0xBB64`: 64
- `0xD080`: 64
- `0xE514`: 64
- `0xF970`: 64
- `0x10FD0`: 33
- `0x11744`: 64
- `0x12E74`: 38

Total across unique roots: **670 relocation-backed entries**.

### Family B roots

17 slots collapse to **15 unique roots**:

- slot 0 -> `0x3C94`
- slot 1 -> `0x5174`
- slot 2 -> `0xBC6C`
- slot 3 -> `0xE61C`
- slot 4 -> `0x2194`
- slot 5 -> `0x21B8`
- slot 6 -> `0x1184C`
- slot 7 -> `0xD188`
- slot 8 -> `0x9C54`
- slot 9 -> `0x9C68`
- slots 10, 14, 15 -> shared `0x9C88`
- slot 11 -> `0xFA78`
- slot 12 -> `0x12ED4`
- slot 13 -> `0x11038`
- slot 16 -> `0x208C`

Contiguous relocation-backed entry counts at unique roots range from **5 to 64**, totaling **255 entries**.

Important conclusion: there is **no universal per-identity table length**. Shared identity families alias roots differently in A and B. A future parser must respect each root's actual bounded relocation geometry rather than assume a fixed count.

## Direct caller census

Rel32 call census in canonical MK2.EXE:

- family A lookup: **144 direct calls**
- family B lookup: **109 direct calls**

Strict adjacent-immediate index stores immediately before the call establish:

- family A: **125** calls with an adjacent immediate index, **38 distinct values**; observed values include 0..65 sparsely;
- family B: **103** calls with an adjacent immediate index, **10 distinct values**: `0,1,2,3,4,5,6,7,8,13`.

The remaining calls are dynamic or receive the index through a non-adjacent path. O95B does not infer their values.

These callsite values are **structural nested indices**, not human animation IDs/names.

## Bounded descriptor reachability

Using O69's authenticated descriptor corpus as a prerequisite, O95B checks a deliberately narrow one-hop relationship:

`root entry -> intermediate Object-2 record whose first relocation -> known GRA descriptor`

Across unique roots:

- family A: **41** such entries;
- family B: **76** such entries.

Examples include authentic descriptor targets in `JC0.GRA`, `BA0.GRA`, `RD0.GRA`, `JX0.GRA`, `ST0.GRA`, `GO.GRA`, `SK.GRA`, `HH0.GRA` and others. Internal resource filenames are reported as provenance only; O95B does not promote move/pose identities from them.

Many root entries do **not** satisfy this one-hop shape and therefore remain intermediate/unknown structures. They are not rejected.

## Validation

Project implementation:

- `src/games/mk2/research/animationRootStructuralGraph.ts`
- `scripts/run-mk2-animation-root-structural-graph.mjs`
- output: `mk2_animation_root_structural_graph_o95b_2026-10-07.json`

Fresh TypeScript runner: **PASS**.

Independent Python verifier:

- `scripts/verify-mk2-o95b-animation-root-graph.py`
- canonical fixture result: **54,200 checks / 0 failures**
- independently reparses the LE fixup surface;
- independently authenticates both lookup code signatures;
- independently reproduces all 34 top-level identity-table fixups;
- independently reproduces unique roots and contiguous root lengths;
- independently scans rel32 callers and strict adjacent-immediate index stores.

The independent verifier does not re-implement O69 graphics decoding; O95B's one-hop descriptor labels use the already independently verified O69 descriptor corpus as a prerequisite.

## What O95B does NOT establish

Still open:

- which of family A/B corresponds to any human/gameplay category;
- animation command grammar;
- record sizes beyond the proven contiguous pointer-root geometry;
- frame ordering;
- multipart composition semantics;
- loop/branch/termination grammar;
- timing/dwell meaning;
- dynamic/non-immediate index semantics;
- human character or move names;
- complete animation coverage.

## Decision

`MK2_O95B_TWO_IDENTITY_INDEXED_NESTED_POINTER_FAMILIES_ESTABLISHED_COMMAND_SEMANTICS_OPEN`

MK2 animation closure remains **OPEN**, but the top-level identity/root mechanism is now machine-grounded.

## Next pass

**O95C — selected-pointer consumer / record-grammar anchor.**

Trace the consumers of global `0x75A78` immediately after family A/B lookup calls and identify the smallest common executable routine(s) that interpret the selected pointer. The pass should establish record access widths/offsets and control-flow boundaries before assigning meanings to byte/word values.

Stop before full animation export if the consumer grammar is not yet closed. Do not infer command meanings from repeated numbers or visual output alone.

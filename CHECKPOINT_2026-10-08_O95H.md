# MK DOS Archive — O95H selected-pointer consumer-family census

Date: 2026-10-08 (SAST)

## Status

**VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN**

O95H classifies every authenticated direct call to the two O95B Family-A/B selected-pointer lookup routines by the first qualified downstream consumer or bounded structural handoff established from canonical instruction-boundary analysis. It exists to prevent a future extractor from choosing a parser based only on which root table produced the pointer.

Machine verdict:

`MK2_O95H_253_LOOKUP_CALLS_PARTITIONED_ACROSS_MULTIPLE_SELECTED_POINTER_CONSUMER_FAMILIES`

## 1. Canonical fixture and lookup surface

- `MK2.EXE` SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`
- Family A lookup physical `0x918F1`: **144** direct calls
- Family B lookup physical `0x91909`: **109** direct calls
- total authenticated lookup callsites: **253**
- selected pointer returns in EAX and is mirrored through global `0x75A78`

O95H does **not** claim complete downstream semantics for every callsite. Unresolved and state-handoff categories remain explicit.

## 2. Consumer-family census

| Consumer / handoff family | Family A | Family B | Total | Status |
|---|---:|---:|---:|---|
| Standard O95C composition interpreter path | 81 | 57 | **138** | qualified consumer |
| Reverse DWORD sequence consumer | 1 | 0 | **1** | qualified consumer |
| O95G specialized direct-descriptor consumer | 0 | 2 | **2** | qualified consumer |
| Zero-terminated DWORD walker | 1 | 22 | **23** | qualified consumer |
| Related-object / secondary-state handoff | 9 | 13 | **22** | structural handoff |
| Local cursor/data use | 14 | 3 | **17** | structural handoff |
| Scheduler/reselection path | 13 | 2 | **15** | structural handoff |
| Cursor stack/state path | 0 | 3 | **3** | structural handoff |
| Cursor transform, final consumer unresolved | 1 | 0 | **1** | unresolved |
| Other unresolved bounded continuation | 24 | 7 | **31** | unresolved |
| **Total** | **144** | **109** | **253** | |

Qualified final-consumer routes total **164/253**. The remaining **89/253** are structural handoffs or unresolved at the O95H boundary.

## 3. Architecture result

The dominant route is the standard O95C composition interpreter, but it covers only **138/253** lookup calls. Therefore:

> **Family A/B table origin is not a parser discriminator. The eventual extractor must dispatch selected pointers by authenticated downstream consumer/path context.**

O95G had already rejected a universal Family-B stream grammar. O95H generalizes that correction across the complete direct lookup-call surface.

## 4. Nonstandard consumers now explicitly established

### 4.1 Reverse DWORD sequence consumer

One Family-A route, lookup call physical `0x922DC`, reaches consumer physical `0x8684E` through the jump at `0x922F7`.

The authenticated `0x8684E..0x868AD` slice:

- scans forward through DWORDs to a zero terminator;
- backs up and walks DWORDs in reverse order;
- performs scheduler calls while walking;
- does **not** call the O95C shared interpreter within this bounded slice.

No frame semantics, move name or timing meaning is assigned yet.

### 4.2 Specialized direct-descriptor consumer has two lookup routes

O95G proved the fixed slot-0 / Family-B index-2 route at lookup call `0x7B05F`.

O95H finds a second Family-B lookup call at `0x68C9F` that also reaches specialized loop `0x86C99` via jump `0x68CE0`. Its numeric identity is not yet qualified. This proves the specialized direct-descriptor consumer is not a one-off tied only to the O95G fixed witness.

### 4.3 Zero-terminated DWORD walker

Consumer `0x6334A` is reached by **23** lookup routes. Its bounded shape loads the shared cursor, dereferences one DWORD, advances cursor global `0x75A78` by four bytes, and repeats until the zero condition terminates the walk.

No rendering, animation, metadata or gameplay meaning is assigned to those values yet.

## 5. Authenticated code slices

O95H independently pins the relevant consumer/wrapper slices by SHA-256, including:

- O95C interpreter `0x63E79`, length `0x105`: `6f0826bdac12e9f51ac2fc3af55bc915dea9fccfeedfd784ead73a41bea300cf`
- standard wrapper `0x86825`, length `0x29`: `2a1fefaa3d57d7d85efe17078e3fdc9225c91ce2ac1650f0c08492becfe66eba`
- reverse consumer `0x8684E`, length `0x60`: `2b342abff03f67a3237dee644222d6928ec81a39d7e5fbdb72eada177902610c`
- DWORD walker `0x6334A`, length `0x16`: `ad0121136ffc0948d045970c95153542cc9d00f0a44d59fe00153a1a8732ac66`
- specialized loop `0x86C99`, length `0x2C`: `c99a2f1147f3731fa6cdcf6da328dd4c9d66eee4e12bc4d8ca83ef418fa363e6`
- specialized consumer `0x86CC5`, length `0x8F`: `5bb74d8fd65bbed5ce44290954fd6734a77b22d256fa005a34c9b04e2da616ab`

The machine-readable report contains the complete callsite partition and all authenticated slice identities.

## 6. New implementation/evidence

Added:

- `src/games/mk2/research/animationSelectedPointerConsumerFamilyCensus.ts`
- `scripts/run-mk2-animation-selected-pointer-consumer-family-census.mjs`
- `scripts/verify-mk2-o95h-animation-selected-pointer-consumer-family-census.py`
- `mk2_animation_selected_pointer_consumer_family_census_o95h_2026-10-08.json`
- package smoke command `smoke:mk2-animation-consumer-family-census`

## 7. Validation

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent Python verifier: **323 checks / 0 failures**. It uses `objdump` instruction-boundary disassembly to independently reproduce the complete 253-call partition rather than importing the TypeScript classification arrays.

Regression gates remain clean:

- O95B: **54,200 / 0 failures**
- O95C: **54,199 / 0 failures**
- O95D: **54,335 / 0 failures**
- O95E: **54,186 / 0 failures**
- O95F: **54,213 / 0 failures**
- O95G: **54,215 / 0 failures**

## 8. Boundary / closure status

O95H does **not** establish:

- semantics of the reverse DWORD sequence;
- semantics of the 23 DWORD-walker routes;
- final consumers for the 89 structural-handoff/unresolved routes;
- complete specialized direct-descriptor grammar;
- timing/dwell semantics;
- human fighter/move names;
- complete per-identity animation coverage.

All O95A non-animation blockers also remain open: stages/backgrounds/dynamics, eight unqualified palette slots, final relevance classification of non-exact-full GRA resources, non-MID music independent verification, and remaining unknown/support classification.

**MK2 closure remains OPEN.**

## 9. Next small pass

**O95I — nonstandard selected-pointer consumer grammar expansion.**

Start with the now-bounded nonstandard consumer families rather than adding arbitrary witnesses:

1. trace the single reverse-DWORD route through its data and scheduler interactions;
2. trace the second specialized direct-descriptor route and recover identity/index provenance if the executable supports it;
3. classify the 23 zero-terminated DWORD-walker routes far enough to decide whether they are animation/render streams, state tables, or another resource class;
4. preserve every unresolved path if consumer semantics do not close.

Do not infer timing, names or universal grammar from table origin or visual plausibility.

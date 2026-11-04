# MK DOS Archive — O95J segment-navigation downstream continuation census

Date: 2026-10-08 (SAST)

## Status

**VERIFIED / MK2 ANIMATION RESEARCH STILL OPEN**

O95J follows the 23 O95I segment-navigation routes after their exact 1/2/3 calls to helper `0x6334A` and classifies what happens to the selected post-skip cursor next. It does not infer identity, human move names, gameplay meaning, or wall-clock timing from segment count.

Machine verdict:

`MK2_O95J_23_SEGMENT_NAVIGATION_ROUTES_RESOLVED_20_STANDARD_COMPOSITION_3_CURSOR_REPLACED_UNRESOLVED`

## 1. Result

Across all **23** O95I navigation routes:

- **20** preserve the selected stream strongly enough to reach the already-qualified standard composition interpreter family;
- **3** do not reach a qualified terminal consumer before `0x75A78` is explicitly replaced and therefore remain **UNRESOLVED**.

This repairs the O95H/O95I terminal-consumer accounting:

- terminal-qualified at the corrected O95H boundary: **141 / 253**;
- newly terminal-qualified by O95J: **20**;
- terminal-qualified after O95J: **161 / 253**;
- remaining structural handoff or unresolved routes: **92 / 253**.

The 23 navigation routes still retain the O95I skip distribution:

- 13 routes skip 1 zero-terminated segment;
- 7 routes skip 2;
- 3 routes skip 3.

## 2. Standard-composition continuation subtypes

O95J preserves the continuation shape instead of flattening all 20 routes into one category.

### 2.1 Direct standard composition — 15 routes

After the final `0x6334A` call, these routes enter the standard interpreter `0x63E79` directly or tail-enter standard wrapper `0x86825` without an O95J-classified cursor replacement:

`0x67778, 0x679BC, 0x68008, 0x68282, 0x682A2, 0x68369, 0x68754, 0x691F9, 0x7C6BC, 0x9538A, 0x9548E, 0x95C1D, 0x97518, 0x979DE, 0x97AD8`.

No identity, frame-name, move-name, or timing semantics are added.

### 2.2 Standard composition after bounded non-cursor helper — 1 route

Family-B lookup `0x693B3` skips three segments, calls helper `0x93B1C`, then enters standard wrapper `0x86825` at `0x693DB`.

The authenticated helper slice is only:

- zero EDX;
- write EDX to object `+0x10`;
- write EDX to object `+0x14`;
- return.

It does not access `0x75A78` in this bounded slice. O95J does not assign a higher-level purpose to those object fields.

### 2.3 Standard composition after same-cursor transform — 1 route

Family-A lookup `0x7FDEF` skips two segments, then calls helper `0x7E62E` before entering interpreter `0x63E79` at `0x7FE03`.

Helper `0x7E62E`:

1. reads through the shared cursor;
2. advances by four bytes while successive DWORD values remain nonzero;
3. after the terminating zero, backs the same cursor up by eight bytes;
4. returns.

O95J therefore records this as an authenticated **cursor transform before standard interpretation**. It does **not** assign semantic meaning to the resulting position.

### 2.4 Standard composition after scheduler save/restore — 1 route

Family-B lookup `0x96284` skips one segment, calls scheduler `0x6710F` at `0x96293`, then calls interpreter `0x63E79` at `0x96298`.

The scheduler's authenticated slice saves `0x75A78` into the process record at `+0x14` and restores that field into `0x75A78` when the process resumes. This is sufficient to retain the selected cursor relationship across this bounded scheduler yield.

No wall-clock duration is assigned to scheduler argument `2`.

### 2.5 Dual standard composition via secondary cursor — 2 routes

Routes `0x67BE2` and `0x95FAC` preserve the post-skip selected cursor by copying it from `0x75A78` to secondary cursor global `0x75A80`, restore the previous primary cursor, then tail-enter dual wrapper `0x868AE`.

Inside `0x868AE`, the first standard interpreter pass uses the primary cursor; the wrapper then copies `0x75A80` back to `0x75A78` and performs a second standard interpreter call at `0x868E7`. The selected post-skip stream is therefore structurally consumed as the dual wrapper's **secondary** stream.

The gameplay relationship between those two streams remains **UNKNOWN**.

## 3. Three unresolved navigation routes

The following routes do not reach an O95J-qualified terminal consumer before an explicit replacement of `0x75A78`:

- `0x67CAC` — replacement at `0x67D56` with value `2`;
- `0x95B69` — replacement at `0x95C13` with value `1`;
- `0x961ED` — replacement immediately at `0x961F7` with value `0x3D`.

O95J does **not** claim that the selected cursor is semantically discarded. Intervening helper/state calls are not assigned undocumented cursor semantics. These three routes remain unresolved.

## 4. New implementation/evidence

Added:

- `src/games/mk2/research/animationSegmentNavigationDownstreamCensus.ts`
- `scripts/run-mk2-animation-segment-navigation-downstream-census.mjs`
- `scripts/verify-mk2-o95j-animation-segment-navigation-downstream-census.py`
- `mk2_animation_segment_navigation_downstream_census_o95j_2026-10-08.json`
- package smoke command `smoke:mk2-animation-segment-navigation-downstream`

## 5. Validation

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent O95J verifier: **58 checks / 0 failures**. The verifier independently reconstructs all 23 lookup→skipper routes, their 13/7/3 skip distribution, machine-authenticates the standard/dual/scheduler/transform/helper slices, verifies all 20 qualified continuation paths, and instruction-boundary checks the three unresolved paths up to their explicit cursor replacement.

Regression gates remain clean:

- O95B: **54,200 / 0 failures**;
- O95C: **54,199 / 0 failures**;
- O95D: **54,335 / PASS**;
- O95E: **54,186 / 0 failures**;
- O95F: **54,213 / 0 failures**;
- O95G: **54,215 / 0 failures**;
- O95H: **323 / 0 failures**;
- O95I: **54,272 / 0 failures**.

## 6. Boundary / closure status

O95J does **not** establish:

- numeric identities for these 23 navigation routes;
- semantic meaning of skip count;
- semantic meaning of helper `0x7E62E`'s transformed cursor position;
- gameplay meaning of the dual-wrapper stream pair;
- a terminal consumer for the three cursor-replaced routes;
- wall-clock timing or move/action names;
- complete MK2 animation coverage.

All O95A non-animation closure blockers remain open: stages/backgrounds/dynamics, eight unqualified palette slots, final relevance classification of non-exact-full GRA resources, non-MID music independent verification, and remaining unknown/support classification.

**MK2 closure remains OPEN.**

## 7. Next small pass

**O95K — remaining structural-handoff continuation triage.**

With 161/253 lookup routes now terminal-qualified, prioritize the remaining **92** routes by machine behavior:

1. follow the 22 related-object/state handoffs and determine whether their selected pointer is later consumed by an already-qualified interpreter or by another distinct grammar;
2. separately triage the 17 local-cursor/data and 3 cursor-stack/state routes;
3. preserve scheduler/reselection, transform and other unresolved routes unless the exact selected pointer remains traceable;
4. do not inflate coverage by cross-producting identities or assigning move/timing semantics.

The goal is to reduce the remaining structural-handoff surface before attempting broad animation-corpus reconstruction.

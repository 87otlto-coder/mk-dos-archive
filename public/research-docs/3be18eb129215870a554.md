# MK DOS Archive — Pass 1E.3O.43 Fresh-Initial Ordinary BAK Compositor Census Handoff

**Status:** VERIFIED (bounded read-only compositor census)  
**Verdict:** `MK1_FRESH_INITIAL_ORDINARY_BAK_COMPOSITOR_CENSUS_ESTABLISHED`

## Scope

O43 generalizes O41's deliberately bounded fresh PIT ordering proof across all 24 O31 top-level background modules. It does **not** claim arbitrary later runtime order or canonical gameplay screenshots.

Qualified state:

- `BAKCLR` / empty ordinary-placement occupancy;
- each module's O31 header-defined initial camera;
- first placement-derived `MULTI_PLANE` population;
- O29/O41 ordinary projection and 320×200 viewport clipping;
- O41 fresh insertion semantics and renderer plane traversal `8→7→6→5→4→3→2→1→0`.

Excluded:

- init-callback/process-created objects;
- shadow and other special lists;
- dynamic descriptor-cycle evolution;
- later cull/recreate history;
- fighters/gameplay objects and HUD/framebuffer state.

## Generalized fresh ordering rule

Within each plane, placement records are created in increasing placement-record index. `INSOBJ_V` sorts by object `+0x18` primary key and signed 16.16 Y (`+0x14`) secondary key. A newly created exact-equal object inserts ahead of existing exact-equal peers. Therefore, for a fresh empty-state population, an exact-equal group appears head-to-tail in reverse placement-record creation order.

Later cull/recreate history can change that tie order and remains outside this pass.

## Census result

Across all 24 top-level modules:

- active ordinary placement instances: **2,575**;
- viewport-visible ordinary placement instances: **2,153**;
- visible exact-equal key groups: **512**;
- geometrically overlapping exact-equal pairs: **521**;
- modules with at least one visible placement: **24/24**;
- modules with at least one overlapping exact-equal pair: **24/24**.

PIT is the regression anchor. O43 reproduces O41 exactly:

- active placements: 15;
- visible placements: 6;
- plane-1 draw order: `169 → 124 → 72 → 143 → 75 → 58`.

## Independent validation

A separate Python implementation consumed only the previously verified O31 placement/plane IR and O41 renderer-history rules, rechecked the canonical `MK1.EXE` SHA-256, and independently recomputed:

- active/visible counts for all 24 modules;
- all 512 equal-key visible groups;
- all 521 overlapping equal-key pairs;
- every module's complete fresh renderer-order placement-ID sequence;
- the PIT O41 regression anchor.

Result: exact match to the O43 TypeScript report for every module and all global totals.

## Boundary

O43 establishes deterministic **fresh placement-derived ordinary BAK state**, not a complete initial gameplay frame. The qualified ordering must not be generalized to arbitrary later snapshots because O41 proves cull/recreate history can alter exact-equal ordering.

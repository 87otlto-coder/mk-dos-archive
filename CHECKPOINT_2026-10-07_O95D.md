# MK DOS Archive — O95D MK2 Runtime-Connected Lookup / Interpreter Route Census

**Date:** 2026-10-07 SAST  
**Status:** VERIFIED ROUTE CENSUS / NUMERIC IDENTITY COVERAGE STILL OPEN

O95D expands O95C without manufacturing identity/index combinations. Its scope is the executable routes in which one of the two O95B 17-slot lookup families is followed immediately by the O95C stream interpreter at physical `0x63E79`.

This pass does **not** instantiate unresolved object identities across all 17 roots. It preserves those routes symbolically.

## 1. Direct lookup -> interpreter routes

Fresh canonical `MK2.EXE` scan establishes exactly **28** direct routes:

- Family A (`0x918F1`) -> interpreter: **11**;
- Family B (`0x91909`) -> interpreter: **17**.

Of these:

- **27** have a strict adjacent immediate write to nested-index global `0x75A78`;
- **1** route, Family A call at physical `0x63E54`, does not have a qualifying adjacent immediate index and remains runtime/non-adjacent for this pass.

Immediate index sets on these direct routes:

- Family A: `0, 6, 7, 16, 38, 60`;
- Family B: `0, 1, 2, 3, 4, 5, 7`.

## 2. Numeric identity boundary

Only **one** of the 28 direct routes currently carries a fixed numeric identity proven at the route itself:

- physical lookup call `0x950DA`;
- Family A;
- identity slot `12` explicitly written at `0x9509D`;
- nested index `7`;
- exact selected stream Object-2 `0x130B8`;
- this is the already-qualified O95C eight-frame finite `GO.GRA` witness.

The remaining **27** routes are represented as:

`Family[object.identity][index] -> interpreter`

or, for `0x63E54`:

`FamilyA[object.identity][runtime index] -> interpreter`.

Their object identity is **UNRESOLVED_AT_ROUTE**. O95D does not cross-product those callsites with every identity root and does not claim per-slot runtime reachability.

## 3. Qualified root-extent boundary

For immediate-index routes, O95D compares the index only against O95B's already-qualified **contiguous relocation-backed root extent**. This is a qualification boundary, not a universal runtime bounds theorem.

Routes whose immediate index falls outside at least one qualified root extent:

- Family A index `38` at `0x677C2`: outside qualified extents for slots `12,13`;
- Family A index `60` at `0x838D0`: outside qualified extents for slots `12,13`;
- Family B index `5` at `0x6859C`, `0x81026`, `0x95F6F`: outside the qualified extent for slot `1`;
- Family B index `7` at `0x6863C`, `0x7A389`: outside qualified extents for slots `1,10,13,14,15`.

All other immediate direct routes fall within the qualified contiguous root extents of all 17 slots.

**Important:** "outside qualified extent" means O95B did not establish a contiguous relocation-backed pointer-table entry there. It is not promoted to "runtime-impossible identity" without additional evidence.

## 4. Machine-readable output

- implementation: `src/games/mk2/research/animationRuntimeRouteCensus.ts`;
- runner: `scripts/run-mk2-animation-runtime-route-census.mjs`;
- independent verifier: `scripts/verify-mk2-o95d-animation-runtime-route-census.py`;
- report: `mk2_animation_runtime_route_census_o95d_2026-10-07.json`.

Machine verdict:

`MK2_O95D_28_DIRECT_LOOKUP_INTERPRETER_ROUTES_ESTABLISHED_IDENTITY_REMAINS_PARAMETERIZED_EXCEPT_O95C_WITNESS`

## 5. Validation

Fresh authentic-fixture TypeScript runner: **PASS**.

Independent Python verifier:

- **54,335 checks / 0 failures**;
- reparses the canonical LE fixup surface independently;
- re-derives both 17-slot identity tables and contiguous root extents;
- independently rescans every direct lookup -> interpreter route;
- independently derives all adjacent immediate nested indices;
- verifies the sole fixed identity-12 witness;
- reconciles all 28 report rows and root-extent classifications.

Regression gates:

- O95B independent verifier: **54,200 / 0 failures**;
- O95C independent verifier: **54,199 / 0 failures**.

## 6. Decision boundary

Established:

- complete census of direct O95B lookup -> O95C interpreter adjacency;
- immediate nested-index values for 27/28 direct routes;
- one fixed numeric identity route;
- symbolic identity-parameterized representation for the remaining routes;
- bounded qualified root-extent classification without over-promoting it to runtime identity proof.

Still open:

- numeric identity recovery for the other 27 direct routes;
- non-direct lookup -> interpreter joins where helpers/state transitions intervene;
- complete runtime-connected stream target corpus;
- loop/branch/multipart corpus classification beyond individually proven streams;
- dynamic nested-index provenance at `0x63E54`;
- timing/dwell semantics;
- human move/action names;
- complete per-identity animation coverage.

MK2 animation closure remains **OPEN**.

## 7. Next pass

**O95E — identity provenance for unresolved direct routes and bounded delayed joins.**

Trace object `+0x46` provenance into the 27 unresolved direct routes and separately classify bounded lookup -> interpreter paths where helper/state code intervenes. Promote a numeric identity only where executable data flow establishes it. Do not infer identity from resource appearance, table compatibility, code neighborhood, or root capacity alone.

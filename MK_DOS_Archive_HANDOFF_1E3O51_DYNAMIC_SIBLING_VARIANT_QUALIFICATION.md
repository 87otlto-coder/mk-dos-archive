# MK DOS Archive — Pass 1E.3O.51 Dynamic Sibling Variant Qualification

**Status:** VERIFIED  
**Canonical MK1.EXE SHA-256:** `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`  
**Verdict:** `MK1_FIVE_DYNAMIC_SIBLING_VARIANTS_QUALIFIED_FOR_NORMALIZED_COMPOSITION`

## Objective

Qualify the five process-spawning sibling stage variants that O47/O50 intentionally left without direct combined rasters. Do not promote a sibling merely because its top-level init callback belongs to the same family.

## Qualified variants

- `ARENA_MOD386` against `ARENA_MOD`
- `CAVE_MOD386` against `CAVE_MOD`
- `PIT_MOD386` against `PIT_MOD`
- `STRIPPED_MOD386` against `STRIPPED_MOD`
- `STRIPPED_MOD486` against `STRIPPED_MOD`

Every qualification requires the same authentic resource/file-id context, the same initialized camera, the exact same init callback address/classification, and a mechanism-specific renderer condition.

### ARENA_MOD386

The 386 variant has fewer far ordinary planes than the non-386 module, so whole-stage equality is rejected. It nevertheless retains the exact dynamic target planes `ARENA3BMOD` and `ARENA4BMOD`, with 15 instantiated objects total. This is the exact object surface traversed by the already-qualified ARENA descriptor-cycle process.

### CAVE_MOD386

The CAVE dynamic layer is process-created on the qualified special-list path rather than derived from omitted far BMOD planes. `CAVE_MOD386` has the same resource, initial camera and callback `0x4680` as `CAVE_MOD`; the dynamic mechanism therefore remains directly applicable while its own ordinary raster remains variant-specific.

### PIT_MOD386

This is the strongest sibling-equivalence result: `PIT_MOD386` has the same resource, camera, callback and exact ordinary BMOD graph/placement count as `PIT_MOD`. The normalized dynamic process state is therefore expected to produce the same combined raster, and O52 uses that as a hard regression check.

### STRIPPED_MOD386 / STRIPPED_MOD486

Both variants retain the same FU8 resource, initialized camera and STRIPPED init callback that spawns `BIGEMP_PROC`. BIGEMP is process-created on its already-qualified plane/list path, so missing far ordinary planes do not invalidate its normalized selection-3 compositor state.

## Independent validation

A separate Python reconciliation used the canonical O30/O31 reports rather than the O51 report as proof. It independently confirmed resource identity, camera equality, callback identity/classification, ARENA's 15 required plane-3/4 objects and PIT386's exact ordinary graph equality.

Final report SHA-256: `e0d9c8169e9ebb3bd9642890685946af77623ecfb71716fea756867551904fd6`  
Independent audit SHA-256: `e670354e1f2b0499820b1646eb40869367e727cc62a8d3cb7a3d0096207fe4f9`

## Boundary

This pass qualifies normalized combined composition only. It does not establish canonical gameplay frame timing, wall-clock duration, RNG state or arbitrary later camera/history state.

# MK DOS Archive — Pass 1E.3O.52 Dynamic Sibling Combined Fixtures and Package Refresh

**Status:** VERIFIED  
**Canonical MK1.EXE SHA-256:** `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`  
**Verdict:** `MK1_FIVE_SIBLING_DYNAMIC_FIXTURES_AND_TWELVE_STAGE_COMBINED_PACKAGE_ESTABLISHED`

## Objective

Render direct normalized combined background fixtures only for the five O51-qualified sibling variants, then refresh the corrected O50 product package without weakening any unresolved-state boundaries.

## New combined fixtures

| Module | Normalized state | Raw RGBA SHA-256 |
|---|---|---|
| `ARENA_MOD386` | ARENA state 1 on all 15 plane-3/4 targets | `6dd30783c5e572b8edd3f9f382beb10b57cb9b4b80b216744a82033e73ca31ad` |
| `CAVE_MOD386` | spawn enabled; all six independent phases normalized to 0 | `1244625b26d03bd1bbb99976b859d4b1980bb70a2834dac2d2e9bd601079adef` |
| `PIT_MOD386` | persistent clouds post-creation/pre-motion; transient absent; shadow symbolic | `c0e0dcf5d2d24e463890cedcbb35e59b29a022be7b0053f6eaa886d721af2fe4` |
| `STRIPPED_MOD386` | BIGEMP selection index 3 under initial camera | `458f866e5c90f60db8d267d66bcdab27886a56715cb14d613d1cb0a3951c2612` |
| `STRIPPED_MOD486` | BIGEMP selection index 3 under initial camera | `eee53770400852e6461b5ed693a3dfeb4b83cec73fb52c74979d10cfa838f134` |

`PIT_MOD386` exactly matches the verified PIT parent combined raster, as required by its exact ordinary graph/camera/process equivalence.

## Package result

The corrected product package now contains:

- 24 corrected fresh ordinary stage PNGs;
- 12 direct normalized combined stage PNGs;
- one shared CHOP/STATUE moon PNG;
- 24 time-aware scene IR documents;
- 24 per-stage coverage documents;
- no fabricated combined PNG for the remaining 12 stages.

The five newly promoted coverage rows have their obsolete `MODULE_SPECIFIC_RENDERER_DYNAMIC_CONTRACT_NOT_DIRECTLY_PACKAGED` blocker removed only after O51/O52 qualification.

## Independent validation

A separate Python compositor did not use the O52 report to construct expected pixels. It used the verified O43 fresh draw order and orientation fields, O44 source RGBA assets, and the independently verified O32/O36/O38/O40 dynamic payloads. It rebuilt all five 320×200 sibling fixtures and matched all five packaged PNGs exactly at raw RGBA level.

Final O52 report SHA-256: `f57f7ec8d145d21e00ca0c0f2fc6d25dc7b248f2981b1cd09df38f4f128ae852`  
Independent audit SHA-256: `836ede43054ff00a59dbb69b6dd516b1c7f88454565bd9d04ec91cde872cf071`  
Stage package ZIP SHA-256: `6fe7dcdeaba779f4216df0b19c7d68a56bd1dafe7571916f1ea69b19046c8086`

## Integration

Normal research workflow is now **61/61**. The two O51/O52 research modules compile through the targeted TypeScript chain, the runner passes `node --check`, and `ResearchQuickActions.tsx` passes TypeScript `transpileModule` syntax validation. A dependency-backed full application typecheck is not claimed because this archival source still does not include installed React/lucide dependencies.

## Boundary

These are normalized background-only compositor fixtures, not canonical gameplay screenshots. Random state, absolute dynamic phase, wall-clock timing, later camera/cull history and runtime-only shadow values remain explicit where applicable.

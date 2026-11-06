# P30 - standalone FOREST components and preserved P7 layers

Date: 2026-11-07. Fourth interim pass after P26. Baseline develop `8722a5d256640e9dd42f8925f9e85dfaab4fc157`. Main remains P16.

## Outcome and counting boundary

The Asset Library exposes **49 complete original FOREST.GRA components** through its existing indexed preview, PNG and selected-ZIP workflows. Evidence package: `MK2_P30_FOREST_49_ORIGINAL_COMPONENTS.zip`.

Current MK2 census is **5,304 unique representations**, up from 5,255. A pre-implementation P29 collection join found **14 earlier FOREST representations / zero exact standalone matches** by dimensions, index hash and opacity hash. All 49 descriptors are already covered by O110A research: these are new standalone library records, **not 49 newly discovered images**.

Of these originals, **43 occur inside five existing P7/O197 canvases**; **six (ordinals 0-5) have no link to those five setups**. Metadata preserves that distinction. No placement, animation or activation is invented for unlinked originals. All **14 earlier FOREST records** remain: ten P7 layer previews (five index and five candidate-color), three native floor representations and one viewport floor.

## Original source and coverage

- Original EXE: 861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- FOREST.GRA: **226,788 bytes**; SHA-256 `8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9`.
- Obj2 physical base **0xa0c54**, descriptor table **0x16d8c**, resource pool slot **27**.
- Forty-nine eight-byte descriptors and contiguous native row streams exactly cover **[0,164752)**, with **164,382 indexed pixels**.
- **62,036 bytes** lie outside this particular descriptor family. The native floor is separately preserved at **[198116,226788)**, 896x32 indices. The intervening **[164752,198116)** / **33,364 bytes** are outside P30's qualification; this pass does not interpret them or claim complete FOREST image coverage.
- Five original setup records share descriptor table 0x16d8c and palette-pointer table **0x171d0**. All sixty source controls select slot 2; that source association does not establish live DAC ownership.

| Existing layer | Obj2 setup | Canvas | Source controls |
|---|---|---|---:|
| 1 | 0x16f8c | 968x184 | 18 |
| 2 | 0x16f9e | 728x160 | 10 |
| 3 | 0x16fb0 | 640x112 | 13 |
| 4 | 0x16fc2 | 616x96 | 15 |
| 5 | 0x16fd4 | 384x56 | 4 |

All five independent source-local canvases reconstruct exactly from the new standalone components: **446,912 indexed/opacity cells / 60 placements**. Fourteen placement bounding boxes extend outside a canvas; standalone records preserve full source geometry without applying the setup crop.

The independent Python verifier reads original descriptors and controls directly, decodes rows without the production decoder, and reconstructs native index/opacity canvases. The TypeScript verifier compares against those independent hashes, then reconstructs from the new components using existing O197 placements and checks byte equality against existing O197 output. Original P7/O196/O197 code, candidate palettes, layers and research exports are unchanged.

## Implementation

`src/core/assets/mk2ForestSourceP30.ts` authenticates unique canonical EXE/GRA entries by complete size/hash, resource pool slot, descriptor extents and original setup tables. It uses the unchanged native row decoder and parses source setup-control joins. Synthetic, missing, ambiguous, corrupt and truncated inputs return UNAVAILABLE with no partial assets or packages.

Every record retains full source geometry, native index and opacity arrays, descriptor addresses, encoded extents and `sourceSetupUses`. The latter lists the existing index-preview layer ID, setup offset, use count and clipped-placement count. Six unlinked records retain an empty list and `componentPreviouslyUsedInMosaics=false`; the other 43 have true.

Preview RGB=(index,index,index), alpha=source opacity, and palette-known masks are zero. `newlyDiscoveredSourceImage=false`, `setupRelationshipsAreRuntimePlacement=false` and `sourceTableOrderIsAnimation=false` remain explicit. Source-local uses do not establish inter-layer placement or native timing.

The observed pre-registry fixture is labeled **OBSERVED_P29_COLLECTION_NOT_INDEPENDENT_SOURCE_GOLDEN**. It proves the preservation/counting boundary, while separate original-file evidence authenticates decoding. Committed fixtures contain hashes, geometry and source-control provenance, not artwork.

## Verified results

| Check | Result |
|---|---|
| Focused source/export/canvas checks | **1,094 checks PASS**, 49 originals / 164,382 pixels |
| Independent original descriptor/control/row/canvas evidence | **1,222,897 checks PASS** |
| Independent PNG/sidecar/provenance parity | **1,881,013 checks PASS** |
| Invalid original fixtures | **8 rejected**, no partial output |
| False exports with recalculated CRC | **5 rejected**: changed indices, valid wrong PNG, invented palette, invented link for an unlinked original, lost existing relationship; clean archive reverified |
| Full current cumulative MK2 | **5,304 representations / 1,940 checks PASS** |
| Standard current MK2 runner | **17 suites PASS / 825,238 checks**; MK1/MK3 explicitly NOT_RUN this interim |
| Local checks | **374 TypeScript files / zero syntax errors**, TypeScript noEmit, Vite production build, new CJS syntax and whitespace diff PASS |

Two test-harness issues were resolved before the final passing results: a copied cumulative variable name conflicted with an earlier FOREST package variable, and an initial lost-link mutation targeted already-unlinked component 0, leaving its empty list unchanged. The latter now deliberately targets a linked record, and a separate control fabricates a link for an unlinked record. These were test construction faults, not observed production extraction failures. The existing Vite large-chunk warning remains.

Deterministic component archive SHA-256: `59b02f8bea8684bd4d1721db5ccb27bed914601c15fe82e8309717d4154a3e9c`.

All fourteen earlier FOREST geometries/source extents/index/opacity/RGBA hashes, previous TOWER/TOMB/PORTAL records, earlier deterministic family archives and original floor bytes remain checked. See [machine-readable results](validation/P30_FOREST_COMPONENT_REGRESSION_2026-11-07.json).

## Reproduction

Write private outputs outside the original fixture and repository:

```text
node scripts/verify-p21-checkpoint.cjs --mk2 <original-directory> --through p30 --report <private-report.json>
node scripts/verify-mk2-p30-forest.cjs <original-directory> <private-adapter.json> <private-components.zip>
python scripts/verify-mk2-p30-forest-independent.py <original-directory> --export <private-components.zip> --report <private-independent.json>
python scripts/test-mk2-p30-forest-negative.py <original-directory> <private-components.zip> <private-negative-directory> --report <private-negatives.json>
```

The interim runner defaults to P30. Historical fixed-census choices require matching source. P26's frozen consolidation runner must not be used to judge P30's larger census.

## Confidence and consolidation boundary

**VERIFIED:** full table geometry/indices/opacity, 43 used versus six unlinked components, original sixty-control relationships, exact five-canvas reconstruction, independent exports and preservation of existing data.

**UNKNOWN:** activation/scene roles of unlinked components, live palette/DAC selection, runtime timing, world/inter-layer placement and full FOREST composition. The 33,364-byte interval outside this table and before the floor receives no new qualification.

**VALIDATION PENDING:** original-data browser actions. Source-only Chrome CI is separate. MK1/MK3 latest full original-fixture evidence remains P26. Existing authenticated extracted fixtures were used; no new archive download/hash/re-extraction is claimed.

P27-P30 now form four recoverable interim passes adding **84 standalone representations** (TOMB 16, PORTAL 13, TOWER 6, FOREST 49) beyond P26. Next **P31**: assess fifth-pass consolidation with fresh three-game regression, independent rechecks of all eight P22-P30 families and false-export controls, complete committed-source audit, and documented runtime/browser uncertainties. Introduce a current-census checkpoint runner rather than changing P26's historical evidence. Keep the workbench intact, originals/artwork private and main unchanged; source consolidation does not authorize promotion or imply product completeness.


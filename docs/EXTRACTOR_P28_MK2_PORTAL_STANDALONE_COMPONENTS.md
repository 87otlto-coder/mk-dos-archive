# P28 - standalone PORTAL components and verified existing coverage

Date: 2026-11-06. Second interim pass after P26. Baseline develop `7166f9d16cf4ba5ba09e5975d45752f55cef43b7`. Main remains P16.

## Outcome and counting boundary

The Asset Library exposes **13 complete original PORTAL.GRA setup components individually**, through existing indexed preview, PNG and selected-ZIP workflows. Evidence package: `MK2_P28_PORTAL_13_ORIGINAL_SETUP_COMPONENTS.zip`.

Current MK2 census: **5,249 unique asset representations**, up from 5,236. These are **13 new standalone representations of already known source components**, not newly discovered artwork. Before implementation, an observed P27 collection join found **29 PORTAL records and zero exact standalone matches** by dimensions, index hash and opacity hash. All thirteen components were already used in two O122 setup-local mosaics.

All 29 earlier PORTAL records remain: **20 effect frames, two mosaics, four floor representations and three source-order sheets**. TOMB P27 and all earlier groups remain verified. Research workbench, O122 source tables/renderers, preview/export implementations and existing UI are preserved.

## Original-source evidence

- Original EXE: 861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- PORTAL.GRA: **92,756 bytes**, SHA-256 `cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82`.
- Obj2 physical base **0xa0c54**, eight-byte descriptor table **0x1655c**, resource pool slot **25**.
- Thirteen contiguous streams exactly cover **[0,35912)**, totaling **60,566 indexed pixels**.
- Existing effect region **[35912,56916)** and native floor **[56916,92756)** remain available. **56,844 bytes** outside the setup-component prefix are not presented as missing or newly decoded.
- Original setup records **0x16514 / 896x176 / 20 controls** and **0x16526 / 320x168 / 8 controls**, descriptor table 0x1655c and palette pointer table 0x16538, independently parsed from original EXE bytes.
- All 28 controls select palette-table slot 2. This is a source-control relationship, not measurement of a live palette handle or DAC bank.
- Every descriptor joins at least one original setup. There are zero clipped placements in these two setups. Standalone access provides separate reusable originals without requiring users to recover them from mosaics.

The independent Python verifier reads controls directly from original bytes and decodes rows without the production decoder or O122 placement constants. It reconstructs both source-local canvases. The TypeScript verifier independently checks those hashes, reconstructs from the new components plus existing placements, and verifies byte equality against existing O122 indexed/opacity outputs: **211,456 canvas cells / 28 placements**.

Reference fixtures contain geometry, source-control provenance and hashes, not artwork planes. The before-registry fixture is explicitly labeled **OBSERVED_P27_COLLECTION_NOT_INDEPENDENT_SOURCE_GOLDEN**; it establishes preservation and counting boundaries rather than independently authenticating artwork.

## Implementation

`src/core/assets/mk2PortalSourceP28.ts` requires unique original EXE/GRA entries, complete sizes/hashes, resource slot, contiguous descriptor extents and a join to existing setup provenance. It uses the existing bounded native row decoder. Failures return UNAVAILABLE with no partial assets or packages.

Each component retains native geometry, indexed bytes, opacity, descriptor addresses, resource identity and `sourceSetupUses`. Metadata explicitly records `componentPreviouslyUsedInMosaics=true`, `newlyDiscoveredSourceImage=false`, and `setupRelationshipsAreRuntimePlacement=false`. Preview RGB equals the source index and alpha equals source opacity; palette-known masks remain zero.

Collection integration is additive. The current interim runner defaults to `--through p28`; fixed-census historical verifiers require matching historical source. P26's three-game consolidation runner remains frozen to P26.

## Verified results

| Check | Result |
|---|---|
| Focused component/export/canvas verification | **327 checks PASS**, 13 originals, 60,566 pixels, both canvases |
| Independent original descriptor/control/row evidence | **544,141 checks PASS** |
| Independent PNG/planes/provenance export parity | **786,561 checks PASS** |
| Recomputed ZIP/PNG CRC false exports | **4 rejected**: changed index, valid PNG with wrong pixels, invented palette, lost setup relationship; clean export reverified |
| Invalid source fixtures | **8 rejected**, no partial output |
| Full cumulative original MK2 collection | **5,249 representations / 1,277 checks PASS** |
| Standard current MK2 runner | **15 suites PASS**; MK1/MK3 explicitly NOT_RUN this interim |
| Local source checks | **372 TypeScript files / zero syntax errors**, TypeScript noEmit, production Vite build and new CJS syntax PASS |

The first cumulative attempt exposed a copied test expectation of sixteen components; it was corrected to the independently observed thirteen and the complete runner then passed. No production extraction failure was observed. Existing Vite large-chunk warning remains.

Deterministic component archive SHA-256: `b159383cee493fcb0ce4fba8cd69a7ff1d554e267f5d729492bede12069a6e90`. Earlier family archive/floor hashes and all prior TOMB/PORTAL geometry, extents and indexed/opacity hashes are enforced by the cumulative gate.

Machine-readable results: [P28 regression evidence](validation/P28_PORTAL_COMPONENT_REGRESSION_2026-11-06.json).

## Reproduction

Use an authenticated extracted original MK2 directory; keep outputs outside original fixtures and the source repository.

```text
node scripts/verify-p21-checkpoint.cjs --mk2 <original-directory> --through p28 --report <private-report.json>
node scripts/verify-mk2-p28-portal.cjs <original-directory> <private-adapter.json> <private-components.zip>
python scripts/verify-mk2-p28-portal-independent.py <original-directory> --export <private-components.zip> --report <private-independent.json>
python scripts/test-mk2-p28-portal-negative.py <original-directory> <private-components.zip> <private-negative-directory> --report <private-negatives.json>
```

## Confidence and continuation

**VERIFIED:** original geometry/indices/opacity, both original setup/control relationships, complete standalone access, exact existing-canvas reconstruction, original export parity, and preservation of prior records.

**UNKNOWN:** live palette selection, native timing, runtime setup activation, world/screen placement and full stage composition. Descriptor order does not establish animation order.

**VALIDATION PENDING:** original-data browser interactions. Source-only Chrome CI is a separate gate. MK1/MK3 latest fresh complete fixture evidence remains P26. Existing extracted fixtures and pinned original identities were used; no fresh whole-archive download/hash/re-extraction is claimed.

Next **P29**: audit TOWER descriptor/component coverage against existing effect/setup representations before deciding whether standalone exposure improves extraction. Apply verified existing research first, retain provenance, and make no new-artwork claim without evidence. P30 remains another interim pass; assess fifth-pass consolidation at P31. Develop only; no main promotion or full-source packaging this interim.


## Committed source and CI evidence

Verified source candidate: `ce57900e112c6760467bcab08ea91c3e6beb8f90`; tree `b1d630bf5bf116c2b78a0b85f303903296a877ee`. All **15 selected local files** match committed Git blob hashes after normal checkout newline conversion. Recursive tree audit: **2,144 blobs / 376 src files**, no removed paths and no tracked original game media/archive extensions. Runtime changes are limited to the new adapter and additive collection registration.

GitHub [source-build run 42301511758](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42301511758) completed **SUCCESS** on this exact source candidate. Strict dependency installation, source syntax, tracked-file safety guard, production build, TypeScript and headless Chrome application boot **without game data** passed. Real-data browser interaction remains validation pending. The subsequent evidence commit changes documentation only.

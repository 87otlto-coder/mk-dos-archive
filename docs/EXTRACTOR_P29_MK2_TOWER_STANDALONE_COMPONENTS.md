# P29 - standalone TOWER originals from mixed descriptors

Date: 2026-11-07. Third interim pass after P26. Baseline develop `71e6776e3455232aee39fb1fe75fa1a338cd596f`. Main remains P16.

## Outcome and counting boundary

The ordinary extractor now previews and exports **six complete original TOWER.GRA components** with native dimensions, indices, opacity and source provenance. Evidence package: `MK2_P29_TOWER_6_ORIGINAL_COMPONENTS.zip`.

Current MK2 census: **5,255 unique representations**, up from 5,249. Before implementation, a P28 collection join found **11 earlier TOWER representations and zero exact standalone matches** for these six components by geometry/index/opacity. Existing O110A research already covers the four eight-byte descriptors and the O69 twelve-byte family: this is applying existing research, **not claiming six newly discovered source images**.

All eleven earlier TOWER records remain: **seven effect frames, three floor representations and one source-order sheet**. Their geometry, source extents, indexed/opacity planes and preview RGBA hashes are preserved. Existing TOMB, PORTAL, prior families, research tools and UI are retained.

## Original evidence and bounded interpretation

Original MK2.EXE is 861,133 bytes, SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
Original TOWER.GRA is **113,612 bytes**, SHA-256 `7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8`. Obj2 physical base is **0xa0c54**; resource pool slot is **30**.

| Component | Obj2 descriptor | Descriptor bytes | Native dimensions | Encoded source interval | Raw setup controls |
|---|---|---:|---|---|---:|
| 0 | 0x17980 | 8 | 34x152 | [0,6220) | 2 |
| 1 | 0x17988 | 8 | 52x199 | [6220,17080) | 16 |
| 2 | 0x17990 | 8 | 100x127 | [17080,28780) | 2 |
| 3 | 0x17998 | 8 | 101x73 | [28780,34652) | 2 |
| 4 | 0x179a0 | 12 | 72x64 | [34652,38288) | 0 |
| 5 | 0x179b0 | 12 | 72x48 | [38288,40776) | 0 |

The six streams exactly tile **[0,40776)** and contain **43,653 indexed pixels**. The two twelve-byte descriptors retain their signed source anchor words (both zero here). They are not incorrectly read as contiguous eight-byte entries.

The seven existing effect descriptors are independently read from pointer list **0x16490**, including its terminal 1 and back-reference, and independently decoded across **[40776,56268)**. Existing native floor bytes **[56268,113612)** remain intact: 896 columns x 64 rows. No duplicate new effect records are added. The **72,836 source bytes outside the new component family** are already covered by those effects and floor; they are not described as newly decoded or missing.

Original setups **0x1795c** and **0x1796e** share descriptor table **0x17980** and palette pointer table **0x17a18**. Their two and twenty controls refer to the first four components. Each metadata record retains exact control location, ordinal, raw flags, signed source X/Y and raw descriptor pair.

**Raw flags remain uninterpreted.** The source setup headers describe 1031x64, while several component heights exceed 64, and controls include 0x4042/0x4052 flags. P29 does not invent mirroring, clipping, coordinate conventions or a mosaic renderer from those facts. The other two components have no link to these setup controls; their activation remains unknown. No TOWER composite or runtime scene is claimed.

## Implementation and verification

`src/core/assets/mk2TowerSourceP29.ts` authenticates unique original EXE/GRA entries by complete size/hash, checks the source resource slot, reads the mixed descriptors and bounded native rows, and records original setup-control provenance. Synthetic, missing, ambiguous, changed and truncated sources return UNAVAILABLE without partial assets or packages.

New assets use diagnostic RGB=(index,index,index), source opacity and all-zero palette-known masks. Metadata states `newlyDiscoveredSourceImage=false`, `setupTransformSemanticsKnown=false`, `setupRelationshipsAreRuntimePlacement=false` and `sourceTableOrderIsAnimation=false`. No RGB ownership, timing, world placement or activation is assigned.

The independent Python verifier parses original descriptors, controls and effect pointers directly and decodes all thirteen source streams without production decoder/constants. It verifies the six new PNGs, indexed/opacity/known masks and source/control metadata. The observed before-registry fixture establishes preservation/counting, and is explicitly **not** an independent source golden. All committed fixtures contain geometry/provenance/hashes, not artwork.

| Verification | Result |
|---|---|
| Focused adapter/export/reference checks | **161 checks PASS**, six images / 43,653 indexed pixels |
| Independent original-file evidence, including seven existing effects | **122,053 checks PASS** |
| Independent PNG/sidecar/provenance parity | **296,737 checks PASS** |
| Invalid source fixtures | **8 rejected**, no partial output |
| Re-CRC'd false exports | **5 rejected**: changed indices, valid wrong PNG, invented palette, invented setup transform, lost original controls; clean archive reverified |
| Complete current MK2 cumulative gate | **5,255 representations / 1,436 checks PASS** |
| Standard current MK2 runner | **16 suites PASS**; MK1/MK3 explicitly NOT_RUN this interim |
| Local checks | **373 TypeScript source files / zero syntax errors**, TypeScript noEmit, production Vite build, new CJS syntax and whitespace diff PASS |

No extraction regression was observed. The existing Vite large-chunk warning remains. Deterministic component archive SHA-256: `0f30349355a6db84a2220e653301a993921500ddf8083ef6db8a61e0856a132c`.

Machine-readable [P29 results](validation/P29_TOWER_COMPONENT_REGRESSION_2026-11-07.json). Earlier deterministic archives, original floors, all TOMB/PORTAL records and source-order workflows remain checked. The interim runner now defaults to `--through p29`; historical census gates require matching source. P26's three-game runner remains frozen to P26.

## Reproduction

Keep outputs outside the original fixture and repository:

```text
node scripts/verify-p21-checkpoint.cjs --mk2 <original-directory> --through p29 --report <private-report.json>
node scripts/verify-mk2-p29-tower.cjs <original-directory> <private-adapter.json> <private-components.zip>
python scripts/verify-mk2-p29-tower-independent.py <original-directory> --export <private-components.zip> --report <private-independent.json>
python scripts/test-mk2-p29-tower-negative.py <original-directory> <private-components.zip> <private-negative-directory> --report <private-negatives.json>
```

## Confidence and next pass

**VERIFIED:** mixed descriptor geometry, exact indexed/opacity data, raw original setup/control provenance, original effect parity, deterministic component exports and previous output preservation.

**UNKNOWN:** setup flag/transform semantics, component activation, live palette/DAC selection, runtime timing, world placement and full scene composition. Existing source-linked candidate palette previews retain their earlier qualification; P29 does not strengthen it.

**VALIDATION PENDING:** original-data browser actions. Source-only Chrome CI remains separate. MK1/MK3 latest full original-fixture checkpoint remains P26. Existing extracted canonical fixtures were used; no new archive download/hash/re-extraction is claimed.

Next **P30**: audit FOREST source-component coverage against the existing P7 layers, then expose useful missing originals only after independent source verification. Preserve layer/effect provenance and distinguish new standalone representations from new artwork. Assess the fifth-pass consolidation at **P31**, after four recoverable interim passes. Develop only; main unchanged; no interim full-source packaging.


## Committed source and CI evidence

Verified source candidate: `8068feb5e079d73529e9da9082c52fa4d8268d39`; tree `8b4a8f3f7c7a99ace9132396142febfb9210627e`. All **15 selected local files** match committed Git blob hashes after normal checkout newline conversion. Recursive tree audit: **2,153 blobs / 377 src files**, no removed paths, no tracked original game media/archive extensions, and no node_modules/dist/cache paths. Runtime changes are limited to the new adapter and additive collection registration.

GitHub [source-build run 42305438278](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42305438278) completed **SUCCESS** on this exact source candidate. Strict dependency installation, source syntax, tracked-file guard, production build, TypeScript and headless Chrome application boot **without game data** passed. This does not establish original-data browser actions or native palette/timing/transform semantics. The subsequent evidence commit changes documentation only.

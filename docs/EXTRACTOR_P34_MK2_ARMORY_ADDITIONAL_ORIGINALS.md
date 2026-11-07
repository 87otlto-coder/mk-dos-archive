# P34 - additional ARMORY originals and complete native source-byte partition

Date: 2026-11-07. Third interim after P31. Baseline develop `30be4263ce8f9e05bde07482fc7edb2dfb47e0d8`; main remains P16.

## Outcome and counting boundary

The Asset Library exposes **twelve additional original ARMORY.GRA images**, filling **[116608,126336)**. Package: `MK2_P34_ARMORY_12_ADDITIONAL_ORIGINALS.zip`.

Current MK2 census: **5,353 unique representations**, up from 5,341. The observed P33 collection had **21 ARMORY records / zero exact standalone matches** for these images by geometry/index/mask. All 21 are preserved. This applies existing O69/O110A descriptor decoding; **zero newly discovered artwork claims** are made.

ARMORY now exposes **30 original indexed streams**, followed by its retained native floor. These account for all **176,512 resource bytes** without gaps/overlaps. This is native source-byte accounting under these decoders, not a complete scene, palette assignment, activation proof or claim about every alternate interpretation.

## Original evidence

Canonical MK2.EXE: 861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
ARMORY.GRA: **176,512 bytes**, SHA-256 `fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612`.
Obj2 physical base: **0xa0c54**; resource pool slot: **26**.

A four-byte-aligned original EXE probe, limited to this resource/interval and existing O69 geometry/anchor bounds, found twelve eligible twelve-byte descriptors. All are **10x64** with original signed anchor words **0,0**. Independent Python reads these witnesses and decodes the native row streams without the production decoder.

| Ordinal | Obj2 descriptor | Encoded source interval |
|---|---|---|
| 0 | 0x169ec | [116608,117324) |
| 1 | 0x169fc | [117324,118196) |
| 2 | 0x16a08 | [118196,119112) |
| 3 | 0x16a14 | [119112,120096) |
| 4 | 0x16a20 | [120096,121108) |
| 5 | 0x16a2c | [121108,122032) |
| 6 | 0x16a38 | [122032,122920) |
| 7 | 0x16a44 | [122920,123700) |
| 8 | 0x16a50 | [123700,124416) |
| 9 | 0x16a5c | [124416,125060) |
| 10 | 0x16a68 | [125060,125712) |
| 11 | 0x16a74 | [125712,126336) |

Total: **9,728 encoded bytes / 7,680 indexed pixels**. Descriptor spacing is not assumed uniform; adjacent words receive no new interpretation. Similar geometry, adjacency and source order do not prove an animation sequence or timing.

**Setup relationships are not qualified in P34.** Empty `sourceSetupUses` is accompanied by `sourceSetupUsesKnown=false` and an explicitly unqualified coverage scope. This does not claim absence from all original setups. No semantic role, world position or runtime activation is assigned.

## Verified native partition

| Region | Retained/exposed decoder output | Bytes |
|---|---|---:|
| [0,116608) | 18 existing P23 indexed originals | 116,608 |
| [116608,126336) | 12 P34 indexed originals | 9,728 |
| [126336,176512) | Original 896x56 native floor | 50,176 |
| **Total** | **30 indexed streams + floor** | **176,512** |

The independent verifier authenticates the EXE floor pointer at **0xcfbac + 4x4**, packed resource 26/offset 126336, and hashes the full original floor suffix. The cumulative gate verifies every positive image extent in order, exact floor adjacency, complete resource length and independent floor byte identity.

All existing eighteen P23 components and three floor representations retain geometry, source extents, original index/mask buffers and RGBA hashes. The current cumulative test's older floor selection now excludes both standalone component families, while still requiring exactly the three prior floor records and unchanged raw floor bytes. No production floor path or old fixed-census script is rewritten.

## Implementation and validation

`src/core/assets/mk2ArmoryTailSourceP34.ts` authenticates unique complete original EXE/GRA inputs by sizes/hashes, resource slot, original twelve-byte witnesses and contiguous bounds ending exactly at the native floor. It uses the unchanged bounded native row decoder. Invalid inputs return UNAVAILABLE with no partial assets/packages.

Metadata retains source descriptor addresses/byte length/anchor words and exact encoded extents. Diagnostic RGB=(index,index,index), alpha=255*original command paint coverage; **`maskIsRuntimeAlpha=false`**. Palette-known masks are zero. Native palette/timing/world/full-scene and animation-order flags remain false; setup qualification remains explicitly unknown.

Reference fixtures contain hashes, geometry and provenance, not original artwork. The observed before-registry record is labeled **OBSERVED_P33_COLLECTION_NOT_INDEPENDENT_SOURCE_GOLDEN**; independent original-file decoding separately qualifies the output.

| Verification | Result |
|---|---|
| Focused adapter/export/reference checks | **317 checks PASS**, 12 originals / 7,680 pixels |
| Independent original descriptors/rows/floor pointer | **15,424 checks PASS** |
| Independent PNG/sidecar/provenance parity | **46,288 checks PASS** |
| Invalid source fixtures | **8 rejected**, no partial output |
| Re-CRC'd false exports | **6 rejected**: changed indices, valid wrong PNG, invented palette, invented animation, runtime-alpha claim and fabricated setup link; clean export reverified |
| Full current MK2 cumulative | **5,353 representations / 3,947 checks PASS** |
| Standard current MK2 runner | **20 suites PASS**; MK1/MK3 explicitly NOT_RUN this interim |
| Local checks | **377 TypeScript files / zero syntax errors**, TypeScript noEmit, Vite production build, new CJS syntax and whitespace diff PASS |

No extraction regression was observed. The existing Vite large-chunk warning remains. Package SHA-256: `df7ef23a709774e1f4dc7cdbbde83bb95c4c72ce1dc0877a9e1fb1d687447baa`.

All earlier family archives, FOREST/PIT source-byte partitions and existing representations remain checked. [Machine-readable evidence](validation/P34_ARMORY_ADDITIONAL_REGRESSION_2026-11-07.json).

## Reproduction

Keep private reports/exports outside source and original fixtures:

```text
node scripts/verify-p21-checkpoint.cjs --mk2 <original-directory> --through p34 --report <private-report.json>
node scripts/verify-mk2-p34-armory-tail.cjs <original-directory> <private-adapter.json> <private-components.zip>
python scripts/verify-mk2-p34-armory-tail-independent.py <original-directory> --export <private-components.zip> --report <private-independent.json>
python scripts/test-mk2-p34-armory-tail-negative.py <original-directory> <private-components.zip> <private-negative-directory> --report <private-negatives.json>
```

The interim runner defaults to P34. P31/P26 and earlier checkpoint runners remain frozen to matching historical source and census.

## Confidence and next pass

**VERIFIED:** descriptor geometry/anchors, original indexed data/command masks, export parity, preservation of all 21 prior ARMORY records, original floor source pointer/bytes and complete native resource partition.

**UNKNOWN:** setup relationships, semantic roles, runtime activation, native palette/DAC ownership, native alpha behavior, animation timing/order and world/inter-layer placement. Source offsets/anchors do not strengthen those claims.

**VALIDATION PENDING:** original-data browser actions. Source-only Chrome CI is separate. Latest fresh full MK1/MK3 evidence remains P31; this interim freshly reruns MK2. No fresh archive download/hash/re-extraction is claimed.

Next **P35**: audit ARENA **[36172,90488)** against existing descriptor evidence, current fifteen components and native floor, adding independently qualified missing originals only. Preserve workbench/provenance and recoverable develop commits. P36 remains the fifth-pass consolidation assessment; main unchanged.


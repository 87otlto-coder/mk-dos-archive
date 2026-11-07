# P35 - additional ARENA originals and complete native byte partition

Date: 2026-11-07. Fourth interim after P31. Baseline develop `2ec3f929ec522920f7827051d903b531d461cf8f`; main remains P16.

## Outcome and counting boundary

The Asset Library exposes **sixteen additional original ARENA.GRA images**, filling **[36172,90488)**. Package: `MK2_P35_ARENA_16_ADDITIONAL_ORIGINALS.zip`.

Current MK2 census: **5,369 unique representations**, up from 5,353. The observed P34 collection had **eighteen ARENA records / zero exact standalone matches** for these images by geometry/index/mask. All eighteen are preserved. This applies the existing O69/O110A twelve-byte descriptor format; **zero newly discovered artwork claims** are made.

ARENA now exposes **31 original indexed streams**, followed by its retained native floor. These account for all **126,328 original resource bytes** without gaps/overlaps. This is a native source-byte partition under these decoders, not proof of complete stage composition, correct colors, activation, timing or every alternate interpretation.

## Original evidence

Canonical MK2.EXE: 861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
ARENA.GRA: **126,328 bytes**; SHA-256 `37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb`.
Obj2 physical base: **0xa0c54**; resource pool slot **31**.

A four-byte-aligned original EXE probe, limited to this resource/interval and existing O69 geometry/anchor bounds, found sixteen eligible twelve-byte descriptors. Independent Python reads those original witnesses and decodes their row streams without the production decoder.

| Ordinal | Obj2 descriptor | Native dimensions | Encoded interval |
|---|---|---|---|
| 0 | 0x18688 | 81x19 | [36172,37628) |
| 1 | 0x18698 | 81x19 | [37628,39076) |
| 2 | 0x186a8 | 81x19 | [39076,40592) |
| 3 | 0x186b8 | 64x112 | [40592,45836) |
| 4 | 0x186c8 | 64x112 | [45836,51748) |
| 5 | 0x186d4 | 64x112 | [51748,58148) |
| 6 | 0x186e0 | 96x80 | [58148,61600) |
| 7 | 0x186f0 | 96x80 | [61600,65144) |
| 8 | 0x186fc | 96x80 | [65144,68704) |
| 9 | 0x18708 | 96x80 | [68704,72232) |
| 10 | 0x18714 | 96x80 | [72232,75700) |
| 11 | 0x18720 | 88x80 | [75700,78700) |
| 12 | 0x18730 | 88x80 | [78700,81660) |
| 13 | 0x1873c | 88x80 | [81660,84620) |
| 14 | 0x18748 | 88x80 | [84620,87528) |
| 15 | 0x18754 | 88x80 | [87528,90488) |

Total: **54,316 encoded bytes / 99,721 indexed pixels**. All original signed anchor words are zero. Descriptor spacing is not assumed uniform; adjacent words receive no new interpretation. Similar dimensions, adjacent descriptors and source ordering do not establish animation groups or timing.

**Setup relationships are not qualified by P35.** Empty `sourceSetupUses` is paired with `sourceSetupUsesKnown=false` and an explicitly unqualified scope. This does not assert absence from all original setups. Roles, activation and world placement remain unassigned.

## Native source partition

| Region | Decoder/output | Bytes |
|---|---|---:|
| [0,36172) | 15 retained P25 indexed originals | 36,172 |
| [36172,90488) | 16 P35 indexed originals | 54,316 |
| [90488,126328) | Retained original 896x40 floor | 35,840 |
| **Total** | **31 indexed streams + floor** | **126,328** |

The independent verifier checks the EXE floor pointer at **0xcfbac + 7x4**, packed resource 31/offset 90488, and hashes the full original floor suffix. The cumulative gate checks every positive image extent in source order, exact floor adjacency, resource EOF and independent floor identity.

All fifteen earlier components and three floor representations retain geometry, source extents, indexed/mask buffers and RGBA hashes. The current cumulative gate excludes both standalone ARENA families from its original floor-only selection while continuing to require the same three prior floor records and exact raw floor bytes. Historical fixed-census scripts are retained unchanged.

## Implementation and tests

`src/core/assets/mk2ArenaTailSourceP35.ts` authenticates unique complete original EXE/GRA inputs by sizes/hashes, resource slot, original twelve-byte witnesses and contiguous bounds ending exactly at the native floor. The existing bounded native row decoder is unchanged. Invalid sources return UNAVAILABLE with no partial assets/packages.

Metadata retains native geometry, original descriptor addresses/byte lengths/anchor words and exact encoded extents. Diagnostic RGB equals source indices; alpha is 255*original command paint coverage. **`maskIsRuntimeAlpha=false`** and all-zero palette-known masks prevent claiming an observed runtime-alpha/palette interpretation. Setup qualification, native timing/world/full-scene and source-order-as-animation flags remain false.

Reference fixtures contain hashes/geometry/provenance, not artwork. Before-registry data is explicitly **OBSERVED_P34_COLLECTION_NOT_INDEPENDENT_SOURCE_GOLDEN**; independent original-file decoding authenticates the native output separately.

| Verification | Result |
|---|---|
| Focused adapter/reference/export checks | **413 checks PASS**, 16 originals / 99,721 pixels |
| Independent original rows/descriptors/floor pointer | **199,526 checks PASS** |
| Independent PNG/sidecar/provenance parity | **598,602 checks PASS** |
| Invalid original fixtures | **8 rejected**, no partial output |
| Re-CRC'd false exports | **6 rejected**: changed indices, valid wrong PNG, invented palette, invented animation, runtime-alpha claim and fabricated setup link; clean export reverified |
| Full current MK2 cumulative | **5,369 representations / 4,357 checks PASS** |
| Standard current MK2 runner | **21 suites PASS**; MK1/MK3 explicitly NOT_RUN this interim |
| Local checks | **378 TypeScript files / zero syntax errors**, TypeScript noEmit, Vite production build, new CJS syntax and whitespace diff PASS |

No extraction regression was observed. The existing Vite large-chunk warning remains. Package SHA-256: `262ed93f0176f4becaf70cd0437f10c522434dc2978d20385cca168224f00833`.

Earlier deterministic archives, source-order workflows, existing representations and FOREST/PIT/ARMORY byte partitions remain verified. [Machine-readable evidence](validation/P35_ARENA_ADDITIONAL_REGRESSION_2026-11-07.json).

## Reproduction

Keep outputs outside source and original fixtures:

```text
node scripts/verify-p21-checkpoint.cjs --mk2 <original-directory> --through p35 --report <private-report.json>
node scripts/verify-mk2-p35-arena-tail.cjs <original-directory> <private-adapter.json> <private-components.zip>
python scripts/verify-mk2-p35-arena-tail-independent.py <original-directory> --export <private-components.zip> --report <private-independent.json>
python scripts/test-mk2-p35-arena-tail-negative.py <original-directory> <private-components.zip> <private-negative-directory> --report <private-negatives.json>
```

The interim runner defaults to P35. P31/P26 and earlier checkpoint runners remain frozen to matching historical source and census.

## Confidence and consolidation boundary

**VERIFIED:** original descriptor geometry/anchors, native indexed data and command masks, independent exports, preserved earlier ARENA representations, floor pointer/bytes and complete native resource partition.

**UNKNOWN:** semantic roles/setup relationships, runtime activation, native palette/DAC ownership, native alpha, animation order/timing and world/inter-layer placement. No complete ARENA scene or new palette context is assigned.

**VALIDATION PENDING:** original-data browser preview/export actions. Source-only Chrome CI is separate. Latest full MK1/MK3 original-fixture evidence remains P31; P35 freshly reruns MK2. No fresh archive download/hash/re-extraction is claimed.

P32-P35 now form four recoverable interim passes adding **65 standalone representations** beyond P31: FOREST 9, PIT 28, ARMORY 12, ARENA 16. Next **P36**: assess fifth-pass consolidation with fresh three-game collection/export regression, independent rechecks of all **twelve P22-P35 families**, false-export controls, and complete committed-source audit. Use a current-census runner; preserve P31/P26 frozen records, the workbench and original-data/runtime uncertainties. Main promotion is not authorized by consolidation; keep main unchanged.


## Committed source and CI evidence

Source candidate: d96abd9f13cbb765b1f054d0bd22f647682d56e1; tree c39c7f77465f4c28c78488bcd779ab45e0d4326b. The complete GitHub tree was associated with that commit and independently compared with the tested checkout: **2,203 file blobs / 382 source files**, 88 raw matches and 2,115 checkout-newline-normalized matches; no missing, mismatched or unsafe paths. Inventory SHA-256: 43b406d9fdbcb7afd6ce015365ee0f37701f2378a3f22146b7a724672052bc05.

[GitHub CI run 42351941554](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42351941554) completed successfully on that exact source candidate. This provides source/build and source-only browser evidence; original-data browser validation remains pending. The subsequent evidence commit changes only this handoff, PROJECT_STATUS.md and the validation JSON; runtime source is identical to the audited CI candidate.

# P33 - standalone PIT components and preserved lower/upper/bridge provenance

Date: 2026-11-07. Second interim after P31. Baseline develop `d89fd77f224942b18a27d05af717e8128b2e4982`. Main remains P16.

## Outcome and counting boundary

The Asset Library exposes **28 complete PIT.GRA components individually**, with native dimensions, source indices, command paint masks and links to the existing P9 setup-local canvases. Package: `MK2_P33_PIT_28_ORIGINAL_COMPONENTS.zip`.

Current MK2 census: **5,341 unique representations**, up from 5,313. The observed P32 collection had **22 PIT records and 68 separate FALL records**, with **zero exact standalone matches** for these 28 PIT components by geometry/index/mask. All 90 earlier records are preserved. These apply existing O205/P9 research; **zero newly discovered artwork claims** are made.

PIT now exposes **42 original indexed streams**: 28 setup components plus fourteen already-available P10 bridge sprites. They partition all **69,384 PIT.GRA bytes** exactly. This is source-byte accounting, not complete stage assembly or native palette/timing verification.

## Resource boundaries and original evidence

Canonical MK2.EXE: 861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
PIT.GRA: 69,384 bytes; SHA-256 `af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96`.

- Obj2 base **0xa0c54**, eight-byte descriptor table **0x18bb0**, resource pool slot **32**.
- Twenty-eight contiguous streams cover **[0,61620)** / **108,352 indexed pixels**.
- Fourteen existing bridge streams cover **[61620,69384)** / **7,764 bytes / 6,272 pixels**. Both seven-entry lists at **0x18afc / 0x18b20**, terminal 1 and source back-pointers, are independently checked; existing source-order/timing qualifications are unchanged.
- P8 lower-wall/crack assets belong to **FALL.GRA, slot 123**, SHA-256 `60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0`. They are not relabeled as PIT.GRA components. P33 adds no FALL duplicates and preserves all 68 existing FALL records.
- PIT.GRA has no raw floor suffix under this partition; all 42 spans decode as indexed command streams. This does not generalize to other stage resources.

| Existing P9 setup | Obj2 offset | Source-local canvas | Controls |
|---|---|---|---:|
| 1 | 0x18b44 | 1400x64 | 10 |
| 2 | 0x18b56 | 1400x768 | 90 |
| 3 | 0x18b68 | 832x24 | 7 |
| 4 | 0x18b7a | 376x120 | 10 |
| 5 | 0x18b8c | 504x120 | 4 |
| 6 | 0x18b9e | 320x120 | 5 |

All **126 original controls** reference the 28 source descriptors. The original palette pointer table is **0x18d40**, with source-linked 81-word record **0x895ac**; slot selection does not establish a live DAC bank.

New standalone components reproduce the six existing indexed/mask canvases exactly: **1,328,768 cells**. Fifty-two placement bounding boxes extend outside their canvases; originals retain full geometry and source data rather than baking in a setup crop. These large source canvases are not game-screen geometry or final relative layer positions.

## Paint-mask semantics

New mask sidecars preserve **original command paint coverage**, not a newly verified runtime-alpha interpretation. Diagnostic PNG RGB=(index,index,index) and alpha=255*paint coverage are explicitly labeled. Palette-known masks remain zero; `maskIsRuntimeAlpha=false`. Painted index-zero cells were independently counted: **zero in these 28 originals**. This observation must not be generalized to other resources.

Existing P9/P10/P8 candidate-color previews, metadata and renderers are unchanged. Native palette ownership, activation, camera/inter-layer placement and timing remain separately qualified.

## Implementation and verification

`src/core/assets/mk2PitSourceP33.ts` authenticates unique complete original EXE/PIT entries by size/hash, resource slot, contiguous descriptor extents and six setup tables. It uses the unchanged bounded native row decoder and records `sourceSetupUses`, use/clipping counts and descriptor provenance. Invalid sources return UNAVAILABLE with no partial assets/packages.

All 28 records state `componentPreviouslyUsedInMosaics=true`, `newlyDiscoveredSourceImage=false`, `sourceTableOrderIsAnimation=false`, and native palette/timing/world/full-scene false flags. No bridge-frame duplication or unsupported grouping/timing is introduced.

Independent Python reads original descriptors, all six controls and both bridge lists, decodes the 42 native streams without the production decoder, and reconstructs source-local indexed/mask canvases. The TypeScript check reconstructs using new components plus existing P9 placements and compares byte-for-byte with existing P9 outputs. Before-registry data is labeled **OBSERVED_P32_COLLECTION_NOT_INDEPENDENT_SOURCE_GOLDEN**; independent original-file evidence authenticates decoding separately. Committed fixtures contain provenance/geometry/hashes, not artwork.

| Verification | Result |
|---|---|
| Focused component/export/canvas checks | **802 checks PASS**, 28 originals / 108,352 pixels |
| Independent original rows/controls/canvases/bridge evidence | **2,887,124 checks PASS** |
| Independent PNG/sidecar/provenance parity | **3,320,868 checks PASS** |
| Invalid source fixtures | **8 rejected**, no partial output |
| Re-CRC'd false exports | **6 rejected**: changed indices, valid wrong PNG, invented palette, invented animation, runtime-alpha claim, lost original setup link; clean archive reverified |
| Full current MK2 cumulative | **5,341 representations / 3,577 checks PASS** |
| Standard MK2 runner | **19 suites PASS**; MK1/MK3 explicitly NOT_RUN this interim |
| Local checks | **376 TypeScript files / zero syntax errors**, TypeScript noEmit, Vite production build, new CJS syntax and whitespace diff PASS |

The first false-animation control exposed a missing assertion in the new Python export verifier, while production metadata already stated false. P33's verifier now explicitly rejects animation-order, world-placement and runtime-setup claims as well as runtime-alpha claims. All six altered-export controls then pass. No native decoding regression was observed. The existing Vite large-chunk warning remains.

Deterministic package SHA-256: `2cfc7a6834292b4beb01eb324a0402e4d3b3bb8a5c9788b007c032c967581794`.

All ninety earlier PIT/FALL geometries/source extents/index/mask/RGBA hashes are enforced by the cumulative gate, alongside existing FOREST complete byte accounting and prior family exports. [Machine-readable results](validation/P33_PIT_COMPONENT_REGRESSION_2026-11-07.json).

## Reproduction

Keep reports/exports outside source and original fixtures:

```text
node scripts/verify-p21-checkpoint.cjs --mk2 <original-directory> --through p33 --report <private-report.json>
node scripts/verify-mk2-p33-pit.cjs <original-directory> <private-adapter.json> <private-components.zip>
python scripts/verify-mk2-p33-pit-independent.py <original-directory> --export <private-components.zip> --report <private-independent.json>
python scripts/test-mk2-p33-pit-negative.py <original-directory> <private-components.zip> <private-negative-directory> --report <private-negatives.json>
```

The interim runner defaults to P33. P31/P26 and earlier fixed-census checkpoint runners remain frozen to matching historical source.

## Confidence and next pass

**VERIFIED:** source component geometry, indices and command masks; original six-setup/126-control links; exact existing-canvas reconstruction; bridge source-list/index parity; preservation of earlier PIT/FALL records; complete 42-stream PIT byte partition.

**UNKNOWN:** live DAC ownership, runtime mask/alpha behavior, activation, native timing and final inter-layer/world placement. No complete Pit II scene or combined PIT/FALL placement is claimed.

**VALIDATION PENDING:** real-data browser preview/export actions. Source-only Chrome CI is separate. Latest full MK1/MK3 fixture evidence remains P31; P33 freshly reruns MK2. No fresh archive download/hash/re-extraction is claimed.

Next **P34**: audit ARMORY's **[116608,126336)** interval against existing descriptor evidence and current floor/component records, exposing independently qualified missing originals only. Keep the workbench intact and commits recoverable on develop. P36 remains the next fifth-pass consolidation assessment; main unchanged.


## Committed source and CI evidence

Verified source candidate: `caad71faf317fa1d6fd200c2c6fb70129c2729e6`; tree `b73e25e20be05fb7eed6a446e1bd8cdd2c942792`. Complete connector-retrieved source audit PASS: **2,185 committed blobs / 380 src files**, **86 raw byte matches + 2,099 normal checkout newline matches**, zero missing/mismatched/unsafe paths. Inventory SHA-256: `4935d6a1583a66bbb084276be24321355c06080b2a6d45c885d4870ed84f097b`. Runtime changes are limited to the new adapter and additive collection integration; existing research renderers and native row decoder are unchanged.

GitHub [source-build run 42349503704](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42349503704) completed **SUCCESS** on the exact source candidate: dependency installation, syntax, P31 source-only refusal controls, media guard, production build, TypeScript and headless Chrome startup **without game data**. This is separate from the original-fixture regression and pending original-data browser actions.

The following evidence-only commit changes this handoff, project status and machine-readable results. Application/tooling source is identical to the audited, CI-passing candidate. Main remains P16; original binaries and private artwork/ZIPs are excluded.

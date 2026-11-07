# P32 - nine additional FOREST originals and complete native byte partition

Date: 2026-11-07. First interim after P31. Baseline develop `f544781c53f6dc449b84d0e608acfbef668a7501`; main remains P16.

## Outcome and counting boundary

The Asset Library now previews and exports **nine additional original FOREST.GRA images**, filling the previously unqualified **[164752,198116)** interval. Evidence package: `MK2_P32_FOREST_9_ADDITIONAL_ORIGINALS.zip`.

Current MK2 census: **5,313 unique representations**, up from 5,304. The observed P31 collection contained **63 FOREST records and zero exact standalone matches** for these nine images by geometry/index/opacity. All 63 are retained unchanged. This applies the existing O69/O110A twelve-byte descriptor format; **zero newly discovered artwork claims** are made.

FOREST now has **58 standalone indexed originals**, its existing five P7 canvases and floor representations. The chosen original indexed-stream decoding plus native floor accounts for **every byte of the 226,788-byte resource**, with no gaps/overlaps. This is a **native source-byte partition**, not proof of runtime activation, correct colors, animation, full stage composition or every possible alternate interpretation.

## Original evidence

Canonical EXE: 861,133 bytes; SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
FOREST.GRA: 226,788 bytes; SHA-256 `8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9`.
Obj2 physical base: **0xa0c54**; resource pool slot: **27**.

A four-byte-aligned original EXE probe, restricted to resource 27 and this GRA interval with O69 dimension/anchor bounds, found nine eligible twelve-byte descriptors. An independent verifier reads their original addresses and decodes the streams again without the production decoder.

| Ordinal | Obj2 descriptor | Native dimensions | GRA source interval |
|---|---|---|---|
| 0 | 0x16f14 | 64x64 | [164752,169012) |
| 1 | 0x16f24 | 64x64 | [169012,173184) |
| 2 | 0x16f30 | 64x64 | [173184,177328) |
| 3 | 0x16f3c | 64x64 | [177328,181460) |
| 4 | 0x16f48 | 64x64 | [181460,185624) |
| 5 | 0x16f54 | 64x64 | [185624,189776) |
| 6 | 0x16f60 | 64x64 | [189776,193860) |
| 7 | 0x16f6c | 25x89 | [193860,195696) |
| 8 | 0x16f7c | 25x89 | [195696,198116) |

These streams occupy **33,364 encoded bytes / 33,122 indexed pixels**. Each descriptor retains its original signed anchor words (all zero here). Descriptor addresses have twelve/sixteen-byte spacing; no uniform stride or meaning is invented for adjacent words.

The independent verifier also parses all **60 controls across five original P7/O196/O197 setups**, confirms their 43 distinct descriptor references, and verifies that **none reference these nine descriptors**. Empty `sourceSetupUses` means no link to those five setups; it does not assert universal non-use. Similar dimensions, adjacency and ordered source offsets do not establish animation or timing.

## Verified source-byte partition

| Region | Decoder / retained output | Bytes |
|---|---|---:|
| [0,164752) | 49 existing P30 indexed streams | 164,752 |
| [164752,198116) | Nine P32 indexed streams | 33,364 |
| [198116,226788) | Original 896x32 native floor | 28,672 |
| **Total** | **58 indexed streams + native floor** | **226,788** |

The cumulative gate checks every positive image extent in order, exact floor adjacency, complete original resource length and independent floor hash. P30's 49 originals, ten P7 layer previews and four floor representations retain dimensions, source provenance, indexed/opacity planes and RGBA hashes. Existing mosaic/effect/source-order workflows and deterministic family archives are preserved.

## Implementation and verification

`src/core/assets/mk2ForestTailSourceP32.ts` requires unique complete original EXE/GRA entries, exact sizes/hashes, source resource identity and contiguous authenticated twelve-byte descriptor extents. It uses the unchanged bounded native row decoder and rejects any stream crossing the native floor. Invalid sources return UNAVAILABLE with no partial assets/packages.

New records retain source geometry, indices, opacity, descriptor byte length/addresses and anchor words. `sourceSetupCoverageScope` explicitly names the five O196/O197 setups. Diagnostic RGB equals the source index; alpha equals source opacity; palette-known masks remain zero. `newlyDiscoveredSourceImage=false`, `sourceTableOrderIsAnimation=false`, `worldPlacementKnown=false` and palette/timing/full-scene false flags prevent unsupported interpretation.

Reference fixtures contain hashes, geometry and provenance, not artwork. The before-registry observation is explicitly **OBSERVED_P31_COLLECTION_NOT_INDEPENDENT_SOURCE_GOLDEN**; independent original-file evidence authenticates decoded data separately.

| Verification | Result |
|---|---|
| Focused adapter/reference/export checks | **227 checks PASS**, nine originals / 33,122 pixels |
| Independent original descriptors/rows/P7 references | **66,355 checks PASS** |
| Independent PNG/sidecar/provenance parity | **198,951 checks PASS** |
| Invalid original fixtures | **8 rejected**, no partial output |
| Re-CRC'd false exports | **5 rejected**: changed indices, valid wrong PNG, invented palette, invented animation claim and fabricated P7 link; clean archive reverified |
| Full current MK2 cumulative | **5,313 representations / 2,558 checks PASS** |
| Standard current MK2 runner | **18 suites PASS**; MK1/MK3 explicitly NOT_RUN this interim |
| Local checks | **375 TypeScript files / zero syntax errors**, TypeScript noEmit, Vite build, new CJS syntax and whitespace diff PASS |

No extraction regression was observed. The existing Vite large-chunk warning remains. Deterministic archive SHA-256: `19635b71abd3de358b2aeff2c70462bf29ffa4ca943866ff6acdd9de319f1c65`.

[Machine-readable results](validation/P32_FOREST_ADDITIONAL_REGRESSION_2026-11-07.json). The interim runner defaults to `--through p32`. P31/P26 checkpoint runners remain frozen to their historical source/census and must not be applied to newer counts.

## Reproduction

Keep private outputs outside the repository and original fixture:

```text
node scripts/verify-p21-checkpoint.cjs --mk2 <original-directory> --through p32 --report <private-report.json>
node scripts/verify-mk2-p32-forest-tail.cjs <original-directory> <private-adapter.json> <private-components.zip>
python scripts/verify-mk2-p32-forest-tail-independent.py <original-directory> --export <private-components.zip> --report <private-independent.json>
python scripts/test-mk2-p32-forest-tail-negative.py <original-directory> <private-components.zip> <private-negative-directory> --report <private-negatives.json>
```

## Confidence and next pass

**VERIFIED:** nine original descriptor geometries/anchors, exact indexed/opacity data and exports, absence from the five existing setup references, preservation of previous FOREST records and complete native source-byte partition under these decoders.

**UNKNOWN:** roles and activation of additional originals, live palette/DAC ownership, native timing, animation order and world/inter-layer placement. Complete byte accounting does not qualify a full stage or strengthen existing candidate-color previews.

**VALIDATION PENDING:** original-data browser preview/export actions. Source-only Chrome CI is separate. P31 remains the latest fresh full MK1/MK3 checkpoint; this interim freshly reruns MK2. Existing authenticated extracted fixtures were used; no fresh archive download/hash/re-extraction is claimed.

Next **P33**: audit PIT descriptor/component coverage against existing lower-wall, upper-layer and bridge assets before exposing useful missing originals. Apply existing verified research and preserve relationships; avoid speculative gameplay/scene work. Continue recoverable develop commits. P36 is the next fifth-pass consolidation assessment after four interim passes; main remains unchanged.


## Committed source and CI evidence

Verified source candidate: `c50dcd37c0e639c48cbe2387335d6cf6c5269d9b`; tree `77d62aaa069e20f90a46a6546d23237550777c42`. Full connector-retrieved source audit PASS: **2,176 committed blobs / 379 src files**, **85 raw byte matches + 2,091 normal checkout newline matches**, zero missing/mismatched/unsafe paths. Inventory SHA-256: `4e73ca2d0612cc86f2d690d76877b0f4e534778876d4833ba5cdfe3171b1fe42`. Runtime changes are limited to the new adapter and additive collection integration; no research renderer or native row decoder changes.

GitHub [source-build run 42348440265](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42348440265) completed **SUCCESS** on this exact source candidate: dependency install, syntax, P31 source-only refusal controls, media guard, production build, TypeScript and headless Chrome startup **without game data**. This is separate from the original-fixture regression and pending original-data browser actions.

The following evidence-only commit changes project status, this handoff and machine-readable results. Source is identical to the audited, CI-passing candidate. Main remains P16; original binaries and private artwork/ZIPs are not committed.

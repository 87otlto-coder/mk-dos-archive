# MK DOS Archive — Handoff — Pass 1E.3O.18 Animation Resource Decode Census

Date: 2026-09-29

## Status

**STATICALLY VERIFIED AGAINST AUTHENTIC COMPLETE MK1 INSTALLATION / NORMAL-APP INTEGRATION IMPLEMENTED / USER NORMAL-APP EXPORT NOT REQUIRED FOR THE CORE BYTE-LEVEL CLAIM**

Direct verdict:

`MK1_ANITAB_DESCRIPTOR_RESOURCE_DECODE_GRAPH_ESTABLISHED`

O18 is a read-only, export-first pass. It takes the O17 cross-table animation/descriptor graph and resolves every reached descriptor against the original GRA payloads from the user's complete untouched MK1 installation. It does not modify `MK1.EXE` or any GRA file, does not infer palette ownership from decode compatibility, and does not claim every discovered frame has independently verified runtime semantics.

## Authentic installation fixture

User-supplied archive:

- archive: `mk1.zip`
- SHA-256: `27123ee97d8d8a63e0cfd2debd040409763ef1e017f93379fbf7d9bde70ee6cb`
- archive entries: 329
- regular files: 326
- root: `mk1/`

Canonical executable inside the archive:

- `mk1/MK1.EXE`
- size: **1,157,222 bytes** (`0x0011A866`)
- SHA-256: `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`

This independently confirms that the supplied installation contains the canonical executable used throughout the established MK1 research.

## Research question

O17 established a broad executable-side graph:

`_ANITAB table -> animation stream -> frame target -> descriptor(s) -> packed FileID/GRA offset`

O18 asks the next export-critical question:

> Do all 1,102 unique descriptors reached by the O17 graph actually resolve into the supplied original GRA files and decode correctly with the already-established uGRA decoder?

This is deliberately separated from palette assignment. Successful indexed-pixel decode does not prove which palette belongs to a body/effect/animation context.

## Resource reconciliation

The O17 graph references 12 GRA resources. All 12 are present in the supplied installation and their sizes match the existing inventory/handle evidence.

Observed authentic resource hashes:

| Resource | SHA-256 |
|---|---|
| `GRAPHICS/EMP.GRA` | `d1c0eba40ceb046f47295e0e162ed4771e7d5876f3eeca00aa3f4943e63df704` |
| `GRAPHICS/FONTS.GRA` | `9a917aa179ac7b16be009d9bba9dc7532327f06f78c64e91c91f206c9f1914a4` |
| `GRAPHICS/GGORO.GRA` | `de0afe60c8d9aa2bdad2475f47b9a13c91717a0f55f744542594b84b961f3fbf` |
| `GRAPHICS/KANG.GRA` | `3ec5ae947bb00866d2a5037999a26147d7dfa38036799e850b30ee2bbfaa9984` |
| `GRAPHICS/KANO.GRA` | `5b32513ed4fd5363f6aab56a9f2493b96ffbe331593297a277d4aac5fbbd9390` |
| `GRAPHICS/LIZ.GRA` | `f478a4afde19a9166f3d65dd2581e8932822e300f0fbedda867d5e98bfa5b741` |
| `GRAPHICS/MISC.GRA` | `2aacd1389e687b2e895d24d92ce0e80d573a8ccc80d4dc9b72082a01506ab486` |
| `GRAPHICS/NINJA.GRA` | `be17fa53c7e06a38352b89821cb0abbef37a8ce64ef2b502da93606a1547da05` |
| `GRAPHICS/RAIDEN.GRA` | `950270fe55130fcd7fa4ab9e011b81137aa189bd0d8b5331ad1b39fa845448ec` |
| `GRAPHICS/STANCE.GRA` | `5d4722d9ec4c093d3a239bb7651ef88e2766c36e94b36f6074ca4bc86db72ae6` |
| `GRAPHICS/VANDAN.GRA` | `ff3406cd1299a966fbea72b8ef50cb45e254de131d4e3f7f359a19aa9eacde6a` |
| `GRAPHICS/VICTORY.GRA` | `239b974cfe3624407cb087022e4d7a962b59206e887e5216c5f321eb2b55c43f` |

Representative installation sizes include:

- `KANO.GRA`: 595,504 bytes;
- `RAIDEN.GRA`: 635,184 bytes;
- `NINJA.GRA`: 591,928 bytes;
- `LIZ.GRA`: 540,464 bytes;
- `VANDAN.GRA`: 563,812 bytes;
- `KANG.GRA`: 453,820 bytes;
- `GGORO.GRA`: 432,184 bytes;
- `EMP.GRA`: 228,804 bytes;
- `MISC.GRA`: 104,444 bytes.

## Decode census result

Direct execution against the authentic installation produced:

- O17 unique descriptors attempted: **1,102**;
- descriptors decoded successfully: **1,102**;
- decode failures: **0**;
- authentic GRA resources used: **12**;
- total opaque pixels reconstructed: **2,173,248**;
- total encoded GRA bytes consumed by the descriptor decodes: **3,637,292**;
- total uGRA decoder commands: **467,005**.

The established Kano anchor is independently reproduced:

- `KANO.GRA` offset 0;
- descriptor dimensions: 58 x 104;
- indexed-pixel checksum: `09961980`;
- expected checksum match: **true**.

This is important because O18 is not merely reporting that the decoder returned output; it reproduces an already-established canonical decoder fixture while scaling the same decoder across the O17 graph.

## Opaque pixel-index domain

Across all 1,102 decoded descriptors:

- minimum opaque palette index: **1**;
- maximum opaque palette index: **23**;
- union: **1..23 exactly**;
- all opaque indices are positive: **true**;
- no opaque index exceeds 23: **true**.

This materially broadens the observed one-based opaque index domain beyond the earlier Kano-only evidence.

It does **not** establish a universal palette owner. A decoded sprite accepting indices 1..23 only establishes indexed-pixel compatibility. The animation/effect/object context must still identify the correct 23-color palette record.

## Multi-part composition coherence

O17 found 25 multi-part frame records across five ANITAB tables:

- GORO;
- KANG;
- KANO;
- LIZ;
- VANDAN.

O18 resolves and decodes every part of all 25 records against the authentic GRA payloads.

For every pair of parts in every multi-part record, the decoded opaque bounding boxes overlap after applying descriptor-local signed X/Y placement.

This is strong independent structural corroboration that these descriptor vectors are intended as composed visual frames rather than unrelated pointer lists. It is not promoted to individual runtime verification for all 25 frames.

## What O18 establishes

**STATICALLY VERIFIED against authentic installation bytes:**

- all O17-reached descriptors have authentic resource backing;
- all 1,102 decode successfully through the established uGRA decoder;
- the known Kano decoder anchor is reproduced;
- the broad opaque index domain is 1..23 for this discovered graph;
- all 25 multi-part frame candidates are resource-backed and spatially coherent under descriptor-local X/Y;
- the executable-side O17 graph can now be connected to actual indexed image data.

**Not established:**

- the correct palette for every descriptor or animation context;
- correct-color PNG output for the entire graph;
- semantic animation names for every table index;
- frame timing beyond already-qualified command semantics;
- that every decoded descriptor is reached in ordinary gameplay;
- MK2/MK3 format parity;
- GRA encoding/import.

## Why palette binding is now the critical export boundary

The remaining problem is not basic sprite decoding. The same resource can participate in different palette contexts.

Known counterexample: `RAIDEN.GRA` contains ordinary Rayden body sprites associated with Rayden body palettes, while the qualified lightning descriptors use `MORPH_P`. Likewise, the Kano heart effect uses `MISC.GRA` with `BLOOD_P` rather than Kano's body palette.

Therefore a product-quality exporter must attach palettes through animation/object/setup context, not simply assign one palette per GRA file.

## Source changes

Added:

- `src/games/mk1/research/animationResourceDecodeCensus.ts`
- `scripts/run-animation-resource-decode-census.mjs`
- this handoff

Integrated into `ResearchQuickActions` as stage 27 in the later O19 source.

Report format:

`mk1_animation_resource_decode_census_v1`

Direct machine evidence:

`o18_direct.json`

## Validation

All ten direct checks passed:

1. O17 prerequisite;
2. every referenced GRA present;
3. every referenced GRA size matches;
4. every O17 descriptor decodes;
5. established Kano decoder anchor reproduced;
6. opaque index domain strictly positive;
7. opaque index domain <=23;
8. multi-part resource backing complete;
9. multi-part opaque bounds coherent;
10. scope boundary preserved.

No runtime test is required for these byte/resource decode claims.

## Recommended continuation

The next useful task is to connect the broad structural graph to stable character identity and then to palette context. Do not generate bulk "correct color" exports merely by choosing palettes based on GRA filenames.

# P22 — original CAVE.GRA indexed images

Date: 2026-11-06. First interim pass after the P21 develop checkpoint `05f5a02593e1b9dfbdf7800dbf9c0ec2a7556bf9`. Main remains P16.

## Practical improvement

The Asset Library now exposes **49 original CAVE.GRA images**, at their descriptor-backed native dimensions, with grayscale index-value previews, exact indexed/transparency exports and an explicit all-zero native palette-known mask. The family is discoverable as sprites and exported through the existing PNG/selected-ZIP controls. Coverage & evidence offers `MK2_P22_CAVE_49_ORIGINAL_INDEXED_IMAGES.zip`.

**Fresh complete MK2 collection: 5,167 unique representations**, up from 5,118. No previous asset family, decoder, evidence package or research implementation was removed. No UI redesign was needed. Actual browser clicking of this family is still validation pending.

## Coverage reconciliation

P22 scanned the complete P21 collection and counted resource-backed records by the final basename of `asset.source.path`. CAVE had **zero** registered images despite O110A's 49 original eight-byte descriptor witnesses. These counts mix different representations and must not be read as unique streams, coverage percentages, or missing-image totals.

| Original resource | P21 registered representations |
|---|---:|
| PORTAL | 29 |
| ARMORY | 3 |
| FOREST | 14 |
| TOMB | 28 |
| TOWER | 11 |
| ARENA | 3 |
| VFRAME | 0 |
| BATTLE | 3 |
| CAVE | 0 |
| FONTS | 0 |
| PLAYSTA | 0 |
| PROBE | 30 |
| ACCLAIM | 1 |
| MONKS | 0 |

Only CAVE is integrated in P22. VFRAME/PLAYSTA alternatives remain ambiguous; font geometry and MONKS image semantics are not promoted. Other source families require separate deduplication and original-file qualification before extending a reusable mechanism.

## Original-source evidence

- Original MK2 EXE SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Original CAVE.GRA: **57,312 bytes**, SHA-256 `11e7988cabae63c8ee618700da47de648ef3bb1d9f7f8a8b23332c0513c83cb7`.
- Resource filename-pool slot **29** is `CAVE.GRA`. Object-2 table **0x18260**, physical image base **0xA0C54**, **49 eight-byte `<width,height,packed resource/offset>` records**. This applies existing O110A research, not a newly invented format.
- All 49 original streams form an exact contiguous **[120,57312)** suffix: **57,192 encoded bytes / 49,765 indexed pixels**. The first **120 bytes remain outside the image qualification**. No fabricated dimensions or image ownership are assigned to that prefix.
- Adapter authentication requires one original EXE and one original GRA, exact lengths and full pinned hashes. It rejects synthetic, missing, ambiguous, mutated or truncated inputs and exposes no partial assets/package on failure.
- Previews use `RGB=(index,index,index)`, alpha from original opacity. Original numeric indices/masks are retained unchanged. All native palette-known masks are zero. Table ordinal is provenance, explicitly **not animation order**.

## Fresh verification

| Test | Result |
|---|---|
| Independent Python original-table/row decoder | 49 images and exact contiguous suffix; hash-only reference generated from original files |
| TypeScript adapter/reference/export suite | **862 checks PASS**, including eight negative fixture cases |
| Independent Python PNG/sidecar readback | **299,427 checks PASS**, all 49 PNGs and all three sidecars against original-file decoding; PNG CRC, zlib and row-filter reconstruction independent of TypeScript |
| Falsified export controls | Three rejected: altered index bytes with valid ZIP CRC, altered PNG pixels with valid PNG/ZIP CRC, invented palette ownership; clean export reverified afterward |
| Full P22 cumulative gate | **5,167 unique assets / 689 checks PASS**; includes retained P20 checks and original P8–P10/P13–P15 package identities |
| Consolidated runner, through P22 | **10 MK2 suites PASS**, including all seven previous focused suites (**818,695 checks**) and 642 input-identity checks |
| Local source checks | 366 TypeScript source files / zero syntax errors, TypeScript, production build and three verifier syntax checks PASS; existing large Vite chunk warning retained |

The source fixtures and private ZIP/negative controls were written outside the repository. Git contains reference hashes/geometry, source, tests and reports only. No original artwork, game bytes, generated PNGs or ZIPs are committed.

An initial independent PNG check could not import Pillow in this runtime. It was replaced with a standard-library RGBA8 PNG reader supporting all five row filters, zlib and CRC checks; the successful independent readback and falsification results above use that reader. This was a test-environment dependency issue, not a source decoding failure.

Machine-readable results: [P22 verification](validation/P22_CAVE_REGRESSION_2026-11-06.json).

**Committed source candidate:** `2272c00f2ef636dbd08b9d717ad9fbdd0fe786fe`, tree `ad57d8af3dc8890702ee92f3b085ac31532c66f2`. All 14 changed/added files match local Git blob hashes. The complete tree has **2,097 tracked file blobs / 370 src files**, no removed paths and no reviewed original-game/media/archive extensions. Research implementation is unchanged; runtime changes are the additive CAVE adapter and collection registration.

**GitHub CI PASS:** [run 42285496421](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42285496421) completed successfully on `2272c00`: strict locked dependency install, source/new CJS syntax, media guard, Vite production, TypeScript, source-offline headless Chrome startup and build upload. It does not include commercial fixtures or prove original-data browser clicks.

## Reproduce

```powershell
node scripts/verify-mk2-p22-cave.cjs <MK2-dir> adapter.json private-cave.zip
python scripts/verify-mk2-p22-cave-independent.py <MK2-dir> --export private-cave.zip --report independent.json
python scripts/test-mk2-p22-cave-negative.py <MK2-dir> private-cave.zip <private-output-dir>
node scripts/verify-p21-checkpoint.cjs --mk2 <MK2-dir> --through p22 --report regression.json
```

Keep all outputs outside original game directories and outside the Git checkout. The checkpoint runner now defaults to P22; frozen P20/P21 cumulative scripts keep their historical 5,118 expectation. `--through p21` is an explicit historical-source option, not a way to waive the current census. Optional MK1/MK3 paths remain supported.

## Confidence and next step

**VERIFIED:** original source indices/transparency/native geometry, descriptor provenance, exact suffix coverage, exported PNG/sidecar parity, additive cumulative census and preserved earlier MK2 tests.

**UNKNOWN:** native palette assignment, human stage ownership, world placement, original animation order/timing and complete stage composition. CAVE is a source filename, not a newly authenticated arena identity.

**VALIDATION PENDING:** actual original-data browser interaction. Fresh MK1/MK3 fixture tests were not repeated in P22; their P21 results remain historical. Fresh MK2 archive-level download/hash/re-extraction remains unverified; this pass uses the existing extracted fixture with directory identity checks plus complete CAVE/EXE hashes.

Next P23: audit the original ARMORY eight-byte descriptor family against current registrations; integrate only independently verified missing images while preserving the native floor and prior evidence. Reuse common handling only after independent repetition. Keep this interim pass on develop, preserve P21, and do not promote main or package a full source release.

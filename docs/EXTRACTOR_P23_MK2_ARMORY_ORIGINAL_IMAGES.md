# P23 — original ARMORY.GRA indexed images

Date: 2026-11-06. Second interim pass after P21; baseline P22 `004df004b5e1572c8bd1c073fc9651fd8aed5c74` on develop. Main remains P16.

## Outcome

Added **18 original descriptor-backed ARMORY.GRA images** to the Asset Library's existing sprite preview and PNG/selected-ZIP workflows. Coverage & evidence now includes `MK2_P23_ARMORY_18_ORIGINAL_INDEXED_IMAGES.zip`. Current original-MK2 collection: **5,185 unique representations**, up from P22's 5,167. The earlier three ARMORY floor representations and their original bytes remain available unchanged.

Native source indices, opacity, dimensions and descriptor provenance are preserved. Grayscale is a diagnostic index-value display; native palette-known masks remain all zero. No stage composition, native animation order, timing, world position or palette ownership is assigned.

## Source and coverage evidence

- Canonical EXE SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- Original ARMORY.GRA: **176,512 bytes**, SHA-256 `fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612`.
- Original filename pool slot **26**, Object-2 image base **0xA0C54**, descriptor table **0x1695C**, **18 eight-byte records**. These apply the existing O110A descriptor qualification.
- Independent original-file decoding finds **156,767 indexed pixels** and a gapless original image prefix **[0,116608)**: **116,608 encoded bytes**. All eighteen source offsets are distinct; no duplicate image representation was added for repeated witnesses.
- The three prior ARMORY entries represent original floor data beginning at **126336**. P23's cumulative gate explicitly retains all three and compares the raw uncropped floor bytes against original ARMORY.GRA **[126336,176512)**.
- The **59,904 bytes outside this image prefix are not newly classified by P23**. They include the existing 50,176-byte floor plus 9,728 intervening bytes. Outside this family does not mean globally unqualified or unpreserved in earlier research.

## Bounded reuse and preservation

After independent original-file repetition on CAVE and ARMORY, P23 extracts only the native row decoder into `mk2NativeIndexedRows.ts`. Resource hashes, descriptor selection, extents and confidence metadata remain separately pinned in the two adapters. This is not a universal descriptor-table scanner or an assertion that every resource shares the same semantic ownership.

The CAVE adapter's source/metadata/export behavior is unchanged: all **862 focused checks** still pass, and its evidence ZIP remains SHA-256 `e7c407cd1727b003387eb95c91a7e5a131c3eed0c5967fb1d7761ee3f81e9745`. Existing research implementation is untouched.

## Fresh verification

| Gate | Result |
|---|---|
| Independent Python original ARMORY decoder | 18 exact original streams / 156,767 pixels; hashes/geometry reference only |
| ARMORY adapter/reference/export suite | **335 checks PASS**, including eight synthetic/missing/duplicate/corrupt/truncated input controls |
| Independent original-file PNG/sidecar readback | **940,912 checks PASS**, all 18 PNGs, original index/opacity and zero palette-known sidecars |
| False export/claim controls | Three rejected with valid ZIP/PNG CRCs: mutated indices, wrong PNG pixels, invented palette ownership; clean export reverified |
| CAVE preservation | **862 checks PASS**, original evidence ZIP identity unchanged |
| Full current cumulative regression | **5,185 unique assets / 734 checks PASS**, including original ARMORY floor bytes and retained earlier archive identities |
| Current checkpoint runner | **11 MK2 suites PASS**: input identity, current cumulative, ARMORY, CAVE, and seven earlier focused suites (**818,695 checks**) |
| Local source checks | **368 TypeScript files / zero syntax errors**, TypeScript, production build, verifier syntax and diff-whitespace checks PASS; existing Vite large-chunk warning remains |

The Python reference decoder is independent of the TypeScript implementation. It reuses P22's independent standard-library PNG/CRC/row-filter reader for export checks, not TypeScript output as a source reference. ARMORY evidence ZIP SHA-256: `7e5870cdeebf6c17c36a50024592115a1e3172b4a299f379e234ace86ed410ac`.

[Machine-readable P23 results](validation/P23_ARMORY_REGRESSION_2026-11-06.json). All generated artwork, source fixtures, export ZIPs and falsification ZIPs remain outside GitHub. Committed fixtures contain geometry and hashes only.

## Reproduce

```powershell
node scripts/verify-mk2-p23-armory.cjs <MK2-dir> adapter.json private-armory.zip
python scripts/verify-mk2-p23-armory-independent.py <MK2-dir> --export private-armory.zip --report independent.json
python scripts/test-mk2-p23-armory-negative.py <MK2-dir> private-armory.zip <private-output-dir>
node scripts/verify-p21-checkpoint.cjs --mk2 <MK2-dir> --through p23 --report regression.json
```

Use output locations outside original game directories and the Git checkout. The checkpoint runner now defaults to P23; earlier `--through` choices require the matching historical source and do not waive the current census. Older cumulative scripts retain their historical expectations.

## Confidence and continuation

**VERIFIED:** original descriptor geometry/indices/opacity, contiguous image-prefix extent, independent export parity, original floor preservation, CAVE byte parity and cumulative additive integration.

**UNKNOWN:** runtime palette ownership, original image animation order/timing, live position, stage identity and complete stage composition. ARMORY names the original source file, not a new gameplay-scene attribution.

**VALIDATION PENDING:** original-data browser clicking/import/export. Source-only Chrome CI is separate. MK1/MK3 were explicitly not freshly fixture-regressed in P23; their P21 results remain historical. This pass uses the existing extracted MK2 fixture; no fresh archive-level download/hash/re-extraction is claimed. The directory identity suite and full original EXE/ARMORY/CAVE hashes retain their stated scope.

Next P24: audit BATTLE's descriptor family, preserving repeated original witnesses while deduplicating genuinely identical source intervals before deciding what to expose. Do not equate the historical 40 descriptor witnesses with 40 new unique images. Continue on develop; preserve P21, keep main unchanged, and defer full-source packaging to the consolidation gate.

# P65 — MK1 original ANITAB indexed animation-stream export (fourth interim pass)

Date: 2026-11-08. Branch: `develop` only; `main` stays P16. P61 is the last fresh full original MK1/MK2/MK3 consolidation (17,211 asset representations). P62 original MK1 WAV, P63 original MK3 WAV and P64 original MK2 score provenance each have separately accepted focused original-fixture evidence.

**Status: P65 SOURCE-ONLY CI PASS; P65 focused user-local original-MK1 ZIP/source-pointer fixture PASS.** No runtime clip durations, colour assignments or playback claims.

## Observe — extraction gap and existing trusted evidence

- MK2 already exports **eight original source-list groups / 57 frames** (P18), loads the qualified source order into a user-controlled presentation queue (P19), and exports independently checked presentation-only APNGs (P47). More APNG refinement would be duplicative.
- MK3 exports **416 original embedded-CMAP IFF images** with provenance but stage and animation grouping remain unknown. Treating file order as a native animation would invent relationships.
- MK1 has stronger original executable source-chain evidence: **eight O17 `*_ANITAB` tables / 739 table entries / 514 unique executable animation stream starts**, O18's **1,102 decoded original sprite descriptors**, and O60's *lossless original indexed/paint-mask planes*. O26 records source control events, 514 unique streams and the source-side dwell consumer surface; it explicitly does **not** establish native milliseconds, universal per-animation frame pacing or gameplay names.
- The MK1 Asset Library already offers individual PNG palette-context variants and an `MK1_animations_evidence.zip`, but a user still has to reconstruct ANITAB → stream → frame target → descriptor plane associations manually across large separate reports and binaries. **P65 makes this already verified structural extraction consumable as one machine-readable source package.**

## Implement — preservation-first export

- `src/core/assets/mk1AnitabIndexedStreamsP65.ts` builds **`MK1_P65_INDEXED_ANITAB_SOURCE_STREAMS.zip`** from the existing O17/O18 research results and the O60 animation ZIP. It strictly checks canonical MK1.EXE identity `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`, verified O17 grammar and O18 source decodes, eight tables, 739 original cells, 514 globally distinct source-stream starts, 1,102 source descriptors and exact O60 descriptor/plane manifest layout, geometry, decode checksums and all binary paint masks. Invalid joins do not produce a plausible partial export.
- The **four-file ZIP** contains:
  1. `manifests/mk1_source_streams.json`: original executable table cells and classifications, source stream instruction order, source loop/END/branch/control events, frame-target descriptor pointer vectors, descriptor keys and original physical/source-relative byte offsets, with UNKNOWNs explicitly intact.
  2. `indexed/descriptor_manifest.json`: **byte-identical** original O60 manifest mapping each `tableSymbol:descriptorWatcomOffset` to original `GRAPHICS/*.GRA` resource, geometry, source index/mask byte ranges and decode checksum.
  3. `indexed/descriptor_pixels.bin`: **byte-identical** O60 original indexed pixels and opacity masks.
  4. `README.txt`: interpretation and reconstructability contract, explicitly rejecting runtime palette/timing, native sequence traversal assumptions and multipart Z-order guesses.
- `src/core/assets/mk1Pipeline.ts` exposes its **existing** O18 report to collection integration; no research decoder or investigator is rewritten. `src/core/assets/collection.ts` adds the new evidence archive under Coverage & evidence, adds a clear P65 report and reports `UNAVAILABLE` with its exact error if original source joins fail. Existing MK1 assets, their IDs and existing evidence packages are left untouched: expected **2,656 MK1 assets**, with **zero additional registered asset representations**. The separate research workbench stays intact.
- `scripts/test-p65-mk1-anitab-streams.cjs` produces a source-free synthetic eight-table/739-cell/514-stream/1,102-descriptor model, verifies the exact original indexed manifest/binary byte copies and source event/part pointer records, and rejects **15** falsely joined, corrupted, missing or overclaimed inputs.
- `scripts/verify-mk1-p65-anitab-streams.cjs` is the original-fixture acceptance runner: scans the entire authentic MK1 installation, checks 2,656 existing assets and P65 export, reopens the P65/O60 ZIPs, verifies indexed payload byte identity, and independently reads **original MK1.EXE** dwords/words for every exported ANITAB entry, stream frame opcode, source control command, jump/callback, source part vector and descriptor location/geometry. It refuses to equate original executable instruction encounter order with a verified gameplay animation playback order.

## CI — VERIFIED

**[GitHub Actions 42465219190](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42465219190) SUCCESS** at source/workflow SHA `42820eb9a0a626f03ef5bc6e44a77fa80fa8ee30`: all **15 synthetic P65 false-evidence refusals**, syntax checks including original-fixture runner, preceding P62–P64 and historical source-only controls, source guard, TypeScript, production Vite build and offline Chrome startup. Original game files are not available in CI; this **does not** constitute P65 integrated original-MK1 acceptance or source-backed browser download.

**Original input identity — separately verified:** the user's privately attached `mk1.zip` contains `mk1/MK1.EXE` of 1,157,222 bytes with canonical SHA-256 `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14`. This authentic input check is not a fresh run of the complete updated extractor.

## Original-MK1 integrated acceptance — focused fixture PASS

The user supplied a terminal screenshot showing `scripts/verify-mk1-p65-anitab-streams.cjs` returning `status: "PASS"` against their local original MK1 fixture. The reported results are transcribed below.

| Verifier field | User-local result |
| --- | ---: |
| `mk1Assets` | 2656 |
| `originalTables` | 8 |
| `verifiedAnitabCells` | 739 |
| `uniqueOriginalSourceStreams` | 514 |
| `sourceInstructionFrameOccurrences` | 1824 |
| `sourceInstructionControlOccurrences` | 786 |
| `indexedDescriptorRecords` | 1102 |
| `indexedSourceFramePartsVerified` | 1853 |
| `distinctLinkedDescriptorKeys` | 1102 |
| `originalExecutableOpcodesAndPointersMatched` | true |
| `originalO60IndexedBytesByteIdentical` | true |
| `noOriginalPaletteOrTimingAssigned` | true |
| `fullThreeGameRegressionPerformed` | false |
| `browserPackageDownloadVerified` | false |

### Local reproduction

Use the complete updated `develop` checkout and original DOS installation (not the commercial ZIP inside Git):

```powershell
cd "C:\Users\87otl\mk-dos-extractor"
git switch develop
git pull --ff-only origin develop
node scripts/verify-mk1-p65-anitab-streams.cjs `
  "E:\GOG\Games\Mortal Kombat\mk1" `
  "C:\Temp\mkdos-p65-results.json"
```

The user can additionally browse **Asset Library → Coverage & evidence** for `MK1_P65_INDEXED_ANITAB_SOURCE_STREAMS.zip`. Actual original-browser download and inspection remain separate from the headless original-fixture gate.

## Confidence limits and P66 handoff

**VERIFIED:** existing authentic O17/O18/O60 source mechanisms; synthetic P65 adapter joining and all fifteen refusals; source-only CI, type check/build; canonical user-provided MK1.EXE fingerprint; user-local P65 package and original-executable readback (screenshot-reported PASS).

**VALIDATION PENDING:** actual local browser package download, UI animation playback; new full three-game cumulative regression.

**UNKNOWN / not asserted:** frame milliseconds/FPS or per-animation MFRAMEW dwell, whether every table stream is selected in original gameplay, gameplay event names, arbitrary `*_ANITAB` stream traversal order after jumps, native runtime palette selection, cross-resource actor Z order, sprite spatial placement and full stage composition.

**Next P66 fifth pass:** rerun the complete P61 baseline against original DOS MK1/MK2/MK3 **plus accepted P62 MK1 audio, P63 MK3 audio, P64 MK2 music and P65 MK1 indexed ANITAB source-stream original-fixture gates**, falsification controls, source integrity audit, development checkpoint if justified. Never put originals or generated copyrighted media into GitHub. Keep `main` at P16 unless independently authorized.

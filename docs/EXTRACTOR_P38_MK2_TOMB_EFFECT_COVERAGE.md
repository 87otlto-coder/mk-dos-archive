# P38 TOMB existing-effect coverage reconciliation - 2026-11-07

Second interim pass after P36, develop only. Main remains P16.

## Extractor result

Coverage & evidence now also offers **MK2_P38_NATIVE_SOURCE_INTERVAL_COVERAGE.json**, available as collection.reports.p38SourceCoverage. It extends the P37 accounting scope with sixteen **already-exported** TOMB effect frames. No artwork or asset representation is added: **MK2 remains 5,369 unique representations**.

The sixteen existing streams exactly cover P37's **[54328,63776)** gap: **9,448 encoded bytes / 18,000 indexed pixels**. TOMB's **16 standalone component streams + 16 existing effect streams + one native floor** now form a non-overlapping partition of all **106,784 resource bytes**.

The original P37 report package remains byte-identical. Fourteen other resource records are deep-equal to P37. P38 has **288 qualified references / 1,028,136 unique encoded bytes** across the same fifteen resources. Byte accounting is not an extraction-completeness percentage, scene reconstruction or newly discovered artwork.

## Original-source qualification

Original MK2.EXE SHA-256: **fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65**.
Original TOMB.GRA: **106,784 bytes**, SHA-256 **be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613**; filename-pool resource slot 28, Object-2 base 0xA0C54.

The independent Python decoder authenticates the original writer instructions/list operands:
- tomb_flying_a: writer 0x82D51, list Object-2 0x17814.
- tomb_flying_b: writer 0x82DB3, list Object-2 0x177EC.

Each list has eight descriptor pointers followed by marker 1 and a back-reference to its own list. Each original twelve-byte descriptor supplies geometry, anchor words and packed resource/offset. Independent native-row decoding verifies exact indices, command paint masks and encoded end positions. Source list loop structure does not establish milliseconds, live activation or world placement.

| Existing frame | Descriptor Object-2 | Dimensions | Start | End exclusive |
|---|---|---|---:|---:|
| tomb_flying_b 0 | 0x17708 | 49x25 | 54328 | 54888 |
| tomb_flying_b 1 | 0x17718 | 49x25 | 54888 | 55600 |
| tomb_flying_b 2 | 0x17724 | 49x25 | 55600 | 56388 |
| tomb_flying_b 3 | 0x17730 | 49x25 | 56388 | 57260 |
| tomb_flying_b 4 | 0x1773c | 49x25 | 57260 | 57920 |
| tomb_flying_b 5 | 0x17748 | 49x25 | 57920 | 58708 |
| tomb_flying_b 6 | 0x17754 | 49x25 | 58708 | 59496 |
| tomb_flying_b 7 | 0x17760 | 49x25 | 59496 | 60124 |
| tomb_flying_a 0 | 0x1776c | 41x25 | 60124 | 60520 |
| tomb_flying_a 1 | 0x1777c | 41x25 | 60520 | 60984 |
| tomb_flying_a 2 | 0x17788 | 41x25 | 60984 | 61476 |
| tomb_flying_a 3 | 0x17794 | 41x25 | 61476 | 61952 |
| tomb_flying_a 4 | 0x177a0 | 41x25 | 61952 | 62392 |
| tomb_flying_a 5 | 0x177ac | 41x25 | 62392 | 62880 |
| tomb_flying_a 6 | 0x177b8 | 41x25 | 62880 | 63380 |
| tomb_flying_a 7 | 0x177c4 | 41x25 | 63380 | 63776 |

P38 applies existing O136/O177 research. The runtime report extension checks exact existing IDs, resource hash/binding, pinned descriptor/list provenance, dimensions/anchors, source extents, qualification flags and independently pinned native index/mask hashes. Invalid or incomplete effect sets produce PARTIAL / TOMB UNAVAILABLE, with no partial TOMB byte-coverage claim. Existing extraction assets and the separate P37 report remain available.

## Fresh verification

- **23 current MK2 suites PASS**, no skipped MK2 suites. **5,369 / 4,357 retained cumulative checks**, plus P37/P38 coverage gates. MK1/MK3 explicitly NOT_RUN in this interim; their latest full fixture evidence remains P36.
- Independent original-file reconciliation: **288 exact references / 6,986,406 original-file decoder checks**, including fresh source decoding of all twelve prior image families and these sixteen effects. A separate byte-set oracle verifies report unions/gaps/overlaps.
- Existing sixteen-frame private export readback: **54,192 checks PASS** for original native index/mask sidecars, source descriptor/extent/anchor provenance, PNG dimensions and diagnostic alpha versus command paint coverage. This does not qualify runtime RGB or alpha.
- **Ten invalid effect sets rejected**, including missing/duplicate records, altered extents/geometry/descriptors/anchors/flags/source hashes and mutated index/mask bytes. Clean recheck PASS; input assets/metadata/RGBA unchanged.
- **Eight falsified reports rejected**: false byte total, invented complete scene, wrong extent, erased effects, invented interval, wrong hash, invented native palette/timing qualification and new-artwork claim. Clean report reverified.
- P37 metadata package SHA-256 remains **0796e016bd03f7ca8c3a9d518717a67095c7a1602f241b74c551894532d8c536**.
- P38 metadata package SHA-256: **38326a2096b6c89a68d788805fe6832a92dc48097e34d8190be3a599ea7fcf4a**.
- Private sixteen-frame export SHA-256: **bb5d911b8e9e872f8537e467afde8679ce6cda7b052bbd7c8675f538055a24f3**. Artwork remains outside Git.
- Local **380-file syntax**, TypeScript and production build PASS; new CJS syntax PASS. Existing large bundle warning retained.

~~~sh
node scripts/verify-p21-checkpoint.cjs --mk2 <original-dir> --through p38 --report <private-report.json>
node scripts/verify-mk2-p38-tomb-coverage.cjs <original-dir> <private-coverage.json> <private-effects.zip>
python scripts/verify-mk2-p38-tomb-effects-independent.py <original-dir> --coverage <private-coverage.json> --export <private-effects.zip> --report <private-independent.json>
~~~

The interim runner defaults to P38; P36/P31/P26 runners and all prior pass source/evidence remain preserved. Existing extracted fixtures were reused; no new archive download/re-extraction is claimed. No original game bytes, images, audio or ZIPs are committed.

## Qualification and next pass

**VERIFIED:** existing TOMB effect source lists/descriptors, native row planes, preserved exports, exact byte partition and metadata report integration.

**UNKNOWN / unchanged:** unqualified palette/DAC ownership, runtime alpha, native durations/live activation, world/inter-layer positioning and full scene reconstruction. Anchor words and marker/back-reference structures do not strengthen those claims.

**VALIDATION PENDING:** original-data browser report download and new-family interactions. Source-only Chrome CI is separate from fixture-driven headless verification.

Next **P39**: reconcile PORTAL's **[35912,56916)** accounting gap with its already-exported swaying, hanging and electric effect tracks, using independent original-list/row proof before extending the report scope. No additional artwork should be claimed merely because it was excluded from a prior union. Preserve the workbench and recoverable develop commits. P41 remains the next fifth-pass consolidation assessment; main unchanged.

## Committed source and CI evidence

Source candidate **bf60c5a0a892b52bb33b78de95d7086d62911c0d**, tree **0aa96e2d7511a89218153a53b1a8587b9561f310**: complete GitHub-associated source audit PASS, **2,219 blobs / 384 src files**, 90 raw matches and 2,129 normal checkout newline matches; zero missing, mismatched or unsafe paths. Inventory SHA-256: **c5b4af00f4007932e4247da7f69805be125492400ec80043762f04d336490db6**. Reviewed comparison: twelve changed/added paths, zero removals. Runtime changes are only the additive P38 report module and collection integration; existing renderers/decoders and P37 report implementation are unchanged.

[CI run 42356624433](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42356624433) completed **SUCCESS** on that exact candidate: strict locked dependency install, syntax including the P38 gate, source-only refusal/accounting controls, media guard, production build, TypeScript and Chrome boot without game data. Original-fixture verification is recorded separately; original-data browser actions remain pending. The subsequent evidence-only commit changes this handoff, PROJECT_STATUS.md and validation JSON; application and verification source match the audited CI candidate. Main remains P16.

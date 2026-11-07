# P37 native source-interval coverage report - 2026-11-07

First interim pass after P36, on develop; main remains P16.

## Extractor improvement

Coverage & evidence now offers **MK2_P37_NATIVE_SOURCE_INTERVAL_COVERAGE.json**. The same report is available under collection.reports.p37SourceCoverage. It shows original resource sizes, registered representation counts, explicitly qualified source intervals, their union, duplicate/overlapping reference bytes, and gaps outside the selected scope. It contains metadata only; no game bytes or artwork. The package download button uses application/json for JSON reports and retains application/zip for existing archives.

**MK2 remains 5,369 unique representations.** No new image is claimed. Existing images, indexed data, masks, palettes, animation groups, floors, mosaics, audio, music and packages are preserved. No renderer or decoder is rewritten.

The interval scope is deliberately explicit: twelve P22-P35 standalone indexed families, fourteen P10 bridge streams, and one authenticated native raw floor per applicable resource. Generic whole-resource references, composite mosaics, and alternative preview representations do not inflate the union. Existing effect-frame exports are excluded from this initial scope, so an uncovered interval can already be represented elsewhere.

The report covers the original held-14 resource names plus PIT: **15 resources**, **272 qualified references / 1,018,688 unique encoded bytes** across nine resources. Six resources have no qualified intervals in this scope. Source sizes and byte counts are not image counts or extraction-completeness percentages.

| Resource | Registered representations | In-scope references | Union bytes | Bytes outside scope |
|---|---:|---:|---:|---:|
| CAVE.GRA | 49 | 49 | 57192 | 120 |
| ARMORY.GRA | 33 | 31 | 176512 | 0 |
| BATTLE.GRA | 23 | 21 | 95276 | 0 |
| ARENA.GRA | 34 | 32 | 126328 | 0 |
| TOMB.GRA | 44 | 17 | 97336 | 9448 |
| PORTAL.GRA | 42 | 14 | 71752 | 21004 |
| TOWER.GRA | 17 | 7 | 98120 | 15492 |
| FOREST.GRA | 72 | 59 | 226788 | 0 |
| PIT.GRA | 50 | 42 | 69384 | 0 |
| VFRAME.GRA | 0 | 0 | 0 | 59056 |
| FONTS.GRA | 0 | 0 | 0 | 124328 |
| PLAYSTA.GRA | 0 | 0 | 0 | 327360 |
| PROBE.GRA | 30 | 0 | 0 | 327672 |
| ACCLAIM.GRA | 1 | 0 | 0 | 2036 |
| MONKS.GRA | 0 | 0 | 0 | 2432 |

- CAVE: [0,120) stays outside the qualified 49-stream suffix.
- TOMB: [54328,63776), PORTAL: [35912,56916), TOWER: [40776,56268) remain outside this selected union. Check existing effect exports before proposing new artwork.
- ARMORY, BATTLE, ARENA, FOREST and PIT have complete byte unions under this scope. This does not establish complete scenes or native runtime behavior.
- PROBE retains thirty registered representations and ACCLAIM one, despite zero in-scope intervals. Zero in this report never means zero extractor support.

Unique basename lookup is required. Missing/ambiguous resources or invalid source bindings/ranges fail closed per resource and produce PARTIAL report status. Legacy basename-only asset references bind only to a unique input basename; full relative paths must match. Authenticated hashes come from qualified upstream adapters, not a new independent whole-corpus authentication claim. Unqualified resources have no authenticated hash.

## Rejected CAVE candidate

An aligned EXE scan found a plausible twelve-byte interpretation at physical 0xB9034: 12x78 with resource 29 / offset 0 read at +8. Independent row decoding failed. This interpretation overlaps the existing eight-byte descriptor whose actual packed source at +4 is resource 29 / offset 56008; the apparent extra anchor/pointer interpretation is not qualified.

**VERIFIED:** the candidate does not pass the independent decoder under that interpretation. **UNKNOWN:** meaning/dimensions of CAVE's first 120 bytes. This observation is not proof that the prefix contains no image. No candidate image, guessed dimensions, or new source bytes were added. A temporary investigative verifier was removed before commit.

## Fresh verification

- Full current MK2: **22 suites PASS**, **5,369 / 4,357 retained cumulative checks** plus the new coverage gate. MK1/MK3 were explicitly NOT_RUN in P37; their latest fresh full results are P36.
- Independent Python rebuild uses all twelve original-file decoders, fourteen original bridge records and seven original EXE floor pointers: **272 exact references / 6,950,259 original-file decoder checks**. A separate per-byte set oracle verifies interval unions, gaps and overlap accounting; it does not copy the TypeScript merge algorithm.
- **Six falsified reports rejected**: wrong covered total, invented scene claim, wrong source extent, erased gap, invented interval and false source hash. Clean report reverified.
- Source-only controls: **20 checks / ten invalid interval refusals PASS**, covering adjacency, nested/duplicate overlaps, empty inputs, invalid arithmetic, absent/ambiguous sources, wrong paths/hashes and excluded generic references.
- Local **379-file syntax**, TypeScript and production build PASS. Existing large bundle warning retained.
- Deterministic metadata package SHA-256: **0796e016bd03f7ca8c3a9d518717a67095c7a1602f241b74c551894532d8c536**.

~~~sh
node scripts/verify-p21-checkpoint.cjs --mk2 <original-dir> --through p37 --report <private-report.json>
node scripts/test-p37-source-coverage.cjs
node scripts/verify-mk2-p37-source-coverage.cjs <original-dir> <private-coverage.json>
python scripts/verify-mk2-p37-source-coverage-independent.py <original-dir> <private-coverage.json> --report <private-independent.json>
~~~

The interim runner defaults to P37. P36/P31/P26 checkpoint runners and records remain frozen. Existing extracted original fixtures were reused; no new archive download/re-extraction is claimed.

## Qualification and next pass

**VERIFIED:** metadata report integration, qualified source extents, independent original-file interval reconstruction and byte accounting, unchanged census and preserved regression results.

**UNKNOWN:** unqualified byte meaning, missing-image totals, palette/DAC ownership, native alpha, timing, setup roles and complete scene/world relationships. Native command masks remain distinct from runtime alpha.

**VALIDATION PENDING:** original-data browser clicks/downloads of the new report and other new families. Source-only Chrome CI is separate.

Next **P38**: reconcile TOMB's [54328,63776) report gap with already exported effect frames and existing descriptor research before proposing additional originals. Extend the report only with independently qualified source extents; a scope gap is not a new-image claim. Preserve the workbench and recoverable develop commits. P41 remains the next fifth-pass consolidation assessment; main unchanged.

## Committed source and CI evidence

Source candidate **28eedd6d6f23bc78cb005ddb9c515d84983e889b**, tree **d372f0700e59725b7eaf45fdb3aa462a84dc0026**: complete GitHub-associated audit PASS, **2,213 blobs / 383 src files**, 90 raw matches and 2,123 normal checkout newline matches; zero missing, mismatched or unsafe paths. Inventory SHA-256: **c8e7732687a001d50577c79d5d7a08c967d8479cf1eb6a79d128ec6a581c12f1**. The reviewed comparison has thirteen changed/added paths and zero removals; runtime changes are the additive report module/collection integration and the JSON MIME branch in the existing download button.

[CI run 42355754778](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42355754778) completed **SUCCESS** on that exact candidate: locked dependency install, syntax, P31/P36 source-only refusal controls, new P37 interval controls, media guard, build, TypeScript and Chrome boot without original game data. Original-data browser validation remains pending. The following evidence-only commit changes this handoff, PROJECT_STATUS.md and validation JSON; application and verification source are identical to the audited CI candidate. Main remains P16.

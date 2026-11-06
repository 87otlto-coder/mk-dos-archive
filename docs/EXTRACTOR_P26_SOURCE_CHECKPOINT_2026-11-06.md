# P26 — fifth-pass source checkpoint

Date: 2026-11-06. Baseline: P25 `fd94bee988c6bbb00cf38f95821f05cc24972b86` on develop. Main remains the accepted P16 checkpoint.

## Outcome and scope

P22–P25 are consolidated into a **verified source checkpoint on develop**. This preserves 102 added original MK2 indexed image representations, all prior adapters and the complete forensic research workbench. P26 changes verification/CI/documentation only; no runtime source under `src/`, decoder, palette interpretation or asset census changes.

| Pass | Original-image addition | Cumulative MK2 representations |
|---|---|---:|
| P21 | Previous source checkpoint | 5,118 |
| P22 | 49 CAVE images | 5,167 |
| P23 | 18 ARMORY images; independently qualified shared row decoding | 5,185 |
| P24 | 20 BATTLE images with all 40 paired descriptor witnesses | 5,205 |
| P25 | 15 ARENA images | **5,220** |
| P26 | Multi-game and independent-export consolidation | **5,220** |

These are representations, not original resource-file counts or a claim of complete gameplay stages. Main is not promoted. The complete committed Git tree is the recoverable source checkpoint; no redundant source ZIP is issued.

## Fresh P26 fixture results

| Gate | Result |
|---|---|
| Complete standard suite | **15 suites PASS**, all MK1/MK2/MK3 fixtures supplied; no skipped games |
| MK1 | **2,656 assets**: 2,363 sprites, 244 audio, 49 stage PNGs; 2,615 compatibility checks; all 49 stage PNG exports read back, 24 normalized module previews retained |
| MK2 | **5,220 unique representations / 865 cumulative checks**, source identity 614 files / 13 critical hashes / 642 checks; all four new-family and seven earlier focused suites pass |
| MK3 | **9,186 assets**: 6,654 sprites, 1,046 raw, 1,024 audio, 416 images, 46 music; 7,110 compatibility checks and ten representative exports across all five kinds |
| MK1/MK3 visual baseline | Both aggregate decoded RGBA-plane hashes exactly match the committed P21 observations |
| Four independent MK2 family verifiers | **102 images / 357,456 indexed pixels / 2,146,506 independent checks PASS**, original PNG/index/opacity/unknown-palette parity and BATTLE witness preservation |
| False exports/claims | **13 rejected** across four families; clean exports reverified after falsification |
| Source-negative family controls | Existing eight cases per family retained; 32 distinct logical source-negative cases across the four families |
| Local build/source checks | 370 TypeScript source files / zero syntax errors, TypeScript, production build, new CJS syntax and diff-whitespace checks PASS; existing Vite large-chunk warning retained |

Independent family totals are CAVE 299,427, ARMORY 940,912, BATTLE 511,492 and ARENA 394,675 checks. Export-generation suites are repeated to produce private ZIPs for the Python verifiers; their repeated assertions are not counted as additional unique source cases.

The standard cumulative gate also retains historical P8–P10/P13–P15 archive identities, all four new-family archive hashes and original uncropped ARMORY/BATTLE/ARENA floor bytes.

## Complete source audit

The authoritative P25 tree `03125b98b56b040d71dfe1c6ff982bdda1350b9e` was retrieved without truncation. **All 2,122 committed file blobs** matched local materialized bytes: **73 raw matches and 2,049 matches after normal Git checkout CRLF-to-LF normalization**, with zero missing or mismatched files. This includes all **374 src files**. The reviewed tracked-game/media/archive extension scan found zero paths.

Canonical sorted `mode blob-sha path` inventory SHA-256: `d5dbb1599930a3b382f97bb087336bbce2c2a770cba7a7b69c229f90ed92a9f2`.

This verifies the complete materialized source against GitHub, not a claim that the locally cached Git object graph was fetched successfully. Source recovery uses the authoritative committed tree and its history. Generated build outputs/dependencies, original games and private export/negative ZIPs are excluded from commits.

**Committed P26 source verified:** `0129c0d3acb9b263fc510d8c8bc83bef009f92c5`, tree `62b490fd89a6b3dded66b16ed9534d1f8947beda`: **2,126 file blobs**, all **374 src files byte-identical** to P25, zero removed paths and no reviewed tracked game-media/cache paths. All eight changed/added files match the local candidate's Git blob hashes. The source checkpoint is recoverable directly from this complete Git tree; later evidence-only documentation does not change runtime or verification code.

**GitHub CI PASS:** [run 42292927503](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42292927503) completed successfully on `0129c0d`: strict locked dependency install, source/new CJS syntax, media guard, Vite production, TypeScript, source-offline headless Chrome startup and static build upload. The commercial-fixture tests are the separate local P26 evidence, not tests run in GitHub with game data.

## Repeatable checkpoint runner

New `scripts/verify-p26-checkpoint.cjs` requires all three fixtures, runs the complete current suite, compares MK1/MK3 decoded visuals with P21, then generates private source-family ZIPs and executes all four independent Python verifiers and falsification suites.

```powershell
node scripts/verify-p26-checkpoint.cjs --mk1 <MK1-dir> --mk2 <MK2-dir> --mk3 <MK3-dir> --report <report-json>
```

This runner deliberately pins the P25/P26 census; use the matching checkpoint source for replay. Use installed Node dependencies and Python; `PYTHON` may select a different Python executable. Optional `--work <private-directory>` controls the test-artwork location; otherwise a private OS temp directory is created. Test artwork must remain outside the repository and original fixture directories. The report must remain outside fixture directories.

After argument/path validation, the runner writes RUNNING before executing suites and atomically records progress and final PASS/FAIL. Interrupted suite execution therefore leaves a non-PASS report. A failing child preserves its original diagnostic; a new-helper formatting issue that initially favored progress stderr over the real error was corrected and its error path reverified. Invalid source produces explicit FAIL/nonzero exit, repository-local artwork output and fixture-local reports are rejected before writes, and a deliberately changed MK3 visual hash is rejected.

[Machine-readable P26 regression/source audit](validation/P26_CHECKPOINT_REGRESSION_2026-11-06.json).

## Archive hash confidence

MK1's three whole evidence ZIP hashes differ from P21. **VERIFIED:** the unchanged builders embed root research reports containing per-run timestamps, operation IDs and references to predecessor IDs; decoded MK1/MK3 visual hashes match P21 and current export readback passes. **INFERRED:** volatile research metadata accounts for the old/new whole-MK1-archive mismatch. The original P21 ZIP bytes were not retained for a per-entry historical diff, so exact old/new archive-byte identity is not claimed. Existing research timestamps are preserved rather than rewritten to manufacture deterministic archives.

The newly introduced baseline gate compares the actual stable decoded visual observations; it does not remove an earlier whole-MK1-archive assertion. MK2 deterministic source-package hashes remain explicitly asserted. MK3 has no evidence packages in this collection, so equality of its empty package list is not evidence of archive parity.

## Confidence and next cycle

**VERIFIED:** current three-game headless collection/export compatibility, historical MK1/MK3 visual parity, all 102 new MK2 native image/mask outputs, duplicate descriptor provenance, earlier floor/archive preservation, complete P25 source identity and source build checks.

**VALIDATION PENDING:** actual original-data browser clicking/import/export for additions after P11, including the eight P19 source-order queue actions and P22–P25 image families. Source-offline Chrome startup does not close this gate. No new original-DOS runtime observation is claimed.

**UNKNOWN:** live DAC palette ownership, native animation milliseconds, world/camera placement and complete stage composition. MK1's bounded stage/phase qualifications and MK3's unassigned image-to-stage relationships are retained. MK2 ZIP-level download/hash/re-extraction was not freshly performed; the existing extracted fixture's identity checks retain their stated 13-critical-hash scope. MK1's canonical EXE is checked; MK3 EXE identity is recorded rather than newly independently authenticating its full corpus.

Next P27 remains MK2-first: audit original TOMB descriptor-level image coverage against already exposed effects and setup layers, deduplicate by original interval/geometry and independently verified indices/masks, then expose only useful missing originals. Do not count a source relationship as a new unique image without that join. Preserve P26 and continue the five-pass cycle. Main promotion remains separately authorized and is not automatic.

# P31 - consolidated source checkpoint on develop

Date: 2026-11-07. Fifth-pass consolidation after P27-P30. Baseline P30: `0de6a19ec5b3bebfc975f3805fec938d6e60b784`, tree `6062c9d55a6a5ec50ff271127a98876e374c244d`. Main remains P16 `c84acad696adb3fa2f2ff7433be711e1c5654407`.

## Outcome

P27-P30's **84 standalone component representations** are consolidated with all earlier extraction/research functionality. P31 changes verification tooling, CI and documentation only: **no runtime file under src changes**, no assets are added and no native interpretation is promoted.

The complete recoverable Git tree is the source checkpoint; a redundant full-source ZIP is not required for recovery. Original DOS binaries, artwork, private export ZIPs and caches are excluded. P26/P21 and earlier source/evidence remain intact. No main promotion occurs.

| Game | Fresh representations | Scope |
|---|---:|---|
| MK1 | **2,656** | 2,363 sprites, 244 audio, 49 stage images; all 49 stage selected exports/readbacks pass |
| MK2 | **5,304** | Complete cumulative **1,940 checks** plus sixteen other MK2 suites; original indexed data/provenance retained |
| MK3 | **9,186** | 6,654 sprites, 1,046 raw, 1,024 audio, 416 image, 46 music; ten representative exports across five kinds pass |

**19 standard suites PASS, no skipped games.** MK1/MK3 decoded RGBA planes match both P21 and P26. Identity remains bounded: MK2 directory census/critical hashes, MK1 canonical EXE and recorded MK3 EXE; no newly authenticated complete MK1/MK3 corpus claim is made.

## Independent original-file verification

Each family is freshly exported, independently decoded/verified using Python original-file parsers, tested against altered exports with recalculated CRCs, and cleanly reverified.

| Family | Representations | Indexed pixels | Independent checks | False exports rejected |
|---|---:|---:|---:|---:|
| P22 CAVE | 49 | 49,765 | 299,427 | 3 |
| P23 ARMORY | 18 | 156,767 | 940,912 | 3 |
| P24 BATTLE | 20 | 85,188 | 511,492 | 4 |
| P25 ARENA | 15 | 65,736 | 394,675 | 3 |
| P27 TOMB | 16 | 64,971 | 1,437,357 | 4 |
| P28 PORTAL | 13 | 60,566 | 786,561 | 4 |
| P29 TOWER | 6 | 43,653 | 296,737 | 5 |
| P30 FOREST | 49 | 164,382 | 1,881,013 | 5 |
| **Total** | **186** | **691,028** | **6,548,174** | **31** |

These counts describe tested representations, not newly discovered artwork or game completeness. TOMB/PORTAL mosaics reconstruct exactly; TOWER retains raw controls without inferred flag transforms; FOREST's 43 linked components reproduce five P7 canvases and six remain unlinked. Existing effects/floors and deterministic family archives remain verified.

MK1 whole archive hashes differ from P21/P26 while decoded visuals are identical. Existing packages contain timestamps/operation IDs: metadata volatility is the **INFERRED** cause, not a claim that historical ZIP bytes were independently diffed. MK3 archive hashes match P26. Deterministic MK2 family hashes remain explicitly enforced.

## Complete source audit and tooling

The connected GitHub integration established the baseline commit/tree association. All committed files in its complete nontruncated recursive tree match local bytes:

- **2,162 blobs / 378 src files**: **80 raw matches + 2,082 normal checkout newline matches**.
- Zero missing files, mismatches, forbidden media/archive or cache/build paths.
- Inventory SHA-256: `7aca0e00c6b58520f8315e2082b921ad1c192f0edc424c4211770db3a5de3476`.

New `scripts/verify-p31-checkpoint.cjs` requires all three fixtures, pins the current P30 census, compares MK1/MK3 visuals to P21/P26, and enforces all eight image/export/negative families. It saves RUNNING/PASS/FAIL progress atomically. Existing ancestor symlinks are resolved before checking report/private-work containment. Artwork remains outside repository and original fixtures.

New `scripts/verify-p31-source-tree.py` audits complete connector-retrieved trees, local Git blob hashes, checkout newline conversion and unsafe/missing/changed paths. It **does not authenticate GitHub by itself**; callers must independently establish the commit/tree association.

New `scripts/test-p31-checkpoint-controls.py` passes **eight runner preflight refusals / seven source-audit negative controls**, plus clean audit rechecks, using disposable text fixtures only. Its initial attempt encountered an inaccessible Windows sandbox default temporary directory; it now verifies and uses its own temporary directory beside the checkout within the permitted workspace. No game files changed. CI runs these source-only controls.

Local **374-file TypeScript syntax / zero errors**, TypeScript noEmit, production Vite build, new Node script syntax and whitespace diff PASS. The existing Vite large-chunk warning remains. No application rewrite or UI refinement was required.

[Machine-readable evidence](validation/P31_CHECKPOINT_REGRESSION_2026-11-07.json).

## Reproduction

All reports/private exports must be outside source and original fixtures:

```text
node scripts/verify-p31-checkpoint.cjs --mk1 <original-mk1-dir> --mk2 <original-mk2-dir> --mk3 <original-mk3-dir> --report <private-report.json> --work <private-export-dir>
python scripts/test-p31-checkpoint-controls.py
python scripts/verify-p31-source-tree.py --root <checkout> --tree <connector-recursive-tree.json> --commit <verified-commit-sha> --report <private-source-audit.json>
```

P31 pins P30's 5,304 MK2 census. P26 remains frozen to its historical 5,220 census. Historical gates require matching source; future interim passes use updated current-source gates and preserve this checkpoint.

## Confidence and next pass

**VERIFIED:** full headless three-game collection/export regression, eight original indexed families, 31 altered exports rejected with clean rechecks, unchanged MK1/MK3 visuals and complete baseline committed-source parity.

**INFERRED:** variable metadata explains MK1 whole-ZIP hash changes. No historical archive-byte diff was performed.

**UNKNOWN:** unqualified live palette/DAC ownership, native timing/activation, TOWER transforms, global/inter-layer placement and full stage composition. Six FOREST originals remain unlinked to the five P7 setups; **[164752,198116)** / 33,364 FOREST bytes receive no new qualification.

**VALIDATION PENDING:** original-data browser preview/export actions. Source-offline Chrome CI does not validate those interactions or DOS runtime behavior. Existing authenticated extracted fixtures were used; no fresh archive download/hash/re-extraction is claimed.

Next **P32**: compare FOREST [164752,198116) against existing O69/O110A descriptors and exposed assets. Add only independently qualified missing originals and preserve unknown relationships. Start from this source checkpoint, keep the workbench intact, use recoverable develop commits and leave main unchanged.


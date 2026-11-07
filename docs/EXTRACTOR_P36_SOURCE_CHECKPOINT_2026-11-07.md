# P36 consolidated source checkpoint - 2026-11-07

P36 consolidates P32-P35 on develop, preserving the research workbench and all prior source/evidence. Main remains accepted P16. No runtime source changes in this pass and no commercial game files or exported artwork are committed.

## Verified results

Fresh complete original-fixture regression: **23 suites PASS**, no skipped games. MK1 **2,656**, MK2 **5,369 / 4,357 cumulative checks**, MK3 **9,186** representations. Existing stage exports, character/effect/mosaic/floor records, audio and music checks are retained.

P32-P35 add **65 standalone representations** beyond P31: FOREST nine, PIT twenty-eight, ARMORY twelve, ARENA sixteen. Complete native byte partitions of FOREST, PIT, ARMORY and ARENA are retained; partition coverage does not prove complete scenes or runtime use.

All **twelve independent families PASS: 251 representations / 939,903 indexed pixels / 10,712,883 checks**. All **54 altered exports/claims rejected**; every clean archive reverified.

| Family | Representations | Pixels | Independent checks | Rejected exports |
|---|---:|---:|---:|---:|
| P22 cave | 49 | 49765 | 299427 | 3 |
| P23 armory | 18 | 156767 | 940912 | 3 |
| P24 battle | 20 | 85188 | 511492 | 4 |
| P25 arena | 15 | 65736 | 394675 | 3 |
| P27 tomb | 16 | 64971 | 1437357 | 4 |
| P28 portal | 13 | 60566 | 786561 | 4 |
| P29 tower | 6 | 43653 | 296737 | 5 |
| P30 forest | 49 | 164382 | 1881013 | 5 |
| P32 forest-tail | 9 | 33122 | 198951 | 5 |
| P33 pit | 28 | 108352 | 3320868 | 6 |
| P34 armory-tail | 12 | 7680 | 46288 | 6 |
| P35 arena-tail | 16 | 99721 | 598602 | 6 |

MK1/MK3 decoded visual-plane hashes match P21, P26 and P31:
- MK1: d780cf4efcaf2f4eb20e0e08871c84d8cf918f40596e5c7180e528b39d95e785
- MK3: 17ed4abe9a5349c68675753ccaf9f7a5f62e20b6e666fed6bbc47a9f5c30fee4

Whole MK1 evidence ZIP hashes differ. Metadata volatility remains **INFERRED**, not a fresh historical archive-byte comparison; the decoded visual equality is verified. MK3 archive-hash lists compare equal but are empty, so that comparison establishes no ZIP-byte identity.

## Reproducibility and verification controls

Use this checkpoint's matching source:

~~~sh
node scripts/verify-p36-checkpoint.cjs --mk1 <original-dir> --mk2 <original-dir> --mk3 <original-dir> --report <private-report.json> --work <private-export-dir>
python scripts/test-p36-checkpoint-controls.py
~~~

All three original fixtures are required. The runner records RUNNING/PASS/FAIL atomically, rejects outputs within source/fixtures after resolving ancestors, and pins the current census and twelve family totals. Historical P31/P26 runners remain frozen to their matching source. Original extracted fixtures were reused; no fresh archive download or re-extraction is claimed.

Source-only controls: **eight runner preflight refusals / seven source-audit negative controls PASS**, with clean source audit reverified using disposable text fixtures. Local **378-file syntax**, TypeScript and production Vite build PASS; the existing large bundle warning remains. New runner syntax passes.

The pre-change source comparison found all 382 runtime source files unchanged from P35. Its only tracked mismatch was the intentionally edited CI workflow; the final candidate receives a separate complete-tree audit. This comparison is not represented as a passing unmodified-tree audit.

## Confidence and next step

**VERIFIED:** original-fixture collection/export regression, independent indexed/PNG/mask/provenance parity, falsification controls, preserved prior records and qualified native byte partitions.

**UNKNOWN:** unqualified roles/setup links, native palette/DAC ownership, runtime alpha, animation timing/order and full world/inter-layer composition. Source descriptors or native command masks do not establish those claims.

**VALIDATION PENDING:** original-data browser preview/export interactions. Source-only Chrome CI is separate. Original-input identity retains the existing MK2 census/critical hashes and MK1/MK3 executable checks; no whole-corpus completeness or newly authenticated archive claim.

Next **P37 interim**: reconcile current MK2 extraction coverage against existing verified descriptor/setup research, select a bounded useful gap, and integrate only independently qualified originals or provenance. Prefer verified mechanisms; do not invent palette, timing or scene links. Preserve all checkpoints and recoverable develop commits. Next fifth-pass consolidation assessment is P41 after four interim passes. Main promotion remains separately authorized.

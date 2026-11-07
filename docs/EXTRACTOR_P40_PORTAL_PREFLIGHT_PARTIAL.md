# P40 PORTAL source-coverage preflight — partial interim pass

Date: 2026-11-07. Branch: `develop`. Parent: P39 `fce79b4238de96d02952330f1cac967b2a67bc17`.

## Purpose and evidence

P38's existing PORTAL.GRA report records 14 qualified references covering 71,752 of 92,756 bytes and a single outside-scope gap [35912,56916). P39 independently authenticated 20 existing effect streams that partition that exact gap (21,004 encoded bytes, 21,515 decoded pixels, 43,213 source-decoder checks).

The deterministic expected join is 34 qualified references, 92,756 covered bytes, zero gaps, zero overlapping bytes, and **zero new asset representations**. This is original encoded-source byte accounting, **not** full stage composition, palette ownership, native timing/alpha or source activation.

## Change

Added `scripts/verify-mk2-p40-portal-preflight.cjs`. It uses only committed P38/P39 metadata and asserts source identity, frame IDs, extents, geometry, source descriptor provenance and SHA-256 references before checking exact nonoverlapping coverage. Ten mutation controls deliberately reject missing/duplicate records and altered offsets, geometry, pointers and plane/source digests.

The equivalent reconciliation logic was independently run in the development session against the two committed evidence JSONs: the positive check and all ten mutation controls passed. The new on-repository Node script has not yet been executed against a complete checkout in this session.

## Confidence boundary and next step

**VERIFIED:** the P38/P39 evidence join and ten independently exercised falsification controls; the preflight source file exists on `develop` and was read back from GitHub.

**VALIDATION PENDING:** direct execution of the committed preflight script; new P40 runtime coverage-report integration; original MK2 fixture collection/export parity; cumulative test rerun; original-data browser actions. No new P40 runtime file or new coverage report was committed. Previous P38 5,369 assets / 23 MK2 suites and P36 MK1/MK3 remain the latest recorded fixture results.

Next: integrate P39's existing PORTAL effect references with fail-closed checks in a new P40 coverage report, retaining P37/P38 report bytes and all earlier assets. Run current original-fixture regression before claiming P40 completion. P41 is the next consolidation assessment, not an automatic main promotion.

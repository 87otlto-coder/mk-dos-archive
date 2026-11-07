# P40 — PORTAL existing-effect coverage integration (fixture acceptance pending)

Date: 2026-11-07. Branch: `develop`. Baseline: P39 and P38 committed evidence. `main` remains P16.

## Objective and implemented source

P39 independently qualified twenty existing PORTAL effects (seven swaying, seven hanging, six electric) in **[35912,56916)**: 21,004 encoded bytes and 21,515 indexed pixels. P38's coverage report had precisely that 21,004-byte outside-scope gap. P40 adds a separate metadata-only report `MK2_P40_NATIVE_SOURCE_INTERVAL_COVERAGE.json`, leaving P37/P38 packages in place.

`src/core/assets/mk2SourceCoverageP40.ts` joins these already-exported assets by authenticated resource identity, exact ID, original intervals, dimensions, source-list pointers, descriptors, anchors, index/mask SHA-256 values and explicit unknown native behavior flags. It rejects unavailable/mismatched evidence rather than silently issuing a verified PORTAL record. The intended PORTAL accounting is **34 references / 92,756 union bytes / zero gaps/overlap**, with no new asset representations. No image decoder, rendering, palette attribution, native timing or game composition changes.

`src/core/assets/collection.ts` adds the separate P40 package/report without removing P37 or P38. A focused original-fixture runner, `scripts/verify-mk2-p40-portal-coverage.cjs`, checks the 5,369 census, PORTAL join, 14 other resource records, P38 report identity, all 20 existing index/mask outputs, ten altered-asset rejection controls and clean retry. It is committed but **has not been executed against the complete current-source original MK2 fixture in this chat**.

`scripts/verify-mk2-p40-portal-preflight.cjs` is a source-only P38/P39 evidence join with ten falsification controls. GitHub CI workflow was extended to check both P40 test-script syntax and run this preflight without copyrighted game files.

## Verified and outstanding

- **VERIFIED:** independent P38/P39 evidence join, positive case and ten intentionally modified cases; original P39 `PORTAL.GRA` SHA-256 and length available from the supplied private ZIP; committed source changes and verification scripts read back from GitHub.
- **VERIFIED:** corrected integration source passed strict GitHub source-build/TypeScript/Chrome CI at `32ef6a5`.
- **VALIDATION PENDING:** CI for workflow update `454361d`; original-fixture P40 runner; full cumulative 5,369-asset / 23-suite regression; byte identity of legacy P37/P38 exports on current source; interactive original-game browser preview/export.
- **UNKNOWN:** native runtime palette bank, source loop cadence, activation, alpha, world placement and complete PORTAL scene. Encoded byte-accounting is not graphical scene completeness.

No commercial original binaries or extracted artwork are in the new Git commits. P41 consolidation is deferred until P40 fixture acceptance. Preserve P36 stable source checkpoint and `main`; TOWER reconciliation remains a separate prospective pass.

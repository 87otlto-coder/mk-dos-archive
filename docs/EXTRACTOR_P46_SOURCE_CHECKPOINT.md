# P46 consolidated source checkpoint
2026-11-07; develop only. Consolidates P42-P45. Main remains accepted P16.

## Fresh verification

**All 27 current game gates PASS:** 25 standard three-game suites plus the separate PORTAL and TOWER fixture gates. No games skipped. MK1 **2,656**, MK2 **5,369 / 4,357 cumulative checks**, MK3 **9,186** representations. No new artwork or runtime source changes in P46.

- **Twelve independent image families:** 251 original representations / 939,903 indexed pixels / 10,712,883 independent checks; **54 altered exports rejected**, every clean export reverified.
- **Current source accounting/effect exports:** 315 exact original-file references; 7,064,335 decoder checks and 171,036 export checks across 43 existing effects. **Eight false reports / six altered exports rejected**, clean reverified.
- P37/P38/P40 package hashes remain byte-identical. Current scope has 1,064,632 union bytes; TOWER's fourteen references account for all 113,612 native resource bytes. Complete byte accounting is not complete scene reconstruction.
- MK1/MK3 decoded visual-plane hashes match P21/P26/P31/P36/P41. MK1 whole-ZIP variance remains observed with its metadata cause INFERRED; decoded visual equality is verified.
- Local **382-file syntax**, TypeScript and production build PASS. Existing large bundle warning retained. **Eight new-runner refusals / seven source-audit negative controls PASS**, clean audit reverified.

The workbench, native planes/provenance, prior stage mosaics, effect/source-order groups, palettes with their existing qualifications, sound/music exports and historical checkpoint runners are preserved. No game files, artwork or private ZIPs are committed. Existing extracted fixtures were reused; no fresh archive download/re-extraction is claimed.

## Reproduce
~~~sh
node scripts/verify-p46-checkpoint.cjs --mk1 <original-dir> --mk2 <original-dir> --mk3 <original-dir> --report <private-json> --work <private-dir>
python scripts/test-p46-checkpoint-controls.py
~~~
The current runner requires all three original fixtures, pins the current census and verification scope, resolves existing ancestors to keep outputs outside source/fixtures, and atomically records RUNNING/PASS/FAIL. P41/P36/P31/P26 runners remain frozen to their recorded checkpoints. P45 remains the current MK2-only acceptance runner.

## Confidence and outstanding work

**VERIFIED:** complete current-source headless collection/export regression, native source-index/mask provenance, independent report/PNG/sidecar parity, failure controls and preservation checks.

**UNKNOWN / unchanged:** live DAC/palette ownership where unqualified, native alpha, timing/activation and world/inter-layer/full-scene composition. Preview RGBA roundtrip equality is not native RGB ownership. CAVE's first 120 bytes remain unqualified; six other resources have no qualified intervals in this selected report scope, which does not establish absent extractor support.

**VALIDATION PENDING:** original-data browser preview/download/queue actions. Source-only Chrome CI is separate. [Issue #5](https://github.com/87otlto-coder/mk-dos-archive/issues/5) still contains historical P19 cumulative-pending text; the fresh current-source results supersede that headless scope, while the browser follow-up remains open. Previously accepted P11 browser checks should not be repeated unnecessarily.

Committed-source audit and CI associations are added only after their results are verified. Next **P47** should prioritize a bounded original-data browser acceptance check of added indexed families, report downloads and source-order queue exports when a controlled session is available; otherwise apply already verified extraction work to a material coverage/usability gap. Avoid further report-only research without an extractor benefit. P51 is the next scheduled fifth-pass assessment after four interim passes. Main promotion remains separately authorized.

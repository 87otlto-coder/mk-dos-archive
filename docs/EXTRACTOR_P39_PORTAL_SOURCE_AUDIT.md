# P39 small pass: PORTAL original-source audit

2026-11-07; develop only. Runtime source and coverage reports remain unchanged.

**VERIFIED:** original EXE writer/list operands, the swaying track’s nested pointer transfer, list terminals/back-reference, twenty twelve-byte descriptors, geometry/anchors, native indices/paint masks and stream extents. The three existing tracks (7 swaying, 7 hanging, 6 electric) partition **[35912,56916)** exactly: **21,004 encoded bytes / 21,515 indexed pixels / 43,213 decoder checks PASS**. Full source hashes are preserved in the evidence JSON.

This applies existing O136/O177 research. It does not discover new artwork, add representations or integrate PORTAL into the coverage report. Existing exported files were not rechecked in this bounded pass. Latest full MK2 evidence remains P38: 5,369 representations / 23 suites PASS; latest full MK1/MK3 evidence remains P36. Those results were not rerun here. No new CI result or complete source audit is claimed; the commit comparison and changed-file contents are verified separately.

**UNKNOWN / unchanged:** live palette/DAC ownership, native alpha, timing/activation, world placement and complete scenes. Original-data browser validation remains pending. Source list structure and descriptor anchors do not establish those properties.

Reproduce: `python scripts/verify-mk2-p39-portal-source-audit.py <original-directory> --report <private-report.json>`.

Next **P40**: apply this proof to the coverage report with preservation and failure controls; keep TOWER reconciliation deferred if needed. P41 remains the next consolidation assessment. Main remains P16. Original game files and extracted artwork stay outside Git.


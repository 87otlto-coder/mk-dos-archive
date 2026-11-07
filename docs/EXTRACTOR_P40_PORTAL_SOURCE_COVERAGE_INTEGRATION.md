# P40 PORTAL coverage integration - original-fixture acceptance verified

2026-11-07; develop only. P41 consolidation has not started; main remains P16.

P40's previously committed integration is now verified against the original MK2 fixture on complete source commit **dfe700aa698e6b0d4399f1da1813a66f96b29b58**. This acceptance pass changes documentation/evidence only; no runtime source or decoder changes.

- **Focused P40 original-fixture gate PASS**: unchanged 5,369 unique representations; twenty existing PORTAL effects; 34 PORTAL references / all 92,756 resource bytes / zero gaps or overlaps. The full P40 report has 308 qualified references; fourteen other resource records match P38.
- **All 23 cumulative MK2 suites PASS**, including input identity and retained 4,357 cumulative checks, P37/P38 accounting, prior original images, indexed/PNG exports, effect groups and packages. The separate P40 fixture gate also passes; it is not counted as one of those 23 suites.
- P37 and P38 metadata package SHA-256 values match their accepted hashes exactly. Existing source assets/metadata/RGBA are unchanged after ten rejected altered-effect sets and a clean retry.
- Fresh independent P39 original-source recheck: twenty frames / 43,213 decoder checks; descriptors, geometry, intervals and native index/mask hashes equal committed evidence.
- Source-only preflight and ten false-report controls PASS. Local TypeScript and production build PASS; existing large bundle warning retained.
- Complete GitHub-associated source audit PASS: **2,227 committed blobs / 385 src files**, 99 raw and 2,128 normal checkout newline matches; zero missing/mismatched/unsafe paths. Inventory SHA-256: **d8fb3fc0a820136de76f970a3e882e4ece39d710f0d5af64f5993ef242935f90**.
- [CI run 42359285316](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42359285316) is verified SUCCESS at 454361df0553a92b7b0d3f4222a1874a4419086d. GitHub comparison to the tested commit contains only two documentation changes, establishing unchanged source/workflow. This is source-only CI, separate from the fresh private-fixture checks above.

The metadata-only MK2_P40_NATIVE_SOURCE_INTERVAL_COVERAGE.json joins P39's twenty already-exported effects in [35912,56916): 21,004 encoded bytes / 21,515 indexed pixels. Runtime qualification checks exact IDs, authenticated source reference, descriptor/list pointers, geometry/anchors, extents, native index/mask hashes and unchanged claim flags. No new artwork or asset representations are added.

Reproduce:
~~~sh
node scripts/verify-mk2-p40-portal-coverage.cjs <original-dir> <private-report.json>
node scripts/verify-p21-checkpoint.cjs --mk2 <original-dir> --through p38 --report <private-cumulative.json>
python scripts/verify-mk2-p39-portal-source-audit.py <original-dir> --report <private-source-proof.json>
~~~

The existing cumulative runner uses explicit through p38, plus the separate P40 gate. No historical checkpoint runner was rewritten. Existing extracted fixtures were reused; no fresh archive download/re-extraction is claimed. No original binaries or artwork are committed. [Machine-readable acceptance](validation/P40_ORIGINAL_FIXTURE_ACCEPTANCE_2026-11-07.json).

**VERIFIED:** fixture-driven integration, independent native-plane provenance, exact PORTAL byte accounting, legacy package preservation and recorded source/build checks.

**UNKNOWN / unchanged:** live DAC/palette ownership, native alpha, playback clock/activation, world placement and complete PORTAL scene. Command paint coverage and list structure do not establish those properties.

**VALIDATION PENDING:** original-data browser downloads and interactions. MK1/MK3 were explicitly NOT_RUN here; their latest full fixture evidence remains P36.

Next **P41 consolidation assessment**: a current-source three-game runner that includes the P40 fixture gate, all twelve independent image families and existing coverage/falsification controls, plus complete source audit. Keep the P36/P31/P26 checkpoints intact. TOWER report reconciliation stays deferred; main promotion remains separately authorized.

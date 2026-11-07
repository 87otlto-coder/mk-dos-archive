# P45 repeatable current MK2 acceptance
2026-11-07; fourth interim after P41, develop only.

**PASS:** all 23 cumulative MK2 suites plus separate PORTAL/TOWER integration gates, independent source accounting and all 43 existing effect export checks. Current census **5,369 representations / 4,357 cumulative checks**, unchanged; no new artwork.

The current report has **315 qualified source references / 1,064,632 union bytes**. TOWER now joins the already-verified complete byte partitions for TOMB, PORTAL, ARMORY, BATTLE, ARENA, FOREST and PIT. CAVE's first 120 bytes stay unqualified; six other listed resources remain outside this selected native-stream/floor scope. This is not scene completeness or an image-coverage percentage.

**Independent acceptance:** 7,064,335 original-file decoder checks; 171,036 export checks; eight false reports and six re-CRC'd altered exports rejected; clean reverified. Native indices/masks/geometry/provenance and diagnostic alpha agree with original files. Preview RGBA roundtrip does not establish native/live palette ownership. Ten altered effect sets are rejected by each current PORTAL/TOWER gate. P37/P38/P40 report hashes remain byte-identical.

The new runner requires original MK2 plus explicit private report/work paths. It resolves existing ancestors, rejects output under source/original fixtures, and atomically records RUNNING/PASS/FAIL with explicit MK1/MK3 NOT_RUN. **Six refusal cases / seven source-audit negative controls PASS**, clean audit reverified. Source-only CI exercises these guards without game data.

~~~sh
node scripts/verify-p45-mk2-acceptance.cjs --mk2 <original-dir> --report <private-json> --work <private-dir>
python scripts/test-p45-checkpoint-controls.py
~~~
The frozen P41/P36/P31/P26 runners are preserved. P41 remains the latest full three-game checkpoint: 25 standard suites plus P40 gate; twelve independent image families / 54 altered-export controls. P45 changes verification/CI/docs only; the latest runtime change was P43's additive report integration.

Original-data browser downloads/interactions, unqualified native palette/DAC/alpha/timing/activation and final world/scene composition remain pending/unknown. Existing extracted fixtures were reused; no original archive download/re-extraction is claimed. No game bytes/artwork/private ZIPs are committed; research workbench preserved. Main remains P16.

P41-P45 are verified and recoverably committed on develop. Each exact checkpoint tree matches the tested checkout and its own CI passed. Next **P46 fifth-pass consolidation assessment**, not begun here; main promotion is not authorized.

## Verified committed checkpoints

All five complete GitHub-associated tree audits PASS with zero missing/mismatched/unsafe paths.

| Pass | Audited source commit | Blobs / src files | Source-only CI |
|---|---|---:|---|
| P41 | e0ff15af4c5bc213f7a2fc9b4a165f69b7eb7aa2 | 2232 / 385 | [SUCCESS 42367512688](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42367512688) |
| P42 | 4e393667d5509809fa25f663ccf13ca901e35256 | 2235 / 385 | [SUCCESS 42367562323](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42367562323) |
| P43 | 497291035bddf5bc71fe1748e423e0adfea8d512 | 2239 / 386 | [SUCCESS 42367819609](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42367819609) |
| P44 | 1d471eff789954364b92d33a54097b654062b8ae | 2242 / 386 | [SUCCESS 42367981993](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42367981993) |
| P45 | 4a282e81c09914e10fb4ad974995a1cdfa94a718 | 2246 / 386 | [SUCCESS 42368187315](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42368187315) |

P45 source inventory SHA-256: 3c962dee30d5dbef4445a8c5b9f79cd1a90735649f8d64db9d5ca8f9e8182063. P45 CI includes the six runner refusals / seven source-audit negative controls, strict dependency install, syntax, build, TypeScript and Chrome startup without game data. Fixture-driven checks remain separately recorded. The following evidence-only commit changes documentation/validation JSON; application and verification source remain identical to the audited CI-passing P45 candidate. No original-data browser verification or native-runtime claim is added. Main remains P16; P46 not started.

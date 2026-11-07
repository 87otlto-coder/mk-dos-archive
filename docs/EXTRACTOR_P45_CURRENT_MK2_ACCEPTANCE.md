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

P41-P45 are complete locally and recoverably checkpointed on develop; final committed-source/CI associations are appended after those checks finish. Next **P46 fifth-pass consolidation assessment**, not begun here; main promotion is not authorized.

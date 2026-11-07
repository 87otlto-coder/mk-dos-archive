# P41 consolidated source checkpoint

2026-11-07; develop only. Consolidates P37-P40; no runtime source changes in P41.

**PASS:** fresh 25 standard three-game suites plus the P40 original-fixture gate. MK1 2,656; MK2 5,369 / 4,357 cumulative checks; MK3 9,186. All twelve independent families: 251 representations / 939,903 indexed pixels / 10,712,883 independent checks; all 54 falsified exports rejected and clean exports reverified.

P37/P38 byte-set oracles and rejection controls, P39 original-source recheck, P40 fixture/preflight controls all pass. MK1/MK3 visual planes match P21/P26/P31/P36. MK1 archive-byte variance remains observed; its metadata cause remains inferred.

Local 381-file syntax, TypeScript, production build and eight runner preflight refusals / seven source-audit negative controls pass. Existing bundle-size warning retained. Committed-tree audit and CI association are recorded in the subsequent progress evidence after those checks finish; no unobserved CI success is claimed here.

Reproduce with matching checkpoint source:
~~~sh
node scripts/verify-p41-checkpoint.cjs --mk1 <dir> --mk2 <dir> --mk3 <dir> --report <private-json> --work <private-dir>
python scripts/test-p41-checkpoint-controls.py
~~~
P36/P31/P26 runners and evidence stay frozen. Original game files/artwork stay outside Git; original extracted fixtures were reused without a fresh archive download.

Verified source accounting is not native palette/alpha/timing, world placement or complete scenes. Original-data browser actions remain VALIDATION PENDING. Main remains P16.

Next: P42 original TOWER effect audit, P43 qualified report integration, P44 independent existing-effect export/report checks, P45 repeatable current MK2 acceptance runner. P46 is the next consolidation assessment; no main promotion.

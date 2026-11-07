# P43 TOWER existing-effect report integration
2026-11-07; second interim after P41, develop only.

The metadata-only MK2_P43_NATIVE_SOURCE_INTERVAL_COVERAGE.json extends P40 with seven independently qualified, already-exported TOWER effects. TOWER's six standalone components, seven effects and one native floor partition all **113,612 source bytes**, with zero gaps/overlap. No new images or asset representations: MK2 remains **5,369**.

**Focused original-fixture gate PASS:** 315 qualified references / 1,064,632 union bytes across the report scope. All fourteen other resource records are unchanged; P37/P38/P40 packages remain byte-identical. Ten invalid effect sets rejected, clean retry passes, source/index/mask/RGBA unchanged. Exact authenticated source, descriptors/list pointer, geometry/anchors, intervals, unknown-behavior flags and pinned index/mask hashes are required. Failure yields PARTIAL/TOWER UNAVAILABLE, not a partial verified TOWER claim.

Production changes are additive report/collection integration only. Native decoders, palettes, effect images and the workbench are retained. Existing TOWER source-linked candidate RGB is not live-DAC proof. Native alpha, clock/activation, world placement and full scenes remain unknown; browser actions validation pending.

Local 382-file syntax, TypeScript and build pass; existing bundle warning retained. Latest full three-game evidence remains P41; full current MK2 acceptance is scheduled for P45. Reproduce:
~~~sh
node scripts/verify-mk2-p43-tower-coverage.cjs <original-dir> <private-coverage.json> <private-effects.zip>
~~~
The optional private ZIP contains all 43 existing stage effects, for P44 independent readback. The stdout preview hashes are observed roundtrip references, not native RGB ownership. Original data/exports stay outside Git. Main unchanged. Next P44 independent report/export validation.

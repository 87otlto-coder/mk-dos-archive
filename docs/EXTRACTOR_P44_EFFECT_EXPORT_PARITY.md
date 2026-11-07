# P44 independent source accounting and existing-effect export proof
2026-11-07; third interim after P41, develop only. No runtime changes.

Independent original-file decoders rebuild all **315** in-scope stream/floor references, including all **43** existing TOMB/PORTAL/TOWER effects. A per-byte set oracle validates source resource hashes/sizes, exact ID/interval sets, unions/gaps/overlaps and reconciliation claim boundaries.

**PASS:** 7,064,335 original-file decoder checks; 171,036 export checks across 43 PNGs and original index/mask sidecars. Native planes, geometry, source descriptor/list/anchor metadata and diagnostic alpha match original decoding. Preview RGBA matches separately observed existing asset hashes; this is export roundtrip integrity, not independent live/native palette qualification.

**Eight falsified reports and six re-CRC'd altered exports rejected**, including wrong RGB PNG pixels, indices, masks, extents, descriptors, native timing/scene/artwork claims. Clean report/export reverified. Runtime RGB/alpha/timing/world relationships remain separately qualified; original-data browser actions pending.

Reproduce after generating private P43 outputs:
~~~sh
node scripts/verify-mk2-p43-tower-coverage.cjs <original-dir> <coverage.json> <effects.zip> > <preview-report.json>
python scripts/verify-mk2-p44-effects-and-coverage.py <original-dir> <coverage.json> <effects.zip> <preview-report.json> --report <private-result.json>
~~~
Only hashes/geometry/results and scripts are committed. Original artwork/private ZIPs remain outside Git. P41 remains consolidated checkpoint. Next P45 packages this and cumulative MK2 gates into a repeatable current acceptance runner; main unchanged.

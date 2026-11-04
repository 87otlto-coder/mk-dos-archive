#!/usr/bin/env python3
"""O128 regression suite with independently rejected falsified evidence."""
from __future__ import annotations
import unittest,copy,json,sys,hashlib
from pathlib import Path
from trace_o128_renderer_gate_boundary import produce
from verify_o128_renderer_boundary_independent import verify
class O128Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.exe=Path(cls.exe_path).read_bytes();cls.report=produce(cls.exe)
 def audit(self,r=None,b=None):
  return verify(self.exe if b is None else b,(json.dumps(self.report if r is None else r,indent=2)+'\n').encode())
 def forged(self,f):
  d=copy.deepcopy(self.report);f(d)
  with self.assertRaises(ValueError):self.audit(d)
 def test_independent(self):self.assertGreaterEqual(self.audit()['assertions'],49)
 def test_source_reproducibility(self):self.assertEqual(self.report,produce(self.exe))
 def test_original_hash(self):self.assertEqual(hashlib.sha256(self.exe).hexdigest(),self.report['sourceExeSHA256'])
 def test_ten_bounded_sample_dwords(self):self.assertEqual(len(self.report['indexedSource']['sampledDWORDs']),10)
 def test_not_31_table_extent(self):self.assertEqual(self.report['correction']['legacyO127RawSamplePreserved'],True)
 def test_next_pointer(self):self.assertEqual(self.report['followingRegion']['object2Start'],0x2ef7c)
 def test_next_pointer_separately_relocated(self):self.assertEqual(self.report['followingRegion']['independentPointerFieldObject2'],0x2f1cf)
 def test_no_runtime_bound_claim(self):self.assertFalse(self.report['indexedSource']['runtimeMaximumIndexEstablished'])
 def test_no_array_length_claim(self):self.assertFalse(self.report['indexedSource']['actualArrayLengthEstablished'])
 def test_resource_ids(self):self.assertEqual((self.report['indexedSource']['tombResourceIdHighByte'],self.report['indexedSource']['portalResourceIdHighByte']),(28,25))
 def test_zero_positions(self):self.assertEqual(self.report['indexedSource']['nullSamplePositions'],[0,6,9])
 def test_direct_call(self):self.assertEqual(self.report['guardedDispatch']['directCallerPhysical'],0x93585)
 def test_guard_bit(self):self.assertEqual(self.report['guardedDispatch']['requiredBitMask'],1)
 def test_gate_census(self):self.assertEqual(len(self.report['guardedDispatch']['guardRelocationSites']),11)
 def test_gate_three_kinds(self):
  x={z['operation'] for z in self.report['guardedDispatch']['classifiedGuardReferences']};self.assertTrue({'set_one','set_zero','xor_one','test_one'}<=x)
 def test_no_live_claims(self):
  r=self.report['guardedDispatch'];self.assertFalse(r['runtimeIndexObserved'] or r['runtimeFlagObserved'] or r['runtimeInvocationObserved'])
 def test_unchanged_source(self):
  h=hashlib.sha256(self.exe).digest();produce(self.exe);self.assertEqual(hashlib.sha256(self.exe).digest(),h)
 def test_wrong_exe_rejected(self):
  b=bytearray(self.exe);b[0x93585]^=1
  with self.assertRaises(ValueError):produce(bytes(b))
 def test_forged_a_31_entry_array(self):self.forged(lambda r:r['indexedSource'].update(sourceDWORDsBeforeSeparatelyReferencedAddress=31))
 def test_forged_runtime_bound(self):self.forged(lambda r:r['indexedSource'].update(runtimeMaximumIndexEstablished=True))
 def test_forged_table_value(self):self.forged(lambda r:r['indexedSource']['sampledDWORDs'].__setitem__(7,0))
 def test_forged_palette_handle(self):self.forged(lambda r:r.update(runtimePaletteHandle=9))
 def test_forged_flag(self):self.forged(lambda r:r['guardedDispatch'].update(requiredBitMask=2))
 def test_forged_caller(self):self.forged(lambda r:r['guardedDispatch'].update(directCallerPhysical=0x93586))
 def test_forged_boundary(self):self.forged(lambda r:r['followingRegion'].update(object2Start=0x2ef80))
 def test_forged_report_hash(self):self.forged(lambda r:r['followingRegion'].update(first21DWORDFingerprint='0'*64))
 def test_forged_gate_relocation(self):self.forged(lambda r:r['guardedDispatch']['guardRelocationSites'].__setitem__(0,1))
 def test_forged_guard_writer_class(self):self.forged(lambda r:r['guardedDispatch']['classifiedGuardReferences'][0].update(operation='test_one'))
 def test_forged_renderer_row_clip(self):self.forged(lambda r:r['guardedDispatch'].update(clipBoundaryRows=240))
 def test_forged_live_observation(self):self.forged(lambda r:r['guardedDispatch'].update(runtimeInvocationObserved=True))
 def test_forged_inference_scope(self):self.forged(lambda r:r['correction'].update(legacyO127RawSamplePreserved=False))
 def test_missing_limits(self):self.forged(lambda r:r.update(limits=[]))
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('usage: test_o128_renderer_boundary.py ORIGINAL_MK2.EXE')
 O128Tests.exe_path=sys.argv[1];sys.argv=sys.argv[:1];unittest.main(verbosity=2)

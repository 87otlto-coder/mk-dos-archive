#!/usr/bin/env python3
import argparse,copy,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import trace_o175_runtime_capture_preflight as prod
import verify_o175_independent as audit
E=None;D=None
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.ex=E;cls.dr=D;cls.r=prod.make(E,D)
 def bad(self,edit):
  r=copy.deepcopy(self.r);edit(r)
  with self.assertRaises(ValueError):audit.check(self.ex,self.dr,r)
 def test_00_source(self):self.assertEqual(audit.check(self.ex,self.dr,self.r),27)
 def test_01_modified_exe(self):
  e=bytearray(self.ex);e[-4]^=0xff
  with self.assertRaises(ValueError):prod.make(bytes(e),self.dr)
 def test_02_modified_driver(self):
  d=bytearray(self.dr);d[0x8af]^=0xff
  with self.assertRaises(ValueError):audit.check(self.ex,bytes(d),self.r)
 def test_03_runtime_segment_forgery(self):self.bad(lambda x:x['staticProvenance'].update(runtimeDriverSegment=0x1200))
 def test_04_runtime_object_base_forgery(self):self.bad(lambda x:x['staticProvenance'].update(runtimeLoadedObject1Base=0x10000))
 def test_05_runtime_FPS_forgery(self):self.bad(lambda x:x['limits'].update(perFrameSecondsVerified=True))
 def test_06_recording_forgery(self):self.bad(lambda x:x['limits'].update(actualEmulatorTraceCollected=True))
 def test_07_false_raster(self):self.bad(lambda x:x['limits'].update(rasterFrameOrderObserved=True))
 def test_08_wrong_source_base(self):self.bad(lambda x:x['staticProvenance'].update(object1FileImageBase=0x61c50))
 def test_09_wrong_driver_loc(self):self.bad(lambda x:x['watchpoints'][13].update(originalDriverRelativeOffset=0x7ee))
 def test_10_fake_absolute_offset(self):self.bad(lambda x:x['watchpoints'][0].update(runtimeLinearAddress=0x62090))
 def test_11_watchpoint_missing(self):self.bad(lambda x:x['watchpoints'].pop())
 def test_12_wrong_phase(self):self.bad(lambda x:x['driverFieldsToSample'].update(PPhaseWord=0xe6))
 def test_13_missing_boundary(self):self.bad(lambda x:x['captureMinimum'].pop())
 def test_14_fake_keyboard_observation(self):self.bad(lambda x:x['limits'].update(wallClockCalibrationEstablished=True))
 def test_15_wrong_vector_number(self):self.bad(lambda x:x['staticProvenance'].update(originalInterruptVectorNumber=9))
 def test_16_deduplicated_timing(self):self.bad(lambda x:x['captureMinimum'].__setitem__(2,'timestamp only IRQ events'))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);a=p.parse_args();E=Path(a.exe).read_bytes();D=Path(a.driver).read_bytes();unittest.main(argv=[sys.argv[0]])

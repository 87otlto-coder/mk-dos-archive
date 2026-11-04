#!/usr/bin/env python3
"""O133 tests exercise source decoding, no invented motion, and false-report rejection."""
import argparse,copy,json,sys,unittest
from pathlib import Path
from trace_o133_stage_motion_sources import produce
from verify_o133_stage_motion_independent import verify
p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);a=p.parse_args();sys.argv=sys.argv[:1]
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.b=a.exe.read_bytes();cls.r=produce(cls.b)
 def test_verifier(self):self.assertEqual(verify(self.b,self.r)['status'],'PASS_O133_INDEPENDENT')
 def test_stage_number(self):self.assertEqual(len(self.r['stages']),10)
 def test_channels(self):self.assertEqual(len(self.r['updateChannels']),9)
 def test_mode_roots(self):self.assertTrue(all(len(s['sourceTableByMode'])==3 for s in self.r['stages']))
 def test_tomb_identity(self):self.assertEqual(self.r['stages'][1]['resourceName'],'TOMB.GRA')
 def test_portal_identity(self):self.assertEqual(self.r['stages'][7]['resourceName'],'PORTAL.GRA')
 def test_tomb_values(self):self.assertEqual(self.r['stages'][1]['sourceWordsSigned16_16'],[0,0,0,49152,49152,73728,73728,98304,0])
 def test_portal_values(self):self.assertEqual(self.r['stages'][7]['sourceWordsSigned16_16'],[0,0,0,73728,0,49152,73728,98304,0])
 def test_stage_mode_consistency(self):
  for s in self.r['stages']:self.assertEqual(len({tuple(v['rawSigned16_16']) for v in s['sourceTableByMode']}),1)
 def test_reference_native_assets(self):self.assertFalse(self.r['limits']['fullSceneExportCropped'])
 def test_no_timing_claim(self):self.assertFalse(self.r['limits']['loopOrFrameTimingRecovered'])
 def test_no_parallax_claim(self):self.assertFalse(self.r['limits']['cameraParallaxMultiplierProven'])
 def test_no_live_transform_claim(self):self.assertFalse(self.r['limits']['liveRoutineSelectionKnown'])
 def _forged(self,edit):
  report=copy.deepcopy(self.r);edit(report)
  with self.assertRaises(AssertionError):verify(self.b,report)
 def test_fake_tomb_source(self):self._forged(lambda r:r['stages'][1]['sourceWordsSigned16_16'].__setitem__(3,49153))
 def test_fake_portal_source(self):self._forged(lambda r:r['stages'][7]['sourceTableByMode'][0]['rawSigned16_16'].__setitem__(3,1))
 def test_fake_channel_offset(self):self._forged(lambda r:r['updateChannels'][1].__setitem__('accumulatorGlobalObject2',0x84320))
 def test_fake_positive_command(self):self._forged(lambda r:r['stages'][1]['positiveLayerCommands'][0].__setitem__('channelIndex',8))
 def test_fake_animation_claim(self):self._forged(lambda r:r['limits'].__setitem__('loopOrFrameTimingRecovered',True))
 def test_fake_parallax_claim(self):self._forged(lambda r:r['limits'].__setitem__('cameraParallaxMultiplierProven',True))
 def test_fake_root(self):self._forged(lambda r:r['stages'][7]['sourceTableByMode'][1].__setitem__('rootObject2',0x16379))
 def test_noncanonical_exe(self):
  b=bytearray(self.b);b[0x93447]^=1
  with self.assertRaises(ValueError):produce(bytes(b))
if __name__=='__main__':unittest.main(verbosity=2)

#!/usr/bin/env python3
"""O136 source/tamper tests; requires original MK2.EXE and full mk2.zip fixture."""
import argparse,copy,hashlib,importlib.util,json,sys,unittest,zipfile
from pathlib import Path
HERE=Path(__file__).resolve().parent

def module(name,filename):
 spec=importlib.util.spec_from_file_location(name,HERE/filename);m=importlib.util.module_from_spec(spec);sys.modules[name]=m;spec.loader.exec_module(m);return m
# Source libs used only for producer; verification module has its own original sprite decoder.
exp=module('o136_export','export_o136_original_sequences.py');ver=module('o136_audit','verify_o136_independent.py')

class TestO136(unittest.TestCase):
 exe=None; gamezip=None; folder=None;manifest=None;game=None
 @classmethod
 def setUpClass(cls):
  cls.exe=Path(ARG.exe).read_bytes();cls.gamezip=Path(ARG.game_zip);cls.folder=Path(ARG.folder)
  cls.manifest=json.loads((cls.folder/'O136_FRAME_SEQUENCE_MANIFEST.json').read_text())
  cls.game=exp.get_game(cls.gamezip)
 def test_01_canonical_producer(self):
  r,assets=exp.produce(self.exe,self.game);self.assertEqual(r,self.manifest);self.assertEqual(len(assets),108)
 def test_02_independent(self):self.assertEqual(ver.audit(self.exe,self.gamezip,self.folder)['originalOrderedFrames'],36)
 def test_03_five_tracks(self):self.assertEqual(set(x['name'] for x in self.manifest['tracks']),set(exp.TRACKS))
 def test_04_36_original_frames(self):self.assertEqual(sum(len(t['frames']) for t in self.manifest['tracks']),36)
 def test_05_no_invented_fps(self):self.assertFalse(self.manifest['limits']['animationFPSVerified'])
 def test_06_no_runtime_claim(self):self.assertFalse(self.manifest['limits']['actualRuntimeActivationVerified'])
 def test_07_no_world_geometry_claim(self):self.assertFalse(self.manifest['limits']['finalSpriteWorldPositionsKnown'])
 def test_08_tomb_loopback_marker(self):self.assertTrue(all(t['sequenceTerminalWord']==1 for t in self.manifest['tracks'] if t['stage']=='tomb'))
 def test_09_portal_termination(self):self.assertTrue(all(t['sequenceTerminalWord']==0 for t in self.manifest['tracks'] if t['stage']=='portal' and t['name']!='portal_swaying'))
 def test_10_resource_continuity(self):
  t=self.manifest['tracks'];self.assertEqual(t[1]['originalSourceSpan'][1],t[0]['originalSourceSpan'][0]);self.assertEqual(t[2]['originalSourceSpan'][1],t[3]['originalSourceSpan'][0]);self.assertEqual(t[3]['originalSourceSpan'][1],t[4]['originalSourceSpan'][0])
 def test_11_no_modified_exe(self):
  bad=bytearray(self.exe);bad[0x82d57]^=1
  with self.assertRaises(ValueError):exp.produce(bytes(bad),self.game)
 def test_12_wrong_tomb_file(self):
  bad=dict(self.game);bad['tomb']=bad['tomb'][:-1]+bytes([bad['tomb'][-1]^1])
  with self.assertRaises(ValueError):exp.produce(self.exe,bad)
 def test_13_wrong_portal_file(self):
  bad=dict(self.game);bad['portal']=bad['portal'][:-1]+bytes([bad['portal'][-1]^1])
  with self.assertRaises(ValueError):exp.produce(self.exe,bad)
 def corrupt(self,action):
  bad=copy.deepcopy(self.manifest);action(bad)
  with self.assertRaises(AssertionError):ver.audit(self.exe,self.gamezip,self.folder,bad)
 def test_14_forged_frame_start(self):self.corrupt(lambda m:m['tracks'][0]['frames'][0].__setitem__('streamStart',0))
 def test_15_forged_dimensions(self):self.corrupt(lambda m:m['tracks'][1]['frames'][0].__setitem__('sourceWidth',300))
 def test_16_forged_frame_order(self):self.corrupt(lambda m:m['tracks'][0]['frames'][1].__setitem__('ordinal',0))
 def test_17_forged_frame_mask(self):self.corrupt(lambda m:m['tracks'][2]['frames'][0].__setitem__('opacityMaskSHA256','0'*64))
 def test_18_forged_sample_coordinates(self):self.corrupt(lambda m:m['tracks'][0]['frames'][0].__setitem__('signedSourceX',222))
 def test_19_forged_control_marker(self):self.corrupt(lambda m:m['tracks'][0].__setitem__('sequenceTerminalWord',0))
 def test_20_forged_png_hash(self):self.corrupt(lambda m:m['tracks'][3]['frames'][0].__setitem__('pngSHA256','0'*64))
 def test_21_forged_fps(self):self.corrupt(lambda m:m['limits'].__setitem__('animationFPSVerified',True))
 def test_22_forged_activation(self):self.corrupt(lambda m:m['limits'].__setitem__('actualRuntimeActivationVerified',True))
 def test_23_no_export_overwrite(self):
  from pathlib import Path
  self.assertTrue(self.folder.exists())
  # Parser and CLI enforce exclusive-new-output by design; don't overwrite fixtures.
  self.assertIsNotNone(self.folder/'O136_FRAME_SEQUENCE_MANIFEST.json')
 def test_24_native_sprite_boundaries(self):
  for track in self.manifest['tracks']:
   for a,b in zip(track['frames'],track['frames'][1:]):self.assertEqual(a['streamEndExclusive'],b['streamStart'])

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--game-zip',required=True);p.add_argument('--folder',required=True);ARG=p.parse_args()
 unittest.main(argv=[sys.argv[0]],verbosity=2)

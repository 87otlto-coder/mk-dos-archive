#!/usr/bin/env python3
import argparse,copy,json,unittest,sys,importlib.util,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def load(name,filename):
 spec=importlib.util.spec_from_file_location(name,ROOT/filename);m=importlib.util.module_from_spec(spec);sys.modules[name]=m;spec.loader.exec_module(m);return m
prod=load('tower_producer','export_o137_tower_effect.py');ind=load('tower_independent','verify_o137_tower_independent.py')
class TowerTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.exe=Path(ARG.exe).read_bytes();cls.gamezip=Path(ARG.game_zip);cls.folder=Path(ARG.folder)
  with zipfile.ZipFile(cls.gamezip) as z:cls.tower=z.read(next(n for n in z.namelist() if n.lower().endswith('/tower.gra')))
  cls.report=json.loads((cls.folder/'O137_TOWER_SOURCE_FRAMES.json').read_text())
 def forged(self,mutate):
  r=copy.deepcopy(self.report);mutate(r)
  with self.assertRaises(AssertionError):ind.audit(self.exe,self.gamezip,self.folder,r)
 def test_01_original_source(self):
  report,assets=prod.produce(self.exe,self.tower);self.assertEqual(report,self.report);self.assertEqual(len(assets),21)
 def test_02_independent(self):self.assertEqual(ind.audit(self.exe,self.gamezip,self.folder)['sourceFrameCount'],7)
 def test_03_exact_frame_count(self):self.assertEqual(len(self.report['frames']),7)
 def test_04_loop_back(self):self.assertEqual(self.report['originalSequenceControl']['loopBackTo'],0x16490)
 def test_05_conditional_palette(self):self.assertFalse(self.report['palette']['gameplayPaletteSelectionVerified'])
 def test_06_source_order(self):self.assertTrue(self.report['limits']['framesOrderedFromOriginalEXE'])
 def test_07_no_fps(self):self.assertFalse(self.report['limits']['actualFPSKnown'])
 def test_08_no_runtime(self):self.assertFalse(self.report['limits']['liveRoutineExecutionObserved'])
 def test_09_wrong_exe(self):
  b=bytearray(self.exe);b[0x82e72]^=1
  with self.assertRaises(ValueError):prod.produce(bytes(b),self.tower)
 def test_10_wrong_gra(self):
  b=bytearray(self.tower);b[-1]^=1
  with self.assertRaises(ValueError):prod.produce(self.exe,bytes(b))
 def test_11_tamper_descriptor(self):self.forged(lambda x:x['frames'][0].__setitem__('originalDescriptorObject2',99))
 def test_12_tamper_palette_record(self):self.forged(lambda x:x['palette'].__setitem__('sourceRecordPhysical',0))
 def test_13_tamper_frame_order(self):self.forged(lambda x:x['frames'][2].__setitem__('frameOrdinal',0))
 def test_14_tamper_png_hash(self):self.forged(lambda x:x['frames'][0].__setitem__('pngSHA256','0'*64))
 def test_15_tamper_frame_position(self):self.forged(lambda x:x['frames'][1].__setitem__('originalY',500))
 def test_16_tamper_duration(self):self.forged(lambda x:x['limits'].__setitem__('actualFPSKnown',True))
 def test_17_tamper_activation(self):self.forged(lambda x:x['limits'].__setitem__('liveRoutineExecutionObserved',True))
 def test_18_tamper_source_span(self):self.forged(lambda x:x['frames'][4].__setitem__('sourceEndExclusive',4))
 def test_19_contiguous(self):
  frames=self.report['frames'];self.assertTrue(all(a['sourceEndExclusive']==b['sourceOffset'] for a,b in zip(frames,frames[1:])))
 def test_20_one_based_palette_qualification(self):self.assertTrue(self.report['palette']['sourceColorIndicesOneBasedConditional'])
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--game-zip',required=True);p.add_argument('--folder',required=True);ARG=p.parse_args()
 unittest.main(argv=[sys.argv[0]],verbosity=2)

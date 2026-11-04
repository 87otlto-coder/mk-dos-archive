#!/usr/bin/env python3
"""O121 independent regression / adversarial tests. Uses user's original game ZIP."""
import copy,hashlib,importlib.util,json,subprocess,sys,tempfile,unittest,zipfile
from pathlib import Path
from io import BytesIO
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
sp=importlib.util.spec_from_file_location('o121independent',HERE/'verify_o121_independent.py')
v=importlib.util.module_from_spec(sp);sys.modules[sp.name]=v;sp.loader.exec_module(v)
REPORT=ROOT/'research_outputs'/'O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json'
class O121Controls(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.exe=Path(EXE).read_bytes();cls.game=Path(GAMEZIP).read_bytes()
  cls.raw=REPORT.read_bytes();cls.report=json.loads(cls.raw)
 def check_forgery(self,fn):
  forged=copy.deepcopy(self.report);fn(forged)
  with self.assertRaises((AssertionError,KeyError,TypeError,ValueError)):
   v.verify(self.exe,self.game,json.dumps(forged).encode())
 def test_01_original_independent(self):
  r=v.verify(self.exe,self.game,self.raw)
  self.assertEqual(r['controlFieldAssertions'],2025)
 def test_02_group_and_entry_counts(self):
  self.assertEqual([x['controlCount'] for x in self.report['families']],[87,28,10,10])
 def test_03_selected_palette_indices(self):
  self.assertEqual({r['paletteSlot'] for f in self.report['families'] for s in f['setups'] for r in s['rows']},{2})
 def test_04_tomb_exact_resource(self):self.assertEqual(self.report['families'][0]['resourceName'],'TOMB.GRA')
 def test_05_portal_exact_resource(self):self.assertEqual(self.report['families'][1]['resourceName'],'PORTAL.GRA')
 def test_06_alternatives_both_images_resource(self):
  self.assertEqual([f['resourceID'] for f in self.report['families'][2:]],[22,22])
 def test_07_corpus_descriptors(self):self.assertEqual(self.report['totals']['uniqueDescriptorOffsets'],49)
 def test_08_negative_alternatives_do_not_imply_never_used(self):self.assertFalse(self.report['limitations']['79PalettesNeverUsed'])
 def test_09_canonical_exe_hash(self):self.assertEqual(hashlib.sha256(self.exe).hexdigest(),self.report['canonicalExeSHA256'])
 def test_10_descriptor_record_offsets_source_bounded(self):
  for f in self.report['families']:
   for s in f['setups']:
    self.assertTrue(all(0<=r['packedResourceOffset']<f['resourceByteSize'] for r in s['rows']))
 def test_11_forged_selected_palette_index(self):
  self.check_forgery(lambda j:j['families'][0]['setups'][0]['rows'][0].__setitem__('paletteSlot',1))
 def test_12_forged_file_id(self):
  self.check_forgery(lambda j:j['families'][2].__setitem__('resourceID',28))
 def test_13_forged_file_name(self):
  self.check_forgery(lambda j:j['families'][3].__setitem__('resourceName','TOMB.GRA'))
 def test_14_forged_record_offset(self):
  self.check_forgery(lambda j:j['families'][1].__setitem__('palettePhysical',0x893c6))
 def test_15_fake_live_palette_handle(self):
  self.check_forgery(lambda j:j['limitations'].__setitem__('livePaletteHandle',True))
 def test_16_fake_runtime_setup_binding(self):
  self.check_forgery(lambda j:j['limitations'].__setitem__('activatedSetupObjectAtRuntime',True))
 def test_17_false_vga_dac_assignment(self):
  self.check_forgery(lambda j:j['limitations'].__setitem__('vgaDACStartingIndex',True))
 def test_18_fake_graphics_composition(self):
  self.check_forgery(lambda j:j['limitations'].__setitem__('finalSpriteCompositing',True))
 def test_19_wrong_sprite_size(self):
  self.check_forgery(lambda j:j['families'][0]['setups'][3]['rows'][1].__setitem__('spriteWidth',12345))
 def test_20_wrong_descriptor_byte_offset(self):
  self.check_forgery(lambda j:j['families'][1]['setups'][1]['rows'][7].__setitem__('spriteDescriptorOffsetObject2',0))
 def test_21_wrong_graphics_byte_offset(self):
  self.check_forgery(lambda j:j['families'][2]['setups'][0]['rows'][4].__setitem__('packedResourceOffset',0))
 def test_22_wrong_signed_placement(self):
  self.check_forgery(lambda j:j['families'][0]['setups'][2]['rows'][1].__setitem__('signedY',1234))
 def test_23_missing_control_entry(self):
  self.check_forgery(lambda j:j['families'][1]['setups'][0]['rows'].pop())
 def test_24_extra_family(self):
  self.check_forgery(lambda j:j['families'].append(copy.deepcopy(j['families'][0])))
 def test_25_modified_resource_rejected(self):
  with zipfile.ZipFile(BytesIO(self.game)) as archive:
   with BytesIO() as mem:
    with zipfile.ZipFile(mem,'w',compression=zipfile.ZIP_STORED) as out:
     for name in archive.namelist():
      data=archive.read(name)
      if name.lower().endswith('tomb.gra'):data=bytes([data[0]^1])+data[1:]
      out.writestr(name,data)
    with self.assertRaises(AssertionError):v.verify(self.exe,mem.getvalue(),self.raw)
 def test_26_modified_exe_rejected(self):
  bad=bytearray(self.exe);bad[0x81dd0]^=1
  with self.assertRaises(AssertionError):v.verify(bytes(bad),self.game,self.raw)
 def test_27_refuse_existing_output(self):
  with tempfile.TemporaryDirectory() as tmp:
   dest=Path(tmp)/'result.json';dest.write_bytes(b'keep me')
   result=subprocess.run([sys.executable,str(HERE/'trace_o121_control_bindings.py'),
      '--exe',EXE,'--game-zip',GAMEZIP,'--out',str(dest)],capture_output=True,text=True)
   self.assertNotEqual(result.returncode,0);self.assertEqual(dest.read_bytes(),b'keep me')
 def test_29_six_exact_rectangle_tilings(self):
  from audit_o121_tile_layouts import shapes
  result=shapes(self.report)
  self.assertEqual(result['exactRectangleTilings'],6)
  self.assertEqual(len(result['layouts']),10)
 def test_30_tomb_exact_rectangle_groups(self):
  from audit_o121_tile_layouts import shapes
  layouts=shapes(self.report)['layouts']
  self.assertEqual([x['setupOffsetObject2'] for x in layouts if x['family']=='tomb80' and x['exactNonOverlappingInBoundsTiling']],[0x17358,0x173a0,0x173b2])
 def test_31_portal_and_images_tiling(self):
  from audit_o121_tile_layouts import shapes
  layouts=shapes(self.report)['layouts']
  self.assertEqual([(x['family'],x['setupOffsetObject2']) for x in layouts if x['exactNonOverlappingInBoundsTiling'] and x['family']!='tomb80'],[('portal80',0x16526),('tomb79',0x2e7e4),('portal79',0x2e720)])
 def test_32_complex_groups_not_overstated(self):
  from audit_o121_tile_layouts import shapes
  result=shapes(self.report)
  self.assertEqual(result['limitations'],{'fullOpaquePixelCoverage':False,'observedRuntimeStageSelection':False,'screenCoordinates':False,'visibleLayerCompositing':False})
  self.assertEqual(sum(not x['exactNonOverlappingInBoundsTiling'] for x in result['layouts']),4)
 def test_28_reproduce_report_exactly(self):
  with tempfile.TemporaryDirectory() as tmp:
   dest=Path(tmp)/'result.json'
   result=subprocess.run([sys.executable,str(HERE/'trace_o121_control_bindings.py'),
      '--exe',EXE,'--game-zip',GAMEZIP,'--out',str(dest)],capture_output=True,text=True)
   self.assertEqual(result.returncode,0,result.stderr);self.assertEqual(dest.read_bytes(),self.raw)
if __name__=='__main__':
 EXE,GAMEZIP=sys.argv[1:3];sys.argv=sys.argv[:1]
 unittest.main(verbosity=2)

#!/usr/bin/env python3
"""O131 targeted regression, negative tests and independent binary witness checks."""
import copy,json,hashlib,subprocess,sys,tempfile,unittest,zipfile
from pathlib import Path
from trace_o131_packed_draw_geometry import produce,hypothetical_geometry
from verify_o131_packed_draw_geometry_independent import verify
P=Path(sys.argv[1]);EXE=P.read_bytes();REPORT=produce(EXE);RAW=(json.dumps(REPORT,indent=2)+'\n').encode()
ARC=Path(sys.argv[2]) if len(sys.argv)>2 else None
class O131(unittest.TestCase):
 def bad(self,fn):
  r=copy.deepcopy(REPORT);fn(r)
  with self.assertRaises((AssertionError,KeyError,TypeError,ValueError)):
   verify(EXE,(json.dumps(r)+'\n').encode())
 def test_01_source_identity(self):self.assertEqual(REPORT['canonicalExeSHA256'],hashlib.sha256(EXE).hexdigest())
 def test_02_independent_witness(self):self.assertGreaterEqual(verify(EXE,RAW)['assertions'],120)
 def test_03_all_seven_resources(self):self.assertEqual([s['stageIndex'] for s in REPORT['stages']],[1,2,3,4,5,7,8])
 def test_04_y_scalar_proven(self):self.assertEqual([(s['rawDestinationY'],s['requestedRows']) for s in REPORT['stages']],[(158,56),(164,40),(147,64),(172,32),(159,56),(164,40),(164,40)])
 def test_05_source_offsets_from_earlier_editor(self):self.assertEqual([s['packedSuffixStart'] for s in REPORT['stages']],[63776,59436,56268,198116,126336,56916,90488])
 def test_06_zero_vertical_adjustment(self):self.assertEqual([s['zeroScrollIllustration']['visibleRows'] for s in REPORT['stages']],[42,36,53,28,41,36,36])
 def test_07_all_clip(self):self.assertTrue(all(s['zeroScrollIllustration']['requestedEndExclusiveY']>200 for s in REPORT['stages']))
 def test_08_memory_pointer_not_file_backed(self):self.assertTrue(all(not s['sourcePointerFileBacked'] for s in REPORT['stages']))
 def test_09_armory_pointer_distinct(self):self.assertEqual([s['sourceRuntimePointerObject2'] for s in REPORT['stages'] if s['stageIndex']==5],[0x84312])
 def test_10_zero_shift_geometry(self):self.assertEqual(hypothetical_geometry(164,40)['effectiveRows'],36)
 def test_11_negative_pixel_scroll_increases_clip(self):self.assertEqual(hypothetical_geometry(164,40,vertical_scroll_fixed=-10*65536)['effectiveRows'],26)
 def test_12_positive_pixel_scroll_exposes_more(self):self.assertEqual(hypothetical_geometry(164,40,vertical_scroll_fixed=10*65536)['effectiveRows'],40)
 def test_13_negative_destination_undrawable(self):self.assertEqual(hypothetical_geometry(164,40,vertical_scroll_fixed=200*65536)['effectiveRows'],0)
 def test_14_unsigned_offscreen_200(self):self.assertIsNone(hypothetical_geometry(200,1)['drawStartY'])
 def test_15_fractional_scroll_arithmetic(self):self.assertEqual(hypothetical_geometry(164,40,vertical_scroll_fixed=0x00018000)['drawStartY'],163)
 def test_16_negative_fractional_scroll_arithmetic(self):self.assertEqual(hypothetical_geometry(164,40,vertical_scroll_fixed=-1)['drawStartY'],165)
 def test_17_camera_normalized(self):self.assertEqual(hypothetical_geometry(158,56,camera_low16=288)['rowStep16_16'],0)
 def test_18_camera_plus_one_rounds_negative(self):self.assertEqual(hypothetical_geometry(158,56,camera_low16=289)['rowStep16_16'],-585)
 def test_19_camera_minus_one_rounds_positive(self):self.assertEqual(hypothetical_geometry(158,56,camera_low16=287)['rowStep16_16'],585)
 def test_20_camera_rollover_shift(self):self.assertEqual(hypothetical_geometry(158,56,camera_low16=0)['rowStep16_16'],168521)
 def test_21_parity_with_o112_projection(self):
  sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'mk2_packed_stage'))
  from mk2_stage_projection import camera_positions
  for cam in (280,287,288,289,300):
   for rows in (1,3,20,36):
    off,step=camera_positions(48,cam,height=rows)
    result=hypothetical_geometry(164,rows,camera_low16=cam)
    self.assertEqual(step,result['rowStep16_16'])
    self.assertEqual(tuple(cam+r*896-sum(result['sourceRowShiftPixels'][1:r+1]) for r in range(rows)),off)
 def test_22_wrong_original_exe_rejected(self):
  b=bytearray(EXE);b[0x9e173]^=1
  with self.assertRaises(ValueError):produce(bytes(b))
 def test_23_wrong_source_exe_rejected_independently(self):
  b=bytearray(EXE);b[0x659c6]^=1
  with self.assertRaises(AssertionError):verify(bytes(b),RAW)
 def test_24_forge_y_rejected(self):self.bad(lambda r:r['stages'][0].__setitem__('rawDestinationY',157))
 def test_25_forge_height_rejected(self):self.bad(lambda r:r['stages'][5]['zeroScrollIllustration'].__setitem__('visibleRows',37))
 def test_26_forge_stage_source_rejected(self):self.bad(lambda r:r['stages'][4].__setitem__('packedSuffixStart',1))
 def test_27_forge_camera_rejected(self):self.bad(lambda r:r['renderer'].__setitem__('cameraReferenceWord',300))
 def test_28_false_runtime_claim_rejected(self):self.bad(lambda r:r['stages'][1].__setitem__('liveDestinationYKnown',True))
 def test_29_false_video_capture_rejected(self):self.bad(lambda r:r.__setitem__('liveCaptured',True))
 def test_30_bad_camera_inputs(self):
  for n in (-1,65536,1.5,None,True):
   with self.assertRaises(ValueError):hypothetical_geometry(158,56,camera_low16=n)
 def test_31_bad_scroll_inputs(self):
  for n in (-2147483649,2147483648,0.2):
   with self.assertRaises(ValueError):hypothetical_geometry(158,56,vertical_scroll_fixed=n)
 def test_32_bad_row_inputs(self):
  for x in ((-1,40),(158,-1),(158,65536),(158.0,56)):
   with self.assertRaises(ValueError):hypothetical_geometry(*x)
 def test_33_original_stage_resource_suffixes(self):
  if ARC is None:self.skipTest('original mk2 ZIP not provided')
  with zipfile.ZipFile(ARC) as z:
   for s in REPORT['stages']:
    b=z.read('mk2/'+s['resourceName'].lower());self.assertEqual(len(b)-s['packedSuffixStart'],s['sourceRowsInOriginalResource']*896)
 def test_34_verifier_archive_mode(self):
  if ARC is None:self.skipTest('original mk2 ZIP not provided')
  with zipfile.ZipFile(ARC) as z:self.assertGreaterEqual(verify(EXE,RAW,z)['assertions'],130)
 def test_35_cli_refuses_overwrite(self):
  with tempfile.TemporaryDirectory() as tmp:
   path=Path(tmp)/'o131.json';path.write_bytes(RAW)
   process=subprocess.run([sys.executable,str(Path(__file__).with_name('trace_o131_packed_draw_geometry.py')),'--exe',str(P),'--out',str(path)],capture_output=True,text=True)
   self.assertNotEqual(process.returncode,0);self.assertEqual(path.read_bytes(),RAW)
 def test_36_report_serialization_stable(self):self.assertEqual(verify(EXE,RAW)['reportSHA256'],hashlib.sha256(RAW).hexdigest())
if __name__=='__main__':unittest.main(argv=[sys.argv[0]],verbosity=1)

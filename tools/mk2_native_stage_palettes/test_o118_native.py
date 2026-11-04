#!/usr/bin/env python3
import io,sys,unittest,json,hashlib
from pathlib import Path
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parent));from native_stage_palettes import *
from verify_o118_independent import verify
F=Path(sys.argv[1]) if len(sys.argv)>1 and not sys.argv[1].startswith('-') else Path('fixtures')
EXE=(F/'mk2.exe').read_bytes()
CSV=(Path(__file__).resolve().parents[2]/'research_outputs/O115_OBSERVED_STAGE_FLOOR_RGB_TABLE.csv').read_bytes()
ORIG={s:(F/f'{s}.gra').read_bytes() for s in RECORDS}
class NativePaletteTests(unittest.TestCase):
 def test_verified_full_report(self):
  rep=full_report(EXE,CSV.decode());self.assertEqual(rep['witnessedMatches'],128)
  self.assertEqual(rep['records']['tomb']['alternate79MismatchedIndices'],[31])
  self.assertEqual(rep['records']['portal']['alternate79MismatchedIndices'],[])
  result=verify(EXE,CSV,(json.dumps(rep)+'\n').encode());self.assertEqual(result['independentlyVerifiedMatches'],128)
 def test_both_color_records_are_80(self):
  for stage in RECORDS:
   pal=source_palette(EXE,stage);self.assertEqual(len(pal),80);self.assertEqual(min(pal),1);self.assertEqual(max(pal),80)
 def test_reject_wrong_exe(self):
  with self.assertRaises(QualificationError):source_palette(EXE[:-1],'tomb')
  edited=bytearray(EXE);edited[0x893c8]^=1
  with self.assertRaises(QualificationError):source_palette(bytes(edited),'tomb')
 def test_reject_bad_csv(self):
  with self.assertRaises(QualificationError):full_report(EXE,CSV.decode().replace('93,36,12','92,36,12'))
  with self.assertRaises(QualificationError):full_report(EXE,CSV.decode().splitlines()[0]+'\n')
 def test_fail_wrong_record(self):
  e=bytearray(EXE);e[0x891e0]=0
  with self.assertRaises(QualificationError):source_palette(bytes(e),'portal')
 def test_two_stage_preview_byte_identity(self):
  h={'portal':'7847decd98d78d2e23cd1dcf6550eb676c6cbe08e268fd2f16cf426e2e177200',
     'tomb':'836860df914d45c5db111312c9ba0e08308f72232f0833f8fd6d4bab5e1f244f'}
  for stage in RECORDS:
   with self.subTest(stage=stage):
    rgba,height=render_original_floor(EXE,ORIG[stage],stage,RECORDS[stage]['cameraCropDemo'])
    self.assertEqual(hashlib.sha256(rgba).hexdigest(),h[stage]);self.assertEqual(len(rgba),height*320*4)
 def test_reject_invalid_preview(self):
  for stage in RECORDS:
   for crop in (-1,577):
    with self.assertRaises(QualificationError):render_original_floor(EXE,ORIG[stage],stage,crop)
   with self.assertRaises(QualificationError):render_original_floor(EXE,ORIG[stage][:-1],stage,290)
   with self.assertRaises(QualificationError):render_original_floor(EXE,ORIG[stage],stage,290,-1)
 def test_report_tamper_rejected(self):
  report=full_report(EXE,CSV.decode()); mutants=[]
  for field in ('sourceRGB8','originalWordHex','wordOffset','o115ObservedRGB8'):
   d=json.loads(json.dumps(report));d['records']['tomb']['witnesses'][2][field]='forged';mutants.append(d)
  d=json.loads(json.dumps(report));d['witnessedMatches']=127;mutants.append(d)
  d=json.loads(json.dumps(report));d['records']['portal']['matchingScreenshotIndices']=77;mutants.append(d)
  d=json.loads(json.dumps(report));d['records']['tomb']['alternate79MismatchedIndices']=[];mutants.append(d)
  for d in mutants:
   with self.subTest(field=list(d.keys())[-1]):
    with self.assertRaises((ValueError,KeyError,TypeError)):verify(EXE,CSV,json.dumps(d).encode())
 def test_strict_index_domain(self):
  with self.assertRaises(QualificationError):source_palette(EXE,'battle')
  with self.assertRaises(QualificationError):render_original_floor(EXE,ORIG['tomb'],'tomb',290,48)
if __name__=='__main__':
 # prevent fixture arg being interpreted by unittest
 unittest.main(argv=[sys.argv[0]],verbosity=2)

#!/usr/bin/env python3
"""Source-faithful, negative-case-heavy O116 observed-floor preview tests."""
import copy,hashlib,json,os,sys,tempfile,unittest,zipfile
from pathlib import Path
from PIL import Image

sys.path.insert(0,str(Path(__file__).resolve().parent))
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'mk2_packed_stage'))
from mk2_observed_floor import (STAGE_WITNESSES,FloorPreview,load_witness,
  authenticate_source,make_preview,write_outputs,QUALIFIER)
from mk2_packed_stage import (paint_region,restore,STRIDE,RESOURCES,QualificationError,sha)

SRC=Path(__file__).resolve().parents[2]
MK2_ARCHIVE=Path(os.environ.get('MK2_ORIGINAL_ZIP','/mnt/data/mk2.zip'))

class TestObservedFloor(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  assert MK2_ARCHIVE.is_file(), f'user-supplied original fixture required: {MK2_ARCHIVE}'
  with zipfile.ZipFile(MK2_ARCHIVE) as z:
   cls.original={x:z.read('mk2/'+x) for x in STAGE_WITNESSES}
  cls.reports={x:(SRC/'research_outputs'/STAGE_WITNESSES[x]['ramp']).read_bytes() for x in STAGE_WITNESSES}

 def preview(self,name='portal.gra',**kwargs):
  return make_preview(name,self.original[name],self.reports[name],source_left=kwargs.pop('source_left',292 if name=='portal.gra' else 290),**kwargs)

 def test_01_canonical_portal_full(self):
  p=self.preview();self.assertEqual((p.width,p.height),(320,40));self.assertEqual(len(p.rgba),320*40*4)
 def test_02_canonical_tomb_full(self):
  p=self.preview('tomb.gra');self.assertEqual((p.width,p.height),(320,48));self.assertEqual(len(p.rgba),320*48*4)
 def test_03_canonical_data_unchanged_portal(self):
  d=self.original['portal.gra'];s=sha(d);self.preview();self.assertEqual(sha(d),s)
 def test_04_canonical_data_unchanged_tomb(self):
  d=self.original['tomb.gra'];s=sha(d);self.preview('tomb.gra');self.assertEqual(sha(d),s)
 def test_05_whole_portal_witness_coverage(self):
  p=self.preview();self.assertEqual(p.evidence_covered,12800);self.assertEqual(p.distinct_indices,26)
 def test_06_whole_tomb_witness_coverage(self):
  p=self.preview('tomb.gra');self.assertEqual(p.evidence_covered,15360);self.assertGreaterEqual(p.distinct_indices,40)
 def test_07_opaque_portal_pixels(self):
  self.assertEqual(set(self.preview().rgba[3::4]),{255})
 def test_08_opaque_tomb_pixels(self):
  self.assertEqual(set(self.preview('tomb.gra').rgba[3::4]),{255})
 def test_09_fixed_source_col_zero(self):
  self.assertEqual(self.preview(source_left=0).source_left,0)
 def test_10_fixed_source_col_max(self):
  self.assertEqual(self.preview(source_left=576).source_left,576)
 def test_11_reject_left_negative(self):
  with self.assertRaises(QualificationError):self.preview(source_left=-1)
 def test_12_reject_left_577(self):
  with self.assertRaises(QualificationError):self.preview(source_left=577)
 def test_13_reject_left_bool(self):
  with self.assertRaises(QualificationError):self.preview(source_left=True)
 def test_14_reject_first_row_negative(self):
  with self.assertRaises(QualificationError):self.preview(source_first_row=-1)
 def test_15_reject_first_row_end(self):
  with self.assertRaises(QualificationError):self.preview(source_first_row=40)
 def test_16_last_source_row_portal(self):
  self.assertEqual(self.preview(source_first_row=39).height,1)
 def test_17_last_source_row_tomb(self):
  self.assertEqual(self.preview('tomb.gra',source_first_row=47).height,1)
 def test_18_subrange_matches_full(self):
  allp=self.preview();part=self.preview(source_first_row=8,height=5)
  self.assertEqual(part.rgba,allp.rgba[8*320*4:13*320*4])
 def test_19_reject_zero_height(self):
  with self.assertRaises(QualificationError):self.preview(height=0)
 def test_20_reject_height_overflow(self):
  with self.assertRaises(QualificationError):self.preview(source_first_row=39,height=2)
 def test_21_reject_nonint_height(self):
  with self.assertRaises(QualificationError):self.preview(height=1.0)
 def test_22_reject_other_five_stages(self):
  for name in ('battle.gra','tower.gra','forest.gra','armory.gra','arena.gra'):
   with self.subTest(name=name),self.assertRaises(QualificationError):
    make_preview(name,b'',self.reports['portal.gra'],source_left=292)
 def test_23_reject_portal_wrong_report(self):
  with self.assertRaises(QualificationError):make_preview('portal.gra',self.original['portal.gra'],self.reports['tomb.gra'],source_left=292)
 def test_24_reject_tomb_wrong_report(self):
  with self.assertRaises(QualificationError):make_preview('tomb.gra',self.original['tomb.gra'],self.reports['portal.gra'],source_left=290)
 def test_25_reject_modified_report_digest(self):
  report=bytearray(self.reports['portal.gra']);report[-3]^=1
  with self.assertRaises(QualificationError):load_witness('portal.gra',bytes(report))
 def test_26_reject_modified_original_payload(self):
  src=bytearray(self.original['portal.gra']);src[-1]^=1
  with self.assertRaises(QualificationError):make_preview('portal.gra',bytes(src),self.reports['portal.gra'],source_left=292)
 def test_27_reject_wrong_resource_name(self):
  with self.assertRaises(QualificationError):make_preview('tomb.gra',self.original['portal.gra'],self.reports['tomb.gra'],source_left=290)
 def test_28_reject_truncated_file(self):
  with self.assertRaises(QualificationError):make_preview('portal.gra',self.original['portal.gra'][:-1],self.reports['portal.gra'],source_left=292)
 def test_29_reject_spoofed_header(self):
  src=bytearray(self.original['portal.gra']);src[0]^=1
  with self.assertRaises(QualificationError):make_preview('portal.gra',bytes(src),self.reports['portal.gra'],source_left=292)
 def test_30_reject_malformed_receipt(self):
  with self.assertRaises(QualificationError):make_preview('portal.gra',self.original['portal.gra'],self.reports['portal.gra'],source_left=292,receipt_bytes=b'{')
 def test_31_authenticated_modification_portal(self):
  src=self.original['portal.gra'];new,receipt=paint_region('portal.gra',src,x=292,y=3,width=4,height=2,value=80)
  p=make_preview('portal.gra',new,self.reports['portal.gra'],source_left=292,receipt_bytes=json.dumps(receipt).encode());self.assertTrue(p.modified)
  self.assertEqual(p.source_indices[3*320:3*320+4],bytes([80])*4)
  self.assertEqual(restore('portal.gra',new,receipt),src)
 def test_32_authenticated_modification_tomb(self):
  src=self.original['tomb.gra'];new,receipt=paint_region('tomb.gra',src,x=300,y=5,width=12,height=3,value=31)
  p=make_preview('tomb.gra',new,self.reports['tomb.gra'],source_left=290,receipt_bytes=json.dumps(receipt).encode());self.assertTrue(p.modified)
  self.assertEqual(p.source_indices[5*320+10:5*320+22],bytes([31])*12)
  self.assertEqual(restore('tomb.gra',new,receipt),src)
 def test_33_refuse_unknown_index_even_with_valid_receipt(self):
  src=self.original['portal.gra'];new,receipt=paint_region('portal.gra',src,x=292,y=0,width=1,height=1,value=253)
  with self.assertRaises(QualificationError):make_preview('portal.gra',new,self.reports['portal.gra'],source_left=292,receipt_bytes=json.dumps(receipt).encode())
 def test_34_refuse_modification_without_receipt(self):
  src=self.original['portal.gra'];new,_=paint_region('portal.gra',src,x=292,y=0,width=2,height=1,value=80)
  with self.assertRaises(QualificationError):make_preview('portal.gra',new,self.reports['portal.gra'],source_left=292)
 def test_35_reject_wrong_modified_receipt(self):
  src=self.original['portal.gra'];new,receipt=paint_region('portal.gra',src,x=292,y=2,width=1,height=1,value=80)
  altered=copy.deepcopy(receipt);altered['changedCount']+=1
  with self.assertRaises(QualificationError):make_preview('portal.gra',new,self.reports['portal.gra'],source_left=292,receipt_bytes=json.dumps(altered).encode())
 def test_36_reject_modified_bytes_after_receipt(self):
  src=self.original['portal.gra'];new,receipt=paint_region('portal.gra',src,x=292,y=1,width=1,height=1,value=80)
  modified=bytearray(new);modified[-1]^=1
  with self.assertRaises(QualificationError):make_preview('portal.gra',bytes(modified),self.reports['portal.gra'],source_left=292,receipt_bytes=json.dumps(receipt).encode())
 def test_37_output_no_overwrite(self):
  p=self.preview()
  with tempfile.TemporaryDirectory() as td:
   a=Path(td)/'a.png';b=Path(td)/'b.json';a.write_text('exists')
   with self.assertRaises(QualificationError):write_outputs(p,'portal.gra',self.original['portal.gra'],self.reports['portal.gra'],a,b)
   self.assertFalse(b.exists())
 def test_38_output_collision(self):
  p=self.preview()
  with tempfile.TemporaryDirectory() as td:
   a=Path(td)/'same.png'
   with self.assertRaises(QualificationError):write_outputs(p,'portal.gra',self.original['portal.gra'],self.reports['portal.gra'],a,a)
 def test_39_output_bytes_and_manifest(self):
  p=self.preview()
  with tempfile.TemporaryDirectory() as td:
   a=Path(td)/'p.png';b=Path(td)/'p.json';report=write_outputs(p,'portal.gra',self.original['portal.gra'],self.reports['portal.gra'],a,b,scale=1)
   with Image.open(a) as image:self.assertEqual(image.size,(320,40))
   self.assertEqual(report['outputPNG_SHA256'],sha(a.read_bytes()))
   self.assertEqual(report['qualification'],QUALIFIER)
   self.assertEqual(json.loads(b.read_text()),report)
 def test_40_output_scale_three(self):
  p=self.preview('tomb.gra')
  with tempfile.TemporaryDirectory() as td:
   a=Path(td)/'a.png';b=Path(td)/'a.json';write_outputs(p,'tomb.gra',self.original['tomb.gra'],self.reports['tomb.gra'],a,b,scale=3)
   with Image.open(a) as image:self.assertEqual(image.size,(960,144))
 def test_41_output_refuse_scale_zero(self):
  p=self.preview()
  with tempfile.TemporaryDirectory() as td:
   with self.assertRaises(QualificationError):write_outputs(p,'portal.gra',self.original['portal.gra'],self.reports['portal.gra'],Path(td)/'a',Path(td)/'b',scale=0)
 def test_42_output_refuse_scale_nine(self):
  p=self.preview()
  with tempfile.TemporaryDirectory() as td:
   with self.assertRaises(QualificationError):write_outputs(p,'portal.gra',self.original['portal.gra'],self.reports['portal.gra'],Path(td)/'a',Path(td)/'b',scale=9)
 def test_43_output_determinism(self):
  p=self.preview()
  with tempfile.TemporaryDirectory() as td:
   a=Path(td)/'a.png';b=Path(td)/'a.json';c=Path(td)/'b.png';d=Path(td)/'b.json'
   write_outputs(p,'portal.gra',self.original['portal.gra'],self.reports['portal.gra'],a,b)
   write_outputs(p,'portal.gra',self.original['portal.gra'],self.reports['portal.gra'],c,d)
   self.assertEqual(a.read_bytes(),c.read_bytes());self.assertEqual(b.read_bytes(),d.read_bytes())
 def test_44_region_4_byte_stride(self):
  p=self.preview();a=self.original['portal.gra'];ofs=RESOURCES['portal.gra'][1]
  for y in (0,2,9,25,39):
   for x in (0,1,4,115,319):self.assertEqual(p.source_indices[y*320+x],a[ofs+y*896+292+x])
 def test_45_color_mapping_pixel_correct(self):
  p=self.preview();colors,_=load_witness('portal.gra',self.reports['portal.gra'])
  for y in (0,1,9,17,39):
   for x in (0,1,4,115,319):
    ofs=4*(y*320+x)
    self.assertEqual(p.rgba[ofs:ofs+3],colors[p.source_indices[y*320+x]])
 def test_46_correct_tomb_palette_color_mapping(self):
  p=self.preview('tomb.gra');colors,_=load_witness('tomb.gra',self.reports['tomb.gra'])
  for y in (0,4,8,27,47):
   for x in (0,1,4,115,319):
    ofs=4*(y*320+x)
    self.assertEqual(p.rgba[ofs:ofs+3],colors[p.source_indices[y*320+x]])
 def test_47_distinct_source_offsets_alter_preview(self):
  self.assertNotEqual(self.preview(source_left=291).rgba,self.preview(source_left=292).rgba)
 def test_48_index_domain_no_guesses(self):
  for name in STAGE_WITNESSES:
   p=self.preview(name)
   d=STAGE_WITNESSES[name]
   self.assertGreaterEqual(min(p.source_indices),d['minIndex']);self.assertLessEqual(max(p.source_indices),d['maxIndex'])
 def test_49_native_unscaled_rgba_consistent(self):
  p=self.preview();self.assertEqual(Image.frombytes('RGBA',(320,40),p.rgba).tobytes(),p.rgba)
 def test_50_row_window_last_valid(self):
  p=self.preview(source_first_row=25,height=15);self.assertEqual(p.height,15)

if __name__=='__main__':unittest.main()

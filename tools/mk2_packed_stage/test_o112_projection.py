"""O112 end-to-end regression, boundary and adversarial tests. Requires original MK2 fixture."""
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import zlib
import struct
import unittest
from zipfile import ZipFile
from mk2_packed_stage import RESOURCES,QualificationError,restore,sha
from mk2_stage_projection import (project_source,project_plane,edit_projected,verify_exe,
 camera_positions,ANCHORS,BANK_LOOKUP_PHYSICAL,diagnostic_grayscale_png)
from verify_o112_50_passes import verify,entries

FIXTURE=Path(os.environ.get('MK2_CANONICAL_ZIP','/mnt/data/mk2.zip'))
HERE=Path(__file__).parent
REPORT=HERE.parents[1]/'research_outputs/MK2_O112_50_PASSES.json'

class O112ProjectedFloorTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  with ZipFile(FIXTURE) as z:
   cls.data={n:z.read('mk2/'+n) for n in RESOURCES}
   cls.exe=z.read('mk2/mk2.exe')

 def test_original_exe_complete_anchors(self):
  self.assertTrue(verify_exe(self.exe))
  self.assertEqual(len(ANCHORS),4)

 def test_exe_poison_rejected(self):
  bad=bytearray(self.exe);bad[BANK_LOOKUP_PHYSICAL+25]^=1
  with self.assertRaises(QualificationError):verify_exe(bytes(bad))

 def test_camera_trajectories(self):
  a,s=camera_positions(64,176,16)
  b,t=camera_positions(64,400,16)
  self.assertEqual((a[0],a[1],a[-1],s),(176,1071,13496,65536))
  self.assertEqual((b[0],b[1],b[-1],t),(400,1297,13960,-65536))
  self.assertEqual(camera_positions(48,288)[0],tuple(i*896+288 for i in range(48)))

 def test_center_unmodified_all_seven(self):
  for n,src in self.data.items():
   with self.subTest(n=n):
    r=RESOURCES[n][2];off=RESOURCES[n][1]
    view=project_source(n,src,camera_x=288,bank_start=1,exe=self.exe)
    expected=b''.join(src[off+i*896+288:off+i*896+608] for i in range(r))
    self.assertEqual(view.data,expected)

 def test_hypothetical_palette_193_has_expected_nontrivial_carry(self):
  counts={}
  for n,src in self.data.items():
   v=project_source(n,src,bank_start=193)
   raw=project_source(n,src,bank_start=1).data
   naive=bytes((a+192)&255 for a in raw)
   counts[n]=sum(a!=b for a,b in zip(v.data,naive))
  self.assertEqual(counts,{'tomb.gra':0,'battle.gra':47,'tower.gra':3947,
    'forest.gra':80,'armory.gra':24,'portal.gra':9184,'arena.gra':736})

 def test_projected_single_pixel_4_alignment_classes(self):
  n='portal.gra';src=self.data[n]
  for x in (0,1,2,3,120,121,122,123,318,319):
   with self.subTest(x=x):
    v=project_source(n,src,bank_start=193,height=16)
    new=v.data[5*320+x]^0xAA
    edited,receipt,old,out=edit_projected(n,src,camera_x=288,bank_start=193,
      x=x,y=5,width=1,height=1,new_index=new,projection_height=16)
    self.assertEqual([(i) for i,(a,b) in enumerate(zip(old.data,out.data)) if a!=b],[5*320+x])
    self.assertEqual(restore(n,edited,receipt),src)

 def test_cross_dword_rectangle(self):
  n='tomb.gra';src=self.data[n]
  edited,receipt,old,new=edit_projected(n,src,camera_x=288,bank_start=49,
    x=3,y=4,width=10,height=1,new_index=255,projection_height=16)
  target=bytearray(old.data);target[4*320+3:4*320+13]=b'\xff'*10
  self.assertEqual(new.data,target)
  self.assertEqual(restore(n,edited,receipt),src)

 def test_multiline_rectangle_with_offset_camera(self):
  n='arena.gra';src=self.data[n]
  edited,receipt,old,new=edit_projected(n,src,camera_x=176,bank_start=65,
    x=107,y=6,width=37,height=3,new_index=199,projection_height=16)
  target=bytearray(old.data)
  for y in range(6,9):target[y*320+107:y*320+144]=bytes([199])*37
  self.assertEqual(new.data,target)
  self.assertEqual(restore(n,edited,receipt),src)

 def test_edit_is_always_bounded_to_canonical_suffix(self):
  for n,src in self.data.items():
   with self.subTest(n=n):
    edited,receipt,_,_=edit_projected(n,src,camera_x=400,bank_start=193,
      x=121,y=8,width=1,height=1,new_index=202,projection_height=16)
    self.assertEqual(edited[:RESOURCES[n][1]],src[:RESOURCES[n][1]])
    self.assertEqual(len(edited),len(src))
    self.assertEqual(restore(n,edited,receipt),src)

 def test_source_corruption_fails_closed(self):
  n='tomb.gra';src=bytearray(self.data[n]);src[0]^=16
  with self.assertRaises(QualificationError):project_source(n,bytes(src))
  with self.assertRaises(QualificationError):edit_projected(n,bytes(src),camera_x=288,bank_start=1,
    x=10,y=1,width=1,height=1,new_index=4)

 def test_invalid_projected_geometry(self):
  n='tomb.gra';src=self.data[n]
  bad=[(-1,0,1,1,20),(320,0,1,1,20),(319,0,2,1,20),(0,48,1,1,20),
       (0,0,0,1,20),(0,0,1,0,20),(0,0,1,1,-1),(0,0,1,1,256)]
  for x,y,w,h,val in bad:
   with self.subTest(v=(x,y,w,h,val)),self.assertRaises(QualificationError):
    edit_projected(n,src,camera_x=288,bank_start=1,x=x,y=y,width=w,height=h,new_index=val)

 def test_invalid_palette_and_camera_inputs(self):
  n='tomb.gra';src=self.data[n]
  for b in (-1,0,257,900,True):
   with self.subTest(bank=b),self.assertRaises(QualificationError):project_source(n,src,bank_start=b)
  for cam in (-100,577,10000,True):
   with self.subTest(cam=cam),self.assertRaises(QualificationError):project_source(n,src,camera_x=cam)
  with self.assertRaises(QualificationError):project_source(n,src,height=49)

 def test_altered_restoration_metadata_does_not_recover(self):
  n='portal.gra';src=self.data[n]
  edited,receipt,_,_=edit_projected(n,src,camera_x=400,bank_start=193,
    x=121,y=8,width=1,height=1,new_index=201,projection_height=16)
  for field,v in [('changedCount',1000),('packedOffset',0),('patchedResourceSha256','0'*64),
                  ('restoreOriginalPlaneHex','ab'),('canonicalResourceSha256','0'*64)]:
   with self.subTest(field=field),self.assertRaises(QualificationError):
    restore(n,edited,receipt|{field:v})

 def test_cli_projection_and_paint_do_not_overwrite(self):
  with tempfile.TemporaryDirectory() as td:
   d=Path(td);src=d/'portal.gra';src.write_bytes(self.data['portal.gra'])
   view=d/'indices.bin';patch=d/'patched.gra';rec=d/'receipt.json';report=d/'projection.json';png=d/'indices_diagnostic_gray.png'
   def run(*args):return subprocess.run([sys.executable,str(HERE/'mk2_stage_projection.py'),*map(str,args)],capture_output=True,text=True)
   p=run('project',src,view,'--camera-x','288','--bank-start','193','--rows','16','--report',report,'--diagnostic-png',png)
   self.assertEqual(p.returncode,0,p.stderr)
   self.assertTrue(png.read_bytes().startswith(b'\x89PNG'))
   self.assertEqual(view.read_bytes(),project_source('portal.gra',src.read_bytes(),height=16,bank_start=193).data)
   self.assertNotEqual(run('project',src,view).returncode,0)
   p=run('paint-projection',src,patch,rec,'--camera-x','288','--bank-start','193','--rows','16',
      '--x','9','--y','5','--width','16','--height','3','--value','250')
   self.assertEqual(p.returncode,0,p.stderr)
   self.assertEqual(restore('portal.gra',patch.read_bytes(),json.loads(rec.read_text())),src.read_bytes())
   self.assertNotEqual(run('paint-projection',src,patch,rec,'--x','2','--y','1',
      '--width','1','--height','1','--value','3').returncode,0)


 def test_diagnostic_png_is_lossless_index_grayscale_not_rgb(self):
  p=project_source('tomb.gra',self.data['tomb.gra'],bank_start=193,height=16)
  img=diagnostic_grayscale_png(p)
  self.assertTrue(img.startswith(b'\x89PNG\r\n\x1a\n'))
  self.assertEqual(struct.unpack_from('>II',img,16),(320,16))
  idx=img.index(b'IDAT')
  n=struct.unpack_from('>I',img,idx-4)[0]
  pixels=zlib.decompress(img[idx+4:idx+4+n])
  self.assertEqual(pixels,b''.join(b'\x00'+p.data[y*320:(y+1)*320] for y in range(16)))

 def test_cli_duplicate_destination_rejected_before_any_write(self):
  with tempfile.TemporaryDirectory() as td:
   d=Path(td);src=d/'tomb.gra';src.write_bytes(self.data['tomb.gra'])
   same=d/'same.bin'
   res=subprocess.run([sys.executable,str(HERE/'mk2_stage_projection.py'),'project',str(src),str(same),'--report',str(same)],capture_output=True,text=True)
   self.assertNotEqual(res.returncode,0)
   self.assertFalse(same.exists())

 def test_replay_previous_o110c_cases(self):
  parent=HERE.parents[1]/'evidence/mk2_o110c/mk2_o110c_stage_viewport_manifest.json'
  old=json.loads(parent.read_text())
  for stage in old['rows']:
   n=stage['resource'].lower();src=self.data[n]
   for case in stage['cases']:
    with self.subTest(name=n,camera=case['x'],bank=case['hypotheticalBankStart']):
     view=project_source(n,src,camera_x=case['x'],bank_start=case['hypotheticalBankStart'],height=case['height'])
     self.assertEqual(sha(view.data),case['indexSHA256'])
     self.assertEqual(view.slope_16_16,case['slope16_16'])

class O112IndependentAuditTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.good=json.loads(REPORT.read_text());cls.expected=entries(FIXTURE)
 def test_valid_report_exactly_matches_external_computation(self):
  self.assertEqual(self.good,self.expected)
  self.assertGreaterEqual(verify(FIXTURE,self.good),2000)
 def test_multiple_forged_fields_detected(self):
  variants=[
   ('digest',1,lambda d:d['passes'][0]['result'].__setitem__('viewIndexSha256','0'*64)),
   ('camera',2,lambda d:d['passes'][7]['result'].__setitem__('cameraX',175)),
   ('slope',3,lambda d:d['passes'][15]['result'].__setitem__('slope16_16',1)),
   ('bank193',4,lambda d:d['passes'][21]['result'].__setitem__('byteMismatchVsIndependentByteShift',1)),
   ('source',5,lambda d:d['passes'][25].__setitem__('resource','fiction.gra')),
   ('exe',6,lambda d:d['passes'][42]['result'].__setitem__('computedRasterTarget','0x42')),
   ('lut',7,lambda d:d['passes'][43]['result'].__setitem__('lutSha256','0'*64)),
   ('pixel',8,lambda d:d['passes'][47]['result']['edits'][0].__setitem__('changedSourceBytes',44)),
   ('negative',9,lambda d:d['passes'][48]['result'].__setitem__('rejectionCount',5)),
   ('whole',10,lambda d:d['passes'][49]['result'].__setitem__('sourceSuffixBytes',1)),
   ('passcount',11,lambda d:d.__setitem__('staticallyVerified',49)),
  ]
  for tag,_,mutate in variants:
   with self.subTest(tag=tag):
    bad=copy.deepcopy(self.good);mutate(bad)
    self.assertNotEqual(bad,self.expected)
    # Recompute from the original ZIP for every forged report; no cached oracle.
    with self.assertRaises(AssertionError): verify(FIXTURE,bad)

if __name__=='__main__':unittest.main(verbosity=2)

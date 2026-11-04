"""MK2 packed-stage editor regression + adversarial checks using canonical user-owned fixture."""
from __future__ import annotations
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile

HERE=Path(__file__).parent
sys.path.insert(0,str(HERE))
from mk2_packed_stage import (EXE_SHA, RESOURCES, STRIDE, LEFT_MARGIN, VIEWPORT,
 QualificationError, inspect, paint_region, replace_plane, resource_identity,
 restore, sha, verify_native_reference)
FIXTURE=Path(__file__).resolve().parents[4]/'mk2.zip'
if not FIXTURE.is_file():FIXTURE=Path('/mnt/data/mk2.zip')

class MK2PackedStageEditorTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  with zipfile.ZipFile(FIXTURE) as z:
   cls.files={name:z.read('mk2/'+name) for name in list(RESOURCES)+['mk2.exe']}

 def test_exact_seven_native_table_records(self):
  self.assertTrue(verify_native_reference(self.files['mk2.exe']))
  bad=bytearray(self.files['mk2.exe']);bad[0xCFBAC]^=1
  with self.assertRaises(QualificationError):verify_native_reference(bytes(bad))

 def test_can_inspect_all_seven_original_files(self):
  for name,data in self.files.items():
   if name=='mk2.exe':continue
   with self.subTest(name=name):
    m=inspect(name,data,exe=self.files['mk2.exe'])
    self.assertEqual(m['packedLength'],m['sourceStride']*m['sourceRows'])
    self.assertEqual(m['sourceSha256'],sha(data))
    self.assertTrue(m['exePointerTableChecked'])
    self.assertEqual(len(m['rowSha256']),m['sourceRows'])
    self.assertEqual(len(set(m['rowSha256'])),m['sourceRows'])

 def test_noop_exact_byte_round_trip_all_seven(self):
  for name,data in self.files.items():
   if name=='mk2.exe':continue
   with self.subTest(name=name):
    off=RESOURCES[name][1]
    out,receipt=replace_plane(name,data,data[off:])
    self.assertEqual(data,out)
    self.assertEqual(receipt['changedCount'],0)
    self.assertEqual(data,restore(name,out,receipt))

 def test_one_byte_edit_restores_all_seven(self):
  for name,data in self.files.items():
   if name=='mk2.exe':continue
   with self.subTest(name=name):
    offset=RESOURCES[name][1]; y=3;x=288;old=data[offset+y*STRIDE+x]
    out,receipt=paint_region(name,data,x=x,y=y,width=1,height=1,value=old^255)
    self.assertEqual(receipt['changedCount'],1)
    self.assertEqual(out[offset+y*STRIDE+x],old^255)
    self.assertEqual(data[:offset],out[:offset]);self.assertEqual(data,restore(name,out,receipt))

 def test_row_boundary_edit_all_seven(self):
  for name,data in self.files.items():
   if name=='mk2.exe':continue
   with self.subTest(name=name):
    rows=RESOURCES[name][2];offset=RESOURCES[name][1]
    out,receipt=paint_region(name,data,x=895,y=rows-1,width=1,height=1,value=data[-1]^255)
    self.assertEqual(receipt['changedCount'],1)
    self.assertEqual(len(out),len(data));self.assertEqual(out[-1],data[-1]^255)
    self.assertEqual(data,restore(name,out,receipt))

 def test_mutated_source_rejected_seven(self):
  for name,data in self.files.items():
   if name=='mk2.exe':continue
   with self.subTest(name=name):
    corrupted=bytes([data[0]^255])+data[1:]
    with self.assertRaises(QualificationError):replace_plane(name,corrupted,data[RESOURCES[name][1]:])

 def test_wrong_plane_size_rejected_seven(self):
  for name,data in self.files.items():
   if name=='mk2.exe':continue
   with self.subTest(name=name):
    suffix=data[RESOURCES[name][1]:]
    for change in (suffix[:-1],suffix+b'\x00'):
     with self.assertRaises(QualificationError):replace_plane(name,data,change)

 def test_strict_source_rect_boundaries(self):
  src=self.files['tomb.gra']
  invalid=[(-1,0,1,1,0),(0,-1,1,1,0),(896,0,1,1,0),(0,48,1,1,0),(0,0,0,1,0),(0,0,1,0,0),(895,0,2,1,0),(0,47,1,2,0),(0,0,1,1,-1),(0,0,1,1,256)]
  for x,y,w,h,v in invalid:
   with self.subTest(x=x,y=y,w=w,h=h,value=v),self.assertRaises(QualificationError):paint_region('tomb.gra',src,x=x,y=y,width=w,height=h,value=v)

 def test_nonzero_contiguous_region_exact_delta(self):
  src=self.files['portal.gra']; off=RESOURCES['portal.gra'][1]
  out,receipt=paint_region('portal.gra',src,x=11,y=12,width=70,height=6,value=242)
  self.assertEqual(len(src),len(out))
  changed={i for i,(a,b) in enumerate(zip(src,out)) if a!=b}
  allowed={off+y*STRIDE+x for y in range(12,18) for x in range(11,81)}
  self.assertTrue(changed and changed.issubset(allowed))
  self.assertEqual(receipt['changedCount'],len(changed))
  self.assertEqual(src,restore('portal.gra',out,receipt))

 def test_cross_resource_receipt_rejected(self):
  tomb=self.files['tomb.gra'];portal=self.files['portal.gra']
  pt,rt=paint_region('tomb.gra',tomb,x=0,y=0,width=1,height=1,value=tomb[63776]^255)
  with self.assertRaises(QualificationError):restore('portal.gra',portal,rt)
  with self.assertRaises(QualificationError):restore('wrong.gra',pt,rt)

 def test_tampered_output_rejected(self):
  tomb=self.files['tomb.gra'];out,receipt=paint_region('tomb.gra',tomb,x=0,y=0,width=1,height=1,value=tomb[63776]^255)
  wrong=bytearray(out);wrong[-1]^=1
  with self.assertRaises(QualificationError):restore('tomb.gra',bytes(wrong),receipt)

 def test_tampered_receipt_rejected(self):
  portal=self.files['portal.gra'];out,receipt=paint_region('portal.gra',portal,x=0,y=0,width=1,height=1,value=portal[56916]^255)
  for k,v in [('canonicalResourceSha256','0'*64),('originalPlaneSha256','0'*64),('changedCount',999),('packedOffset',13),('sourceStride',320),('domain','FAKE'),('restoreOriginalPlaneHex','00')]:
   bad=receipt|{k:v}
   with self.subTest(k=k),self.assertRaises(QualificationError):restore('portal.gra',out,bad)

 def test_file_output_exclusive_and_restoration_cli(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);src=root/'tomb.gra';src.write_bytes(self.files['tomb.gra']);patched=root/'edited.gra';receipt=root/'receipt.json';restored=root/'restored.gra'
   script=HERE/'mk2_packed_stage.py'
   call=lambda *args:subprocess.run([sys.executable,str(script),*map(str,args)],capture_output=True,text=True)
   p=call('paint',src,patched,receipt,'--x','286','--y','0','--width','10','--height','2','--value','255')
   self.assertEqual(p.returncode,0,p.stderr)
   p=call('restore',patched,receipt,restored)
   self.assertEqual(p.returncode,0,p.stderr)
   self.assertEqual(restored.read_bytes(),src.read_bytes())
   self.assertNotEqual(patched.read_bytes(),src.read_bytes())
   self.assertNotEqual(call('paint',src,patched,receipt,'--x','0','--y','0','--width','1','--height','1','--value','2').returncode,0)

 def test_will_not_call_raw_plane_verified_rgba(self):
  i=inspect('tomb.gra',self.files['tomb.gra'])
  self.assertEqual(i['researchBoundary'],'SOURCE_PLANE_NOT_VERIFIED_GAMEPLAY_RGBA')
  self.assertFalse(i['exePointerTableChecked'])

if __name__=='__main__':unittest.main(verbosity=2)

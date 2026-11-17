#!/usr/bin/env python3
"""Spelunk 005 synthetic tests: source list vs palette/placement boundaries.

NO commercial EXE or GRA input. GitHub CI must not be advertised as original
resource verification; these cases check strict parser mechanics only.
"""
import hashlib,struct,unittest
import trace_bang_suck_sources as s

def dw(n):return struct.pack("<I",n&0xffffffff)
def spr(value):return dw((1<<10)|((value&255)<<2)|2)

class OriginalFree(unittest.TestCase):
 def test_resource_identity_pins_are_distinct(self):
  self.assertEqual(s.RES["BANG.GRA"]["rid"],12)
  self.assertEqual(s.RES["SUCK.GRA"]["rid"],14)
  self.assertNotEqual(s.RES["BANG.GRA"]["sha256"],s.RES["SUCK.GRA"]["sha256"])

 def test_bang_eleven_selected_lists(self):
  self.assertEqual(len(s.BANG_ROOTS),11)
  self.assertEqual(sum(s.BANG_SIZES),95)
  self.assertEqual(s.BANG_ROOTS[0],0x1b540)
  self.assertEqual(s.BANG_ROOTS[-1],0x1b6d4)

 def test_suck_finite_vs_loop(self):
  self.assertEqual([(x[2],x[3]) for x in s.SUCK_SPECS],[(5,0),(5,0),(8,1)])
  self.assertEqual(s.SUCK_SPECS[2][4],0x1bf30)

 def test_interval_full_partition(self):
  records=[{"descriptorObject2":i+1,"sourceStart":i*4,"sourceEndExclusive":(i+1)*4}
           for i in range(3)]
  a,u=s.coverage(records,12)
  self.assertEqual(len(a),3)
  self.assertEqual(u,[(0,4),(4,8),(8,12)])

 def test_interval_repeated_frame_safe(self):
  records=[{"descriptorObject2":1,"sourceStart":0,"sourceEndExclusive":4},
           {"descriptorObject2":1,"sourceStart":0,"sourceEndExclusive":4},
           {"descriptorObject2":2,"sourceStart":4,"sourceEndExclusive":8}]
  a,u=s.coverage(records,8)
  self.assertEqual((len(a),len(u)),(2,2))

 def test_gap_refusal(self):
  data=[{"descriptorObject2":1,"sourceStart":0,"sourceEndExclusive":4},
        {"descriptorObject2":2,"sourceStart":5,"sourceEndExclusive":8}]
  with self.assertRaisesRegex(ValueError,"gap or overlap"):
   s.coverage(data,8)

 def test_overlap_refusal(self):
  data=[{"descriptorObject2":1,"sourceStart":0,"sourceEndExclusive":5},
        {"descriptorObject2":2,"sourceStart":4,"sourceEndExclusive":8}]
  with self.assertRaisesRegex(ValueError,"gap or overlap"):
   s.coverage(data,8)

 def test_missing_tail_refusal(self):
  with self.assertRaisesRegex(ValueError,"not fully accounted"):
   s.coverage([{"descriptorObject2":1,"sourceStart":0,"sourceEndExclusive":4}],8)

 def test_conflicting_descriptor_refusal(self):
  data=[{"descriptorObject2":1,"sourceStart":0,"sourceEndExclusive":4},
        {"descriptorObject2":1,"sourceStart":4,"sourceEndExclusive":8}]
  with self.assertRaisesRegex(ValueError,"inconsistent"):
   s.coverage(data,8)

 def test_sequence_finite_source(self):
  mem=bytearray(s.O2+0x31000);fx={}
  desc=0x2300;lst=0x5000
  struct.pack_into("<I",mem,s.O2+lst,desc)
  struct.pack_into("<I",mem,s.O2+lst+4,0)
  struct.pack_into("<HHhhI",mem,s.O2+desc,1,1,-3,4,(14<<24)|0)
  fx[(2,lst)]=(7,16,2,desc)
  result=s.sequence(mem,fx,spr(7),14,lst,1,0,None)
  self.assertEqual(result["terminator"],0)
  self.assertEqual(result["distinctDescriptors"],1)
  self.assertEqual(result["orderedEntries"][0]["signedLocalXY"],[-3,4])

 def test_loop_back_pointer_refusal(self):
  mem=bytearray(s.O2+0x31000);fx={};desc=0x2300;lst=0x5000
  struct.pack_into("<I",mem,s.O2+lst,desc)
  struct.pack_into("<I",mem,s.O2+lst+4,1)
  struct.pack_into("<I",mem,s.O2+lst+8,lst)
  struct.pack_into("<HHhhI",mem,s.O2+desc,1,1,0,0,(12<<24)|0)
  fx[(2,lst)]=(7,16,2,desc)
  fx[(2,lst+8)]=(7,16,2,lst)
  assert s.sequence(mem,fx,spr(5),12,lst,1,1,lst)["backPointer"]==lst
  fx[(2,lst+8)]=(7,16,2,lst+4)
  with self.assertRaisesRegex(ValueError,"typed LE"):
   s.sequence(mem,fx,spr(5),12,lst,1,1,lst)

 def test_sprite_resource_rejection(self):
  mem=bytearray(s.O2+0x3000)
  struct.pack_into("<HHhhI",mem,s.O2+0x2500,1,1,0,0,(14<<24)|0)
  with self.assertRaisesRegex(ValueError,"resource ID mismatch"):
   s.descriptor(mem,{},spr(7),12,0x2500)

 def test_bang_nonuniform_tail_is_not_animation(self):
  self.assertEqual(s.BANG_PAIRS[0][1],0x1b7dc)
  self.assertEqual(s.BANG_UNCLASSIFIED_RANGE,[0x1b810,0x1b858] if isinstance(s.BANG_UNCLASSIFIED_RANGE,list) else (0x1b810,0x1b858))

if __name__=="__main__":unittest.main(verbosity=2)

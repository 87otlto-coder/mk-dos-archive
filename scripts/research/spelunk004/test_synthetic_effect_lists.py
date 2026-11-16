#!/usr/bin/env python3
"""Spelunk 004 synthetic tests only; original commercial files are never used."""
import hashlib,struct,unittest
import trace_soul_fireskel_source as s

def dw(x):return struct.pack("<I",x&0xffffffff)
def token_rle(n,index):return dw((n<<10)|(index<<2)|2)

class IndexedGrammar(unittest.TestCase):
 def fixture(self):
  # 4x2: one literal run, then transparent, then one repeated index.
  return dw(8)+b"\x03\x04\0\0"+dw(5)+token_rle(4,7)
 def test_index_mask_and_resource_span(self):
  b=self.fixture()
  d=s.decode_rle(b,0,4,2)
  self.assertEqual(d["streamEndExclusive"],len(b))
  self.assertEqual(d["opaqueCount"],6)
  self.assertEqual(d["indexedPlaneSha256"],hashlib.sha256(bytes([3,4,0,0,7,7,7,7])).hexdigest())
  self.assertEqual(d["opacityMaskSha256"],hashlib.sha256(bytes([1,1,0,0,1,1,1,1])).hexdigest())
 def test_synthetic_stream_hash(self):
  b=self.fixture()
  self.assertEqual(s.decode_rle(b,0,4,2)["sourceStreamSha256"],hashlib.sha256(b).hexdigest())
 def test_bad_dimension_refusal(self):
  with self.assertRaisesRegex(ValueError,"dimensions unsafe"):
   s.decode_rle(dw(3),0,0,1)
  with self.assertRaisesRegex(ValueError,"dimensions unsafe"):
   s.decode_rle(dw(3),0,500,200)
 def test_zero_length_refusal(self):
  with self.assertRaisesRegex(ValueError,"literal crosses"):
   s.decode_rle(dw(0),0,1,1)
 def test_oversized_transparent_refusal(self):
  with self.assertRaisesRegex(ValueError,"overlong source"):
   s.decode_rle(dw(5<<1|1),0,4,1)
 def test_oversized_repeat_refusal(self):
  with self.assertRaisesRegex(ValueError,"repeat crosses"):
   s.decode_rle(token_rle(5,6),0,4,1)
 def test_oversized_literal_refusal(self):
  with self.assertRaisesRegex(ValueError,"literal crosses"):
   s.decode_rle(dw(5<<2)+b"\x01\x02\x03\x04\x05\0\0\0",0,4,1)
 def test_truncated_source_refusal(self):
  with self.assertRaisesRegex(ValueError,"truncated sprite run"):
   s.decode_rle(b"\x00\x02",0,1,1)
 def test_list_pointer_relocation_and_raw_byte_requirements(self):
  b=bytearray(s.O2+0x7000);at=0x2100;target=0x3000
  struct.pack_into("<I",b,s.O2+at,target)
  fx={(2,at):(7,16,2,target)}
  s.ptr(b,fx,2,at,2,target)
  with self.assertRaisesRegex(ValueError,"typed LE"):
   s.ptr(b,{},2,at,2,target)
  struct.pack_into("<I",b,s.O2+at,target+1)
  with self.assertRaisesRegex(ValueError,"raw relocated"):
   s.ptr(b,fx,2,at,2,target)
 def test_original_opcode_provenance_check(self):
  b=b"\x90\x90\xbb\x38\xd9\x01\x00"
  s.exact(b,2,"bb38d90100","synthetic")
  with self.assertRaisesRegex(ValueError,"original code differs"):
   s.exact(b,2,"bb58d90100","synthetic")
 def test_relative_call_helper(self):
  b=b"\xe8\x05\x00\x00\x00"+b"\x90"*5+b"\xc3"
  self.assertEqual(s.relative_target(b,0),10)
  with self.assertRaisesRegex(ValueError,"expected near"):
   s.relative_target(b,5)
 def test_synthetic_original_list_loop_and_zero(self):
  b=bytearray(s.O2+0x8000)
  fx={}
  gra=token_rle(1,7)+token_rle(1,9)
  for root,desc,rid,off,token,back in [
   (0x2000,0x3000,16,0,1,0x2000),
   (0x2100,0x3010,16,4,0,None)
  ]:
   def w(at,value):struct.pack_into("<I",b,s.O2+at,value)
   w(root,desc);fx[(2,root)]=(7,16,2,desc)
   struct.pack_into("<HHhhI",b,s.O2+desc,1,1,0,0,(rid<<24)|off)
   w(root+4,token)
   if back is not None:
    w(root+8,back);fx[(2,root+8)]=(7,16,2,back)
  a=s.track(b,fx,gra,("synthetic_a","SOUL.GRA",0x2000,1,1,0x2000,0,4))
  z=s.track(b,fx,gra,("synthetic_b","SOUL.GRA",0x2100,1,0,None,4,8))
  self.assertEqual([a["sourceLoopToken"],z["sourceLoopToken"]],[1,0])
  self.assertEqual([a["sourceOrderedFrames"][0]["opaqueCount"],z["sourceOrderedFrames"][0]["opaqueCount"]],[1,1])
 def test_original_resource_registry_is_different_from_palette_ownership(self):
  self.assertEqual(s.RESOURCES["SOUL.GRA"]["id"],16)
  self.assertEqual(s.RESOURCES["FIRESKEL.GRA"]["id"],7)
  self.assertEqual(len(s.TRACKS),4)
  self.assertEqual(sum(t[3] for t in s.TRACKS),29)

if __name__=="__main__":
 unittest.main(verbosity=2)

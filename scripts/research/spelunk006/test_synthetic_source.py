#!/usr/bin/env python3
"""Original-free checks for Spelunk006 reader; no commercial input in CI."""
import hashlib,struct,unittest
import trace_suck_nested_sources as a

def dw(n):return struct.pack('<I',n)
def repeated(n,index):return dw((n<<10)|(index<<2)|2)

class Synthetic(unittest.TestCase):
 def test_source_selector_aliases_are_not_extra_frames(self):
  self.assertEqual(len(a.ROOTS),12)
  self.assertEqual(len(set(a.ROOTS)),9)
  self.assertEqual(sum(c for _,c in a.GROUPS),65)
  self.assertEqual(a.ROOTS[4:6],(0x1bd94,0x1bd94))
  self.assertEqual(a.ROOTS[8:11],(0x1bcd8,)*3)
 def test_suffix_lists_are_distinct_grammar(self):
  self.assertEqual([(n,t) for _,n,t,_ in a.SUFFIX],[(5,0),(5,0),(8,1)])
 def test_index_and_mask(self):
  # Two literal indices, two clear pixels; four repeated pixels on next row.
  source=dw(8)+bytes([3,4,0,0])+dw(5)+repeated(4,7)
  d=a.decode(source,0,4,2)
  self.assertEqual(d['streamEndExclusive'],len(source))
  self.assertEqual(d['opaquePixelCount'],6)
  self.assertEqual(d['indexedSha256'],hashlib.sha256(bytes([3,4,0,0,7,7,7,7])).hexdigest())
  self.assertEqual(d['opacityMaskSha256'],hashlib.sha256(bytes([1,1,0,0,1,1,1,1])).hexdigest())
 def test_zero_length_literal_refused(self):
  with self.assertRaisesRegex(ValueError,'RLE literal invalid'):
   a.decode(dw(0),0,1,1)
 def test_overlong_skip_refused(self):
  with self.assertRaisesRegex(ValueError,'RLE transparent/run crossing row'):
   a.decode(dw(11),0,3,1)
 def test_overlong_repeat_refused(self):
  with self.assertRaisesRegex(ValueError,'RLE repeated run crossing row'):
   a.decode(repeated(6,2),0,3,1)
 def test_invalid_shape_refused(self):
  with self.assertRaisesRegex(ValueError,'frame geometry'):a.decode(dw(3),0,0,1)
  with self.assertRaisesRegex(ValueError,'frame geometry'):a.decode(dw(3),0,400,400)
 def test_resource_identifier_refused(self):
  b=bytearray(a.O2+0x23000)
  struct.pack_into('<HHhhI',b,a.O2+0x21434,1,1,0,0,(15<<24)|0)
  with self.assertRaisesRegex(ValueError,'sprite resource ID not SUCK'):
   a.sprite(b,repeated(1,7),0x21434)
 def test_typed_pointer_and_raw_source_both_required(self):
  b=bytearray(a.O2+0x22000);site=0x1be50;target=0x1be70
  struct.pack_into('<I',b,a.O2+site,target)
  rel={(2,site):(7,16,2,target)}
  a.ptr(b,rel,2,site,2,target)
  with self.assertRaisesRegex(ValueError,'typed pointer'):
   a.ptr(b,{},2,site,2,target)
  b[a.O2+site]^=1
  with self.assertRaisesRegex(ValueError,'raw relocated pointer'):
   a.ptr(b,rel,2,site,2,target)
 def test_encoded_resource_sha_is_reproducible(self):
  source=repeated(1,42)
  self.assertEqual(a.decode(source,0,1,1)['encodedSha256'],hashlib.sha256(source).hexdigest())

if __name__=='__main__':
 unittest.main(verbosity=2)

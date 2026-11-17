"""Original-free Spelunk009 controls. No DOS EXE/GRA in public Windows CI."""
import hashlib, struct, unittest
import trace_bang_secondary as a

def dword(n):return struct.pack('<I',n&0xffffffff)

class Synthetic(unittest.TestCase):
    def test_three_groups_and_source_sentinel(self):
        self.assertEqual(a.GROUPS,((0x1b7dc,6,5),(0x1b810,1,1),(0x1b81c,8,8)))
        self.assertEqual(a.EXPECTED_X,(48,46,40,29,16,0))

    def test_all_twelve_colour_source_groups(self):
        self.assertEqual(len(a.EXPECTED_HEADER_COUNTS),12)
        self.assertEqual(sum(a.EXPECTED_HEADER_COUNTS),101)

    def test_existing_selector_list_census(self):
        self.assertEqual(len(a.ROOTS),11)
        self.assertEqual(sum(a.COUNTS),95)

    def test_eight_explicit_constructor_calls(self):
        self.assertEqual(len(a.CALLS),8)
        self.assertEqual(len(set(a.CALLS)),8)

    def test_signed_odd_x_rounding(self):
        self.assertEqual(a.transforms(29,-38)[:4],
                         [[29,-38],[14,-19],[-28,-38],[-14,-19]])

    def test_four_quadrant_source_operations_are_not_presentation_frames(self):
        result=a.transforms(16,-45)
        self.assertEqual(len(result),8)
        self.assertNotEqual(result[0],result[1])
        self.assertEqual(result[2][0],-16)

    def test_literal_rle_source(self):
        # 2 opaque literal pixels, 2 transparent; 4 repeated opaque.
        resource=dword(8)+b'\x02\x03\0\0'+dword(5)+dword((4<<10)|(9<<2)|2)
        self.assertEqual(a.decode_end(resource,0,4,2),len(resource))

    def test_reject_truncated_rle(self):
        with self.assertRaisesRegex(ValueError,'RLE truncated token'):
            a.decode_end(b'\x00\x00',0,1,1)

    def test_reject_zero_run(self):
        with self.assertRaisesRegex(ValueError,'RLE literal invalid'):
            a.decode_end(dword(0),0,1,1)

    def test_reject_overlong_skip(self):
        with self.assertRaisesRegex(ValueError,'RLE run crosses row'):
            a.decode_end(dword((6<<1)|1),0,4,1)

    def test_source_pointer_must_have_relocation(self):
        b=bytearray(a.O2+0x800);site=0x400;target=0x26cc4
        struct.pack_into('<I',b,a.O2+site,target)
        with self.assertRaisesRegex(ValueError,'typed source pointer'):
            a.ptr(b,{},2,site,1,target)

    def test_source_pointer_must_match_raw_word(self):
        b=bytearray(a.O2+0x800);site=0x400;target=0x26cc4
        struct.pack_into('<I',b,a.O2+site,target+1)
        with self.assertRaisesRegex(ValueError,'raw source pointer'):
            a.ptr(b,{(2,site):(7,16,1,target)},2,site,1,target)

    def test_empty_fake_not_promoted_to_bang_resource(self):
        with self.assertRaisesRegex(ValueError,'canonical O69 101 BANG'):
            a.sprites(bytes(a.O2+80),bytes(128))

    def test_hash_original_free_reproducible(self):
        self.assertEqual(a.sha(b'synthetic'),hashlib.sha256(b'synthetic').hexdigest())

if __name__=='__main__':unittest.main(verbosity=2)

"""Commercial-free Spelunk 003 core tests.

This suite validates bounded RLE indexed/mask decoding, source-pointer trust
boundaries and rejection mechanics. It DOES NOT validate original DOS assets;
that is separately covered by test_original_source.py with the user's ZIP.
"""
import hashlib,struct,unittest
import trace_original_stage_frame_lists as m

def dword(value):return struct.pack("<I",value)
class SyntheticFrameGrammar(unittest.TestCase):
    def sample(self):
        # Row zero: 2 opaque literal pixels then 2 transparent.
        # Row one: 4 opaque repeated pixels with original index 7.
        return dword(8)+bytes([1,2,0,0])+dword(5)+dword((4<<10)|(7<<2)|2)

    def test_exact_source_indices_and_alpha(self):
        blob=self.sample()
        result=m.rle_index_mask(blob,0,4,2)
        self.assertEqual(result["end"],len(blob))
        self.assertEqual(result["opaquePixels"],6)
        self.assertEqual(result["indexedPlaneSha256"],
                         hashlib.sha256(bytes([1,2,0,0,7,7,7,7])).hexdigest())
        self.assertEqual(result["opacityPlaneSha256"],
                         hashlib.sha256(bytes([1,1,0,0,1,1,1,1])).hexdigest())

    def test_source_encoded_hash(self):
        b=self.sample()
        self.assertEqual(m.rle_index_mask(b,0,4,2)["encodedSha256"],hashlib.sha256(b).hexdigest())

    def test_reject_short_command(self):
        with self.assertRaisesRegex(ValueError,"truncated"):
            m.rle_index_mask(dword(5),0,4,2)

    def test_reject_zero_run(self):
        with self.assertRaisesRegex(ValueError,"length invalid"):
            m.rle_index_mask(dword(1),0,4,1)

    def test_reject_rle_crossing_row(self):
        with self.assertRaisesRegex(ValueError,"crossed row"):
            m.rle_index_mask(dword((5<<10)|2),0,4,1)

    def test_reject_literal_crossing_row(self):
        with self.assertRaisesRegex(ValueError,"indexedLiteral"):
            m.rle_index_mask(dword(20)+bytes([1,2,3,4,5,0,0,0]),0,4,1)

    def test_reject_transparent_skip_crossing_row(self):
        with self.assertRaisesRegex(ValueError,"length invalid"):
            m.rle_index_mask(dword((5<<1)|1),0,4,1)

    def test_reject_truncated_literal(self):
        with self.assertRaisesRegex(ValueError,"indexedLiteral"):
            m.rle_index_mask(dword(12),0,4,1)

    def test_reject_zero_or_giant_dimensions(self):
        with self.assertRaisesRegex(ValueError,"dimensions"):
            m.rle_index_mask(dword(9),0,0,1)
        with self.assertRaisesRegex(ValueError,"dimensions"):
            m.rle_index_mask(dword(9),0,1000,1000)

    def test_pointer_requires_both_typed_fixup_and_original_raw_word(self):
        b=bytearray(m.OBJ2+0x3000)
        at=0x2100;target=0x2700
        struct.pack_into("<I",b,m.OBJ2+at,target)
        f={(2,at):(7,16,2,target)}
        m.pointer(b,f,2,at,2,target)
        with self.assertRaisesRegex(ValueError,"typed pointer mismatch"):
            m.pointer(b,{},2,at,2,target)
        struct.pack_into("<I",b,m.OBJ2+at,target+4)
        with self.assertRaisesRegex(ValueError,"raw pointer mismatch"):
            m.pointer(b,f,2,at,2,target)

    def test_new_stage_lists_distinct_from_o136(self):
        self.assertEqual({x["list"] for x in m.TRACKS.values()},{0x168d4,0x16d38})
        self.assertEqual([x["count"] for x in m.TRACKS.values()],[12,20])
        self.assertEqual([x["unique"] for x in m.TRACKS.values()],[12,7])
        self.assertNotEqual(m.TRACKS["forest_source_20"]["count"],
                            m.TRACKS["forest_source_20"]["unique"])

    def test_forest_order_retains_repeated_frames(self):
        expected=[0,1,2,3,4,5,6,5,6,5,6,5,6,5,6,4,3,2,1,0]
        self.assertEqual(m.TRACKS["forest_source_20"]["expectedOrdinalDescriptorIndices"],expected)

if __name__=="__main__":
    unittest.main(verbosity=2)

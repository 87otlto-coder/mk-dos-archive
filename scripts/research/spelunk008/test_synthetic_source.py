#!/usr/bin/env python3
"""Commercial-free original-le/RLE source controls; never load MK2 originals."""
import hashlib
import struct
import unittest
import trace_blood_palette_headers as s


def dword(value):
    return struct.pack("<I",value & 0xffffffff)


class SyntheticSourceTrust(unittest.TestCase):
    def test_twenty_two_headers_account_for_178(self):
        self.assertEqual(len(s.EXPECTED_GROUP_SIZES),22)
        self.assertEqual(sum(s.EXPECTED_GROUP_SIZES),178)

    def test_five_unproven_list_roots(self):
        self.assertEqual(len(s.ORPHAN_LISTS),5)
        self.assertEqual(sum(n for _,n in s.ORPHAN_LISTS),21)

    def test_previous_source_list_reference_count(self):
        self.assertEqual(len(s.LISTS),18)
        self.assertEqual(sum(n for _,n in s.LISTS),155)

    def test_original_direct_seed_distinctions(self):
        self.assertEqual(len(s.DIRECT_SEEDS),5)
        self.assertEqual(len(set(d for _,d in s.DIRECT_SEEDS)),4)

    def test_pit_descriptor_refs_do_not_add_new_animations(self):
        self.assertEqual(len(s.PAIR_SITES),4)
        self.assertEqual(set(d for _,d in s.PAIR_SITES),{0x206e4,0x206f0})

    def test_typed_and_raw_pointer_both_required(self):
        blob=bytearray(s.O2+0x1000)
        site=0x800;dest=0x26cc4
        struct.pack_into("<I",blob,s.O2+site,dest)
        fx={(2,site):(7,16,1,dest)}
        s.pointer(blob,fx,2,site,1,dest)

    def test_forged_relocation_refused(self):
        blob=bytearray(s.O2+0x1000)
        site=0x800;dest=0x26cc4
        struct.pack_into("<I",blob,s.O2+site,dest)
        with self.assertRaisesRegex(ValueError,"typed LE pointer mismatch"):
            s.pointer(blob,{},2,site,1,dest)

    def test_forged_raw_pointer_refused(self):
        blob=bytearray(s.O2+0x1000)
        site=0x800;dest=0x26cc4
        struct.pack_into("<I",blob,s.O2+site,dest+1)
        with self.assertRaisesRegex(ValueError,"raw typed pointer mismatch"):
            s.pointer(blob,{(2,site):(7,16,1,dest)},2,site,1,dest)

    def test_bounded_indexed_rle_source_rows(self):
        # 2 literal pixels + 2 transparent; second row 4 indexed-RLE pixels.
        resource=dword(8)+bytes([1,2,0,0])+dword(5)+dword((4<<10)|(7<<2)|2)
        self.assertEqual(s.rle_end(resource,0,4,2),len(resource))

    def test_indexed_literal_malformed_source_refused(self):
        with self.assertRaisesRegex(ValueError,"literal run overflow"):
            s.rle_end(dword(0),0,4,1)

    def test_transparent_overlong_source_refused(self):
        with self.assertRaisesRegex(ValueError,"source run crosses row"):
            s.rle_end(dword((5<<1)|1),0,4,1)

    def test_invalid_frame_dimensions_refused(self):
        with self.assertRaisesRegex(ValueError,"sprite dimensions"):
            s.rle_end(dword(5),0,0,2)

    def test_cannot_promote_empty_source_to_original_sprite_corpus(self):
        with self.assertRaisesRegex(ValueError,"original O69 BLOOD descriptor census"):
            s.scan(bytes(s.O2+64),bytes(32))

    def test_sha256_digest_stable_for_synthetic_input(self):
        self.assertEqual(s.sha(b"synthetic"),hashlib.sha256(b"synthetic").hexdigest())

    def test_original_dac_is_not_derivable_from_palette_pointer(self):
        self.assertEqual(s.PALETTE_O1,0x26cc4)
        self.assertEqual(s.O1+s.PALETTE_O1,0x88918)


if __name__=="__main__":
    unittest.main(verbosity=2)

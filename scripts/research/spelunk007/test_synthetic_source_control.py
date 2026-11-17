#!/usr/bin/env python3
"""Commercial-free Windows tests for Spelunk007 source-control boundaries."""
import hashlib,struct,unittest
import trace_blood_source_lists as s

def dw(n):return struct.pack("<I",n&0xffffffff)
def rep(n,index):return dw((n<<10)|(index<<2)|2)

def fake_control_source():
    exe=bytearray(0xd0000)  # cover original Object2 relocated data and physical code
    exe[0x86d14:0x86d26]=bytes.fromhex("83fb0175c3528b52048915785a07005aeb9f")
    anchors={
        0x90661:"8b56688915785a07005a",
        0x9066b:"a1785a0700c1e810",
        0x9067c:"c125785a070002",
        0x90683:"8105785a070028d00100",
        0x9068d:"50a1785a0700528b108915785a0700",
        0x906a8:"e9180f0000",
        0x90e59:"c705785a070078d10100",
        0x9091e:"c705785a07008cd00100",
    }
    for at,value in anchors.items():
        bs=bytes.fromhex(value);exe[at:at+len(bs)]=bs
    fx={(1,0x90689-s.O1):(7,16,2,s.VARIANT_TABLE)}
    for i,d in enumerate(s.VARIANT_DESTINATIONS):
        site=s.VARIANT_TABLE+i*4
        struct.pack_into("<I",exe,s.O2+site,d)
        fx[(2,site)]=(7,16,2,d)
    return exe,fx

class Synthetic(unittest.TestCase):
    def test_two_intro_rewinds_distinguishable(self):
        rows=[(root,count,back,(back-root)//4,count-(back-root)//4)
              for root,count,term,back in s.LISTS if term==1]
        self.assertEqual(rows,[(0x1d08c,18,0x1d0a4,6,12),
                               (0x1d178,14,0x1d194,7,7)])

    def test_eighteen_source_lists_with_155_references(self):
        self.assertEqual(len(s.LISTS),18)
        self.assertEqual(sum(x[1] for x in s.LISTS),155)
        self.assertEqual(len(s.DIRECT_SOURCE_ROOTS),12)

    def test_four_entry_variant_is_one_list(self):
        self.assertEqual([(d-0x1d038)//4 for d in s.VARIANT_DESTINATIONS],
                         [0,3,5,8])
        self.assertEqual(s.VARIANT_TABLE,0x1d028)

    def test_source_control_original_free_snapshot(self):
        exe,fx=fake_control_source()
        witness=s.source_control(exe,fx)
        self.assertEqual(witness["variantEntryIndices"],[0,3,5,8])
        self.assertEqual(witness["rewindHandlingPhysical"],0x86d14)
        self.assertFalse(witness["variantRuntimeBoundsVerified"])

    def test_refuse_wrong_rewind_code(self):
        exe,fx=fake_control_source();exe[0x86d14]=0x90
        with self.assertRaisesRegex(ValueError,"original rewind opcode"):
            s.source_control(exe,fx)

    def test_refuse_missing_variant_typed_relocation(self):
        exe,fx=fake_control_source();fx.pop((2,s.VARIANT_TABLE))
        with self.assertRaisesRegex(ValueError,"typed pointer"):
            s.source_control(exe,fx)

    def test_refuse_forged_variant_original_bytes(self):
        exe,fx=fake_control_source();exe[s.O2+s.VARIANT_TABLE]^=1
        with self.assertRaisesRegex(ValueError,"raw relocated pointer"):
            s.source_control(exe,fx)

    def test_refuse_changed_variant_source_opcode(self):
        exe,fx=fake_control_source();exe[0x90683]=0x90
        with self.assertRaisesRegex(ValueError,"original control opcode"):
            s.source_control(exe,fx)

    def test_original_free_rle_indices_and_mask(self):
        # One row of two literal opaque values and two transparent values;
        # one row of four repeated opaque indices.
        encoded=dw(8)+bytes([6,9,0,0])+dw(5)+rep(4,3)
        d=s.core.decode(encoded,0,4,2)
        self.assertEqual(d["streamEndExclusive"],len(encoded))
        self.assertEqual(d["indexedSha256"],
                         hashlib.sha256(bytes([6,9,0,0,3,3,3,3])).hexdigest())
        self.assertEqual(d["opacityMaskSha256"],
                         hashlib.sha256(bytes([1,1,0,0,1,1,1,1])).hexdigest())

    def test_original_free_zero_run_refusal(self):
        with self.assertRaisesRegex(ValueError,"RLE literal invalid"):
            s.core.decode(dw(0),0,1,1)

    def test_original_free_resource_guard(self):
        self.assertEqual(s.RID,9)
        self.assertEqual(s.PIT_IMPACT_DESCRIPTOR,0x206fc)
        self.assertEqual(s.PIT_IMPACT_PHYSICAL,s.O2+s.PIT_IMPACT_DESCRIPTOR)

    def test_scan_cannot_promote_empty_synthetic_blob(self):
        fake=bytes(0xd0000)
        with self.assertRaisesRegex(ValueError,"canonical O69 BLOOD"):
            s.scan_descriptors(fake,bytes(32))

if __name__=="__main__":
    unittest.main(verbosity=2)

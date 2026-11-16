#!/usr/bin/env python3
"""Commercial-free synthetic checks for Spelunk 002's bounded root interpreter.

These tests establish program-control mechanics only. CI does not possess
original DOS files and cannot validate the original-root census or game state.
"""
import struct
import unittest
import trace_stage_selector_programs as p

def encode(values):
    image=bytearray(p.OBJ2+0x35000)
    reloc={}
    root=0x1200
    def word(at,value):
        struct.pack_into("<I",image,p.OBJ2+at,value & 0xffffffff)
    def pointer(at,target):
        word(at,target)
        reloc[(2,at)]=(7,16,2,target)
    pointer(root+0x1c,p.SELECTOR_BASE)
    pos=root+0x20
    for entry in values:
        if isinstance(entry,tuple) and entry[0]=="setup":
            pointer(pos,entry[1])
            word(pos+4,entry[2]);pos+=8
        elif isinstance(entry,tuple) and entry[0]=="scaled":
            word(pos,0xfffffffe);pos+=4
            for setup,dest in entry[1]:
                pointer(pos,setup);pointer(pos+4,dest);pos+=8
            word(pos,0);pos+=4
        else:
            word(pos,entry);pos+=4
    struct.pack_into("<H",image,p.OBJ2+0x3000,896)
    struct.pack_into("<H",image,p.OBJ2+0x3020,320)
    return image,reloc,root

class SyntheticSelectorTests(unittest.TestCase):
    def build(self):
        return encode([1,("setup",0x3000,-0x340000),1,
                       ("setup",0x3020,0x120000),
                       ("scaled",((0x3000,0x8432c),(0x3020,0x84318)))])

    def test_explicit_skip_and_setup_pointer_cells(self):
        b,reloc,root=self.build()
        report=p.decode_program(b,reloc,root)
        self.assertEqual([x["kind"] for x in report["cells"]],
                         ["explicit_skip","setup_pair","explicit_skip","setup_pair"])
        self.assertEqual([x["channel"] for x in report["cells"]],[0,1,2,3])
        self.assertEqual(report["nextUnwrittenChannel"],4)
        self.assertEqual(report["unwrittenDefaultChannels"],[4,5,6,7])
        self.assertEqual([x["cellObject2"] for x in report["cells"]],[root+0x20,root+0x24,root+0x2c,root+0x30])

    def test_integer_high_half_stage_global_writes(self):
        b,reloc,root=self.build()
        d=p.decode_program(b,reloc,root)["derivedHighHalfWrites"]
        self.assertEqual(len(d),2)
        self.assertEqual([x["destinationGlobalObject2"] for x in d],
                         [0x8432c,0x84318])
        self.assertEqual([x["computedRaw32"] for x in d],[289<<16,1<<16])

    def test_terminal_minus_one_does_not_force_scale(self):
        b,reloc,root=encode([("setup",0x3020,0),-1])
        report=p.decode_program(b,reloc,root)
        self.assertEqual(report["termination"],"minus_one")
        self.assertEqual(report["derivedHighHalfWrites"],[])

    def test_reloc_target_forgery_refused(self):
        b,reloc,root=self.build()
        reloc[(2,root+0x24)]=(7,16,2,0x3020)
        with self.assertRaisesRegex(ValueError,"wrong typed pointer"):
            p.decode_program(b,reloc,root)

    def test_untyped_skip_cannot_become_setup(self):
        b,reloc,root=self.build()
        struct.pack_into("<I",b,p.OBJ2+root+0x20,0x3000)
        with self.assertRaisesRegex(ValueError,"wrong typed pointer"):
            p.decode_program(b,reloc,root)

    def test_wrong_scalar_destination_refused(self):
        b,reloc,root=self.build()
        token=root+0x20+4+8+4+8+4
        # First scaled pair destination is token+4.
        address=token+4
        struct.pack_into("<I",b,p.OBJ2+address,0x84400)
        reloc[(2,address)]=(7,16,2,0x84400)
        with self.assertRaisesRegex(ValueError,"scaled destination"):
            p.decode_program(b,reloc,root)

    def test_root_must_point_to_channel_zero(self):
        b,reloc,root=self.build()
        reloc[(2,root+0x1c)]=(7,16,2,p.SELECTOR_BASE+4)
        with self.assertRaisesRegex(ValueError,"wrong typed pointer"):
            p.decode_program(b,reloc,root)

    def test_non_terminating_script_rejected(self):
        b,reloc,root=encode([1]*12)
        with self.assertRaisesRegex(ValueError,"more than eight"):
            p.decode_program(b,reloc,root)

if __name__=="__main__":
    unittest.main()

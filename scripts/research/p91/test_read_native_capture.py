"""Original-free native raw capture parser and corruption/refusal tests."""
import hashlib
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parent))
from test_snapshot import make_plan,fake_mapping,event
from read_native_capture import (
    MAGIC,MARKER,RAW,CPU_KEYS,VGA_KEYS,PHASE_NAMES,parse_native,verify_raw
)

def encode_raw(phases):
    out=bytearray(MAGIC+struct.pack("<II",1,4))
    def u32(v):out.extend(struct.pack("<I",v))
    def u64(v):out.extend(struct.pack("<Q",v))
    def blob(b):u32(len(b));out.extend(b)
    for i,phase in enumerate(phases):
        bias=phase["mapping"]["object2OperandBias"]
        o2=phase["object2"]
        def at(offset):return struct.unpack_from("<I",o2,offset)[0]
        u32(i);u64(phase["instructionSerial"])
        for v in (
            phase["instructionLinear"],phase["mapping"]["object1LinearBase"],
            phase["mapping"]["object2LinearBase"],bias,
            phase["mapping"]["csBase"],phase["mapping"]["dsBase"],
            at(0x7747f),at(0x3014c),at(0x75cf6),at(0x562d4),
            at(0x7662a),at(0x7662e),at(0x75cee),
            struct.unpack("<I",phase["presentReturnStack"])[0] if i==2 else 0,
            struct.unpack("<I",phase["presentReturnStack"])[0] if i==2 else 0,
            phase["presentationReturnWitness"]["instructionLinear"] if i==3 else 0
        ):u32(v)
        u64(phase["presentationReturnWitness"]["instructionSerial"] if i==3 else 0)
        u32(phase["dacBits"]);u32(phase["pelMask"])
        u32(phase["returnStackLinear"] if i==2 else 0)
        for k in CPU_KEYS:u32(phase["cpuRegisters"][k])
        for _ in VGA_KEYS:u32(0)
        for value in (
            phase["object1"],phase["object2"],phase["buffer"],phase["aperture"],
            phase["dac"],phase["presentReturnStack"] if i==2 else b"\0"*4
        ):blob(value)
    return bytes(out)

class NativeRaw(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plan=make_plan()
        cls.mapping,_,_=fake_mapping(cls.plan)
        cls.events=(
            event(cls.plan,cls.mapping,"draw_entry",1),
            event(cls.plan,cls.mapping,"draw_ret",2),
            event(cls.plan,cls.mapping,"present_entry",5,gate=0),
            event(cls.plan,cls.mapping,"scheduler_entry",6,gate=0,post=True)
        )
        cls.raw=encode_raw(cls.events)

    def test_synthetic_four_phase_parity(self):
        result=parse_native(self.raw,self.plan)
        self.assertEqual(set(result),set(PHASE_NAMES))
        self.assertEqual(result["drawComplete"]["buffer"],self.events[1]["buffer"])
        self.assertEqual(result["postPresent"]["aperture"],self.events[3]["aperture"])

    def test_reject_wrong_magic(self):
        with self.assertRaisesRegex(ValueError,"magic"):
            parse_native(b"Z"+self.raw[1:],self.plan)

    def test_reject_truncation(self):
        with self.assertRaisesRegex(ValueError,"truncated"):
            parse_native(self.raw[:-256],self.plan)

    def test_reject_duplicate_trailing_bytes(self):
        with self.assertRaisesRegex(ValueError,"trailing"):
            parse_native(self.raw+b"\0",self.plan)

    def test_reject_wrong_phase_order(self):
        v=bytearray(self.raw);v[16]=1
        with self.assertRaisesRegex(ValueError,"phase order"):
            parse_native(bytes(v),self.plan)

    def test_reject_bad_original_window(self):
        v=bytearray(self.raw)
        # Locate the first serialized Object1 blob and mutate a code byte.
        source=self.events[0]["object1"]
        location=self.raw.find(source[:200])
        self.assertGreater(location,0)
        v[location+0x100+6]^=1
        with self.assertRaisesRegex(ValueError,"code fingerprint"):
            parse_native(bytes(v),self.plan)

    def test_private_hash_and_completion_marker(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/RAW).write_bytes(self.raw)
            marker={
                "schema":"mkext_p91_native_raw_complete_v1",
                "raw":RAW,"bytes":len(self.raw),
                "sha256":hashlib.sha256(self.raw).hexdigest(),
                "phases":4,"nativeGameVerified":False,
                "scanoutVerified":False,"adapterAcceptancePending":True
            }
            (root/MARKER).write_text(json.dumps(marker))
            result=verify_raw(root,self.plan)
            self.assertEqual(result["status"],"PASS_P91_NATIVE_RAW_PACKET_CONSISTENCY")
            (root/RAW).write_bytes(self.raw[:-1]+b"!")
            with self.assertRaisesRegex(ValueError,"SHA256 mismatch"):
                verify_raw(root,self.plan)

    def test_missing_completion_marker_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);(root/RAW).write_bytes(self.raw)
            with self.assertRaises(FileNotFoundError):
                verify_raw(root,self.plan)

if __name__=="__main__":
    unittest.main(verbosity=2)

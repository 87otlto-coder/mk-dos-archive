"""Independent readback of a private P91 native DOSBox-X raw four-phase packet.

The native writer records a generation-bracketed raw archive, not a verified
reconstruction. This converter refuses changed hashes/lengths, rebases all
five code windows independently per phase and invokes the existing P91
Collector before any private canonical snapshot is created.

Do not commit or upload raw packets: they contain original commercial bytes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import struct
import sys

from snapshot import Collector, need, resolve_mapping, save_private, sha

MAGIC=b"P91NAT02"
MARKER="p91-native-raw-complete.json"
RAW="p91-native-raw.bin"
CPU_KEYS=("eax","ebx","ecx","edx","esi","edi","ebp","esp","eip","eflags",
          "cs","ds","es","ss","ssBase","cr0","cr3")
VGA_KEYS=("mode","seqMemoryMode","seqMapMask","gfxMode","gfxMisc",
          "crtcOffset","crtcStart","attrMode")
PHASE_NAMES=("drawEntry","drawComplete","presentEntry","postPresent")
BOUNDARIES=("draw_entry","draw_ret","present_entry","scheduler_entry")
BLOBS=("object1","object2","buffer","aperture","dac","presentReturnStack")

class Reader:
    def __init__(self,data:bytes):
        self.data=memoryview(data)
        self.pos=0

    def take(self,n:int)->bytes:
        need(0<=n<=len(self.data)-self.pos,"truncated native packet")
        value=bytes(self.data[self.pos:self.pos+n])
        self.pos+=n
        return value

    def u32(self):return struct.unpack("<I",self.take(4))[0]
    def u64(self):return struct.unpack("<Q",self.take(8))[0]
    def blob(self,expected:int)->bytes:
        n=self.u32()
        need(n==expected,"unexpected native blob length")
        return self.take(n)

def parse_native(data:bytes,plan:dict)->dict:
    """Parse the exact source-defined binary contract, including all raw bytes."""
    need(len(data)<=5_000_000,"native packet exceeds bounded four-phase budget")
    r=Reader(data)
    need(r.take(8)==MAGIC,"native packet magic")
    need(r.u32()==2 and r.u32()==4,"native packet version/phase count")
    sizes={"object1":plan["objects"][0]["virtualSize"],
           "object2":plan["objects"][1]["virtualSize"],
           "buffer":64000,"aperture":64000,"dac":768,"presentReturnStack":4}
    out={}
    for i,(name,boundary) in enumerate(zip(PHASE_NAMES,BOUNDARIES)):
        need(r.u32()==i,"native phase order")
        serial=r.u64()
        fields={}
        for field in ("instructionLinear","object1LinearBase","object2LinearBase",
                      "object2OperandBias","csBase","dsBase","stage","mode",
                      "controlStream","renderGate","drawBuffer",
                      "lastPresentedBuffer","alternatePresentation",
                      "expectedReturnOffset","observedReturnOffset",
                      "returnWitnessLinear"):
            fields[field]=r.u32()
        fields["returnWitnessSerial"]=r.u64()
        fields["dacBits"]=r.u32()
        fields["pelMask"]=r.u32()
        fields["returnStackLinear"]=r.u32()
        return_trace={
            "opcodeLinear":r.u32(),"opcodeSerial":r.u64(),
            "opcode":r.u32(),"espBefore":r.u32(),
            "espAfter":r.u32(),"stackBefore":r.u32(),
            "ssBaseBefore":r.u32()
        }
        regs=dict(zip(CPU_KEYS,(r.u32() for _ in CPU_KEYS)))
        vga=dict(zip(VGA_KEYS,(r.u32() for _ in VGA_KEYS)))
        blobs={k:r.blob(sizes[k]) for k in BLOBS}
        need(serial>0 and fields["dacBits"] in (6,8) and
             0<=fields["pelMask"]<=255,"invalid native serial or DAC context")
        # Each phase must independently reproduce the loaded address mapping.
        code=blobs["object1"]
        o1=fields["object1LinearBase"]
        def read(a,n):
            off=a-o1
            need(0<=off<=len(code)-n,"code window outside Object1 image")
            return code[off:off+n]
        start=o1+next(w["object1Offset"] for w in plan["windows"]
                      if w["name"]=="frame_entry")
        mapping=resolve_mapping(plan,start,fields["csBase"],fields["dsBase"],read)
        for field in ("object1LinearBase","object2LinearBase","object2OperandBias",
                      "csBase","dsBase"):
            need(mapping[field]==fields[field],"native loaded mapping mismatch "+field)
        expected_ip=o1+next(w["object1Offset"] for w in plan["windows"]
                            if w["name"]==boundary)
        need(expected_ip==fields["instructionLinear"],"boundary address mismatch")
        need(regs["eip"]+fields["csBase"]==expected_ip and regs["cr0"]&1 and
             not regs["cr0"]&0x80000000,"CPU return/IP or paging context mismatch")
        if i==2:
            need(fields["returnStackLinear"]==regs["ssBase"]+regs["esp"],
                 "present return stack address disagreement")
        native={
            "boundary":boundary,"instructionSerial":serial,
            "instructionLinear":fields["instructionLinear"],
            "mapping":mapping,"protected32":True,
            "memoryReadPolicy":"NO_PAGING_BOUNDED_RAM",
            "cpuRegisters":regs,
            "object1":blobs["object1"],"object2":blobs["object2"],
            "buffer":blobs["buffer"],
            "bufferPointerRaw":fields["drawBuffer"],
            "aperture":blobs["aperture"],"dac":blobs["dac"],
            "dacBits":fields["dacBits"],"pelMask":fields["pelMask"],
            "vgaRegisters":vga,
            "returnStackLinear":fields["returnStackLinear"],
        }
        if i==2:
            native["presentReturnStack"]=blobs["presentReturnStack"]
            need(struct.unpack("<I",native["presentReturnStack"])[0]==
                 fields["observedReturnOffset"],"native return stack/raw offset mismatch")
        if i==3:
            native["presentationReturnWitness"]={
                "instructionLinear":fields["returnWitnessLinear"],
                "instructionSerial":fields["returnWitnessSerial"]}
            # Never accept a scheduler IP alone as evidence of presentation.
            previous=out["presentEntry"]
            return_site=return_trace["opcodeLinear"]-fields["object1LinearBase"]
            allowed={
                physical-0x61c54 for physical in
                (0x65464,0x65488,0x65498,0x654d9,0x65502)
            }
            need(return_site in allowed and 0<=return_site<len(code),
                 "return opcode outside source-verified presentation epilogues")
            need(code[return_site]==0xC3 and return_trace["opcode"]==0xC3,
                 "original near RET opcode not witnessed")
            need(previous["instructionSerial"]<return_trace["opcodeSerial"]<
                 fields["returnWitnessSerial"]<=serial,
                 "return instruction/event serials inconsistent")
            need(return_trace["espBefore"]==previous["cpuRegisters"]["esp"] and
                 return_trace["espAfter"]==return_trace["espBefore"]+4 and
                 return_trace["ssBaseBefore"]==previous["cpuRegisters"]["ssBase"],
                 "return stack transition not observed")
            need(return_trace["stackBefore"]==
                 struct.unpack("<I",previous["presentReturnStack"])[0],
                 "return stack word differs from captured presentation caller")
            need(fields["returnWitnessLinear"]==
                 fields["csBase"]+return_trace["stackBefore"],
                 "return witness target differs from actual near RET")
            native["returnTrace"]=return_trace
        else:
            need(all(v==0 for v in return_trace.values()),
                 "return witness unexpectedly present before post-presentation")
        for index,window in enumerate(plan["windows"]):
            at=window["object1Offset"]
            native["codeWindow"+str(index)]=code[at:at+window["length"]]
        out[name]=native
    need(r.pos==len(data),"trailing native packet data")
    collector=Collector(plan)
    collector.draw_entry(out["drawEntry"])
    collector.draw_ret(out["drawComplete"])
    collector.present_entry(out["presentEntry"])
    collector.scheduler_entry(out["postPresent"])
    return out

def verify_raw(folder:Path,plan:dict)->dict:
    """Refuse any missing, overwritten or inconsistent private raw evidence."""
    need(folder.is_dir(),"private raw capture directory missing")
    marker=json.loads((folder/MARKER).read_text(encoding="utf-8"))
    need(marker["schema"]=="mkext_p91_native_raw_complete_v2" and
         marker["raw"]==RAW and marker["phases"]==4,
         "native completion marker mismatch")
    need(marker["nativeGameVerified"] is False and
         marker["scanoutVerified"] is False and
         marker["adapterAcceptancePending"] is True,
         "unsupported native acceptance claim")
    need(set(p.name for p in folder.iterdir()).issuperset({RAW,MARKER}),
         "raw packet/complete marker missing")
    raw=(folder/RAW).read_bytes()
    need(len(raw)==marker["bytes"] and sha(raw)==marker["sha256"],
         "raw packet size/SHA256 mismatch")
    phases=parse_native(raw,plan)
    return {"phases":phases,"rawSha256":sha(raw),
            "rawBytes":len(raw),
            "status":"PASS_P91_NATIVE_RAW_PACKET_CONSISTENCY",
            "nativeRuntimeProvenance":"VALIDATION PENDING"}

def canonical_validation(path:Path)->bool:
    """Only allow private conversion in the canonical Windows fixtures root."""
    if os.name!="nt":return False
    root=Path(r"F:\Dev\MKEXT\FIXTURES\VALIDATION").resolve()
    folder=path.resolve()
    return folder.is_relative_to(root) and folder!=root and (
        folder.name.upper().startswith("P91-"))

def run_cli():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--plan",type=Path,required=True)
    p.add_argument("--raw",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    p.add_argument("--original-mk2",type=Path,required=True)
    p.add_argument("--patch-sha",required=True)
    p.add_argument("--dosbox-exe-sha",required=True)
    a=p.parse_args()
    need(canonical_validation(a.raw) and canonical_validation(a.output),
         "canonical private FIXTURES/VALIDATION P91 directories required")
    need(not a.output.exists(),"refusing existing private conversion output")
    for identity in (a.patch_sha,a.dosbox_exe_sha):
        need(len(identity)==64 and all(x in "0123456789abcdef" for x in identity),
             "invalid adapter digest")
    plan=json.loads(a.plan.read_text(encoding="utf-8"))
    for name,expected in plan["requiredOriginalFingerprints"].items():
        originals=[x for x in a.original_mk2.iterdir() if
                   x.is_file() and x.name.upper()==name.upper()]
        need(len(originals)==1 and sha(originals[0].read_bytes())==expected,
             "original fixture fingerprint mismatch "+name)
    result=verify_raw(a.raw,plan)
    adapter={"upstreamCommit":"029bd65c5dcc7cdc7f2e14e35278620d9707d969",
             "patchSha256":a.patch_sha,"executableSha256":a.dosbox_exe_sha,
             "core":"normal","pagingEnabled":False}
    save_private(plan,result["phases"],a.output,
                 input_fingerprints=plan["requiredOriginalFingerprints"],
                 adapter_identity=adapter)
    print(json.dumps({"status":result["status"],
                      "rawSha256":result["rawSha256"],"rawBytes":result["rawBytes"],
                      "privatePacket":str(a.output),
                      "nativeRuntimeProvenance":"VALIDATION PENDING",
                      "nativeFrameReconstructed":False},indent=2))

if __name__=="__main__":
    try:run_cli()
    except Exception as e:
        print("P91 raw readback REFUSED: "+str(e),file=sys.stderr)
        sys.exit(2)

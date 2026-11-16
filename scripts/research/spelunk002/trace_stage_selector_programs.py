#!/usr/bin/env python3
"""Spelunk 002: original MK2 stage-root channel-program evaluator.

Read-only original MK2.EXE or owner ZIP input. Parses the original LE fixup
stream independently and checks instruction-anchored static control flow.
Outputs source-safe metadata, not game bytes, screenshots or palettes.
NEVER asserts runtime selection, on-screen position, animation or DAC state.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile

EXE_SHA = "fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65"
EXE_LEN = 861133
LE = 0x28F0C
OBJ1, OBJ2 = 0x61C54, 0xA0C54
MODES = (("mode_equals_2", 0x15BEC), ("mode_equals_1", 0x15C68), ("mode_other", 0x15CE4))
RESOURCE_LABELS = ("DEDPOOL.GRA", "TOMB.GRA", "BATTLE.GRA", "TOWER.GRA",
                   "FOREST.GRA", "ARMORY.GRA", "PIT.GRA", "PORTAL.GRA",
                   "ARENA.GRA", "CAVE.GRA")
SELECTOR_BASE, DEFAULT = 0x77453, 0x30240

# Physical positions of exact machine instructions, not searched byte patterns.
OPCODES = {
  0x81B56: "b840020300",      # initial default sentinel value
  0x81B60: "a353740700",      # first of eight consecutive selector writes
  0x81BB6: "bb685b0100",      # channel table
  0x81BC8: "8b430c",          # fourth field: mutable selector pointer
  0x81BD1: "81ff30430800",    # loop exit before ninth row
  0x81BD9: "8b00",            # read live slot
  0x81BDB: "83f801",          # explicit skip sentinel
  0x81BE0: "3d40020300",      # untouched/default sentinel exits loop
  0x81C53: "8b30",            # selected setup from command pair
  0x81F4A: "8b1883c004",      # root motion table
  0x81F55: "8b1883c004",      # root stage stream
  0x81F60: "8b1883c004",      # root+0x1C channel destination
  0x81F66: "8b108915645a0700", # token save
  0x81F6F: "833d645a070001", # token==1
  0x81F7F: "8913",            # explicit [selector]=1
  0x81F8A: "833d645a0700ff", # token==-1 terminates
  0x81F93: "833d645a0700fe", # token==-2 scale section
  0x81F9C: "8903",            # ordinary setup cell: [selector]=cursor
  0x81FA1: "83c304",          # advance selector slot
  0x81FA8: "83c004",          # special section pointer
  0x81FAB: "8b18",            # read scaled setup pointer
  0x81FB0: "f7c3ffffffff",    # terminate -2 list on null setup
  0x81FC5: "0fbf1b",          # read first signed setup word
  0x81FC8: "d1eb",            # logical SHR 1
  0x81FCA: "81eb9f000000",    # subtract 159
  0x81FD0: "c1e310",          # shift to high half (16.16 raw)
  0x81FD4: "a1645a0700",     # scalar destination
  0x81FD9: "8918",            # scalar store
}

def require(ok, reason):
    if not ok:
        raise ValueError("SPELUNK002: " + reason)

def u16(b, at): return struct.unpack_from("<H", b, at)[0]
def s16(b, at): return struct.unpack_from("<h", b, at)[0]
def u32(b, at): return struct.unpack_from("<I", b, at)[0]
def s32(b, at): return struct.unpack_from("<i", b, at)[0]
def sha(b): return hashlib.sha256(b).hexdigest()

def original_bytes(path):
    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as archive:
            names = [n for n in archive.namelist()
                     if n.rsplit("/", 1)[-1].upper() == "MK2.EXE"]
            require(len(names) == 1, "ZIP contains missing/duplicate MK2.EXE")
            content = archive.read(names[0])
    else:
        content = path.read_bytes()
    require(len(content) == EXE_LEN and sha(content) == EXE_SHA,
            "original MK2 executable fingerprint mismatch")
    return content

def parse_fixups(b):
    require(b[LE:LE+2] == b"LE" and u32(b, LE+0x14) == 113,
            "canonical LE header")
    tab = LE + u32(b, LE+0x40)
    require(u32(b, LE+0x44) == 2, "two LE objects")
    require([(u32(b, tab+24*i+12), u32(b, tab+24*i+16))
             for i in range(2)] == [(1,63), (64,50)], "LE page ownership")
    page = LE + u32(b, LE+0x68)
    data = LE + u32(b, LE+0x6C)
    entries = {}
    total = 0
    for idx in range(113):
        owner = 1 if idx < 63 else 2
        first = 1 if owner == 1 else 64
        pos = data+u32(b, page+4*idx)
        end = data+u32(b, page+4*(idx+1))
        require(0 <= pos <= end <= len(b), "LE fixup boundaries")
        while pos < end:
            kind, flags = b[pos] & 15, b[pos+1]
            rel = struct.unpack_from("<h", b, pos+2)[0]
            pos += 4
            require((flags & 3) == 0, "external fixup unsupported")
            target_obj = u16(b,pos) if flags & 64 else b[pos]
            pos += 2 if flags & 64 else 1
            target = None
            if kind != 2:
                target = u32(b,pos) if flags & 16 else u16(b,pos)
                pos += 4 if flags & 16 else 2
            if flags & 4: pos += 4 if flags & 32 else 2
            source = (idx+1-first)*4096+rel
            physical = (OBJ1 if owner == 1 else OBJ2)+source
            require(0 <= physical < len(b), "fixup beyond original source")
            key = owner,source
            value = kind,flags,target_obj,target
            require(key not in entries or entries[key] == value,
                    "conflicting duplicate fixup")
            entries[key] = value
            total += 1
        require(pos == end, "fixup page overrun")
    require((total,len(entries)) == (27004,26994), "LE fixup census")
    return entries

def assert_ptr(b, fx, source, dest, target_obj=2, owner=2):
    require(fx.get((owner,source)) == (7,16,target_obj,dest),
            "wrong typed pointer %d:%X -> %d:%X" % (owner,source,target_obj,dest))
    phys = (OBJ2 if owner == 2 else OBJ1)+source
    require(u32(b,phys) == dest, "pointer bytes disagree with LE fixup %d:%X"%(owner,source))

def instructions(b, fx):
    for physical, pattern in OPCODES.items():
        expected = bytes.fromhex(pattern)
        require(b[physical:physical+len(expected)] == expected,
                "original opcode mismatch at 0x%X" % physical)
    for index in range(8):
        phys = 0x81B60 + 5*index
        pattern = b"\xA3" + struct.pack("<I",SELECTOR_BASE+4*index)
        require(b[phys:phys+5] == pattern, "eight-slot default initializer")
        assert_ptr(b,fx,phys+1-OBJ1,SELECTOR_BASE+4*index,owner=1)
    return len(OPCODES)+8

def decode_program(b, fx, root):
    assert_ptr(b,fx,root+0x1C,SELECTOR_BASE)
    pointer = root+0x20
    selector = SELECTOR_BASE
    cells, derived = [],[]
    ended = ""
    for _ in range(12):
        require(OBJ2 <= OBJ2+pointer <= len(b)-4, "program outside file")
        token = s32(b, OBJ2+pointer)
        if token == -1:
            require((2,pointer) not in fx, "terminal marker has relocation")
            pointer += 4;ended = "minus_one";break
        if token == -2:
            require((2,pointer) not in fx, "scaled section marker has relocation")
            pointer += 4
            for _ in range(12):
                setup = u32(b,OBJ2+pointer)
                if setup == 0:
                    require((2,pointer) not in fx, "scaled section null is relocated")
                    pointer += 4;ended = "scaled_null";break
                target = u32(b,OBJ2+pointer+4)
                assert_ptr(b,fx,pointer,setup)
                assert_ptr(b,fx,pointer+4,target)
                require(0x84310 <= target <= 0x8432C and target%4==0,
                        "scaled destination not a known update global")
                require(0 <= setup <= 0x32000, "scaled setup outside safe source image")
                # Exactly the original MOVSX + SHR logical + SUB 159 + SHL16.
                raw = s16(b, OBJ2+setup)
                shifted = (raw & 0xFFFFFFFF) >> 1
                output = ((shifted-159) << 16) & 0xFFFFFFFF
                derived.append({"setupObject2":setup,
                                "destinationGlobalObject2":target,
                                "setupFirstSignedWord":raw,
                                "computedRaw32":output})
                pointer += 8
            else:
                raise ValueError("SPELUNK002: scaled section did not terminate")
            break
        require(selector <= SELECTOR_BASE+7*4, "more than eight selector writes")
        if token == 1:
            require((2,pointer) not in fx, "explicit skip sentinel relocated")
            cells.append({"channel":(selector-SELECTOR_BASE)//4,
                          "selectorObject2":selector,
                          "kind":"explicit_skip","cellObject2":pointer})
            pointer += 4
        else:
            require(token > 1 and token < 0x60000, "unsupported selector command")
            setup = u32(b,OBJ2+pointer)
            signed_parameter = s32(b,OBJ2+pointer+4)
            assert_ptr(b,fx,pointer,setup)
            require((2,pointer+4) not in fx, "setup parameter has LE pointer")
            require(u16(b,OBJ2+setup)>0, "setup first word not positive")
            cells.append({"channel":(selector-SELECTOR_BASE)//4,
                          "selectorObject2":selector,
                          "kind":"setup_pair",
                          "cellObject2":pointer,"setupObject2":setup,
                          "rawSignedSecondDword":signed_parameter})
            pointer += 8
        selector += 4
    require(ended in ("minus_one","scaled_null"), "source program not terminated")
    return {"rootObject2":root,"selectorBaseObject2":SELECTOR_BASE,
            "nextUnwrittenChannel":(selector-SELECTOR_BASE)//4,
            "unwrittenDefaultChannels":list(range((selector-SELECTOR_BASE)//4,8)),
            "programEndObject2":pointer,"termination":ended,
            "cells":cells,"derivedHighHalfWrites":derived,
            "setupCount":sum(c["kind"]=="setup_pair" for c in cells),
            "explicitSkipCount":sum(c["kind"]=="explicit_skip" for c in cells)}

def produce(b, *, check_digest=True, fx=None):
    if check_digest:
        require(len(b)==EXE_LEN and sha(b)==EXE_SHA, "canonical original MK2.EXE")
    fx = parse_fixups(b) if fx is None else fx
    pins = instructions(b,fx)
    cases = []
    programs = {}
    for label,table in MODES:
        for index in range(10):
            at=table+index*4
            root=u32(b,OBJ2+at)
            assert_ptr(b,fx,at,root)
            assert_ptr(b,fx,root+0x18,u32(b,OBJ2+root+0x18))
            require(u32(b,OBJ2+root+0x1c)==SELECTOR_BASE,
                    "root does not point to channel-zero base")
            if root not in programs:
                programs[root] = decode_program(b,fx,root)
            p = programs[root]
            cases.append({"mode":label,"configurationIndex":index,
                          "resourceFromPriorO130":RESOURCE_LABELS[index],
                          "rootObject2":root,
                          "activeSetupChannels":[{"channel":c["channel"],
                                                  "setupObject2":c["setupObject2"]}
                                                 for c in p["cells"] if c["kind"]=="setup_pair"],
                          "explicitSkipChannels":[c["channel"] for c in p["cells"]
                                                  if c["kind"]=="explicit_skip"],
                          "unwrittenDefaultChannels":p["unwrittenDefaultChannels"],
                          "scaledGlobalWriteCount":len(p["derivedHighHalfWrites"])})
    require(len(cases)==30 and len(programs)==20,
            "first ten configurations root census")
    totals={}
    for label,_ in MODES:
        sub=[cases[i] for i in range(len(cases)) if cases[i]["mode"]==label]
        totals[label]={"setupAssignments":sum(len(x["activeSetupChannels"]) for x in sub),
                       "skipSentinels":sum(len(x["explicitSkipChannels"]) for x in sub),
                       "scaledGlobalWrites":sum(x["scaledGlobalWriteCount"] for x in sub)}
    require(totals == {
      "mode_equals_2":{"setupAssignments":44,"skipSentinels":21,"scaledGlobalWrites":39},
      "mode_equals_1":{"setupAssignments":30,"skipSentinels":35,"scaledGlobalWrites":25},
      "mode_other":{"setupAssignments":30,"skipSentinels":35,"scaledGlobalWrites":25}},
      "mode-dependence census changed")
    tomb=[x for x in cases if x["configurationIndex"]==1]
    portal=[x for x in cases if x["configurationIndex"]==7]
    require([len(c["activeSetupChannels"]) for c in tomb]==[5,4,4],
            "Tomb conditionals changed")
    require([len(c["activeSetupChannels"]) for c in portal]==[2,1,1],
            "Portal conditionals changed")
    # The first Portal setup is *not* a channel-zero setup: the first
    # command is the explicit 1 sentinel. This corrects a misleading
    # channel-zero association in Spelunk 001.
    require(portal[0]["explicitSkipChannels"][0]==0 and
            portal[0]["activeSetupChannels"][0] ==
            {"channel":1,"setupObject2":0x16514},
            "Portal first active setup channel")
    return {
      "schema":"mk2_spelunk_002_source_selector_program_v1",
      "classification":"VERIFIED_STATIC_CONDITIONAL",
      "originalExeSHA256":EXE_SHA,
      "fixupCount":27004,"uniqueFixupSites":26994,
      "exactInstructionChecks":pins,
      "modeTables":{label:at for label,at in MODES},
      "firstTenSelectionCases":len(cases),
      "uniqueProgramRoots":len(programs),
      "modeTotals":totals,
      "cases":cases,
      "programs":[programs[k] for k in sorted(programs)],
      "limitations":{
          "liveGameModeKnown":False,"actualProgramExecuted":False,
          "liveSelectorContentsKnown":False,"paletteHandleOwned":False,
          "dacStartKnown":False,"screenCoordinateInterpretation":False,
          "runtimeAnimationTiming":False,
          "sourceSetupPalettePointersCarriedFromO120O121":True,
      }
    }

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("original",type=Path,help="Original DOS MK2.EXE or ZIP")
    parser.add_argument("--out",type=Path,required=True)
    args=parser.parse_args()
    require(not args.out.exists(),"refusing to overwrite report")
    report=produce(original_bytes(args.original))
    with args.out.open("x",encoding="utf-8") as file:
        json.dump(report,file,indent=2)
        file.write("\n")
    print(json.dumps({"status":report["classification"],
                      "cases":report["firstTenSelectionCases"],
                      "uniqueRootPrograms":report["uniqueProgramRoots"],
                      "modeTotals":report["modeTotals"]}))

if __name__=="__main__":
    main()

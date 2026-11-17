#!/usr/bin/env python3
"""Spelunk 007: original MK2 BLOOD.GRA source list/cursor/rewind provenance.

Read-only owner-supplied original DOS mk2.zip. Reuses the independently
authenticated original LE and indexed-RLE mechanics from Spelunk 006.
Writes only source-safe SHA-256/addresses/geometry, not proprietary game
bytes, image frames or palettes. Static evidence never implies live FPS.
"""
from __future__ import annotations
import argparse, collections, hashlib, json, struct, sys, zipfile
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parent.parent/"spelunk006"))
import trace_suck_nested_sources as core

O1,O2=core.O1,core.O2
EXE_SHA=core.EXE_SHA
BLOOD_SHA="9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9"
BLOOD_BYTES=111780
RID=9
CURSOR=0x75a78
# These list boundaries are original relocation-backed 4-byte entries, NOT
# arbitrary pointer-like byte runs. The two (1, backptr) records rewind
# into the list, deliberately bypassing introductory frames.
LISTS=(
 (0x1cfe0,11,0,None),
 (0x1d010,5,0,None),
 (0x1d038,12,0,None),
 (0x1d06c,7,0,None),
 (0x1d08c,18,1,0x1d0a4),
 (0x1d11c,7,0,None),
 (0x1d178,14,1,0x1d194),
 (0x1d1b8,5,0,None),
 (0x1d1d0,2,0,None),
 (0x1d1dc,4,0,None),
 (0x1d1f0,3,0,None),
 (0x1d200,10,0,None),
 (0x1d22c,4,0,None),
 (0x1d240,8,0,None),
 (0x1d264,13,0,None),
 (0x1d29c,16,0,None),
 (0x1d2e0,7,0,None),
 (0x1d300,9,0,None),
)
# One indirect selection table points at different offsets WITHIN one
# twelve-entry descriptor list; it is not four independent animations.
VARIANT_TABLE=0x1d028
VARIANT_DESTINATIONS=(0x1d038,0x1d044,0x1d04c,0x1d058)
DIRECT_SOURCE_ROOTS=(
 0x1cfe0,0x1d06c,0x1d08c,0x1d11c,0x1d178,0x1d1b8,
 0x1d1dc,0x1d200,0x1d240,0x1d264,0x1d29c,0x1d300
)
# Explicit source values independently checked against original LE resolver.
PIT_IMPACT_DESCRIPTOR=0x206fc
PIT_IMPACT_PHYSICAL=0xc1350
PIT_IMPACT_STREAM=111552
PIT_IMPACT_CODE=0x806e6

def require(ok,why):
    if not ok:raise ValueError("SPELUNK007: "+why)
def u32(b,p):return struct.unpack_from("<I",b,p)[0]
def sha(b):return hashlib.sha256(b).hexdigest()

def original(path):
    with zipfile.ZipFile(path) as z:
        found={}
        for m in z.infolist():
            if m.is_dir():continue
            key=m.filename.replace("\\","/").split("/")[-1].upper()
            if key in ("MK2.EXE","BLOOD.GRA"):
                require(key not in found,"duplicate original ZIP member "+key)
                found[key]=z.read(m)
        require(set(found)=={"MK2.EXE","BLOOD.GRA"},
                "original EXE/BLOOD missing from owner's ZIP")
    return found["MK2.EXE"],found["BLOOD.GRA"]

def source_identity(exe,gra):
    require(len(exe)==861133 and sha(exe)==EXE_SHA,"canonical MK2.EXE identity mismatch")
    require(len(gra)==BLOOD_BYTES and sha(gra)==BLOOD_SHA,"canonical BLOOD.GRA identity mismatch")
    pool=[x.decode("ascii") for x in exe[0xa0ef1:0xa13a7].split(b"\0") if x]
    require(pool[RID]=="BLOOD.GRA","original registry resource ID 9")

def scan_descriptors(exe,gra):
    """O69 bounded 12-byte Object2 record shape, strict authentic indexed RLE."""
    all_candidates={}
    bound=min(0x32000,len(exe)-O2-12)
    for off in range(0,bound+1,4):
        width,height,x,y,packed=struct.unpack_from("<HHhhI",exe,O2+off)
        rid,at=packed>>24,packed&0xffffff
        if rid!=RID or not(1<=width<=320 and 1<=height<=320 and
                           width*height<=64000 and
                           abs(x)<=1000 and abs(y)<=1000 and at<len(gra)):continue
        try:decoded=core.decode(gra,at,width,height)
        except (ValueError,struct.error):continue
        if decoded["streamEndExclusive"]>len(gra):continue
        all_candidates[off]={"descriptorObject2":off,"sourceStart":at,
                            "sourceEndExclusive":decoded["streamEndExclusive"],
                            "dimensions":[width,height],"localXY":[x,y],
                            "sourceSha256":decoded["encodedSha256"],
                            "indexedSha256":decoded["indexedSha256"],
                            "opacityMaskSha256":decoded["opacityMaskSha256"],
                            "opaquePixels":decoded["opaquePixelCount"]}
    require(len(all_candidates)==178,"canonical O69 BLOOD 178-graphics census")
    ranges=sorted((f["sourceStart"],f["sourceEndExclusive"]) for f in all_candidates.values())
    require(ranges[0][0]==0 and ranges[-1][1]==BLOOD_BYTES and
            all(a[1]==b[0] for a,b in zip(ranges,ranges[1:])),
            "original BLOOD bytes not exactly tiled by valid sprites")
    return all_candidates

def read_lists(exe,fx,descs):
    direct={};results=[];all_entries=[]
    for root,count,term,back in LISTS:
        frames=[]
        for i in range(count):
            at=root+4*i;d=u32(exe,O2+at)
            core.ptr(exe,fx,2,at,2,d)
            require(d in descs,"source list points to non-BLOOD sprite")
            frames.append(d);all_entries.append(d)
        end=root+4*count
        require(u32(exe,O2+end)==term and (2,end) not in fx,
                "list original terminator changed "+hex(root))
        if term==1:
            require(back is not None and root<=back<end and (back-root)%4==0,
                    "rewind pointer outside original list")
            core.ptr(exe,fx,2,end+4,2,back)
        else:
            require(back is None,"finite list has back pointer")
        code_sites=[]
        for (owner,site),reloc in fx.items():
            if owner!=1 or reloc!=(7,16,2,root):continue
            physical=O1+site
            # Only classify the original C7 05 [0x75A78],IMM32
            # instruction, not an unrelated typed pointer from executable.
            if exe[physical-6:physical]==bytes.fromhex("c705785a0700"):
                code_sites.append(physical-6)
        code_sites.sort()
        if root in DIRECT_SOURCE_ROOTS:
            require(code_sites,"missing original source cursor write "+hex(root))
        else:
            require(not code_sites,"unexpected direct cursor writer "+hex(root))
        unique=list(dict.fromkeys(frames))
        entry={"rootObject2":root,"sourceEntryCount":count,
               "uniqueSpriteDescriptors":len(unique),
               "originalDescriptorOrderObject2":frames,
               "marker":term,
               "rewindObject2":back,
               "introEntriesBeforeRewind":None if back is None else (back-root)//4,
               "rewindCycleEntryCount":None if back is None else count-(back-root)//4,
               "directCodeCursorWritePhysical":code_sites,
               "codeLinked":"DIRECT_SOURCE_CURSOR_WRITER" if code_sites else
                  ("INDIRECT_VARIANT_SELECTION" if root==0x1d038 else "NO_DIRECT_WRITER_OBSERVED")}
        results.append(entry)
    require(len(results)==18 and len(all_entries)==155 and len(set(all_entries))==153,
            "list grouping / repeated-frame original census changed")
    require(len([x for x in results if x["directCodeCursorWritePhysical"]])==12,
            "12 direct source writer lists changed")
    require(len([x for x in results if x["codeLinked"]=="NO_DIRECT_WRITER_OBSERVED"])==5,
            "orphan-candidate list count changed")
    require([x for x in results if x["rewindObject2"]] and
            [(x["rootObject2"],x["introEntriesBeforeRewind"],x["rewindCycleEntryCount"])
             for x in results if x["rewindObject2"]]==
            [(0x1d08c,6,12),(0x1d178,7,7)],
            "mid-list intro/rewind subgraphs differ")
    repeated=next(x for x in results if x["rootObject2"]==0x1d240)
    require(repeated["sourceEntryCount"]==8 and repeated["uniqueSpriteDescriptors"]==6 and
            repeated["originalDescriptorOrderObject2"][0]==repeated["originalDescriptorOrderObject2"][1] and
            repeated["originalDescriptorOrderObject2"][2]==repeated["originalDescriptorOrderObject2"][3],
            "BLOOD repeated descriptor entries changed")
    return results,set(all_entries)

def source_control(exe,fx):
    # Original 0x86CC5 normal reader handles marker=1 and typed backpointer.
    # This source-control check is what makes the two loops more than a
    # mere pair of visually plausible pointer lists.
    core.require(exe[0x86d14:0x86d26]==bytes.fromhex(
      "83fb0175c3528b52048915785a07005aeb9f"),
      "original rewind opcode/target changed")
    for i,target in enumerate(VARIANT_DESTINATIONS):
        core.ptr(exe,fx,2,VARIANT_TABLE+4*i,2,target)
        require(0x1d038<=target<=0x1d038+11*4 and (target-0x1d038)%4==0,
                "variant target not within 12-entry original list")
    # Source at 0x90661 takes a DWORD from [ESI+0x68], moves its high
    # word into EAX, ZEROES cursor high 16 bits, and uses the original
    # LOW 16-bit index (cursor<<2)+0x1D028 to dereference a list entry.
    # Exact original selector arithmetic and typed table base.
    anchors={
        0x90661:"8b56688915785a07005a",
        0x9066b:"a1785a0700c1e810",
        0x90673:"66c7057a5a07000000",
        0x9067c:"c125785a070002",
        0x90683:"8105785a070028d00100",
        0x9068d:"50a1785a0700528b108915785a0700",
        0x906a8:"e9180f0000",
        0x90e59:"c705785a070078d10100",
        0x9091e:"c705785a07008cd00100"
    }
    for at,word in anchors.items():
        b=bytes.fromhex(word)
        require(exe[at:at+len(b)]==b,"original control opcode mismatch "+hex(at))
    core.ptr(exe,fx,1,0x90689-O1,2,VARIANT_TABLE)
    require(0x906ad==0x906a8+5,"variant source branch byte length")
    return {"normalReaderPhysical":0x86cc5,
            "rewindHandlingPhysical":0x86d14,
            "variantSelectorTableObject2":VARIANT_TABLE,
            "variantPointerDestinationsObject2":list(VARIANT_DESTINATIONS),
            "variantEntryIndices":[(x-0x1d038)//4 for x in VARIANT_DESTINATIONS],
            "variantInputTaskField":"LOW 16 bits of [ESI+0x68] choose list entry; original HIGH 16 bits preserved in EAX",
            "variantCodePhysical":0x90661,
            "variantDereferencePhysical":0x90694,
            "variantRuntimeBoundsVerified":False}

def pit_regression(exe,fx,descs):
    d=descs[PIT_IMPACT_DESCRIPTOR]
    require(O2+PIT_IMPACT_DESCRIPTOR==PIT_IMPACT_PHYSICAL,
            "O228 source177 physical address changed")
    require(d["dimensions"]==[14,9] and d["localXY"]==[7,3] and
            d["sourceStart"]==PIT_IMPACT_STREAM and
            d["sourceEndExclusive"]==BLOOD_BYTES and d["opaquePixels"]==73,
            "O218 source177 descriptor/regression changed")
    core.ptr(exe,fx,1,PIT_IMPACT_CODE+6-O1,2,PIT_IMPACT_DESCRIPTOR)
    # The O228 per-descriptor fourth DWORD source palette relationship
    # is not the actual native DAC allocation.
    core.ptr(exe,fx,2,PIT_IMPACT_DESCRIPTOR+12,1,0x26cc4)
    return {"descriptorObject2":PIT_IMPACT_DESCRIPTOR,
            "physical":PIT_IMPACT_PHYSICAL,
            "resourceLastStreamStart":PIT_IMPACT_STREAM,
            "nativeDimensions":[14,9],"opaquePixels":73,
            "typedSourcePalettePointerObject1Offset":0x26cc4,
            "verifiedOriginalDACAllocation":False}

def audit(exe,gra,strict_identity=True):
    if strict_identity:source_identity(exe,gra)
    fx=core.relocations(exe)
    descs=scan_descriptors(exe,gra)
    lists,listed=read_lists(exe,fx,descs)
    ctrl=source_control(exe,fx)
    pit=pit_regression(exe,fx,descs)
    # Unlisted graphics are still authentic; no automatic animation promotion.
    not_listed=sorted(set(descs)-listed)
    require(len(not_listed)==25,"unlisted 25 sprite complement changed")
    typed_sites={target for (o,site),e in fx.items()
                 if e[0]==7 and e[2]==2 for target in [e[3]] if target in descs}
    require(len(typed_sites)==159,"BLOOD descriptor typed reference census changed")
    return {"schema":"mk2_spelunk_007_blood_source_lists_v1",
            "classification":"VERIFIED_STATIC_SOURCE_ORDER_AND_CONTROL",
            "sourceOriginalExeSha256":EXE_SHA,"sourceBloodGraSha256":BLOOD_SHA,
            "originalBloodBytes":BLOOD_BYTES,"resourceRegistryId":RID,
            "typedLERelocations":27004,"uniqueLERelocationSites":26994,
            "originalIndexedSprites":len(descs),"completeOriginalResourceByteCoverage":True,
            "typedReferencedDescriptorCount":len(typed_sites),
            "sourceListCount":len(lists),"sourceListEntryReferences":155,
            "distinctSpritesInLists":len(listed),
            "otherSpritesNotInTheseLists":len(not_listed),
            "sourceLists":lists,"sourceReaderAndVariantControls":ctrl,
            "source177PreviouslyKnownPitWitness":pit,
            "unlistedSpriteDescriptorsObject2":not_listed,
            "allSprites":[descs[k] for k in sorted(descs)],
            "runtimeUnknown":{"originalGameExecuted":False,"frameTiming":False,
             "activePaletteOrDac":False,"liveEffectTriggers":False,
             "worldCoordinatesOrOcclusion":False,"nativeFramebufferAccuracy":False,
             "liveVariantSelection":False},
            "note":"Source list 0x1D08C intro entries0..5 then loops entries6..17; 0x1D178 intro0..6 then loops7..13. These are source sequence semantics, not observed present durations. Five list-like groups have no direct source cursor writer proven and must remain candidates."}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game-zip",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    args=parser.parse_args()
    require(not args.out.exists(),"refusing to overwrite source evidence")
    exe,gra=original(args.game_zip)
    result=audit(exe,gra)
    with args.out.open("x",encoding="utf-8") as out:
        json.dump(result,out,indent=2);out.write("\n")
    print(json.dumps({"status":result["classification"],
        "sprites":result["originalIndexedSprites"],"lists":result["sourceListCount"],
        "listEntries":result["sourceListEntryReferences"],
        "distinctListSprites":result["distinctSpritesInLists"]}))
if __name__=="__main__":
    main()

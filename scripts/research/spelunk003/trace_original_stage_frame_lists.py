#!/usr/bin/env python3
"""Spelunk 003: stage-linked MK2 Armory/Forest original indexed frame lists.

Read-only original-file research, NOT runtime capture. Given the exact
original DOS mk2.zip, validate two code-referenced frame lists, each frame's
typed LE descriptor pointer, packed GRA resource identity, original encoded
sprite stream, control marker, and source execution path. Write source-safe
hash/offset metadata only. Never export commercial indexed bytes here.
"""
from __future__ import annotations
import argparse, collections, hashlib, json, struct, zipfile
from pathlib import Path

EXE_SHA="fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65"
EXE_LEN=861133
LE=0x28f0c
OBJ1,OBJ2=0x61c54,0xa0c54
CURSOR=0x75a78
SEED=0x75a6c
TRACKS={
 "armory_source_12":{
   "stageIndex":5,"stageName":"Armory","resource":"ARMORY.GRA","resourceID":26,
   "graSHA256":"fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612",
   "list":0x168d4,"count":12,"unique":12,"firstDescriptor":0x169ec,
   "sourceRange":[0x1c780,0x1ed80],"spriteShape":[10,64],
   "callbackPhysical":0x829bc,"writerPhysical":0x82a43,
   "seedWriterPhysical":0x82a61,"schedulerArgument":6,
   "expectedOrdinalDescriptorIndices":list(range(12))
 },
 "forest_source_20":{
   "stageIndex":4,"stageName":"Living Forest","resource":"FOREST.GRA","resourceID":27,
   "graSHA256":"8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9",
   "list":0x16d38,"count":20,"unique":7,"firstDescriptor":0x16f14,
   "sourceRange":[0x28390,0x2f544],"spriteShape":[64,64],
   "callbackPhysical":0x82ad4,"writerPhysical":0x82c90,
   "seedWriterPhysical":0x82cb1,"schedulerArgument":5,
   "expectedOrdinalDescriptorIndices":[0,1,2,3,4,5,6,5,6,5,6,5,6,5,6,4,3,2,1,0]
 }
}
STAGE_DISPATCH={"mode_equals_2":0x15bec,"mode_equals_1":0x15c68,"mode_other":0x15ce4}
MAX_FRAME_PIXELS=64000
def require(ok,why):
    if not ok:raise ValueError("SPELUNK003: "+why)
def u32(b,p):return struct.unpack_from("<I",b,p)[0]
def u16(b,p):return struct.unpack_from("<H",b,p)[0]
def sha(b):return hashlib.sha256(b).hexdigest()
def original_files(zip_path):
    with zipfile.ZipFile(zip_path) as z:
        names={}
        for info in z.infolist():
            if info.is_dir():continue
            key=info.filename.replace("\\","/").split("/")[-1].upper()
            if key in ("MK2.EXE","ARMORY.GRA","FOREST.GRA"):
                require(key not in names,"duplicate ZIP member "+key)
                names[key]=info.filename
        require(set(names)=={"MK2.EXE","ARMORY.GRA","FOREST.GRA"},
                "owner ZIP missing original EXE/stage resources")
        raw={key:z.read(filename) for key,filename in names.items()}
    require(len(raw["MK2.EXE"])==EXE_LEN and sha(raw["MK2.EXE"])==EXE_SHA,
            "canonical MK2.EXE SHA256/length mismatch")
    for record in TRACKS.values():
        key=record["resource"]
        require(sha(raw[key])==record["graSHA256"],
                "canonical "+key+" SHA256 mismatch")
    return raw

def le_fixups(b):
    require(b[LE:LE+2]==b"LE","LE header")
    require(u32(b,LE+0x14)==113,"LE original pages")
    tab=LE+u32(b,LE+0x40)
    require(u32(b,LE+0x44)==2,"LE object count")
    require([(u32(b,tab+24*i+12),u32(b,tab+24*i+16)) for i in range(2)]
            ==[(1,63),(64,50)],"canonical LE pages")
    po=LE+u32(b,LE+0x68);fb=LE+u32(b,LE+0x6c)
    result={};all_count=0
    for page in range(113):
        owner=1 if page<63 else 2;first=1 if owner==1 else 64
        p=fb+u32(b,po+4*page);end=fb+u32(b,po+4*(page+1))
        require(0<=p<=end<=len(b),"LE block bounds")
        while p<end:
            kind=b[p]&15;flags=b[p+1]
            relative=struct.unpack_from("<h",b,p+2)[0];p+=4
            require(flags&3==0,"unsupported imported relocation")
            destobj=u16(b,p) if flags&64 else b[p];p+=2 if flags&64 else 1
            target=None
            if kind!=2:
                target=u32(b,p) if flags&16 else u16(b,p)
                p+=4 if flags&16 else 2
            if flags&4:p+=4 if flags&32 else 2
            site=(page+1-first)*4096+relative
            key=(owner,site);value=(kind,flags,destobj,target)
            require(key not in result or result[key]==value,
                    "conflicting LE fixup source")
            result[key]=value;all_count+=1
        require(p==end,"LE page fixup alignment")
    require((all_count,len(result))==(27004,26994),
            "original LE fixup census")
    return result

def pointer(b,fx,owner,source,destobj,target):
    require(fx.get((owner,source))==(7,16,destobj,target),
            "typed pointer mismatch at "+str(owner)+":"+hex(source))
    physical=(OBJ1 if owner==1 else OBJ2)+source
    require(u32(b,physical)==target,
            "raw pointer mismatch at "+str(owner)+":"+hex(source))

def rle_index_mask(gra,start,w,h):
    """Independent exact O122 indexed sprite grammar with strict bounds."""
    require(0<w and 0<h and w*h<=MAX_FRAME_PIXELS,
            "unsupported source frame dimensions")
    require(0<=start<len(gra),"source frame offset outside GRA")
    index=bytearray(w*h);mask=bytearray(w*h);pos=start
    commands=collections.Counter()
    for row in range(h):
        col=0
        while col<w:
            require(pos+4<=len(gra),"truncated original RLE token")
            token=u32(gra,pos);pos+=4
            if token&1:
                n=token>>1;kind="transparentSkip"
            elif token&2:
                n=token>>10;value=(token>>2)&255;kind="indexedRLE"
                require(0<n<=w-col,"indexedRLE crossed row")
                idx=row*w+col
                index[idx:idx+n]=bytes([value])*n
                mask[idx:idx+n]=b"\x01"*n
            else:
                n=token>>2;kind="indexedLiteral"
                require(0<n<=64 and n<=w-col and pos+n<=len(gra),
                        "indexedLiteral crossed row or file")
                idx=row*w+col
                index[idx:idx+n]=gra[pos:pos+n]
                mask[idx:idx+n]=b"\x01"*n
                pos+=(n+3)&~3
            require(0<n<=w-col,"transparent or run length invalid")
            col+=n;commands[kind]+=1
    return {"end":pos,"opaquePixels":mask.count(1),
            "indexedPlaneSha256":sha(index),"opacityPlaneSha256":sha(mask),
            "encodedSha256":sha(gra[start:pos]),
            "rleCommands":dict(sorted(commands.items()))}

def verify_control(b,fx,t):
    writer=t["writerPhysical"];source=writer+6
    require(b[writer:source]==bytes.fromhex("c705785a0700"),
            "original stream cursor writer opcode")
    pointer(b,fx,1,writer+2-OBJ1,2,CURSOR)
    pointer(b,fx,1,source-OBJ1,2,t["list"])
    require(b[writer+10]==0xb8 and u32(b,writer+11)==t["schedulerArgument"],
            "original caller-supplied count changed")
    seed=t["seedWriterPhysical"]
    require(b[seed:seed+6]==bytes.fromhex("c7056c5a0700"),
            "original first sprite seed opcode")
    pointer(b,fx,1,seed+2-OBJ1,2,SEED)
    pointer(b,fx,1,seed+6-OBJ1,2,t["firstDescriptor"])
    stage_index=t["stageIndex"];targets=[]
    for mode,table in STAGE_DISPATCH.items():
        root=u32(b,OBJ2+table+4*stage_index)
        pointer(b,fx,2,table+4*stage_index,2,root)
        target=u32(b,OBJ2+root+0x10)
        pointer(b,fx,2,root+0x10,1,target)
        require(OBJ1+target==t["callbackPhysical"],"root callback mismatch")
        targets.append({"sourceMode":mode,"rootObject2":root,
                        "callbackPhysical":OBJ1+target})
    require(t["callbackPhysical"]<writer,
            "animation writer not in callback region")
    # Original Armory multi-object consumer, shared by Forest's JMP at
    # 0x82CA9. A CALL to source reader is stronger than a pointer-list scan.
    calls=[0x82a8f,0x82aa4,0x82ab6]
    for at in calls:
        require(b[at]==0xe8 and
                at+5+struct.unpack_from("<i",b,at+1)[0]==0x86cc5,
                "shared frame consumer CALL changed")
    require(b[0x82a94:0x82a96]==bytes.fromhex("7230"),
            "source reader carry path changed")
    if t["resource"]=="ARMORY.GRA":
        require(b[0x82a5c:0x82a5e]==bytes.fromhex("eb29"),
                "Armory jump into consumer loop")
    else:
        require(b[0x82ca9]==0xe9 and
                0x82cae+struct.unpack_from("<i",b,0x82caa)[0]==0x82a87,
                "Forest callback not joined to shared consumer")
    # Source loop marker zero is interpreted as carry and exit, but the
    # runtime may call a different callback, suppress rendering or die.
    require(b[0x86d3b:0x86d40]==bytes.fromhex("83fb007412"),
            "original reader zero-marker branch changed")
    return {"stageRoots":targets,"cursorWritePhysical":writer,
            "cursorObject2":CURSOR,"sourceSequenceListObject2":t["list"],
            "firstDescriptorSeedPhysical":seed,"seedObject2":SEED,
            "sharedConsumerPhysical":0x82a87,
            "readerCallSitesPhysical":calls,
            "originalReaderPhysical":0x86cc5,
            "callerYieldArgumentRaw":t["schedulerArgument"],
            "runtimeInvocationObserved":False}

def produce(raw):
    exe=raw["MK2.EXE"]
    require(len(exe)==EXE_LEN and sha(exe)==EXE_SHA,
            "canonical original MK2.EXE required")
    fx=le_fixups(exe);tracks=[]
    for name,t in TRACKS.items():
        gra=raw[t["resource"]]
        require(sha(gra)==t["graSHA256"],"incorrect original "+t["resource"])
        provenance=verify_control(exe,fx,t)
        list_start=t["list"];frames=[]
        for ordinal in range(t["count"]):
            at=list_start+ordinal*4
            desc=u32(exe,OBJ2+at)
            pointer(exe,fx,2,at,2,desc)
            require(OBJ2<=OBJ2+desc<=len(exe)-12,
                    "original sprite descriptor outside backed Object2")
            w,h,x,y,packed=struct.unpack_from("<HHhhI",exe,OBJ2+desc)
            rid,offset=packed>>24,packed&0xffffff
            require(rid==t["resourceID"],
                    "sprite descriptor references incorrect GRA resource")
            require([w,h]==t["spriteShape"],"native frame shape changed")
            decoded=rle_index_mask(gra,offset,w,h)
            frames.append({"ordinal":ordinal,"pointerEntryObject2":at,
                           "descriptorObject2":desc,
                           "originalWidth":w,"originalHeight":h,
                           "descriptorLocalX":x,"descriptorLocalY":y,
                           "resourceID":rid,"resourceName":t["resource"],
                           "encodedOffset":offset,
                           "encodedEndExclusive":decoded["end"],
                           **decoded})
        terminator_at=list_start+t["count"]*4
        require(u32(exe,OBJ2+terminator_at)==0 and
                (2,terminator_at) not in fx,
                "sequence does not end with original unrelocated zero")
        distinct={}
        for frame in frames:
            distinct.setdefault(frame["descriptorObject2"],frame)
        require(len(distinct)==t["unique"],"unexpected original sprite reuse")
        unique_order=sorted(distinct.values(),key=lambda fr:fr["encodedOffset"])
        require(all(unique_order[i]["encodedEndExclusive"]==
                    unique_order[i+1]["encodedOffset"]
                    for i in range(len(unique_order)-1)),
                "unique original encoded source sprites are not contiguous")
        require([unique_order[0]["encodedOffset"],
                 unique_order[-1]["encodedEndExclusive"]]==t["sourceRange"],
                "original resource span changed")
        ordinals=[next(i for i,f in enumerate(unique_order)
                       if f["descriptorObject2"]==frame["descriptorObject2"])
                  for frame in frames]
        require(ordinals==t["expectedOrdinalDescriptorIndices"],
                "original frame-order/reuse pattern changed")
        tracks.append({"track":name,"stage":t["stageName"],
                       "stageIndex":t["stageIndex"],"resourceName":t["resource"],
                       "sourceResourceSha256":t["graSHA256"],
                       "listObject2":list_start,
                       "nativeSourceFrameEntries":t["count"],
                       "distinctOriginalSprites":t["unique"],
                       "ordinalToUniqueSprite":ordinals,
                       "terminalWord":0,
                       "control":"ZERO_TERMINATED_FINITE_SOURCE_LIST",
                       "uniqueEncodedSpan":t["sourceRange"],
                       "uniqueEncodedSourceSha256":
                           sha(gra[t["sourceRange"][0]:t["sourceRange"][1]]),
                       "sourceCode":provenance,
                       "frames":frames,
                       "activeInGameplayVerified":False,
                       "actualFrameDurationVerified":False,
                       "sourcePaletteOwnedByVGA":False})
    require(sum(t["nativeSourceFrameEntries"] for t in tracks)==32,
            "32 source-order frame entries")
    require(sum(t["distinctOriginalSprites"] for t in tracks)==19,
            "19 distinct original source sprites")
    return {"schema":"mk2_spelunk_003_armory_forest_original_frames_v1",
            "classification":"VERIFIED_STATIC_SOURCE_FRAME_ORDER",
            "exeSha256":EXE_SHA,"typedLEFixups":27004,
            "uniqueLEFixupSites":26994,
            "trackCount":len(tracks),"sourceOrderedFrameEntries":32,
            "distinctSourceSprites":19,
            "notes":["Armory/Forest lists are an additive source-backed extraction opportunity beyond the 43 O136/O137 Tomb/Portal/Tower effect frames.",
                     "Forest has twenty ordered descriptor entries but only seven unique sprite streams; deduplicating frame ordering loses intended source sequence.",
                     "Zero terminator is not evidence of any observed fight trigger, wall-clock time, FPS or runtime presence.",
                     "Keep original sprite indices/masks and descriptor-local offsets; do not infer DAC palette, 320x200 placement or parallax."],
            "tracks":tracks,
            "runtimeVerified":{"originalGameExecuted":False,
                               "animationPlaybackTimestamped":False,
                               "originalFrameBufferMatched":False,
                               "livePaletteHandleKnown":False}}
def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--game-zip",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    args=p.parse_args()
    require(not args.out.exists(),"refusing to overwrite source-safe report")
    report=produce(original_files(args.game_zip))
    with args.out.open("x",encoding="utf-8") as out:
        json.dump(report,out,indent=2);out.write("\n")
    print(json.dumps({"classification":report["classification"],
                      "tracks":report["trackCount"],
                      "entries":report["sourceOrderedFrameEntries"],
                      "unique":report["distinctSourceSprites"]}))
if __name__=="__main__":
    main()

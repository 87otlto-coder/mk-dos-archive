#!/usr/bin/env python3
"""Spelunk 005 — original DOS MK2 BANG/SUCK indexed source provenance.

Owner-supplied ZIP only; no original bytes, sprite planes or palette words are
exported. Uses the already source-verified original LE/RLE mechanics from
Spelunk 004, but independently authenticates the new BANG/SUCK code consumers,
typed pointers, descriptor identities, terminators and full-vs-partial resource
interval coverage. STATIC source evidence, not observed gameplay/animation.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, sys, zipfile
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parent.parent/"spelunk004"))
import trace_soul_fireskel_source as common

O1,O2=common.O1,common.O2
EXE_SHA=common.EXE_HASH
RES={
 "BANG.GRA":{"bytes":29556,"sha256":"76bdab89c4262555560bd3958eecca58460bddb4d75f5bce90331ab419151152","rid":12},
 "SUCK.GRA":{"bytes":122000,"sha256":"d5672116021a56c27b94a14c1eb51e83bb077209cf67fcf92add51553e862d08","rid":14}
}
BANG_BASE=0x1b514
BANG_SIZES=(8,8,8,8,8,8,8,8,6,13,12)
BANG_ROOTS=(0x1b540,0x1b568,0x1b590,0x1b5b8,0x1b5e0,
            0x1b608,0x1b62c,0x1b650,0x1b678,0x1b698,0x1b6d4)
SUCK_SPECS=(
 ("suck_finite_a",0x1bf00,5,0,None),
 ("suck_finite_b",0x1bf18,5,0,None),
 ("suck_loop",0x1bf30,8,1,0x1bf30),
)
BANG_PAIRS=(("source_connected",0x1b7dc,6),)
BANG_UNCLASSIFIED_RANGE=(0x1b810,0x1b858)
def need(ok,msg):
 if not ok:raise ValueError("SPELUNK005: "+msg)
def u32(b,at):return struct.unpack_from("<I",b,at)[0]
def s16(b,at):return struct.unpack_from("<h",b,at)[0]
def sha(b):return hashlib.sha256(b).hexdigest()

def original(zip_path):
 with zipfile.ZipFile(zip_path) as z:
  found={};required={"MK2.EXE",*RES}
  for i in z.infolist():
   if i.is_dir():continue
   key=i.filename.replace("\\","/").rsplit("/",1)[-1].upper()
   if key in required:
    need(key not in found,"duplicate original file "+key)
    found[key]=i.filename
  need(set(found)==required,"original ZIP missing EXE/BANG/SUCK")
  data={key:z.read(v) for key,v in found.items()}
 validate(data)
 return data
def validate(data):
 b=data["MK2.EXE"]
 need(len(b)==861133 and sha(b)==EXE_SHA,"canonical original DOS MK2.EXE mismatch")
 for name,r in RES.items():
  need(name in data and len(data[name])==r["bytes"] and sha(data[name])==r["sha256"],
       "canonical "+name+" mismatch")
 # Original pool slot IDs are not a claim about live DAC bank ownership.
 pool=[v.decode("ascii") for v in b[0xa0ef1:0xa13a7].split(b"\0") if v]
 for name,r in RES.items():need(pool[r["rid"]]==name,"original filename pool ID mismatch")

def code(exe,fx):
 c=common
 # BANG original sequence table index = (signed WORD at record+0xA)*4,
 # then dereference typed 11-pointer table and preserve pointer in task+0x58.
 for at,hexbytes in {
  0x84100:"0fbf500a",
  0x8410b:"c1256c5a070002",
  0x84112:"81056c5a070014b50100",
  0x8411d:"a16c5a0700",
  0x84123:"8b10",
  0x8419c:"ba6a270200",
  0x841bd:"895058",
  0x843be:"8b5e54",
  0x843d2:"528b56588915785a0700",
  0x843ee:"e85501feff",
  0x8446d:"e8e8fefdff",
  0x842e0:"c705785a0700dcb70100",
  0x83ed8:"50a1785a07008b18",
  0x83ef7:"0fbf10",
  0x83f09:"f705705a0700ffffffff7420",
  0x83f1c:"0fbf10",
 }.items():c.exact(exe,at,hexbytes,"BANG instruction at 0x%x"%at)
 c.ptr(exe,fx,1,0x84118-O1,2,BANG_BASE)
 c.ptr(exe,fx,1,0x8419d-O1,1,0x2276a)
 need(c.relative_target(exe,0x841a1)==0x67222,"BANG task registration helper")
 need(c.relative_target(exe,0x843ee)==0x64548,"BANG descriptor constructor")
 need(c.relative_target(exe,0x8446d)==0x6435a,"BANG frame-advance helper")
 c.ptr(exe,fx,1,0x842e6-O1,2,0x1b7dc)
 need(c.relative_target(exe,0x842ea)==0x83ecd,"BANG paired placement reader")
 # SUCK: first two 5-element source lists reach separate finite-runner
 # paths; third 8-entry loop is read by the normal descriptor reader.
 for at,ptr in ((0x84929,0x1bf00),(0x84944,0x1bf18),
                (0x8495f,0x1bf18),(0x84998,0x1bf30)):
  c.exact(exe,at,"c705785a0700"+struct.pack("<I",ptr).hex(),
          "SUCK cursor writer 0x%x"%at)
  c.ptr(exe,fx,1,at+6-O1,2,ptr)
 for at,target in ((0x8497d,0x86c99),(0x84993,0x86c99),
                   (0x849a2,0x86cc5),(0x84a46,0x86cc5)):
  need(c.relative_target(exe,at)==target,"SUCK wrong reader/runner at 0x%x"%at)
 c.exact(exe,0x84a2e,"b803000000e8adfbfdff48c1e002",
         "SUCK separate one-descriptor choice")
 c.exact(exe,0x84a3c,"0558bf0100a3785a0700",
         "SUCK separate indexed descriptor table")
 c.ptr(exe,fx,1,0x84a3d-O1,2,0x1bf58)
 return {
   "BANG":{"selectedListTableObject2":BANG_BASE,
           "signedSelectorSourcePhysical":0x84100,
           "selectedTablePointerInstruction":0x84112,
           "taskCallbackSourcePhysical":0x843be,
           "taskListStorageField":0x58,
           "globalCursorObject2":0x75a78,
           "taskRegistrationHelperPhysical":0x67222,
           "animationAdvanceHelperPhysical":0x6435a,
           "pairedSourceListObject2":0x1b7dc,
           "pairedSourceConsumerPhysical":0x83ecd},
   "SUCK":{"finiteRunnerPhysical":0x86c99,
           "finiteCursorWritersPhysical":[0x84929,0x84944,0x8495f],
           "loopCursorWriterPhysical":0x84998,
           "normalReaderPhysical":0x86cc5,
           "oneDescriptorTableObject2":0x1bf58,
           "oneDescriptorTableSourcePhysical":0x84a3c,
           "oneDescriptorSelectionNotAnimation":True}
 }

def descriptor(exe,fx,gra,rid,desc):
 need(0<=desc<0x32000 and O2+desc+12<=len(exe),
      "sprite descriptor outside Object2 file backing")
 w,h,x,y,packed=struct.unpack_from("<HHhhI",exe,O2+desc)
 need((packed>>24)==rid,"sprite resource ID mismatch")
 start=packed&0xffffff
 plane=common.decode_rle(gra,start,w,h)
 return {"descriptorObject2":desc,"dimensions":[w,h],
         "signedLocalXY":[x,y],"sourceStart":start,
         "sourceEndExclusive":plane["streamEndExclusive"],
         "sourceSha256":plane["sourceStreamSha256"],
         "indexedSha256":plane["indexedPlaneSha256"],
         "maskSha256":plane["opacityMaskSha256"],
         "opaquePixels":plane["opaqueCount"]}

def sequence(exe,fx,gra,rid,start,count,token,back):
 frames=[]
 for i in range(count):
  at=start+i*4;desc=u32(exe,O2+at)
  common.ptr(exe,fx,2,at,2,desc)
  frame=descriptor(exe,fx,gra,rid,desc)
  frame.update({"ordinal":i,"entryObject2":at})
  frames.append(frame)
 at=start+count*4
 need(u32(exe,O2+at)==token and (2,at) not in fx,"source end marker mismatch")
 if back is not None:
  common.ptr(exe,fx,2,at+4,2,back)
 else:need(token==0,"finite sequence without zero marker")
 return {"listObject2":start,"entryCount":count,
         "distinctDescriptors":len({x["descriptorObject2"] for x in frames}),
         "terminator":token,"backPointer":back,
         "orderedEntries":frames}

def bang_placement(exe,fx,gra):
 # The only *code-connected* original 8-byte pointer+two-signed-word
 # records start at 0x1B7DC. The reader at 0x83ECD stops on the first
 # signed X==0, so its sixth pointer record is a sentinel, not proof of
 # a sixth rendered sprite.
 label,root,count=BANG_PAIRS[0]
 first=[]
 for i in range(count):
  at=root+8*i;d=u32(exe,O2+at)
  common.ptr(exe,fx,2,at,2,d)
  sprite=descriptor(exe,fx,gra,12,d)
  first.append({"sourceEntryObject2":at,"descriptorObject2":d,
               "pairedSignedWords":[s16(exe,O2+at+4),s16(exe,O2+at+6)],
               "descriptorSourceSpan":[sprite["sourceStart"],
                                       sprite["sourceEndExclusive"]]})
 stop=root+8*count
 need(u32(exe,O2+stop)==0 and (2,stop) not in fx,
      "source-connected BANG paired block no longer has zero word")
 need([p["pairedSignedWords"][0] for p in first]==[48,46,40,29,16,0],
      "source-connected BANG signed-X sentinel placement changed")
 # The following region is **not** homogeneous pairs: one unrelocated zero
 # appears between otherwise typed descriptor pointers. Source semantics
 # were NOT established. Record only what the original LE fixups prove.
 start,end=BANG_UNCLASSIFIED_RANGE
 tail=[]
 for at in range(start,end,4):
  e=fx.get((2,at))
  if e is None or e[:3]!=(7,16,2):continue
  d=e[3]
  if not (0<=d<0x32000 and O2+d+12<=len(exe)):continue
  if (u32(exe,O2+d+8)>>24)!=12:continue
  common.ptr(exe,fx,2,at,2,d)
  sprite=descriptor(exe,fx,gra,12,d)
  tail.append({"sourceEntryObject2":at,"descriptorObject2":d,
               "descriptorSourceSpan":[sprite["sourceStart"],
                                       sprite["sourceEndExclusive"]]})
 need([p["sourceEntryObject2"] for p in tail]==
      [0x1b810,0x1b81c,0x1b824,0x1b82c,0x1b834,
       0x1b83c,0x1b844,0x1b84c,0x1b854],
      "unclassified BANG descriptor-pointer sites changed")
 need((2,0x1b818) not in fx and u32(exe,O2+0x1b818)==0,
      "intervening unrelocated BANG zero missing")
 return [
  {"label":"source_connected_pointer_signed_xy",
   "sourceStartObject2":root,"pointerPairs":first,
   "firstZeroSignedXAt":5,
   "readerStopsBeforeDrawingThatPointer":True,
   "directCodeReferenceObserved":True},
  {"label":"separate_unclassified_typed_descriptor_region",
   "sourceRegionObject2":[start,end],
   "pointerPairs":tail,
   "containsNonuniformInterveningZero":True,
   "directCodeReferenceObserved":False,
   "otherFieldsNotClassified":True}
 ]


def coverage(frames,bytes_total):
 by_descriptor={}
 for f in frames:
  d=f["descriptorObject2"]
  interval=(f["sourceStart"],f["sourceEndExclusive"])
  need(d not in by_descriptor or by_descriptor[d]==interval,
       "descriptor source interval inconsistent across references")
  by_descriptor[d]=interval
 unique=sorted(set(by_descriptor.values()))
 need(unique and unique[0][0]==0 and unique[-1][1]==bytes_total,
      "resource bytes not fully accounted for")
 need(all(a[1]==b[0] for a,b in zip(unique,unique[1:])),
      "source resource has gap or overlap")
 return by_descriptor,unique

def audit(data):
 validate(data)
 exe=data["MK2.EXE"];fx=common.fixups(exe);control=code(exe,fx)
 # BANG 11 list selectors: source program indexes a typed pointer table,
 # then the task writes its selected pointer to normal animation cursor.
 bang=[];bframes=[]
 for i,(root,count) in enumerate(zip(BANG_ROOTS,BANG_SIZES)):
  common.ptr(exe,fx,2,BANG_BASE+i*4,2,root)
  token=0 if i in (5,6) else 1
  sequence_data=sequence(exe,fx,data["BANG.GRA"],12,root,count,token,
                         root if token==1 else None)
  sequence_data["selectorIndex"]=i
  bang.append(sequence_data);bframes.extend(sequence_data["orderedEntries"])
 need(len(bframes)==95 and len({f["descriptorObject2"] for f in bframes})==93,
      "BANG main selector entries/repeated sprite census")
 placed=bang_placement(exe,fx,data["BANG.GRA"])
 pframes=[]
 for entry in placed:
  for pair in entry["pointerPairs"]:
   pframes.append(descriptor(exe,fx,data["BANG.GRA"],12,pair["descriptorObject2"]))
 main=set(f["descriptorObject2"] for f in bframes)
 extras={f["descriptorObject2"]:f for f in pframes if f["descriptorObject2"] not in main}
 need(len(extras)==8,"BANG separate paired descriptor count")
 all_desc,all_intervals=coverage(bframes+pframes,len(data["BANG.GRA"]))
 need(len(all_desc)==101 and len(all_intervals)==101,
      "BANG original source descriptor full-resource census")
 main_intervals=sorted({(f["sourceStart"],f["sourceEndExclusive"]) for f in bframes})
 need(main_intervals[0][0]==0 and main_intervals[-1][1]==24692 and
      all(a[1]==b[0] for a,b in zip(main_intervals,main_intervals[1:])),
      "BANG source-index animation region no longer contiguous")
 other_intervals=sorted((f["sourceStart"],f["sourceEndExclusive"]) for f in extras.values())
 need(other_intervals[0][0]==24692 and other_intervals[-1][1]==29556 and
      all(a[1]==b[0] for a,b in zip(other_intervals,other_intervals[1:])),
      "BANG other descriptor section no longer contiguous")
 # SUCK: three code-linked source lists and a separate four-pointer
 # single-descriptor table; never call the latter a fourth animation.
 suck=[];sframes=[]
 for label,root,count,token,back in SUCK_SPECS:
  one=sequence(exe,fx,data["SUCK.GRA"],14,root,count,token,back)
  one["trackName"]=label;suck.append(one);sframes.extend(one["orderedEntries"])
 need(len(sframes)==18 and len(set(f["descriptorObject2"] for f in sframes))==18,
      "SUCK source list sprite identities changed")
 ivals=sorted((f["sourceStart"],f["sourceEndExclusive"]) for f in sframes)
 need(ivals[0][0]==117872 and ivals[-1][1]==122000 and
      all(a[1]==b[0] for a,b in zip(ivals,ivals[1:])),
      "SUCK linked source range no longer contiguous")
 one_desc=[]
 for i in range(4):
  at=0x1bf58+i*4;d=u32(exe,O2+at)
  common.ptr(exe,fx,2,at,2,d)
  need(d==[0x217c0,0x217d0,0x217f4,0x217f4][i] and
       d in {f["descriptorObject2"] for f in sframes[10:]},
       "SUCK one-descriptor table differs from source single-sprite lookup")
  one_desc.append({"sourceSiteObject2":at,"descriptorObject2":d})
 return {
  "schema":"mk2_spelunk_005_bang_suck_source_lists_v1",
  "classification":"VERIFIED_STATIC_SOURCE_AND_CONSUMER_LINKS",
  "sourceEXESha256":EXE_SHA,
  "sourceResourceSha256":{k:v["sha256"] for k,v in RES.items()},
  "leFixupRecords":27004,"leUniqueSites":26994,
  "control":control,
  "BANG":{"resourceBytes":29556,"resourceFullyPartitionedByDistinctDescriptors":True,
          "selectorTableObject2":BANG_BASE,
          "selectorListCount":11,"sourceOrderedListEntries":95,
          "distinctListSprites":93,"otherDistinctSourceDescriptors":8,
          "allDistinctSpriteStreams":101,
          "mainEncodedSpan":[0,24692],"otherEncodedSpan":[24692,29556],
          "sourceListFamilies":bang,"pairedDescriptorCoordinateBlocks":placed,
          "otherDistinctSourceSprites":[{"descriptorObject2":d,
                                         "sourceSpan":[f["sourceStart"],f["sourceEndExclusive"]],
                                         "sourceSha256":f["sourceSha256"]}
                                        for d,f in sorted(extras.items())],
          "fullResourceSha256":sha(data["BANG.GRA"])},
  "SUCK":{"resourceBytes":122000,"resourceFullyPartitioned":False,
          "linkedEncodedSpan":[117872,122000],"linkedSpanSha256":sha(data["SUCK.GRA"][117872:]),
          "sourceListCount":3,"orderedEntries":18,
          "distinctListSprites":18,"sourceListFamilies":suck,
          "separateSingleDescriptorLookup":one_desc},
  "runtime":{"originalGameExecuted":False,"actualSelectionObserved":False,
             "presentedFramesKnown":False,"paletteHandleOrDACObserved":False,
             "timingOrFPSObserved":False,"screenPlacementObserved":False},
  "qualification":[
      "BANG has source byte-complete descriptor coverage, not proven execution of every listed animation/paired record.",
      "The 11 BANG lists have 95 references to 93 sprites: two repeated descriptor references in the sixth list are deliberate source data.",
      "The first BANG pointer/signed-XY stream stops at the sixth record's X=0 before drawing that descriptor; the later nine typed descriptor references are not a uniform record stride and have no identified direct code consumer.",
      "SUCK three source lists are not equivalent: two five-entry zero-terminated and one eight-entry loop; separate four-pointer lookup is not a fourth ordered animation.",
      "Global cursor or source call arguments are not actual display frame duration.",
      "Resource IDs 12 and 14 identify original files, not active VGA DAC palette banks."
   ]}
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument("--game-zip",type=Path,required=True)
 p.add_argument("--out",type=Path,required=True)
 args=p.parse_args()
 need(not args.out.exists(),"refusing to overwrite source evidence")
 result=audit(original(args.game_zip))
 with args.out.open("x",encoding="utf-8") as output:
  json.dump(result,output,indent=2);output.write("\n")
 print(json.dumps({"status":result["classification"],
                   "bangLists":result["BANG"]["selectorListCount"],
                   "bangUnique":result["BANG"]["allDistinctSpriteStreams"],
                   "suckLists":result["SUCK"]["sourceListCount"],
                   "suckUnique":result["SUCK"]["distinctListSprites"]}))
if __name__=="__main__":main()

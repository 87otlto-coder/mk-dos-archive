#!/usr/bin/env python3
"""Spelunk 004: MK2 SOUL and FIRESKEL source-ordered effect-list provenance.

Reads only an owner-supplied original DOS mk2.zip. Validates unmodified EXE and
GRA hashes, original LE relocations, stage-independent effect-list references,
bounded 8-bit indexed RLE/opacity and explicit control code. Output contains
only hashes, offsets and metadata. This is NOT a runtime palette/timing trace.
"""
from __future__ import annotations
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
from collections import Counter

EXE_HASH="fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65"
RESOURCES={
 "SOUL.GRA": {"sha256":"39483001099bad825de6e6f219020ef12e9f1f97a4fbbe1449312d6572479376","id":16,"bytes":47612},
 "FIRESKEL.GRA":{"sha256":"a530b1840d4bc7adf6303cc0388262e51dfd21b5801ed1dc9523c3339ea19b8e","id":7,"bytes":57128}
}
O1,O2,LE=0x61c54,0xa0c54,0x28f0c
TRACKS=[
 ("soul_loop", "SOUL.GRA",0x1dd28,3,1,0x1dd28,0,0x3fc8),
 ("soul_finite","SOUL.GRA",0x1dd3c,14,0,None,0x3fc8,0xb9fc),
 ("fire_branch_negative","FIRESKEL.GRA",0x1d938,6,1,0x1d938,0xd354,0xdba4),
 ("fire_branch_nonnegative","FIRESKEL.GRA",0x1d958,6,1,0x1d958,0xdba4,0xde34)
]

def require(ok,why):
 if not ok:raise ValueError("SPELUNK004: "+why)
def sha(b):return hashlib.sha256(b).hexdigest()
def u32(b,p):return struct.unpack_from("<I",b,p)[0]
def u16(b,p):return struct.unpack_from("<H",b,p)[0]

def read_original_zip(p):
 with zipfile.ZipFile(p) as z:
  names={}
  required={"MK2.EXE",*RESOURCES}
  for info in z.infolist():
   if info.is_dir():continue
   name=info.filename.replace("\\","/").split("/")[-1].upper()
   if name in required:
    require(name not in names,"duplicate original ZIP member "+name)
    names[name]=info.filename
  require(set(names)==required,"missing exact MK2/SOUL/FIRESKEL files")
  data={key:z.read(value) for key,value in names.items()}
 return data

def validate_inputs(data):
 exe=data["MK2.EXE"]
 require(len(exe)==861133 and sha(exe)==EXE_HASH,"MK2.EXE identity mismatch")
 for name,record in RESOURCES.items():
  require(len(data[name])==record["bytes"] and sha(data[name])==record["sha256"],
          name+" identity mismatch")
 pool=[p.decode("ascii") for p in exe[0xa0ef1:0xa13a7].split(b"\0") if p]
 for name,record in RESOURCES.items():
  require(pool[record["id"]]==name,"original resource ID registry mismatch for "+name)
 return exe

def fixups(b):
 require(b[LE:LE+2]==b"LE" and u32(b,LE+0x14)==113,"original LE page header")
 objtab=LE+u32(b,LE+0x40)
 require(u32(b,LE+0x44)==2,"LE object count")
 require([(u32(b,objtab+24*i+12),u32(b,objtab+24*i+16)) for i in range(2)]==
         [(1,63),(64,50)],"original LE page ownership")
 mapoff=LE+u32(b,LE+0x68);entrybase=LE+u32(b,LE+0x6c)
 found={};total=0
 for page in range(113):
  owner=1 if page<63 else 2;first=1 if owner==1 else 64
  p=entrybase+u32(b,mapoff+4*page);end=entrybase+u32(b,mapoff+4*(page+1))
  require(0<=p<=end<=len(b),"fixup block outside executable")
  while p<end:
   kind=b[p]&15;flags=b[p+1]
   relative=struct.unpack_from("<h",b,p+2)[0];p+=4
   require((flags&3)==0,"imported LE fixup not supported")
   destobj=u16(b,p) if flags&64 else b[p];p+=2 if flags&64 else 1
   target=None
   if kind!=2:
    target=u32(b,p) if flags&16 else u16(b,p)
    p+=4 if flags&16 else 2
   if flags&4:p+=4 if flags&32 else 2
   site=(page+1-first)*4096+relative
   key=(owner,site);rec=(kind,flags,destobj,target)
   require(key not in found or found[key]==rec,"conflicting duplicate relocation")
   found[key]=rec;total+=1
  require(p==end,"LE page fixup alignment")
 require((total,len(found))==(27004,26994),"LE fixup record census")
 return found

def ptr(b,fx,obj,offset,to_obj,target):
 require(fx.get((obj,offset))==(7,16,to_obj,target),
         "typed LE pointer mismatch %d:%x"%(obj,offset))
 physical=(O1 if obj==1 else O2)+offset
 require(u32(b,physical)==target,"raw relocated pointer differs %d:%x"%(obj,offset))

def exact(b,physical,hexvalue,label):
 target=bytes.fromhex(hexvalue)
 require(b[physical:physical+len(target)]==target,"original code differs "+label)

def relative_target(b,physical):
 require(b[physical] in (0xe8,0xe9),"expected near CALL or JMP")
 return physical+5+struct.unpack_from("<i",b,physical+1)[0]

def code_joins(exe,fx):
 # Soul's two phases share the canonical normal frame cursor; the first
 # calls the single-frame reader repeatedly and the second enters runner.
 for phys,target in ((0x94634,0x1dd28),(0x9468d,0x1dd3c)):
  exact(exe,phys,"c705785a0700","SOUL cursor writer")
  ptr(exe,fx,1,phys+2-O1,2,0x75a78)
  ptr(exe,fx,1,phys+6-O1,2,target)
 exact(exe,0x9463e,"c7057c5a070010000000","SOUL source repeat control")
 exact(exe,0x9464d,"b804000000","SOUL first raw scheduler count")
 exact(exe,0x94677,"ff0d7c5a070075c9","SOUL source repeat decrement")
 exact(exe,0x94697,"b804000000","SOUL second raw scheduler count")
 for site,target in ((0x94648,0x86cc5),(0x94652,0x6710f)):
  require(relative_target(exe,site)==target,"SOUL first-phase control call")
 require(relative_target(exe,0x946a6)==0x86c99,"SOUL second-phase runner")
 # FIRE: a source TEST/J(S) selects one list into a task field. Later code
 # transfers that task field into animation cursor and uses shared advance.
 exact(exe,0x94088,"bb38d90100","FIRESKEL default loop source")
 exact(exe,0x9408d,"a1c45a0700a9ffffffff7805","FIRESKEL signed branch")
 exact(exe,0x94099,"bb58d90100","FIRESKEL nonnegative loop source")
 exact(exe,0x9409e,"895e5c","FIRESKEL task list choice field")
 ptr(exe,fx,1,0x94089-O1,2,0x1d938)
 ptr(exe,fx,1,0x9409a-O1,2,0x1d958)
 exact(exe,0x9410c,"528b565c8915785a0700","FIRESKEL task-to-cursor transfer")
 ptr(exe,fx,1,0x94112-O1,2,0x75a78)
 exact(exe,0x941a0,"528b565c89156c5a07005a50a16c5a0700528b1089156c5a0700",
       "FIRESKEL first descriptor seed through selected list")
 require(relative_target(exe,0x941bc)==0x64548,"FIRESKEL initial sprite constructor")
 require(relative_target(exe,0x94138)==0x916f3,"FIRESKEL call path to advance runner")
 require(relative_target(exe,0x91704)==0x6435a,"FIRESKEL shared frame-advance helper")
 return {
  "soul":{"phase1List":0x1dd28,"phase2List":0x1dd3c,
          "phase1CursorWriterPhysical":0x94634,
          "phase1FrameReaderPhysical":0x86cc5,
          "phase2CursorWriterPhysical":0x9468d,
          "phase2SequenceRunnerPhysical":0x86c99,
          "sourceFirstRepeatCounterLiteral":16,
          "sourceSchedulerYieldLiterals":[4,4]},
  "fireskel":{"signSourceGlobalObject2":0x75ac4,
              "negativeSelectsListObject2":0x1d938,
              "nonnegativeSelectsListObject2":0x1d958,
              "taskSelectedListFieldOffset":0x5c,
              "conditionalChoicePhysical":0x94097,
              "storeTaskSelectedListPhysical":0x9409e,
              "taskListToCursorPhysical":0x9410c,
              "firstDescriptorSeedPhysical":0x941a0,
              "frameAdvanceHelperPhysical":0x6435a}
 }

def decode_rle(resource,start,width,height):
 require(0<width and 0<height and width*height<=64000,"sprite dimensions unsafe")
 require(0<=start<len(resource),"sprite start outside GRA")
 pos=start;ix=bytearray(width*height);mask=bytearray(width*height)
 counts=Counter()
 for row in range(height):
  x=0
  while x<width:
   require(pos+4<=len(resource),"truncated sprite run")
   command=u32(resource,pos);pos+=4
   if command&1:
    n=command>>1;kind="transparent"
   elif command&2:
    n=command>>10;v=(command>>2)&255;kind="repeat"
    require(0<n<=width-x,"repeat crosses row")
    i=row*width+x;ix[i:i+n]=bytes([v])*n;mask[i:i+n]=b"\x01"*n
   else:
    n=command>>2;kind="literal"
    require(0<n<=64 and n<=width-x and pos+n<=len(resource),
            "literal crosses row/file")
    i=row*width+x;ix[i:i+n]=resource[pos:pos+n];mask[i:i+n]=b"\x01"*n
    pos+=(n+3)&~3
   require(0<n<=width-x,"zero or overlong source run")
   x+=n;counts[kind]+=1
 return {"streamEndExclusive":pos,"sourceStreamSha256":sha(resource[start:pos]),
         "indexedPlaneSha256":sha(ix),"opacityMaskSha256":sha(mask),
         "opaqueCount":mask.count(1),"sourceCommands":dict(sorted(counts.items()))}

def track(exe,fx,resource,info):
 label,name,list_offset,n,token,back,expected_first,expected_last=info
 frames=[]
 for ordinal in range(n):
  source=list_offset+4*ordinal
  desc=u32(exe,O2+source)
  ptr(exe,fx,2,source,2,desc)
  require(0<=desc<0x32000 and O2+desc+12<=len(exe),
          "sprite descriptor outside backed Object2")
  w,h,x,y,packed=struct.unpack_from("<HHhhI",exe,O2+desc)
  rid,off=packed>>24,packed&0xffffff
  require(rid==RESOURCES[name]["id"],"wrong original sprite resource ID")
  planes=decode_rle(resource,off,w,h)
  frames.append({"ordinal":ordinal,"entryObject2":source,
                 "descriptorObject2":desc,"sourceResourceId":rid,
                 "width":w,"height":h,
                 "signedDescriptorLocalX":x,"signedDescriptorLocalY":y,
                 "streamStart":off,**planes})
 end_site=list_offset+4*n
 require(u32(exe,O2+end_site)==token and (2,end_site) not in fx,
         "unexpected original list terminal token")
 if back is not None:
  ptr(exe,fx,2,end_site+4,2,back)
 else:
  require(token==0,"zero-terminated list expected")
 require(frames[0]["streamStart"]==expected_first and
         frames[-1]["streamEndExclusive"]==expected_last,
         "original encoded stream span changed")
 require(all(frames[i]["streamEndExclusive"]==frames[i+1]["streamStart"]
             for i in range(n-1)),
         "list source streams not consecutive")
 require(len({f["descriptorObject2"] for f in frames})==n,
         "duplicate source sprite descriptor in list")
 return {"track":label,"sourceResource":name,
         "listObject2":list_offset,"entryCount":n,
         "uniqueDescriptorCount":n,"sourceLoopToken":token,
         "sourceBackPointerObject2":back,
         "originalGRAEncodedSpan":[expected_first,expected_last],
         "encodedSpanSha256":sha(resource[expected_first:expected_last]),
         "sourceOrderedFrames":frames,
         "runtimePlaybackObserved":False}

def audit(data,*,strict_identity=True):
 if strict_identity:exe=validate_inputs(data)
 else:exe=data["MK2.EXE"]
 fx=fixups(exe)
 mechanisms=code_joins(exe,fx)
 tracks=[track(exe,fx,data[t[1]],t) for t in TRACKS]
 assert len(tracks)==4
 soul=tracks[:2];fire=tracks[2:]
 require(soul[0]["originalGRAEncodedSpan"][0]==0 and
         soul[0]["originalGRAEncodedSpan"][1]==soul[1]["originalGRAEncodedSpan"][0] and
         soul[1]["originalGRAEncodedSpan"][1]==len(data["SOUL.GRA"]),
         "SOUL original source bytes not fully covered by frame lists")
 require(fire[0]["originalGRAEncodedSpan"][1]==fire[1]["originalGRAEncodedSpan"][0],
         "FIRESKEL selected frame lists not adjacent")
 require(sum(x["entryCount"] for x in tracks)==29,"frame entry census")
 return {
  "schema":"mk2_spelunk_004_source_effect_lists_v1",
  "classification":"VERIFIED_STATIC_SOURCE_ORDER_AND_CONDITIONAL_CONTROL",
  "originalExeSha256":EXE_HASH,"originalResourceSha256":{k:r["sha256"] for k,r in RESOURCES.items()},
  "LEFixupCount":27004,"uniqueLEFixupSites":26994,
  "newSourceOrderedEntries":29,"newDistinctSourceSprites":29,"trackCount":4,
  "SOUL":{"sourceByteCoverage":len(data["SOUL.GRA"]),"resourceLength":len(data["SOUL.GRA"]),
          "completeNativeIndexedResourcePartition":True,
          "sourceControl":mechanisms["soul"]},
  "FIRESKEL":{"sourceSelectedSpan":[fire[0]["originalGRAEncodedSpan"][0],fire[1]["originalGRAEncodedSpan"][1]],
              "resourceLength":len(data["FIRESKEL.GRA"]),
              "completeResourcePartition":False,"sourceControl":mechanisms["fireskel"]},
  "tracks":tracks,
  "runtimeVerification":{"originalGameExecuted":False,"paletteHandleOrDAC":False,
      "livePlaybackOrPresentation":False,"durationOrFPS":False,"objectWorldPosition":False},
  "provenanceNote":"Original source-control association, NOT proof of native on-screen activation; O69 may already have decoded these graphic records individually."
 }

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument("--game-zip",type=Path,required=True)
 p.add_argument("--out",type=Path,required=True)
 args=p.parse_args()
 require(not args.out.exists(),"refuse existing report; never overwrite")
 result=audit(read_original_zip(args.game_zip))
 with args.out.open("x",encoding="utf-8") as file:
  json.dump(result,file,indent=2);file.write("\n")
 print(json.dumps({"classification":result["classification"],"tracks":4,
                   "sourceEntries":29,"soulFullyPartitioned":True}))
if __name__=="__main__":main()

#!/usr/bin/env python3
"""Independent O135 verifier: re-read EXE and audit user report with separate opcode rules.

Does not import the producer; rejects invented timeline or sprite bindings.
"""
import argparse,hashlib,json,struct
from pathlib import Path
EX='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OBJ1=0x61c54

def check(p,reason):
 if not p:raise AssertionError('O135 independent: '+reason)
def i32(b,p):return struct.unpack_from('<i',b,p)[0]
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def jmp(b,p):return p+5+i32(b,p+1)

def audit(b:bytes,r:dict):
 n=0
 def c(x,what):
  nonlocal n
  check(x,what);n+=1
 c(hashlib.sha256(b).hexdigest()==EX,'wrong canonical EXE')
 c(r['schema']=='mk2_o135_stage_coroutine_static_control_v1','schema')
 c(r['canonicalExeSHA256']==EX,'reported executable hash')
 c(r['status']=='PASS_STATIC_COROUTINE_AND_BOUNDED_POSITION_UPDATE','status')
 s=r['scheduler']
 for k,v in {'registrationPhysical':0x67222,'registrationNewCounter':1,'registeredCallbackStorageOffset':28,
  'yieldPhysical':0x6710f,'savedCountFieldOffset':6,'resumeCounterDecrementPhysical':0x67158,
  'resumeContinuationJumpPhysical':0x67185,'countsAreNotSecondsOrProvenRenderFrames':True}.items(): c(s[k]==v,'scheduler '+k)
 c(b[0x67242:0x67248]==bytes([0x66,0xc7,0x40,0x06,0x01,0x00]),'registration first counter')
 c(b[0x67248:0x6724b]==b'\x89\x50\x1c','registered continuation storage')
 c(b[0x6710f:0x67117].hex()=='5a6689460689561c','yield saves counter and callback')
 c(b[0x67158:0x6715e].hex()=='66ff4e067ff4','scheduler decrement')
 c(b[0x67182:0x67188].hex()=='8b7e18ff661c','resume jump')
 functions={'tomb':{0x82d33:0x82d98,0x82d9a:0x82e21},'portal':{0x8280c:0x8289c,0x828ff:0x8291f,0x8291f:0x829bc}}
 for stage,mapping in functions.items():
  records=r['stages'][stage]['functions']
  c(len(records)==len(mapping),'function count '+stage)
  c({rec['functionPhysical'] for rec in records}==set(mapping),'function ids '+stage)
  for rec in records:
   st=rec['functionPhysical'];end=mapping[st]
   c(rec['examinedEndExclusive']==end,'function boundary')
   c(rec['sourceObject1']==st-OBJ1,'object-local function pointer')
   c(rec['examinedBytesSHA256']==hashlib.sha256(b[st:end]).hexdigest(),'function code fingerprint')
   c(rec['sourceCodeOnly'] is True,'runtime overclaim')
 t=r['stages']['tomb']
 c(t['sixCountYieldSites']==[0x82d65,0x82dc7],'Tomb yield addresses')
 for at in t['sixCountYieldSites']:
  c(b[at:at+5]==b'\xb8\x06\x00\x00\x00','Tomb count=6')
  c(b[at+5]==0xe8 and jmp(b,at+5)==0x6710f,'Tomb invokes scheduler')
 for row,at,val in zip(t['sourcePointerAssignments'],[0x82d51,0x82db3],[0x17814,0x177ec]):
  c(row=={'physical':at,'targetObject2':val},'Tomb state pointer')
  c(b[at:at+6]==b'\xc7\x05\x78\x5a\x07\x00' and u32(b,at+6)==val,'Tomb raw pointer')
 c(t['comparisonThresholds']==[48,108] and b[0x82d87:0x82d8b]==bytes.fromhex('83f8307c') and
    b[0x82de3:0x82de7]==bytes.fromhex('83fb6c7c'),'Tomb source compares')
 c(t['postLoopYieldCount']==96 and t['postLoopYieldPhysical']==0x82e0b,'Tomb yield after loop')
 c(b[0x82e06:0x82e0b]==b'\xb8\x60\x00\x00\x00' and jmp(b,0x82e0b)==0x6710f,'Tomb post-loop source')
 p=r['stages']['portal'];v=p['boundedUpdate']
 for name,val in {'functionPhysical':0x8280c,'accumulatorGlobalObject1':0x75a7c-OBJ1,
  'objectFieldWritten':20,'initial':12288,'delta':768,'positiveThreshold':24576,'negativeThreshold':-24576,
  'positiveYieldPhysical':0x8283f,'negativeYieldPhysical':0x8286f,
  'valuesAreCodeArithmeticNotObservedTimeline':True}.items():c(v[name]==val,'Portal bounded '+name)
 c(b[0x82830:0x8283a].hex()=='c7057c5a070000300000','initial counter')
 c(b[0x82849:0x82853].hex()=='81057c5a070000030000','counter increase')
 c(b[0x82879:0x82883].hex()=='812d7c5a070000030000','counter decrease')
 c(b[0x82853:0x8285e].hex()=='528b157c5a07008957145a','destination field up')
 c(b[0x82883:0x8288e].hex()=='528b157c5a07008957145a','destination field down')
 c(b[0x8285e:0x82868].hex()=='813d7c5a070000600000','positive compare')
 c(b[0x8288e:0x82898].hex()=='813d7c5a070000a0ffff','negative compare')
 for at in (0x8283a,0x8286a):c(b[at:at+5]==b'\xb8\x01\x00\x00\x00' and jmp(b,at+5)==0x6710f,'count 1 yield')
 # Independently expand the encoded immediate arithmetic, no imported producer.
 init=u32(b,0x82836);step=u32(b,0x8284f);top=u32(b,0x82864);
 bottom=i32(b,0x82894)
 values=[];x=init
 while x<top:
  x+=step;values.append(x)
  c(len(values)<100,'increasing loop bounded')
 c(values==v['sourceAscendingValues'],'ascending code arithmetic')
 low=[]
 while x>bottom:
  x-=step;low.append(x)
  c(len(low)<100,'decreasing loop bounded')
 c(low==v['sourceDescendingValues'],'descending code arithmetic')
 c(len(values)==16 and len(low)==64,'conditional step count')
 c(p['alternateRoutineCounterInitial']==2 and p['counterGlobalObject1']==0x75a80-OBJ1,'secondary source countdown')
 c(b[0x8298a:0x82994]==bytes.fromhex('c705805a070002000000'),'secondary count store')
 c(b[0x829b2:0x829b8]==bytes.fromhex('ff0d805a0700'),'secondary count decrement')
 for row,at,val in zip(p['otherSourcePointers'],[0x828ff,0x8291f,0x82994],[0x164d8,0x16674,0x164f8]):
  c(row=={'physical':at,'targetObject2':val},'Portal data pointer')
  c(u32(b,at+6)==val,'original Portal pointer bytes')
 c(p['nestedObjectStateFields']==[0x54,0x58,0x5c],'Portal extra object fields')
 for k,x in {'coroutinesStaticallyIdentified':True,'liveStageCallbackInvocationVerified':False,
  'specificSpriteBindingRecovered':False,'animationFrameSequenceRecovered':False,
  'animationFrameTimingRecovered':False,'parallaxRelativeToCameraRecovered':False,
  'originalGraphicsUncropped':True}.items():c(r['limitations'][k] is x,'claim '+k)
 return {'status':'PASS_INDEPENDENT','assertions':n,'functionCount':5,
         'portalSourceStepCounts':[len(values),len(low)],'canonicalExeSHA256':EX}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True,type=Path);p.add_argument('--report',required=True,type=Path);p.add_argument('--out',type=Path);a=p.parse_args()
 result=audit(a.exe.read_bytes(),json.loads(a.report.read_text()))
 if a.out:
  check(not a.out.exists(),'no overwrite');a.out.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result))

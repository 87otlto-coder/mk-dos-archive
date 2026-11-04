#!/usr/bin/env python3
"""O125 independent audit: second LE relocation parser, stage roots and code/data checks.

Does not import O125 producer. Refuses inflated runtime-ownership statements.
"""
from __future__ import annotations
import hashlib,json,struct,sys
from pathlib import Path
from verify_o120_independent import parse_fixups

BASES={'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
TOMB={0x17358,0x1736a,0x1737c,0x1738e,0x173a0,0x173b2}
PORTAL={0x16514,0x16526}
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OBJ1=0x61c54; OBJ2=0xa0c54

def sha(b):return hashlib.sha256(b).hexdigest()
def check(x,msg):
 if not x:raise ValueError('O125 independent: '+msg)
def u32(b,at):return struct.unpack_from('<I',b,at)[0]
def audit(exe,raw):
 check(len(exe)==861133 and sha(exe)==SHA,'canonical original')
 typed,n=parse_fixups(exe);check(n==27004,'full LE relocation census')
 report=json.loads(raw)
 check(set(report)=={'schema','status','exeSHA256','typedFixupEntries','dispatchInstructionBytes','controlState','tables','changingIndicesByMode','stagingLoop','limits'},'report keys')
 check(report['schema']=='mk2_o125_stage_config_dispatch_static_v1' and report['status']=='PASS_STATIC_LE_STAGE_DISPATCH','schema/status')
 check(report['exeSHA256']==SHA and report['typedFixupEntries']==len(typed),'image ownership')
 check(report['controlState']=={'selectionIndexGlobalObject2':0x75a80,'modeGlobalObject2':0x3014c,'mode2Table':'mode_equals_2','mode1Table':'mode_equals_1','fallbackTable':'mode_other','runtimeModeValueObserved':False,'runtimeStageIndexObserved':False},'selector limitations')
 # independently verify opcode boundaries and relocation targets.
 instr=report['dispatchInstructionBytes'];check(len(instr)==25,'instruction count')
 for addr,text in instr.items():
  p=int(addr,16)
  check(exe[p:p+len(text)//2].hex()==text,'machine code at '+addr)
 for p,dest in ((0x82330,0x15bec),(0x8233e,0x15c68),(0x8234c,0x15ce4),
                (0x98bac,0x15bec),(0x98bba,0x15c68),(0x98bc8,0x15ce4),(0x81bb7,0x15b68)):
  check(typed.get((1,p-OBJ1))==(7,16,2,dest),'code LE relocation '+hex(p))
 check(exe[0x82334:0x8233b].hex()=='833d4c01030002' and exe[0x82342:0x82349].hex()=='833d4c01030001','mode dispatch compare')
 check(exe[0x98bb0:0x98bb7].hex()=='833d4c01030002' and exe[0x98bbe:0x98bc5].hex()=='833d4c01030001','second call dispatch compare')
 check(exe[0x81c53:0x81c55]==b'\x8b\x30','ESI setup dereference')
 table_roots={};assertions=0
 for mode,base in BASES.items():
  t=report['tables'][mode]
  check(t['object2Base']==base and len(t['entries'])==31 and t['nonnull']==28,'31/28 table shape')
  vals=[]
  for i,entry in enumerate(t['entries']):
   off=base+i*4;ptr=u32(exe,OBJ2+off)
   check(entry['index']==i and entry['pointerFieldObject2']==off,'stage pointer offset')
   if i in (10,11,21):
    check(ptr==0 and (2,off) not in typed and entry=={'index':i,'pointerFieldObject2':off,'rootObject2':None},'null stage index')
   else:
    check(typed.get((2,off))==(7,16,2,ptr) and entry['rootObject2']==ptr,'stage LE target')
   vals.append(ptr)
   assertions+=2
   if i not in (1,7):continue
   label,allset,end_by_start= ('Kombat Tomb',TOMB,{0x171f0:0x1726c,0x1726c:0x172dc}) if i==1 else ('The Portal',PORTAL,{0x16378:0x163d0,0x163d0:0x1641c})
   check(entry['stageResourceLabel']==label and ptr in end_by_start,'known rooted scene family')
   e=entry['rootEvidence'];end=end_by_start[ptr]
   check(e['rootObject2']==ptr and e['rootRegionLength']==end-ptr and e['rootSHA256']==sha(exe[OBJ2+ptr:OBJ2+end]),'root span fingerprint')
   m=[]
   for add in (0x14,0x18,0x1c):
    v=u32(exe,OBJ2+ptr+add)
    check(typed.get((2,ptr+add))==(7,16,2,v),'root header typed')
    m.append({'fieldOffset':add,'targetObject2':v})
   check(m[2]['targetObject2']==0x77453 and m==e['pointersAt14_18_1C'],'shared scene slot')
   links=[]
   for o in range(ptr+0x20,end,4):
    v=typed.get((2,o));target=v and v[3]
    if v and v[:3]==(7,16,2) and target in allset:
     check(u32(exe,OBJ2+o)==target,'source setup pointer')
     links.append({'rootFieldOffset':o-ptr,'setupObject2':target})
   check(links and links==e['setupLinks'] and sorted({l['setupObject2'] for l in links})==e['distinctSetups'],'root bounded certified setups')
   assertions+=len(links)+4
  table_roots[mode]=vals
 changes=[i for i in range(31) if len({table_roots[m][i] for m in BASES})>1]
 check(changes==[0,1,2,3,4,5,6,7] and changes==report['changingIndicesByMode'],'mode-dependent indices')
 check(report['stagingLoop']['loopPhysical']==0x81bb3 and report['stagingLoop']['slotSentinelPhysical']==0x81b56 and report['stagingLoop']['slotArrayObject2']==0x77453,'dispatch staging-site identity')
 check(len(report['stagingLoop']['entries'])==8,'staging eight entries')
 for i,e in enumerate(report['stagingLoop']['entries']):
  offset=0x15b68+16*i
  fields=[]
  for j in (0,4,8,12):
   value=u32(exe,OBJ2+offset+j)
   check(typed.get((2,offset+j))==(7,16,2,value),'staging typed LE pointer')
   fields.append(value)
  check(fields[-1]==0x77453+4*i and e=={'ordinal':i,'object2Offset':offset,'fields':fields},'staging slot mapping')
  assertions+=5
 check(isinstance(report['limits'],list) and len(report['limits'])==4,'explicit uncertainty list')
 check(not any('confirmed live' in s.lower() or 'measured handle' in s.lower() for s in report['limits']),'unsupported proof')
 return {'status':'PASS_O125_INDEPENDENT','fixupCensus':n,'conditionalTables':3,'tableEntries':93,
         'nonNullEntries':84,'stageFamilyBoundRoots':6,'stagingSlots':8,
         'machineCodeSites':len(instr),'verifiedAssertions':assertions,'reportSHA256':sha(raw)}

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: verify_o125_dispatch_independent.py MK2.EXE O125_REPORT.json')
 print(json.dumps(audit(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes()),indent=2))

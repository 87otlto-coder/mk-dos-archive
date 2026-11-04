#!/usr/bin/env python3
"""O127 independent, byte- and LE-relocation-backed stage-index graph verifier.

Does not import O127 producer. Parses typed relocations using an independent
LE parser already used by the preceding checkpoint verifiers.
"""
from __future__ import annotations
import hashlib,json,struct,sys
from pathlib import Path
from verify_o120_independent import parse_fixups
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OBJ1=0x61c54; OBJ2=0xa0c54
SITES=[0x74d4d,0x758cc,0x771e6,0x77a08,0x77d8b,0x84d32,0x84eee,0x85fae,0x94965]
LITERALS={0x771e6:(0x771dc,7),0x77a08:(0x779fe,6),0x77d8b:(0x77d81,5),0x84eee:(0x84ee4,30),0x85fae:(0x85fa4,13)}
MODES={'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
def check(x,m):
 if not x: raise ValueError('O127 independently: '+m)
def get32(b,p):return struct.unpack_from('<I',b,p)[0]
def digest(b):return hashlib.sha256(b).hexdigest()
def verify(exe:bytes,raw:bytes):
 check(len(exe)==861133 and digest(exe)==EXE,'source canonical identity')
 r=json.loads(raw)
 check(set(r)=={'schema','status','sourceExeSHA256','typedFixupEntries','rootDispatcherPhysical',
 'rootTableLength','directCallerCount','directCallers','snapshot','renderer','otherSelector','limitations'},'exact report top-level fields')
 check(r['schema']=='mk2_o127_stage_index_caller_and_renderer_graph_static_v1' and r['status']=='PASS_STATIC_INDEX_CALLERS_AND_RENDER_ADJUSTMENT','report qualification')
 check(r['sourceExeSHA256']==EXE and r['rootDispatcherPhysical']==0x82321 and r['rootTableLength']==31,'report source/index boundaries')
 typed,total=parse_fixups(exe);check(total==27004 and len(typed)==r['typedFixupEntries'],'independent relocation census')
 checks=0
 def relocated(at,dest):
  nonlocal checks
  check(typed.get((1,at-OBJ1))==(7,16,2,dest),'typed code operand '+hex(at));checks+=1
 def exact(at,hx):
  nonlocal checks
  check(exe[at:at+len(hx)//2].hex()==hx,'physical code bytes '+hex(at));checks+=1
 actual=[]
 for p in range(OBJ1,OBJ2-4):
  if exe[p]==0xe8 and p+5+struct.unpack_from('<i',exe,p+1)[0]==0x82321:actual.append(p)
 check(actual==SITES and len(r['directCallers'])==9 and r['directCallerCount']==9,'exact dispatcher caller set')
 roots={}
 for mode,offset in MODES.items():
  vals=[]
  for i in range(31):
   v=get32(exe,OBJ2+offset+4*i)
   if v: check(typed.get((2,offset+4*i))==(7,16,2,v),'typed 31-slot table')
   else:check((2,offset+4*i) not in typed,'untyped null slot')
   vals.append(v);checks+=1
  check([i for i,x in enumerate(vals) if x==0]==[10,11,21],'root null indices')
  roots[mode]=vals
 origin={
  0x74d4d:'dynamic_stage_state_or_conditional_override',0x758cc:'earlier_2_with_intervening_calls',
  0x771e6:'adjacent_literal_7',0x77a08:'adjacent_literal_6',0x77d8b:'adjacent_literal_5',
  0x84d32:'unresolved_scratch_after_calls',0x84eee:'saved_scratch_literal_30_restored',
  0x85fae:'adjacent_literal_13',0x94965:'unresolved_scratch_after_calls'}
 for got,p in zip(r['directCallers'],SITES):
  check(get32(exe,p+1)==((0x82321-p-5)&0xffffffff) and exe[p]==0xe8,'real direct call encoding')
  expected={'callPhysical':p,'sourceClassification':origin[p],'directCallConfirmed':True,'runtimeIndexObserved':False}
  if p in LITERALS:
   at,n=LITERALS[p]
   exact(at,'c705805a0700'+struct.pack('<I',n).hex())
   check(at+10==p,'literal immediately before call')
   relocated(at+2,0x75a80)
   expected.update(immediatePreCallValue=n,immediateWritePhysical=at,
                   configurationRootByMode={mode:rs[n] for mode,rs in roots.items()})
  if p==0x84eee:expected['priorScratchRestoredPhysical']=0x84ef3
  if p==0x758cc:expected.update(earlierCandidateTwoPhysical=0x7589d,interveningCalls=[0x758c2,0x758c7])
  if p==0x74d4d:expected.update(possibleSourceFields=[0x76512,0x2cff6],overrideDecrements=1)
  check(got==expected,'caller identity and provenance '+hex(p));checks+=5
 exact(0x82321,'a1805a0700a37f740700')
 exact(0x8232c,'c1e002')
 exact(0x82353,'8b00a3805a0700')
 exact(0x9e118,'f705d4620500010000007473')
 exact(0x9e13a,'81e6ffff0000')
 exact(0x9e165,'a17f74070003348554ef0200')
 exact(0x98ba6,'5852c1e002')
 exact(0x98bcf,'8b00')
 exact(0x98b7d,'50')
 exact(0x98afb,'b814000000')
 exact(0x74cf4,'8b15126507008915805a0700')
 exact(0x74d2c,'8b15f6cf02008915805a0700')
 exact(0x74d39,'ff0d805a0700')
 exact(0x7589d,'c705805a070002000000')
 exact(0x758c2,'e807e20100')
 exact(0x758c7,'e8b9edfeff')
 exact(0x84ede,'ff35805a0700')
 exact(0x84ef3,'8f05805a0700')
 exact(0x9493c,'8915805a0700')
 for at, dest in [(0x82322,0x75a80),(0x82327,0x7747f),(0x82356,0x75a80),
                  (0x9e166,0x7747f),(0x9e16d,0x2ef54),(0x7589f,0x75a80),
                  (0x84ee0,0x75a80),(0x84ee6,0x75a80),(0x84ef5,0x75a80)]:relocated(at,dest)
 saved=sorted(OBJ1+off for (obj,off),v in typed.items() if obj==1 and v[2]==2 and v[3]==0x7747f)
 adjustmentrefs=sorted(OBJ1+off for (obj,off),v in typed.items() if obj==1 and v[2]==2 and v[3]==0x2ef54)
 check(saved==[0x82327,0x9e166] and adjustmentrefs==[0x9e16d],'typed consumer/reference census')
 check(r['snapshot']=={'scratchObject2':0x75a80,'saveIndexPhysical':0x82326,
       'saveIndexObject2':0x7747f,'overwriteScratchWithRootPhysical':0x82355,
       'directRelocatedSitesForSavedIndex':saved},'index snapshot report')
 vals=[get32(exe,OBJ2+0x2ef54+4*j) for j in range(31)]
 x=r['renderer']
 check(x=={'gatePhysical':0x9e118,'savedIndexLoadPhysical':0x9e165,
          'indexTableAddPhysical':0x9e16a,'indexTableObject2':0x2ef54,
          'indexTableLengthAudited':31,'renderTableDWORDs':vals,
          'renderTableSHA256':digest(exe[OBJ2+0x2ef54:OBJ2+0x2ef54+124]),
          'renderTableDirectRelocatedSites':adjustmentrefs,
          'directTableIndexGuardPresentBetweenLoadAndAdd':False,
          'runtimeRendererValuesObserved':False},'exact indexed-renderer data')
 check(r['otherSelector']=={'entryPhysical':0x98ba7,'eaxScalePhysical':0x98ba8,
          'priorPopEAXPhysical':0x98ba6,'earlierPushEAXPhysical':0x98b7d,
          'oneUpstreamCandidateImmediate20Physical':0x98afb,'runtimeValueProven':False,
          'ownIndexGuardPresent':False},'separate dispatcher does not establish runtime index')
 check(len(r['limitations'])==7 and 'No live index' in r['limitations'][-1], 'uncertainty retained')
 return {'status':'PASS_O127_INDEPENDENT','assertions':checks,'typedRelocationRecords':total,
         'directCallers':len(actual),'indexedAdjustments':len(vals),'dataSHA256':digest(raw)}

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: verify_o127_index_consumers_independent.py MK2.EXE report.json')
 print(json.dumps(verify(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes()),indent=2))

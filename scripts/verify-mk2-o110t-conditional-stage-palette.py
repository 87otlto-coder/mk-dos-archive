#!/usr/bin/env python3
"""Independent O110T check against canonical EXE and deterministic trace outcomes."""
import hashlib,json,struct,sys
from pathlib import Path
H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED={
 'A_then_B_draw':('DRAW_PATH_ENABLED','B',49,True),
 'B_then_A_draw':('DRAW_PATH_ENABLED','A',65,True),
 'only_A_draw':('DRAW_PATH_ENABLED',None,None,False),
 'A_B_gate_0':('SKIPPED_GATE_0',None,None,True),
 'A_B_release_B':('DRAW_PATH_ENABLED',None,None,False),
 'A_B_reuse_B':('DRAW_PATH_ENABLED','B',49,True),
 'A_B_unmodeled':('UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN')}
# independently stated event traces; arbitrary edited/missing events fail closed
TRACES={
 'A_then_B_draw':[['RESET'],['REQUEST','A'],['REQUEST','B'],['ENABLE_RENDER'],['DRAW_STAGE']],
 'B_then_A_draw':[['RESET'],['REQUEST','B'],['REQUEST','A'],['ENABLE_RENDER'],['DRAW_STAGE']],
 'only_A_draw':[['RESET'],['REQUEST','A'],['ENABLE_RENDER'],['DRAW_STAGE']],
 'A_B_gate_0':[['RESET'],['REQUEST','A'],['REQUEST','B'],['DRAW_STAGE']],
 'A_B_release_B':[['RESET'],['REQUEST','A'],['REQUEST','B'],['RELEASE',1],['ENABLE_RENDER'],['DRAW_STAGE']],
 'A_B_reuse_B':[['RESET'],['REQUEST','A'],['REQUEST','B'],['REQUEST','B'],['ENABLE_RENDER'],['DRAW_STAGE']],
 'A_B_unmodeled':[['RESET'],['REQUEST','A'],['REQUEST','B'],['UNMODELED_EVENT'],['ENABLE_RENDER'],['DRAW_STAGE']]}

def verify(b,r):
 n=0
 def ck(condition,message):
  nonlocal n
  if not condition:raise AssertionError(message)
  n+=1
 ck(hashlib.sha256(b).hexdigest()==H,'EXE image')
 ck(r['format']=='mk2_o110t_conditional_palette_handle_one_replay_v1','format')
 ck(r['sourceExeSHA256']==H,'sha')
 ck(r['status']=='SYNTHETIC_CODE_CONSTRAINED_MODEL_NOT_RUNTIME_TRACE','status')
 records=r['originalSourceRecords'];ck(set(records)=={'A','B'},'record keys')
 for key,(offset,num) in {'A':(0x26cc4,48),'B':(0x2ab28,64)}.items():
  p=0x61c54+offset
  ck(records[key]=={'record':key,'object1Offset':offset,'physical':p,'n':num,
          'recordSHA256':hashlib.sha256(b[p:p+2+2*num]).hexdigest()},'record '+key)
  ck(struct.unpack_from('<H',b,p)[0]==num,'source length '+key)
 for k,hx in r['sourceAnchors'].items():
  off=int(k,16)
  ck(b[off:off+len(hx)//2].hex()==hx,'source '+k)
 ck(len(r['cases'])==7,'case population')
 for c in r['cases']:
  name=c['name'];ck(name in EXPECTED,'scenario id '+name)
  ck(c['events']==TRACES[name],'trace audit '+name)
  o=c['hypotheticalOutput'];status,identity,bank,active=EXPECTED[name]
  ck(o['renderStatus']==status and o['paletteRecord']==identity and o['bankBase']==bank,'conditional outcome '+name)
  ck(o['handleOneSlotActive']==active,'active flag '+name)
  ck(o['step']==len(TRACES[name])-1 and o['rendererPaletteHandle']==1,'draw order '+name)
  ck(o['runtimeObservation'] is False,'simulation-only '+name)
  ck(o['renderGate']==(0 if name=='A_B_gate_0' else 1),'gate '+name)
 # Rules aren't claims about live gameplay.
 for field in ('liveGameOrderProven','unmodeledDynamicCallsCovered','stagePaletteOwnerProven','stageColorImageProven'):
  ck(r['conclusion'][field] is False,'unproven '+field)
 for field in ('sameTwoPaletteRecordsCanYieldDifferentSlotOneIdentityDependingOnOrder',
              'allocatorRequestsMayClearGate','rendererNeedsGateLowBitEnabled'):
  ck(r['conclusion'][field] is True,'supported '+field)
 ck(len(r['limits'])==3 and r['limits'][0].startswith('Cases are invented'),'limitations')
 return {'status':'PASS','checks':n,'hypotheticalCases':7,'observedMK2StageColors':False}
if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage <original-mk2-dir> <O110T-json>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();r=json.loads(Path(sys.argv[2]).read_bytes())
 print(json.dumps(verify(b,r)))

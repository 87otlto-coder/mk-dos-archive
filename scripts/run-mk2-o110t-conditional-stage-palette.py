#!/usr/bin/env python3
"""O110T: bound a stage-handle-1 question to exact hypothetical allocation traces.

Every trace in this report is explicitly SYNTHETIC, not a real recorded DOSBox trace.
The static source cannot establish which trace the real game takes.
"""
import hashlib,json,struct,sys
from pathlib import Path
H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
CODE_BASE=0x61c54

def identity(b,key):
 offset={'A':0x26cc4,'B':0x2ab28}[key];at=CODE_BASE+offset;n=struct.unpack_from('<H',b,at)[0]
 assert n=={'A':48,'B':64}[key]
 return {'record':key,'object1Offset':offset,'physical':at,'n':n,
          'recordSHA256':hashlib.sha256(b[at:at+2+n*2]).hexdigest()}

def run(events,refs):
 slots=[{'key':None,'references':0,'bank':0,'size':0} for _ in range(60)]
 gate=None;pending=False;unknown=False;observations=[]
 for t,item in enumerate(events):
  op=item[0]
  if op=='RESET':
   slots=[{'key':None,'references':0,'bank':0,'size':0} for _ in range(60)];pending=False
   # 0x7B41F clears the 60 slot table; does NOT source-prove enablement.
  elif op=='REQUEST':
   key=item[1]
   if key not in refs:unknown=True;continue
   exists=next((i for i,s in enumerate(slots) if s['key']==key),None)
   if exists is not None:
    slots[exists]['references']+=1;continue
   bank=1;free=None
   for i,s in enumerate(slots):
    if s['references']==0:free=i;break
    bank=s['bank']+s['size']
   if free is None or bank+refs[key]['n']>256:unknown=True;continue
   slots[free]={'key':key,'references':1,'bank':bank,'size':refs[key]['n']};pending=True;gate=0
   for j in range(free+1,60):
    nxt=slots[j]
    if not nxt['references']:continue
    bank+=refs[key]['n']
    if nxt['bank']>=bank:break
    nxt['bank']=bank
  elif op=='RELEASE':
   idx=item[1]
   if idx<0 or idx>=60 or slots[idx]['references']==0:unknown=True;continue
   slots[idx]['references']-=1
   if not slots[idx]['references']:slots[idx]['key']=None
  elif op=='ENABLE_RENDER':gate=1
  elif op=='DISABLE_RENDER':gate=0
  elif op=='DRAIN':pending=False
  elif op=='UNMODELED_EVENT':unknown=True
  elif op=='DRAW_STAGE':
   slot=slots[1]
   observations.append({'step':t,'rendererPaletteHandle':1,'renderGate':gate,
      'renderStatus':'UNKNOWN' if unknown or gate is None else 'SKIPPED_GATE_0' if not gate else 'DRAW_PATH_ENABLED',
      'paletteRecord':'UNKNOWN' if unknown or gate is None else slot['key'] if gate==1 and slot['references'] else None,
      'bankBase':'UNKNOWN' if unknown or gate is None else slot['bank'] if gate==1 and slot['references'] else None,
      'handleOneSlotActive':bool(slot['references']) if not unknown else 'UNKNOWN',
      'runtimeObservation':False})
  else:raise ValueError('unrecognized operation: '+str(op))
 return observations

EXPERIMENTS={
 'A_then_B_draw':[['RESET'],['REQUEST','A'],['REQUEST','B'],['ENABLE_RENDER'],['DRAW_STAGE']],
 'B_then_A_draw':[['RESET'],['REQUEST','B'],['REQUEST','A'],['ENABLE_RENDER'],['DRAW_STAGE']],
 'only_A_draw':[['RESET'],['REQUEST','A'],['ENABLE_RENDER'],['DRAW_STAGE']],
 'A_B_gate_0':[['RESET'],['REQUEST','A'],['REQUEST','B'],['DRAW_STAGE']],
 'A_B_release_B':[['RESET'],['REQUEST','A'],['REQUEST','B'],['RELEASE',1],['ENABLE_RENDER'],['DRAW_STAGE']],
 'A_B_reuse_B':[['RESET'],['REQUEST','A'],['REQUEST','B'],['REQUEST','B'],['ENABLE_RENDER'],['DRAW_STAGE']],
 'A_B_unmodeled':[['RESET'],['REQUEST','A'],['REQUEST','B'],['UNMODELED_EVENT'],['ENABLE_RENDER'],['DRAW_STAGE']],
}

def main():
 if len(sys.argv)!=3:raise SystemExit('usage <canonical-original-mk2-dir> <outdir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
 assert hashlib.sha256(b).hexdigest()==H
 # The three operations modeled above must be grounded in actual instruction bytes.
 anchors={0x7b427:'bf005b0700b97800000033c0f3ab',0x7b43c:'33db3904dd005b0700',
  0x7b4a3:'e828feffff',0x7b4b1:'8814dd065b0700',0x7b4d7:'8814dd065b0700',
  0x7b4f9:'66ff04dd045b0700',0x7b52a:'c704c5005b070000000000',
  0x9e118:'f705d462050001000000',0x9e18b:'b801000000'}
 for at,hx in anchors.items():assert b[at:at+len(hx)//2].hex()==hx
 refs={key:identity(b,key) for key in ('A','B')}
 cases=[]
 for name,trace in EXPERIMENTS.items():
  actual=run(trace,refs)
  assert len(actual)==1
  cases.append({'name':name,'events':trace,'hypotheticalOutput':actual[0]})
 assert [c['hypotheticalOutput']['paletteRecord'] for c in cases]==['B','A',None,None,None,'B','UNKNOWN']
 assert [c['hypotheticalOutput']['bankBase'] for c in cases]==[49,65,None,None,None,49,'UNKNOWN']
 report={'format':'mk2_o110t_conditional_palette_handle_one_replay_v1',
   'status':'SYNTHETIC_CODE_CONSTRAINED_MODEL_NOT_RUNTIME_TRACE',
   'sourceExeSHA256':H,'sourceAnchors':{hex(k):v for k,v in anchors.items()},
   'originalSourceRecords':refs,'operations':[ 'RESET','REQUEST','RELEASE','ENABLE_RENDER','DISABLE_RENDER','DRAIN','UNMODELED_EVENT','DRAW_STAGE'],
   'cases':cases,
   'conclusion':{'sameTwoPaletteRecordsCanYieldDifferentSlotOneIdentityDependingOnOrder':True,
       'allocatorRequestsMayClearGate':True,'rendererNeedsGateLowBitEnabled':True,
       'liveGameOrderProven':False,'unmodeledDynamicCallsCovered':False,
       'stagePaletteOwnerProven':False,'stageColorImageProven':False},
   'limits':['Cases are invented, explicit operation sequences, not recorded gameplay.',
       'Requests made through other dynamic records and indirect pointer aliasing are not replayed.',
       'No observed queue-drain ordering, frame state, palette-zero setting or stage source index.']}
 dst=out/'MK2_O110T.json';dst.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','pass':'O110T','conditionalExamples':len(cases),
   'contrastingSlotOneOwners':['A','B'],'runtimeOwnership':'UNKNOWN','out':str(dst)}))
if __name__=='__main__':main()

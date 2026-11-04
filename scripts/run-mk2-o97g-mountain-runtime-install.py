#!/usr/bin/env python3
"""O97G: symbolic *conditional* execution of authentic scene configuration installer."""
import hashlib,json,struct,sys
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage producer fixture_dir O97F_report output')
fx=Path(sys.argv[1]); prior=Path(sys.argv[2]); out=Path(sys.argv[3]);exe=(fx/'mk2.exe').read_bytes()
h=lambda b:hashlib.sha256(b).hexdigest();u=lambda at:struct.unpack_from('<I',exe,at)[0];o=lambda x:x+0xa0c54
assert h(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
a=json.loads(prior.read_bytes());assert a['status']=='PASS' and a['configuration']['offset']==0x1c2e6
le=0x28f0c;ix=le+u(le+0x68);rec=le+u(le+0x6c);n=0;typed={}
for page in range(u(le+0x14)):
 x=rec+u(ix+page*4);end=rec+u(ix+(page+1)*4)
 while x<end:
  kind=exe[x]&15;fl=exe[x+1];delta=struct.unpack_from('<h',exe,x+2)[0];x+=4
  if fl&64:obj=struct.unpack_from('<H',exe,x)[0];x+=2
  else:obj=exe[x];x+=1
  target=None
  if kind!=2:
   if fl&16:target=u(x);x+=4
   else:target=struct.unpack_from('<H',exe,x)[0];x+=2
  if fl&4:x+=4 if fl&32 else 2
  typed[0x61c54+page*4096+delta]=(kind,fl,obj,target);n+=1
 assert x==end
assert n==27004

def pointer(loc,object_id,value):
 assert u(o(loc))==value and typed.get(o(loc))==(7,16,object_id,value)
for loc,obj,value in [(0x1c2f6,1,0x21227),(0x1c2fa,2,0x172dc),(0x1c2fe,2,0x15d60),(0x1c302,2,0x77453),(0x1c306,2,0x1c31e),(0x1c312,2,0x1c330)]:pointer(loc,obj,value)
# Check exact instruction family handling first, one, normal pointer, and terminal -1.
code={
 'indirect_pre_callback':(0x81f41,'8b1883c00450ffd358'),
 'two_control_globals':(0x81f4a,'8b1883c004891d225d07008b1883c004891df65c0700'),
 'runtime_slot_loop_load':(0x81f60,'8b1883c004528b108915645a07005a'),
 'one_sentinel_branch':(0x81f6f,'833d645a0700017512'),
 'one_sentinel_store':(0x81f78,'528b15645a070089135a83c30483c004ebdb'),
 'terminal_minus1_check':(0x81f8a,'833d645a0700ff7413'),
 'normal_assignment':(0x81f9c,'890383c30483c008ebbf'),
 'return_sentinel':(0x81fa6,'5fc3'),
 'producer_selected_pointer':(0x81bd9,'8b0083f80174e0'),
 'producer_installer_indirect':(0x81c53,'8b308b5804891d645a0700')
}
for name,(pos,hexbytes) in code.items():assert exe[pos:pos+len(hexbytes)//2].hex()==hexbytes,name
# Interpret only the bounded values of this single file-backed config record, assuming callback returned.
where=0x1c302;target=u(o(where));where+=4;assignments=[]
for i in range(8):
 token=u(o(where))
 if token==0xffffffff:
  term={'offset':where,'value':token};break
 if token==1:
  assignments.append({'runtimeSlot':target,'storedValue':1,'sourceConfigOffset':where,'kind':'sentinel1'})
  target+=4;where+=4
 elif token==0xfffffffe:raise AssertionError('unexpected -2 branch; not currently qualified')
 else:
  pointer(where,2,token)
  assignments.append({'runtimeSlot':target,'storedValue':where,'sourceConfigOffset':where,'kind':'pointer_to_pointer_of_setup'})
  target+=4;where+=8
else:raise AssertionError('no termination within bounded record')
assert [(x['runtimeSlot'],x['storedValue']) for x in assignments]==[(0x77453,0x1c306),(0x77457,1),(0x7745b,0x1c312)]
assert term=={'offset':0x1c31a,'value':0xffffffff}
assert u(o(assignments[0]['storedValue']))==0x1c31e and u(o(assignments[2]['storedValue']))==0x1c330
# The control-cursor global is written in the SAME machine-coded installer before slot loop.
report={'format':'mk2_o97g_mountain_conditional_runtime_slot_installer_v1','status':'PASS','fixtureSha256':h(exe),'parentO97fSha256':h(prior.read_bytes()),'relocationCount':n,
'configurationOffset':0x1c2e6,'installerRoutine':0x81eb2,'slotLoop':0x81f65,'precondition':'The previously verified index-13 config is passed and call at 0x81F47 returns, with no intervening mutation of the file-backed record or required globals.',
'indirectCallback':{'pointerSource':0x1c2f6,'object':1,'target':0x21227,'callPhysical':0x81f47,'returnUnobserved':True},
'installedGlobals':[{'destination':0x75d22,'valueSource':0x1c2fa,'selectedValue':0x172dc},{'destination':0x75cf6,'valueSource':0x1c2fe,'selectedValue':0x15d60}],
'listSlotStartSource':0x1c302,'listSlotStartValue':0x77453,'assignments':assignments,'terminal':term,
'resolvedSetups':[{'slot':0x77453,'indirectPointer':0x1c306,'setupOffset':0x1c31e,'count':39},{'slot':0x7745b,'indirectPointer':0x1c312,'setupOffset':0x1c330,'count':10}],
'machine':[{ 'name':key,'physical':pos,'hex':hexbytes} for key,(pos,hexbytes) in code.items()],
'hypotheses':{'installerConditionallyWritesBothSetupPointers':'SUPPORTED','installerConditionallySetsPositiveCursor':'SUPPORTED','sceneActivationObserved':'UNPROVEN','gameDrawsBothSetupsSimultaneously':'UNPROVEN','jumpOrFatalityMeaning':'UNPROVEN','finalScreenCameraOrRgb':'UNPROVEN'},
'boundaries':'Same-machine-path paired installation is statically qualified, but execution is conditional on caller, callback and future scheduling; does not prove runtime draw or frame coactivation.'}
out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'pass':'O97G','status':'PASS','assignments':assignments,'cursor':hex(0x15d60),'relocations':n}))

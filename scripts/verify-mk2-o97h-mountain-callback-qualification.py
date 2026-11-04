#!/usr/bin/env python3
"""Independent raw binary, LE relocation and callback opcode verifier for O97H."""
import hashlib,json,struct,sys
from pathlib import Path
if len(sys.argv)!=3:raise SystemExit('usage verifier.py fixture_dir source_root')
fixture,root=Path(sys.argv[1]),Path(sys.argv[2]);b=(fixture/'mk2.exe').read_bytes();report=json.loads((root/'mk2_mountain_preinstaller_bare_ret_o97h_2026-10-09.json').read_bytes());parent=(root/'mk2_mountain_runtime_setup_install_o97g_2026-10-09.json').read_bytes()
h=lambda x:hashlib.sha256(x).hexdigest();r=lambda a:struct.unpack_from('<I',b,a)[0];s=lambda a:struct.unpack_from('<h',b,a)[0];checks=0
def ck(v,where):
 global checks
 checks+=1
 if not v:raise AssertionError('O97H rejected: '+where)
ck(h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','authentic fixture')
ck(h(b)==report['fixtureSha256'] and report['parentO97gSha256']==h(parent),'parent hash')
ck(report['status']=='PASS' and report['format']=='mk2_o97h_mountain_preinstaller_callback_bare_return_v1','report contract')
le=0x26654+r(0x26654+0x3c);idx=le+r(le+0x68);recs=le+r(le+0x6c);base=0x26654+r(le+0x80);pages=r(le+0x14)
ck((le,base,pages)==(0x28f0c,0x61c54,113),'LE topology')
locations={};count=0
for page in range(pages):
 x=recs+r(idx+page*4);end=recs+r(idx+(page+1)*4)
 while x<end:
  tp=b[x]&15;f=b[x+1];delta=s(x+2);x+=4
  if f&64:ob=struct.unpack_from('<H',b,x)[0];x+=2
  else:ob=b[x];x+=1
  t=None
  if tp!=2:
   t=r(x) if f&16 else struct.unpack_from('<H',b,x)[0];x+=4 if f&16 else 2
  if f&4:x+=4 if f&32 else 2
  ck(x<=end,'reloc bounds');locations[base+page*4096+delta]=(tp,f,ob,t);count+=1
 ck(x==end,'page bounds')
ck(count==27004,'fixup count')
physical=0xa0c54+0x1c2f6
ck(locations.get(physical)==(7,16,1,0x21227),'relocated source must target Obj1')
ck(r(physical)==0x21227,'encoded callback offset')
cb=base+0x21227
ck(cb==0x82e7b and b[cb]==0xc3,'exact one-instruction ret')
ck(report['callback']=={'fileBackedObject':1,'pointerSourceObject2':0x1c2f6,'pointerSourcePhysical':physical,'targetObject1Offset':0x21227,'codeObject1BasePhysical':base,'callbackEntryPhysical':cb,'firstOpcode':0xc3,'opcodeMeaning':'RET near','codeBytes':'c3','pointerLoad':0x81f41,'callAt':0x81f47,'postCallRestore':0x81f49},'report callback')
ck(b[0x81f41:0x81f4a]==bytes.fromhex('8b1883c00450ffd358'),'load/advance, save eax, indirect call, restore')
for w in report['machineWitnesses']:
 ck(b[w['at']:w['at']+len(w['hex'])//2].hex()==w['hex'],'code witness')
for k,expected in [('callbackMutatesStateBeforeReturn','REJECTED'),('callbackReturnsImmediatelyWhenReached','SUPPORTED'),('precedingResourceCallsAlwaysReturn','UNPROVEN'),('index13ConfigurationExecutesInGameplay','UNPROVEN'),('runtimeDrawOfBothSetups','UNPROVEN'),('jumpFatalityMeaning','UNPROVEN')]:ck(report['hypotheses'][k]==expected,k)
print(json.dumps({'status':'PASS','pass':'O97H','independent_checks':checks,'failures':0,'LE_relocations':count,'callbackPhysical':'0x82e7b','opcode':'C3'}))

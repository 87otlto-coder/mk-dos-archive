#!/usr/bin/env python3
"""Independent O95S verifier: re-parses original executable and tests fixed route words,
selector flow, LE internal relocations, stream termination, and O69 endpoint records."""
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)!=5:raise SystemExit('Usage: python scripts/verify-mk2-o95s-reassigned-identity-streams.py <MK2.EXE> <o69.json> <o95s.json> <repo-dir>')
exe=Path(sys.argv[1]).read_bytes();o69bytes=Path(sys.argv[2]).read_bytes();o69=json.loads(o69bytes);out=json.loads(Path(sys.argv[3]).read_bytes());repo=Path(sys.argv[4]);checks=0
def ck(label,condition):
 global checks
 checks+=1
 if not condition:raise AssertionError(label)
def sha(b):return hashlib.sha256(b).hexdigest()
U=lambda o:struct.unpack_from('<I',exe,o)[0];H=lambda o:struct.unpack_from('<H',exe,o)[0];SH=lambda o:struct.unpack_from('<h',exe,o)[0];I=lambda o:struct.unpack_from('<i',exe,o)[0]
ck('canonical original executable',sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('consumer output format',out['format']=='mk2_animation_reassigned_identity_stream_witnesses_o95s_v1' and out['status']=='SUCCESS')
ck('source identity',out['source']['fixtureExeSha256']==sha(exe) and out['source']['o69Sha256']==sha(o69bytes))
for n,f in [('o95bSha256','mk2_animation_root_structural_graph_o95b_2026-10-07.json'),('o95qSha256','mk2_animation_root_entry_provenance_o95q_2026-10-08.json'),('o95rSha256','mk2_animation_adjacent_index_extent_o95r_2026-10-08.json')]:
 ck('source report '+n,sha((repo/f).read_bytes())==out['source'][n])
# Fresh independent fixup parser. Reconstruct LE page mapping and address translation.
LE=0x28f0c;DATA=0x61c54;ps=U(LE+0x28);modpages=U(LE+0x14);objtab=LE+U(LE+0x40);maptab=LE+U(LE+0x48);pt=LE+U(LE+0x68);fixrec=LE+U(LE+0x6c)
ck('LE geometry',ps==4096 and U(LE+0x44)==2)
objs=[(i+1,U(objtab+24*i+12),U(objtab+24*i+16)) for i in range(2)]
pageidx=[(exe[maptab+4*i]<<16)|(exe[maptab+4*i+1]<<8)|exe[maptab+4*i+2] for i in range(modpages)]
def pgphys(p):return DATA+(pageidx[p-1]-1)*ps
def phys(obj,offset):
 o,start,length=objs[obj-1];p=offset//ps
 ck('LE page in range',p<length)
 return pgphys(start+p)+offset%ps
ends=[U(pt+4*i) for i in range(modpages+1)];fix={};nf=0
for p in range(modpages):
 owner=next(o for o in objs if o[1]<=p+1<o[1]+o[2]);a=fixrec+ends[p];end=fixrec+ends[p+1]
 while a<end:
  b=exe[a];f=exe[a+1];off=SH(a+2);a+=4
  ck('fixup internal',not(b&0x20) and (f&3)==0)
  size=2 if f&0x40 else 1;targetObj=H(a) if size==2 else exe[a];a+=size
  target=0
  if b&15!=2:
   target=U(a) if f&0x10 else H(a);a+=4 if f&0x10 else 2
  if f&4:a+=4 if f&0x20 else 2
  fix[(owner[0],(p+1-owner[1])*ps+off)]=(b&15,targetObj,target);nf+=1
 ck('relocation page end',a==end)
ck('27,004 relocation records',nf==27004 and out['fixupRecordsReparsed']==nf)
def exactfix(o,off,target,type=7):
 ck(f'fixup {o}:{off:x}',fix.get((o,off))==(type,2,target))
# Family A table slot 12 -> root 0x12e74 by authenticated original relocation.
exactfix(2,0x1d544+12*4,0x12e74)
ck('Family A lookup reads original object identity',exe[0x918f1:0x918f4]==bytes.fromhex('8b4746'))
ck('Family A lookup reads identity root',exe[0x918f4:0x918fb]==bytes.fromhex('8b148544d50100'))
ck('Family A lookup stores selected pointer',exe[0x918fb:0x91909]==bytes.fromhex('a1785a07008b0482a3785a0700c3'))
ck('standard wrapper bypasses selector',exe[0x86825:0x8682d]==bytes.fromhex('528d6dfc8945005a'))
ck('wrapper calls standard interpreter',exe[0x8682d]==0xe8 and 0x86832+I(0x8682e)==0x63e79)
# Use only the exact O69 qualified resource (no nearby descriptor/visual inference).
o69files={r['resourceName']:r for r in o69['qualifiedResources']}
ck('GO.GRA exact-full qualified', 'GO.GRA' in o69files)
sprites={s['descriptorPhysical']:s for s in o69files['GO.GRA']['streams']}
# Independently fixed code and data expectations, not copied from O95S report.
expected=[
 dict(id='O95S_A_SLOT12_INDEX3_REASSIGN6',begin=0x95140,write=0x95145,idx=0x95148,call=0x95152,new=0x95157,rew=0x9515c,param=0x9515f,cont=0x95167,jmp=0x9516e,end=0x95173,index=3,stream=0x1313c,hash='112b2903b5c0c151da6a6de7d92d28a8afd3b3237dc9ad2bdd739c91a5f97232',arrays=[0x13158,0x13160,0x13168],descs=[0x2a730,0x2a73c,0x2a748],gra=[279840,285344,291928]),
 dict(id='O95S_A_SLOT12_INDEX13_REASSIGN6',begin=0x951af,write=0x951b4,idx=0x951b7,call=0x951c1,new=0x951c6,rew=0x951cb,param=0x951ce,cont=0x951d6,jmp=0x951dd,end=0x951e2,index=13,stream=0x1307c,hash='b444e51f8cd504f967b6a149bdc581f35c1bfef22b3e113d2b4bd1f723b3c324',arrays=[0x13098,0x130a0,0x130a8,0x130b0],descs=[0x2a6a0,0x2a6ac,0x2a6b8,0x2a6c4],gra=[190904,198720,206276,213940])]
ck('two route count',len(out['qualifiedRoutes'])==2)
for exp,r in zip(expected,out['qualifiedRoutes']):
 name=exp['id'];ck(name+' id',r['id']==name)
 ck(name+' canonical bounded route SHA',sha(exe[exp['begin']:exp['end']])==exp['hash']==r['callerSliceSha256'])
 ck(name+' original identity literal',exe[exp['begin']]==0xb8 and U(exp['begin']+1)==12 and exe[exp['write']:exp['write']+3]==bytes.fromhex('894746'))
 ck(name+' literal index store',exe[exp['idx']:exp['idx']+6]==bytes.fromhex('c705785a0700') and U(exp['idx']+6)==exp['index'])
 ck(name+' lookup target',exe[exp['call']]==0xe8 and exp['call']+5+I(exp['call']+1)==0x918f1)
 ck(name+' object identity rewritten afterward',exe[exp['new']]==0xb8 and U(exp['new']+1)==6 and exe[exp['rew']:exp['rew']+3]==bytes.fromhex('894746'))
 ck(name+' wrapper argument not new identity selection',exe[exp['param']]==0xb8 and U(exp['param']+1)==3)
 ck(name+' continuation store',exe[exp['cont']:exp['cont']+3]==bytes.fromhex('c74500'))
 ck(name+' tail wrapper',exe[exp['jmp']]==0xe9 and exp['jmp']+5+I(exp['jmp']+1)==0x86825)
 ck(name+' no cursor rebind after lookup',bytes.fromhex('a3785a0700') not in exe[exp['call']+5:exp['jmp']] and bytes.fromhex('c705785a0700') not in exe[exp['call']+5:exp['jmp']])
 exactfix(2,0x12e74+4*exp['index'],exp['stream'])
 ck(name+' selected identity is original 12',r['selectorIdentityAtLookup']==12 and r['identityAfterLookupBeforeConsumer']==6 and r['originalSelectedPointerPreserved'] is True and r['nestedIndex']==exp['index'])
 ck(name+' exact selected stream',r['streamObject2Offset']==exp['stream'] and r['rootObject2Offset']==0x12e74)
 ck(name+' bounded consumer',r['consumer']=='STANDARD_COMPOSITION_WRAPPER_0x86825' and r['terminal']=='TOKEN_0')
 ck(name+' frame cardinality',len(r['frames'])==len(exp['arrays']))
 for i,(array,desc,gra) in enumerate(zip(exp['arrays'],exp['descs'],exp['gra'])):
  f=r['frames'][i]
  exactfix(2,exp['stream']+4*i,array)
  exactfix(2,array,desc)
  ck(name+f' array terminator {i}',(2,array+4) not in fix and U(phys(2,array+4))==0)
  p=phys(2,desc);w,h,x,y,packed=struct.unpack_from('<HHhhI',exe,p)
  ck(name+f' resource reference {i}',packed>>24==46 and packed&0xffffff==gra)
  ck(name+f' O69 present {i}',p in sprites)
  s=sprites[p]
  ck(name+f' O69 descriptor semantics {i}',(w,h,x,y,gra)==(s['width'],s['height'],s['x'],s['y'],s['graOffset']))
  ck(name+f' report descriptors {i}',f['descriptorPhysical']==p and f['descriptorObject2Offset']==desc and f['compositionObject2Offset']==array)
  ck(name+f' report pixel fields {i}',(f['width'],f['height'],f['x'],f['y'],f['graOffset'])==(w,h,x,y,gra) and f['resource']=='GO.GRA' and f['resourceTier']=='EXACT_FULL')
 ck(name+' unambiguous stream termination',(2,exp['stream']+len(exp['arrays'])*4) not in fix and U(phys(2,exp['stream']+len(exp['arrays'])*4))==0)
ck('conservative witness accounting',out['counts']=={'fixedIdentityWitnessesBefore':5,'newFixedIdentityWitnesses':2,'fixedIdentityWitnessesAfter':7,'newDescriptorSteps':7,'priorStrongQualifiedLookupCalls':239,'priorTerminalQualifiedLookupCalls':210,'priorHeldLookupCalls':14})
ck('no closure promotion',out['decision']['mk2ResearchClosed'] is False)
for k in ('doesNotAssertRuntimeGameObservation','doesNotAssignIdentity6ToOriginalSelection','doesNotAssignHumanMoveName','doesNotEstablishFPSorDwell','doesNotGeneralizeStandardGrammarToAllRoots','otherClosureBlockersRemainOpen'):
 ck(k,out['boundary'][k] is True)
print(json.dumps({'status':'PASS','independentChecks':checks,'failures':0,'reparsedFixupRecords':nf,'newFixedIdentityStreamWitnesses':2,'newGODescriptorSteps':7,'boundedFixedIdentityWitnessesNow':7},indent=2))

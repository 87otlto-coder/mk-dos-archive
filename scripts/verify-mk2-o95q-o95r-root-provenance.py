#!/usr/bin/env python3
"""Independent executable-backed verification of O95Q and O95R reports.
No producer import. Only O95B/P inputs are accepted as historical proof identities.
"""
import sys, json, struct, hashlib
from pathlib import Path
if len(sys.argv)!=5:
 raise SystemExit('Usage: python verify-mk2-o95q-o95r-root-provenance.py <mk2.exe> <O95B.json> <O95P.json> <repo-dir>')
exe=Path(sys.argv[1]).read_bytes(); braw=Path(sys.argv[2]).read_bytes(); praw=Path(sys.argv[3]).read_bytes();repo=Path(sys.argv[4]);
B=json.loads(braw); P=json.loads(praw)
Q=json.loads((repo/'mk2_animation_root_entry_provenance_o95q_2026-10-08.json').read_text())
R=json.loads((repo/'mk2_animation_adjacent_index_extent_o95r_2026-10-08.json').read_text())
sha=lambda bb:hashlib.sha256(bb).hexdigest()
U=lambda x:struct.unpack_from('<I',exe,x)[0]
H=lambda x:struct.unpack_from('<H',exe,x)[0]
I=lambda x:struct.unpack_from('<i',exe,x)[0]
checks=0
def ck(statement,ok):
 global checks
 checks+=1
 if not ok: raise AssertionError('CHECK '+str(checks)+' '+statement)
pin='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ck('exe identity',sha(exe)==pin)
ck('report states',Q['status']=='SUCCESS' and R['status']=='SUCCESS')
ck('report formats',Q['format']=='mk2_o95q_root_entry_provenance_v1' and R['format']=='mk2_o95r_adjacent_literal_index_extent_v1')
ck('B identity',Q['source']['o95b']==sha(braw) and R['source']['o95b']==sha(braw))
ck('P identity',Q['source']['o95p']==sha(praw))
ck('Q artifact identity',R['source']['o95qSha256']==sha((repo/'mk2_animation_root_entry_provenance_o95q_2026-10-08.json').read_bytes()))
ck('fixture identity',Q['source']['fixtureExeSha256']==pin and R['source']['fixtureExeSha256']==pin)
LE=0x28f0c;DATA=0x61c54;pages=U(LE+0x14);ps=U(LE+0x28);objtab=LE+U(LE+0x40);objcount=U(LE+0x44);mp=LE+U(LE+0x48);fpt=LE+U(LE+0x68);frt=LE+U(LE+0x6c)
obj=[(i+1,U(objtab+i*24+12),U(objtab+i*24+16)) for i in range(objcount)]
page_ids=[(exe[mp+i*4]<<16)|(exe[mp+i*4+1]<<8)|exe[mp+i*4+2] for i in range(pages)]
pgphys=lambda pg:DATA+(page_ids[pg-1]-1)*ps
def pphys(o,off):
 _,start,count=obj[o-1];return pgphys(start+off//ps)+off%ps if off//ps<count else None
po=[U(fpt+i*4) for i in range(pages+1)]
fix={}; collisions=0
for pg in range(pages):
 p=frt+po[pg];end=frt+po[pg+1]
 o=next(o for o in obj if o[1]<=pg+1<o[1]+o[2])
 while p<end:
  source=exe[p];flags=exe[p+1];src_type=source&0xf;p+=2
  off=struct.unpack_from('<h',exe,p)[0];p+=2
  ck('supported fixup '+hex(p),not source&0x20 and (flags&3)==0)
  target_obj=H(p) if flags&0x40 else exe[p];p+=2 if flags&0x40 else 1
  target_off=0
  if src_type!=2:
   target_off=U(p) if flags&0x10 else H(p);p+=4 if flags&0x10 else 2
  if flags&4:p+=4 if flags&0x20 else 2
  key=(o[0],(pg+1-o[1])*ps+off)
  if key in fix: collisions+=1
  fix[key]=(target_obj,target_off,src_type,pgphys(pg+1)+off)
 ck('page finished',p==end)
ck('known fixup source collisions',collisions==10)
root_expect={}
for fam in B['families']:
 label=fam['label'];root_expect[label]={}
 for row in fam['rootRows']:
  root=row['rootObject2Offset'];root_expect[label][root]=row
  for n in range(row['contiguousRelocatableEntryCount']):
   f=fix.get((2,root+n*4));ck('root-backed entry '+label+':'+hex(root)+':'+str(n),f is not None and f[0]==2 and f[2]==7)
  nxt=fix.get((2,root+row['contiguousRelocatableEntryCount']*4))
  ck('root exact run boundary',not(nxt and nxt[0]==2 and nxt[2]==7))
 for slot in fam['slotRoots']:
  actual=fix.get((2,fam['tableObject2Offset']+slot['slot']*4))
  ck('slot root relocation',actual is not None and actual[0]==2 and actual[1]==slot['rootObject2Offset'] and actual[2]==7)
qroots={(x['family'],x['rootObject2Offset']):x for x in Q['roots']}
ck('root row count',len(qroots)==26 and len(Q['roots'])==26)
for label,table in root_expect.items():
 for root,row in table.items():
  z=qroots.get((label,root));ck('root row persisted',bool(z) and z['aliases']==row['slots'] and z['entryCount']==row['contiguousRelocatableEntryCount'] and z['oneHopKnownDescriptorCount']==row['oneHopKnownDescriptorCount'])
entries=Q['entries'];ck('entry rows',len(entries)==925)
identity=set();n_known=0;known_locations=set()
for x in entries:
 key=(x['family'],x['rootObject2Offset'],x['entryIndex']);ck('unique entry key',key not in identity);identity.add(key)
 fam,root,idx=key;row=root_expect[fam][root]
 ck('within count',idx>=0 and idx<row['contiguousRelocatableEntryCount'])
 eo=root+idx*4;f=fix[(2,eo)];ck('source offset / physical',x['entryObject2Offset']==eo and x['entryPhysical']==f[3])
 ck('pointer provenance',x['targetObject2Offset']==f[1] and x['targetPhysical']==pphys(2,f[1]))
 second=fix.get((2,f[1])); ck('one-hop presence',x['secondHopFixupPresent']==bool(second))
 ck('one-hop target',x['secondHopTargetObject2Offset']==(second[1] if second else None))
 obs=next((z for z in row['oneHopKnownDescriptors'] if z['entryIndex']==idx),None)
 w=x['knownDescriptorWitness'];ck('qualified witness present iff original',bool(w)==bool(obs))
 if w:
  n_known+=1;known_locations.add(eo)
  ck('descriptor evidence',second is not None and second[0]==2 and second[2]==7 and second[1]==w['descriptorObject2Offset']==obs['descriptorObject2Offset'])
  ck('descriptor art provenance',w['resourceName']==obs['resourceName'] and w['graOffset']==obs['graOffset'])
 ck('selection flag matches fixed witness',x['authenticatedRuntimeSelection']==any(w['family']==fam and w['rootObject2Offset']==root and w['nestedIndex']==idx for w in Q['witnesses']))
 ck('no universal grammar promotion',x['universalStreamGrammarAssigned'] is False)
qcounts=Q['counts']
for label,calc in [('familyAEntries',670),('familyBEntries',255),('familyRootEntries',925),('distinctObject2EntryOffsets',len({x['entryObject2Offset'] for x in entries})),('distinctTargetObject2Offsets',len({x['targetObject2Offset'] for x in entries})),('oneHopKnownDescriptorInstances',n_known),('distinctKnownDescriptorEntryOffsets',len(known_locations)),('exactRuntimeFixedIdentityWitnesses',5)]:
 ck('Q summary '+label,qcounts[label]==calc)
ck('root report distinct locations',qcounts['distinctObject2EntryOffsets']==789 and qcounts['distinctKnownDescriptorEntryOffsets']==85)
ck('no unsupported closure',Q['decision']['mk2AnimationExportClosed'] is False and Q['decision']['all925EntriesExportable'] is False and Q['decision']['timingEstablished'] is False)
witness={x['id']:x for x in P['boundedFixedIdentityWitnesses']['witnesses']}
ck('witness identity set',len(Q['witnesses'])==5 and {x['id'] for x in Q['witnesses']}==set(witness))
for w in Q['witnesses']:
 old=witness[w['id']];f=next(x for x in B['families'] if x['label']==w['family'])
 slot=f['slotRoots'][w['identitySlot']];root=slot['rootObject2Offset'];entry=fix[(2,root+w['nestedIndex']*4)]
 ck('witness identity',all(w.get(k)==old.get(k) for k in ('family','identitySlot','nestedIndex','streamObject2OffsetHex','boundedOrderedRenderEntries','consumer','control')))
 ck('witness authentic join',w['rootObject2Offset']==root and w['entryObject2Offset']==root+w['nestedIndex']*4 and entry[1]==int(old['streamObject2OffsetHex'],16) and w['exactRootEntryTargetVerified'] is True)
# independent scan of all rel32 CALLs against the actual binary, including unlisted negatives
actual={'A':[],'B':[]}
for p in range(0,len(exe)-4):
 if exe[p]!=0xE8:continue
 dest=p+5+I(p+1)
 if dest==0x918f1:actual['A'].append(p)
 elif dest==0x91909:actual['B'].append(p)
ck('lookup family totals',len(actual['A'])==144 and len(actual['B'])==109)
obs=[];dynamic=[]
for family,cs in actual.items():
 fam=next(x for x in B['families'] if x['label']==family)
 lengths={r['rootObject2Offset']:r['contiguousRelocatableEntryCount'] for r in fam['rootRows']}
 for p in cs:
  kind=None;index=None
  if p>=10 and exe[p-10:p-4]==bytes.fromhex('C705785A0700'):
   kind='MOV_MEM_IMM32';index=U(p-4)
  elif p>=10 and exe[p-10]==0xB8 and exe[p-5:p]==bytes.fromhex('A3785A0700'):
   kind='MOV_EAX_IMM32_THEN_STORE';index=U(p-9)
  if kind is None:dynamic.append((family,p));continue
  compat=[v['slot'] for v in fam['slotRoots'] if index<lengths[v['rootObject2Offset']]]
  incompat=[v['slot'] for v in fam['slotRoots'] if index>=lengths[v['rootObject2Offset']]]
  obs.append((family,p,index,kind,compat,incompat))
ck('immediate vs dynamic counts',len(obs)==228 and len(dynamic)==25)
rset=R['literalCallsites'];ck('R row count',len(rset)==len(obs))
rlookup={(r['family'],r['lookupCallPhysical']):r for r in rset};ck('R distinct caller keys',len(rlookup)==len(obs))
for fam,p,i,k,ok,nok in obs:
 r=rlookup.get((fam,p));ck('literal caller present',r is not None)
 ck('literal exact index',r['index']==i and r['operandKind']==k and r['lookupCallPhysicalHex']==hex(p).upper().replace('X','x'))
 ck('bounded supported identities',r['compatibleSlotIdsUnderStaticExtentOnly']==ok and r['incompatibleSlotIdsUnderStaticExtentOnly']==nok and sorted(ok+nok)==list(range(17)))
 ck('no runtime join promoted',r['actualObjectIdentityAtCall']=='UNKNOWN' and r['selectedStreamObject2Offset']=='UNKNOWN' and r['runtimeReachabilityFromExtentAlone'] is False)
rd=R['nonAdjacentCallsites'];ck('nonadjacent set exact',{(x['family'],x['lookupCallPhysical']) for x in rd}==set(dynamic) and len(rd)==25)
ct=R['counts'];ck('counts exact',ct['totalAuthenticatedLookupCalls']==253 and ct['adjacentLiteralCallsites']==228 and ct['nonAdjacentOrDynamicCallsites']==25)
ck('family literal counts',ct['byFamily']=={'A':{'total':144,'literal':125},'B':{'total':109,'literal':103}})
ck('subset totals',ct['allSlotsWithinExtent']==sum(not no for *_,no in obs) and ct['someSlotsOutsideExtent']==sum(bool(ok) and bool(no) for _,_,_,_,ok,no in obs) and ct['noSlotsWithinExtent']==sum(not ok for _,_,_,_,ok,no in obs))
ck('geometry no new join',R['decision']['runtimeIdentityIndexJoinAdded']==0 and R['decision']['newBoundedFullStreamsAdded']==0 and R['decision']['mk2ResearchClosed'] is False)
print(json.dumps({'status':'PASS','checks':checks,'failures':0,'o95qEntries':len(entries),'distinctRootEntryLocations':len({x['entryObject2Offset'] for x in entries}),'knownDescriptorOneHopInstances':n_known,'verifiedFixedWitnesses':len(Q['witnesses']),'o95rAdjacentLiteralCalls':len(obs),'nonAdjacentCalls':len(dynamic),'partialExtentCompatibleCalls':ct['someSlotsOutsideExtent']},indent=2))

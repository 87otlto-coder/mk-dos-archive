#!/usr/bin/env python3
"""O95V independent verifier: original MK2 relocations + immutable palette record bytes."""
from pathlib import Path
import json,hashlib,struct,sys
if len(sys.argv)!=5:raise SystemExit('usage: verify-mk2-o95v... <MK2.EXE> <freshO69.json> <O95V.json> <source>')
b=Path(sys.argv[1]).read_bytes();o69b=Path(sys.argv[2]).read_bytes();out=json.loads(Path(sys.argv[3]).read_text());root=Path(sys.argv[4]);o69=json.loads(o69b);o95sb=(root/'mk2_animation_reassigned_identity_stream_witnesses_o95s_2026-10-08.json').read_bytes();o95s=json.loads(o95sb);checks=0
def ck(n,c):
 global checks
 checks+=1
 if not c:raise AssertionError(n)
def sha(b):return hashlib.sha256(b).hexdigest()
U=lambda x:struct.unpack_from('<I',b,x)[0];H=lambda x:struct.unpack_from('<H',b,x)[0];SH=lambda x:struct.unpack_from('<h',b,x)[0]
ck('canonical EXE',sha(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('report success',out['format']=='mk2_palette_held_selector_exact_record_provenance_o95v_v1' and out['status']=='SUCCESS')
ck('input hashes',out['source']==dict(exeSha256=sha(b),regeneratedO69Sha256=sha(o69b),o95sSha256=sha(o95sb)))
le=0x28f0c;pagebytes=0x61c54;ps=U(le+0x28);np=U(le+0x14);objtbl=le+U(le+0x40);maptbl=le+U(le+0x48);pgptr=le+U(le+0x68);recbase=le+U(le+0x6c)
ck('LE config',ps==4096 and U(le+0x44)==2)
objects=[(i+1,U(objtbl+24*i+12),U(objtbl+24*i+16)) for i in range(2)]
pgs=[(b[maptbl+4*i]<<16)|(b[maptbl+4*i+1]<<8)|b[maptbl+4*i+2] for i in range(np)]
def phy(obj,off):
 o,start,n=objects[obj-1];i=off//ps
 ck('physical page',i<n)
 return pagebytes+(pgs[start+i-1]-1)*ps+off%ps
pageEnds=[U(pgptr+4*i) for i in range(np+1)];refs={};count=0
for pg in range(np):
 owner=next(o for o in objects if o[1]<=pg+1<o[1]+o[2]);p=recbase+pageEnds[pg];end=recbase+pageEnds[pg+1]
 while p<end:
  opcode=b[p];flags=b[p+1];off=SH(p+2);p+=4
  ck('supported internal relocation',(opcode&0x20)==0 and flags&3==0)
  target_obj=H(p) if flags&0x40 else b[p];p+=2 if flags&0x40 else 1
  target=0
  if opcode&15!=2:
   target=U(p) if flags&0x10 else H(p);p+=4 if flags&0x10 else 2
  if flags&4:p+=4 if flags&0x20 else 2
  refs[(owner[0],(pg+1-owner[1])*ps+off)]=(opcode&15,target_obj,target);count+=1
 ck('record section length',p==end)
ck('27k relocations',count==27004==out['reparsedFixupRecords'])
oldgood={0,1,2,3,4,5,8,9,16};held={6,7,10,11,12,13,14,15};families='HH LK JC BA FN FN ST RD NJ NJ NJ JX GO SK NJ NJ FN'.split()
ck('17 records',len(out['allSlots'])==17 and set(out['unresolvedSlotIds'])==held)
aliased=[]
for slot,row in enumerate(out['allSlots']):
 ck('slot index and identity group',row['slot']==slot and row['resourceFamily']==families[slot] and row['previousCorrectColorContract']==(slot in oldgood) and row['heldCorrectColorContract']==(slot in held))
 targets=[]
 for ctx,base in zip(row['contexts'],(0x1c1b8,0x1c1fc)):
  table='A' if base==0x1c1b8 else 'B';offset=base+slot*4
  ck('table and entry',ctx['table']==table and ctx['selectorEntryObject2Offset']==offset)
  f=refs.get((2,offset));ck('exact type7 object1 fixup',f is not None and f[:2]==(7,1))
  obj_off=f[2];p=phy(1,obj_off);n=H(p);ck('palette count',n==63==ctx['colorCount'])
  rec=b[p:p+128];ck('palette SHA and provenance',ctx['recordObject1Offset']==obj_off and ctx['recordPhysical']==p and ctx['recordByteLength']==128 and sha(rec)==ctx['recordSha256'])
  ck('palette first word',ctx['rawFirstWordHex']=='0x'+format(H(p+2),'X'))
  targets.append(obj_off)
 same=targets[0]==targets[1];ck('real target alias',row['tableATableBShareExactPointer']==same)
 if slot in held and same:aliased.append(slot)
ck('four unresolved aliases',aliased==[12,13,14,15])
ck('counts',out['counts']==dict(slots=17,paletteSelectorTableEntries=34,heldSlots=8,previouslyQualifiedCorrectColorSlots=9,heldSlotsWithSameAAndBPointer=4,heldSlotsWithDistinctAAndBPointer=4,goQualifiedFrames=7,newCorrectColorContractPromotions=0))
go=next(r for r in o69['qualifiedResources'] if r['resourceName']=='GO.GRA');ck('GO exact full',go['qualification']=='EXACT_FULL_RESOURCE_TILING' and go['indexDomain']['min']==1 and go['indexDomain']['max']==63)
sprites={r['descriptorPhysical']:r for r in go['streams']}
ck('two GO witnesses',len(out['goSelectionWitnesses'])==len(o95s['qualifiedRoutes'])==2)
for row,r in zip(out['goSelectionWitnesses'],o95s['qualifiedRoutes']):
 ck('GO provenance',row['routeId']==r['id'] and row['selectorSlot']==r['selectorIdentityAtLookup']==12 and row['identityAfterSelection']==r['identityAfterLookupBeforeConsumer']==6 and row['streamObject2Offset']==r['streamObject2Offset'] and row['frames']==len(r['frames']) and row['paletteHandleAtConsumerEstablished'] is False)
 for frame in r['frames']:
  f=sprites.get(frame['descriptorPhysical']);ck('GO frame qualified index domain',f is not None and f['graOffset']==frame['graOffset'] and 1<=f['opaqueIndexMin']<=f['opaqueIndexMax']<=63)
for key in ('recordPointerQualificationDoesNotEqualRenderedPaletteOwnership','selectedAnimationPointerAndPaletteHandleMayHaveDistinctIdentityHistory','noNewAnimationSequences','noAdditionalSlotCorrectColorPromoted','dynamicGameplayTimingUnknown'):
 ck('boundary '+key,out['boundary'][key] is True)
ck('research open',out['boundary']['mk2ResearchClosed'] is False)
print(json.dumps({'status':'PASS','checks':checks,'failures':0,'fixupRecords':count,'unresolvedAliasSlots':aliased,'goFramesLinkedToQualifiedSourceIndexDomain':7,'newCorrectColorPromotions':0}))

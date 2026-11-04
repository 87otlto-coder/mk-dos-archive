#!/usr/bin/env python3
"""O110G: bounded palette request -> stage index writer -> packed table adjacency.
No claim that palette record, render activation, or runtime palette handle is proven.
"""
import hashlib, json, struct, sys
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: script <original-mk2-dir> <O110F-json> <outdir>')
fixture,prior,out=map(Path,sys.argv[1:]);exe=(fixture/'mk2.exe').read_bytes()
H=lambda b:hashlib.sha256(b).hexdigest(); U=lambda o:struct.unpack_from('<I',exe,o)[0]
assert H(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
parent_bytes=prior.read_bytes(); parent=json.loads(parent_bytes)
assert parent['format']=='mk2_o110f_palette_allocator_callsite_census_v1' and parent['status']=='PASS_STATIC_ONLY'
assert {p['callPhysical'] for p in parent['callSites'] if p.get('paletteTargetOffset')==0x26cc4} >= {0x779f4,0x77d7c}
# Exact straight-line source excerpts. The index-6 path contains one intervening
# CALL whose return/state effects are not proven.
links=[
 ('index5_immediate',0x77d77,0x77d7c,0x77d81,0x77d8b,5,[]),
 ('index6_with_intervening_call',0x779ef,0x779f4,0x779fe,0x77a08,6,[0x779f9]),
]
records=[]
for label,load,request,write,write_call,index,intervening in links:
 assert exe[load]==0xb8 and U(load+1)==0x26cc4
 assert exe[request]==0xe8 and request+5+struct.unpack_from('<i',exe,request+1)[0]==0x7b439
 assert exe[write:write+6]==b'\xc7\x05\x80\x5a\x07\x00' and U(write+6)==index
 assert exe[write_call]==0xe8 and write_call+5+struct.unpack_from('<i',exe,write_call+1)[0]==0x82321
 if intervening:
  for call in intervening: assert call+5+struct.unpack_from('<i',exe,call+1)[0]==0x63f99
 else: assert write==request+5 and write_call==write+10
 stage_packed=U(0xcfba8+4*index)
 records.append({'label':label,'paletteLoadPhysical':load,'paletteAllocatorCallPhysical':request,
   'paletteSourceObject1Offset':0x26cc4,'paletteRecordColorCount':48,
   'sourceGlobalStorePhysical':write,'sourceGlobalAddress':0x75a80,
   'writerCallPhysical':write_call,'writerPhysical':0x82321,
   'locallyStoredSelectorLiteral':index,
   'interveningCalls':intervening,
   'selectorToPackedTableValue':stage_packed,
   'packedFileId':stage_packed>>24 if stage_packed else None,
   'packedOffset':stage_packed&0xffffff if stage_packed else None,
   'conditionalResourceSource': 'ARMORY.GRA' if stage_packed==0x1a01ed80 else None,
   'qualification':'SOURCE_LOCAL_ONLY_REQUIRES_PATH_RETURN_AND_STATE_PERSISTENCE'})
# Stage source selection and palette handle lookup are separate stateful consumers.
assert exe[0x82321:0x8232b].hex()=='a1805a0700a37f740700'
assert exe[0x9e165:0x9e171].hex()=='a17f74070003348554ef0200'
assert exe[0x9e18b:0x9e190].hex()=='b801000000'
assert exe[0x659ea:0x659f1].hex()=='8a04c5065b0700'
assert exe[0x7b4b1:0x7b4b8].hex()=='8814dd065b0700'
assert records[0]['selectorToPackedTableValue']==0x1a01ed80
assert records[1]['selectorToPackedTableValue']==0
manifest={
 'format':'mk2_o110g_stage_palette_request_selector_local_join_v1',
 'status':'PASS_BOUNDED_STATIC',
 'originalMk2ExeSHA256':H(exe),'parentO110FReportSHA256':H(parent_bytes),
 'boundedCallsitePairs':records,
 'packedIndexedLookup':{'runtimeIndexGlobal':0x7747f,
  'producerLoad':0x82321,'producerStore':0x82326,
  'consumerLoad':0x9e165,'consumerTableAdd':0x9e16a,
  'tableObject2Offset':0x2ef54,'tablePhysical':0xcfba8,
  'slot5OriginalPacked':0x1a01ed80,'slot6OriginalPacked':0},
 'paletteSlotOne':{'literalAt':0x9e18b,'paletteBaseDynamicRead':0x659ea,
   'paletteHandleTableBaseIndexField':0x75b06,'paletteAllocatorWritesBaseField':0x7b4b1,
   'actualSlotOneRecordAtDraw':'UNKNOWN'},
 'interpretation':{
   'sourceCodeOrderRequested48ColorRecordBeforeIndex5':True,
   'sourceCodeOrderRequested48ColorRecordBeforeIndex6':True,
   'index5TableValueNamesArmoryPackedSourceConditionally':True,
   'index6TableValueIsZero':True,
   'slot1RuntimePaletteOwnershipProven':False,
   'samePaletteUsedToRenderArmoryProven':False,
   'runtimeExecutionOrderAcrossCallsitesProven':False,
   'gameplayStageIdentityOrFullColoredSceneProven':False,
 },
 'limits':[
  'Code adjacency does not prove palette allocator returned handle 1; the allocator scans/reuses handles dynamically.',
  'The index 6 zero table entry is not evidence of an absent frame or of an invalid runtime index.',
  'Index 6 path calls 0x63F99 between allocation and index storage; side effects and execution conditions not qualified.',
  'Index 5 maps to packed ARMORY.GRA on the guarded indexed-consumer path, only if the stored global survives to that path.',
  'Actual stage camera, source rows, layering, source palette ownership and rendered RGB remain runtime dependent.']}
out.mkdir(parents=True,exist_ok=True);p=out/'MK2_O110G_STAGE_PALETTE_SELECTOR_ADJACENCY.json';p.write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'status':'PASS','report':str(p),'candidateJoins':2,
 'sourceIndex5Packed':hex(records[0]['selectorToPackedTableValue']),
 'sourceIndex6Packed':hex(records[1]['selectorToPackedTableValue']),
 'paletteSlot1RuntimeIdentityProven':False},indent=2))

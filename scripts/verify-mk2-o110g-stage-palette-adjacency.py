#!/usr/bin/env python3
"""Independent fixture audit of O110G code-order joins and fail-closed semantics."""
import hashlib,json,struct,sys
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verifier <original mk2 dir> <O110F report> <O110G report>')
folder,parent_path,child_path=map(Path,sys.argv[1:]);b=(folder/'mk2.exe').read_bytes();parent=parent_path.read_bytes();data=json.loads(child_path.read_text())
H=lambda x:hashlib.sha256(x).hexdigest();U=lambda p:struct.unpack_from('<I',b,p)[0]
S=lambda p:struct.unpack_from('<i',b,p)[0];n=0
def ck(value,name):
 global n;n+=1
 if not value:raise AssertionError('O110G '+name)
ck(H(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','canonical MK2.EXE SHA256')
ck(data['format']=='mk2_o110g_stage_palette_request_selector_local_join_v1' and data['status']=='PASS_BOUNDED_STATIC','format and status')
ck(data['originalMk2ExeSHA256']==H(b) and data['parentO110FReportSHA256']==H(parent),'evidence ancestry')
p=json.loads(parent)
ck(p['format']=='mk2_o110f_palette_allocator_callsite_census_v1' and p['status']=='PASS_STATIC_ONLY','verified parent status')
expected=[('index5_immediate',0x77d77,0x77d7c,0x77d81,0x77d8b,5,[],0x1a01ed80,'ARMORY.GRA'),
 ('index6_with_intervening_call',0x779ef,0x779f4,0x779fe,0x77a08,6,[0x779f9],0,None)]
ck(len(data['boundedCallsitePairs'])==len(expected),'exact two links')
for item,(label,load,alloc,store,call,index,intermediate,packed,resource) in zip(data['boundedCallsitePairs'],expected):
 ck(item['label']==label,'label')
 ck((item['paletteLoadPhysical'],item['paletteAllocatorCallPhysical'],item['sourceGlobalStorePhysical'],item['writerCallPhysical'])==(load,alloc,store,call),'source code coordinates')
 ck(b[load:load+5]==b'\xb8\xc4\x6c\x02\x00','source O1 48-color palette mov')
 ck(b[alloc]==0xe8 and alloc+5+S(alloc+1)==0x7b439,'actual palette allocator rel32 call')
 ck(b[store:store+6]==b'\xc7\x05\x80\x5a\x07\x00' and U(store+6)==index,'literal index stored in global')
 ck(b[call]==0xe8 and call+5+S(call+1)==0x82321,'actual writer rel32 call')
 ck(item['paletteSourceObject1Offset']==0x26cc4 and item['paletteRecordColorCount']==48,'original record identity')
 ck(item['sourceGlobalAddress']==0x75a80 and item['writerPhysical']==0x82321,'true writer input')
 ck(item['locallyStoredSelectorLiteral']==index and item['interveningCalls']==intermediate,'bounded control sequence')
 ck(item['selectorToPackedTableValue']==packed and U(0xcfba8+4*index)==packed,'native source table')
 ck(item['packedFileId']==(packed>>24 if packed else None) and item['packedOffset']==(packed & 0xffffff if packed else None),'packed decode')
 ck(item['conditionalResourceSource']==resource,'conditional source identity')
 ck(item['qualification']=='SOURCE_LOCAL_ONLY_REQUIRES_PATH_RETURN_AND_STATE_PERSISTENCE','confidence boundary')
 ck(alloc in [v['callPhysical'] for v in p['callSites'] if v.get('paletteTargetOffset')==0x26cc4],'O110F predecessor callsite')
 if intermediate:
  ck(len(intermediate)==1 and intermediate[0]==alloc+5,'intervening call position')
  ck(b[intermediate[0]]==0xe8 and intermediate[0]+5+S(intermediate[0]+1)==0x63f99,'intervening helper target')
 else:ck(store==alloc+5 and call==store+10,'adjacent writer path')
ck(b[0x82321:0x8232b].hex()=='a1805a0700a37f740700','stage index source global -> selector global')
ck(b[0x9e165:0x9e171].hex()=='a17f74070003348554ef0200','stage index selector -> packed table')
ck(U(0x9e16d)==0x2ef54 and U(0xcfba8+4*5)==0x1a01ed80 and U(0xcfba8+4*6)==0,'original table numeric ancestry')
ck(b[0x9e18b:0x9e190].hex()=='b801000000','renderer chooses palette handle slot 1')
ck(b[0x659ea:0x659f1].hex()=='8a04c5065b0700','actual dynamic palette base read')
ck(b[0x7b4b1:0x7b4b8].hex()=='8814dd065b0700','allocator dynamic palette base write')
armory=(folder/'armory.gra').read_bytes();off=0x1ed80
ck(0<off<len(armory) and (len(armory)-off)//896==56 and (len(armory)-off)%896==0,'ARMORY source 56 rows')
ck(data['packedIndexedLookup']=={'runtimeIndexGlobal':0x7747f,'producerLoad':0x82321,
 'producerStore':0x82326,'consumerLoad':0x9e165,'consumerTableAdd':0x9e16a,
 'tableObject2Offset':0x2ef54,'tablePhysical':0xcfba8,
 'slot5OriginalPacked':0x1a01ed80,'slot6OriginalPacked':0},'cross-function index graph')
ck(data['paletteSlotOne']=={'literalAt':0x9e18b,'paletteBaseDynamicRead':0x659ea,
 'paletteHandleTableBaseIndexField':0x75b06,'paletteAllocatorWritesBaseField':0x7b4b1,
 'actualSlotOneRecordAtDraw':'UNKNOWN'},'dynamic slot 1 is not assigned')
ck(data['interpretation']=={
 'sourceCodeOrderRequested48ColorRecordBeforeIndex5':True,
 'sourceCodeOrderRequested48ColorRecordBeforeIndex6':True,
 'index5TableValueNamesArmoryPackedSourceConditionally':True,
 'index6TableValueIsZero':True,
 'slot1RuntimePaletteOwnershipProven':False,
 'samePaletteUsedToRenderArmoryProven':False,
 'runtimeExecutionOrderAcrossCallsitesProven':False,
 'gameplayStageIdentityOrFullColoredSceneProven':False},'fail-closed interpretation')
ck(len(data['limits'])==5,'five explicit research limits')
print(json.dumps({'status':'PASS','checks':n,'failures':0,'conditionalProducerJoins':2,
 'index5':hex(U(0xcfba8+5*4)), 'index6':hex(U(0xcfba8+6*4)),
 'observedStageRuntimePalette':False}))

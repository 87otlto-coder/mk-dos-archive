#!/usr/bin/env python3
"""Independent verifier for original MK2 O110J direct-return provenance."""
import hashlib,json,struct,sys
from pathlib import Path
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'

def verify(b,parent_bytes,r):
 n=0
 def ok(x,msg):
  nonlocal n
  assert x,msg
  n+=1
 ok(hashlib.sha256(b).hexdigest()==HASH,'canonical mk2')
 p=json.loads(parent_bytes)
 ok(p['format']=='mk2_o110g_stage_palette_request_selector_local_join_v1','parent format')
 ok(r['format']=='mk2_o110j_stage_palette_request_return_provenance_v1','report format')
 ok(r['status']=='PASS_BOUNDED_NEGATIVE_DATAFLOW','status')
 ok(r['exeSHA256']==HASH,'exe digest')
 ok(r['parentO110GReportSHA256']==hashlib.sha256(parent_bytes).hexdigest(),'parent hash')
 expected=[('index5',5,0x77d77,0x77d7c,None,0x77d81,0x77d8b),
           ('index6',6,0x779ef,0x779f4,0x779f9,0x779fe,0x77a08)]
 ok(len(r['sourceToWriterPaths'])==2,'two paths')
 def call(p,target):return b[p]==0xe8 and p+5+struct.unpack_from('<i',b,p+1)[0]==target
 for label,slot,load,req,helper,write,writer in expected:
  source=next(x for x in r['sourceToWriterPaths'] if x['path']==label)
  ok(source['selectorLiteral']==slot and source['paletteRecordObject1Offset']==0x26cc4,'literal palette record')
  ok(source['allocatorCall']==req and source['helperAfterAllocator']==helper,'request path')
  ok(source['indexLiteralWrite']==write and source['selectorWriterCall']==writer,'selector path')
  ok(b[load:load+5]==bytes.fromhex('b8c46c0200'),'static record load')
  ok(call(req,0x7b439),'allocator call')
  ok(b[write:write+10]==bytes.fromhex('c705805a0700')+struct.pack('<I',slot),'global index literal')
  ok(call(writer,0x82321) and writer==write+10,'selector writer called')
  ok(source['allocatorResultPassedAsSelectorArgument'] is False,'no direct result forwarded')
  ok(source['allocatorResultDirectlyStoredInLocalPath'] is False,'no direct result storage')
  ok(source['handleSlotOneRuntimeIdentityProven'] is False,'no handle1 proof')
  if helper:
   ok(call(helper,0x63f99),'intervening helper')
   ok(b[0x63f99:0x63fa1]==bytes.fromhex('33c0a3ca620700c3'),'helper clears EAX')
  else:ok(writer==req+15,'direct local continuation')
 ok(b[0x82321:0x8232b]==bytes.fromhex('a1805a0700a37f740700'),'writer fresh input load')
 ok(r['writer']=={'entry':0x82321,'freshGlobalLoad':0x82321,'sourceGlobal':0x75a80,
    'independentDestinationGlobalStore':0x82326,'selectorDestinationGlobal':0x7747f},'writer report')
 ok(r['index6Helper']=={'entry':0x63f99,'firstInstruction':'XOR EAX,EAX',
    'globalZeroed':0x762ca,'returnsAt':0x63fa0,
    'notAnAllocatorHandlePersistenceProof':True},'helper report')
 conclusions=r['conclusions']
 ok(conclusions=={'sourceLocalPaletteRequestsPrecedeSelectorLiteralWrites':True,
    'selectorLiteralsAreAllocatorReturnValues':False,
    'paletteAllocatorCanStillChangeLiveGlobalHandleState':True,
    'allocationAtSlotOneProven':False,
    'runtimeSceneColorOwnershipProven':False,
    'fullControlFlowOrEmulatorTraceClaimed':False},'conclusions')
 ok(len(r['limitations'])==4,'known scope limitations')
 return n
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('usage: script <original-mk2-dir> <O110G-evidence> <O110J-report>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes()
 parent=Path(sys.argv[2]).read_bytes()
 report=json.loads(Path(sys.argv[3]).read_text())
 n=verify(b,parent,report)
 print(json.dumps({'status':'PASS','checks':n,'failures':0,'runtimeBindingStillUnproven':True}))

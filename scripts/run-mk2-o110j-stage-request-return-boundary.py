#!/usr/bin/env python3
"""O110J: reject the unsupported stage-selector-is-palette-handle shortcut.

Exact machine-code data flow on the two O110G bounded source-local paths;
no interprocedural runtime state proof is implied.
"""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
H=lambda b: hashlib.sha256(b).hexdigest()

def call(b,p,target):
 assert b[p]==0xe8 and p+5+struct.unpack_from('<i',b,p+1)[0]==target,(hex(p),hex(target))

def main():
 if len(sys.argv)!=4:raise SystemExit('usage: script <original-mk2-dir> <O110G-evidence> <outdir>')
 fixture,parent,out=map(Path,sys.argv[1:]);b=(fixture/'mk2.exe').read_bytes();pb=parent.read_bytes();p=json.loads(pb)
 assert H(b)==SHA and p['format']=='mk2_o110g_stage_palette_request_selector_local_join_v1'
 assert {x['locallyStoredSelectorLiteral'] for x in p['boundedCallsitePairs']}=={5,6}
 paths=[]
 for label,load,request,helper,store,selector,write in [
  ('index5',0x77d77,0x77d7c,None,0x77d81,5,0x77d8b),
  ('index6',0x779ef,0x779f4,0x779f9,0x779fe,6,0x77a08)]:
  assert b[load:load+5]==b'\xb8\xc4\x6c\x02\x00'
  call(b,request,0x7b439)
  if helper is not None:
   call(b,helper,0x63f99)
   assert b[0x63f99:0x63fa1]==bytes.fromhex('33c0a3ca620700c3')
  assert b[store:store+10]==bytes.fromhex('c705805a0700')+struct.pack('<I',selector)
  call(b,write,0x82321)
  assert (write==store+10) and (helper is None or store==helper+5)
  paths.append({'path':label,'paletteRecordObject1Offset':0x26cc4,
   'allocatorCall':request,'helperAfterAllocator':helper,'indexLiteralWrite':store,
   'selectorLiteral':selector,'selectorWriterCall':write,
   'allocatorResultPassedAsSelectorArgument':False,
   'allocatorResultDirectlyStoredInLocalPath':False,
   'handleSlotOneRuntimeIdentityProven':False,
   'reason':'selector writer reloads source global into EAX; index literal is independent of allocator returned EAX'})
 assert b[0x82321:0x8232b].hex()=='a1805a0700a37f740700'
 # The index6 intervening routine sets EAX to zero; its own memory write is to
 # 0x762CA, not the indexed-source global or an authenticated palette slot.
 report={
  'format':'mk2_o110j_stage_palette_request_return_provenance_v1',
  'status':'PASS_BOUNDED_NEGATIVE_DATAFLOW',
  'exeSHA256':SHA,'parentO110GReportSHA256':H(pb),
  'sourceToWriterPaths':paths,
  'writer':{'entry':0x82321,'freshGlobalLoad':0x82321,'sourceGlobal':0x75a80,
    'independentDestinationGlobalStore':0x82326,'selectorDestinationGlobal':0x7747f},
  'index6Helper':{'entry':0x63f99,'firstInstruction':'XOR EAX,EAX',
    'globalZeroed':0x762ca,'returnsAt':0x63fa0,
    'notAnAllocatorHandlePersistenceProof':True},
  'conclusions':{'sourceLocalPaletteRequestsPrecedeSelectorLiteralWrites':True,
    'selectorLiteralsAreAllocatorReturnValues':False,
    'paletteAllocatorCanStillChangeLiveGlobalHandleState':True,
    'allocationAtSlotOneProven':False,
    'runtimeSceneColorOwnershipProven':False,
    'fullControlFlowOrEmulatorTraceClaimed':False},
  'limitations':[
    'These local literal-selector assignments are not direct stores of returned palette handles.',
    'This excludes only a simple direct EAX-to-selector argument identity on the two analyzed paths.',
    'Allocator side effects, prior live handles, dispatch ordering and stage activation remain unobserved.',
    'Conditional ARMORY packed source selection from O110G is unaffected; palette ownership still UNKNOWN.']}
 out.mkdir(parents=True,exist_ok=True)
 dst=out/'MK2_O110J_STAGE_PALETTE_REQUEST_RETURN_BOUNDARY.json'
 dst.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','paths':2,'sourceLocalSelectorDirectHandleIdentity':False,'out':str(dst)}))
if __name__=='__main__':main()

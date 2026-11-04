#!/usr/bin/env python3
"""Independent original-exe address / instruction and classifier verifier for O110L."""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BASE,END=0x61c54,0xa0c54
INSTRUCTIONS=[
 (0x67050,'xor1','8335d462050001'),(0x67071,'set1','c705d462050001000000'),
 (0x67098,'set1','c705d462050001000000'),(0x670b1,'set0','c705d462050000000000'),
 (0x670c7,'test1','f705d462050001000000'),(0x74e77,'set0','c705d462050000000000'),
 (0x7b499,'set0','c705d462050000000000'),(0x9320e,'test1','f705d462050001000000'),
 (0x933c2,'test1','f705d462050001000000'),(0x938d6,'test1','f705d462050001000000'),
 (0x9e118,'test1','f705d462050001000000')]

def verify(b,previous,report):
 n=0
 def ok(expr,msg):
  nonlocal n
  assert expr,msg;n+=1
 ok(hashlib.sha256(b).hexdigest()==SHA,'exe auth')
 ok(report['format']=='mk2_o110l_render_gate_direct_operand_census_v1','format')
 ok(report['status']=='PASS_BOUNDED_SOURCE','status')
 ok(report['originalExeSHA256']==SHA,'exe linkage')
 ok(report['parentO110HSHA256']==hashlib.sha256(previous).hexdigest(),'parent digest')
 ok(json.loads(previous)['format']=='mk2_o110h_palette_handle_lifecycle_v1','parent format')
 ok(report['executableCodeFileRange']==[BASE,END] and report['gateLinearAddress']==0x562d4,'bounds')
 needle=struct.pack('<I',0x562d4)
 observed=[j for j in range(BASE,END-3) if b[j:j+4]==needle]
 ok(report['operandPhysicalOccurrences']==observed,'full census')
 ok(observed==[off+2 for off,_,_ in INSTRUCTIONS],'expected exact operand count')
 ok(len(report['occurrences'])==len(INSTRUCTIONS),'classification count')
 for r, (start,kind,raw) in zip(report['occurrences'],INSTRUCTIONS):
  ok(r['opcodePhysical']==start and r['operandPhysical']==start+2,'where')
  ok(r['kind']==kind and r['instructionBytes']==raw and r['widthBits']==32,'what')
  ok(b[start:start+len(raw)//2].hex()==raw,'original bytes')
 ok(report['classifiedCounts']=={'toggleLowBit':1,'setOne':2,'setZero':3,'testLowBit':5},'class counts')
 ok(report['allocatorFreshPath']['entryPhysical']==0x7b439,'allocator')
 ok(b[0x7b445:0x7b44b]==bytes.fromhex('0f84ac000000'),'matching bypass')
 ok(b[0x7b462:0x7b464]==bytes.fromhex('7423'),'free-entry path')
 ok(b[0x7b48f:0x7b499]==bytes.fromhex('c705e063050001000000'),'fresh write')
 ok(report['allocatorFreshPath']['gateClearPhysical']==0x7b499,'guard clearing')
 ok(report['allocatorFreshPath']['clearsGateOnFreshAllocationPath'] is True,'fresh path clears')
 ok(report['allocatorFreshPath']['pointerMatchFastPathClearsGate'] is False,'fast path bypass')
 ok(b[0x9e118:0x9e124]==bytes.fromhex('f705d4620500010000007473'),'stage guarded branch')
 ok(report['stageConsumer']['skipTarget']==0x9e197 and report['stageConsumer']['blitCallAt']==0x9e191,'guard skip')
 ok(b[0x9e191]==0xe8 and 0x9e196+struct.unpack_from('<i',b,0x9e192)[0]==0x659c6,'stage blit target')
 for k,expected in {'directAddressOccurrenceCensusExactOnKnownCodeFileRange':True,
    'sharedMutableFlagBetweenPaletteAllocatorAndStageRenderer':True,
    'newPaletteRequestCanTemporarilyDisableStageRenderPath':True,
    'allMemoryAliasesAndIndirectWritesExcluded':True,
    'paletteSlotOneOwnershipDetermined':False,'actualStageVisibleDuringAnyParticularTick':False}.items():
  ok(report['claims'][k] is expected,'conclusion '+k)
 ok(len(report['limitations'])==3,'caveats')
 return n
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('usage: verifier <original-mk2-dir> <O110H-json> <O110L-json>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();raw=Path(sys.argv[2]).read_bytes();rep=json.loads(Path(sys.argv[3]).read_text())
 print(json.dumps({'status':'PASS','pass':'O110L','checks':verify(b,raw,rep),'failures':0}))

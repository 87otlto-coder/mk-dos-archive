#!/usr/bin/env python3
"""Independent authenticity and hostile-report audit for O110M source-local palette queue circuit."""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED=[(0x6708c,'test_nonzero','f705e0630500ffffffff'),(0x746d5,'set1','c705e063050001000000'),
 (0x76c58,'set1','c705e063050001000000'),(0x7b3ed,'set0','c705e063050000000000'),
 (0x7b48f,'set1','c705e063050001000000'),(0x94f97,'set1','c705e063050001000000')]
CALLS={0x67057:0x935e6,0x6707b:0x933c2,0x670a2:0x933c2,0x670a7:0x7b30b,
 0x670bd:0x933c2,0x670c2:0x7b30b,0x670d3:0x7b30b}
BRANCHES={0x67096:0x670bd,0x6706f:0x6708c,0x9e122:0x9e197}

def verify(exe,prevh,prevl,r):
 n=0
 def ck(x,msg):
  nonlocal n
  assert x,msg;n+=1
 ck(hashlib.sha256(exe).hexdigest()==SHA,'canonical source')
 ck(r['format']=='mk2_o110m_palette_queue_render_gate_cycle_v1' and r['status']=='PASS_LOCAL_DISPATCH','status')
 ck(r['originalExeSHA256']==SHA,'exe digest')
 ck(r['parentO110HSHA256']==hashlib.sha256(prevh).hexdigest(),'h hash')
 ck(r['parentO110LSHA256']==hashlib.sha256(prevl).hexdigest(),'l hash')
 ck(json.loads(prevh)['format']=='mk2_o110h_palette_handle_lifecycle_v1','h valid format')
 ck(json.loads(prevl)['format']=='mk2_o110l_render_gate_direct_operand_census_v1','l valid format')
 ck(r['queueFlagAddress']==0x563e0,'queue addr')
 occur=[p for p in range(0x61c54,0xa0c54-3) if exe[p:p+4]==bytes.fromhex('e0630500')]
 ck(occur==[o+2 for o,_,_ in EXPECTED],'source complete expected operands')
 ck(r['operandPhysicalOccurrences']==occur,'reported complete operands')
 ck(len(r['flagDirectAccesses'])==len(EXPECTED),'access count')
 for record,(at,kind,raw) in zip(r['flagDirectAccesses'],EXPECTED):
  ck(record['physical']==at and record['kind']==kind,'access position/class')
  ck(record['bytes']==raw,'access exact hex field')
  ck(exe[at:at+len(raw)//2].hex()==raw,'access original source')
 ck(len(r['boundedCalls'])==len(CALLS),'call count')
 for event in r['boundedCalls']:
  at=event['physical'];tgt=CALLS.get(at)
  ck(tgt is not None and event['target']==tgt,'call destination reported')
  ck(exe[at]==0xe8 and at+5+struct.unpack_from('<i',exe,at+1)[0]==tgt,'call machine verified')
 ck(len(r['boundedBranches'])==len(BRANCHES),'branch count')
 for ev in r['boundedBranches']:
  at=ev['physical'];tgt=BRANCHES.get(at)
  ck(tgt is not None and ev['target']==tgt and ev['size']==2,'branch reported')
  ck(exe[at] in (0x74,0x75) and at+2+struct.unpack_from('<b',exe,at+1)[0]==tgt,'branch actual')
 ck(exe[0x67098:0x670a2].hex()=='c705d462050001000000','flag set')
 ck(exe[0x670b1:0x670bb].hex()=='c705d462050000000000','flag clear')
 ck(exe[0x670c7:0x670d1].hex()=='f705d462050001000000','flag test')
 ck(exe[0x7b499:0x7b4a3].hex()=='c705d462050000000000','allocator clear')
 ck(exe[0x67050:0x67057].hex()=='8335d462050001','XOR gate')
 target={'gateTogglePhysical':0x67050,'schedulerCallAt':0x67057,
  'queuePendingFlagTestAt':0x6708c,'zeroFlagBranchAt':0x67096,
  'pendingPathGateEnableAt':0x67098,'pendingPathDrawAt':0x670a2,
  'pendingPathPaletteProcessAt':0x670a7,'pendingPathGateDisableAt':0x670b1,
  'alternatePathDrawAt':0x670bd,'alternatePathProcessAt':0x670c2,
  'alternatePathGateTestAt':0x670c7}
 ck(r['controlAt67050']==target,'dispatch summary precise')
 for key in ['newAllocationMarksPending','controlGateCanBeReEnabledForDraw','controlGateCanBeDisabledAfterProcessing']:
  ck(r['queueProcessing'][key] is True,'queue positive '+key)
 ck(r['queueProcessing']['queueDrainClearsPendingAt']==0x7b3ed,'drain')
 ck(r['queueProcessing']['rendererLowBitGate']==0x562d4 and r['queueProcessing']['pendingFlag']==0x563e0,'globals distinct')
 for key,expected in {'directAccessSourceCensusSupported':True,'paletteFlagAndStageRenderingLocalControlCoupled':True,
  'controlBlockOnePossibleConditionalPathThroughEnableDrawDisable':True,
  'allPossibleRuntimeMemoryAliasWritersEnumerated':False,'stagePaletteSlotOneOwnerKnown':False,
  'observedGameTicksOrTiming':False}.items():ck(r['classification'][key] is expected,'claims '+key)
 ck(len(r['limits'])==3,'limits')
 return n
if __name__=='__main__':
 if len(sys.argv)!=5:raise SystemExit('usage: <mk2-dir> <O110H> <O110L> <O110M>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();p=Path(sys.argv[2]).read_bytes();q=Path(sys.argv[3]).read_bytes();r=json.loads(Path(sys.argv[4]).read_text())
 print(json.dumps({'status':'PASS','pass':'O110M','checks':verify(b,p,q,r),'failures':0}))

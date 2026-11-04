#!/usr/bin/env python3
"""O110M: source-authenticated connection between palette update queue state and render gate.

Only direct-address opcode evidence and local branches: not a timed runtime trace.
"""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
RANGE=(0x61c54,0xa0c54)
FLAG=0x563e0
REFS=[('controlCheck',0x6708c,'test_nonzero','f705e0630500ffffffff'),
 ('directQueueWriter1',0x746d5,'set1','c705e063050001000000'),
 ('directQueueWriter2',0x76c58,'set1','c705e063050001000000'),
 ('queueDrain',0x7b3ed,'set0','c705e063050000000000'),
 ('allocatorFreshRequest',0x7b48f,'set1','c705e063050001000000'),
 ('directQueueWriter3',0x94f97,'set1','c705e063050001000000')]
CALLS=[('controlToggleRendering',0x67057,0x935e6),
 ('enableAndRender',0x6707b,0x933c2),('renderIfPending',0x670a2,0x933c2),
 ('paletteProcessPending',0x670a7,0x7b30b),('renderIfNoPending',0x670bd,0x933c2),
 ('processIfNoPending',0x670c2,0x7b30b),
 ('processIfNotEnabled',0x670d3,0x7b30b)]
BRANCHES=[('flagZeroToAlternate',0x67096,0x670bd,2),('modeThreeAlternate',0x6706f,0x6708c,2),
 ('stageLowBitOffToSkip',0x9e122,0x9e197,2)]

def main():
 if len(sys.argv)!=5:raise SystemExit('usage <game-dir> <O110H-json> <O110L-json> <outdir>')
 game,h,l,out=map(Path,sys.argv[1:]);b=(game/'mk2.exe').read_bytes();hraw=h.read_bytes();lraw=l.read_bytes();parent=json.loads(lraw)
 assert hashlib.sha256(b).hexdigest()==SHA
 assert parent['format']=='mk2_o110l_render_gate_direct_operand_census_v1'
 occurrences=[i for i in range(RANGE[0],RANGE[1]-3) if b[i:i+4]==struct.pack('<I',FLAG)]
 assert occurrences==[at+2 for _,at,_,_ in REFS]
 for _,at,_,hx in REFS:assert b[at:at+len(hx)//2].hex()==hx
 for _,at,tgt in CALLS:assert b[at]==0xe8 and at+5+struct.unpack_from('<i',b,at+1)[0]==tgt
 for _,at,tgt,size in BRANCHES:assert b[at]==0x74 or b[at]==0x75;assert at+size+struct.unpack_from('<b',b,at+1)[0]==tgt
 assert b[0x67050:0x67057]==bytes.fromhex('8335d462050001')
 assert b[0x67098:0x670a2]==bytes.fromhex('c705d462050001000000')
 assert b[0x670b1:0x670bb]==bytes.fromhex('c705d462050000000000')
 assert b[0x7b499:0x7b4a3]==bytes.fromhex('c705d462050000000000')
 assert b[0x670c7:0x670d1]==bytes.fromhex('f705d462050001000000')
 report={'format':'mk2_o110m_palette_queue_render_gate_cycle_v1','status':'PASS_LOCAL_DISPATCH',
 'originalExeSHA256':SHA,'parentO110HSHA256':hashlib.sha256(hraw).hexdigest(),
 'parentO110LSHA256':hashlib.sha256(lraw).hexdigest(),
 'queueFlagAddress':FLAG,'operandPhysicalOccurrences':occurrences,
 'flagDirectAccesses':[{'name':name,'physical':at,'kind':kind,'bytes':hx} for name,at,kind,hx in REFS],
 'boundedCalls':[{'name':name,'physical':at,'target':tgt} for name,at,tgt in CALLS],
 'boundedBranches':[{'name':name,'physical':at,'target':tgt,'size':size} for name,at,tgt,size in BRANCHES],
 'controlAt67050':{'gateTogglePhysical':0x67050,'schedulerCallAt':0x67057,
  'queuePendingFlagTestAt':0x6708c,'zeroFlagBranchAt':0x67096,
  'pendingPathGateEnableAt':0x67098,'pendingPathDrawAt':0x670a2,
  'pendingPathPaletteProcessAt':0x670a7,'pendingPathGateDisableAt':0x670b1,
  'alternatePathDrawAt':0x670bd,'alternatePathProcessAt':0x670c2,
  'alternatePathGateTestAt':0x670c7},
 'queueProcessing':{'newAllocationMarksPending':True,
   'queueDrainClearsPendingAt':0x7b3ed,'controlGateCanBeReEnabledForDraw':True,
   'controlGateCanBeDisabledAfterProcessing':True,
   'rendererLowBitGate':0x562d4,'pendingFlag':FLAG},
 'classification':{'directAccessSourceCensusSupported':True,
   'paletteFlagAndStageRenderingLocalControlCoupled':True,
   'controlBlockOnePossibleConditionalPathThroughEnableDrawDisable':True,
   'allPossibleRuntimeMemoryAliasWritersEnumerated':False,
   'stagePaletteSlotOneOwnerKnown':False,'observedGameTicksOrTiming':False},
 'limits':['A pending palette queue flag is inferred from its set/clear sites and queue processing; no real-time trace is supplied.',
   'Branches are conditional and callees may mutate globals; no full CFG/memory alias proof.',
   'Presence of a rendering enable path does not authenticate palette ownership or actual frame composition.']}
 out.mkdir(parents=True,exist_ok=True);dst=out/'MK2_O110M_PALETTE_QUEUE_RENDER_CYCLE.json';dst.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','pass':'O110M','pendingFlagRefs':len(REFS),'boundedCalls':len(CALLS),'out':str(dst)}))
if __name__=='__main__':main()

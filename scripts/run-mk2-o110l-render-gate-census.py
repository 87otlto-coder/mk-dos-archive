#!/usr/bin/env python3
"""O110L: exhaustively count exact 32-bit operand occurrences for a guarded render gate.

Distinguish exact operand/reference evidence from a general machine-wide writer analysis.
"""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BASE,END=0x61c54,0xa0c54
GATE=0x562d4
OP=[('toggleLowBit',0x67050,'xor1','8335d462050001',0x67052),
 ('enableViaControl',0x67071,'set1','c705d462050001000000',0x67073),
 ('enableViaSync',0x67098,'set1','c705d462050001000000',0x6709a),
 ('disableViaSync',0x670b1,'set0','c705d462050000000000',0x670b3),
 ('syncPredicate',0x670c7,'test1','f705d462050001000000',0x670c9),
 ('modeTransitionDisable',0x74e77,'set0','c705d462050000000000',0x74e79),
 ('allocatorNewPaletteDisable',0x7b499,'set0','c705d462050000000000',0x7b49b),
 ('spriteStructurePredicate',0x9320e,'test1','f705d462050001000000',0x93210),
 ('renderEntrypointPredicate',0x933c2,'test1','f705d462050001000000',0x933c4),
 ('renderHelperPredicate',0x938d6,'test1','f705d462050001000000',0x938d8),
 ('stageStripRendererPredicate',0x9e118,'test1','f705d462050001000000',0x9e11a)]

def main():
 if len(sys.argv)!=4:raise SystemExit('usage: script <mk2-dir> <O110H-json> <output-dir>')
 game,prior,out=map(Path,sys.argv[1:]);b=(game/'mk2.exe').read_bytes();raw=prior.read_bytes();p=json.loads(raw)
 assert hashlib.sha256(b).hexdigest()==SHA and p['format']=='mk2_o110h_palette_handle_lifecycle_v1'
 addr=struct.pack('<I',GATE)
 all_operands=[i for i in range(BASE,END-3) if b[i:i+4]==addr]
 assert len(all_operands)==11 and all_operands==sorted(row[-1] for row in OP)
 entries=[]
 for name,at,kind,enc,operand in OP:
  data=bytes.fromhex(enc);assert b[at:at+len(data)]==data and operand==at+2
  entries.append({'name':name,'opcodePhysical':at,'operandPhysical':operand,
                  'kind':kind,'instructionBytes':enc,'widthBits':32})
 # Branch at O110C stage: when bit0 zero, no 0x659C6 call by 0x9E118.
 assert b[0x9e122:0x9e124]==bytes.fromhex('7473') and 0x9e124+0x73==0x9e197
 assert b[0x9e191]==0xe8 and 0x9e196+struct.unpack_from('<i',b,0x9e192)[0]==0x659c6
 # Conditional allocator path, different from a matching-pointer fast-path.
 assert b[0x7b445:0x7b44b]==bytes.fromhex('0f84ac000000')
 assert b[0x7b462:0x7b464]==bytes.fromhex('7423')
 assert b[0x7b48f:0x7b499]==bytes.fromhex('c705e063050001000000')
 report={'format':'mk2_o110l_render_gate_direct_operand_census_v1','status':'PASS_BOUNDED_SOURCE',
 'originalExeSHA256':SHA,'parentO110HSHA256':hashlib.sha256(raw).hexdigest(),
 'executableCodeFileRange':[BASE,END],'gateLinearAddress':GATE,
 'operandPhysicalOccurrences':all_operands,'occurrences':entries,
 'classifiedCounts':{'toggleLowBit':1,'setOne':2,'setZero':3,'testLowBit':5},
 'allocatorFreshPath':{'entryPhysical':0x7b439,'pointerMatchBypassBranch':0x7b445,
    'noFreeEntryGuardAt':0x7b462,'freshPaletteQueuedFlagWrite':0x7b48f,
    'gateClearPhysical':0x7b499,'clearsGateOnFreshAllocationPath':True,
    'pointerMatchFastPathClearsGate':False},
 'stageConsumer':{'entry':0x9e118,'testPhysical':0x9e118,'conditionalSkipAt':0x9e122,
    'skipTarget':0x9e197,'blitCallAt':0x9e191,'blitFunction':0x659c6,
    'rendererSkipsIfGateLowBitZero':True,'gateIsAlwaysEnabledInStage':False},
 'claims':{'directAddressOccurrenceCensusExactOnKnownCodeFileRange':True,
    'sharedMutableFlagBetweenPaletteAllocatorAndStageRenderer':True,
    'newPaletteRequestCanTemporarilyDisableStageRenderPath':True,
    'allMemoryAliasesAndIndirectWritesExcluded':True,
    'paletteSlotOneOwnershipDetermined':False,'actualStageVisibleDuringAnyParticularTick':False},
 'limitations':['Direct 32-bit absolute operand occurrences are not a complete alias/indirect-write inventory.',
    'Gate toggles and enables exist; runtime call scheduling and transient frame visibility are unobserved.',
    'This connects a render-enable flag, not the exact color record held in palette slot one.']}
 out.mkdir(parents=True,exist_ok=True);dst=out/'MK2_O110L_RENDER_GATE_CENSUS.json';dst.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','pass':'O110L','references':len(entries),'writes':6,'tests':5,'file':str(dst)}))
if __name__=='__main__':main()

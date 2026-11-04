#!/usr/bin/env python3
"""O110K: prove a reset follows an apparent default palette seed on a nested source path.

Static call/branch relationship only; no claim this path ran in DOSBox or
that a particular palette remains live after unqualified helper calls.
"""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
CALLS=[('index6_to_setup',0x779ea,0x64695),('setup_to_seed',0x64695,0x64659),
 ('seed_reset',0x64659,0x7b41f),('seed_palette_request',0x6466a,0x7b439),
 ('post_seed_helper',0x6466f,0x81b18),('tail_reset',0x66d51,0x7b41f),
 ('tail_helper',0x66d76,0x81b18),('index6_second_palette_request',0x779f4,0x7b439)]
BRANCHES=[('seed_tail_jump',0x64680,0x66d04),('setup_continuation_jump',0x646a1,0x6728b)]
WITNESSES=[('seed_input',0x64665,'b8c46c0200'),('source_seed_target',0x779ef,'b8c46c0200'),
 ('reset_body',0x7b427,'bf005b0700b97800000033c0f3ab'),
 ('setup_sequence',0x64659,'e8c16d0100c6053666070001b8c46c0200e8ca6d0100'),
 ('tail_reset_following',0x66d51,'e8c9460100b801000000a3da620700'),
 ('second_request_following',0x779f4,'e8403a0000e89bc5feff'),
 ('tail_return',0x66de4,'c3')]

def main():
 if len(sys.argv)!=4:raise SystemExit('usage: run <original-mk2-directory> <O110H-json> <output-dir>')
 game,prior,out=map(Path,sys.argv[1:]);b=(game/'mk2.exe').read_bytes();pb=prior.read_bytes();p=json.loads(pb)
 assert hashlib.sha256(b).hexdigest()==SHA and p['format']=='mk2_o110h_palette_handle_lifecycle_v1'
 assert p['entryTable']['resetTotalBytes']==480 and p['allocator']['entryPointPhysical']==0x7b439
 for _,at,dest in CALLS:assert b[at]==0xe8 and at+5+struct.unpack_from('<i',b,at+1)[0]==dest
 for _,at,dest in BRANCHES:assert b[at]==0xe9 and at+5+struct.unpack_from('<i',b,at+1)[0]==dest
 for _,at,x in WITNESSES:assert b[at:at+len(x)//2].hex()==x
 # Two verified reset sites bracket a request for the same palette object;
 # subsequent calls may modify the table, so its live slots cannot be asserted.
 assert 0x64659 < 0x6466a < 0x64680 and 0x66d04 < 0x66d51 < 0x66de4
 report={'format':'mk2_o110k_nested_reset_seed_invalidation_v1','status':'PASS_STATIC_CONTROL_PATH',
  'exeSHA256':SHA,'parentO110HSHA256':hashlib.sha256(pb).hexdigest(),
  'calls':[{'name':name,'at':at,'target':dst,'encoding':b[at:at+5].hex()} for name,at,dst in CALLS],
  'jumps':[{'name':name,'at':at,'target':dst,'encoding':b[at:at+5].hex()} for name,at,dst in BRANCHES],
  'witnesses':[{'name':name,'at':at,'hex':x} for name,at,x in WITNESSES],
  'timeline':['0x779EA conditional caller enters setup 0x64695',
   '0x64695 calls 0x64659: reset 0x7B41F, request record 0x26CC4',
   '0x64659 JMP 0x66D04; 0x66D51 resets the same 60-slot table again',
   '0x66D76 invokes a further helper before 0x66DE4 RET',
   'if this setup path returns, 0x779F4 requests record 0x26CC4 again'],
  'conditionalConclusion':{'nestedSetupReachesPreSeedRequest':True,
   'laterResetClearsEarlierSeedHandleState':True,'laterResetOccursAfterSeedOnNestedPath':True,
   'initialSeedGuaranteedLiveAtIndex6SecondRequest':False,
   'secondRequestGuaranteedHandleIndexOne':False,'allInterveningHelperSideEffectsKnown':False,
   'runtimeStageActivationObserved':False},
  'limits':['A second reset cancels any direct assumption that the initial palette request persists.',
   'Intervening calls may allocate palettes again; cannot infer final handles from static source order.',
   'Path is conditional upon caller activation and return. No observed DOSBox execution.']}
 out.mkdir(parents=True,exist_ok=True)
 dest=out/'MK2_O110K_RESET_SEED_INVALIDATION.json';dest.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','pass':'O110K','nestedResets':2,'reports':str(dest)}))
if __name__=='__main__':main()

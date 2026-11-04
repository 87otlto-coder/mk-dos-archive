#!/usr/bin/env python3
"""Independently re-read fixed source anchors for O153-O156, reject forged timing claims.
No imports of the report generator. External executable itself is mandatory.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path
CANON='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED={
'O153':{
 'schema':'mk2_o153_main_game_loop_frame_controller_join_v1',
 'sites':{0x62205:'e8eb4b0000',0x66df5:'60',0x66df6:'892534020300',0x66dfc:'e8c9e5ffff',0x66e01:'e834010000',0x66e06:'e8cee2ffff',0x66e17:'e806040000',0x66e2e:'ff05e0170300',0x66e34:'e817020000',0x66e39:'85f6',0x66e79:'e836010000',0x66eef:'f6403bff',0x66ef3:'0f8425ffffff'},
 'calls':{0x62205:0x66df5,0x66dfc:0x653ca,0x66e01:0x66f3a,0x66e06:0x650d9,0x66e17:0x67222,0x66e34:0x67050,0x66e79:0x66fb4},
 'limits':{'mainLoopSourceControlFlowProven':True,'liveBranchFrequencyMeasured':False,'animationFPSProven':False}},
'O154':{
 'schema':'mk2_o154_nonzero_scheduler_latch_and_word_decrement_v1',
 'sites':{0x670dd:'8b357c170300',0x670e3:'8b4624',0x670e6:'85c0',0x670e8:'74f3',0x670ea:'a30c5b0300',0x670ef:'d1e0',0x670f1:'8b1d105b0300',0x670f7:'03d8',0x670f9:'d1eb',0x670fb:'891d105b0300',0x67101:'c7462400000000',0x67108:'be045b0300',0x67152:'8b36',0x67158:'66ff4e06',0x6715c:'7ff4',0x67185:'ff661c'},
 'calls':{}, 'limits':{'nonzeroLatchAndClearProven':True,'counterIncrementWriterProven':False,'wallClockSecondsPerCounterProven':False,'perCountDisplayPresentProven':False}},
'O155':{
 'schema':'mk2_o155_runtime_input_structure_initialization_v1',
 'sites':{0x62072:'8bc0',0x62090:'b8da090000',0x62095:'e892fdffff',0x6209a:'a37c170300',0x6209f:'85c0',0x620ad:'a17c170300',0x620b2:'a334000300',0x620b7:'66c7400e0000',0x620c2:'66c740120000',0x61e35:'89c1',0x61e39:'ba00010000',0x61e41:'891424',0x61e4d:'b831000000',0x61e52:'e833c70300',0x61e6e:'8b3424',0x61ec8:'89f0'},
 'calls':{0x62095:0x61e2c,0x61e52:0x9e58a},
 'limits':{'pointerInitializationSourceProven':True,'memoryAllocServiceSourceProven':True,'counterProducerProven':False,'schedulerPeriodMeasured':False}},
'O156':{
 'schema':'mk2_o156_shutdown_pit_restore_and_loop_count_boundary_v1',
 'sites':{0x66e2e:'ff05e0170300',0x66eef:'f6403bff',0x66ef3:'0f8425ffffff',0x66ef9:'e8c9e3ffff',0x66efe:'fa',0x66eff:'b036',0x66f01:'e643',0x66f05:'66b80000',0x66f09:'e640',0x66f0d:'86c4',0x66f0f:'e640',0x66f11:'fb',0x66f12:'8b2534020300',0x66f18:'61',0x66f19:'c3'},
 'calls':{0x66ef9:0x652c7},
 'limits':{'originalPITShutdownInstructionsProven':True,'loopCountIsHardwareFPS':False,'PITShutdownFrameRateInferencePermitted':False}}
}
def verify(b,r):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=CANON:raise ValueError('Original fixture identity mismatch')
 if set(r)!=set(EXPECTED):raise ValueError('Missing or extra milestone reports')
 checks=0
 for key,c in EXPECTED.items():
  x=r[key]
  if x.get('schema')!=c['schema'] or x.get('canonicalOriginalSHA256')!=CANON or x.get('limits')!=c['limits']:
   raise ValueError(f'{key} forged provenance or runtime-limit metadata')
  checks+=3
  got={}
  for e in x.get('witnesses',[]):
   at=int(e['physical'],16);h=e['bytes'].lower()
   if at in got:raise ValueError('Repeated physical witness')
   got[at]=h
  if got!=c['sites']:raise ValueError(f'{key} wrong fixed instruction witness listing')
  # Crucially, compare independently fixed bytes with user-provided original EXE.
  for at,h in c['sites'].items():
   if b[at:at+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError(f'{key} source byte mismatch')
   checks+=1
  calls={int(xc['physical'],16):int(xc['targetPhysical'],16) for xc in x.get('originalDirectCalls',[])}
  if calls!=c['calls'] or len(calls)!=len(x.get('originalDirectCalls',[])):raise ValueError(f'{key} report forged call graph')
  for at,target in c['calls'].items():
   if b[at]!=0xe8 or at+5+struct.unpack_from('<i',b,at+1)[0]!=target:raise ValueError('Bad original relative call')
   checks+=1
  if len(x.get('sourceFacts',[]))<3:raise ValueError('Missing explicit evidence qualifications')
  checks+=1
 if r['O155']['requestedBytes']!=0x9da or r['O155']['pointerGlobalObject2']!=0x3177c or r['O155']['aliasGlobalObject2']!=0x30034 or r['O155']['counterField']!=0x24:raise ValueError('Forged shared input allocation metadata')
 checks+=4
 # Branch to existing game-loop body on nonexit.
 if b[0x66ef3:0x66ef5]!=bytes.fromhex('0f84') or 0x66ef9+struct.unpack_from('<i',b,0x66ef5)[0]!=0x66e1e:raise ValueError('Wrong back edge')
 checks+=1
 # O154's nonzero branch 0x670e8 -> same poll site 0x670dd, and task positive branch -> 0x67152.
 for at,back in ((0x670e8,0x670dd),(0x6715c,0x67152)):
  if at+2+struct.unpack_from('<b',b,at+1)[0]!=back:raise ValueError('Wrong scheduler branch')
  checks+=1
 # Verify 0x61E39 requests DPMI int31 function 0x0100, but do not imply exact IRQ callback.
 if struct.unpack_from('<I',b,0x61e3a)[0]!=0x100:raise ValueError('Unexpected allocation service')
 checks+=1
 return checks

def main():
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--report-dir',required=True);x=a.parse_args()
 r={k:json.loads((Path(x.report_dir)/f'{k}_REPORT.json').read_text()) for k in EXPECTED}
 print('PASS O153-O156 independent original MK2 code assertions:',verify(Path(x.exe).read_bytes(),r))
if __name__=='__main__':main()

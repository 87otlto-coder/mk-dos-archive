#!/usr/bin/env python3
"""O153-O156 narrow static findings; do not infer time, IRQ producer or observed playback."""
import argparse
import hashlib
import json
import struct
from pathlib import Path

SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
LENGTH=861133
# Physical file offsets, not DOSBox addresses. Anchors deliberately consist of complete
# instruction encodings with known boundaries, not free-floating numeric coincidences.
SITES={
'O153':{
 'entryIntoLoop':(0x62205,'e8eb4b0000'),
 'loopPusha':(0x66df5,'60'),
 'stashSavedStack':(0x66df6,'892534020300'),
 'graphicsSetup':(0x66dfc,'e8c9e5ffff'),
 'timerInit':(0x66e01,'e834010000'),
 'timerSetupCall':(0x66e06,'e8cee2ffff'),
 'loopSchedulerTaskSpawn':(0x66e17,'e806040000'),
 'loopCounterIncrement':(0x66e2e,'ff05e0170300'),
 'callFrameController':(0x66e34,'e817020000'),
 'testTaskExit':(0x66e39,'85f6'),
 'updateInput':(0x66e79,'e836010000'),
 'loopBackCheck':(0x66eef,'f6403bff'),
 'loopBackJump':(0x66ef3,'0f8425ffffff'),
},
'O154':{
 'counterHostRead':(0x670dd,'8b357c170300'),
 'counterValueRead':(0x670e3,'8b4624'),
 'nonzeroTest':(0x670e6,'85c0'),
 'zeroSpin':(0x670e8,'74f3'),
 'copyObservedInput':(0x670ea,'a30c5b0300'),
 'twiceObservedInput':(0x670ef,'d1e0'),
 'previousAccumulatorRead':(0x670f1,'8b1d105b0300'),
 'addInputToAccumulator':(0x670f7,'03d8'),
 'halveAccumulator':(0x670f9,'d1eb'),
 'storeAccumulator':(0x670fb,'891d105b0300'),
 'resetSharedCounter':(0x67101,'c7462400000000'),
 'startTaskScan':(0x67108,'be045b0300'),
 'taskNext':(0x67152,'8b36'),
 'taskCountdownDecrementWord':(0x67158,'66ff4e06'),
 'taskPositiveSkip':(0x6715c,'7ff4'),
 'resumeContinuation':(0x67185,'ff661c'),
},
'O155':{
 'initializeSharedInput':(0x62072,'8bc0'),
 'requestInputBytes':(0x62090,'b8da090000'),
 'callDOSMemoryService':(0x62095,'e892fdffff'),
 'saveReturnedPointer':(0x6209a,'a37c170300'),
 'testNullReturn':(0x6209f,'85c0'),
 'storeOtherRuntimeAlias':(0x620ad,'a17c170300'),
 'setSharedInputAlias':(0x620b2,'a334000300'),
 'initialKeyWordZero':(0x620b7,'66c7400e0000'),
 'secondKeyWordZero':(0x620c2,'66c740120000'),
 'servicePreservesSize':(0x61e35,'89c1'),
 'serviceDPMIFunction':(0x61e39,'ba00010000'),
 'serviceSetsFunctionInPacket':(0x61e41,'891424'),
 'serviceCallViaInt31':(0x61e4d,'b831000000'),
 'serviceCallToInvoker':(0x61e52,'e833c70300'),
 'serviceReadsReturnedBase':(0x61e6e,'8b3424'),
 'serviceReturnsPointer':(0x61ec8,'89f0'),
},
'O156':{
 'loopCountForDiagnostics':(0x66e2e,'ff05e0170300'),
 'loopAfterKeyboardProbe':(0x66eef,'f6403bff'),
 'repeatIfNotExited':(0x66ef3,'0f8425ffffff'),
 'shutdownVideo':(0x66ef9,'e8c9e3ffff'),
 'disableInterrupts':(0x66efe,'fa'),
 'reloadPITMode':(0x66eff,'b036'),
 'writePITMode':(0x66f01,'e643'),
 'zeroDivisorWord':(0x66f05,'66b80000'),
 'writeLowPIT':(0x66f09,'e640'),
 'swapDivisorBytes':(0x66f0d,'86c4'),
 'writeHighPIT':(0x66f0f,'e640'),
 'enableInterrupts':(0x66f11,'fb'),
 'restoreStack':(0x66f12,'8b2534020300'),
 'popRegisters':(0x66f18,'61'),
 'returnFromLoop':(0x66f19,'c3'),
}}
EDGES={
'O153':{0x62205:0x66df5,0x66dfc:0x653ca,0x66e01:0x66f3a,0x66e06:0x650d9,0x66e17:0x67222,0x66e34:0x67050,0x66e79:0x66fb4},
'O155':{0x62095:0x61e2c,0x61e52:0x9e58a},
'O156':{0x66ef9:0x652c7},
}
SCHEMAS={
'O153':('mk2_o153_main_game_loop_frame_controller_join_v1',{
 'sourceFacts':['Original startup path calls 0x66DF5 at 0x62205 after a preceding branch; path activation is not measured',
 'The main loop initializes source timer at 0x66F3A, creates a task via 0x67222, and calls frame controller 0x67050',
 'The main loop increments Object-2 0x317E0 once on each pass through 0x66E2E',
 'Conditional keyboard/status field check branches back into the main loop at 0x66E1E'],
 'limits':{'mainLoopSourceControlFlowProven':True,'liveBranchFrequencyMeasured':False,'animationFPSProven':False}}),
'O154':('mk2_o154_nonzero_scheduler_latch_and_word_decrement_v1',{
 'sourceFacts':['The frame controller busy polls pointer global 0x3177C, reading its field +0x24 until nonzero',
 'The observed DWORD is copied to 0x35B0C and contributes twice to an accumulator, which is right-shifted once and stored at 0x35B10',
 'The input +0x24 field is zeroed before scanning tasks from head 0x35B04',
 'Each reached task node decrements a 16-bit counter at +0x06 and skips if positive; source does not directly decrement a task N times according to the observed input value'],
 'limits':{'nonzeroLatchAndClearProven':True,'counterIncrementWriterProven':False,'wallClockSecondsPerCounterProven':False,'perCountDisplayPresentProven':False}}),
'O155':('mk2_o155_runtime_input_structure_initialization_v1',{
 'sourceFacts':['The original source requests a 0x09DA-byte allocation via helper 0x61E2C and stores returned pointer in Object-2 global 0x3177C',
 'On a nonzero return, the same pointer is stored as an additional runtime alias 0x30034',
 'The helper prepares a DPMI 0x0100 DOS-memory allocation request through an INT 31h invocation wrapper',
 'Source-backed initialization and pointer ownership do not identify the eventual writer of +0x24 or frequency of updates'],
 'requestedBytes':0x9da,'pointerGlobalObject2':0x3177c,'aliasGlobalObject2':0x30034,'counterField':0x24,
 'limits':{'pointerInitializationSourceProven':True,'memoryAllocServiceSourceProven':True,'counterProducerProven':False,'schedulerPeriodMeasured':False}}),
'O156':('mk2_o156_shutdown_pit_restore_and_loop_count_boundary_v1',{
 'sourceFacts':['One original conditional exit path calls routine 0x652C7 then programs PIT channel zero mode 3 with a zero divisor word',
 'This shutdown/reprogramming path brackets the earlier nonzero 0x4D9D PIT setup, but hardware wall-clock behavior was not captured',
 'The increment at 0x66E2E counts executed iterations of its loop path, not necessarily frames presented, scheduler updates or seconds'],
 'limits':{'originalPITShutdownInstructionsProven':True,'loopCountIsHardwareFPS':False,'PITShutdownFrameRateInferencePermitted':False}}),
}
def source_require(b):
 if len(b)!=LENGTH or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('Canonical original MK2.EXE required')

def report(b):
 source_require(b)
 out={}
 for key, sites in SITES.items():
  for name,(p,h) in sites.items():
   if b[p:p+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError(f'{key} failed source witness {name}')
  for p,target in EDGES.get(key,{}).items():
   if b[p]!=0xe8 or p+5+struct.unpack_from('<i',b,p+1)[0]!=target:raise ValueError(f'{key} failed original call edge {p:#x}')
  schema,fields=SCHEMAS[key]
  out[key]={'schema':schema,'canonicalOriginalSHA256':SHA,'witnesses':[{'name':n,'physical':f'0x{p:05X}','bytes':h} for n,(p,h) in sites.items()],
   'originalDirectCalls':[{'physical':f'0x{p:05X}','targetPhysical':f'0x{t:05X}'} for p,t in EDGES.get(key,{}).items()],**fields}
 return out

def main():
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--outdir',required=True);x=a.parse_args()
 dst=Path(x.outdir)
 if dst.exists():raise ValueError('Refuse existing output directory')
 r=report(Path(x.exe).read_bytes());dst.mkdir(parents=True)
 for name,d in r.items():(dst/f'{name}_REPORT.json').write_text(json.dumps(d,indent=2)+'\n')
 print('PASS O153-O156 original MK2 source evidence (IRQ producer/FPS unresolved)')
if __name__=='__main__':main()

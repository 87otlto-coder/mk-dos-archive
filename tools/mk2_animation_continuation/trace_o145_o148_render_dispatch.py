#!/usr/bin/env python3
"""O145-O148 narrow original MK2 rendering/scheduler source checkpoints.
Static EXE evidence only. Nothing here measures DOSBox runtime timing, pixels or visual order.
"""
import argparse, hashlib, json, struct
from pathlib import Path
HASH = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED = {
'O145': {
 'fetchActiveControlRoot':(0x93500,'8b15f65c0700'),
 'copyControlCursor':(0x93506,'8915985a0700'),
 'readTokenCursor':(0x93547,'8b0d985a0700'),
 'readSignedToken':(0x9354d,'8b01'),
 'positiveTokenBranch':(0x93559,'7931'),
 'positiveTokenObjectHeadPointer':(0x9358c,'8b31'),
 'dereferenceOffsetSource':(0x93591,'668b36'),
 'setRendererOffsetSource':(0x93594,'668935685a0700'),
 'loadObjectListRootFromToken':(0x935a1,'8be8'),
 'callObjectChainIterator':(0x935a3,'e8e8fdffff'),
 'followObjectNext':(0x93390,'8b6d00'),
 'objectNextLoopBranch':(0x93395,'0f8549feffff'),
 'readObjectDrawMetadata':(0x931e4,'0fb74530'),
 'opaqueSpriteDrawBackend':(0x93356,'e8a11ffdff'),
 'otherClippedSpriteDrawBackend':(0x93373,'e8841ffdff'),
 'specialSpriteDrawBackend':(0x933ba,'e83d1ffdff'),
 },
'O146': {
 'movementGate':(0x931f6,'f705885a0700ffffffff'),
 'readXVelocity':(0x93202,'8b5d10'),
 'advanceStoredX':(0x93205,'015d18'),
 'readYVelocity':(0x93208,'8b5d14'),
 'advanceStoredY':(0x9320b,'015d1c'),
 'drawGate':(0x9320e,'f705d462050001000000'),
 'readObjectPosition':(0x9321e,'8b7d1c'),
 'readShapeMeta':(0x93225,'8b4d2c'),
 'objectFlagBit0Branch':(0x93228,'f7453401000000'),
 'shapeBit14Branch':(0x93231,'66f745240040'),
 'subtractDrawOriginFirst':(0x93239,'662b3d685a0700'),
 'subtractDrawOriginSecond':(0x93243,'662b3d6a5a0700'),
 'multiPartFlagBranch':(0x93253,'f7453402000000'),
 'multiPartSkipFlagBranch':(0x9325c,'f7453420000000'),
 'startDescriptorArray':(0x93269,'8b553c'),
 'nextDescriptor':(0x93272,'8b159c740700'),
 'advanceDescriptorCursor':(0x9337c,'83059c7407000c'),
 'maybeRepeatMultiPart':(0x93383,'f7453402000000'),
 },
'O147': {
 'acceptedSurfaceA':(0x652fc,'813d2a66070024650500'),
 'acceptedSurfaceB':(0x65308,'813d2a660700245f0600'),
 'surfaceFailureBranch':(0x65314,'e9a7000000'),
 'heightOrWidthZeroClip':(0x65319,'67e3df'),
 'physicalResourceSelector':(0x6532f,'8bde'),
 'resourceIdFromTopByte':(0x65331,'c1eb18'),
 'handleTableLookup':(0x6533e,'8b9c2b34f40200'),
 'resourceOffsetMask':(0x65349,'81e6ffffff00'),
 'resourceBaseAddition':(0x6534f,'03f3'),
 'paletteSelectorLowWord':(0x65351,'0fb7e8'),
 'paletteAddModeBranch':(0x65357,'f6c208'),
 'rowBufferPointerLookup':(0x65386,'8b3cbde4570300'),
 'rasterDispatchJumpTable':(0x653b0,'ff2495a8090000'),
 'lazyResourceResolveCall':(0x653b8,'e89bd2ffff'),
 },
'O148': {
 'schedulerIncomingGate':(0x670dd,'8b357c170300'),
 'schedulerClockWord':(0x670e3,'8b4624'),
 'schedulerInputClear':(0x67101,'c7462400000000'),
 'schedulerHeadAddress':(0x67108,'be045b0300'),
 'yieldReturnAddressCapture':(0x6710f,'5a'),
 'yieldSaveCounterWord':(0x67110,'66894606'),
 'yieldSaveResumeAddress':(0x67114,'89561c'),
 'yieldSaveObjectPointer':(0x6713b,'897e18'),
 'headNextTask':(0x67152,'8b36'),
 'countdownWordDecrement':(0x67158,'66ff4e06'),
 'stillWaitingBranch':(0x6715c,'7ff4'),
 'resumeOriginalLocalFrame':(0x6715e,'8b6e08'),
 'restoreSelectedObject':(0x67182,'8b7e18'),
 'resumeSavedContinuation':(0x67185,'ff661c'),
 'newTaskInitialCountdown':(0x67242,'66c740060100'),
 },
}
CALLS = {'O145': {0x935a3:0x93390, 0x93356:0x652fc, 0x93373:0x652fc, 0x933ba:0x652fc},
'O147': {0x653b8:0x62658}}
RESULTS = {
'O145': {'schema':'mk2_o145_positive_stream_render_chain_v1','validatedPath':[
 'main stage control dispatch reads token from dynamic cursor 0x75A98',
 'positive stream token supplies an Object-2 linked-list head address into EBP',
 'entry 0x93390 dereferences +0x00 next and loops over render object nodes at 0x931E4',
 'conditional object draw branches call original raster dispatcher 0x652FC',
 ], 'limits':{'staticRenderingPathEstablished':True,'liveStreamTargetEstablished':False,'crossListDrawOrderEstablished':False,'visibleFramesObserved':False}},
'O146': {'schema':'mk2_o146_render_step_motion_gates_v1','validatedPath':[
 'when mutable global 0x75A88 equals zero, object +0x10 increments 32-bit +0x18 and +0x14 increments 32-bit +0x1C',
 'object +0x34 flag bit 0 and shape +0x24 bit 14 gate branch selecting position-origin subtraction',
 'global 0x562D4 bit 0 gates sprite draw path; other flag bits select single/multipart handling',
 'render list traversal can update positions and emit sprites, but task/screen cadence is not known',
 ], 'limits':{'conditionalObjectDisplacementProven':True,'perSecondVelocityKnown':False,'runtimeObjectFlagsKnown':False,'finalScreenPlacementKnown':False}},
'O147': {'schema':'mk2_o147_lowlevel_raster_dispatch_v1','validatedPath':[
 '0x652FC accepts two original framebuffer-base values stored in global 0x7662A and rejects others',
 'high 8 bits of ESI packed resource handle select source entry from table 0x2F434; low 24 bits select resource-relative byte offset',
 'missing resource base invokes resolver 0x62658; palette-mode bit branch and row pointer lookup precede computed jump table',
 'raster backend uses dynamic draw and palette inputs and is not a proof of an actual observed framebuffer',
 ], 'limits':{'drawConsumerOriginalCodeLinked':True,'actualPaletteSelectionKnown':False,'observedRasterFrameVerified':False,'allRLEVariantsDecodedFromThisPath':False}},
'O148': {'schema':'mk2_o148_scheduler_wakeup_chain_v1','validatedPath':[
 'scheduler inspects an upstream +0x24 word and resets that input after observed nonzero',
 'scheduler follows task head at 0x35B04 and decrements a signed task +0x06 word',
 'positive remaining counter skips task; nonpositive counter restores local frame, saved task state, EDI render object, and jumps saved continuation',
 'yield saves countdown, continuation address and render object; object creation seeds countdown to one',
 ], 'limits':{'taskResumeDispatchEstablished':True,'upstreamTickSourceProven':False,'wallClockSchedulerFrequencyProven':False,'gameplayFPSProven':False}},
}
def validate_source(data):
 if len(data)!=861133 or hashlib.sha256(data).hexdigest()!=HASH: raise ValueError('Canonical MK2.EXE required; modified binaries rejected')
 for name, entries in EXPECTED.items():
  for label,(at,sig) in entries.items():
   raw=bytes.fromhex(sig)
   if data[at:at+len(raw)]!=raw: raise ValueError(f'{name}: instruction mismatch at {at:#x}, {label}')
 for name, refs in CALLS.items():
  for at,dest in refs.items():
   if data[at]!=0xe8 or at+5+struct.unpack_from('<i',data,at+1)[0]!=dest: raise ValueError(f'{name}: direct CALL mismatch {at:#x}')
 return True

def produce(data):
 validate_source(data)
 out={}
 for passid, details in RESULTS.items():
  out[passid]={**details,'originalEXESHA256':HASH,
   'codeEvidence':[{ 'label':label,'physicalFileOffset':f'0x{at:05X}','originalBytes':s } for label,(at,s) in EXPECTED[passid].items()],
   'directRelativeCalls':[{'at':f'0x{at:05X}','target':f'0x{dst:05X}'} for at,dst in CALLS.get(passid,{}).items()]}
 return out

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--outdir',required=True);args=ap.parse_args()
 b=Path(args.exe).read_bytes();result=produce(b)
 d=Path(args.outdir)
 if d.exists():raise ValueError('Output directory already exists; refusing overwrite')
 d.mkdir(parents=True)
 for name,obj in result.items(): (d/f'{name}_REPORT.json').write_text(json.dumps(obj,indent=2)+'\n')
 print('PASS original O145-O148 source witnesses and direct call targets')
if __name__=='__main__':main()

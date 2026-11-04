#!/usr/bin/env python3
"""Independent second-pass source/report checker for O145-O150. Does not import producer."""
import argparse, hashlib, json, struct
from pathlib import Path
KNOWN_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# These address inventories and behavior-critical opcode forms were transcribed separately
# from the original code, without loading any producer symbols.
MAP={
'O145':('mk2_o145_positive_stream_render_chain_v1',
 [0x93500,0x93506,0x93547,0x9354d,0x93559,0x9358c,0x93591,0x93594,0x935a1,0x935a3,0x93390,0x93395,0x931e4,0x93356,0x93373,0x933ba],
 {0x935a3:0x93390,0x93356:0x652fc,0x93373:0x652fc,0x933ba:0x652fc},
 {'staticRenderingPathEstablished':True,'liveStreamTargetEstablished':False,'crossListDrawOrderEstablished':False,'visibleFramesObserved':False}),
'O146':('mk2_o146_render_step_motion_gates_v1',
 [0x931f6,0x93202,0x93205,0x93208,0x9320b,0x9320e,0x9321e,0x93225,0x93228,0x93231,0x93239,0x93243,0x93253,0x9325c,0x93269,0x93272,0x9337c,0x93383],{},
 {'conditionalObjectDisplacementProven':True,'perSecondVelocityKnown':False,'runtimeObjectFlagsKnown':False,'finalScreenPlacementKnown':False}),
'O147':('mk2_o147_lowlevel_raster_dispatch_v1',
 [0x652fc,0x65308,0x65314,0x65319,0x6532f,0x65331,0x6533e,0x65349,0x6534f,0x65351,0x65357,0x65386,0x653b0,0x653b8],{0x653b8:0x62658},
 {'drawConsumerOriginalCodeLinked':True,'actualPaletteSelectionKnown':False,'observedRasterFrameVerified':False,'allRLEVariantsDecodedFromThisPath':False}),
'O148':('mk2_o148_scheduler_wakeup_chain_v1',
 [0x670dd,0x670e3,0x67101,0x67108,0x6710f,0x67110,0x67114,0x6713b,0x67152,0x67158,0x6715c,0x6715e,0x67182,0x67185,0x67242],{},
 {'taskResumeDispatchEstablished':True,'upstreamTickSourceProven':False,'wallClockSchedulerFrequencyProven':False,'gameplayFPSProven':False}),
'O149':('mk2_o149_stage_frame_render_presentation_task_gate_v1',
 [0x67050,0x67057,0x6705c,0x67068,0x67071,0x6707b,0x67080,0x67085,0x6708c,0x67098,0x670a2,0x670a7,0x670ac,0x670b1,0x670bd,0x670c2,0x670c7,0x670d3,0x670d8,0x670dd],
 {0x67057:0x935e6,0x6707b:0x933c2,0x67080:0x7b30b,0x67085:0x65420,0x670a2:0x933c2,0x670a7:0x7b30b,0x670ac:0x65420,0x670bd:0x933c2,0x670c2:0x7b30b,0x670d3:0x7b30b,0x670d8:0x65420},
 {'renderPresentTaskSourceSequenceVerified':True,'activeModeKnown':False,'sourceTickToWallSecondsKnown':False,'liveSceneOrObjectActivationKnown':False}),
'O150':('mk2_o150_vga_vertical_retrace_buffer_present_v1',
 [0x7b30b,0x7b325,0x7b329,0x7b32a,0x7b32c,0x7b33a,0x7b341,0x65420,0x65441,0x65446,0x6544b,0x65465,0x6546a,0x6546f,0x654b1,0x654b6,0x654bb,0x654c0,0x654e9,0x65521,0x65524,0x65526],
 {0x6544b:0x65521,0x6546f:0x65521,0x654c0:0x65a54,0x654e9:0x65a54},
 {'staticVgaPollingVerified':True,'staticVideoBufferTransferVerified':True,'measuredDisplayHzKnown':False,'frameAdvancePeriodInSecondsKnown':False,'screenCapturePixelParityKnown':False}),
}
REQUIRED={
'O145':{0x93559:'7931',0x9358c:'8b31',0x93390:'8b6d00',0x931e4:'0fb74530'},
'O146':{0x93205:'015d18',0x9320b:'015d1c',0x9320e:'f705d462050001000000',0x9337c:'83059c7407000c'},
'O147':{0x65331:'c1eb18',0x65349:'81e6ffffff00',0x653b0:'ff2495a8090000'},
'O148':{0x67110:'66894606',0x67158:'66ff4e06',0x6715c:'7ff4',0x67185:'ff661c'},
'O149':{0x67050:'8335d462050001',0x67068:'833d4c01030003',0x670c7:'f705d462050001000000'},
'O150':{0x7b325:'66bada03',0x7b329:'ec',0x7b32a:'a808',0x7b32c:'74fb',0x65446:'bf00000a00',0x65521:'b1c8'},
}
def check(exe, data):
 if len(exe)!=861133 or hashlib.sha256(exe).hexdigest()!=KNOWN_SHA:raise ValueError('Unmodified original MK2.EXE required')
 results={}
 for p,(schema,places,calls,qual) in MAP.items():
  if p not in data:raise ValueError('Report missing '+p)
  item=data[p]
  if item.get('schema')!=schema:raise ValueError('Wrong schema '+p)
  if item.get('originalEXESHA256',item.get('canonicalSHA256'))!=KNOWN_SHA:raise ValueError('Wrong provenance '+p)
  actual_qual=item.get('limits',item.get('limitations'))
  if actual_qual!=qual:raise ValueError('Unsupported confidence/limitations '+p)
  witnesses=item.get('codeEvidence',item.get('instructionWitnesses'))
  if not isinstance(witnesses,list) or len(witnesses)!=len(places):raise ValueError('Missing/extra witnesses '+p)
  keyed={}
  for w in witnesses:
   at=int(w.get('physicalFileOffset',w.get('physical')),16)
   if at in keyed:raise ValueError('Duplicate witness '+p)
   h=w.get('originalBytes',w.get('bytes')); raw=bytes.fromhex(h)
   if not raw or exe[at:at+len(raw)]!=raw:raise ValueError('Witness original bytes mismatch '+p)
   keyed[at]=h.lower()
  if set(keyed)!=set(places):raise ValueError('Wrong original code sites '+p)
  for at,sig in REQUIRED[p].items():
   if keyed[at]!=sig or exe[at:at+len(bytes.fromhex(sig))]!=bytes.fromhex(sig):raise ValueError('Independent opcode check '+p)
  refs=item.get('directRelativeCalls',item.get('callTargets'))
  if len(refs)!=len(calls):raise ValueError('Wrong number of original calls '+p)
  found={}
  for c in refs:
   at=int(c['at'],16); target=int(c['target'],16)
   if at in found:raise ValueError('Duplicate call '+p)
   if exe[at]!=0xe8 or at+5+struct.unpack_from('<i',exe,at+1)[0]!=target:raise ValueError('Invalid source call '+p)
   found[at]=target
  if found!=calls:raise ValueError('Call graph mismatch '+p)
  # Static evidence never grants a timing or runtime implication.
  facts=' '.join(item.get('validatedPath',item.get('sourceFacts',[]))).lower()
  for forbidden in ['measured 60 fps','verified 60 fps','observed at 60 fps','runtime-tested','runtime-verified']:
   if forbidden in facts:raise ValueError('Fake runtime certification '+p)
  results[p]=len(places)+len(calls)+len(qual)+len(REQUIRED[p])
 return results

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--report-dir',required=True);a=ap.parse_args()
 d=Path(a.report_dir);data={p:json.loads((d/f'{p}_REPORT.json').read_text()) for p in MAP}
 results=check(Path(a.exe).read_bytes(),data)
 print('PASS independent O145-O150:',sum(results.values()),'source/provenance/qualification checks',results)
if __name__=='__main__':main()

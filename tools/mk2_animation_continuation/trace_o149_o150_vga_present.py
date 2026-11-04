#!/usr/bin/env python3
"""O149-O150 original render/VSYNC/present dispatch; static provenance, not wall-clock timing."""
import argparse, hashlib, json, struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
INS={
'O149':{
 'toggleRenderGate':(0x67050,'8335d462050001'),
 'cleanupOriginalLists':(0x67057,'e88ac50200'),
 'checkUpdateEnable':(0x6705c,'f705f25c0700ffffffff'),
 'specialMode3Gate':(0x67068,'833d4c01030003'),
 'specialMode3SetsRenderGate':(0x67071,'c705d462050001000000'),
 'mode3OriginalDraw':(0x6707b,'e842c30200'),
 'mode3VideoSync':(0x67080,'e886420100'),
 'mode3Present':(0x67085,'e896e3ffff'),
 'modeAlternativeGate':(0x6708c,'f705e0630500ffffffff'),
 'modeAlternativeSetsRenderGate':(0x67098,'c705d462050001000000'),
 'alternativeOriginalDraw':(0x670a2,'e81bc30200'),
 'alternativeVideoSync':(0x670a7,'e85f420100'),
 'alternativePresent':(0x670ac,'e86fe3ffff'),
 'alternativeResetsRenderGate':(0x670b1,'c705d462050000000000'),
 'defaultOriginalDraw':(0x670bd,'e800c30200'),
 'defaultVideoSync':(0x670c2,'e844420100'),
 'conditionalPresentGate':(0x670c7,'f705d462050001000000'),
 'defaultVideoSyncWithoutDraw':(0x670d3,'e833420100'),
 'defaultPresent':(0x670d8,'e843e3ffff'),
 'schedulerGate':(0x670dd,'8b357c170300'),
 },
'O150':{
 'videoSyncModeGate':(0x7b30b,'f705e85c070000800000'),
 'vgaStatusPortLoad':(0x7b325,'66bada03'),
 'readVgaInputStatus':(0x7b329,'ec'),
 'testVgaVerticalRetraceBit':(0x7b32a,'a808'),
 'waitForRetraceLoop':(0x7b32c,'74fb'),
 'vgaPaletteIndexPort':(0x7b33a,'bac8030000'),
 'vgaPaletteOutput':(0x7b341,'ee'),
 'mode3PresentationSwitch':(0x65420,'833d4c01030003'),
 'mode3CopySourceA':(0x65441,'be24650500'),
 'videoApertureAddressA':(0x65446,'bf00000a00'),
 'mode3CopyA':(0x6544b,'e8d1000000'),
 'mode3CopySourceB':(0x65465,'be245f0600'),
 'videoApertureAddressB':(0x6546a,'bf00000a00'),
 'mode3CopyB':(0x6546f,'e8ad000000'),
 'otherModeDualCopyA':(0x654b1,'be24650500'),
 'otherModeDualCopyB':(0x654b6,'bf245f0600'),
 'videoApertureAddressC':(0x654bb,'bd00000a00'),
 'otherModeTransfer':(0x654c0,'e88f050000'),
 'otherModeTransferReverse':(0x654e9,'e866050000'),
 'copyRoutine':(0x65521,'b1c8'),
 'copyDwordLoad':(0x65524,'8b06'),
 'copyDwordStore':(0x65526,'8907'),
 }}
CALLS={'O149':{0x67057:0x935e6,0x6707b:0x933c2,0x67080:0x7b30b,0x67085:0x65420,0x670a2:0x933c2,0x670a7:0x7b30b,0x670ac:0x65420,0x670bd:0x933c2,0x670c2:0x7b30b,0x670d3:0x7b30b,0x670d8:0x65420},
'O150':{0x6544b:0x65521,0x6546f:0x65521,0x654c0:0x65a54,0x654e9:0x65a54}}
SEM={
'O149':{'schema':'mk2_o149_stage_frame_render_presentation_task_gate_v1', 'sourceFacts':[
 'the frame-driver toggles renderer gate 0x562D4 bit0 and calls routine 0x935E6 before optional draw',
 'mode value 3 and a second runtime-condition branch explicitly set renderer gate bit0, then call renderer 0x933C2 -> sync 0x7B30B -> present 0x65420',
 'another control branch conditionally presents following draw/sync based on current renderer gate',
 'all branches reach a scheduler input gate inspecting dynamic pointer at 0x3177C +0x24',
 ],'limitations':{'renderPresentTaskSourceSequenceVerified':True,'activeModeKnown':False,'sourceTickToWallSecondsKnown':False,'liveSceneOrObjectActivationKnown':False}},
'O150':{'schema':'mk2_o150_vga_vertical_retrace_buffer_present_v1','sourceFacts':[
 'video-sync routine loads VGA input-status port 0x03DA, polls bit 3 until asserted on its default path',
 'other video-sync path depends on a mode flag and can alter control flow before the VGA poll',
 'mode-3 present routine copies from either internal buffer at 0x56524 or 0x65F24 toward video aperture 0xA0000, with a selected source swap',
 'other present path calls 0x65A54 with both internal buffers and video-aperture pointer; exact visual result not measured',
 'palette DAC port 0x03C8 and 0x03C9 writes also occur conditionally within sync path',
 ],'limitations':{'staticVgaPollingVerified':True,'staticVideoBufferTransferVerified':True,'measuredDisplayHzKnown':False,'frameAdvancePeriodInSecondsKnown':False,'screenCapturePixelParityKnown':False}}
}
def produce(b):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('Original canonical MK2.EXE required')
 for p,items in INS.items():
  for label,(at,h) in items.items():
   if b[at:at+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError(f'{p} opcode {label} {at:#x}')
 for p,calls in CALLS.items():
  for at,dest in calls.items():
   if b[at]!=0xe8 or at+5+struct.unpack_from('<i',b,at+1)[0]!=dest:raise ValueError(f'{p} call {at:#x}')
 return {p:{**meta,'canonicalSHA256':SHA,
   'instructionWitnesses':[{'label':k,'physical':f'0x{a:05X}','bytes':h} for k,(a,h) in INS[p].items()],
   'callTargets':[{'at':f'0x{at:05X}','target':f'0x{t:05X}'} for at,t in CALLS[p].items()]} for p,meta in SEM.items()}
def main():
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--outdir',required=True);args=a.parse_args()
 out=Path(args.outdir)
 if out.exists():raise ValueError('Refuse overwrite')
 r=produce(Path(args.exe).read_bytes());out.mkdir(parents=True)
 for p,v in r.items():(out/f'{p}_REPORT.json').write_text(json.dumps(v,indent=2)+'\n')
 print('PASS O149-O150 original render-present and conditional VGA sync paths')
if __name__=='__main__':main()

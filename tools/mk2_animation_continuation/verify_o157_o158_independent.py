#!/usr/bin/env python3
"""Independent O157/O158 DOS vector/IRQ join audit. Does not import producer."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SITE={
0x61f0d:'ba00020000',0x61f12:'b831000000',0x61f1e:'e867c60300',0x61f23:'8b442408',0x61f2a:'8b44240c',
0x61f45:'b901020000',0x61f5b:'b831000000',0x61f63:'e822c60300',0x62090:'b8da090000',
0x62095:'e892fdffff',0x6209a:'a37c170300',0x620f3:'b808000000',0x62108:'b809000000',
0x62126:'b81b000000',0x6213a:'b824000000',0x6214e:'a17c170300',0x62155:'c1e804',
0x62158:'31db',0x6215a:'6689c2',0x6215d:'b808000000',0x62171:'bb03000000',
0x6218d:'bb07000000',0x621a9:'bb06000000',0x621c5:'bb06000000',0x62205:'e8eb4b0000',
0x66e01:'e834010000',0x66f60:'66b89d4d',0x670dd:'8b357c170300',0x670e3:'8b4624',
0x67101:'c7462400000000'}
GET={0x620f8:8,0x6210d:9,0x62121:0x23,0x62135:0x1b,0x62149:0x24}
SET={0x62162:(8,0),0x6217e:(9,3),0x6219a:(0x24,7),0x621b6:(0x23,6),0x621d2:(0x1b,6)}
CALLS={0x61f1e:0x9e58a,0x61f63:0x9e58a,0x62095:0x61e2c,0x62205:0x66df5,0x66e01:0x66f3a,**{x:0x61f00 for x in GET},**{x:0x61f38 for x in SET}}
L157={'sourceVectorGetSetCallsVerified':True,'vector08TimerCandidateSourceLinked':True,'originalIRQHandlerInstructionsDecoded':False,'liveInterruptDeliveryObserved':False,'counterFieldWriterEstablished':False}
L158={'timerVectorAndInputStructureSourceJoined':True,'PITIRQ8ToCounterFieldDataflowProven':False,'actualPITTickFrequencyCaptured':False,'animationFPSEstablished':False}
def verify(b,r):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('Source fixture mismatch')
 if set(r)!={'O157','O158'}:raise ValueError('Missing or extra result')
 x,y=r['O157'],r['O158']
 if x.get('schema')!='mk2_o157_real_mode_vector_snapshot_and_installer_v1' or y.get('schema')!='mk2_o158_original_timer_vector_pit_scheduler_static_join_v1':raise ValueError('Unqualified schema')
 if x.get('originalExeSHA256')!=SHA or y.get('originalExeSHA256')!=SHA or x.get('limits')!=L157 or y.get('limits')!=L158:raise ValueError('False source or IRQ timing claim')
 checks=6
 for rep in (x,y):
  a=rep.get('sourceAnchors')
  if len(a)!=len(SITE) or len({int(z['physical'],16) for z in a})!=len(SITE):raise ValueError('Incomplete source anchor table')
  if {int(z['physical'],16):z['bytes'].lower() for z in a}!=SITE:raise ValueError('Bad report bytes')
  for at,h in SITE.items():
   if b[at:at+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('Original opcode mismatch')
   checks+=1
 for at,target in CALLS.items():
  if b[at]!=0xe8 or at+5+struct.unpack_from('<i',b,at+1)[0]!=target:raise ValueError('Invalid original call')
  checks+=1
 if x.get('helperFunctions')!={'getRealModeVectorDPMI':0x200,'setRealModeVectorDPMI':0x201,'wrappedInterrupt':0x31}:raise ValueError('Wrong DPMI functions')
 checks+=3
 observed_get={int(z['callAtPhysical'],16):z['vector'] for z in x.get('savedVectors',[])}
 observed_set={int(z['callAtPhysical'],16):(z['vector'],z['handlerOffset']) for z in x.get('installedVectors',[])}
 if observed_get!=GET or len(observed_get)!=len(x['savedVectors']):raise ValueError('Wrong saved vector map')
 if observed_set!=SET or len(observed_set)!=len(x['installedVectors']):raise ValueError('Wrong installed vector map')
 for z in x['savedVectors']:
  if z['getVectorHelperPhysical']!='0x61F00':raise ValueError('Wrong getter helper')
  checks+=1
 for z in x['installedVectors']:
  if z['setterHelperPhysical']!='0x61F38' or z['segmentExpression']!='low16((pointerGlobal0x3177C >>> 4))':raise ValueError('Fake real-mode pointer')
  checks+=1
 if y.get('join')!={'allocatedSharedInputPointerObject2':0x3177c,'allocatedInputBytes':0x9da,
 'realModeTimerVector':8,'installedHandlerOffset':0,'originalTimerInitPhysical':0x66f3a,
 'PITDivisor':0x4d9d,'schedulerCounterStructOffset':0x24,'frameDriverPollPhysical':0x670dd,'mainLoopPhysical':0x66df5}:
  raise ValueError('Bad static IRQ/timer join')
 if len(y.get('sourceFacts',[]))!=3:raise ValueError('Missing source qualification')
 checks+=11
 return checks
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--report-dir',required=True);v=a.parse_args()
 print('PASS O157-O158 independent vector and scheduler assertions:',verify(Path(v.exe).read_bytes(),{k:json.loads((Path(v.report_dir)/f'{k}_REPORT.json').read_text()) for k in ('O157','O158')}))

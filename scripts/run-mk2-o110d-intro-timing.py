#!/usr/bin/env python3
"""Verified execution-path scheduler-tick cadence for native MK2 Acclaim and Probe LZW intros."""
import sys,json,zipfile,struct,hashlib,io
from pathlib import Path
from PIL import Image
exePath=Path(sys.argv[1]);native=Path(sys.argv[2]);o110b=Path(sys.argv[3]);out=Path(sys.argv[4]);out.mkdir(exist_ok=True,parents=True)
exe=exePath.read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
resource_names=exe[0xa0ef1:0xa13a7].split(b'\0')
assert resource_names[0x28]==b'PROBE.GRA' and resource_names[0x2a]==b'ACCLAIM.GRA'
expected={0x98cbd:'b80000002a',0x98cce:'b864000000',0x98cec:'b800000028',0x98d14:'b864000000',0x98d1e:'b91d000000',0x98d3d:'b801000000',0x98d51:'b864000000',0x98d4f:'e2d2',0x6710f:'5a6689460689561c',0x67158:'66ff4e067ff4'}
for pos,code in expected.items():assert exe[pos:pos+len(code)//2].hex()==code,(hex(pos),'code mismatch')
def call(addr,tgt):assert exe[addr]==0xe8 and addr+5+struct.unpack_from('<i',exe,addr+1)[0]==tgt,(hex(addr),hex(tgt))
for a,t in [(0x98cc2,0x62658),(0x98cc9,0x98c45),(0x98cd3,0x6710f),(0x98cf1,0x62658),(0x98d07,0x98c56),(0x98d19,0x6710f),(0x98d30,0x98c56),(0x98d42,0x6710f),(0x98d56,0x6710f),(0x98cae,0x627a4)]:call(a,t)
assert 0x98d51 + 0 == 0x98d51 and 0x98d51 !=0x98d4f
probe=(native/'probe.gra').read_bytes();acclaim=(native/'acclaim.gra').read_bytes()
with zipfile.ZipFile(o110b) as z:
 m=json.loads(z.read('MANIFEST_O110B.json'))
 assert sha(probe)==m['resources']['probe.gra']['sourceSha256']
 assert sha(acclaim)==m['resources']['acclaim.gra']['sourceSha256']
 pframes=m['resources']['probe.gra']['frames']
 assert len(pframes)==1+exe[0x98d1f]==30
 palette=z.read('probe/palette_555_CANDIDATE.rgb24')
 assert len(palette)==768
 records=[];imgs=[];total=0
 for i,frame in enumerate(pframes):
  idx=z.read(frame['pixelMember']);assert len(idx)==64000 and sha(idx)==frame['pixelsSha256']
  n=100 if i==0 else 101 if i==29 else 1
  rec=dict(frame=i,sourceHeaderOffset=frame['frameHeaderStart'],idxSHA256=sha(idx),startSchedulerTick=total,nominalTicksUntilNextTransition=n,waitCallSites=[0x98d19] if i==0 else [0x98d42,0x98d56] if i==29 else [0x98d42],meaning='conditional normal-control-flow schedule, NOT wall-clock')
  records.append(rec);total+=n
  im=Image.frombytes('P',(320,200),idx);im.putpalette(palette);imgs.append(im)
 assert total==229
 timing={'format':'mk2_o110d_source_intrinsics_intro_scheduler_cadence_v1','fixtureExeSHA256':sha(exe),'prologue':{'acclaimResourceID':0x2a,'acclaimOneImage':True,'acclaimWaitTicks':100,'probeResourceID':0x28,'probeImageCount':30,'probeInitialWaitTicks':100,'probeAdditionalIterations':29,'probeWaitBetweenSubsequentFramesTicks':1,'probeTerminalWaitTicks':100,'nominalProbeTotalSchedulerTicks':229},'scheduler':{'routine':0x6710f,'storesWordDelayToProcessState':0x67110,'savesReturnAddressForContinuation':0x67114,'ticksDecrementSite':0x67158,'important':'These are scheduler ticks and conditional code-path waits; no seconds, hertz, or unconditional runtime execution established.'},'probeFrames':records,'palette':{'source':'PROBE.GRA 16-bit palette words from O110B','rgb555Interpretation':'candidate, not runtime DAC proof'},'inferencesNotQualified':['frames per second','game startup path unconditionally executes','exact visible wall-clock duration','palette live DAC state','other game video modes']}
 outjson=out/'MK2_PROBE_ACCLAIM_NATIVE_SCHEDULER_CADENCE_O110D.json';outjson.write_text(json.dumps(timing,indent=2)+'\n')
 # Optional illustrative timing conversion. 1 scheduler tick = 20 ms here is a *viewer-selected* scale only.
 ms=20
 msdur=[r['nominalTicksUntilNextTransition']*ms for r in records]
 gif=out/'MK2_PROBE_SOURCE_CADENCE_DIAGNOSTIC_20MS_PER_TICK_O110D.gif'
 imgs[0].save(gif,save_all=True,append_images=imgs[1:],duration=msdur,disposal=2,optimize=False)
 test=Image.open(gif);assert test.n_frames==30
 for i,duration in enumerate(msdur):test.seek(i);assert test.info['duration']==duration,(i,duration,test.info.get('duration'))
 print(json.dumps({'status':'SOURCE_BOUNDED','exeSHA256':sha(exe),'acclaimWaitTicks':100,'probeFrames':30,'probeTicks':229,'probeFirstHoldTicks':100,'probeInterFrameTicks':1,'probeFinalHoldTicks':101,'timeline':str(outjson),'diagnosticGif':str(gif),'gifSHA256':sha(gif.read_bytes())},indent=2))

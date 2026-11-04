#!/usr/bin/env python3
"""Independent original-executable and native indexed-image audit for intro scheduler timing exports."""
import sys,json,zipfile,hashlib,struct,io
from pathlib import Path
from PIL import Image
exe=Path(sys.argv[1]).read_bytes();game=Path(sys.argv[2]);asset=Path(sys.argv[3]);timeline=json.loads(Path(sys.argv[4]).read_text());gif=Image.open(sys.argv[5]);sha=lambda b:hashlib.sha256(b).hexdigest();checks=0
def ck(c,m):
 global checks
 checks+=1
 if not c:raise AssertionError(m)
def inst(p,s):ck(exe[p:p+len(s)//2].hex()==s,f'inst {p:x}')
def rel(p,t):ck(exe[p]==0xe8 and p+5+struct.unpack_from('<i',exe,p+1)[0]==t,f'call {p:x}')
ck(sha(exe)==timeline['fixtureExeSHA256'],'binary sha')
names=exe[0xa0ef1:0xa13a7].split(b'\0');ck(names[40]==b'PROBE.GRA' and names[42]==b'ACCLAIM.GRA','resource id mapping')
for at,immediate in [(0x98cbd,0x2a000000),(0x98cec,0x28000000),(0x98cce,100),(0x98d14,100),(0x98d3d,1),(0x98d51,100)]:ck(exe[at]==0xb8 and exe[at+1:at+5]==struct.pack('<I',immediate),f'imm {at:x}')
ck(exe[0x98d1e]==0xb9 and exe[0x98d1f:0x98d23]==struct.pack('<I',29),'29 additional frames')
inst(0x98d4f,'e2d2');inst(0x6710f,'5a6689460689561c');inst(0x67158,'66ff4e067ff4')
for p,t in [(0x98cc2,0x62658),(0x98cc9,0x98c45),(0x98cd3,0x6710f),(0x98cf1,0x62658),(0x98d07,0x98c56),(0x98d19,0x6710f),(0x98d30,0x98c56),(0x98d42,0x6710f),(0x98d56,0x6710f),(0x98cae,0x627a4)]:rel(p,t)
with zipfile.ZipFile(asset) as z:
 m=json.loads(z.read('MANIFEST_O110B.json'));probe=m['resources']['probe.gra'];acclaim=m['resources']['acclaim.gra'];ck(len(probe['frames'])==30 and len(acclaim['frames'])==1,'exact frame counts')
 ck(sha((game/'probe.gra').read_bytes())==probe['sourceSha256'],'original probe')
 ck(sha((game/'acclaim.gra').read_bytes())==acclaim['sourceSha256'],'original acclaim')
 ck(timeline['prologue']['acclaimWaitTicks']==100,'acclaim wait')
 ck(timeline['prologue']['probeImageCount']==30 and timeline['prologue']['probeAdditionalIterations']==29,'loop details')
 ck(timeline['prologue']['nominalProbeTotalSchedulerTicks']==229,'full delay sum')
 ck(len(timeline['probeFrames'])==30 and gif.n_frames==30,'frame count')
 pal=z.read('probe/palette_555_CANDIDATE.rgb24');ck(len(pal)==768,'palette raw 256')
 start=0
 for i,(e,record) in enumerate(zip(probe['frames'],timeline['probeFrames'])):
  expectedWait=100 if i==0 else 101 if i==29 else 1
  ck(record['frame']==i and record['sourceHeaderOffset']==e['frameHeaderStart'],'order and offsets '+str(i))
  ck(record['startSchedulerTick']==start and record['nominalTicksUntilNextTransition']==expectedWait,'tick window '+str(i))
  ck(record['waitCallSites']==([0x98d19] if i==0 else [0x98d42,0x98d56] if i==29 else [0x98d42]),'wait call site '+str(i))
  start+=expectedWait
  original=z.read(e['pixelMember']);ck(sha(original)==record['idxSHA256']==e['pixelsSha256'],'source pixels '+str(i))
  gif.seek(i);ck(gif.info['duration']==expectedWait*20,'illustrative gif timing '+str(i))
  # Compare every GIF RGB pixel to the original indexed pixels and their original candidate RGB555 conversion.
  picture=gif.convert('RGB').tobytes();ck(len(picture)==len(original)*3,'pixel dimensions '+str(i))
  for j,p in enumerate(original):
   ck(picture[j*3:j*3+3]==pal[3*p:3*p+3],f'RGB pixel {i}:{j}')
 ck(start==229,'end of scheduling interval')
print(json.dumps({'verdict':'PASS','checks':checks,'sourceFrames':30,'nominalSchedulerTicks':start,'gifMillisPerTick':'20 chosen for display only, not DOS timing'},indent=2))

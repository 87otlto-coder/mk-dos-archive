#!/usr/bin/env python3
"""O115: conservative, screenshot-grounded MK2 Y-ruler + indexed floor ramp witnesses.

Assumptions: 2x horizontally/vertically screenshot-scaled picture, fixed gameplay
capture, O113 source patterns and O114 two-point index witnesses. Results are
conditional observations, NOT native VGA DAC dumps, camera RAM, or palette handles.
"""
from __future__ import annotations
import argparse,hashlib,json
from collections import Counter
from pathlib import Path
from PIL import Image

Y_BITS='0000001000011000101000111001001011001101001111010101110110111111'
STAGE={
 'tomb': {'lo':2,'hi':51,'rows':48,'zero':(93,36,12),'one':(52,12,12),'rampAnchor':(223,230)},
 'portal':{'lo':3,'hi':80,'rows':40,'zero':(36,4,4),'one':(101,69,36),'rampAnchor':(42,49)},
}

def metadata(path):
 im=Image.open(path).convert('RGB')
 return im,{'imageName':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'imageDimensions':list(im.size),'nativeFrame':im.size==(320,200)}


def y_fit(path:Path,stage:str):
 im,m=metadata(path);w,h=im.size;s=STAGE[stage];c0=s['zero'];c1=s['one']
 # Need >60% of floor pixels recognized, >90% purity after fighter occlusion.
 rows=[]
 for y in range(int(h*.76),h):
  colors=[im.getpixel((x,y)) for x in range(10,w-10,2)]
  n0=colors.count(c0);n1=colors.count(c1);known=n0+n1
  if known/len(colors)<.60 or max(n0,n1)/max(known,1)<.90:continue
  rows.append((y,0 if n0>n1 else 1,known,len(colors)))
 candidates=[]
 for origin in range(int(h*.60),int(h*.90)):
  valid=[(y,bit,known) for y,bit,known,_ in rows if 0<=((y-origin)//2)<s['rows']]
  if len(valid)<30:continue
  agree=sum(known for y,bit,known in valid if int(Y_BITS[(y-origin)//2])==bit)
  total=sum(known for _,_,known in valid)
  candidates.append((agree/total,origin,len(valid),agree,total))
 candidates.sort(reverse=True)
 best=candidates[0] if candidates else None
 # Recognize strong, uniquely located calibrated source sequence. Offsets differing
 # by 1 produce alias in scaled pixels; more-distant maxima must fall short.
 second=max((c[0] for c in candidates if abs(c[1]-best[1])>2),default=0) if best else None
 recognized=bool(best and best[0]>=.97 and best[2]>=30 and best[0]-second>=.035)
 result={'schema':'mk2_o115_y_ruler_witness_v1','stage':stage,'input':m,
   'colorForSourceBit0':list(c0),'colorForSourceBit1':list(c1),
   'sourceYBits':Y_BITS[:s['rows']],'sourceRowCount':s['rows'],
   'model':'display row y maps to source row floor((y - origin) / 2); 2x scale assumption',
   'eligibleImageRows':len(rows),'candidateStartImageRow':best[1] if best else None,
   'bestBitAgreement':round(best[0],6) if best else None,
   'distantCompetitorAgreement':round(second,6) if second is not None else None,
   'matchedImageRows':best[2] if best else 0,
   'rulerRecognized':recognized,
   'nativeScreenYEstimate':round(best[1]/2,2) if recognized else None,
   'limitations':['2x-scaled cropped screenshot; alignment is conditional','no live camera or palette RAM',
      'occlusion suppresses some floor rows','no subpixel/native-row calibration']}
 return result


def ramp_fit(path:Path,stage:str):
 im,m=metadata(path);w,h=im.size;s=STAGE[stage];lo,hi=s['lo'],s['hi'];period=hi-lo+1
 # Use previously witnessed (and now independently observable) anchor sequence:
 # index-max strip must immediately precede index-min strip in repeating ramp.
 anchor_start,anchor_end=s['rampAnchor']
 # Validate color witnesses over the lower clear floor, not fighter occlusion.
 sample_rows=list(range(h-9,h-3))
 anchors=[]
 for x in range(10,w-17):
  # equal 8-pixel bands with exact swatches in their interior
  before=[im.getpixel((q,y)) for y in sample_rows for q in range(x-6,x-2)]
  after=[im.getpixel((q,y)) for y in sample_rows for q in range(x+2,x+6)]
  if not before or not after:continue
  if sum(p==s['one'] for p in before)/len(before)>=.98 and sum(p==s['zero'] for p in after)/len(after)>=.98:
   anchors.append(x)
 # Distinct starts can be several pixels apart due sample positions: resolve true
 # transition by an exact 8-wide run of source low-index swatch.
 candidates=[]
 for x in range(8,w-7):
  if all(im.getpixel((q,y))==s['zero'] for y in sample_rows for q in range(x,x+8)) and \
     all(im.getpixel((q,y))==s['one'] for y in sample_rows for q in range(x-8,x)):
   candidates.append(x)
 # Candidate source-index run starts must recur at the documented full period.
 confirmed=[]
 for x in candidates:
  peers=[v for v in candidates if v!=x and (v-x)%(8*period)==0]
  if peers or (len(candidates)==1):confirmed.append(x)
 if not confirmed:confirmed=candidates
 anchor=min(confirmed,key=lambda v:abs(v-anchor_start)) if confirmed else None
 entries={}
 if anchor is not None:
  for i in range(lo,hi+1):
   samples=[];xs=[]
   for x in range(9 if stage=='tomb' else 3,w-8):
    if ((x-anchor)//8)%period!=(i-lo):continue
    # Sample just interior pixels, away from both stripe boundaries.
    if (x-anchor)%8 not in (2,3,4,5):continue
    xs.append(x)
    for y in sample_rows:samples.append(im.getpixel((x,y)))
   if not samples:continue
   colors=Counter(samples);rgb,n=colors.most_common(1)[0]
   entries[str(i)]={'observedRGB':list(rgb),'dominantFraction':round(n/len(samples),6),
     'sampledPixels':len(samples),'screenXMin':min(xs),'screenXMax':max(xs),
     'qualified':n/len(samples)>=.99 and len(samples)>=24}
 qualified=all(v['qualified'] for v in entries.values()) and len(entries)==period
 witnessed=(entries.get(str(lo),{}).get('observedRGB')==list(s['zero']) and
            entries.get(str(hi),{}).get('observedRGB')==list(s['one']))
 # Independent same-frame sequence consistency check: all sampled interior pixels
 # near bottom should be one dominant color per index, via each mapped entry.
 distinct=len({tuple(v['observedRGB']) for v in entries.values()})
 result={'schema':'mk2_o115_ramp_color_witness_v1','stage':stage,'input':m,
   'sourcePattern':'source byte = minByte + ((column // 4) % domainSize)',
   'sourceIndexDomain':[lo,hi],'sourceIndexCount':period,
   'imagePixelsPerSourceIndex':8,'captureSampleRows':[min(sample_rows),max(sample_rows)],
   'sourceMinimumAnchorStarts':candidates,'chosenMinimumAnchor':anchor,
   'observableSourceColumnStartModulo':((-(anchor//2))%(4*period)) if anchor is not None else None,
   'anchorRgbConfirmation':witnessed,'qualifiedIndexCount':sum(v['qualified'] for v in entries.values()),
   'completeObservedColorTable':qualified and witnessed,'distinctObservedRGB':distinct,'indexToObservedColor':entries,
   'limitations':['these are RGB values seen under current DOSBox scene conditions, not VGA DAC register reads',
     'does not identify palette handle/allocator ownership','4-source-byte index steps and approximate 2x screenshot scaling',
     'a sampled color is not proof of stable mapping across frames or other fights/stages']}
 return result


def main():
 p=argparse.ArgumentParser();p.add_argument('image',type=Path);p.add_argument('--stage',choices=STAGE,required=True)
 p.add_argument('--kind',choices=('y','ramp'),required=True);p.add_argument('--out',type=Path)
 a=p.parse_args();res=(y_fit if a.kind=='y' else ramp_fit)(a.image,a.stage)
 if a.out:
  if a.out.exists():raise FileExistsError(a.out)
  a.out.write_text(json.dumps(res,indent=2)+'\n')
 print(json.dumps({k:v for k,v in res.items() if k!='indexToObservedColor'},indent=2))
if __name__=='__main__':main()

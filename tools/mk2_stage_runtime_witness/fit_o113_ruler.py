#!/usr/bin/env python3
"""O114: image-grounded, conditional X-ruler witness fitting for MK2 screenshots.

Does not infer actual MK2 camera RAM, global palette or native VGA coordinates.
Depends only on Pillow. Native DOSBox screenshots remain preferred.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
from statistics import median

# De Bruijn B(2,5), documented in the source-side O113 calibration generator.
RULER='00000100011001010011101011011111'
CELL=28
SOURCE_WIDTH=896
VIEWPORT_WIDTH=320
# Original O110Z runtime swatches, corroborated in the O113 samples.
# Order is arbitrary until polarity/source assignment is inferred by the fit.
STAGES={
 'tomb':{'resource':'tomb.gra','minIndex':2,'maxIndex':51,
         'colors':((93,36,12),(52,12,12))},
 'portal':{'resource':'portal.gra','minIndex':3,'maxIndex':80,
           'colors':((101,69,36),(36,4,4))},
}

def fit(path: Path, stage:str, *, row_stride:int=2, source_start_max:int=576):
 try:from PIL import Image
 except ImportError as exc:raise RuntimeError('Install Pillow: pip install pillow') from exc
 if stage not in STAGES:raise ValueError('stage must be tomb or portal')
 if not (type(row_stride)==int and row_stride>=1):raise ValueError('invalid row stride')
 image_bytes=path.read_bytes()
 img=Image.open(path).convert('RGB');w,h=img.size
 if w<300 or h<150:raise ValueError('screenshot is too small')
 colors=STAGES[stage]['colors']
 x_native=[min(319,int((x+0.5)*320/w)) for x in range(w)]
 expected=[bytes(int(RULER[(s+x)//CELL]) for x in x_native)
           for s in range(source_start_max+1)]
 records=[]
 for y in range(max(0,int(h*.69)),h,row_stride):
  rgb=[img.getpixel((x,y)) for x in range(w)]
  known_x=[x for x,c in enumerate(rgb) if c==colors[0] or c==colors[1]]
  if len(known_x)<max(140,int(w*.30)):continue
  observed=bytes(0 if rgb[x]==colors[0] else 1 for x in known_x)
  candidates=[]
  for s,pred in enumerate(expected):
   matched=sum(pred[x]==val for x,val in zip(known_x,observed))
   direct=matched;inverted=len(known_x)-matched
   if inverted>direct:candidates.append((inverted,s,'inverted'))
   else:candidates.append((direct,s,'direct'))
  first=max(candidates)
  chosen=[t for t in candidates if t[1]==first[1]][0]
  match,s,pol=chosen
  second=max((t[0] for t in candidates if abs(t[1]-s)>12),default=0)
  score=match/len(known_x); separation=(match-second)/len(known_x)
  qualifies=score>=.90 and separation>=.045
  records.append({'imageRow':y,'sourceLeftEstimate':s,
                  'coverage':round(len(known_x)/w,5),
                  'matchingPixels':match,'knownPixels':len(known_x),
                  'matchFraction':round(score,5),
                  'distantRunnerUpFraction':round(second/len(known_x),5),
                  'separationFraction':round(separation,5),
                  'colorToRulerBit':pol,'qualified':qualifies})
 strong=[r for r in records if r['qualified']]
 # Independent pixels on many screen rows and a substantial floor footprint
 # are required to claim ruler recognition. Offset remains conditional.
 qualified=len(strong)>=10 and len(strong)>=int(len(records)*.30) if records else False
 polarity=Counter(r['colorToRulerBit'] for r in strong)
 coherent=bool(strong) and len(polarity)==1
 if not coherent:qualified=False
 offset_span=[min(r['sourceLeftEstimate'] for r in strong),max(r['sourceLeftEstimate'] for r in strong)] if strong else None
 d={'schema':'mk2_o114_x_ruler_screenshot_evidence_v1',
    'stage':stage,'sourceImageName':path.name,'sourceImageSha256':hashlib.sha256(image_bytes).hexdigest(),
    'imageDimensions':[w,h],'nativeScreenshot':(w,h)==(320,200),
    'widthNormalization':'physical-x times 320 / screenshot-width; screen crop is not corrected',
    'floorScanStartRow':int(h*.69),'pixelSwatches':[list(c) for c in colors],
    'maxFitSourceOffset':source_start_max,'analyzedRows':len(records),
    'qualifiedRows':len(strong),'offsetSpanOnQualifiedRows':offset_span,
    'medianOffsetOnQualifiedRows':median([r['sourceLeftEstimate'] for r in strong]) if strong else None,
    'medianMatchFraction':round(median([r['matchFraction'] for r in strong]),5) if strong else None,
    'medianSeparationFraction':round(median([r['separationFraction'] for r in strong]),5) if strong else None,
    'observedPolarity':polarity.most_common(1)[0][0] if coherent else None,
    'patternRecognized':bool(qualified),
    'inferredRgbForRawIndex':None,
    'limitations':['observed pattern alignment is not an MK2 live camera RAM read',
                   'non-native/cropped screenshots may bias absolute column values',
                   'only two source bytes tested; no whole-palette inference',
                   'values apply to this visible floor under this gameplay configuration'],
    'rows':records}
 if qualified:
  # For source bit 0, the chosen RGB depends on fit polarity.
  color0,color1=colors
  rgb0,rgb1=(color0,color1) if d['observedPolarity']=='direct' else (color1,color0)
  d['inferredRgbForRawIndex']={str(STAGES[stage]['minIndex']):list(rgb0),str(STAGES[stage]['maxIndex']):list(rgb1)}
 return d

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('image');p.add_argument('--stage',required=True,choices=tuple(STAGES));p.add_argument('--out');a=p.parse_args()
 d=fit(Path(a.image),a.stage)
 if a.out:
  out=Path(a.out)
  if out.exists():raise FileExistsError(out)
  out.write_text(json.dumps(d,indent=2)+'\n')
 print(json.dumps({k:v for k,v in d.items() if k!='rows'},indent=2))

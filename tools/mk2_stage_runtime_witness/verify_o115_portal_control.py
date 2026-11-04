#!/usr/bin/env python3
"""O115B: reconstruct original Portal control screenshot from original GRA and O115 ramp RGB.

Requires user-owned original mk2.zip and the original O114 control screenshot.
The 2x physical picture projection is a fit model, not a live camera read.
Pillow required; no NumPy required. Original game files are read-only.
"""
from __future__ import annotations
import argparse,hashlib,json,zipfile
from pathlib import Path
from PIL import Image

PORTAL_SHA='cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'

def original_portal(archive:Path):
 with zipfile.ZipFile(archive) as z:
  matches=[n for n in z.namelist() if n.lower().endswith('/portal.gra')]
  if len(matches)!=1:raise ValueError('Expected exactly one original portal.gra resource')
  data=z.read(matches[0])
 if hashlib.sha256(data).hexdigest()!=PORTAL_SHA:raise ValueError('Original Portal resource SHA256 mismatch')
 return data[-40*896:]

def fit(source:bytes,screen:Path,ramp_report:Path,*,offset_x=range(577),origins=range(312,329)):
 im=Image.open(screen).convert('RGB');w,h=im.size
 report=json.loads(ramp_report.read_text());pal={int(k):tuple(v['observedRGB']) for k,v in report['indexToObservedColor'].items()}
 if report['sourceIndexDomain']!=[3,80] or not report['completeObservedColorTable']:
  raise ValueError('O115 78-entry Portal ramp report required')
 sx=list(range(230,400,4));sy=list(range(335,387,3))
 nx=[min(319,int((x+.5)*320/w)) for x in sx]
 observed=[[im.getpixel((x,y)) for x in sx] for y in sy]
 candidates=[]
 for starty in origins:
  if not all(0<=(y-starty)//2<40 for y in sy):continue
  rr=[(y-starty)//2 for y in sy]
  for startx in offset_x:
   matched=0
   for i,row in enumerate(rr):
    for j,col in enumerate(nx):
     raw=source[row*896+startx+col]
     if pal.get(raw)==observed[i][j]:matched+=1
   candidates.append((matched,startx,starty))
 candidates.sort(reverse=True)
 bestmatch,bx,by=candidates[0]
 def score_region(xa,xb,ya,yb,step=2):
  yes=0;total=0;unique=set()
  for y in range(ya,yb,step):
   row=(y-by)//2
   if row<0 or row>=40:continue
   for x in range(xa,xb,step):
    cx=min(319,int((x+.5)*320/w))
    rgb=im.getpixel((x,y));pred=pal.get(source[row*896+bx+cx])
    unique.add(rgb);yes+=(rgb==pred);total+=1
  return {'matchingPixels':yes,'sampledPixels':total,'fraction':round(yes/total,6),
          'distinctObservedRGB':len(unique)}
 runner_up=max((a for a in candidates if abs(a[1]-bx)>1 or abs(a[2]-by)>1),default=None)
 return {'schema':'mk2_o115_original_portal_control_cross_capture_reconstruction_v1',
  'sourcePortalSHA256':PORTAL_SHA,'controlScreenshot':screen.name,
  'controlScreenshotSHA256':hashlib.sha256(screen.read_bytes()).hexdigest(),
  'rampScreenshotSHA256':report['input']['sha256'],
  'fitObservation':'original packed Portal floor bytes + O115 independent 78-entry source-byte -> observed RGB table',
  'pixelScaleModel':'screen x -> floor((x+.5)*320/imageWidth); sourceRow = floor((screenY - screenshotOrigin)/2)',
  'screenshotImageDimensions':[w,h],
  'bestConditionalSourceLeft':bx,'bestConditionalSourceRow0ImageY':by,
  'fitRegion':{'x':[min(sx),max(sx)],'y':[min(sy),max(sy)],
               'matchedPixels':bestmatch,'sampledPixels':len(sx)*len(sy),
               'fraction':round(bestmatch/(len(sx)*len(sy)),6),
               'bestDistantCandidateMatchedPixels':runner_up},
  'heldOutRegions':{
    'centralUnoccluded':score_region(230,400,335,387),
    'fullFloorWithFighters':score_region(20,620,335,387),
    'lowerFrameWithFighters':score_region(20,620,380,391),
    'leftUnoccluded':score_region(0,80,335,387)},
  'limitations':['source camera and stage floor origin are inferred from screenshots, not emulated RAM',
                 'this verifies Portal floor output under a particular game scene, not entire level composition',
                 'uses separate screenshots (O114 control and O115 index ramp), not a stable global palette guarantee',
                 'requires original unmodified commercial MK2 game resource not distributed in source']}

def main():
 p=argparse.ArgumentParser();p.add_argument('--original-mk2',type=Path,required=True)
 p.add_argument('--control',type=Path,required=True);p.add_argument('--ramp-report',type=Path,required=True)
 p.add_argument('--out',type=Path);a=p.parse_args()
 d=fit(original_portal(a.original_mk2),a.control,a.ramp_report)
 if a.out:
  if a.out.exists():raise FileExistsError(a.out)
  a.out.write_text(json.dumps(d,indent=2)+'\n')
 print(json.dumps(d,indent=2))
if __name__=='__main__':main()

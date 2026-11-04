#!/usr/bin/env python3
"""O117: original Tomb control cross-capture source reconstruction.

Only authenticated user-provided TOMB.GRA and pinned O115 ramp witness are accepted.
The model measures *screenshot relative* pixel alignment, not game camera RAM or
VGA DAC ownership. The screenshot is a 637x397 2x DOSBox image cropped at edges.
No source file is modified. The fitting region and disjoint validation regions
are deliberately separate so a high training match alone cannot certify output.
"""
from __future__ import annotations
import argparse, hashlib, json, zipfile
from pathlib import Path
from PIL import Image

TOMB_SHA = 'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'
RAMP_SHA = '3015abb40e57ffbc449d110c855b0b6c25d0074e77742988ce352dfbc2f7ebdb'
SCREEN_SHA = '5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9'
STRIDE=896;ROWS=48

def sha(b):return hashlib.sha256(b).hexdigest()

def inputs(gamezip:Path,screenshot:Path,ramp:Path):
 with zipfile.ZipFile(gamezip) as z:
  candidates=[n for n in z.namelist() if n.lower().endswith('/tomb.gra')]
  if len(candidates)!=1:raise ValueError('Expected exactly one TOMB.GRA')
  original=z.read(candidates[0])
 if sha(original)!=TOMB_SHA:raise ValueError('Unrecognized/corrupted TOMB.GRA')
 witness=ramp.read_bytes()
 if sha(witness)!=RAMP_SHA:raise ValueError('O115 ramp report changed')
 report=json.loads(witness)
 if report.get('sourceIndexDomain')!=[2,51] or report.get('completeObservedColorTable') is not True:raise ValueError('Incomplete O115 witness')
 if report.get('input',{}).get('sha256')!='30e1b00ba361e40a791dffd3d10abdbc2cf77402cacee78f6d07676ae0b83791':raise ValueError('Wrong screenshot provenance')
 colors={int(k):tuple(v['observedRGB']) for k,v in report['indexToObservedColor'].items()}
 if set(colors)!=set(range(2,52)):raise ValueError('Missing O115 color indices')
 src=original[-ROWS*STRIDE:]
 screen_bytes=screenshot.read_bytes()
 if sha(screen_bytes)!=SCREEN_SHA:raise ValueError('Unexpected original Tomb screenshot')
 im=Image.open(screenshot).convert('RGB')
 if im.size!=(637,397):raise ValueError('Screenshot geometry mismatch')
 return src,colors,im

def score(source,colors,im,pts,left,origin,model='literal2x'):
 w=im.width;n=0
 for x,y in pts:
  col=(x//2) if model=='literal2x' else int((x+.5)*320/w)
  row=(y-origin)//2
  if not (0<=row<ROWS and 0<=left+col<STRIDE):raise ValueError('Sample out of bounds')
  idx=source[row*STRIDE+left+col]
  n+=colors.get(idx)==im.getpixel((x,y))
 return n

def regions():
 # Calibration excludes fighters and uses neither of the held-out regions.
 train=[(x,y) for y in range(340,370,3) for x in range(259,381,4)]
 left=[(x,y) for y in range(339,396) for x in range(10,81)]
 center=[(x,y) for y in range(370,396) for x in range(245,395)]
 right=[(x,y) for y in range(339,396) for x in range(550,625)]
 assert not (set(train)&set(left+center+right))
 return train,{'leftUnoccluded':left,'centerUnoccluded':center,'rightUnoccluded':right}

def fit(gamezip,screenshot,ramp):
 source,colors,im=inputs(gamezip,screenshot,ramp)
 train,held=regions()
 candidates=[]
 for startrow in range(310,328):
  for startcol in range(270,310):
   n=score(source,colors,im,train,startcol,startrow)
   candidates.append((n,startcol,startrow))
 candidates.sort(key=lambda a:(-a[0],abs(a[1]-291),abs(a[2]-318)))
 best,source_left,origin=candidates[0]
 if best!=len(train) or (source_left,origin)!=(291,318):raise ValueError('Expected exact witness alignment not recovered')
 heldreports={}
 for label,points in held.items():
  n=score(source,colors,im,points,source_left,origin)
  heldreports[label]={'matched':n,'total':len(points),'fraction':round(n/len(points),6)}
 total=sum(v['total'] for v in heldreports.values());matched=sum(v['matched'] for v in heldreports.values())
 if matched!=total:raise ValueError('Held-out cross-capture validation failed')
 neg={
  'wrongSourceLeftMinus1':score(source,colors,im,[p for a in held.values() for p in a],source_left-1,origin),
  'wrongSourceLeftPlus1':score(source,colors,im,[p for a in held.values() for p in a],source_left+1,origin),
  'wrongFloorOriginMinus1':score(source,colors,im,[p for a in held.values() for p in a],source_left,origin-1),
  'wrongFloorOriginPlus1':score(source,colors,im,[p for a in held.values() for p in a],source_left,origin+1),
  'incorrectProportionalWidthModel':score(source,colors,im,[p for a in held.values() for p in a],source_left,origin,'proportional'),
 }
 if max(neg.values())>=total:raise ValueError('At least one negative-control model fit all held-out pixels')
 return {
  'schema':'mk2_o117_tomb_original_control_cross_capture_v1',
  'qualification':'SCREENSHOT_RELATIVE_2X_FLOOR_MATCH_NOT_GAME_CAMERA_REGISTER_OR_VGA_BANK',
  'originalTombSHA256':TOMB_SHA,'o115RampReportSHA256':RAMP_SHA,
  'originalGameplayScreenshotSHA256':SCREEN_SHA,'screenshotDimensions':[im.width,im.height],
  'verifiedScreenshotGeometry':'literal floor(x/2) native column, cropped 637-wide 2x gameplay screenshot',
  'observedStartSourceColumn':source_left,'floorSourceRow0AtScreenshotY':origin,
  'training':{'matched':best,'total':len(train),'region':'x=259..379 step4; y=340..367 step3'},
  'disjointHeldOutRegions':heldreports,'heldOutTotal':{'matched':matched,'total':total,'fraction':round(matched/total,6)},
  'negativeControlMatchedPixels':neg,
  'invariants':{'sourceStride':STRIDE,'sourceRows':ROWS,'originalSourceUnmodified':True,'paletteColorWitnessDomain':[2,51]},
  'limitations':[
   'Floor only: full background, actors and other scene layers excluded',
   'Start column is a conditional screenshot alignment; not a camera RAM reading',
   'O115 RGB witness is a tested-palette observation; not an identified VGA palette bank',
   'The 637 pixel screenshot is not equivalent to a 320x200 raw DOSBox frame',
   'Source crop is frame-specific and may change with camera movement',
  ],
 }

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--original-mk2',type=Path,required=True)
 ap.add_argument('--control',type=Path,required=True);ap.add_argument('--ramp-report',type=Path,required=True)
 ap.add_argument('--out',type=Path);a=ap.parse_args()
 d=fit(a.original_mk2,a.control,a.ramp_report)
 if a.out:
  if a.out.exists():raise FileExistsError(a.out)
  a.out.write_text(json.dumps(d,indent=2)+'\n')
 print(json.dumps(d,indent=2))
if __name__=='__main__':main()

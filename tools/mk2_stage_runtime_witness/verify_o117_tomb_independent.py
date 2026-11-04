#!/usr/bin/env python3
"""Independent O117 report verifier: original bytes + screenshot + pinned O115 witnesses.
Does not import the producer's fitting, sampling, or validation functions.
"""
from __future__ import annotations
import argparse, hashlib, json, zipfile
from pathlib import Path
from PIL import Image

TOMB='be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'
RAMP='3015abb40e57ffbc449d110c855b0b6c25d0074e77742988ce352dfbc2f7ebdb'
SCREEN='5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9'

def digest(b):return hashlib.sha256(b).hexdigest()

def verify_report(doc,gamezip,control,ramp):
 with zipfile.ZipFile(gamezip) as z:
  matches=[x for x in z.namelist() if x.lower().endswith('/tomb.gra')]
  assert len(matches)==1
  raw=z.read(matches[0])
 assert digest(raw)==TOMB and len(raw)==63776+896*48
 assert digest(control.read_bytes())==SCREEN and digest(ramp.read_bytes())==RAMP
 witness=json.loads(ramp.read_text())
 assert witness['completeObservedColorTable'] and witness['sourceIndexDomain']==[2,51]
 rgb={int(k):bytes(v['observedRGB']) for k,v in witness['indexToObservedColor'].items()}
 assert len(rgb)==50 and set(rgb)==set(range(2,52))
 image=Image.open(control).convert('RGB'); assert image.size==(637,397)
 image_pixels=image.tobytes()
 assert doc['schema']=='mk2_o117_tomb_original_control_cross_capture_v1'
 assert doc['originalTombSHA256']==TOMB
 assert doc['o115RampReportSHA256']==RAMP and doc['originalGameplayScreenshotSHA256']==SCREEN
 assert doc['screenshotDimensions']==[637,397]
 assert doc['qualification']=='SCREENSHOT_RELATIVE_2X_FLOOR_MATCH_NOT_GAME_CAMERA_REGISTER_OR_VGA_BANK'
 assert doc['observedStartSourceColumn']==291 and doc['floorSourceRow0AtScreenshotY']==318
 assert doc['invariants']['originalSourceUnmodified'] is True
 assert doc['invariants']['sourceStride']==896 and doc['invariants']['sourceRows']==48
 assert doc['invariants']['paletteColorWitnessDomain']==[2,51]
 assert len(doc['limitations'])>=4
 # Separate per-pixel auditor, no producer imports or confidence shortcuts.
 source=memoryview(raw)[63776:]
 def tally(x0,x1,y0,y1,crop,origin,stepx=1,stepy=1,stretch=False):
  count=0;matches=0
  for iy in range(y0,y1,stepy):
   sr=(iy-origin)//2
   assert 0<=sr<48
   for ix in range(x0,x1,stepx):
    sx=int((ix+.5)*320/637) if stretch else ix//2
    index=source[sr*896+crop+sx]
    pred=rgb[index]
    p=(iy*637+ix)*3
    if image_pixels[p:p+3]==pred:matches+=1
    count+=1
  return matches,count
 selection={
  'leftUnoccluded':(10,81,339,396),
  'centerUnoccluded':(245,395,370,396),
  'rightUnoccluded':(550,625,339,396),
 }
 total=matched=0
 for key,bounds in selection.items():
  got,quantity=tally(*bounds,291,318)
  assert doc['disjointHeldOutRegions'][key]=={'matched':got,'total':quantity,'fraction':1.0}
  matched+=got;total+=quantity
 assert (matched,total)==(12222,12222)
 assert doc['heldOutTotal']=={'matched':matched,'total':total,'fraction':1.0}
 train=tally(259,381,340,370,291,318,stepx=4,stepy=3)
 assert doc['training']['matched']==310==train[0]
 assert doc['training']['total']==310==train[1]
 # Negative controls independently sampled and stitched together.
 negatives={}
 for label,crop,origin,stretch in (
  ('wrongSourceLeftMinus1',290,318,False),('wrongSourceLeftPlus1',292,318,False),
  ('wrongFloorOriginMinus1',291,317,False),('wrongFloorOriginPlus1',291,319,False),
  ('incorrectProportionalWidthModel',291,318,True)):
  negatives[label]=sum(tally(*bounds,crop,origin,stretch=stretch)[0] for bounds in selection.values())
 assert doc['negativeControlMatchedPixels']==negatives
 assert all(v<12222 for v in negatives.values())
 return {'status':'PASS','independentPixelAssertions':train[1]+total,
         'heldOutExactPixels':total,'alternativeModelsRejected':len(negatives),'model':'literal_2x_cropped_game_frame'}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--original-mk2',type=Path,required=True)
 ap.add_argument('--control',type=Path,required=True);ap.add_argument('--ramp-report',type=Path,required=True)
 ap.add_argument('--report',type=Path,required=True)
 a=ap.parse_args()
 print(json.dumps(verify_report(json.loads(a.report.read_text()),a.original_mk2,a.control,a.ramp_report),indent=2))
if __name__=='__main__':main()

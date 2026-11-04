#!/usr/bin/env python3
"""Independent O115 corroboration: re-read captured PNG pixels + source pattern ZIP.

Does not import the O115 fitting module or trust its report calculations.
Usage: python verify_o115_witness_independent.py --evidence-dir DIR --reports-dir DIR [--test-kit ZIP]
"""
import argparse,hashlib,json,zipfile
from collections import Counter
from pathlib import Path
from PIL import Image

BITS='0000001000011000101000111001001011001101001111010101110110111111'
CONFIG={
 '22':('tomb','y',2,51,48,(93,36,12),(52,12,12),'O115_TOMB_22_Y.json'),
 '25':('portal','y',3,80,40,(36,4,4),(101,69,36),'O115_PORTAL_25_Y.json'),
 '23':('tomb','ramp',2,51,48,(93,36,12),(52,12,12),'O115_TOMB_23_RAMP.json'),
 '26':('portal','ramp',3,80,40,(36,4,4),(101,69,36),'O115_PORTAL_26_RAMP.json')}

def verify(evidence:Path,reports:Path,testkit:Path|None=None):
 checks=0;summary={}
 for number,(stage,kind,lo,hi,nrows,rgb_lo,rgb_hi,filename) in CONFIG.items():
  p=evidence/(number+'.png');r=json.loads((reports/filename).read_text());im=Image.open(p).convert('RGB');w,h=im.size
  assert r['input']['sha256']==hashlib.sha256(p.read_bytes()).hexdigest();checks+=1
  assert r['input']['imageDimensions']==[w,h];checks+=1
  assert r['stage']==stage;checks+=1
  if kind=='y':
   start=r['candidateStartImageRow'];valid=[]
   for y in range(round(h*.76),h):
    px=[im.getpixel((x,y)) for x in range(10,w-10,2)]
    n0=px.count(rgb_lo);n1=px.count(rgb_hi);n=n0+n1
    if n/len(px)<.60 or max(n0,n1)/n<.9:continue
    idx=(y-start)//2
    assert 0<=idx<nrows
    valid.append((y,n0>n1,idx,n))
   assert len(valid)==r['matchedImageRows'] and len(valid)>=65;checks+=1
   match=sum(n for y,iszero,i,n in valid if iszero==(BITS[i]=='0'))
   total=sum(n for _,_,_,n in valid)
   assert match==total and r['bestBitAgreement']==1.;checks+=1
   assert r['rulerRecognized'] and (start==318 if stage=='tomb' else start==323);checks+=1
   summary[number]={'stage':stage,'sourceRowOriginInScreenshot':start,'matchedRows':len(valid),
        'weightedSourceBitPixelObservations':total}
  else:
   anchor=r['chosenMinimumAnchor'];period=hi-lo+1;entries=r['indexToObservedColor']
   assert len(entries)==period and r['sourceIndexCount']==period;checks+=1
   assert r['completeObservedColorTable'] and r['qualifiedIndexCount']==period;checks+=1
   assert tuple(entries[str(lo)]['observedRGB'])==rgb_lo and tuple(entries[str(hi)]['observedRGB'])==rgb_hi;checks+=1
   seen=set();pixel_checks=0
   for index in range(lo,hi+1):
    vals=[]
    for x in range(10 if stage=='tomb' else 4,w-8):
     if ((x-anchor)//8)%period!=index-lo or (x-anchor)%8 not in (2,3,4,5):continue
     for y in (h-8,h-7,h-6,h-5):vals.append(im.getpixel((x,y)))
    assert vals,(stage,index)
    colors=Counter(vals);color,n=colors.most_common(1)[0]
    assert list(color)==entries[str(index)]['observedRGB'],(stage,index,color,entries[str(index)])
    assert n/len(vals)>=.98,(stage,index, n/len(vals))
    seen.add(color);pixel_checks+=len(vals);checks+=2
   assert len(seen)==r['distinctObservedRGB'];checks+=1
   if stage=='tomb':
    assert r['sourceMinimumAnchorStarts']==[223,623] and anchor==223;checks+=1
    for y in (h-7,h-6):
     for x in range(223,230):
      assert im.getpixel((x,y))==im.getpixel((x+400,y))
      checks+=1
   else:assert anchor==42;checks+=1
   summary[number]={'stage':stage,'indicesVerified':period,'distinctColors':len(seen),
      'pixelSamplesChecked':pixel_checks,'sourceIndexMinAnchorScreenshotX':anchor}
 if testkit is not None:
  with zipfile.ZipFile(testkit) as z:
   for number,(stage,kind,lo,hi,nrows,_,_,_) in CONFIG.items():
    name=('tomb.gra' if stage=='tomb' else 'portal.gra')
    path=f'MK2_O113_Calibration/{number}_{("TOMB" if stage=="tomb" else "PORTAL")}_{("Y_RULER" if kind=="y" else "INDEX_RAMP")}/{name}'
    resource=z.read(path);plane=resource[-896*nrows:]
    assert len(plane)==896*nrows;checks+=1
    for y in range(nrows):
     for x in range(896):
      target=(hi if BITS[y]=='1' else lo) if kind=='y' else lo+(x//4)%(hi-lo+1)
      assert plane[y*896+x]==target,(number,y,x)
     checks+=1
   summary['sourcePatternsVerifiedAgainstOriginalO113Kit']=True
 return {'schema':'mk2_o115_independent_verification_v1','totalAssertions':checks,'witnesses':summary}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--evidence-dir',type=Path,required=True)
 p.add_argument('--reports-dir',type=Path,required=True);p.add_argument('--test-kit',type=Path)
 a=p.parse_args();print(json.dumps(verify(a.evidence_dir,a.reports_dir,a.test_kit),indent=2))

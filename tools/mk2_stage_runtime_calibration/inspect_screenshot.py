#!/usr/bin/env python3
"""Exploratory native-frame screenshot inspector for MK2 O113 runtime probes.

Reports pixel evidence and possible two-color X-ruler matches. The method is
explicitly conditional; no guessed emulator state is ever declared confirmed.
"""
from __future__ import annotations
import argparse
from collections import Counter
import json
from pathlib import Path
from calibration import CELL_WIDTH,debruijn_binary


def inspect(path:Path,*,start_y=154,end_y=195):
    try:from PIL import Image
    except ImportError as e:raise RuntimeError('Pillow required: python -m pip install pillow') from e
    original=Image.open(path).convert('RGB')
    w,h=original.size
    # Explicit diagnostic resampling, not a claim that a native game frame
    # was captured when the screenshot is scaled/windowed.
    img=original if (w,h)==(320,200) else original.resize((320,200),Image.Resampling.NEAREST)
    pix=img.load();start_y=max(0,start_y);end_y=min(200,end_y)
    sample=[pix[x,y] for y in range(start_y,end_y) for x in range(16,304)]
    palette=Counter(sample)
    (color0,n0),(color1,n1)=palette.most_common(2)
    report={'format':'mk2_o113_screenshot_observation_v1','image':str(path),'originalImageSize':[w,h],
       'analysisSize':[320,200],'resizedFromOriginal':(w,h)!=(320,200),
       'sampleRegion':[16,start_y,304,end_y], 'floorColorCandidates':[
          {'rgb':list(c),'count':n} for c,n in ((color0,n0),(color1,n1))],
       'twoColorFraction':round((n0+n1)/len(sample),6),
       'qualification':'SCREENSHOT_COLORS_AND_CONDITIONAL_XRULER_FIT_NOT_LIVE_CAMERA_OR_PALETTE'}
    # Conditional match under a restricted model: game draws one 320-pixel
    # viewport with nearest-neighbor coordinates and a two-color index mapping.
    b=debruijn_binary(5);best=[]
    for y in range(start_y,end_y):
        observations=[0 if pix[x,y]==color0 else 1 if pix[x,y]==color1 else -1
                      for x in range(16,304)]
        known=sum(v!=-1 for v in observations)
        if known<140:continue
        per_row=[]
        for start in range(577):
            match=sum(1 for x,observed in enumerate(observations,16)
                      if observed>=0 and observed==b[(start+x)//CELL_WIDTH])
            if match>=known-match:per_row.append((match,start,'direct'))
            else:per_row.append((known-match,start,'flipped'))
        match,off,polarity=max(per_row,key=lambda t:t[0])
        distant=max((m for m,at,_ in per_row if abs(at-off)>10),default=0)
        best.append({'screenRow':y,'candidateLeftSourceOffset':off,
                     'matchFraction':round(match/known,4),
                     'distinctRunnerUpFraction':round(distant/known,4),
                     'separation':round((match-distant)/known,4),
                     'knownColorPixels':known,'polarity':polarity,
                     'qualifiedPatternFit':match/known>=0.94 and (match-distant)/known>=0.045})
    qualified=[r for r in best if r['qualifiedPatternFit']]
    top=sorted(best,key=lambda r:(-r['matchFraction'],-r['knownColorPixels']))[:6]
    report['conditionalXrulerFits']=top
    report['qualifiedScreenRows']=len(qualified)
    report['patternRecognitionStatus']='TENTATIVE_X_RULER_DETECTED' if len(qualified)>=3 else 'UNCONFIRMED_PATTERN'
    report['cameraQualification']=(
       'Even qualified X-ruler fits only identify an observed source-column alignment'
       ' under the stated screenshot/resampling/two-color assumptions;'
       ' a single photograph does not establish live camera-x or palette-bank ownership.')
    return report


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('screenshot');p.add_argument('--out');p.add_argument('--start-y',type=int,default=154);p.add_argument('--end-y',type=int,default=195)
    a=p.parse_args();d=inspect(Path(a.screenshot),start_y=a.start_y,end_y=a.end_y)
    txt=json.dumps(d,indent=2)+'\n'
    if a.out:
        path=Path(a.out)
        if path.exists():raise FileExistsError(path)
        path.write_text(txt)
    print(txt)
if __name__=='__main__':main()

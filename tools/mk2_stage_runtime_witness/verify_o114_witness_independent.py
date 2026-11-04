#!/usr/bin/env python3
"""Independent O114 static-image verifier: fixed known swatches + raw ruler signature.

Independent of fit_o113_ruler; does not infer a camera register or full palette.
"""
from pathlib import Path
from PIL import Image
import hashlib,json,statistics
ROOT=Path(__file__).resolve().parents[2]
PAT='00000100011001010011101011011111'
CLAIMS={
 '21.png':('tomb',((93,36,12),(52,12,12)),range(289,293),False,20),
 '24.png':('portal',((101,69,36),(36,4,4)),range(315,329),True,20),
}
def validate():
 out={}
 for filename,(stage,pair,offsets,invert,min_rows) in CLAIMS.items():
  p=ROOT/'evidence/mk2_o114'/filename
  raw=p.read_bytes();im=Image.open(p).convert('RGB');width,height=im.size
  pixel=im.load(); qualified=[]; ncheck=0
  for y in range(round(height*.75),height,2):
   seq=[]
   for x in range(width):
    c=pixel[x,y]
    if c==pair[0]:seq.append((x,0))
    elif c==pair[1]:seq.append((x,1))
   if len(seq)<width*.3:continue
   matches=[]
   for source in offsets:
    good=0
    for x,v in seq:
     cell=(source+int((x+.5)*320/width))//28
     bit=int(PAT[cell]);v_expected=1-bit if invert else bit
     if v==v_expected:good+=1
    matches.append((good,source))
   best,which=max(matches)
   if best/len(seq)>=.925:qualified.append((y,which,best/len(seq)))
   ncheck+=len(seq)
  assert len(qualified)>=min_rows,(filename,'insufficient validated rows',len(qualified))
  out[filename]={'sha256':hashlib.sha256(raw).hexdigest(),'stage':stage,
    'verifiedRows':len(qualified),'scannedSwatchPixels':ncheck,
    'validatedOffsetSpan':[min(t[1] for t in qualified),max(t[1] for t in qualified)],
    'minQualifiedMatch':round(min(t[2] for t in qualified),5),
    'validation':'independent fixed window two-color sequence comparison'}
 return out
if __name__=='__main__':print(json.dumps(validate(),indent=2))

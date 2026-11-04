#!/usr/bin/env python3
"""Summarize user-observed O110Z screenshot color witnesses, without bank speculation."""
from pathlib import Path
from collections import Counter
import argparse,hashlib,json

# Original user screenshots are cropped DOSBox images resized by the display
# environment; this analysis inspects exactly the saved PNG pixels, never
# interpolated index projections.
WITNESS={
 '10.png':{'variant':'CONTROL_PORTAL','sourceValues':None},
 '11.png':{'variant':'TOMB_CHECKER','sourceValues':[2,51]},
 '12.png':{'variant':'TOMB_FLAT','sourceValues':[41]},
 '13.png':{'variant':'PORTAL_CHECKER','sourceValues':[3,80]},
}
def inspect(root:Path):
 from PIL import Image
 report={'format':'mk2_o113_observed_rgb_swatch_evidence_v1','semanticBoundary':'SCREENSHOT_RGB_SETS_NOT_VERIFIED_DAC_BANK',
 'observations':{}}
 for filename,context in WITNESS.items():
  path=root/filename;blob=path.read_bytes();im=Image.open(path).convert('RGB')
  w,h=im.size;box=(0,h-45,w,h)
  cropped=im.crop(box);hist=Counter(cropped.get_flattened_data() if hasattr(cropped,'get_flattened_data') else cropped.getdata());two=hist.most_common(5);n=(h-box[1])*w
  report['observations'][filename]={'variant':context['variant'],'originalSourceValues':context['sourceValues'],
    'pngSha256':hashlib.sha256(blob).hexdigest(),'dimensions':[w,h], 'bottomStripBox':list(box),
    'top5':[{'rgb':list(rgb),'pixels':count,'vga6Nearest':[round(c*63/255) for c in rgb]} for rgb,count in two],
    'twoTopColorCoverage':round((two[0][1]+two[1][1])/n,5),
    'caveat':'Source index to specific RGB assignment remains conditional, except flat-one-index patch where one index covers the tail.'}
 return report

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('o110z_screenshot_dir');p.add_argument('--out');a=p.parse_args()
 d=inspect(Path(a.o110z_screenshot_dir));t=json.dumps(d,indent=2)+'\n'
 if a.out:
  o=Path(a.out)
  if o.exists():raise FileExistsError(o)
  o.write_text(t)
 print(t)

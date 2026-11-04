#!/usr/bin/env python3
"""Nine deliberate forgeries tested against an independent verifier.
Requires original user-owned mk2.zip and generated O116 output PNG/manifest.
"""
import argparse,copy,json,sys,tempfile,zipfile
from pathlib import Path
from PIL import Image
from verify_o116_independent import verify_one

def run(original:Path,root:Path,demos:Path):
 with zipfile.ZipFile(original) as z:
  base=json.loads((demos/'portal.json').read_text());pngbytes=(demos/'portal.png').read_bytes()
  with tempfile.TemporaryDirectory() as tmp:
   td=Path(tmp);manifest=td/'forgery.json';png=td/'forgery.png';out=[]
   def challenge(label,changed,alter_image=None):
    manifest.write_text(json.dumps(changed,indent=2))
    png.write_bytes(alter_image if alter_image is not None else pngbytes)
    refused=False
    try:verify_one('portal.gra',z,root/'research_outputs/O115_PORTAL_26_RAMP.json',png,manifest)
    except (ValueError,KeyError,TypeError,OSError):refused=True
    if not refused:raise AssertionError(f'independent verifier accepted forged {label}')
    out.append(label)
   for label,key,val in [
    ('claim_global_palette','qualification','VERIFIED_NATIVE_256_DAC_PALETTE'),
    ('wrong_resource','resource','tomb.gra'),
    ('fake_source_hash','resourceSHA256','0'*64),
    ('wrong_report','o115RampReportSHA256','f'*64),
    ('incorrect_source_left','sourceLeft',291),
    ('incorrect_height','sourceHeight',39),
    ('incorrect_rgba_digest','observedRGBA_SHA256','0'*64),
    ('incorrect_source_indices_digest','sourceIndexImageSHA256','0'*64),
   ]:
    changed=copy.deepcopy(base);changed[key]=val;challenge(label,changed)
   altered=Image.open(demos/'portal.png').convert('RGBA');altered.putpixel((0,0),(0,0,0,255));altered.save(td/'altered.png')
   challenge('changed_png_pixel',base,(td/'altered.png').read_bytes())
 return {'schema':'mk2_o116_adversarial_independent_refusals_v1','forgeriesRejected':len(out),
         'labels':out,'status':'ALL_REFUSED'}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--original-mk2',type=Path,required=True)
 ap.add_argument('--project',type=Path,required=True);ap.add_argument('--demos',type=Path,required=True)
 ap.add_argument('--out',type=Path);a=ap.parse_args();d=run(a.original_mk2,a.project,a.demos)
 if a.out:
  if a.out.exists():raise FileExistsError(a.out)
  a.out.write_text(json.dumps(d,indent=2)+'\n')
 print(json.dumps(d,indent=2))

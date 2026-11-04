#!/usr/bin/env python3
"""Independent O116 verifier, deliberately does not import renderer/editor implementation.

Checks all output pixels against original ZIP + pinned ramp color evidence, recovers
Portal original-control pixel correspondence without fitting outputs, and rejects
unqualified claims. Requires user's mk2.zip and the already supplied O114 screenshot.
"""
from __future__ import annotations
import argparse,hashlib,json,zipfile
from pathlib import Path
from PIL import Image

PINNED={
 'portal.gra':(56916,40,'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
 '94419d55de3d62577a3fe04f260d6299cf1214116b1f8e4c5911171f2598dd5e',3,80,'fbce84f4c85fc608241148bafed9baac76c78bc394736ebecce8926b6648f9ed'),
 'tomb.gra':(63776,48,'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
 '3015abb40e57ffbc449d110c855b0b6c25d0074e77742988ce352dfbc2f7ebdb',2,51,'30e1b00ba361e40a791dffd3d10abdbc2cf77402cacee78f6d07676ae0b83791')
}
CONTROL_SHA='evidence/mk2_o114/20.png'

def sha(d):return hashlib.sha256(d).hexdigest()
def demand(test,msg):
 if not test:raise ValueError(msg)

def verify_one(resource_name,orig_zip:zipfile.ZipFile,ramp:Path,png:Path,metadata:Path):
 offset,rows,src_sha,ramp_sha,lo,hi,shot_sha=PINNED[resource_name]
 source=orig_zip.read('mk2/'+resource_name)
 demand(len(source)==offset+896*rows and sha(source)==src_sha,'nonoriginal stage GRA')
 rb=ramp.read_bytes();demand(sha(rb)==ramp_sha,'tampered observed colors')
 evidence=json.loads(rb);demand(evidence['input']['sha256']==shot_sha,'screenshot witness mismatch')
 palette={int(key):tuple(value['observedRGB']) for key,value in evidence['indexToObservedColor'].items()}
 demand(set(palette)==set(range(lo,hi+1)),'incomplete palette')
 m=json.loads(metadata.read_text())
 demand(m['schema']=='mk2_o116_observed_packed_stage_floor_preview_v1' and m['resource']==resource_name,'unexpected preview schema')
 demand(m['qualification']=='O115_CONDITIONAL_SCREENSHOT_RGB_NOT_LIVE_MK2_PALETTE_OR_FULL_STAGE','overstated qualifications')
 demand(not m['resourceIsAuthenticatedEdit'],'original verifier requires canonical source')
 demand(m['resourceSHA256']==src_sha and m['o115RampReportSHA256']==ramp_sha,'wrong input provenance')
 demand(m['outputPNG_SHA256']==sha(png.read_bytes()),'PNG digest mismatch')
 left=m['sourceLeft'];first=m['sourceFirstRow'];height=m['sourceHeight'];scale=m['pixelScaleNearest']
 demand(type(left)==int and 0<=left<=576,'invalid source column')
 demand(type(first)==int and 0<=first<rows,'invalid start row')
 demand(type(height)==int and 1<=height<=rows-first,'invalid height')
 demand(type(scale)==int and 1<=scale<=8,'invalid scale')
 image=Image.open(png).convert('RGBA')
 demand(image.size==(320*scale,height*scale),'incorrect PNG geometry')
 bytes_seen=bytearray();rgba=bytearray();seen=set();checks=0
 for y in range(height):
  for x in range(320):
   index=source[offset+(first+y)*896+left+x];demand(index in palette,'unqualified original index')
   color=palette[index];bytes_seen.append(index);seen.add(index);rgba+=bytes(color)+(b'\xff')
   for dy in range(scale):
    for dx in range(scale):
     demand(image.getpixel((x*scale+dx,y*scale+dy))==(*color,255),f'preview mismatch at {x},{y}')
     checks+=1
 demand(m['sourceIndexImageSHA256']==sha(bytes_seen),'wrong source-index hash')
 demand(m['observedRGBA_SHA256']==sha(rgba),'wrong RGBA hash')
 demand(m['observedRGBMappedPixelCount']==320*height,'wrong pixel count')
 demand(m['distinctOriginalSourceIndicesInPreview']==len(seen),'wrong source-index count')
 return {'resource':resource_name,'pixelsIndependentlyCompared':checks,
  'uniqueSourceValues':len(seen),'previewSHA256':sha(png.read_bytes())}

def original_control_cross_check(archive:zipfile.ZipFile,report:Path,control:Path):
 src=archive.read('mk2/portal.gra')[-896*40:]
 ramp=json.loads(report.read_text());map_rgb={int(k):tuple(v['observedRGB']) for k,v in ramp['indexToObservedColor'].items()}
 control_bytes=control.read_bytes();demand(sha(control_bytes)=='19858a54a7d9d3b09542dbcba06ff501aa29e9b9186cc07c3bbf3bdcde367f07','unexpected control screenshot')
 im=Image.open(control).convert('RGB');width,height=im.size
 def count(left,top,xa=230,xb=400,ya=335,yb=387,step=1):
  good=total=0
  for y in range(ya,yb,step):
   row=(y-top)//2
   for x in range(xa,xb,2):
    col=min(319,int((x+.5)*320/width))
    good+=im.getpixel((x,y))==map_rgb[src[row*896+left+col]];total+=1
  return good,total
 exact=count(292,321)
 nearby={'left291':count(291,321),'left293':count(293,321), 'origin320':count(292,320),'origin322':count(292,322)}
 demand(exact==(4420,4420),'original Portal screenshot no longer pixel-exact')
 demand(all(v[0]<4420 for v in nearby.values()),'unqualified rival alignment')
 return {'originalControl':str(control.name),'confirmedUnoccludedPortalPixels':exact[0],
         'samples':exact[1],'nearbyNegativeControls':nearby}

def verify(original_mk2:Path, project_dir:Path, demos:Path):
 with zipfile.ZipFile(original_mk2) as z:
  verified=[]
  for resource,ramp in [('portal.gra','O115_PORTAL_26_RAMP.json'),('tomb.gra','O115_TOMB_23_RAMP.json')]:
   name=resource[:-4]
   verified.append(verify_one(resource,z,project_dir/'research_outputs'/ramp,
                              demos/(name+'.png'),demos/(name+'.json')))
  result=original_control_cross_check(z,project_dir/'research_outputs'/'O115_PORTAL_26_RAMP.json',project_dir/CONTROL_SHA)
 return {'schema':'mk2_o116_independent_floor_preview_audit_v1','verified':verified,
         'controlCrossCapture':result,
         'boundary':'AUTHENTIC_PACKED_FLOOR_ONLY_CONDITIONAL_O115_COLORS_NO_LIVE_DAC_CAMERA_OR_COMPLETE_STAGE'}

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--original-mk2',required=True,type=Path)
 ap.add_argument('--project',required=True,type=Path);ap.add_argument('--demos',required=True,type=Path)
 ap.add_argument('--out',type=Path);args=ap.parse_args()
 d=verify(args.original_mk2,args.project,args.demos)
 if args.out:
  if args.out.exists():raise FileExistsError(args.out)
  args.out.write_text(json.dumps(d,indent=2)+'\n')
 print(json.dumps(d,indent=2))
if __name__=='__main__':main()

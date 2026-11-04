#!/usr/bin/env python3
"""O119 independent audit. Does not import the O119 report generator.

Recomputes screenshot RGB counts using Pillow+NumPy and EXE diffs directly
against the original binary and the distributed O118 variant archive.
"""
import argparse,hashlib,json,zipfile,struct
from pathlib import Path
import numpy as np
from PIL import Image
CONFIG={41:('41_TOMB_80_RECORD',0x893c6,80,40,(320,401)),
        42:('42_TOMB_79_RECORD',0x8cdbe,79,39,(330,427)),
        43:('43_PORTAL_80_RECORD',0x891e0,80,66,(330,443)),
        44:('44_PORTAL_79_RECORD',0x8cd1e,79,65,(330,445))}
def hash_bytes(b):return hashlib.sha256(b).hexdigest()
def audit(evidence:Path, original_exe:bytes, kit:Path, report_bytes:bytes):
 r=json.loads(report_bytes)
 assert r['format']=='mk2_o119_80_vs_79_user_screenshot_palette_record_runtime_witness_v1'
 assert r['status']=='RUNTIME_RECORD_COLOR_CAUSALITY_SUPPORTED_BY_USER_SCREENSHOT;NOT_LIVE_ALLOCATOR_HANDLE'
 assert r['canonicalExeSHA256']==hash_bytes(original_exe)
 assert r['o118RuntimeKitSHA256']==hash_bytes(kit.read_bytes())
 assert set(r['cases'])==set(map(str,CONFIG))
 assert r['expectedRenderedRGB']==[255,4,255]
 assert r['injectedWordHex']=='7c1f'
 assert len(original_exe)==861133
 assert hash_bytes(original_exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
 assert original_exe[0xccf0e:0xccf19]==bytes.fromhex('1e172e162612201f1f1626')
 assertions=0; results={}
 with zipfile.ZipFile(kit) as zip_input:
  for k,(stem,rec,n,ordinal,bounds) in CONFIG.items():
   entry=r['cases'][str(k)];p=entry['patch'];s=entry['screenshot']
   changedword=rec+2+2*ordinal
   assert struct.unpack_from('<H',original_exe,rec)[0]==n
   original_word=struct.unpack_from('<H',original_exe,changedword)[0]
   raw=zip_input.read(f'MK2_O118_Palette_Ownership_Test/{stem}/mk2.exe')
   assert len(raw)==len(original_exe)
   baseline=bytearray(original_exe)
   baseline[0xccf0e:0xccf19]=bytes.fromhex('4300000000000000000000')
   baseline[changedword:changedword+2]=bytes.fromhex('1f7c')
   assert raw==bytes(baseline),f'variant {k} has other edits'
   changed=[i for i,(a,b) in enumerate(zip(original_exe,baseline)) if a!=b]
   assert p['case']==k and p['recordPhysical']==rec and p['recordCount']==n
   assert p['sourceIndex']==(41 if k in (41,42) else 67)
   assert p['colorWordPhysical']==changedword
   assert p['patchedColorWordHex']=='7c1f'
   assert p['originalColorWordHex']==f'{original_word:04x}'
   assert p['expectedExeSHA256']==hash_bytes(raw)
   assert p['changedByteOffsets']==changed
   assert p['expectedRGB']==[255,4,255]
   assert entry['patchedBinaryValidatedAgainstKit'] is True
   assertions+=12
   image_file=evidence/f'{k}.png'; blob=image_file.read_bytes()
   with Image.open(image_file) as im:
    assert im.format=='PNG'
    a=np.asarray(im.convert('RGB'))
   height,width=a.shape[:2]
   mask=(a[:,:,0]==255)&(a[:,:,1]==4)&(a[:,:,2]==255)
   ys,xs=np.where(mask)
   count=len(xs)
   ymin,ymax=bounds
   floor_count=int(mask[ymin:min(ymax,height)].sum())
   bbox=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())] if count else None
   bands={str(lo):int(mask[lo:lo+80].sum()) for lo in range(0,height,80)}
   assert s['case']==k
   assert s['screenshotPath']==f'evidence/mk2_o119/{k}.png'
   assert s['screenshotSHA256']==hash_bytes(blob)
   assert s['imageDimensions']==[width,height]
   assert s['injectedRGB']==[255,4,255]
   assert s['exactInjectedRGBPixels']==count
   assert s['exactInjectedRGBBoundingBox']==bbox
   assert s['lowerStageRegionY']==list(bounds)
   assert s['exactInjectedRGBPixelsInLowerStageRegion']==floor_count
   assert s['rowsWithInjectedRGB']==len(np.unique(ys))
   assert s['rowBandCounts']==bands
   if k in (41,43):assert floor_count>1000 and count>1000
   else:assert count==0 and floor_count==0
   assertions+=13
   results[str(k)]={'magentaPixels':count,'lowerStagePixels':floor_count,
                    'screenshotSHA256':hash_bytes(blob),'patchedExeSHA256':hash_bytes(raw)}
 assert r['evidence']=='USER_SCREENSHOT_AFTER_CONTROLLED_BINARY_PATCH'
 assert len(r['supportedConclusions'])==4 and len(r['unresolved'])>=4
 return {'format':'mk2_o119_independent_binary_and_image_audit_v1',
         'assertions':assertions+14,'cases':results,
         'conclusion':'80-color palettes visibly affected the selected arena; 79-color alternatives did not in these tests',
         'scope':'patch and screenshot evidence only; live palette handles not resolved'}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--evidence',type=Path,required=True)
 ap.add_argument('--original-mk2',type=Path,required=True);ap.add_argument('--kit',type=Path,required=True)
 ap.add_argument('--report',type=Path,required=True);ap.add_argument('--out',type=Path,required=True)
 a=ap.parse_args();assert not a.out.exists()
 with zipfile.ZipFile(a.original_mk2) as z:exe=z.read('mk2/mk2.exe')
 result=audit(a.evidence,exe,a.kit,a.report.read_bytes())
 a.out.write_text(json.dumps(result,indent=2)+'\n')
 print('PASS',result['assertions'],'binary/screenshot assertions')

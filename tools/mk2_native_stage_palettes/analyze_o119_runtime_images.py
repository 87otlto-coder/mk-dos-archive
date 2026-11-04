#!/usr/bin/env python3
"""O119: user-labeled DOSBox gameplay screenshots for O118 80/79 palette probes.

Evidence: native RGB patch-word decoded with the MK2 DAC6 implementation; counts
of exact (255,4,255) screenshot pixels. Images are user-supplied screenshots,
not emulator instrumentation. Screenshot filenames alone do not authenticate the
actual launched binary. Optional O118 test kit hashes authenticate the binaries.
"""
from __future__ import annotations
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
from PIL import Image

CANONICAL_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
CHEAT_AT=0xCCF0E
CHEAT_ORIG=bytes.fromhex('1e172e162612201f1f1626')
CHEAT_NEW=bytes.fromhex('4300000000000000000000')
MAGENTA_RGB=(255,4,255)
MAGENTA_WORD=0x7C1F
# Case, stage, counted record, record colors, tested source index, first record index,
# original test screenshot lower-stage screen-region Y interval (manual image coordinate).
CASES={
 41:('Kombat Tomb',0x893c6,80,41,1,(320,401)),
 42:('Kombat Tomb',0x8cdbe,79,41,2,(330,427)),
 43:('The Portal',0x891e0,80,67,1,(330,443)),
 44:('The Portal',0x8cd1e,79,67,2,(330,445)),
}
def sha(b):return hashlib.sha256(b).hexdigest()
def rgb_of_word(w):
 dac=((((w>>9)&63)|1),(((w>>4)&63)|1),(((w<<1)&63)|1))
 return tuple((d<<2)|(d>>4) for d in dac)
def expected_patched_exe(original:bytes,case:int)->tuple[bytes,dict]:
 assert case in CASES
 assert len(original)==861133 and sha(original)==CANONICAL_SHA
 assert original[CHEAT_AT:CHEAT_AT+11]==CHEAT_ORIG
 stage,offset,count,index,first,_=CASES[case]
 assert struct.unpack_from('<H',original,offset)[0]==count
 at=offset+2+2*(index-first)
 old=struct.unpack_from('<H',original,at)[0]
 p=bytearray(original)
 p[CHEAT_AT:CHEAT_AT+11]=CHEAT_NEW
 struct.pack_into('<H',p,at,MAGENTA_WORD)
 assert rgb_of_word(MAGENTA_WORD)==MAGENTA_RGB
 changed=[i for i,(a,b) in enumerate(zip(original,p)) if a!=b]
 assert set(changed).issubset(set(range(CHEAT_AT,CHEAT_AT+11))|{at,at+1})
 return bytes(p),{'case':case,'stage':stage,'recordPhysical':offset,'recordCount':count,'sourceIndex':index,
                  'colorWordPhysical':at,'originalColorWordHex':f'{old:04x}',
                  'patchedColorWordHex':f'{MAGENTA_WORD:04x}',
                  'expectedRGB':list(MAGENTA_RGB),'expectedExeSHA256':sha(p),
                  'changedByteOffsets':changed}
def inspect_png(path:Path,case:int):
 assert case in CASES
 blob=path.read_bytes()
 with Image.open(path) as im:
  assert im.format=='PNG';im=im.convert('RGB'); w,h=im.size
  assert w>=635 and h>=390
  exact=0; region=0;xmin=ymin=10**9;xmax=ymax=-1
  floorlo,floorhi=CASES[case][5];floorhi=min(floorhi,h)
  row_counts=[]
  for y in range(h):
   count=0
   for x in range(w):
    if im.getpixel((x,y))==MAGENTA_RGB:
     count+=1;xmin=min(xmin,x);xmax=max(xmax,x);ymin=min(ymin,y);ymax=max(ymax,y)
     if floorlo<=y<floorhi:region+=1
   exact+=count
   if count:row_counts.append([y,count])
 return {'case':case,'screenshotPath':'evidence/mk2_o119/'+path.name,
         'screenshotSHA256':sha(blob),'imageDimensions':[w,h],
         'injectedRGB':list(MAGENTA_RGB),'exactInjectedRGBPixels':exact,
         'exactInjectedRGBBoundingBox':[xmin,ymin,xmax,ymax] if exact else None,
         'lowerStageRegionY':[floorlo,floorhi],
         'exactInjectedRGBPixelsInLowerStageRegion':region,
         'rowsWithInjectedRGB':len(row_counts),
         'rowBandCounts':{str(lo):sum(n for y,n in row_counts if lo<=y<lo+80) for lo in range(0,h,80)}}
def read_original(zip_path):
 with zipfile.ZipFile(zip_path) as z:return z.read('mk2/mk2.exe')
def build(evidence, original, test_kit=None):
 reports={}
 for case in CASES:
  image_path=evidence/f'{case}.png'
  expected,patch=expected_patched_exe(original,case)
  seen=inspect_png(image_path,case)
  if case in (41,43):
   assert seen['exactInjectedRGBPixels']>1000
   assert seen['exactInjectedRGBPixelsInLowerStageRegion']>1000
  else:
   assert seen['exactInjectedRGBPixels']==0
  entry={'patch':patch,'screenshot':seen,'patchedBinaryValidatedAgainstKit':False}
  if test_kit:
   label={41:'41_TOMB_80_RECORD',42:'42_TOMB_79_RECORD',43:'43_PORTAL_80_RECORD',44:'44_PORTAL_79_RECORD'}[case]
   with zipfile.ZipFile(test_kit) as z:
    actual=z.read(f'MK2_O118_Palette_Ownership_Test/{label}/mk2.exe')
    assert actual==expected,f'case {case} test-kit binary mismatch'
   entry['patchedBinaryValidatedAgainstKit']=True
  reports[str(case)]=entry
 assert reports['41']['screenshot']['exactInjectedRGBPixels']>0
 assert reports['43']['screenshot']['exactInjectedRGBPixels']>0
 assert reports['42']['screenshot']['exactInjectedRGBPixels']==0
 assert reports['44']['screenshot']['exactInjectedRGBPixels']==0
 return {'format':'mk2_o119_80_vs_79_user_screenshot_palette_record_runtime_witness_v1',
         'evidence':'USER_SCREENSHOT_AFTER_CONTROLLED_BINARY_PATCH',
         'status':'RUNTIME_RECORD_COLOR_CAUSALITY_SUPPORTED_BY_USER_SCREENSHOT;NOT_LIVE_ALLOCATOR_HANDLE',
         'canonicalExeSHA256':CANONICAL_SHA,
         'o118RuntimeKitSHA256':sha(test_kit.read_bytes()) if test_kit else None,
         'injectedWordHex':'7c1f','expectedRenderedRGB':[255,4,255],
         'cases':reports,'supportedConclusions':[
          '80-color original EXE palette word patch for Tomb produces many injected-magenta stage pixels in test 41',
          '79-color alternative word patch for Tomb does not show injected-magenta pixels in test 42',
          '80-color original EXE palette word patch for Portal produces many injected-magenta stage pixels in test 43',
          '79-color alternative word patch for Portal does not show injected-magenta pixels in test 44'],
         'unresolved':['Screenshots cannot authenticate the precise DOSBox executable in use without a runtime hash readback',
          'The screenshots do not expose live palette allocator handles, bank indices or ownership lifetime',
          'The unmodified 79-color record may be used elsewhere, in another mode or at a different time',
          'The count of magenta pixels varies with stage rendering, action timing, and capture crop',
          'No game-logic or camera-memory state inferred from screen coordinates']}
def main():
 p=argparse.ArgumentParser()
 p.add_argument('--evidence',type=Path,required=True)
 p.add_argument('--original-mk2',type=Path,required=True)
 p.add_argument('--kit',type=Path)
 p.add_argument('--out',type=Path,required=True)
 a=p.parse_args();assert not a.out.exists(),'refuse overwrite'
 report=build(a.evidence,read_original(a.original_mk2),a.kit)
 a.out.write_text(json.dumps(report,indent=2)+'\n')
 print('O119 verified screenshots',[(k,v['screenshot']['exactInjectedRGBPixels']) for k,v in report['cases'].items()])
if __name__=='__main__':main()

#!/usr/bin/env python3
"""O97B pixel-faithful 320x200 *conditional* ten-tile canvas. RGBA PNG is a palette-candidate visualization, NOT observed game output."""
import hashlib,json,struct,sys
from pathlib import Path
from PIL import Image
if len(sys.argv)!=3:raise SystemExit('usage <mk2 fixture> <source directory>')
fixture=Path(sys.argv[1]);root=Path(sys.argv[2]);gra=(fixture/'mountain.gra').read_bytes();exe=(fixture/'mk2.exe').read_bytes()
H=lambda b:hashlib.sha256(b).hexdigest()
assert H(gra)=='0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6'
qfile=root/'mk2_mountain_49_control_placement_grid_o97a_2026-10-09.json';q=json.loads(qfile.read_bytes())
y=json.loads((root/'mk2_mountain_exact_full_64_indexed_images_o96y_2026-10-09.json').read_bytes())
idx=bytearray(320*200);mask=bytearray(320*200);owners=bytearray(320*200)
source_records=[]
for c in q['controls']:
 if c['setupOffset']!=0x1c330:continue
 s=y['sprites'][c['descriptorOrdinal']];w=s['width'];h=s['height'];src=s['graStart'];sx=c['signedXDelta'];sy=c['signedYDelta'];opaque=0
 for row in range(h):
  col=0
  while col<w:
   command=struct.unpack_from('<I',gra,src)[0];src+=4
   if command&1:run=command>>1;data=None
   elif command&2:run=command>>10;data=bytes([(command>>2)&255])*run
   else:
    run=command>>2;data=gra[src:src+run];src+=((run+3)//4)*4
   assert 0<run<=w-col
   target=(sy+row)*320+sx+col
   for k in range(run):owners[target+k]+=1
   if data is not None:
    idx[target:target+run]=data;mask[target:target+run]=bytes([1])*run;opaque+=run
   col+=run
 assert src==s['endExclusive'] and opaque==s['opaquePixels']
 source_records.append({'entryIndex':c['entryIndex'],'descriptorOrdinal':c['descriptorOrdinal'],'x':sx,'y':sy,'width':w,'height':h,'opaquePixels':opaque})
assert len(source_records)==10 and all(t==1 for t in owners)
assert mask.count(1)==38113 and mask.count(0)==25887
palette=[struct.unpack_from('<H',exe,0x8d17e+2+2*i)[0] for i in range(207)]
assert struct.unpack_from('<H',exe,0x8d17e)[0]==207
rgba=bytearray(320*200*4)
for i in range(64000):
 if mask[i]:
  v=palette[idx[i]]
  r6=((v>>9)&63)|1;g6=((v>>4)&63)|1;b6=((v<<1)&63)|1
  rgba[i*4:i*4+4]=bytes((round(255*r6/63),round(255*g6/63),round(255*b6/63),255))
folder=root/'evidence'/'mk2_mountain_o97b';folder.mkdir(parents=True,exist_ok=True)
indices=folder/'mountain_10tile_conditional_indices_320x200.bin';alpha=folder/'mountain_10tile_conditional_opacity_320x200.bin';png=folder/'mountain_10tile_conditional_palette_candidate.png'
indices.write_bytes(idx);alpha.write_bytes(mask);Image.frombytes('RGBA',(320,200),bytes(rgba)).save(png,optimize=True)
report={'format':'mk2_o97b_mountain_conditional_ten_tile_indexed_canvas_v1','status':'SUCCESS','fixtureExeSha256':H(exe),'fixtureGraSha256':H(gra),'parentO97aSha256':H(qfile.read_bytes()),'setupOffset':0x1c330,'canvas':{'width':320,'height':200,'tiles':10,'rectangleOwnerCountEveryPixel':1,'opaquePixels':mask.count(1),'transparentPixels':mask.count(0)},'sourceRecords':source_records,'files':{'indices':{'path':indices.relative_to(root).as_posix(),'sha256':H(idx),'bytes':len(idx)},'opacity':{'path':alpha.relative_to(root).as_posix(),'sha256':H(mask),'bytes':len(mask)},'candidatePng':{'path':png.relative_to(root).as_posix(),'sha256':H(png.read_bytes()),'bytes':png.stat().st_size}},'mapping':{'paletteObject1Offset':0x2b52a,'paletteEntries':207,'rgb6Formula':'(((word>>9)&63)|1, ((word>>4)&63)|1, ((word<<1)&63)|1)','rgb6ToRgb8':'round(channel6*255/63)','transparentAlpha':0},'hypotheses':{'tenTileLosslessIndexedPixelPlacement':'SUPPORTED_CONDITIONAL_ON_SETUP_SELECTION','candidatePngIsObservedDOSFrame':'REJECTED','candidatePngIsVerifiedFinalRgb':'UNPROVEN','runtimeSceneLayoutKnown':'UNPROVEN'}}
(root/'mk2_mountain_conditional_ten_tile_canvas_o97b_2026-10-09.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'status':'PASS','pixels':64000,'opaque':mask.count(1),'transparent':mask.count(0),'indexSha256':H(idx),'maskSha256':H(mask),'png':str(png)}))

#!/usr/bin/env python3
"""Independent LE+GRA fixture verification of Mountain setup pointer ancestry and exact conditional tile grid."""
import hashlib,json,struct,sys
from pathlib import Path
assert len(sys.argv)==4,'usage: verify <mk2 fixture directory> <O96Z report> <O97A report>'
fixture=Path(sys.argv[1]);zp=Path(sys.argv[2]);ap=Path(sys.argv[3]);z=json.loads(zp.read_bytes());a=json.loads(ap.read_bytes());root=Path(__file__).resolve().parent.parent
exe=(fixture/'mk2.exe').read_bytes();gra=(fixture/'mountain.gra').read_bytes();H=lambda b:hashlib.sha256(b).hexdigest()
U=lambda p:struct.unpack_from('<I',exe,p)[0];W=lambda p:struct.unpack_from('<H',exe,p)[0];S=lambda p:struct.unpack_from('<h',exe,p)[0];P=lambda off:0xa0c54+off
n=0
def ck(t,msg):
 global n
 n+=1
 if not t:raise AssertionError(f'O96Z/O97A independently rejected: {msg}')
ck(H(exe)==z['fixtureSha256']==a['fixtureSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','fixture identity')
ck(H(gra)=='0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6','GRA identity')
ck(z['status']==a['status']=='SUCCESS','success')
ck(z['format']=='mk2_o96z_mountain_setup_relocation_and_runtime_binding_boundary_v1','O96Z format')
ck(a['format']=='mk2_o97a_mountain_conditional_49_sprite_placement_and_ten_tile_grid_v1','O97A format')
ck(H(zp.read_bytes())==a['priorO96zSha256'],'parent O96Z evidence')
xb=(root/'mk2_mountain_setup_palette_49_entries_o96x_2026-10-09.json').read_bytes();yb=(root/'mk2_mountain_exact_full_64_indexed_images_o96y_2026-10-09.json').read_bytes();x=json.loads(xb);y=json.loads(yb)
ck(H(xb)==z['parentO96xSha256']==a['parentO96xSha256'],'frozen prior X');ck(H(yb)==z['parentO96ySha256']==a['parentO96ySha256'],'frozen prior Y')
# Reparse full original LE relocation stream by its own header, not trusting producer's map.
mz=0x26654;le=mz+U(mz+0x3c);pages=U(le+0x14);base=mz+U(le+0x80);index=le+U(le+0x68);records=le+U(le+0x6c)
ck((le,base,pages)==(0x28f0c,0x61c54,113),'LE topology')
fixups={};fix_count=0
for page in range(pages):
 p=records+U(index+page*4);end=records+U(index+(page+1)*4)
 while p<end:
  kind=exe[p]&15;fl=exe[p+1];delta=S(p+2);p+=4
  ck(fl&3==0,'fixup flags')
  obj=W(p) if fl&64 else exe[p];p+=2 if fl&64 else 1
  target=None
  if kind!=2:
   target=U(p) if fl&16 else W(p);p+=4 if fl&16 else 2
  if fl&4:p+=4 if fl&32 else 2
  ck(p<=end,'fixup length')
  fixups[base+page*4096+delta]=(kind,fl,obj,target)
  fix_count+=1
 ck(p==end,'page consumed')
ck(fix_count==27004==z['relocationCount'],'27,004 relocations')
# Three source pointers in serialized table must possess typed LE relocations; physical code byte matches are NOT enough.
triples=[(0x1c302,2,0x77453),(0x1c306,2,0x1c31e),(0x1c312,2,0x1c330)]
ck(len(z['typedAdjacentPointers'])==3,'typed triples')
for got,(off,obj,target) in zip(z['typedAdjacentPointers'],triples):
 ck((got['source'],got['sourcePhysical'],got['object'],got['target'])==(off,P(off),obj,target),'source tuple')
 ck(U(P(off))==target and fixups.get(P(off))==(7,16,obj,target),'typed executable relocation')
ck(z['setupOffsets']==[0x1c31e,0x1c330] and z['setupCount']==2,'two setups')
for off,count,lst in ((0x1c31e,39,0x1c5dc),(0x1c330,10,0x1c716)):
 ck(W(P(off+4))==count,'serialized count')
 for field,t in ((6,lst),(10,0x1c344),(14,0x1c5bc)):
  ck(U(P(off+field))==t and fixups.get(P(off+field))==(7,16,2,t),'setup typed pointer')
# Explicit code bytes are a bounded evidence contract, not guarantee that process launches.
ck(len(z['machine'])>=20,'machine coverage')
for record in z['machine']:
 off=record['offset'];hexbytes=record['hex'];ck(exe[off:off+len(hexbytes)//2].hex()==hexbytes,'code bytes '+hex(off))
ck(z['stagedRuntimePointer']=={'eightRowProducerTable':0x15b68,'firstRowFourthFieldPointer':0x77453,'producerEntry':0x81bb3,'indirectGlobalRead':0x81bd9,'selectedSetupDerefAt':0x81c53,'selectedSetupPlacementBaseReadAt':0x81c55,'actualSceneExecutionProven':False},'no runtime overclaim')
ck(U(P(0x15b68+12))==0x77453 and fixups.get(P(0x15b68+12))==(7,16,2,0x77453),'runtime-global pointer table first row')
ck(z['hypotheses']['selectedSetupPointerAtRuntimeIsOneOfTwoMountainRecords']=='UNPROVEN' and z['hypotheses']['runtimePaletteHandleOwnership']=='UNPROVEN','setup and palette boundaries')
# Independent construction from original control words and original sprite dimensions.
ck(len(a['controls'])==49,'49 controls')
rows={};ordinals=[]
for i,entry in enumerate(a['controls']):
 so=0x1c31e if i<39 else 0x1c330;at=(0x1c5dc+i*8) if i<39 else (0x1c716+(i-39)*8)
 ck(entry['setupOffset']==so and entry['entryOffset']==at and entry['entryIndex']==(i if i<39 else i-39),'entry origin')
 first=W(P(at));sx=S(P(at+2));sy=S(P(at+4));last=W(P(at+6));o=((last&0xfff)*4)//8;pal=(first&15)|((last&0xf000)>>8)
 ck(first==0x4042 and pal==2 and 0<=o<49,'bounded selector')
 ck(entry['signedXDelta']==sx and entry['signedYDelta']==sy and entry['firstWord']==first and entry['paletteSlot']==pal,'placement words')
 desc=0x1c344+8*o;dw=W(P(desc));dh=W(P(desc+2))
 ck(entry['descriptorOrdinal']==o and entry['descriptorOffset']==desc and entry['width']==dw and entry['height']==dh,'descriptor dimensions')
 ck(entry['extentXExclusive']==sx+dw and entry['extentYExclusive']==sy+dh,'rect extents')
 ck(entry['sourcePixelSha256']==y['sprites'][o]['pixelSha256'] and entry['sourceMaskSha256']==y['sprites'][o]['maskSha256'],'frozen source sprite integrity')
 rows.setdefault(so,[]).append((sx,sy,dw,dh,o))
 ordinals.append(o)
ck(sorted(ordinals)==list(range(49)),'every descriptor selected exactly once')
ck(len(rows[0x1c31e])==39 and len(rows[0x1c330])==10,'group counts')
for setup,group in zip([0x1c31e,0x1c330],a['groups']):
 rec=rows[setup];ck(group=={'setupOffset':setup,'count':len(rec),'minDeltaX':min(r[0] for r in rec),'maxDeltaX':max(r[0] for r in rec),'minDeltaY':min(r[1] for r in rec),'maxDeltaY':max(r[1] for r in rec)},'group geometry summary')
# Test the entire 320 x 200 rectangle raster. All cells must have exactly one rectangle owner.
cover=bytearray(320*200);seen=[];tile_opaque=0
for sx,sy,w,h,idx in rows[0x1c330]:
 ck(w==64 and h==100 and sx>=0 and sy>=0 and sx+w<=320 and sy+h<=200,'10 tile extents')
 seen.append((sx,sy))
 for yy in range(sy,sy+h):
  for xx in range(sx,sx+w):cover[yy*320+xx]+=1
 # Re-decode the canonical GRA's RLE, literal and transparent skip commands, independently of O96Y pixels.
 sprite=y['sprites'][idx];at=sprite['graStart'];opaque=0;pixels=bytearray(w*h);mask=bytearray(w*h)
 for yy in range(h):
  col=0
  while col<w:
   ck(at+4<=len(gra),'GRA command bound')
   command=struct.unpack_from('<I',gra,at)[0];at+=4
   if command&1:
    run=command>>1;mode='transparent'
   elif command&2:
    run=command>>10;mode='rle'
   else:
    run=command>>2;mode='literal'
   ck(run>0 and col+run<=w,'GRA run extent')
   if mode=='rle':
    pix=(command>>2)&255;pixels[yy*w+col:yy*w+col+run]=bytes([pix])*run;mask[yy*w+col:yy*w+col+run]=bytes([1])*run;opaque+=run
   elif mode=='literal':
    ck(at+run<=len(gra),'GRA literal bound');pixels[yy*w+col:yy*w+col+run]=gra[at:at+run];mask[yy*w+col:yy*w+col+run]=bytes([1])*run;opaque+=run;at+=((run+3)//4)*4
   col+=run
 ck(at==sprite['endExclusive'] and H(pixels)==sprite['pixelSha256'] and H(mask)==sprite['maskSha256'],'complete independently decoded tile '+str(idx))
 tile_opaque+=opaque
ck(sorted(seen)==sorted((xx,yy) for xx in (0,64,128,192,256) for yy in (0,100)),'five by two tile layout')
gaps=cover.count(0);overlaps=sum(v>1 for v in cover)
ck(gaps==0 and overlaps==0 and len(cover)==64000,'perfect raster tiling')
grid=a['tileGrid']
ck(grid['canvasWidth']==320 and grid['canvasHeight']==200 and grid['columns']==[0,64,128,192,256] and grid['rows']==[0,100],'reported grid dimensions')
ck(grid['tileWidth']==64 and grid['tileHeight']==100 and grid['setupOffset']==0x1c330,'tile identities')
ck(grid['rectCoverage']==64000 and grid['rectGaps']==gaps and grid['rectOverlaps']==overlaps,'coverage flags')
ck(grid['opaqueSourcePixels']==tile_opaque and grid['transparentSourcePixels']==64000-tile_opaque and tile_opaque<64000,'precise source transparency')
ck(grid['actualCanvasOutputAtRuntimeUnverified'] is True and a['hypotheses']['coordinatesAreFinalStageScreenPositions']=='UNPROVEN' and a['hypotheses']['runtimePaletteHandleObserved']=='UNPROVEN','do not overclaim rendered stage')
ck(a['hypotheses']['tenTileMosaicFullyOpaque']=='REJECTED','no false opaque claim')
print(json.dumps({'status':'PASS','verifier':'independent Python LE and GRA reconstruction','checks':n,'failures':0,'relocations':fix_count,'controls':49,'tiles':10,'canvas':[320,200],'overlaps':overlaps,'gaps':gaps,'opaqueSourcePixels':tile_opaque,'transparentSourcePixels':64000-tile_opaque}))

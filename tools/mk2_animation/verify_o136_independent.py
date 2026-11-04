#!/usr/bin/env python3
"""Independent O136 verification: no import of the frame-sequence producer/decoder."""
from __future__ import annotations
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
from PIL import Image
EXPECTED={'tomb_flying_a':('tomb',0x17814,8,1,0x82d51),
          'tomb_flying_b':('tomb',0x177ec,8,1,0x82db3),
          'portal_swaying':('portal',0x164b4,7,1,0x82746),
          'portal_hanging':('portal',0x164d8,7,0,0x828ff),
          'portal_electric':('portal',0x164f8,6,0,0x82994)}
OBJ2=0xa0c54
EX='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA={'tomb':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
'portal':'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'}
def h(raw):return hashlib.sha256(raw).hexdigest()
def check(x,why):
 if not x:raise AssertionError('O136 independent: '+why)
def unpack_from(fmt,b,p):return struct.unpack_from(fmt,b,p)
def sprite(raw,off,w,ht):
 indices=bytearray(w*ht);alpha=bytearray(w*ht);position=off
 for row in range(ht):
  col=0
  while col<w:
   check(position+4<=len(raw),'short GRA command')
   op=int.from_bytes(raw[position:position+4],'little');position+=4
   if op%2==1:count=op//2
   elif (op&2)!=0:
    count=op>>10;index=(op>>2)&255
    check(count>0 and count<=w-col,'bad RLE')
    for j in range(count):indices[row*w+col+j]=index;alpha[row*w+col+j]=255
   else:
    count=op>>2
    check(0<count<=64 and col+count<=w and position+count<=len(raw),'bad literal')
    indices[row*w+col:row*w+col+count]=raw[position:position+count]
    alpha[row*w+col:row*w+col+count]=bytes([255])*count
    position+=(count+3)//4*4
   check(count>0 and col+count<=w,'sprite row overflow');col+=count
 return bytes(indices),bytes(alpha),position

def colors(exe,stage):
 base=0x893c6 if stage=='tomb' else 0x891e0
 check(unpack_from('<H',exe,base)[0]==80,'palette record count')
 def decode(v):
  vals=(((v>>9)&63)|1,((v>>4)&63)|1,((v<<1)&63)|1)
  return tuple((n<<2)|(n>>4) for n in vals)
 return {i+1:decode(unpack_from('<H',exe,base+2+2*i)[0]) for i in range(80)}

def audit(exe,gamezip,folder,manifest=None):
 checks=0
 def c(v,why):
  nonlocal checks;check(v,why);checks+=1
 c(h(exe)==EX,'wrong EXE')
 if manifest is None:manifest=json.loads((folder/'O136_FRAME_SEQUENCE_MANIFEST.json').read_text())
 c(manifest['schema']=='mk2_o136_original_effect_frame_sources_v1','schema')
 c(manifest['status']=='PASS_SOURCE_AUTHENTICATED_FRAME_EXPORT','status')
 c(manifest['totalSourceOrderedFrames']==36,'frame census')
 c(manifest['originalExecutableSHA256']==EX,'EXE source SHA')
 c(len(manifest['tracks'])==len(EXPECTED),'track count')
 c(manifest['limits']['animationFPSVerified'] is False,'no fabricated FPS')
 c(manifest['limits']['actualRuntimeActivationVerified'] is False,'no fabricated live execution')
 c(manifest['limits']['sourceOrderFromAuthenticatedPointerArray'] is True,'source order provenance')
 c(manifest['limits']['finalSpriteWorldPositionsKnown'] is False,'no fabricated positions')
 with zipfile.ZipFile(gamezip) as archive:
  sprites={}
  for st in ('tomb','portal'):
   found=[n for n in archive.namelist() if n.lower().endswith('/'+st+'.gra')]
   c(len(found)==1,'original GRA identity');raw=archive.read(found[0]);c(h(raw)==GRA_SHA[st],'GRA checksum')
   sprites[st]=raw;c(manifest['originalResourceSHA256'][st]==GRA_SHA[st],'manifest GRA SHA')
 paths={'O136_FRAME_SEQUENCE_MANIFEST.json'};decoded_frames=0
 for tr in manifest['tracks']:
  name=tr['name'];c(name in EXPECTED,'unexpected sequence name')
  stage,ptrbase,n,terminal,writer=EXPECTED[name]
  c(tr['stage']==stage and tr['sourceFrameListObject2']==ptrbase,'source list identity')
  c(tr['sourceFrameCount']==n and len(tr['frames'])==n,'source list length')
  c(tr['sequenceTerminalWord']==terminal and unpack_from('<I',exe,OBJ2+ptrbase+4*n)[0]==terminal,'end marker')
  prefix=bytes.fromhex('c7056c5a0700') if name=='portal_swaying' else bytes.fromhex('c705785a0700')
  c(tr['sourceWriterPhysical']==writer and exe[writer:writer+6]==prefix
    and unpack_from('<I',exe,writer+6)[0]==ptrbase,'writer instruction and operand')
  if name=='portal_swaying':
   c(exe[0x82764:0x8276a]==prefix and unpack_from('<I',exe,0x8276a)[0]==ptrbase,'second Portal source assignment')
   c(exe[0x8280c:0x82817]==bytes.fromhex('8b56548b465ca3785a0700'),'nested source pointer transfer')
  c(tr['sourceControlFlow']==('ONE_MARKER_BACK_REFERENCE' if terminal else 'ZERO_TERMINATED'),'control flow label')
  if terminal:
   c(tr['loopBackPointerObject2']==ptrbase and unpack_from('<I',exe,OBJ2+ptrbase+4*n+4)[0]==ptrbase,'Tomb loop back-ref')
  else:c(tr['loopBackPointerObject2'] is None,'Portal no invented loop back-ref')
  previous=None
  for i,row in enumerate(tr['frames']):
   decoded_frames+=1;c(row['ordinal']==i,'frame ordinal')
   off=ptrbase+i*4;desc=unpack_from('<I',exe,OBJ2+off)[0]
   c(row['pointerEntryObject2']==off and row['descriptorObject2']==desc,'descriptor pointer')
   w,ht,x,y,packed=unpack_from('<HHhhI',exe,OBJ2+desc)
   rid=packed>>24;start=packed&0xffffff
   c((rid,stage)==(28,'tomb') or (rid,stage)==(25,'portal'),'original resource id')
   c(row['resourceID']==rid and row['resourceName']==stage.upper()+'.GRA','reported resource owner')
   c(row['sourceWidth']==w and row['sourceHeight']==ht and row['signedSourceX']==x and row['signedSourceY']==y,'frame geometry')
   ix,alpha,end=sprite(sprites[stage],start,w,ht)
   c((row['streamStart'],row['streamEndExclusive'])==(start,end),'original stream span')
   c(previous is None or previous==start,'no gap in ordered sprite stream')
   previous=end
   c(row['sourceStreamSHA256']==h(sprites[stage][start:end]),'stream content hash')
   c(row['paletteIndexSHA256']==h(ix),'indices checksum')
   mask=bytes(1 if m else 0 for m in alpha)
   c(row['opacityMaskSHA256']==h(mask),'mask checksum')
   c(row['opaquePixels']==sum(1 for v in mask if v),'opaque count')
   prefix=f'{name}/frame_{i:02d}';expect=[prefix+'.png',prefix+'.indices.bin',prefix+'.mask.bin']
   c(row['files']==expect,'asset path list')
   for p in expect:c((folder/p).is_file(),'missing asset '+p);paths.add(p)
   c((folder/expect[1]).read_bytes()==ix,'exported indices')
   c((folder/expect[2]).read_bytes()==mask,'exported alpha mask')
   png=(folder/expect[0]).read_bytes();c(h(png)==row['pngSHA256'],'PNG hash')
   im=Image.open(folder/expect[0]).convert('RGBA');c(im.size==(w,ht),'PNG size')
   palette=colors(exe,stage)
   pixels=list(im.getdata())
   for j,(v,a) in enumerate(zip(ix,mask)):
    expected=(*palette[v],255) if a else (0,0,0,0)
    c(pixels[j]==expected, 'PNG RGBA differs from original index/mask')
  c(tr['originalSourceSpan']==[tr['frames'][0]['streamStart'],previous],'track source coverage')
 c(decoded_frames==36,'all original frames present')
 actual={str(p.relative_to(folder)) for p in folder.rglob('*') if p.is_file()}
 c(actual==paths,'no unmanifested or missing frame assets')
 return {'status':'PASS_O136_INDEPENDENT_SPRITE_FRAMES','checks':checks,'originalOrderedFrames':decoded_frames,
   'files':len(actual),'identities':'original EXE and GRA verified'}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',type=Path,required=True);a.add_argument('--game-zip',type=Path,required=True);a.add_argument('--folder',type=Path,required=True);a.add_argument('--out',type=Path);args=a.parse_args()
 result=audit(args.exe.read_bytes(),args.game_zip,args.folder)
 if args.out:
  check(not args.out.exists(),'no overwriting existing verification');args.out.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result))

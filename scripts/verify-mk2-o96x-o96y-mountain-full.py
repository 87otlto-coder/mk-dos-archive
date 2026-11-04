#!/usr/bin/env python3
"""Independent fixture-only verification of O96X setup-control joins and O96Y exact 64-sprite coverage."""
import hashlib,json,struct,sys
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verifier.py <mk2 fixture> <O96X report> <O96Y report>')
fx=Path(sys.argv[1]);xb=Path(sys.argv[2]).read_bytes();yb=Path(sys.argv[3]).read_bytes();x=json.loads(xb);y=json.loads(yb)
exe=(fx/'mk2.exe').read_bytes();gra=(fx/'mountain.gra').read_bytes();H=lambda b:hashlib.sha256(b).hexdigest();checks=0
def ck(test,name):
 global checks
 checks+=1
 if not test:raise AssertionError('O96X/Y independent verification: '+name)
def u16(b,p):return struct.unpack_from('<H',b,p)[0]
def s16(b,p):return struct.unpack_from('<h',b,p)[0]
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
ck(H(exe)==x['fixtureExeSha256']==y['fixture']['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','exe hash')
ck(H(gra)==x['mountainGraSha256']==y['fixture']['mountainGraSha256']=='0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6','gra hash')
ck(x['format']=='mk2_o96x_mountain_setup_palette_slot_49_control_entries_v1' and y['format']=='mk2_o96y_mountain_exact_full_64_indexed_sprite_corpus_v1' and x['status']==y['status']=='SUCCESS','report identities')
ck(H(xb)==y['o96xSha256'],'parent link x->y')
root=Path(__file__).resolve().parent.parent
ck(H((root/'mk2_mountain_palette_allocator_setup_o96w_2026-10-09.json').read_bytes())==x['o96wSha256'],'O96W parent frozen bytes')
ck(H((root/'mk2_mountain_selected_indexed_graphics_o96t_2026-10-09.json').read_bytes())==y['o96tSha256'],'O96T parent frozen bytes')
# Parse authentic DOS-bound LE structure independently from relocation/image table headers.
mz=0x26654;le=mz+u32(exe,mz+0x3c);pagebase=mz+u32(exe,le+0x80);fixindex=le+u32(exe,le+0x68);fixrecords=le+u32(exe,le+0x6c);pages=u32(exe,le+0x14)
ck((le,pagebase,pages)==(0x28f0c,0x61c54,113),'file topology')
relocs={};total=0
for pg in range(pages):
 q=fixrecords+u32(exe,fixindex+pg*4);end=fixrecords+u32(exe,fixindex+(pg+1)*4)
 while q<end:
  kind=exe[q]&15;flags=exe[q+1];delta=s16(exe,q+2);q+=4
  ck((flags&3)==0,'unsupported LE fixup flag')
  obj=u16(exe,q) if (flags&64) else exe[q];q+=2 if flags&64 else 1
  target=None
  if kind!=2:
   target=u32(exe,q) if flags&16 else u16(exe,q);q+=4 if flags&16 else 2
  if flags&4:q+=4 if flags&32 else 2
  ck(q<=end,'fixup page bounds')
  relocs[pagebase+4096*pg+delta]=(kind,flags,obj,target);total+=1
 ck(q==end,'fixup page exact end')
ck(total==27004==x['relocations'],'entire fixture relocation count')
base=0xa0c54
p=lambda offset:base+offset
def typed(off,obj,target):
 ck(u32(exe,p(off))==target,'typed raw target '+hex(off))
 ck(relocs.get(p(off))==(7,16,obj,target),'typed relocation '+hex(off))
ck(exe[0xa0ef1:0xa13a7].split(b'\x00')[37]==b'MOUNTAIN.GRA','resource ID')
ck(len(x['setupRecords'])==2 and len(x['controlEntries'])==49,'two setup 49-entry census')
ctrl=[]
for n,(s,count) in enumerate(((0x1c31e,39),(0x1c330,10))):
 setup=x['setupRecords'][n]
 ck(setup['setupOffset']==s and setup['entryCount']==count,'setup record identity')
 ck(u16(exe,p(s+4))==count,'file-backed setup count')
 lst=u32(exe,p(s+6));desc=u32(exe,p(s+10));palette=u32(exe,p(s+14))
 ck(desc==0x1c344 and palette==0x1c5bc,'common descriptor/palette arrays')
 for o,t in ((s+6,lst),(s+10,desc),(s+14,palette)):typed(o,2,t)
 ck(setup['controlListOffset']==lst and setup['descriptorBaseOffset']==desc and setup['paletteArrayOffset']==palette and setup['paletteSlot']==2,'setup JSON')
 for j in range(count):
  pos=lst+j*8;a=u16(exe,p(pos));c=u16(exe,p(pos+2));d=u16(exe,p(pos+4));e=u16(exe,p(pos+6));rec=x['controlEntries'][len(ctrl)]
  slot=(a%16)+(e//4096%16)*16;target=desc+4*(e%4096)
  ck(a==0x4042 and slot==2 and target in range(0x1c344,0x1c4cc,8),'bounded control interpretation')
  ck(rec['setupOffset']==s and rec['position']==j and rec['entryOffset']==pos,'control provenance')
  ck(rec['controlWordsHex']==[f'{v:04x}' for v in (a,c,d,e)],'four source words')
  ck(rec['derivedPaletteSlot']==slot and rec['derivedDescriptorOffset']==target,'derivation independent')
  ck(rec['descriptorOrdinal']==(target-0x1c344)//8,'mapped descriptor ordinal')
  ctrl.append((target-0x1c344)//8)
ck(sorted(ctrl)==list(range(49)),'49-control exhaustive permutation')
# Authenticated real allocator operand bytes, do not infer execution from byte presence alone.
ck(len(x['consumerMachine'])>=15,'consumer opcode evidence')
for item in x['consumerMachine']:
 off=item['physical'];hx=item['hex'];ck(exe[off:off+len(hx)//2].hex()==hx,'machine bytes '+hex(off))
for slot in range(8):typed(0x1c5bc+4*slot,1,0x2b52a)
ck(x['palette']=={'pointerSlot':2,'recordObject1Offset':0x2b52a,'count':207,'all49SlotsResolveToSameRecord':True},'palette join')
asserted=x['hypotheses'];ck(asserted['realGameSelectsTheseSetups']=='UNPROVEN' and asserted['rgbSceneActuallyRendered']=='UNPROVEN','no runtime promotion')
ck(u16(exe,0x8d17e)==207,'207 palette count')
for k in range(207):ck(u16(exe,0x8d17e+2+2*k)<=0x7fff,'15bit palette entry '+str(k))
# Independent graphics decoder uses a separate row-run cursor and checks end pointers, pixel/mask hashes.
def decode(start,width,height):
 rowptr=start;pixels=bytearray(width*height);opaque=0;low=256;high=-1;skip=rle=literal=0
 for row in range(height):
  column=0
  while column!=width:
   ck(rowptr+4<=len(gra),'stream bounded command')
   word=u32(gra,rowptr);rowptr+=4
   if word%2:
    run=word//2;kind='skip';skip+=1
   elif (word>>1)&1:
    run=word//1024;kind='rle';rle+=1
   else:
    run=word//4;kind='literal';literal+=1
   ck(run>0 and column+run<=width,'stream row extent')
   startpx=row*width+column
   if kind=='rle':
    value=(word//4)%256
    pixels[startpx:startpx+run]=bytearray([value])*run
    opaque+=run;low=min(low,value);high=max(high,value)
   elif kind=='literal':
    ck(run<=64 and rowptr+run<=len(gra),'literal data extent')
    data=gra[rowptr:rowptr+run];pixels[startpx:startpx+run]=data
    low=min(low,min(data));high=max(high,max(data));opaque+=run
    rowptr+=4*((run+3)//4)
   column+=run
 return (rowptr,bytes(pixels),opaque,low,high,{'skip':skip,'rle':rle,'literal':literal})
ck(len(y['sprites'])==64 and y['summary']['decodedImages']==64,'64 sprite evidence')
commands={'skip':0,'rle':0,'literal':0};running=0;pix_tot=0;opacity=0;highest=0;hashes=set()
for i,record in enumerate(y['sprites']):
 off=0x1c344+i*8 if i<49 else 0x1c4cc+(i-49)*16
 size=8 if i<49 else 16
 w=u16(exe,p(off));h=u16(exe,p(off+2));pk=u32(exe,p(off+4 if i<49 else off+8));j=pk&0xffffff
 ck(pk>>24==37 and j==running,'source file and gapless interval '+str(i))
 ck(record['ordinal']==i and record['descriptorOffset']==off and record['descriptorBytes']==size and record['packedReference']==pk,'descriptor origin '+str(i))
 ck(record['width']==w and record['height']==h and record['graStart']==j,'dimensions and byte offset '+str(i))
 if i>=49:ck(u32(exe,p(off+4))==0 and u32(exe,p(off+12))==0x2b52a,'suffix extended descriptor')
 end,pixels,opa,mi,ma,cmd=decode(j,w,h)
 ck(record['endExclusive']==end and record['encodedBytes']==end-j,'encoded byte limit '+str(i))
 ck(record['opaquePixels']==opa and record['transparentPixels']==w*h-opa,'opacity '+str(i))
 ck(record['pixelSha256']==H(pixels),'decoded pixel SHA '+str(i))
 # Existing O96Y mask SHA is also checked by reconstructing transparency via independent secondary walk below.
 ck(record['indexMin']==mi and record['indexMax']==ma,'indexed range '+str(i))
 ck(record['commands']==cmd,'command counts '+str(i))
 hashes.add(H(pixels));running=end;pix_tot+=w*h;opacity+=opa;highest=max(highest,ma)
 for typ,v in cmd.items():commands[typ]+=v
ck(running==len(gra)==191748 and y['summary']['encodedBytes']==running,'full resource consumed')
ck(y['sprites'][48]['endExclusive']==0x29314 and y['sprites'][49]['graStart']==0x29314,'prefix/suffix join')
ck(y['summary']['decodedPixels']==pix_tot and y['summary']['opaquePixels']==opacity and y['summary']['transparentPixels']==pix_tot-opacity,'pixel totals')
ck(len(hashes)==64 and y['summary']['uniquePixelSha256']==64,'unique pixels')
ck(y['summary']['commands']==commands,'all command totals')
ck(highest==206 and y['paletteIndexCompatibility']=={'paletteEntryCount':207,'indexMax':206,'allIndicesInRange':True,'actualRuntimeHandleOwnershipProven':False},'palette compatibility not ownership')
ck(y['summary']['allResourceBytesCoveredExactly'] is True,'qualified exact full decode')
ck(y['hypotheses']['completeCorrectColorRenderedScene']=='UNPROVEN' and y['hypotheses']['completeStageLayout']=='UNPROVEN','honest scene boundary')
# Independent second walk for source transparency to validate each mask checksum.
for i,record in enumerate(y['sprites']):
 w=record['width'];h=record['height'];idx=record['graStart'];alpha=bytearray(w*h)
 for row in range(h):
  xcol=0
  while xcol<w:
   word=u32(gra,idx);idx+=4
   if word&1:run=word>>1
   elif word&2:
    run=word>>10;alpha[row*w+xcol:row*w+xcol+run]=b'\x01'*run
   else:
    run=word>>2;alpha[row*w+xcol:row*w+xcol+run]=b'\x01'*run;idx+=4*((run+3)//4)
   xcol+=run
 ck(H(alpha)==record['maskSha256'],'transparent mask SHA '+str(i))
print('O96X/O96Y INDEPENDENT PASS:',checks,'checks, 0 failures; 49 mapped control entries, 64 decoded images, 191748/191748 GRA bytes, palette slot 2 conditional')

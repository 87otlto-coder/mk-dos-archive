#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,struct,sys,zipfile,zlib,binascii
root=Path(sys.argv[1]); package=Path(sys.argv[2]); reportp=Path(sys.argv[3]); out=Path(sys.argv[4])
exe=(root/'mk2.exe').read_bytes(); jc0=(root/'jc0.gra').read_bytes(); report=json.loads(reportp.read_text())
checks=[]
def ck(i,ok,detail): checks.append({'id':i,'passed':bool(ok),'detail':str(detail)})
def sha(b): return hashlib.sha256(b).hexdigest()
def u16(b,o): return struct.unpack_from('<H',b,o)[0]
def u32(b,o): return struct.unpack_from('<I',b,o)[0]
ck('exe_sha',sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',sha(exe))
ck('jc0_sha',sha(jc0)=='ef7b96d1725f45386f9503b252602db3ae22ab7ef638a3f1add91adb42079f1b',sha(jc0))
# MK2-native renderer palette-offset relation.
handle_sig=bytes.fromhex('8a 04 c5 06 5b 07 00 48 25 ff 00 00 00 8b 14 85 84 10 00 00')
ck('renderer_handle_start_minus_one',exe[0x659ea:0x659ea+len(handle_sig)]==handle_sig,exe[0x659ea:0x659ea+len(handle_sig)].hex())
ck('renderer_add_source_offset',exe[0x65a14:0x65a18]==bytes.fromhex('ad 03 c2 ab'),exe[0x65a14:0x65a18].hex())
lut=exe[0xa1cd8:0xa1cd8+1024]; ck('renderer_lut_256',len(lut)==1024 and all(u32(lut,i*4)==int.from_bytes(bytes([i])*4,'little') for i in range(256)),'256 replicated-byte entries')
# Exact O73-qualified palette records.
pdefs=[('selector_table_A_slot_02',0x8739e,'7adc8dc507fe4f8008179bb711de2f0c16e24bcbe989074f33352890080badec'),('selector_table_B_slot_02',0x8741e,'f9d2bf2a5327d4dd0b761a948e2c883831ad654820869c214bea797e44a3130e')]
palettes={}
for name,phys,expected in pdefs:
 raw=exe[phys:phys+128]; ck(f'{name}_count',u16(raw,0)==63,u16(raw,0)); ck(f'{name}_sha',sha(raw)==expected,sha(raw));
 words=[u16(raw,2+i*2) for i in range(63)]
 rgb6=[(((w>>9)&0x3f)|1,((w>>4)&0x3f)|1,((w<<1)&0x3f)|1) for w in words]
 rgb8=[tuple(round(v*255/63) for v in c) for c in rgb6]
 palettes[name]=(raw,words,rgb6,rgb8)
# Independent JC0 descriptor discovery and decoder.
def decode(off,w,h):
 pos=off; idx=bytearray(w*h); mask=bytearray(w*h); outi=0; used=set()
 for _ in range(h):
  x=0
  while x<w:
   if pos+4>len(jc0): raise ValueError('truncated')
   cmd=u32(jc0,pos)
   if cmd&1:
    n=cmd>>1;pos+=4
    if n<1 or x+n>w: raise ValueError('skip')
    outi+=n;x+=n
   elif cmd&2:
    n=cmd>>10;c=(cmd>>2)&255;pos+=4
    if n<1 or x+n>w: raise ValueError('rle')
    idx[outi:outi+n]=bytes([c])*n;mask[outi:outi+n]=b'\1'*n;used.add(c);outi+=n;x+=n
   else:
    n=cmd>>2;pos+=4
    if n<1 or n>64 or x+n>w or pos+n>len(jc0): raise ValueError('literal')
    vals=jc0[pos:pos+n];idx[outi:outi+n]=vals;mask[outi:outi+n]=b'\1'*n;used.update(vals);outi+=n;x+=n;pos+=(n+3)&~3
 return bytes(idx),bytes(mask),pos-off,used
found=[]
for p0 in range(0xa0c54,len(exe)-11,4):
 w,h=struct.unpack_from('<HH',exe,p0); x,y=struct.unpack_from('<hh',exe,p0+4); ref=u32(exe,p0+8); rid=ref>>24;off=ref&0xffffff
 if rid!=109 or not(1<=w<=640 and 1<=h<=480 and -1000<=x<=1000 and -1000<=y<=1000 and off<len(jc0)): continue
 try:d=decode(off,w,h)
 except Exception: continue
 found.append((p0,w,h,x,y,off,d))
found.sort(key=lambda r:(r[5],r[0])); ck('jc0_descriptor_count',len(found)==35,len(found)); ck('jc0_descriptor_bounds',found and found[0][0]==0xc53d8 and found[-1][0]==0xc5574,(hex(found[0][0]),hex(found[-1][0])))
union=set()
for i,f in enumerate(found):
 p0,w,h,x,y,off,d=f; idx,mask,n,used=d; union|=used; nxt=found[i+1][5] if i+1<len(found) else len(jc0); ck(f'jc0_tile_{i:02}',off+n==nxt,(hex(off),hex(off+n),hex(nxt)))
ck('jc0_index_domain',union==set(range(1,64)),(min(union),max(union),len(union)))
# PNG parser independent of TS encoder.
def png_rgba(data):
 if data[:8]!=b'\x89PNG\r\n\x1a\n': raise ValueError('png sig')
 p=8;idat=[];w=h=None
 while p<len(data):
  n=struct.unpack('>I',data[p:p+4])[0];typ=data[p+4:p+8];payload=data[p+8:p+8+n];crc=struct.unpack('>I',data[p+8+n:p+12+n])[0]
  if binascii.crc32(typ+payload)&0xffffffff!=crc: raise ValueError('png crc')
  p+=12+n
  if typ==b'IHDR': w,h,bd,ct,comp,filt,inter=struct.unpack('>IIBBBBB',payload); assert (bd,ct,comp,filt,inter)==(8,6,0,0,0)
  elif typ==b'IDAT': idat.append(payload)
  elif typ==b'IEND': break
 raw=zlib.decompress(b''.join(idat)); row=w*4+1
 if len(raw)!=row*h: raise ValueError('png rows')
 rgba=bytearray(w*h*4)
 for y in range(h):
  if raw[y*row]!=0: raise ValueError('png filter')
  rgba[y*w*4:(y+1)*w*4]=raw[y*row+1:(y+1)*row]
 return w,h,bytes(rgba)
def expected_rgba(idx,mask,words):
 out=bytearray(len(idx)*4)
 for i,(n,m) in enumerate(zip(idx,mask)):
  if not m: continue
  if not 1<=n<=63: raise ValueError('palette range')
  w=words[n-1]; c=(((w>>9)&0x3f)|1,((w>>4)&0x3f)|1,((w<<1)&0x3f)|1); p=i*4
  out[p:p+4]=bytes([round(c[0]*255/63),round(c[1]*255/63),round(c[2]*255/63),255])
 return bytes(out)
with zipfile.ZipFile(package,'r') as z:
 infos=z.infolist(); zn=[i.filename for i in infos]; ck('zip_entry_count',len(infos)==75,len(infos)); ck('zip_unique',len(set(zn))==75,len(set(zn))); ck('zip_crc',z.testzip() is None,z.testzip())
 pm=json.loads(z.read('manifests/palettes.json')); am=json.loads(z.read('manifests/assets.json')); readme=z.read('README.md').decode('utf-8')
 ck('palette_manifest_scope',pm['resourceName']=='JC0.GRA' and pm['identitySlot']==2 and pm['paletteSelectorSlot']==2 and pm['semanticContextNamesEstablished'] is False,pm.get('resourceName'))
 ck('asset_manifest_counts',am['descriptorCount']==35 and am['contextCount']==2 and am['pngCount']==70,(am['descriptorCount'],am['contextCount'],am['pngCount']))
 ck('readme_semantic_boundary','no normal/alternate' in readme and 'gameplay meaning is claimed' in readme,readme[:140])
 for name,phys,expected in pdefs:
  raw=z.read(f'palettes/{name}.palette_record.bin'); ck(f'{name}_package_raw',raw==palettes[name][0],sha(raw))
 assets={(a['context'],a['ordinal']):a for a in am['assets']}; repassets={(a['context'],a['ordinal']):a for a in report['assets']}
 for i,f in enumerate(found):
  p0,w,h,x,y,off,d=f;idx,mask,n,used=d
  for name,phys,expected in pdefs:
   er=expected_rgba(idx,mask,palettes[name][1]); path=f'rgba/{name}/{i:02}_{off:06x}.png'; pw,ph,pr=png_rgba(z.read(path)); key=(name,i)
   ck(f'rgba_{name}_{i:02}',pw==w and ph==h and pr==er,(pw,ph,sha(pr)))
   ck(f'manifest_{name}_{i:02}',key in assets and assets[key]['descriptorPhysical']==p0 and assets[key]['graOffset']==off and assets[key]['rgbaSha256']==sha(er),assets.get(key,{}).get('rgbaSha256'))
   ck(f'report_{name}_{i:02}',key in repassets and repassets[key]['rgbaSha256']==sha(er),repassets.get(key,{}).get('rgbaSha256'))
ck('report_verdict',report['decision']['verdict']=='MK2_JC0_TWO_UNNAMED_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED',report['decision']['verdict'])
ck('report_context_boundary',report['decision']['paletteContextNamesPromoted'] is False and report['decision']['broadResourcePaletteOwnershipPromoted'] is False,report['decision'])
ck('package_sha_matches_report',sha(package.read_bytes())==report['package']['sha256'],sha(package.read_bytes()))
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o74_independent_audit_v1','source':'independent Python reconstruction from authentic MK2.EXE + JC0.GRA; does not call TypeScript O74 implementation','packageSha256':sha(package.read_bytes()),'checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'all70RgbaPayloadsIndependentlyReconstructed':not failed,'paletteContextNamesRemainUnresolved':True,'broadPaletteOwnershipNotPromoted':True,'verdict':'MK2_O74_INDEPENDENT_RGBA_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.write_text(json.dumps(res,indent=2)); print(json.dumps({k:res[k] for k in ['packageSha256','checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed: print(json.dumps(failed[:20],indent=2)); sys.exit(1)

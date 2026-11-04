#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,struct,sys,zipfile,zlib,binascii
root=Path(sys.argv[1]); package=Path(sys.argv[2]); reportp=Path(sys.argv[3]); out=Path(sys.argv[4])
exe=(root/'mk2.exe').read_bytes(); nj7=(root/'nj7.gra').read_bytes(); report=json.loads(reportp.read_text())
checks=[]
def ck(i,ok,detail): checks.append({'id':i,'passed':bool(ok),'detail':str(detail)})
def sha(b): return hashlib.sha256(b).hexdigest()
def u16(b,o): return struct.unpack_from('<H',b,o)[0]
def u32(b,o): return struct.unpack_from('<I',b,o)[0]
ck('exe_sha',sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',sha(exe))
ck('nj7_sha',sha(nj7)=='4de11628c34955832742166b330aacb01d4422cca09027fb626acd4e3698ab8e',sha(nj7))
# Generic MK2 renderer palette-offset relation, independently rechecked.
handle_sig=bytes.fromhex('8a 04 c5 06 5b 07 00 48 25 ff 00 00 00 8b 14 85 84 10 00 00')
ck('renderer_handle_start_minus_one',exe[0x659ea:0x659ea+len(handle_sig)]==handle_sig,exe[0x659ea:0x659ea+len(handle_sig)].hex())
ck('renderer_add_source_offset',exe[0x65a14:0x65a18]==bytes.fromhex('ad 03 c2 ab'),exe[0x65a14:0x65a18].hex())
lut=exe[0xa1cd8:0xa1cd8+1024];ck('renderer_lut_256',len(lut)==1024 and all(u32(lut,i*4)==int.from_bytes(bytes([i])*4,'little') for i in range(256)),'256 replicated-byte entries')
# O72 slot-8 exact palettes.
pdefs=[('selector_table_A_slot_08','DEFAULT_CHARACTER_PALETTE',0x87f9e,'2d7d4ba61593ead73ef6d672bc0e6bf8e742ba0d80f463995da3ce41380cdd6e'),('selector_table_B_slot_08','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE',0x8801e,'5d5cab5ed9e55bc356c79a6d354b4ad0ec5dc41229055b557c5aefbdcfac6894')]
palettes={}
for name,semantic,phys,expected in pdefs:
 raw=exe[phys:phys+128];ck(f'{name}_count',u16(raw,0)==63,u16(raw,0));ck(f'{name}_sha',sha(raw)==expected,sha(raw));words=[u16(raw,2+i*2) for i in range(63)];palettes[name]=(raw,words,semantic)
# Independently discover and decode all NJ7 descriptors from file-backed Object 2.
def decode(off,w,h):
 pos=off;idx=bytearray(w*h);mask=bytearray(w*h);outi=0;used=set()
 for _ in range(h):
  x=0
  while x<w:
   if pos+4>len(nj7): raise ValueError('truncated')
   cmd=u32(nj7,pos)
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
    if n<1 or n>64 or x+n>w or pos+n>len(nj7): raise ValueError('literal')
    vals=nj7[pos:pos+n];idx[outi:outi+n]=vals;mask[outi:outi+n]=b'\1'*n;used.update(vals);outi+=n;x+=n;pos+=(n+3)&~3
 return bytes(idx),bytes(mask),pos-off,used
found=[]
for p0 in range(0xa0c54,len(exe)-11,4):
 w,h=struct.unpack_from('<HH',exe,p0);x,y=struct.unpack_from('<hh',exe,p0+4);ref=u32(exe,p0+8);rid=ref>>24;off=ref&0xffffff
 if rid!=55 or not(1<=w<=640 and 1<=h<=480 and -1000<=x<=1000 and -1000<=y<=1000 and off<len(nj7)): continue
 try:d=decode(off,w,h)
 except Exception: continue
 found.append((p0,w,h,x,y,off,d))
# dedupe by offset/geometry exactly as strict O69 exact-full row does
by={}
for f in found: by.setdefault(f[5],[]).append(f)
reps=[];amb=0
for off in sorted(by):
 g=by[off]; sig={(x[1],x[2],x[6][2]) for x in g};amb+=len(sig)!=1; reps.append(sorted(g,key=lambda x:x[0])[0])
ck('nj7_candidate_descriptor_count',len(found)==116,len(found));ck('nj7_unique_stream_count',len(reps)==116,len(reps));ck('nj7_no_ambiguity',amb==0,amb);ck('nj7_first_descriptor',reps[0][0]==0xc924c and reps[0][5]==0,(hex(reps[0][0]),hex(reps[0][5])));ck('nj7_last_descriptor',reps[-1][0]==0xc97d8,(hex(reps[-1][0]),hex(reps[-1][5])))
union=set()
for i,f in enumerate(reps):
 p0,w,h,x,y,off,d=f;idx,mask,n,used=d;union|=used;nxt=reps[i+1][5] if i+1<len(reps) else len(nj7);ck(f'nj7_tile_{i:02}',off+n==nxt,(hex(off),hex(off+n),hex(nxt)))
ck('nj7_exact_eof',reps[-1][5]+reps[-1][6][2]==len(nj7),(hex(reps[-1][5]+reps[-1][6][2]),hex(len(nj7))))
ck('nj7_index_domain',min(union)==1 and max(union)==63 and union.issubset(set(range(1,64))),(min(union),max(union),len(union)))
# Independent slot-8 connected provenance: start only from slot 8's unique prefix field 0x9C60 and prove one NJ7 offset-0 path.
# O87 deliberately does not claim NJ7 is the complete/canonical slot-8 geometry because other connected NJ-family branches exist.
LE=0x28f0c; DATA=0x61c54; page_size=u32(exe,LE+0x28); module_pages=u32(exe,LE+0x14); objtab=LE+u32(exe,LE+0x40); objcnt=u32(exe,LE+0x44); objmap=LE+u32(exe,LE+0x48); fpt=LE+u32(exe,LE+0x68); frt=LE+u32(exe,LE+0x6c)
objs=[]
for ii in range(objcnt):
 p=objtab+ii*24;objs.append((ii+1,u32(exe,p+12),u32(exe,p+16)))
pnums=[]
for ii in range(module_pages):
 p=objmap+ii*4;pnums.append((exe[p]<<16)|(exe[p+1]<<8)|exe[p+2])
def pagephys(lp):return DATA+(pnums[lp-1]-1)*page_size
def objfor(lp):
 for idx,pmi,pc in objs:
  if pmi<=lp<pmi+pc:return idx,lp-pmi
 raise ValueError('object page')
po=[u32(exe,fpt+ii*4) for ii in range(module_pages+1)];fx={}
for pg0 in range(module_pages):
 p=frt+po[pg0];end=frt+po[pg0+1]
 while p<end:
  src,flags=exe[p],exe[p+1];p+=2;st=src&15;so=struct.unpack_from('<h',exe,p)[0];p+=2
  if src&0x20: raise ValueError('source-list')
  ob=2 if flags&0x40 else 1;tobj=u16(exe,p) if ob==2 else exe[p];p+=ob;toff=0
  if st!=2:
   if flags&0x10:toff=u32(exe,p);p+=4
   else:toff=u16(exe,p);p+=2
  if flags&4:p+=4 if flags&0x20 else 2
  oi,pw=objfor(pg0+1)
  if oi==2 and st==7:fx[pw*page_size+so]=(tobj,toff)
 if p!=end:raise ValueError('fixup parse')
ck('nj7_connected_root_edge',fx.get(0x9c60)==(2,0xac4a),fx.get(0x9c60))
ck('nj7_connected_level1_edge',fx.get(0xac7a)==(2,0xaca6),fx.get(0xac7a))
ck('nj7_connected_level2_edge',fx.get(0xace2)==(2,0xad16),fx.get(0xace2))
ck('nj7_connected_descriptor_edge',fx.get(0xad4e)==(2,0x285f8),fx.get(0xad4e))
ck('nj7_identity_witness',reps[0][0]==0xc924c and 0xa0c54+0x285f8==0xc924c,'connected slot-8 unique-prefix path reaches NJ7 offset-0 descriptor')
# Preserve the ambiguity boundary: slot 8 root has other Object-2 pointer branches, so this is one connected contract only.
root_unique=[fx.get(x) for x in (0x9c54,0x9c58,0x9c5c,0x9c60,0x9c64)]
ck('slot8_unique_prefix_has_multiple_branches',sum(1 for x in root_unique if x and x[0]==2)==5,root_unique)

# PNG parser and expected RGBA reconstruction.
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
 raw=zlib.decompress(b''.join(idat));row=w*4+1
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
  w=words[n-1];c=(((w>>9)&0x3f)|1,((w>>4)&0x3f)|1,((w<<1)&0x3f)|1);p=i*4
  out[p:p+4]=bytes([round(c[0]*255/63),round(c[1]*255/63),round(c[2]*255/63),255])
 return bytes(out)
with zipfile.ZipFile(package,'r') as z:
 infos=z.infolist();zn=[i.filename for i in infos];ck('zip_entry_count',len(infos)==237,len(infos));ck('zip_unique',len(set(zn))==237,len(set(zn)));ck('zip_crc',z.testzip() is None,z.testzip())
 pm=json.loads(z.read('manifests/palettes.json'));am=json.loads(z.read('manifests/assets.json'));readme=z.read('README.md').decode()
 ck('palette_manifest_scope',pm['resourceName']=='NJ7.GRA' and pm['identitySlot']==8 and pm['scope']=='NJ7_SLOT8_ONLY_NOT_WHOLE_NJ_FAMILY',pm)
 ck('asset_manifest_counts',am['descriptorCount']==116 and am['contextCount']==2 and am['pngCount']==232,(am['descriptorCount'],am['contextCount'],am['pngCount']))
 ck('readme_scope','not claim NJ7 is the complete or canonical slot-8 geometry' in readme and 'whole NJ family' in readme and 'earlier slot-8 NJ6 witness' in readme,readme[:300])
 for name,semantic,phys,expected in pdefs:
  raw=z.read(f'palettes/{name}.palette_record.bin');ck(f'{name}_package_raw',raw==palettes[name][0],sha(raw))
 assets={(a['structuralContext'],a['ordinal']):a for a in am['assets']};repassets={(a['structuralContext'],a['ordinal']):a for a in report['assets']}
 for i,f in enumerate(reps):
  p0,w,h,x,y,off,d=f;idx,mask,n,used=d
  for name,semantic,phys,expected in pdefs:
   er=expected_rgba(idx,mask,palettes[name][1]);folder=semantic.lower();path=f'rgba/{folder}/{i:02}_{off:06x}.png';pw,ph,pr=png_rgba(z.read(path));key=(name,i)
   ck(f'rgba_{name}_{i:02}',pw==w and ph==h and pr==er,(pw,ph,sha(pr)))
   ck(f'manifest_{name}_{i:02}',key in assets and assets[key]['descriptorPhysical']==p0 and assets[key]['graOffset']==off and assets[key]['semanticAlias']==semantic and assets[key]['rgbaSha256']==sha(er),assets.get(key,{}).get('rgbaSha256'))
   ck(f'report_{name}_{i:02}',key in repassets and repassets[key]['rgbaSha256']==sha(er),repassets.get(key,{}).get('rgbaSha256'))
ck('report_verdict',report['decision']['verdict']=='MK2_NJ7_SLOT8_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED',report['decision']['verdict'])
ck('report_scope',report['decision']['wholeNJFamilyPaletteOwnershipPromoted'] is False and report['decision']['humanFighterNamePromoted'] is False,report['decision'])
ck('report_semantics',report['paletteContexts'][0]['semanticAlias']=='DEFAULT_CHARACTER_PALETTE' and report['paletteContexts'][1]['semanticAlias']=='SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE','default / duplicate')
ck('package_sha_matches_report',sha(package.read_bytes())==report['package']['sha256'],sha(package.read_bytes()))
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o87_independent_audit_v1','source':'independent Python reconstruction from authentic MK2.EXE + NJ7.GRA; independently reparses LE fixups and does not call TypeScript O87 implementation','packageSha256':sha(package.read_bytes()),'checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'all232RgbaPayloadsIndependentlyReconstructed':not failed,'slot8Nj7ConnectedContractScopePreserved':True,'wholeNJFamilyPaletteOwnershipNotPromoted':True,'humanFighterNameNotPromoted':True,'verdict':'MK2_O87_INDEPENDENT_RGBA_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['packageSha256','checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed: print(json.dumps(failed[:20],indent=2));sys.exit(1)

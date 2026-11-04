#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,struct,sys,zipfile,zlib,binascii
root=Path(sys.argv[1]); package=Path(sys.argv[2]); reportp=Path(sys.argv[3]); out=Path(sys.argv[4])
exe=(root/'mk2.exe').read_bytes(); ba0=(root/'ba0.gra').read_bytes(); report=json.loads(reportp.read_text())
checks=[]
def ck(i,ok,detail): checks.append({'id':i,'passed':bool(ok),'detail':str(detail)})
def sha(b): return hashlib.sha256(b).hexdigest()
def u16(b,o): return struct.unpack_from('<H',b,o)[0]
def u32(b,o): return struct.unpack_from('<I',b,o)[0]
ck('exe_sha',sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',sha(exe))
ck('ba0_sha',sha(ba0)=='bce354dc74b2e12d05a0e6643364ffaabbc3b8bc789a834fe4c8113fd36023fd',sha(ba0))
# Generic MK2 renderer palette-offset relation, independently rechecked.
handle_sig=bytes.fromhex('8a 04 c5 06 5b 07 00 48 25 ff 00 00 00 8b 14 85 84 10 00 00')
ck('renderer_handle_start_minus_one',exe[0x659ea:0x659ea+len(handle_sig)]==handle_sig,exe[0x659ea:0x659ea+len(handle_sig)].hex())
ck('renderer_add_source_offset',exe[0x65a14:0x65a18]==bytes.fromhex('ad 03 c2 ab'),exe[0x65a14:0x65a18].hex())
lut=exe[0xa1cd8:0xa1cd8+1024];ck('renderer_lut_256',len(lut)==1024 and all(u32(lut,i*4)==int.from_bytes(bytes([i])*4,'little') for i in range(256)),'256 replicated-byte entries')
# O72 slot-3 exact palettes.
pdefs=[('selector_table_A_slot_03','DEFAULT_CHARACTER_PALETTE',0x8759e,'88c20a63940c97ccd0a8bfd5a534959fd2901ddd65b44e41687cad4d360a8347'),('selector_table_B_slot_03','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE',0x8761E,'8e69dfc77db334ce295a2de71fe1db119139a7221733bb9b09592cef0ae0f3eb')]
palettes={}
for name,semantic,phys,expected in pdefs:
 raw=exe[phys:phys+128];ck(f'{name}_count',u16(raw,0)==63,u16(raw,0));ck(f'{name}_sha',sha(raw)==expected,sha(raw));words=[u16(raw,2+i*2) for i in range(63)];palettes[name]=(raw,words,semantic)
# Independently discover and decode all BA0 descriptors from file-backed Object 2.
def decode(off,w,h):
 pos=off;idx=bytearray(w*h);mask=bytearray(w*h);outi=0;used=set()
 for _ in range(h):
  x=0
  while x<w:
   if pos+4>len(ba0): raise ValueError('truncated')
   cmd=u32(ba0,pos)
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
    if n<1 or n>64 or x+n>w or pos+n>len(ba0): raise ValueError('literal')
    vals=ba0[pos:pos+n];idx[outi:outi+n]=vals;mask[outi:outi+n]=b'\1'*n;used.update(vals);outi+=n;x+=n;pos+=(n+3)&~3
 return bytes(idx),bytes(mask),pos-off,used
found=[]
for p0 in range(0xa0c54,len(exe)-11,4):
 w,h=struct.unpack_from('<HH',exe,p0);x,y=struct.unpack_from('<hh',exe,p0+4);ref=u32(exe,p0+8);rid=ref>>24;off=ref&0xffffff
 if rid!=91 or not(1<=w<=640 and 1<=h<=480 and -1000<=x<=1000 and -1000<=y<=1000 and off<len(ba0)): continue
 try:d=decode(off,w,h)
 except Exception: continue
 found.append((p0,w,h,x,y,off,d))
# dedupe by offset/geometry exactly as strict O69 exact-full row does
by={}
for f in found: by.setdefault(f[5],[]).append(f)
reps=[];amb=0
for off in sorted(by):
 g=by[off]; sig={(x[1],x[2],x[6][2]) for x in g};amb+=len(sig)!=1; reps.append(sorted(g,key=lambda x:x[0])[0])
ck('ba0_candidate_descriptor_count',len(found)==44,len(found));ck('ba0_unique_stream_count',len(reps)==44,len(reps));ck('ba0_no_ambiguity',amb==0,amb);ck('ba0_first_descriptor',reps[0][0]==0xc5fc0 and reps[0][5]==0,(hex(reps[0][0]),hex(reps[0][5])));ck('ba0_last_descriptor',reps[-1][0]==0xc61cc,(hex(reps[-1][0]),hex(reps[-1][5])))
union=set()
for i,f in enumerate(reps):
 p0,w,h,x,y,off,d=f;idx,mask,n,used=d;union|=used;nxt=reps[i+1][5] if i+1<len(reps) else len(ba0);ck(f'ba0_tile_{i:02}',off+n==nxt,(hex(off),hex(off+n),hex(nxt)))
ck('ba0_exact_eof',reps[-1][5]+reps[-1][6][2]==len(ba0),(hex(reps[-1][5]+reps[-1][6][2]),hex(len(ba0))))
ck('ba0_index_domain',min(union)==1 and max(union)==63 and union.issubset(set(range(1,64))),(min(union),max(union),len(union)))
# Independent O73 identity witness bytes: slot 3 path reaches first BA0 descriptor.
ck('ba0_identity_witness',reps[0][0]==0xc5fc0,'slot-3 O73 witness == BA0 offset-0 descriptor')
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
 infos=z.infolist();zn=[i.filename for i in infos];ck('zip_entry_count',len(infos)==93,len(infos));ck('zip_unique',len(set(zn))==93,len(set(zn)));ck('zip_crc',z.testzip() is None,z.testzip())
 pm=json.loads(z.read('manifests/palettes.json'));am=json.loads(z.read('manifests/assets.json'));readme=z.read('README.md').decode()
 ck('palette_manifest_scope',pm['resourceName']=='BA0.GRA' and pm['identitySlot']==3 and pm['scope']=='BA0_ONLY_NOT_WHOLE_BA_FAMILY',pm)
 ck('asset_manifest_counts',am['descriptorCount']==44 and am['contextCount']==2 and am['pngCount']==88,(am['descriptorCount'],am['contextCount'],am['pngCount']))
 ck('readme_scope','BA1+' in readme and 'whole BA family' in readme,readme[:180])
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
ck('report_verdict',report['decision']['verdict']=='MK2_BA0_FOURTH_FIGHTER_RESOURCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED',report['decision']['verdict'])
ck('report_scope',report['decision']['wholeBAFamilyPaletteOwnershipPromoted'] is False and report['decision']['humanFighterNamePromoted'] is False,report['decision'])
ck('report_semantics',report['paletteContexts'][0]['semanticAlias']=='DEFAULT_CHARACTER_PALETTE' and report['paletteContexts'][1]['semanticAlias']=='SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE','default / duplicate')
ck('package_sha_matches_report',sha(package.read_bytes())==report['package']['sha256'],sha(package.read_bytes()))
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o79_independent_audit_v1','source':'independent Python reconstruction from authentic MK2.EXE + BA0.GRA; does not call TypeScript O79 implementation','packageSha256':sha(package.read_bytes()),'checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'all88RgbaPayloadsIndependentlyReconstructed':not failed,'ba0OnlyScopePreserved':True,'wholeBAFamilyPaletteOwnershipNotPromoted':True,'humanFighterNameNotPromoted':True,'verdict':'MK2_O79_INDEPENDENT_RGBA_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['packageSha256','checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed: print(json.dumps(failed[:20],indent=2));sys.exit(1)

#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, struct, zipfile, zlib, sys
root=Path(sys.argv[1]); package=Path(sys.argv[2]); o67p=Path(sys.argv[3]); o68p=Path(sys.argv[4]); out=Path(sys.argv[5])
exe=(root/'mk2.exe').read_bytes(); jc0=(root/'jc0.gra').read_bytes(); o67=json.loads(o67p.read_text()); o68=json.loads(o68p.read_text())
checks=[]
def ck(i,ok,detail): checks.append({'id':i,'passed':bool(ok),'detail':str(detail)})
def sha(b): return hashlib.sha256(b).hexdigest()
ck('exe_sha',sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',sha(exe)); ck('jc0_sha',sha(jc0)=='ef7b96d1725f45386f9503b252602db3ae22ab7ef638a3f1add91adb42079f1b',sha(jc0))
# independent filesystem census
files=[p for p in root.rglob('*') if p.is_file()]
total_file_bytes=sum(p.stat().st_size for p in files)
ultramid=root/'ultramid.ini'
ultramid_present=ultramid.is_file()
ultramid_ok=(not ultramid_present) or (ultramid.stat().st_size==6720 and sha(ultramid.read_bytes())=='00a280d61e5017744351f0167c80e2d247584028ddacc3f6ed941ec8e405be5d')
envelope_ok=(ultramid_present and len(files)==614 and total_file_bytes==19921006) or ((not ultramid_present) and len(files)==613 and total_file_bytes==19914286)
ck('file_count',envelope_ok,{'count':len(files),'ultramid_present':ultramid_present})
ck('file_bytes',envelope_ok,{'bytes':total_file_bytes,'ultramid_present':ultramid_present})
ck('optional_ultramid_ini',ultramid_ok,sha(ultramid.read_bytes()) if ultramid_present else 'absent; recognized authentic envelope variant')
ck('root_gra',len(list(root.glob('*.gra')))==124,len(list(root.glob('*.gra')))); ck('fx_u8',len(list((root/'fx').glob('*.u8')))==312,len(list((root/'fx').glob('*.u8'))))
byext={e:len(list((root/'sound').glob(f'*.{e.lower()}'))) for e in ['AWE','GVS','LAP','MID','SBL']}; ck('sound_33_each',all(v==33 for v in byext.values()),byext)
# independent LE header parse
le=0x28f0c; ck('le_magic',exe[le:le+4]==b'LE\0\0',exe[le:le+4].hex()); u32=lambda o:struct.unpack_from('<I',exe,o)[0]; u16=lambda o:struct.unpack_from('<H',exe,o)[0]
ck('le_core',u16(le+8)==2 and u16(le+10)==1 and u32(le+0x14)==113 and u32(le+0x28)==4096 and u32(le+0x2c)==1913,(u16(le+8),u16(le+10),u32(le+0x14),u32(le+0x28),u32(le+0x2c)))
obj=[]
for i in range(2):
 p=le+u32(le+0x40)+24*i; obj.append(tuple(u32(p+x) for x in [0,4,8,12,16]))
ck('le_objects',obj==[(0x3ee98,0x10000,0x2045,1,63),(0x86660,0x50000,0x2043,64,50)],obj)
page_map=le+u32(le+0x48); pages=[(exe[page_map+4*i]<<16)|(exe[page_map+4*i+1]<<8)|exe[page_map+4*i+2] for i in range(113)]; ck('page_map',pages==list(range(1,114)),pages[:3]+pages[-3:])
tail=u32(le+0x80)+112*4096+u32(le+0x2c); ck('tail_boundary',tail==0xabd79 and len(exe)-tail==157268,(hex(tail),len(exe)-tail))
# resource pool independently parsed
start=exe.find(b'PLAYSTA.GRA\0'); names=[]; p=start
while True:
 z=exe.index(0,p); n=exe[p:z].decode('ascii'); names.append(n);p=z+1
 if n=='RM.DRV': break
ck('pool_bounds',start==0xa0ef1 and p==0xa13a7,(hex(start),hex(p))); ck('pool_counts',len(names)==129 and sum(n.endswith('.GRA') for n in names)==123 and sum(n.endswith('.BIN') for n in names)==5,(len(names),sum(n.endswith('.GRA') for n in names),sum(n.endswith('.BIN') for n in names))); ck('jc0_ordinal',names[109]=='JC0.GRA',names[109])
# renderer signatures independently checked
sig1=bytes.fromhex('8b 06 d1 e8 72 2a d1 e8 72 3e 8d 58 03 80 e3 fc 8d 74 1e 04 83 f8 40'); sig2=bytes.fromhex('8b d0 81 e2 ff 00 00 00 8b 14 95 84 10 00 00 03 d3 c1 e8 08')
ck('renderer_sig1',exe[0x69f0c:0x69f0c+len(sig1)]==sig1,exe[0x69f0c:0x69f0c+len(sig1)].hex()); ck('renderer_sig2',exe[0x6a46c:0x6a46c+len(sig2)]==sig2,exe[0x6a46c:0x6a46c+len(sig2)].hex())
def decode(off,w,h):
 pos=off; idx=bytearray(w*h); mask=bytearray(w*h); outi=0; oc=tc=lit=rle=skip=0; used=set()
 for _ in range(h):
  x=0
  while x<w:
   if pos+4>len(jc0): raise ValueError('truncated command')
   cmd=struct.unpack_from('<I',jc0,pos)[0]
   if cmd&1:
    n=cmd>>1; pos+=4
    if n<1 or x+n>w: raise ValueError('skip')
    outi+=n;x+=n;tc+=n;skip+=1
   elif cmd&2:
    n=cmd>>10;c=(cmd>>2)&255;pos+=4
    if n<1 or x+n>w: raise ValueError('rle')
    idx[outi:outi+n]=bytes([c])*n;mask[outi:outi+n]=b'\1'*n;outi+=n;x+=n;oc+=n;rle+=1;used.add(c)
   else:
    n=cmd>>2;pos+=4
    if n<1 or n>64 or x+n>w or pos+n>len(jc0): raise ValueError('literal')
    vals=jc0[pos:pos+n];idx[outi:outi+n]=vals;mask[outi:outi+n]=b'\1'*n;used.update(vals);outi+=n;x+=n;oc+=n;lit+=1;pos+=(n+3)&~3
 return bytes(idx),bytes(mask),pos-off,oc,tc,lit,rle,skip,used
# independently discover candidate corpus
found=[]
for p0 in range((tail+3)&~3,len(exe)-11,4):
 w,h=struct.unpack_from('<HH',exe,p0); x,y=struct.unpack_from('<hh',exe,p0+4); ref=struct.unpack_from('<I',exe,p0+8)[0]; rid=ref>>24; off=ref&0xffffff
 if rid!=109 or not(1<=w<=640 and 1<=h<=480 and -1000<=x<=1000 and -1000<=y<=1000 and off<len(jc0)): continue
 try:d=decode(off,w,h)
 except Exception:continue
 found.append((p0,w,h,x,y,off,d))
found.sort(key=lambda r:(r[5],r[0])); ck('descriptor_count',len(found)==35,len(found)); ck('descriptor_phys_bounds',found[0][0]==0xc53d8 and found[-1][0]==0xc5574,(hex(found[0][0]),hex(found[-1][0])))
for i,f in enumerate(found):
 end=f[5]+f[6][2]; nxt=found[i+1][5] if i+1<len(found) else len(jc0); ck(f'tile_{i:02}',end==nxt,(hex(f[5]),hex(end),hex(nxt)))
# package exact inventory / bytes
with zipfile.ZipFile(package,'r') as z:
 infos=z.infolist(); namesz=[i.filename for i in infos]; ck('zip_entry_count',len(infos)==74,len(infos)); ck('zip_unique',len(set(namesz))==74,len(set(namesz))); ck('zip_test',z.testzip() is None,z.testzip())
 manifest=json.loads(z.read('manifest.json')); ck('manifest_assets',manifest['assetCount']==35 and len(manifest['assets'])==35,(manifest['assetCount'],len(manifest['assets']))); ck('manifest_policy',manifest['palettePolicy']=='PALETTE_UNRESOLVED_INDEXED_ONLY',manifest['palettePolicy'])
 totalpix=opq=trans=lit=rle=skip=0; union=set()
 for i,f in enumerate(found):
  p0,w,h,x,y,off,d=f; idx,mask,n,oc,tc,lc,rc,sc,used=d; base=f'jc0/indexed/{i:02}_{off:06x}'; zi=z.read(base+'.indices.bin'); zm=z.read(base+'.mask.bin')
  ck(f'indices_bytes_{i:02}',zi==idx,sha(zi)); ck(f'mask_bytes_{i:02}',zm==mask,sha(zm)); ma=manifest['assets'][i]; ck(f'manifest_meta_{i:02}',ma['descriptorPhysical']==p0 and ma['graOffset']==off and ma['width']==w and ma['height']==h and ma['x']==x and ma['y']==y,(ma['descriptorPhysical'],ma['graOffset'],ma['width'],ma['height']))
  ck(f'manifest_hash_{i:02}',ma['indicesSha256']==sha(idx) and ma['maskSha256']==sha(mask),(ma['indicesSha256'],ma['maskSha256']))
  totalpix+=len(idx);opq+=oc;trans+=tc;lit+=lc;rle+=rc;skip+=sc;union|=used
 ck('aggregate_pixels',totalpix==194096 and opq==70283 and trans==123813,(totalpix,opq,trans)); ck('aggregate_commands',lit==5502 and rle==1773 and skip==8234,(lit,rle,skip)); ck('index_domain',union==set(range(1,64)),(min(union),max(union),len(union)))
 stable_o68=json.loads(z.read('o68_indexed_graphics_decode_foundation.json')); ck('package_o68_verdict',stable_o68['decision']['verdict']=='MK2_JC0_INDEXED_GRAPHICS_DESCRIPTOR_STREAM_EXPORT_ESTABLISHED',stable_o68['decision']['verdict'])
# external reports reconcile
ck('o67_verdict',o67['decision']['verdict']=='MK2_AUTHENTIC_FIXTURE_RESOURCE_AND_EXECUTABLE_TOPOLOGY_ESTABLISHED',o67['decision']['verdict']); ck('o68_verdict',o68['decision']['verdict']=='MK2_JC0_INDEXED_GRAPHICS_DESCRIPTOR_STREAM_EXPORT_ESTABLISHED',o68['decision']['verdict'])
failed=[c for c in checks if not c['passed']]; report={'format':'mk2_o67_o68_independent_audit_v1','packageSha256':sha(package.read_bytes()),'checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o67IndependentlyCorroborated':not failed,'o68PackageIndependentlyReconstructed':not failed,'paletteOwnershipEstablished':False,'runtimeConsumerForOverlayDescriptorsEstablished':False,'verdict':'MK2_O67_O68_INDEPENDENT_FOUNDATION_AND_INDEXED_EXPORT_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.write_text(json.dumps(report,indent=2)); print(json.dumps({k:report[k] for k in ['packageSha256','checkCount','passedCount','failedCount','allChecksPassed']},indent=2));
if failed: print(json.dumps(failed[:20],indent=2)); sys.exit(1)

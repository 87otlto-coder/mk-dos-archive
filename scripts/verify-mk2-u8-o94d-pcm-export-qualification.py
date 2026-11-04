#!/usr/bin/env python3
import hashlib,json,struct,sys,zipfile,io
from pathlib import Path
EXPECTED_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED_RM='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
EXPECTED_GMI='7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633'
SIGS={
 'pitch':(0x0afd,bytes.fromhex('2e803ef3120074f7535132e4b30cf6f3b10b2ac88adcd0e332ff2e8b872b10d3e8508b44122e8b160213f7e28bda8bc8588b5410f7e20bdb740ad1ebd1d9d1ead1d8ebf2f7f18bd833c0f7f18bd3595bc3')),
 'sample_start':(0x0f03,bytes.fromhex('3c03774d8ad883e303d0e38b9f2013d0e980e13f7402fec11e06061f0e078bf78bfb8bdeb03ce8d1fb')),
 'mixer4':(0x0cf8,bytes.fromhex('8b1c3b5c0490720a8b5c06900bdb741d891c8e440290268a07f66c0e')),
 'mixer2':(0x0de2,bytes.fromhex('8b1c3b5c0490720a8b5c06900bdb741d891c8e440290268a07f66c0e')),
 'mixer1':(0x0e68,bytes.fromhex('8b1c3b5c0490720a8b5c06900bdb7423891c8e440290268a07f66c0e')),
}
def sha(b):return hashlib.sha256(b).hexdigest()
def locate(root,name):
 a=[p for p in root.rglob('*') if p.is_file() and p.name.lower()==name.lower()]
 if len(a)!=1:raise SystemExit(f'Expected exactly one {name}, got {len(a)}')
 return a[0]
def pitch_step(sr,ref,out,table,note=60):
 q,r=divmod(note,12);note_pitch=table[r]>>(11-q);den=ref*out;num=note_pitch*sr;bx=(den>>16)&0xffff;cx=den&0xffff;dx=(num>>16)&0xffff;ax=num&0xffff
 while bx:
  d=((bx<<16)|cx)>>1;bx=(d>>16)&0xffff;cx=d&0xffff;n=((dx<<16)|ax)>>1;dx=(n>>16)&0xffff;ax=n&0xffff
 n=(dx<<16)|ax;q=n//cx;rem=n%cx;frac=(rem<<16)//cx;return ((q&0xffff)<<16)|(frac&0xffff)
def wav_bytes(active,rate):
 data=bytes(x^0x80 for x in active);pad=b'\0' if len(data)&1 else b'';riff_size=36+len(data)+len(pad)
 return b'RIFF'+struct.pack('<I',riff_size)+b'WAVEfmt '+struct.pack('<IHHIIHH',16,1,1,rate,rate,1,8)+b'data'+struct.pack('<I',len(data))+data+pad
def main():
 if len(sys.argv)<2:raise SystemExit('Usage: verify-mk2-u8-o94d-pcm-export-qualification.py <mk2-install-dir> [package.zip] [out.json]')
 root=Path(sys.argv[1]).resolve();package=Path(sys.argv[2]).resolve() if len(sys.argv)>2 and sys.argv[2]!='-' else None;out=Path(sys.argv[3]).resolve() if len(sys.argv)>3 else None
 exe=locate(root,'MK2.EXE').read_bytes();rm=locate(root,'RM.DRV').read_bytes();gmi=locate(root,'GMI.BIN').read_bytes();checks=[]
 def ck(i,ok,d):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
 ck('exe_hash',sha(exe)==EXPECTED_EXE,sha(exe));ck('rm_hash',sha(rm)==EXPECTED_RM,sha(rm));ck('gmi_hash',sha(gmi)==EXPECTED_GMI,sha(gmi))
 for n,(off,sig) in SIGS.items():ck(n+'_signature',gmi[off:off+len(sig)]==sig,hex(off))
 ck('ah10_dispatch',struct.unpack_from('<H',gmi,0x288)[0]==0x0c5a,hex(struct.unpack_from('<H',gmi,0x288)[0]));ck('ah11_dispatch',struct.unpack_from('<H',gmi,0x28a)[0]==0x0f03,hex(struct.unpack_from('<H',gmi,0x28a)[0]))
 table=list(struct.unpack_from('<12H',gmi,0x102b));note60=table[0]>>6;default_rate=struct.unpack_from('<H',gmi,0x84e)[0];ck('note60_value',note60==262,note60);ck('default_output_rate',default_rate==16000,default_rate)
 u8=sorted(p for p in root.rglob('*') if p.is_file() and p.suffix.lower()=='.u8');rates={};unread={};rows=[]
 for p in u8:
  b=p.read_bytes();start,end,loop=struct.unpack_from('<III',b,0);rate,ref=struct.unpack_from('<HH',b,16);active=b[start:end];rates[rate]=rates.get(rate,0)+1;unread[len(b)-end]=unread.get(len(b)-end,0)+1
  rows.append((p,b,start,end,loop,rate,ref,active))
 ck('u8_count',len(rows)==312,len(rows));ck('start_loop_bounds',all(s==32 and l==0 and e>s and e<=len(b) for _,b,s,e,l,_,_,_ in rows),'all start=32 loop=0 bounded');ck('rate_distribution',rates=={11025:190,22050:122},rates);ck('reference_pitch',all(r==262 for *_,r,_a in rows),'312/312 ref=262');ck('unread_partition',unread=={33:308,1:4},unread)
 examples=[]
 for sr in (11025,22050):
  st=pitch_step(sr,262,16000,table);eff=st/65536*16000;examples.append((sr,st,eff));ck(f'pitch_step_{sr}',abs(eff-sr)<0.5,f'step=0x{st:08X} effective={eff}')
 if package:
  z=zipfile.ZipFile(package,'r');names=set(z.namelist());ck('zip_entry_count',len(names)==626,len(names));ck('zip_manifest_readme','manifest.json' in names and 'README.md' in names,'manifest/readme')
  wav_ok=orig_ok=0
  for p,b,start,end,loop,rate,ref,active in rows:
   stem=p.name[:-3];op=f'samples/{stem}/original/{p.name}';wp=f'samples/{stem}/{stem}.wav'
   if op in names and z.read(op)==b:orig_ok+=1
   if wp in names and z.read(wp)==wav_bytes(active,rate):wav_ok+=1
  ck('zip_originals_exact',orig_ok==312,orig_ok);ck('zip_wavs_exact',wav_ok==312,wav_ok)
 failed=[c for c in checks if not c['passed']];report={'format':'mk2_u8_o94d_independent_pcm_export_audit_v1','status':'SUCCESS' if not failed else 'FAIL','fixture':str(root),'checks':checks,'observed':{'rates':rates,'unread':unread,'note60':note60,'defaultOutputRate':default_rate,'stepExamples':[{'sourceRate':s,'step':f'0x{st:08X}','effectiveSourceRate':eff} for s,st,eff in examples]},'decision':{'sourceDomainWavAuthorized':not failed,'runtimeMixedOutputBitExactClaimed':False,'tailPurposeEstablished':False}}
 if out:out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':report['status'],'checks':len(checks),'failed':[c['id'] for c in failed],'rates':rates,'unread':unread,'examples':report['observed']['stepExamples']},indent=2));return 1 if failed else 0
if __name__=='__main__':raise SystemExit(main())

#!/usr/bin/env python3
"""O109C: lossless driver-grounded score stream tokenizer, no invented tempo units."""
from pathlib import Path
from collections import Counter, defaultdict
import argparse, hashlib, json, gzip, csv
from struct import unpack_from

FAMILIES={'mid':'scc.bin','lap':'lap.bin','gvs':'grv.bin','sbl':'sbl.bin','awe':'awe.bin'}
ARGC={0x90:1,0x91:0,0x92:1,0x93:1,0x94:0,0x95:1,0x96:1,0x97:1,0x98:0,0x99:0,0x9A:0,0x9B:1,0x9C:0,0x9D:2}
sha=lambda b:hashlib.sha256(b).hexdigest()

def driver_probe(p):
 b=p.read_bytes(); anchors=[]; pos=0
 while True:
  i=b.find(b'\x2c\x90\x73\x03',pos)
  if i<0:break
  anchors.append(i);pos=i+1
 assert len(anchors)==1,(p.name,anchors)
 i=anchors[0]
 k=b.find(b'\xff\x97',i,i+32)
 assert k>i
 table=unpack_from('<H',b,k+2)[0]
 targets=[unpack_from('<H',b,table+2*j)[0] for j in range(14)]
 assert all(0<t<len(b) for t in targets)
 delay=b.find(b'\x33\xd2\x33\xdb\xac')
 assert delay>=0
 return dict(file=p.name,sha256=sha(b),bytes=len(b),opcode_dispatch=i,opcode_table=table,opcode_targets=targets,delay_decoder=delay)

def split_score(b,name):
 assert b[0]==1,(name,'expected exactly one score')
 L=unpack_from('<H',b,1)[0]
 assert L+5<=len(b)
 assert unpack_from('<H',b,L)[0]==L+2,(name,'score-header pointer')
 hdr=L+2;clock=unpack_from('<H',b,hdr)[0];n=b[hdr+2]
 assert 1<=n<=16,(name,n)
 assert hdr+3+2*n==len(b),(name,'file footer bounds',len(b),hdr+3+2*n)
 ptrs=[unpack_from('<H',b,hdr+3+2*i)[0] for i in range(n)]
 assert ptrs[0]==3,(name,ptrs)
 assert all(ptrs[i]<ptrs[i+1] for i in range(n-1))
 assert ptrs[-1]<L
 return L,clock,ptrs

def parse_stream(b,lo,hi):
 out=[];i=lo;ticks=0
 while i<hi:
  at=i;dv=0;db=[]
  for j in range(5):
   assert i<hi,('truncated delta',lo,hi,at)
   z=b[i];i+=1;db.append(z);dv=(dv<<7)|(z&127)
   if z<128:break
  else: raise ValueError(('bad delta',lo,hi,at))
  assert i<hi,('missing operation',lo,hi,at)
  op=b[i];i+=1
  if op<128:argc=1;cls='pitched_event'
  elif op<0x90:argc=0;cls='voice_select'
  else:argc=ARGC[op];cls='control'
  assert i+argc<=hi,('truncated args',lo,hi,at)
  args=bytes(b[i:i+argc]);i+=argc;ticks+=dv
  out.append([at,bytes(db).hex(),dv,op,args.hex(),ticks])
 assert i==hi and out
 assert out[-1][3] in (0x91,0x98),(lo,hi,out[-1])
 assert out[-1][0]+len(bytes.fromhex(out[-1][1]))+1+len(bytes.fromhex(out[-1][4]))==hi
 return out

def main():
 ap=argparse.ArgumentParser();ap.add_argument('fixture');ap.add_argument('output');args=ap.parse_args();root=Path(args.fixture);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
 drivers={ext:driver_probe(root/driver) for ext,driver in FAMILIES.items()}
 metrics=Counter();families=defaultdict(Counter);ops=Counter();song_records=[];stream_records=[]
 for ext in FAMILIES:
  files=sorted((root/'sound').glob('*.'+ext));assert len(files)==33,(ext,len(files))
  for p in files:
   b=p.read_bytes();L,clock,ptrs=split_score(b,p.name)
   srec=[]
   for idx,lo in enumerate(ptrs):
    hi=ptrs[idx+1] if idx+1<len(ptrs) else L
    ev=parse_stream(b,lo,hi)
    h=sha(b[lo:hi]);chunk={'file':p.name,'index':idx,'start':lo,'end':hi,'sha256':h,'events':ev}
    stream_records.append(chunk)
    kinds=Counter(x[3] for x in ev)
    srec.append({'index':idx,'start':lo,'end':hi,'sha256':h,'events':len(ev),'pitched_events':sum(n for op,n in kinds.items() if op<128),'ticks_to_end':ev[-1][-1],'terminal_opcode':ev[-1][3]})
    for op,n in kinds.items():ops[op]+=n
    metrics['streams']+=1;metrics['events']+=len(ev);metrics['pitched_events']+=sum(n for op,n in kinds.items() if op<128)
    families[ext]['streams']+=1;families[ext]['events']+=len(ev)
   metrics['files']+=1
   song_records.append({'file':p.name,'sha256':sha(b),'bytes':len(b),'family':ext,'song_count':b[0],'original_header_hex':b[:3].hex(),'original_footer_hex':b[L:].hex(),'directory_location':L,'score_header':L+2,'clock_word':clock,'channel_count':len(ptrs),'streams':srec})
 summary={'checkpoint':'O109C','claim':'lossless driver-backed byte-level score stream grammar; no wall-clock time, velocity/voice semantics or verified playback','source':'authentic DOS MK2 fixture','original_exe_sha256':sha((root/'mk2.exe').read_bytes()),'drivers':drivers,'totals':dict(metrics),'families':{k:dict(v) for k,v in families.items()},'operations':{f'0x{v:02X}':ops[v] for v in sorted(ops)},'songs':song_records}
 (out/'mk2_driver_score_stream_manifest_o109c_2026-10-09.json').write_text(json.dumps(summary,indent=2)+'\n')
 with open(out/'mk2_score_file_index_o109c_2026-10-09.csv','w',newline='') as f:
  wr=csv.writer(f);wr.writerow(['file','family','bytes','sha256','sourceHeaderOffset','clockWord','channels','events'])
  for s in song_records:wr.writerow([s['file'],s['family'],s['bytes'],s['sha256'],s['score_header'],s['clock_word'],s['channel_count'],sum(x['events'] for x in s['streams'])])
 path=out/'mk2_lossless_channel_events_o109c_2026-10-09.jsonl.gz'
 with path.open('wb') as fd:
  with gzip.GzipFile(filename='',fileobj=fd,mode='wb',mtime=0,compresslevel=8) as gz:
   for s in stream_records:gz.write((json.dumps(s,separators=(',',':'))+'\n').encode())
 print(json.dumps({'files':metrics['files'],'streams':metrics['streams'],'events':metrics['events'],'pitched_events':metrics['pitched_events'],'terminal_0x91':sum(int(s['terminal_opcode']==0x91) for f in song_records for s in f['streams']),'terminal_0x98':sum(int(s['terminal_opcode']==0x98) for f in song_records for s in f['streams']),'summary':str(out)}))

if __name__=='__main__':main()

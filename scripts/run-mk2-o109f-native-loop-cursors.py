#!/usr/bin/env python3
"""O109F: independently record native loop cursor/period, backed by five driver tables.

The output is a bounded, non-audio source timeline. It never assumes the game
plays a loop twice or assigns hardware timbre. The last 0x9C wins; absent
0x9C, the initialized channel's initial cursor is retained.
"""
from pathlib import Path
import argparse,gzip,json,struct,hashlib,collections
FAMILIES={'mid':'scc.bin','lap':'lap.bin','gvs':'grv.bin','sbl':'sbl.bin','awe':'awe.bin'}
ARG={0x90:1,0x91:0,0x92:1,0x93:1,0x94:0,0x95:1,0x96:1,0x97:1,0x98:0,0x99:0,0x9a:0,0x9b:1,0x9c:0,0x9d:2}
def hashbytes(b):return hashlib.sha256(b).hexdigest()
def check_driver(data):
 pos=data.find(b'\x2c\x90\x73\x03');assert pos>=0 and data.find(b'\x2c\x90\x73\x03',pos+1)<0
 call=data.find(b'\xff\x97',pos,pos+36);assert call>=0
 table=struct.unpack_from('<H',data,call+2)[0]
 loop=struct.unpack_from('<H',data,table+0x8*2)[0]
 save=struct.unpack_from('<H',data,table+0xc*2)[0]
 assert data[loop:loop+4]==b'\x8b\x75\x06\xc3',(hex(loop),data[loop:loop+4])
 assert data[save:save+4]==b'\x89\x75\x06\xc3',(hex(save),data[save:save+4])
 return dict(dispatch=pos,table=table,loop_opcode=0x98,loop_target=loop,loop_bytes=data[loop:loop+4].hex(),save_opcode=0x9c,save_target=save,save_bytes=data[save:save+4].hex(),native_driver_sha256=hashbytes(data))
def raw_events(b,lo,hi):
 out=[];p=lo;tick=0
 while p<hi:
  st=p;dt=0
  for j in range(5):
   a=b[p];p+=1;dt=(dt<<7)|(a&127)
   if a<128:break
  else:raise ValueError('delay > 5 bytes')
  op=b[p];p+=1
  if op<128:n=1
  elif op<0x90:n=0
  else:n=ARG[op]
  assert p+n<=hi
  p+=n;tick+=dt
  out.append(dict(at=st,after=p,op=op,tick=tick,delta=dt))
 assert p==hi and out[-1]['op'] in (0x91,0x98)
 return out

def main():
 ap=argparse.ArgumentParser();ap.add_argument('fixture');ap.add_argument('output');opt=ap.parse_args()
 root=Path(opt.fixture);drivers={x:check_driver((root/y).read_bytes()) for x,y in FAMILIES.items()}
 songs=[];loops=[];metrics=collections.Counter()
 for ext in FAMILIES:
  for f in sorted((root/'sound').glob('*.'+ext)):
   b=f.read_bytes();L=struct.unpack_from('<H',b,1)[0]
   hdr=L+2;n=b[hdr+2];ptrs=[struct.unpack_from('<H',b,hdr+3+2*i)[0] for i in range(n)]
   assert ptrs[0]==3 and hdr+3+2*n==len(b)
   songloops=[]
   for i,lo in enumerate(ptrs):
    hi=ptrs[i+1] if i+1<n else L
    es=raw_events(b,lo,hi)
    assert es[-1]['after']==hi
    if es[-1]['op']!=0x98:continue
    saves=[e for e in es if e['op']==0x9c]
    last=saves[-1] if saves else None
    restart=last['after'] if last else lo
    initial_tick=last['tick'] if last else 0
    assert restart <= es[-1]['at']
    loop_events=[e for e in es if e['at']>=restart]
    assert loop_events[0]['at']==restart
    period=es[-1]['tick']-initial_tick
    assert period==sum(e['delta'] for e in loop_events)
    rec={'file':f.name,'family':ext,'channel':i,'start':lo,'end':hi,'source_stream_sha256':hashbytes(b[lo:hi]),'initial_events':len(es),'save_marker_count':len(saves),'save_marker_offsets':[e['at'] for e in saves],'saved_restart_byte_offset':restart,'saved_restart_initial_tick':initial_tick,'terminal_byte_offset':es[-1]['at'],'first_cycle_end_tick':es[-1]['tick'],'repeat_period_ticks':period,'repeat_event_count':len(loop_events),'repeat_payload_sha256':hashbytes(b[restart:hi])}
    songloops.append(rec);loops.append(rec)
    metrics[f'{ext}_loops']+=1;metrics[f'{ext}_save_count_{len(saves)}']+=1
   songs.append({'file':f.name,'sha256':hashbytes(b),'channels':n,'looping_channels':len(songloops)})
 result={'checkpoint':'O109F','status':'authenticated driver opcode 0x98 restart and 0x9c save; no claim of actual repeat count or hardware sound','fixture_executable_sha256':hashbytes((root/'mk2.exe').read_bytes()),'drivers':drivers,'songs':songs,'loops':loops,'stats':dict(sorted(metrics.items())),'counts':{'files':len(songs),'looping_streams':len(loops),'loop_without_save':sum(x['save_marker_count']==0 for x in loops),'loop_with_one_save':sum(x['save_marker_count']==1 for x in loops),'loop_with_multiple_saves':sum(x['save_marker_count']>1 for x in loops)}}
 out=Path(opt.output);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result['counts']))
if __name__=='__main__':main()

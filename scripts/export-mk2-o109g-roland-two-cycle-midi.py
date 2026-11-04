#!/usr/bin/env python3
"""O109G: explicitly bounded 2-cycle SCC/LAP native channel-cursor MIDI rendition.

Not a literal DOS run: channels with 0x98 are replayed exactly ONCE from their
current saved 0x9C cursor (or their channel start); 0x91 channels are not replayed.
The first pass is never cut; playback state carries into the repeated portion.
Synthetic all-notes-off occurs at each final MIDI track ending ONLY.
"""
import json,gzip,argparse,struct,hashlib,collections,importlib.util
from pathlib import Path
sha=lambda b:hashlib.sha256(b).hexdigest()
def vlq(v):
 assert 0<=v<1<<28
 arr=[v&127];v>>=7
 while v:arr.insert(0,0x80|(v&127));v>>=7
 return bytes(arr)
def chunk(tag,data):return tag+struct.pack('>I',len(data))+data
def track(events,ending):
 events=sorted(enumerate(events),key=lambda x:(x[1][0],x[1][1],x[0]))
 out=bytearray();last=0
 for _,(at,pri,msg) in events:
  assert at>=last
  out+=vlq(at-last)+msg;last=at
 assert ending>=last
 out+=vlq(ending-last)+b'\xff\x2f\x00'
 return chunk(b'MTrk',out)
def cc(v,c,d):return bytes([0xb0+v,c,d])
def expanded(stream,repeat_cycles):
 events=stream['events'];assert events and repeat_cycles>=1
 base=[tuple(x) for x in events]
 if base[-1][3]!=0x98 or repeat_cycles==1:return base,0,None
 saves=[i for i,e in enumerate(base) if e[3]==0x9c]
 ix=saves[-1]+1 if saves else 0
 assert ix<len(base)
 anchor=base[ix-1][5] if saves else 0
 per=base[-1][5]-anchor
 assert per>0
 out=list(base);now=base[-1][5]
 for _ in range(repeat_cycles-1):
  for e in base[ix:]:
   now+=e[2]
   out.append((e[0],e[1],e[2],e[3],e[4],now))
 assert now==base[-1][5]+(repeat_cycles-1)*per
 return out,per,len(base)-ix

def convert(song,streams,cycles=2):
 ppqn=song['clock_word']&255;initbpm=song['clock_word']>>8
 assert ppqn==96 and 1<=initbpm<=255
 tempos=[(0,0,b'\xff\x51\x03'+round(60000000/initbpm).to_bytes(3,'big'))]
 tracks=[];totals=collections.Counter();provenance=[]
 for s in sorted(streams,key=lambda x:x['index']):
  native,per,per_events=expanded(s,cycles)
  out=[];tick=0;voice=None;lastnote=None
  for j,(at,db,delta,op,arghex,source_tick) in enumerate(native):
   tick+=delta;assert tick==source_tick
   args=bytes.fromhex(arghex)
   if op<128:
    assert len(args)==1 and voice is not None
    lastnote=op
    if voice<=11:out.append((tick,10,bytes([0x90|voice,op,args[0]])));totals['note_on']+=1
   elif op<144:voice=op&15
   elif op==0x90:
    if voice is not None and voice<=11:out.append((tick,10,bytes([0x90|voice,args[0],0])));totals['note_off']+=1
   elif op==0x99:
    if lastnote is not None and voice is not None and voice<=11:out.append((tick,10,bytes([0x90|voice,lastnote,0])));totals['note_off']+=1
   elif op==0x92:
    if voice is not None and voice<=11:out.append((tick,5,bytes([0xc0|voice,args[0]])));totals['program']+=1
   elif op==0x93:
    assert args[0]
    tempos.append((tick,0,b'\xff\x51\x03'+round(60000000/args[0]).to_bytes(3,'big')))
    totals['tempo_change']+=1
   elif op==0x95:
    if voice is not None and voice<=11:out.append((tick,5,bytes([0xe0|voice,0,args[0]])));totals['pitchbend']+=1
   elif op==0x96:
    if voice is not None and voice<=11:out.append((tick,5,cc(voice,7,args[0])));totals['volume']+=1
   elif op==0x9b:
    if voice is not None and voice<=11:out.append((tick,5,cc(voice,10,args[0])));totals['pan']+=1
   elif op==0x9d:
    if voice is not None and voice<=11:out.append((tick,5,cc(voice,args[0],args[1])));totals['controller']+=1
   elif op in (0x91,0x98):
    assert op==native[-1][3] or op==0x98
    # A nonterminal 0x98 cursor jump changes only decoder position; no MIDI event.
   elif op in (0x94,0x97,0x9c):pass
   else:raise ValueError((song['file'],op,j))
  if voice is not None and voice<=11:
   out.append((tick,30,cc(voice,123,0)))
   totals['safety_all_notes_off']+=1
  tracks.append(track(out,tick))
  provenance.append({'index':s['index'],'native_end_tick':s['events'][-1][5],'render_end_tick':tick,'loop_period_ticks':per,'repeated_segment_events':per_events,'looping':s['events'][-1][3]==0x98})
 limit=max(x['render_end_tick'] for x in provenance)
 tempos.append((limit,31,b'\xff\x01\x00'))
 blob=chunk(b'MThd',struct.pack('>HHH',1,len(tracks)+1,ppqn))+track(tempos,limit)+b''.join(tracks)
 return blob,provenance,dict(totals)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('fixture');ap.add_argument('score_manifest');ap.add_argument('events_gz');ap.add_argument('outdir');ap.add_argument('--cycles',type=int,default=2);arg=ap.parse_args();assert arg.cycles==2,'bounded 2 cycles only'
 root=Path(arg.fixture);meta=json.load(open(arg.score_manifest));songs={x['file']:x for x in meta['songs'] if x['family'] in ('mid','lap')};streams=collections.defaultdict(list)
 with gzip.open(arg.events_gz,'rt') as f:
  for line in f:
   e=json.loads(line)
   if e['file'] in songs:streams[e['file']].append(e)
 out=Path(arg.outdir);out.mkdir(parents=True,exist_ok=True)
 records=[];tot=collections.Counter()
 for name,song in sorted(songs.items()):
  data,prov,cnts=convert(song,streams[name],arg.cycles)
  fam=song['family'];output=out/('SC55' if fam=='mid' else 'MT32')/(Path(name).stem+'.mid');output.parent.mkdir(exist_ok=True);output.write_bytes(data)
  records.append({'native_file':name,'native_sha256':song['sha256'],'smf_file':str(output.relative_to(out)),'smf_sha256':sha(data),'smf_length':len(data),'tracks':len(prov)+1,'source_channel_timelines':prov,'midi_counts':cnts})
  tot.update(cnts)
 manifest={'checkpoint':'O109G','export_mode':'Two-cycle bounded rendition, not observed original runtime duration','safety':'CC123 on final channel end is synthetic; no CC123 at native loop boundaries','source_executable_sha256':sha((root/'mk2.exe').read_bytes()),'scores':records,'total_scores':len(records),'total_native_loops':sum(sum(int(x['looping']) for x in r['source_channel_timelines']) for r in records),'midi_events':dict(tot)}
 (out/'O109G_TWO_CYCLE_MIDI_PROVENANCE.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print(json.dumps({'midi_files':len(records),'total_native_loops':manifest['total_native_loops'],'counts':dict(tot)}))
if __name__=='__main__':main()

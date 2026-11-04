#!/usr/bin/env python3
"""Conservative one-cycle Standard MIDI conversions of authenticated SCC/Roland score streams.

The native .MID is NOT Standard MIDI; its 96-pulse clock / tempo byte and
MIDI-emitting SCC.BIN code support this translation. Native timed loops are
bounded to one source cycle, and optional all-notes-off is a derivative guard.
"""
import argparse, gzip, hashlib, json, struct
from pathlib import Path
from collections import Counter, defaultdict

def vlq(v):
 assert 0 <= v < (1<<28),v
 a=[v&127];v >>=7
 while v:a.insert(0,128|(v&127));v>>=7
 return bytes(a)

def mkchunk(tag, data):return tag+struct.pack('>I',len(data))+data

def midi_track(events):
 # input (absolute_tick, priority, bytes, label). preserve source event order.
 events=sorted(enumerate(events),key=lambda x:(x[1][0],x[1][1],x[0]))
 at=0;raw=bytearray()
 for _,(tick,priority,data,_) in events:
  assert tick>=at,(tick,at)
  raw.extend(vlq(tick-at));raw.extend(data);at=tick
 raw.extend(b'\0\xff\x2f\0')
 return mkchunk(b'MTrk',raw)

def cc(ch,control,value):return bytes([0xB0+ch, control,value])

def derive(streams, song, safe_off=True):
 clock=song['clock_word']; ppqn=clock&255; bpm=clock>>8
 assert ppqn==96 and 1<=bpm<=255
 tempo=[(0,0,b'\xff\x51\x03'+round(60_000_000/bpm).to_bytes(3,'big'),'initial_tempo')]
 tracks=[]; totals=Counter();unsupported=Counter();tempo_claims=[];terminal=[]
 for stream in streams:
  events=[];tick=0;voice=None;lastnote=None
  for at,db,delta,op,arghex,abstick in stream['events']:
   tick+=delta; assert tick==abstick
   args=bytes.fromhex(arghex); totals['native_events']+=1
   if op<0x80:
    assert voice is not None and len(args)==1
    lastnote=op
    if voice<=11:events.append((tick,10,bytes([0x90|voice,op,args[0]]),'note_on'));totals['note_on']+=1
    else:unsupported['pcm_pitch']+=1
   elif op<0x90:
    voice=op&15
   elif op==0x90:
    assert len(args)==1
    if voice is not None and voice<=11:events.append((tick,10,bytes([0x90|voice,args[0],0]),'note_off_explicit'));totals['note_off']+=1
    else:unsupported['off_without_voice']+=1
   elif op==0x99:
    if lastnote is not None and voice is not None and voice<=11:events.append((tick,10,bytes([0x90|voice,lastnote,0]),'note_off_last'));totals['note_off']+=1
    else:unsupported['last_note_unknown']+=1
   elif op==0x92:
    if voice is not None and voice<=11:events.append((tick,5,bytes([0xC0|voice,args[0]]),'program_change'));totals['program_change']+=1
    else:unsupported['program_without_voice']+=1
   elif op==0x93:
    b=args[0];assert b
    tempo.append((tick,0,b'\xff\x51\x03'+round(60_000_000/b).to_bytes(3,'big'),'change_tempo'))
    tempo_claims.append((tick,b));totals['tempo_change']+=1
   elif op==0x95:
    if voice is not None and voice<=11:events.append((tick,5,bytes([0xE0|voice,0,args[0]]),'bend'));totals['bend']+=1
    else:unsupported['bend_without_voice']+=1
   elif op==0x96:
    if voice is not None and voice<=11:events.append((tick,5,cc(voice,7,args[0]),'volume'));totals['volume']+=1
    else:unsupported['volume_without_voice']+=1
   elif op==0x9B:
    if voice is not None and voice<=11:events.append((tick,5,cc(voice,10,args[0]),'pan'));totals['pan']+=1
    else:unsupported['pan_without_voice']+=1
   elif op==0x9D:
    if voice is not None and voice<=11:events.append((tick,5,cc(voice,args[0],args[1]),'controller'));totals['controller']+=1
    else:unsupported['controller_without_voice']+=1
   elif op in (0x91,0x98):
    assert op==stream['events'][-1][3]
    terminal.append((stream['index'],tick,op))
    if safe_off and voice is not None and voice<=11:
     events.append((tick,30,cc(voice,123,0),'SAFETY_ALL_NOTES_OFF_DERIVATIVE'))
     totals['safety_silence']+=1
   elif op in (0x94,0x97,0x9C):
    unsupported[f'native_internal_0x{op:02x}']+=1
   else:
    raise ValueError((song['file'],op,tick))
  # Keep at least EOT at actual source terminal time
  if not events or events[-1][0]<tick:events.append((tick,31,b'\xff\x01\x00','empty_text_marker'))
  tracks.append(midi_track(events))
 tempo.append((max(t[-2] for t in terminal),31,b'\xff\x01\x00','end'))
 result=mkchunk(b'MThd',struct.pack('>HHH',1,len(tracks)+1,ppqn))+midi_track(tempo)+b''.join(tracks)
 return result, dict(totals),dict(unsupported),tempo_claims,terminal

def main():
 parser=argparse.ArgumentParser();parser.add_argument('fixture');parser.add_argument('manifest');parser.add_argument('events_gz');parser.add_argument('outdir');opts=parser.parse_args()
 root=Path(opts.fixture);out=Path(opts.outdir);out.mkdir(parents=True,exist_ok=True)
 m=json.load(open(opts.manifest));songs={x['file']:x for x in m['songs'] if x['family']=='mid'};streams=defaultdict(list)
 with gzip.open(opts.events_gz,'rt') as f:
  for line in f:
   s=json.loads(line)
   if s['file'] in songs:streams[s['file']].append(s)
 report=[];overall=Counter();errors=Counter()
 for name,song in sorted(songs.items()):
  arr=sorted(streams[name],key=lambda x:x['index'])
  assert len(arr)==song['channel_count']
  data,totals,unsupported,tempos,terms=derive(arr,song)
  p=out/(Path(name).stem+'.mid');p.write_bytes(data)
  record={'native_source':name,'native_sha256':song['sha256'],'smf_file':p.name,'smf_bytes':len(data),'smf_sha256':hashlib.sha256(data).hexdigest(),'ppqn':song['clock_word']&255,'initial_bpm':song['clock_word']>>8,'tracks':len(arr)+1,'native_events':sum(len(x['events']) for x in arr),'midi_event_counts':totals,'nontranslated_native_counts':unsupported,'native_tempo_changes':tempos,'native_terminals':terms,'looping_streams':sum(1 for x in terms if x[-1]==0x98)}
  report.append(record);overall.update(totals);errors.update(unsupported)
 manifest={'method':'SCC.BIN instruction-backed one-cycle conversion; hardware timbre not emulated','limitation':'Native loop streams 0x98 limited to one cycle; synthetic MIDI CC123 all-notes-off inserted for audibility; voice and note code backed by SCC driver. Actual SC-55 hardware audio not simulated.','songs':report,'total_native_to_smf':len(report),'totals':dict(overall),'nontranslated_native_counts':dict(errors)}
 (out/'ROLAND_SCC_SMF_CONVERSION_PROVENANCE.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print(json.dumps({'songs':len(report),'translated_midi_events':dict(overall),'nontranslated_native_counts':dict(errors),'output':str(out)}))
if __name__=='__main__':main()

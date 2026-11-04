#!/usr/bin/env python3
"""O109H: source-derived note/timing MIDI representations of native GVS/AWE/SBL MK2 scores.

GVS commands are MIDI-style in GRV.BIN; AWE commands invoke a native synthesizer API;
SBL commands operate an OPL FM instrument bank. AWE/SBL SMFs are explicitly **proxies**,
NOT faithful MIDI translations of original synth instructions or sound recordings.
"""
import argparse, collections, gzip, hashlib, json, struct
from pathlib import Path

FAMILIES={'gvs':'grv.bin','awe':'awe.bin','sbl':'sbl.bin'}
DRIVER_ANCHORS={
 'gvs':{0x90:(0x849,'8a45083c0b7730'),0x92:(0x8a6,'8a45083c0b7709'),0x93:(0x397,'aca21902'),0x98:(0x3a4,'8b7506c3'),0x9b:(0x8eb,'8a45080cb0')},
 'awe':{0x90:(0x13e7,'8a45083c0b773c'),0x92:(0x144b,'8a45083c0b7711'),0x93:(0xd02,'aca2870b'),0x98:(0xd0f,'8b7506c3'),0x9b:(0x14a4,'8a45080657')},
 'sbl':{0x90:(0xc21,'ac3a4509751c'),0x92:(0xc75,'c6451640ac'),0x93:(0x396,'aca21602'),0x98:(0x3a3,'8b7506c3'),0x9b:(0xd39,'acc3')},
}
sha=lambda x:hashlib.sha256(x).hexdigest()
def vlq(x):
 assert 0<=x<(1<<28)
 parts=[x&127];x>>=7
 while x:parts.insert(0,(x&127)|128);x>>=7
 return bytes(parts)
def trk(events):
 ordered=sorted(enumerate(events),key=lambda a:(a[1][0],a[1][1],a[0]))
 out=bytearray();at=0
 for _,(when,priority,message) in ordered:
  assert when>=at
  out+=vlq(when-at)+message;at=when
 out+=b'\0\xff\x2f\0'
 return b'MTrk'+struct.pack('>I',len(out))+out

def build(s,streams,family):
 ppqn=s['clock_word']&255;bpm=s['clock_word']>>8
 assert ppqn==96 and 0<bpm<=255
 tempos=[(0,0,b'\xff\x51\x03'+round(60_000_000/bpm).to_bytes(3,'big'))]
 tracks=[]; c=collections.Counter(); unsupported=collections.Counter()
 for st in streams:
  absolute=0; channel=None; lastnote=None; ev=[]
  for pos,delta_raw,delta,op,hexargs,tick in st['events']:
   absolute+=delta;assert absolute==tick
   args=bytes.fromhex(hexargs);c['source_commands']+=1
   if op<128:
    assert len(args)==1 and channel is not None
    lastnote=op
    if channel<12:
     ev.append((absolute,10,bytes([0x90+channel,op,args[0]])));c['note_on']+=1
    else:unsupported['high_voice_pitch']+=1
   elif op<0x90:channel=op&15
   elif op==0x90:
    assert len(args)==1
    if channel is not None and channel<12:
     ev.append((absolute,10,bytes([0x90+channel,args[0],0])));c['note_off_explicit']+=1
    else:unsupported['high_voice_explicit_off']+=1
   elif op==0x99:
    if lastnote is not None and channel is not None and channel<12:
     ev.append((absolute,10,bytes([0x90+channel,lastnote,0])));c['note_off_last']+=1
    else:unsupported['high_voice_last_off']+=1
   elif op==0x92:
    assert len(args)==1
    if channel is not None and channel<12:
     ev.append((absolute,5,bytes([0xc0+channel,args[0]])));c['program_index_proxy']+=1
    else:unsupported['high_voice_program']+=1
   elif op==0x93:
    assert len(args)==1 and args[0]>0
    tempos.append((absolute,0,b'\xff\x51\x03'+round(60_000_000/args[0]).to_bytes(3,'big')));c['tempo']+=1
   elif op in (0x95,0x96,0x9b,0x9d):
    if family=='sbl' and op in (0x95,0x9b,0x9d):
     unsupported[f'fm_native_command_{op:02x}']+=1
    elif channel is not None and channel<12:
     if op==0x95: msg=bytes([0xe0+channel,0,args[0]])
     elif op==0x96: msg=bytes([0xb0+channel,7,args[0]])
     elif op==0x9b: msg=bytes([0xb0+channel,10,args[0]])
     else:msg=bytes([0xb0+channel,args[0],args[1]])
     ev.append((absolute,5,msg));c[f'control_{op:02x}']+=1
    else:unsupported[f'high_voice_control_{op:02x}']+=1
   elif op in (0x91,0x98):
    assert st['events'][-1][3]==op
    if channel is not None and channel<12:
     ev.append((absolute,30,bytes([0xb0+channel,123,0])));c['synthetic_final_silence']+=1
    c['native_loop_end' if op==0x98 else 'native_stop']+=1
   elif op in (0x94,0x97,0x9a,0x9c):unsupported[f'native_state_{op:02x}']+=1
   else:raise ValueError((s['file'],op,pos))
  if not ev or max(e[0] for e in ev)<absolute:ev.append((absolute,31,b'\xff\x01\x00'))
  tracks.append(trk(ev))
 result=b'MThd'+struct.pack('>IHHH',6,1,len(tracks)+1,ppqn)+trk(tempos)+b''.join(tracks)
 return result,c,unsupported

def main():
 p=argparse.ArgumentParser();p.add_argument('fixture');p.add_argument('manifest');p.add_argument('events');p.add_argument('out');opt=p.parse_args()
 root=Path(opt.fixture);output=Path(opt.out);output.mkdir(parents=True,exist_ok=True)
 manifest=json.loads(Path(opt.manifest).read_text());groups=collections.defaultdict(list)
 with gzip.open(opt.events,'rt') as fd:
  for line in fd:
   x=json.loads(line)
   if x['file'].rsplit('.',1)[-1] in FAMILIES: groups[x['file']].append(x)
 drivers={}
 for f,d in FAMILIES.items():
  b=(root/d).read_bytes();proof={}
  for op,(off,h) in DRIVER_ANCHORS[f].items():
   assert b[off:off+len(bytes.fromhex(h))]==bytes.fromhex(h),(f,hex(off))
   proof[f'0x{op:02x}']={'fileOffset':off,'hex':h}
  drivers[f]={'file':d,'sha256':sha(b),'byteLength':len(b),'handlerInstructionAnchors':proof}
 songs=[];glob=collections.Counter()
 for song in sorted(manifest['songs'],key=lambda s:s['file']):
  f=song['family']
  if f not in FAMILIES:continue
  ss=sorted(groups[song['file']],key=lambda s:s['index'])
  assert len(ss)==song['channel_count']
  b,c,u=build(song,ss,f)
  out=output/f.upper()/(Path(song['file']).stem+'.mid');out.parent.mkdir(exist_ok=True);out.write_bytes(b)
  assert sha((root/'sound'/song['file']).read_bytes())==song['sha256']
  songs.append({'source':song['file'],'sourceSHA256':song['sha256'],'device':f,'output':out.relative_to(output).as_posix(),'midiSHA256':sha(b),'midiBytes':len(b),'tracks':len(ss)+1,'initialBpm':song['clock_word']>>8,'ppqn':song['clock_word']&255,'sourceCommands':sum(len(q['events']) for q in ss),'midiMessages':dict(c),'nativeUntranslatedCommands':dict(u),'fidelity':'driver-grounded MIDI-style commands; native GUS patch timbre unavailable' if f=='gvs' else 'synthesizer-control surrogate; exact EMU8000 patch bank/sound unavailable' if f=='awe' else 'FM note/timing/program-index proxy; original OPL patch and waveform NOT converted'})
  glob.update(c)
 report={'checkpoint':'O109H','purpose':'playable one-cycle **diagnostic** MIDI representations for three additional MK2 device score families; raw native scores remain authoritative','deviceSemantics':{'GVS':'GRV.BIN MIDI-command-style handler verified; uses UltraMID patches that are not present in fixture','AWE':'AWE.BIN calls its proprietary synthesizer note and program interfaces; MIDI note representations are not direct hardware writes','SBL':'SBL.BIN uses FM patch tables and OPL code; MIDI program numbers are raw FM patch IDs, not General MIDI instruments'},'importantLimits':['Not original synthesizer output, not native patches, not a lossless rendering of device audio','Native loops truncated to one pass; CC123 appended to silence at end; 0x94/0x97/0x9A/0x9C state commands do not all map to MIDI','SBL native FM bend/pan/general controller controls are excluded, never invented as equivalent MIDI events','The original 165 native streams are already covered by corrected lossless source reconstruction O109C'],'nativeDriverAnchors':drivers,'songs':songs,'counts':dict(glob)}
 (output/'O109H_DEVICE_MIDI_PROXY_PROVENANCE.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'midiScores':len(songs),'byDevice':dict(collections.Counter(x['device'] for x in songs)),'counts':dict(glob),'output':str(output)}))
if __name__=='__main__':main()

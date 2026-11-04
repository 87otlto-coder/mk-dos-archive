#!/usr/bin/env python3
"""Package a documented complete MK2 audio extraction inventory, not hardware-authentic re-synthesis."""
import argparse,hashlib,json,zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('prior_combined');p.add_argument('proxy_dir');p.add_argument('roland_two_cycle_dir');p.add_argument('output');p.add_argument('checkpoint');a=p.parse_args()
sha=lambda b:hashlib.sha256(b).hexdigest();out=Path(a.output);seen={}
with zipfile.ZipFile(a.prior_combined) as old,zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=8) as z:
 assert old.testzip() is None
 for name in sorted(old.namelist()):
  if name.endswith('/'):continue
  b=old.read(name);assert name not in seen
  z.writestr(name,b);seen[name]={'bytes':len(b),'sha256':sha(b),'category':'previous independently verified extraction'}
 for f in sorted(Path(a.proxy_dir).rglob('*.mid')):
  name='ADDITIONAL_DEVICE_MIDI_PROXIES/'+f.relative_to(a.proxy_dir).as_posix();b=f.read_bytes();assert name not in seen
  z.writestr(name,b);seen[name]={'bytes':len(b),'sha256':sha(b),'category':'diagnostic MIDI representation, NOT native-device synthesis'}
 for f in sorted(Path(a.roland_two_cycle_dir).rglob('*.mid')):
  name='ROLAND_OPTIONAL_TWO_CYCLE_MIDI/'+f.relative_to(a.roland_two_cycle_dir).as_posix();b=f.read_bytes();assert name not in seen
  z.writestr(name,b);seen[name]={'bytes':len(b),'sha256':sha(b),'category':'bounded two-cycle Roland MIDI with source loop cursor'}
 for f,name in [(Path(a.proxy_dir)/'O109H_DEVICE_MIDI_PROXY_PROVENANCE.json','O109H_DEVICE_MIDI_PROXY_PROVENANCE.json'),(Path(a.checkpoint),'O109H_RESEARCH_CHECKPOINT.md')]:
  b=f.read_bytes();z.writestr(name,b);seen[name]={'bytes':len(b),'sha256':sha(b),'category':'evidence documentation'}
 readme='''# MK2 audio extraction: output tiers\n\nThis package accounts for 312 original effects as independently verified PCM WAV, all 165 original music score binaries and independently verified event streams, 66 driver-derived Roland SC-55 / MT-32 Standard MIDI musical transcriptions, and 99 *diagnostic* MIDI representations of GUS/AWE/SBL scores, plus 66 optional two-cycle Roland transcriptions.\n\nNative score bytes remain the authoritative material and preserve all patch and loop instructions. Diagnostic GVS/AWE/SBL MIDI representations preserve timing, pitched events and raw program indices; the original native instrument definitions, timbre and all native controller effects are NOT reproducible by generic MIDI playback. Specifically, raw Sound Blaster OPL patch indices are NOT General MIDI instrument IDs.\n\nA synthesized recording using a generic GM soundfont is NOT an original MK2 DOS device capture. Hardware-accurate emulation of all five synthesizers and the gameplay music mixer is NOT proven.\n\nFolder ADDITIONAL_DEVICE_MIDI_PROXIES/{GVS,AWE,SBL}/ contains 33 representations each. Folder ROLAND_OPTIONAL_TWO_CYCLE_MIDI/ contains 66 optional two-cycle arrangements using authenticated native repeat positions. The included original assets and 66 one-cycle Roland conversions were already verified independently.\n\nSee O109H_DEVICE_MIDI_PROXY_PROVENANCE.json, O109H_RESEARCH_CHECKPOINT.md, and AUDIO_CONTENTS_SHA256.json for exact claims and per-file hashes.\n'''
 z.writestr('README_AUDIO_FIDELITY.md',readme.encode());seen['README_AUDIO_FIDELITY.md']={'bytes':len(readme.encode()),'sha256':sha(readme.encode()),'category':'documentation'}
 categories={k:sum(1 for v in seen.values() if v['category']==k) for k in sorted({v['category'] for v in seen.values()})}
 manifest={'checkpoint':'O109H','fidelity':'all assets extracted; exact device sound not verified','counts':{'originalEffectsWAV':312,'originalMusicScores':165,'rolandMIDIArrangements':66,'additionalProxyMIDIArrangements':99,'rolandTwoCycleMIDIArrangements':66,'nativeMusicStreams':1096},'entryCountWithoutThisManifest':len(seen),'categories':categories,'files':seen}
 z.writestr('AUDIO_CONTENTS_SHA256.json',json.dumps(manifest,indent=2)+'\n')
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(seen)+1
 for name,record in seen.items():assert sha(z.read(name))==record['sha256'],name
print(json.dumps({'package':str(out),'bytes':out.stat().st_size,'entries':len(seen)+1,'categories':categories,'checksums':'all pass'}))

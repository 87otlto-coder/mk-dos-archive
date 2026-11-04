#!/usr/bin/env python3
"""Mutate claimed evidence and its self-consistent SHA; ensure independent raw-source replay rejects."""
from pathlib import Path
import argparse,hashlib,json,subprocess,sys
p=argparse.ArgumentParser();p.add_argument('fixture');p.add_argument('directory');p.add_argument('verifier');o=p.parse_args()
root=Path(o.directory);report=root/'O109H_DEVICE_MIDI_PROXY_PROVENANCE.json'
raw=report.read_bytes();doc=json.loads(raw);song=doc['songs'][0];midi=root/song['output'];original_midi=midi.read_bytes()
cmd=['node',o.verifier,o.fixture,o.directory]
def verify():return subprocess.run(cmd,capture_output=True,text=True)
assert verify().returncode==0
cases=[]
try:
 # Corrupt generated note event and UPDATE the claimed digest -- must still reject source mismatch.
 bad=bytearray(original_midi);i=30 if len(bad)>36 else len(bad)-5;assert i>16;bad[i]^=1;midi.write_bytes(bad)
 doc['songs'][0]['midiSHA256']=hashlib.sha256(bad).hexdigest();report.write_text(json.dumps(doc,indent=2)+'\n')
 r=verify();assert r.returncode!=0;cases.append(('corrupt_note_midi_with_updated_digest','rejected'))
 midi.write_bytes(original_midi);report.write_bytes(raw)
 # Invent hardware-exact playback, never allow upgraded confidence based on editing the JSON.
 doc=json.loads(raw);doc['songs'][0]['fidelity']='perfect authentic OPL sound reproduction';report.write_text(json.dumps(doc,indent=2)+'\n')
 r=verify();assert r.returncode!=0;cases.append(('fabricated_hardware_fidelity','rejected'))
 report.write_bytes(raw)
 # Lie about originating device metadata.
 doc=json.loads(raw);doc['deviceSemantics']['SBL']='Sound Blaster FM patches are Standard MIDI programs';report.write_text(json.dumps(doc,indent=2)+'\n')
 r=verify();assert r.returncode!=0;cases.append(('invented_GM_instrument_ownership','rejected'))
finally:
 midi.write_bytes(original_midi);report.write_bytes(raw)
assert verify().returncode==0
print(json.dumps({'negativeControls':cases,'restoredPristine':True,'allRejected':len(cases)==3}))

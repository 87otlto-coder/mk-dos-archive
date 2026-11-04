#!/usr/bin/env python3
"""Mutate source claims, keep well-formed formats and verify independent rejection."""
from pathlib import Path
import argparse, subprocess, json, hashlib, tempfile
ap=argparse.ArgumentParser();ap.add_argument('fixture');ap.add_argument('source');args=ap.parse_args()
root=Path(args.source);fixture=Path(args.fixture)
loop=root/'mk2_native_music_loop_cursor_provenance_o109f_2026-10-09.json'
output=root/'evidence/mk2_o109g_two_cycle_midi'
node1=root/'scripts/verify-mk2-o109f-native-loop-cursors.mjs'
node2=root/'scripts/verify-mk2-o109g-roland-two-cycle-midi.mjs'
def run(script,*arguments):return subprocess.run(['node',str(script),str(fixture),*[str(a) for a in arguments]],stdout=subprocess.PIPE,stderr=subprocess.PIPE).returncode
assert run(node1,loop)==0 and run(node2,output)==0
fail=[]
with tempfile.TemporaryDirectory() as td:
 td=Path(td)
 base=json.loads(loop.read_text())
 for label,patch in [('wrong_restart',lambda x:x['loops'][0].__setitem__('saved_restart_byte_offset',x['loops'][0]['saved_restart_byte_offset']+1)),('invented_loop_count',lambda x:x['counts'].__setitem__('looping_streams',x['counts']['looping_streams']+1))]:
  x=json.loads(loop.read_text());patch(x);p=td/(label+'.json');p.write_text(json.dumps(x))
  assert run(node1,p)!=0,label
  fail.append(label)
 # Intentionally update the provenance's hash so failure cannot be just stale hash.
 record=json.loads((output/'O109G_TWO_CYCLE_MIDI_PROVENANCE.json').read_text())
 a=record['scores'][0];f=output/a['smf_file'];orig=f.read_bytes()
 try:
  altered=bytearray(orig);altered[36]^=1;f.write_bytes(altered)
  record['scores'][0]['smf_sha256']=hashlib.sha256(altered).hexdigest()
  provenance_path=output/'O109G_TWO_CYCLE_MIDI_PROVENANCE.json';original_report=provenance_path.read_text()
  provenance_path.write_text(json.dumps(record))
  try:assert run(node2,output)!=0,'forged MIDI payload'
  finally:provenance_path.write_text(original_report)
 finally:f.write_bytes(orig)
 fail.append('forged_midi_and_hash')
assert run(node1,loop)==0 and run(node2,output)==0
print(json.dumps({'negative_cases_rejected':fail,'restored_outputs':'PASS'}))

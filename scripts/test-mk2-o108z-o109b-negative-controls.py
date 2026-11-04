#!/usr/bin/env python3
"""Deliberate semantic mutations, no ledger shortcuts; originals remain immutable."""
import gzip, json, pathlib, subprocess, sys, tempfile
root=pathlib.Path(sys.argv[1]).resolve();fixture=pathlib.Path(sys.argv[2]).resolve();verifier=pathlib.Path(sys.argv[3]).resolve()
files=['mk2_driver_score_stream_manifest_o109b_2026-10-09.json','mk2_lossless_channel_events_o109b_2026-10-09.jsonl.gz']
with tempfile.TemporaryDirectory(prefix='mk2_audio_neg_') as td:
 base=pathlib.Path(td)
 original=json.loads((root/files[0]).read_text());raw=gzip.decompress((root/files[1]).read_bytes()).decode();rows=[json.loads(x) for x in raw.strip().split('\n')]
 def execute(label,update):
  report=json.loads(json.dumps(original));tracks=json.loads(json.dumps(rows));update(report,tracks)
  (base/files[0]).write_text(json.dumps(report))
  with gzip.open(base/files[1],'wt') as f:
   for row in tracks:f.write(json.dumps(row)+'\n')
  cmd=['node',str(verifier),str(fixture),str(base)];proc=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
  if proc.returncode==0:raise AssertionError(f'mutation passed: {label}\n{proc.stdout}')
  print(f'REJECTED {label}')
 execute('invented note argument',lambda r,s:s[0]['events'][4].__setitem__(4,'ff'))
 execute('invented duration',lambda r,s:s[0]['events'][0].__setitem__(2,999))
 execute('fake native dispatch target',lambda r,s:r['drivers']['sbl']['opcode_targets'].__setitem__(0,65500))
 execute('invalid music tempo header',lambda r,s:r['songs'][0].__setitem__('clock_word',1234))
 execute('corrupted stream terminator',lambda r,s:s[0]['events'][-1].__setitem__(3,0x99))
 execute('fabricated full binary footer',lambda r,s:r['songs'][0].__setitem__('original_footer_hex','00'))
 print('PASS 6/6 semantic falsifications rejected')

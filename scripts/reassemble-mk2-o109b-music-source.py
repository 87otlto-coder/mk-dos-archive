#!/usr/bin/env python3
"""Recover byte-identical original MK2 music files from O109B lossless event stream."""
import argparse,gzip,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('manifest');p.add_argument('events_gz');p.add_argument('output_dir');a=p.parse_args()
r=json.loads(Path(a.manifest).read_text());data={}
with gzip.open(a.events_gz,'rt') as f:
 for ln in f:
  obj=json.loads(ln);data[obj['file'],obj['index']]=obj
out=Path(a.output_dir);out.mkdir(parents=True,exist_ok=True)
for f in r['songs']:
 chunks=[bytes.fromhex(f['original_header_hex'])]
 for i in range(f['channel_count']):
  s=data[f['file'],i]
  chunks.append(b''.join(bytes.fromhex(x[1])+bytes([x[3]])+bytes.fromhex(x[4]) for x in s['events']))
 chunks.append(bytes.fromhex(f['original_footer_hex']))
 result=b''.join(chunks)
 assert len(result)==f['bytes'] and hashlib.sha256(result).hexdigest()==f['sha256'],f['file']
 (out/f['file']).write_bytes(result)
print(json.dumps({'status':'PASS','byte_identical_music_files':len(r['songs']),'output_dir':str(out)}))

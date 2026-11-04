#!/usr/bin/env python3
"""Independent O200 source/ZIP verifier (does not import TypeScript producer).
Requires the canonical, unmodified MK2 executable. It is evidence-level static
validation only and makes no claims about live gameplay or visual assets.
"""
import sys, pathlib, hashlib, json, zipfile,struct, argparse
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SITES=(0x82c44,0x82c54,0x82c64)
def verify(game,export):
 p=pathlib.Path(game);path=p/'MK2.EXE'
 if not path.is_file():path=p/'mk2.exe'
 b=path.read_bytes();assert len(b)==861133 and hashlib.sha256(b).hexdigest()==EXE_SHA
 u=lambda at:struct.unpack_from('<I',b,at)[0]
 i=lambda at:struct.unpack_from('<i',b,at)[0]
 def tgt(at):assert b[at]==0xe8;return at+5+i(at+1)
 def s16(v):return v-0x10000 if v&0x8000 else v
 # Cross-check original helper instruction bytes, not just reported numerical results.
 assert b[0x64a19:0x64a2e].hex()=='508915845a0700c1fa108bc2c1f8022bd06689571e'
 assert b[0x64a2e:0x64a47].hex()=='8b15845a0700c1e210c1fa108bc2c1f8022bd06689571a58c3'
 assert b[0x82cb0:0x82cbb].hex()=='52c7056c5a0700146f0100'
 assert tgt(0x82cbb)==0x64548 and tgt(0x82cc1)==0x64a19
 assert b[0x82cd2]==0xe9 and 0x82cd2+5+i(0x82cd3)==0x665d4
 values=[]
 for at in SITES:
  assert b[at]==0xba and tgt(at+5)==0x82cb0
  raw=u(at+1);hi=s16(raw>>16);lo=s16(raw&0xffff)
  values.append((raw,hi,lo,lo-(lo>>2),hi-(hi>>2)))
 assert values==[(0x650106,101,262,197,76),(0x650232,101,562,422,76),(0x650352,101,850,638,76)]
 # First callback guard and source loop counter are not proof that it executes.
 assert u(0x82b05)==0x7650a and b[0x82b09:0x82b12].hex()=='83f8010f847746feff'
 assert b[0x82bb6]==0xc7 and u(0x82bb8)==0x75a7c and u(0x82bbc)==3
 assert b[0x82c37:0x82c3f].hex()=='ff0d7c5a07007581'
 assert b[0x82c3f]==0xe9 and 0x82c3f+5+i(0x82c40)==0x67189
 with zipfile.ZipFile(export) as z:
  assert z.testzip() is None
  names=z.namelist();assert len(names)==8 and len(set(names))==8
  assert not any(n.lower().endswith(('.exe','.gra','.drv')) for n in names)
  report=json.loads(z.read('evidence/report.json'))
  manifest=json.loads(z.read('MANIFEST.json'))
  assert report['source']['exeSHA256']==EXE_SHA==manifest['originalExeSHA256']
  assert manifest['liveCallbackObserved'] is False and report['verifiedByGameplay'] is False
  for o,v,at in zip(report['objects'],values,SITES):
   assert o['instructionPhysical']==at and o['packedEdx']==v[0]
   assert (o['rawHighSigned16'],o['rawLowSigned16'],o['outputField1A'],o['outputField1E'])==v[1:]
   assert o['field1APhysicalStore']==0x64a41 and o['field1EPhysicalStore']==0x64a2a
  for item in report['secondCallback']['originalBytes']:
   assert item['hex']==b[item['start']:item['end']].hex()
  exported=json.loads(z.read('evidence/object_coordinates.json'));assert exported==report['objects']
  graph=z.read('results/object_field_values.svg').decode()
  assert 'NOT rendered coordinates' in graph and '<svg' in graph
 print('PASS O200 independent: original helper instructions, 3 packed operands, transformed field writes, guarded first callback, all ZIP evidence bytes and no commercial resources')
if __name__=='__main__':
 q=argparse.ArgumentParser();q.add_argument('mk2Directory');q.add_argument('forensicZip');args=q.parse_args();verify(args.mk2Directory,args.forensicZip)

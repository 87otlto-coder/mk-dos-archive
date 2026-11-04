#!/usr/bin/env python3
"""Independently verify all five O118 full MK2 game copies against original ZIP."""
import zipfile,sys,json,hashlib,struct
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
F9_A=bytes.fromhex('1e172e162612201f1f1626');F9_B=bytes.fromhex('4300000000000000000000');OFF=0xCCF0E
PATCHES={'40_CHEAT_CONTROL':None,'41_TOMB_80_RECORD':(0x893c6,80,41,1),
 '42_TOMB_79_RECORD':(0x8cdbe,79,41,2),'43_PORTAL_80_RECORD':(0x891e0,80,67,1),
 '44_PORTAL_79_RECORD':(0x8cd1e,79,67,2)}
def verify(gamezip,kitzip):
 with zipfile.ZipFile(gamezip) as z:
  src={n[4:].lower():z.read(n) for n in z.namelist() if n.startswith('mk2/') and not n.endswith('/')}
 assert len(src)==614
 base=src['mk2.exe'];assert len(base)==861133 and base[OFF:OFF+11]==F9_A
 root='MK2_O118_Palette_Ownership_Test/'
 with zipfile.ZipFile(kitzip) as k:
  assert k.testzip() is None
  index=k.namelist();assert len(index)==3073,len(index)
  assert len(set(index))==len(index)
  manifest=json.loads(k.read(root+'PROBE_MANIFEST.json'))
  assert manifest['runtimeProven'] is False and set(manifest['cases'])==set(PATCHES)
  asserts=0;exes={}
  for label,patch in PATCHES.items():
   fields=manifest['cases'][label];pfx=root+label+'/'
   names=[n[len(pfx):] for n in index if n.startswith(pfx) and not n.endswith('/')]
   assert len(names)==614 and set(names)==set(src);asserts+=614
   for name in src:
    data=k.read(pfx+name)
    if name!='mk2.exe': assert data==src[name],f'{label}: original asset modified {name}'
    else:
     expected=bytearray(base);expected[OFF:OFF+11]=F9_B
     if patch:
      start,count,sourceidx,shift=patch
      assert struct.unpack_from('<H',base,start)[0]==count
      position=start+2+(sourceidx-shift)*2
      expected[position:position+2]=bytes.fromhex('1f7c')
      assert fields['editedRecords'][0]['wordPhysical']==position
     else:assert fields['editedRecords']==[]
     assert data==bytes(expected),f'{label}: EXE not exact expected patch'
     assert H(data)==fields['patchedExeSHA256']
     exes[label]=H(data)
   asserts+=2
  assert len(set(exes.values()))==5 and len(exes)==5
 return {'status':'PASS','verifiedGameAssetBytes':sum(len(data) for name,data in src.items() if name!='mk2.exe')*5,
         'assertions':asserts,'distinctExeSHA256':exes,'zipSHA256':H(Path(kitzip).read_bytes()),
         'originalGameFilesPerVariant':614,'runtimeEvidence':False}
if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage verify_o118_runtime_kit.py originalMK2.zip kit.zip')
 print(json.dumps(verify(*map(Path,sys.argv[1:])),indent=2))

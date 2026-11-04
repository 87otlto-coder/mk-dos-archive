#!/usr/bin/env python3
"""Independent, fail-closed O110Y suite. Regenerate expected packed tail values."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile
from collections import Counter

VARIANT_TO_RESOURCE={
 '00_BASELINE':None,'07_TOMB_PACKED_CHECKER':'tomb.gra',
 '08_TOMB_PACKED_FLAT':'tomb.gra','09_PORTAL_PACKED_CHECKER':'portal.gra'}
SLICES={'tomb.gra':(63776,48),'portal.gra':(56916,40)}
SHA_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'

def digest(b):return hashlib.sha256(b).hexdigest()

def check(game_zip:Path,dir:Path):
    with zipfile.ZipFile(game_zip) as z:
        originals={n[len('mk2/'):].lower():z.read(n) for n in z.namelist() if n.startswith('mk2/') and not n.endswith('/')}
    assert len(originals)>600
    assert digest(originals['mk2.exe'])==SHA_EXE
    man=json.loads((dir/'PROBE_MANIFEST.json').read_text())
    assert man['format']=='mk2_o110y_packed_resource_runtime_probes_v1'
    assert set(man['variants'])==set(VARIANT_TO_RESOURCE)
    assert man['stageSelectorPatched'] is False and man['runtimePaletteClaim']=='NONE'
    asserts=0
    for variant,mod_resource in VARIANT_TO_RESOURCE.items():
        root=dir/variant
        files={p.relative_to(root).as_posix().lower():p.read_bytes() for p in root.rglob('*') if p.is_file()}
        assert set(files)==set(originals),(variant,'files missing or added')
        asserts+=1
        report=man['variants'][variant]
        assert report['modifiedResource']==mod_resource
        assert report['exeSHA256']==SHA_EXE and files['mk2.exe']==originals['mk2.exe']
        asserts+=2
        totalchanged=0
        for name,orig in originals.items():
            got=files[name]
            assert len(got)==len(orig), (variant,name,'size')
            asserts+=1
            if name != mod_resource:
                assert got==orig,(variant,name,'non-target modified')
                asserts+=1
                continue
            off,rows=SLICES[name]
            assert len(orig)==off+rows*896
            assert got[:off]==orig[:off],(variant,'sprite prefix modified')
            asserts+=2
            suffix=orig[off:]
            levels=Counter(suffix)
            smallest=min(levels.keys());biggest=max(levels.keys())
            if variant=='08_TOMB_PACKED_FLAT':
                expected=bytes([levels.most_common(1)[0][0]])*len(suffix)
            else:
                expected=bytes(biggest if ((line//4+col//32)%2) else smallest
                    for line in range(rows) for col in range(896))
            assert got[off:]==expected,(variant,'noncanonical test pattern')
            n=sum(a!=b for a,b in zip(expected,suffix))
            assert n==report['changedByteCount']
            assert report['packedOffset']==off and report['rows']==rows and report['stride']==896
            assert report['originalResourceSHA256']==digest(orig)
            assert report['patchedResourceSHA256']==digest(got)
            assert report['prefixSHA256']==digest(orig[:off])
            totalchanged+=n
            # Reverse every actual changed byte, byte-identical to the original file.
            rev=bytearray(got)
            for i,(a,b) in enumerate(zip(got,orig)):
                if a!=b:
                    assert i>=off
                    rev[i]=b
            assert digest(rev)==digest(orig)
            asserts+=9
        assert report['changedByteCount']==totalchanged
        asserts+=1
    return asserts

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('game_zip');p.add_argument('test_root');a=p.parse_args()
 try:
  result=check(Path(a.game_zip),Path(a.test_root))
  print(f'O110Y VERIFIED {result} independent assertions; 4 directories, source EXE unchanged')
 except Exception as exc:
  print(f'O110Y VERIFICATION REJECTED: {exc}',file=sys.stderr);sys.exit(1)

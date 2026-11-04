#!/usr/bin/env python3
"""Independent verifier for all O110W input-local patches and untouched byte regions."""
import json,sys,hashlib,struct
from pathlib import Path

HASH = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
SPEC = {'PAL48_MAGENTA':(0x88918,48,0x7c1f), 'PAL64_GREEN':(0x8c77c,64,0x03e0)}
LOOKUP = 0x659ea
GATE = 0x9e122
VARIANTS = ('BASELINE','PAL48_MAGENTA','PAL64_GREEN','BANK_START_1','BANK_START_49','BANK_START_65','STAGE_SKIP')

def h(x):return hashlib.sha256(x).hexdigest()

def verify(source_file, output):
    baseline = Path(source_file).read_bytes()
    assert len(baseline)==861133 and h(baseline)==HASH
    report=json.loads((Path(output)/'PROBE_MANIFEST.json').read_text())
    assert report['canonicalExe']['sha256']==HASH
    assert set(report['variants'])==set(VARIANTS)
    checks=0
    for name in VARIANTS:
        b=(Path(output)/name/'MK2.EXE').read_bytes()
        assert len(b)==len(baseline);checks+=1
        expected=bytearray(baseline)
        if name in SPEC:
            offset, num, word=SPEC[name]
            assert struct.unpack_from('<H',baseline,offset)[0]==num;checks+=1
            for i in range(1,num):struct.pack_into('<H',expected,offset+2+2*i,word)
        elif name.startswith('BANK_START_'):
            val=int(name.rsplit('_',1)[1]);assert val in (1,49,65)
            assert baseline[LOOKUP:LOOKUP+7]==bytes.fromhex('8a04c5065b0700');checks+=1
            expected[LOOKUP:LOOKUP+7]=bytes([0xb0,val]+[0x90]*5)
        elif name=='STAGE_SKIP':
            assert baseline[GATE:GATE+2]==bytes.fromhex('7473');checks+=1
            expected[GATE]=0xeb
        assert b==bytes(expected),f'Unexpected edited bytes in {name}';checks+=1
        d=[i for i,(a,c) in enumerate(zip(b,baseline)) if a!=c]
        assert report['variants'][name]['changedByteCount']==len(d);checks+=1
        assert report['variants'][name]['offsetsHex']==[hex(i) for i in d];checks+=1
        assert report['variants'][name]['sha256']==h(b);checks+=1
        recovered=bytearray(b)
        for i in d:recovered[i]=baseline[i]
        assert h(recovered)==HASH;checks+=1
        for i in d:
            assert (0x61c54<=i<0xa0c54),f'Outside source-backed Object 1: {i:06x}';checks+=1
    return checks

if __name__=='__main__':
    n=verify(sys.argv[1],sys.argv[2]);print(f'O110W STATIC PATCH VERIFICATION: PASS ({n} checks, {len(VARIANTS)} variants)')

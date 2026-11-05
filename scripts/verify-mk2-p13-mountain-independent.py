#!/usr/bin/env python3
"""Independent P13 MOUNTAIN.GRA original-source verifier, no graphics serialized to Git.

Re-decodes the original GRA directly in Python; compares SHA-256s to a checked-in
hash-only reference prepared from the O96T/O96U evidence. No runtime palette,
named gameplay stage, coordinates, frame time, or live source mode is inferred.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

if len(sys.argv) not in (3, 4):
    raise SystemExit('usage: verifier <original MK2 directory> <hash-only reference.json> [report.json]')
root, refpath = Path(sys.argv[1]), Path(sys.argv[2])
exe, gra = (root / 'mk2.exe').read_bytes(), (root / 'mountain.gra').read_bytes()
h = lambda b: hashlib.sha256(b).hexdigest()
E = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
G = '0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6'
assert h(exe) == E and h(gra) == G and len(gra) == 191748, 'original fixture identity mismatch'
assert exe[0xa0ef1:0xa13a7].split(b'\0')[37] == b'MOUNTAIN.GRA', 'source pool resource 37 mismatch'
checks = 3
records = []
for i in range(15):
    physical = 0xa0c54 + 0x1c4cc + i*16
    raw = exe[physical:physical+16]
    w, ht, state, packed, aux = struct.unpack('<HHIII', raw)
    assert (w, ht, state, packed >> 24, aux) == (35, 41, 0, 37, 0x2b52a), f'descriptor {i}'
    start = packed & 0xffffff
    p = start
    ix = bytearray(w*ht)
    mask = bytearray(w*ht)
    commands = dict(skip=0, rle=0, literal=0)
    for y in range(ht):
        x = 0
        while x < w:
            assert p+4 <= len(gra), f'truncated command {i} row {y}'
            cmd = struct.unpack_from('<I',gra,p)[0]; p += 4
            if cmd & 1:
                count = cmd >> 1; commands['skip'] += 1
            elif cmd & 2:
                count = cmd >> 10
                ix[y*w+x:y*w+x+count] = bytes([(cmd>>2)&255])*count
                mask[y*w+x:y*w+x+count] = b'\1'*count
                commands['rle'] += 1
            else:
                count = cmd >> 2
                assert 0 < count <= 64 and p+count <= len(gra), 'literal extent'
                ix[y*w+x:y*w+x+count] = gra[p:p+count]
                mask[y*w+x:y*w+x+count] = b'\1'*count
                p += (count+3)&~3
                commands['literal'] += 1
            assert 0 < count <= w-x, f'row overflow {i}:{y}'
            x += count
            checks += 1
        assert x==w
        checks += 1
    assert all(mask) and not commands['skip'], 'fully opaque source images only'
    rgba=bytearray()
    for index in ix:
        shade=index*255//96
        rgba.extend((shade,shade,shade,255))
    records.append(dict(ordinal=i,selected=i<14,descriptorPhysical=physical,
                        descriptorSHA256=h(raw),offset=start,endExclusive=p,
                        width=w,height=ht,pixelSHA256=h(ix),maskSHA256=h(mask),diagnosticRgbaSHA256=h(rgba),
                        colorIndexMin=min(ix),colorIndexMax=max(ix),commands=commands))
    checks += 4
assert records[0]['offset'] == 0x29314 and records[-1]['endExclusive']==len(gra)
assert all(a['endExclusive']==b['offset'] for a,b in zip(records,records[1:])), 'gapless suffix'
assert sum(x['endExclusive']-x['offset'] for x in records)==23024
assert len(set(r['pixelSHA256'] for r in records)) == 15
assert max(r['colorIndexMax'] for r in records)==96
checks += 5
# O96S selected table: 15 slots but only 14 unique records, slot 14 aliases slot 13.
pointer_base=0xa0c54+0x1c264
for slot in range(15):
    target=struct.unpack_from('<I',exe,pointer_base+slot*4)[0]
    assert target==0x1c4cc+min(slot,13)*16
    checks += 1
# Original O96R six 16-word streams and independent O96U conditional selections.
orders=[]
for variant in range(6):
    word_table=0xa0c54+0x2af80
    pointer=struct.unpack_from('<I',exe,word_table+4*variant)[0]
    assert pointer==0x2af98+32*variant
    words=list(struct.unpack_from('<16h',exe,0xa0c54+pointer))
    assert words[14:]==[13,-1] and set(words[:14])==set(range(13))|{14}
    orders.append(words[:14]); checks+=3
assert len({tuple(x) for x in orders}) == 5 and orders[2]==orders[3]
assert [struct.unpack_from('<h',exe,0xa0c54+0x1c2c6+2*i)[0] for i in range(14)] == list(range(771,159,-47))
checks+=2
reference={
    'format':'mk2_p13_o96t_o96u_original_source_hashes_v1',
    'fixture':{'mk2ExeSha256':E,'mountainGraSha256':G,'mountainGraBytes':len(gra)},
    'bounds':{'prefixUnqualifiedBytes':0x29314,'suffixStart':0x29314,'suffixEndExclusive':len(gra),'suffixEncodedBytes':23024},
    'pointerTable':{'slots':15,'distinctSelectedDescriptors':14,'slot14Aliases13':True},
    'records':records,
    'conditionalVariants':orders,
    'limits':{'runtimePaletteVerified':False,'scenePlacementVerified':False,'timingVerified':False,'namedArenaVerified':False,
              'adjacentFifteenthSelected':False,'sourcePrefixComplete':False}
}
if refpath.name == '--generate':
    print(json.dumps(reference,indent=2))
else:
    expected=json.loads(refpath.read_text())
    assert reference==expected, 'hash-only O96T/O96U reference mismatch'
    checks+=1
    result=dict(passName='P13-O96T-O96U',status='PASS',checks=checks,records=15,selected=14,
                adjacentUnselected=1,sourcePixels=15*35*41,sourceSuffixBytes=23024,
                runtimeColorsKnown=False,stageAssemblyKnown=False)
    if len(sys.argv)==4: Path(sys.argv[3]).write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

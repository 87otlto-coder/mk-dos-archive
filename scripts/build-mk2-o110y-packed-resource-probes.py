#!/usr/bin/env python3
"""Create *resource-only* MK2 DOSBox stage diagnostic copies from canonical mk2.zip.

Does not touch original archive, EXE bytes, sprite prefix, file sizes or metadata.
Authoring experiment: packed suffix identity/consumption at the user's first fight.
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import zipfile

EXE_SHA256 = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
RANGES = {'tomb.gra': (63776,48), 'portal.gra':(56916,40)}
STRIDE = 896
VARIANTS = ['00_BASELINE', '07_TOMB_PACKED_CHECKER', '08_TOMB_PACKED_FLAT', '09_PORTAL_PACKED_CHECKER']


def sha(b:bytes)->str:
    return hashlib.sha256(b).hexdigest()


def original_files(z:zipfile.ZipFile)->dict[str,bytes]:
    entries = {n[len('mk2/'):].lower():z.read(n) for n in z.namelist()
               if n.startswith('mk2/') and not n.endswith('/')}
    if len(entries)<600 or sha(entries['mk2.exe'])!=EXE_SHA256:
        raise ValueError('Noncanonical MK2 corpus/executable; refuse to patch')
    for name,(offset,rows) in RANGES.items():
        data = entries[name]
        if len(data) != offset+rows*STRIDE:
            raise ValueError(f'{name}: packed suffix not at expected exact EOF')
        if len(set(data[offset:])) < 15:
            raise ValueError(f'{name}: suffix has implausible source index diversity')
    return entries


def changed_resource(variant:str, original:dict[str,bytes])->tuple[str|None,bytes|None]:
    if variant == '00_BASELINE': return None, None
    name='portal.gra' if variant.startswith('09_') else 'tomb.gra'
    offset,rows=RANGES[name]
    data=bytearray(original[name])
    suffix=data[offset:]
    histogram=Counter(suffix)
    low=min(histogram);high=max(histogram)
    if variant=='08_TOMB_PACKED_FLAT':
        most_common=histogram.most_common(1)[0][0]
        replacement=bytes([most_common])*(rows*STRIDE)
    else:
        # Original observed source-index extrema, not made-up palette indices.
        # Checker makes clear both spatial directions if this exact 896-stride
        # buffer is consumed by the live renderer.
        replacement=bytes(high if ((y//4+x//32)&1) else low
            for y in range(rows) for x in range(STRIDE))
    data[offset:] = replacement
    assert bytes(data[:offset])==original[name][:offset]
    assert len(data)==len(original[name])
    return name,bytes(data)


def build(game_zip:Path,out_dir:Path)->dict:
    out_dir.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(game_zip) as z: original=original_files(z)
    baseline_id = sha(b''.join(sha(original[k]).encode() for k in sorted(original)))
    man={'format':'mk2_o110y_packed_resource_runtime_probes_v1',
        'researchStatus':'STATICALLY VERIFIED / WINDOWS DOSBOX TEST REQUIRED',
        'experiment':'Does authentic 896-stride tail of TOMB.GRA participate in first-fight arena rendering? PORTAL.GRA is a resource-specific negative control.',
        'canonicalExeSHA256':EXE_SHA256,'canonicalFiles':len(original),
        'baselineCorpusDigest':baseline_id,'stageSelectorPatched':False,
        'runtimePaletteClaim':'NONE', 'variants':{}}
    for variant in VARIANTS:
        target,patched=changed_resource(variant,original)
        vdir=out_dir/variant;vdir.mkdir(exist_ok=True)
        for name,data in original.items():
            (vdir/name).parent.mkdir(parents=True,exist_ok=True)
            (vdir/name).write_bytes(patched if name==target else data)
        if target:
            offset,rows=RANGES[target]
            data=original[target]
            old_suf=data[offset:];new_suf=patched[offset:]
            changed=[i for i,(a,b) in enumerate(zip(old_suf,new_suf)) if a!=b]
            rec={'modifiedResource':target,'packedOffset':offset,'stride':STRIDE,'rows':rows,
                 'changedByteCount':len(changed),'originalResourceSHA256':sha(data),
                 'patchedResourceSHA256':sha(patched),'originalSuffixSHA256':sha(old_suf),
                 'patchedSuffixSHA256':sha(new_suf),'prefixSHA256':sha(data[:offset]),
                 'originalIndexRange':[min(old_suf),max(old_suf)],
                 'test': 'source-only static diagnostic; no proven runtime effect'}
        else:rec={'modifiedResource':None,'changedByteCount':0}
        rec['exeSHA256']=sha((vdir/'mk2.exe').read_bytes())
        man['variants'][variant]=rec
    (out_dir/'PROBE_MANIFEST.json').write_text(json.dumps(man,indent=2)+'\n')
    return man

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('game_zip');p.add_argument('output_folder');a=p.parse_args()
    r=build(Path(a.game_zip),Path(a.output_folder))
    for k,v in r['variants'].items():print(k, v['modifiedResource'],v['changedByteCount'])

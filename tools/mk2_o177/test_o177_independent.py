#!/usr/bin/env python3
"""O177 adversarial cases: tampered ZIP sources cannot pass trusted frame audit."""
import io, json, sys, zipfile
from pathlib import Path
from verify_original_effect_archive_independent import verify

def run(archive,o136,o137):
    a=Path(archive);out=verify(a,o136,o137);assert out['sourceOriginalFrames']==43
    base={n:v for n,v in ((n,None) for n in zipfile.ZipFile(a).namelist())}
    with zipfile.ZipFile(a) as z: entries={n:z.read(n) for n in z.namelist()}
    cases=[]
    def t(name,fn):
        mutated=entries.copy();fn(mutated)
        mem=io.BytesIO()
        with zipfile.ZipFile(mem,'w',compression=zipfile.ZIP_STORED) as z:
            for k,v in mutated.items():z.writestr(k,v)
        tmp=a.parent/('_O177_CORRUPT_'+name+'.zip');tmp.write_bytes(mem.getvalue())
        try:
            try:verify(tmp,o136,o137)
            except (AssertionError,ValueError,KeyError,zipfile.BadZipFile):cases.append(name)
            else:raise AssertionError('accepted forged '+name)
        finally:tmp.unlink(missing_ok=True)
    def rewrite_manifest(m,change):
        j=json.loads(m['manifest.json']);change(j);m['manifest.json']=json.dumps(j).encode()
    t('missing_index',lambda m:m.pop(next(n for n in m if n.endswith('indices.bin'))))
    t('wrong_index',lambda m:m.__setitem__(next(n for n in m if n.endswith('indices.bin')),b'\0'))
    t('unknown_extra',lambda m:m.__setitem__('extra/payload.txt',b'no'))
    t('false_fps',lambda m:rewrite_manifest(m,lambda j:j.__setitem__('runtimeFrameRateKnown',True)))
    t('false_tower_palette',lambda m:rewrite_manifest(m,lambda j:j.__setitem__('towerPaletteSelectedByRuntime',True)))
    t('forged_pointer',lambda m:rewrite_manifest(m,lambda j:j['tracks'][0].__setitem__('sourcePointerObject2',9)))
    t('forged_palette',lambda m:rewrite_manifest(m,lambda j:j['tracks'][-1].__setitem__('paletteStatus','RUNTIME_VERIFIED')))
    t('altered_geometry',lambda m:rewrite_manifest(m,lambda j:j['tracks'][1]['frames'][0].__setitem__('width',1)))
    def alter_png(m):
        n=next(n for n in m if n.endswith('.png'));v=bytearray(m[n]);v[-16]^=1;m[n]=bytes(v)
    t('altered_png',alter_png)
    assert len(cases)==9
    return {'status':'PASS_O177_INDEPENDENT_ADVERSARIAL','cases':len(cases),'names':cases}
if __name__=='__main__':print(json.dumps(run(*sys.argv[1:]),indent=2))

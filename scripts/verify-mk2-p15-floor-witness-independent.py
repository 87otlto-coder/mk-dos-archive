#!/usr/bin/env python3
"""Independent MK2 O115/O117 canonical packed-floor screenshot-RGB parity producer.

Uses original game resources and exact previously authenticated O115 JSON reports supplied
privately, never a TypeScript palette table. Verifies source hashes and provenance.
Writes only safe SHA-256 digests/geometry to JSON; no original game pixels or RGB media.
"""
import argparse, hashlib, json, pathlib

STAGES = (
 dict(stage='tomb', resource='tomb.gra', resourceSHA256='be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
      sourceOffset=63776, rows=48, left=291, lo=2, hi=51,
      report='O115_TOMB_23_RAMP.json',reportSHA256='3015abb40e57ffbc449d110c855b0b6c25d0074e77742988ce352dfbc2f7ebdb',
      screenshotSHA256='30e1b00ba361e40a791dffd3d10abdbc2cf77402cacee78f6d07676ae0b83791',
      controlSHA256='5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9',
      heldoutExactPixels=12222,stageWitness='O117 independent held-out original Tomb screenshot'),
 dict(stage='portal', resource='portal.gra',resourceSHA256='cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
      sourceOffset=56916,rows=40,left=292,lo=3,hi=80,
      report='O115_PORTAL_26_RAMP.json',reportSHA256='94419d55de3d62577a3fe04f260d6299cf1214116b1f8e4c5911171f2598dd5e',
      screenshotSHA256='fbce84f4c85fc608241148bafed9baac76c78bc394736ebecce8926b6648f9ed',
      controlSHA256='',heldoutExactPixels=4420,stageWitness='O115/O116 independent original Portal control screenshot'),
)
SHA = lambda b: hashlib.sha256(b).hexdigest()

def build(original:pathlib.Path,witness:pathlib.Path):
    results=[]
    for s in STAGES:
        source=(original/s['resource']).read_bytes()
        assert SHA(source)==s['resourceSHA256'],s['resource']+' source hash mismatch'
        assert len(source)==s['sourceOffset']+896*s['rows']
        report_raw=(witness/s['report']).read_bytes()
        assert SHA(report_raw)==s['reportSHA256'],s['report']+' report hash mismatch'
        data=json.loads(report_raw)
        assert data['schema']=='mk2_o115_ramp_color_witness_v1'
        assert data['stage']==s['stage']
        assert data['sourceIndexDomain']==[s['lo'],s['hi']]
        assert data['completeObservedColorTable'] is True
        assert data['input']['sha256']==s['screenshotSHA256']
        table=data['indexToObservedColor']
        assert set(table)==set(map(str,range(s['lo'],s['hi']+1)))
        palette={}
        for i in range(s['lo'],s['hi']+1):
            record=table[str(i)]
            assert record['qualified'] is True
            rgb=record['observedRGB']
            assert len(rgb)==3 and all(type(x)==int and 0<=x<=255 for x in rgb)
            palette[i]=bytes(rgb)
        indices=bytearray()
        rgba=bytearray()
        for row in range(s['rows']):
            pixels=source[s['sourceOffset']+896*row+s['left']:s['sourceOffset']+896*row+s['left']+320]
            assert len(pixels)==320
            for n in pixels:
                assert n in palette,f'unobserved source index {n} in {s["stage"]}'
                indices.append(n)
                rgba.extend(palette[n]);rgba.append(255)
        result={k:v for k,v in s.items() if k not in ('report', 'controlSHA256')}
        result.update(width=320,height=s['rows'],sourceStride=896,pixelCount=len(indices),
                      observedIndexCount=len(set(indices)),indicesSHA256=SHA(indices),rgbaSHA256=SHA(rgba),
                      paletteKnownMaskSHA256=SHA(bytes([0])*len(indices)),
                      sourcePaintMaskSHA256=SHA(bytes([1])*len(indices)),
                      sourceLeftExplanation='Conditional screenshot-source alignment, not runtime camera',
                      rgbMeaning='O115 original DOSBox screenshot-observed conditional colour table; NOT native DAC bank')
        results.append(result)
    return dict(schema='mk2_p15_original_floor_screenshot_witness_reference_v1',
       producer='independent Python source-resource and O115 screenshot report parser (no TypeScript imports)',
       originalFilePixelsStored=False,screenshotPixelsStored=False,
       sourceResearch=['O115','O116','O117'],stages=results)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('original_mk2_dir',type=pathlib.Path)
    ap.add_argument('witness_reports_dir',type=pathlib.Path)
    ap.add_argument('--out',type=pathlib.Path)
    a=ap.parse_args();result=build(a.original_mk2_dir,a.witness_reports_dir)
    if a.out:a.out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()

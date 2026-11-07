#!/usr/bin/env python3
"""P48 independent native-plane and indexed-archive readback; no runtime palette inference."""
import argparse,hashlib,json,runpy,struct,zipfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
H=lambda b:hashlib.sha256(b).hexdigest()
read_png=runpy.run_path(str(HERE/'verify-mk2-p22-cave-independent.py'))['read_png']
def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root',type=Path);ap.add_argument('private_output',type=Path);ap.add_argument('--report',type=Path,required=True);a=ap.parse_args()
    expected={};source_checks=0
    for script,prefix in [('p22-cave','cave'),('p34-armory-tail','armory-tail'),('p32-forest-tail','forest-tail'),('p27-tomb','tomb'),('p28-portal','portal')]:
        ref,_,checks=runpy.run_path(str(HERE/f'verify-mk2-{script}-independent.py'))['originals'](a.root)
        row=ref['images'][0];expected[f'mk2-{prefix}-source:0:original-indices']=row;source_checks+=checks
    ref,checks=runpy.run_path(str(HERE/'verify-mk2-p42-tower-source-audit.py'))['originals'](a.root)
    row=ref['frames'][0];expected[row['assetId']]=row;source_checks+=checks
    ref,_,checks=runpy.run_path(str(HERE/'verify-mk2-p33-pit-independent.py'))['originals'](a.root)
    row=ref['existingBridgeFrames'][0];expected[row['assetId']]=row;source_checks+=checks
    files={}
    for p in a.root.rglob('*'):
        if p.is_file():files.setdefault(p.name.lower(),[]).append(p)
    assert len(files['mk2.exe'])==len(files['battle.gra'])==1
    exe=files['mk2.exe'][0].read_bytes();gra=files['battle.gra'][0].read_bytes()
    assert H(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
    assert H(gra)=='ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63'
    assert struct.unpack_from('<I',exe,0xcfbac+4)[0]==(34<<24|59436)
    expected['mk2-floor:battle:indices-preview']={'width':896,'height':40,'start':59436,'endExclusive':95276,'indicesSha256':H(gra[59436:])}
    cases=json.loads((a.private_output/'cases.json').read_text(encoding='utf-8'));assert len(cases)==8
    assert {c['id'] for c in cases}==set(expected)
    checks=0
    for c in cases:
        blob=(a.private_output/c['file']).read_bytes();assert H(blob)==c['sha256'];row=expected[c['id']]
        with zipfile.ZipFile(a.private_output/c['file']) as z:
            assert z.testzip() is None
            assets=json.loads(z.read('manifest.json'))['selectionOrder'];assert len(assets)==1;asset=assets[0]
            assert asset['id']==c['id'] and (asset['width'],asset['height'])==(row['width'],row['height'])
            assert asset['source']['offset']==row['start'] and asset['source']['length']==row['endExclusive']-row['start']
            ix=z.read('indexed/00000_indices.bin');assert H(ix)==row['indicesSha256']
            if 'maskSha256' in row:
                mask=z.read('indexed/00000_mask.bin');assert H(mask)==row['maskSha256']
            else:
                assert 'indexed/00000_mask.bin' not in z.namelist();mask=bytes([1])*len(ix)
            if 'paletteKnownSha256' in row:
                assert H(z.read('indexed/00000_paletteKnownMask.bin'))==row['paletteKnownSha256']
            else:assert 'indexed/00000_paletteKnownMask.bin' not in z.namelist()
            pngs=[n for n in z.namelist() if n.startswith('assets/')];assert len(pngs)==1
            w,h,rgba=read_png(z.read(pngs[0]));assert (w,h)==(row['width'],row['height'])
            assert H(rgba)==c['previewRgbaSha256'] and bytes(rgba[3::4])==bytes(255*b for b in mask)
            checks+=len(ix)*3+12
    result={'status':'PASS','indexedAssetCases':8,'originalFileDecoderChecks':source_checks,'nativePlaneAndPreviewChecks':checks,
        'missingMasksNotInvented':True,'previewRgbaRoundtripOnly':True,'nativeRuntimePaletteClaimed':False,'originalDataBrowserVerified':False}
    a.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
if __name__=='__main__':main()


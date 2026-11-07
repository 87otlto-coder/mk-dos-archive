#!/usr/bin/env python3
"""P44: independent original-file coverage oracle and existing 43-effect export readback.
Preview RGBA roundtrip equality is separate from native palette ownership.
"""
import argparse,copy,hashlib,io,json,runpy,struct,zipfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
H=lambda b:hashlib.sha256(b).hexdigest()
def expected(root):
    files,data,hashes,checks,_=runpy.run_path(str(HERE/'verify-mk2-p38-tomb-effects-independent.py'))['expected'](root)
    frames=[]
    for script in ['verify-mk2-p38-tomb-effects-independent.py','verify-mk2-p39-portal-source-audit.py','verify-mk2-p42-tower-source-audit.py']:
        ref,c=runpy.run_path(str(HERE/script))['originals'](root)
        frames.extend(ref['frames'])
        if 'portal' in script or 'tower' in script:
            checks+=c;name='PORTAL.GRA' if 'portal' in script else 'TOWER.GRA'
            data[name].extend({k:f[k] for k in ['assetId','start','endExclusive']} for f in ref['frames'])
    assert len(frames)==43
    return files,data,hashes,checks,{'frames':frames}
def validate(report,files,data,hashes):
    assert report['schema']=='mkdos_p43_native_source_interval_coverage_v1'
    assert report['status']=='VERIFIED_INTERVAL_ACCOUNTING'
    assert report['sceneCompletenessClaimed'] is False and report['originalDataIncluded'] is False
    assert len(report['resources'])==15
    wanted=set(data)|{'VFRAME.GRA','FONTS.GRA','PLAYSTA.GRA','PROBE.GRA','ACCLAIM.GRA','MONKS.GRA'}
    assert {r['name'] for r in report['resources']}==wanted
    counts=0
    for r in report['resources']:
        name=r['name'];paths=files[name.lower()];assert len(paths)==1
        gra=paths[0].read_bytes();size=len(gra);assert r['resourceBytes']==size
        assert r['upstreamAuthenticatedSha256']==hashes.get(name)
        if name in hashes:assert hashlib.sha256(gra).hexdigest()==hashes[name]
        spans=sorted(data.get(name,[]),key=lambda x:(x['start'],x['endExclusive'],x['assetId']))
        assert r['intervals']==spans and r['qualifiedReferences']==len(spans)
        assert r['status']==('VERIFIED_INTERVAL_ACCOUNTING' if spans else 'NO_QUALIFIED_INTERVALS_IN_SCOPE')
        # Independent byte-set oracle: no copy of the TypeScript interval-merging algorithm.
        marked=bytearray(size);total=0
        for x in spans:
            a,b=x['start'],x['endExclusive'];assert 0<=a<b<=size
            marked[a:b]=bytes([1])*(b-a);total+=b-a
        covered=sum(marked);gaps=[];union=[];at=0
        while at<size:
            start=at;state=marked[at]
            while at<size and marked[at]==state:at+=1
            (union if state else gaps).append({'start':start,'endExclusive':at})
        assert r['union']==union and r['gaps']==gaps
        assert r['coveredBytes']==covered and r['outsideScopeBytes']==size-covered
        assert r['referencedBytes']==total and r['duplicateOrOverlappingReferenceBytes']==total-covered
        counts+=len(spans)
    assert counts==315
    for field,count,start,end in [('tombEffectReconciliation',16,54328,63776),('portalEffectReconciliation',20,35912,56916),('towerEffectReconciliation',7,40776,56268)]:
        rec=report[field]
        assert rec['status']=='VERIFIED' and rec['existingEffectReferences']==count
        assert rec['newRepresentations']==0 and rec['nativePaletteOrTimingClaimsAdded'] is False
        assert rec['sourceImageInterval']=={'start':start,'endExclusive':end,'encodedBytes':end-start}
    return counts
def verify_export(archive,reference,previews):
    read_png=runpy.run_path(str(HERE/'verify-mk2-p22-cave-independent.py'))['read_png']
    checks=0
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assets=json.loads(z.read('manifest.json'))['selectionOrder']
        assert len(assets)==43 and len(z.namelist())==130
        pngs=[n for n in z.namelist() if n.startswith('assets/')]
        by_id={f['assetId']:f for f in reference['frames']}
        assert {a['id'] for a in assets}==set(by_id)
        for i,a in enumerate(assets):
            row=by_id[a['id']]
            assert a['id']==row['assetId']
            assert (a['width'],a['height'])==(row['width'],row['height'])
            assert a['source']['offset']==row['start'] and a['source']['length']==row['endExclusive']-row['start']
            m=a['metadata']
            assert m['descriptorObject2']==row['descriptorObject2'] and m['sourcePointerObject2']==row['sourcePointerObject2']
            assert m['sourceX']==row['anchor']['x'] and m['sourceY']==row['anchor']['y']
            for flag in ['animationFPSKnown','runtimeActivationKnown','finalScreenCoordinatesKnown','runtimePaletteSelected']:assert m[flag] is False
            ix=z.read(f'indexed/{i:05}_indices.bin');mask=z.read(f'indexed/{i:05}_mask.bin')
            assert H(ix)==row['indicesSha256'] and H(mask)==row['maskSha256']
            width,height,rgba=read_png(z.read(pngs[i]))
            assert (width,height)==(row['width'],row['height'])
            assert bytes(rgba[3::4])==bytes(255*b for b in mask)
            assert H(rgba)==previews[a['id']]
            checks+=len(ix)*3+12
    return checks

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root',type=Path);ap.add_argument('coverage',type=Path);ap.add_argument('archive',type=Path);ap.add_argument('preview_report',type=Path);ap.add_argument('--report',type=Path,required=True)
    a=ap.parse_args();files,data,hashes,checks,ref=expected(a.root)
    report=json.loads(a.coverage.read_text());previews=json.loads(a.preview_report.read_text())['existingEffectPreviewRgbaSha256']
    validate(report,files,data,hashes);export_checks=verify_export(a.archive,ref,previews);report_rejections=0;export_rejections=0
    for label in ['false_total','wrong_extent','invented_scene','removed_effect','wrong_hash','invented_gap','invented_timing','invented_artwork']:
        bad=copy.deepcopy(report);tower=next(r for r in bad['resources'] if r['name']=='TOWER.GRA')
        if label=='false_total':tower['coveredBytes']-=1
        elif label=='wrong_extent':tower['intervals'][0]['start']+=4
        elif label=='invented_scene':bad['sceneCompletenessClaimed']=True
        elif label=='removed_effect':tower['intervals']=tower['intervals'][:-1]
        elif label=='wrong_hash':tower['upstreamAuthenticatedSha256']='0'*64
        elif label=='invented_gap':tower['gaps']=[{'start':40776,'endExclusive':56268}]
        elif label=='invented_timing':bad['towerEffectReconciliation']['nativePaletteOrTimingClaimsAdded']=True
        else:bad['towerEffectReconciliation']['newRepresentations']=7
        try:validate(bad,files,data,hashes)
        except AssertionError:report_rejections+=1
        else:raise AssertionError(label+' accepted')
    with zipfile.ZipFile(a.archive) as z:clean={n:z.read(n) for n in z.namelist()}
    changed_png=runpy.run_path(str(HERE/'test-mk2-p35-arena-tail-negative.py'))['changed_png']
    for label in ['indices','mask','png','extent','native_timing','descriptor']:
        altered=clean.copy()
        if label in ['indices','mask']:
            key=f'indexed/00000_{label}.bin';b=bytearray(altered[key]);b[0]^=1;altered[key]=bytes(b)
        elif label=='png':
            key=next(k for k in altered if k.startswith('assets/'));altered[key]=changed_png(altered[key])
        else:
            manifest=json.loads(altered['manifest.json']);row=manifest['selectionOrder'][0]
            if label=='extent':row['source']['offset']+=4
            elif label=='native_timing':row['metadata']['animationFPSKnown']=True
            else:row['metadata']['descriptorObject2']=0
            altered['manifest.json']=json.dumps(manifest).encode()
        b=io.BytesIO()
        with zipfile.ZipFile(b,'w',compression=zipfile.ZIP_STORED) as z:
            for k,v in altered.items():z.writestr(k,v)
        b.seek(0)
        try:verify_export(b,ref,previews)
        except AssertionError:export_rejections+=1
        else:raise AssertionError(label+' accepted')
    validate(report,files,data,hashes);verify_export(a.archive,ref,previews)
    result={'status':'PASS','independentNativeReferences':315,'existingEffectFrames':43,'originalFileDecoderChecks':checks,
        'exportChecks':export_checks,'falseReportsRejected':report_rejections,'falseExportsRejected':export_rejections,'cleanReverified':True,
        'nativeRuntimePaletteClaimed':False,'previewRgbaRoundtripOnly':True}
    a.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
if __name__=='__main__':main()

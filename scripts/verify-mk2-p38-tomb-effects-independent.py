#!/usr/bin/env python3
"""P38 independent original TOMB effect-list/descriptor/row reconstruction."""
import argparse,copy,hashlib,json,runpy,struct,zipfile
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'
BASE=0xa0c54
def originals(root):
    files={}
    for p in root.rglob('*'):
        if p.is_file():files.setdefault(p.name.lower(),[]).append(p)
    assert len(files['mk2.exe'])==len(files['tomb.gra'])==1
    exe=files['mk2.exe'][0].read_bytes();gra=files['tomb.gra'][0].read_bytes()
    assert H(exe)==EXE_SHA and H(gra)==GRA_SHA and len(gra)==106784
    assert exe[0xa0ef1:0xa13a7].split(bytes([0]))[28]==b'TOMB.GRA'
    frames=[];checks=3
    for name,list_offset,writer in [('tomb_flying_a',0x17814,0x82d51),('tomb_flying_b',0x177ec,0x82db3)]:
        assert exe[writer:writer+6]==bytes([199,5,120,90,7,0])
        assert struct.unpack_from('<I',exe,writer+6)[0]==list_offset
        pointers=struct.unpack_from('<10I',exe,BASE+list_offset)
        assert pointers[8:]==(1,list_offset)
        previous=None
        for ordinal,offset in enumerate(pointers[:8]):
            at=BASE+offset
            width,height,x,y,ref=struct.unpack_from('<HHhhI',exe,at)
            start=ref&0xffffff;assert ref>>24==28
            assert 0<width<=640 and 0<height<=480
            assert previous is None or previous==start
            pixels=[];paint=[];pos=start
            for row in range(height):
                line=[];mask=[]
                while len(line)<width:
                    assert pos+4<=len(gra);command=struct.unpack_from('<I',gra,pos)[0];pos+=4
                    if command&1:count=command//2;values=[0]*count;bits=[0]*count
                    elif command&2:count=command//1024;values=[(command//4)%256]*count;bits=[1]*count
                    else:
                        count=command//4;assert 0<count<=64 and pos+((count+3)//4)*4<=len(gra)
                        values=list(gra[pos:pos+count]);bits=[1]*count;pos+=((count+3)//4)*4
                    assert 0<count<=width-len(line)
                    line.extend(values);mask.extend(bits)
                pixels.extend(line);paint.extend(mask)
            previous=pos
            frames.append(dict(assetId=f'mk2-stage-effect:{name}:{ordinal:02}',sequence=name,ordinal=ordinal,
                sourcePointerObject2=list_offset,descriptorObject2=offset,descriptorPhysical=at,width=width,height=height,
                anchor={'x':x,'y':y},start=start,endExclusive=pos,indicesSha256=H(bytes(pixels)),maskSha256=H(bytes(paint)),encodedSha256=H(gra[start:pos])))
            checks+=2*len(pixels)+9
    ordered=sorted(frames,key=lambda r:r['start']);previous=54328
    for f in ordered:assert f['start']==previous;previous=f['endExclusive']
    assert previous==63776
    return {'schema':'mkdos_p38_tomb_effect_original_reference_v1','exeSha256':EXE_SHA,'graSha256':GRA_SHA,'frames':frames,
            'streamStart':54328,'streamEndExclusive':63776,'encodedBytes':9448},checks
HERE=Path(__file__).resolve().parent
def expected(root):
    files,data,hashes,checks=runpy.run_path(str(HERE/'verify-mk2-p37-source-coverage-independent.py'))['expected'](root)
    ref,effect_checks=originals(root)
    data['TOMB.GRA'].extend({k:f[k] for k in ['assetId','start','endExclusive']} for f in ref['frames'])
    return files,data,hashes,checks+effect_checks,ref
def validate(report,files,data,hashes):
    assert report['schema']=='mkdos_p38_native_source_interval_coverage_v1'
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
    assert counts==288
    return counts
def verify_report(report,files,data,hashes):
    count=validate(report,files,data,hashes)
    assert report['tombEffectReconciliation']=={
        'status':'VERIFIED','existingEffectReferences':16,'newRepresentations':0,'priorOutsideScopeBytes':9448,
        'remainingOutsideScopeBytes':0,'sourceImageInterval':{'start':54328,'endExclusive':63776,'encodedBytes':9448},
        'sourceListObject2':[0x17814,0x177ec],'nativePaletteOrTimingClaimsAdded':False}
    return count
def verify_export(archive,reference):
    read_png=runpy.run_path(str(HERE/'verify-mk2-p22-cave-independent.py'))['read_png']
    checks=0
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
        assets=json.loads(z.read('manifest.json'))['selectionOrder']
        assert len(assets)==16 and len(z.namelist())==49
        pngs=[n for n in z.namelist() if n.startswith('assets/')]
        for i,(row,a) in enumerate(zip(reference['frames'],assets)):
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
            checks+=len(ix)*3+12
    return checks
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('root',type=Path);p.add_argument('--reference',type=Path);p.add_argument('--report',type=Path)
    p.add_argument('--coverage',type=Path);p.add_argument('--export',dest='archive',type=Path)
    a=p.parse_args();ref,checks=originals(a.root);refs=None;rejected=0;export_checks=0
    if a.reference:a.reference.write_text(json.dumps(ref,indent=2)+'\n',encoding='utf-8')
    if a.coverage:
        files,data,hashes,checks,ref=expected(a.root)
        coverage=json.loads(a.coverage.read_text(encoding='utf-8'));refs=verify_report(coverage,files,data,hashes)
        for label in ['false_total','invented_scene','wrong_extent','erased_effects','invented_interval','wrong_hash','invented_timing','new_artwork']:
            bad=copy.deepcopy(coverage);tomb=next(r for r in bad['resources'] if r['name']=='TOMB.GRA')
            if label=='false_total':tomb['coveredBytes']-=1
            elif label=='invented_scene':bad['sceneCompletenessClaimed']=True
            elif label=='wrong_extent':tomb['intervals'][0]['start']+=4
            elif label=='erased_effects':tomb['intervals']=[x for x in tomb['intervals'] if not x['assetId'].startswith('mk2-stage-effect:')]
            elif label=='invented_interval':tomb['intervals'].append({'assetId':'invented','start':0,'endExclusive':120})
            elif label=='wrong_hash':tomb['upstreamAuthenticatedSha256']='0'*64
            elif label=='invented_timing':bad['tombEffectReconciliation']['nativePaletteOrTimingClaimsAdded']=True
            else:bad['tombEffectReconciliation']['newRepresentations']=16
            try:verify_report(bad,files,data,hashes)
            except AssertionError:rejected+=1
            else:raise AssertionError(label+' accepted')
        verify_report(coverage,files,data,hashes)
    if a.archive:export_checks=verify_export(a.archive,ref)
    result={'status':'PASS','existingTombEffectFrames':16,'originalFileDecoderChecks':checks,'independentNativeReferences':refs,
        'falseReportsRejected':rejected,'cleanReportReverified':bool(a.coverage),'exportChecks':export_checks,
        'exportNativeIndicesMasksGeometryAndDiagnosticAlphaVerified':bool(a.archive),'exportRuntimeRgbClaimed':False,
        'sourceImageInterval':{'start':54328,'endExclusive':63776,'encodedBytes':9448}}
    if a.report:a.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()

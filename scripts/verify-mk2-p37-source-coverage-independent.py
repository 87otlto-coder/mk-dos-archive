#!/usr/bin/env python3
"""Independently rebuild P37 intervals from original-file Python decoders and native floor pointers."""
import argparse,copy,hashlib,json,runpy,struct
from pathlib import Path
HERE=Path(__file__).resolve().parent
FAMILIES=[('p22','cave'),('p23','armory'),('p24','battle'),('p25','arena'),('p27','tomb'),('p28','portal'),('p29','tower'),('p30','forest'),('p32','forest-tail'),('p33','pit'),('p34','armory-tail'),('p35','arena-tail')]
def expected(root):
    files={}
    for p in root.rglob('*'):
        if p.is_file():files.setdefault(p.name.lower(),[]).append(p)
    exe=files['mk2.exe'];assert len(exe)==1
    exe=exe[0].read_bytes()
    assert hashlib.sha256(exe).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
    data={};hashes={};source_checks=0
    for pass_,family in FAMILIES:
        ref,planes,checks=runpy.run_path(str(HERE/f'verify-mk2-{pass_}-{family}-independent.py'))['originals'](root)
        name=family.split('-')[0].upper()+'.GRA';data.setdefault(name,[]);hashes[name]=ref['graSha256'];source_checks+=checks
        for row in ref['images']:
            data[name].append({'assetId':f'mk2-{family}-source:{row["ordinal"]}:original-indices','start':row['start'],'endExclusive':row['endExclusive']})
        if pass_=='p33':
            data[name].extend({k:row[k] for k in ['assetId','start','endExclusive']} for row in ref['existingBridgeFrames'])
    pool=exe[0xa0ef1:0xa13a7].split(bytes([0]))
    for slot,rows in [(0,48),(1,40),(2,64),(3,32),(4,56),(6,40),(7,40)]:
        ref=struct.unpack_from('<I',exe,0xcfbac+slot*4)[0];name=pool[ref>>24].decode();start=ref&0xffffff
        gra=files[name.lower()];assert len(gra)==1;size=gra[0].stat().st_size
        assert size-start==896*rows
        data[name].append({'assetId':f'mk2-floor:{name[:-4].lower()}:indices','start':start,'endExclusive':size})
    return files,data,hashes,source_checks
def validate(report,files,data,hashes):
    assert report['schema']=='mkdos_p37_native_source_interval_coverage_v1'
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
    assert counts==272
    return counts
def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('root',type=Path);ap.add_argument('coverage',type=Path);ap.add_argument('--report',type=Path)
    a=ap.parse_args();report=json.loads(a.coverage.read_text(encoding='utf-8'));files,data,hashes,checks=expected(a.root)
    count=validate(report,files,data,hashes);rejected=0
    for label in ['false_total','invented_scene','wrong_extent','erased_gap','invented_interval','wrong_hash']:
        bad=copy.deepcopy(report);cave=next(r for r in bad['resources'] if r['name']=='CAVE.GRA')
        if label=='false_total':cave['coveredBytes']+=1
        elif label=='invented_scene':bad['sceneCompletenessClaimed']=True
        elif label=='wrong_extent':cave['intervals'][0]['start']-=4
        elif label=='erased_gap':cave['gaps']=[]
        elif label=='invented_interval':cave['intervals'].append({'assetId':'invented','start':0,'endExclusive':120})
        else:cave['upstreamAuthenticatedSha256']='0'*64
        try:validate(bad,files,data,hashes)
        except AssertionError:rejected+=1
        else:raise AssertionError(label+' was accepted')
    validate(report,files,data,hashes)
    result={'status':'PASS','resources':15,'independentNativeReferences':count,'originalFileDecoderChecks':checks,'falseReportsRejected':rejected,'cleanReportReverified':True,'byteSetOracle':True,'sceneCompletenessClaimed':False}
    if a.report:a.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()


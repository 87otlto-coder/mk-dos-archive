#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,struct,sys,zipfile
fixture=Path(sys.argv[1]); zip_path=Path(sys.argv[2]); o69_path=Path(sys.argv[3]); out=Path(sys.argv[4]); checks=[]
def ck(i,ok,d=''): checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def sha(b): return hashlib.sha256(b).hexdigest()
files={p.name.upper():p for p in fixture.iterdir() if p.is_file()};o69=json.loads(o69_path.read_text())
with zipfile.ZipFile(zip_path,'r') as z:
 names=z.namelist();ck('store_only',all(i.compress_type==zipfile.ZIP_STORED for i in z.infolist()),len(names));ck('entry_count',len(names)==7678,len(names));ck('no_duplicates',len(names)==len(set(names)),len(names)-len(set(names)))
 manifest=json.loads(z.read('manifests/indexed_graphics_assets.json')); package=json.loads(z.read('manifests/package_manifest.json')); embedded_o69=json.loads(z.read('reports/o69_broad_indexed_graphics_corpus_census.json')); readme=z.read('README.md').decode()
 ck('manifest_format',manifest['format']=='mk2_indexed_graphics_asset_manifest_v1',manifest['format']);ck('resource_count',len(manifest['resources'])==94,len(manifest['resources']));ck('stream_count',sum(len(r['streams']) for r in manifest['resources'])==3790,sum(len(r['streams']) for r in manifest['resources']));ck('package_contract',package['counts']=={'resources':94,'streams':3790,'rawGraEntries':94,'indicesEntries':3790,'maskEntries':3790,'metadataEntries':4,'totalEntries':7678},package['counts']);stable_o69=json.loads(json.dumps(o69)); stable_o69.pop('timestamp',None); stable_o69.pop('operationId',None); stable_o69.get('provenance',{}).pop('o67OperationId',None); stable_o69.get('provenance',{}).pop('o68OperationId',None); ck('o69_stable_exact',embedded_o69==stable_o69,'embedded stable report exact');ck('boundaries',manifest['semantics']['paletteOwnershipEstablished'] is False and manifest['semantics']['correctColorRgbaEstablished'] is False and package['boundaries']['partialOrAmbiguousResourcesIncluded'] is False,'palette/partial');ck('readme_boundaries','Palette ownership and correct-color RGBA are NOT established' in readme and 'unresolved post-LE overlay' in readme,'readme')
 def decode(data,off,w,h):
  pos=off;idx=bytearray(w*h);mask=bytearray(w*h);q=0
  for _ in range(h):
   x=0
   while x<w:
    if pos+4>len(data):raise ValueError('trunc')
    cmd=struct.unpack_from('<I',data,pos)[0]
    if cmd&1:n=cmd>>1;pos+=4;q+=n;x+=n
    elif cmd&2:
     n=cmd>>10;c=(cmd>>2)&255;pos+=4
     if n<1 or x+n>w:raise ValueError('rle')
     idx[q:q+n]=bytes([c])*n;mask[q:q+n]=b'\x01'*n;q+=n;x+=n
    else:
     n=cmd>>2;pos+=4
     if n<1 or n>64 or x+n>w or pos+n>len(data):raise ValueError('lit')
     idx[q:q+n]=data[pos:pos+n];mask[q:q+n]=b'\x01'*n;q+=n;pos+=(n+3)&~3;x+=n
    if n<1 or x>w:raise ValueError('count')
  if q!=w*h:raise ValueError('pixels')
  return bytes(idx),bytes(mask),pos-off
 expected={'manifests/indexed_graphics_assets.json','manifests/package_manifest.json','reports/o69_broad_indexed_graphics_corpus_census.json','README.md'};raw_ok=stream_ok=0;pixel_total=raw_total=0
 for r in manifest['resources']:
  raw=z.read(r['rawPath']);src=files[r['resourceName'].upper()].read_bytes();expected.add(r['rawPath']);ok=raw==src and len(raw)==r['byteLength'] and sha(raw)==r['sha256'];raw_ok+=ok;raw_total+=len(raw);ck('raw_'+r['resourceName'],ok,(len(raw),r['streamCount']))
  for s in r['streams']:
   expected.add(s['indicesPath']);expected.add(s['maskPath']);ib=z.read(s['indicesPath']);mb=z.read(s['maskPath']);di,dm,n=decode(src,s['graOffset'],s['width'],s['height']);ok=(ib==di and mb==dm and n==s['encodedByteLength'] and sha(ib)==s['indicesSha256'] and sha(mb)==s['maskSha256']);stream_ok+=ok;pixel_total+=len(ib)
 ck('all_raw',raw_ok==94,raw_ok);ck('all_streams',stream_ok==3790,stream_ok);ck('raw_bytes',raw_total==11385532,raw_total);ck('pixels',pixel_total==15953739,pixel_total);ck('exact_entry_set',set(names)==expected,(len(set(names)-expected),len(expected-set(names))))
failed=[c for c in checks if not c['passed']];res={'format':'mk2_o70_independent_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'packageSha256':sha(zip_path.read_bytes()),'checks':checks,'decision':{'all94RawGraByteExact':raw_ok==94,'all3790PayloadPairsIndependentlyReconstructed':stream_ok==3790,'paletteBoundaryPreserved':True,'verdict':'MK2_O70_INDEXED_GRAPHICS_PACKAGE_INDEPENDENT_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}};out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed','packageSha256']},indent=2));sys.exit(1 if failed else 0)

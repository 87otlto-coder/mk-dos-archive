#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,struct,collections,sys
root=Path(sys.argv[1]); report_path=Path(sys.argv[2]); out=Path(sys.argv[3]); report=json.loads(report_path.read_text())
files={p.name.upper():p for p in root.iterdir() if p.is_file()}; exe=files['MK2.EXE'].read_bytes(); checks=[]
def ck(i,ok,detail): checks.append({'id':i,'passed':bool(ok),'detail':str(detail)})
def sha(b): return hashlib.sha256(b).hexdigest()
ck('exe_sha',sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',sha(exe));ck('report_verdict',report['decision']['verdict']=='MK2_BROAD_INDEXED_GRA_CORPUS_CENSUS_ESTABLISHED',report['decision']['verdict'])
# independent LE tail / overlay boundary
le=0x28f0c; u32=lambda o:struct.unpack_from('<I',exe,o)[0]; tail=u32(le+0x80)+112*4096+u32(le+0x2c); ck('overlay_boundary',tail==0xabd79 and len(exe)==0xd23cd,(hex(tail),hex(len(exe))))
# independent filename pool
start=exe.find(b'PLAYSTA.GRA\0'); names=[];p=start
while True:
 z=exe.index(0,p);n=exe[p:z].decode('ascii');names.append(n);p=z+1
 if n=='RM.DRV':break
pooled=[n for n in names if n.endswith('.GRA')];ck('pool',start==0xa0ef1 and len(names)==129 and len(pooled)==123,(hex(start),len(names),len(pooled)))

def decode(data,off,w,h):
 pos=off; used=set();opaque=transparent=literal=rle=skip=0
 for _ in range(h):
  x=0
  while x<w:
   if pos+4>len(data):raise ValueError
   cmd=struct.unpack_from('<I',data,pos)[0]
   if cmd&1:
    n=cmd>>1;pos+=4;transparent+=n;skip+=1
   elif cmd&2:
    n=cmd>>10;c=(cmd>>2)&255;pos+=4;opaque+=n;rle+=1;used.add(c)
   else:
    n=cmd>>2;pos+=4
    if n<1 or n>64 or pos+n>len(data):raise ValueError
    used.update(data[pos:pos+n]);pos+=(n+3)&~3;opaque+=n;literal+=1
   if n<1 or x+n>w:raise ValueError
   x+=n
 return {'len':pos-off,'used':used,'opaque':opaque,'transparent':transparent,'literal':literal,'rle':rle,'skip':skip,'pixels':w*h}
cache={};by=collections.defaultdict(list)
for pp in range((tail+3)&~3,len(exe)-11,4):
 w,h,x,y=struct.unpack_from('<HHhh',exe,pp);ref=struct.unpack_from('<I',exe,pp+8)[0];rid=ref>>24;off=ref&0xffffff
 if rid>=len(names) or not(1<=w<=640 and 1<=h<=480 and -1000<=x<=1000 and -1000<=y<=1000):continue
 name=names[rid];key=name.upper()
 if not key.endswith('.GRA') or key not in files:continue
 data=cache.setdefault(name,files[key].read_bytes())
 if off>=len(data):continue
 try:d=decode(data,off,w,h)
 except Exception:continue
 by[name].append({'p':pp,'rid':rid,'off':off,'w':w,'h':h,'x':x,'y':y,**d})
qualified=[];partial=[];global_indices=set();agg=collections.Counter()
for rid,name in enumerate(names):
 arr=by.get(name)
 if not arr:continue
 groups=collections.defaultdict(list)
 for c in arr:groups[c['off']].append(c)
 reps=[];amb=0
 for off,g in groups.items():
  if len({(c['w'],c['h'],c['len']) for c in g})!=1:amb+=1
  reps.append(sorted(g,key=lambda c:c['p'])[0])
 reps.sort(key=lambda c:(c['off'],c['p']));data=cache[name]; mismatches=0
 if reps[0]['off']!=0:mismatches+=1
 for i,c in enumerate(reps):
  if c['off']+c['len'] != (reps[i+1]['off'] if i+1<len(reps) else len(data)):mismatches+=1
 full=amb==0 and mismatches==0; row={'rid':rid,'name':name,'records':len(arr),'streams':len(reps),'size':len(data),'amb':amb,'mismatch':mismatches,'reps':reps}
 (qualified if full else partial).append(row)
 if full:
  agg['records']+=len(arr);agg['streams']+=len(reps);agg['encoded']+=len(data)
  for c in reps:
   agg['pixels']+=c['pixels'];agg['opaque']+=c['opaque'];agg['transparent']+=c['transparent'];agg['literal']+=c['literal'];agg['rle']+=c['rle'];agg['skip']+=c['skip'];global_indices|=c['used']
ck('candidate_totals',len(by)==109 and sum(len(v) for v in by.values())==4225,(len(by),sum(len(v) for v in by.values())))
ck('classification',len(qualified)==94 and len(partial)==15,(len(qualified),len(partial)))
ck('qualified_aggregates',(agg['records'],agg['streams'],agg['encoded'])==(3790,3790,11385532),(agg['records'],agg['streams'],agg['encoded']))
ck('pixel_aggregates',(agg['pixels'],agg['opaque'],agg['transparent'])==(15953739,6437823,9515916),(agg['pixels'],agg['opaque'],agg['transparent']))
ck('command_aggregates',(agg['literal'],agg['rle'],agg['skip'])==(506161,120349,656897),(agg['literal'],agg['rle'],agg['skip']))
ck('index_union',global_indices==set(range(1,176)),(min(global_indices),max(global_indices),len(global_indices)))
list_text='\n'.join(f"{r['rid']}:{r['name']}:{r['records']}:{r['streams']}:{r['size']}" for r in qualified).encode();list_sha=sha(list_text);ck('qualified_list_sha',list_sha=='9aa22c45ee43598ddb9c030c7d1c6e8bcb40b7b8f237ded2c5749f4f4cb4353c',list_sha)
# compare every resource summary and first/last stream metadata to report, keeping audit compact
qr={r['resourceName']:r for r in report['qualifiedResources']};pr={r['resourceName']:r for r in report['partialOrAmbiguousResources']}
for r in qualified:
 rr=qr.get(r['name']);ok=rr is not None and rr['resourceId']==r['rid'] and rr['candidateDescriptorCount']==r['records'] and rr['uniqueOffsetCount']==r['streams'] and rr['fileSize']==r['size'] and rr['qualification']=='EXACT_FULL_RESOURCE_TILING' and rr['boundaryMismatchCount']==0 and rr['ambiguousOffsetCount']==0 and len(rr['streams'])==r['streams'];ck('qualified_'+r['name'],ok,(r['records'],r['streams'],r['size']))
 if rr and rr['streams']:
  a=r['reps'][0];b=r['reps'][-1];ra=rr['streams'][0];rb=rr['streams'][-1];ck('stream_bounds_'+r['name'],ra['descriptorPhysical']==a['p'] and ra['graOffset']==a['off'] and ra['encodedByteLength']==a['len'] and rb['descriptorPhysical']==b['p'] and rb['graOffset']==b['off'] and rb['encodedByteLength']==b['len'],(ra['graOffset'],rb['graOffset']))
for r in partial:
 rr=pr.get(r['name']);ck('partial_'+r['name'],rr is not None and rr['resourceId']==r['rid'] and rr['candidateDescriptorCount']==r['records'] and rr['uniqueOffsetCount']==r['streams'] and rr['fileSize']==r['size'] and rr['qualification']=='PARTIAL_OR_AMBIGUOUS',(r['records'],r['streams'],r['size']))
zero=[n for n in pooled if n not in by];out_pool=sorted(p.name.upper() for p in root.glob('*.gra') if p.name.upper() not in {x.upper() for x in pooled});ck('zero_candidates',zero==report['zeroCandidatePooledResources'],zero);ck('out_of_pool',out_pool==['MONKS.GRA'] and out_pool==report['outOfPoolInstalledResources'],out_pool)
# report aggregate reconciliation
c=report['coverage'];expected={'installedRootGraCount':124,'pooledGraCount':123,'candidateResourceCount':109,'exactFullResourceCount':94,'partialOrAmbiguousResourceCount':15,'zeroCandidatePooledResourceCount':14,'outOfPoolInstalledResourceCount':1,'candidateDescriptorCount':4225,'qualifiedDescriptorCount':3790,'qualifiedUniqueStreamCount':3790,'qualifiedEncodedBytes':11385532,'decodedPixelCount':15953739,'opaquePixelCount':6437823,'transparentPixelCount':9515916,'literalCommandCount':506161,'rleCommandCount':120349,'skipCommandCount':656897,'opaqueIndexMin':1,'opaqueIndexMax':175,'opaqueIndexCount':175,'qualifiedResourceListSha256':'9aa22c45ee43598ddb9c030c7d1c6e8bcb40b7b8f237ded2c5749f4f4cb4353c'}
ck('report_coverage',all(c.get(k)==v for k,v in expected.items()),{k:c.get(k) for k in expected})
failed=[c for c in checks if not c['passed']];res={'format':'mk2_o69_independent_audit_v1','reportSha256':sha(report_path.read_bytes()),'checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'broadCensusIndependentlyReconstructed':not failed,'paletteOwnershipEstablished':False,'runtimeConsumerForOverlayDescriptorCorpusEstablished':False,'sharedMkDosAbstractionPromoted':False,'verdict':'MK2_O69_BROAD_INDEXED_GRA_CORPUS_INDEPENDENT_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}};out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['reportSha256','checkCount','passedCount','failedCount','allChecksPassed']},indent=2));
if failed:print(json.dumps(failed[:20],indent=2));sys.exit(1)

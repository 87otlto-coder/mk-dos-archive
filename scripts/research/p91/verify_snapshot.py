"""P91 private packet readback. PASS concerns captured packet consistency,
not proof that an unverified backend actually observed the original game.
"""
import argparse,hashlib,json
from pathlib import Path
from snapshot import Collector,need,sha,decode_state

def verify_folder(plan,folder):
    root=Path(folder).resolve();manifest=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
    need(manifest['schema']=='mk2_p91_native_snapshot_v1','snapshot schema')
    need(manifest['planSha256']==sha(json.dumps(plan,sort_keys=True,separators=(',',':')).encode()),'capture plan identity')
    need(manifest['sourceExeSha256']==plan['sourceExeSha256'],'source executable identity')
    need(manifest['originalInputFingerprints']==plan['requiredOriginalFingerprints'],'original input fingerprint set')
    need(set(manifest['adapterIdentity'])>={'upstreamCommit','patchSha256','executableSha256','core','pagingEnabled'},'adapter provenance missing')
    need(manifest['adapterIdentity']['upstreamCommit']=='029bd65c5dcc7cdc7f2e14e35278620d9707d969','wrong DOSBox source revision')
    payload={}
    for row in manifest['files']:
      name=row['path'];need(name not in payload and Path(name).name==name and name.endswith('.bin'),'unsafe/duplicate capture member')
      path=root/name;need(path.resolve().parent==root and path.is_file(),'capture member path')
      data=path.read_bytes();need(len(data)==row['bytes'] and sha(data)==row['sha256'],'capture member digest/size')
      payload[name]=data
    phases={}
    referenced=[]
    for name,meta in manifest['phases'].items():
      phase={}
      for key,value in meta.items():
        if key.endswith('File'):
          need(value in payload,'missing phase member');phase[key[:-4]]=payload[value];referenced.append(value)
        else:phase[key]=value
      phases[name]=phase
      need(meta['decodedState']==decode_state(plan,phase['mapping'],phase['object2']),'decoded manifest fields differ from bytes')
    need(set(referenced)==set(payload) and len(referenced)==len(payload),'unreferenced/reused phase member')
    need(set(p.name for p in root.iterdir())=={'manifest.json',*payload},'unmanifested capture contents')
    need(set(phases)=={'drawEntry','drawComplete','presentEntry','postPresent'},'phase set')
    c=Collector(plan);c.draw_entry(phases['drawEntry']);c.draw_ret(phases['drawComplete']);c.present_entry(phases['presentEntry']);c.scheduler_entry(phases['postPresent'])
    return {'status':'PASS_P91_PACKET_CONSISTENCY','indexedFramebufferBytesCompared':64000,'dacBytesCompared':768,
      'mappingCodeWindowsPerPhase':len(plan['windows']),'capturedPhases':4,
      'nativeRuntimeProvenance':'VALIDATION PENDING','scanoutVerified':False,
      'note':'No original runtime adapter has yet been accepted; packet parity alone is not native execution proof.'}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--plan',type=Path,required=True);p.add_argument('--snapshot',type=Path,required=True)
    p.add_argument('--original-mk2',type=Path,required=True);a=p.parse_args();plan=json.loads(a.plan.read_text(encoding='utf-8'))
    for name,expected in plan['requiredOriginalFingerprints'].items():
      matches=[f for f in a.original_mk2.iterdir() if f.name.upper()==name and f.is_file()]
      need(len(matches)==1 and sha(matches[0].read_bytes())==expected,'canonical original input '+name)
    print(json.dumps(verify_folder(plan,a.snapshot),indent=2))

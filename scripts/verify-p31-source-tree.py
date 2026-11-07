#!/usr/bin/env python3
"""Audit a connector-retrieved recursive Git tree against materialized local files.
Reads local files and writes the requested audit report, with no network access.
The caller must independently verify the
commit/tree association using GitHub; a supplied JSON is not authentication.
"""
import argparse,hashlib,json,re
from pathlib import Path
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def audit(root,tree,commit):
    assert tree.get('truncated') is False,'Require complete recursive Git tree'
    assert re.fullmatch(r'[0-9a-f]{40}',tree['sha']),'Invalid tree SHA'
    assert re.fullmatch(r'[0-9a-f]{40}',commit),'Invalid commit SHA'
    root=root.resolve();entries=[e for e in tree['tree'] if e['type']=='blob']
    assert len({e['path'] for e in entries})==len(entries),'Duplicate blob paths'
    missing=[];mismatch=[];unsafe=[];raw=normalized=0
    inventory=hashlib.sha256()
    for e in sorted(entries,key=lambda e:e['path']):
        name=e['path'];p=(root/name).resolve()
        if not p.is_relative_to(root) or e.get('mode') not in ['100644','100755']:
            unsafe.append(name);continue
        if re.search(r'\.(exe|gra|ftr|u8|mid|wav|ogg|mp3|flac|png|gif|bmp|jpg|jpeg|webp|zip|bin|7z|rar)$',name,re.I) or any(x in name.split('/') for x in ['node_modules','dist','__pycache__']):
            unsafe.append(name)
        inventory.update((name+'\0'+e['sha']+'\n').encode())
        if not p.is_file():missing.append(name);continue
        b=p.read_bytes()
        if blob(b)==e['sha']:raw+=1
        elif blob(b.replace(b'\r\n',b'\n'))==e['sha']:normalized+=1
        else:mismatch.append(name)
    return {'status':'PASS' if not(missing or mismatch or unsafe) else 'FAIL','commit':commit,'treeSha':tree['sha'],
        'fileBlobs':len(entries),'sourceFiles':sum(e['path'].startswith('src/') for e in entries),
        'rawByteMatches':raw,'checkoutNormalizedMatches':normalized,'missing':missing,'mismatches':mismatch,
        'unsafePaths':unsafe,'inventorySha256':inventory.hexdigest(),'remoteAssociationVerifiedByThisScript':False}
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--root',type=Path,required=True)
    p.add_argument('--tree',type=Path,required=True);p.add_argument('--commit',required=True);p.add_argument('--report',type=Path,required=True)
    a=p.parse_args();result=audit(a.root,json.loads(a.tree.read_text(encoding='utf-8')),a.commit)
    a.report.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
    raise SystemExit(0 if result['status']=='PASS' else 1)
if __name__=='__main__':main()


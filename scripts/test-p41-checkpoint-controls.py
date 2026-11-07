#!/usr/bin/env python3
"""Preflight/refusal controls for the P41 runner and local Git-tree audit.
Uses disposable text fixtures, never commercial game files.
"""
import hashlib,json,runpy,subprocess,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
audit=runpy.run_path(str(ROOT/'scripts/verify-p31-source-tree.py'))['audit']
def sha(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def main():
    runner=ROOT/'scripts/verify-p41-checkpoint.cjs';refusals=0
    with tempfile.TemporaryDirectory(prefix='mkdos-p41-controls-',dir=ROOT.parent) as tmp:
        base=Path(tmp).resolve();assert base.is_relative_to(ROOT.parent.resolve())
        dirs={g:base/g for g in ['mk1','mk2','mk3']}
        for p in dirs.values():p.mkdir()
        common=[v for g,p in dirs.items() for v in ['--'+g,str(p)]]
        report=base/'report.json';work=base/'private'
        cases=[]
        for game in dirs:
            args=[v for g,p in dirs.items() if g!=game for v in ['--'+g,str(p)]]
            cases.append((args+['--report',str(report)],'Required option --'+game))
        cases.extend([
            (common+['--mk1',str(dirs['mk1']),'--report',str(report)],'Invalid or duplicate option'),
            (common+['--report',str(dirs['mk1']/'report.json')],'Report must be outside repository'),
            (common+['--report',str(ROOT/'p41-must-not-create.json')],'Report must be outside repository'),
            (common+['--report',str(report),'--work',str(dirs['mk2']/'private')],'Private exports must be outside'),
            (common+['--report',str(report),'--work',str(ROOT/'p41-must-not-create')],'Private exports must be outside')
        ])
        for args,expected in cases:
            r=subprocess.run(['node',str(runner),*args],cwd=ROOT,capture_output=True,text=True)
            assert r.returncode!=0 and expected in r.stderr,(args,r.stderr)
            assert not report.exists(),'Preflight failure wrote a result report'
            refusals+=1
        assert not (ROOT/'p41-must-not-create').exists()
        assert not (ROOT/'p41-must-not-create.json').exists()
        local=base/'source';local.mkdir();(local/'a.ts').write_bytes(b'one\r\ntwo\r\n');(local/'b.md').write_bytes(b'base\n')
        entries=[{'path':'a.ts','type':'blob','mode':'100644','sha':sha(b'one\ntwo\n')},
                 {'path':'b.md','type':'blob','mode':'100644','sha':sha(b'base\n')}]
        tree={'sha':'1'*40,'truncated':False,'tree':entries}
        clean=audit(local,tree,'2'*40);assert clean['status']=='PASS' and clean['rawByteMatches']==1 and clean['checkoutNormalizedMatches']==1
        rejects=0
        (local/'b.md').write_bytes(b'changed\n');assert audit(local,tree,'2'*40)['status']=='FAIL';rejects+=1
        (local/'b.md').unlink();assert audit(local,tree,'2'*40)['missing']==['b.md'];rejects+=1
        (local/'b.md').write_bytes(b'base\n')
        for name,mode in [('dummy.exe','100644'),('../escape.md','100644'),('a.ts','120000')]:
            e={'path':name,'type':'blob','mode':mode,'sha':sha(b'')}
            assert audit(local,{**tree,'tree':[e]},'2'*40)['status']=='FAIL';rejects+=1
        for bad in [{**tree,'truncated':True},{**tree,'tree':entries+entries}]:
            try:audit(local,bad,'2'*40)
            except AssertionError:rejects+=1
            else:raise AssertionError('Malformed tree accepted')
        assert audit(local,tree,'2'*40)['status']=='PASS','Clean audit after all controls'
    print(json.dumps({'status':'PASS','runnerPreflightRefusals':refusals,'sourceAuditNegativeControls':rejects,
        'cleanSourceAuditReverified':True,'dummyTextFixturesOnly':True},indent=2))
if __name__=='__main__':main()


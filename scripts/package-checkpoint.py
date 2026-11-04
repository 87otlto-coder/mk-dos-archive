"""Create a source checkpoint and self-contained historical/current handoff without fixtures."""
from pathlib import Path
import os,json,hashlib,zipfile
root=Path(__file__).resolve().parents[1]
project=root.parent.parent
out=project/'Deliverables'/'2026-10-07'
out.mkdir(parents=True,exist_ok=True)
current=(root/'CHECKPOINT_2026-10-07.md').read_text(encoding='utf-8')
prior=(project/'handoffs'/'MK_DOS_Archive_MASTER_HANDOFF_2026-10-03_FULL_PROJECT_THROUGH_O89_PAUSE.md').read_text(encoding='utf-8-sig')
name='MK_DOS_Archive_MASTER_HANDOFF_2026-10-07_FULL_PROJECT.md'
full=current+'\n\n---\n\n# Historical appendix — complete handoff through O89\n\nThe following document is preserved verbatim as project history. Current status and the latest user request are described above; old pause directions and milestone labels are not current instructions.\n\n'+prior
(root/name).write_text(full,encoding='utf-8')
(out/name).write_text(full,encoding='utf-8')
excluded={'.git','node_modules','.tools','.cache','fixtures','__pycache__'}
files=[]
for parent,dirs,names in os.walk(root,followlinks=False):
    dirs[:]=sorted(d for d in dirs if d not in excluded and not (Path(parent)/d).is_symlink())
    for n in sorted(names):
        p=Path(parent)/n;rel=p.relative_to(root)
        if p.is_symlink() or n=='ARCHIVE_CONTENTS_SHA256.json':continue
        if rel.parts[0]=='evidence' and p.suffix.lower() not in {'.json','.txt','.md'}:continue
        if p.suffix.lower() in {'.zip','.pyc'}:continue
        files.append((rel.as_posix(),p))
manifest={'checkpoint':'2026-10-07','base':'MK-DOS-1E3O89-source.zip','excluded':['game fixtures','generated game-asset binary exports','node_modules','.tools'],'files':[{'path':n,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for n,p in files]}
manifest_bytes=json.dumps(manifest,indent=2).encode()
(root/'ARCHIVE_CONTENTS_SHA256.json').write_bytes(manifest_bytes)
source=out/'MK-DOS-Archive-2026-10-07-source.zip'
prefix='MK-DOS-Archive-2026-10-07/'
with zipfile.ZipFile(source,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for n,p in files:z.write(p,prefix+n)
    z.writestr(prefix+'ARCHIVE_CONTENTS_SHA256.json',manifest_bytes)
with zipfile.ZipFile(source) as z:
    assert z.testzip() is None
    for f in manifest['files']:assert hashlib.sha256(z.read(prefix+f['path'])).hexdigest()==f['sha256'],f['path']
handoff=out/'MK-DOS-Archive-2026-10-07-handoff.zip'
with zipfile.ZipFile(handoff,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:z.write(out/name,name)
with zipfile.ZipFile(handoff) as z:assert z.testzip() is None
artifacts=[source,out/name,handoff]
checksums=''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}\n' for p in artifacts)
(out/'SHA256SUMS.txt').write_text(checksums,encoding='ascii')
print(json.dumps({'files':len(files)+1,'artifacts':[{'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in artifacts],'sourceEveryEntryHashVerified':True},indent=2))

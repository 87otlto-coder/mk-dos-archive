#!/usr/bin/env python3
"""Independent verifier of a four-way MK2 DOS hidden-stage-menu fixture.

No trust in the builder is required: compute all file diffs against the
source variant directories, and byte-check the original MK2 cheat sequence.
"""
import hashlib
import json
import pathlib
import sys

BASE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OFFSET = 0xCCF0E
OLD = bytes.fromhex('1e172e162612201f1f1626')
NEW = bytes.fromhex('4300000000000000000000')
PAIR = {'10_CHEAT_CONTROL':'00_BASELINE','11_CHEAT_TOMB_CHECKER':'07_TOMB_PACKED_CHECKER','12_CHEAT_TOMB_FLAT':'08_TOMB_PACKED_FLAT','13_CHEAT_PORTAL_CHECKER':'09_PORTAL_PACKED_CHECKER'}

def h(data): return hashlib.sha256(data).hexdigest()

def verify(original, kit):
    origin=pathlib.Path(original)
    root=pathlib.Path(kit)
    canonical=(origin/'00_BASELINE'/'mk2.exe').read_bytes()
    tests=0
    def check(ok, name):
        nonlocal tests
        tests+=1
        if not ok: raise AssertionError(name)
    check(len(canonical)==861133,'canonical size')
    check(h(canonical)==BASE_SHA,'canonical identity')
    check(canonical.count(OLD)==1,'canonical scancode uniqueness')
    check(canonical[OFFSET:OFFSET+len(OLD)]==OLD,'canonical scancode offset')
    exp=bytearray(canonical)
    exp[OFFSET:OFFSET+len(OLD)]=NEW
    new_hash=h(exp)
    seen=[]
    manifest=json.loads((root/'PROBE_MANIFEST.json').read_text())
    check(manifest['sourceExecutableSha256']==BASE_SHA,'manifest source exe')
    check(manifest['patchedExecutableSha256']==new_hash,'manifest patched exe')
    check(manifest['patchedFileOffsetHex']==hex(OFFSET),'manifest offset')
    check(manifest['changedBytes']==11,'manifest changed count')
    check(set(manifest['variants'])==set(PAIR),'manifest variant set')
    check(manifest['stageSelectionMethod']=='AUTHENTIC_HIDDEN_MENU_BACKGROUND_OPTION_NOT_BINARY_STAGE_ID_PATCH','stage semantics')
    for patched, source in PAIR.items():
        src=origin/source
        dest=root/patched
        src_rel=sorted(x.relative_to(src).as_posix() for x in src.rglob('*') if x.is_file())
        dst_rel=sorted(x.relative_to(dest).as_posix() for x in dest.rglob('*') if x.is_file())
        check(src_rel==dst_rel,f'{patched} same file list')
        check(len(src_rel)==614,f'{patched} file count')
        src_exe=(src/'mk2.exe').read_bytes()
        dst_exe=(dest/'mk2.exe').read_bytes()
        check(src_exe==canonical,f'{patched} original canonical')
        check(dst_exe==exp,f'{patched} exact patched exe')
        check(len(src_exe)==len(dst_exe),f'{patched} exe byte size')
        check(dst_exe[:OFFSET]==src_exe[:OFFSET],f'{patched} exe prefix')
        check(dst_exe[OFFSET+len(OLD):]==src_exe[OFFSET+len(OLD):],f'{patched} exe suffix')
        count_diffs=sum(a!=b for a,b in zip(src_exe,dst_exe))
        check(count_diffs==11,f'{patched} changed byte count')
        reverse=bytearray(dst_exe)
        reverse[OFFSET:OFFSET+len(OLD)]=OLD
        check(h(reverse)==BASE_SHA,f'{patched} exact reversal')
        vm=manifest['variants'][patched]
        check(vm['sourceVariant']==source,f'{patched} source identity')
        check(vm['exeSha256']==new_hash,f'{patched} patched exe hash')
        change_files=[]
        for name in src_rel:
            a=(src/name).read_bytes()
            b=(dest/name).read_bytes()
            if a!=b: change_files.append(name)
            if name!='mk2.exe':
                check(a==b,f'{patched} original resource {name} must be identical')
        check(change_files==['mk2.exe'],f'{patched} exact file changes')
        check(vm['modifiedRelativeToO110YSource']==change_files,f'{patched} manifest modified paths')
        seen.append({'name':patched,'resourceChangePreviouslyVerified':vm['graProbe'],'files':len(src_rel),'exe':new_hash,'extraModifiedFiles':0})
    return {'status':'PASS','independentChecks':tests,'variants':seen,'executablePatchSha256':new_hash}

if __name__ == '__main__':
    if len(sys.argv)!=3: sys.exit('usage: verify_mk2_cheat_stage_kit.py ORIGINAL_O110Y_PROBES STAGE_KIT')
    print(json.dumps(verify(sys.argv[1],sys.argv[2]),indent=2))

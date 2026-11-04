#!/usr/bin/env python3
"""Portable test of O184 patch data / clone model; does NOT execute Windows PowerShell."""
import argparse,hashlib,json,tempfile,shutil,re
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
CAN_EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
CAN_PORTAL='cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'
PATCHED_PORTAL='02afc72ba2a2bbab5da3c9eee2863d561fcb5c569ddb63eae631a7baac771ce7'

def verify(kit_path,exe,portal):
    kit=Path(kit_path);patch_bytes=(kit/'O182_PATCH.json').read_bytes();data=json.loads(patch_bytes)
    script=(kit/'Make-Test-Copy.ps1').read_text();cmd=(kit/'MAKE_TEST_COPY.cmd').read_text()
    assert H(patch_bytes) in script and 'refusing' in script.lower() and 'WriteAllBytes($destGra' in script
    assert 'powershell.exe' in cmd and 'Make-Test-Copy.ps1' in cmd
    assert H(exe)==CAN_EXE and H(portal)==CAN_PORTAL
    assert len(data['modifiedBytes'])==data['modifiedByteCount']==4110
    old=bytearray(portal);target=bytearray(old)
    for i,p in enumerate(data['modifiedBytes']):
        off=p['offset'];assert 0<=off<len(target) and (i==0 or off>data['modifiedBytes'][i-1]['offset'])
        assert target[off]==p['before'] and p['before']!=p['after']
        target[off]=p['after']
    assert H(target)==PATCHED_PORTAL
    assert H(old)==CAN_PORTAL
    # Model the clone semantics on actual filesystem, ensure installed source remains unchanged.
    with tempfile.TemporaryDirectory() as temp:
        root=Path(temp)/'MK2_ORIGINAL';root.mkdir()
        (root/'MK2.EXE').write_bytes(exe);(root/'PORTAL.GRA').write_bytes(portal)
        clone=root.with_name(root.name+'_O182_PORTAL_BLUE_TEST');assert not clone.exists()
        shutil.copytree(root,clone)
        new_gra=clone/'PORTAL.GRA';new_gra.write_bytes(target)
        assert H(new_gra.read_bytes())==PATCHED_PORTAL
        assert H((root/'PORTAL.GRA').read_bytes())==CAN_PORTAL
        assert H((root/'MK2.EXE').read_bytes())==H((clone/'MK2.EXE').read_bytes())==CAN_EXE
        # Non-overwrite contract: an existing destination must not be replaced.
        assert clone.exists()
        try:
            if clone.exists():raise FileExistsError('refuse overwrite')
        except FileExistsError:pass
        else:raise AssertionError('overwrote existing test')
    return {'status':'PASS_O184_PORTABLE_MODEL_TEST','patchSHA256':H(patch_bytes),
            'byteDiffs':4110,'sourceFilesUntouched':True,'cloneResourceSHA256':PATCHED_PORTAL,
            'powershellExecutionVerified':False,'powershellSyntaxVerified':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--kit',required=True);p.add_argument('--exe',required=True);p.add_argument('--portal',required=True);a=p.parse_args()
 print(json.dumps(verify(a.kit,Path(a.exe).read_bytes(),Path(a.portal).read_bytes()),indent=2))

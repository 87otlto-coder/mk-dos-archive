#!/usr/bin/env python3
"""Separate re-derivation of O113 test-kit source edits; no producer import."""
from __future__ import annotations
import argparse,hashlib,json,zipfile
from pathlib import Path
VARIANTS={'20_CHEAT_CONTROL':None,
 '21_TOMB_X_RULER':('tomb.gra','x-ruler'),
 '22_TOMB_Y_RULER':('tomb.gra','y-ruler'),
 '23_TOMB_INDEX_RAMP':('tomb.gra','ramp'),
 '24_PORTAL_X_RULER':('portal.gra','x-ruler'),
 '25_PORTAL_Y_RULER':('portal.gra','y-ruler'),
 '26_PORTAL_INDEX_RAMP':('portal.gra','ramp')}

RANGES={'tomb.gra':(63776,48,'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'),
        'portal.gra':(56916,40,'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82')}
EXE_ORIG='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXE_EDIT='95f925bcf343701cd92d2fc631df4df6c8c98d51b1553c62ae4918349b074928'
XB='00000100011001010011101011011111'
YB='0000001000011000101000111001001011001101001111010101110110111111'

def digest(data):return hashlib.sha256(data).hexdigest()

def independent_expected(orig,kind,resource):
    offset,rows,want_sha=RANGES[resource]
    assert digest(orig)==want_sha
    tail=orig[offset:];lo=min(tail);hi=max(tail);step=hi-lo+1
    if kind=='x-ruler':
        one=bytes(hi if XB[x//28]=='1' else lo for x in range(896))
        payload=one*rows
    elif kind=='y-ruler':
        payload=b''.join(bytes([hi if YB[y]=='1' else lo])*896 for y in range(rows))
    elif kind=='ramp':
        one=bytes(lo+(x//4)%step for x in range(896))
        payload=one*rows
    else:raise AssertionError(kind)
    return orig[:offset]+payload

def verify(game_zip,kit_zip):
    n=0
    with zipfile.ZipFile(game_zip) as gz,zipfile.ZipFile(kit_zip) as kz:
        assert gz.testzip() is None and kz.testzip() is None
        originals={v.filename[4:].lower():gz.read(v) for v in gz.infolist() if v.filename.startswith('mk2/') and not v.is_dir()}
        assert len(originals)==614 and digest(originals['mk2.exe'])==EXE_ORIG
        names=kz.namelist();root='MK2_O113_Calibration/'
        assert len(names)==7*614+3,(len(names))
        doc=json.loads(kz.read(root+'PROBE_MANIFEST.json'))
        assert sorted(doc['variants'])==sorted(VARIANTS)
        assert doc['filesPerVariant']==614
        edited_exe=bytearray(originals['mk2.exe'])
        assert edited_exe[0xCCF0E:0xCCF0E+11].hex()=='1e172e162612201f1f1626'
        edited_exe[0xCCF0E:0xCCF0E+11]=bytes.fromhex('4300000000000000000000')
        assert digest(bytes(edited_exe))==EXE_EDIT
        assert doc['patchedCheatExeSha256']==EXE_EDIT
        for variant,spec in VARIANTS.items():
            pref=root+variant+'/'
            entries={v[len(pref):] for v in names if v.startswith(pref)}
            assert entries==originals.keys(),(variant,len(entries))
            changed=[]
            for fname,old in originals.items():
                actual=kz.read(pref+fname)
                if fname=='mk2.exe':
                    assert actual==bytes(edited_exe)
                elif spec and fname==spec[0]:
                    expected=independent_expected(old,spec[1],fname)
                    assert actual==expected
                    info=doc['variants'][variant]['resourcePatch']
                    assert info['patchedSha256']==digest(actual)
                    assert info['changedBytes']==sum(a!=b for a,b in zip(old,actual))
                else:assert actual==old,(variant,fname)
                if old!=actual:changed.append(fname)
                n+=1
            want_changed={'mk2.exe'}|({spec[0]} if spec else set())
            assert set(changed)==want_changed
        # Intentionally verify complete SHA map, not merely selected files.
        assert doc['sourceCanonFileDigests']=={name:digest(blob) for name,blob in sorted(originals.items())}
    return {'result':'PASS','entriesVerified':n,'gameFolders':len(VARIANTS),'perFolder':614,'kitSha256':digest(Path(kit_zip).read_bytes())}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('canonical_game_zip');p.add_argument('kit_zip');a=p.parse_args()
 print(json.dumps(verify(Path(a.canonical_game_zip),Path(a.kit_zip)),indent=2))

#!/usr/bin/env python3
"""Mutation tests: the independent stage kit verifier must reject altered evidence."""
import json
import pathlib
import subprocess
import sys

original=pathlib.Path(sys.argv[1]); kit=pathlib.Path(sys.argv[2]); checker=pathlib.Path(__file__).with_name('verify_mk2_cheat_stage_kit.py')

def check_pass():
    r=subprocess.run([sys.executable,str(checker),str(original),str(kit)],text=True,capture_output=True)
    assert r.returncode==0, r.stderr

def mutate(path, fn):
    data=path.read_bytes()
    try:
        path.write_bytes(fn(data))
        r=subprocess.run([sys.executable,str(checker),str(original),str(kit)],text=True,capture_output=True)
        assert r.returncode!=0, 'verifier accepted fake report / corrupted fixture: '+str(path)
    finally:
        path.write_bytes(data)
    check_pass()

check_pass()
e=kit/'10_CHEAT_CONTROL'/'mk2.exe'
mutate(e, lambda b: b[:0xccf0e]+bytes([b[0xccf0e]^1])+b[0xccf0f:])
mutate(e, lambda b: b[:0x90000]+bytes([b[0x90000]^1])+b[0x90001:])
p=kit/'13_CHEAT_PORTAL_CHECKER'/'portal.gra'
mutate(p, lambda b: b[:56916]+bytes([b[56916]^1])+b[56917:])
p2=kit/'11_CHEAT_TOMB_CHECKER'/'tomb.gra'
mutate(p2, lambda b: b[:80]+bytes([b[80]^1])+b[81:])
man=kit/'PROBE_MANIFEST.json'
def forged_manifest(data):
    d=json.loads(data)
    d['variants']['10_CHEAT_CONTROL']['sourceVariant']='09_PORTAL_PACKED_CHECKER'
    return json.dumps(d).encode()
mutate(man,forged_manifest)
print(json.dumps({'status':'PASS','negativeTestsRejected':5,'unchangedBaselineRechecks':6}))

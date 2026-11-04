#!/usr/bin/env python3
"""Adversarial controls: reject corrupt source, misplaced edits and forged manifests."""
import argparse, json, shutil, subprocess, sys, tempfile
from pathlib import Path

parser=argparse.ArgumentParser();parser.add_argument('game_zip');parser.add_argument('probe_folder');a=parser.parse_args()
verify=Path(__file__).with_name('verify-mk2-o110y-packed-resource-probes.py')
probes=Path(a.probe_folder)
with tempfile.TemporaryDirectory(prefix='mk2_o110y_falsifications_') as tmp:
    dest=Path(tmp)/'case';shutil.copytree(probes,dest)
    examples=[
       ('modified untouched EXE', '07_TOMB_PACKED_CHECKER/mk2.exe', 0x90),
       ('altered sprite prefix', '07_TOMB_PACKED_CHECKER/tomb.gra', 120),
       ('modified unselected portal resource', '07_TOMB_PACKED_CHECKER/portal.gra', 56916),
       ('changed packed stripe pattern', '07_TOMB_PACKED_CHECKER/tomb.gra', 63776+123),
       ('modified portal control tail', '09_PORTAL_PACKED_CHECKER/portal.gra', 56916+123),
    ]
    good=0
    for label,name,offset in examples:
        f=dest/name;source=f.read_bytes();changed=bytearray(source);changed[offset] ^= 0x01;f.write_bytes(changed)
        result=subprocess.run([sys.executable,str(verify),a.game_zip,str(dest)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        f.write_bytes(source)
        if result.returncode==0 or 'VERIFICATION REJECTED' not in result.stderr:
            raise RuntimeError(f'Negative was not correctly rejected: {label}: {result.stderr}')
        print('REJECTED:',label);good+=1
    f=dest/'PROBE_MANIFEST.json';orig=f.read_bytes();man=json.loads(orig)
    man['variants']['07_TOMB_PACKED_CHECKER']['packedOffset']+=4
    f.write_text(json.dumps(man))
    result=subprocess.run([sys.executable,str(verify),a.game_zip,str(dest)],capture_output=True,text=True)
    f.write_bytes(orig)
    if result.returncode==0 or 'VERIFICATION REJECTED' not in result.stderr:
        raise RuntimeError('Forged offset not rejected')
    print('REJECTED: forged source offset');good+=1
    print(f'O110Y hostile controls {good}/{good} rejected')

#!/usr/bin/env python3
"""Build strictly bounded, canonical-fingerprint guarded MK2 runtime color probes.

These are diagnostic experiments, NOT runtime-verified palette-ownership claims.
They patch only the user-provided original MK2.EXE, never the source file.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path

EXPECTED_EXE_SIZE = 861133
EXPECTED_SHA256 = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
COUNT_RECORDS = {'48': (0x88918, 48), '64': (0x8c77c, 64)}
STAGE_BANK_LOOKUP_OFFSET = 0x659EA
STAGE_BANK_LOOKUP_ORIGINAL = bytes.fromhex('8a 04 c5 06 5b 07 00')
STAGE_GATE_JCC_OFFSET = 0x9E122
STAGE_GATE_JCC_ORIGINAL = bytes.fromhex('74 73')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def get_original(path):
    b = Path(path).read_bytes()
    assert len(b) == EXPECTED_EXE_SIZE, f'Wrong file length {len(b)}'
    assert sha(b) == EXPECTED_SHA256, f'Not canonical untouched MK2.EXE: {sha(b)}'
    assert b[STAGE_BANK_LOOKUP_OFFSET:STAGE_BANK_LOOKUP_OFFSET+7] == STAGE_BANK_LOOKUP_ORIGINAL
    assert b[STAGE_GATE_JCC_OFFSET:STAGE_GATE_JCC_OFFSET+2] == STAGE_GATE_JCC_ORIGINAL
    for label, (offset, count) in COUNT_RECORDS.items():
        assert struct.unpack_from('<H',b,offset)[0] == count, f'Incorrect {label} record count'
        words = struct.unpack_from('<'+'H'*count, b, offset+2)
        assert all(v <= 0x7FFF for v in words)
    return b


def patches(source):
    out = {'BASELINE': (source, 'Untouched canonical control; should run and look unchanged.')}
    for rec_label, color, name, description in [
        ('48', 0x7C1F, 'PAL48_MAGENTA', '48-color original record (0x88918): entries 1-47 forced to RGB555 magenta; entry 0 and count unchanged.'),
        ('64', 0x03E0, 'PAL64_GREEN', '64-color original record (0x8C77C): entries 1-63 forced to RGB555 green; entry 0 and count unchanged.'),
    ]:
        b = bytearray(source)
        offset, count = COUNT_RECORDS[rec_label]
        for i in range(1, count):
            struct.pack_into('<H', b, offset+2+2*i, color)
        out[name] = (bytes(b),description)
    for value, name in [(1,'BANK_START_1'),(49,'BANK_START_49'),(65,'BANK_START_65')]:
        b = bytearray(source)
        b[STAGE_BANK_LOOKUP_OFFSET:STAGE_BANK_LOOKUP_OFFSET+7] = bytes([0xB0, value])+bytes([0x90])*5
        out[name] = (bytes(b), f'At 0x659EA replace stage image bank-byte lookup with MOV AL,{value} and 5 NOPs; 7 bytes total.')
    b = bytearray(source)
    b[STAGE_GATE_JCC_OFFSET] = 0xEB  # existing original conditional JZ +0x73 -> unconditional JMP +0x73
    out['STAGE_SKIP'] = (bytes(b), 'At 0x9E122 change JZ short +0x73 to JMP short +0x73, skipping the guarded packed stage render path.')
    return out


def build(source_path, out_dir):
    source = get_original(source_path)
    dest = Path(out_dir)
    dest.mkdir(parents=True,exist_ok=True)
    original_records = {}
    for label,(offset,n) in COUNT_RECORDS.items():
        original_records[label] = {'offsetHex':hex(offset),'count':n,'recordSha256':sha(source[offset:offset+2+2*n]),'firstValuesHex':[hex(x) for x in struct.unpack_from('<'+'H'*min(n,8),source,offset+2)]}
    manifest = {'format':'mk2_o110w_static_runtime_probe_v1','status':'BUILT / STATICALLY VALIDATED / DOSBOX VALIDATION PENDING',
      'canonicalExe':{'size':len(source),'sha256':sha(source)},'originalPaletteRecords':original_records,
      'stageBankLookup':{'offsetHex':hex(STAGE_BANK_LOOKUP_OFFSET),'originalHex':STAGE_BANK_LOOKUP_ORIGINAL.hex()},
      'stageGateJcc':{'offsetHex':hex(STAGE_GATE_JCC_OFFSET),'originalHex':STAGE_GATE_JCC_ORIGINAL.hex()},
      'variants':{},'scopeLimit':'Original palette record bytes and exact in-place code edit only. No trace, no proven stage palette owner.',
      'originalGameFilesModified':False}
    for name,(data,description) in patches(source).items():
        changed = [i for i,(a,b) in enumerate(zip(source,data)) if a!=b]
        assert len(data)==len(source)
        # Whole-binary reversibility, including all non-change byte equality
        reconstructed = bytearray(data)
        for i in changed: reconstructed[i] = source[i]
        assert sha(reconstructed) == EXPECTED_SHA256
        vdir=dest/name
        vdir.mkdir(exist_ok=True)
        (vdir/'MK2.EXE').write_bytes(data)
        manifest['variants'][name]={
         'description':description,'sha256':sha(data),'size':len(data),'changedByteCount':len(changed),
         'offsetsHex':[hex(x) for x in changed],
         'changes':[{'offsetHex':hex(x),'oldHex':f'{source[x]:02x}','newHex':f'{data[x]:02x}'} for x in changed],
         'reverseToOriginalSha256':sha(reconstructed), 'dosboxStatus':'NOT RUN'}
    (dest/'PROBE_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('exe',help='Untouched original mk2.exe')
    p.add_argument('output',help='Folder for probe variants')
    a=p.parse_args()
    v=build(a.exe,a.output)
    for k,t in v['variants'].items():print(f'{k}: {t["changedByteCount"]} changed bytes, SHA256={t["sha256"]}')

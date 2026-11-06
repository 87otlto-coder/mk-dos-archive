#!/usr/bin/env python3
"""P16 read-only identity audit of the local original MK2 DOS input fixture.

The only embedded evidence is resource names, hashes and counts. A PASS confirms
original input identity, not decoding parity or interactive browser validation.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sys
from zipfile import ZipFile

CANONICAL_ZIP_SHA256 = 'b68d4a6884b927601d34f4a01ed90dcfc31b8f6ea92de75fa9aa8cc736e481f2'
CANONICAL_FILES = {
    'mk2.exe': 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
    'probe.gra': '4e1a30228a05103972ca3838acd76b6bafcc4c4af91e341789a1d84b9338f186',
    'acclaim.gra': 'd95976f318b22266d38511285d5a623def4c3761889a230c2dd80465eef2672e',
    'mountain.gra': '0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6',
    'fall.gra': '60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0',
    'pit.gra': 'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96',
    'tomb.gra': 'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
    'battle.gra': 'ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63',
    'tower.gra': '7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8',
    'forest.gra': '8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9',
    'armory.gra': 'fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612',
    'portal.gra': 'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
    'arena.gra': '37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb',
}
EXPECTED_EXTENSIONS = {'u8': 312, 'gra': 124, 'awe': 33, 'gvs': 33,
                       'lap': 33, 'mid': 33, 'sbl': 33, 'bin': 6,
                       'exe': 2, '(none)': 1, 'bat': 1, 'txt': 1,
                       'drv': 1, 'ini': 1}


def sha256_chunks(handle):
    digest = hashlib.sha256()
    for chunk in iter(lambda: handle.read(1024 * 1024), b''):
        digest.update(chunk)
    return digest.hexdigest()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('source', type=Path, help='Canonical MK2 ZIP or extracted directory')
    ap.add_argument('--report', type=Path, default=None)
    args = ap.parse_args()
    source = args.source
    checks = 0
    zip_hash = None
    archive = None
    try:
        if source.is_file():
            with source.open('rb') as f:
                zip_hash = sha256_chunks(f)
            assert zip_hash == CANONICAL_ZIP_SHA256, 'archive SHA-256 differs from canonical fixture'
            checks += 1
            archive = ZipFile(source, 'r')
            records = [(Path(entry.filename).name.lower(), entry.filename)
                       for entry in archive.infolist() if not entry.is_dir()]
            def file_hash(value):
                with archive.open(value, 'r') as f:
                    return sha256_chunks(f)
        elif source.is_dir():
            records = [(p.name.lower(), p) for p in source.rglob('*') if p.is_file()]
            def file_hash(value):
                with value.open('rb') as f:
                    return sha256_chunks(f)
        else:
            raise AssertionError('input is neither a directory nor ZIP archive')
        assert len(records) == 614, f'expected 614 files, found {len(records)}'
        checks += 1
        by_name = {}
        for name, value in records:
            assert name not in by_name, f'duplicate case-insensitive basename: {name}'
            by_name[name] = value
            checks += 1
        ext = Counter((name.rsplit('.', 1)[-1] if '.' in name else '(none)')
                      for name in by_name)
        assert dict(ext) == EXPECTED_EXTENSIONS, f'extension census differs: {dict(ext)}'
        checks += 1
        for name, expected_hash in CANONICAL_FILES.items():
            assert name in by_name, f'missing original source: {name}'
            assert file_hash(by_name[name]) == expected_hash, f'original source hash differs: {name}'
            checks += 2
        result = {
            'pass': 'P16', 'status': 'PASS', 'classification': 'ORIGINAL_INPUT_IDENTITY_ONLY',
            'checks': checks, 'fileCount': len(records), 'sourceFileHashesVerified': len(CANONICAL_FILES),
            'archiveSha256': zip_hash, 'extensionCensus': dict(sorted(ext.items())),
            'gameArtworkStoredInReport': False,
            'p15FullCumulativeRerun': False, 'gameBrowserVerified': False,
        }
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result, indent=2))
    finally:
        if archive:
            archive.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f'P16 canonical original-source identity FAIL: {exc}', file=sys.stderr)
        sys.exit(1)

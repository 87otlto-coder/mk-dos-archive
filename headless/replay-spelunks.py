"""Replay historical Spelunks 001–009 with narrowly scoped maintained corrections."""
import argparse
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

SUITES = [
    'test_spelunk_001_channel_bridge.py', 'test_stage_selector_programs.py',
    *['test_original_fixture.py'] * 7,
]

def replace_once(path, old, new, method=None):
    text = path.read_text(encoding='utf-8')
    prefix = ''
    if method:
        at = text.index('def ' + method + '(')
        end = text.find('\n def ', at)
        if end < 0:
            end = text.find('\n    def ', at)
        if end < 0:
            end = len(text)
        prefix, text, suffix = text[:at], text[at:end], text[end:]
    else:
        suffix = ''
    if text.count(old) != 1:
        raise ValueError(f'Unexpected historical source in {path.name}')
    path.write_text(prefix + text.replace(old, new, 1) + suffix, encoding='utf-8')

def correct(root):
    replace_once(root / 'spelunk002/trace_stage_selector_programs.py',
                 '0x81FA1: "83c304"', '0x81F9E: "83c304"')
    replace_once(root / 'spelunk002/test_stage_selector_programs.py',
                 r'b"\xAA","pointer bytes disagree"', r'b"\xAA","root does not point to channel-zero base"')
    replace_once(root / 'spelunk004/test_original_fixture.py',
                 '"raw relocated pointer differs"', '"typed LE pointer mismatch"')
    replace_once(root / 'spelunk005/test_original_fixture.py',
                 '"raw relocated pointer"', '"typed LE pointer mismatch"',
                 'test_original_suck_list_pointer_mutation_refused')
    replace_once(root / 'spelunk007/test_original_fixture.py',
                 '"raw relocated pointer"', '"typed pointer"',
                 'test_bad_source_list_descriptor_refused')

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('historical_checkout', type=Path)
    p.add_argument('original_exe', type=Path)
    p.add_argument('original_zip', type=Path)
    a = p.parse_args()
    with tempfile.TemporaryDirectory(prefix='mk2-research-') as tmp:
        root = Path(tmp)
        for i in range(1, 10):
            name = f'spelunk{i:03d}'
            shutil.copytree(a.historical_checkout / 'scripts/research' / name, root / name)
        correct(root)
        for i, suite in enumerate(SUITES, 1):
            source = [str(a.original_exe.resolve())] if i < 3 else ['--game-zip', str(a.original_zip.resolve())]
            subprocess.run([sys.executable, str(root / f'spelunk{i:03d}' / suite), *source], check=True)

if __name__ == '__main__':
    main()

import importlib.util
import json
import os
from pathlib import Path
import unittest

HERE = Path(__file__).parent
SPEC = importlib.util.spec_from_file_location('components', HERE / 'stage-components.py')
m = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(m)

class Components(unittest.TestCase):
    def test_mask_distinguishes_opaque_zero_and_uncovered(self):
        item = dict(kind='setup_layer', dimensions=[2,1], binding={
            'originSignedXY': [-1,0], 'initialHorizontalInteger': 0})
        indices, opacity, _ = m.project({'headerSignedWords':[0,0,0]}, item, b'\x04\x00', b'\xff\xff', 0)
        self.assertEqual(indices[:2], b'\0\0')
        self.assertEqual(opacity[:2], b'\xff\0')

    @unittest.skipUnless(os.getenv('MK2_DOS_FIXTURE') and os.getenv('MK2_P82_ARCHIVE'), 'private inputs required')
    def test_independent_plane_hashes(self):
        cases = json.loads((HERE / 'stage-projection-reference.json').read_text(encoding='utf-8'))
        seen = 0
        for stage, delta, expected in cases:
            setup, _, parts, missing = m.source_components(Path(os.environ['MK2_DOS_FIXTURE']),
                Path(os.environ['MK2_P82_ARCHIVE']), stage, '2')
            self.assertFalse(missing)
            self.assertEqual(set(parts), {row[0] for row in expected})
            for key, index_hash, mask_hash in expected:
                index, opacity, meta = parts[key]
                out, mask, _ = m.project(setup, meta, index, opacity, delta)
                self.assertEqual((m.sha(out), m.sha(mask)), (index_hash, mask_hash))
                seen += 1
        self.assertEqual(seen, 18)

if __name__ == '__main__':
    unittest.main()

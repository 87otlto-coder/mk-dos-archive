"""Exercise P66 acceptance boundaries without commercial files."""
from pathlib import Path
import runpy
import unittest

gate = runpy.run_path(str(Path(__file__).with_name("verify-p66-checkpoint.py")))


class Refusals(unittest.TestCase):
    def test_provenance(self):
        for fields in (gate["SCORES"], gate["STREAMS"]):
            good = {("pass" if k == "pass_" else k): v for k, v in fields.items()}
            gate["matches"](good, fields)
            for key, value in good.items():
                with self.subTest(key=key), self.assertRaises(ValueError):
                    gate["matches"]({k: v for k, v in good.items() if k != key}, fields)
                changed = not value if isinstance(value, bool) else -1
                with self.subTest(key=key), self.assertRaises(ValueError):
                    gate["matches"]({**good, key: changed}, fields)

    def test_overlap(self):
        root = Path.cwd().resolve()
        for left, right in [(root, root), (root, root/"child"), (root/"child", root)]:
            with self.assertRaises(ValueError):
                gate["separate"]([left, right])


if __name__ == "__main__":
    unittest.main()

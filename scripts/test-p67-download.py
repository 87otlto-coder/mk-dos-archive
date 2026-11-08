"""Source-only controls for the browser-download oracle."""
import io
import json
from pathlib import Path
import runpy
from tempfile import TemporaryDirectory
import unittest
from zipfile import ZipFile

oracle = runpy.run_path(str(Path(__file__).with_name("check-p67-download.py")))


class DownloadReadback(unittest.TestCase):
    def setUp(self):
        temp = TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.wav = b"RIFF" + bytes(4) + b"WAVE" + bytes(8)
        self.parent = b"prefix" + self.wav + b"suffix"
        (self.root / "dummy.ftr").write_bytes(self.parent)
        self.row = {
            "kind": "audio", "name": "sample", "id": "dummy.ftr@6", "filename": "dummy.wav",
            "source": {"path": "dummy.ftr", "offset": 6, "length": len(self.wav),
                       "sha256": oracle["sha"](self.parent)},
            "metadata": {"wavSha256": oracle["sha"](self.wav)},
        }

    def check(self, payload=None, names=None, extra=False):
        buffer = io.BytesIO()
        with ZipFile(buffer, "w") as archive:
            archive.writestr("assets/00000_dummy.wav", self.wav if payload is None else payload)
            archive.writestr("manifest.json", json.dumps({
                "format": "mkdos_selected_assets_v1", "selectionOrder": [self.row]}))
            if extra:
                archive.writestr("unexpected.txt", b"")
        with ZipFile(buffer) as archive:
            oracle["selection"]("mk3", self.root, archive, names or ["sample"])

    def test_valid_interval(self):
        self.check()

    def test_changed_payload(self):
        with self.assertRaisesRegex(AssertionError, "original interval"):
            self.check(payload=self.wav[:-1] + b"x")

    def test_wrong_parent_hash(self):
        self.row["source"]["sha256"] = oracle["sha"](self.wav)
        with self.assertRaises(AssertionError):
            self.check()

    def test_wrong_offset(self):
        self.row["source"]["offset"] += 1
        with self.assertRaises(AssertionError):
            self.check()

    def test_wrong_ui_selection(self):
        with self.assertRaises(AssertionError):
            self.check(names=["different"])

    def test_extra_member(self):
        with self.assertRaisesRegex(AssertionError, "unexpected"):
            self.check(extra=True)


if __name__ == "__main__":
    unittest.main()

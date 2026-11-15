"""Original-free portable capture inventory acceptance and mutation refusal tests."""
import json
from pathlib import Path
import tempfile
import unittest

from verify_portable_capture import (
    REQUIRED, IDENTITY, MANIFEST, UPSTREAM, PackageError, seal, verify, digest
)

class PortableTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory(prefix="p91-portable-gate-")
        self.addCleanup(tmp.cleanup)
        self.folder = Path(tmp.name) / "P91Capture"
        self.folder.mkdir()
        for name in REQUIRED:
            p = self.folder / name
            p.write_bytes(b"MZ" + b"faux-p91-executable" if name == "dosbox-x.exe"
                          else ("source-safe placeholder: " + name).encode())
        (self.folder / "SDL2.dll").write_bytes(b"fake synthetic DLL")
        identity = {
            "schema": "mkext_p91_private_capture_build_identity_v1",
            "upstreamCommit": UPSTREAM,
            "core": "normal", "pagingEnabled": False,
            "containsCommercialGameAssets": False,
            "originalRuntimeCaptured": False,
            "executableSha256": digest(self.folder / "dosbox-x.exe"),
            "patchSha256": "0" * 64,
        }
        (self.folder / IDENTITY).write_text(json.dumps(identity))

    def test_seal_verify_and_member_inventory(self):
        report = seal(self.folder)
        self.assertEqual(verify(self.folder), report)
        self.assertTrue((self.folder / MANIFEST).exists())

    def test_existing_manifest_refused(self):
        seal(self.folder)
        with self.assertRaisesRegex(PackageError, "overwritten"):
            seal(self.folder)

    def test_mutated_dll_refused(self):
        seal(self.folder)
        (self.folder / "SDL2.dll").write_bytes(b"tampered")
        with self.assertRaisesRegex(PackageError, "inventory"):
            verify(self.folder)

    def test_missing_dependency_refused(self):
        (self.folder / "SDL2.dll").unlink()
        with self.assertRaisesRegex(PackageError, "no runtime DLL"):
            seal(self.folder)

    def test_wrong_executable_identity_refused(self):
        (self.folder / "dosbox-x.exe").write_bytes(b"MZchanged")
        with self.assertRaisesRegex(PackageError, "executable hash"):
            seal(self.folder)

    def test_commercial_file_refused(self):
        (self.folder / "MK2.EXE").write_bytes(b"MZsynthetic bad file")
        with self.assertRaisesRegex(PackageError, "original DOS game"):
            seal(self.folder)

    def test_subdirectory_refused(self):
        (self.folder / "GAMECOPY").mkdir()
        with self.assertRaisesRegex(PackageError, "nested"):
            seal(self.folder)

    def test_wrong_upstream_refused(self):
        p = self.folder / IDENTITY
        d = json.loads(p.read_text())
        d["upstreamCommit"] = "0" * 40
        p.write_text(json.dumps(d))
        with self.assertRaisesRegex(PackageError, "unpinned"):
            seal(self.folder)

    def test_wrong_package_name_refused(self):
        self.folder.rename(self.folder.parent / "other")
        with self.assertRaisesRegex(PackageError, "P91Capture"):
            seal(self.folder.parent / "other")

if __name__ == "__main__":
    unittest.main(verbosity=2)

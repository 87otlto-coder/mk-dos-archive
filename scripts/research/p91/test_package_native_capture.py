"""Original-free P91 Windows package staging and refusal tests."""
from __future__ import annotations

import json
from pathlib import Path
import tempfile
import unittest

from package_native_capture import MEMBERS,PLAN_SOURCE,stage,PackageRefused


class PackageTests(unittest.TestCase):
    def setUp(self):
        tmp=tempfile.TemporaryDirectory(prefix="p91-packaging-")
        self.addCleanup(tmp.cleanup)
        self.base=Path(tmp.name)
        self.repo=self.base/"repo"
        scripts=self.repo/"scripts"/"research"/"p91"
        scripts.mkdir(parents=True)
        for name,_ in MEMBERS:
            (scripts/name).write_text("synthetic noncommercial source:"+name)
        plan=self.repo/PLAN_SOURCE
        plan.parent.mkdir(parents=True)
        plan.write_text(json.dumps({
            "schema":"mk2_p91_capture_plan_v1",
            "sourceExeSha256":"fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65"
        }))
        self.exe=self.base/"dosbox-x.exe"
        self.exe.write_bytes(b"MZ"+b"x"*110000)
        self.patch=self.base/"native.patch"
        self.patch.write_text(
            "--- a/src/cpu/core_normal.cpp\n"
            "+++ b/src/cpu/core_normal.cpp\n"
            "+MKEXT_P91_CaptureObserve(core.cseip)\n"
        )
        self.output=self.base/"P91Capture"

    def test_successful_source_safe_manifest(self):
        result=stage(self.repo,self.exe,self.patch,self.output)
        self.assertFalse(result["containsCommercialGameAssets"])
        self.assertFalse(result["originalRuntimeCaptured"])
        self.assertTrue((self.output/"Run-P91-Private-Capture.cmd").is_file())
        self.assertTrue((self.output/"dosbox-x.exe").is_file())
        self.assertTrue((self.output/"P91_CAPTURE_BUILD_ID.json").is_file())
        self.assertEqual(
            {f.name for f in self.output.iterdir()},
            {"dosbox-x.exe","P91_CAPTURE_SOURCE_PLAN_20261115.json",
             "P91_CAPTURE_BUILD_ID.json"}|{name for _,name in MEMBERS})

    def test_existing_destination_never_overwritten(self):
        self.output.mkdir()
        (self.output/"keep.txt").write_text("preserve")
        with self.assertRaisesRegex(PackageRefused,"destination exists"):
            stage(self.repo,self.exe,self.patch,self.output)
        self.assertEqual((self.output/"keep.txt").read_text(),"preserve")

    def test_wrong_executable_refused(self):
        self.exe.write_bytes(b"not an executable"+b"x"*110000)
        with self.assertRaisesRegex(PackageRefused,"signature"):
            stage(self.repo,self.exe,self.patch,self.output)
        self.assertFalse(self.output.exists())

    def test_wrong_patched_core_refused(self):
        self.patch.write_text("--- a/src/dos/dos.cpp\n+not a CPU patch")
        with self.assertRaisesRegex(PackageRefused,"CPU source patch"):
            stage(self.repo,self.exe,self.patch,self.output)

    def test_missing_portable_file_refused(self):
        (self.repo/"scripts"/"research"/"p91"/"snapshot.py").unlink()
        with self.assertRaisesRegex(PackageRefused,"missing source-safe package"):
            stage(self.repo,self.exe,self.patch,self.output)
        self.assertFalse(self.output.exists())

    def test_wrong_source_plan_refused(self):
        plan=self.repo/PLAN_SOURCE
        plan.write_text(json.dumps({"schema":"unexpected","sourceExeSha256":"0"*64}))
        with self.assertRaisesRegex(PackageRefused,"source plan unsupported"):
            stage(self.repo,self.exe,self.patch,self.output)


if __name__=="__main__":
    unittest.main(verbosity=2)

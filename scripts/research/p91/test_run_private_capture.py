"""Windows original-free failure/refusal controls for one-entry-point P91 runner.

Never launches DOSBox or uses original MK2 resources. All filesystem fixtures
are constructed from synthetic bytes in a temporary directory.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import run_private_capture as app


def fingerprint(b):
    return hashlib.sha256(b).hexdigest()


class PrivateLauncher(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="p91-private-launcher-")
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.root = root
        source = root / "SOURCE"
        tools = root / "TOOLS"
        fixtures = root / "FIXTURES"
        self.validation = fixtures / "VALIDATION"
        self.game = fixtures / "mk2" / "mk2"
        self.package = tools / "P91Capture"
        for directory in (source, self.validation, self.game, self.package):
            directory.mkdir(parents=True)
        self.fingerprint = {}
        for name in ("MK2.EXE", "TOMB.GRA", "IMAGES.GRA"):
            data = ("synthetic noncommercial fixture:" + name).encode()
            (self.game / name).write_bytes(data)
            self.fingerprint[name] = fingerprint(data)
        self.plan = {"schema": "mk2_p91_capture_plan_v1",
                     "requiredOriginalFingerprints": self.fingerprint}
        self.identity = {
            "upstreamCommit": "029bd65c5dcc7cdc7f2e14e35278620d9707d969",
            "patchSha256": "a" * 64,
            "executableSha256": fingerprint(b"synthetic DOSBox executable"),
            "core": "normal",
            "pagingEnabled": False,
        }
        (self.package / "dosbox-x.exe").write_bytes(b"synthetic DOSBox executable")
        (self.package / "P91_CAPTURE_BUILD_ID.json").write_text(json.dumps(self.identity))
        (self.package / "P91_CAPTURE_SOURCE_PLAN_20261115.json").write_text(json.dumps(self.plan))
        for member in ("read_native_capture.py","snapshot.py","verify_snapshot.py"):
            (self.package / member).write_text("synthetic placeholder")
        self.patchers = []
        for field,value in (
            ("ROOT",root),("PACKAGE",self.package),("GAME",self.game),
            ("VALIDATION",self.validation),
            ("EXECUTABLE",self.package/"dosbox-x.exe"),
            ("IDENTITY",self.package/"P91_CAPTURE_BUILD_ID.json"),
            ("PLAN",self.package/"P91_CAPTURE_SOURCE_PLAN_20261115.json"),
            ("READER",self.package/"read_native_capture.py"),
        ):
            p = patch.object(app,field,value)
            p.start()
            self.addCleanup(p.stop)

    def test_synthetic_successful_preflight_without_launch(self):
        plan,identity = app.preflight()
        self.assertEqual(plan["requiredOriginalFingerprints"],self.fingerprint)
        self.assertEqual(identity,self.identity)
        self.assertEqual(list(self.validation.iterdir()),[])

    def test_mismatched_exe_rejected(self):
        (self.package/"dosbox-x.exe").write_bytes(b"corrupted build")
        with self.assertRaisesRegex(app.CaptureBlocked,"fingerprint mismatch"):
            app.preflight()

    def test_missing_package_rejected_before_any_launch(self):
        (self.package/"read_native_capture.py").unlink()
        with self.assertRaisesRegex(app.CaptureBlocked,"Required P91 capture package member missing"):
            app.preflight()

    def test_missing_fixture_rejected_before_any_launch(self):
        (self.game/"TOMB.GRA").unlink()
        with self.assertRaisesRegex(app.CaptureBlocked,"Missing/duplicate original fixture"):
            app.preflight()

    def test_fixture_mutation_rejected_before_any_launch(self):
        (self.game/"MK2.EXE").write_bytes(b"unexpected replacement")
        with self.assertRaisesRegex(app.CaptureBlocked,"Original fingerprint changed"):
            app.preflight()

    def test_upstream_build_identity_refused(self):
        unexpected = dict(self.identity,upstreamCommit="0" * 40)
        (self.package/"P91_CAPTURE_BUILD_ID.json").write_text(json.dumps(unexpected))
        with self.assertRaisesRegex(app.CaptureBlocked,"Unexpected upstream"):
            app.preflight()

    def test_noncanonical_tool_layout_rejected(self):
        with patch.object(app,"PACKAGE",self.root/"FIXTURES"):
            with self.assertRaisesRegex(app.CaptureBlocked,"canonical TOOLS"):
                app.preflight()

    def test_disposable_config_uses_copy_and_normal_core(self):
        disposable = self.validation/"P91-synthetic-run"/"GAMECOPY"
        disposable.mkdir(parents=True)
        config = app.prepare_config(disposable.parent,disposable)
        content = config.read_text()
        self.assertIn("core=normal",content)
        self.assertIn('mount c "'+str(disposable)+'"',content)
        self.assertNotIn("debugbox",content.lower())
        self.assertNotIn(str(self.game),content)
        with self.assertRaisesRegex(app.CaptureBlocked,"already exists"):
            app.prepare_config(disposable.parent,disposable)

    def test_early_process_exit_cannot_report_success(self):
        self.assertEqual(app.preflight()[1],self.identity)
        class FakeProcess:
            def poll(self):return 1
            def terminate(self):raise AssertionError("stopped process cannot terminate")
        with patch.object(app.subprocess,"Popen",return_value=FakeProcess()) as launch:
            with self.assertRaisesRegex(app.CaptureBlocked,"exited before a Tomb packet"):
                app.capture(self.plan,self.identity,maximum_seconds=60)
            self.assertEqual(launch.call_count,1)
        evidence=list(self.validation.glob("P91-*"))
        self.assertEqual(len(evidence),1)
        self.assertTrue((evidence[0]/"capture-launcher-error.txt").is_file())
        self.assertFalse((evidence[0]/"capture-result.json").exists())
        self.assertFalse((evidence[0]/"p91-native-raw-complete.json").exists())

    def test_missing_identity_member_refused(self):
        bad=dict(self.identity)
        del bad["patchSha256"]
        with self.assertRaisesRegex(app.CaptureBlocked,"Missing adapter identity"):
            app.check_identity(bad)


if __name__=="__main__":
    unittest.main(verbosity=2)

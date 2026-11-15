#!/usr/bin/env python3
"""Original-game-free acceptance and refusal tests for passive DOSBox overlay."""
from __future__ import annotations

import unittest
from unittest import mock
from pathlib import Path
import tempfile

import r1_dosbox_passive_read_overlay as subject


def source() -> str:
    return (
        "#include <stdlib.h>\n"
        "static void dos_read() {\n"
        + subject.ANCHOR
        + "\n}\n"
    )


class OverlayTests(unittest.TestCase):
    def test_patch_is_scoped_to_one_native_read_return(self):
        result = subject.patched(source())
        self.assertEqual(result.count(subject.MARKER), 1)
        self.assertEqual(result.count("DOS_ReadFile(reg_bx, dos_copybuf, &toread)"), 1)
        self.assertIn("mkext_offset == 732662u", result)
        self.assertIn("mkext_requested == 1506u", result)
        self.assertIn("MEM_BlockRead(SegPhys(ds) + reg_dx, mkext_guest, toread)", result)
        self.assertIn("mkext_guest_matches", result)
        self.assertIn("MKEXT_P89_CAPTURE_DIR", result)
        self.assertNotIn("BPINT", result)
        self.assertNotIn("STEPIN", result)

    def test_source_patch_does_not_create_original_bytes(self):
        output = subject.create_patch(source())
        self.assertTrue(output.startswith("--- a/src/dos/dos.cpp"))
        self.assertIn("+++ b/src/dos/dos.cpp", output)
        self.assertIn(subject.MARKER, output)
        self.assertNotIn("DATA.MK3\x00", output)

    def test_already_patched_input_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "already present"):
            subject.patched(subject.patched(source()))

    def test_missing_anchor_refused(self):
        with self.assertRaisesRegex(ValueError, "not unique"):
            subject.patched("unrelated DOS source")

    def test_repeated_native_read_call_refused(self):
        with self.assertRaisesRegex(ValueError, "not unique"):
            subject.patched(source() + "\n" + subject.ANCHOR)

    def test_one_changed_original_read_copy_refused(self):
        broken = source().replace(
            "diskio_delay_handle(reg_bx, toread);", "diskio_delay_handle(reg_bx, 0);"
        )
        with self.assertRaisesRegex(ValueError, "not unique"):
            subject.patched(broken)

    def test_private_source_tree_identity_requires_exact_upstream(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "src" / "dos").mkdir(parents=True)
            (root / "src" / "dos" / "dos.cpp").write_text(source())
            with mock.patch.object(subject.subprocess, "check_output",
                                   side_effect=["0000000000000000\n", ""]):
                with self.assertRaisesRegex(ValueError, "unexpected upstream"):
                    subject.verify_checkout(root)

    def test_dirty_upstream_tree_refused(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "src" / "dos").mkdir(parents=True)
            (root / "src" / "dos" / "dos.cpp").write_text(source())
            with mock.patch.object(subject.subprocess, "check_output",
                                   side_effect=[subject.UPSTREAM_SHA + "\n",
                                                " M src/dos/dos.cpp\n"]):
                with self.assertRaisesRegex(ValueError, "contains changes"):
                    subject.verify_checkout(root)

    def test_exact_upstream_check_only_accepts_existing_dos_cpp(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "src" / "dos").mkdir(parents=True)
            with mock.patch.object(subject.subprocess, "check_output",
                                   side_effect=[subject.UPSTREAM_SHA + "\n", ""]):
                with self.assertRaisesRegex(ValueError, "missing"):
                    subject.verify_checkout(root)

    def test_crlf_does_not_create_mixed_newline_patch(self):
        diff = subject.create_patch(source().replace("\n", "\r\n"))
        self.assertNotIn("\r", diff)
        self.assertEqual(diff.count(subject.MARKER), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)

"""Original-free source overlay refusal, placement and identity controls."""
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from native_observer_smoke_overlay import MARKER, patched, create_patch

SOURCE = '''#include "paging.h"
Bits CPU_Core_Normal_Run(void) {
\twhile (CPU_Cycles-->0) {
\t\tLOADIP;
\t\tlast_prefix=MP_NONE;
restart_opcode:
\t\tswitch (core.opcode_index+Fetchb()) {
\t\t}
\t}
}
'''


class OverlayTests(unittest.TestCase):
    def test_unique_hook_after_loadip(self):
        result = patched(SOURCE)
        self.assertIn(MARKER, result)
        self.assertEqual(result.count("MKEXT_P91_NoGameSmoke(core.cseip);"), 1)
        self.assertLess(result.index("\t\tLOADIP;"),
                        result.index("\t\tMKEXT_P91_NoGameSmoke(core.cseip);"))
        self.assertLess(result.index("\t\tMKEXT_P91_NoGameSmoke(core.cseip);"),
                        result.index("restart_opcode:"))

    def test_generates_reviewable_single_file_diff(self):
        diff = create_patch(SOURCE)
        self.assertIn("--- a/src/cpu/core_normal.cpp", diff)
        self.assertIn("+++ b/src/cpu/core_normal.cpp", diff)
        self.assertIn("CreateFileA", diff)
        self.assertIn("MEM_BlockRead", diff)
        self.assertIn("vga.dac.rgb", diff)

    def test_repeated_application_refused(self):
        with self.assertRaisesRegex(ValueError, "already instrumented"):
            patched(patched(SOURCE))

    def test_missing_and_duplicate_anchor_refused(self):
        with self.assertRaisesRegex(ValueError, "LOADIP anchor"):
            patched(SOURCE.replace("LOADIP", "NOT_IP"))
        with self.assertRaisesRegex(ValueError, "LOADIP anchor"):
            patched(SOURCE + "\twhile (CPU_Cycles-->0) {\n\t\tLOADIP;\n")

    def test_unexpected_include_refused(self):
        with self.assertRaisesRegex(ValueError, "paging include"):
            patched(SOURCE.replace('#include "paging.h"', '#include "other.h"'))

    def test_no_guest_memory_export(self):
        text = patched(SOURCE)
        self.assertNotIn("MK2.EXE", text)
        self.assertNotIn("TOMB.GRA", text)
        self.assertNotIn("PORTAL.GRA", text)
        self.assertIn('"nativeFrameCaptured\\":false', text)

    def test_default_disabled_and_private_new_file(self):
        text = patched(SOURCE)
        self.assertIn('std::getenv("MKEXT_P91_SMOKE_DIR")', text)
        self.assertIn("CREATE_NEW", text)
        self.assertIn("if (dir == NULL", text)


if __name__ == "__main__":
    unittest.main(verbosity=2)

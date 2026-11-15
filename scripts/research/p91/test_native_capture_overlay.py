"""P91 original-free source-pinned native adapter overlay tests."""
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parent))
from native_capture_overlay import patched,patch

CORE = """#include "paging.h"
Bits CPU_Core_Normal_Run(void) {
    if (CPU_Cycles <= 0) return 0;
\twhile (CPU_Cycles-->0) {
\t\tLOADIP;
\t\tlast_prefix=MP_NONE;
restart_opcode:
\t\tswitch (core.opcode_index+Fetchb()) {}
\t}
}
"""


class NativeOverlay(unittest.TestCase):
    def test_hook_before_prefix_restart(self):
        s=patched(CORE)
        self.assertIn('#include "native_capture_adapter.hpp"',s)
        self.assertLess(s.index("MKEXT_P91_CaptureObserve(core.cseip);"),
                        s.index("restart_opcode:"))
        self.assertGreater(s.index("MKEXT_P91_CaptureObserve(core.cseip);"),
                           s.index("LOADIP;"))
        self.assertEqual(s.count("MKEXT_P91_CaptureObserve(core.cseip);"),1)

    def test_one_reviewable_core_file_patch(self):
        p=patch(CORE)
        self.assertTrue(p.startswith("--- a/src/cpu/core_normal.cpp"))
        self.assertIn("+++ b/src/cpu/core_normal.cpp",p)
        self.assertIn("MKEXT_P91_CAPTURE_HOOK_BEGIN",p)

    def test_repeat_refused(self):
        with self.assertRaisesRegex(ValueError,"already instrumented"):
            patched(patched(CORE))

    def test_missing_and_duplicate_anchor_refused(self):
        with self.assertRaisesRegex(ValueError,"LOADIP loop anchor"):
            patched(CORE.replace("LOADIP;","OTHER;"))
        with self.assertRaisesRegex(ValueError,"LOADIP loop anchor"):
            patched(CORE+"\twhile (CPU_Cycles-->0) {\n\t\tLOADIP;\n")

    def test_missing_function_refused(self):
        with self.assertRaisesRegex(ValueError,"entry anchor"):
            patched(CORE.replace("Bits CPU_Core_Normal_Run","Bits OTHER_Run"))

    def test_no_embedded_commercial_assets(self):
        source=Path(__file__).with_name("native_capture_adapter.hpp").read_text()
        self.assertNotIn("MK2.EXE",source)
        self.assertNotIn("TOMB.GRA",source)
        self.assertIn("CREATE_NEW",source)
        self.assertIn("nativeGameVerified",source)
        self.assertIn("native_ram_read",source)
        self.assertIn("FillFlags()",source)


if __name__=="__main__":
    unittest.main(verbosity=2)

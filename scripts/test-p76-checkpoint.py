#!/usr/bin/env python3
"""P76 fail-closed checkpoint source-only controls; no original game bytes."""
import json
from pathlib import Path
import runpy
import unittest

ROOT=Path(__file__).resolve().parents[1]
m=runpy.run_path(str(ROOT/'scripts/verify-p76-checkpoint.py'))

class P76CheckpointSourceTests(unittest.TestCase):
    def test_six_exact_original_regression_groups(self):
        self.assertEqual(m['STEPS'],(
            'p71_accepted_three_game_baseline',
            'p72_original_mk3_source_comparison',
            'p72_original_chrome_comparison',
            'p76_source_refusal_controls',
            'p76_original_mk3_indexed_assets',
            'p76_original_chrome_indexed_download'))

    def test_json_parser_accepts_only_exact_object(self):
        self.assertEqual(m['json_stdout'](b'{"pass":"P76","status":"PASS"}','synthetic'),
                         {'pass':'P76','status':'PASS'})
        with self.assertRaisesRegex(ValueError,'non-JSON'):
            m['json_stdout'](b'P76: running\n{"status":"PASS"}','tampered')
        with self.assertRaisesRegex(ValueError,'non-JSON'):
            m['json_stdout'](b'{"status":"PASS"}\n{"status":"PASS"}','repeated')

    def test_exact_requires_all_fields(self):
        with self.assertRaisesRegex(ValueError,'mismatch'):
            m['exact']({'status':'PASS'},{'pass':'P76','status':'PASS'},'tampered')

    def test_exact_rejects_false_for_zero(self):
        with self.assertRaisesRegex(ValueError,'mismatch'):
            m['exact']({'n':False},{'n':0},'tampered')

    def test_exact_rejects_true_for_one(self):
        with self.assertRaisesRegex(ValueError,'mismatch'):
            m['exact']({'n':True},{'n':1},'tampered')

    def test_exact_rejects_string_for_integer(self):
        with self.assertRaisesRegex(ValueError,'mismatch'):
            m['exact']({'census':'9205'},{'census':9205},'tampered')

    def test_exact_rejects_forged_native_palette_evidence(self):
        with self.assertRaisesRegex(ValueError,'mismatch'):
            m['exact']({'nativePaletteOrRuntimePlacementClaims':True},
                       {'nativePaletteOrRuntimePlacementClaims':False},'tampered')

    def test_legacy_P71_source_fingerprint_audit_is_inherited(self):
        p71=m['P71']
        self.assertTrue(callable(p71['preflight']))
        self.assertTrue(callable(p71['P66']['audit_source']))
        self.assertEqual(p71['CENSUS'],{'mk1':2656,'mk2':5369,'mk3':9186})

    def test_untrusted_success_without_source_runtime_is_not_accepted(self):
        # No bypass flag, no synthetic original game fixture switch.
        source=(ROOT/'scripts/verify-p76-checkpoint.py').read_text(encoding='utf-8')
        self.assertIn("closing==opening",source)
        self.assertIn("'originalDosFixtureAndChromeP72P76Verified':True",source)
        self.assertIn("report['status']='FAIL'",source)
        self.assertIn("execute(STEPS[5]",source)

if __name__=='__main__':
    unittest.main(verbosity=2)

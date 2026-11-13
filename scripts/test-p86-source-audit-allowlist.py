#!/usr/bin/env python3
"""P86 source-only allowlist regression: no original commercial game files."""
from __future__ import annotations

import inspect
import re
from pathlib import Path
import runpy
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
P66 = runpy.run_path(str(ROOT / "scripts" / "verify-p66-checkpoint.py"))
P81 = runpy.run_path(str(ROOT / "scripts" / "verify-p81-checkpoint.py"))


class SourceAuditBranchTests(unittest.TestCase):
    def test_exact_allowlist_includes_historical_branches_and_only_p86(self):
        self.assertEqual(P66["APPROVED_CHECKPOINT_BRANCHES"], (
            "develop",
            "interim/p79-original-extraction",
            "interim/p86-consolidation",
        ))

    def test_inherited_p61_js_branch_audit_accepts_exact_p86_only(self):
        # The first original P86 run failed here, before any P61 extraction.
        # Guard the *actual P61 JS source* because P66/P81's Python allowlist
        # cannot authorize a branch rejected by the nested Node runner.
        original = (ROOT / "scripts" / "verify-p61-checkpoint.cjs").read_text(
            encoding="utf-8")
        match = re.search(
            r"assert\(new Set\(\[([^\]]+)\]\)\.has\(branch\),",
            original,
        )
        self.assertIsNotNone(match, "P61 must fail closed on its Git branch")
        names = re.findall(r"'([^']+)'", match.group(1))
        self.assertEqual(names, [
            "develop", "interim/p79-original-extraction",
            "interim/p86-consolidation",
        ])
        for disallowed in (
            "main", "interim/p83-mk2-stage-library",
            "interim/p85-headless-mk3-leading-index",
            "interim/p86-consolidation-unsafe", "",
        ):
            self.assertNotIn(disallowed, names)
        self.assertIn("const changes=git(['status','--porcelain','--untracked-files=no']);",
                      original)
        self.assertIn("assert.equal(changes,'','P61 requires clean tracked source",
                      original)
        self.assertIn("assert.deepStrictEqual(forbidden,[]", original)

    def test_unapproved_checkouts_refuse_before_other_git_operations(self):
        function = P66["audit_source"]
        for branch in (
            "", "main", "interim/p83-mk2-stage-library",
            "interim/p85-headless-mk3-leading-index",
            "interim/p86-consolidation-unsafe", "research/unsaved",
        ):
            calls = []
            def git(*args):
                calls.append(args)
                return branch
            with self.subTest(branch=branch), patch.dict(function.__globals__, {"run": git}):
                with self.assertRaisesRegex(ValueError, "Expected clean"):
                    function()
            self.assertEqual(calls, [("git", "branch", "--show-current")],
                             "Unknown branches must fail before source inspection")

    def test_p86_and_historical_branches_still_fail_closed_on_dirty_files(self):
        function = P66["audit_source"]
        for branch in P66["APPROVED_CHECKPOINT_BRANCHES"]:
            calls = []
            def git(*args):
                calls.append(args)
                if args == ("git", "branch", "--show-current"):
                    return branch
                if args == ("git", "status", "--porcelain", "--untracked-files=all"):
                    return " M scripts/verify-p66-checkpoint.py"
                raise AssertionError("Dirty checkout unexpectedly continued to source audit")
            with self.subTest(branch=branch), patch.dict(function.__globals__, {"run": git}):
                with self.assertRaisesRegex(ValueError, "Dirty source checkout"):
                    function()
            self.assertEqual(len(calls), 2)

    def test_p81_uses_same_exact_p66_allowlist(self):
        # A source-structure regression, not an original data test. P81 calls
        # the P71/P66 source audit first and then checks the same branch policy.
        self.assertIn('branch in P71["P66"]["APPROVED_CHECKPOINT_BRANCHES"]',
                      inspect.getsource(P81["checkpoint"]))
        self.assertIn("source checkout must be audited", inspect.getsource(P81["checkpoint"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)

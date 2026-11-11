#!/usr/bin/env python3
"""Original-game-free regression tests for Windows browser artifact cleanup."""
from __future__ import annotations

import importlib.util
from pathlib import Path
from unittest import TestCase, main
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "mk_browser_retention", Path(__file__).with_name("browser_retention.py")
)
retention = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retention)


def inventory(*ids):
    return [{"artifacts": [
        {"id": n, "name": retention.NAME, "expired": False} for n in ids
    ]}]


def ordered():
    return [{"id": n} for n in (300, 200, 100, 90)]


class ReconcileTests(TestCase):
    def test_eventually_consistent_listing_is_retried_without_redeleting(self):
        # DELETE already succeeded; immediate list still contains the old ID.
        with patch.object(retention, "browser_pages",
                          side_effect=[inventory(300, 200, 100, 90),
                                       inventory(300, 200, 100)] ) as pages, \
             patch.object(retention.time, "sleep") as sleep:
            retention.reconcile(ordered(), attempts=3, pause_seconds=2)
            self.assertEqual(pages.call_count, 2)
            sleep.assert_called_once_with(2)

    def test_persistent_stale_deletion_fails_closed(self):
        with patch.object(retention, "browser_pages", return_value=inventory(300, 200, 100, 90)) as pages, \
             patch.object(retention.time, "sleep") as sleep:
            with self.assertRaisesRegex(ValueError, "did not reconcile"):
                retention.reconcile(ordered(), attempts=3, pause_seconds=2)
            self.assertEqual(pages.call_count, 3)
            self.assertEqual(sleep.call_count, 2)

    def test_missing_retained_artifact_is_never_accepted(self):
        with patch.object(retention, "browser_pages", return_value=inventory(300, 100)), \
             patch.object(retention.time, "sleep"):
            with self.assertRaisesRegex(ValueError, "did not reconcile"):
                retention.reconcile(ordered(), attempts=2, pause_seconds=0)

    def test_clean_inventory_passes_without_delay(self):
        with patch.object(retention, "browser_pages", return_value=inventory(300, 200, 100)), \
             patch.object(retention.time, "sleep") as sleep:
            retention.reconcile(ordered(), attempts=2)
            sleep.assert_not_called()

    def test_invalid_reconciliation_attempt_limit_refused(self):
        with self.assertRaisesRegex(ValueError, "At least one"):
            retention.reconcile(ordered(), attempts=0)


if __name__ == "__main__":
    main()

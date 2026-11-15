#!/usr/bin/env python3
"""Synthetic no-original test suite for P89 P79 read-return acceptance."""
from __future__ import annotations

from unittest import mock
import unittest

import r1_validate_passive_record0_return as target


class PassiveReturnTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data = bytearray(9015508)
        payload = bytes((i * 37 + 9) & 255 for i in range(1506))
        data[target.PAYLOAD_ABSOLUTE:target.PAYLOAD_ABSOLUTE+1506] = payload
        cls.data = bytes(data)
        cls.payload = payload
        cls.tsv = "DATA.MK3\t732662\t1506\t1506\t1\t0180\t1234\t00081234\t1\t1\n"

    def good(self, data=None, raw=None, tsv=None):
        with mock.patch.object(target, "DATA_SHA256", target.digest(self.data)):
            with mock.patch.object(target, "PAYLOAD_SHA256", target.digest(self.payload)):
                return target.validate(
                    self.data if data is None else data,
                    self.payload if raw is None else raw,
                    self.tsv if tsv is None else tsv)

    def test_valid_original_copy_and_guest_parity(self):
        r = self.good()
        self.assertEqual(r["status"], "VERIFIED_SOURCE_READ_RETURN_AND_GUEST_COPY")
        self.assertEqual(r["observations"][0]["actualBytesReturned"], 1506)
        self.assertFalse(r["nativeDecompressorVerified"])
        self.assertFalse(r["indexedPixelOutputVerified"])

    def test_wrong_guest_bytes_refused(self):
        with self.assertRaisesRegex(ValueError, "differs"):
            self.good(raw=b"X" + self.payload[1:])

    def test_partial_read_cannot_be_accepted(self):
        with self.assertRaisesRegex(ValueError, "incomplete"):
            self.good(tsv=self.tsv.replace("\t1506\t1\t0180", "\t1505\t1\t0180"))

    def test_failure_return_cannot_be_accepted(self):
        with self.assertRaisesRegex(ValueError, "incomplete"):
            self.good(tsv=self.tsv.replace("\t1506\t1\t0180", "\t1506\t0\t0180"))

    def test_failed_guest_parity_refused(self):
        with self.assertRaisesRegex(ValueError, "incomplete"):
            self.good(tsv=self.tsv.replace("\t1\t1\n", "\t0\t1\n"))

    def test_no_binary_capture_refused(self):
        with self.assertRaisesRegex(ValueError, "incomplete"):
            self.good(tsv=self.tsv.replace("\t1\t1\n", "\t1\t0\n"))

    def test_mismatched_source_offset_refused(self):
        with self.assertRaisesRegex(ValueError, "unexpected offset"):
            self.good(tsv=self.tsv.replace("\t732662\t", "\t732663\t"))

    def test_different_source_rejected(self):
        bad = bytearray(self.data)
        bad[0] = 1
        with self.assertRaisesRegex(ValueError, "not canonical"):
            self.good(data=bytes(bad))

    def test_malformed_tsv_refused(self):
        with self.assertRaisesRegex(ValueError, "malformed"):
            self.good(tsv="whatever\n")

    def test_multiple_observations_cannot_hide_incomplete_return(self):
        partial = self.tsv.replace("\t1506\t1\t0180", "\t0\t0\t0180")
        with self.assertRaisesRegex(ValueError, "incomplete"):
            self.good(tsv=self.tsv + partial)

    def test_private_existing_capture_entry_accepted(self):
        r = self.good(tsv=self.tsv.replace("\t1\t1\n", "\t1\t2\n"))
        self.assertEqual(r["observations"][0]["privateRawCaptureStatus"], 2)

    def test_payload_hash_mismatch_rejected(self):
        with mock.patch.object(target, "PAYLOAD_SHA256", "0"*64):
            with mock.patch.object(target, "DATA_SHA256", target.digest(self.data)):
                with self.assertRaisesRegex(ValueError, "fingerprint mismatch"):
                    target.validate(self.data, self.payload, self.tsv)


if __name__ == "__main__":
    unittest.main(verbosity=2)

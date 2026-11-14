#!/usr/bin/env python3
"""P89 R1 raw-memory source-anchor matcher: synthetic-only tests."""
from __future__ import annotations

import hashlib
import struct
import tempfile
import unittest
from pathlib import Path

import r1_runtime_source_witness as subject


def synthetic_source():
    data = bytearray(9015508)
    start = subject.START
    struct.pack_into("<HHH", data, start, 216, 320, 200)
    struct.pack_into("<II", data, start+774, 0, 64000)
    cursor = start + 782 + 64000
    ordinal_0 = None
    for index in range(216):
        if 120 <= index <= 125:
            payload = b""
        elif index == 0:
            payload = bytes(range(1, 97))
            ordinal_0 = cursor+14
        elif index == 215:
            payload = b"\xfe" * (subject.END - cursor - 14)
        else:
            payload = b"\xff"*64
        assert cursor+14+len(payload) <= subject.END
        struct.pack_into("<HIII", data, cursor, 3, 0, 0 if not payload else 64000, len(payload))
        data[cursor+14:cursor+14+len(payload)] = payload
        cursor += 14+len(payload)
    assert cursor == subject.END
    assert ordinal_0 is not None
    return bytes(data), ordinal_0


class WitnessTests(unittest.TestCase):
    def refused(self, fn):
        with self.assertRaises((ValueError, struct.error)):
            fn()

    def test_positive_source_marker_in_private_capture(self):
        data, p = synthetic_source()
        result = subject.analyze(data, b"START" + data[p:p+48] + b"END", (0,))
        self.assertEqual(result["status"], "RAW_INPUT_BUFFER_WITNESSED")
        self.assertEqual(result["anchors"][0]["captureMatchOffsets"], [5])
        self.assertEqual(result["matchingRecords"], 1)
        self.assertFalse(result["originalDecoderRoutineVerified"])
        self.assertFalse(result["originalOutputPixelsVerified"])
        self.assertEqual(result["newContinuationImagesVerified"], 0)
        self.assertNotIn("signature", result["anchors"][0])
        self.assertEqual(result["sourceDataSha256"], hashlib.sha256(data).hexdigest())

    def test_source_anchor_only_is_not_a_runtime_witness(self):
        data, p = synthetic_source()
        result = subject.analyze(data, None, (0,))
        self.assertEqual(result["status"], "SOURCE_ANCHORS_ONLY")
        self.assertIsNone(result["captureSha256"])
        self.assertFalse(result["anchors"][0]["captureMatchOffsets"])

    def test_wrong_capture_is_not_decoder_evidence(self):
        data, p = synthetic_source()
        result = subject.analyze(data, b"NOT THE INPUT RECORD", (0,))
        self.assertEqual(result["status"], "SOURCE_ANCHORS_NOT_OBSERVED")
        self.assertEqual(result["matchingRecords"], 0)

    def test_repeated_marker_locations_preserved(self):
        token = bytes(range(1,49))
        self.assertEqual(subject.locate(token + b"A" + token, token), [0,49])

    def test_ambiguous_repetitions_refused(self):
        self.refused(lambda: subject.locate(b"x"*100, b"x"*16, max_locations=5))

    def test_signature_content_not_printed_in_report(self):
        data, p = synthetic_source()
        result = subject.analyze(data, b"START" + data[p:p+48] + b"END", (0,))
        import json
        self.assertNotIn(data[p:p+48].hex(), json.dumps(result))
        self.assertIn("signatureSha256", json.dumps(result))

    def test_duplicate_source_token_refused(self):
        payload = bytes(range(1,49))
        self.refused(lambda: subject.select_anchor(payload+payload, payload, 0))

    def test_low_entropy_tokens_refused(self):
        self.refused(lambda: subject.select_anchor(b"X"*200, b"X"*100, 0))

    def test_empty_ordinal_refused(self):
        data, p = synthetic_source()
        self.refused(lambda: subject.analyze(data, b"", (120,)))

    def test_bad_ordinal_refused(self):
        data, p = synthetic_source()
        self.refused(lambda: subject.analyze(data, b"", (216,)))

    def test_duplicate_ordinals_refused(self):
        data, p = synthetic_source()
        self.refused(lambda: subject.analyze(data, b"", (0,0)))

    def test_empty_selection_refused(self):
        data, p = synthetic_source()
        self.refused(lambda: subject.analyze(data, b"", ()))

    def test_input_file_is_not_memory_dump(self):
        data, p = synthetic_source()
        self.refused(lambda: subject.analyze(data, data, (0,)))

    def test_source_header_tamper_refused(self):
        data, p = synthetic_source()
        b = bytearray(data)
        struct.pack_into("<H", b, subject.START, 215)
        self.refused(lambda: subject.analyze(bytes(b), b"", (0,)))

    def test_source_truncation_refused(self):
        data, p = synthetic_source()
        self.refused(lambda: subject.analyze(data[:-1], b"", (0,)))

    def test_capture_signature_length_guard(self):
        self.refused(lambda: subject.locate(b"a"*12, b"a"*12))

    def test_unknown_original_identity_rejected(self):
        data, p = synthetic_source()
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "DATA.MK3"
            f.write_bytes(data)
            self.refused(lambda: subject.source_file(f))


if __name__ == "__main__":
    unittest.main(verbosity=2)

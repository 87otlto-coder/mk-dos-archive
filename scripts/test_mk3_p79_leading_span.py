"""Synthetic controls for exact P79 boundaries, empty records and failure paths."""
import struct
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from mk3_p79_leading_span import export, parse_span


def fixture():
    return (struct.pack("<HHH", 2, 3, 2) + bytes(range(256))*3 +
            struct.pack("<II", 0, 6) + bytes(range(6)) +
            struct.pack("<HIII", 3, 1, 6, 2) + b"AB" + struct.pack("<HIII", 3, 0, 0, 0))


class LeadingSpanTests(unittest.TestCase):
    def test_partition_and_empty_record(self):
        span = fixture()
        manifest, entries = parse_span(span, 100)
        parts = manifest["sourceParts"]
        self.assertEqual(b"".join(dict(entries)[p["path"]] for p in parts), span)
        for part in parts:
            start = part["offset"] - 100
            self.assertEqual(dict(entries)[part["path"]], span[start:start+part["length"]])
        self.assertEqual([p["payloadLength"] for p in parts[4:]], [2, 0])
        self.assertEqual(dict(entries)["base-indices.bin"], bytes(range(6)))

    def test_truncated_and_trailing(self):
        span = fixture()
        for bad in [span[:700], span[:783], span[:-15], span[:-1], span+b"X"]:
            with self.subTest(size=len(bad)), self.assertRaises(ValueError):
                parse_span(bad, 0)

    def test_corrupt_fields(self):
        for offset, replacement in [(0, 1), (2, 0), (774, 3), (778, 5),
                                    (788, 2), (798, 255), (806, 1)]:
            span = bytearray(fixture())
            span[offset] = replacement
            with self.subTest(offset=offset), self.assertRaises(ValueError):
                parse_span(span, 0)

    def test_wrong_source_never_creates_export(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root/"DATA.MK3").write_bytes(fixture())
            with self.assertRaisesRegex(ValueError, "fingerprint"):
                export(root, root/"out.zip")
            self.assertFalse((root/"out.zip").exists())


if __name__ == "__main__":
    unittest.main()

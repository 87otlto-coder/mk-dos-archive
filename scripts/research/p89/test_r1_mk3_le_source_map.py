#!/usr/bin/env python3
"""P89 R1 synthetic DOS4GW LE source-map controls; no game bytes."""
from __future__ import annotations

from pathlib import Path
import struct
import tempfile
import unittest

import r1_mk3_le_source_map as subject


def synthetic_exe():
    head = 0x100
    page_data = 0x400
    page_size = 4096
    src = bytearray(page_data + 3 * page_size)
    src[head:head+len(subject.LE_SIGNATURE)] = subject.LE_SIGNATURE
    for offset, value in {
        0x14: 3,       # total file-backed LE pages
        0x18: 1,       # entry object
        0x1c: 0x1234,  # mapped entry offset, second page
        0x28: page_size,
        0x2c: page_size,
        0x40: 0xc4,
        0x44: 2,
        0x48: 0xf4,
        0x80: page_data,  # page-data start is absolute file offset
    }.items():
        struct.pack_into("<I", src, head + offset, value)
    struct.pack_into("<IIIIII", src, head+0xc4,
                     2*4096-2, 0x10000, 0x2045, 1, 2, 0)
    # The object has 4096 *file-backed* bytes but 6000 virtual bytes;
    # the rest is zero-fill, not another mapped page.
    struct.pack_into("<IIIIII", src, head+0xc4+24,
                     6000, 0xB0000, 0x2043, 3, 1, 0)
    for index in range(3):
        src[head+0xf4+index*4:head+0xf8+index*4] = (index+1).to_bytes(3, "big")+b"\x00"
    return src


class SourceMapTests(unittest.TestCase):
    def reject(self, value):
        with self.assertRaises((ValueError, struct.error)):
            subject.parse_source_map(bytes(value), canonical=False)

    def test_synthetic_metadata(self):
        r = subject.parse_source_map(bytes(synthetic_exe()), canonical=False)
        self.assertEqual(r["leHeaderFileOffset"], 0x100)
        self.assertEqual(r["entryPoint"]["originalFileOffset"], 0x400+0x1000+0x234)
        self.assertEqual(r["entryPoint"]["virtualAddress"], 0x11234)
        self.assertEqual([o["mappedPageCount"] for o in r["objects"]], [2, 1])
        self.assertEqual([o["virtualZeroFillBytes"] for o in r["objects"]], [0, 1904])
        self.assertEqual(r["declaredPageCount"], 3)
        self.assertFalse(r["qualifiedP79DecompressionRoutine"])
        self.assertEqual(r["newDecodedP79Records"], 0)
        self.assertTrue(r["noOriginalSourceBytesExported"])

    def test_only_original_canonical_accepted_in_real_mode(self):
        self.reject_canonical(synthetic_exe())

    def reject_canonical(self, value):
        with self.assertRaises((ValueError, struct.error)):
            subject.parse_source_map(bytes(value), canonical=True)

    def test_no_header_refused(self):
        b = synthetic_exe()
        b[0x100] = 0
        self.reject(b)

    def test_duplicate_header_refused(self):
        b = synthetic_exe()
        b[0x200:0x200+len(subject.LE_SIGNATURE)] = subject.LE_SIGNATURE
        self.reject(b)

    def test_invalid_page_size_refused(self):
        b = synthetic_exe()
        struct.pack_into("<I", b, 0x100+0x28, 2048)
        self.reject(b)

    def test_truncated_file_backed_page_refused(self):
        self.reject(synthetic_exe()[:-1])

    def test_object_count_zero_refused(self):
        b = synthetic_exe()
        struct.pack_into("<I", b, 0x100+0x44, 0)
        self.reject(b)

    def test_duplicate_source_page_refused(self):
        b = synthetic_exe()
        b[0x100+0xfc:0x100+0x100] = b"\x00\x00\x01\x00"
        self.reject(b)

    def test_unmapped_source_page_refused(self):
        b = synthetic_exe()
        b[0x100+0xfc:0x100+0x100] = b"\x00\x00\x04\x00"
        self.reject(b)

    def test_unsupported_page_flag_refused(self):
        b = synthetic_exe()
        b[0x100+0xf4+3] = 1
        self.reject(b)

    def test_bad_object_page_range_refused(self):
        b = synthetic_exe()
        struct.pack_into("<I", b, 0x100+0xc4+12, 3)
        self.reject(b)

    def test_reserved_object_word_refused(self):
        b = synthetic_exe()
        struct.pack_into("<I", b, 0x100+0xc4+20, 1)
        self.reject(b)

    def test_entry_point_in_bss_refused(self):
        b = synthetic_exe()
        struct.pack_into("<I", b, 0x100+0x18, 2)
        struct.pack_into("<I", b, 0x100+0x1c, 5000)
        self.reject(b)

    def test_entry_point_past_virtual_size_refused(self):
        b = synthetic_exe()
        struct.pack_into("<I", b, 0x100+0x1c, 9000)
        self.reject(b)

    def test_unknown_executable_hash_refused(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "MK3.EXE"
            path.write_bytes(bytes(synthetic_exe()))
            with self.assertRaises(ValueError):
                subject.input_exe(path)

    def test_page_map_reordering_preserved(self):
        b = synthetic_exe()
        b[0x100+0xf4:0x100+0xfc] = b"\x00\x00\x02\x00\x00\x00\x01\x00"
        r = subject.parse_source_map(bytes(b), canonical=False)
        self.assertEqual(r["entryPoint"]["originalFileOffset"], 0x400+0x234)

    def test_unmapped_extra_file_bytes_do_not_change_page_map(self):
        b = synthetic_exe()
        b.extend(b"nonoriginalsynthetictrailingtest")
        r = subject.parse_source_map(bytes(b), canonical=False)
        self.assertEqual(r["entryPoint"]["originalFileOffset"], 0x400+0x1000+0x234)


if __name__ == "__main__":
    unittest.main(verbosity=2)

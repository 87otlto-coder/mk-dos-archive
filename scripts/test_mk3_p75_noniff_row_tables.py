#!/usr/bin/env python3
"""P75 source-only negative and positive controls; no commercial game bytes."""
import struct
import tempfile
import unittest
from pathlib import Path

import mk3_p75_noniff_row_tables as p75
from verify_mk3_p75_noniff_independent import independent_row_decode


def signed(v):return struct.pack('<h',v)


def region(x=(2,-1,6),offs=None,first_tail=b'\xa4',raw_rem=b'EXTRA_SOURCE_UNDER_RESEARCH',
           first_row=None,second_row=None,width=10,height=3):
    if first_row is None:first_row=signed(3)+b'\x04\x05\x06'+signed(0)
    if second_row is None:second_row=signed(2)+b'\x07\x08'+signed(0)
    stream=first_row+second_row+first_tail
    h=bytearray(24)
    struct.pack_into('<HH',h,0,width,height)
    struct.pack_into('<I',h,20,len(stream))
    if offs is None:offs=(0,0,len(first_row))
    return (bytes(h)+bytes(range(256))*3+stream+
            struct.pack('<'+str(len(x))+'i',*x)+
            struct.pack('<'+str(len(offs))+'I',*offs)+raw_rem)


class P75RowTests(unittest.TestCase):
    def test_sparse_source_row_table_recovers_painted_coordinates(self):
        d=region();r=p75.reconstruct_region(d,0,len(d))
        idx=r['indices'];mask=r['mask']
        self.assertEqual((r['width'],r['height']),(10,3))
        self.assertEqual((r['sourceRowsWithPackedData'],r['sourceMinusOneRowsWithoutPackedData']),(2,1))
        self.assertEqual(r['paintedPixels'],5)
        self.assertEqual(idx[2:5],b'\x04\x05\x06')
        self.assertEqual(idx[10:20],bytes(10))
        self.assertEqual(idx[26:28],b'\x07\x08')
        self.assertEqual(mask[2:5],b'\x01\x01\x01')
        self.assertEqual(mask[10:20],bytes(10))
        self.assertEqual(mask[26:28],b'\x01\x01')
        self.assertEqual(r['firstStreamUnexplainedTrailingByteHex'],'a4')
        self.assertEqual(r['sourceAfterRowTablesLength'],len(b'EXTRA_SOURCE_UNDER_RESEARCH'))

    def test_independent_row_decoder_matches_original_planes(self):
        d=region();r=p75.reconstruct_region(d,0,len(d))
        xs=struct.unpack_from('<3i',d,r['sourceRowXTableOffset'])
        offs=struct.unpack_from('<3I',d,r['sourceRowCompressedOffsetTableOffset'])
        idx,mask,painted,present,tail=independent_row_decode(
            d,r['sourceCompressedFirstStreamOffset'],r['sourceCompressedFirstStreamLength'],
            10,3,xs,offs)
        self.assertEqual((idx,mask,painted,present,tail),
                         (r['indices'],r['mask'],5,2,b'\xa4'))

    def test_absent_row_does_not_eat_source_data(self):
        d=region(x=(-1,-1,6))
        with self.assertRaisesRegex(ValueError,'first recorded physical row'):
            p75.reconstruct_region(d,0,len(d))

    def test_nonzero_stream_offset_on_source_absent_row_refused(self):
        d=region(offs=(0,3,7))
        with self.assertRaisesRegex(ValueError,'absent source row'):
            p75.reconstruct_region(d,0,len(d))

    def test_source_sentinel_other_than_minus_one_refused(self):
        d=region(x=(2,-2,6))
        with self.assertRaisesRegex(ValueError,'unsupported row X value'):
            p75.reconstruct_region(d,0,len(d))

    def test_active_stream_pointers_must_increase(self):
        d=region(offs=(0,0,0))
        with self.assertRaisesRegex(ValueError,'row pointers must increase'):
            p75.reconstruct_region(d,0,len(d))

    def test_missing_first_stream_start_refused(self):
        d=region(offs=(2,0,7))
        with self.assertRaisesRegex(ValueError,'first recorded physical row'):
            p75.reconstruct_region(d,0,len(d))

    def test_unbounded_first_stream_refused(self):
        d=bytearray(region());struct.pack_into('<I',d,20,len(d))
        with self.assertRaisesRegex(ValueError,'stream exceeds source region'):
            p75.reconstruct_region(bytes(d),0,len(d))

    def test_row_width_invalid_refused(self):
        d=region(x=(9,-1,6))
        with self.assertRaisesRegex(ValueError,'pixel run exceeds source width'):
            p75.reconstruct_region(d,0,len(d))

    def test_literal_crossing_physical_row_pointer_refused(self):
        d=region(offs=(0,0,3))
        with self.assertRaisesRegex(ValueError,'literal exceeds row pointer boundary'):
            p75.reconstruct_region(d,0,len(d))

    def test_missing_terminator_refused(self):
        first=signed(3)+b'\x04\x05\x06'
        d=region(first_row=first,offs=(0,0,len(first)))
        with self.assertRaisesRegex(ValueError,'lacks a terminator'):
            p75.reconstruct_region(d,0,len(d))

    def test_invalid_skip_extent_refused(self):
        first=signed(-11)+signed(0)
        d=region(first_row=first,offs=(0,0,len(first)))
        with self.assertRaisesRegex(ValueError,'transparent skip exceeds source width'):
            p75.reconstruct_region(d,0,len(d))

    def test_two_trailing_bytes_refused(self):
        d=region(first_tail=b'\x10\x20')
        with self.assertRaisesRegex(ValueError,'unsupported data after terminator'):
            p75.reconstruct_region(d,0,len(d))

    def test_single_nonzero_tail_refused_if_not_last_row(self):
        first=signed(3)+b'\x04\x05\x06'+signed(0)+b'\xa4'
        d=region(first_row=first,first_tail=b'',offs=(0,0,len(first)))
        with self.assertRaisesRegex(ValueError,'unsupported data after terminator'):
            p75.reconstruct_region(d,0,len(d))

    def test_foreign_source_fingerprint_refused(self):
        with self.assertRaisesRegex(ValueError,'unsupported DATA.MK3 source SHA-256'):
            p75.extract(region())

    def test_empty_or_out_of_bounds_row_left_refused(self):
        d=region(x=(10,-1,6))
        with self.assertRaisesRegex(ValueError,'unsupported row X value'):
            p75.reconstruct_region(d,0,len(d))
        d=region(width=0)
        with self.assertRaisesRegex(ValueError,'out-of-bounds source dimensions'):
            p75.reconstruct_region(d,0,len(d))

    def test_row_metadata_counts_follow_explicit_painted_mask(self):
        d=region(first_tail=b'');r=p75.reconstruct_region(d,0,len(d))
        self.assertEqual(sum(r['mask']),r['paintedPixels'])
        self.assertEqual(r['sourceAfterRowTablesOffset']+r['sourceAfterRowTablesLength'],len(d))
        self.assertEqual(r['firstStream'],d[792:792+len(r['firstStream'])])

if __name__=='__main__':unittest.main(verbosity=2)

#!/usr/bin/env python3
"""P74 synthetic decode/source refusal controls, no original game bytes."""
import importlib.util
from pathlib import Path
import struct
import unittest

DIR=Path(__file__).parent

def load(name):
    spec=importlib.util.spec_from_file_location(name,DIR/(name+'.py'))
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

p74=load('mk3_p74_noniff_indexed_graphics')
independent=load('verify_mk3_p74_noniff_independent')


def cmd(n:int,content=b'')->bytes:
    return struct.pack('<h',n) + content


def frame(rows=None,width=5,height=2,tail=b'\x55',prefix=None,palette=None,stream_size=None):
    if rows is None:
        rows=[cmd(2,b'\x07\x08')+cmd(-1)+cmd(2,b'\x09\x0a')+cmd(0),
              cmd(-2)+cmd(3,b'\x01\x02\x03')+cmd(0)]
    stream=b''.join(rows)+tail
    head=bytearray(prefix if prefix is not None else bytes(24))
    struct.pack_into('<HH',head,0,width,height)
    struct.pack_into('<I',head,20,len(stream) if stream_size is None else stream_size)
    return bytes(head)+(bytes(256)*3 if palette is None else palette)+stream+b'UNDECODABLE_REMAINDER'


class P74Tests(unittest.TestCase):
    def test_complete_first_stream_exact_index_mask_and_original_byte_offsets(self):
        x=frame();q=p74.decode_first_stream(x,0,len(x))
        self.assertTrue(q['fullFirstImageReconstruction'])
        self.assertEqual((q['width'],q['height'],q['explicitDecodedRows']),(5,2,2))
        self.assertEqual(q['indexedBytes'],bytes([7,8,0,9,10,0,0,1,2,3]))
        self.assertEqual(q['maskBytes'],bytes([1,1,0,1,1,0,0,1,1,1]))
        self.assertEqual(q['firstStreamUnparsedTrailingByteHex'],'55')
        self.assertGreater(q['sourceBytesAfterFirstStream'],0)
        self.assertEqual(q['sourceFirstStreamRleBytes'],x[792:792+q['sourceFirstStreamLength']])

    def test_truncated_rows_preserve_unresolved_count_and_no_implicit_transparency(self):
        first=cmd(3,b'\x01\x02\x03')+cmd(0)
        q=p74.decode_first_stream(frame([first],height=2,tail=b''),0,len(frame([first],height=2,tail=b'')))
        self.assertFalse(q['fullFirstImageReconstruction'])
        self.assertEqual((q['explicitDecodedRows'],q['unresolvedTrailingRows']),(1,1))
        self.assertEqual(q['maskBytes'][5:],bytes(5))

    def test_negative_skip_overflow_refused(self):
        x=frame([cmd(-6)+cmd(0)],height=1,tail=b'')
        with self.assertRaisesRegex(ValueError,'transparent skip beyond'):p74.decode_first_stream(x,0,len(x))

    def test_positive_run_exceeds_width_refused(self):
        x=frame([cmd(6,b'123456')+cmd(0)],height=1,tail=b'')
        with self.assertRaisesRegex(ValueError,'literal exceeds source row width'):p74.decode_first_stream(x,0,len(x))

    def test_truncated_literal_refused(self):
        x=frame([cmd(4,b'xy')],height=1,tail=b'')
        with self.assertRaisesRegex(ValueError,'literal exceeds declared first stream'):p74.decode_first_stream(x,0,len(x))

    def test_row_terminator_missing_refused(self):
        x=frame([cmd(2,b'12')],height=1,tail=b'')
        with self.assertRaisesRegex(ValueError,'unterminated source row'):p74.decode_first_stream(x,0,len(x))

    def test_trailing_more_than_one_byte_refused(self):
        x=frame(tail=b'\x03\x04')
        with self.assertRaisesRegex(ValueError,'unexplained remaining compressed bytes'):p74.decode_first_stream(x,0,len(x))

    def test_trailing_unknown_single_byte_kept_not_reinterpreted(self):
        for b in (0,4,85,255):
            x=frame(tail=bytes((b,)))
            self.assertEqual(p74.decode_first_stream(x,0,len(x))['firstStreamUnparsedTrailingByteHex'],f'{b:02x}')

    def test_declared_size_beyond_source_region_refused(self):
        x=frame(stream_size=50000)
        with self.assertRaisesRegex(ValueError,'declared stream escapes'):p74.decode_first_stream(x,0,len(x))

    def test_source_geometry_overflow_refused(self):
        x=frame(width=0)
        with self.assertRaisesRegex(ValueError,'bounded original two-word dimensions'):p74.decode_first_stream(x,0,len(x))
        x=frame(width=2000,height=2000)
        with self.assertRaisesRegex(ValueError,'bounded original two-word dimensions'):p74.decode_first_stream(x,0,len(x))

    def test_invalid_region_extent_refused(self):
        x=frame()
        with self.assertRaisesRegex(ValueError,'source region extent'):p74.decode_first_stream(x,1,len(x))

    def test_index_color_cannot_relabel_native_palette_and_transparency_remains_zero(self):
        idx=b'\x01\x02';mask=b'\x01\x00';pal=bytearray(768);pal[3:6]=b'\x10\x20\x30'
        self.assertEqual(p74.rgba_from_planes(idx,mask,bytes(pal)),b'\x10\x20\x30\xff\0\0\0\0')
        self.assertEqual(p74.rgba_from_planes(idx,mask),bytes((33,33,33,255,0,0,0,0)))

    def test_mask_binary_guard(self):
        with self.assertRaisesRegex(ValueError,'mask must be binary'):p74.rgba_from_planes(b'\x01',b'\x02')

    def test_png_independent_pixel_byte_readback(self):
        rgba=bytes((1,2,3,255,0,0,0,0))
        zipped=p74.png_rgba(2,1,rgba)
        self.assertEqual(independent.png_readback(zipped),(2,1,rgba))

    def test_png_truncated_or_crc_tamper_rejected(self):
        buf=bytearray(p74.png_rgba(1,1,b'\x01\x02\x03\xff'))
        buf[30]^=1
        with self.assertRaisesRegex(ValueError,'CRC mismatch'):independent.png_readback(bytes(buf))
        with self.assertRaisesRegex(ValueError,'incomplete|truncated'):independent.png_readback(bytes(buf[:14]))

    def test_foreign_source_fingerprint_rejected_in_canonical_mode(self):
        with self.assertRaisesRegex(ValueError,'original DATA.MK3 SHA-256 not recognized'):
            p74.extract(frame())

    def test_partial_source_export_provenance_without_opaque_padded_claim(self):
        # A canonical-looking IFF followed by a single one-row first stream.
        fake_pal=bytes(range(256))*3
        iff=b'PBM '
        def sub(tag,payload):return tag+struct.pack('>I',len(payload))+payload+(b'\0' if len(payload)&1 else b'')
        chunk=iff+sub(b'BMHD',bytes(20))+sub(b'CMAP',fake_pal)+sub(b'BODY',b'\x01')
        form=b'FORM'+struct.pack('>I',len(chunk))+chunk
        data=b'X'*20+form+frame([cmd(1,b'\x05')+cmd(0)],height=2,tail=b'')
        report,entries=p74.extract(data,canonical=False)
        self.assertEqual(report['partialFirstImageCount'],1)
        self.assertEqual(report['fullFirstImageCount'],0)
        names=[a for a,_ in entries]
        self.assertNotIn('region-01/original-indexed-pixels.bin',names)
        self.assertNotIn('region-01/experimental-source-adjacent-rgb8-comparison.png',names)
        self.assertIn('region-01/original-first-stream.bin',names)
        self.assertFalse(report['newCanonicalNativeFighterPaletteOwnershipClaimed'])


if __name__=='__main__':unittest.main(verbosity=2)

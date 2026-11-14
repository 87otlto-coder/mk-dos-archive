#!/usr/bin/env python3
"""Original-free P89 R1 source-format discriminator controls."""
import struct
import unittest

import r1_payload_discriminators as subject


def invented(count=3):
    stream = bytearray(struct.pack('<HHH', count, 2, 2))
    stream.extend(b'\x00' * 768)
    stream.extend(struct.pack('<II', 0, 4))
    stream.extend(bytes((0, 1, 2, 3)))
    entries = [
        (3, 1, 2, b'\x80\x81\x00'),
        (3, 0, 4, b'\x80\x81\x00'),
        (3, 0, 0, b''),
    ]
    offsets=[]
    for tag, a, b, payload in entries[:count]:
        offsets.append(len(stream))
        stream.extend(struct.pack('<HIII', tag, a, b, len(payload)))
        stream.extend(payload)
    return stream, offsets


class R1Discriminators(unittest.TestCase):
    def refused(self, action):
        with self.assertRaises((ValueError, struct.error)):
            action()

    def test_positive_synthetic(self):
        span, offsets = invented()
        r = subject.examine_span(bytes(span), source_start=0, canonical=False)
        self.assertEqual(r['counts']['records'], 3)
        self.assertEqual(r['counts']['emptyOrdinals'], [2])
        self.assertEqual(r['observations'][0]['originalHeaderOffset'], offsets[0])
        self.assertEqual(r['counts']['distinctNonemptyPayloadHashes'], 1)
        self.assertEqual(r['nativeFramesVerified'], 0)
        self.assertFalse(r['paletteOwnershipVerified'])
        self.assertTrue(r['declaredFieldDifferencesAreHypotheticalOutputBounds'])

    def test_canonical_refuses_synthetic(self):
        span, _ = invented()
        self.refused(lambda: subject.examine_span(span, source_start=0, canonical=True))

    def test_short_source_refused(self):
        self.refused(lambda: subject.examine_span(bytes(7), source_start=0, canonical=False))

    def test_bad_base_size_refused(self):
        span, _ = invented()
        struct.pack_into('<I', span, 778, 5)
        self.refused(lambda: subject.examine_span(span, source_start=0, canonical=False))

    def test_wrong_record_tag_refused(self):
        span, pos = invented()
        struct.pack_into('<H', span, pos[0], 4)
        self.refused(lambda: subject.examine_span(span, source_start=0, canonical=False))

    def test_oversized_record_length_refused(self):
        span, pos = invented()
        struct.pack_into('<I', span, pos[0] + 10, 0xffffffff)
        self.refused(lambda: subject.examine_span(span, source_start=0, canonical=False))

    def test_empty_record_nonzero_fields_refused(self):
        span, pos = invented()
        struct.pack_into('<I', span, pos[2] + 2, 1)
        self.refused(lambda: subject.examine_span(span, source_start=0, canonical=False))

    def test_unaccounted_extra_source_bytes_refused(self):
        span, _ = invented()
        span.extend(b'\xaa')
        self.refused(lambda: subject.examine_span(span, source_start=0, canonical=False))

    def test_truncated_record_payload_refused(self):
        span, _ = invented()
        self.refused(lambda: subject.examine_span(span[:-1], source_start=0, canonical=False))

    def test_truncated_last_header_refused(self):
        span, pos = invented()
        self.refused(lambda: subject.examine_span(span[:pos[-1]+8], source_start=0, canonical=False))

    def test_packbits_not_assumed_output(self):
        result = subject.packbits_count(b'\x80\x81\x00')
        self.assertEqual(result, {'status':'PARSED','producedPositions':128})
        self.assertNotEqual(result['producedPositions'], 4)

    def test_packbits_truncated_literal(self):
        self.assertEqual(subject.packbits_count(b'\x05\x07')['status'], 'TRUNCATED_LITERAL')

    def test_packbits_truncated_repeat(self):
        self.assertEqual(subject.packbits_count(b'\xff')['status'], 'TRUNCATED_REPEAT')

    def test_escape_stream_count_is_diagnostic_only(self):
        self.assertEqual(subject.naive_escape_count(b'\x80\x81\x00')['producedPositions'],129)

    def test_escape_truncated(self):
        self.assertEqual(subject.naive_escape_count(b'\x80\x81')['status'], 'TRUNCATED_ESCAPE')

    def test_new_source_fingerprint_required(self):
        from pathlib import Path
        from tempfile import TemporaryDirectory
        with TemporaryDirectory() as work:
            path = Path(work) / 'DATA.MK3'
            path.write_bytes(b'not the original')
            self.refused(lambda: subject.source_file(path))


if __name__ == '__main__':
    unittest.main(verbosity=2)

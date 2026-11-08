#!/usr/bin/env python3
"""Source-only P73 false provenance and source-plane audit tests (no game bytes)."""
import hashlib
import importlib.util
from pathlib import Path
import struct
import tempfile
import unittest
import zipfile

SCRIPT = Path(__file__).with_name('mk3_p73_noniff_palette_candidates.py')
spec = importlib.util.spec_from_file_location('mk3_p73', SCRIPT)
p73 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p73)


def iff(palette: bytes, *, include_body: bool = True, bad_cmap: bool = False) -> bytes:
    def sub(tag, payload):
        return tag + struct.pack('>I', len(payload)) + payload + (b'\0' if len(payload) & 1 else b'')
    content = b'PBM ' + sub(b'BMHD', bytes(20)) + sub(b'CMAP', palette[:-1] if bad_cmap else palette)
    if include_body:
        content += sub(b'BODY', b'\1\2')
    return b'FORM' + struct.pack('>I', len(content)) + content


def fake_source(palette, second=None):
    # The first gap is deliberately not classified. The second gap has the
    # observed prefix/table geometry, but no claimed runtime meaning.
    intro = b'INDEPENDENT_NON_IFF_UNPARSED_BYTES' * 2
    header = struct.pack('<HH', 320, 200) + bytes(20)
    return intro + iff(palette) + header + (palette if second is None else second) + b'UNRESOLVED_PIXELS'


class P73SourceOnlyTests(unittest.TestCase):
    def setUp(self):
        self.palette = bytes(range(256)) * 3
        self.another = bytes(reversed(range(256))) * 3

    def test_exact_source_owned_cmap_collision_does_not_promote_fighter_owner(self):
        data = fake_source(self.palette)
        r, entries = p73.audit(data, canonical=False)
        self.assertEqual((r['iffForms'], r['iffDistinctCmaps']), (1, 1))
        self.assertEqual((r['unparsedRegionCount'], r['nonIffCandidateTables']), (2, 1))
        self.assertEqual((r['candidateOccurrencesByteIdenticalToIffCmap'],
                          r['candidateDistinctTablesByteIdenticalToIffCmap']), (1, 1))
        self.assertEqual(r['candidateDistinctTablesNotFoundAsIffCmap'], 0)
        self.assertFalse(r['nativeFighterPaletteOwnershipVerified'])
        self.assertFalse(r['nativeFrameTimingOrStageMembershipVerified'])
        self.assertEqual(entries[0][1], self.palette)
        self.assertEqual(r['candidates'][0]['sourceTableOffset'],
                         len(data) - len(self.palette) - len(b'UNRESOLVED_PIXELS'))
        self.assertEqual(r['candidates'][0]['classification'], 'VERIFIED_BYTE_IDENTICAL_TO_SOURCE_IFF_CMAP')
        self.assertEqual(r['candidates'][0]['sourceTableSha256'], hashlib.sha256(self.palette).hexdigest())

    def test_unmatched_table_is_not_declared_verified_palette(self):
        r, entries = p73.audit(fake_source(self.palette, self.another), canonical=False)
        self.assertEqual(r['candidateDistinctTablesNotFoundAsIffCmap'], 1)
        self.assertEqual(r['candidateOccurrencesByteIdenticalToIffCmap'], 0)
        self.assertEqual(r['candidates'][0]['classification'], 'INFERRED_RGB8_LAYOUT_ONLY')
        self.assertEqual(entries[0][1], self.another)

    def test_fingerprint_rejects_another_installation_even_if_syntactically_valid(self):
        with self.assertRaisesRegex(ValueError, 'Unrecognized DATA.MK3 SHA-256'):
            p73.audit(fake_source(self.palette))

    def test_bad_iff_cmap_length_rejected(self):
        with self.assertRaisesRegex(ValueError, 'non-RGB8 CMAP'):
            p73.iff_forms_and_gaps(iff(self.palette, bad_cmap=True))

    def test_missing_iff_body_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Unqualified IFF image'):
            p73.iff_forms_and_gaps(iff(self.palette, include_body=False))

    def test_duplicate_iff_cmap_rejected(self):
        x = iff(self.palette)
        additional = b'CMAP' + struct.pack('>I', 768) + self.palette
        rebuilt = x[:4] + struct.pack('>I', len(x)-8+len(additional)) + x[8:] + additional
        with self.assertRaisesRegex(ValueError, 'Duplicate/non-RGB8 CMAP'):
            p73.iff_forms_and_gaps(rebuilt)

    def test_invalid_iff_form_extent_rejected(self):
        x = bytearray(iff(self.palette))
        struct.pack_into('>I', x, 4, len(x) + 100)
        with self.assertRaisesRegex(ValueError, 'Truncated/invalid IFF FORM'):
            p73.iff_forms_and_gaps(bytes(x))

    def test_noniff_short_region_no_fabricated_candidate(self):
        short = b'X'*22
        r, entries = p73.audit(b'X'*40 + iff(self.palette) + short, canonical=False)
        self.assertEqual(r['unparsedRegionCount'], 2)
        self.assertEqual(r['nonIffCandidateTables'], 0)
        self.assertEqual(entries, [])

    def test_zip_reader_requires_single_data_file(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'original-private.zip'
            with zipfile.ZipFile(p, 'w') as z:
                z.writestr('mk3/DATA.MK3', fake_source(self.palette))
            self.assertEqual(p73.read_original_data(p), fake_source(self.palette))
            with zipfile.ZipFile(p, 'a') as z:
                z.writestr('other/DATA.MK3', b'extra')
            with self.assertRaisesRegex(ValueError, 'exactly one DATA.MK3'):
                p73.read_original_data(p)

    def test_directory_reader(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'mk3'
            p.mkdir()
            (p/'DATA.MK3').write_bytes(fake_source(self.palette))
            self.assertEqual(p73.read_original_data(Path(d)), fake_source(self.palette))


if __name__ == '__main__':
    unittest.main(verbosity=2)

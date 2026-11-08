#!/usr/bin/env python3
"""P77 synthetic chain qualification and false-source controls, no game data."""
import json
import struct
import unittest
from unittest.mock import patch
import mk3_p77_chained_source_export as p77
import mk3_p73_noniff_palette_candidates as p73
from verify_mk3_p74_noniff_independent import png_readback


def fixture(width=8,height=3,first_x=2,second_x=4,trail=b'\x7f'):
    first=struct.pack('<h',2)+bytes((5,0))+struct.pack('<h',0)
    second=struct.pack('<h',-1)+struct.pack('<h',2)+bytes((9,10))+struct.pack('<h',0)
    stream=first+second+trail
    header=struct.pack('<HH',width,height)+bytes(16)+struct.pack('<I',len(stream))
    return bytearray(header+bytes(range(256))*3+stream+
                     struct.pack('<iii',first_x,-1,second_x)+
                     struct.pack('<III',0,0,len(first)))


def fake_spans(data):
    return [],[{'offset':0,'length':0},{'offset':0,'length':len(data)}]


class ChainedSourceTests(unittest.TestCase):
    def test_two_source_records_and_pngs(self):
        src=bytes(fixture())+bytes(fixture(width=9,first_x=1,second_x=3,trail=b''))
        with patch.object(p73,'iff_forms_and_gaps',side_effect=fake_spans):
            manifest,files=p77.extract(src,canonical=False)
        self.assertEqual(len(manifest['records']),2)
        self.assertEqual(manifest['sourceRecordCountByRegion'],[2])
        self.assertEqual(manifest['additionalSourceRecordsAfterP75'],1)
        self.assertEqual(len(files),18)
        r1,r2=manifest['records']
        self.assertEqual(r1['recordOffset'],0)
        self.assertEqual(r2['recordOffset'],r1['recordLength'])
        self.assertEqual(r1['sourcePaintedPixels'],4)
        self.assertEqual(r1['sourceMinusOneRows'],1)
        self.assertEqual(r2['sourceNextRecordOffset'],len(src))
        self.assertEqual(r1['nativePaletteOwnershipVerified'],False)
        self.assertEqual(r2['nativeStageOrAnimationAssociationVerified'],False)
        contents=dict(files)
        self.assertEqual(contents[r1['outputs']['sourceMappedIndices']['path']][2:4],b'\x05\x00')
        self.assertEqual(contents[r1['outputs']['sourceMappedOpacityMask']['path']][8:16],bytes(8))
        image=contents[r1['outputs']['grayscaleIndexedPreview']['path']]
        w,h,rgba=png_readback(image)
        self.assertEqual((w,h),(8,3))
        self.assertEqual(rgba[4*3+3],255,'opaque zero-index pixel')
        self.assertEqual(rgba[(8+2)*4+3],0,'absent packed source row')
        self.assertEqual(rgba[(2*8+5)*4+3],255,'positioned original literal')
        self.assertEqual(contents[r1['outputs']['sourceAdjacentUnlabeledRgb8']['path']],bytes(range(256))*3)
        self.assertNotIn('paletteRgb',r1,'adjacent candidate must not be assigned to native palette')

    def test_unrecognized_original_sha_refused(self):
        with self.assertRaisesRegex(ValueError,'original DATA.MK3 SHA'):
            p77.extract(bytes(fixture()),canonical=True)

    def test_missing_all_source_intervals_refused(self):
        with patch.object(p73,'iff_forms_and_gaps',return_value=([],[])):
            with self.assertRaisesRegex(ValueError,'missing original source regions'):
                p77.extract(bytes(fixture()),canonical=False)

    def test_record_after_valid_chain_with_garbage_refused(self):
        data=bytes(fixture())+b'unknown trailing unparsed bytes'
        with patch.object(p73,'iff_forms_and_gaps',side_effect=fake_spans):
            with self.assertRaises(ValueError):p77.extract(data,canonical=False)

    def test_missing_second_source_record_bytes_refused(self):
        data=bytes(fixture())+bytes(fixture()[:20])
        with patch.object(p73,'iff_forms_and_gaps',side_effect=fake_spans):
            with self.assertRaises(ValueError):p77.extract(data,canonical=False)

    def test_duplicate_active_source_pointer_refused(self):
        data=fixture();ptr=792+struct.unpack_from('<I',data,20)[0]+3*4
        struct.pack_into('<I',data,ptr+8,0)
        with patch.object(p73,'iff_forms_and_gaps',side_effect=fake_spans):
            with self.assertRaises(ValueError):p77.extract(bytes(data),canonical=False)

    def test_bad_second_source_record_size_refused(self):
        one=fixture();two=fixture();struct.pack_into('<I',two,20,0xffffffff)
        with patch.object(p73,'iff_forms_and_gaps',side_effect=fake_spans):
            with self.assertRaises(ValueError):p77.extract(bytes(one+two),canonical=False)

    def test_source_group_not_promoted_to_animation(self):
        data=bytes(fixture())+bytes(fixture())
        with patch.object(p73,'iff_forms_and_gaps',side_effect=fake_spans):
            manifest,_=p77.extract(data,canonical=False)
        self.assertTrue(all(r['notNativeAnimationFrameOrder'] for r in manifest['records']))
        self.assertFalse(manifest['nativeStageOrAnimationAssociationVerified'])
        self.assertFalse(manifest['applicationCatalogueModified'])
        self.assertTrue(manifest['originalNonIffFirstRegionStillUnresolved'])
        self.assertTrue(manifest['originalByteFallbackPreserved'])

    def test_distinct_source_records_retained_even_if_same_pixels(self):
        src=bytes(fixture())*2
        with patch.object(p73,'iff_forms_and_gaps',side_effect=fake_spans):
            manifest,files=p77.extract(src,canonical=False)
        self.assertNotEqual(manifest['records'][0]['recordOffset'],manifest['records'][1]['recordOffset'])
        self.assertEqual(manifest['records'][0]['recordLength'],manifest['records'][1]['recordLength'])
        self.assertEqual(len(set(name for name,_ in files)),18)

if __name__=='__main__':unittest.main(verbosity=2)

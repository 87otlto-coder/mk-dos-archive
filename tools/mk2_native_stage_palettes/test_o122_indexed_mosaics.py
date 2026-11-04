"""O122 indexed mosaic regression and adversarial contract tests (fixture-supplied)."""
import hashlib, json, struct, sys, unittest, zipfile
from pathlib import Path
from tempfile import TemporaryDirectory
from export_o122_indexed_mosaics import evidence, decode_stream, write_new
from verify_o122_independent import audit, screenshot_alignment
from trace_o121_control_bindings import load_game_files

class O122Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.exe=Path(sys.argv[-2]).read_bytes();cls.game_zip=Path(sys.argv[-1]).read_bytes()
        from io import BytesIO
        with zipfile.ZipFile(BytesIO(cls.game_zip)) as z:
            cls.game={r:z.read(next(n for n in z.namelist() if n.rsplit('/',1)[-1].upper()==r))
                      for r in ('TOMB.GRA','PORTAL.GRA','IMAGES.GRA')}
        cls.report,cls.families=evidence(cls.exe,cls.game)
        cls.o121=Path(__file__).resolve().parents[2]/'research_outputs'/'O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json'
        cls.control=Path(__file__).resolve().parents[2]/'evidence'/'mk2_o114'/'20.png'
    def test_corpus(self):
        self.assertEqual((self.report['streamCount'],self.report['setupCount'],self.report['familyCount']), (49,10,4))
    def test_corpus_three_nonoverlapping_chains(self):
        self.assertEqual({c['resourceName']:(c['decodedSprites'],c['byteSpan']) for c in self.report['chains']},
                         {'TOMB.GRA':(16,54328),'PORTAL.GRA':(13,35912),'IMAGES.GRA':(20,108720)})
    def test_portal_layer_dimensions(self):
        m=next(m for m in self.report['mosaics'] if m['family']=='portal80' and m['setupObject2Offset']==0x16526)
        self.assertEqual((m['dimensions'],m['controlEntries']),([320,168],8))
    def test_tomb_layer_dimensions(self):
        m=next(m for m in self.report['mosaics'] if m['family']=='tomb80' and m['setupObject2Offset']==0x1737c)
        self.assertEqual((m['dimensions'],m['controlEntries']),([850,224],44))
    def test_79_candidate_not_runtime_claimed(self):
        for m in self.report['mosaics']:
            if m['family'].endswith('79'):
                self.assertEqual(m['paletteIndexOrigin'],'HYPOTHESIS_ONE_BASED')
                self.assertEqual(m['resourceName'],'IMAGES.GRA')
    def test_pixel_mass_balance(self):
        for m in self.report['mosaics']:
            self.assertEqual(m['opaqueCanvasPixels']+m['transparentCanvasPixels'],m['dimensions'][0]*m['dimensions'][1])
            self.assertGreaterEqual(m['sourceOpaquePixelsVisited'],m['opaqueCanvasPixels'])
    def test_every_mosaic_png_hash(self):
        for f,layers in self.families:
            for m,p in layers:
                self.assertEqual(hashlib.sha256(p).hexdigest(),m['previewPNG_SHA256'])
    def test_control_screenshot_registered(self):
        self.assertEqual(hashlib.sha256(self.control.read_bytes()).hexdigest(),
                         '19858a54a7d9d3b09542dbcba06ff501aa29e9b9186cc07c3bbf3bdcde367f07')
    def test_bad_command_overrun(self):
        with self.assertRaisesRegex(ValueError,'overrun|crosses'):
            decode_stream(struct.pack('<I',(50<<10)|2),0,4,1)
    def test_bad_zero_run(self):
        with self.assertRaises(ValueError):decode_stream(b'\x01\x00\x00\x00',0,4,1)
    def test_bad_literal_count(self):
        with self.assertRaises(ValueError):decode_stream(struct.pack('<I',(65<<2)),0,80,1)
    def test_truncated_stream(self):
        with self.assertRaises(ValueError):decode_stream(b'\x02',0,5,1)
    def test_wrong_exe_rejected(self):
        x=bytearray(self.exe);x[0x893c6+3]^=1
        with self.assertRaises(ValueError):evidence(bytes(x),self.game)
    def test_wrong_gra_rejected(self):
        g=dict(self.game);x=bytearray(g['PORTAL.GRA']);x[3500]^=1;g['PORTAL.GRA']=bytes(x)
        with self.assertRaises(ValueError):evidence(self.exe,g)
    def test_exclusive_output(self):
        with TemporaryDirectory() as td:
            file=Path(td)/'test.bin';write_new(file,b'ABC')
            with self.assertRaises(ValueError):write_new(file,b'DEF')
            self.assertEqual(file.read_bytes(),b'ABC')
    def test_independent_audit(self):
        out=audit(self.exe,self.game_zip,self.o121.read_bytes(),json.dumps(self.report).encode(),self.control)
        self.assertEqual(out['status'],'INDEPENDENT_PASS')
        self.assertEqual(out['portalGameplayControl']['exactRGBMatches'],2151)
        self.assertEqual(out['decodedSprites'],49)
    def test_forged_opaque_count_rejected(self):
        forged=json.loads(json.dumps(self.report));forged['mosaics'][0]['opaqueCanvasPixels']+=1
        with self.assertRaisesRegex(ValueError,'mosaic claim'):
            audit(self.exe,self.game_zip,self.o121.read_bytes(),json.dumps(forged).encode(),self.control)
    def test_forged_sprite_digest_rejected(self):
        forged=json.loads(json.dumps(self.report));forged['mosaics'][7]['rgbaSHA256']='0'*64
        with self.assertRaisesRegex(ValueError,'mosaic claim'):
            audit(self.exe,self.game_zip,self.o121.read_bytes(),json.dumps(forged).encode(),self.control)
    def test_forged_stream_chain_rejected(self):
        forged=json.loads(json.dumps(self.report));forged['chains'][0]['byteSpan']+=4
        with self.assertRaisesRegex(ValueError,'stream chain'):
            audit(self.exe,self.game_zip,self.o121.read_bytes(),json.dumps(forged).encode(),self.control)
    def test_original_source_not_overwritten(self):
        self.assertEqual(hashlib.sha256(self.exe).hexdigest(),self.report['originalEXE_SHA256'])

if __name__=='__main__':
    # Remove fixture args so unittest doesn't parse them as test names.
    args=sys.argv[-2:];sys.argv=sys.argv[:-2]
    # Reinsert for class fixture setup.
    sys.argv.extend(args)
    unittest.main(argv=sys.argv[:-2],verbosity=2)

#!/usr/bin/env python3
"""O124: source-pixel provenance positive/negative and tampering regression tests."""
import copy,io,json,sys,unittest,zipfile
from pathlib import Path
from PIL import Image
import numpy as np
from build_o124_scene_provenance import run,project,STAGES,SETUPS,output_new
from export_o122_indexed_mosaics import evidence
from trace_o121_control_bindings import load_game_files
from verify_o124_independent import independent,sha

class O124(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root=Path(__file__).resolve().parents[2]
        if len(cls._fixture_args)!=2:
            raise unittest.SkipTest('Supply canonical MK2.EXE and original game ZIP as positional arguments')
        exefile,gamefile=map(Path,cls._fixture_args)
        cls.exe=exefile.read_bytes();cls.game_zip=gamefile.read_bytes()
        cls.game=load_game_files(gamefile,{'TOMB.GRA','PORTAL.GRA','IMAGES.GRA'})
        cls.screens={'tomb':(cls.root/'evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png').read_bytes(),
                     'portal':(cls.root/'evidence/mk2_o114/20.png').read_bytes()}
        cls.report,cls.images=run(cls.exe,cls.game,cls.screens)
        cls.o121=json.loads((cls.root/'research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json').read_text())
        _,families=evidence(cls.exe,cls.game)
        cls.layers={e['setupObject2Offset']:np.asarray(Image.open(io.BytesIO(png)).convert('RGBA')).copy()
                    for _,ls in families for e,png in ls}

    def validated(self,report=None,images=None,exe=None,game_zip=None,screens=None):
        return independent(exe if exe is not None else self.exe,
                           game_zip if game_zip is not None else self.game_zip,
                           screens if screens is not None else self.screens,
                           self.o121,report if report is not None else self.report,
                           images if images is not None else self.images)

    def test_report_and_png_reproducible(self):
        fresh,img=run(self.exe,self.game,self.screens)
        self.assertEqual(fresh,self.report);self.assertEqual(img,self.images)
    def test_independent_verifier(self):
        self.assertGreaterEqual(self.validated()['independentPixelAssertions'],500000)
    def test_pixel_partition_tomb(self):
        r=self.report['screens']['tomb'];self.assertEqual(r['explainedByAtLeastOne'],166180)
        self.assertEqual(r['explainedUniquely'],166052);self.assertEqual(r['ambiguousMultipleMatches'],128)
    def test_pixel_partition_portal(self):
        r=self.report['screens']['portal'];self.assertEqual(r['explainedByAtLeastOne'],102251)
        self.assertEqual(r['ambiguousMultipleMatches'],0)
    def test_stage_layer_sets(self):
        self.assertEqual(set(self.report['screens']['tomb']['sourceLayers']),{'sky','architecture','floor'})
        self.assertEqual(set(self.report['screens']['portal']['sourceLayers']),{'backdrop','floor'})
    def test_each_snapshot_exact_fingerprint(self):
        for stage in self.screens:
            with self.subTest(stage=stage):
                changed=dict(self.screens);v=bytearray(changed[stage]);v[60]^=1;changed[stage]=bytes(v)
                with self.assertRaises(ValueError):run(self.exe,self.game,changed)
    def test_wrong_exe_rejected(self):
        fake=bytearray(self.exe);fake[8]^=1
        with self.assertRaises(ValueError):run(bytes(fake),self.game,self.screens)
    def test_wrong_original_resource_rejected(self):
        modified=dict(self.game);z=bytearray(modified['TOMB.GRA']);z[9]^=1;modified['TOMB.GRA']=bytes(z)
        with self.assertRaises(ValueError):run(self.exe,modified,self.screens)
    def test_incorrect_stage_rejected(self):
        with self.assertRaises(ValueError):project('unknown',self.screens['tomb'],self.exe,self.game,self.layers)
    def test_invalid_capture_stage_rejected(self):
        with self.assertRaises(ValueError):project('tomb',self.screens['portal'],self.exe,self.game,self.layers)
    def test_wrong_tomb_floor_offset_does_not_reproduce(self):
        initial=STAGES['tomb']['column']
        try:
            STAGES['tomb']['column']=initial+1
            altered,_,_=project('tomb',self.screens['tomb'],self.exe,self.game,self.layers)
        finally:STAGES['tomb']['column']=initial
        self.assertLess(altered['sourceLayers']['floor']['exactRGBPixels'],self.report['screens']['tomb']['sourceLayers']['floor']['exactRGBPixels'])
    def test_wrong_portal_floor_offset_does_not_reproduce(self):
        initial=STAGES['portal']['column']
        try:
            STAGES['portal']['column']=initial+1
            altered,_,_=project('portal',self.screens['portal'],self.exe,self.game,self.layers)
        finally:STAGES['portal']['column']=initial
        self.assertLess(altered['sourceLayers']['floor']['exactRGBPixels'],self.report['screens']['portal']['sourceLayers']['floor']['exactRGBPixels'])
    def test_wrong_sky_placement_does_not_reproduce(self):
        original=self.layers[0x173b2];self.layers[0x173b2]=np.roll(original,1,axis=1)
        try:altered,_,_=project('tomb',self.screens['tomb'],self.exe,self.game,self.layers)
        finally:self.layers[0x173b2]=original
        self.assertLess(altered['sourceLayers']['sky']['exactRGBPixels'],self.report['screens']['tomb']['sourceLayers']['sky']['exactRGBPixels'])
    def test_forged_tomb_coverage_rejected(self):
        fake=copy.deepcopy(self.report);fake['screens']['tomb']['explainedByAtLeastOne']+=1
        with self.assertRaises(ValueError):self.validated(report=fake)
    def test_forged_portal_component_rejected(self):
        fake=copy.deepcopy(self.report);fake['screens']['portal']['sourceLayers']['backdrop']['exactRGBPixels']+=1
        with self.assertRaises(ValueError):self.validated(report=fake)
    def test_forged_rgb_map_rejected(self):
        fake=dict(self.images);im=Image.open(io.BytesIO(fake['tomb'])).convert('RGB');im.putpixel((400,300),(255,0,255))
        stream=io.BytesIO();im.save(stream,format='PNG');fake['tomb']=stream.getvalue()
        with self.assertRaises(ValueError):self.validated(images=fake)
    def test_forged_palette_record_provenance_rejected(self):
        fake=copy.deepcopy(self.report);fake['canonicalExeSHA256']='0'*64
        with self.assertRaises(ValueError):self.validated(report=fake)
    def test_forged_screenshot_provenance_rejected(self):
        fake=copy.deepcopy(self.report);fake['screens']['portal']['gameplayScreenshotSHA256']='0'*64
        with self.assertRaises(ValueError):self.validated(report=fake)
    def test_refuse_output_overwrite(self):
        import tempfile
        with tempfile.TemporaryDirectory() as t:
            p=Path(t)/'atlas.png';output_new(p,b'abc')
            with self.assertRaises(ValueError):output_new(p,b'def')
            self.assertEqual(p.read_bytes(),b'abc')
    def test_output_png_has_matching_dimensions(self):
        for stage,data in self.images.items():
            im=Image.open(io.BytesIO(data));self.assertEqual(list(im.size),self.report['screens'][stage]['screenshotDimensions'])

if __name__=='__main__':
    O124._fixture_args=sys.argv[1:3]
    sys.argv=sys.argv[:1]
    unittest.main(verbosity=2)

#!/usr/bin/env python3
"""O123 regression/hostile-evidence checks. Supply unmodified game EXE/ZIP."""
import copy, io, json, sys, unittest, zipfile
from pathlib import Path
from PIL import Image
from fit_o123_tomb_architecture import build_report,fit_layer,fit_sky,score,points,FIT_ROIS,HOLDOUT_ROIS
from verify_o123_architecture_independent import audit,independent_layer,match_count
from trace_o121_control_bindings import load_game_files,EXPECTED_RESOURCE
import numpy as np

class O123Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if len(sys.argv)<3:raise ValueError('Pass EXE and original mk2.zip as arguments')
        cls.exe=Path(sys.argv[1]).read_bytes();cls.zippath=Path(sys.argv[2]);cls.game=load_game_files(cls.zippath,{x[1] for x in EXPECTED_RESOURCE.values()})
        cls.screen=Path(__file__).parents[2]/'evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png'
        cls.png=cls.screen.read_bytes()
        cls.report=build_report(cls.exe,cls.game,cls.png)
        cls.reportbytes=(json.dumps(cls.report)+'\n').encode()
        cls.layer,w,h=independent_layer(cls.exe,cls.game)
        cls.sky,_,_=independent_layer(cls.exe,cls.game,0x173b2)
        cls.img=Image.open(io.BytesIO(cls.png)).convert('RGB')
    def test_full_independent_audit(self):
        a=audit(self.exe,self.game,self.png,self.reportbytes)
        self.assertEqual((a['heldoutPixels'],a['skyHoldoutPixels']),(2650,823))
    def test_executable_unchanged(self):
        self.assertEqual(self.report['originalEXE_SHA256'],__import__('hashlib').sha256(self.exe).hexdigest())
    def test_architecture_selected_setup(self):
        self.assertEqual(self.report['layerSetupObject2Offset'],0x1737c)
    def test_sky_selected_setup(self):
        self.assertEqual(self.report['skySetupObject2Offset'],0x173b2)
    def test_architecture_reference_crop(self):
        a,b=match_count(self.layer,850,224,self.img,HOLDOUT_ROIS,2,267,57)
        self.assertEqual((a,b),(2650,2650))
    def test_sky_reference_crop(self):
        from verify_o123_architecture_independent import SKY_HOLD
        a,b=match_count(self.sky,320,80,self.img,SKY_HOLD,2,2,-47)
        self.assertEqual((a,b),(823,823))
    def test_neighbor_architecture_is_wrong(self):
        from verify_o123_architecture_independent import FIT
        exact,_=match_count(self.layer,850,224,self.img,FIT,4,267,57)
        for x,y in ((266,57),(268,57),(267,56),(267,58)):
            n,_=match_count(self.layer,850,224,self.img,FIT,4,x,y)
            self.assertLess(n,exact)
    def test_repeating_pillars_false_match_rejected(self):
        from verify_o123_architecture_independent import FIT
        exact,_=match_count(self.layer,850,224,self.img,FIT,4,267,57)
        for x in (87,447,182,352):
            n,_=match_count(self.layer,850,224,self.img,FIT,4,x,57)
            self.assertLess(n,exact)
    def test_wrong_sky_x_discriminated(self):
        from verify_o123_architecture_independent import SKY_FIT
        exact,_=match_count(self.sky,320,80,self.img,SKY_FIT,2,2,-47)
        for x in (-1,0,1,3,4):
            n,_=match_count(self.sky,320,80,self.img,SKY_FIT,2,x,-47)
            self.assertLess(n,exact)
    def test_wrong_sky_y_discriminated(self):
        from verify_o123_architecture_independent import SKY_FIT
        exact,_=match_count(self.sky,320,80,self.img,SKY_FIT,2,2,-47)
        for y in (-48,-46):
            n,_=match_count(self.sky,320,80,self.img,SKY_FIT,2,2,y)
            self.assertLess(n,exact)
    def test_forged_architecture_pixel_claim_rejected(self):
        forged=copy.deepcopy(self.report);forged['registration']['heldoutExact']-=1
        with self.assertRaises(ValueError):audit(self.exe,self.game,self.png,json.dumps(forged).encode())
    def test_forged_sky_pixel_claim_rejected(self):
        forged=copy.deepcopy(self.report);forged['skyRegistration']['heldoutExact']-=1
        with self.assertRaises(ValueError):audit(self.exe,self.game,self.png,json.dumps(forged).encode())
    def test_forged_camera_claim_rejected(self):
        forged=copy.deepcopy(self.report);forged['limitations']['liveCameraVariable']=True
        with self.assertRaises(ValueError):audit(self.exe,self.game,self.png,json.dumps(forged).encode())
    def test_forged_source_digest_rejected(self):
        forged=copy.deepcopy(self.report);forged['skyLayerRGBA_SHA256']='f'*64
        with self.assertRaises(ValueError):audit(self.exe,self.game,self.png,json.dumps(forged).encode())
    def test_forged_offsets_rejected(self):
        forged=copy.deepcopy(self.report);forged['registration']['xShift']=447
        with self.assertRaises(ValueError):audit(self.exe,self.game,self.png,json.dumps(forged).encode())
    def test_forged_sky_offsets_rejected(self):
        forged=copy.deepcopy(self.report);forged['skyRegistration']['yShift']=-46
        with self.assertRaises(ValueError):audit(self.exe,self.game,self.png,json.dumps(forged).encode())
    def test_modified_screenshot_rejected(self):
        corrupted=bytearray(self.png);corrupted[-14]^=1
        with self.assertRaises(ValueError):audit(self.exe,self.game,bytes(corrupted),self.reportbytes)
    def test_mutated_game_resource_rejected(self):
        modified=dict(self.game);data=bytearray(modified['TOMB.GRA']);data[123]^=1;modified['TOMB.GRA']=bytes(data)
        with self.assertRaises(ValueError):audit(self.exe,modified,self.png,self.reportbytes)
    def test_modified_exe_rejected(self):
        modified=bytearray(self.exe);modified[100]^=1
        with self.assertRaises(ValueError):audit(bytes(modified),self.game,self.png,self.reportbytes)
    def test_fake_palette_handle_rejected(self):
        forged=copy.deepcopy(self.report);forged['limitations']['runtimePaletteHandle']=True
        with self.assertRaises(ValueError):audit(self.exe,self.game,self.png,json.dumps(forged).encode())

if __name__=='__main__':
    pathargs=sys.argv[1:3]
    sys.argv=[sys.argv[0]]
    # Preserve the file arguments through this isolated runner.
    O123Test._fixture_args=pathargs
    original=O123Test.setUpClass.__func__
    def fixture_loader(cls):
        sys.argv=[sys.argv[0]]+cls._fixture_args
        try: original(cls)
        finally:sys.argv=[sys.argv[0]]
    O123Test.setUpClass=classmethod(fixture_loader)
    unittest.main(verbosity=2)

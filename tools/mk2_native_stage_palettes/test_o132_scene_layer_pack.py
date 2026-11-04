#!/usr/bin/env python3
"""O132 strict native-source extent, motion honesty and tamper regression tests."""
import argparse, copy, hashlib, io, json, shutil, struct, sys, tempfile, unittest,zipfile
from pathlib import Path
from PIL import Image
from export_o132_scene_layer_pack import build_pack,png_bytes,STAGE,req
from verify_o132_scene_layer_pack_independent import audit
from trace_o121_control_bindings import load_game_files

a=argparse.ArgumentParser();a.add_argument('--exe',type=Path,required=True);a.add_argument('--game-zip',type=Path,required=True);a.add_argument('--o122-report',type=Path,required=True);a.add_argument('--o121-report',type=Path,required=True)
opt=a.parse_args();sys.argv=sys.argv[:1]

class O132Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.exe=opt.exe.read_bytes();cls.game=load_game_files(opt.game_zip,{'TOMB.GRA','PORTAL.GRA','IMAGES.GRA'})
  cls.manifest,cls.files=build_pack(cls.exe,cls.game)
  cls.folder=Path(tempfile.mkdtemp(prefix='o132-tests-'))
  for p,b in cls.files.items():
   target=cls.folder/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
  (cls.folder/'O132_SCENE_LAYERS.json').write_text(json.dumps(cls.manifest))
 @classmethod
 def tearDownClass(cls):shutil.rmtree(cls.folder)
 def test_full_native_extents(self):self.assertEqual([(x['stage'],x['packedFloor']['nativeDimensions']) for x in self.manifest['stages']],[('tomb',[896,48]),('portal',[896,40])])
 def test_native_not_320_crop(self):self.assertTrue(self.manifest['originalSourceSpace']['viewportIsOnlyRuntimeSamplingNotExportBoundary'])
 def test_widescreen_guide_no_placement(self):
  self.assertEqual(self.manifest['wideCompositionReference']['optionalCanvas'],[896,504]);self.assertTrue(self.manifest['wideCompositionReference']['canvasPixelsAreNotAutomatedStagePlacements'])
 def test_unverified_parallax(self):self.assertFalse(self.manifest['motion']['parallaxMotionRulesRecovered'])
 def test_unverified_animations(self):self.assertFalse(self.manifest['motion']['animationFrameOrderingRecovered'])
 def test_no_forged_durations(self):self.assertFalse(self.manifest['motion']['animationDurationsRecovered'])
 def test_original_byte_planes(self):
  for s in self.manifest['stages']:
   png=self.files[s['stage']+'/floor_indices.png']
   data=Image.open(io.BytesIO(png));self.assertEqual(data.mode,'L');self.assertEqual(data.size,tuple(s['packedFloor']['nativeDimensions']))
 def test_every_floor_source_byte(self):
  for s in self.manifest['stages']:
   raw=self.game[STAGE[s['stage']][0]];off=s['packedFloor']['sourceOffset']
   p=Image.open(io.BytesIO(self.files[s['stage']+'/floor_indices.png']))
   self.assertEqual(p.tobytes(),raw[off:])
 def test_all_mosaics_stay_independent(self):
  self.assertEqual({s['stage']:len(s['setupLocalLayers']) for s in self.manifest['stages']},{'tomb':6,'portal':2})
 def test_mosaics_masks(self):
  for s in self.manifest['stages']:
   for l in s['setupLocalLayers']:
    root=f"{s['stage']}/setups/{l['assetId']}"
    idx=Image.open(io.BytesIO(self.files[root+'_indices.png']))
    mask=Image.open(io.BytesIO(self.files[root+'_opacity.png']))
    self.assertEqual(idx.size,mask.size);self.assertEqual(mask.mode,'L')
 def test_native_sprite_count(self):
  self.assertEqual({s['stage']:len(s['nativeSpriteDescriptors']) for s in self.manifest['stages']},{'tomb':16,'portal':13})
 def test_native_sprite_indices_retained(self):
  for stage in self.manifest['stages']:
   for sprite in stage['nativeSpriteDescriptors']:
    path=f"{stage['stage']}/native_sprites/{sprite['assetId']}_indices.png"
    native=Image.open(io.BytesIO(self.files[path]))
    self.assertEqual(native.size,tuple(sprite['dimensions']))
 def test_original_sprite_bounds_not_mosaic_bounds(self):
  for stage in self.manifest['stages']:
   for sprite in stage['nativeSpriteDescriptors']:
    self.assertTrue(sprite['unalteredNativeSpriteBounds'])
 def test_o133_motion_source_in_pack(self):
  for s in self.manifest['stages']:
   c=s['sourceMotionInputCandidate']
   self.assertEqual(c['status'],'STATIC_SOURCE_WORDS_ONLY')
   self.assertEqual(len(c['originalSourceWords']),9)
   self.assertIsNone(c['parallaxMultiplier']);self.assertIsNone(c['animationFrameOrder'])
 def test_forged_o133_motion_source_rejected(self):
  self._forged(lambda m:m['stages'][0]['sourceMotionInputCandidate']['originalSourceWords'].__setitem__(3,49153))
 def test_forged_o133_timing_claim_rejected(self):
  self._forged(lambda m:m['stages'][1]['sourceMotionInputCandidate'].__setitem__('animationDurationFrames',4))
 def test_animated_membership_not_assumed(self):
  for stage in self.manifest['stages']:
   for sprite in stage['nativeSpriteDescriptors']:
    self.assertFalse(sprite['originalGameAnimationMembershipKnown'])
 def test_native_sprite_sources_have_all_placements(self):
  for stage in self.manifest['stages']:
   self.assertEqual(sum(len(s['setupLocalOccurrences']) for s in stage['nativeSpriteDescriptors']),
                    sum(s['spriteControls'] for s in stage['setupLocalLayers']))
 def test_no_blending_into_static_full_scene(self):self.assertIn('NO_FINAL_STATIC_COMPOSITE',self.manifest['limits'])
 def test_no_animation_asset_generated(self):self.assertTrue(all('frame_' not in p for p in self.files))
 def test_original_indices_separate_from_rgb(self):
  for s in self.manifest['stages']:
   self.assertIn(s['stage']+'/floor_indices.png',self.files);self.assertIn(s['stage']+'/floor_rgba.png',self.files)
 def test_png_generation_bytes_deterministic(self):self.assertEqual(png_bytes('L',(1,1),b'\x03'),png_bytes('L',(1,1),b'\x03'))
 def test_png_generation_rejects_wrong_length(self):
  with self.assertRaises(ValueError):png_bytes('L',(3,2),b'\x03')
 def test_stage_subset_tomb(self):
  r,f=build_pack(self.exe,self.game,('tomb',));self.assertEqual(len(r['stages']),1);self.assertEqual(len(f),2+3*6+3*16)
 def test_stage_subset_portal(self):
  r,f=build_pack(self.exe,self.game,('portal',));self.assertEqual(len(r['stages']),1);self.assertEqual(len(f),2+3*2+3*13)
 def test_duplicate_stages_rejected(self):
  with self.assertRaises(ValueError):build_pack(self.exe,self.game,('portal','portal'))
 def test_unknown_stage_rejected(self):
  with self.assertRaises(ValueError):build_pack(self.exe,self.game,('arena',))
 def test_empty_stage_rejected(self):
  with self.assertRaises(ValueError):build_pack(self.exe,self.game,())
 def test_noncanonical_exe_rejected(self):
  wrong=bytearray(self.exe);wrong[0x893c6+3]^=1
  with self.assertRaises(ValueError):build_pack(bytes(wrong),self.game)
 def test_noncanonical_gra_rejected(self):
  broken=dict(self.game);d=bytearray(broken['TOMB.GRA']);d[5]^=1;broken['TOMB.GRA']=bytes(d)
  with self.assertRaises(ValueError):build_pack(self.exe,broken)
 def test_no_forged_cropped_floor_claim(self):
  self.assertFalse(any(s['packedFloor']['cameraCropApplied'] for s in self.manifest['stages']))
 def test_independent_source_verification(self):
  r=audit(self.exe,opt.game_zip,self.folder,opt.o122_report,opt.o121_report)
  self.assertEqual((r['assetsChecked'],r['setupLayersChecked'],r['nativeFloorIndicesChecked'],r['unclippedSourceSpritesChecked']),(115,8,78848,29))
 def _forged(self,manipulate):
  m=copy.deepcopy(self.manifest);manipulate(m)
  (self.folder/'O132_SCENE_LAYERS.json').write_text(json.dumps(m))
  try:
   with self.assertRaises(AssertionError):audit(self.exe,opt.game_zip,self.folder,opt.o122_report,opt.o121_report)
  finally:(self.folder/'O132_SCENE_LAYERS.json').write_text(json.dumps(self.manifest))
 def test_o134_behavior_source_metadata(self):
  for item in self.manifest['stages']:
   cand=item['sourceBehaviorCallbackCandidate']
   self.assertEqual(cand['status'],'STATIC_CODE_REFERENCES_ONLY')
   self.assertEqual(len(cand['sourceRegistrationSites']),2 if item['stage']=='tomb' else 4)
   for field in ('originalGameAnimationFrames','animationTiming','runtimeActivation','spriteStreamBindings','parallaxTrack'):
    self.assertIsNone(cand[field])
 def test_forged_o134_callback_rejected(self):
  self._forged(lambda m:m['stages'][0]['sourceBehaviorCallbackCandidate'].__setitem__('callbackPhysical',42))
 def test_forged_o134_registration_rejected(self):
  self._forged(lambda m:m['stages'][1]['sourceBehaviorCallbackCandidate']['sourceRegistrationSites'][0].__setitem__('registeredFunctionPhysical',42))
 def test_forged_o134_animation_timing_rejected(self):
  self._forged(lambda m:m['stages'][0]['sourceBehaviorCallbackCandidate'].__setitem__('animationTiming',{'fps':20}))
 def test_forged_o134_runtime_claim_rejected(self):
  self._forged(lambda m:m['stages'][1]['sourceBehaviorCallbackCandidate'].__setitem__('runtimeActivation',True))
 def test_forged_parallax_claim_rejected(self):self._forged(lambda m:m['motion'].__setitem__('parallaxMotionRulesRecovered',True))
 def test_forged_animation_claim_rejected(self):self._forged(lambda m:m['motion'].__setitem__('animationDurationsRecovered',True))
 def test_forged_floor_width_rejected(self):self._forged(lambda m:m['stages'][0]['packedFloor'].__setitem__('nativeDimensions',[320,48]))
 def test_forged_mosaic_rgba_rejected(self):self._forged(lambda m:m['stages'][1]['setupLocalLayers'][0].__setitem__('rgbaSHA256','0'*64))
 def test_forged_png_hash_rejected(self):self._forged(lambda m:m['files'][0].__setitem__('sha256','0'*64))
 def test_forged_stage_world_position_rejected(self):self._forged(lambda m:m['stages'][0]['setupLocalLayers'][0].__setitem__('registeredStageWorldPosition',[1,2]))
 def test_forged_runtime_clipping_rejected(self):self._forged(lambda m:m['stages'][0]['packedFloor'].__setitem__('runtimePackedRowClipApplied',True))

if __name__=='__main__':unittest.main(verbosity=2)

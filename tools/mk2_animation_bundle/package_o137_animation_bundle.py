#!/usr/bin/env python3
"""Build a checked, camera-uncropped MK2 source-layer + animation asset bundle.

This is an offline packaging tool. Frame order is original; timing and world
placement are intentionally unspecified. Never edits original game data.
"""
from __future__ import annotations
import argparse, hashlib, json, zipfile
from pathlib import Path

SOURCES = [
 ('native_layers', 'MK2_O135_LAYERS', 115),
 ('original_effect_frames/tomb_portal', 'O136_FRAME_SEQUENCE_MANIFEST.json', 36),
 ('original_effect_frames/tower', 'O137_TOWER_SOURCE_FRAMES.json', 7),
]

def sha(data):return hashlib.sha256(data).hexdigest()
def ensure(ok,detail):
 if not ok: raise ValueError('O137 bundle: '+detail)

def build(layers_zip:Path, effect_folder:Path, tower_folder:Path):
 collected={}
 with zipfile.ZipFile(layers_zip) as z:
  ensure(z.testzip() is None,'invalid native layer archive')
  entries=[n for n in z.namelist() if not n.endswith('/')]
  ensure(len(entries)==116 and sum(n.lower().endswith('.png') for n in entries)==115, 'wrong original layer inventory')
  for name in entries:
   ensure(name.startswith('MK2_O135_LAYERS/'), 'unexpected original layer root')
   collected['native_layers/'+name.removeprefix('MK2_O135_LAYERS/')]=z.read(name)
 original_png={n:sha(b) for n,b in collected.items() if n.endswith('.png')}
 for folder,root,filename,expected in [
  (effect_folder,'original_effect_frames/tomb_portal/','O136_FRAME_SEQUENCE_MANIFEST.json',36),
  (tower_folder,'original_effect_frames/tower/','O137_TOWER_SOURCE_FRAMES.json',7),
 ]:
  ensure(folder.is_dir() and (folder/filename).is_file(),'missing manifest '+filename)
  manifest=json.loads((folder/filename).read_text())
  n=manifest['totalSourceOrderedFrames'] if filename.startswith('O136') else manifest['originalSourceFrameCount']
  ensure(n==expected,'wrong original frame count '+filename)
  paths={str(p.relative_to(folder)) for p in folder.rglob('*') if p.is_file()}
  ensure(len(paths)==1+3*expected and filename in paths,'unexpected frame inventory')
  for rel in sorted(paths):
   ensure(not rel.startswith('/') and '..' not in Path(rel).parts,'unsafe path')
   collected[root+rel]=(folder/rel).read_bytes()
 ensure(sum(n.endswith('.png') for n in collected)==158,'all original PNGs must remain separate')
 o136=json.loads(collected['original_effect_frames/tomb_portal/O136_FRAME_SEQUENCE_MANIFEST.json'])
 o137=json.loads(collected['original_effect_frames/tower/O137_TOWER_SOURCE_FRAMES.json'])
 ensure(len(o136['tracks'])==5 and o137['sourceFrameListObject2']==0x16490,'source animation graph missing')
 layer_manifest=json.loads(collected['native_layers/O132_SCENE_LAYERS.json'])
 ensure(len(layer_manifest['stages'])==2,'expected source stages')
 for track in o136['tracks']:
  for frame in track['frames']:
   for name in frame['files']:ensure('original_effect_frames/tomb_portal/'+name in collected,'missing frame source '+name)
 for frame in o137['frames']:
  for name in frame['paths']:ensure('original_effect_frames/tower/'+name in collected,'missing frame source '+name)
 manifest={
  'schema':'mk2_o137_original_scene_animation_source_bundle_v1',
  'assetPolicy':'ORIGINAL_FULL_SOURCE_UNCROPPED_SEPARATE_LAYERS_AND_FRAMES',
  'originalReferenceStages':['tomb','portal','tower'],
  'animation':{'originalSourceOrderedFrameCount':43,'originalOrderedTracks':6,'tombFrames':16,'portalFrames':20,'towerFrames':7,
     'frameOrderSourceBacked':True,'frameDurationsKnown':False,'fpsKnown':False,'triggersKnown':False,
     'exactWorldPlacementKnown':False,'cameraParallaxKnown':False,
     'towerOriginalPaletteSourceLinkedButNotRuntimeConfirmed':True},
  'baseLayers':{'originalPNGCount':115,'pixelBytesPreservedFromO135':True,
     'sha256ByPath':original_png},
  'exportPNGCount':158,'fileCountWithoutBundleManifest':len(collected),
  'filesSHA256':{n:sha(b) for n,b in sorted(collected.items())},
  'notes':['Native stage floors are 896 pixels across, not a 320-pixel camera capture.',
    'Do not collapse original sprites into a static background; animation control is a separate source structure.',
    'This bundle does not supply invented FPS, reconstructed 16:9 world placements, parallax rates, or sound timing.']}
 collected['O137_SOURCE_BUNDLE_MANIFEST.json']=(json.dumps(manifest,indent=2)+'\n').encode()
 return collected,manifest

def write_zip(out,files):
 ensure(not out.exists(),'refusing to overwrite existing zip')
 with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
  for name,data in sorted(files.items()): z.writestr('MK2_ORIGINAL_SCENE_AND_ANIMATION/'+name,data)
 with zipfile.ZipFile(out) as z:ensure(z.testzip() is None,'written archive corrupt')

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--layer-zip',required=True,type=Path);p.add_argument('--tomb-portal',required=True,type=Path);p.add_argument('--tower',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
 files,manifest=build(a.layer_zip,a.tomb_portal,a.tower);write_zip(a.out,files)
 print(json.dumps({'status':'PASS_SOURCE_BUNDLE','sourceOrderedFrames':43,'pngs':manifest['exportPNGCount'],'files':len(files)}))

#!/usr/bin/env python3
"""Independent archive verifier: validates all source PNGs and frame planes.
No dependency on the packaging implementation.
"""
import argparse,hashlib,json,zipfile
from pathlib import Path
PREFIX='MK2_ORIGINAL_SCENE_AND_ANIMATION/'
def digest(b):return hashlib.sha256(b).hexdigest()
def run(path,original=None):
 with zipfile.ZipFile(path) as arc:
  assert arc.testzip() is None,'ZIP integrity failure'
  files={n.removeprefix(PREFIX):arc.read(n) for n in arc.namelist() if not n.endswith('/')}
  assert all(n.startswith(PREFIX) for n in arc.namelist()),'unexpected ZIP prefix'
 manifest=json.loads(files.pop('O137_SOURCE_BUNDLE_MANIFEST.json'))
 assert manifest['schema']=='mk2_o137_original_scene_animation_source_bundle_v1'
 assert len(files)==manifest['fileCountWithoutBundleManifest']==247
 hashes=manifest['filesSHA256'];assert set(files)==set(hashes)
 for p,b in files.items():assert digest(b)==hashes[p],f'file hash mismatch: {p}'
 assert sum(p.endswith('.png') for p in files)==manifest['exportPNGCount']==158
 animation=manifest['animation'];assert (animation['originalSourceOrderedFrameCount'],animation['originalOrderedTracks'])==(43,6)
 assert (animation['tombFrames'],animation['portalFrames'],animation['towerFrames'])==(16,20,7)
 for key in ['frameDurationsKnown','fpsKnown','triggersKnown','exactWorldPlacementKnown','cameraParallaxKnown']:
  assert animation[key] is False, f'unsupported certainty {key}'
 orig_hash=manifest['baseLayers']['sha256ByPath'];assert len(orig_hash)==115
 assert all(digest(files[p])==h for p,h in orig_hash.items()),'base PNG was modified'
 if original:
  with zipfile.ZipFile(original) as base:
   n=0
   for p in base.namelist():
    data=base.read(p);q='native_layers/'+p.removeprefix('MK2_O135_LAYERS/')
    assert files[q]==data,f'original layer bytes changed: {p}';n+=1
   assert n==116
 tp=json.loads(files['original_effect_frames/tomb_portal/O136_FRAME_SEQUENCE_MANIFEST.json'])
 tw=json.loads(files['original_effect_frames/tower/O137_TOWER_SOURCE_FRAMES.json'])
 assert sum(t['sourceFrameCount'] for t in tp['tracks'])==36
 assert sum(len(t['frames']) for t in tp['tracks'])==36
 assert len(tw['frames'])==7 and tw['originalSourceFrameCount']==7
 assert len({t['name'] for t in tp['tracks']})==5
 for t in tp['tracks']:
  for frame in t['frames']:
   paths=['original_effect_frames/tomb_portal/'+s for s in frame['files']]
   for p in paths:assert p in files
   assert digest(files[paths[0]])==frame['pngSHA256']
   assert digest(files[paths[1]])==frame['paletteIndexSHA256']
   assert digest(files[paths[2]])==frame['opacityMaskSHA256']
 for frame in tw['frames']:
  paths=['original_effect_frames/tower/'+s for s in frame['paths']]
  for p in paths:assert p in files
  assert digest(files[paths[0]])==frame['pngSHA256']
  assert digest(files[paths[1]])==frame['indicesSHA256']
  assert digest(files[paths[2]])==frame['maskSHA256']
 return {'status':'PASS_INDEPENDENT_O137_COMBINED_ASSET_BUNDLE','originalUnchangedLayerFiles':116 if original else None,
         'retainedNativeScenePNGs':115,'originalEffectFramePNGs':43,'totalOriginalPNGs':158,
         'SHA256VerifiedFilePayloads':len(files),'archiveSHA256':digest(path.read_bytes())}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--archive',type=Path,required=True);p.add_argument('--original-layers',type=Path);p.add_argument('--out',type=Path);a=p.parse_args()
 result=run(a.archive,a.original_layers)
 if a.out:
  assert not a.out.exists(),'refusing to overwrite existing report'
  a.out.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result))

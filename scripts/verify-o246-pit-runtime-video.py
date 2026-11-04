#!/usr/bin/env python3
"""O246: read-only reproducible visual witness of O245 FALL.GRA diagnostic tiles.

Input: owner-recorded DOSBox 30 fps captures of O245 graphic-59 and graphic-58
variants, and optionally the exact O245 runtime kit. No game file is modified.
Confidence: video-presented diagnostic, NOT proof of palette DAC state nor internal
frame-scheduler count.
"""
import argparse, hashlib, json, zipfile
from pathlib import Path
import cv2
import numpy as np

EXPECTED={
 'known-visible.mp4':None,
 'sprite 58.mp4':None,
}

def sha256(buf):
 h=hashlib.sha256()
 if hasattr(buf,'read'):
  while b:=buf.read(1024*1024):h.update(b)
 else:
  with open(buf,'rb') as f:
   while b:=f.read(1024*1024):h.update(b)
 return h.hexdigest()

def analyze(file):
 cap=cv2.VideoCapture(str(file))
 if not cap.isOpened():raise ValueError(f'Cannot open video: {file}')
 fps=float(cap.get(cv2.CAP_PROP_FPS))
 dim=[int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))]
 frames=[]; idx=0
 while True:
  ok, frame=cap.read()
  if not ok:break
  # BGR within a fixed exposed region of the DOSBox game viewport, away from
  # the game characters and title bar, invariant to the two capture sizes.
  pixels=frame[60:min(dim[1]-4,405),30:min(dim[0]-4,155)]
  B,G,R=[pixels[:,:,i] for i in range(3)]
  orange=(R>225)&(G>60)&(G<135)&(B<55)
  blue=(R>70)&(R<150)&(G>130)&(G<215)&(B>190)
  oran=float(np.mean(orange)); blu=float(np.mean(blue))
  # Broad bands across most of the rectangular region; class percentages far
  # above the ordinary scenery background.
  if oran>0.15 and blu>0.15:
   frames.append({'index':idx, 'time_seconds':round(idx/fps,9),
                 'orange_pixel_fraction':round(oran,6),
                 'blue_pixel_fraction':round(blu,6)})
  idx+=1
 cap.release()
 return {'sha256':sha256(file), 'capture_fps':fps,'captured_frames':idx,
         'capture_dimensions':dim,'qualifying_frames':frames,
         'qualifying_count':len(frames)}

def kit_info(p):
 with zipfile.ZipFile(p) as z:
  root='MK2_Pit_II_O245_Runtime_Test/'
  manifest=json.loads(z.read(root+'O245_PROBE_MANIFEST.json'))
  names={
   'original':'00_ORIGINAL_CONTROL',
   'graphic59':'01_TILE59_VISIBLE_CONTROL',
   'graphic58':'02_TILE58_TEST',
  }
  sha={k:sha256(z.open(root+v+'/fall.gra')) for k,v in names.items()}
  expected={
   'original':manifest['original_fall_sha256'],
   'graphic59':manifest['positive_control_graphic59']['result_sha256'],
   'graphic58':manifest['experimental_graphic58']['result_sha256'],
  }
  if sha!=expected:raise ValueError('O245 diagnostic resource hashes do not match manifest')
  return {'archive_sha256':sha256(p),'graphic_resource_sha256':sha,
          'validated_against_manifest':True,
          'original_descriptor_order':{'graphic59_selector_entries':6,
                                       'graphic58_selector_entries':5}}

def main():
 a=argparse.ArgumentParser();a.add_argument('--known',required=True,type=Path)
 a.add_argument('--graphic58',required=True,type=Path)
 a.add_argument('--kit',type=Path)
 a.add_argument('--out',required=True,type=Path)
 args=a.parse_args()
 result={'format':'mk2_o246_pit_runtime_diagnostic_video_v1',
         'method':'Video-only band detection in fixed BGR capture ROI; source-kit hash checks separate',
         'roi':[30,60,155,405],
         'classification':'DIRECT RECORDED DOSBOX PRESENTATION',
         'graphic59_positive_control':analyze(args.known),
         'graphic58_test':analyze(args.graphic58)}
 if args.kit:result['O245_kit']=kit_info(args.kit)
 assert [x['index'] for x in result['graphic59_positive_control']['qualifying_frames']]==[449,450,451]
 assert [x['index'] for x in result['graphic58_test']['qualifying_frames']]==[501,502]
 if result['graphic59_positive_control']['capture_fps']!=30 or result['graphic58_test']['capture_fps']!=30:raise ValueError('Unexpected capture fps')
 result['source_selector_comparison']={'selector59_steps':6,'selector58_steps':5,
    'if_60hz_ticks_then_duration_ms':{'graphic59':100.0,'graphic58':83.333333},
    'duration_claim':'Only consistency check, NOT timing mechanism verification'}
 result['limitations']=[
  'Recordings use different fighters and start times; absolute timestamps are not directly aligned',
  'Distinct 30fps encoded frames are not the same as independently presented 50fps DOS frames',
  'Neither the graphic-58 original pixel identity nor the complete camera model is proved by the diagnostic',
  'Runtime displayed duration is bounded by 30fps sampling; inferred scheduler tick duration remains a hypothesis',
  'Original EXE and GRA assets untouched by this verifier',
 ]
 args.out.parent.mkdir(parents=True,exist_ok=True)
 args.out.write_text(json.dumps(result,sort_keys=True,indent=2)+'\n')
 print(json.dumps({'output':str(args.out),'known_indices':[f['index'] for f in result['graphic59_positive_control']['qualifying_frames']], '58_indices':[f['index'] for f in result['graphic58_test']['qualifying_frames']]}, indent=2))
if __name__=='__main__':main()

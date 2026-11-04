#!/usr/bin/env python3
"""Independent O202 evidence audit: checks ZIP integrity and re-derives model
inlier counts and model rankings from raw exported match votes. No OpenCV needed.
Does not execute or trust the exporter; source authenticity requires supplied hashes.
"""
import sys,json,csv,zipfile,io,math,hashlib,argparse
from pathlib import Path
BASE={1:-336,2:-213,3:-168,4:-154,5:-129}
Y={1:0,2:-2,3:44,4:50,5:68}
R={1:1.0,2:.75,3:.625,4:.5,5:0.0}

def audit(zpath):
 with zipfile.ZipFile(zpath) as z:
  assert z.testzip() is None,'corrupted evidence ZIP'
  RPT=json.loads(z.read('results/REPORT.json'))
  RAW=json.loads(z.read('results/raw_sift_translation_votes.json'))
  csvrows=list(csv.DictReader(io.StringIO(z.read('results/source_motion_matches.csv').decode())))
  prows=list(csv.DictReader(io.StringIO(z.read('results/odd_second_pixel_scores.csv').decode())))
  assert RPT['version']=='MKDOS_O202_Forest_O198_input_video_parallax_comparison_v1'
  assert len(RPT['reference_motion'])==30 and len(csvrows)==150 and len(prows)==60
  o198=RPT['O198_original_values_evidence']
  assert o198['original_16_16_values']==[0,0.75,0.9375,1.125,1.125,1.5,1.5,1.5,0]
  assert o198['runtime_transform_verified'] is False
  assert {int(i):x['ratio_against_layer1'] for i,x in RPT['independent_source_values_O198'].items()}==R
  source_counts={i:0 for i in range(1,6)}
  stats={m:[] for m in ['source_ratios','uniform_motion','stationary_layers','three_source_layers']}
  for p in prows:stats[p['model']].append(float(p['capped_rgb_mean_abs_error_40']))
  for mode,errs in stats.items():
   assert len(errs)==15
   assert abs(sum(errs)/15-RPT['odd_second_pixel_scores'][mode])<0.0001,mode
  assert RPT['odd_second_pixel_scores']['source_ratios']<RPT['odd_second_pixel_scores']['three_source_layers']
  assert RPT['odd_second_pixel_scores']['source_ratios']<RPT['odd_second_pixel_scores']['uniform_motion']
  for fr in RPT['reference_motion']:
   t=fr['time_s']; assert 0<=t<30
   dx=fr['nearest_layer_translation_from_t0'];dy=fr['common_vertical_shift_from_t0']
   assert fr['nearest_layer_source_x']==BASE[1]+dx
   assert fr['nearest_layer_y']==Y[1]+dy
   for layer in range(1,6):
    v=RAW[str(t)][str(layer)]
    x=BASE[layer]+R[layer]*dx; y=Y[layer]+dy
    n=sum(abs(xx-x)<=2 and abs(yy-y)<=1 for xx,yy in v)
    n_static=sum(abs(xx-BASE[layer])<=2 and abs(yy-y)<=1 for xx,yy in v)
    n_uniform=sum(abs(xx-(BASE[layer]+dx))<=2 and abs(yy-y)<=1 for xx,yy in v)
    row=csvrows[t*5+layer-1]
    assert int(row['time_s'])==t and int(row['layer'])==layer
    assert int(row['source_ratio_support'])==n
    assert int(row['stationary_control_support'])==n_static
    assert int(row['uniform_motion_control_support'])==n_uniform
    if t%2==1:source_counts[layer]+=n
  for a in RPT['odd_second_holdout_source_model_vs_controls']:
   assert source_counts[a['layer']]==a['source_model_votes']
  # graph previews are part of the sealed export; input commercial data absent.
  assert len([x for x in z.namelist() if x.startswith('results/comparison_t') and x.endswith('.png')])==8
  assert all(not (x.lower().endswith(('.exe','.gra','.mp4'))) for x in z.namelist())
  manifest=json.loads(z.read('MANIFEST.json'))
  for ent in manifest['files']:
   raw=z.read(ent['path'])
   assert hashlib.sha256(raw).hexdigest()==ent['sha256'],ent['path']
 print('O202 AUDIT PASSED | 30 video samples; 150 source-match records; 60 pixel-score records; source movement votes',source_counts)
 return RPT
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('evidence_zip',type=Path);args=p.parse_args();audit(args.evidence_zip)

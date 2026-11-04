#!/usr/bin/env python3
"""O233 falsification test: does direct uniform playback of original FALL wall selector explain captured frames?

Source selector is authentic (O224); video classifications are source-paletted holdout (O214).
This tests hypothetical direct-visible uniform timer schedules, NOT actual game task execution.
No original game or video bytes are modified.
"""
import argparse,zipfile,hashlib,json,collections,math,itertools
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
VH='198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'
FH='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'

def main(a):
 out=Path(a.out)
 if out.exists():raise ValueError('new empty output path required')
 with zipfile.ZipFile(a.game_zip) as z:
  exe=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra')
 assert hashlib.sha256(exe).hexdigest()==EH and hashlib.sha256(fall).hexdigest()==FH
 original=list(exe[0xb4d84:0xb4da4]);assert original==[5]*12+[4]*6+[3]*5+[2]*4+[1]*3+[0]*2
 assert exe[0xb4da4]==0xff
 report=json.loads(Path(a.o214_report).read_text());assert report['input_hashes']=={'exe':EH,'fall':FH,'video':VH}
 series=[(r['capture_frame'],r['selected_on_training_patch']['original_sprite']) for r in report['rows'] if 878<=r['capture_frame']<=894]
 assert len(series)==17 and [s for _,s in series]==[60]*8+[59]*3+[57]*3+[56]*2+[55]
 options=[]
 for speed in (40,45,50,55,60,65,70,75):
  results=[]
  for start in range(12): # frame 878 observed as tile60; source leading group indices 0..11
   for fractional_phase in (0.,.125,.25,.375,.5,.625,.75,.875):
    predictions=[]
    for fr,_ in series:
     at=math.floor(start+fractional_phase+(fr-878)*speed/30)
     pred=55+original[at] if 0<=at<len(original) else 55
     predictions.append(pred)
    mismatch=sum(p!=obs for p,(_,obs) in zip(predictions,series))
    results.append({'mismatching_capture_frames':mismatch,'start_source_step':start,
     'fractional_initial_step_phase':fractional_phase,'predicted_original_tiles':predictions,
     'predicted_58_visible_capture_frames':[series[i][0] for i,p in enumerate(predictions) if p==58]})
  results.sort(key=lambda x:(x['mismatching_capture_frames'],x['start_source_step'],x['fractional_initial_step_phase']))
  options.append({'hypothetical_selector_step_hz':speed,'best_model':results[0],
   'minimum_mismatches_over_96_start_phases':results[0]['mismatching_capture_frames'],
   'total_start_phase_combinations':len(results)})
 # Direct display for five contiguous ticks must overlap >=2 evenly sampled 30fps frames at 60Hz
 # independent of all in-phase start offsets on the observed sampling grid.
 for phase in [i/(1000*30) for i in range(1000)]:
  visible=sum(phase<=k/30<phase+5/60 for k in range(-4,10))
  assert visible>=2
 assert all(x['best_model']['mismatching_capture_frames']>0 for x in options)
 out.mkdir(parents=True)
 result={'schema':'o233_fall58_uniform_selector_display_falsification_v1',
 'input_identity':{'original_executable_sha256':EH,'original_fall_gra_sha256':FH,'prior_o214_original_video_sha256':VH},
 'source':{'physical_selector_array':hex(0xb4d84), 'original_ordered_sprite_runs':[
  {'sprite':60,'count':12},{'sprite':59,'count':6},{'sprite':58,'count':5},
  {'sprite':57,'count':4},{'sprite':56,'count':3},{'sprite':55,'count':2}],
  'prior_o224_direct_selector_loop_yield':'1 (exact source opcode, not verified timer unit)'},
 'video':{'capture_fps':30,'frame_range_inclusive':[878,894],
  'observed_source_palette_holdout_tile_sequence':[{'frame':fr,'original_sprite':ob} for fr,ob in series],
  'original_tile58_is_never_observed_as_best_source':True},
 'uniform_direct_display_models':options,
 'sampling_bound_if_direct_display_ticked_at60Hz':{'sprite58_source_selector_steps':5,
  'hypothetical_duration_seconds':round(5/60,8),
  'minimum_30fps_capture_samples_for_contiguous_interval':2,
  'sampling_phase_controls_tested':1000},
 'conclusion':'None of the tested fixed-rate direct-visible selector models reproduces all 17 captured classifications. Under a hypothetical contiguous 5/60s presentation of sprite58, 30fps recording loss alone cannot hide every occurrence. This does not falsify the source table or prove when/how the runtime selects or draws the frames.',
 'limits':['Source selector loop callback execution interval is NOT proved equal to the OS timer interrupt.',
  'Video source classification reflects unobstructed training patch with spatial held-out checks, not a full live framebuffer trace.',
  'A separate renderer/update phase, independent object replacement, nonlinear timing or unexpected branch could explain the discrepancy; none is established.',
  'The pillar-descent scene before frame878 uses PIT.GRA; no equivalence with FALL.GRA graphic58 is claimed.']}
 (out/'O233_PIT_FALL58_UNIFORM_TIMING_NEGATIVE_CONTROL.json').write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
 print(json.dumps([{'selector_step_hz':x['hypothetical_selector_step_hz'],'best_mismatches':x['minimum_mismatches_over_96_start_phases'],
  'pred_58_frames':x['best_model']['predicted_58_visible_capture_frames']} for x in options]))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--game-zip',type=Path,required=True);p.add_argument('--o214-report',type=Path,required=True);p.add_argument('--out',required=True);main(p.parse_args())

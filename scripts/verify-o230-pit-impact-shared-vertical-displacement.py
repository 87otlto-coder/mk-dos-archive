#!/usr/bin/env python3
"""O230: cross-validate original Pit rock-grid phase against independent recorded blood positioning.

Source and video evidence sourced independently by O214/O225 vs O228/O229.
No assertion of exact executable camera code or live active root.
"""
import argparse,copy,hashlib,json,struct,zipfile
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FH='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
BH='9a47dd926c27a6570bcd81cbb0a3ff1bae2106a26e0f5360c8018fea6f16a5a9'
VH='198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'
def sha(b):return hashlib.sha256(b).hexdigest()
def model(o214,o225,o229):
    assert o214['input_hashes']=={'exe':EH,'fall':FH,'video':VH}
    assert o225['canonical_hashes']=={'exe':EH,'fall':FH,'video':VH}
    assert o229['original_hashes']=={'exe':EH,'blood':BH,'video':VH}
    original=o225['source']['three_original_grid_scripts']['0x14181']['tile_phase_modulo_geometry_xy']
    assert original==[48,16]
    rock={r['capture_frame']:r for r in o214['rows']}
    blood={r['captured_frame']:r for r in o229['sampled_frames']}
    evidence=[]
    for frame in [903,930]:
        r=rock[frame]['selected_on_training_patch']
        assert r['original_sprite']==55 and r['phase_xy']==[48,12]
        assert blood[frame]['visible_original_sprite_matches']==10
        good=[e for e in blood[frame]['source_color_scores'] if e['visible_rgb_match_under_16']]
        assert len(good)==10 and set(e['list_index'] for e in good)==set(range(11))-{1}
        positions=o229['source_11_positions_original_exe']
        offsets=set((e['screen_xy'][0]-positions[e['list_index']]['code_transformed_xy'][0],e['screen_xy'][1]-positions[e['list_index']]['code_transformed_xy'][1]) for e in good)
        assert offsets=={(0,-4)}
        rock_offset=[r['phase_xy'][0]-original[0],r['phase_xy'][1]-original[1]]
        assert rock_offset==[0,-4] and list(offsets.pop())==rock_offset
        evidence.append({'capture_frame':frame,'original_rock_tile55_phase_xy':original,'observed_rock_tile55_phase_xy':r['phase_xy'], 'shared_rock_offset_xy':rock_offset,'independently_visible_blood_positions':10,'blood_offset_xy':rock_offset,'source_palette_rock_training_mae255':r['training_mae255']})
    # This is NOT asserted universally across first contact. O214 includes 16 and 12 in early impact.
    first_impact={fr:rock[fr]['selected_on_training_patch']['phase_xy'] for fr in [894,895,896,897]}
    assert first_impact=={894:[48,16],895:[48,12],896:[48,16],897:[48,16]}
    return {'settled_impact_independent_layers':evidence, 'first_impact_transient_video_phase':first_impact,
            'confidence':'Two original resource families have the same video-derived (0,-4) apparent scene displacement at the settled captured times. Original runtime cause not traced.'}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--game-zip',type=Path,required=True);ap.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args();assert not a.out.exists()
    with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');fall=z.read('mk2/fall.gra');blood=z.read('mk2/blood.gra')
    assert (sha(e),sha(fall),sha(blood))==(EH,FH,BH)
    base=a.project/'research_outputs'
    filenames=['O214_SOURCE_PALETTE_TRANSITION_REPORT.json','O225_PIT_FATALITY_SOURCE_TILE_GRID_AND_PHASE_EXCEPTION.json','O229_PIT_BLOOD177_ALL_POSITIONS_VIDEO_TEST.json']
    o214,o225,o229=[json.loads((base/n).read_text()) for n in filenames]
    assert sha((base/filenames[1]).read_bytes())=='d8dbfa9633ab0a900abfe526a2adf5f0d2aed667621f22921043d43de936560e'
    assert sha((base/filenames[2]).read_bytes())=='016e95d630f50f515807e4beeb96f59471a3718c3ec7ee4e7d6ee09c93f167fb'
    proof=model(o214,o225,o229)
    tampered=[]
    for name in ['rock_grid','video_rock_phase','video_blood_shift']:
        aa,bb,cc=copy.deepcopy((o214,o225,o229))
        if name=='rock_grid':bb['source']['three_original_grid_scripts']['0x14181']['tile_phase_modulo_geometry_xy'][1]+=1
        elif name=='video_rock_phase':next(x for x in aa['rows'] if x['capture_frame']==930)['selected_on_training_patch']['phase_xy'][1]+=1
        else:next(x for x in cc['sampled_frames'] if x['captured_frame']==930)['source_color_scores'][0]['screen_xy'][1]+=1
        try:model(aa,bb,cc)
        except AssertionError:tampered.append(name)
        else:raise AssertionError('Accepted tamper '+name)
    assert len(tampered)==3
    out={'schema':'o230_pit_impact_shared_wall_blood_vertical_displacement_v1','source_hashes':{'exe':EH,'fall':FH,'blood':BH,'video_original_prior_reports':VH},'proof':proof,'mutation_controls_rejected':tampered,
       'boundary':'Cross-layer video agreement is high-confidence, but does not establish which camera/global offset handler caused it. Early impact video phases fluctuate; no universal static Y translation claimed.'}
    a.out.mkdir(parents=True);p=a.out/'O230_PIT_SHARED_ROCK_BLOOD_VERTICAL_DISPLACEMENT.json';p.write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({'sha256':sha(p.read_bytes()),'settled_frames':[x['capture_frame'] for x in proof['settled_impact_independent_layers']],'shared_shift':[0,-4],'mutation_controls':len(tampered)},indent=2))
if __name__=='__main__':main()

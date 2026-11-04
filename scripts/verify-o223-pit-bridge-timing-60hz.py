#!/usr/bin/env python3
"""O223: source timer vs source actor-list yield and independent video-cycle witness.

Read-only canonical owner assets, no runtime debugger trace. Native DOS presentation
50 fps is a separate owner-observed fact, not inferred from MP4 sample rate.
"""
import argparse, hashlib, json, struct, zipfile
from pathlib import Path
import cv2
import numpy as np
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
VH='3fecb35f35fb6786528b64ac5b6322ef65564885bf735405955cb1f11f928d94'
PIT_CLOCK_HZ_ASSUMPTION=1193182

def sha(x):return hashlib.sha256(x).hexdigest()
def source_checks(e,d):
    # Anchors from independently qualified O167/O168 timer and O221 actor callback.
    assert e[0x66f5a:0x66f5c]==bytes.fromhex('b036'), 'PIT mode 0x36'
    assert e[0x66f5c:0x66f5e]==bytes.fromhex('e643'), 'PIT command port'
    assert e[0x66f60:0x66f64]==bytes.fromhex('66b89d4d'), 'PIT divisor'
    assert e[0x66f64:0x66f66]==bytes.fromhex('e640') and e[0x66f6a:0x66f6c]==bytes.fromhex('e640'), 'PIT data writes'
    assert e[0x83254:0x83259]==bytes.fromhex('b806000000'), 'bridge yield literal'
    assert e[0x83259]==0xe8 and 0x8325e+struct.unpack_from('<i',e,0x8325a)[0]==0x6710f, 'original yield call'
    assert e[0x67110:0x67114]==bytes.fromhex('66894606'), 'yield writes task countdown'
    assert e[0x67158:0x6715c]==bytes.fromhex('66ff4e06'), 'task visit decrements count by one'
    assert d[0x8af:0x8b3]==bytes.fromhex('ff062400'), 'IRQ increments scheduler counter'
    assert struct.unpack_from('<H',e,0x66f62)[0]==19869
    return {'original_pit_timer_divisor':19869,'source_irq_counter_increment_driver_offset':'0x8AF',
      'source_pit_programming_exe_offset':'0x66F5A','original_actor_yield_operand':6,
      'source_scheduler_task_decrement_exe_offset':'0x67158',
      'pit_hz_conditional_standard_pc_clock':PIT_CLOCK_HZ_ASSUMPTION/19869,
      'predicted_7x6_irq_cycle_sec_if_one_task_visit_per_irq':7*6*19869/PIT_CLOCK_HZ_ASSUMPTION,
      'predicted_cycle_in_30fps_capture_frames_if_one_visit_per_irq':7*6*19869/PIT_CLOCK_HZ_ASSUMPTION*30,
      '50fps_if_wrongly_assumed_to_be_scheduler_hz_cycle_seconds':7*6/50,
      '50fps_presentation_is_empirical_owner_history_not_proved_by_this_pass':True}

def video_test(p):
    cap=cv2.VideoCapture(str(p))
    assert cap.isOpened() and abs(cap.get(cv2.CAP_PROP_FPS)-30)<1e-6 and cap.get(cv2.CAP_PROP_FRAME_COUNT)>170
    frames=[]
    for i in range(175):
        ok,src=cap.read();assert ok and src.shape[:2]==(426,638)
        frames.append(cv2.cvtColor(cv2.resize(src[26:426,:638],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB))
    cap.release();v=np.stack(frames).astype(np.int16)
    # ROIs are the O220 source-match locations, expanded by 1-2 original pixels for camera/subpixel tolerance.
    regions={'green_actor':(138,89,18,26),'flaming_actor':(162,83,18,33)}
    result={}
    for name,(x,y,w,h) in regions.items():
        roi=v[:,y:y+h,x:x+w,:]
        # Train the variable-pixel selection on an early 45-frame segment only, no later observations.
        vari=roi[:45].astype(np.float32).std(0).mean(2)
        dynamic=vari>3.5
        assert 60<dynamic.sum()<350,(name,int(dynamic.sum()))
        # Held-out current/reference video samples occur after training frames; fixed screen ROIs.
        scores={}
        for lag in [18,19,20,21,22,23,24,25,26,42]:
            cur=roi[100:170];ref=roi[100-lag:170-lag]
            er=np.abs(cur-ref)[:,dynamic,:].mean(axis=(1,2))
            scores[str(lag)]={'mean_rgb_mae255':round(float(np.mean(er)),6),
                              'median_rgb_mae255':round(float(np.median(er)),6)}
        valid={int(k):v['mean_rgb_mae255'] for k,v in scores.items() if int(k)!=42}
        assert min(valid,key=valid.get)==21,(name,valid)
        assert valid[20]/valid[21]>1.15 and valid[22]/valid[21]>1.15,('near cycle controls weak',name,valid)
        assert valid[25]/valid[21]>1.7,('50hz-as-scheduler control weak',name,valid)
        result[name]={'roi_xywh':[x,y,w,h], 'training_frame_range':[0,44],
          'heldout_current_frame_range':[100,169], 'dynamic_pixel_count':int(dynamic.sum()),
          'time_shift_frames_and_errors':scores,'best_one_cycle_lag_frames':21,
          '21_frame_cycle_seconds_in_recording':0.7,
          'mean_error_ratio_wrong_25_frame_lag_vs_21':round(valid[25]/valid[21],5)}
    return result

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--pit-video',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
    assert not a.out.exists(),'Never overwrite result'
    with zipfile.ZipFile(a.game_zip) as z:e=z.read('mk2/mk2.exe');d=z.read('mk2/rm.drv')
    assert (sha(e),sha(d),sha(a.pit_video.read_bytes()))==(EH,DH,VH), 'Canonical original fixture only'
    source=source_checks(e,d);vid=video_test(a.pit_video)
    negative=[]
    for name,blob,pos in [('change_pit_divisor',e,0x66f62),('change_yield_count',e,0x83255),('change_scheduler_decrement',e,0x67158),('change_driver_irq_increment',d,0x8af)]:
        ee=bytearray(e);dd=bytearray(d)
        bb=ee if blob is e else dd;bb[pos]^=0x01
        try:source_checks(ee,dd)
        except AssertionError:negative.append(name)
        else:raise AssertionError('Source corruption escaped '+name)
    assert len(negative)==4
    out={'schema':'o223_pit_bridge_60hz_scheduler_vs_50fps_presentation_timing_v1',
       'canonical_hashes':{'exe':EH,'driver':DH,'pit_recording':VH},'source':source,
       'video_independent_heldout_temporal_tests':vid,'tamper_controls_rejected':negative,
       'supported':'Two bridge animation ROIs independently recur at precisely 21 of 30fps captured frames, equivalent to 0.7 sec; original task yield literal 6 and 7 descriptor entries agree numerically with original 60.05Hz PIT programming. 50fps presentation is separately user-observed.',
       'unproven':'No live DOS runtime scheduler trace; cannot prove one task visit per source timer tick, actual interrupts/s, rendered scene refresh semantics, stage mode gate activation, exact in-between display frames or variable tick jitter. ROI color matching is independent of inferred sprite label.'}
    a.out.mkdir(parents=True)
    (a.out/'O223_PIT_BRIDGE_TIMER_AND_RECORDED_LOOP.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({'video_30fps_loop_frames':21,'duration_seconds':.7,'source_pit_hz':round(source['pit_hz_conditional_standard_pc_clock'],4),'control_rejections':len(negative),'heldout_rgb_mean_mae':{k:{lag:v['time_shift_frames_and_errors'][lag]['mean_rgb_mae255'] for lag in ['20','21','22','25']} for k,v in vid.items()}},indent=2))
if __name__=='__main__':main()

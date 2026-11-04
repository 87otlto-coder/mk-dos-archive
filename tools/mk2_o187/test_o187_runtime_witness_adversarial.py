#!/usr/bin/env python3
"""Tests that a forged O187 witness is refused (requires the original video)."""
import argparse
import copy
import json
import tempfile
from pathlib import Path
from verify_o187_runtime_pose_witness_independent import verify

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--video',type=Path,required=True)
    ap.add_argument('--frames-zip',type=Path,required=True)
    ap.add_argument('--report',type=Path,required=True)
    a=ap.parse_args()
    original=json.loads(a.report.read_text())
    with tempfile.TemporaryDirectory() as tmp:
        f=Path(tmp)/'corrupt.json'
        mutations={
            'native_fps_claim':lambda d:d['boundaries'].__setitem__('originalNativeAnimationFPSMeasured',True),
            'small_sequence_claim':lambda d:d['boundaries'].__setitem__('smallHangingSequenceAllSevenVerified',True),
            'false_source_frame':lambda d:d['observations'][0]['topMatch'].__setitem__('sourceFrameOrdinal',4),
            'invented_pose_score':lambda d:d['observations'][0]['topMatch'].__setitem__('score',0.999999),
            'invented_capture_frame':lambda d:d['observations'][3].__setitem__('captureFrameNumberZeroBased',1),
            'altered_source_hash':lambda d:d.__setitem__('sourceArchiveSHA256','0'*64),
            'invented_screen_location':lambda d:d['observations'][0]['topMatch'].__setitem__('screenTopLeftXY',[0,0]),
            'invented_source_ordinal':lambda d:d['sourceFrameRecords'][0].__setitem__('ordinal',6),
            'noncanonical_roi':lambda d:d['roiSearchInclusive'].__setitem__('x',[0,20]),
            'altered_capture_hash':lambda d:d.__setitem__('videoSHA256','0'*64),
        }
        failures=[]
        for name,mutate in mutations.items():
            q=copy.deepcopy(original);mutate(q);f.write_text(json.dumps(q))
            try:verify(a.video,a.frames_zip,f)
            except (AssertionError,ValueError,KeyError):continue
            failures.append(name)
        if failures:raise AssertionError('Forged witnesses accepted: '+', '.join(failures))
        print('O187 PASS:',len(mutations),'forged reports rejected')
if __name__=='__main__':main()

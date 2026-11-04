#!/usr/bin/env python3
"""O187 observed Portal-figure screen-pixel evidence (NOT native game FPS).

Requires opencv-python and numpy. This deliberately does not ship the user video
or any original commercial .GRA/.EXE. Use the user's capture and the independently
verified O177 transparent-PNG/index-mask asset ZIP as inputs.

The sampling times, screen ROI and blue-pixel classifier are calibrated for the
specific supplied 642x426 MP4 capture. Results are evidence for its seven poses,
not a generic gameplay frame-classifier and not a measure of frame duration.
"""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path

import cv2
import numpy as np

SAMPLES = [(0,57.50), (1,58.00), (2,56.00), (3,49.75), (4,95.00), (5,98.75), (6,101.75)]
VIDEO_DIM = (642,426)
BLUE_SOURCE_INDICES = {54,55}
ROI_X = (98,112)
ROI_Y = (140,187)

def sha256_file(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1024*1024), b''):h.update(b)
    return h.hexdigest()

def source_templates(source_zip):
    with zipfile.ZipFile(source_zip) as z:
        manifest=json.loads(z.read('manifest.json'))
        assert manifest['frameCount']==43 and manifest['sequenceCount']==6
        assert manifest['runtimeFrameRateKnown'] is False
        track=next(t for t in manifest['tracks'] if t['name']=='portal_swaying')
        if len(track['frames'])!=7:raise ValueError('Source track must have 7 frames')
        templates=[]
        frames=[]
        for f in track['frames']:
            payload=z.read(f['paths']['indexedPixels'])
            if hashlib.sha256(payload).hexdigest()!=f['indexedPixelsSHA256']:
                raise ValueError('Source frame index hash mismatch')
            a=np.frombuffer(payload,dtype=np.uint8)
            if len(a)!=f['width']*f['height']:raise ValueError('Source image length mismatch')
            a=a.reshape(f['height'],f['width'])
            masks=z.read(f['paths']['opacityMask'])
            if hashlib.sha256(masks).hexdigest()!=f['opacityMaskSHA256']:
                raise ValueError('Source opacity mask hash mismatch')
            if len(masks)!=len(payload):raise ValueError('Mask length mismatch')
            opaque=np.frombuffer(masks,dtype=np.uint8).reshape(a.shape)
            if np.any((a==54)|(a==55)) and np.any((opaque==0)&np.isin(a,[54,55])):
                raise ValueError('Unexpected selected blue indices in transparent pixels')
            template=np.repeat(np.repeat(np.isin(a,[54,55]).astype(np.uint8),2,axis=0),2,axis=1)
            templates.append(template)
            frames.append({'ordinal':f['ordinal'],'descriptorObject2':f['descriptorObject2'],
                           'sourceIndexedPixelsSHA256':f['indexedPixelsSHA256']})
    return templates,frames

def classify(frame):
    b,g,r=cv2.split(frame)  # OpenCV BGR channels
    return ((b>180)&((b.astype(np.int16)-r)>35)&((b.astype(np.int16)-g)>20)).astype(np.uint8)

def best_match(blue, template):
    h,w=template.shape
    size=int(template.sum())
    best=(-1.0,None)
    for x in range(ROI_X[0],ROI_X[1]+1):
        for y in range(ROI_Y[0],ROI_Y[1]+1):
            crop=blue[y:y+h,x:x+w]
            if crop.shape!=template.shape:continue
            both=int(np.sum(crop*template));denom=int(crop.sum())+size
            f1=2*both/denom if denom else 0.0
            if f1>best[0]:best=(float(f1),[x,y])
    return best

def analyze(video_path, source_zip_path):
    cap=cv2.VideoCapture(str(video_path))
    if not cap.isOpened():raise ValueError('Cannot decode video')
    fps=cap.get(cv2.CAP_PROP_FPS)
    count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width=int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height=int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if (width,height)!=VIDEO_DIM or abs(fps-30)>1e-5:
        raise ValueError('O187 fixture requires 642x426 30 FPS capture')
    if count<3053:raise ValueError('Video ends before the selected observation')
    templates,source=source_templates(source_zip_path)
    observations=[]
    for expected,t in SAMPLES:
        sample=int(round(t*fps))
        cap.set(cv2.CAP_PROP_POS_FRAMES,sample)
        ok,frame=cap.read()
        if not ok:raise ValueError(f'Cannot read sampled frame {sample}')
        blue=classify(frame)
        ranks=[]
        for i,tpl in enumerate(templates):
            score,xy=best_match(blue,tpl)
            ranks.append({'sourceFrameOrdinal':i,'score':round(score,6),'screenTopLeftXY':xy})
        ranks.sort(key=lambda r:r['score'],reverse=True)
        observations.append({'expectedSourceFrameOrdinal':expected,'captureSecond':t,
            'captureFrameNumberZeroBased':sample,'topMatch':ranks[0],
            'secondMatch':ranks[1], 'marginToSecond':round(ranks[0]['score']-ranks[1]['score'],6)})
    cap.release()
    report={
        'schema':'mk2_o187_portal_runtime_video_pose_witness_v1',
        'classification':'USER_RECORDED_VISUAL_EVIDENCE',
        'sourceArchiveSHA256':sha256_file(source_zip_path),
        'videoSHA256':sha256_file(video_path),
        'videoBytes':video_path.stat().st_size,
        'captureFPS':fps,'captureFrameCount':count,
        'approximateDurationSeconds':round(count/fps,6),
        'videoDimensions':[width,height],
        'tracksTested':['portal_swaying'],
        'originalFrameCount':7,
        'sourceFrameRecords':source,
        'bluePixelClassifier':'B>180 and B-R>35 and B-G>20; OpenCV BGR, screen capture',
        'sourceTemplate':'indices 54 or 55, nearest-neighbor 2x, independent original O177 index planes',
        'roiSearchInclusive':{'x':list(ROI_X),'y':list(ROI_Y)},
        'observations':observations,
        'boundaries':{
            'sevenLargeSwayingSourcePosesSupported':all(o['topMatch']['sourceFrameOrdinal']==o['expectedSourceFrameOrdinal'] and o['topMatch']['score']>0.90 and o['marginToSecond']>0.10 for o in observations),
            'smallHangingSequenceAllSevenVerified':False,
            'originalGameFileHashesMeasuredOnUserMachine':False,
            'dosboxGameplayPlaybackObserved':True,
            'originalNativeAnimationFPSMeasured':False,
            'frameOrderOrPlaybackTimingFromSparseSamples':False,
            'pixelColorRemapRuntimeVisualCorroboration':True
        }
    }
    if not report['boundaries']['sevenLargeSwayingSourcePosesSupported']:
        raise ValueError('At least one requested pose failed source-match classification')
    return report

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--video',type=Path,required=True)
    p.add_argument('--frames-zip',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    if a.out.exists():p.error('Refusing overwrite of existing report')
    report=analyze(a.video,a.frames_zip)
    a.out.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(f"O187 PASS: {len(report['observations'])} unique large Portal poses; "
          f"min score={min(o['topMatch']['score'] for o in report['observations']):.3f}; "
          f"min margin={min(o['marginToSecond'] for o in report['observations']):.3f}")
if __name__=='__main__':main()

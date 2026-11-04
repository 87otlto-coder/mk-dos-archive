#!/usr/bin/env python3
"""Independent O187 video/source witness verifier; does not import producer.

Requires numpy + opencv-python; user-supplied capture and original O177
extracted frame archive are external inputs, never bundled in project source.
"""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path
import cv2
import numpy as np

TIMES=[57.5,58.0,56.0,49.75,95.0,98.75,101.75]
EXPECTED='mk2_o187_portal_runtime_video_pose_witness_v1'

def digest(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def verify(video,frames,report):
    data=json.loads(Path(report).read_text())
    assert data['schema']==EXPECTED
    assert data['classification']=='USER_RECORDED_VISUAL_EVIDENCE'
    assert data['sourceArchiveSHA256']==digest(frames)
    assert data['videoSHA256']==digest(video)
    assert data['videoBytes']==Path(video).stat().st_size
    assert data['videoDimensions']==[642,426]
    assert data['captureFPS']==30.0
    assert data['tracksTested']==['portal_swaying']
    assert data['originalFrameCount']==7
    assert data['roiSearchInclusive']=={'x':[98,112],'y':[140,187]}
    limits=data['boundaries']
    assert limits=={
        'sevenLargeSwayingSourcePosesSupported':True,
        'smallHangingSequenceAllSevenVerified':False,
        'originalGameFileHashesMeasuredOnUserMachine':False,
        'dosboxGameplayPlaybackObserved':True,
        'originalNativeAnimationFPSMeasured':False,
        'frameOrderOrPlaybackTimingFromSparseSamples':False,
        'pixelColorRemapRuntimeVisualCorroboration':True}
    with zipfile.ZipFile(frames) as z:
        manifest=json.loads(z.read('manifest.json'))
        assert manifest['frameCount']==43
        assert manifest['runtimeFrameRateKnown'] is False
        t=[t for t in manifest['tracks'] if t['name']=='portal_swaying']
        assert len(t)==1 and len(t[0]['frames'])==7
        patterns=[]
        for ordinal,f in enumerate(t[0]['frames']):
            assert f['ordinal']==ordinal
            payload=z.read(f['paths']['indexedPixels'])
            assert hashlib.sha256(payload).hexdigest()==f['indexedPixelsSHA256']
            rr=data['sourceFrameRecords'][ordinal]
            assert rr=={'ordinal':ordinal,'descriptorObject2':f['descriptorObject2'],
                        'sourceIndexedPixelsSHA256':f['indexedPixelsSHA256']}
            pixels=np.frombuffer(payload,dtype=np.uint8).reshape(f['height'],f['width'])
            binary=((pixels==54)|(pixels==55)).astype(np.uint8)
            patterns.append(np.kron(binary,np.ones((2,2),dtype=np.uint8)))
    cap=cv2.VideoCapture(str(video))
    assert cap.isOpened()
    assert int(cap.get(cv2.CAP_PROP_FRAME_COUNT))==data['captureFrameCount']==3074
    assert len(data['observations'])==7
    counter=0
    for ordinal,sec in enumerate(TIMES):
        o=data['observations'][ordinal]
        assert o['expectedSourceFrameOrdinal']==ordinal
        assert o['captureSecond']==sec
        frame_no=round(30*sec)
        assert o['captureFrameNumberZeroBased']==frame_no
        cap.set(cv2.CAP_PROP_POS_FRAMES,frame_no)
        ok,img=cap.read();assert ok
        # Int16 avoids uint8 wrap in B-R and B-G when unrelated red content is brighter.
        b=img[:,:,0].astype(np.int16)
        g=img[:,:,1].astype(np.int16)
        r=img[:,:,2].astype(np.int16)
        binary=((b>180)&(b-r>35)&(b-g>20)).astype(np.uint8)
        # Independent vectorized score calculation: 2-D cross-correlation and summed-area table.
        summed=cv2.integral(binary, sdepth=cv2.CV_32S)
        matches=[]
        for i,pat in enumerate(patterns):
            h,w=pat.shape
            roi=binary[140:188+h-1,98:113+w-1]
            corr=cv2.matchTemplate(roi.astype(np.float32),pat.astype(np.float32),cv2.TM_CCORR)
            best=(-1,None)
            for dy in range(48):
                for dx in range(15):
                    x,y=98+dx,140+dy
                    both=int(round(float(corr[dy,dx])))
                    total_blue=int(summed[y+h,x+w]-summed[y,x+w]-summed[y+h,x]+summed[y,x])
                    score=2*both/(int(pat.sum())+total_blue)
                    if score>best[0]:best=(score,[x,y])
            matches.append((i,*best))
        matches.sort(key=lambda v:v[1],reverse=True)
        assert matches[0][0]==ordinal
        for rank,attr in enumerate(['topMatch','secondMatch']):
            selected=o[attr];expected=matches[rank]
            assert selected['sourceFrameOrdinal']==expected[0]
            assert selected['screenTopLeftXY']==expected[2]
            assert abs(selected['score']-expected[1])<2e-5,(ordinal,rank,selected,expected)
            counter+=1
        assert abs(o['marginToSecond']-(matches[0][1]-matches[1][1]))<2e-5
        assert matches[0][1]>0.90 and matches[0][1]-matches[1][1]>0.11
        counter+=7
    cap.release()
    return counter

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--video',type=Path,required=True)
    p.add_argument('--frames-zip',type=Path,required=True)
    p.add_argument('--report',type=Path,required=True)
    a=p.parse_args(); checks=verify(a.video,a.frames_zip,a.report)
    print('O187 PASS independent video re-decode & source matching:',checks,'behavioral comparisons')
if __name__=='__main__':main()

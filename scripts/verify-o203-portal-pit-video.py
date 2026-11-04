#!/usr/bin/env python3
"""O203: reproducible, read-only intake of MK2 Pit II and Portal DOSBox clips.

This is video-observation evidence, NOT a recovered stage-layer renderer. It
preserves raw SIFT displacements and competing modes, especially for Pit II's
repeated skull pillars. Requires OpenCV, Pillow and NumPy. Does not modify games.
"""
import argparse, csv, hashlib, json, math
from collections import Counter
from pathlib import Path
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont

STAGES={
    'pit': {'stage':'The Pit II','filename':'PIT.GRA','size':[644,432], 'crop':[2,32,640,400], 'times':[0.5,3,7,12,18,24,30,35]},
    'portal': {'stage':'Portal','filename':'PORTAL.GRA','size':[638,426], 'crop':[0,26,638,400], 'times':[0.5,3,7,12,18,24,30,35]},
}
BANDS=[('upper scenery',38,90),('middle scenery',90,145),('floor / lower scenery',145,200)]

def sha(path):
    h=hashlib.sha256()
    with open(path,'rb') as f:
        for b in iter(lambda:f.read(1024*1024), b''):h.update(b)
    return h.hexdigest()

def get_frame(capture, sec, cfg):
    capture.set(cv2.CAP_PROP_POS_MSEC,sec*1000)
    good, bgr=capture.read()
    if not good:raise RuntimeError(f'Could not read frame {sec}s')
    if list(bgr.shape[1::-1])!=cfg['size']:
        raise RuntimeError(f'Unexpected capture geometry {bgr.shape} for {cfg["stage"]}. Do not silently adjust crop.')
    x,y,w,h=cfg['crop']
    return cv2.cvtColor(cv2.resize(bgr[y:y+h,x:x+w],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)

def match_frames(sift, matcher, frame0, frame1):
    first, desc1=sift.detectAndCompute(cv2.cvtColor(frame0,cv2.COLOR_RGB2GRAY),None)
    second, desc2=sift.detectAndCompute(cv2.cvtColor(frame1,cv2.COLOR_RGB2GRAY),None)
    if desc1 is None or desc2 is None:return []
    raw=[]
    for pair in matcher.knnMatch(desc1,desc2,k=2):
        if len(pair)<2:continue
        match, alt=pair
        if match.distance >= 0.7*alt.distance:continue
        a,b=first[match.queryIdx].pt,second[match.trainIdx].pt
        dx,dy=round(b[0]-a[0]),round(b[1]-a[1])
        if abs(dy)>25:continue
        raw.append({'source_x':round(a[0],2),'source_y':round(a[1],2),'target_x':round(b[0],2),'target_y':round(b[1],2),'dx':dx,'dy':dy,'distance':round(float(match.distance),3)})
    return raw

def top_modes(rows,top=5):
    votes=Counter((a['dx'],a['dy']) for a in rows)
    return [{'dx':k[0],'dy':k[1],'exact_votes':v,'nearby_votes':sum(count for (xx,yy),count in votes.items() if abs(xx-k[0])<=1 and abs(yy-k[1])<=1)} for k,v in votes.most_common(top)]

def draw_sheet(cfg,frames,outfile):
    tw,th=640,400
    sheet=Image.new('RGB',(tw*2,(th+38)*4),(17,24,35));d=ImageDraw.Draw(sheet)
    for i,(t,rgb) in enumerate(frames):
        x=(i%2)*tw;y=(i//2)*(th+38)
        sheet.paste(Image.fromarray(cv2.resize(rgb,(tw,th),interpolation=cv2.INTER_NEAREST)),(x,y+28))
        d.text((x+10,y+8),f'{cfg["stage"]} — recorded gameplay  t={t}s',fill=(245,247,251))
    sheet.save(outfile)

def draw_mode_chart(stage_reports, out):
    # Illustrates the strongest SIFT translation modes per region; these are
    # not disambiguated camera translations and cannot be treated as ratios.
    W=1180; H=620
    im=Image.new('RGB',(W,H),(14,23,35));d=ImageDraw.Draw(im)
    d.text((25,18),'MK2 O203 — recurring scenery displacements in two DOSBox recordings',fill='white')
    d.text((25,42),'Native-pixel SIFT match modes relative to 0.5 seconds. Repeated patterns can alias by large offsets.',fill=(170,190,212))
    for si,(key,res) in enumerate(stage_reports.items()):
        x0=25+si*580
        d.text((x0,78),res['stage'].upper(),fill=(242,247,255))
        d.text((x0,97),f'Clip {res["duration_seconds"]:.1f}s • {res["total_feature_matches"]} matched features across sampled pairs',fill=(171,189,208))
        labels=['upper scenery','middle scenery','floor / lower scenery']
        colors=[(255,194,119),(122,199,250),(127,225,184)]
        for bi,band in enumerate(labels):
            d.rectangle([x0,140+bi*155,x0+540,269+bi*155],outline=(43,61,82),width=1)
            d.text((x0+11,147+bi*155),band,fill=colors[bi])
            rows=[r for r in res['region_results'] if r['region']==band]
            for n,row in enumerate(rows):
                if n>=7:break
                mode=row['top_modes'][0] if row['top_modes'] else None
                txt=f't={row["t"]:>4.1f}s    '
                if mode:txt+=f'dx {mode["dx"]:+4d}, dy {mode["dy"]:+3d}       support {mode["exact_votes"]:>3d}/{row["feature_count"]:>3d}'
                else:txt+='no matches'
                d.text((x0+11,170+bi*155+n*13),txt,fill=(213,222,233))
    im.save(out)

def analyze_one(label, video, resource, cfg, out):
    cap=cv2.VideoCapture(str(video))
    if not cap.isOpened():raise RuntimeError('Cannot open '+str(video))
    fps=float(cap.get(cv2.CAP_PROP_FPS));count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); dur=count/fps
    if dur<=max(cfg['times']):raise RuntimeError('Recording too short for requested sample set')
    source=get_frame(cap,cfg['times'][0],cfg)
    samples=[(t,get_frame(cap,t,cfg)) for t in cfg['times']]
    sift=cv2.SIFT_create(nfeatures=2000,contrastThreshold=0.008,edgeThreshold=15)
    matcher=cv2.BFMatcher()
    matches=[];regions=[]
    for t,target in samples[1:]:
        data=match_frames(sift,matcher,source,target)
        for e in data:
            e['stage']=label;e['time_s']=t
        matches.extend(data)
        for band,y0,y1 in BANDS:
            sub=[e for e in data if y0<=e['source_y']<y1]
            regions.append({'t':t,'region':band,'feature_count':len(sub),'top_modes':top_modes(sub)})
    folder=out/label;folder.mkdir(parents=True,exist_ok=True)
    draw_sheet(cfg,samples,folder/'video_contact_sheet.png')
    Image.fromarray(source).save(folder/'video_native_opening_frame.png')
    (folder/'raw_feature_pairs.json').write_text(json.dumps(matches,indent=1)+'\n')
    with (folder/'raw_feature_pairs.csv').open('w',newline='') as f:
        fieldnames=['stage','time_s','source_x','source_y','target_x','target_y','dx','dy','distance']
        csvwriter=csv.DictWriter(f,fieldnames=fieldnames);csvwriter.writeheader();csvwriter.writerows(matches)
    summary={'stage':cfg['stage'],'video_file':video.name,'video_sha256':sha(video),'source_resource':resource.name if resource and resource.exists() else None,'source_resource_sha256':sha(resource) if resource and resource.exists() else None,'duration_seconds':round(dur,4),'recording_dimensions':cfg['size'],'fps':fps,'frame_count':count,'game_viewport_crop':cfg['crop'],'normalized_pixels':[320,200], 'sample_times_seconds':cfg['times'],'feature_matches_after_ratio_and_y_filter':len(matches),'region_results':regions,'classification':'independent gameplay video observation, not recovered stage renderer','notes':['All translations are candidate 0.5s-to-t source-feature offsets, not proven stage-layer displacements.','Repeated architectural features in Pit II produce multiple valid SIFT modes; selecting the largest peak can be wrong.','Animated Portal figures and vortex complicate static registration.','Raw source video may contain cropped horizontal pixels and video compression.','Stage resources are identified for provenance, not used for decoding or calculating video translations.','Camera velocity and parallax ratios are NOT determined by this intake.']}
    (folder/'report.json').write_text(json.dumps(summary,indent=2)+'\n')
    cap.release()
    return {'stage':cfg['stage'],'duration_seconds':dur,'total_feature_matches':len(matches),'region_results':regions}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--pit',type=Path,required=True);p.add_argument('--portal',type=Path,required=True)
    p.add_argument('--fixture',type=Path,help='Optional original MK2 fixture directory with PIT.GRA / PORTAL.GRA (filenames case-insensitive)')
    p.add_argument('--output',type=Path,required=True)
    args=p.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    resources={}
    if args.fixture:
        items={p.name.upper():p for p in args.fixture.iterdir() if p.is_file()}
        for key,cfg in STAGES.items():resources[key]=items.get(cfg['filename'])
    files={'pit':args.pit,'portal':args.portal}
    allreports={}
    for key,cfg in STAGES.items():
        allreports[key]=analyze_one(key,files[key],resources.get(key),cfg,args.output)
    draw_mode_chart(allreports,args.output/'motion_modes_comparison.png')
    result={'name':'O203 Portal and Pit II video intake','tool':'verify_o203_stage_video_intake.py',
       'results':{k:{'stage':v['stage'],'sampled_matching_pairs':7,'total_feature_matches':v['total_feature_matches']} for k,v in allreports.items()},
       'method':'SIFT 0.7 second-best descriptor ratio, source keypoint y bands, rounded native-pixel displacements, exact and +/-1 vote peaks. Crop normalized to 320x200.',
       'warning':'Hypothesis-producing video observations, not verified original renderer layer parameters. Never promote strongest modes to source-confirmed motion.'}
    (args.output/'OVERVIEW.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()

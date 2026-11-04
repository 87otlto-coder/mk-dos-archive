#!/usr/bin/env python3
"""O247: independent source palette and original graphic 58 witness in the UNPATCHED tile of O245 59-control recording.
Read-only, with fixed source/video hashes. No original source data modifies. Requires cv2, numpy.
"""
from __future__ import annotations
import argparse,hashlib,json,struct,zipfile
from pathlib import Path
import cv2
import numpy as np
EXPECTED={
  'exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
  'fall':'60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0',
  'kit':'2bbdf6ce5479b456ab38137065b29b211b49bc4ec9c9dc28ca408c577070b532',
  'known':'e346c8de3f5b6d646ff5e5bd313a3f64c37b55b5801c99957ad71c99bacc4953',
  'test58':'caa583e0880d05e0ad76b4e9f3da9c1fd2a04fb6c3881d7d252ad2d2fe72cb91'
}
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  while b:=f.read(1024*1024):h.update(b)
 return h.hexdigest()
def decode(exe,gra):
 dct={};last=0
 for i in range(61):
  d=0xC39B8+12*i if i<54 else 0xC3C40+16*(i-54)
  w,h=struct.unpack_from('<HH',exe,d);ref=struct.unpack_from('<I',exe,d+8)[0]
  assert ref>>24==123 and ref&0xffffff==last and 1<=w<=160 and 1<=h<=140
  p=np.zeros((h,w),dtype=np.uint8);t=last
  for y in range(h):
   x=0
   while x<w:
    cmd=struct.unpack_from('<I',gra,t)[0];t+=4
    if cmd&1:n=cmd>>1
    elif cmd&2:
     n=cmd>>10;p[y,x:x+n]=(cmd>>2)&255
    else:
     n=cmd>>2;p[y,x:x+n]=np.frombuffer(gra,dtype=np.uint8,count=n,offset=t);t+=(n+3)&~3
    assert 0<n<=w-x
    x+=n
  last=t;dct[i]=p
 assert last==250804
 return dct

def palette(exe):
 assert struct.unpack_from('<H',exe,0x895AC)[0]==81
 pal=np.zeros((82,3),np.float32)
 for i in range(1,82):
  w=struct.unpack_from('<H',exe,0x895AC+i*2)[0]
  v=[((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1]
  pal[i]=[(q<<2)|(q>>4) for q in v]
 return pal

TRAIN=(slice(111,156),slice(20,66))
HOLDS=[(slice(111,156),slice(245,291)),(slice(160,187),slice(20,66)),(slice(45,82),slice(24,66)),(slice(156,186),slice(253,298))]

def test_frame(raw,tiles,pal):
 img=cv2.cvtColor(cv2.resize(raw[30:raw.shape[0],4:raw.shape[1]-4],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB).astype(np.float32)
 train=img[TRAIN];Y,X=np.mgrid[:200,:320]
 ranks=[]
 for index in range(55,61):
  pix=tiles[index];h,w=pix.shape;tile=pal[pix];tiled=np.tile(tile,(3,3,1))
  err=cv2.matchTemplate(tiled,np.ascontiguousarray(train),cv2.TM_SQDIFF)
  _,_,(xx,yy),_=cv2.minMaxLoc(err)
  ox=(TRAIN[1].start-xx)%w;oy=(TRAIN[0].start-yy)%h
  full=tile[(Y-oy)%h,(X-ox)%w]
  train_mae=np.abs(full[TRAIN]-train).mean()
  holds=[float(np.abs(full[s]-img[s]).mean()) for s in HOLDS]
  ranks.append({'source_sprite':index,'source_phase_native_xy':[int(ox),int(oy)],'train_mae255':round(float(train_mae),4),'holdout_maes255':[round(float(v),4) for v in holds],'holdout_mean_mae255':round(float(np.mean(holds)),4)})
 ranks.sort(key=lambda a:a['train_mae255'])
 return {'winner':ranks[0]['source_sprite'],'ranks':ranks, 'holdout_best':min(ranks,key=lambda r:r['holdout_mean_mae255'])['source_sprite'], 'winner_holdout_is_best':ranks[0]['source_sprite']==min(ranks,key=lambda r:r['holdout_mean_mae255'])['source_sprite']}

def sampled(video,ids,tiles,pal):
 c=cv2.VideoCapture(str(video));assert c.isOpened() and abs(c.get(5)-30)<.01
 result=[]
 for frame in ids:
  c.set(cv2.CAP_PROP_POS_FRAMES,frame);ok,im=c.read();assert ok
  t=test_frame(im,tiles,pal);t['frame']=frame;t['time_s']=round(frame/30,6)
  result.append(t)
 c.release();return result

def assert_patch(kit):
 with zipfile.ZipFile(kit) as z:
  root='MK2_Pit_II_O245_Runtime_Test/'
  man=json.loads(z.read(root+'O245_PROBE_MANIFEST.json'))
  orig=z.read(root+'00_ORIGINAL_CONTROL/fall.gra')
  ctl=z.read(root+'01_TILE59_VISIBLE_CONTROL/fall.gra')
  t58=z.read(root+'02_TILE58_TEST/fall.gra')
  assert hashlib.sha256(orig).hexdigest()==EXPECTED['fall']
  assert hashlib.sha256(ctl).hexdigest()==man['positive_control_graphic59']['result_sha256']
  assert hashlib.sha256(t58).hexdigest()==man['experimental_graphic58']['result_sha256']
  # decode originally source index58 commands from per-sprite span; require entire sprite 58 original bytes unchanged in 59 patched variant
  return orig,ctl,t58

def main():
 p=argparse.ArgumentParser()
 for k in ['game_zip','kit','known','test58','out']:p.add_argument('--'+k.replace('_','-'),required=True,type=Path)
 a=p.parse_args();assert not a.out.exists()
 for k,pth in [('kit',a.kit),('known',a.known),('test58',a.test58)]:assert sha(pth)==EXPECTED[k],(k,sha(pth))
 with zipfile.ZipFile(a.game_zip) as z:exe=z.read('mk2/mk2.exe');gra=z.read('mk2/fall.gra')
 assert hashlib.sha256(exe).hexdigest()==EXPECTED['exe'] and hashlib.sha256(gra).hexdigest()==EXPECTED['fall']
 orig,ctl,changed58=assert_patch(a.kit)
 assert orig==gra
 # protect original GRA58 stream bytes. Sprite 58 physical start and end follow descriptor references for graphics 58/59
 def start(n):return struct.unpack_from('<I',exe,0xC3C40+16*(n-54)+8)[0]&0xffffff
 p58,q58=start(58),start(59)
 assert ctl[p58:q58]==orig[p58:q58] and changed58[p58:q58]!=orig[p58:q58]
 tiles=decode(exe,gra);pal=palette(exe)
 runs={
  'graphic59_control':sampled(a.known,range(442,460),tiles,pal),
  'graphic58_experiment':sampled(a.test58,range(492,509),tiles,pal)
 }
 for name,rows in runs.items():
  print(name,[(r['frame'],r['winner']) for r in rows])
 # The recolored tile cannot be expected to match original source, so exclude diagnostic frames.
 for n,frames in [('graphic59_control',[449,450,451]),('graphic58_experiment',[501,502])]:
  assert all(r['ranks'][0]['train_mae255']>60 for r in runs[n] if r['frame'] in frames)
 a58=next(r for r in runs['graphic59_control'] if r['frame']==452)
 assert a58['winner']==58 and a58['holdout_best']==58
 assert all(r['winner']==60 for r in runs['graphic59_control'] if 442<=r['frame']<=448)
 assert all(r['winner']==59 for r in runs['graphic58_experiment'] if 498<=r['frame']<=500)
 for rows in runs.values():
  for r in rows:
   if r['frame'] not in ([449,450,451] if rows is runs['graphic59_control'] else [501,502]):
    assert r['winner_holdout_is_best'],(r['frame'],'holdout differed')
 out={'schema':'mk2_o247_original_58_cross_control_source_video_v1','fixture':{'mk2_exe_sha256':EXPECTED['exe'],'original_fall_sha256':EXPECTED['fall'],'o245_test_kit_sha256':EXPECTED['kit'],'known_video_sha256':EXPECTED['known'],'graphic58_video_sha256':EXPECTED['test58']},'graphic_58_original_bytes_confirmed_unchanged_in_59_positive_control':True,'sprite58_encoded_offset_range':[p58,q58], 'source_palette_physical':'0x895ac', 'normalization':'crop [y30:H,x4:W-4] to native 320x200 using area interpolation; trial-scoped normalization, not exact DOSBox viewport proof','train_region':[20,111,66,156],'holdouts_count':len(HOLDS),'results':runs,'key_witness':a58,'interpretation':['In O245 diagnostic-59 variant, original FALL.GRA tile58 appears in the first frame after recolored tile59: capture frame452.','Source-palette original tile58 wins separately on held-out video regions, whereas alternate original tiles are worse.','O245 diagnostic-58 variant independently shows original tile59 before its directly witnessed patched tile58.','The original O214 video does not show a tile58 winner at its sampling/fit settings; differing presentation durations or other runtime/capture conditions remain unresolved.','Observed 30fps frame counts are not an exact task tick clock and do not establish the full selector timing.']}
 a.out.parent.mkdir(parents=True,exist_ok=True);a.out.write_text(json.dumps(out,indent=2,sort_keys=True)+'\n')
 print('output',a.out,'graphic58',a58['ranks'][:3])
if __name__=='__main__':main()

#!/usr/bin/env python3
"""O225: original FALL.GRA 3 per-graphic tile-placement scripts and held-out 59 mismatch.
Authenticates source/control script and reports known source-vs-video phase discrepancy.
"""
import argparse,hashlib,importlib.util,json,struct,sys,zipfile
from pathlib import Path
import cv2,numpy as np
BASE1=0x61c54;BASE2=0xa0c54
E_HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
F_HASH='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
V_HASH='198b5ecccb1cca898e4da7ba1282104fac71c2e3bc8a6009638420deb9dede48'
def sha(b):return hashlib.sha256(b).hexdigest()
def u32(e,p):return struct.unpack_from('<I',e,p)[0]
def grid_check(e,fx):
    expected={0x14181:(96,[-48,48,144,240,336],[-80,16,112]),
              0x141c1:(80,[-40,40,120,200,280],[-24,56,136]),
              0x14201:(64,[0,64,128,192,256],[0,64,128,192])}
    res={}
    for off,(dim,xvals,yvals) in expected.items():
        at=BASE2+off;coords=[]
        for y in yvals:
            for x in xvals:
                observed=struct.unpack_from('<hh',e,at+4*len(coords));assert observed==(x,y)
                coords.append([x,y])
        assert u32(e,at+4*len(coords))==0xffffffff
        res[hex(off)]={'source_physical':hex(at),'original_grid_size_px':dim,
          'n_columns':len(xvals),'n_rows':len(yvals),'original_coordinates_xy':coords,
          'source_sentinel_physical':hex(at+4*len(coords)),
          'tile_phase_modulo_geometry_xy':[xvals[0]%dim,yvals[0]%dim]}
    pairing=[]
    for i in range(6):
        src=0x14151+8*i
        f1=fx.get((2,src));f2=fx.get((2,src+4))
        gfx_off=0x22ffc+16*i
        grid_off={0:0x14181,1:0x141c1,2:0x14201,3:0x14181,4:0x14181,5:0x14181}[i]
        for (f,off,target) in [(f1,src,gfx_off),(f2,src+4,grid_off)]:
            assert f and f['kind']==7 and f['flags']==16 and f['targetObject']==2 and f['targetOffset']==target
            assert u32(e,BASE2+off)==target
        pairing.append({'source_sprite':55+i,'grid_pointer_object2':hex(grid_off),
                        'source_declared_graphic_dimensions':[struct.unpack_from('<H',e,BASE2+gfx_off)[0],struct.unpack_from('<H',e,BASE2+gfx_off+2)[0]],
                        'source_grid_phase_xy':res[hex(grid_off)]['tile_phase_modulo_geometry_xy']})
    # Original per-location draw loop, raw packed XY low/high words placed into EDI object and committed.
    checks={'render_location_next':(0x8075f,'8b1383c304'),
            'end_of_grid':(0x80764,'83faff742d'),
            'assign_x':(0x8077e,'6689571a'),
            'split_high_half':(0x80782,'c1ea10'),
            'assign_y':(0x80785,'6689571e'),
            'commit_graphic_object':(0x80789,'e8263ffeff'),
            'loop_grid':(0x80794,'ebc9')}
    for name,(p,h) in checks.items():assert e[p:p+len(h)//2]==bytes.fromhex(h),(name,hex(p))
    assert 0x8078e+struct.unpack_from('<i',e,0x8078a)[0]==0x646b4
    return {'three_original_grid_scripts':res,'six_source_graphic_grid_bindings':pairing,'original_grid_drawing_source_range':'0x8075F..0x80796','original_xy_split_target_fields':'[EDI+0x1A] low16 and [EDI+0x1E] high16','source_code_fragments_checked':len(checks)}

def video_check(e,gra,video,o210_path):
    spec=importlib.util.spec_from_file_location('o210_local',str(o210_path));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    sprites,_=m.decode(e,gra)
    cal=np.zeros((82,3),dtype=np.float32)
    for i in range(1,82):
        word=struct.unpack_from('<H',e,0x895ac+2*i)[0]
        dac=[((word>>9)&63)|1,((word>>4)&63)|1,((word<<1)&63)|1]
        cal[i]=[(v<<2)|(v>>4) for v in dac]
    cap=cv2.VideoCapture(str(video));assert cap.isOpened() and cap.get(cv2.CAP_PROP_FPS)==30
    res=[];Y,X=np.mgrid[:200,:320]
    for f in (886,887,888):
        cap.set(cv2.CAP_PROP_POS_FRAMES,f);ok,im=cap.read();assert ok and im.shape[:2]==(430,660)
        frame=cv2.cvtColor(cv2.resize(im[25:425,10:650],(320,200),interpolation=cv2.INTER_AREA),cv2.COLOR_BGR2RGB)
        src=sprites[59][0];assert src.shape==(96,96)
        row={'frame':f,'time_seconds':f/30}
        for tag,(x,y) in [('source_placement_modulo_96',(48,16)),('previous_O214_video_fit',(16,80))]:
            pred=cal[src[(Y-y)%96,(X-x)%96]]
            # No video-learned palette, and two spatially separate patches.
            row[tag]={'phase_xy':[x,y], 'left_background_patch_mae255':round(float(np.abs(pred[111:156,20:66]-frame[111:156,20:66]).mean()),5),
                      'right_background_holdout_mae255':round(float(np.abs(pred[111:156,245:291]-frame[111:156,245:291]).mean()),5)}
        assert row['previous_O214_video_fit']['right_background_holdout_mae255']==row['source_placement_modulo_96']['right_background_holdout_mae255'],row
        res.append(row)
    cap.release()
    periods={}
    for i in range(55,61):
        p=sprites[i][0];h,w=p.shape
        px=next(k for k in range(1,w+1) if np.array_equal(p,np.roll(p,k,axis=1)))
        py=next(k for k in range(1,h+1) if np.array_equal(p,np.roll(p,k,axis=0)))
        periods[str(i)]={'native_dimensions_xy':[w,h],'smallest_independent_exact_period_xy':[px,py]}
    assert periods['59']['smallest_independent_exact_period_xy']==[32,32]
    assert periods['58']['smallest_independent_exact_period_xy']==[48,48]
    Y,X=np.mgrid[:200,:320];src59=sprites[59][0]
    assert np.array_equal(src59[(Y-16)%96,(X-48)%96],src59[(Y-80)%96,(X-16)%96])
    return {'sampled_source_59_rows':res,'all_original_tile_intrinsic_periods':periods,
      'sprite59_two_source_and_video_phases_exactly_equal_on_original_indexed_pixels':True,
      'interpretation':'O214 original 59 video-fit phase (16,80) is EXACTLY equivalent to the original 96px placement-grid phase (48,16) because sprite59 is a 3x3 repeat of a 32x32 fundamental source tile. No camera displacement inferred. Sprite58 also has intrinsic 48x48 repetition and source use shown in O224, but its live pixels were not separately observed.'}
def main():
    a=argparse.ArgumentParser();a.add_argument('--game-zip',type=Path,required=True);a.add_argument('--video',type=Path,required=True);a.add_argument('--project',type=Path,default=Path(__file__).resolve().parents[1]);a.add_argument('--out',type=Path,required=True);args=a.parse_args()
    assert not args.out.exists(),'Cannot overwrite research result'
    with zipfile.ZipFile(args.game_zip) as z:e=z.read('mk2/mk2.exe');gra=z.read('mk2/fall.gra')
    assert (sha(e),sha(gra),sha(args.video.read_bytes()))==(E_HASH,F_HASH,V_HASH)
    sys.path.insert(0,str(args.project/'tools/mk2_native_stage_palettes'))
    from trace_o120_setup_graph import fixups
    fx=fixups(e);d=grid_check(e,fx)
    vid=video_check(e,gra,args.video,args.project/'scripts/verify-o210-pit-fatality.py')
    neg=[]
    for name,pos in [('first_96px_x',BASE2+0x14181),('80px_y',BASE2+0x141c1+2),('64px_middle_x',BASE2+0x14201+4*7),
                     ('grid_terminator',BASE2+0x14201+4*20),('sprite58_grid_pointer',BASE2+0x1416d),('set_x_code',0x8077e),('set_y_code',0x80785),('commit_draw_call',0x8078a)]:
        e2=bytearray(e);e2[pos]^=1
        try:grid_check(e2,fx)
        except AssertionError:neg.append(name)
        else:raise AssertionError('Failed corruption control '+name)
    assert len(neg)==8
    out={'schema':'o225_pit_original_rock_grid_control_and_video_phase_exception_v1','canonical_hashes':{'exe':E_HASH,'fall':F_HASH,'video':V_HASH},
         'source':d,'video_source_only_pal_control':vid,'typed_LE_relocation_count':len(fx),'negative_controls_rejected':neg,
         'boundaries':'Original coordinate streams are exact, not runtime world-to-screen camera arithmetic. Texture59 phase discrepancy is fully resolved by exact intrinsic 32x32 source repetition. Original texture58 has intrinsic 48x48 source repetition and a verified source selector run, but no video-confirmed displayed pixels in the sampled O214 recording. Not exact 50fps game presentation/DAC capture.'}
    args.out.mkdir(parents=True);(args.out/'O225_PIT_FATALITY_SOURCE_TILE_GRID_AND_PHASE_EXCEPTION.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({'grids':{k:len(v['original_coordinates_xy']) for k,v in d['three_original_grid_scripts'].items()},
       'source_tile_phase_59':d['six_source_graphic_grid_bindings'][4]['source_grid_phase_xy'],
       'recorded_59_mae':vid['sampled_source_59_rows'][0], 'tamper_controls':len(neg)},indent=2))
if __name__=='__main__':main()

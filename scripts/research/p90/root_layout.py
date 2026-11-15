"""P90 original MK2 stage-root initializer -> setup/list/channel provenance.

Static instruction evidence; not captured gameplay or a completed scene.
Outputs metadata only. Original assets are read-only and never copied.
"""
from __future__ import annotations
import argparse, hashlib, json, struct, sys
from pathlib import Path

def digest(b): return hashlib.sha256(b).hexdigest()
def require(ok, why):
    if not ok: raise ValueError('P90: '+why)

def analyze(b, source_root):
    sys.path.insert(0,str(Path(source_root)/'tools/mk2_native_stage_palettes'))
    from trace_o120_setup_graph import fixups, OBJ1, OBJ2, EXE_SHA
    from trace_o130_dynamic_stage_streams import produce
    require(digest(b)==EXE_SHA,'canonical original MK2.EXE required')
    fx=fixups(b); prior=produce(b)
    def word(p):
        require(0<=p<=len(b)-4,'read outside file')
        return struct.unpack_from('<I',b,p)[0]
    def ptr(at,target_obj=2):
        r=fx.get((2,at)); value=word(OBJ2+at)
        require(r and (r['kind'],r['flags'],r['targetObject'],r['targetOffset'])==(7,16,target_obj,value),'typed pointer '+hex(at))
        return value
    # These source instructions define a compact initializer grammar, distinct
    # from the draw-command grammar at 0x93547. 1 writes a literal sentinel;
    # ordinary entries store their ADDRESS, not the setup pointer alone.
    spans=[(0x81f60,0x81fde),(0x81bb6,0x81c0d),(0x86a95,0x86ac3),
           (0x81d90,0x81daf),(0x931e4,0x93253),(0x9358c,0x935aa)]
    anchors={0x81f60:'8b1883c004',0x81f6f:'833d645a070001',
      0x81f78:'528b15645a070089135a83c30483c004',
      0x81f9c:'890383c30483c008',0x81fc5:'0fbf1bd1eb81eb9f000000c1e310',
      0x81fd4:'a1645a07008918',0x81bf4:'8b098b12c1e91081e20000ffff0bca',
      0x81d92:'8b4cdf0266030d645a07006689481ac1e91066030d665a07006689481e'}
    for at,h in anchors.items(): require(b[at:at+len(h)//2].hex()==h,'instruction anchor '+hex(at))
    records=[]
    for index,name in ((1,'tomb'),(7,'portal'),(3,'tower')):
      for mode,table in prior['rootTables'].items():
        root=table[index]['rootObject2']; require(root is not None,'missing root')
        destination=ptr(root+0x1c); cursor=root+0x20; assignments=[]
        for ordinal in range(9):
          token=struct.unpack_from('<i',b,OBJ2+cursor)[0]
          if token in (-1,-2): break
          require(ordinal<8,'initializer exceeds eight layer slots')
          slot=destination+4*ordinal
          if token==1:
            require((2,cursor) not in fx,'sentinel must not be a pointer')
            assignments.append({'slotObject2':slot,'entryObject2':cursor,'kind':'disabled_sentinel','value':1})
            cursor+=4
          else:
            require(token>1,'invalid initializer token')
            setup=ptr(cursor); require(OBJ2+setup+18<=len(b),'setup outside file')
            require((2,cursor+4) not in fx,'packed origin must be a scalar')
            width,height,count=struct.unpack_from('<HHH',b,OBJ2+setup)
            x,y=struct.unpack_from('<hh',b,OBJ2+cursor+4)
            assignments.append({'slotObject2':slot,'entryObject2':cursor,'kind':'setup_pair',
              'setupObject2':setup,'originSignedXY':[x,y],'size':[width,height],'controlCount':count})
            cursor+=8
        else: raise ValueError('P90: missing initializer terminator')
        initial=struct.unpack_from('<h',b,OBJ2+root+10)[0]
        channels={0x84310+i*4:initial<<16 for i in range(9)}
        centers=[]; require(token==-2,'selected roots require center table')
        cursor+=4
        for _ in range(16):
          if word(OBJ2+cursor)==0: cursor+=4; break
          setup=ptr(cursor); channel=ptr(cursor+4)
          require(channel in channels,'center channel outside nine accumulators')
          signed_width=struct.unpack_from('<h',b,OBJ2+setup)[0]
          require(signed_width>=0,'negative setup width outside supported corpus')
          # Original SHR after MOVSX; selected widths are nonnegative.
          center=(signed_width>>1)-159; channels[channel]=center<<16
          centers.append({'setupObject2':setup,'channelObject2':channel,'initialInteger':center})
          cursor+=8
        else: raise ValueError('P90: unterminated center table')
        require(destination==0x77453,'unexpected first setup slot')
        bindings=[]
        for i,a in enumerate(assignments):
          maskbase,vertical,horizontal,slot=struct.unpack_from('<4I',b,OBJ2+0x15b68+16*i)
          require(slot==a['slotObject2'],'setup updater slot mismatch')
          for j in range(4): ptr(0x15b68+16*i+4*j)
          row=dict(a,objectListHeadObject2=0x84350-4*i,
            horizontalAccumulatorObject2=horizontal,verticalAccumulatorObject2=vertical,
            initialHorizontalInteger=channels[horizontal]>>16,selectionMaskObject2=maskbase)
          if a['kind']=='setup_pair':
            row['initialOriginMinusHorizontal']=[a['originSignedXY'][0]-(channels[horizontal]>>16),a['originSignedXY'][1]]
            row['projectionQualification']='CONDITIONAL_SOURCE_ARITHMETIC_NOT_OBSERVED_VIEWPORT'
          bindings.append(row)
        stream=next(s for s in prior['streams'] if s['object2Offset']==ptr(root+0x18))
        records.append({'stage':name,'stageIndex':index,'mode':mode,'rootObject2':root,
          'rootSpanSha256':digest(b[OBJ2+root:OBJ2+cursor]),'endExclusiveObject2':cursor,
          'headerSignedWords':list(struct.unpack_from('<6h',b,OBJ2+root+4)),
          'initialDefaultHorizontalInteger':initial,'setupBindings':bindings,'centerOverrides':centers,
          'drawCommands':stream['operations']})
    return {'schema':'mk2_p90_root_layout_static_v1','status':'PASS_STATIC_ROOT_LAYOUT',
      'sourceExeSha256':digest(b),'classification':'VERIFIED','classificationScope':'ORIGINAL_STATIC_DATAFLOW_ONLY',
      'records':records,'sourceCodeSpans':[{'physicalStart':a,'physicalEndExclusive':z,'sha256':digest(b[a:z])} for a,z in spans],
      'runtimeObserved':False,'completeStageReconstruction':False,'nativePaletteAllocationVerified':False,
      'nativeAnimationTimingVerified':False,'cameraPositionsObserved':0,
      'limits':['Root assignment stores the address of a setup+origin pair into mutable slot storage.',
        'The updater associates the slot with a render-object list and horizontal accumulator.',
        'Origins and initial center arithmetic do not establish a live framebuffer or camera bounds.',
        'Draw commands preserve source order; list contents, activations, velocities and flags remain runtime dependent.',
        'Tower is a static parser holdout only; no general whole-stage support is claimed.']}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--exe',required=True,type=Path);p.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parents[3])
    p.add_argument('--out',type=Path);a=p.parse_args()
    result=analyze(a.exe.read_bytes(),a.source_root);text=json.dumps(result,indent=2)+'\n'
    if a.out:
        require(not a.out.exists(),'refusing output overwrite')
        with a.out.open('x',encoding='utf-8') as f:f.write(text)
    else: print(text,end='')
if __name__=='__main__':main()


"""P90 source-derived camera rate selection, preserving original table order.

No original-game execution or camera measurement. All outputs are metadata.
"""
import argparse,hashlib,json,struct,sys
from pathlib import Path

def make(b,root):
    sys.path.insert(0,str(Path(root)/'tools/mk2_native_stage_palettes'))
    from trace_o120_setup_graph import fixups,EXE_SHA,OBJ1,OBJ2
    def need(x,m):
        if not x:raise ValueError('P90 camera: '+m)
    need(hashlib.sha256(b).hexdigest()==EXE_SHA,'canonical executable')
    fx=fixups(b)
    anchors={0x82145:'0fbf0d2e4308008bd181c21701000083c128',
      0x82163:'8b0d1e5d07000fbf1d2e4308003bd9',
      0x82189:'528b151a5d07008915645a07005a',
      0x8220d:'8b0d6c5a07008b0983056c5a070004',
      0x8221c:'f7c1ffffffff0f84ef0000003bca7309',
      0x82235:'8b0d6c5a07008b09',0x8224b:'ffd1',
      0x82317:'b80c00000033d2f7f2'}
    for at,h in anchors.items():need(b[at:at+len(h)//2].hex()==h,'instruction '+hex(at))
    result=[]
    for name,base in [('positive',0x15f90),('negative',0x15fdc)]:
      entries=[];maximum=0
      for i in range(16):
        threshold=struct.unpack_from('<I',b,OBJ2+base+8*i)[0]
        if not threshold:break
        target=struct.unpack_from('<I',b,OBJ2+base+8*i+4)[0]
        f=fx.get((2,base+8*i+4))
        need(f and (f['kind'],f['flags'],f['targetObject'],f['targetOffset'])==(7,16,1,target),'typed code function')
        entries.append({'sourceEntryObject2':base+8*i,'thresholdUnsigned16_16':threshold,
          'routineObject1':target,'routinePhysical':OBJ1+target,
          'reachableByPositiveFirstMatch':threshold>maximum})
        maximum=max(maximum,threshold)
      else:raise ValueError('P90 camera: missing zero terminal')
      need(len(entries)==9,'nine source entries')
      examples=[]
      for speed in (1,0x10000,0x20000,0x28000,0x30000,0x40000,0x60000,0x70000,0x80000,0xa0000,0xa0001):
        selected=next((e for e in entries if e['thresholdUnsigned16_16']>=speed),None)
        examples.append({'inputUnsignedMagnitude':speed,'selectedRoutinePhysical':None if selected is None else selected['routinePhysical'],
          'zeroTerminatorErrorPath':selected is None})
      result.append({'directionLabel':name,'sourceTableObject2':base,'entriesInOriginalOrder':entries,
        'zeroThresholdTerminatorObject2':base+8*len(entries),'staticSelectionExamples':examples})
    spans=[(0x820d1,0x82259),(0x82487,0x826fa)]
    return {'schema':'mk2_p90_camera_selection_static_v1','classification':'VERIFIED','classificationScope':'STATIC_CODE_AND_TABLE_ORDER_ONLY',
      'sourceExeSha256':EXE_SHA,'tables':result,'sourceCodeSpans':[{'start':a,'endExclusive':z,'sha256':hashlib.sha256(b[a:z]).hexdigest()} for a,z in spans],
      'cameraWordObject2':0x8432e,'cameraMinimumGlobalObject2':0x75d1a,'cameraMaximumGlobalObject2':0x75d1e,
      'viewportComparisonInsets':[40,279],'speedMagnitudeInputGlobalsObject2':[0x75fda,0x7615e],
      'zeroMagnitudeDefaultRoutinePhysical':{'positive':0x824c0,'negative':0x825f7},
      'tableSelection':'FIRST_UNSIGNED_THRESHOLD_GE_INPUT_IN_SOURCE_ORDER; ZERO_TERMINATOR_REACHES_DIVIDE_BY_ZERO',
      'runtimeObserved':False,'cameraLimitsMeasured':False,'perFrameParallaxVerified':False,
      'limits':['Preserve table order: 0xA0000 precedes 0x80000, so the final entry is unreachable by this first-match scan.',
        'Root+0xC and +0xE feed the compared minimum/maximum globals, but this is not proof of reached viewport endpoints.',
        'Distinct one-object and two-object camera paths exist; these tables belong to the two-object path.',
        'Do not equate source rate-selection magnitudes, renderer invocations, scheduler ticks or elapsed seconds.']}

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--exe',type=Path,required=True)
    p.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parents[3]);p.add_argument('--out',type=Path);a=p.parse_args()
    text=json.dumps(make(a.exe.read_bytes(),a.source_root),indent=2)+'\n'
    if a.out:
      with a.out.open('x',encoding='utf-8') as f:f.write(text)
    else:print(text,end='')


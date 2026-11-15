"""Independent instruction replay of P90 original camera table selection."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BASE=0xa0c54
def check(x,m):
    if not x:raise ValueError('P90 camera independent: '+m)
def select(b,table,magnitude):
    # Interpret actual code at 8220D..8223D, independently of candidate's
    # Python first-match expression. The pointer cursor is mutable memory.
    pc=0x8220d;cursor=table;ecx=0;zero=False;above_equal=False
    def u(p):return struct.unpack_from('<I',b,p)[0]
    for _ in range(180):
      if pc==0x82317:return None
      if pc==0x8223d:return ecx+0x61c54
      if b[pc:pc+6]==bytes.fromhex('8b0d6c5a0700'):ecx=cursor;pc+=6
      elif b[pc:pc+2]==b'\x8b\x09':ecx=u(BASE+ecx);pc+=2
      elif b[pc:pc+7]==bytes.fromhex('83056c5a070004'):cursor+=4;pc+=7
      elif b[pc:pc+6]==bytes.fromhex('f7c1ffffffff'):zero=ecx==0;pc+=6
      elif b[pc:pc+2]==b'\x0f\x84':pc=pc+6+(struct.unpack_from('<i',b,pc+2)[0] if zero else 0)
      elif b[pc:pc+2]==b'\x3b\xca':above_equal=ecx>=magnitude;pc+=2
      elif b[pc]==0x73:pc=pc+2+(struct.unpack_from('<b',b,pc+1)[0] if above_equal else 0)
      elif b[pc]==0xeb:pc+=2+struct.unpack_from('<b',b,pc+1)[0]
      else:raise ValueError('P90 camera independent: unsupported instruction '+hex(pc))
    raise ValueError('P90 camera independent: budget exhausted')

def verify(b,r):
    check(hashlib.sha256(b).hexdigest()==SHA and r['sourceExeSha256']==SHA,'source')
    check(r['schema']=='mk2_p90_camera_selection_static_v1' and r['classificationScope']=='STATIC_CODE_AND_TABLE_ORDER_ONLY','schema')
    for flag in ('runtimeObserved','cameraLimitsMeasured','perFrameParallaxVerified'):check(r[flag] is False,'unsupported '+flag)
    checks=0
    check(len(r['tables'])==2,'table count')
    for table,base,label in zip(r['tables'],(0x15f90,0x15fdc),('positive','negative')):
      check(table['sourceTableObject2']==base and table['directionLabel']==label,'table identity')
      maximum=0
      check(len(table['entriesInOriginalOrder'])==9,'entry count')
      for i,e in enumerate(table['entriesInOriginalOrder']):
        threshold,target=struct.unpack_from('<II',b,BASE+base+8*i)
        expected={'sourceEntryObject2':base+8*i,'thresholdUnsigned16_16':threshold,'routineObject1':target,
          'routinePhysical':target+0x61c54,'reachableByPositiveFirstMatch':threshold>maximum}
        check(e==expected,'entry order/source fields');maximum=max(maximum,threshold);checks+=1
      check(table['zeroThresholdTerminatorObject2']==base+72 and struct.unpack_from('<I',b,BASE+base+72)[0]==0,'terminator')
      for ex in table['staticSelectionExamples']:
        got=select(b,base,ex['inputUnsignedMagnitude'])
        check(got==ex['selectedRoutinePhysical'] and ex['zeroTerminatorErrorPath']==(got is None),'actual instruction selection');checks+=1
    # Source root scalar-to-global stores, independently checked instructions.
    for at,h in [(0x81f29,'0fbf1883c002891d1a5d0700'),(0x81f35,'0fbf1883c002891d1e5d0700'),
                 (0x8214e,'81c21701000083c128'),(0x82178,'c705645a0700905f0100b96c080200'),
                 (0x821aa,'c705645a0700dc5f0100b9a3090200')]:
      check(b[at:at+len(h)//2].hex()==h,'camera source operand');checks+=1
    check(r['viewportComparisonInsets']==[40,279] and r['cameraWordObject2']==0x8432e,'insets/camera word')
    check(r['cameraMinimumGlobalObject2']==0x75d1a and r['cameraMaximumGlobalObject2']==0x75d1e,'bound globals')
    check(r['zeroMagnitudeDefaultRoutinePhysical']=={'positive':0x824c0,'negative':0x825f7},'zero input defaults')
    for span in r['sourceCodeSpans']:check(span['sha256']==hashlib.sha256(b[span['start']:span['endExclusive']]).hexdigest(),'code digest');checks+=1
    return {'status':'PASS_P90_CAMERA_INDEPENDENT_STATIC_REPLAY','assertions':checks,'tables':2,
      'originalRuntimeObserved':False,'cameraEndpointsVerified':False}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);p.add_argument('--report',type=Path,required=True);a=p.parse_args()
    print(json.dumps(verify(a.exe.read_bytes(),json.loads(a.report.read_text(encoding='utf-8'))),indent=2))


#!/usr/bin/env python3
"""O138: source-authenticated frame list reader to live sprite descriptor consumer.
Static control path, not a DOSBox timing or stage-activation witness.
"""
import argparse, hashlib,json,struct
from pathlib import Path
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OBJ2=0xa0c54
TRACKS={'tomb_flying_a':(0x17814,8),'tomb_flying_b':(0x177ec,8),
        'portal_swaying':(0x164b4,7),'portal_hanging':(0x164d8,7),
        'portal_electric':(0x164f8,6),'tower_original_effect':(0x16490,7)}
def require(ok,s):
 if not ok:raise ValueError('O138 '+s)
def produce(b):
 require(len(b)==861133 and hashlib.sha256(b).hexdigest()==EXE_SHA,'canonical EXE')
 witnesses={
  'frameStreamCurrentPointerGlobalLoad':(0x86cc5,'8b15785a0700'),
  'readNextSourceFramePointer':(0x86ccb,'8b1a'),
  'advanceFrameStreamPointerFourBytes':(0x86ccd,'8305785a070004'),
  'frameListConsumerCall':(0x86d26,'e851ca0000'),
  'consumerCurrentDescriptorFromObjectField':(0x93793,'8b4f3c'),
  'consumerCompareNextDescriptor':(0x93796,'3bcb'),
  'consumerResetSpriteControlField':(0x937c4,'66c7474a0000'),
  'consumerWriteResolvedCurrentDescriptor':(0x937ca,'89472c'),
  'consumerWriteShapeOutput':(0x937cd,'894f28'),
  'consumerWriteSpriteControlWord':(0x937d0,'895724'),
  'consumerWriteNextDescriptorPointer':(0x937d3,'895f3c'),
  'consumerUpdateObjectPositionX':(0x937e7,'014718'),
  'consumerUpdateObjectPositionY':(0x937e4,'016f1c'),
 }
 for label,(at,raw) in witnesses.items():require(b[at:at+len(bytes.fromhex(raw))]==bytes.fromhex(raw),label)
 disp=struct.unpack_from('<i',b,0x86d27)[0]
 require(0x86d2b+disp==0x9377c,'direct relative call target')
 descs=[]
 for name,(offset,count) in TRACKS.items():
  ptrs=[]
  for ordinal in range(count):
   p=struct.unpack_from('<I',b,OBJ2+offset+4*ordinal)[0]
   require(0<p<0x30000,'descriptor in original file data')
   w,h=struct.unpack_from('<HH',b,OBJ2+p)
   require(0<w*h<=4096,'descriptor native dimensions')
   ptrs.append(p)
  descs.append({'sourceList':name,'sourceListObject2':offset,'sourceOrderedFrameCount':count,
                'rawSourceDescriptorPointersObject2':ptrs,'sourceOrderedNotRuntimeTimed':True})
 return {'schema':'mk2_o138_source_frame_object_consumer_v1','status':'PASS_ORIGINAL_FRAME_DESCRIPTOR_CONSUMER_CODE',
    'originalEXESHA256':EXE_SHA,'originalPointerStreamGlobal':0x75a78,
    'sourceReaderPhysical':0x86cc5,'sourceReaderAdvancesBytes':4,'consumerCallPhysical':0x86d26,
    'consumerFunctionPhysical':0x9377c,'consumerObjectDescriptorField':0x3c,
    'consumerObjectSpriteControlField':0x24,'consumerObjectCurrentDescriptorField':0x2c,
    'consumerObjectCurrentShapeField':0x28,'consumerObjectPositionFields':[0x18,0x1c],
    'witnessInstructions':{label:{'physical':at,'bytes':raw} for label,(at,raw) in witnesses.items()},
    'sourceLists':descs,'totalOriginalFrames':sum(x['sourceOrderedFrameCount'] for x in descs),
    'limits':{'codeEdgeVerified':True,'activeRuntimeStageObjectKnown':False,'actualSpriteVisibilityVerified':False,
              'animationFPSKnown':False,'animationTriggerKnown':False,'spriteWorldPositionKnown':False,
              'cameraOrParallaxRelationKnown':False},
    'interpretation':'The stage effect pointer stream is consumed one source entry at a time; code compares the selected descriptor pointer and conditionally stores it to per-object sprite state. Static proof, not a timed runtime playback witness.'}
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
 require(not a.out.exists(),'refusing overwrite')
 a.out.write_text(json.dumps(produce(a.exe.read_bytes()),indent=2)+'\n')
 print('PASS O138 frame descriptor object binding')

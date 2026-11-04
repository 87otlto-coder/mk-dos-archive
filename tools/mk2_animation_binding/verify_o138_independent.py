#!/usr/bin/env python3
"""O138 independent byte-level witness reparse, no producer import."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
def verify(b,r):
 n=0
 def req(x,why):
  nonlocal n
  if not x:raise AssertionError('O138 '+why)
  n+=1
 req(len(b)==861133 and hashlib.sha256(b).hexdigest()==SHA,'canonical source')
 req(r['originalEXESHA256']==SHA and r['schema']=='mk2_o138_source_frame_object_consumer_v1','report identity')
 for label,row in r['witnessInstructions'].items():
  at=row['physical']; raw=bytes.fromhex(row['bytes'])
  req(b[at:at+len(raw)]==raw,'original instruction '+label)
  req(0<=at<len(b) and len(raw)>0,'source bound '+label)
 req(b[0x86ccb:0x86ccd]==bytes([0x8b,0x1a]),'EBX dereference')
 req(b[0x86ccd:0x86cd4]==bytes.fromhex('8305785a070004'),'pointer advance')
 req(b[0x86d26]==0xe8 and 0x86d2b+struct.unpack_from('<i',b,0x86d27)[0]==0x9377c,'consumer call')
 req(b[0x93793:0x93798]==bytes.fromhex('8b4f3c3bcb'),'compare object descriptor')
 req(b[0x937d3:0x937d6]==bytes.fromhex('895f3c'),'assign new descriptor')
 req((r['sourceReaderPhysical'],r['consumerCallPhysical'],r['consumerFunctionPhysical'])==(0x86cc5,0x86d26,0x9377c),'source code addresses')
 req((r['consumerObjectDescriptorField'],r['consumerObjectSpriteControlField'],r['consumerObjectCurrentDescriptorField'])==(0x3c,0x24,0x2c),'object fields')
 expected={'tomb_flying_a':(0x17814,8),'tomb_flying_b':(0x177ec,8), 'portal_swaying':(0x164b4,7),
          'portal_hanging':(0x164d8,7),'portal_electric':(0x164f8,6),'tower_original_effect':(0x16490,7)}
 req(len(r['sourceLists'])==6 and r['totalOriginalFrames']==43,'list count')
 for entry in r['sourceLists']:
  name=entry['sourceList'];req(name in expected,'source list id')
  p,num=expected[name];req(entry['sourceListObject2']==p and entry['sourceOrderedFrameCount']==num,'source list structure')
  ptrs=[struct.unpack_from('<I',b,0xa0c54+p+4*j)[0] for j in range(num)]
  req(ptrs==entry['rawSourceDescriptorPointersObject2'],'original source order')
  req(entry['sourceOrderedNotRuntimeTimed'] is True,'original order not claimed timed')
 req(set(x['sourceList'] for x in r['sourceLists'])==set(expected),'all original tracks')
 for k in ('activeRuntimeStageObjectKnown','actualSpriteVisibilityVerified','animationFPSKnown','animationTriggerKnown','spriteWorldPositionKnown','cameraOrParallaxRelationKnown'):
  req(r['limits'][k] is False,'unsupported runtime confidence '+k)
 req(r['limits']['codeEdgeVerified'] is True,'verified code edge')
 return {'status':'PASS_O138_INDEPENDENT_ORIGINAL_DESCRIPTOR_CONSUMER','assertions':n,'stageTrackCount':6,'sourceFrameCount':43}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',type=Path,required=True);a.add_argument('--report',type=Path,required=True);o=a.parse_args()
 print(json.dumps(verify(o.exe.read_bytes(),json.loads(o.report.read_text()))))

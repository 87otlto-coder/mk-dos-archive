#!/usr/bin/env python3
"""O144 original stage-object list position-normalization path; no camera runtime measurements."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
LISTS=[(0x8020e,0x80222,0x84348,0x84326),(0x80227,0x8023b,0x84344,0x84322),
       (0x80240,0x80254,0x84340,0x8431e),(0x80259,0x8026d,0x8433c,0x8431a),
       (0x80272,0x80286,0x84338,0x84316),(0x8028b,0x8029f,0x84334,0x84312)]
WITNESSES={
 0x8050b:'52',0x8050c:'0fbf15ea420800',0x80513:'8915705a0700',
 0x8051a:'8b38',0x8051c:'f7c7ffffffff',0x80522:'7425',
 0x80524:'0fbf471a',0x80528:'2b056c5a0700',0x8052e:'6689471a',
 0x80532:'0fbf471e',0x80536:'2b05705a0700',0x8053c:'6689471e',
 0x80540:'e83140feff',0x80545:'8bc7',0x80547:'ebd1',0x80549:'c3',
 0x64576:'834f3401'}
def produce(b):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('O144 must use canonical original MK2')
 for at,raw in WITNESSES.items():
  if b[at:at+len(bytes.fromhex(raw))]!=bytes.fromhex(raw):raise ValueError(f'wrong bytecode at {at:#x}')
 sites=[]
 for start,call,head,offset in LISTS:
  if b[start]!=0xb8 or struct.unpack_from('<I',b,start+1)[0]!=head:raise ValueError('list base immediate')
  if b[start+5]!=0x52 or b[start+6:start+9]!=bytes([0x0f,0xbf,0x15]) or struct.unpack_from('<I',b,start+9)[0]!=offset:raise ValueError('stage offset selector')
  if b[call]!=0xe8 or call+5+struct.unpack_from('<i',b,call+1)[0]!=0x8050b:raise ValueError('direct normalizer invocation')
  sites.append({'listHeadAddress':head,'horizontalSourceSignedWordAddress':offset,'callPhysical':call,
    'listHeadImmediatePhysical':start})
 if b[0x80540]!=0xe8 or 0x80545+struct.unpack_from('<i',b,0x80541)[0]!=0x64576:raise ValueError('post-transform object flag')
 return {'schema':'mk2_o144_stage_object_list_position_normalization_v1','canonicalEXESHA256':SHA,
  'originalInstructions':[{ 'physical':at,'bytes':raw } for at,raw in sorted(WITNESSES.items())],
  'sourceListNormalizationSites':sites,'normalizerPhysical':0x8050b,
  'sourceOperations':['iterate list using render object +0x00 next pointer',
   'read signed high word at object +0x1A; subtract list-specific signed stage source word; write back',
   'read signed high word at object +0x1E; subtract signed source word at 0x842EA; write back',
   'call object flag setter 0x64576, setting bit 0 at object +0x34'],
  'limits':{'sourceStageOffsetTraversalVerified':True,'offsetActualRuntimeValuesKnown':False,
   'provenWorldOrScreenPosition':False,'transformationHappensInActualFightVerified':False,
   'drawRasterTraversalVerified':False,'sourceSequenceFPSVerified':False}}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--out',required=True);a=p.parse_args()
 dest=Path(a.out)
 if dest.exists():raise ValueError('refusing overwrite')
 dest.write_text(json.dumps(produce(Path(a.exe).read_bytes()),indent=2)+'\n')
 print('PASS O144 stage-list source position normalizer; live offset values unknown')

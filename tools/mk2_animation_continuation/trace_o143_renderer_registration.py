#!/usr/bin/env python3
"""O143 exact static renderer-object list insertion order evidence; NOT verified raster draw order."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
INSTRUCTIONS={
 'saveSortKeyA':(0x665ff,'8b5820'),'saveSortKeyB':(0x66603,'8b501c'),
 'readSelectedListHead':(0x66613,'8b12'),
 'readExistingKeyA':(0x6661d,'8b4a20'), 'compareKeyA':(0x66620,'3bd9'),
 'strictGreaterContinues':(0x66622,'7fe9'), 'strictLessInserts':(0x66624,'7c0b'),
 'readExistingKeyB':(0x66626,'8b4a1c'), 'compareKeyB':(0x66629,'390d6c5a0700'),
 'strictGreaterBContinues':(0x6662f,'7fdc'),
 'linkObjectToExisting':(0x66631,'8910'),
 'writePrecedingNext':(0x66634,'8b0d645a07008901'),
 'portalRenderObjectForSharedCallback':(0x828a8,'8bc7'),
 'portalCallbackListHeadSelector':(0x828b5,'528b15705a07008915985a0700'),
 'portalCallbackTailJmp':(0x828c3,'e90c3dfeff'),
 'portalPriorityWrite':(0x828e6,'894f20'),
 'portalSecondaryTailJmp':(0x828fa,'e9d53cfeff'),
 'tombTailJmp':(0x82d2e,'e9a138feff')}
DIRECT={0x828c3:0x665d4,0x828fa:0x665d4,0x82d2e:0x665d4}
def analyze(b):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('O143 source requires untouched MK2.EXE')
 for k,(at,raw) in INSTRUCTIONS.items():
  if b[at:at+len(bytes.fromhex(raw))]!=bytes.fromhex(raw):raise ValueError('O143 original opcode '+k)
 for at,target in DIRECT.items():
  if b[at]!=0xe9 or at+5+struct.unpack_from('<i',b,at+1)[0]!=target:raise ValueError('O143 original jump target')
 return {'schema':'mk2_o143_render_object_ordered_list_insertion_v1','canonicalEXESHA256':SHA,
  'originalInstructions':{k:{'physical':at,'bytes':raw} for k,(at,raw) in INSTRUCTIONS.items()},
  'originalTailJumps':[{'physical':at,'target':target} for at,target in DIRECT.items()],
  'insertionFunctionPhysical':0x665d4,
  'newObjectPointerInput':'EAX','objectNextLinkOffset':0,'sortKeys':[{'offset':0x20,'signed32':True},{'offset':0x1c,'signed32':True}],
  'insertionOrder':'lexicographic ascending signed DWORD +0x20 then signed DWORD +0x1C; equal keys insert before current element',
  'sourceRegistrations':['Tomb object initializer path','Portal/Tower shared callback object initializer path','Portal alternate object path'],
  'listHeadSelectedBySource':{'sharedPortalTowerCallback':'task context pointer [ESI+0x58] written to 0x75A98','tomb':'0x84340', 'portalAlternate':'0x84344'},
  'limits':{'originalListInsertionOrderVerified':True,'actualRendererDrawTraversalVerified':False,'objectAliveInRuntimeVerified':False,
   'specificPerObjectDepthVerified':False,'finalCompositingOcclusionVerified':False,'spriteCameraMappingVerified':False}}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--out',required=True);args=a.parse_args()
 out=Path(args.out)
 if out.exists():raise ValueError('refusing overwrite')
 out.write_text(json.dumps(analyze(Path(args.exe).read_bytes()),indent=2)+'\n');print('PASS O143 original ordered render-list insertion; raster draw order unverified')

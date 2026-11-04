#!/usr/bin/env python3
"""Independent original code and semantic source-report audit O143."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ANCHORS={0x665ff:'8b5820',0x66603:'8b501c',0x66613:'8b12',0x6661d:'8b4a20',0x66620:'3bd9',0x66622:'7fe9',0x66624:'7c0b',
 0x66626:'8b4a1c',0x66629:'390d6c5a0700',0x6662f:'7fdc',0x66631:'8910',0x66634:'8b0d645a07008901',
 0x828a8:'8bc7',0x828b5:'528b15705a07008915985a0700',0x828c3:'e90c3dfeff',0x828e6:'894f20',0x828fa:'e9d53cfeff',0x82d2e:'e9a138feff'}
class Bad(AssertionError):pass
def verify(b,r):
 n=0
 def ck(x,s):
  nonlocal n
  if not x:raise Bad('O143 '+s)
  n+=1
 ck(len(b)==861133 and hashlib.sha256(b).hexdigest()==SHA,'source identity')
 ck(r['schema']=='mk2_o143_render_object_ordered_list_insertion_v1' and r['canonicalEXESHA256']==SHA,'report identity')
 ck(r['insertionFunctionPhysical']==0x665d4 and r['newObjectPointerInput']=='EAX' and r['objectNextLinkOffset']==0,'input and next-pointer')
 ck(r['sortKeys']==[{'offset':32,'signed32':True},{'offset':28,'signed32':True}],'lexical source keys')
 ck(r['insertionOrder']=='lexicographic ascending signed DWORD +0x20 then signed DWORD +0x1C; equal keys insert before current element','comparator semantics')
 ck(r['sourceRegistrations']==['Tomb object initializer path','Portal/Tower shared callback object initializer path','Portal alternate object path'],'source paths')
 ck(r['listHeadSelectedBySource']=={'sharedPortalTowerCallback':'task context pointer [ESI+0x58] written to 0x75A98','tomb':'0x84340','portalAlternate':'0x84344'},'candidate list roots')
 ck(r['limits']=={'originalListInsertionOrderVerified':True,'actualRendererDrawTraversalVerified':False,'objectAliveInRuntimeVerified':False,
   'specificPerObjectDepthVerified':False,'finalCompositingOcclusionVerified':False,'spriteCameraMappingVerified':False},'unresolved draw order boundary')
 ck(len(r['originalInstructions'])==len(ANCHORS),'witness population')
 for at,hexbytes in ANCHORS.items():ck(b[at:at+len(bytes.fromhex(hexbytes))]==bytes.fromhex(hexbytes),'bytecode '+hex(at))
 for row in r['originalInstructions'].values():
  at=row['physical'];raw=row['bytes'];ck(at in ANCHORS and raw==ANCHORS[at],'reported independent witness')
 ck(len(r['originalTailJumps'])==3,'tail call count')
 for row in r['originalTailJumps']:
  at=row['physical'];target=row['target'];ck(at in (0x828c3,0x828fa,0x82d2e) and target==0x665d4,'source edge')
  ck(b[at]==0xe9 and at+5+struct.unpack_from('<i',b,at+1)[0]==target,'relative jump witness')
 return {'status':'PASS_O143_INDEPENDENT_SOURCE','assertions':n,'identifiedInsertionSortKeys':[32,28], 'actualDrawOrderKnown':False}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--report',required=True);x=a.parse_args()
 print(json.dumps(verify(Path(x.exe).read_bytes(),json.loads(Path(x.report).read_text())),indent=2))

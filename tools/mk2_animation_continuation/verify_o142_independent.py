#!/usr/bin/env python3
"""Independent explicit instruction + positional arithmetic validation, no producer import."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
class Fail(AssertionError):pass
def verify(b,r):
 checks=0
 def ck(ok,msg):
  nonlocal checks
  if not ok:raise Fail('O142 '+msg)
  checks+=1
 ck(len(b)==861133,'size');ck(hashlib.sha256(b).hexdigest()==SHA,'original SHA')
 ck(r['originalEXESHA256']==SHA and r['schema']=='mk2_o142_stage_effect_initial_object_position_inputs_v1','report identity')
 fixed={0x8272a:'833d4c01030000',0x82e38:'833d4c01030000',0x82e54:'833d4c01030001',
 0x827f2:'895054',0x8280c:'8b5654',0x82821:'e876000000',0x828a3:'e87121feff',
 0x64a1a:'8915845a0700',0x64a20:'c1fa10',0x64a25:'c1f802',0x64a28:'2bd0',0x64a2a:'6689571e',
 0x64a2e:'8b15845a0700',0x64a34:'c1e210c1fa10',0x64a3c:'c1f802',0x64a3f:'2bd0',0x64a41:'6689571a'}
 for at,hexv in fixed.items():
  ck(b[at:at+len(bytes.fromhex(hexv))]==bytes.fromhex(hexv),f'original instruction {at:#x}')
 ck(len(r['originalInstructions'])==len(fixed),'instruction list complete')
 for x in r['originalInstructions'].values():
  at=x['physical'];raw=bytes.fromhex(x['hex']);ck(at in fixed and raw==bytes.fromhex(fixed[at]),'exact named instructions')
 ck(len(r['sourceArgumentSites'])==3,'three statically identifiable helper call sites')
 expected=[('portal_helper_first',0x82737,0x82750,0x164b4,'Portal',0x5e0230,420,71),
           ('portal_helper_second',0x82755,0x8276e,0x164b4,'Portal',0x5e0318,594,71),
           ('tower_helper',0x82e5d,0x82e76,0x16490,'Tower',0x630240,432,75)]
 for row,(name,at,helper,track,stage,raw,x,y) in zip(r['sourceArgumentSites'],expected):
  ck(row['name']==name and row['stage']==stage,'stage/source site')
  ck(row['immediatePhysical']==at and row['helperCallPhysical']==helper and row['sourceFrameListObject2']==track,'site location')
  ck(b[at]==0xba and struct.unpack_from('<I',b,at+1)[0]==raw and row['packedOriginalEDXSourceImmediate']==raw,'original input')
  ck(b[helper]==0xe8 and helper+5+struct.unpack_from('<i',b,helper+1)[0]==0x827df,'original helper branch')
  lo=(raw&65535);hi=raw>>16
  ck(row['signedLow16Input']==lo and row['signedHigh16Input']==hi,'source halves')
  ck(x==lo-(lo>>2) and y==hi-(hi>>2),'independent transform')
  ck(row['initialObjectHighWordAtPlus1A']==x and row['initialObjectHighWordAtPlus1E']==y,'initial high word values')
  ck(row['qualifiedAsRuntimeWorldCoordinate'] is False,'no live coordinate claim')
 ck(set(x['name'] for x in r['sourceArgumentSites'])==set(q[0] for q in expected),'no duplicate/or missing sites')
 ck(r['sourceTransform']['decoderFunctionPhysical']==0x64a19 and r['sourceTransform']['taskSourceStorageField']==0x54,'transform provenance')
 ck(r['limits']=={'sourceInitializationInputsVerified':True,'atLeastTwoPortalCodeSites':True,'oneTowerCodeSite':True,
    'runtimeObjectInstancesVerified':False,'livePositionVerified':False,'cameraOrParallaxVerified':False,'timingVerified':False,
    'modeDependentObjectCreation':True},'runtime caveats')
 for src,dst in ((0x82821,0x8289c),(0x828a3,0x64a19)):
  ck(src+5+struct.unpack_from('<i',b,src+1)[0]==dst,'callback to decoder edge')
 return {'status':'PASS_O142_INDEPENDENT','assertions':checks,'originalInitializerSites':3,'sourceCoordinates':[(x[6],x[7]) for x in expected],
 'liveWorldPositionsKnown':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--report',required=True);a=p.parse_args()
 print(json.dumps(verify(Path(a.exe).read_bytes(),json.loads(Path(a.report).read_text())),indent=2))

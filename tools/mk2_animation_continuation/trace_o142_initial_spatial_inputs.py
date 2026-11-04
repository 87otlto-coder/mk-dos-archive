#!/usr/bin/env python3
"""O142: original Portal/Tower fixed-point HIGH-WORD initial position inputs.
These are source-initialized render object fields, not live fight/world/viewport coordinates.
"""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
INPUT_SITES=[('portal_helper_first',0x82737,0x82750,0x164b4,'Portal'),
 ('portal_helper_second',0x82755,0x8276e,0x164b4,'Portal'),
 ('tower_helper',0x82e5d,0x82e76,0x16490,'Tower')]
STABLE_INSTRUCTIONS={
 'taskSavesSourceEDXToPlus54':(0x827f2,'895054'),
 'taskRestoresSourceEDX':(0x8280c,'8b5654'),
 'callbackPassesToInitHelper':(0x82821,'e876000000'),
 'initCallsCoordinateDecoder':(0x828a3,'e87121feff'),
 'decoderSavesEDX':(0x64a1a,'8915845a0700'),
 'decoderSignedUpperHalf':(0x64a20,'c1fa10'),
 'decoderQuarterUpper':(0x64a25,'c1f802'),
 'decoderSubtractUpper':(0x64a28,'2bd0'),
 'decoderStoreUpperToPlus1E':(0x64a2a,'6689571e'),
 'decoderRestoreOriginal':(0x64a2e,'8b15845a0700'),
 'decoderSignExtendLower':(0x64a34,'c1e210c1fa10'),
 'decoderQuarterLower':(0x64a3c,'c1f802'),
 'decoderSubtractLower':(0x64a3f,'2bd0'),
 'decoderStoreLowerToPlus1A':(0x64a41,'6689571a'),
 'portalConditionalSetup':(0x8272a,'833d4c01030000'),
 'towerConditionalSetup':(0x82e38,'833d4c01030000'),
 'towerSecondModeCheck':(0x82e54,'833d4c01030001')}
def req(b,reason):
 if not b:raise ValueError('O142 '+reason)
def read(b):
 req(len(b)==861133 and hashlib.sha256(b).hexdigest()==SHA,'wrong source executable')
 return b
def code_check(b,at,hexbytes):req(b[at:at+len(bytes.fromhex(hexbytes))]==bytes.fromhex(hexbytes),f'code {at:#x}')
def call_target(b,at):
 req(b[at] in (0xe8,0xe9),'expected relative call or jump')
 return at+5+struct.unpack_from('<i',b,at+1)[0]
def s16(n):return n-65536 if n&0x8000 else n
def translated_s16(n):
 n=s16(n)
 return n-(n>>2) # exact signed arithmetic 32-bit shift by 2

def trace(b):
 read(b)
 for k,(at,hexbytes) in STABLE_INSTRUCTIONS.items():code_check(b,at,hexbytes)
 for site,target in ((0x82750,0x827df),(0x8276e,0x827df),(0x82e76,0x827df),(0x82821,0x8289c),(0x828a3,0x64a19)):
  req(call_target(b,site)==target,f'original callback edge {site:#x}')
 entries=[]
 for name,at,helper,track,stage in INPUT_SITES:
  req(b[at]==0xba,'expected MOV EDX imm32')
  packed=struct.unpack_from('<I',b,at+1)[0]
  req(call_target(b,helper)==0x827df,'helper source edge')
  upper=translated_s16(packed>>16)
  lower=translated_s16(packed&65535)
  entries.append({'name':name,'stage':stage,'packedOriginalEDXSourceImmediate':packed,
    'immediatePhysical':at,'helperCallPhysical':helper,'sourceFrameListObject2':track,
    'initialObjectHighWordAtPlus1A':lower,'initialObjectHighWordAtPlus1E':upper,
    'signedLow16Input':s16(packed&65535),'signedHigh16Input':s16((packed>>16)&65535),
    'qualifiedAsRuntimeWorldCoordinate':False})
 req([x['packedOriginalEDXSourceImmediate'] for x in entries]==[0x5e0230,0x5e0318,0x630240],'expected original source inputs')
 return {'schema':'mk2_o142_stage_effect_initial_object_position_inputs_v1','originalEXESHA256':SHA,
  'addressScope':'physical EXE offsets, not emulated loaded addresses',
  'originalInstructions':{key:{'physical':at,'hex':v} for key,(at,v) in STABLE_INSTRUCTIONS.items()},
  'sourceArgumentSites':entries,'sourceTransform':{'decoderFunctionPhysical':0x64a19,
    'input':'EDX packed high/low signed 16-bit halves',
    'arithmetic':'signedHalf - (signedHalf >> 2) with SAR truncation toward negative infinity',
    'stores':'signed low result to WORD render-object +0x1A and signed upper to WORD render-object +0x1E',
    'taskSourceStorageField':0x54},
  'limits':{'sourceInitializationInputsVerified':True,'atLeastTwoPortalCodeSites':True,'oneTowerCodeSite':True,
    'runtimeObjectInstancesVerified':False,'livePositionVerified':False,'cameraOrParallaxVerified':False,'timingVerified':False,
    'modeDependentObjectCreation':True}}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--out',required=True);a=p.parse_args()
 out=Path(a.out);req(not out.exists(),'refuse overwrite');out.write_text(json.dumps(trace(Path(a.exe).read_bytes()),indent=2)+'\n')
 print('PASS O142 original Portal/Tower source coordinate inputs; runtime placement unresolved')

#!/usr/bin/env python3
"""O134: source-proven scene-init callback pointers and Tomb/Portal function registrations.

This is a CANDIDATE EFFECT/BEHAVIOR FUNCTION CENSUS, not an animation/frame
sequence, timer, or proof of runtime invocation. Input is canonical MK2.EXE.
"""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
from trace_o120_setup_graph import OBJ1,OBJ2,EXE_SHA,fixups
from trace_o130_dynamic_stage_streams import TABLES

NAMES=['DEDPOOL.GRA','TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA',
       'ARMORY.GRA','PIT.GRA','PORTAL.GRA','ARENA.GRA','CAVE.GRA']
# Known original registration call sites within bounded source functions.
SITES={'tomb':[(0x82ce7,'init_callback'),(0x82cfa,'init_callback')],
       'portal':[(0x82793,'init_callback'),(0x827bf,'init_callback'),
                 (0x827d2,'init_callback'),(0x827e6,'nested_helper')]}
REGISTER=0x67222
ROOT_PTR=0x10

def require(ok,msg):
 if not ok:raise ValueError('O134: '+msg)
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def s32(b,p):return struct.unpack_from('<i',b,p)[0]
def authentic_ptr(fx,obj,source,target_obj,target):
 x=fx.get((obj,source));require(x is not None and (x['kind'],x['flags'],x['targetObject'],x['targetOffset'])==
     (7,16,target_obj,target),'typed LE pointer at '+str(obj)+':'+hex(source))

def produce(exe:bytes)->dict:
 require(len(exe)==861133 and hashlib.sha256(exe).hexdigest()==EXE_SHA,'canonical executable required')
 fx=fixups(exe);rows=[]
 for idx,name in enumerate(NAMES):
  callbacks=[]
  for mode,base in TABLES.items():
   root=u32(exe,OBJ2+base+4*idx)
   authentic_ptr(fx,2,base+4*idx,2,root)
   callback=u32(exe,OBJ2+root+ROOT_PTR)
   authentic_ptr(fx,2,root+ROOT_PTR,1,callback)
   require(OBJ1<=OBJ1+callback<len(exe),'callback outside file image')
   callbacks.append({'mode':mode,'rootObject2':root,'callbackPointerFieldObject2':root+ROOT_PTR,
                     'callbackObject1':callback,'callbackPhysical':OBJ1+callback})
  require(len({x['callbackObject1'] for x in callbacks})==1,'mode-dependent init callback')
  rows.append({'stageIndex':idx,'resourceName':name,'modeCandidates':callbacks,
               'callbackObject1':callbacks[0]['callbackObject1'],
               'callbackPhysical':callbacks[0]['callbackPhysical']})
 require(exe[0x81f41:0x81f4a].hex()=='8b1883c00450ffd358','loader CALL [callback] boundary')
 require(exe[0x82cd7:0x82ce0].hex()=='833d4c010300007426','Tomb mode conditional entry')
 require(exe[0x8272a:0x82737].hex()=='833d4c010300000f84a7000000','Portal mode conditional entry')
 require(rows[1]['callbackPhysical']==0x82cd7 and rows[7]['callbackPhysical']==0x8272a,
         'Tomb/Portal stage init targets')
 candidates={}
 for stage,sites in SITES.items():
  refs=[]
  for at,scope in sites:
   require(exe[at-5:at]==b'\xbb\x06\x00\x00\x00','expected EBX=6 at registration')
   require(exe[at]==0xba and exe[at+5]==0xe8,'MOV EDX/relative CALL structure')
   target=u32(exe,at+1)
   authentic_ptr(fx,1,at+1-OBJ1,1,target)
   call_target=at+10+s32(exe,at+6)
   require(call_target==REGISTER,'expected registration call target')
   require(OBJ1+target<len(exe),'registered function outside original file')
   refs.append({'scope':scope,'moveFunctionPointerPhysical':at,'registrationCallPhysical':at+5,
                'registerRoutinePhysical':call_target,'argumentEBX':6,
                'registeredFunctionObject1':target,'registeredFunctionPhysical':OBJ1+target})
  candidates[stage]={'stageIndex':1 if stage=='tomb' else 7,
    'callbackPhysical':rows[1 if stage=='tomb' else 7]['callbackPhysical'],
    'registrations':refs,
    'registrationSiteCount':len(refs),
    'distinctFunctionTargets':sorted({r['registeredFunctionPhysical'] for r in refs}),
    'note':'Pointers passed into registration-like routine in source code, not observed during a fight.'}
 # Helper call in Portal init and three per-object fields stored in helper.
 for start in (0x82750,0x8276e):
  require(exe[start]==0xe8 and start+5+s32(exe,start+1)==0x827df,'Portal callback calls nested setup helper')
 require(exe[0x827f2:0x827f5].hex()=='895054' and
         exe[0x827fc:0x827ff].hex()=='895058' and
         exe[0x82807:0x8280a].hex()=='89505c','Portal helper writes object fields +54,+58,+5c')
 return {'schema':'mk2_o134_stage_initializer_callback_sources_v1',
   'status':'PASS_STATIC_SCENE_INIT_AND_BEHAVIOR_POINTERS',
   'exeSHA256':EXE_SHA,'sourceLoaderPhysical':0x81f41,'rootCallbackFieldOffset':ROOT_PTR,
   'firstTenStages':rows,'examinedBehaviorCandidates':candidates,
   'portalNestedHelperPhysical':0x827df,'portalObjectFieldWrites':[0x54,0x58,0x5c],
   'limitations':{'sourceFunctionPointerProven':True,'targetIsExecutableCode':True,
     'selectedCandidateCalledDuringFight':False,'registeredFunctionsExecuteDuringFight':False,
     'registeredFunctionIsAnimationFrameSequence':False,'animationFramesRecovered':False,
     'animationLoopOrTimingRecovered':False,'cameraParallaxRateRecovered':False,
     'sourceGraphicsRemainUncropped':True},
   'notes':['Root field +0x10 is called by the loader BEFORE it reads the motion-source pointer at +0x14.',
     'Source code passes original function pointers to a common helper at physical 0x67222 with EBX=6.',
     'Additional callbacks and indirect runtime paths may exist; this is not an exhaustive background animation census.',
     'Do not infer a per-frame rate, effect name, frame list, or actual runtime activation from registration calls.']}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
 require(not a.out.exists(),'no overwriting evidence files');a.out.write_text(json.dumps(produce(a.exe.read_bytes()),indent=2)+'\n')

#!/usr/bin/env python3
"""O135: original MK2 scene callback coroutine and bounded state-update evidence.

Static data flow ONLY. Explicitly not a recovered animation strip, playback
clock, layer binding or a runtime proof of active effects.
"""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
from trace_o120_setup_graph import OBJ1, OBJ2, EXE_SHA, fixups
from trace_o134_stage_behavior_callbacks import produce as callbacks

def req(t,why):
    if not t: raise ValueError('O135: '+why)
def u32(b,at):return struct.unpack_from('<I',b,at)[0]
def signed(b,at):return struct.unpack_from('<i',b,at)[0]
def jmp_target(b,at):return at+5+signed(b,at+1)
def sha(b):return hashlib.sha256(b).hexdigest()

def verify_bytes(b,at,h):
    req(b[at:at+len(h)//2].hex()==h, 'source instruction at '+hex(at))

def reloc(fx,source_physical,target_obj,target):
    k=(1 if source_physical<OBJ2 else 2,source_physical-(OBJ1 if source_physical<OBJ2 else OBJ2))
    v=fx.get(k)
    req(v is not None and (v['kind'],v['flags'],v['targetObject'],v['targetOffset'])==(7,16,target_obj,target),
        'typed relocation '+hex(source_physical))

def analyze(exe:bytes):
    req(len(exe)==861133 and sha(exe)==EXE_SHA,'canonical MK2.EXE only')
    fx=fixups(exe)
    links=callbacks(exe)['examinedBehaviorCandidates']
    # Coroutine scheduler installs a callback in a work-list. Return/yield saves
    # a counter and resumes from saved continuation in a later scheduler pass.
    verify_bytes(exe,0x67222,'5551a1085b030085c07452')
    verify_bytes(exe,0x67242,'66c740060100')  # registered delay initialized to 1
    verify_bytes(exe,0x67248,'89501c')        # callback pointer
    verify_bytes(exe,0x6710f,'5a6689460689561c896e08')
    verify_bytes(exe,0x67158,'66ff4e067ff4')
    verify_bytes(exe,0x67182,'8b7e18ff661c')
    paths={}
    for stage,refs in links.items():
        paths[stage]=[]
        for target in refs['distinctFunctionTargets']:
            limits={0x82d33:0x82d98,0x82d9a:0x82e21,
                    0x8280c:0x8289c,0x828ff:0x8291f,0x8291f:0x829bc}
            req(target in limits,'unknown function target')
            end=limits[target]
            paths[stage].append({'functionPhysical':target,'sourceObject1':target-OBJ1,
                                 'examinedEndExclusive':end,'examinedBytesSHA256':sha(exe[target:end]),
                                 'sourceCodeOnly':True})
    req({r['functionPhysical'] for r in paths['tomb']}=={0x82d33,0x82d9a},'Tomb source targets')
    req({r['functionPhysical'] for r in paths['portal']}=={0x8280c,0x828ff,0x8291f},'Portal source targets')
    # Tomb: two independently registered routines, each explicitly yields six
    # scheduler counts inside a loop and checks a world-dependent object value.
    for origin,wait,ptrsite,ptr,axisread,threshold in (
       (0x82d33,0x82d65,0x82d51,0x17814,0x82d74,0x30),
       (0x82d9a,0x82dc7,0x82db3,0x177ec,0x82dd6,0x6c)):
        verify_bytes(exe,wait,'b806000000')
        req(exe[wait+5]==0xe8 and jmp_target(exe,wait+5)==0x6710f,'Tomb coroutine yield')
        req(exe[ptrsite:ptrsite+6]==bytes.fromhex('c705785a0700') and u32(exe,ptrsite+6)==ptr,'Tomb data-pointer assignment')
        reloc(fx,ptrsite+6,2,ptr)
        verify_bytes(exe,axisread,'0fbf471a')
    verify_bytes(exe,0x82d85,'2bc383f830')
    verify_bytes(exe,0x82de1,'2bd883fb6c')
    verify_bytes(exe,0x82e06,'b860000000')
    req(jmp_target(exe,0x82e0b)==0x6710f,'Tomb later scheduler delay')
    # Portal routine 0x8280c: writes the local object's +0x14 from a global;
    # the source loop increments/decrements that global in *fixed-point words*.
    verify_bytes(exe,0x82830,'c7057c5a070000300000')
    verify_bytes(exe,0x82849,'81057c5a070000030000')
    verify_bytes(exe,0x82853,'528b157c5a07008957145a')
    verify_bytes(exe,0x8285e,'813d7c5a070000600000')
    verify_bytes(exe,0x82879,'812d7c5a070000030000')
    verify_bytes(exe,0x82883,'528b157c5a07008957145a')
    verify_bytes(exe,0x8288e,'813d7c5a070000a0ffff')
    for at in (0x8283a,0x8286a):
        req(exe[at:at+5]==b'\xb8\x01\x00\x00\x00' and jmp_target(exe,at+5)==0x6710f,
            'Portal scheduler one-count wait')
    # A source-level stepping example, not a runtime-timed animation.
    first=[0x3000+i*0x300 for i in range(1,(0x6000-0x3000)//0x300+1)]
    descending=[0x6000-i*0x300 for i in range(1,(0x6000+0x6000)//0x300+1)]
    req(first[-1]==0x6000 and descending[-1]==-0x6000,'stepping arithmetic')
    # Other two Portal routines: verified pointer/state assignments and repeated
    # coroutine re-entry; no sprite-frame mapping can be inferred from them.
    verify_bytes(exe,0x828ff,'c705785a0700d8640100')
    reloc(fx,0x82905,2,0x164d8)
    verify_bytes(exe,0x8291f,'c7056c5a070074660100')
    reloc(fx,0x82925,2,0x16674)
    verify_bytes(exe,0x82959,'b8ff0f00006689471a6689471e')
    verify_bytes(exe,0x8298a,'c705805a070002000000')
    verify_bytes(exe,0x82994,'c705785a0700f8640100')
    reloc(fx,0x8299a,2,0x164f8)
    verify_bytes(exe,0x829b2,'ff0d805a070075da')
    return {
      'schema':'mk2_o135_stage_coroutine_static_control_v1',
      'status':'PASS_STATIC_COROUTINE_AND_BOUNDED_POSITION_UPDATE',
      'canonicalExeSHA256':EXE_SHA,
      'scheduler':{'registrationPhysical':0x67222,'registrationNewCounter':1,
          'registeredCallbackStorageOffset':0x1c,'yieldPhysical':0x6710f,
          'savedCountFieldOffset':6,'resumeCounterDecrementPhysical':0x67158,
          'resumeContinuationJumpPhysical':0x67185,
          'countsAreNotSecondsOrProvenRenderFrames':True},
      'stages':{
       'tomb':{'functions':paths['tomb'], 'sixCountYieldSites':[0x82d65,0x82dc7],
               'sourcePointerAssignments':[{'physical':0x82d51,'targetObject2':0x17814},
                                           {'physical':0x82db3,'targetObject2':0x177ec}],
               'comparisonThresholds':[48,108],
               'postLoopYieldCount':96,'postLoopYieldPhysical':0x82e0b},
       'portal':{'functions':paths['portal'],
                 'boundedUpdate':{'functionPhysical':0x8280c,
                  'accumulatorGlobalObject1':0x75a7c-OBJ1,
                  'objectFieldWritten':0x14,
                  'initial':0x3000,'delta':0x300,
                  'positiveThreshold':0x6000,'negativeThreshold':-0x6000,
                  'positiveYieldPhysical':0x8283f,'negativeYieldPhysical':0x8286f,
                  'sourceAscendingValues':first,'sourceDescendingValues':descending,
                  'valuesAreCodeArithmeticNotObservedTimeline':True},
                 'otherSourcePointers':[{'physical':0x828ff,'targetObject2':0x164d8},
                                        {'physical':0x8291f,'targetObject2':0x16674},
                                        {'physical':0x82994,'targetObject2':0x164f8}],
                 'alternateRoutineCounterInitial':2,'counterGlobalObject1':0x75a80-OBJ1,
                 'nestedObjectStateFields':[0x54,0x58,0x5c]}},
      'limitations':{'coroutinesStaticallyIdentified':True,
        'liveStageCallbackInvocationVerified':False,'specificSpriteBindingRecovered':False,
        'animationFrameSequenceRecovered':False,'animationFrameTimingRecovered':False,
        'parallaxRelativeToCameraRecovered':False,'originalGraphicsUncropped':True},
      'notes':['The scheduler saves a counter and continuation; source delays are counts, not FPS.',
         'Portal stepping values are derived solely from encoded constants and branches; no gameplay loop has been observed.',
         'Tomb comparison thresholds and stage pointers are original source operands, not proven effect names or sprite animation frames.']}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
    req(not a.out.exists(),'refusing to overwrite report');a.out.write_text(json.dumps(analyze(a.exe.read_bytes()),indent=2)+'\n')

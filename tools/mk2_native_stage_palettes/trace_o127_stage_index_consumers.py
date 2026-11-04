#!/usr/bin/env python3
"""O127: canonical-exe, static configuration index inputs and downstream indexed render adjustment.

A typed source graph, not proof of any live MK2 stage/mode/camera state.
"""
from __future__ import annotations
import argparse, hashlib, json, struct
from pathlib import Path
from trace_o120_setup_graph import EXE_SHA,OBJ1,OBJ2,fixups,require
from trace_o125_stage_dispatch import TABLE_LEN, BASES

ROOT_DISPATCH=0x82321
INDEX_WORK=0x75A80
SAVED_INDEX=0x7747F
RENDER_TABLE=0x2EF54
CALLERS={0x74D4D:'dynamic_stage_state_or_conditional_override',
  0x758CC:'earlier_2_with_intervening_calls',
  0x771E6:'adjacent_literal_7',
  0x77A08:'adjacent_literal_6',
  0x77D8B:'adjacent_literal_5',
  0x84D32:'unresolved_scratch_after_calls',
  0x84EEE:'saved_scratch_literal_30_restored',
  0x85FAE:'adjacent_literal_13',
  0x94965:'unresolved_scratch_after_calls'}
DIRECT={0x771E6:(0x771DC,7),0x77A08:(0x779FE,6),0x77D8B:(0x77D81,5),
        0x84EEE:(0x84EE4,30),0x85FAE:(0x85FA4,13)}
# Boundaries use canonical Watcom 32-bit instructions; never decode a raw byte coincidence as a call.
ANCHORS={
 'dispatcher_index_load':(0x82321,'a1805a0700'),
 'dispatcher_saved_index':(0x82326,'a37f740700'),
 'dispatcher_index_scale':(0x8232c,'c1e002'),
 'dispatcher_root_load':(0x82353,'8b00'),
 'dispatcher_overwrites_scratch':(0x82355,'a3805a0700'),
 'renderer_state_gate':(0x9E118,'f705d4620500010000007473'),
 'renderer_preserve_low16':(0x9E13a,'81e6ffff0000'),
 'renderer_load_saved_index':(0x9E165,'a17f740700'),
 'renderer_indexed_adjust':(0x9E16a,'03348554ef0200'),
 'indirect_dispatch_index_scale':(0x98ba8,'c1e002'),
 'indirect_dispatch_pop_register':(0x98ba6,'58'),
 'indirect_dispatch_lookup':(0x98bcf,'8b00'),
 'indirect_dispatch_earlier_push':(0x98b7d,'50'),
 'indirect_dispatch_candidate_constant':(0x98afb,'b814000000'),
 'dynamic_initial_copy':(0x74cf4,'8b15126507008915805a0700'),
 'dynamic_override_source':(0x74d2c,'8b15f6cf02008915805a0700'),
 'dynamic_override_dec':(0x74d39,'ff0d805a0700'),
 'conditional_candidate_2':(0x7589d,'c705805a070002000000'),
 'intervening_call_a':(0x758c2,'e807e20100'),
 'intervening_call_b':(0x758c7,'e8b9edfeff'),
 'scratch_post_save':(0x84ede,'ff35805a0700'),
 'scratch_post_restore':(0x84ef3,'8f05805a0700'),
 'dynamic_index_other':(0x9493c,'8915805a0700'),
}

def hexhash(data):return hashlib.sha256(data).hexdigest()
def val(b,p):return struct.unpack_from('<I',b,p)[0]
def anchor(b,at,hx):require(b[at:at+len(hx)//2].hex()==hx,f'instruction boundary {at:06x}')
def typed(fx,obj,source,target):
    v=fx.get((obj,source))
    require(v is not None and (v['kind'],v['flags'],v['targetObject'],v['targetOffset'])==(7,16,2,target),
        f'LE relocated typed pointer {obj}:{source:06x} -> 2:{target:06x}')

def produce(b):
    require(len(b)==861133 and hexhash(b)==EXE_SHA,'original game EXE required')
    fx=fixups(b)
    for _,(at,hx) in ANCHORS.items():anchor(b,at,hx)
    # Opcode-aware exhaustive direct-E8 call census in the canonical object-1 image.
    found=[]
    for p in range(OBJ1,OBJ2-5):
        if b[p]==0xE8 and p+5+struct.unpack_from('<i',b,p+1)[0]==ROOT_DISPATCH:
            found.append(p)
    require(found==sorted(CALLERS),'direct dispatcher E8 candidate census changed')
    for p in found:
        anchor(b,p,('e8'+struct.pack('<i',ROOT_DISPATCH-p-5).hex()))
    for call,(site,index) in DIRECT.items():
        anchor(b,site,'c705805a0700'+struct.pack('<I',index).hex())
        require(site+10==call or (call,site)==(0x84EEE,0x84EE4),'literal not immediately next to call')
        # For all five, it really is adjacent; the separate branch above is a defensive identifier.
        require(site+10==call,'literal source must immediately precede call')
        typed(fx,1,site+2-OBJ1,INDEX_WORK)
    for at,target in [(0x82322,INDEX_WORK),(0x82327,SAVED_INDEX),(0x82356,INDEX_WORK),
                      (0x9e166,SAVED_INDEX),(0x9e16d,RENDER_TABLE),
                      (0x74cfa+2,INDEX_WORK),(0x74d32+2,INDEX_WORK),
                      (0x7589d+2,INDEX_WORK),(0x84ede+2,INDEX_WORK),
                      (0x84eee-10+2,INDEX_WORK),(0x84ef3+2,INDEX_WORK)]:
        typed(fx,1,at-OBJ1,target)
    # Same original index is stored BEFORE the dispatcher replaces scratch with a root pointer.
    require(b[0x82321:0x8232b].hex()=='a1805a0700a37f740700','index snapshot sequence')
    # The renderer reads only this *directly relocated* index and then adds a separate table DWORD.
    refs=sorted(v['sourcePhysical'] for v in fx.values() if v['targetObject']==2 and v['targetOffset']==SAVED_INDEX)
    require(refs==[0x82327,0x9e166],'unexpected direct saved-index refs')
    render_refs=sorted(v['sourcePhysical'] for v in fx.values() if v['targetObject']==2 and v['targetOffset']==RENDER_TABLE)
    require(render_refs==[0x9e16d],'unexpected render-adjustment base refs')
    adjust=[val(b,OBJ2+RENDER_TABLE+4*i) for i in range(TABLE_LEN)]
    # Verify selector table nulls against earlier independent O125 result.
    by_mode={}
    for mode,base in BASES.items():
        roots=[val(b,OBJ2+base+4*i) for i in range(TABLE_LEN)]
        require([i for i,v in enumerate(roots) if not v]==[10,11,21],'config null slots')
        by_mode[mode]=roots
    require(by_mode['mode_equals_2'][1]==0x171f0 and by_mode['mode_equals_2'][7]==0x16378,'stage roots')
    caller_entries=[]
    for call,classification in sorted(CALLERS.items()):
        c={'callPhysical':call,'sourceClassification':classification,'directCallConfirmed':True,
           'runtimeIndexObserved':False}
        if call in DIRECT:
            c.update(immediatePreCallValue=DIRECT[call][1],immediateWritePhysical=DIRECT[call][0],
                     configurationRootByMode={name:roots[DIRECT[call][1]] for name,roots in by_mode.items()})
        if call==0x84EEE:c['priorScratchRestoredPhysical']=0x84ef3
        if call==0x758CC:c['earlierCandidateTwoPhysical']=0x7589d; c['interveningCalls']=[0x758c2,0x758c7]
        if call==0x74D4D:c['possibleSourceFields']=[0x76512,0x2cff6];c['overrideDecrements']=1
        caller_entries.append(c)
    return {'schema':'mk2_o127_stage_index_caller_and_renderer_graph_static_v1',
       'status':'PASS_STATIC_INDEX_CALLERS_AND_RENDER_ADJUSTMENT',
       'sourceExeSHA256':EXE_SHA,'typedFixupEntries':len(fx),
       'rootDispatcherPhysical':ROOT_DISPATCH,'rootTableLength':TABLE_LEN,
       'directCallerCount':len(found),'directCallers':caller_entries,
       'snapshot':{'scratchObject2':INDEX_WORK,'saveIndexPhysical':0x82326,
                   'saveIndexObject2':SAVED_INDEX,'overwriteScratchWithRootPhysical':0x82355,
                   'directRelocatedSitesForSavedIndex':refs},
       'renderer':{'gatePhysical':0x9e118,'savedIndexLoadPhysical':0x9e165,
                   'indexTableAddPhysical':0x9e16a,'indexTableObject2':RENDER_TABLE,
                   'indexTableLengthAudited':TABLE_LEN,'renderTableDWORDs':adjust,
                   'renderTableSHA256':hexhash(b[OBJ2+RENDER_TABLE:OBJ2+RENDER_TABLE+4*TABLE_LEN]),
                   'renderTableDirectRelocatedSites':render_refs,
                   'directTableIndexGuardPresentBetweenLoadAndAdd':False,
                   'runtimeRendererValuesObserved':False},
       'otherSelector':{'entryPhysical':0x98ba7,'eaxScalePhysical':0x98ba8,
                        'priorPopEAXPhysical':0x98ba6,'earlierPushEAXPhysical':0x98b7d,
                        'oneUpstreamCandidateImmediate20Physical':0x98afb,
                        'runtimeValueProven':False,'ownIndexGuardPresent':False},
       'limitations':['The nine E8 call sites are an opcode-aware census of canonical binary candidates, checked against trusted instruction boundaries; it is not a whole-program CFG.',
                      'A write immediately before a call establishes the requested slot in that path, but not the stage active during a user fight.',
                      'The saved index is also consumed by a gated renderer path, which adds a stage-indexed 32-bit DWORD; its screen-space meaning is not established.',
                      'Neither dispatcher bounds-checks the index immediately before the table dereference; this does not prove upstream bounds are absent.',
                      'The generic scratch field is reused for other purposes; its current value is not a stable global stage index.',
                      'The alternative dispatcher input can come from the EAX stack path; its runtime value is not established.',
                      'No live index, mode, camera, stage root, setup pointer, palette handle or DAC index has been observed.']}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
    a=p.parse_args()
    if a.out.exists():raise SystemExit('Refuse to overwrite '+str(a.out))
    r=produce(a.exe.read_bytes());a.out.write_text(json.dumps(r,indent=2)+'\n')
    print(json.dumps({'status':r['status'],'directCallers':r['directCallerCount'],'renderEntries':len(r['renderer']['renderTableDWORDs'])}))

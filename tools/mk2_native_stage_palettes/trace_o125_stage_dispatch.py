#!/usr/bin/env python3
"""O125: canonical MK2.EXE stage-root selection via three LE-relocated tables.

Static, typed, original-source evidence ONLY. No live mode/selection claim.
"""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
from trace_o120_setup_graph import fixups,EXE_SHA,OBJ1,OBJ2,require,SPECS

BASES={'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
TABLE_LEN=31
STAGE_SETUP={1:('Kombat Tomb',set(SPECS['tomb80'][3])),7:('The Portal',set(SPECS['portal80'][3]))}

def h(b):return hashlib.sha256(b).hexdigest()
def dw(b,p):return struct.unpack_from('<I',b,p)[0]

def typed(fx,b,at,obj=2):
    x=fx.get((2,at))
    require(x is not None and x['kind']==7 and x['flags']==16 and x['targetObject']==obj and x['targetOffset']==dw(b,OBJ2+at),f'bad LE typed pointer at {at:x}')
    return x['targetOffset']

def assert_dispatch_instructions(b,fx):
    # Verify instruction BOUNDARIES and actual table/mode values, not arbitrary byte search.
    sites={
      0x82321:'a1805a0700',       # mov eax,[mode-stage-selection-index]
      0x8232c:'c1e002',           # shl eax,2
      0x8232f:'baec5b0100',       # mov edx, first table
      0x82334:'833d4c01030002',   # cmp dword [mode],2
      0x8233d:'ba685c0100',       # mov edx, second table
      0x82342:'833d4c01030001',   # cmp dword [mode],1
      0x8234b:'bae45c0100',       # mov edx, third table
      0x82350:'03c2',             # add eax, edx
      0x82353:'8b00',             # mov eax, [eax]
      0x82355:'a3805a0700',       # store selected root
      0x98ba8:'c1e002',
      0x98bab:'baec5b0100',
      0x98bb0:'833d4c01030002',
      0x98bb9:'ba685c0100',
      0x98bbe:'833d4c01030001',
      0x98bc7:'bae45c0100',
      0x98bcc:'03c2',
      0x98bcf:'8b00',
      0x98bd1:'e8dc92feff',       # call scene coordinator 0x81eb2
      0x98bd6:'e8d88ffeff',       # call 0x81bb3 (dispatch loop)
      0x81bb7:'685b0100',         # typed relocation to 0x15b68
      0x81bc8:'8b430c',           # load pointer to a scene-specific live slot
      0x81bd9:'8b00',             # dereference live slot
      0x81c4e:'e8c3010000',
      0x81c53:'8b30',             # load selected setup pointer at [eax]
    }
    for p,v in sites.items():require(b[p:p+len(v)//2].hex()==v,f'instruction boundary at {p:x}')
    for p,dest in [(0x82330,0x15bec),(0x8233e,0x15c68),(0x8234c,0x15ce4),
                   (0x98bac,0x15bec),(0x98bba,0x15c68),(0x98bc8,0x15ce4),
                   (0x81bb7,0x15b68)]:
        at=fx.get((1,p-OBJ1));require(at and at['kind']==7 and at['flags']==16 and at['targetObject']==2 and at['targetOffset']==dest,f'instruction LE relocation {p:x}')
    return {hex(p):v for p,v in sorted(sites.items())}

def read_root_setup_links(b,fx,root,index):
    # The paired variant roots of each stage are adjacent; read within the
    # root's own region, NEVER into the following setup array or next root.
    other=0x1726c if index==1 and root==0x171f0 else 0x172dc if index==1 and root==0x1726c else 0x163d0 if index==7 and root==0x16378 else 0x1641c
    require(root<other and 0x40<=other-root<=0x100,'root region boundary')
    meta=[]
    for off in (0x14,0x18,0x1c):
        meta.append({'fieldOffset':off,'targetObject2':typed(fx,b,root+off)})
    require(meta[2]['targetObject2']==0x77453,'shared scene runtime slot pointer')
    links=[]
    for at in range(root+0x20,other,4):
        x=fx.get((2,at))
        if x and x['targetObject']==2 and x['targetOffset'] in STAGE_SETUP[index][1]:
            links.append({'rootFieldOffset':at-root,'setupObject2':typed(fx,b,at)})
    require(links,'root has no certified setup references')
    return {'rootObject2':root,'rootSHA256':h(b[OBJ2+root:OBJ2+other]),'rootRegionLength':other-root,
            'pointersAt14_18_1C':meta,'setupLinks':links,'distinctSetups':sorted(set(x['setupObject2'] for x in links))}

def produce(b):
    require(len(b)==861133 and h(b)==EXE_SHA,'original MK2 executable fingerprint')
    fx=fixups(b)
    code=assert_dispatch_instructions(b,fx)
    tables={}
    for mode,base in BASES.items():
        entries=[]
        for index in range(TABLE_LEN):
            off=base+index*4;value=dw(b,OBJ2+off)
            if value:
                target=typed(fx,b,off)
            else:
                require((2,off) not in fx,'relocation at null table entry');target=None
            item={'index':index,'pointerFieldObject2':off,'rootObject2':target}
            if index in STAGE_SETUP:
                require(target is not None,'missing Tomb/Portal root')
                item['stageResourceLabel']=STAGE_SETUP[index][0]
                item['rootEvidence']=read_root_setup_links(b,fx,target,index)
            entries.append(item)
        require([x['index'] for x in entries if x['rootObject2'] is None]==[10,11,21],f'{mode} null slots changed')
        tables[mode]={'object2Base':base,'entries':entries,'nonnull':sum(x['rootObject2'] is not None for x in entries)}
    # First dispatch loop has eight scene-node records of 16 bytes each.
    # Fourth field points to each of the eight runtime slots; NEVER report
    # which is selected at runtime without instrumentation.
    staging=[]
    for i in range(8):
        at=0x15b68+16*i
        links=[typed(fx,b,at+j) for j in (0,4,8,12)]
        require(links[3]==0x77453+4*i,'eighth slot pointer structure')
        staging.append({'ordinal':i,'object2Offset':at,'fields':links})
    differences=[]
    for i in range(TABLE_LEN):
        v=[tables[k]['entries'][i]['rootObject2'] for k in BASES]
        if len(set(v))>1:differences.append(i)
    return {'schema':'mk2_o125_stage_config_dispatch_static_v1','status':'PASS_STATIC_LE_STAGE_DISPATCH',
            'exeSHA256':h(b),'typedFixupEntries':len(fx),'dispatchInstructionBytes':code,
            'controlState':{'selectionIndexGlobalObject2':0x75a80,'modeGlobalObject2':0x3014c,
                            'mode2Table':'mode_equals_2','mode1Table':'mode_equals_1','fallbackTable':'mode_other',
                            'runtimeModeValueObserved':False,'runtimeStageIndexObserved':False},
            'tables':tables,'changingIndicesByMode':differences,
            'stagingLoop':{'loopPhysical':0x81bb3,'slotSentinelPhysical':0x81b56,'slotArrayObject2':0x77453,
                           'entries':staging},
            'limits':['The three 31-entry arrays are verified conditional stage-configuration tables, not observed runtime choices',
                       'Stage associations depend on authenticated setup/resource pointers; stage names are labels for the two verified root families',
                       'No live selected scene pointer, ESI setup, handle or VGA DAC start has been measured',
                       'Do not conflate the eight screen-object staging records with the 31-entry selection array']}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
    if a.out.exists():raise SystemExit('Refusing overwrite '+str(a.out))
    r=produce(a.exe.read_bytes());a.out.write_text(json.dumps(r,indent=2)+'\n')
    print(json.dumps({'status':r['status'],'nonemptyRoots':{k:v['nonnull'] for k,v in r['tables'].items()},'modeDependentIndices':r['changingIndicesByMode']}))

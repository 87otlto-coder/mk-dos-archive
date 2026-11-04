#!/usr/bin/env python3
"""O130 original EXE stage-root -> runtime stream pointer -> bounded command grammar.

This authenticates *available* streams, not their actual live activation or video effects.
"""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
from trace_o120_setup_graph import fixups,EXE_SHA,OBJ1,OBJ2,require

TABLES={'mode_equals_2':0x15BEC,'mode_equals_1':0x15C68,'mode_other':0x15CE4}
TITLES={1:'Tomb',7:'Portal'}
POOL_START=0xA0EF1;POOL_END=0xA13A7

def sha(d):return hashlib.sha256(d).hexdigest()
def u32(d,at):return struct.unpack_from('<I',d,at)[0]
def signed(d,at):return struct.unpack_from('<i',d,at)[0]

def decode_stream(b,fx,start):
    p=start;ops=[]
    require(0<=start<=len(b)-OBJ2-4,'stream start in file image')
    for _ in range(128):
        physical=OBJ2+p
        require(OBJ2<=physical<=len(b)-4,'stream bounds')
        token=signed(b,physical)
        if token==0:
            end=p+4
            return {'object2Offset':start,'physical':OBJ2+start,'endExclusiveObject2':end,
                    'lengthBytes':end-start,'sourceSHA256':sha(b[OBJ2+start:OBJ2+end]),
                    'operations':ops,'drawCount':sum(x['opcode']=='minus_one_draw' for x in ops),
                    'pairCount':sum(x['opcode']=='positive_pair' for x in ops),
                    'otherNegativeCount':sum(x['opcode']=='other_negative' for x in ops),
                    'terminatorObject2':p}
        if token==-1:
            require(physical+16<=len(b),'draw command bound')
            args=[u32(b,physical+d) for d in (4,8,12)]
            require(fx.get((2,p+4),{}).get('targetObject')==2 and
                    fx.get((2,p+4),{}).get('targetOffset')==args[0], 'draw pointer LE relocation')
            require((2,p+8) not in fx and (2,p+12) not in fx,'draw scalar must not be relocated')
            ops.append({'opcode':'minus_one_draw','object2Offset':p,'sourcePointerObject2':args[0],
                        'rawParameter2':args[1],'rawParameter3':args[2]});p+=16
        elif token>0:
            require(physical+8<=len(b),'positive command bound')
            target=u32(b,physical+4)
            for at,value in ((p,token),(p+4,target)):
                r=fx.get((2,at))
                require(r is not None and (r['kind'],r['flags'],r['targetObject'],r['targetOffset'])==(7,16,2,value),
                        'positive pointer typed relocation '+hex(at))
            ops.append({'opcode':'positive_pair','object2Offset':p,'tokenPointerObject2':token,
                        'payloadPointerObject2':target});p+=8
        else:
            require(token==-2,'unrecognized bounded stage stream negative token')
            require((2,p) not in fx,'negative scalar relocation unexpected')
            ops.append({'opcode':'other_negative','object2Offset':p,'signedToken':token});p+=4
    raise ValueError('stage stream did not terminate in 128 commands')

def produce(b):
    require(len(b)==861133 and sha(b)==EXE_SHA,'canonical original MK2.EXE required')
    fx=fixups(b)
    pool=[s.decode('ascii') for s in b[POOL_START:POOL_END].split(b'\x00') if s]
    require(pool[28]=='TOMB.GRA' and pool[25]=='PORTAL.GRA','original resource ID mapping')
    # The two dispatcher call sites load a root pointer and call the same coordinator.
    pins={0x82353:'8b00a3805a0700e853fbffff',
          0x98bcf:'8b00e8dc92feff',
          0x81eb2:'575051568b00e89b07feff',
          0x81ede:'5e595883c004',
          0x81f41:'8b1883c00450ffd358',
          0x81f4a:'8b1883c004891d225d0700',
          0x81f55:'8b1883c004891df65c0700',
          0x93500:'8b15f65c07008915985a0700',
          0x93557:'74517931407410',
          0x93585:'e88eab0000',
          0x9e118:'f705d4620500010000007473'}
    for at,h in pins.items():require(b[at:at+len(h)//2].hex()==h,'opcode '+hex(at))
    def relocated(source_obj,offset,target):
        r=fx.get((source_obj,offset))
        require(r is not None and (r['kind'],r['flags'],r['targetObject'],r['targetOffset'])==(7,16,2,target),
                'pointer fixup '+str(source_obj)+':'+hex(offset))
        at=(OBJ1 if source_obj==1 else OBJ2)+offset
        require(u32(b,at)==target,'raw fixup bytes '+hex(at))
    relocated(1,0x81f5c-OBJ1,0x75CF6)
    relocated(1,0x93502-OBJ1,0x75CF6)
    roots={};streams={};tables={}
    for name,base in TABLES.items():
        indices=[]
        for index in range(31):
            at=base+4*index; root=u32(b,OBJ2+at)
            if root==0:
                require((2,at) not in fx,'null root relocation')
                indices.append({'index':index,'rootObject2':None});continue
            relocated(2,at,root)
            rid=u32(b,OBJ2+root)>>24
            require(0<rid<len(pool),'packed root resource ID out of registry')
            stream=u32(b,OBJ2+root+0x18)
            relocated(2,root+0x18,stream)
            if stream not in streams: streams[stream]=decode_stream(b,fx,stream)
            if root not in roots:
                roots[root]={'rootObject2':root,'packedResourceID':rid,'resourceName':pool[rid],
                             'streamFieldObject2':root+0x18,'streamObject2':stream}
            else:require(roots[root]['streamObject2']==stream,'root stream changed')
            indices.append({'index':index,'rootObject2':root,'streamObject2':stream})
        tables[name]=indices
    subset=[]
    for index in range(10):
        case=[tables[m][index] for m in TABLES]
        require(all(x['rootObject2'] is not None for x in case),'first ten setup roots')
        require(len({x['streamObject2'] for x in case})==1,'stream varies by mode')
        entry=case[0]; r=roots[entry['rootObject2']]; s=streams[entry['streamObject2']]
        subset.append({'configurationIndex':index,'resourceID':r['packedResourceID'],
                       'resourceName':r['resourceName'],'streamObject2':entry['streamObject2'],
                       'drawCount':s['drawCount'],'drawCommands':[c for c in s['operations'] if c['opcode']=='minus_one_draw'],
                       'distinctRootsAcrossModes':len({x['rootObject2'] for x in case})})
    require([x['configurationIndex'] for x in subset if x['drawCount']==1]==[1,2,3,4,5,7,8],
            'first ten packed-stage draw census')
    require([x['configurationIndex'] for x in subset if x['drawCount']==0]==[0,6,9],
            'non-draw alternatives')
    require(all(x['drawCount']<2 for x in subset),'more than one draw in first ten')
    require((subset[1]['streamObject2'],subset[7]['streamObject2'])==(0x17300,0x16440),
            'Tomb/Portal dynamic source stream')
    return {'schema':'mk2_o130_stage_root_control_stream_bridge_static_v1',
            'status':'PASS_STATIC_STAGE_ROOT_TO_MINUS_ONE_COMMAND',
            'sourceExeSHA256':EXE_SHA,'leRelocationUniqueEntries':len(fx),
            'trace':{'dispatchRootLoaderCalls':[0x8235A,0x98BD1],
                     'sceneLoaderPhysical':0x81EB2,'savedEAXRestorePhysical':0x81EE0,
                     'rootStreamFieldRelativeOffset':0x18,'streamPointerLoadPhysical':0x81F55,
                     'streamPointerGlobalObject2':0x75CF6,'streamCursorInitPhysical':0x93500,
                     'minusOneDispatchPhysical':0x9356E,'guardedDrawCallPhysical':0x93585,
                     'guardedRendererPhysical':0x9E118,'gateGlobalObject2':0x562D4,
                     'allPointersLoadedAtRuntimeObserved':False},
            'rootTables':tables,'rootRecords':[roots[k] for k in sorted(roots)],
            'streams':[streams[k] for k in sorted(streams)],'firstTenConfigurationSummary':subset,
            'limits':['The three 31-entry mode tables determine candidate roots; live mode/index is not observed.',
                      'The root stream field at +0x18 is copied into the global by 0x81F55; this is source code-path evidence, not a captured execution.',
                      'The seven -1 commands occur in static stage-linked streams; the bit-0 renderer gate may still suppress actual drawing.',
                      'The two numeric -1 arguments are raw code-input words and are not established camera coordinates or dimensions.',
                      'Configuration indices 10-30 include other setup families; this report does not label them gameplay stages.',
                      'No live VGA handle, DAC address, control-stream pointer value, or camera state was observed.']}

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
    if a.out.exists():raise SystemExit('O130 refuses overwrite '+str(a.out))
    r=produce(a.exe.read_bytes());a.out.write_text(json.dumps(r,indent=2)+'\n')
    print(json.dumps({'status':r['status'],'uniqueRoots':len(r['rootRecords']),'uniqueStreams':len(r['streams']),
                      'drawIndices':[x['configurationIndex'] for x in r['firstTenConfigurationSummary'] if x['drawCount']]}))

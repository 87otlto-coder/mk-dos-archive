#!/usr/bin/env python3
"""O126 MK2 original EXE mode-global write/read and dispatcher lifecycle.

Static source only: site identities, code bytes, LE relocation ownership,
configuration checksum reset, state snapshots, temporary mode=3 overrides,
and their mode-table consequences. No runtime mode observation.
"""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
from trace_o120_setup_graph import fixups,EXE_SHA,OBJ1,OBJ2,require
from trace_o125_stage_dispatch import BASES,TABLE_LEN,typed

MODE=0x3014c
CODE_END=OBJ2
SITES={
    0x651bc:'write_immediate_2',0x65422:'compare_3',0x6706a:'compare_3',
    0x82336:'compare_2',0x82344:'compare_1',0x82449:'compare_0',
    0x8272c:'compare_0',0x829be:'compare_0',0x82ae9:'compare_0',
    0x82cd9:'compare_0',0x82e3a:'compare_0',0x82e56:'compare_1',
    0x82f68:'compare_0',0x831b4:'compare_0',0x831bd:'compare_1',
    0x83280:'compare_0',0x93560:'compare_0',
    0x98bb2:'compare_2',0x98bc0:'compare_1',
    0x9a9e0:'read_eax',0x9aa5a:'write_eax',
    0x9b279:'read_edx',0x9b286:'write_immediate_3',0x9b2a6:'write_edx',
    0x9b2d3:'read_edx',0x9b2e0:'write_immediate_3',0x9b300:'write_edx'
}

ANCHORS={
 'integrity_checksum_compare':(0x65188,'663b1d32020300743f'),
 'integrity_clear_setting_block':(0x65191,'33c0b9ac000000bf7c000300f3aa'),
 'integrity_copy_default_block':(0x6519f,'b970000000bf28010300be18090000f3a4'),
 'integrity_default_mode_2':(0x651ba,'c7054c01030002000000'),
 'snapshot_mode_to_3030f':(0x9a9df,'a14c010300a30f030300'),
 'restore_mode_from_3030f':(0x9aa54,'a10f030300a34c010300'),
 'temporary_mode_3_a':(0x9b284,'c7054c01030003000000'),
 'restore_saved_mode_a':(0x9b29d,'528b55008d6d0489154c0103005a'),
 'temporary_mode_3_b':(0x9b2de,'c7054c01030003000000'),
 'restore_saved_mode_b':(0x9b2f7,'528b55008d6d0489154c0103005a'),
 'selector_823_mode2':(0x82334,'833d4c010300027413'),
 'selector_823_mode1':(0x82342,'833d4c010300017405'),
 'selector_98b_mode2':(0x98bb0,'833d4c010300027413'),
 'selector_98b_mode1':(0x98bbe,'833d4c010300017405'),
}

CLASS_PREFIX={'write_immediate':b'\xc7\x05','compare':b'\x83\x3d',
              'read_eax':b'\xa1','write_eax':b'\xa3',
              'read_edx':b'\x8b\x15','write_edx':b'\x89\x15'}

def classify(exe,off,label):
    kind=label.rsplit('_',1)[0] if label.startswith(('write_immediate','compare')) else label
    prefix=CLASS_PREFIX[kind]
    require(exe[off-len(prefix):off]==prefix,'operand opcode '+hex(off))
    inst=off-len(prefix)
    result={'operandPhysical':off,'instructionPhysical':inst,'kind':label,
            'instructionBytes':exe[inst:off+4+(4 if label.startswith('write_immediate') else 1 if label.startswith('compare') else 0)].hex()}
    if label.startswith(('write_immediate','compare')):
        result['constant']=int.from_bytes(exe[off+4:off+(8 if label.startswith('write_immediate') else 5)],'little')
        require(result['constant']==int(label.rsplit('_',1)[1]),'literal mismatch '+hex(off))
    return result

def produce(exe:bytes):
    require(len(exe)==861133 and hashlib.sha256(exe).hexdigest()==EXE_SHA,'canonical source exe')
    fx=fixups(exe)
    raw_hits=[p for p in range(OBJ1,CODE_END-4) if exe[p:p+4]==MODE.to_bytes(4,'little')]
    require(set(raw_hits)==set(SITES),'complete code-image literal-site census')
    sites=[]
    for p in sorted(SITES):
        relocation=fx.get((1,p-OBJ1))
        require(relocation and (relocation['kind'],relocation['flags'],relocation['targetObject'],relocation['targetOffset'])==(7,16,2,MODE),'typed mode global '+hex(p))
        sites.append(classify(exe,p,SITES[p]))
    anchors={}
    for name,(p,hexbytes) in ANCHORS.items():
        require(exe[p:p+len(hexbytes)//2].hex()==hexbytes,'instruction identity '+name)
        anchors[name]={'physical':p,'bytes':hexbytes}
    require(exe[0x6518f:0x65191]==b'\x74\x3f','conditional skip past default reset')
    # Two independently based mode->root dispatch paths, precise distinction between 1 and fallback.
    tables={}
    for label,base in BASES.items():
        roots=[]
        for i in range(TABLE_LEN):
            p=base+4*i
            raw=struct.unpack_from('<I',exe,OBJ2+p)[0]
            if raw:
                typed(fx,exe,p,obj=2)
                require(fx[(2,p)]['targetOffset']==raw,'typed table pointer')
            else:require((2,p) not in fx,'null pointer must not have fixup')
            roots.append(raw or None)
        tables[label]=roots
    diffs=[i for i in range(TABLE_LEN) if tables['mode_equals_1'][i]!=tables['mode_other'][i]]
    require(diffs==[0,4],'mode 1 and fallback unique differences')
    mode2diff=[i for i in range(TABLE_LEN) if tables['mode_equals_2'][i]!=tables['mode_equals_1'][i]]
    require(mode2diff==list(range(8)),'mode2 and mode1 differences')
    return {'schema':'mk2_o126_mode_lifecycle_static_v1','status':'PASS_STATIC_MODE_WRITES_AND_DISPATCH',
            'originalExeSHA256':EXE_SHA,'leFixupCount':len(fx),
            'modeObject2Offset':MODE,'codeOperandSites':sites,'modeOperandCount':len(sites),
            'anchoredInstructionSites':anchors,
            'integrityReset':{'entryPhysical':0x65174,'checksumComparePhysical':0x65188,
                              'skipResetConditionalBranchPhysical':0x6518f,
                              'mismatchClearsSettingsPhysical':0x65191,
                              'mismatchLoadsDefaultBytesPhysical':0x6519f,
                              'mismatchSetsModeTo':2,'unconditionalStartupValueEstablished':False},
            'backupRestore':{'saveModePhysical':0x9a9df,'savedCopyObject2Offset':0x3030f,
                             'restoreModePhysical':0x9aa54},
            'temporaryOverrides':[
                {'saveModePhysical':0x9b277,'write3Physical':0x9b284,'restoreModePhysical':0x9b29d},
                {'saveModePhysical':0x9b2d1,'write3Physical':0x9b2de,'restoreModePhysical':0x9b2f7}],
            'dispatch':{'paths':[0x82321,0x98ba7],
                        'mode2TableBase':BASES['mode_equals_2'],'mode1TableBase':BASES['mode_equals_1'],
                        'fallbackTableBase':BASES['mode_other'],
                        'mode1VersusFallbackDifferentIndices':diffs,
                        'mode2VersusMode1DifferentIndices':mode2diff,
                        'mode1VersusFallbackRoots':{str(i):{'mode1':tables['mode_equals_1'][i],
                                                              'fallback':tables['mode_other'][i]} for i in diffs},
                        'tombRootIndex1':{label:roots[1] for label,roots in tables.items()},
                        'portalRootIndex7':{label:roots[7] for label,roots in tables.items()}},
            'runtimeObserved':{'selectedMode':False,'selectedTable':False,'activeStageRoot':False,'paletteHandle':False},
            'limits':['Only canonical original EXE and LE relocated code/data are verified',
                      'Mode 2 default assignment is conditional upon a checksum mismatch, not proof of a constant runtime value',
                      'Temporary mode 3 writes are not evidence that this mode was active in a particular fight',
                      '0x75A80 is scratch/reused and cannot be treated as a permanent stage index or camera value']}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
    if a.out.exists():raise SystemExit('O126 refuses overwrite '+str(a.out))
    result=produce(a.exe.read_bytes());a.out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'status':result['status'],'modeSites':result['modeOperandCount'],'fallbackDifferences':result['dispatch']['mode1VersusFallbackDifferentIndices']}))

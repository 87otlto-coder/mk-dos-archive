#!/usr/bin/env python3
"""O128 source-only correction of O127 renderer array extent and guarded invocation.

The first ten DWORDs are a bounded *source sample* ending at a separately
relocated object-2 address. They are NOT a proven 10-entry runtime index bound.
"""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
from trace_o120_setup_graph import EXE_SHA, OBJ1, OBJ2, fixups, require

BASE=0x2EF54; NEXT=0x2EF7C; NEXT_POINTER=0x2F1CF; GATE=0x562D4
SAMPLE_ENTRIES=(NEXT-BASE)//4
REFS={
  0x67052:('xor_one','8335d462050001'),
  0x67073:('set_one','c705d462050001000000'),
  0x6709a:('set_one','c705d462050001000000'),
  0x670b3:('set_zero','c705d462050000000000'),
  0x74e79:('set_zero','c705d462050000000000'),
  0x93210:('test_one','f705d462050001000000'),
  0x933c4:('test_one','f705d462050001000000'),
  0x938d8:('test_one','f705d462050001000000'),
  0x9e11a:('test_one','f705d462050001000000'),
}
CODE={
  0x82321:'a1805a0700a37f740700',
  0x93547:'8b0d985a07008b0183c104a9ffffffff',
  0x93559:'7931407410',
  0x9356e:'8b3183c1048b368b3983c1048b1983c104890d985a0700',
  0x93585:'e88eab0000',
  0x9e118:'f705d4620500010000007473',
  0x9e13a:'81e6ffff0000',
  0x9e165:'a17f74070003348554ef0200',
  0x9e173:'81ffc8000000731c',
  0x9e17b:'03c13dc80000007207',
  0x9e184:'b9c80000002bcf',
  0x9e18b:'b80100000055e83078fcff5d',
}
def sha(b):return hashlib.sha256(b).hexdigest()
def dword(b,p):return struct.unpack_from('<I',b,p)[0]
def produce(exe:bytes):
    require(len(exe)==861133 and sha(exe)==EXE_SHA,'canonical MK2.EXE required')
    fx=fixups(exe)
    def relocated(obj,at,dest):
        q=fx.get((obj,at-(OBJ1 if obj==1 else OBJ2)))
        require(q is not None and (q['kind'],q['flags'],q['targetObject'],q['targetOffset'])==(7,16,2,dest),'relocation '+hex(at))
    for physical,h in CODE.items(): require(exe[physical:physical+len(h)//2].hex()==h,'opcode '+hex(physical))
    relocated(1,0x82327,0x7747F)
    relocated(1,0x9e166,0x7747F)
    relocated(1,0x9e16d,BASE)
    relocated(1,0x9e11a,GATE)
    relocated(2,OBJ2+NEXT_POINTER,NEXT)
    require(SAMPLE_ENTRIES==10,'the physical following relocation boundary')
    values=[dword(exe,OBJ2+BASE+4*i) for i in range(SAMPLE_ENTRIES)]
    require([i for i,v in enumerate(values) if v==0]==[0,6,9],'ten source sample null indices')
    require((values[1]>>24,values[7]>>24)==(28,25),'original resource identifiers in packed words')
    for v in values:
        require(v==0 or 0<v<0x100000000,'packed source value')
    after=[dword(exe,OBJ2+NEXT+4*i) for i in range(21)]
    require(after[:4]==[0x00a4b7b7,0x00a4b7b7,0x00a2b7b7,0x00a2b7b7],'next independent region signature')
    # Unlike the 31-entry root table, there is NO authenticated 31-entry extent of this indexed source area.
    referents=sorted(v['sourcePhysical'] for v in fx.values() if v['targetObject']==2 and v['targetOffset']==NEXT)
    require(referents==[OBJ2+NEXT_POINTER],'separate relocation-backed next region')
    gate_refs=sorted(v['sourcePhysical'] for v in fx.values() if v['targetObject']==2 and v['targetOffset']==GATE)
    require(len(gate_refs)==11 and 0x9e11a in gate_refs,'gate references')
    gate_sites=[]
    for operand,(role,h) in REFS.items():
        at=operand-2
        require(exe[at:at+len(h)//2].hex()==h,'guard writer/test opcode '+hex(at))
        relocated(1,operand,GATE)
        gate_sites.append({'operandPhysical':operand,'instructionPhysical':at,'operation':role})
    # Direct call census: single explicit E8 target for this protected renderer.
    callers=[p for p in range(OBJ1,OBJ2-4) if exe[p]==0xe8 and p+5+struct.unpack_from('<i',exe,p+1)[0]==0x9e118]
    require(callers==[0x93585],'guarded renderer direct-caller set')
    require(exe[0x9355b:0x9355e].hex()=='407410','negative token -> inc -> JE -1 branch')
    require(exe[0x9e122:0x9e124]==b'\x74\x73','entry skip when flag bit zero')
    require(exe[0x9e179:0x9e17b]==b'\x73\x1c','row clipping guard')
    return {
      'schema':'mk2_o128_guarded_renderer_data_boundary_static_v1','status':'PASS_STATIC_BOUNDED_RENDERER_GATE',
      'sourceExeSHA256':EXE_SHA,'leFixupCount':len(fx),
      'indexedSource':{'object2Base':BASE,'physicalBase':OBJ2+BASE,
           'sourceDWORDsBeforeSeparatelyReferencedAddress':SAMPLE_ENTRIES,'sampledDWORDs':values,
           'sampleSHA256':sha(exe[OBJ2+BASE:OBJ2+NEXT]),
           'nullSamplePositions':[0,6,9],
           'tombSampleIndex':1,'tombResourceIdHighByte':28,
           'portalSampleIndex':7,'portalResourceIdHighByte':25,
           'runtimeMaximumIndexEstablished':False,'actualArrayLengthEstablished':False},
      'followingRegion':{'object2Start':NEXT,'firstValues':after[:4],
           'independentPointerFieldObject2':NEXT_POINTER,
           'independentRelocationPhysical':OBJ2+NEXT_POINTER,
           'first21DWORDFingerprint':sha(exe[OBJ2+NEXT:OBJ2+NEXT+84]),
           'classification':'separately_referenced_following_data_not_authenticated_renderer_entries'},
      'guardedDispatch':{'controlLoopPhysical':0x93547,'minusOneTokenBranchPhysical':0x9355b,
           'loadIndirectESIPhysical':0x9356e,'advanceCursorPhysical':0x9357f,
           'directCallerPhysical':0x93585,'onlyDirectE8Caller':True,
           'guardedEntryPhysical':0x9e118,'guardGlobalObject2':GATE,
           'requiredBitMask':1,'skipWhenBitClearPhysical':0x9e122,
           'savedIndexLoadPhysical':0x9e165,'indexedAddPhysical':0x9e16a,
           'clipBoundaryRows':200,'clipPhysical':0x9e173,
           'packedRowConsumerCallPhysical':0x9e191,
           'guardRelocationSites':gate_refs,'classifiedGuardReferences':gate_sites,
           'runtimeFlagObserved':False,'runtimeInvocationObserved':False,
           'runtimeIndexObserved':False},
      'correction':{'supersedes':'O127 inference that renderer table has 31 authenticated entries',
         'reason':'31 belongs to the stage-root tables; renderer source sample has a separately referenced address after 10 DWORDs. A 31-entry renderer extent or 10-entry legal runtime bound is not proven.',
         'legacyO127RawSamplePreserved':True},
      'limits':['An LE relocation to the following region establishes independent addressability, not necessarily a formal C-array terminator.',
                'The ten contiguous DWORDs are source-authenticated and distinguishable from following data; maximum legal runtime index is unresolved.',
                'A direct E8 caller census is not an exhaustive indirect/control-flow call graph.',
                'The -1 token grammar and flag writers do not prove this path was activated during a particular fight.',
                'There are no live palette handles, camera coordinates, mode selections, or frame timings in this static report.']}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
 if a.out.exists():raise SystemExit('refusing overwrite '+str(a.out))
 r=produce(a.exe.read_bytes());a.out.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'status':r['status'],'sampled':len(r['indexedSource']['sampledDWORDs']),'guardRefs':len(r['guardedDispatch']['guardRelocationSites'])}))

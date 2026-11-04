#!/usr/bin/env python3
"""Independent O128 LE image/relocation/code verifier; does not import the producer."""
from __future__ import annotations
import hashlib,json,struct,sys
from pathlib import Path
from verify_o120_independent import parse_fixups
H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
O1=0x61c54;O2=0xa0c54

def verify(exe:bytes,raw:bytes):
    n=0
    def check(c,what):
        nonlocal n
        if not c:raise ValueError('O128 independent: '+what)
        n+=1
    def h(b):return hashlib.sha256(b).hexdigest()
    def word(pos):return struct.unpack_from('<I',exe,pos)[0]
    check(len(exe)==861133 and h(exe)==H,'EXE identity')
    doc=json.loads(raw)
    check(set(doc)=={'schema','status','sourceExeSHA256','leFixupCount','indexedSource','followingRegion','guardedDispatch','correction','limits'},'exact top-level fields')
    check(doc['schema']=='mk2_o128_guarded_renderer_data_boundary_static_v1' and doc['status']=='PASS_STATIC_BOUNDED_RENDERER_GATE' and doc['sourceExeSHA256']==H,'classification')
    fx,total=parse_fixups(exe)
    check(total==27004 and doc['leFixupCount']==len(fx),'independent fixup reparse')
    def reloc(obj,pos,target):
        check(fx.get((obj,pos-(O1 if obj==1 else O2)))==(7,16,2,target),'typed LE relocation '+hex(pos))
    def exact(at,hexstr):check(exe[at:at+len(hexstr)//2].hex()==hexstr,'opcodes '+hex(at))
    exact(0x82321,'a1805a0700a37f740700')
    exact(0x93547,'8b0d985a07008b0183c104a9ffffffff')
    exact(0x93559,'7931407410')
    exact(0x9356e,'8b3183c1048b368b3983c1048b1983c104890d985a0700')
    exact(0x93585,'e88eab0000')
    exact(0x9e118,'f705d4620500010000007473')
    exact(0x9e13a,'81e6ffff0000')
    exact(0x9e165,'a17f74070003348554ef0200')
    exact(0x9e173,'81ffc8000000731c')
    exact(0x9e17b,'03c13dc80000007207')
    exact(0x9e184,'b9c80000002bcf')
    exact(0x9e18b,'b80100000055e83078fcff5d')
    for obj,at,dest in [(1,0x82327,0x7747f),(1,0x9e166,0x7747f),(1,0x9e16d,0x2ef54),
                        (1,0x9e11a,0x562d4),(2,O2+0x2f1cf,0x2ef7c)]:reloc(obj,at,dest)
    vals=[word(O2+0x2ef54+4*i) for i in range(10)]
    after=[word(O2+0x2ef7c+4*i) for i in range(21)]
    src=doc['indexedSource']
    check(src=={'object2Base':0x2ef54,'physicalBase':O2+0x2ef54,
          'sourceDWORDsBeforeSeparatelyReferencedAddress':10,'sampledDWORDs':vals,
          'sampleSHA256':h(exe[O2+0x2ef54:O2+0x2ef7c]),'nullSamplePositions':[0,6,9],
          'tombSampleIndex':1,'tombResourceIdHighByte':28,'portalSampleIndex':7,'portalResourceIdHighByte':25,
          'runtimeMaximumIndexEstablished':False,'actualArrayLengthEstablished':False},'qualified source sample')
    check([i for i,v in enumerate(vals) if v==0]==[0,6,9], 'zero slots in sample')
    check(vals[1]>>24==28 and vals[7]>>24==25,'packed resource IDs')
    refs=sorted((O1 if obj==1 else O2)+off for (obj,off),v in fx.items() if v[2:]==(2,0x2ef7c))
    check(refs==[O2+0x2f1cf],'following address has its own LE reference')
    check(doc['followingRegion']=={'object2Start':0x2ef7c,'firstValues':after[:4],
           'independentPointerFieldObject2':0x2f1cf,'independentRelocationPhysical':O2+0x2f1cf,
           'first21DWORDFingerprint':h(exe[O2+0x2ef7c:O2+0x2ef7c+84]),
           'classification':'separately_referenced_following_data_not_authenticated_renderer_entries'},'separately referenced data')
    gr=sorted((O1 if obj==1 else O2)+off for (obj,off),v in fx.items() if v[2:]==(2,0x562d4))
    check(len(gr)==11,'flag relocation count')
    classified=[]
    expected={0x67052:('xor_one','8335d462050001'),0x67073:('set_one','c705d462050001000000'),
              0x6709a:('set_one','c705d462050001000000'),0x670b3:('set_zero','c705d462050000000000'),
              0x74e79:('set_zero','c705d462050000000000'),0x93210:('test_one','f705d462050001000000'),
              0x933c4:('test_one','f705d462050001000000'),0x938d8:('test_one','f705d462050001000000'),
              0x9e11a:('test_one','f705d462050001000000')}
    for operand,(role,hx) in expected.items():
        exact(operand-2,hx);reloc(1,operand,0x562d4)
        classified.append({'operandPhysical':operand,'instructionPhysical':operand-2,'operation':role})
    actual=[p for p in range(O1,O2-4) if exe[p]==0xe8 and p+5+struct.unpack_from('<i',exe,p+1)[0]==0x9e118]
    check(actual==[0x93585],'one direct E8 caller')
    check(doc['guardedDispatch']=={'controlLoopPhysical':0x93547,'minusOneTokenBranchPhysical':0x9355b,
           'loadIndirectESIPhysical':0x9356e,'advanceCursorPhysical':0x9357f,
           'directCallerPhysical':0x93585,'onlyDirectE8Caller':True,
           'guardedEntryPhysical':0x9e118,'guardGlobalObject2':0x562d4,
           'requiredBitMask':1,'skipWhenBitClearPhysical':0x9e122,
           'savedIndexLoadPhysical':0x9e165,'indexedAddPhysical':0x9e16a,
           'clipBoundaryRows':200,'clipPhysical':0x9e173,
           'packedRowConsumerCallPhysical':0x9e191,
           'guardRelocationSites':gr,'classifiedGuardReferences':classified,
           'runtimeFlagObserved':False,'runtimeInvocationObserved':False,
           'runtimeIndexObserved':False},'guard and call evidence')
    check(doc['correction']=={'supersedes':'O127 inference that renderer table has 31 authenticated entries',
          'reason':'31 belongs to the stage-root tables; renderer source sample has a separately referenced address after 10 DWORDs. A 31-entry renderer extent or 10-entry legal runtime bound is not proven.',
          'legacyO127RawSamplePreserved':True},'legacy inference corrected')
    check(len(doc['limits'])==5 and 'not necessarily a formal' in doc['limits'][0] and 'no live palette' in doc['limits'][-1].lower(),'limits not removed')
    return {'status':'PASS_O128_INDEPENDENT','assertions':n,'typedRelocationRecords':total,'e8Callers':actual,'rendererSampleDWORDs':len(vals),'reportSHA256':h(raw)}
if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: verify_o128_renderer_boundary_independent.py MK2.EXE O128_REPORT.json')
 print(json.dumps(verify(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes()),indent=2))

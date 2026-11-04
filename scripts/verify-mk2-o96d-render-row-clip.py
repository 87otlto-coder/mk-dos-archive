#!/usr/bin/env python3
"""Independent O96D: compare original machine encoding for guarded copy and clipping contract."""
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verifier <mk2 dir> <O96C JSON> <O96D JSON>')
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();prev=Path(sys.argv[2]).read_bytes();z=json.loads(Path(sys.argv[3]).read_text());checks=0
def ck(name,x):
 global checks
 checks+=1
 if not x:raise AssertionError(name)
def H(q):return hashlib.sha256(q).hexdigest()
def raw(p,s):
 pattern=bytes.fromhex(s)
 ck('original bytes at '+hex(p),b[p:p+len(pattern)]==pattern)
ck('authentic fixture',H(b)==z['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('prior digest',H(prev)==z['source']['o96cSha256'] and json.loads(prev)['status']=='SUCCESS')
raw(0x934ff,'528b15f65c07008915985a07005a')
raw(0x9352b,'528b15ae5f07008915805a07005a')
raw(0x93547,'8b0d985a07008b0183c104a9ffffffff74517931407410')
raw(0x9356e,'8b3183c1048b368b3983c1048b1983c104890d985a0700e88eab0000ebbb')
raw(0x9e118,'f705d4620500010000007473')
raw(0x9e138,'8bcb81e6ffff00008bc62d200100007412f7d8c1e01099bb70000000f7fba373740700')
raw(0x9e15b,'a1685a0700c1f8102bf8a17f74070003348554ef0200')
raw(0x9e171,'8bc781ffc8000000731c03c13dc80000007207b9c80000002bcf')
raw(0x9e18b,'b80100000055e83078fcff5dc3')
ck('upstream rel32',0x93585+5+struct.unpack_from('<i',b,0x93586)[0]==0x9e118)
ck('consumer rel32',0x9e191+5+struct.unpack_from('<i',b,0x9e192)[0]==0x659c6)
a=z['controlEntry'];ck('cursor producer',a['sourceForControlCursor']==0x75cf6 and a['destinationControlCursor']==0x75a98 and a['sourceCopyPhysical']==0x93500)
ck('scalar producer',a['sourceForPreLoopScalar']==0x75fae and a['destinationPreLoopScalar']==0x75a80 and a['scalarCopyPhysical']==0x9352b)
ck('helper before loads',a['interveningHelperBeforeGlobalCopiesPhysical']==0x934ec)
ck('not proven scalar join',a['runtimeJoinToIndependentIndexWriterProven'] is False)
y=z['negativeOneBranch'];ck('branch',y['entryPhysical']==0x9356e and y['consumerCallPhysical']==0x93585 and y['cursorAdvancedBeforeCall'])
ck('register provenance',y['registers']=={'source':'ESI','startOrOffset':'EDI','countOrSpan':'EBX'})
r=z['renderer'];ck('full slice digest',H(b[0x9e118:0x9e198])==r['codeSha256'])
ck('bounds',r['startPhysical']==0x9e118 and r['clipEndExclusive']==0x9e198 and r['thresholdUnsigned']==200 and r['packedCopyTargetPhysical']==0x659c6 and r['consumerCallPhysical']==0x9e191)
ck('gate',r['gatedByGlobal']==0x562d4 and r['gateMask']==1 and r['gateMustBeNonzero'])
ck('packed low16 only',r['sourceESIHigh16Cleared'] and r['sourceESILow16UsedForAdditiveOffset'])
ck('EDI adjust',r['ediAdjustedByArithmeticRightShiftedHigh16OfGlobal']==0x75a68 and r['adjustmentSigned'])
ck('index',r['indexGlobal']==0x7747f and r['tableObject2Offset']==0x2ef54)
ck('guard',r['skipIfAdjustedEDIUnsignedGEThreshold'] and r['clampWhenUnsignedEDIPlusECXGEThreshold'] and r['clampedECXExpression']=='200 - adjustedEDI' and r['rowCountRegisterFromEBX']=='ECX')
for f in ('actualRuntimeRowsEstablished','visibleRasterHeightEstablished','paletteBindingEstablished'):ck('boundary: '+f,r[f] is False)
ck('promoted boundary',z['classification']['actualRenderGuardAndClipEstablished'] is True and z['classification']['preLoopGlobalProvenanceEstablished'] is True)
for f in ('fullRuntimeIndexDomainEstablished','completeControlLanguageEstablished','mk2ResearchClosed'):ck('negative boundary: '+f,z['classification'][f] is False)
print(json.dumps({'pass':'O96D','status':'PASS','checks':checks,'failures':0,'clipThreshold':200,'guardedCall':hex(0x659c6)}))

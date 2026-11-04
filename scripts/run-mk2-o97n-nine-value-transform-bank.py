#!/usr/bin/env python3
"""O97N: enumerate per-call arithmetic transforms on nine source DWORDs from setup-installed pointer."""
from pathlib import Path
import json,hashlib,sys,struct
fixture,root=map(Path,sys.argv[1:3]);b=(fixture/'mk2.exe').read_bytes(); sha=lambda x:hashlib.sha256(x).hexdigest()
assert sha(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
prior=(root/'mk2_mountain_accumulator_initializers_o97m_2026-10-09.json').read_bytes();assert json.loads(prior)['status']=='PASS'
start=[0x82487,0x824a7,0x824c0,0x824e5,0x82509,0x82529,0x8254a,0x82573,0x82594,0x825b5,0x825d7,0x825f7,0x8261e,0x82644,0x82666,0x82689,0x826b4,0x826d7,0x826fa]
names=['sar1','copy','add_sar2','add_sar1','mul2','mul3','mul3_add_sar1','mul4','mul5','neg_sar1','neg','neg_add_sar2','neg_add_sar1','neg_mul2','neg_mul3','neg_mul3_add_sar1','neg_mul4','neg_mul5']
assert len(names)==18 and len(start)==19
mask=0xffffffff
def s(x):x&=mask;return x if x<0x80000000 else x-0x100000000
def fun(k,v):
 x=s(v)
 forms=[lambda x:x>>1,lambda x:x,lambda x:x+(x>>2),lambda x:x+(x>>1),lambda x:x*2,lambda x:x*3,lambda x:x*3+(x>>1),lambda x:x*4,lambda x:x*5,lambda x:-(x>>1),lambda x:-x,lambda x:-(x+(x>>2)),lambda x:-(x+(x>>1)),lambda x:-(x*2),lambda x:-(x*3),lambda x:-(x*3+(x>>1)),lambda x:-(x*4),lambda x:-(x*5)]
 return forms[k](x)&mask
entries=[]
for k in range(18):
 a,z=start[k:k+2]; data=b[a:z]
 assert data[-1]==0xc3 and struct.pack('<I',0x842ec) in data and struct.pack('<I',0x75d22) in data,(k,hex(a))
 assert (b'\xb1\x09' in data or b'\xb9\x09\x00\x00\x00' in data)
 assert (b'\xfe\xc9' in data and data[-2:] in (b'\x5f\xc3',b'\x5e\xc3')) or k==1
 entries.append({'index':k,'entryPhysical':a,'endPhysical':z,'operation':names[k],'instructionBytesSha256':sha(data),'codeHex':data.hex(),'sourcePointerGlobal':0x75d22,'destinationObject2Base':0x842ec,'valuesPerCall':9,'examples':[{'inputDword':v,'outputDword':fun(k,v)} for v in [0,1,0xffffffff,0x80000000,0x12345678]]})
assert b[0x81f4f:0x81f55].hex()=='891d225d0700'
report={'format':'mk2_o97n_mountain_nine_dword_transform_bank_v1','status':'PASS','fixtureSha256':sha(b),'priorO97mSha256':sha(prior),'setupPointerStoreAt':0x81f4f,'setupPointerStoreHex':b[0x81f4f:0x81f55].hex(),'sourcePointerGlobal':0x75d22,'destinationBase':0x842ec,'profileCount':len(entries),'profiles':entries,'hypotheses':{'eighteenDistinctArithmeticEntryRoutines':'SUPPORTED','eachEntryProcessesNineDWORDs':'SUPPORTED','setupInstallsSharedSourcePointer':'SUPPORTED_ON_SETUP_PATH','signedRightShiftRoundingEqualsTruncationForNegatives':'REJECTED','profileIsPixelsPerFrame':'UNPROVEN','specificProfileSelectedForMountain':'UNPROVEN','runtimeSourceDwordsKnown':'UNPROVEN'},'limits':'The 18 executable routines are independently bounded and carry distinct byte-backed arithmetic. Their inputs are from a runtime-installed pointer, whose nine DWORD values and invocation schedule are not established. Arithmetic is 32-bit wrapping with signed SAR where present.'}
(root/'mk2_mountain_nine_value_transform_bank_o97n_2026-10-09.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pass':'O97N','status':'PASS','profiles':len(entries),'valuesPerProfile':9,'bytesQualified':sum(x['endPhysical']-x['entryPhysical'] for x in entries)}))

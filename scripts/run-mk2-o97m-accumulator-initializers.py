#!/usr/bin/env python3
"""O97M: bounded executable-backed Mountain accumulator setup witnesses."""
from pathlib import Path
import hashlib,json,struct,sys
fixture,root=map(Path,sys.argv[1:3]); b=(fixture/'mk2.exe').read_bytes();sha=lambda x:hashlib.sha256(x).hexdigest();u=lambda x:struct.unpack_from('<I',b,x)[0]
assert sha(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
prev=(root/'mk2_mountain_base_accumulator_double_add_o97l_2026-10-09.json').read_bytes();assert json.loads(prev)['status']=='PASS'
segments=[('zero_caller',0x81b88,0x81b94),('setup_sign_extend_then_broadcast',0x81f17,0x81f28),('nine_broadcasts',0x86a95,0x86ac3),('nine_source_zeroes',0x826fa,0x8272a),('base_initialization',0x81fde,0x81ff2),('two_scalar_clears',0x93a40,0x93a57),('conditional_base_selection',0x860ea,0x860fc)]
for k,a,z in segments:assert z>a and z<len(b)
assert b[0x81b88:0x81b94].hex()=='33c0e8064f0000e8660b0000'
assert b[0x81f17:0x81f28].hex()=='0fbf1883c002c1e310508bc3e86d4b0000'
assert b[0x86ac2]==0xc3
for i in range(9):assert b[0x86a95+5*i]==0xa3 and u(0x86a95+5*i+1)==0x84330-4*i
assert b[0x8272a-1]==0xc3
assert b[0x826fa:0x826fc]==b'\x33\xc0'
for i in range(9):assert b[0x826fc+5*i]==0xa3 and u(0x826fc+5*i+1)==0x8430c-4*i
assert b[0x81fde:0x81fe5].hex()=='33c0a3e4420800'
assert b[0x81fe5:0x81ff2].hex()=='a1165d0700c1e010a3e8420800'
assert b[0x93a40:0x93a57].hex()=='5033c0a308430800a3e4420800a32c430800a3e8420800'
assert b[0x860ea:0x860fc].hex()=='d1e005a8c201000fbf00c1e010a3e8420800'
rep={'format':'mk2_o97m_mountain_accumulator_init_witnesses_v1','status':'PASS','fixtureSha256':sha(b),'priorO97lSha256':sha(prev),'codeSegments':[{'name':k,'start':a,'end':z,'hex':b[a:z].hex()} for k,a,z in segments], 'broadcastTargets':[0x84330-4*i for i in range(9)],'sourceZeroTargets':[0x8430c-4*i for i in range(9)],'setupWordTransform':'sign_extend_i16_then_shift_16_mod_2^32','conditionalScalarInputs':{'baseSource':0x842e4,'baseAccumulator':0x842e8,'baseInitSourceGlobal':0x75d16,'conditionalSelectionIndex':0x7652a,'conditionalWordTableObject2Offset':0x1c2a8},'hypotheses':{'zeroInitCallSetsNineAccumulatorsToZero':'SUPPORTED_ON_0x81B88_PATH','signedSetupWordBroadcastToNineAccumulators':'SUPPORTED_ON_0x81F17_PATH','nineSourceValuesCanBeClearedToZero':'SUPPORTED_ON_0x826FA_PATH','baseAccumulatorHasMultipleWriters':'SUPPORTED','broadcastAlwaysZero':'REJECTED','cameraOrFPSUnitsKnown':'UNPROVEN','runtimeSelectionAndValueKnown':'UNPROVEN'},'limits':'Proves instructions and immediate caller setup. Does not claim all initializers execute in same scene or that the nine-source pointer is valid at runtime; scalar writes may be overridden later.'}
(root/'mk2_mountain_accumulator_initializers_o97m_2026-10-09.json').write_text(json.dumps(rep,indent=2)+'\n');print(json.dumps({'pass':'O97M','status':'PASS','segments':len(segments),'broadcastTargets':9,'sourceClears':9}))

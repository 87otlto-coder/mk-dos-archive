#!/usr/bin/env python3
"""O97R: bounded state ancestry of two scalar globals driving O97Q selector."""
import json,hashlib,struct,sys
from pathlib import Path
fixture,root=map(Path,sys.argv[1:3]);b=(fixture/'mk2.exe').read_bytes();h=lambda x:hashlib.sha256(x).hexdigest()
assert h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
parent=(root/'mk2_mountain_directional_threshold_dispatch_o97q_2026-10-09.json').read_bytes();assert json.loads(parent)['status']=='PASS'
# Batch initializer uses a shared zero EAX and A3 fixed-address stores.
start,end=0x755cf,0x7562b
assert b[start:start+2]==b'\x33\xc0'
stores=[]
p=start+2
while p<end:
 assert b[p]==0xa3
 stores.append({'physical':p,'global':struct.unpack_from('<I',b,p+1)[0],'value':'EAX_ZERO'});p+=5
assert p==end and len(stores)==18
assert [x['global'] for x in stores].count(0x75fda)==1
assert [x['global'] for x in stores].count(0x7615e)==1
# A second routine clears whichever scalar corresponds to its actor pointer; not both unconditionally.
conditional=b[0x633c9:0x63403]
assert conditional.hex()=='bbda5f0700528b15c25f07008915645a07005a3b3d645a0700741cbb5e610700528b15466107008915645a07005a3b3d645a07007401c38903c3'
# Actor-coupled routine assigns both globals via either pointer ordering from two register addresses.
assign=b[0x7cd08:0x7cd43]
assert assign.hex()=='b8da5f0700bb5e610700528b15c25f07008915645a07005a3b3d645a07007401938f05705a0700528b15705a070089105a528b15705a070089135a'
assert b[0x821b9:0x821c6].hex()=='8b15da5f0700528b155e610700'
report={'format':'mk2_o97r_dynamic_magnitude_scalar_source_provenance_v1','status':'PASS','fixtureSha256':h(b),'priorO97qSha256':h(parent),'scalarGlobals':[0x75fda,0x7615e],'initializer':{'startPhysical':start,'endPhysical':end,'codeSha256':h(b[start:end]),'zeroedGlobalAddresses':stores},'singleActorClear':{'startPhysical':0x633c9,'endPhysical':0x63403,'codeHex':conditional.hex(),'conditionalDestinations':[0x75fda,0x7615e],'condition':'Actor match tests against runtime globals 0x75FC2 and 0x76146'},'pairedActorAssignment':{'startPhysical':0x7cd08,'endPhysical':0x7cd43,'codeHex':assign.hex(),'conditionalAddressSwap':'EDI pointer compared with 0x75FC2; optional XCHG of EAX and EBX','dynamicValue':'stack-pop -> 0x75A70 -> both selected destination addresses'},'reader':{'startPhysical':0x821b9,'endPhysical':0x821c6,'codeHex':b[0x821b9:0x821c6].hex()},'hypotheses':{'bothInputsAreInitializedToZeroOnQualifiedResetPath':'SUPPORTED','bothInputsCanReceiveRuntimeNonliteralValue':'SUPPORTED_CONDITIONALLY','allMountainFramesHaveZeroMagnitudes':'REJECTED','inputsAreStaticallyKnownMountainScrollSpeeds':'UNPROVEN','directionTablesCalledDuringObservedBattlePlan':'UNPROVEN'},'limits':'Local producers confirm dynamic actor-dependent scalar state in addition to reset-to-zero. They do not prove which values are present on entering the threshold selector, whether a particular scene activates the profile path, or timing units.'}
(root/'mk2_mountain_profile_magnitude_scalar_ancestry_o97r_2026-10-09.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pass':'O97R','status':'PASS','zeroStores':len(stores),'scalarGlobals':len(report['scalarGlobals']),'dynamicWriters':2}))

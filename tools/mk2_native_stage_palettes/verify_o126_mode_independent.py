#!/usr/bin/env python3
"""Independent O126 original-code and typed-relocation reconstruction.

Uses the earlier independent LE parser; does not import O126 producer.
"""
from __future__ import annotations
import hashlib,json,struct,sys
from pathlib import Path
from verify_o120_independent import parse_fixups

EXPECTED_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OBJ1=0x61c54; OBJ2=0xa0c54; MODE=0x3014c
EXPECTED_TYPES={
 0x651bc:'write_immediate_2',0x65422:'compare_3',0x6706a:'compare_3',0x82336:'compare_2',
 0x82344:'compare_1',0x82449:'compare_0',0x8272c:'compare_0',0x829be:'compare_0',
 0x82ae9:'compare_0',0x82cd9:'compare_0',0x82e3a:'compare_0',0x82e56:'compare_1',
 0x82f68:'compare_0',0x831b4:'compare_0',0x831bd:'compare_1',0x83280:'compare_0',
 0x93560:'compare_0',0x98bb2:'compare_2',0x98bc0:'compare_1',
 0x9a9e0:'read_eax',0x9aa5a:'write_eax',0x9b279:'read_edx',
 0x9b286:'write_immediate_3',0x9b2a6:'write_edx',0x9b2d3:'read_edx',
 0x9b2e0:'write_immediate_3',0x9b300:'write_edx'
}
OPCODES={'write_immediate':bytes.fromhex('c705'),'compare':bytes.fromhex('833d'),
 'read_eax':b'\xa1','write_eax':b'\xa3','read_edx':bytes.fromhex('8b15'),'write_edx':bytes.fromhex('8915')}
# These constants intentionally duplicate only the essential expected machine instructions.
SEQUENCES={
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
 'selector_98b_mode1':(0x98bbe,'833d4c010300017405')}

def require(ok,msg):
 if not ok:raise ValueError('O126 independent: '+msg)

def verify(exe:bytes,raw:bytes):
 require(len(exe)==861133 and hashlib.sha256(exe).hexdigest()==EXPECTED_SHA,'original exe fingerprint')
 report=json.loads(raw)
 require(set(report)=={'schema','status','originalExeSHA256','leFixupCount','modeObject2Offset','codeOperandSites','modeOperandCount','anchoredInstructionSites','integrityReset','backupRestore','temporaryOverrides','dispatch','runtimeObserved','limits'},'report schema fields')
 require(report['schema']=='mk2_o126_mode_lifecycle_static_v1' and report['status']=='PASS_STATIC_MODE_WRITES_AND_DISPATCH','schema')
 require(report['originalExeSHA256']==EXPECTED_SHA and report['modeObject2Offset']==MODE,'exact source identity')
 entries,count=parse_fixups(exe)
 require(count==27004 and report['leFixupCount']==len(entries),'relocation count')
 positions=[p for p in range(OBJ1,OBJ2-3) if exe[p:p+4]==MODE.to_bytes(4,'little')]
 require(sorted(positions)==sorted(EXPECTED_TYPES) and len(report['codeOperandSites'])==len(positions)==report['modeOperandCount']==27,'exhaustive mode-global census')
 checks=0
 for p,item in zip(positions,report['codeOperandSites']):
  expected=EXPECTED_TYPES[p]
  require(entries.get((1,p-OBJ1))==(7,16,2,MODE),'typed operand relocation '+hex(p))
  op=expected.rsplit('_',1)[0] if expected.startswith(('compare_','write_immediate_')) else expected
  opcode=OPCODES[op];inst=p-len(opcode)
  require(exe[inst:p]==opcode,'operand opcode')
  end=p+4+(4 if op=='write_immediate' else 1 if op=='compare' else 0)
  want={'operandPhysical':p,'instructionPhysical':inst,'kind':expected,'instructionBytes':exe[inst:end].hex()}
  if op in ('write_immediate','compare'):
   want['constant']=int.from_bytes(exe[p+4:end],'little')
   require(want['constant']==int(expected.rsplit('_',1)[1]),'mode literal')
  require(item==want,'reported mode site '+hex(p));checks+=3
 require(set(report['anchoredInstructionSites'])==set(SEQUENCES),'anchor set')
 for label,(off,hexdata) in SEQUENCES.items():
  require(exe[off:off+len(hexdata)//2].hex()==hexdata,'code anchor '+label)
  require(report['anchoredInstructionSites'][label]=={'physical':off,'bytes':hexdata},'reported anchor '+label)
  checks+=2
 require(report['integrityReset']=={'entryPhysical':0x65174,'checksumComparePhysical':0x65188,
   'skipResetConditionalBranchPhysical':0x6518f,'mismatchClearsSettingsPhysical':0x65191,
   'mismatchLoadsDefaultBytesPhysical':0x6519f,'mismatchSetsModeTo':2,
   'unconditionalStartupValueEstablished':False},'conditional default reset not unconditional')
 require(report['backupRestore']=={'saveModePhysical':0x9a9df,'savedCopyObject2Offset':0x3030f,
                                      'restoreModePhysical':0x9aa54},'backup/restore')
 require(report['temporaryOverrides']==[
  {'saveModePhysical':0x9b277,'write3Physical':0x9b284,'restoreModePhysical':0x9b29d},
  {'saveModePhysical':0x9b2d1,'write3Physical':0x9b2de,'restoreModePhysical':0x9b2f7}], 'temporary scopes')
 modes={'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
 refs={}
 for name,base in modes.items():
  tab=[]
  for ix in range(31):
   pos=base+ix*4; ptr=struct.unpack_from('<I',exe,OBJ2+pos)[0]
   require(entries.get((2,pos))==(7,16,2,ptr) if ptr else (2,pos) not in entries,'dispatch table typed pointer')
   tab.append(ptr if ptr else None);checks+=1
  refs[name]=tab
 diffs=[i for i in range(31) if refs['mode_equals_1'][i]!=refs['mode_other'][i]]
 diff2=[i for i in range(31) if refs['mode_equals_1'][i]!=refs['mode_equals_2'][i]]
 require(diffs==[0,4] and diff2==list(range(8)),'cross-mode table distinctions')
 d=report['dispatch']
 require(d=={'paths':[0x82321,0x98ba7], 'mode2TableBase':0x15bec,'mode1TableBase':0x15c68,
    'fallbackTableBase':0x15ce4,'mode1VersusFallbackDifferentIndices':diffs,
    'mode2VersusMode1DifferentIndices':diff2,
    'mode1VersusFallbackRoots':{str(i):{'mode1':refs['mode_equals_1'][i],'fallback':refs['mode_other'][i]} for i in diffs},
    'tombRootIndex1':{key:values[1] for key,values in refs.items()},
    'portalRootIndex7':{key:values[7] for key,values in refs.items()}},'table consequences')
 require(report['runtimeObserved']=={'selectedMode':False,'selectedTable':False,'activeStageRoot':False,'paletteHandle':False},'must not infer live state')
 require(len(report['limits'])==4 and 'conditional' in report['limits'][1].lower(), 'required limitations')
 return {'status':'PASS_O126_INDEPENDENT','checks':checks,'typedRelocations':count,'modeSites':len(positions), 'mode1FallbackDifferences':diffs}

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: verify_o126_mode_independent.py MK2.EXE report.json')
 print(json.dumps(verify(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes()),indent=2))

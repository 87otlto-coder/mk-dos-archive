#!/usr/bin/env python3
"""O209 independent gate audit: uses separate O120 producer relocation parser,
never imports O209 producer and never executes game code or writes to game files.
"""
import argparse,hashlib,json,struct,sys
from pathlib import Path
THIS=Path(__file__).resolve()
sys.path.insert(0,str(THIS.parents[2] / 'tools' / 'mk2_native_stage_palettes'))
from trace_o120_setup_graph import fixups
OBJ1=0x61c54;OBJ2=0xa0c54
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
MODES={'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
STAGE_INDEX={0:('Dead Pool','DEDPOOL.GRA',0x82447),1:('Kombat Tomb','TOMB.GRA',0x82cd7),6:('The Pit II','PIT.GRA',0x831b2)}

def req(ok,why):
 if not ok:raise ValueError('O209 independent: '+why)

def read_u32(b,p):return struct.unpack_from('<I',b,p)[0]

def validate(exe,report):
 req(len(exe)==861133 and hashlib.sha256(exe).hexdigest()==SHA,'original MK2.EXE only')
 req(report['schema']=='mk2_o209_stage_fatality_gate1_static_v1' and report['sourceSHA256']==SHA,'source report identity')
 req(report['status']=='GATE1_NO_GO_FOR_HOTKEY_PATCH' and report['scope']['patchGenerated'] is False,'fail closed')
 x=fixups(exe);req(len(x)==26994,'independent original fixup census')
 req(len(report['pass1']['stages'])==3,'three stage families')
 count=0
 for row in report['pass1']['stages']:
  ix=row['index']; label,resource,addr=STAGE_INDEX[ix]
  req(row['name']==label and row['resourceName']==resource and len(row['configurations'])==3,'stage identity and modes')
  for r in row['configurations']:
   entry=MODES[r['mode']]+4*ix;root=read_u32(exe,OBJ2+entry)
   fx=x[(2,entry)];req((fx['kind'],fx['flags'],fx['targetObject'],fx['targetOffset'])==(7,16,2,root),'stage root relocation')
   cb=read_u32(exe,OBJ2+root+16);ref=x[(2,root+16)]
   req((ref['kind'],ref['flags'],ref['targetObject'],ref['targetOffset'])==(7,16,1,cb),'initializer typed relocation')
   physical=OBJ1+cb
   req(physical==addr and r['initializerPhysical']==f'0x{addr:X}' and r['initializerEntryBytes']==exe[addr:addr+24].hex(),'initializer code')
   req(r['rootPointerFieldPhysical']==f'0x{OBJ2+entry:X}' and r['initializerPointerFieldPhysical']==f'0x{OBJ2+root+16:X}','physical file positions')
   count+=5
 for name,v in report['pass2']['optionAndMediaLabels'].items():
  p=int(v['physicalOffset'],16);blob=bytes.fromhex(v['rawHex'])
  req(exe[p:p+len(blob)]==blob,'exact original menu/media label '+name)
  count+=1
 for name,v in report['pass2']['instructionAnchors'].items():
  p=int(v['physicalOffset'],16);blob=bytes.fromhex(v['instructionBytes']); start=int(v['windowPhysicalStart'],16)
  req(exe[p:p+len(blob)]==blob and exe[start:p+len(blob)+32].hex()==v['windowHex'],'instruction/window '+name)
  count+=2
 req(report['scope']['runtimeFatalityDispatcherLocated'] is False and len(report['pass3']['disqualifiedCandidatePaths'])==4,'unsupported dispatch disqualified')
 req(any('stable stage identifier' in s for s in report['limitations']),'scratch-global uncertainty')
 req(report['pass3']['decision'].startswith('STOP at Gate 1'),'no premature patch')
 return {'status':'PASS_O209_INDEPENDENT_GATE1','sourceSHA256':SHA,'stages':3,'modesPerStage':3,'originalLEFixupSites':len(x), 'assertions':count+6,
    'reportSHA256':hashlib.sha256((json.dumps(report,indent=2)+'\n').encode()).hexdigest()}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);p.add_argument('--report',type=Path,required=True);q=p.parse_args()
 print(json.dumps(validate(q.exe.read_bytes(),json.loads(q.report.read_text())),indent=2))

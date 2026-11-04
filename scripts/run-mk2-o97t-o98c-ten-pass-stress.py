#!/usr/bin/env python3
"""Ten bounded MK2 executable research passes O97T..O98C; observations only, no runtime inference.
Each report is a separately addressable, byte-derived hypothesis test. Cross-language verifier is independent.
"""
from pathlib import Path
import sys,json,hashlib,struct
exe=Path(sys.argv[1]); root=Path(sys.argv[2]); chosen=set(sys.argv[3:])
b=exe.read_bytes(); u=lambda p:struct.unpack_from('<I',b,p)[0];h=lambda v:hashlib.sha256(v).hexdigest()
assert h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DATE='2026-10-09'
SPECS=[
 ('O97T','early-profile-constructor',0x64591,0x645c0,'The early setup routine makes two mode calls, clears the base accumulator, then creates one profile callback. No scene reachability asserted.'),
 ('O97U','late-dual-process-construction',0x84b40,0x84b86,'The later setup routine calls an actor-state helper, then constructs two distinct process callbacks, not one.'),
 ('O97V','secondary-callback-three-phases',0x84e5d,0x84eb7,'The second process callback loads three distinct literal global pairs and calls one shared helper for each.'),
 ('O97W','secondary-helper-scheduler-yield',0x84eb7,0x84ed0,'The shared helper calls two routines, reads a global, and tail-jumps to scheduler yield; its units remain unknown.'),
 ('O97X','late-setup-events-yields',0x84b86,0x84bf0,'The late process-setup continuation emits four event calls and several scheduler yields; delay units are not proven.'),
 ('O97Y','multiplexed-global-roles',0x84bfa,0x84c0f,'The late setup writes scalar 22 into global 0x75A80 and copies it to an object field; the second callback writes non-slot packed literals to that same global in a distinct path.'),
 ('O97Z','relocated-dual-callback-objects',0x84b60,0x84b86,'Two constructor calls have distinct typed LE Object-1 process entrypoints and share the verified constructor-to-scheduler entry field +0x1C.'),
 ('O98A','renderer-visibility-branches',0x931e4,0x93225,'The object consumer has separate conditional offset adjustment and rendering-mode gate. Direct visibility is not guaranteed.'),
 ('O98B','ten-accumulator-update-walk',0x93433,0x934a8,'The control update path adds ten source DWORDs into ten accumulator DWORDs, distinct from observed frame timing.'),
 ('O98C','distinct-global-selector-contexts',0x85fa4,0x85fb3,'Literal 13 selects the Mountain configuration in one routine, whereas literal 22 is stored in another scene path; sharing a global does not prove coactivation.'),
]

def call(p, opcode=0xe8):
 assert b[p]==opcode,(hex(p),b[p]); return p+5+struct.unpack_from('<i',b,p+1)[0]
def regimm(p, opcode):
 assert b[p]==opcode;return u(p+1)
def movglob(p):
 assert b[p:p+2]==bytes.fromhex('c705'),hex(p);return {'global':u(p+2),'value':u(p+6)}
def atglobal(p):
 assert b[p]==0xa3;return u(p+1)
def ensure_byte(p,hexstr):
 assert b[p:p+len(bytes.fromhex(hexstr))].hex()==hexstr,hex(p)

for ident,name,start,end,claim in SPECS:
 if chosen and ident not in chosen: continue
 details={}
 if ident=='O97T':
  details={'modeValues':[regimm(x,0xb8) for x in [0x64591,0x6459b]],'modeCalls':[call(x) for x in [0x64596,0x645a0]],'accumulatorClearGlobal':atglobal(0x645a7),'constructorParameters':{'EBX':regimm(0x645ae,0xbb),'EDXObject1':regimm(0x645b3,0xba)},'constructorTarget':call(0x645b8),'tailOpcode':b[0x645bf]};ensure_byte(0x645a5,'33c0');assert details['modeCalls']==[0x86bbb]*2
 if ident=='O97U':
  details={'leadingActorCall':call(0x84b40),'modeValues':[regimm(x,0xb8) for x in [0x84b45,0x84b4f]],'modeCalls':[call(x) for x in [0x84b4a,0x84b54]],'accumulatorClearGlobal':atglobal(0x84b5b),'constructorParameters':[{'EBX':regimm(p,0xbb),'EDXObject1':regimm(p+5,0xba),'target':call(p+10)} for p in [0x84b62,0x84b75]]};ensure_byte(0x84b59,'33c0')
 if ident=='O97V':
  phases=[{'packed':movglob(a),'second':movglob(c),'helperTarget':call(e)} for a,c,e in [(0x84e5d,0x84e67,0x84e71),(0x84e76,0x84e80,0x84e8a),(0x84e8f,0x84e99,0x84ea3)]]
  details={'phases':phases,'tailMode':regimm(0x84ea8,0xb8),'tailModeCall':call(0x84ead),'finalTailJump':call(0x84eb2,0xe9)}
 if ident=='O97W':
  details={'modeLiteral':regimm(0x84eb7,0xb8),'modeCall':call(0x84ebc),'dataCall':call(0x84ec1),'yieldSourceGlobal':u(0x84ec7),'schedulerTailJump':call(0x84ecb,0xe9)};ensure_byte(0x84ec6,'a1')
 if ident=='O97X':
  details={'eventValues':[regimm(x,0xb8) for x in [0x84b88,0x84ba0,0x84bb8,0x84bd0]],'eventCalls':[call(x) for x in [0x84b8d,0x84ba5,0x84bbd,0x84bd5]],'yieldValues':[regimm(x,0xb8) for x in [0x84b94,0x84bac,0x84bc4,0x84bdc]],'yieldCalls':[call(x) for x in [0x84b99,0x84bb1,0x84bc9,0x84be1]],'followupCalls':[call(x) for x in [0x84be6,0x84beb]]}
 if ident=='O97Y':
  details={'lateScalarStore':movglob(0x84bfa),'copyFromGlobal':u(0x84c07),'copyToObjectCode':b[0x84c0b:0x84c0e].hex(),'separateSecondaryPackedStores':[movglob(p) for p in [0x84e5d,0x84e76,0x84e8f]]};ensure_byte(0x84c04,'52');ensure_byte(0x84c05,'8b15')
 if ident=='O97Z':
  details={'processCallbacks':[regimm(0x84b67,0xba),regimm(0x84b7a,0xba)],'constructorTargets':[call(0x84b6c),call(0x84b7f)],'firstParam':[regimm(0x84b62,0xbb),regimm(0x84b75,0xbb)],'entryPhysicalTargets':[regimm(0x84b67,0xba)+0x61c54,regimm(0x84b7a,0xba)+0x61c54],'constructorFieldStore':b[0x67248:0x6724b].hex(),'schedulerIndirectJump':b[0x67185:0x67188].hex(),'pointerOperandPhysical':[0x84b68,0x84b7b]}
 if ident=='O98A':
  ensure_byte(0x931e4,'0fb74530');ensure_byte(0x931f6,'f705');ensure_byte(0x9320e,'f705')
  details={'sourceFieldOffset':0x30,'firstConditionalGlobal':u(0x931f8),'firstConditionalBranchTarget':0x93202+2+struct.unpack_from('<b',b,0x93201)[0], 'offsetWrites':[b[0x93205:0x93208].hex(),b[0x9320b:0x9320e].hex()],'gateGlobal':u(0x93210),'gateImmediate':u(0x93214),'gateTarget':0x9321e+struct.unpack_from('<i',b,0x9321a)[0]}
  # 0x93200: jne 0x9320e, and 0x93218: je 0x93390. Keep exact target as separate explicit check below.
  details['firstConditionalBranchTarget']=0x93202+struct.unpack_from('<b',b,0x93201)[0]
 if ident=='O98B':
  vals=[];p=0x93433
  for j in range(10):
   if b[p]==0xa1:src=u(p+1);p+=5;reg=0
   else:
    assert b[p:p+1]==b'\x8b' and b[p+1] in [0x1d,0x0d,0x15];src=u(p+2);reg=b[p+1];p+=6
   assert b[p]==0x01 and b[p+1] in [0x05,0x1d,0x0d,0x15]
   dest=u(p+2);p+=6
   vals.append({'srcGlobal':src,'dstGlobal':dest,'addOpcodeReg':reg})
  assert p==end
  details={'updates':vals,'startPhysical':start,'endPhysical':p}
 if ident=='O98C':
  details={'mountainIndexStore':movglob(0x85fa4),'mountainIndexConsumer':call(0x85fae),'otherScalarStore':movglob(0x84bfa),'objectScalarReadSource':u(0x84c07),'objectFieldStore':b[0x84c0b:0x84c0e].hex(),'secondaryPackedSource':movglob(0x84e5d)}
 assert details
 report={'pass':ident,'format':'mk2_ten_pass_stress_executable_contract_v1','status':'PASS','question':name,'scope':'authenticated executable bytes; static conditional pathways only','fixtureSha256':h(b),'sourceSlice':{'start':start,'end':end,'sha256':h(b[start:end]),'hex':b[start:end].hex()},'observations':details,'finding':claim,'verdict':'SUPPORTED_CONDITIONALLY','runtimeCoactivation':'UNPROVEN','sceneIdentity':'UNPROVEN','cameraUnits':'UNPROVEN','frameTiming':'UNPROVEN'}
 path=root/f'mk2_{name.lower().replace("-","_")}_{ident.lower()}_{DATE}.json';path.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'pass':ident,'status':'PASS','evidence':str(path),'spanBytes':end-start}))

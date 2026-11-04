#!/usr/bin/env python3
"""O98D-O98O: independently falsifiable, bounded MK2 executable hypotheses.
Static machine-code observations, not dynamic traces. Each report has distinct scope and contract.
"""
import sys,json,struct,hashlib
from pathlib import Path
EXE=Path(sys.argv[1]); ROOT=Path(sys.argv[2]); ONLY=set(sys.argv[3:]); BIN=EXE.read_bytes()
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';h=lambda x:hashlib.sha256(x).hexdigest()
assert h(BIN)==SHA
U=lambda p:struct.unpack_from('<I',BIN,p)[0];S=lambda p:struct.unpack_from('<i',BIN,p)[0]
# Witness instruction sites: opcode form, explicit physical offset, expected decoded operand or target.
# Node verifier independently parses the same executable, checks exact values, and recomputes relocation typing.
DATA=[
 ('O98D','alternate-actor-source-guard',0x84ae8,0x84b40,
  'A conditional actor-state switch supplies one of two object sources to the same +0x48 field before the dual-process setup; exact scene entry remains unknown.',
  [('read_any',0x84ae8,0x76146),('read_any',0x84aef,0x7614e),('write_reg',0x84af5,0x75a78),('read_any',0x84afc,0x76522),('read_any',0x84b06,0x75fc2),('read_any',0x84b0d,0x75fca),('write_reg',0x84b13,0x75a78),('read_any',0x84b1b,0x75a78),('call',0x84b2f,0x813c5),('call',0x84b3b,0x6710f)]),
 ('O98E','bounded-scalar-script-22-through-30',0x84bfa,0x84c6e,
  'The alternate script starts at scalar 22, increments on a conditional loop while below 28, then installs scalar 30; an extra process callback is constructed on the loop path.',
  [('store',0x84bfa,(0x75a80,22)),('read_any',0x84c05,0x75a80),('call',0x84c2a,0x67222),('imm_eax',0x84c31,11),('call',0x84c36,0x6710f),('inc',0x84c46,0x75a80),('cmpimm',0x84c4c,(0x75a80,28)),('store',0x84c55,(0x75a80,30)),('imm_edx',0x84c25,0x23107)]),
 ('O98F','alternative-control-cursor-install',0x84c8b,0x84cc0,
  'A separate code path installs pointer 0x15D60 into the shared positive-token control cursor, clears a related global, and calls its setup helper; coactivation with Mountain is not demonstrated.',
  [('call',0x84c8b,0x64685),('imm_eax',0x84c90,0x15d60),('write_eax',0x84c95,0x75cf6),('call',0x84ca6,0x84dbc),('call',0x84cbb,0x646b4)]),
 ('O98G','control-helper-distinct-scalar-13',0x84dbc,0x84df6,
  'The helper writes scalar 13 to 0x75A78 and later adds 12 before the composition interpreter, a distinct global and context from selector-13 at 0x85FA4.',
  [('imm_eax',0x84dbc,13),('store',0x84dc3,(0x75a64,0)),('call',0x84dcd,0x85be3),('store',0x84dda,(0x75a78,13)),('call',0x84de4,0x918f1),('addimm',0x84de9,(0x75a78,12)),('call',0x84df0,0x63e79)]),
 ('O98H','sentinel-selector-during-alternate-transition',0x84d01,0x84d4b,
  'One alternate transition emits event 0xA4, stores 0xFFFF in the global state field, and later calls 0x82321; source conditions and palette ownership are unknown.',
  [('imm_eax',0x84d03,0xa4),('call',0x84d08,0x8140e),('imm_eax',0x84d0f,0xffff),('write_eax',0x84d14,0x75ce8),('call',0x84d19,0x650ce),('call',0x84d1e,0x93ace),('call',0x84d23,0x64685),('call',0x84d2d,0x6710f),('call',0x84d32,0x82321)]),
 ('O98I','third-executable-process-callback',0x84d5b,0x84db7,
  'A further alternate path installs process callback Object-1 offset 0x32835 with EBX 256 and writes object/context globals before an indirect transition; this is not a Mountain runtime witness.',
  [('call',0x84d5b,0x84dbc),('call',0x84d70,0x646b4),('write_reg',0x84d75,0x75a80),('store',0x84d7b,(0x75a7c,0)),('imm_edx',0x84d8c,0x32835),('call',0x84d91,0x67222),('write_reg',0x84da2,0x75a7c)]),
 ('O98J','saved-control-field-sentinel-restore',0x84df6,0x84e5d,
  'The alternate state handler copies the active field into a scratch global, temporarily uses 0x7FFF, then restores from the original global after two yields; no time units established.',
  [('imm_eax',0x84df8,0x41),('call',0x84dfd,0x813c5),('read_any',0x84e05,0x75ce8),('write_reg',0x84e0b,0x75a78),('store',0x84e17,(0x75ce8,0x7fff)),('call',0x84e21,0x93ace),('call',0x84e2b,0x6710f),('store',0x84e35,(0x75ce8,0)),('call',0x84e44,0x6710f),('read_any',0x84e4a,0x75a78),('write_reg',0x84e50,0x75ce8)]),
 ('O98K','temporary-selector-30-save-restore',0x84ed0,0x84f08,
  'A bounded wrapper saves 0x75A80, temporarily sets it to selector 30 for 0x82321, and restores the old value; selection cannot be propagated past restoration by assumption.',
  [('imm_eax',0x84ed2,0x41),('call',0x84ed7,0x813c5),('store',0x84ee4,(0x75a80,30)),('call',0x84eee,0x82321)]),
 ('O98L','mountain-setup-dispatch-prologue',0x85f9a,0x86015,
  'A bounded Mountain setup path writes 13 before calling 0x82321, selects conditional inputs for descriptor construction, and initializes the object-list head at 0x84358.',
  [('call',0x85f9a,0x650ce),('call',0x85f9f,0x93ace),('store',0x85fa4,(0x75a80,13)),('call',0x85fae,0x82321),('call',0x85fb8,0x86bbb),('read_any',0x85fbd,0x75fce),('read_any',0x85fc2,0x75fba),('read_any',0x85fcd,0x76152),('read_any',0x85fd7,0x76522),('read_any',0x85fe5,0x7652a),('call',0x85ff8,0x8608c),('imm_eax',0x86000,0x84358),('call',0x86005,0x6513b),('read_reg',0x8600a,0x76526),('imm_ebx',0x86010,0x1c2c6)]),
 ('O98M','conditional-base-accumulator-initializer',0x860c1,0x860fd,
  'The base accumulator 0x842E8 is conditionally installed from signed table words at 0x1C2A8 indexed by 0x7652A; the code has early-return guards and does not guarantee a camera position.',
  [('read_any',0x860d9,0x76522),('read_any',0x860e5,0x7652a),('write_eax',0x860f7,0x842e8)]),
 ('O98N','mountain-portrait-loop-to-two-producers',0x86015,0x86086,
  'The bounded signed-word consumer stops on negative token or 13, places selected descriptors, calls the eight-row producer twice and constructs the producer-loop process; selected visual coactivation remains conditional.',
  [('call',0x86038,0x8608c),('call',0x86041,0x81bb3),('call',0x86046,0x860c1),('imm_eax',0x8604b,0x84348),('call',0x86050,0x6513b),('imm_eax',0x86055,1),('write_eax',0x8605a,0x7745b),('call',0x8605f,0x81bb3),('imm_edx',0x8606b,0x1ff44),('call',0x86070,0x67222),('call',0x86077,0x650d9),('call',0x86081,0x6710f)]),
 ('O98O','three-independent-control-cursor-installers',0x98828,0x98a6a,
  'Three distinct code sites install the same relocated Object-2 0x15D60 cursor into 0x75CF6; their additional state writes are different and do not establish scene identity or synchronous activation.',
  [('imm_eax',0x9882d,0x15d60),('write_eax',0x98832,0x75cf6),('write_eax',0x98839,0x75ce8),('write_eax',0x9883e,0x75cee),('write_eax',0x98848,0x762ca),('imm_eax',0x98a4a,0x15d60),('write_eax',0x98a4f,0x75cf6),('store',0x98a54,(0x75a7c,32)),('imm_eax',0x84c90,0x15d60),('write_eax',0x84c95,0x75cf6)]),
]

def readsite(k,p,expected):
 if k=='call':assert BIN[p]==0xe8; val=p+5+S(p+1);n=5
 elif k=='store':assert BIN[p:p+2]==b'\xc7\x05';val=(U(p+2),U(p+6));n=10
 elif k=='cmpimm':assert BIN[p:p+2]==b'\x83\x3d';val=(U(p+2),BIN[p+6]);n=7
 elif k=='addimm':assert BIN[p:p+2]==b'\x83\x05';val=(U(p+2),BIN[p+6]);n=7
 elif k=='inc':assert BIN[p:p+2]==b'\xff\x05';val=U(p+2);n=6
 elif k=='read_any':
  if BIN[p]==0xa1:val=U(p+1);n=5
  else:assert BIN[p:p+1]==b'\x8b' and BIN[p+1] in (0x15,0x1d,0x0d,0x3d,0x35);val=U(p+2);n=6
 elif k=='read_reg':assert BIN[p:p+2]==b'\x8b\x0d';val=U(p+2);n=6
 elif k=='write_eax':assert BIN[p]==0xa3;val=U(p+1);n=5
 elif k=='write_reg':assert BIN[p:p+2] in [b'\x89\x15',b'\x89\x3d'];val=U(p+2);n=6
 elif k.startswith('imm_'):
  opc={'imm_eax':0xb8,'imm_ebx':0xbb,'imm_edx':0xba}[k];assert BIN[p]==opc,(k,hex(p),BIN[p]);val=U(p+1);n=5
 else:raise ValueError(k)
 assert val==expected,(k,hex(p),val,expected)
 return {'kind':k,'at':p,'operand':val,'bytes':BIN[p:p+n].hex()}
for pas,slug,start,end,finding,sites in DATA:
 if ONLY and pas not in ONLY:continue
 facts=[readsite(*x) for x in sites]
 assert 0<=start<end<=len(BIN)
 report={'pass':pas,'schema':'mk2_o98d_o98o_conditional_executable_audit_v1','status':'PASS','fixtureSha256':SHA,'question':slug,
         'scope':'original MK2 file-backed machine code and relocation-aware candidate; no executed scene evidence',
         'window':{'start':start,'end':end,'sha256':h(BIN[start:end]),'hex':BIN[start:end].hex()},
         'facts':facts,'finding':finding,'classification':'SUPPORTED_STATIC_CONDITIONAL',
         'hypotheses':{'sharedRuntimeActivation':'UNPROVEN','observedSceneIdentity':'UNPROVEN','actualCameraUnits':'UNPROVEN','measuredTiming':'UNPROVEN'}}
 dest=ROOT/f'mk2_{slug.replace("-","_")}_{pas.lower()}_2026-10-09.json';dest.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'pass':pas,'facts':len(facts),'report':dest.name,'result':'PASS'}))

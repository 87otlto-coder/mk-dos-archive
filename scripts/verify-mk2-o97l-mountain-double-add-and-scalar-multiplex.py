#!/usr/bin/env python3
"""O97L: independent machine-code validation of two additions and halfword reuse."""
import json,struct,hashlib,sys
from pathlib import Path
fx,root=map(Path,sys.argv[1:3]);binary=(fx/'mk2.exe').read_bytes();report=json.loads((root/'mk2_mountain_base_accumulator_double_add_o97l_2026-10-09.json').read_bytes());parent=(root/'mk2_mountain_positive_control_word_accumulators_o97k_2026-10-09.json').read_bytes();u=lambda off:struct.unpack_from('<I',binary,off)[0];h=lambda x:hashlib.sha256(x).hexdigest();checks=0
def ck(cond,desc):
 global checks
 checks+=1
 if not cond:raise AssertionError('O97L rejected: '+desc)
ck(h(binary)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','exe');ck(report['fixtureSha256']==h(binary) and report['parentO97kSha256']==h(parent),'parent hash');ck(report['format']=='mk2_o97l_mountain_double_add_scalar_multiplex_v1' and report['status']=='PASS','report')
# Independently authenticate semantic groups via raw opcode chunks and direct-address operands.
code={'firstAddition':(0x93433,'a1e44208000105e8420800'),'baseSourceCopy':(0x934b4,'528b15e44208008915745a07005a'),'firstAccumulatorCopy':(0x934c2,'528b15e84208008915685a07005a'),'secondAddition':(0x934d0,'528b15745a07000115685a07005a'),'writeback':(0x934de,'528b15685a07008915e84208005a'),'postCall':(0x934ec,'e8d938fdff'),'cursorCopy':(0x93500,'8b15f65c07008915985a0700'),'wordOverride':(0x9358c,'8b3183c104668b36668935685a0700')}
ck(len(report['codeChunks'])==8,'count')
for x in report['codeChunks']:
 pos,witness=code[x['name']];ck(pos==x['at'] and x['hex']==witness and binary[pos:pos+len(witness)//2].hex()==witness,'machine '+x['name'])
for addr,value in [(0x93434,0x842e4),(0x9343a,0x842e8),(0x934b7,0x842e4),(0x934bd,0x75a74),(0x934c5,0x842e8),(0x934cb,0x75a68),(0x934d3,0x75a74),(0x934d9,0x75a68),(0x934e1,0x75a68),(0x934e7,0x842e8)]:ck(u(addr)==value,'actual operand '+hex(addr))
ck(report['sourceGlobal']==0x842e4 and report['baseAccumulatorGlobal']==0x842e8 and report['intermediateGlobal']==0x75a68 and report['incrementStagingGlobal']==0x75a74,'globals')
# Byte-exact low-word override; word at +0x93594 does not modify upper word of 0x75A68.
ck(binary[0x93591:0x9359b].hex()=='668b36668935685a0700','word load/store');ck(report['secondWordOverrideAt']==0x93591,'half-word source')
for x in report['examples']:
 a,d=x['initialAccumulator'],x['increment'];ck(x['afterFirstAdd']==((a+d)&0xffffffff),'first add test');ck(x['afterSecondAdd']==((a+2*d)&0xffffffff),'second add test')
ck(len(report['examples'])==5,'examples');ck(report['formulaModulo32']=='A_after_writeback = (A_before + 2*D_before) mod 2^32','formula')
expected={'baseAccumulatorDoubleAddedInOneEligiblePath':'SUPPORTED','positiveControlWordReplacesLowHalfOfSameGlobal':'SUPPORTED','exactlyOneBaseAccumulatorAdditionInTheObservedCodePath':'REJECTED','oneAdditionPerVideoFrame':'UNPROVEN','knownCameraPixelsPerSecond':'UNPROVEN','rendererCalledPerVideoFrame':'UNPROVEN','actualSceneRuntimeEntry':'UNPROVEN'}
for k,v in expected.items():ck(report['hypotheses'][k]==v,'guard '+k)
print(json.dumps({'pass':'O97L','status':'PASS','independent_checks':checks,'failures':0,'machine_chunks':len(code),'arithmetic_examples':5}))

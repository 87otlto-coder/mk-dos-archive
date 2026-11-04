#!/usr/bin/env python3
"""Independent O110V typed opcode census verification."""
import hashlib,json,struct,sys,collections
from pathlib import Path
H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
EXPECTED={'810d':1,'8915':2,'891d':1,'8b15':2,'a1':2,'a3':13,'c705':7,'f705':2}
READ={'a1','8b15','f705'};IMMS={'c705','810d','f705'}

def verify(b,qb,r):
 n=0
 def ck(a,x):
  nonlocal n
  if not a:raise AssertionError(x)
  n+=1
 ck(hashlib.sha256(b).hexdigest()==H,'canonical exe')
 ck(r['sourceExeSHA256']==H and r['format']=='mk2_o110v_palette_zero_direct_writer_typing_v1','identity')
 ck(r['status']=='ORIGINAL_EXE_DIRECT_INSTRUCTION_OPERANDS_ONLY','qualification')
 ck(r['parentO110QSHA256']==hashlib.sha256(qb).hexdigest(),'parent evidence')
 q=json.loads(qb);ck(q['format']=='mk2_o110q_palette_zero_global_operand_census_v1','parent format')
 ck(r['targetGlobal']==0x75ce8,'target')
 pos=[i for i in range(0x61c54,0xa0c54-3) if b[i:i+4]==struct.pack('<I',0x75ce8)]
 ck(len(pos)==31 and pos==q['allRawFourByteOccurrences'],'31 raw signatures')
 ck(len(r['typedReferences'])==30,'30 instruction operands')
 sites={x['operandAt']:x for x in r['typedReferences']}
 ck(set(sites)==set(pos)-{0x99c0a},'no false CALL operand')
 counts=collections.Counter();lit=collections.defaultdict(list)
 for at in sorted(sites):
  item=sites[at]
  prefix='a3' if b[at-1]==0xa3 else 'a1' if b[at-1]==0xa1 else b[at-2:at].hex()
  ck(prefix==item['opcode'],'instruction kind '+hex(at))
  ck(b[at:at+4]==struct.pack('<I',0x75ce8),'target operand '+hex(at))
  v=struct.unpack_from('<I',b,at+4)[0] if prefix in IMMS else None
  ck(item['value']==v and item['nextBytes']==b[at+4:at+8].hex(),'literal '+hex(at))
  ck(item['operation'].endswith(('READ','WRITE')),'read/write classification '+hex(at))
  counts[prefix]+=1
  if prefix=='c705':lit[v].append(at)
 ck(dict(sorted(counts.items()))==EXPECTED and r['opcodeHistogram']==EXPECTED,'opcode population')
 ck(set(lit)=={0,0x7fff} and len(lit[0])==5 and len(lit[0x7fff])==2,'literal value population')
 ck(r['literalAssignments']=={'zero':lit[0],'full15Bit':lit[0x7fff]},'direct literal location map')
 cls=r['classification']
 for key,value in {'directWrites':23,'registerDependentWrites':16,'literalMoveWrites':7,
  'literalZeroWrites':5,'literal7fffWrites':2,'directReadOrTest':6,'readModifyOrWriteBitSet':1,
  'unexpectedNonOperandMatch':0x99c0a}.items():ck(cls[key]==value,'typing '+key)
 for key in ('indirectOrAliasWriterCompleteness','runtimeValueSequenceDetermined','visibleDAC0ColorDetermined'):
  ck(cls[key] is False,'no proof '+key)
 ck(len(r['caveats'])==3,'limits')
 return {'status':'PASS','checks':n,'typedDirectRefs':30,'directLiteralWrites':7,'observedDAC0Color':False}
if __name__=='__main__':
 if len(sys.argv)!=4:raise SystemExit('usage <canonical-fixture-dir> <O110Q> <O110V>')
 print(json.dumps(verify((Path(sys.argv[1])/'mk2.exe').read_bytes(),Path(sys.argv[2]).read_bytes(),json.loads(Path(sys.argv[3]).read_bytes()))))

#!/usr/bin/env python3
"""O110V: typed direct zero-palette state writer census and literal classification.
Bounds only the exact operand-address occurrences, no indirect/alias completeness.
"""
import hashlib,json,struct,sys,collections
from pathlib import Path
H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GLOBAL=0x75ce8
OP={'a3':'REGISTER_EAX_WRITE','8915':'REGISTER_EDX_WRITE','891d':'REGISTER_EBX_WRITE',
 'c705':'LITERAL_MOV_WRITE','810d':'LITERAL_OR_WRITE','a1':'REGISTER_EAX_READ','8b15':'REGISTER_EDX_READ','f705':'LITERAL_TEST_READ'}

def main():
 if len(sys.argv)!=4:raise SystemExit('usage <original-mk2-dir> <O110Q-json> <outdir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();prior=Path(sys.argv[2]).read_bytes();out=Path(sys.argv[3]);out.mkdir(exist_ok=True,parents=True)
 assert hashlib.sha256(b).hexdigest()==H
 q=json.loads(prior);assert q['format']=='mk2_o110q_palette_zero_global_operand_census_v1'
 words=struct.pack('<I',GLOBAL);matches=[p for p in range(0x61c54,0xa0c54-3) if b[p:p+4]==words]
 assert matches==q['allRawFourByteOccurrences']
 records=[]
 for p in matches:
  if p==0x99c0a:continue
  opcode='a3' if b[p-1]==0xa3 else 'a1' if b[p-1]==0xa1 else b[p-2:p].hex()
  assert opcode in OP,(hex(p),opcode)
  value=struct.unpack_from('<I',b,p+4)[0] if opcode in ('c705','810d','f705') else None
  records.append({'operandAt':p,'opcode':opcode,'operation':OP[opcode],
                  'value':value,'nextBytes':b[p+4:p+8].hex()})
 histogram=dict(sorted(collections.Counter(r['opcode'] for r in records).items()))
 imm=[r for r in records if r['opcode']=='c705']
 assert histogram=={'810d':1,'8915':2,'891d':1,'8b15':2,'a1':2,'a3':13,'c705':7,'f705':2}
 assert collections.Counter(r['value'] for r in imm)=={0:5,0x7fff:2}
 report={'format':'mk2_o110v_palette_zero_direct_writer_typing_v1','status':'ORIGINAL_EXE_DIRECT_INSTRUCTION_OPERANDS_ONLY',
  'sourceExeSHA256':H,'parentO110QSHA256':hashlib.sha256(prior).hexdigest(),'targetGlobal':GLOBAL,
  'typedReferences':records,'opcodeHistogram':histogram,
  'literalAssignments':{'zero':[r['operandAt'] for r in imm if r['value']==0],
                        'full15Bit':[r['operandAt'] for r in imm if r['value']==0x7fff]},
  'classification':{'directWrites':23,'registerDependentWrites':16,'literalMoveWrites':7,
     'literalZeroWrites':5,'literal7fffWrites':2,'directReadOrTest':6,'readModifyOrWriteBitSet':1,
     'unexpectedNonOperandMatch':0x99c0a,'indirectOrAliasWriterCompleteness':False,
     'runtimeValueSequenceDetermined':False,'visibleDAC0ColorDetermined':False},
  'caveats':['Literal zero/0x7FFF writes are instruction properties, not evidence those sites executed.',
             'Register writes can assign other colors/flags; source-side effects are not completely traced.',
             'Raw byte equality can coincide with E8 instruction bytes and is not itself a memory reference.']}
 dst=out/'MK2_O110V.json';dst.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','pass':'O110V','zeroLiteralWrites':5,'whiteLiteralWrites':2,'registerWrites':16,'output':str(dst)}))
if __name__=='__main__':main()

#!/usr/bin/env python3
"""Independently reconstruct O96G direct operand census and 5 post-call contracts."""
import json,sys,hashlib,struct
from pathlib import Path
if len(sys.argv)!=4: raise SystemExit('usage: verify O96G <mk2-dir> <O96F-report> <O96G-report>')
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();prev=Path(sys.argv[2]).read_bytes();r=json.loads(Path(sys.argv[3]).read_text());n=0
def ck(name,condition):
 global n
 n+=1
 if not condition:raise AssertionError(name)
def u(p):return struct.unpack_from('<I',b,p)[0]
def s(p):return struct.unpack_from('<i',b,p)[0]
def h(z):return hashlib.sha256(z).hexdigest()
ck('fixture',h(b)==r['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('source',h(prev)==r['source']['o96fSha256'] and json.loads(prev)['status']=='SUCCESS')
lo=0x61c54;hi=lo+63*4096;ck('range',r['object1Physical']==[lo,hi]);ck('global',r['rendererIndexGlobal']==0x7747f)
hits=[i for i in range(lo,hi-3) if b[i:i+4]==b'\x7f\x74\x07\x00'];ck('two occurrence positions',hits==[0x82327,0x9e166]);ck('two verb classes',[b[i-1] for i in hits]==[0xa3,0xa1]);ck('report exact observations',r['allExactDirectOperandOccurrences']==[{'operandPhysical':i,'precedingOpcode':b[i-1],'contextHex':b[i-1:i+4].hex()} for i in hits]);ck('producer',r['indexWriterPhysical']==0x82321);ck('consumer',r['rendererReaderPhysical']==0x9e165)
exp=[(0x771e6,7,'DIRECT_CALL',0x81455),(0x77a08,6,'MOV_EDI_IMM32',0x92cc),(0x77d8b,5,'DIRECT_CALL',0x650ce),(0x84eee,30,'RESTORE_SOURCE_GLOBAL_FROM_STACK',None),(0x85fae,13,'MOV_EAX_IMM32',5)]
ck('five',len(r['adjacentLiteralCallers'])==len(exp))
for item,(call,value,kind,tgt) in zip(r['adjacentLiteralCallers'],exp):
 ck('reported call',item['call']==call);ck('reported literal',item['value']==value);ck('literal opcode',b[call-10:call-4]==bytes.fromhex('c705805a0700'));ck('literal imm',u(call-4)==value);ck('writer call',b[call]==0xe8 and call+5+s(call+1)==0x82321);ck('next position',item['continuation']==call+5);ck('next shape',item['kind']==kind)
 q=call+5
 if kind=='DIRECT_CALL':ck('next direct',b[q]==0xe8 and q+5+s(q+1)==tgt and item['nextTarget']==tgt)
 elif kind=='MOV_EDI_IMM32':ck('next EDI',b[q]==0xbf and u(q+1)==tgt and item['nextLiteral']==tgt)
 elif kind=='MOV_EAX_IMM32':ck('next EAX',b[q]==0xb8 and u(q+1)==tgt and item['nextLiteral']==tgt)
 else:ck('save',b[0x84ede:0x84ee4]==bytes.fromhex('ff35805a0700'));ck('restore',b[q:q+6]==bytes.fromhex('8f05805a0700'))
 ck('next bytes',item['followingBytesHex']==b[q:q+12].hex())
prior=json.loads(prev);ck('previous agreement',sorted((c['callPhysical'],c['adjacentLiteral']['value']) for c in prior['groups'][1]['calls'] if c['adjacentLiteral'])==[(e[0],e[1]) for e in exp])
c=r['classification'];[ck('positive '+k,c[k] is True) for k in ['onlyTwoExactDirectAddressOperandsInObject1','oneDirectStoreAndOneDirectLoad','fiveLocalNumericWriterInputsRetained','thirtySourceGlobalPushPopAroundWriter','allIndirectUsesExcludedFromCensus']];[ck('negative '+k,c[k] is False) for k in ['globalValueProvenToPersistIntoRendererFromAnyCaller','renderedStageIdentityOrPaletteProven','mk2ResearchClosed']]
print(json.dumps({'pass':'O96G','status':'PASS','checks':n,'failures':0,'directGlobalOperands':2,'fiveCallersVerified':True}))

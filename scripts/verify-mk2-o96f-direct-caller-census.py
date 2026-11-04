#!/usr/bin/env python3
"""Independent exact callsite re-scan and five preceding MOV m32,imm32 qualifiers."""
import sys,json,hashlib,struct
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verifier <mk2> <O96E> <O96F>')
b=(Path(sys.argv[1])/'mk2.exe').read_bytes();prev=Path(sys.argv[2]).read_bytes();z=json.loads(Path(sys.argv[3]).read_text());n=0
def ck(s,x):
 global n
 n+=1
 if not x:raise AssertionError(s)
def hash(v):return hashlib.sha256(v).hexdigest()
ck('canonical',hash(b)==z['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('previous',hash(prev)==z['source']['o96eSha256'] and json.loads(prev)['status']=='SUCCESS')
lo,hi=0x61c54,0x61c54+63*4096;ck('code region',z['object1PhysicalRange']==[lo,hi])
exp=[('zeroInitializer',0x81b18,[0x6466f,0x66d76,0x707af,0x707eb,0x86159,0x94c19,0x98a8d]),('indexWriter',0x82321,[0x74d4d,0x758cc,0x771e6,0x77a08,0x77d8b,0x84d32,0x84eee,0x85fae,0x94965])]
observed=[]
for group,(name,target,locations) in zip(z['groups'],exp):
 ck('group label',group['name']==name and group['physical']==target)
 hits=[]
 for p in range(lo,hi-4):
  if b[p]!=0xe8:continue
  dst=p+5+struct.unpack_from('<i',b,p+1)[0]
  if dst!=target:continue
  literal=None
  if name=='indexWriter' and b[p-10:p-4]==bytes.fromhex('c705805a0700'):
   literal={'storeInstructionPhysical':p-10,'sourceGlobal':0x75a80,'value':struct.unpack_from('<I',b,p-4)[0]}
  hits.append({'callPhysical':p,'targetPhysical':dst,'opcodeHex':b[p:p+5].hex(),'adjacentLiteral':literal})
 ck('same entire census',hits==group['calls'])
 ck('expected physical sites',locations==[x['callPhysical'] for x in hits] and group['callCount']==len(locations))
 for h in hits:
  ck('exact rel32',b[h['callPhysical']]==0xe8 and h['targetPhysical']==h['callPhysical']+5+struct.unpack_from('<i',b,h['callPhysical']+1)[0])
  if h['adjacentLiteral']:observed.append(h['adjacentLiteral']['value'])
ck('five immediate inputs',sorted(observed)==[5,6,7,13,30]==z['indexWriterAdjacentLiteralValues'])
flags=z['classification']
for key in ('sevenDirectCodeReferencesToInitializerEstablished','nineDirectCodeReferencesToIndexWriterEstablished','fiveImmediatelyAdjacentScalarInputsEstablished'):ck('positive '+key,flags[key] is True)
for key in ('numericalWriterInputsAutomaticallyBoundToRenderer','allScannedE8OccurrencesProvenExecuted','initializationRuntimeOrderEstablished','stageIdentityOrCorrectPaletteEstablished','mk2ResearchClosed'):ck('negative '+key,flags[key] is False)
print(json.dumps({'pass':'O96F','status':'PASS','checks':n,'failures':0,'initializerCallsites':7,'indexWriterCallsites':9,'provenAdjacentInputValues':sorted(observed)}))

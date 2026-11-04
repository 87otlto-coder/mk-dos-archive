#!/usr/bin/env python3
"""V direct-opcode census hostile controls with a passing unmodified baseline."""
import copy,importlib.util,json,sys
from pathlib import Path
p=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('checkV',p/'verify-mk2-o110v-daczero-writers.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def main():
 if len(sys.argv)!=4:raise SystemExit('usage <fixture-dir> <O110Q-json> <O110V-json>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();q=Path(sys.argv[2]).read_bytes();r=json.loads(Path(sys.argv[3]).read_bytes())
 checks=m.verify(b,q,r)['checks']
 fakes=[('white literal extra',lambda a:a['classification'].__setitem__('literal7fffWrites',3)),
 ('false unique writer',lambda a:a['classification'].__setitem__('indirectOrAliasWriterCompleteness',True)),
 ('runtime color claim',lambda a:a['classification'].__setitem__('visibleDAC0ColorDetermined',True)),
 ('C7 site edited',lambda a:a['typedReferences'][0].__setitem__('opcode','c705')),
 ('fake literal value',lambda a:a['literalAssignments']['zero'].__setitem__(0,0x84e19)),
 ('invalid direct ref',lambda a:a['typedReferences'].append({'operandAt':0x99c0a})),
 ('wrong opcode histogram',lambda a:a['opcodeHistogram'].__setitem__('a3',14)),
 ('fake sample',lambda a:a['typedReferences'][1].__setitem__('nextBytes','deadbeef')),
 ('parent altered',lambda a:a.__setitem__('parentO110QSHA256','00'*32)),
 ('extra read',lambda a:a['classification'].__setitem__('directReadOrTest',7))]
 rejected=[]
 for title,action in fakes:
  cp=copy.deepcopy(r);action(cp)
  try:m.verify(b,q,cp)
  except (AssertionError,KeyError,ValueError,TypeError):rejected.append(title)
  else:raise AssertionError('accepted forged V evidence '+title)
 bb=bytearray(b);bb[0x84e17]^=0x01
 try:m.verify(bytes(bb),q,r)
 except AssertionError:rejected.append('altered source')
 else:raise AssertionError('accepted modified source')
 print(json.dumps({'status':'PASS','baselineChecks':checks,'negativeReportsRejected':len(rejected)}))
if __name__=='__main__':main()

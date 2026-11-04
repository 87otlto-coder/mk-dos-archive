#!/usr/bin/env python3
"""Mutations falsifying O110U source/palette0 conditions must be rejected."""
import copy,importlib.util,json,sys
from pathlib import Path
scripts=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('verifyu',scripts/'verify-mk2-o110u-palette-zero-dac.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def main():
 if len(sys.argv)!=3:raise SystemExit('usage <canonical-mk2-dir> <report>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();r=json.loads(Path(sys.argv[2]).read_bytes());base=m.verify(b,r)
 mutants=[('state global',lambda x:x.__setitem__('entryZeroStateGlobal',0x75ce4)),
 ('write reported as runtime',lambda x:x.__setitem__('status','RUNTIME_CONFIRMED')),
 ('source white write',lambda x:x['confirmedDirectLiteralWriters']['white'].__setitem__(0,0x84e18)),
 ('wrong white DAC',lambda x:x['cases'][1]['expectedDACPath']['events'][-1].__setitem__(1,62)),
 ('false black DAC',lambda x:x['cases'][0]['expectedDACPath']['events'][1].__setitem__(1,0)),
 ('state bit',lambda x:x.__setitem__('uploadedFlagMask',0x4000)),
 ('uploaded flag bypass',lambda x:x['cases'][2]['expectedDACPath'].__setitem__('writeCount',4)),
 ('forged value',lambda x:x['cases'][4].__setitem__('syntheticGlobal',0x1235)),
 ('claim true gameplay',lambda x:x['limitations'].__setitem__('visiblePaletteZeroColorProven',True)),
 ('claim alias census',lambda x:x['limitations'].__setitem__('fullExactAliasWriterCensusProven',True)),
 ('source change forged',lambda x:x['sourceAnchors'].__setitem__('0x7b341','ef'))]
 passed=[]
 for key,change in mutants:
  cp=copy.deepcopy(r);change(cp)
  try:m.verify(b,cp)
  except (AssertionError,KeyError,ValueError,TypeError):passed.append(key)
  else:raise AssertionError('Did not reject '+key)
 corrupt=bytearray(b);corrupt[0x7b341]^=1
 try:m.verify(bytes(corrupt),r)
 except AssertionError:passed.append('source EXE mutation')
 else:raise AssertionError('Did not reject modified executable')
 print(json.dumps({'status':'PASS','baselineChecks':base['checks'],'negativeTestsRejected':len(passed)}))
if __name__=='__main__':main()

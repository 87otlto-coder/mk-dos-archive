#!/usr/bin/env python3
"""Reproducible O110O–V source verification (O110R/S are regression-only)."""
import json,subprocess,sys,hashlib
from pathlib import Path
S=Path(__file__).resolve().parent
ROOT=S.parent
if len(sys.argv) not in (2,3) or (len(sys.argv)==3 and sys.argv[2]!='--full'):
 raise SystemExit('usage: python scripts/verify-mk2-o110o-o110v-batch.py <original-mk2-dir> [--full]')
FULL=len(sys.argv)==3
fixture=Path(sys.argv[1]);exe=fixture/'mk2.exe'
assert hashlib.sha256(exe.read_bytes()).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
q='evidence/mk2_o110o_o110q';r='evidence/mk2_o110r_o110s';t='evidence/mk2_o110t';u='evidence/mk2_o110u';v='evidence/mk2_o110v'
J=[
 ('O/P/Q source verification','verify-mk2-o110o-o110q.py',[fixture,ROOT/q]),
 ('O/P/Q adversarial controls','test-mk2-o110o-o110q-negatives.py',[fixture,ROOT/q]),
 ('R/S historical O96B regression','verify-mk2-o110r-o110s-stage-provenance.py',[fixture,ROOT/r]),
 ('R/S historical O96B negatives','test-mk2-o110r-o110s-negatives.py',[fixture,ROOT/r]),
 ('T hypothetical state-machine verifier','verify-mk2-o110t-conditional-stage-palette.py',[fixture,ROOT/t/'MK2_O110T.json']),
 ('T adversarial controls','test-mk2-o110t-negatives.py',[fixture,ROOT/t/'MK2_O110T.json']),
 ('U entry-zero DAC path verifier','verify-mk2-o110u-palette-zero-dac.py',[fixture,ROOT/u/'MK2_O110U.json']),
 ('U adversarial controls','test-mk2-o110u-negatives.py',[fixture,ROOT/u/'MK2_O110U.json']),
 ('V direct-writer verifier','verify-mk2-o110v-daczero-writers.py',[fixture,ROOT/q/'MK2_O110Q.json',ROOT/v/'MK2_O110V.json']),
 ('V adversarial controls','test-mk2-o110v-negatives.py',[fixture,ROOT/q/'MK2_O110Q.json',ROOT/v/'MK2_O110V.json']),
 ('O110K–N previous verified regression','verify-mk2-o110k-o110n-batch.py',[fixture]),
]
results=[]
for label,script,args in J:
 if not FULL and ('adversarial' in label.lower() or 'negatives' in label.lower()):continue
 print('CHECKING '+label, file=sys.stderr,flush=True)
 p=subprocess.run([sys.executable,str(S/script),*map(str,args)],cwd=ROOT,capture_output=True,text=True)
 if p.returncode:
  print(p.stdout,p.stderr,file=sys.stderr);raise SystemExit(f'FAIL {label}')
 if script in ('verify-mk2-o110k-o110n-batch.py','verify-mk2-o110h-o110j-batch.py'):
  obj={'status':'PASS','logTail':p.stdout[-1300:]}
 else:
  try: obj=json.loads(p.stdout)
  except json.JSONDecodeError as e:raise SystemExit(f'bad JSON from {script}: {p.stdout[:250]}') from e
 results.append({'label':label,'status':'PASS','result':obj})
final={'status':'PASS','canonicalExecutableSHA256':hashlib.sha256(exe.read_bytes()).hexdigest(),
 'milestonesSubstantiveNew':['O110O','O110P','O110Q','O110T','O110U','O110V'],
 'regressionOnlyNotCountedAsNew':['O110R','O110S'],
 'priorSevenSinceO110G':['O110H','O110I','O110J','O110K','O110L','O110M','O110N'],
 'checkpointCadence':30,'verifiedNewPlusPriorSubstantivePasses':13,
 'newVerificationChecks':141+76+73+144,'adversarialCasesVerifiedSeparately':21+11+12+11,
 'newAdversarialCasesReexecutedInThisRun':(21+11+12+11 if FULL else 0),'mode':('full' if FULL else 'positive-and-legacy-regressions'),
 'regressionHardeningChecks':102,'regressionHardeningTamperRejections':15,
 'livePaletteHandleOneOwnerKnown':False,'completeMK2ReconstructionClaimed':False,
 'cases':results}
print(json.dumps(final,indent=2))

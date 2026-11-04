#!/usr/bin/env python3
"""Adversarial controls for synthetic-only O110T evidence."""
import copy,importlib.util,json,sys
from pathlib import Path
p=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('vt',p/'verify-mk2-o110t-conditional-stage-palette.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

def main():
 if len(sys.argv)!=3:raise SystemExit('usage <mk2-dir> <report>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();r=json.loads(Path(sys.argv[2]).read_text())
 result=m.verify(b,r);cases=[
 ('faked runtime authority',lambda x:x.__setitem__('status','RUNTIME_VERIFIED')),
 ('slot ownership guessed',lambda x:x['conclusion'].__setitem__('stagePaletteOwnerProven',True)),
 ('fake color image',lambda x:x['conclusion'].__setitem__('stageColorImageProven',True)),
 ('alternative history misclassified',lambda x:x['cases'][1]['hypotheticalOutput'].__setitem__('paletteRecord','B')),
 ('bank shifted wrong',lambda x:x['cases'][1]['hypotheticalOutput'].__setitem__('bankBase',49)),
 ('empty slot invented',lambda x:x['cases'][2]['hypotheticalOutput'].__setitem__('paletteRecord','A')),
 ('gate wrong',lambda x:x['cases'][3]['hypotheticalOutput'].__setitem__('renderStatus','DRAW_PATH_ENABLED')),
 ('unmodeled event silently accepted',lambda x:x['cases'][6]['hypotheticalOutput'].__setitem__('renderStatus','DRAW_PATH_ENABLED')),
 ('history forged',lambda x:x['cases'][0]['events'].__setitem__(1,['REQUEST','B'])),
 ('source record hash swapped',lambda x:x['originalSourceRecords']['A'].__setitem__('recordSHA256','00'*32))]
 rejects=[]
 for name,mut in cases:
  copy_r=copy.deepcopy(r);mut(copy_r)
  try:m.verify(b,copy_r)
  except (AssertionError,KeyError,TypeError,ValueError):rejects.append(name)
  else:raise AssertionError('Accepted falsification '+name)
 copy_b=bytearray(b);copy_b[0x9e18b]=0x90
 try:m.verify(bytes(copy_b),r)
 except AssertionError:rejects.append('modified executable')
 else:raise AssertionError('Accepted corrupted exe')
 print(json.dumps({'status':'PASS','positiveChecks':result['checks'],'tamperRejected':len(rejects)}))
if __name__=='__main__':main()

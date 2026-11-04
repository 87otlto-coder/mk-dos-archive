#!/usr/bin/env python3
"""Hostile falsification for O110R/S independent source assertions."""
import copy,importlib.util,json,sys
from pathlib import Path
SCRIPTS=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('verify_rs',SCRIPTS/'verify-mk2-o110r-o110s-stage-provenance.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

def main():
 if len(sys.argv)!=3:raise SystemExit('usage <original-mk2-dir> <evidence-dir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();p=Path(sys.argv[2]);rb=(p/'MK2_O110R.json').read_bytes()
 r=json.loads(rb);s=json.loads((p/'MK2_O110S.json').read_bytes());base=mod.verify(b,r,s,rb)
 cases=[('R copy location',0,lambda x:x['transitions'].__setitem__('copyIntoRenderSelectorPhysical',0x82327)),
 ('R table mode 2',0,lambda x:x['transitions'].__setitem__('tableBaseIfMode2',0x15ce4)),
 ('R source identity',0,lambda x:x.__setitem__('mutableNextSelectorGlobal',0x7747f)),
 ('R direct ref inflation',0,lambda x:x['exactDirectSelectorOccurrences'].append(0x99c0a)),
 ('R alias overclaim',0,lambda x:x['qualifications'].__setitem__('directOccurrenceCensusIsNotAliasCompleteness',False)),
 ('R runtime false proof',0,lambda x:x['qualifications'].__setitem__('runtimeChosenVariantKnown',True)),
 ('R bytes',0,lambda x:x['locations']['advanceStore'].__setitem__('hex','a3805a0701')),
 ('S parent link',1,lambda x:x.__setitem__('parentO110RSourceSelectorSHA256','00'*32)),
 ('S source pointer skip',1,lambda x:x['walker'].__setitem__('onSpecialReadsPointerThenDereferences',False)),
 ('S sentinel wrong sign',1,lambda x:x['walker'].__setitem__('stageSentinelUnsigned',0xfffffffe)),
 ('S false runtime rowcount',1,lambda x:x['qualifications'].__setitem__('runtimeStageRowCounts',True)),
 ('S fake destination',1,lambda x:x['calls'][0].__setitem__('destination',0x9e119)),
 ('S missing branch',1,lambda x:x['branches'].pop()),
 ('S fake palette handle',1,lambda x:x['renderer'].__setitem__('paletteHandleOneLiteralAt',0x9e190))]
 rejects=[]
 for title,idx,mutate in cases:
  cp=[copy.deepcopy(r),copy.deepcopy(s)];mutate(cp[idx])
  try:mod.verify(b,cp[0],cp[1],rb)
  except (AssertionError,KeyError,TypeError,ValueError):rejects.append(title)
  else:raise AssertionError('Accepted forged report '+title)
 b1=bytearray(b);b1[0x82326]^=0x01
 try:mod.verify(bytes(b1),r,s,rb)
 except AssertionError:rejects.append('tampered exe')
 else:raise AssertionError('accepted altered canonical exe')
 print(json.dumps({'status':'PASS','baselineChecks':base['checks'],'adversarialCases':len(cases)+1,'rejected':len(rejects)}))
if __name__=='__main__':main()

#!/usr/bin/env python3
"""Adversarial O110K-N evidence assertions; authentic baseline must pass first.

Never count a missing file, import failure, or wrong CLI invocation as a rejection.
"""
import copy,hashlib,importlib.util,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def load(name):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/('verify-mk2-'+name+'.py'))
 mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod

def main():
 if len(sys.argv)!=2:raise SystemExit('usage <original-mk2-dir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes()
 def data(p):return (ROOT/p).read_bytes()
 parent_h=data('evidence/mk2_o110h/MK2_O110H_PALETTE_HANDLE_LIFECYCLE.json')
 parent_l=data('evidence/mk2_o110l/MK2_O110L_RENDER_GATE_CENSUS.json')
 specs=[
 ('o110k-reset-seed-invalidation','evidence/mk2_o110k/MK2_O110K_RESET_SEED_INVALIDATION.json',
  (parent_h,),[
   lambda r:r['calls'][0].__setitem__('target',0x64659),
   lambda r:r['calls'][5].__setitem__('at',0x66d56),
   lambda r:r['witnesses'][2].__setitem__('hex','b8c46c0200'),
   lambda r:r['conditionalConclusion'].__setitem__('initialSeedGuaranteedLiveAtIndex6SecondRequest',True),
   lambda r:r.__setitem__('parentO110HSHA256','00'*32)]),
 ('o110l-render-gate-census','evidence/mk2_o110l/MK2_O110L_RENDER_GATE_CENSUS.json',
  (parent_h,),[
   lambda r:r['operandPhysicalOccurrences'].__setitem__(0,0x67053),
   lambda r:r['occurrences'][6].__setitem__('instructionBytes','c705d462050001000000'),
   lambda r:r['classifiedCounts'].__setitem__('setZero',2),
   lambda r:r['claims'].__setitem__('paletteSlotOneOwnershipDetermined',True),
   lambda r:r['stageConsumer'].__setitem__('skipTarget',0x9e196)]),
 ('o110m-palette-queue-render-cycle','evidence/mk2_o110m/MK2_O110M_PALETTE_QUEUE_RENDER_CYCLE.json',
  (parent_h,parent_l),[
   lambda r:r['operandPhysicalOccurrences'].__setitem__(0,0x6708d),
   lambda r:r['flagDirectAccesses'][3].__setitem__('kind','set1'),
   lambda r:r['boundedCalls'][1].__setitem__('target',0x93390),
   lambda r:r['boundedBranches'][0].__setitem__('target',0x670c7),
   lambda r:r['classification'].__setitem__('stagePaletteSlotOneOwnerKnown',True)]),
 ('o110n-palette-bank-consumer-census','evidence/mk2_o110n/MK2_O110N_PALETTE_BANK_CONSUMERS.json',
  (parent_h,),[
   lambda r:r['exactDirectOperandPositions'].__setitem__(4,0x659ee),
   lambda r:r['sites'][2].__setitem__('kind','write'),
   lambda r:r['counts'].__setitem__('writeSites',3),
   lambda r:r['alternateSpriteBlitter'].__setitem__('modeMask',4),
   lambda r:r['conclusions'].__setitem__('stageRGBOrPaletteOwnershipProven',True)])]
 totalchecks=0;rejected=0;details=[]
 for slug,path,parents,mutations in specs:
  module=load(slug)
  authentic=json.loads(data(path))
  count=module.verify(b,*parents,authentic)
  totalchecks+=count
  for index,mutate in enumerate(mutations,1):
   evil=copy.deepcopy(authentic);mutate(evil)
   assert evil!=authentic,(slug,index,'mutation failed')
   try:module.verify(b,*parents,evil)
   except AssertionError:
    rejected+=1
   else:raise AssertionError((slug,index,'forgery ACCEPTED'))
  corrupted=bytearray(b);corrupted[0x9e118]^=0x01
  try:module.verify(bytes(corrupted),*parents,authentic)
  except AssertionError:rejected+=1
  else:raise AssertionError((slug,'source alteration ACCEPTED'))
  details.append({'pass':slug,'positiveChecks':count,'rejectedNegativeControls':len(mutations)+1})
 assert rejected==24
 print(json.dumps({'status':'PASS','baselineChecks':totalchecks,'falsifiedReportsAndSourceBytesRejected':rejected,'results':details},indent=2))
if __name__=='__main__':main()

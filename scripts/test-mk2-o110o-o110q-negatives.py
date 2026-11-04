#!/usr/bin/env python3
"""Independent adversarial controls for O110O/P/Q: each falsification must fail a passing baseline."""
import copy,importlib.util,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('mk2qverify',ROOT/'verify-mk2-o110o-o110q.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)

def main():
 if len(sys.argv)!=3:raise SystemExit('usage: negative-tests <original-fixture> <reports-dir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();folder=Path(sys.argv[2]);o_bytes=(folder/'MK2_O110O.json').read_bytes()
 reports=[json.loads((folder/f'MK2_O110{x}.json').read_text()) for x in 'OPQ']
 baseline=mod.verify(b,*reports,o_bytes);assert baseline['checks']>=130
 actions=[
 ('O ring stride',0,lambda x:x['ring'].__setitem__('recordWidth',12)),
 ('O capacity',0,lambda x:x['ring'].__setitem__('safePendingWithoutFatal',32)),
 ('O overflow claim',0,lambda x:x['ring'].__setitem__('overflowRejected',False)),
 ('O port',0,lambda x:x['dac6'].__setitem__('portData',0x3c8)),
 ('O event stream',0,lambda x:x['dac6'].__setitem__('eventStreamSHA256','00'*32)),
 ('O colour count',0,lambda x:x['fixtureRecords'][0].__setitem__('count',47)),
 ('O shade',0,lambda x:x['dac6'].__setitem__('firstTriplet',[0,0,0])),
 ('O runtime false proof',0,lambda x:x.__setitem__('runtimePaletteHandleOneDetermined',True)),
 ('P parent link',1,lambda x:x.__setitem__('parentO110OReportSHA256','00'*32)),
 ('P no-copy',1,lambda x:x['scenario'].__setitem__('thirdRecordIsSyntheticDistinctPointer',False)),
 ('P handle',1,lambda x:x['scenario'].__setitem__('returnedSlots',[0,1,1,1])),
 ('P wrong bank',1,lambda x:x['scenario'].__setitem__('secondRecordBankMove',[49,64])),
 ('P refs',1,lambda x:x['scenario']['after'][1].__setitem__('refs',1)),
 ('P missing shift queue',1,lambda x:x['scenario'].__setitem__('queuedBankStarts',[1,49,1])),
 ('P gate',1,lambda x:x['scenario'].__setitem__('drawGate',1)),
 ('Q false ref',2,lambda x:x['categorizedDirectRefs'].append({'at':0x99c0a,'access':'read','before4':'bad'})),
 ('Q count',2,lambda x:x['counts'].__setitem__('write',24)),
 ('Q wrong CALL',2,lambda x:x['falsePositive'].__setitem__('isCallTo',0x9a36c)),
 ('Q position',2,lambda x:x['allRawFourByteOccurrences'].__setitem__(0,0x64d8d)),
 ('Q undocumented runtime claim',2,lambda x:x.__setitem__('livePaletteZeroColorKnown',True)),
 ]
 rejected=[]
 for label,idx,mutate in actions:
  trial=copy.deepcopy(reports);mutate(trial[idx])
  try:mod.verify(b,*trial,o_bytes)
  except (AssertionError,KeyError,TypeError,ValueError):rejected.append(label)
  else:raise AssertionError('FORGED REPORT WAS ACCEPTED: '+label)
 tampered=bytearray(b);tampered[0x7b2d9]^=1
 try:mod.verify(bytes(tampered),*reports,o_bytes)
 except AssertionError:rejected.append('mutated source executable')
 else:raise AssertionError('modified original exe incorrectly passed')
 assert len(rejected)==len(actions)+1
 print(json.dumps({'status':'PASS','baselineChecks':baseline['checks'],'falsificationsRejected':len(rejected),'names':rejected}))
if __name__=='__main__':main()

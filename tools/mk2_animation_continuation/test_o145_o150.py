#!/usr/bin/env python3
"""Regression and forged-report tests for the original O145-O150 continuations."""
import argparse, copy, json, pathlib, sys, unittest
from trace_o145_o148_render_dispatch import produce as p145
from trace_o149_o150_vga_present import produce as p149
from verify_o145_o150_independent import check as independent
ORIGINAL=None
REPORTS=None
PASSES=['O145','O146','O147','O148','O149','O150']
class SourceTests(unittest.TestCase):
 def test_source_identity(self):
  self.assertEqual(len(ORIGINAL),861133)
 def test_both_sources_validate(self):
  self.assertEqual(len(p145(ORIGINAL)),4)
  self.assertEqual(len(p149(ORIGINAL)),2)
 def test_all_independently_verified(self):
  self.assertEqual(set(independent(ORIGINAL,REPORTS)),set(PASSES))
 def test_false_source_version(self):
  wrong=bytearray(ORIGINAL); wrong[0]^=1
  for producer in (p145,p149):
   with self.assertRaisesRegex(ValueError,'[Cc]anonical|[Oo]riginal'):producer(bytes(wrong))
 def test_false_source_identity_independent(self):
  wrong=bytearray(ORIGINAL);wrong[0x935a3]^=1
  with self.assertRaisesRegex(ValueError,'original'):independent(bytes(wrong),REPORTS)
 def test_reports_have_all_source_witnesses(self):
  for p in PASSES:
   r=REPORTS[p]; witnesses=r.get('codeEvidence',r.get('instructionWitnesses'))
   self.assertTrue(len(witnesses)>10)
 def test_false_report_runtime_fps(self):
  for p in PASSES:
   with self.subTest(p=p):
    r=copy.deepcopy(REPORTS); key='validatedPath' if 'validatedPath' in r[p] else 'sourceFacts';r[p][key].append('runtime-verified 60 fps')
    with self.assertRaises(ValueError):independent(ORIGINAL,r)
 def test_false_report_source_digest(self):
  for p in PASSES:
   with self.subTest(p=p):
    r=copy.deepcopy(REPORTS)
    key='originalEXESHA256' if 'originalEXESHA256' in r[p] else 'canonicalSHA256';r[p][key]='0'*64
    with self.assertRaises(ValueError):independent(ORIGINAL,r)
 def test_false_report_schema(self):
  for p in PASSES:
   with self.subTest(p=p):
    r=copy.deepcopy(REPORTS);r[p]['schema']='mk2_fake'
    with self.assertRaises(ValueError):independent(ORIGINAL,r)
 def test_false_report_witness(self):
  for p in PASSES:
   with self.subTest(p=p):
    r=copy.deepcopy(REPORTS)
    key='codeEvidence' if 'codeEvidence' in r[p] else 'instructionWitnesses';v=r[p][key][0]
    word='originalBytes' if 'originalBytes' in v else 'bytes';v[word]='00'
    with self.assertRaises(ValueError):independent(ORIGINAL,r)
 def test_false_report_deleted_witness(self):
  for p in PASSES:
   with self.subTest(p=p):
    r=copy.deepcopy(REPORTS);key='codeEvidence' if 'codeEvidence' in r[p] else 'instructionWitnesses';r[p][key].pop()
    with self.assertRaises(ValueError):independent(ORIGINAL,r)
 def test_false_report_claims(self):
  for p in PASSES:
   with self.subTest(p=p):
    r=copy.deepcopy(REPORTS);k='limits' if 'limits' in r[p] else 'limitations';first=next(iter(r[p][k]));r[p][k][first]=not r[p][k][first]
    with self.assertRaises(ValueError):independent(ORIGINAL,r)
 def test_false_report_call(self):
  for p in ['O145','O147','O149','O150']:
   with self.subTest(p=p):
    r=copy.deepcopy(REPORTS);key='directRelativeCalls' if 'directRelativeCalls' in r[p] else 'callTargets';r[p][key][0]['target']='0x00001'
    with self.assertRaises(ValueError):independent(ORIGINAL,r)
 def test_independent_wrong_report_cardinality(self):
  r=copy.deepcopy(REPORTS);del r['O147'];
  with self.assertRaises(ValueError):independent(ORIGINAL,r)

def main():
 global ORIGINAL,REPORTS
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);a=ap.parse_args()
 ORIGINAL=pathlib.Path(a.exe).read_bytes();REPORTS={**p145(ORIGINAL),**p149(ORIGINAL)}
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(SourceTests))
 if not result.wasSuccessful():sys.exit(1)
 print('PASS 14 test families; hostile subcases:',6*6+4)
if __name__=='__main__':main()

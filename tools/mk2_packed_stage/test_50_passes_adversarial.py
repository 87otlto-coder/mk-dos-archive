#!/usr/bin/env python3
"""Alter evidence in independent ways; source verifier must refuse each forgery."""
from __future__ import annotations
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile
from verify_50_passes import verify, S

ROOT=Path(__file__).parents[2]
VERIFIER=Path(__file__).with_name('verify_50_passes.py')
ORIG=ROOT/'research_outputs'/'MK2_O111_50_PASSES.json'
FIXTURE=Path('/mnt/data/mk2.zip')

class NegativeControls(unittest.TestCase):
 def test_eight_independent_forged_evidence_rejected(self):
  original=json.loads(ORIG.read_text())
  cases=[
   ('wrong source hash',lambda x: x['passes'][0]['observed'].__setitem__('sourceSha256','0'*64)),
   ('native slot forged',lambda x: x['passes'][1]['observed'].__setitem__('nativeSlot',99)),
   ('row uniqueness forged',lambda x: x['passes'][7]['observed'].__setitem__('distinctCompleteRows',1)),
   ('side bytes forged',lambda x: x['passes'][14]['observed'].__setitem__('sideLength',0)),
   ('paletted carry falsified',lambda x: x['passes'][22]['observed'].__setitem__('byteMismatchCountVsNaive',0)),
   ('edited byte location forged',lambda x: x['passes'][28]['observed'].__setitem__('fileOffset',0)),
   ('restore hash forged',lambda x: x['passes'][35]['observed'].__setitem__('fullyRestoredSha256','f'*64)),
   ('corruption rejection forged',lambda x: x['passes'][42]['observed'].__setitem__('rejectedControls',99)),
   ('whole corpus size forged',lambda x: x['passes'][49]['observed'].__setitem__('authenticTotalSuffixBytes',64000)),
  ]
  with zipfile.ZipFile(FIXTURE) as z:
   cached=(z.read('mk2/mk2.exe'),{name:z.read('mk2/'+name) for name,*_ in S})
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'fake.json'
   for name,change in cases:
    doc=copy.deepcopy(original);change(doc);p.write_text(json.dumps(doc))
    with self.subTest(name=name),self.assertRaises(AssertionError):
     verify(FIXTURE,p,fixture_contents=cached)
   self.assertEqual(verify(FIXTURE,ORIG,fixture_contents=cached)['passesIndependentlyChecked'],50)

if __name__=='__main__':unittest.main(verbosity=2)

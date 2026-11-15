"""Original-free emulator controls plus optional original/report mutation tests."""
import argparse,copy,json,struct,sys,unittest
from pathlib import Path
from verify_root_layout import replay,verify
from root_layout import analyze

class OriginalFree(unittest.TestCase):
    def test_sentinel_and_pair_are_different_writes(self):
        # EAX starts at root+1c; EBX becomes destination. After that, store
        # address of pair vs explicit one using distinct x86 instructions.
        data=bytearray(128);struct.pack_into('<I',data,28,80)
        code=bytes.fromhex('8b1883c004890383c304528b1089135a')
        struct.pack_into('<I',data,32,1)
        memory,trace,registers,centers=replay(code,data,0,start=0,stop=len(code))
        self.assertEqual(memory,{80:32,84:1});self.assertEqual(centers,[])
    def test_unknown_opcode_refused(self):
        with self.assertRaisesRegex(ValueError,'unsupported opcode'):replay(b'\x90'*8,b'\0'*128,0,start=0,stop=8)
    def test_uninitialized_read_refused(self):
        with self.assertRaisesRegex(ValueError,'uninitialized'):replay(b'\x8b\x18',b'',0,start=0,stop=2)
    def test_budget_refuses_cycle(self):
        with self.assertRaisesRegex(ValueError,'budget'):replay(b'\xeb\xfe',b'\0'*128,0,start=0,stop=2,budget=10)
    def test_stack_underflow_refused(self):
        with self.assertRaisesRegex(ValueError,'empty stack'):replay(b'\x5a',b'\0'*128,0,start=0,stop=1)
    def test_stack_imbalance_refused(self):
        with self.assertRaisesRegex(ValueError,'imbalance'):replay(b'\x52',b'\0'*128,0,start=0,stop=1)
    def test_candidate_rejects_noncanonical(self):
        with self.assertRaisesRegex(ValueError,'canonical'):analyze(b'not MK2',ROOT)

class OriginalControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.exe=EXE.read_bytes();cls.report=analyze(cls.exe,ROOT)
    def test_original_independent(self):self.assertEqual(verify(self.exe,self.report)['stageModeCases'],9)
    def test_report_mutants(self):
        mutations=[lambda r:r.update(runtimeObserved=True),lambda r:r.update(completeStageReconstruction=True),
          lambda r:r.update(cameraPositionsObserved=2),lambda r:r.update(nativePaletteAllocationVerified=True),
          lambda r:r.update(nativeAnimationTimingVerified=True),
          lambda r:r['records'][0].update(endExclusiveObject2=r['records'][0]['endExclusiveObject2']+4),
          lambda r:r['records'][0]['setupBindings'][0].update(originSignedXY=[1,-52]),
          lambda r:r['records'][0]['setupBindings'][0].update(slotObject2=0x77457),
          lambda r:r['records'][0]['setupBindings'][0].update(objectListHeadObject2=0x84344),
          lambda r:r['records'][0]['setupBindings'][0].update(initialHorizontalInteger=288),
          lambda r:r['records'][0]['centerOverrides'][0].update(setupObject2=0x1736a),
          lambda r:r['records'][0]['drawCommands'].reverse(),
          lambda r:r['records'].append(copy.deepcopy(r['records'][0]))]
        for n,change in enumerate(mutations):
          with self.subTest(mutation=n):
            bad=copy.deepcopy(self.report);change(bad)
            with self.assertRaises(ValueError):verify(self.exe,bad)
    def test_source_mutation_refused(self):
        b=bytearray(self.exe);b[0x81f9c]^=1
        with self.assertRaises(ValueError):analyze(bytes(b),ROOT)

ROOT=Path(__file__).resolve().parents[3]
EXE=None
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',type=Path);p.add_argument('--source-root',type=Path,default=ROOT);a=p.parse_args()
    ROOT=a.source_root;EXE=a.exe
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(OriginalFree)
    if EXE:suite.addTests(unittest.defaultTestLoader.loadTestsFromTestCase(OriginalControls))
    result=unittest.TextTestRunner(verbosity=2).run(suite);sys.exit(not result.wasSuccessful())


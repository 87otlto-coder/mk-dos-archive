#!/usr/bin/env python3
"""Original-file regression/negative tests; no game assets are written."""
import argparse,copy,json,subprocess,sys,tempfile,unittest
from pathlib import Path
import spelunk_001_channel_bridge as m

PARSER=argparse.ArgumentParser();PARSER.add_argument('original',type=Path)
ARGS=PARSER.parse_args()

class SourceAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.b=m.load_original(ARGS.original)
        cls.fx=m.fixups(cls.b)
        cls.report=m.audit(cls.b,fx_override=cls.fx)

    def error(self,b,why,fx=None):
        with self.assertRaisesRegex(ValueError,why):
            m.audit(bytes(b),check_hash=False,fx_override=self.fx if fx is None else fx)

    def test_original_exact(self):
        d=self.report
        self.assertEqual((d['activeChannels'],d['typedFixupEntries'],d['uniqueFixupSites']),(8,27004,26994))
        self.assertEqual(d['sourceInstructionAnchors'],19)
        self.assertEqual(len(d['stageScriptBridges']),5)
        self.assertTrue(all(x is False for x in d['runtimeEvidence'].values()))

    def test_eight_row_arithmetic(self):
        rows=self.report['channels']
        for i,r in enumerate(rows):
            self.assertEqual(r['sourceStateObject2'],0x767cf+0x190*i)
            self.assertEqual(r['verticalStateObject2'],0x842e8)
            self.assertEqual(r['horizontalStateObject2'],0x8432c-4*i)
            self.assertEqual(r['activeSetupSelectorObject2'],0x77453+4*i)

    def test_common_channel_link(self):
        links=self.report['stageScriptBridges']
        self.assertEqual(set(l['selectedChannelObject2'] for l in links),{0x77453})
        self.assertEqual(sorted(l['countedWords'] for l in links),[79,79,80,80,80])
        self.assertEqual({l['family']:l['resourceFromPriorO121'] for l in links},
                         {'tomb80_a':'TOMB.GRA','tomb80_b':'TOMB.GRA','portal80':'PORTAL.GRA',
                          'images79_a':'IMAGES.GRA','images79_b':'IMAGES.GRA'})

    def test_channel0_inbound_concentration(self):
        self.assertEqual([r['typedIncomingCount'] for r in self.report['incomingSelectorReferences']],
                         [48,2,4,3,3,3,3,3])
        self.assertEqual(self.report['incomingSelectorReferences'][0]['incomingDataCount'],47)

    def test_guard_source_before_file_sha(self):
        tampered=bytearray(self.b);tampered[0x81c53]^=1
        with self.assertRaisesRegex(ValueError,'canonical EXE SHA256'):
            m.audit(tampered)

    def test_opcode_change_refused_independent_of_whole_sha(self):
        tampered=bytearray(self.b);tampered[0x81c53]^=1
        self.error(tampered,'source opcode mismatch 0x81c53')

    def test_channel_pointer_mutation_refused(self):
        tampered=bytearray(self.b);tampered[m.O2+m.ROOT+12]^=1
        self.error(tampered,'raw source pointer disagrees')

    def test_channel_row_7_mutation_refused(self):
        tampered=bytearray(self.b);tampered[m.O2+m.ROOT+7*16+8]^=1
        self.error(tampered,'raw source pointer disagrees')

    def test_channel_terminator_mutation_refused(self):
        tampered=bytearray(self.b);tampered[m.O2+m.ROOT+128]^=1
        self.error(tampered,'ninth row zero')

    def test_tomb_script_pointer_mutation_refused(self):
        tampered=bytearray(self.b);tampered[m.O2+0x17210]^=1
        self.error(tampered,'raw source pointer disagrees')

    def test_images_79_script_mutation_refused(self):
        tampered=bytearray(self.b);tampered[m.O2+0x2e7cc]^=1
        self.error(tampered,'raw source pointer disagrees')

    def test_palette_slot2_relocation_mutation_refused(self):
        # Swap the typed destination independently of the unchanged raw source.
        fx=dict(self.fx);fx[(2,0x177d0+8)]=(7,16,1,0x1234)
        self.error(self.b,'wrong typed LE relocation',fx=fx)

    def test_palette_wordcount_mutation_refused(self):
        tampered=bytearray(self.b);tampered[0x891e0]^=1
        self.error(tampered,'counted palette record differs')

    def test_source_does_not_infer_live_dac(self):
        self.assertFalse(any(self.report['runtimeEvidence'].values()))
        self.assertEqual(self.report['classification'],'VERIFIED_STATIC_CONDITIONAL')

    def test_repeat_produces_identical_report(self):
        again=m.audit(self.b,fx_override=self.fx)
        self.assertEqual(json.dumps(again,sort_keys=True),json.dumps(self.report,sort_keys=True))

    def test_cli_refuses_existing_output(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'metadata.json';out.write_text('preserve')
            p=subprocess.run([sys.executable,str(Path(m.__file__).resolve()),str(ARGS.original),
                              '--out',str(out)],capture_output=True,text=True)
            self.assertNotEqual(p.returncode,0)
            self.assertIn('refuse output overwrite',p.stderr)
            self.assertEqual(out.read_text(),'preserve')

if __name__=='__main__':unittest.main(argv=[sys.argv[0]],verbosity=2)

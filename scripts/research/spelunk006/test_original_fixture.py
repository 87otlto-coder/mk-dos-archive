#!/usr/bin/env python3
"""Spelunk006 private fixture regressions; original game files are read only.

Run only with the owner's exact original mk2.zip; NOT in public CI. Negative
controls edit private in-memory copies and deliberately bypass only the
whole-file SHA guard to test deeper provenance and RLE validation paths.
"""
import argparse, json, subprocess, sys, tempfile, unittest
from pathlib import Path
import trace_suck_nested_sources as a

p=argparse.ArgumentParser()
p.add_argument('--game-zip',required=True,type=Path)
options=p.parse_args()

class OriginalSUCK(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.exe,cls.gra=a.original_zip(options.game_zip)
        cls.report=a.audit(cls.exe,cls.gra)
        cls.fx=a.relocations(cls.exe)

    def negative_exe(self,offset,pattern,msg):
        b=bytearray(self.exe);b[offset:offset+len(pattern)]=pattern
        with self.assertRaisesRegex(ValueError,msg):
            a.audit(bytes(b),self.gra,strict_identity=False)

    def test_exact_originals(self):
        a.check_identity(self.exe,self.gra)
        self.assertEqual((len(self.exe),len(self.gra)),(861133,122000))

    def test_nested_group_census(self):
        r=self.report
        self.assertEqual((r['selectorSlotCount'],r['distinctSourceGroups'],r['prefixDistinctDescriptors']), (12,9,65))
        self.assertEqual([x['entryCount'] for x in r['nestedSourceGroups']],[7,7,7,7,8,7,8,8,6])

    def test_aliases_deliberate_not_duplicate_sprites(self):
        slots=[s['sourceGroupObject2'] for s in self.report['selectorSlots']]
        self.assertEqual(slots,list(a.ROOTS))
        self.assertEqual(slots[4],slots[5])
        self.assertEqual(slots[8],slots[9])
        self.assertEqual(slots[9],slots[10])
        self.assertEqual(len(set(slots)),9)

    def test_record_indirection_and_zero_terminal(self):
        for family in self.report['nestedSourceGroups']:
            for rec in family['records']:
                self.assertEqual(a.u32(self.exe,a.O2+rec['commandRecordObject2']+4),0)
                self.assertEqual(a.u32(self.exe,a.O2+rec['commandRecordObject2']),rec['descriptorObject2'])
            self.assertEqual(a.u32(self.exe,a.O2+family['zeroTerminatorObject2']),0)

    def test_original_source_bytes_fully_partition(self):
        r=self.report
        self.assertTrue(r['allOriginalEncodedStreamBytesCovered'])
        self.assertEqual((r['prefixSourceBytes'],r['suffixSourceBytes'],r['wholeOriginalResourceSpriteCount']),(117872,4128,83))
        intervals=sorted((f['streamStart'],f['streamEndExclusive']) for f in r['descriptors'])
        self.assertEqual((intervals[0][0],intervals[-1][-1]),(0,122000))
        self.assertTrue(all(x[1]==y[0] for x,y in zip(intervals,intervals[1:])))

    def test_source_code_selector_and_separate_interpreter(self):
        c=self.report['codeProvenance']
        self.assertEqual((c['selectorLoadPhysical'],c['indexHelperPhysical'],c['selectionStorePhysical']), (0x846ca,0x64ed2,0x846d4))
        self.assertEqual(c['indexSourceObjectField'],0x46)
        self.assertEqual(c['schedulerWaitJumpPhysical'],0x846e8)
        self.assertTrue(c['directSelectedGroupToInterpreterCallProven'])

    def test_direct_interpreter_call_opcode_and_target(self):
        self.assertEqual(self.exe[0x8682d:0x86832].hex(),'e847d6fdff')
        self.assertEqual(0x86832+__import__('struct').unpack_from('<i',self.exe,0x8682e)[0],0x63e79)

    def test_suffix_links_preserved(self):
        r=self.report
        self.assertEqual([t['orderedEntries'] for t in r['priorSpelunk005SourceLists']],[5,5,8])
        self.assertEqual([t['endMarker'] for t in r['priorSpelunk005SourceLists']],[0,0,1])

    def test_no_runtime_promotion(self):
        self.assertTrue(all(v is False for v in self.report['confidenceLimits'].values()))

    def test_original_mutation_refused_at_identity(self):
        b=bytearray(self.exe);b[0x846ca]^=1
        with self.assertRaisesRegex(ValueError,'canonical original EXE'):
            a.audit(bytes(b),self.gra)

    def test_selector_code_mutation_refused_without_sha(self):
        self.negative_exe(0x846ca,b'\x90','code opcode')

    def test_selector_typed_pointer_refused_without_sha(self):
        self.negative_exe(a.O2+a.SELECTOR,b'\xff','raw relocated pointer')

    def test_mid_list_pointer_refused_without_sha(self):
        self.negative_exe(a.O2+0x1be50,b'\xff','typed pointer')

    def test_command_record_zero_refused_without_sha(self):
        self.negative_exe(a.O2+0x1be70+4,b'\x01','nested sprite command second DWORD')

    def test_group_terminator_refused_without_sha(self):
        self.negative_exe(a.O2+0x1be6c,b'\x01','source group has no unrelocated zero')

    def test_original_sprite_resource_id_refused_without_sha(self):
        self.negative_exe(a.O2+0x21434+11,b'\x00','sprite resource ID not SUCK')

    def test_suffix_terminator_refused_without_sha(self):
        self.negative_exe(a.O2+0x1bf00+5*4,b'\x01','suffix list terminator')

    def test_edited_rle_refused_when_deliberately_bypassing_digest(self):
        b=bytearray(self.gra);b[:4]=b'\x00'*4
        with self.assertRaisesRegex(ValueError,'RLE literal invalid'):
            a.audit(self.exe,bytes(b),strict_identity=False)

    def test_resource_mutation_caught_at_identity(self):
        b=bytearray(self.gra);b[-1]^=1
        with self.assertRaisesRegex(ValueError,'canonical SUCK.GRA'):
            a.audit(self.exe,bytes(b))

    def test_repeat_has_stable_metadata(self):
        self.assertEqual(json.dumps(self.report,sort_keys=True),
                         json.dumps(a.audit(self.exe,self.gra),sort_keys=True))

    def test_no_existing_report_overwrite(self):
        with tempfile.TemporaryDirectory() as t:
            target=Path(t)/'evidence.json';target.write_text('PRESERVE',encoding='utf-8')
            cmd=[sys.executable,str(Path(a.__file__).resolve()),
                 '--game-zip',str(options.game_zip),'--out',str(target)]
            q=subprocess.run(cmd,capture_output=True,text=True)
            self.assertNotEqual(q.returncode,0)
            self.assertIn('refusing to overwrite evidence',q.stderr)
            self.assertEqual(target.read_text(encoding='utf-8'),'PRESERVE')

if __name__=='__main__':
    unittest.main(argv=[sys.argv[0]],verbosity=2)

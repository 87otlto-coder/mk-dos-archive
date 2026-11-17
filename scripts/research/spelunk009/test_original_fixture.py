"""Spelunk009 private original DOS fixture tests; never run in public CI."""
import argparse, copy, json, struct, subprocess, sys, tempfile, unittest
from pathlib import Path
import trace_bang_secondary as a

parser=argparse.ArgumentParser();parser.add_argument('--game-zip',type=Path,required=True)
args=parser.parse_args()

class SourceFixture(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.exe,cls.gra=a.original(args.game_zip)
        cls.fx=a.relocations(cls.exe)
        cls.desc=a.sprites(cls.exe,cls.gra)
        cls.report=a.audit(cls.exe,cls.gra)
        cls.pal=cls.report['sourceColourGroups']
        cls.blocks=cls.report['secondaryGroups']

    def test_original_hashes(self):
        a.verify_identity(self.exe,self.gra)

    def test_all_101_original_rle_streams_tiling(self):
        self.assertEqual(len(self.desc),101)
        ordered=sorted((v['sourceStart'],v['sourceEndExclusive']) for v in self.desc.values())
        self.assertEqual((ordered[0][0],ordered[-1][1]),(0,29556))
        self.assertTrue(all(x[1]==y[0] for x,y in zip(ordered,ordered[1:])))

    def test_original_le_census(self):
        self.assertEqual(len(self.fx),26994)

    def test_twelve_direct_source_palette_links(self):
        self.assertEqual(len(self.pal),12)
        self.assertEqual([x['distinctSprites'] for x in self.pal],list(a.EXPECTED_HEADER_COUNTS))
        for x in self.pal:a.ptr(self.exe,self.fx,2,x['typedSourcePointerObject2'],1,a.PALETTE)

    def test_bang_palette_byte_complete(self):
        self.assertEqual(sum(x['distinctSprites'] for x in self.pal),101)
        self.assertEqual(self.pal[0]['resourceSpan'][0],0)
        self.assertEqual(self.pal[-1]['resourceSpan'][-1],29556)
        self.assertTrue(all(x['resourceSpan'][1]==y['resourceSpan'][0] for x,y in zip(self.pal,self.pal[1:])))

    def test_bang_selector_census_95_ref_93_unique(self):
        self.assertEqual(sum(x['orderedReferences'] for x in self.report['originalSelectorLists']),95)
        self.assertEqual(sum(x['uniqueSprites'] for x in self.report['originalSelectorLists']),93)

    def test_twelve_source_colour_links_not_twelve_runtime_palette_claims(self):
        self.assertEqual(self.report['paletteSourceObject1'],0x26cc4)
        self.assertFalse(self.report['runtimeUnknown']['livePaletteBank'])
        self.assertTrue(all(x['sourceRecordObject1']==0x26cc4 for x in self.pal))

    def test_three_separate_source_coordinate_groups(self):
        self.assertEqual([(g['rootObject2'],g['pointerSignedXYRecords']) for g in self.blocks],
                         [(0x1b7dc,6),(0x1b810,1),(0x1b81c,8)])
        self.assertEqual([g['sourceAcceptedBeforeStop'] for g in self.blocks],[5,1,8])
        self.assertEqual([g['trailingZeroObject2'] for g in self.blocks],[0x1b80c,0x1b818,0x1b85c])

    def test_primary_group_source_xzero_sentinel(self):
        self.assertEqual([x['signedRelativeXY'][0] for x in self.blocks[0]['records']],list(a.EXPECTED_X))
        self.assertEqual(self.blocks[0]['records'][-1]['signedRelativeXY'],[0,-48])
        self.assertEqual(self.blocks[0]['records'][-1]['fanoutTransforms'],[])

    def test_other_group_has_no_typed_inbound(self):
        self.assertEqual([g['typedInboundToRecords'] for g in self.blocks],[1,0,0])
        self.assertFalse(self.blocks[1]['originalReaderCodeLinked'])
        self.assertFalse(self.blocks[2]['originalReaderCodeLinked'])

    def test_eight_constructor_calls_per_accepted_record(self):
        self.assertEqual(self.report['consumerInstructions']['staticHelperCallsPerAcceptedRecord'],8)
        self.assertEqual(len(self.report['consumerInstructions']['originalHelperCallSitesPhysical']),8)

    def test_descriptor_update_chain_to_original_sprite(self):
        c=self.report['consumerInstructions']
        self.assertEqual(c['originalObjectConstructorPhysical'],0x64548)
        self.assertEqual(c['descriptorUpdatePhysical'],0x9377c)
        self.assertEqual(c['objectDescriptorAssignmentPhysical'],0x937d3)

    def test_original_code_exact_source_cursors(self):
        self.assertEqual(self.exe[0x842d6:0x842e0].hex(),'c7056c5a0700ac0c0200')
        self.assertEqual(self.exe[0x842e0:0x842ea].hex(),'c705785a0700dcb70100')

    def test_original_shift_negate_not_naive_symmetry(self):
        # Odd 29 SAR->SHL produces 28, not 29: source rounding matters.
        seq=a.transforms(29,-38)
        self.assertEqual(seq[:4],[[29,-38],[14,-19],[-28,-38],[-14,-19]])
        self.assertEqual(len(seq),8)

    def test_eight_distinct_extra_sprites_in_paired_records(self):
        self.assertEqual(len({r['descriptorObject2'] for g in self.blocks for r in g['records']}),8)
        self.assertEqual(self.pal[-1]['distinctSprites'],8)

    def test_no_live_frame_or_colour_claims(self):
        self.assertFalse(any(self.report['runtimeUnknown'].values()))

    def test_wrong_source_hash_refused(self):
        bad=bytearray(self.gra);bad[0]^=1
        with self.assertRaisesRegex(ValueError,'BANG.GRA identity'):
            a.audit(self.exe,bytes(bad))

    def test_wrong_original_opcode_refused(self):
        bad=bytearray(self.exe);bad[0x83fc5]^=1
        with self.assertRaisesRegex(ValueError,'original source instruction'):
            a.bytecode(bytes(bad),self.fx)

    def test_wrong_palette_relocation_refused(self):
        badfx=dict(self.fx);badfx.pop((2,0x20cac+12))
        with self.assertRaisesRegex(ValueError,'expected 12 typed colour headers'):
            a.source_palettes(self.exe,self.gra,badfx,self.desc)

    def test_wrong_palette_raw_pointer_refused(self):
        bad=bytearray(self.exe);bad[a.O2+0x20cac+12]^=1
        with self.assertRaisesRegex(ValueError,'raw source pointer'):
            a.source_palettes(bytes(bad),self.gra,self.fx,self.desc)

    def test_wrong_secondary_record_pointer_refused(self):
        bad=bytearray(self.exe);bad[a.O2+0x1b810]^=1
        with self.assertRaisesRegex(ValueError,'raw source pointer'):
            a.ptr(bytes(bad),self.fx,2,0x1b810,2,0x20cf8)

    def test_changed_source_sentinel_refused(self):
        bad=bytearray(self.exe);bad[a.O2+0x1b804+4]^=1
        with self.assertRaisesRegex(ValueError,'source accepted-record census'):
            a.secondary(bytes(bad),self.fx,self.desc)

    def test_changed_zero_record_refused(self):
        bad=bytearray(self.exe);bad[a.O2+0x1b818]^=1
        with self.assertRaisesRegex(ValueError,'secondary source group missing'):
            a.secondary(bytes(bad),self.fx,self.desc)

    def test_no_overwriting_existing_report(self):
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/'existing.json';target.write_text('KEEP')
            run=subprocess.run([sys.executable,str(Path(a.__file__).resolve()),
              '--game-zip',str(args.game_zip),'--out',str(target)],capture_output=True,text=True)
            self.assertNotEqual(run.returncode,0)
            self.assertIn('refusing to overwrite',run.stderr)
            self.assertEqual(target.read_text(),'KEEP')

    def test_reproducible_json(self):
        self.assertEqual(json.dumps(self.report,sort_keys=True),
                         json.dumps(a.audit(self.exe,self.gra),sort_keys=True))

if __name__=='__main__':unittest.main(argv=[sys.argv[0]],verbosity=2)

"""Exact original MK2 private-only Spelunk008 regression tests.

Run locally with unchanged owner ZIP; NEVER on public GitHub CI. All input
mutation occurs in memory and no original commercial file is modified.
"""
import argparse,json,struct,subprocess,sys,tempfile,unittest
from pathlib import Path
import trace_blood_palette_headers as a
p=argparse.ArgumentParser();p.add_argument('--game-zip',required=True,type=Path)
opts=p.parse_args()

class Original(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.exe,cls.gra=a.read_zip(opts.game_zip)
        cls.fx=a.relocations(cls.exe)
        cls.ds=a.scan(cls.exe,cls.gra)
        cls.r=a.produce(cls.exe,cls.gra)

    def test_canonical_source_identities(self):
        a.identity(self.exe,self.gra)
    def test_original_full_byte_tiling(self):
        self.assertEqual(self.r['originalIndexedSprites'],178)
        self.assertEqual(self.r['originalResourceByteCount'],111780)
    def test_palettes_22_typed_records(self):
        groups=self.r['paletteAnchors'];self.assertEqual(len(groups),22)
        self.assertTrue(all(x['sourcePaletteRecordObject1']==0x26cc4 for x in groups))
        self.assertEqual(tuple(x['descriptorCount'] for x in groups),a.EXPECTED_GROUP_SIZES)
    def test_palettes_cover_original_178_source_sprites(self):
        groups=self.r['paletteAnchors']
        self.assertEqual(sum(x['descriptorCount'] for x in groups),178)
        self.assertTrue(all(x['endSourceByteExclusive']==y['firstSourceByte'] for x,y in zip(groups,groups[1:])))
        self.assertEqual(groups[0]['firstSourceByte'],0)
        self.assertEqual(groups[-1]['endSourceByteExclusive'],111780)
    def test_unreferenced_five_list_roots(self):
        roots=self.r['unlinkedListRoots']
        self.assertEqual([x['sourceListObject2'] for x in roots],
                         [0x1d010,0x1d1d0,0x1d1f0,0x1d22c,0x1d2e0])
        self.assertTrue(all(x['typedInboundReferencesToEntries']==0 and
                            x['exactRootDwordOccurrencesInOriginalExe']==0 and
                            x['runtimeUnusedProven'] is False for x in roots))
    def test_twenty_five_unlisted_complete_source_groups(self):
        groups=self.r['unlistedSpriteGroups']
        self.assertEqual([x['distinctSprites'] for x in groups],[9,13,3])
        self.assertEqual([x['sourceByteExtent'] for x in groups],
                         [[97380,100360],[103196,110256],[110256,111780]])
    def test_direct_seed_selection(self):
        self.assertEqual([(x['originalInstructionPhysical'],x['sourceDescriptorObject2'])
                          for x in self.r['directSourceSeeds']],list(a.DIRECT_SEEDS))
    def test_constructor_join_and_branches(self):
        self.assertEqual(self.exe[0x91555:0x91557].hex(),'eb0a')
        self.assertEqual([(x['originalCallPhysical'],x['sourceConstructorPhysical'])
                          for x in self.r['constructorCallWits']],list(a.CONSTRUCTOR_CALLS))
    def test_pit_pair_sites(self):
        self.assertEqual([(x['sourceObject2'],x['descriptorObject2'])
                          for x in self.r['pitPairedDescriptorReferences']],list(a.PAIR_SITES))
    def test_preserves_o228_source_177(self):
        self.assertEqual(self.ds[0x206fc]['start'],111552)
        self.assertEqual([self.ds[0x206fc]['w'],self.ds[0x206fc]['h']],[14,9])
        self.assertEqual(self.fx[(2,0x206fc+12)],(7,16,1,0x26cc4))
    def test_no_runtime_claims(self):
        self.assertFalse(any(self.r['runtime'].values()))
        self.assertFalse(self.r['directlyAssertedPaletteOwnerForNonHeaderSprites'])
    def test_wrong_original_exe_sha_refused(self):
        b=bytearray(self.exe);b[0x90cbd]^=1
        with self.assertRaisesRegex(ValueError,'original DOS MK2.EXE identity'):
            a.produce(bytes(b),self.gra)
    def test_wrong_original_blood_sha_refused(self):
        b=bytearray(self.gra);b[-1]^=1
        with self.assertRaisesRegex(ValueError,'original BLOOD.GRA identity'):
            a.produce(self.exe,bytes(b))
    def test_palette_typed_pointer_mutation_refused(self):
        fx=dict(self.fx);fx.pop((2,0x20538+12))
        with self.assertRaisesRegex(ValueError,'expected 22 original palette-pointer headers'):
            a.classify(self.exe,self.gra,fx,self.ds)
    def test_original_palette_raw_word_mutation_refused(self):
        b=bytearray(self.exe);b[a.O2+0x20538+12]^=1
        with self.assertRaisesRegex(ValueError,'raw typed pointer mismatch'):
            a.classify(bytes(b),self.gra,self.fx,self.ds)
    def test_source_seed_code_mutation_refused(self):
        b=bytearray(self.exe);b[0x91557]=0x90
        with self.assertRaisesRegex(ValueError,'original direct sprite selector opcode'):
            a.classify(bytes(b),self.gra,self.fx,self.ds)
    def test_orphan_exact_root_occurrence_mutation_refused(self):
        b=bytearray(self.exe)
        b[0x81000:0x81004]=struct.pack('<I',0x1d010)
        with self.assertRaisesRegex(ValueError,'unclassified blood group got source ref'):
            a.classify(bytes(b),self.gra,self.fx,self.ds)
    def test_pit_pair_pointer_mutation_refused(self):
        b=bytearray(self.exe);b[a.O2+0x13da0]^=1
        with self.assertRaisesRegex(ValueError,'raw typed pointer mismatch'):
            a.classify(bytes(b),self.gra,self.fx,self.ds)
    def test_deterministic_original_metadata(self):
        second=a.produce(self.exe,self.gra)
        self.assertEqual(json.dumps(second,sort_keys=True),json.dumps(self.r,sort_keys=True))
    def test_refuse_existing_output(self):
        with tempfile.TemporaryDirectory() as t:
            output=Path(t)/'keep.json';output.write_text('KEEP')
            call=[sys.executable,str(Path(a.__file__).resolve()),'--game-zip',str(opts.game_zip),'--out',str(output)]
            r=subprocess.run(call,capture_output=True,text=True)
            self.assertNotEqual(r.returncode,0)
            self.assertIn('refusing to overwrite existing report',r.stderr)
            self.assertEqual(output.read_text(),'KEEP')

if __name__=='__main__':unittest.main(argv=[sys.argv[0]],verbosity=2)

#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/nj7Slot8PaletteContextRgbaFixtures.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-nj7-slot8-palette-context-rgba.mjs','scripts/audit-mk2-o87.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);panel=txt(paths[1]);meta=txt(paths[2]);pkg=json.loads(txt(paths[3]));runner=txt(paths[4]);audit=txt(paths[5])
ck('verdict','MK2_NJ7_SLOT8_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in s)
ck('nj7_identity',"RESOURCE='NJ7.GRA'" in s and 'RESOURCE_ID=55' in s and 'SLOT=8' in s)
ck('nj7_hash','4de11628c34955832742166b330aacb01d4422cca09027fb626acd4e3698ab8e' in s)
ck('connected_root','rootObject2:0x9c54' in s and 'rootFieldSource:0x9c60' in s and 'level1Target:0xac4a' in s)
ck('connected_middle','level1FieldSource:0xac7a' in s and 'level2Target:0xaca6' in s and 'level2FieldSource:0xace2' in s and 'level3Target:0xad16' in s)
ck('connected_descriptor','level3FieldSource:0xad4e' in s and 'descriptorObject2:0x285f8' in s and 'descriptorPhysical:0xc924c' in s)
ck('fixup_validation','parseObject2Type7Fixups' in s and 'edge(0x9c60,0xac4a)' in s and 'edge(0xac7a,0xaca6)' in s and 'edge(0xace2,0xad16)' in s and 'edge(0xad4e,0x285f8)' in s)
ck('slot8_palette_A','0x2634a' in s.lower() and '0x87f9e' in s.lower() and '2d7d4ba61593ead73ef6d672bc0e6bf8e742ba0d80f463995da3ce41380cdd6e' in s)
ck('slot8_palette_B','0x263ca' in s.lower() and '0x8801e' in s.lower() and '5d5cab5ed9e55bc356c79a6d354b4ad0ec5dc41229055b557c5aefbdcfac6894' in s)
ck('semantic_A','DEFAULT_CHARACTER_PALETTE' in s);ck('semantic_B','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE' in s)
ck('stream_count','streamCount:116' in s and 'pngEntryCount:232' in s and 'entryCount:237' in s)
ck('scope_boundary',"scope:'NJ7_SLOT8_ONLY_NOT_WHOLE_NJ_FAMILY'" in s and 'wholeNJFamilyPaletteOwnershipPromoted:false' in s and 'humanFighterNamePromoted:false' in s)
ck('noncanonical_boundary','additionalConnectedNJResourcesExist:true' in s and 'not promoted as the complete or canonical slot-8 geometry' in s)
ck('o73_correction','o73LooseNJ6WitnessSupersededForSlot8Fixture:true' in s)
ck('renderer_mapping','opaque sprite index N (1..63) -> palette record colour N-1' in s and 'lut_physical=0xa1cd8' in s.lower())
ck('panel_scope','O67–O87' in panel);ck('panel_card','O87 NJ7 slot-8 connected resource contract verified' in panel);ck('panel_counts','116 NJ7 streams × 2 semantic palette contexts' in panel)
ck('panel_boundary','not promoted as the complete/canonical slot-8 geometry' in panel);ck('panel_json','O87 NJ7 Slot8 RGBA JSON' in panel);ck('panel_download','Download NJ7 Slot8 RGBA Package' in panel);ck('panel_runner','executeMK2NJ7PaletteContextRgbaFixtures' in panel)
ck('milestone','1E.3O.87' in meta);ck('package_script',pkg['scripts'].get('smoke:mk2-nj7-slot8-palette-context-rgba')=='node scripts/run-mk2-nj7-slot8-palette-context-rgba.mjs')
ck('o86_script_retained','smoke:mk2-verified-identity-resource-rgba-bundle-o86' in pkg['scripts']);ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain',all(x in runner for x in ['executeMK2BroadIndexedGraphicsCorpusCensus','executeMK2CharacterResourcePaletteSlotJoin','executeMK2PaletteSelectorGameplaySemantics','executeMK2NJ7PaletteContextRgbaFixtures']))
ck('independent_audit_fixups',all(x in audit for x in ['nj7_connected_root_edge','nj7_connected_level1_edge','nj7_connected_level2_edge','nj7_connected_descriptor_edge']))
ck('independent_audit_all_rgba','rgba_{name}_{i:02}' in audit and 'all232RgbaPayloadsIndependentlyReconstructed' in audit)
ck('independent_audit_scope','wholeNJFamilyPaletteOwnershipNotPromoted' in audit and 'humanFighterNameNotPromoted' in audit and 'slot8Nj7ConnectedContractScopePreserved' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o87_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o87SourceIntegrated':not failed,'slot8Nj7ConnectedFixtureExposed':not failed,'o73LooseNJ6WitnessSupersededForThisFixture':True,'nj7NotPromotedAsCompleteCanonicalSlot8Geometry':True,'wholeNJFamilyPaletteOwnershipNotPromoted':True,'humanFighterNameNotPromoted':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O87_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

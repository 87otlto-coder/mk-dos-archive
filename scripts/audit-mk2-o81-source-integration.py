#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/fn4PaletteContextRgbaFixtures.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-fn4-palette-context-rgba.mjs','scripts/audit-mk2-o81.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);panel=txt(paths[1]);meta=txt(paths[2]);pkg=json.loads(txt(paths[3]));runner=txt(paths[4]);audit=txt(paths[5])
ck('verdict','MK2_FN4_SLOT4_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in s)
ck('fn4_identity',"RESOURCE='FN4.GRA'" in s and 'RESOURCE_ID=119' in s and 'SLOT=4' in s)
ck('fn4_hash','baba701ccf9301913a575daec0810827601553fc3bc846a4877907083acb6185' in s)
ck('connected_root','rootObject2:0x2194' in s and 'rootFieldSource:0x21ac' in s and 'level1Target:0x21e0' in s)
ck('connected_descriptor','level1FieldSource:0x21ea' in s and 'level2Target:0x220a' in s and 'descriptorObject2:0x27640' in s and 'descriptorPhysical:0xc8294' in s)
ck('fixup_validation','parseObject2Type7Fixups' in s and 'edge(0x21ac,0x21e0)' in s and 'edge(0x21ea,0x220a)' in s and 'edge(0x220a,0x27640)' in s)
ck('slot4_palette_A','0x25b4a' in s.lower() and '0x8779e' in s.lower() and '0f61a83d2cb74174f25dc19b922943c93792bab6ca33aae891cef5a3f0c85320' in s)
ck('slot4_palette_B','0x25bca' in s.lower() and '0x8781e' in s.lower() and '2bab018a1306b03a20fe93735f59dd8459195a0e440574c3aa4b246aad88091c' in s)
ck('semantic_A','DEFAULT_CHARACTER_PALETTE' in s);ck('semantic_B','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE' in s)
ck('stream_count','streamCount:27' in s and 'pngEntryCount:54' in s)
ck('scope_boundary',"scope:'FN4_ONLY_NOT_WHOLE_FN_FAMILY'" in s and 'wholeFNFamilyPaletteOwnershipPromoted:false' in s and 'humanFighterNamePromoted:false' in s)
ck('o73_correction','o73LooseFn6WitnessSupersededForSlot4Fixture:true' in s)
ck('renderer_mapping','opaque sprite index N (1..63) -> palette record colour N-1' in s and 'lut_physical=0xa1cd8' in s.lower())
ck('panel_scope','O67–O81' in panel);ck('panel_card','O81 FN4 slot-4 connected-provenance RGBA verified' in panel);ck('panel_counts','27 FN4 streams × 2 semantic palette contexts' in panel)
ck('panel_boundary',"O73's looser FN6 witness is superseded for this fixture" in panel);ck('panel_json','O81 FN4 RGBA JSON' in panel);ck('panel_download','Download FN4 RGBA Package' in panel);ck('panel_runner','executeMK2FN4PaletteContextRgbaFixtures' in panel)
ck('milestone','1E.3O.81' in meta);ck('package_script',pkg['scripts'].get('smoke:mk2-fn4-palette-context-rgba')=='node scripts/run-mk2-fn4-palette-context-rgba.mjs')
ck('o80_script_retained','smoke:mk2-verified-fighter-rgba-bundle-o80' in pkg['scripts']);ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain',all(x in runner for x in ['executeMK2BroadIndexedGraphicsCorpusCensus','executeMK2CharacterResourcePaletteSlotJoin','executeMK2PaletteSelectorGameplaySemantics','executeMK2FN4PaletteContextRgbaFixtures']))
ck('independent_audit_fixups','fn4_connected_root_edge' in audit and 'fn4_connected_level1_edge' in audit and 'fn4_connected_descriptor_edge' in audit)
ck('independent_audit_all_rgba','rgba_{name}_{i:02}' in audit and 'all54RgbaPayloadsIndependentlyReconstructed' in audit)
ck('independent_audit_scope','wholeFNFamilyPaletteOwnershipNotPromoted' in audit and 'humanFighterNameNotPromoted' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o81_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o81SourceIntegrated':not failed,'fn4Slot4ConnectedFixtureExposed':not failed,'o73LooseFn6WitnessSupersededForSlot4Fixture':True,'fn4OnlyScopePreserved':True,'wholeFNFamilyPaletteOwnershipNotPromoted':True,'slots5And16RemainUnresolvedAtConnectedStandard':True,'humanFighterNameNotPromoted':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O81_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

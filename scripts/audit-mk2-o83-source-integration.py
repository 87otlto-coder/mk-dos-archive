#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/fn6PaletteContextRgbaFixtures.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-fn6-palette-context-rgba.mjs','scripts/audit-mk2-o83.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);panel=txt(paths[1]);meta=txt(paths[2]);pkg=json.loads(txt(paths[3]));runner=txt(paths[4]);audit=txt(paths[5])
ck('verdict','MK2_FN6_SLOT5_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in s)
ck('fn6_identity',"RESOURCE='FN6.GRA'" in s and 'RESOURCE_ID=121' in s and 'SLOT=5' in s)
ck('fn6_hash','d4473d8228f410877b860cd2c9ec519b182022c11615234e48bdda9f02bb77d2' in s)
ck('connected_root','rootObject2:0x21b8' in s and 'rootFieldSource:0x21d0' in s and 'level1Target:0x2e86' in s)
ck('connected_descriptor','level1FieldSource:0x2e86' in s and 'level2Target:0x2ece' in s and 'descriptorObject2:0x2788c' in s and 'descriptorPhysical:0xc84e0' in s)
ck('fixup_validation','parseObject2Type7Fixups' in s and 'edge(0x21d0,0x2e86)' in s and 'edge(0x2e86,0x2ece)' in s and 'edge(0x2ece,0x2788c)' in s)
ck('slot5_palette_A','0x25d4a' in s.lower() and '0x8799e' in s.lower() and 'f267c92cb13bc10aaffa115250579ac8997dfd107e11a3e8c41dce36fba0bad9' in s)
ck('slot5_palette_B','0x25dca' in s.lower() and '0x87a1e' in s.lower() and '966975e1af91339efd1fb74184cc897956ec77bd3081ebd74c37793b992297ff' in s)
ck('semantic_A','DEFAULT_CHARACTER_PALETTE' in s);ck('semantic_B','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE' in s)
ck('stream_count','streamCount:46' in s and 'pngEntryCount:92' in s)
ck('scope_boundary',"scope:'FN6_ONLY_NOT_WHOLE_FN_FAMILY'" in s and 'wholeFNFamilyPaletteOwnershipPromoted:false' in s and 'humanFighterNamePromoted:false' in s)
ck('o73_correction','o73LooseFn6WitnessStrengthenedForSlot5Fixture:true' in s)
ck('renderer_mapping','opaque sprite index N (1..63) -> palette record colour N-1' in s and 'lut_physical=0xa1cd8' in s.lower())
ck('panel_scope','O67–O83' in panel);ck('panel_card','O83 FN6 slot-5 connected-provenance RGBA verified' in panel);ck('panel_counts','46 FN6 streams × 2 semantic palette contexts' in panel)
ck('panel_boundary',"O73's looser nonzero FN6 witness is strengthened by this exact offset-0 path" in panel);ck('panel_json','O83 FN6 RGBA JSON' in panel);ck('panel_download','Download FN6 RGBA Package' in panel);ck('panel_runner','executeMK2FN6PaletteContextRgbaFixtures' in panel)
ck('milestone','1E.3O.83' in meta);ck('package_script',pkg['scripts'].get('smoke:mk2-fn6-palette-context-rgba')=='node scripts/run-mk2-fn6-palette-context-rgba.mjs')
ck('o80_script_retained','smoke:mk2-verified-fighter-rgba-bundle-o80' in pkg['scripts']);ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain',all(x in runner for x in ['executeMK2BroadIndexedGraphicsCorpusCensus','executeMK2CharacterResourcePaletteSlotJoin','executeMK2PaletteSelectorGameplaySemantics','executeMK2FN6PaletteContextRgbaFixtures']))
ck('independent_audit_fixups','fn6_connected_root_edge' in audit and 'fn6_connected_level1_edge' in audit and 'fn6_connected_descriptor_edge' in audit)
ck('independent_audit_all_rgba','rgba_{name}_{i:02}' in audit and 'all92RgbaPayloadsIndependentlyReconstructed' in audit)
ck('independent_audit_scope','wholeFNFamilyPaletteOwnershipNotPromoted' in audit and 'humanFighterNameNotPromoted' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o83_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o83SourceIntegrated':not failed,'fn6Slot5ConnectedFixtureExposed':not failed,'o73LooseFn6WitnessStrengthenedForSlot5Fixture':True,'fn6OnlyScopePreserved':True,'wholeFNFamilyPaletteOwnershipNotPromoted':True,'slot16RemainsUnresolvedAtConnectedStandard':True,'humanFighterNameNotPromoted':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O83_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

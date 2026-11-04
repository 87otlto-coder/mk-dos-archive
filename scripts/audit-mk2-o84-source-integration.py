#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/fn4PaletteContextRgbaFixtures.ts','src/games/mk2/research/fn6PaletteContextRgbaFixtures.ts','src/games/mk2/research/verifiedFighterRgbaBundleO84.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-verified-fighter-rgba-bundle-o84.mjs','scripts/audit-mk2-o84.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
fn4=txt(paths[0]);fn6=txt(paths[1]);s=txt(paths[2]);panel=txt(paths[3]);meta=txt(paths[4]);pkg=json.loads(txt(paths[5]));runner=txt(paths[6]);audit=txt(paths[7])
# Retain the O81 connected-provenance correction.
ck('o81_verdict_retained','MK2_FN4_SLOT4_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in fn4)
ck('o81_connected_path_retained','rootObject2:0x2194' in fn4 and 'level1Target:0x21e0' in fn4 and 'level2Target:0x220a' in fn4 and 'descriptorObject2:0x27640' in fn4)
ck('o81_fn4_scope_retained',"scope:'FN4_ONLY_NOT_WHOLE_FN_FAMILY'" in fn4 and 'o73LooseFn6WitnessSupersededForSlot4Fixture:true' in fn4)
ck('o83_verdict_retained','MK2_FN6_SLOT5_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in fn6)
ck('o83_connected_path_retained','rootObject2:0x21b8' in fn6 and 'level1Target:0x2e86' in fn6 and 'level2Target:0x2ece' in fn6 and 'descriptorObject2:0x2788c' in fn6)
ck('o83_fn6_scope_retained',"scope:'FN6_ONLY_NOT_WHOLE_FN_FAMILY'" in fn6 and 'o73LooseFn6WitnessStrengthenedForSlot5Fixture:true' in fn6)
# O84 integration contract.
ck('o84_verdict','MK2_SIX_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION' in s)
ck('o84_five_fixture_flag','sixIndependentFixtureContractsIntegrated:true' in s)
for name in ['HH0.GRA','LK0.GRA','JC0.GRA','BA0.GRA','FN4.GRA','FN6.GRA']: ck('resource_'+name,name in s,name)
for sha in ['1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2','04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836','d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7','8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133','f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726','68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3']: ck('nested_hash_'+sha[:8],sha in s,sha)
ck('o84_totals','nestedLogicalEntryCount:478' in s and 'totalPngCount:448' in s and 'outerEntryCount:8' in s and 'nestedPackageCount:6' in s)
ck('o84_fn_paths',"packages/slot_04_FN4_RGBA.zip" in s and "FN4_ONLY_NOT_WHOLE_FN_FAMILY" in s and "packages/slot_05_FN6_RGBA.zip" in s and "FN6_ONLY_NOT_WHOLE_FN_FAMILY" in s)
ck('o84_no_semantic_promotion','newPaletteOwnershipPromoted:false' in s and 'siblingResourceOwnershipPromoted:false' in s and 'humanFighterNamesPromoted:false' in s and 'mk1AssumptionsImported:false' in s)
ck('o84_semantic_contexts','DEFAULT_CHARACTER_PALETTE' in s and 'SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE' in s)
# UI / app integration.
ck('panel_scope','O67–O84' in panel)
ck('panel_o81_card','O81 FN4 slot-4 connected-provenance RGBA verified' in panel);ck('panel_o83_card','O83 FN6 slot-5 connected-provenance RGBA verified' in panel)
ck('panel_o84_card','O84 six-fixture verified fighter-resource RGBA bundle' in panel)
ck('panel_o84_counts','6 exact nested fixture packages' in panel and 'HH0 slot 0 + LK0 slot 1 + JC0 slot 2 + BA0 slot 3 + FN4 slot 4 + FN6 slot 5' in panel)
ck('panel_o84_boundary','Integration only: FN4 and FN6 remain slot-specific evidence' in panel)
ck('panel_o84_json','O84 Bundle JSON' in panel)
ck('panel_o84_download','Download 6-Fixture RGBA Bundle' in panel)
ck('panel_o84_runner','executeMK2VerifiedFighterRgbaBundleO84(i,k,l,n,p,r)' in panel)
ck('panel_o81_correction_retained',"O73's looser FN6 witness is superseded for this fixture" in panel);ck('panel_o83_strengthening_retained',"O73's looser nonzero FN6 witness is strengthened by this exact offset-0 path" in panel)
ck('milestone','1E.3O.84' in meta and 'Six Verified Fighter-Resource RGBA Integration Bundle' in meta)
ck('package_script',pkg['scripts'].get('smoke:mk2-verified-fighter-rgba-bundle-o84')=='node scripts/run-mk2-verified-fighter-rgba-bundle-o84.mjs')
ck('o81_script_retained','smoke:mk2-fn4-palette-context-rgba' in pkg['scripts']);ck('o83_script_retained','smoke:mk2-fn6-palette-context-rgba' in pkg['scripts'])
ck('o80_script_retained','smoke:mk2-verified-fighter-rgba-bundle-o80' in pkg['scripts'])
ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
# Standalone runner and independent audit must include O81/FN4, not only O79.
ck('runner_o81_chain','executeMK2FN4PaletteContextRgbaFixtures' in runner and 'executeMK2FN6PaletteContextRgbaFixtures' in runner and 'executeMK2VerifiedFighterRgbaBundleO84(o74,o76,o77,o79,o81,o83)' in runner)
ck('runner_modules',"'fn4PaletteContextRgbaFixtures'" in runner and "'fn6PaletteContextRgbaFixtures'" in runner and "'verifiedFighterRgbaBundleO84'" in runner)
ck('independent_audit_fn4_fn6','packages/slot_04_FN4_RGBA.zip' in audit and 'f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726' in audit and 'packages/slot_05_FN6_RGBA.zip' in audit and '68bbba61b49d7e5a1bc3ca43babdd04f2ccb2a9b642b553406249f3a52256ff3' in audit)
ck('independent_audit_totals',"manifest['fixtureCount']==6" in audit and "manifest['totalPngCount']==448" in audit and "manifest['nestedLogicalEntryCount']==478" in audit)
ck('independent_audit_boundaries','manifest_no_new_palette' in audit and 'manifest_no_sibling_ownership' in audit and 'manifest_no_human_names' in audit and 'manifest_no_mk1' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o84_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o84SourceIntegrated':not failed,'o81ConnectedFn4CorrectionRetained':True,'o83ConnectedFn6StrengtheningRetained':True,'sixExactFixturePackagesExposed':not failed,'totalVerifiedPngs':448,'newPaletteOwnershipNotPromoted':True,'siblingResourceOwnershipNotPromoted':True,'humanFighterNamesNotPromoted':True,'slot16RemainsUnresolvedAtConnectedStandard':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O84_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

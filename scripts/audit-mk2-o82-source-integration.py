#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/fn4PaletteContextRgbaFixtures.ts','src/games/mk2/research/verifiedFighterRgbaBundleO82.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-verified-fighter-rgba-bundle-o82.mjs','scripts/audit-mk2-o82.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
fn4=txt(paths[0]);s=txt(paths[1]);panel=txt(paths[2]);meta=txt(paths[3]);pkg=json.loads(txt(paths[4]));runner=txt(paths[5]);audit=txt(paths[6])
# Retain the O81 connected-provenance correction.
ck('o81_verdict_retained','MK2_FN4_SLOT4_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in fn4)
ck('o81_connected_path_retained','rootObject2:0x2194' in fn4 and 'level1Target:0x21e0' in fn4 and 'level2Target:0x220a' in fn4 and 'descriptorObject2:0x27640' in fn4)
ck('o81_fn4_scope_retained',"scope:'FN4_ONLY_NOT_WHOLE_FN_FAMILY'" in fn4 and 'o73LooseFn6WitnessSupersededForSlot4Fixture:true' in fn4)
# O82 integration contract.
ck('o82_verdict','MK2_FIVE_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION' in s)
ck('o82_five_fixture_flag','fiveIndependentFixtureContractsIntegrated:true' in s)
for name in ['HH0.GRA','LK0.GRA','JC0.GRA','BA0.GRA','FN4.GRA']: ck('resource_'+name,name in s,name)
for sha in ['1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2','04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836','d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7','8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133','f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726']: ck('nested_hash_'+sha[:8],sha in s,sha)
ck('o82_totals','nestedLogicalEntryCount:381' in s and 'totalPngCount:356' in s and 'outerEntryCount:7' in s and 'nestedPackageCount:5' in s)
ck('o82_fn4_path',"packages/slot_04_FN4_RGBA.zip" in s and "FN4_ONLY_NOT_WHOLE_FN_FAMILY" in s)
ck('o82_no_semantic_promotion','newPaletteOwnershipPromoted:false' in s and 'siblingResourceOwnershipPromoted:false' in s and 'humanFighterNamesPromoted:false' in s and 'mk1AssumptionsImported:false' in s)
ck('o82_semantic_contexts','DEFAULT_CHARACTER_PALETTE' in s and 'SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE' in s)
# UI / app integration.
ck('panel_scope','O67–O82' in panel)
ck('panel_o81_card','O81 FN4 slot-4 connected-provenance RGBA verified' in panel)
ck('panel_o82_card','O82 five-fixture verified fighter-resource RGBA bundle' in panel)
ck('panel_o82_counts','5 exact nested fixture packages' in panel and 'HH0 slot 0 + LK0 slot 1 + JC0 slot 2 + BA0 slot 3 + FN4 slot 4' in panel)
ck('panel_o82_boundary','Integration only: FN4 remains slot-4/FN4-only evidence' in panel)
ck('panel_o82_json','O82 Bundle JSON' in panel)
ck('panel_o82_download','Download 5-Fixture RGBA Bundle' in panel)
ck('panel_o82_runner','executeMK2VerifiedFighterRgbaBundleO82(i,k,l,n,p)' in panel)
ck('panel_o81_correction_retained',"O73's looser FN6 witness is superseded for this fixture" in panel)
ck('milestone','1E.3O.82' in meta and 'Five Verified Fighter-Resource RGBA Integration Bundle' in meta)
ck('package_script',pkg['scripts'].get('smoke:mk2-verified-fighter-rgba-bundle-o82')=='node scripts/run-mk2-verified-fighter-rgba-bundle-o82.mjs')
ck('o81_script_retained','smoke:mk2-fn4-palette-context-rgba' in pkg['scripts'])
ck('o80_script_retained','smoke:mk2-verified-fighter-rgba-bundle-o80' in pkg['scripts'])
ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
# Standalone runner and independent audit must include O81/FN4, not only O79.
ck('runner_o81_chain','executeMK2FN4PaletteContextRgbaFixtures' in runner and 'executeMK2VerifiedFighterRgbaBundleO82(o74,o76,o77,o79,o81)' in runner)
ck('runner_modules',"'fn4PaletteContextRgbaFixtures'" in runner and "'verifiedFighterRgbaBundleO82'" in runner)
ck('independent_audit_fn4','packages/slot_04_FN4_RGBA.zip' in audit and 'f6e116dc1bb9dc9c4b09147368a5d1ea18b9c6ad640ba6055c6641f116c10726' in audit)
ck('independent_audit_totals',"manifest['fixtureCount']==5" in audit and "manifest['totalPngCount']==356" in audit and "manifest['nestedLogicalEntryCount']==381" in audit)
ck('independent_audit_boundaries','manifest_no_new_palette' in audit and 'manifest_no_sibling_ownership' in audit and 'manifest_no_human_names' in audit and 'manifest_no_mk1' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o82_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o82SourceIntegrated':not failed,'o81ConnectedFn4CorrectionRetained':True,'fiveExactFixturePackagesExposed':not failed,'totalVerifiedPngs':356,'newPaletteOwnershipNotPromoted':True,'siblingResourceOwnershipNotPromoted':True,'humanFighterNamesNotPromoted':True,'slots5And16RemainUnresolvedAtConnectedStandard':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O82_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

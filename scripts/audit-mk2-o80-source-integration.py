#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/verifiedFighterRgbaBundleO80.ts','src/games/mk2/research/ba0PaletteContextRgbaFixtures.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-verified-fighter-rgba-bundle-o80.mjs','scripts/audit-mk2-o80.py','scripts/audit-mk2-o79.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);ba=txt(paths[1]);panel=txt(paths[2]);meta=txt(paths[3]);pkg=json.loads(txt(paths[4]));runner=txt(paths[5]);audit=txt(paths[6])
ck('verdict','MK2_FOUR_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION' in s)
for tag,h in [('jc0','d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7'),('hh0','1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2'),('lk0','04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836'),('ba0','8507677f9b3b7e322f92c64ba204fd7cb1a05fe5aea39b761a2fd0fd5bcf5133')]: ck('expected_'+tag+'_hash',h in s,h)
ck('slot_set',all(x in s for x in ["slot:0,resource:'HH0.GRA'","slot:1,resource:'LK0.GRA'","slot:2,resource:'JC0.GRA'","slot:3,resource:'BA0.GRA'"]))
ck('totals','nestedLogicalEntryCount:322' in s and 'totalPngCount:302' in s and 'outerEntryCount:6' in s)
ck('semantic_contexts','DEFAULT_CHARACTER_PALETTE' in s and 'SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE' in s)
ck('boundaries',all(x in s for x in ['newPaletteOwnershipPromoted:false','siblingResourceOwnershipPromoted:false','humanFighterNamesPromoted:false']))
ck('o79_verdict_retained','MK2_BA0_FOURTH_FIGHTER_RESOURCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in ba)
ck('panel_scope','O67–O80' in panel);ck('panel_card','O80 verified fighter-resource RGBA bundle' in panel);ck('panel_counts','4 exact nested fixture packages' in panel and 'verified PNGs' in panel);ck('panel_slots','HH0 slot 0 + LK0 slot 1 + JC0 slot 2 + BA0 slot 3' in panel);ck('panel_json','O80 Bundle JSON' in panel);ck('panel_download','Download 4-Fixture RGBA Bundle' in panel);ck('panel_runner','executeMK2VerifiedFighterRgbaBundleO80' in panel)
ck('milestone','1E.3O.80' in meta)
ck('package_script',pkg['scripts'].get('smoke:mk2-verified-fighter-rgba-bundle-o80')=='node scripts/run-mk2-verified-fighter-rgba-bundle-o80.mjs')
ck('o79_script_retained','smoke:mk2-ba0-palette-context-rgba' in pkg['scripts']);ck('o78_script_retained','smoke:mk2-verified-fighter-rgba-bundle' in pkg['scripts']);ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain',all(x in runner for x in ['executeMK2JC0PaletteContextRgbaFixtures','executeMK2HH0PaletteContextRgbaFixtures','executeMK2LK0PaletteContextRgbaFixtures','executeMK2BA0PaletteContextRgbaFixtures','executeMK2VerifiedFighterRgbaBundleO80']))
ck('audit_all_four',all(x in audit for x in ['HH0.GRA','LK0.GRA','JC0.GRA','BA0.GRA']) and "ck(f'{res}_nested_sha'" in audit)
ck('audit_boundaries',all(x in audit for x in ['manifest_no_new_palette','manifest_no_sibling_ownership','manifest_no_human_names']))
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o80_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o80SourceIntegrated':not failed,'fourFixtureBundleExposed':not failed,'newPaletteOwnershipPromoted':False,'siblingResourceOwnershipPromoted':False,'humanFighterNamesPromoted':False,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O80_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

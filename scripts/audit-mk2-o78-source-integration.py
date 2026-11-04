#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/verifiedFighterRgbaBundle.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-verified-fighter-rgba-bundle.mjs','scripts/audit-mk2-o78.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);panel=txt(paths[1]);meta=txt(paths[2]);pkg=json.loads(txt(paths[3]));runner=txt(paths[4]);audit=txt(paths[5])
ck('verdict','MK2_THREE_VERIFIED_FIGHTER_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION' in s)
ck('expected_jc0_hash','d5b76bd511b5f985c1968126788925a92da669bda84a500cb405b326c95dcfd7' in s)
ck('expected_hh0_hash','1cf5f1453ada5ff80febd0e2a5eb62afcda43d75cb3f9e6361fe107288e932d2' in s)
ck('expected_lk0_hash','04723ef7c8f69099875746e76d7dd30aa297ccb121b89ae6e68d0d7ffb49f836' in s)
ck('slot_set',all(x in s for x in ["slot:0,resource:'HH0.GRA'","slot:1,resource:'LK0.GRA'","slot:2,resource:'JC0.GRA'"]))
ck('totals','nestedLogicalEntryCount:229' in s and 'totalPngCount:214' in s and 'outerEntryCount:5' in s)
ck('semantic_contexts','DEFAULT_CHARACTER_PALETTE' in s and 'SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE' in s)
ck('no_new_palette','newPaletteOwnershipPromoted:false' in s)
ck('no_sibling','siblingResourceOwnershipPromoted:false' in s)
ck('no_human_names','humanFighterNamesPromoted:false' in s)
ck('panel_scope','O67–O78' in panel)
ck('panel_card','O78 verified fighter-resource RGBA bundle' in panel)
ck('panel_counts','3 exact nested fixture packages' in panel and 'verified PNGs' in panel)
ck('panel_boundary','no sibling-resource ownership, whole-family ownership, or human fighter names are promoted' in panel)
ck('panel_json','O78 Bundle JSON' in panel)
ck('panel_download','Download Verified Fighter RGBA Bundle' in panel)
ck('panel_runner','executeMK2VerifiedFighterRgbaBundle' in panel)
ck('milestone','1E.3O.78' in meta)
ck('package_script',pkg['scripts'].get('smoke:mk2-verified-fighter-rgba-bundle')=='node scripts/run-mk2-verified-fighter-rgba-bundle.mjs')
ck('o77_script_retained','smoke:mk2-lk0-palette-context-rgba' in pkg['scripts'])
ck('o76_script_retained','smoke:mk2-hh0-palette-context-rgba' in pkg['scripts'])
ck('o74_script_retained','smoke:mk2-jc0-palette-context-rgba' in pkg['scripts'])
ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain',all(x in runner for x in ['executeMK2JC0PaletteContextRgbaFixtures','executeMK2HH0PaletteContextRgbaFixtures','executeMK2LK0PaletteContextRgbaFixtures','executeMK2VerifiedFighterRgbaBundle']))
ck('audit_nested_hashes',"ck(f'{res}_nested_sha'" in audit and all(x in audit for x in ['HH0.GRA','LK0.GRA','JC0.GRA']))
ck('audit_boundaries',all(x in audit for x in ['manifest_no_new_palette','manifest_no_sibling_ownership','manifest_no_human_names']))
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o78_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o78SourceIntegrated':not failed,'threeFixtureBundleExposed':not failed,'newPaletteOwnershipPromoted':False,'siblingResourceOwnershipPromoted':False,'humanFighterNamesPromoted':False,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O78_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2));
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

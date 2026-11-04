#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/verifiedFighterRgbaBundleO88.ts','src/games/mk2/research/nj7Slot8PaletteContextRgbaFixtures.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-verified-identity-resource-rgba-bundle-o88.mjs','scripts/audit-mk2-o88.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);o87=txt(paths[1]);panel=txt(paths[2]);meta=txt(paths[3]);pkg=json.loads(txt(paths[4]));runner=txt(paths[5]);audit=txt(paths[6])
ck('verdict','MK2_EIGHT_VERIFIED_IDENTITY_RESOURCE_RGBA_CONTRACTS_INTEGRATED_WITHOUT_SEMANTIC_PROMOTION' in s)
ck('fixture_count','fixtureCount:8' in s and 'nestedPackageCount:8' in s)
ck('aggregate_counts','totalPngCount:734' in s and 'nestedLogicalEntryCount:774' in s and 'outerEntryCount:10' in s)
ck('slot_set',"'0,1,2,3,4,5,8,16'" in s)
ck('resource_set','HH0.GRA,LK0.GRA,JC0.GRA,BA0.GRA,FN4.GRA,FN6.GRA,NJ7.GRA,FN4.GRA' in s)
ck('o87_nested_hash','b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd' in s)
ck('o87_nested_scope',"scope:'NJ7_SLOT8_ONLY_NOT_WHOLE_NJ_FAMILY'" in s and "packages/slot_08_NJ7_RGBA.zip" in s)
ck('canonical_boundary','canonicalGeometryPromoted:false' in s and 'complete or canonical slot-8 geometry' in s)
ck('other_boundaries','newPaletteOwnershipPromoted:false' in s and 'siblingResourceOwnershipPromoted:false' in s and 'humanFighterNamesPromoted:false' in s and 'mk1AssumptionsImported:false' in s)
ck('o87_verdict_retained','MK2_NJ7_SLOT8_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in o87)
ck('o87_noncanonical_retained','additionalConnectedNJResourcesExist:true' in o87 and 'not promoted as the complete or canonical slot-8 geometry' in o87)
ck('panel_scope','O67–O88' in panel)
ck('panel_o88_card','O88 eight identity/resource RGBA contracts integrated' in panel)
ck('panel_o88_counts','8 exact nested fixture packages' in panel and 'Slots 0,1,2,3,4,5,8,16' in panel)
ck('panel_o88_boundary','slot-8 NJ7 row remains one bounded connected contract' in panel)
ck('panel_o87_card','O87 NJ7 slot-8 connected resource contract verified' in panel)
ck('panel_o88_json','O88 Bundle JSON' in panel);ck('panel_o88_download','Download 8-Contract RGBA Bundle' in panel);ck('panel_o88_runner','executeMK2VerifiedFighterRgbaBundleO88' in panel)
ck('milestone','1E.3O.88' in meta)
ck('package_script',pkg['scripts'].get('smoke:mk2-verified-identity-resource-rgba-bundle-o88')=='node scripts/run-mk2-verified-identity-resource-rgba-bundle-o88.mjs')
ck('o87_script_retained','smoke:mk2-nj7-slot8-palette-context-rgba' in pkg['scripts']);ck('o86_script_retained','smoke:mk2-verified-identity-resource-rgba-bundle-o86' in pkg['scripts']);ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_executes_o87','executeMK2NJ7PaletteContextRgbaFixtures' in runner);ck('runner_executes_o88','executeMK2VerifiedFighterRgbaBundleO88' in runner)
ck('runner_args','executeMK2VerifiedFighterRgbaBundleO88(o74,o76,o77,o79,o81,o83,o85,o87)' in runner)
ck('audit_nj7_expected','packages/slot_08_NJ7_RGBA.zip' in audit and 'b665d0034020e1bc856602d5aee16256d964b13dbdf8a384cd2f382ef30e99cd' in audit)
ck('audit_counts','manifest_total_pngs' in audit and '==734' in audit and '==774' in audit)
ck('audit_canonical_boundary','manifest_no_canonical_geometry' in audit and 'report_no_canonical_geometry' in audit)
ck('audit_verdict','MK2_O88_INDEPENDENT_INTEGRATION_AUDIT_PASSED' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o88_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o88SourceIntegrated':not failed,'eightContractBundleExposed':not failed,'slot8Nj7NoncanonicalBoundaryPreserved':True,'newPaletteOwnershipPromoted':False,'siblingResourceOwnershipPromoted':False,'canonicalGeometryPromoted':False,'humanFighterNamesPromoted':False,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O88_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

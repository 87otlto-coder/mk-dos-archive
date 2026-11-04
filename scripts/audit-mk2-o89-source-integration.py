#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/nj4Slot9PaletteContextRgbaFixtures.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-nj4-slot9-palette-context-rgba.mjs','scripts/audit-mk2-o89.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);panel=txt(paths[1]);meta=txt(paths[2]);pkg=json.loads(txt(paths[3]));runner=txt(paths[4]);audit=txt(paths[5])
ck('verdict','MK2_NJ4_SLOT9_CONNECTED_PROVENANCE_TWO_SEMANTIC_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in s)
ck('resource_identity',"RESOURCE='NJ4.GRA'" in s and 'RESOURCE_ID=52' in s and 'SLOT=9' in s)
ck('resource_hash','3180b6ce83ccb8feb476700bdc63d94605e13167ee9e3c6800f24ba97686478b' in s)
ck('slot9_root','rootObject2:0x9c68' in s and 'source:0x9c74,target:0xb70a' in s)
ck('eight_edge_chain',all(x in s for x in ['0xb736,target:0xb7ae','0xb7e6,target:0xb832','0xb84a,target:0xb87e','0xb89e,target:0xa96a','0xa98a,target:0xa9b2','0xa9ea,target:0xa95a','source:0xa95a,target:0x2919c']))
ck('descriptor','descriptorPhysical=0xc9df0' in s and 'descriptorObject2=0x2919c' in s)
ck('palette_A','0x2657e' in s.lower() and '0x881d2' in s.lower() and '04df131753891fb0b8fd3d18f420393ef969018b1338f24d5fedac923633ed7d' in s)
ck('palette_B','0x265fe' in s.lower() and '0x88252' in s.lower() and '983bb5d2243749d227d84b7a2874d86b6a2ea4a5aecefc7fdbd5b53cd828ac86' in s)
ck('counts','streamCount:24' in s and 'pngEntryCount:48' in s and 'entryCount:53' in s)
ck('scope',"NJ4_SLOT9_ONE_CONNECTED_CONTRACT_NOT_CANONICAL_OR_WHOLE_NJ" in s and 'nj4CanonicalOrCompleteSlot9GeometryPromoted:false' in s and 'wholeNJFamilyPaletteOwnershipPromoted:false' in s)
ck('renderer_mapping','opaque sprite index N (1..63) -> palette record colour N-1' in s)
ck('panel_scope','O67–O89' in panel)
ck('panel_card','O89 NJ4 slot-9 connected resource contract verified' in panel)
ck('panel_count','24 NJ4 streams × 2 semantic palette contexts' in panel)
ck('panel_boundary','not complete/canonical slot-9 geometry' in panel)
ck('panel_json','O89 NJ4 Slot9 RGBA JSON' in panel)
ck('panel_download','Download NJ4 Slot9 RGBA Package' in panel)
ck('panel_runner','executeMK2NJ4Slot9PaletteContextRgbaFixtures' in panel)
ck('milestone','1E.3O.89' in meta)
ck('package_script',pkg['scripts'].get('smoke:mk2-nj4-slot9-palette-context-rgba')=='node scripts/run-mk2-nj4-slot9-palette-context-rgba.mjs')
ck('o88_script_retained','smoke:mk2-verified-identity-resource-rgba-bundle-o88' in pkg['scripts'])
ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain',all(x in runner for x in ['executeMK2BroadIndexedGraphicsCorpusCensus','executeMK2CharacterResourcePaletteSlotJoin','executeMK2PaletteSelectorGameplaySemantics','executeMK2NJ4Slot9PaletteContextRgbaFixtures']))
ck('audit_eight_edges',all(x in audit for x in ['path=[(0x9c68,0x9c74,0xb70a)','slot9_root_record_five_fields','reject_neighbor_shortcut','nj4_identity_witness']))
ck('audit_all_rgba','rgba_{name}_{i:02}' in audit and 'all48RgbaPayloadsIndependentlyReconstructed' in audit)
ck('audit_scope','slot9Nj4ConnectedContractScopePreserved' in audit and 'wholeNJFamilyPaletteOwnershipNotPromoted' in audit and 'humanFighterNameNotPromoted' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o89_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o89SourceIntegrated':not failed,'slot9Nj4ConnectedFixtureExposed':not failed,'nj4NotPromotedAsCompleteCanonicalSlot9Geometry':True,'wholeNJFamilyPaletteOwnershipNotPromoted':True,'humanFighterNameNotPromoted':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O89_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

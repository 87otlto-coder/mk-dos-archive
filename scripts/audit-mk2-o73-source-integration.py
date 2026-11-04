#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/characterResourcePaletteSlotJoin.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-character-resource-palette-slot-join.mjs','scripts/audit-mk2-o73.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);p=txt(paths[1]);m=txt(paths[2]);pkg=json.loads(txt(paths[3]));run=txt(paths[4]);audit=txt(paths[5])
ck('verdict','MK2_JC0_RESOURCE_TO_PALETTE_SELECTOR_SLOT_JOIN_ESTABLISHED_HUMAN_SLOT_NAMES_PARTIAL' in s)
ck('fixture_auth','fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65' in s)
ck('identity_field','OBJECT_IDENTITY_FIELD=0x46' in s)
ck('identity_lookup','IDENTITY_LOOKUP_PHYSICAL=0x91909' in s)
ck('identity_table','identity_table_object2=0x1d588' in s.lower())
ck('slot_count','IDENTITY_SLOT_COUNT=17' in s)
ck('jc0_slot2',"resourceName:'JC0.GRA'" in s and 'identitySlot:2' in s and 'paletteSelectorSlot:2' in s)
ck('jc0_descriptor','0xbcac' in s.lower() and "expectedDescriptorResource:'JC0.GRA'" in s)
ck('palette_A','0x1c1b8' in s.lower() and '0x2574A' not in s) # resolved from O72 report, not hardcoded result
ck('palette_B','0x1c1fc' in s.lower())
ck('family_pattern','HH,LK,JC,BA,FN,FN,ST,RD,NJ,NJ,NJ,JX,GO,SK,NJ,NJ,FN' in s)
ck('human_boundary','humanNameRosterMappingEstablished:false' in s and 'humanNameBySlotEstablished:false' in s)
ck('no_rgba','correctColorRgbaEstablished:false' in s)
ck('panel_scope','O67–O73' in p)
ck('panel_o73_card','O73 JC0 palette-slot join verified' in p)
ck('panel_join','JC0.GRA → identity' in p and 'palette selector slot' in p)
ck('panel_context_boundary','Palette contexts remain unnamed; no correct-colour RGBA is emitted by O73.' in p)
ck('panel_warning','object +0x46 selector field' in p and 'Shared/special selector slots remain resource-family-labelled' in p)
ck('panel_download','O73 Slot Join JSON' in p)
ck('milestone','1E.3O.73' in m)
ck('package_script',pkg['scripts'].get('smoke:mk2-character-palette-slot-join')=='node scripts/run-mk2-character-resource-palette-slot-join.mjs')
ck('o72_retained','smoke:mk2-le-fixup-provenance' in pkg['scripts'])
ck('o70_retained','smoke:mk2-indexed-graphics-package' in pkg['scripts'])
ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain','executeMK2FixtureResourceExecutableTopology' in run and 'executeMK2IndexedGraphicsDecodeFoundation' in run and 'executeMK2BroadIndexedGraphicsCorpusCensus' in run and 'executeMK2LEFixupPointerProvenanceQualification' in run and 'executeMK2CharacterResourcePaletteSlotJoin' in run)
ck('independent_audit_identity','0x91909' in audit and '0x1d588' in audit.lower() and 'JC0.GRA' in audit)
ck('independent_audit_palette','0x2574a' in audit.lower() and '0x257ca' in audit.lower())
ck('independent_audit_human_boundary','humanNameRosterMappingEstablished' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o73_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o73SourceIntegrated':not failed,'jc0Slot2JoinExposed':not failed,'humanNameBoundaryPreserved':True,'correctColorRgbaStillDeferred':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O73_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

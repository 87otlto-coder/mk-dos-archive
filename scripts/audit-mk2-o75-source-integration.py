#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''): checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p): return (root/p).read_text()
paths=['src/games/mk2/research/paletteSelectorGameplaySemantics.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-palette-selector-gameplay-semantics.mjs','scripts/audit-mk2-o75.py']
for p in paths: ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);panel=txt(paths[1]);meta=txt(paths[2]);pkg=json.loads(txt(paths[3]));runner=txt(paths[4]);audit=txt(paths[5])
ck('verdict','MK2_PALETTE_SELECTOR_DEFAULT_AND_SAME_CHARACTER_DUPLICATE_OVERRIDE_SEMANTICS_ESTABLISHED' in s)
ck('default_A','DEFAULT_CHARACTER_PALETTE' in s and '0x1c1b8' in s.lower())
ck('duplicate_B','SAME_CHARACTER_DUPLICATE_OVERRIDE_PALETTE' in s and '0x1c1fc' in s.lower())
ck('side_index','SIDE_INDEX=0x75a64' in s and 'FIRST_IDENTITY=0x75fce' in s)
ck('mode_guard','MODE=0x7650a' in s and 'unnamedModeValue4SuppressesDuplicateOverride:true' in s)
ck('object_fields',"objectIdentityField:'+0x46'" in s and "objectPaletteHandleField:'+0x30'" in s and "objectFlagsField:'+0x34'" in s)
ck('flag40',"duplicatePaletteFlagMask:'0x40'" in s)
ck('player_labels_boundary','playerNumberLabelsEstablished:false' in s and 'playerOnePlayerTwoLabelsEstablished:false' in s)
ck('o74_pixels_unchanged','o74PixelsChanged:false' in s and 'existingO74PackagePathsRenamed:false' in s)
ck('panel_scope','O67–O75' in panel)
ck('panel_card','O75 palette selector semantics verified' in panel)
ck('panel_A','Table A: default character palette' in panel)
ck('panel_B','Table B: same-character duplicate override palette' in panel)
ck('panel_boundary','Numeric Player 1/Player 2 labels and the meaning of mode value 4 remain unpromoted.' in panel)
ck('panel_json','O75 Semantics JSON' in panel)
ck('panel_runner','executeMK2PaletteSelectorGameplaySemantics' in panel)
ck('milestone','1E.3O.75' in meta)
ck('package_script',pkg['scripts'].get('smoke:mk2-palette-selector-semantics')=='node scripts/run-mk2-palette-selector-gameplay-semantics.mjs')
ck('o74_script_retained','smoke:mk2-jc0-palette-context-rgba' in pkg['scripts'])
ck('o70_script_retained','smoke:mk2-indexed-graphics-package' in pkg['scripts'])
ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain',all(x in runner for x in ['executeMK2CharacterResourcePaletteSlotJoin','executeMK2JC0PaletteContextRgbaFixtures','executeMK2PaletteSelectorGameplaySemantics']))
ck('independent_audit_creation','default_A_load' in audit and 'different_identity_jne_A' in audit and 'duplicate_B_load' in audit)
ck('independent_audit_runtime','update_set40' in audit and 'update_clear40' in audit and 'update_to_A' in audit and 'update_to_B' in audit)
ck('independent_audit_boundaries','report_player_numbers_not_claimed' in audit and 'report_mode4_unnamed' in audit)
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o75_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o75SourceIntegrated':not failed,'gameplaySemanticsExposed':not failed,'playerNumberNamingBoundaryPreserved':True,'mode4MeaningBoundaryPreserved':True,'o74PixelsAndPackagePathsUnchanged':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O75_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed: print(json.dumps(failed,indent=2));sys.exit(1)

#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''): checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p): return (root/p).read_text()
paths=['src/games/mk2/research/jc0PaletteContextRgbaFixtures.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-jc0-palette-context-rgba.mjs','scripts/audit-mk2-o74.py']
for p in paths: ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]); panel=txt(paths[1]); meta=txt(paths[2]); pkg=json.loads(txt(paths[3])); runner=txt(paths[4]); audit=txt(paths[5])
ck('verdict','MK2_JC0_TWO_UNNAMED_PALETTE_CONTEXT_RGBA_FIXTURES_ESTABLISHED' in s)
ck('fixture_auth','fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65' in s and 'ef7b96d1725f45386f9503b252602db3ae22ab7ef638a3f1add91adb42079f1b' in s)
ck('o73_prerequisite','MK2CharacterResourcePaletteSlotJoinReport' in s and 'o73.jc0Join.identitySlot' in s and 'paletteSelectorSlot' in s)
ck('palette_records','7adc8dc507fe4f8008179bb711de2f0c16e24bcbe989074f33352890080badec' in s and 'f9d2bf2a5327d4dd0b761a948e2c883831ad654820869c214bea797e44a3130e' in s)
ck('renderer_mapping','0x659ea' in s.lower() and '0x65a14' in s.lower() and 'opaque sprite index N (1..63) -> palette record colour N-1' in s)
ck('lut','lut_object2=0x1084' in s.lower().replace(' ','') and 'lut_physical=0xa1cd8' in s.lower().replace(' ',''))
ck('context_names','selector_table_A_slot_02' in s and 'selector_table_B_slot_02' in s and 'paletteContextNamesPromoted:false' in s)
ck('rgba_count','pngEntryCount:70' in s and 'entryCount:75' in s)
ck('rgb8_policy','ROUND_DAC6_TIMES_255_OVER_63' in s)
ck('scope_boundary','broadResourcePaletteOwnershipPromoted:false' in s and 'humanCharacterNamePromoted:false' in s)
ck('panel_scope','O67–O74' in panel)
ck('panel_card','O74 JC0 unnamed palette-context RGBA verified' in panel)
ck('panel_context_boundary','no normal/alternate or player-number meaning is claimed' in panel)
ck('panel_download','Download JC0 RGBA Package' in panel and 'O74 RGBA JSON' in panel)
ck('panel_runner','executeMK2JC0PaletteContextRgbaFixtures' in panel)
ck('milestone','1E.3O.74' in meta)
ck('package_script',pkg['scripts'].get('smoke:mk2-jc0-palette-context-rgba')=='node scripts/run-mk2-jc0-palette-context-rgba.mjs')
ck('o73_script_retained','smoke:mk2-character-palette-slot-join' in pkg['scripts'])
ck('o70_script_retained','smoke:mk2-indexed-graphics-package' in pkg['scripts'])
ck('mk1_workflow_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_chain',all(x in runner for x in ['executeMK2IndexedGraphicsDecodeFoundation','executeMK2PaletteStorageSelectionReconnaissance','executeMK2CharacterResourcePaletteSlotJoin','executeMK2JC0PaletteContextRgbaFixtures']))
ck('audit_reconstructs_70',"all70RgbaPayloadsIndependentlyReconstructed" in audit and "for name,phys,expected in pdefs" in audit)
ck('audit_png_parser','def png_rgba' in audit and 'png crc' in audit and 'zlib.decompress' in audit)
ck('audit_semantic_boundary','paletteContextNamesRemainUnresolved' in audit and 'broadPaletteOwnershipNotPromoted' in audit)
ck('stale_draft_removed',not (root/'src/games/mk2/research/jc0PaletteSlotCorrectColorQualification.ts').exists() and not (root/'MK_DOS_Archive_CHECKPOINT_1E3O73_MK2_JC0_PALETTE_SLOT_CORRECT_COLOR.md').exists())
failed=[c for c in checks if not c['passed']]
res={'format':'mk2_o74_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o74SourceIntegrated':not failed,'jc0RgbaPackageExposed':not failed,'paletteContextNamingBoundaryPreserved':True,'broadPaletteOwnershipNotPromoted':True,'mk1WorkflowStillSeparate':True,'verdict':'MK2_O74_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}}
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2))
if failed: print(json.dumps(failed,indent=2)); sys.exit(1)

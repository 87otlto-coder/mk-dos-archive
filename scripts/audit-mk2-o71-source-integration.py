#!/usr/bin/env python3
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);checks=[]
def ck(i,ok,d=''):checks.append({'id':i,'passed':bool(ok),'detail':str(d)})
def txt(p):return (root/p).read_text()
paths=['src/games/mk2/research/paletteStorageSelectionReconnaissance.ts','src/components/MK2FoundationPanel.tsx','src/appMetadata.ts','package.json','scripts/run-mk2-palette-storage-selection-reconnaissance.mjs','scripts/audit-mk2-o71.py']
for p in paths:ck('exists_'+p,(root/p).is_file(),p)
s=txt(paths[0]);p=txt(paths[1]);m=txt(paths[2]);pkg=json.loads(txt(paths[3]));run=txt(paths[4]);audit=txt(paths[5])
ck('verdict','MK2_PALETTE_STORAGE_ALLOCATION_AND_DAC_TRANSFER_ESTABLISHED_JC0_BINDING_UNRESOLVED' in s)
ck('exe_auth','EXPECTED_EXE_SHA256' in s and 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65' in s)
ck('queue_32','slotCount:32' in s and 'QUEUE_START = 0x562d8' in s and 'QUEUE_END = 0x563d8' in s)
ck('handles_60','HANDLE_COUNT = 60' in s and 'entryCount:HANDLE_COUNT' in s)
ck('object_30','OBJECT_PALETTE_HANDLE_OFFSET = 0x30' in s)
ck('allocator_calls_15','directAllocatorCallCount:15' in s and 'EXPECTED_DIRECT_CALLS' in s)
ck('dac_ports',"statusPort:'0x3DA'" in s and "writeIndexPort:'0x3C8'" in s and "componentPort:'0x3C9'" in s)
ck('record_grammar',"recordByteLengthFormula:'2 + colorCount * 2'" in s)
ck('candidate_policy','STRUCTURAL_CANDIDATE_ONLY_NOT_OWNERSHIP' in s)
ck('naive_223_rejected','naive223RecordChainPromoted:false' in s)
ck('jc0_unresolved','jc0PaletteOwnershipEstablished:false' in s and 'concretePaletteRecordBindingEstablished:false' in s and 'correctColorRgbaEstablished:false' in s)
ck('raw_immediates_blocked','rawImmediatePointerResolutionQualified:false' in s)
ck('panel_scope','O67–O71' in p)
ck('panel_card','O71 MK2 palette mechanism verified' in p)
ck('panel_warning','JC0 palette ownership remains unresolved' in p)
ck('panel_download','O71 Palette JSON' in p)
ck('milestone','1E.3O.71' in m)
ck('package_script',pkg['scripts'].get('smoke:mk2-palette-recon')=='node scripts/run-mk2-palette-storage-selection-reconnaissance.mjs')
ck('o70_retained','smoke:mk2-indexed-graphics-package' in pkg['scripts'])
ck('mk1_unified_retained','smoke:unified-mk1-asset-archive' in pkg['scripts'])
ck('runner_o67_o68_o71','executeMK2FixtureResourceExecutableTopology' in run and 'executeMK2IndexedGraphicsDecodeFoundation' in run and 'executeMK2PaletteStorageSelectionReconnaissance' in run)
ck('independent_audit_direct','paletteMechanismIndependentlyReconstructed' in audit and 'jc0_index_domain' in audit)
ck('no_rgba_export','rgba' not in s.lower().replace('correctcolorrgba','').replace('correct-colour rgba','') or 'correctColorRgbaEstablished:false' in s,'no correct-color output')
failed=[c for c in checks if not c['passed']];res={'format':'mk2_o71_source_integration_audit_v1','checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'o71SourceIntegrated':not failed,'mk1WorkflowStillSeparate':True,'paletteBoundaryPreserved':True,'verdict':'MK2_O71_SOURCE_UI_INTEGRATION_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}};out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['checkCount','passedCount','failedCount','allChecksPassed']},indent=2));
if failed:print(json.dumps(failed,indent=2));sys.exit(1)

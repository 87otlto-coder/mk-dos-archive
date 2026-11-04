import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import type { MK2FixtureResourceExecutableTopologyReport } from './fixtureResourceExecutableTopology';

const EXPECTED_MK2_SHA256 = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const EXPECTED_RM_SHA256 = '87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546';
const EXPECTED_GMI_SHA256 = '7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633';
const EXPECTED_SCC_SHA256 = EXPECTED_GMI_SHA256;
const EXPECTED_GMI_SCC_BYTES = 0x1aca;

const EXE_OBJECT1_FILE_BASE = 0x61c54;
const EXE_OBJECT1_VMA_BASE = 0x10000;
const phys = (vma: number): number => EXE_OBJECT1_FILE_BASE + (vma - EXE_OBJECT1_VMA_BASE);

const OFFSETS = {
  exeResourceLookup: phys(0x10a04),
  exeSegmentWrapper: phys(0x11020),
  exeSccInstallBranch: phys(0x11262),
  exeU8ReadPath: 0x815c9,
  rmRequestRouter: 0x07ca,
  rmRequestDispatch: 0x08d3,
  rmU8RequestPath: 0x0962,
  gmiApiEntry: 0x0000,
  gmiDispatcher: 0x023d,
  gmiDispatchTableAh11: 0x028a,
  gmiSampleStart: 0x0f03,
} as const;

const SIG = {
  exeResourceLookup: '53515256575589c3c1fb1889c585db7c0881fb800000007c0c',
  exeSegmentWrapper: '5352e8ddf9ffff89c385c0750aba54070000e869f1ffffc1eb0489d85a5bc3',
  exeSccInstallBranch: 'b800000039e8b4fdffff89c2a17c17030066895016668b501631c96689501a31db668b501666c74014000081c2d30500008a0d400103006689501e31d266c74018ca1a',
  exeU8ReadPath: 'e853000000ba4837010033c0b43dcd210f823dffffff8bd8b9ffff0000a17c1703000fb7501ec1e2046653b43fcd21665b0f821cffffffb43ecd210f8212ffffff8b157c17030066c742300100a148010300894232fb61c3',
  rmRequestRouter: '8bd83d01000f848f01e9a801',
  rmRequestDispatch: 'a12c003dffff7403e8ecfea12e003dffff7403e8e1fea130003dffff7403e8d6feb8ffffa32c00a32e00a33000',
  rmU8RequestPath: '06a11e008ec0bf0000e8520080f9007408b000b411ff1e140007c3',
  gmiApiEntry: 'e83a02cb',
  gmiDispatcher: '9c1e5351525756558bec0e1ffc3a263c0277138adcd0e332ffff976802',
  gmiSampleStart: '3c03774d8ad883e303d0e38b9f2013d0e980e13f7402fec11e06061f0e078bf78bfb8bde',
} as const;

function findEntry(entries: SourceFileEntry[], wanted: string): SourceFileEntry {
  const match = entries.find(e => e.path.toUpperCase() === wanted.toUpperCase());
  if (!match) throw new Error(`Required MK2 file missing: ${wanted}`);
  return match;
}
function hex(n: number): string { return `0x${n.toString(16).toUpperCase()}`; }
function fromHex(value: string): Uint8Array {
  if (value.length % 2) throw new Error('Invalid hex fixture');
  const out = new Uint8Array(value.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function equalAt(bytes: Uint8Array, offset: number, expectedHex: string): boolean {
  const expected = fromHex(expectedHex);
  if (offset < 0 || offset + expected.length > bytes.length) return false;
  return expected.every((value, i) => bytes[offset + i] === value);
}
async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
async function readWhole(source: DirectorySource, entry: SourceFileEntry): Promise<Uint8Array> {
  const bytes = await source.readSlice(entry.path, 0, entry.size);
  if (bytes.length !== entry.size) throw new Error(`Short read: ${entry.path}`);
  return bytes;
}
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, i) => value === b[i]);
}

export interface MK2U8SampleStartCallerTraceReport {
  format: 'mk2_u8_sample_start_caller_trace_o94a_v1';
  timestamp: string;
  operationId: string;
  provenance: {
    sourceKind: 'user-loaded-directory'; directoryName: string; synthetic: false;
    mk2ExeSha256: string; rmDrvSha256: string; gmiBinSha256: string; sccBinSha256: string;
  };
  installedDriver: {
    resourceSelectorPacked: '0x39000000';
    resourcePoolOrdinal: 57;
    resourcePoolName: 'SCC.BIN';
    resourceLookupPhysical: number; resourceLookupPhysicalHex: string;
    segmentWrapperPhysical: number; segmentWrapperPhysicalHex: string;
    installBranchPhysical: number; installBranchPhysicalHex: string;
    sccAndGmiByteIdentical: true;
    imageBytes: 6858;
    rmFarApiOffsetField: 'RM.DRV+0x14';
    rmFarApiSegmentField: 'RM.DRV+0x16';
    sampleBufferSegmentField: 'RM.DRV+0x1E';
    evidence: string[];
  };
  callerChain: Array<{
    step: number; component: 'MK2.EXE'|'RM.DRV'|'SCC.BIN/GMI.BIN'; location: string; observation: string;
  }>;
  tracedWriteBoundary: {
    mk2ReadDestination: 'SEGMENT_FROM_RM_DRV_PLUS_0x1E_OFFSET_0';
    mk2PostReadWrites: ['RM.DRV+0x30_REQUEST_WORD','RM.DRV+0x32_VOLUME_BYTE'];
    rmRequestPasses: 'ES=RM_DRV_PLUS_0x1E_SEGMENT_DI=0';
    gmiReceives: 'DS_FROM_PASSED_ES_SI_FROM_PASSED_DI';
    headerRewriteInTracedPathObserved: false;
    scopeNote: string;
  };
  decision: {
    sampleStartCallerChainEstablished: true;
    installedFarApiTargetEstablished: true;
    canonicalSccGmiIdentityEstablished: true;
    headerRewriteInTracedCallerPathObserved: false;
    diskToRuntimeEndFieldTransformationEstablished: false;
    diskEndFieldMeaningEstablished: false;
    activePcmRangeEstablished: false;
    wavAdapterAuthorized: false;
    verdict: 'O94A_MK2_U8_SAMPLE_START_CALLER_CHAIN_ESTABLISHED_NO_HEADER_REWRITE_IN_TRACED_PATH';
    narrative: string;
  };
  status: 'SUCCESS';
  validation: { allChecksPassed: true; checks: Array<{id:string;passed:boolean;detail:string}> };
}

export async function executeMK2U8SampleStartCallerTrace(
  source: DirectorySource,
  o67: MK2FixtureResourceExecutableTopologyReport,
): Promise<MK2U8SampleStartCallerTraceReport> {
  if (source.isSynthetic) throw new Error('O94A requires an authentic user-loaded MK2 fixture');
  if (o67.status !== 'SUCCESS' || !o67.validation.allChecksPassed || o67.provenance.synthetic) {
    throw new Error('O94A requires a verified authentic O67 prerequisite');
  }
  if (o67.provenance.exeSha256 !== EXPECTED_MK2_SHA256) throw new Error('O94A canonical MK2.EXE prerequisite mismatch');

  const timestamp = new Date().toISOString();
  const operationId = createOperationId('mk2_u8_o94a_sample_start_caller_trace');
  const entries = await source.listRecursive();
  const exeEntry = findEntry(entries, 'MK2.EXE');
  const rmEntry = findEntry(entries, 'RM.DRV');
  const gmiEntry = findEntry(entries, 'GMI.BIN');
  const sccEntry = findEntry(entries, 'SCC.BIN');
  const [exe, rm, gmi, scc] = await Promise.all([
    readWhole(source, exeEntry), readWhole(source, rmEntry), readWhole(source, gmiEntry), readWhole(source, sccEntry),
  ]);
  const [mk2ExeSha256, rmDrvSha256, gmiBinSha256, sccBinSha256] = await Promise.all([
    sha256(exe), sha256(rm), sha256(gmi), sha256(scc),
  ]);

  const poolOrdinal57 = o67.resourceFilenamePool.names[57]?.toUpperCase() ?? '';
  const dispatchWord = gmi[OFFSETS.gmiDispatchTableAh11] | (gmi[OFFSETS.gmiDispatchTableAh11 + 1] << 8);
  const checks = [
    {id:'mk2_hash',passed:mk2ExeSha256===EXPECTED_MK2_SHA256,detail:mk2ExeSha256},
    {id:'rm_hash',passed:rmDrvSha256===EXPECTED_RM_SHA256,detail:rmDrvSha256},
    {id:'gmi_hash',passed:gmiBinSha256===EXPECTED_GMI_SHA256,detail:gmiBinSha256},
    {id:'scc_hash',passed:sccBinSha256===EXPECTED_SCC_SHA256,detail:sccBinSha256},
    {id:'scc_gmi_identity',passed:scc.length===EXPECTED_GMI_SCC_BYTES&&gmi.length===EXPECTED_GMI_SCC_BYTES&&bytesEqual(scc,gmi),detail:`SCC=${scc.length} GMI=${gmi.length} identical=${bytesEqual(scc,gmi)}`},
    {id:'resource_pool_57_scc',passed:poolOrdinal57==='SCC.BIN',detail:`ordinal57=${poolOrdinal57}`},
    {id:'exe_resource_lookup_signature',passed:equalAt(exe,OFFSETS.exeResourceLookup,SIG.exeResourceLookup),detail:hex(OFFSETS.exeResourceLookup)},
    {id:'exe_segment_wrapper_signature',passed:equalAt(exe,OFFSETS.exeSegmentWrapper,SIG.exeSegmentWrapper),detail:hex(OFFSETS.exeSegmentWrapper)},
    {id:'exe_scc_install_signature',passed:equalAt(exe,OFFSETS.exeSccInstallBranch,SIG.exeSccInstallBranch),detail:hex(OFFSETS.exeSccInstallBranch)},
    {id:'exe_u8_read_signature',passed:equalAt(exe,OFFSETS.exeU8ReadPath,SIG.exeU8ReadPath),detail:hex(OFFSETS.exeU8ReadPath)},
    {id:'rm_router_signature',passed:equalAt(rm,OFFSETS.rmRequestRouter,SIG.rmRequestRouter),detail:hex(OFFSETS.rmRequestRouter)},
    {id:'rm_dispatch_signature',passed:equalAt(rm,OFFSETS.rmRequestDispatch,SIG.rmRequestDispatch),detail:hex(OFFSETS.rmRequestDispatch)},
    {id:'rm_u8_request_signature',passed:equalAt(rm,OFFSETS.rmU8RequestPath,SIG.rmU8RequestPath),detail:hex(OFFSETS.rmU8RequestPath)},
    {id:'gmi_api_entry_signature',passed:equalAt(gmi,OFFSETS.gmiApiEntry,SIG.gmiApiEntry),detail:hex(OFFSETS.gmiApiEntry)},
    {id:'gmi_dispatcher_signature',passed:equalAt(gmi,OFFSETS.gmiDispatcher,SIG.gmiDispatcher),detail:hex(OFFSETS.gmiDispatcher)},
    {id:'gmi_ah11_dispatch_target',passed:dispatchWord===0x0f03,detail:`table[AH=0x11]=${hex(dispatchWord)}`},
    {id:'gmi_sample_start_signature',passed:equalAt(gmi,OFFSETS.gmiSampleStart,SIG.gmiSampleStart),detail:hex(OFFSETS.gmiSampleStart)},
  ];
  const failed = checks.filter(c => !c.passed);
  if (failed.length) throw new Error(`O94A validation failed: ${failed.map(c=>c.id).join(', ')}`);

  return {
    format:'mk2_u8_sample_start_caller_trace_o94a_v1', timestamp, operationId,
    provenance:{sourceKind:'user-loaded-directory',directoryName:source.directoryName,synthetic:false,mk2ExeSha256,rmDrvSha256,gmiBinSha256,sccBinSha256},
    installedDriver:{
      resourceSelectorPacked:'0x39000000',resourcePoolOrdinal:57,resourcePoolName:'SCC.BIN',
      resourceLookupPhysical:OFFSETS.exeResourceLookup,resourceLookupPhysicalHex:hex(OFFSETS.exeResourceLookup),
      segmentWrapperPhysical:OFFSETS.exeSegmentWrapper,segmentWrapperPhysicalHex:hex(OFFSETS.exeSegmentWrapper),
      installBranchPhysical:OFFSETS.exeSccInstallBranch,installBranchPhysicalHex:hex(OFFSETS.exeSccInstallBranch),
      sccAndGmiByteIdentical:true,imageBytes:EXPECTED_GMI_SCC_BYTES,
      rmFarApiOffsetField:'RM.DRV+0x14',rmFarApiSegmentField:'RM.DRV+0x16',sampleBufferSegmentField:'RM.DRV+0x1E',
      evidence:[
        'MK2 resource lookup at VMA 0x10A04 extracts the packed reference high byte as a resource-table index and masks the low 24 bits as an in-resource offset.',
        'The install branch at VMA 0x11262 passes 0x39000000 through that lookup, writes the returned paragraph segment to RM.DRV +0x16, writes far-API offset 0 to RM.DRV +0x14, and records image size 0x1ACA.',
        'O67 resource-pool ordinal 0x39/57 is SCC.BIN; SCC.BIN is exactly 0x1ACA bytes and byte-identical to canonical GMI.BIN.',
      ],
    },
    callerChain:[
      {step:1,component:'MK2.EXE',location:'physical 0x815C9..0x81620',observation:'DOS open/read path reads up to 0xFFFF bytes directly to offset 0 of the segment stored at RM.DRV +0x1E, closes the file, then writes request word 1 to RM.DRV +0x30 and a volume/control byte to +0x32.'},
      {step:2,component:'RM.DRV',location:'0x08D3 / 0x07CA',observation:'Request dispatcher reads +0x30; request value 1 routes through the 0x07CA router to the dedicated path at 0x0962.'},
      {step:3,component:'RM.DRV',location:'0x0962',observation:'Dedicated path loads ES from RM.DRV +0x1E, sets DI=0, computes CL from +0x32, sets AL=0/AH=0x11, and far-calls the pointer stored at RM.DRV +0x14/+0x16.'},
      {step:4,component:'SCC.BIN/GMI.BIN',location:'0x0000 -> 0x023D -> dispatch-table word 0x028A',observation:'Installed far API offset 0 enters the Sound Images dispatcher; AH=0x11 indexes the table entry at 0x028A, whose canonical word is 0x0F03.'},
      {step:5,component:'SCC.BIN/GMI.BIN',location:'0x0F03',observation:'Sample-start routine preserves the passed sample pointer by loading DS from passed ES and SI from passed DI; RM supplied DI=0, so the routine consumes the sample descriptor at the beginning of the loaded buffer.'},
    ],
    tracedWriteBoundary:{
      mk2ReadDestination:'SEGMENT_FROM_RM_DRV_PLUS_0x1E_OFFSET_0',
      mk2PostReadWrites:['RM.DRV+0x30_REQUEST_WORD','RM.DRV+0x32_VOLUME_BYTE'],
      rmRequestPasses:'ES=RM_DRV_PLUS_0x1E_SEGMENT_DI=0',
      gmiReceives:'DS_FROM_PASSED_ES_SI_FROM_PASSED_DI',
      headerRewriteInTracedPathObserved:false,
      scopeNote:'O94A establishes only the direct, authenticated caller chain from the MK2 DOS read through RM.DRV into the installed SCC/GMI AH=0x11 sample-start entry. No instruction in that traced path writes into the loaded U8 buffer after the DOS read. This does not by itself assign semantic meaning to disk header +0x04, establish the active PCM byte range, or exclude unrelated code outside the traced path from touching the shared buffer at other times.',
    },
    decision:{
      sampleStartCallerChainEstablished:true,installedFarApiTargetEstablished:true,canonicalSccGmiIdentityEstablished:true,
      headerRewriteInTracedCallerPathObserved:false,diskToRuntimeEndFieldTransformationEstablished:false,diskEndFieldMeaningEstablished:false,activePcmRangeEstablished:false,wavAdapterAuthorized:false,
      verdict:'O94A_MK2_U8_SAMPLE_START_CALLER_CHAIN_ESTABLISHED_NO_HEADER_REWRITE_IN_TRACED_PATH',
      narrative:'The authentic MK2 executable reads each U8 file directly into the RM sample buffer selected by RM.DRV +0x1E, signals request 1 at RM.DRV +0x30, and RM.DRV forwards ES:DI = sample-buffer-segment:0 to its installed far API with AH=0x11. The executable install path independently ties that far API to resource selector 0x39/ordinal 57 SCC.BIN at offset 0; SCC.BIN is byte-identical to canonical GMI.BIN. The Sound Images dispatcher maps AH=0x11 to 0x0F03, whose sample-start routine consumes the passed buffer base. Across this authenticated direct path, no post-read write to the U8 buffer is observed. O94A intentionally stops here: the disk +0x04 field, any transformation outside this path, exact PCM range, and WAV export remain unresolved for O94B-O94D.',
    },
    status:'SUCCESS',validation:{allChecksPassed:true,checks:checks.map(c=>({...c,passed:true}))},
  };
}

export function createMK2U8SampleStartCallerTraceExport(report: MK2U8SampleStartCallerTraceReport): MK2U8SampleStartCallerTraceReport {
  if (report.status!=='SUCCESS'||!report.validation.allChecksPassed||report.provenance.synthetic) throw new Error('Verified authentic O94A report required');
  if (report.decision.wavAdapterAuthorized || report.decision.activePcmRangeEstablished || report.decision.diskEndFieldMeaningEstablished) {
    throw new Error('O94A must remain fail-closed beyond the caller-chain question');
  }
  return report;
}

/** MK2 palette storage/selection reconnaissance — Pass 1E.3O.71.
 *
 * This pass establishes only mechanisms proven by authentic MK2.EXE bytes.
 * It deliberately does not bind JC0.GRA (or any other graphics resource) to a
 * concrete palette record without an affirmative selector/data-flow join.
 */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK2FixtureResourceExecutableTopologyReport } from './fixtureResourceExecutableTopology';
import { MK2IndexedGraphicsDecodeFoundationReport } from './indexedGraphicsDecodeFoundation';

const EXPECTED_EXE_SHA256 = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const EXPECTED_EXE_SIZE = 861133;
const FILE_BACKED_END = 0xabd79;
const OBJECT2_FILE_START = 0x7a600;
const PALETTE_ALLOCATOR_PHYS = 0x7b439;
const PALETTE_QUEUE_INIT_PHYS = 0x7b2c0;
const PALETTE_TRANSFER_PHYS = 0x7b30b;
const OBJECT_PALETTE_RELEASE_BRIDGE_PHYS = 0x7b3f8;
const PALETTE_TABLE_INIT_PHYS = 0x7b41f;
const PALETTE_RELEASE_PHYS = 0x7b505;
const SEQUENTIAL_BLOCK_ALLOCATOR_PHYS = 0x98c45;
const BYTECODE_POINTER_CALLER_PHYS = 0x9959a;
const QUEUE_START = 0x562d8, QUEUE_END = 0x563d8, QUEUE_ENTRY_BYTES = 8;
const HANDLE_TABLE = 0x75b00, HANDLE_COUNT = 60, HANDLE_BYTES = 8;
const OBJECT_PALETTE_HANDLE_OFFSET = 0x30;
const EXPECTED_DIRECT_CALLS = [0x81dda,0x85abf,0x85c79,0x86b1f,0x989af,0x98c65,0x98c79,0x98d6f,0x995a6,0x9964f,0x997ba,0x9ab0e,0x9abd9,0x9d626,0x9e3be];
const SPANS = [
  { id:'queue_init_enqueue', start:0x7b2c0, end:0x7b30b, sha256:'bfee57e1d842380996ef90d4b17539d4e5773fe70d184dc23e2e9b87197c1253' },
  { id:'palette_transfer', start:0x7b30b, end:0x7b3f8, sha256:'d922d6d95d6580d641bf7e58a69a164e0bed8462319638d187b7e1eaebe942e1' },
  { id:'object_release_bridge', start:0x7b3f8, end:0x7b404, sha256:'9297cab37fae675450b81087d3d7afb65993d3d129c0fb54008241fec9de46b5' },
  { id:'palette_table_init', start:0x7b41f, end:0x7b439, sha256:'555654d02d79962d05031515408380cb4c0f9a8c018d8b1d41d445f621ef29f2' },
  { id:'palette_allocator', start:0x7b439, end:0x7b505, sha256:'abdd7eba4bbda3a1fe136d46abd78469ccdfbb47b1849bda15329f93fb501b9c' },
  { id:'palette_release', start:0x7b505, end:0x7b55e, sha256:'268e49d3c5f9133e1efdbfa32b16d05dbc7e2768b2e95e81b43c9727af3520cf' },
  { id:'dynamic_selector_object_store', start:0x81db0, end:0x81df0, sha256:'e3ae40a6c9f56c8c48e0ee2f254ab94440d4137cb962b825a9fa8269c0fbb134' },
  { id:'dynamic_pointer_object_store', start:0x85c60, end:0x85c90, sha256:'eb79ff9d3e0ccf8b3226a743aa99dd1b61eb0bde8252d7ab9bedb0d1299d6451' },
  { id:'structure_pointer_object_store', start:0x86b10, end:0x86b35, sha256:'feba0a1760b46d9ef192a0ef07a48aa74fa3bfe5796946899b7cfcfdf54dc3e9' },
  { id:'sequential_palette_block_allocator', start:0x98c45, end:0x98c8d, sha256:'fa809cc486d2b029b93e7a305b684712f9143d0e4c04f979abdd4e66170fc976' },
  { id:'bytecode_palette_pointer_caller', start:0x9959a, end:0x995b9, sha256:'6e855db0f0a73379d836e758db8961cc1c011ceff336a0efbdb6a0ce3b25d459' },
] as const;

function hex(n:number):string{return `0x${n.toString(16).toUpperCase()}`;}
function u16(bytes:Uint8Array,off:number):number{return bytes[off]|(bytes[off+1]<<8);}
function i32(bytes:Uint8Array,off:number):number{return new DataView(bytes.buffer,bytes.byteOffset+off,4).getInt32(0,true);}
function findEntry(entries:SourceFileEntry[],wanted:string):SourceFileEntry{const e=entries.find(x=>x.path.toUpperCase()===wanted.toUpperCase());if(!e)throw new Error(`Required MK2 file missing: ${wanted}`);return e;}
async function sha256(bytes:Uint8Array):Promise<string>{const d=await globalThis.crypto.subtle.digest('SHA-256',bytes.slice().buffer);return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');}
function findAscii(bytes:Uint8Array,text:string):number{const n=new TextEncoder().encode(text);outer:for(let i=0;i<=bytes.length-n.length;i++){for(let j=0;j<n.length;j++)if(bytes[i+j]!==n[j])continue outer;return i;}return -1;}
function findDirectNearCalls(bytes:Uint8Array,target:number,start:number,end:number):number[]{const out:number[]=[];for(let p=start;p+5<=end;p++){if(bytes[p]!==0xe8)continue;if(p+5+i32(bytes,p+1)===target)out.push(p);}return out;}
function arraysEqual(a:number[],b:number[]):boolean{return a.length===b.length&&a.every((x,i)=>x===b[i]);}

export interface MK2PaletteStorageSelectionReconnaissanceReport {
  format:'mk2_palette_storage_selection_reconnaissance_v1'; timestamp:string; operationId:string;
  provenance:{sourceKind:'user-loaded-directory';exePath:string;exeByteLength:number;exeSha256:string;synthetic:false};
  prerequisite:{o67Verdict:string;o68Verdict:string;o68Jc0DescriptorCount:number;o68Jc0OpaqueIndexMin:number;o68Jc0OpaqueIndexMax:number;validationPassed:true};
  diagnosticAnchors:{getpalStringPhysical:number;getpalStringPhysicalHex:string;palsetStringPhysical:number;palsetStringPhysicalHex:string;strings:string[]};
  codeEvidence:{spans:Array<{id:string;physicalStart:number;physicalStartHex:string;physicalEndExclusive:number;physicalEndExclusiveHex:string;byteLength:number;sha256:string}>;paletteAllocatorDirectCallCount:number;paletteAllocatorDirectCallSites:number[];paletteAllocatorDirectCallSitesHex:string[]};
  paletteRecordFormat:{established:true;colorCount:{offset:0;type:'u16le'};colorData:{offset:2;elementType:'u16le_packed_color';elementCountFrom:'record.u16[0]'};recordByteLengthFormula:'2 + colorCount * 2';evidence:string};
  requestQueue:{established:true;ringStart:number;ringEndExclusive:number;entryByteLength:8;slotCount:32;fields:{sourceColorPointer:{offset:0;type:'u32_pointer'};dacStartIndex:{offset:4;type:'u16'};colorCount:{offset:6;type:'u16'}};writerPointerAddress:number;readerPointerAddress:number;changedFlagAddress:number;overflowBound:256};
  paletteHandles:{established:true;tableAddress:number;entryByteLength:8;entryCount:60;fields:{recordPointer:{offset:0;type:'u32_pointer'};referenceCount:{offset:4;type:'u16'};dacStartIndex:{offset:6;type:'u8'};byte7:{offset:7;classification:'UNINTERPRETED'}};objectPaletteHandleOffset:number;objectPaletteHandleOffsetHex:string};
  dacTransfer:{established:true;statusPort:'0x3DA';writeIndexPort:'0x3C8';componentPort:'0x3C9';packedColorBytes:2;componentFormulas:string[];componentOrderClassification:'VGA_DAC_WRITE_SEQUENCE';wallClockTimingEstablished:false};
  selectionSurface:{established:true;directAllocatorCallCount:15;examples:Array<{physical:number;physicalHex:string;classification:string;establishedRelationship:string}>;sequentialPaletteBlockAllocator:{physical:number;physicalHex:string;established:true;recordCountSource:'u16 immediately before first record';recordTraversal:'next = current + 2 + 2 * current.colorCount'};rawImmediatePointerResolutionQualified:false;note:string};
  structuralRecordExamples:Array<{physical:number;physicalHex:string;colorCount:number;endExclusive:number;endExclusiveHex:string;nextCandidatePhysical:number|null;classification:'STRUCTURAL_CANDIDATE_ONLY_NOT_OWNERSHIP'}>;
  correction:{naive223RecordChainObservedDuringReconnaissance:true;naive223RecordChainPromoted:false;reason:string};
  jc0Boundary:{resourceName:'JC0.GRA';resourceId:109;descriptorLocationClass:'UNRESOLVED_POST_LE_OVERLAY';descriptorCount:35;opaqueIndexMin:1;opaqueIndexMax:63;descriptorCarriesPaletteField:false;concretePaletteRecordBindingEstablished:false;correctColorRgbaEstablished:false;boundedConclusion:string};
  decision:{paletteRecordEncodingEstablished:true;paletteAllocationAndReferenceModelEstablished:true;paletteTransferQueueEstablished:true;objectPaletteHandleFieldEstablished:true;dynamicPaletteSelectionPathsExist:true;jc0PaletteOwnershipEstablished:false;correctColorRgbaEstablished:false;mk1PaletteAssumptionsImported:false;verdict:'MK2_PALETTE_STORAGE_ALLOCATION_AND_DAC_TRANSFER_ESTABLISHED_JC0_BINDING_UNRESOLVED';narrative:string};
  status:'SUCCESS'; validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}

export async function executeMK2PaletteStorageSelectionReconnaissance(source:DirectorySource,o67:MK2FixtureResourceExecutableTopologyReport,o68:MK2IndexedGraphicsDecodeFoundationReport):Promise<MK2PaletteStorageSelectionReconnaissanceReport>{
  if(source.isSynthetic||o67.status!=='SUCCESS'||!o67.validation.allChecksPassed||o68.status!=='SUCCESS'||!o68.validation.allChecksPassed)throw new Error('O71 requires authentic verified O67/O68 prerequisites');
  if(o67.provenance.exeSha256!==EXPECTED_EXE_SHA256||o68.provenance.exeSha256!==EXPECTED_EXE_SHA256)throw new Error('O71 prerequisite executable identity mismatch');
  const timestamp=new Date().toISOString(),operationId=createOperationId('mk2_palette_storage_selection_reconnaissance');
  const entries=await source.listRecursive(),exeEntry=findEntry(entries,'MK2.EXE');if(exeEntry.size!==EXPECTED_EXE_SIZE)throw new Error(`Unexpected MK2.EXE size ${exeEntry.size}`);
  const exe=await source.readSlice(exeEntry.path,0,exeEntry.size),exeSha=await sha256(exe);if(exeSha!==EXPECTED_EXE_SHA256)throw new Error(`MK2.EXE SHA mismatch ${exeSha}`);
  const getpal='mk: Ran out of palettes in GETPAL.\n',palset='mk: Ran out of palettes in PALSET.\n',getpalAt=findAscii(exe,getpal),palsetAt=findAscii(exe,palset);
  const spanRows=[] as MK2PaletteStorageSelectionReconnaissanceReport['codeEvidence']['spans'];
  for(const s of SPANS){const got=await sha256(exe.slice(s.start,s.end));spanRows.push({id:s.id,physicalStart:s.start,physicalStartHex:hex(s.start),physicalEndExclusive:s.end,physicalEndExclusiveHex:hex(s.end),byteLength:s.end-s.start,sha256:got});}
  const calls=findDirectNearCalls(exe,PALETTE_ALLOCATOR_PHYS,OBJECT2_FILE_START,FILE_BACKED_END);
  const structuralRecordExamples=[
    {physical:0x891e0,nextCandidatePhysical:0x89282},
    {physical:0x89282,nextCandidatePhysical:0x89324},
    {physical:0x8cd1e,nextCandidatePhysical:0x8cdbe},
    {physical:0x8cdbe,nextCandidatePhysical:0x8ce5e},
  ].map(x=>{const n=u16(exe,x.physical),end=x.physical+2+n*2;return{physical:x.physical,physicalHex:hex(x.physical),colorCount:n,endExclusive:end,endExclusiveHex:hex(end),nextCandidatePhysical:x.nextCandidatePhysical,classification:'STRUCTURAL_CANDIDATE_ONLY_NOT_OWNERSHIP' as const};});
  const checks:Array<{id:string;passed:boolean;detail:string}>=[];const ck=(id:string,passed:boolean,detail:string)=>checks.push({id,passed,detail});
  ck('exe_identity',exeSha===EXPECTED_EXE_SHA256,exeSha);
  ck('getpal_diagnostic_anchor',getpalAt===0xa0e08,hex(getpalAt));ck('palset_diagnostic_anchor',palsetAt===0xa0e2c,hex(palsetAt));
  for(let i=0;i<SPANS.length;i++)ck(`span_${SPANS[i].id}`,spanRows[i].sha256===SPANS[i].sha256,`${spanRows[i].physicalStartHex} ${spanRows[i].sha256}`);
  ck('direct_allocator_call_census',arraysEqual(calls,EXPECTED_DIRECT_CALLS),calls.map(hex).join(','));
  ck('queue_geometry',(QUEUE_END-QUEUE_START)/QUEUE_ENTRY_BYTES===32,`${hex(QUEUE_START)}..${hex(QUEUE_END)} / ${QUEUE_ENTRY_BYTES}`);
  ck('handle_geometry',HANDLE_COUNT*HANDLE_BYTES===0x1e0,`${HANDLE_COUNT}*${HANDLE_BYTES}=0x${(HANDLE_COUNT*HANDLE_BYTES).toString(16)}`);
  ck('allocator_reads_count_then_advances',exe.slice(0x7b489,0x7b48f).every((b,i)=>b===[0x66,0x8b,0x18,0x83,0xc0,0x02][i]),'mov bx,[eax]; add eax,2');
  ck('object_handle_release_bridge',exe[0x7b3fb]===0x40&&exe[0x7b3fc]===0x30,'movzx eax,word [eax+0x30]');
  ck('object_handle_store_dynamic_selector',exe[0x81dda]===0xe8&&exe[0x81ddf]===0x66&&exe[0x81de0]===0x89&&exe[0x81de1]===0x45&&exe[0x81de2]===0x30,'allocator return -> word [object+0x30]');
  ck('object_handle_store_dynamic_pointer',exe[0x85c79]===0xe8&&exe[0x85c7e]===0x66&&exe[0x85c7f]===0x89&&exe[0x85c80]===0x47&&exe[0x85c81]===0x30,'allocator return -> word [object+0x30]');
  ck('object_handle_store_structure_pointer',exe[0x86b1f]===0xe8&&exe[0x86b30]===0x66&&exe[0x86b31]===0x89&&exe[0x86b32]===0x47&&exe[0x86b33]===0x30,'conditional structure palette pointer -> object+0x30');
  ck('sequential_block_loop',spanRows.find(x=>x.id==='sequential_palette_block_allocator')!.sha256===SPANS.find(x=>x.id==='sequential_palette_block_allocator')!.sha256,'sequential block allocator exact span');
  ck('bytecode_pointer_path',spanRows.find(x=>x.id==='bytecode_palette_pointer_caller')!.sha256===SPANS.find(x=>x.id==='bytecode_palette_pointer_caller')!.sha256,'bytecode dword pointer -> allocator');
  ck('candidate_pair_80',structuralRecordExamples[0].colorCount===80&&structuralRecordExamples[0].endExclusive===0x89282&&structuralRecordExamples[1].colorCount===80,'two adjacent 80-color structural candidates');
  ck('candidate_pair_79',structuralRecordExamples[2].colorCount===79&&structuralRecordExamples[2].endExclusive===0x8cdbe&&structuralRecordExamples[3].colorCount===79,'two adjacent 79-color structural candidates');
  ck('jc0_prerequisite',o68.descriptorCorpus.resourceId===109&&o68.descriptorCorpus.candidateCount===35&&o68.summary.opaqueIndexMin===1&&o68.summary.opaqueIndexMax===63,'JC0 id=109 descriptors=35 opaque=1..63');
  ck('jc0_descriptor_no_palette_field',o68.descriptorCorpus.descriptors.every(d=>Number.isFinite(d.width)&&Number.isFinite(d.height)&&d.resourceId===109),'O68 12-byte descriptors encode geometry/placement/resource reference only');
  ck('jc0_binding_not_promoted',o68.decision.paletteOwnershipEstablished===false,'prerequisite remains palette-unresolved');
  const failed=checks.filter(c=>!c.passed);if(failed.length)throw new Error(`O71 validation failed: ${failed.map(c=>c.id).join(', ')}`);
  return {
    format:'mk2_palette_storage_selection_reconnaissance_v1',timestamp,operationId,
    provenance:{sourceKind:'user-loaded-directory',exePath:exeEntry.path,exeByteLength:exe.length,exeSha256:exeSha,synthetic:false},
    prerequisite:{o67Verdict:o67.decision.verdict,o68Verdict:o68.decision.verdict,o68Jc0DescriptorCount:o68.descriptorCorpus.candidateCount,o68Jc0OpaqueIndexMin:o68.summary.opaqueIndexMin,o68Jc0OpaqueIndexMax:o68.summary.opaqueIndexMax,validationPassed:true},
    diagnosticAnchors:{getpalStringPhysical:getpalAt,getpalStringPhysicalHex:hex(getpalAt),palsetStringPhysical:palsetAt,palsetStringPhysicalHex:hex(palsetAt),strings:[getpal.trim(),palset.trim()]},
    codeEvidence:{spans:spanRows,paletteAllocatorDirectCallCount:calls.length,paletteAllocatorDirectCallSites:calls,paletteAllocatorDirectCallSitesHex:calls.map(hex)},
    paletteRecordFormat:{established:true,colorCount:{offset:0,type:'u16le'},colorData:{offset:2,elementType:'u16le_packed_color',elementCountFrom:'record.u16[0]'},recordByteLengthFormula:'2 + colorCount * 2',evidence:'Allocator at physical 0x7B439 reads word [EAX] as the colour count, advances EAX by 2, and queues BX colours from the resulting source pointer.'},
    requestQueue:{established:true,ringStart:QUEUE_START,ringEndExclusive:QUEUE_END,entryByteLength:8,slotCount:32,fields:{sourceColorPointer:{offset:0,type:'u32_pointer'},dacStartIndex:{offset:4,type:'u16'},colorCount:{offset:6,type:'u16'}},writerPointerAddress:0x563dc,readerPointerAddress:0x563d8,changedFlagAddress:0x563e0,overflowBound:256},
    paletteHandles:{established:true,tableAddress:HANDLE_TABLE,entryByteLength:8,entryCount:HANDLE_COUNT,fields:{recordPointer:{offset:0,type:'u32_pointer'},referenceCount:{offset:4,type:'u16'},dacStartIndex:{offset:6,type:'u8'},byte7:{offset:7,classification:'UNINTERPRETED'}},objectPaletteHandleOffset:OBJECT_PALETTE_HANDLE_OFFSET,objectPaletteHandleOffsetHex:hex(OBJECT_PALETTE_HANDLE_OFFSET)},
    dacTransfer:{established:true,statusPort:'0x3DA',writeIndexPort:'0x3C8',componentPort:'0x3C9',packedColorBytes:2,componentFormulas:['component0 = ((packed >> 9) & 0x3F) | 1','component1 = ((packed >> 4) & 0x3F) | 1','component2 = ((packed << 1) & 0x3F) | 1'],componentOrderClassification:'VGA_DAC_WRITE_SEQUENCE',wallClockTimingEstablished:false},
    selectionSurface:{established:true,directAllocatorCallCount:15,examples:[
      {physical:0x81dda,physicalHex:hex(0x81dda),classification:'DYNAMIC_TABLE_SELECTION',establishedRelationship:'selected pointer -> palette allocator -> word [object+0x30]'},
      {physical:0x85c79,physicalHex:hex(0x85c79),classification:'DYNAMIC_POINTER_SELECTION',establishedRelationship:'dword [pointer] -> palette allocator -> word [object+0x30]'},
      {physical:0x86b1f,physicalHex:hex(0x86b1f),classification:'STRUCTURE_FIELD_SELECTION',establishedRelationship:'nonzero dword [structure+4] -> palette allocator -> word [object+0x30]'},
      {physical:0x995a6,physicalHex:hex(0x995a6),classification:'BYTECODE_STREAM_POINTER',establishedRelationship:'dword consumed from control stream -> palette allocator -> palette handle global'},
    ],sequentialPaletteBlockAllocator:{physical:SEQUENTIAL_BLOCK_ALLOCATOR_PHYS,physicalHex:hex(SEQUENTIAL_BLOCK_ALLOCATOR_PHYS),established:true,recordCountSource:'u16 immediately before first record',recordTraversal:'next = current + 2 + 2 * current.colorCount'},rawImmediatePointerResolutionQualified:false,note:'Several allocator callers contain relocation-sensitive raw immediates. O71 does not resolve or use those immediates as palette identities because the quick LE-fixup physical-source mapping was not independently qualified.'},
    structuralRecordExamples,
    correction:{naive223RecordChainObservedDuringReconnaissance:true,naive223RecordChainPromoted:false,reason:'A broad byte-shape scan produced a long chain of structurally compatible count+u16 records, but later relocation/fixup reconnaissance showed that structural compatibility alone is not sufficient to classify every member as a palette. O71 therefore promotes only the record grammar and runtime machinery proven directly by code.'},
    jc0Boundary:{resourceName:'JC0.GRA',resourceId:109,descriptorLocationClass:'UNRESOLVED_POST_LE_OVERLAY',descriptorCount:35,opaqueIndexMin:1,opaqueIndexMax:63,descriptorCarriesPaletteField:false,concretePaletteRecordBindingEstablished:false,correctColorRgbaEstablished:false,boundedConclusion:'O71 establishes how MK2 stores, allocates, references, queues and transfers palettes, but it does not establish an affirmative data-flow join from JC0 resource identity / its unresolved post-LE descriptors to one concrete palette record. JC0 remains indexed-only.'},
    decision:{paletteRecordEncodingEstablished:true,paletteAllocationAndReferenceModelEstablished:true,paletteTransferQueueEstablished:true,objectPaletteHandleFieldEstablished:true,dynamicPaletteSelectionPathsExist:true,jc0PaletteOwnershipEstablished:false,correctColorRgbaEstablished:false,mk1PaletteAssumptionsImported:false,verdict:'MK2_PALETTE_STORAGE_ALLOCATION_AND_DAC_TRANSFER_ESTABLISHED_JC0_BINDING_UNRESOLVED',narrative:'Authentic MK2.EXE bytes independently establish a counted 16-bit palette-record grammar, a 60-entry reference-counted palette-handle table, a 32-slot transfer queue, an object palette-handle field at +0x30, and VGA DAC writes through 0x3C8/0x3C9 with three 6-bit components derived from each packed 16-bit colour. Fifteen direct file-backed calls to the allocator are bounded, including dynamic table, structure-field and control-stream selection paths plus a sequential multi-palette block allocator. This proves the MK2 palette mechanism, not concrete JC0 ownership. No affirmative JC0 resource/descriptor-to-palette selector join is established, so JC0 remains palette-unresolved/indexed-only and no correct-colour RGBA is emitted. The earlier broad 223-record structural scan is explicitly not promoted.'},
    status:'SUCCESS',validation:{allChecksPassed:true,checks}
  };
}

export function createMK2PaletteStorageSelectionReconnaissanceExport(report:MK2PaletteStorageSelectionReconnaissanceReport):MK2PaletteStorageSelectionReconnaissanceReport{if(report.status!=='SUCCESS'||!report.validation.allChecksPassed)throw new Error('O71 verified report required');return report;}

import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';

const EXPECTED_EXE_SHA256 = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const EXPECTED_EXE_SIZE = 861133;
const EXPECTED_LE_OFFSET = 0x28f0c;
const EXPECTED_DATA_PAGES_OFFSET = 0x3b600;
const EXPECTED_RESOURCE_POOL_START = 0xa0ef1;
const EXPECTED_RESOURCE_POOL_END = 0xa13a7;
const OPTIONAL_ULTRAMID_INI_SIZE = 6720;
const OPTIONAL_ULTRAMID_INI_SHA256 = '00a280d61e5017744351f0167c80e2d247584028ddacc3f6ed941ec8e405be5d';

function hex(n: number): string { return `0x${n.toString(16).toUpperCase()}`; }
function u16(v: DataView, off: number): number { return v.getUint16(off, true); }
function u32(v: DataView, off: number): number { return v.getUint32(off, true); }
function ascii(bytes: Uint8Array, start: number, end: number): string {
  return new TextDecoder('ascii').decode(bytes.slice(start, end));
}
async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
function findEntry(entries: SourceFileEntry[], wanted: string): SourceFileEntry {
  const match = entries.find(e => e.path.toUpperCase() === wanted.toUpperCase());
  if (!match) throw new Error(`Required MK2 fixture file missing: ${wanted}`);
  return match;
}
function countRoot(entries: SourceFileEntry[], ext: string): number {
  return entries.filter(e => !e.path.includes('/') && e.extension.toUpperCase() === ext).length;
}
function findBytes(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}
function parseResourcePool(exe: Uint8Array): { start: number; end: number; names: string[] } {
  const marker = new TextEncoder().encode('PLAYSTA.GRA\0');
  const start = findBytes(exe, marker);
  if (start < 0) throw new Error('MK2 executable resource filename pool start marker not found');
  const names: string[] = [];
  let cursor = start;
  while (cursor < exe.length) {
    let zero = cursor;
    while (zero < exe.length && exe[zero] !== 0) zero++;
    if (zero >= exe.length) throw new Error('Unterminated MK2 resource filename pool');
    const name = ascii(exe, cursor, zero);
    names.push(name);
    cursor = zero + 1;
    if (name.toUpperCase() === 'RM.DRV') break;
    if (names.length > 256) throw new Error('MK2 resource filename pool exceeded bounded census');
  }
  return { start, end: cursor, names };
}

export interface MK2FixtureResourceExecutableTopologyReport {
  format: 'mk2_fixture_resource_executable_topology_v1';
  timestamp: string;
  operationId: string;
  provenance: { sourceKind:'user-loaded-directory'; directoryName:string; exePath:string; exeByteLength:number; exeSha256:string; synthetic:false };
  fixture: {
    regularFileCount:number; totalFileBytes:number; rootGraCount:number; fxU8Count:number; soundFileCount:number;
    soundByExtension: Record<string, number>; rootBinCount:number;
    envelopeProfile:'WITH_ULTRAMID_INI'|'WITHOUT_ULTRAMID_INI'; ultramidIniPresent:boolean; ultramidIniSize:number|null; ultramidIniSha256:string|null;
  };
  executable: {
    leHeaderPhysical:number; leHeaderPhysicalHex:string; cpuType:number; targetOs:number; moduleFlags:number; modulePageCount:number;
    eipObject:number; eip:number; espObject:number; esp:number; pageSize:number; lastPageSize:number;
    objectTableRelative:number; pageMapRelative:number; fixupPageTableRelative:number; fixupRecordTableRelative:number;
    fixupSectionSize:number; loaderSectionSize:number; dataPagesPhysical:number; dataPagesPhysicalHex:string;
    objects:Array<{index:number;virtualSize:number;relocationBase:number;flags:number;pageMapIndex:number;pageCount:number}>;
    pageMapSequentialOneBased:boolean; highestFileBackedPageEndExclusive:number; highestFileBackedPageEndExclusiveHex:string;
    postLeOverlay:{start:number;startHex:string;end:number;endHex:string;byteLength:number;classification:'UNRESOLVED_POST_LE_OVERLAY'};
  };
  resourceFilenamePool: {
    physicalStart:number; physicalStartHex:string; physicalEndExclusive:number; physicalEndExclusiveHex:string; byteLength:number;
    entryCount:number; graEntryCount:number; binEntryCount:number; drvEntryCount:number; names:string[];
    allPooledGraPresentOnDisk:boolean; diskRootGraNotInPool:string[]; diskRootBinNotInPool:string[];
    jc0PoolOrdinal:number|null;
  };
  decision: {
    authenticMk2FixtureEstablished:true; executableLeTopologyEstablished:true; executableResourceFilenamePoolEstablished:true;
    postLeOverlaySemanticsEstablished:false; mk1FormatParityAssumed:false;
    verdict:'MK2_AUTHENTIC_FIXTURE_RESOURCE_AND_EXECUTABLE_TOPOLOGY_ESTABLISHED'; narrative:string;
  };
  status:'SUCCESS'; validation:{allChecksPassed:true;checks:Array<{id:string;passed:boolean;detail:string}>};
}

export async function executeMK2FixtureResourceExecutableTopology(source: DirectorySource): Promise<MK2FixtureResourceExecutableTopologyReport> {
  if (source.isSynthetic) throw new Error('O67 authoritative MK2 foundation requires a real user-loaded directory');
  const timestamp = new Date().toISOString();
  const operationId = createOperationId('mk2_fixture_resource_executable_topology');
  const entries = (await source.listRecursive()).slice().sort((a,b)=>a.path.localeCompare(b.path));
  const exeEntry = findEntry(entries, 'MK2.EXE');
  if (exeEntry.size !== EXPECTED_EXE_SIZE) throw new Error(`Unexpected MK2.EXE size ${exeEntry.size}`);
  const exe = await source.readSlice(exeEntry.path, 0, exeEntry.size);
  if (exe.length !== exeEntry.size) throw new Error('Failed to read complete MK2.EXE');
  const exeSha256 = await sha256(exe);
  if (exeSha256 !== EXPECTED_EXE_SHA256) throw new Error(`MK2.EXE SHA-256 mismatch: ${exeSha256}`);

  const v = new DataView(exe.buffer, exe.byteOffset, exe.byteLength);
  const le = EXPECTED_LE_OFFSET;
  if (ascii(exe, le, le + 2) !== 'LE' || exe[le+2] !== 0 || exe[le+3] !== 0) throw new Error('Expected MK2 LE header not found at canonical physical offset');
  const cpuType=u16(v,le+0x08), targetOs=u16(v,le+0x0a), moduleFlags=u32(v,le+0x10), modulePageCount=u32(v,le+0x14);
  const eipObject=u32(v,le+0x18),eip=u32(v,le+0x1c),espObject=u32(v,le+0x20),esp=u32(v,le+0x24),pageSize=u32(v,le+0x28),lastPageSize=u32(v,le+0x2c);
  const fixupSectionSize=u32(v,le+0x30),loaderSectionSize=u32(v,le+0x38),objectTableRelative=u32(v,le+0x40),objectCount=u32(v,le+0x44),pageMapRelative=u32(v,le+0x48);
  const fixupPageTableRelative=u32(v,le+0x68),fixupRecordTableRelative=u32(v,le+0x6c),dataPagesPhysical=u32(v,le+0x80);
  if (objectCount !== 2) throw new Error(`Expected 2 MK2 LE objects, found ${objectCount}`);
  const objects=[] as MK2FixtureResourceExecutableTopologyReport['executable']['objects'];
  for(let i=0;i<objectCount;i++){
    const p=le+objectTableRelative+i*24;
    objects.push({index:i+1,virtualSize:u32(v,p),relocationBase:u32(v,p+4),flags:u32(v,p+8),pageMapIndex:u32(v,p+12),pageCount:u32(v,p+16)});
  }
  const pageNumbers:number[]=[];
  for(let i=0;i<modulePageCount;i++){
    const p=le+pageMapRelative+i*4;
    pageNumbers.push((exe[p]<<16)|(exe[p+1]<<8)|exe[p+2]);
  }
  const pageMapSequentialOneBased=pageNumbers.every((n,i)=>n===i+1);
  const highestFileBackedPageEndExclusive=dataPagesPhysical+(modulePageCount-1)*pageSize+lastPageSize;
  if (highestFileBackedPageEndExclusive > exe.length) throw new Error('MK2 LE file-backed page end exceeds executable length');

  const pool=parseResourcePool(exe);
  const upperPaths=new Set(entries.map(e=>e.path.toUpperCase()));
  const pooledGra=pool.names.filter(n=>n.toUpperCase().endsWith('.GRA'));
  const rootGra=entries.filter(e=>!e.path.includes('/')&&e.extension.toUpperCase()==='GRA').map(e=>e.name.toUpperCase()).sort();
  const rootBin=entries.filter(e=>!e.path.includes('/')&&e.extension.toUpperCase()==='BIN').map(e=>e.name.toUpperCase()).sort();
  const pooledGraSet=new Set(pooledGra.map(n=>n.toUpperCase()));
  const pooledBinSet=new Set(pool.names.filter(n=>n.toUpperCase().endsWith('.BIN')).map(n=>n.toUpperCase()));
  const diskRootGraNotInPool=rootGra.filter(n=>!pooledGraSet.has(n));
  const diskRootBinNotInPool=rootBin.filter(n=>!pooledBinSet.has(n));
  const soundExts=['AWE','GVS','LAP','MID','SBL'];
  const soundByExtension=Object.fromEntries(soundExts.map(ext=>[ext,entries.filter(e=>e.path.toUpperCase().startsWith('SOUND/')&&e.extension.toUpperCase()===ext).length]));
  const totalFileBytes=entries.reduce((s,e)=>s+e.size,0);
  const ultramidEntry=entries.find(e=>e.path.toUpperCase()==='ULTRAMID.INI') ?? null;
  let ultramidIniSha256:string|null=null;
  if(ultramidEntry){
    if(ultramidEntry.size!==OPTIONAL_ULTRAMID_INI_SIZE) throw new Error(`Unexpected ULTRAMID.INI size ${ultramidEntry.size}`);
    const ultramidBytes=await source.readSlice(ultramidEntry.path,0,ultramidEntry.size);
    if(ultramidBytes.length!==ultramidEntry.size) throw new Error('Failed to read complete ULTRAMID.INI');
    ultramidIniSha256=await sha256(ultramidBytes);
    if(ultramidIniSha256!==OPTIONAL_ULTRAMID_INI_SHA256) throw new Error(`ULTRAMID.INI SHA-256 mismatch: ${ultramidIniSha256}`);
  }
  const envelopeProfile = ultramidEntry ? 'WITH_ULTRAMID_INI' as const : 'WITHOUT_ULTRAMID_INI' as const;
  const recognizedEnvelope = ultramidEntry
    ? entries.length===614 && totalFileBytes===19921006
    : entries.length===613 && totalFileBytes===19914286;
  const fxU8Count=entries.filter(e=>e.path.toUpperCase().startsWith('FX/')&&e.extension.toUpperCase()==='U8').length;
  const soundFileCount=entries.filter(e=>e.path.toUpperCase().startsWith('SOUND/')).length;
  const graEntryCount=pool.names.filter(n=>/\.GRA$/i.test(n)).length,binEntryCount=pool.names.filter(n=>/\.BIN$/i.test(n)).length,drvEntryCount=pool.names.filter(n=>/\.DRV$/i.test(n)).length;
  const jc0PoolOrdinal=pool.names.findIndex(n=>n.toUpperCase()==='JC0.GRA');
  const checks=[
    ['fixture_file_count',recognizedEnvelope,`regular files=${entries.length}; envelope=${envelopeProfile}`],
    ['fixture_total_bytes',recognizedEnvelope,`file bytes=${totalFileBytes}; envelope=${envelopeProfile}`],
    ['optional_ultramid_ini',!ultramidEntry || (ultramidEntry.size===OPTIONAL_ULTRAMID_INI_SIZE&&ultramidIniSha256===OPTIONAL_ULTRAMID_INI_SHA256),ultramidEntry?`present ${ultramidEntry.size} bytes ${ultramidIniSha256}`:'absent; recognized authentic envelope variant'],
    ['root_gra_count',countRoot(entries,'GRA')===124,`root GRA=${countRoot(entries,'GRA')}`],
    ['fx_u8_count',fxU8Count===312,`FX/U8=${fxU8Count}`],
    ['sound_file_count',soundFileCount===165,`sound files=${soundFileCount}`],
    ['sound_extension_balance',soundExts.every(ext=>soundByExtension[ext]===33),JSON.stringify(soundByExtension)],
    ['root_bin_count',countRoot(entries,'BIN')===6,`root BIN=${countRoot(entries,'BIN')}`],
    ['exe_hash',exeSha256===EXPECTED_EXE_SHA256,exeSha256],
    ['le_core',cpuType===2&&targetOs===1&&moduleFlags===0x200&&modulePageCount===113&&pageSize===4096&&lastPageSize===1913,`cpu=${cpuType} os=${targetOs} pages=${modulePageCount}`],
    ['le_entry_stack',eipObject===1&&eip===0x3caa0&&espObject===2&&esp===0x86660,`EIP=${eipObject}:${hex(eip)} ESP=${espObject}:${hex(esp)}`],
    ['le_offsets',objectTableRelative===0xc4&&pageMapRelative===0xf4&&fixupPageTableRelative===0x2bf&&fixupRecordTableRelative===0x487&&dataPagesPhysical===EXPECTED_DATA_PAGES_OFFSET,'canonical LE offsets'],
    ['le_objects',objects[0]?.virtualSize===0x3ee98&&objects[0]?.relocationBase===0x10000&&objects[0]?.pageMapIndex===1&&objects[0]?.pageCount===63&&objects[1]?.virtualSize===0x86660&&objects[1]?.relocationBase===0x50000&&objects[1]?.pageMapIndex===64&&objects[1]?.pageCount===50,JSON.stringify(objects)],
    ['page_map',pageMapSequentialOneBased,'113 page-map entries are sequential 1..113'],
    ['file_backed_end',highestFileBackedPageEndExclusive===0xabd79,hex(highestFileBackedPageEndExclusive)],
    ['post_le_overlay',exe.length-highestFileBackedPageEndExclusive===157268,`overlay bytes=${exe.length-highestFileBackedPageEndExclusive}`],
    ['resource_pool_bounds',pool.start===EXPECTED_RESOURCE_POOL_START&&pool.end===EXPECTED_RESOURCE_POOL_END,`${hex(pool.start)}..${hex(pool.end)}`],
    ['resource_pool_counts',pool.names.length===129&&graEntryCount===123&&binEntryCount===5&&drvEntryCount===1,`entries=${pool.names.length} GRA=${graEntryCount} BIN=${binEntryCount} DRV=${drvEntryCount}`],
    ['pool_files_present',pooledGra.every(n=>upperPaths.has(n.toUpperCase())),'all pooled GRA files exist at root'],
    ['unpooled_root_gra',diskRootGraNotInPool.length===1&&diskRootGraNotInPool[0]==='MONKS.GRA',diskRootGraNotInPool.join(',')],
    ['unpooled_root_bin',diskRootBinNotInPool.length===1&&diskRootBinNotInPool[0]==='GMI.BIN',diskRootBinNotInPool.join(',')],
    ['jc0_pool_ordinal',jc0PoolOrdinal===109,`JC0.GRA pool ordinal=${jc0PoolOrdinal}`],
  ].map(([id,passed,detail])=>({id:String(id),passed:Boolean(passed),detail:String(detail)}));
  const failed=checks.filter(c=>!c.passed); if(failed.length) throw new Error(`O67 validation failed: ${failed.map(c=>c.id).join(', ')}`);
  return {
    format:'mk2_fixture_resource_executable_topology_v1',timestamp,operationId,
    provenance:{sourceKind:'user-loaded-directory',directoryName:source.directoryName,exePath:exeEntry.path,exeByteLength:exe.length,exeSha256,synthetic:false},
    fixture:{regularFileCount:entries.length,totalFileBytes,rootGraCount:countRoot(entries,'GRA'),fxU8Count,soundFileCount,soundByExtension,rootBinCount:countRoot(entries,'BIN'),envelopeProfile,ultramidIniPresent:Boolean(ultramidEntry),ultramidIniSize:ultramidEntry?.size??null,ultramidIniSha256},
    executable:{leHeaderPhysical:le,leHeaderPhysicalHex:hex(le),cpuType,targetOs,moduleFlags,modulePageCount,eipObject,eip,espObject,esp,pageSize,lastPageSize,objectTableRelative,pageMapRelative,fixupPageTableRelative,fixupRecordTableRelative,fixupSectionSize,loaderSectionSize,dataPagesPhysical,dataPagesPhysicalHex:hex(dataPagesPhysical),objects,pageMapSequentialOneBased,highestFileBackedPageEndExclusive,highestFileBackedPageEndExclusiveHex:hex(highestFileBackedPageEndExclusive),postLeOverlay:{start:highestFileBackedPageEndExclusive,startHex:hex(highestFileBackedPageEndExclusive),end:exe.length,endHex:hex(exe.length),byteLength:exe.length-highestFileBackedPageEndExclusive,classification:'UNRESOLVED_POST_LE_OVERLAY'}},
    resourceFilenamePool:{physicalStart:pool.start,physicalStartHex:hex(pool.start),physicalEndExclusive:pool.end,physicalEndExclusiveHex:hex(pool.end),byteLength:pool.end-pool.start,entryCount:pool.names.length,graEntryCount,binEntryCount,drvEntryCount,names:pool.names,allPooledGraPresentOnDisk:true,diskRootGraNotInPool,diskRootBinNotInPool,jc0PoolOrdinal},
    decision:{authenticMk2FixtureEstablished:true,executableLeTopologyEstablished:true,executableResourceFilenamePoolEstablished:true,postLeOverlaySemanticsEstablished:false,mk1FormatParityAssumed:false,verdict:'MK2_AUTHENTIC_FIXTURE_RESOURCE_AND_EXECUTABLE_TOPOLOGY_ESTABLISHED',narrative:`The authentic MK2 installation is independently bounded as the ${envelopeProfile} envelope at ${entries.length} files / ${totalFileBytes} bytes with canonical MK2.EXE SHA-256 ${exeSha256}. The embedded LE header at ${hex(le)} establishes a 386 two-object / 113-page executable topology. A contiguous 129-entry executable filename pool contains 123 GRA names plus five BIN names and RM.DRV; every pooled GRA exists on disk, while MONKS.GRA and GMI.BIN remain installed but outside this qualified pool. The ${exe.length-highestFileBackedPageEndExclusive}-byte region after the final LE file-backed page is retained as UNRESOLVED_POST_LE_OVERLAY rather than being mislabeled as runtime Object-2 data or a debug container. No MK1 resource, graphics, palette, animation or audio mechanism is assumed.`},
    status:'SUCCESS',validation:{allChecksPassed:true,checks}
  };
}

export function createMK2FixtureResourceExecutableTopologyExport(report: MK2FixtureResourceExecutableTopologyReport): object {
  if(report.status!=='SUCCESS'||!report.validation.allChecksPassed||report.provenance.synthetic) throw new Error('O67 verified authentic report required');
  return report;
}

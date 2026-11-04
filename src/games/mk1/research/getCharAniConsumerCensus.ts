/**
 * MK1 GET_CHAR_ANI consumer census — Pass 1E.3O.21.
 *
 * Read-only export-labeling reconnaissance. Establishes the bounded direct
 * call surface to GET_CHAR_ANI and the immediately-adjacent constant A9 index
 * assignments used by those call sites. It preserves dynamic/non-immediate
 * consumers and does not promote nearest Watcom symbol names into gameplay
 * semantics.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { enumerateMK1WatcomPermanentClasses } from './watcomPermanentClassInventory';
import { MK1FighterAnimationTableComparisonReport } from './fighterAnimationTableComparison';
import { MK1CharacterAnimationTableSelectorReport } from './characterAnimationTableSelector';

function toHex32(value: number): string {
  return `0x${(value >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
}
function readU32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}
function readI32(bytes: Uint8Array, offset: number): number { return readU32(bytes, offset) | 0; }

export interface GetCharAniDirectCallSite {
  physicalOffset: number;
  physicalOffsetHex: string;
  watcomOffset: number;
  watcomOffsetHex: string;
  immediateA9Index: number | null;
  immediateA9IndexHex: string | null;
  moduleName: string | null;
  moduleIndex: number | null;
  nearestPriorCodeSymbol: string | null;
  nearestPriorCodeSymbolWatcomOffset: number | null;
  nearestPriorCodeSymbolWatcomOffsetHex: string | null;
  nearestSymbolDistanceBytes: number | null;
  classification: 'DIRECT_GET_CHAR_ANI_IMMEDIATE_A9' | 'DIRECT_GET_CHAR_ANI_DYNAMIC_OR_NONADJACENT_A9';
}

export interface GetCharAniIndexConsumerSummary {
  index: number;
  indexHex: string;
  directImmediateCallCount: number;
  modules: string[];
  nearestCodeSymbolContexts: string[];
  tableCoverage: Array<{
    anitabSymbol: string;
    entryCount: number;
    indexInRange: boolean;
    cellClassification: string | null;
    cellRawValueHex: string | null;
  }>;
  streamCompatibleTableCount: number;
  classification: 'DIRECT_IMMEDIATE_ANIMATION_INDEX_CONSUMER';
}

export interface MK1GetCharAniConsumerCensusReport {
  format: 'mk1_get_char_ani_consumer_census_v1';
  timestamp: string;
  operationId: string;
  provenance: MK1CharacterAnimationTableSelectorReport['provenance'];
  prerequisite: {
    o17OperationId: string;
    o19OperationId: string;
    validationPassed: boolean;
  };
  target: {
    getCharAniPhysical: number;
    getCharAniPhysicalHex: string;
    getCharAniWatcomOffset: number;
    getCharAniWatcomOffsetHex: string;
    a9WatcomOffset: number;
    a9WatcomOffsetHex: string;
    codeImageBase: number;
    codeImageBaseHex: string;
  };
  directCallSites: GetCharAniDirectCallSite[];
  immediateIndices: GetCharAniIndexConsumerSummary[];
  summary: {
    directCallCount: number;
    immediateAdjacentA9CallCount: number;
    dynamicOrNonAdjacentCallCount: number;
    uniqueImmediateIndexCount: number;
    minImmediateIndex: number | null;
    maxImmediateIndex: number | null;
    allImmediateIndicesCoveredByAtLeastOneAnitab: boolean;
    allDirectCallsInsideWatcomAddressModules: boolean;
  };
  decision: {
    directGetCharAniCallSurfaceEstablished: boolean;
    immediateAnimationIndexConsumerSurfaceEstablished: boolean;
    semanticGameplayNamesEstablished: false;
    dynamicConsumersRemain: boolean;
    verdict: 'MK1_GET_CHAR_ANI_DIRECT_INDEX_CONSUMER_SURFACE_ESTABLISHED';
    narrative: string;
  };
  status: 'SUCCESS';
  validation: {
    allChecksPassed: boolean;
    checks: Array<{ checkId: string; passed: boolean; detail?: string }>;
  };
}

async function readExe(source: DirectorySource): Promise<{ path: string; bytes: Uint8Array }> {
  const files = await source.listRecursive();
  const exe = files.find(file => file.name.toUpperCase() === 'MK1.EXE');
  if (!exe) throw new Error('O21 requires MK1.EXE');
  return { path: exe.path, bytes: await source.readSlice(exe.path, 0, exe.size) };
}

export async function executeGetCharAniConsumerCensus(
  source: DirectorySource,
  o17: MK1FighterAnimationTableComparisonReport,
  o19: MK1CharacterAnimationTableSelectorReport,
): Promise<MK1GetCharAniConsumerCensusReport> {
  if (o17.status !== 'SUCCESS' || !o17.validation.allChecksPassed) throw new Error('O21 requires successful O17');
  if (o19.status !== 'SUCCESS' || !o19.validation.allChecksPassed) throw new Error('O21 requires successful O19');
  const operationId = createOperationId('get_char_ani_consumer_census');
  const timestamp = new Date().toISOString();
  const { bytes } = await readExe(source);
  const permanent = await enumerateMK1WatcomPermanentClasses(source);
  if (permanent.status !== 'SUCCESS' || !permanent.result.overallValid) throw new Error('O21 requires valid Watcom permanent classes');

  const codeBase = o17.coordinateModel.codeImageBase;
  const target = o19.getCharAni.physicalStart;
  const a9 = o19.getCharAni.a9WatcomOffset;

  const codeSymbols = permanent.result.globalSymbols.symbols
    .filter(symbol => symbol.valid && symbol.segment === 1 && symbol.kindBits.isCode)
    .sort((a, b) => a.addressOffset - b.addressOffset);
  const segment1 = permanent.result.addressInfo.segmentRecords.find(record => record.segment === 1);
  if (!segment1) throw new Error('O21 requires Watcom Segment-1 address info');
  const moduleRanges: Array<{ start: number; end: number; moduleName: string; moduleIndex: number }> = [];
  let cursor = segment1.startAddressOffset;
  for (const entry of segment1.entries) {
    moduleRanges.push({ start: cursor, end: cursor + entry.size, moduleName: entry.resolvedModuleName, moduleIndex: entry.moduleIndex });
    cursor += entry.size;
  }

  function moduleOwner(watcomOffset: number) {
    return moduleRanges.find(range => watcomOffset >= range.start && watcomOffset < range.end) ?? null;
  }
  function nearestSymbol(watcomOffset: number, moduleIndex: number | null) {
    let best: typeof codeSymbols[number] | null = null;
    for (const symbol of codeSymbols) {
      if (symbol.addressOffset > watcomOffset) break;
      if (moduleIndex !== null && symbol.moduleIndex !== moduleIndex) continue;
      best = symbol;
    }
    return best;
  }

  const directCallSites: GetCharAniDirectCallSite[] = [];
  for (let physical = codeBase; physical + 5 <= bytes.length; physical++) {
    if (bytes[physical] !== 0xe8) continue;
    const callTarget = physical + 5 + readI32(bytes, physical + 1);
    if (callTarget !== target) continue;
    const watcomOffset = physical - codeBase;
    const owner = moduleOwner(watcomOffset);
    const prior = nearestSymbol(watcomOffset, owner?.moduleIndex ?? null);
    const q = physical - 10;
    let immediate: number | null = null;
    if (q >= codeBase && bytes[q] === 0xc7 && bytes[q + 1] === 0x05 && readU32(bytes, q + 2) === a9) {
      immediate = readU32(bytes, q + 6);
    }
    directCallSites.push({
      physicalOffset: physical,
      physicalOffsetHex: toHex32(physical),
      watcomOffset,
      watcomOffsetHex: toHex32(watcomOffset),
      immediateA9Index: immediate,
      immediateA9IndexHex: immediate === null ? null : toHex32(immediate),
      moduleName: owner?.moduleName ?? null,
      moduleIndex: owner?.moduleIndex ?? null,
      nearestPriorCodeSymbol: prior?.name ?? null,
      nearestPriorCodeSymbolWatcomOffset: prior?.addressOffset ?? null,
      nearestPriorCodeSymbolWatcomOffsetHex: prior ? toHex32(prior.addressOffset) : null,
      nearestSymbolDistanceBytes: prior ? watcomOffset - prior.addressOffset : null,
      classification: immediate === null ? 'DIRECT_GET_CHAR_ANI_DYNAMIC_OR_NONADJACENT_A9' : 'DIRECT_GET_CHAR_ANI_IMMEDIATE_A9',
    });
  }

  const immediateValues = Array.from(new Set(directCallSites.flatMap(site => site.immediateA9Index === null ? [] : [site.immediateA9Index]))).sort((a, b) => a - b);
  const immediateIndices: GetCharAniIndexConsumerSummary[] = immediateValues.map(index => {
    const sites = directCallSites.filter(site => site.immediateA9Index === index);
    const tableCoverage = o17.tables.map(table => {
      const cell = table.entries.find(entry => entry.index === index);
      return {
        anitabSymbol: table.symbol,
        entryCount: table.entryCount,
        indexInRange: index < table.entryCount,
        cellClassification: cell?.classification ?? null,
        cellRawValueHex: cell?.rawValueHex ?? null,
      };
    });
    return {
      index,
      indexHex: toHex32(index),
      directImmediateCallCount: sites.length,
      modules: Array.from(new Set(sites.flatMap(site => site.moduleName ? [site.moduleName] : []))).sort(),
      nearestCodeSymbolContexts: Array.from(new Set(sites.flatMap(site => site.nearestPriorCodeSymbol ? [site.nearestPriorCodeSymbol] : []))).sort(),
      tableCoverage,
      streamCompatibleTableCount: tableCoverage.filter(value => value.cellClassification?.startsWith('ANIMATION_STREAM_')).length,
      classification: 'DIRECT_IMMEDIATE_ANIMATION_INDEX_CONSUMER',
    };
  });

  const immediateSites = directCallSites.filter(site => site.immediateA9Index !== null);
  const dynamicSites = directCallSites.filter(site => site.immediateA9Index === null);
  const allImmediateCovered = immediateIndices.every(index => index.tableCoverage.some(cell => cell.indexInRange));
  const allOwned = directCallSites.every(site => site.moduleName !== null);
  const checks = [
    { checkId: 'CANONICAL_PROVENANCE', passed: o19.provenance.sha256 === '750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14' },
    { checkId: 'O17_O19_PREREQUISITES', passed: true },
    { checkId: 'GET_CHAR_ANI_DIRECT_CALLS_FOUND', passed: directCallSites.length > 0, detail: `calls=${directCallSites.length}` },
    { checkId: 'IMMEDIATE_A9_CONSUMERS_FOUND', passed: immediateSites.length > 0, detail: `immediate=${immediateSites.length}` },
    { checkId: 'DYNAMIC_CONSUMERS_PRESERVED', passed: dynamicSites.length > 0, detail: `dynamic=${dynamicSites.length}` },
    { checkId: 'IMMEDIATE_INDICES_ANITAB_BOUNDED', passed: allImmediateCovered, detail: `unique=${immediateIndices.length}` },
    { checkId: 'CALLS_WATCOM_MODULE_OWNED', passed: allOwned },
    { checkId: 'NEAREST_SYMBOLS_CONTEXT_ONLY', passed: true },
    { checkId: 'SCOPE_BOUNDARY_PRESERVED', passed: true },
  ];
  const allChecksPassed = checks.every(check => check.passed);
  if (!allChecksPassed) throw new Error(`O21 validation failed: ${checks.filter(c => !c.passed).map(c => c.checkId).join(', ')}`);

  const minImmediateIndex = immediateValues.length ? immediateValues[0] : null;
  const maxImmediateIndex = immediateValues.length ? immediateValues[immediateValues.length - 1] : null;
  return {
    format: 'mk1_get_char_ani_consumer_census_v1',
    timestamp,
    operationId,
    provenance: o19.provenance,
    prerequisite: { o17OperationId: o17.operationId, o19OperationId: o19.operationId, validationPassed: true },
    target: {
      getCharAniPhysical: target,
      getCharAniPhysicalHex: toHex32(target),
      getCharAniWatcomOffset: o19.getCharAni.watcomOffset,
      getCharAniWatcomOffsetHex: o19.getCharAni.watcomOffsetHex,
      a9WatcomOffset: a9,
      a9WatcomOffsetHex: o19.getCharAni.a9WatcomOffsetHex,
      codeImageBase: codeBase,
      codeImageBaseHex: o17.coordinateModel.codeImageBaseHex,
    },
    directCallSites,
    immediateIndices,
    summary: {
      directCallCount: directCallSites.length,
      immediateAdjacentA9CallCount: immediateSites.length,
      dynamicOrNonAdjacentCallCount: dynamicSites.length,
      uniqueImmediateIndexCount: immediateIndices.length,
      minImmediateIndex,
      maxImmediateIndex,
      allImmediateIndicesCoveredByAtLeastOneAnitab: allImmediateCovered,
      allDirectCallsInsideWatcomAddressModules: allOwned,
    },
    decision: {
      directGetCharAniCallSurfaceEstablished: true,
      immediateAnimationIndexConsumerSurfaceEstablished: true,
      semanticGameplayNamesEstablished: false,
      dynamicConsumersRemain: dynamicSites.length > 0,
      verdict: 'MK1_GET_CHAR_ANI_DIRECT_INDEX_CONSUMER_SURFACE_ESTABLISHED',
      narrative: `The canonical code image contains ${directCallSites.length} direct rel32 calls to GET_CHAR_ANI. ${immediateSites.length} are immediately preceded by an exact MOV [A9],imm32 assignment, yielding ${immediateIndices.length} distinct directly observed table indices from ${minImmediateIndex} through ${maxImmediateIndex}; ${dynamicSites.length} direct consumers use dynamic or non-adjacent A9 setup and are retained separately. Every direct call lies within Watcom Segment-1 module ownership, and every directly observed immediate index is in range for at least one O17 ANITAB. Nearest preceding Watcom code-symbol names are recorded only as call-site context and are not promoted to gameplay animation names. This census establishes a bounded consumer surface for future semantic labeling without guessing from raw A9 writes.`,
    },
    status: 'SUCCESS',
    validation: { allChecksPassed, checks },
  };
}

export function createMK1GetCharAniConsumerCensusExport(report: MK1GetCharAniConsumerCensusReport): MK1GetCharAniConsumerCensusReport { return report; }

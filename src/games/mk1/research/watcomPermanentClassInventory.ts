import { BinaryReader } from '../../../core/binary/BinaryReader';
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  createOperationId,
  logStageCheckpoint,
} from '../../../core/diagnostics/diagnosticLogger';
import {
  FixtureProvenance,
  ResearchFixtureProvenance,
  SyntheticTestProvenance,
} from '../../../core/executable/watcomDebug/watcomDebugTypes';
import {
  discoverMK1WatcomDebugContainer,
  discoverMK1WatcomDebugContainerForTest,
  MK1WatcomDebugDiscoveryReport,
  computeSha256,
} from './watcomDebugContainerDiscovery';
import { enumerateWatcomPermanentClasses } from '../../../core/executable/watcomDebug/watcomPermanentClassParser';
import { WatcomPermanentClassesResult } from '../../../core/executable/watcomDebug/watcomPermanentClassTypes';
import { MK1ExecutableLayoutReport } from './executableLayoutTypes';

export interface MK1WatcomPermanentClassesReport {
  format: 'mk1_watcom_permanent_classes_inventory_v1';
  timestamp: string;
  operationId: string;
  provenance: FixtureProvenance;
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  discoveryReport: MK1WatcomDebugDiscoveryReport;
  result: WatcomPermanentClassesResult;
  status: 'SUCCESS' | 'STRUCTURAL_ERROR' | 'NO_DEBUG_CONTAINER';
}

/**
 * Enumerates all 5 permanent Open Watcom debug classes from MK1.EXE.
 * Production orchestrator always reads executable bytes directly from DirectorySource.
 * Blindness invariant: No MK1 symbol names or expected counts are used.
 */
export async function enumerateMK1WatcomPermanentClasses(
  source: DirectorySource,
  options?: {
    exePath?: string;
  },
): Promise<MK1WatcomPermanentClassesReport> {
  return executePermanentClassEnumeration(source, options?.exePath);
}

/**
 * Test-only orchestrator allowing synthetic test layout injection.
 * Gated: strictly throws if source is not synthetic.
 */
export async function enumerateMK1WatcomPermanentClassesForTest(
  source: DirectorySource,
  testOptions?: {
    exePath?: string;
    layoutReport?: MK1ExecutableLayoutReport;
  },
): Promise<MK1WatcomPermanentClassesReport> {
  if (!source.isSynthetic) {
    throw new Error('enumerateMK1WatcomPermanentClassesForTest cannot be invoked on non-synthetic source');
  }
  return executePermanentClassEnumeration(source, testOptions?.exePath, testOptions?.layoutReport);
}

async function executePermanentClassEnumeration(
  source: DirectorySource,
  customExePath?: string,
  injectedLayoutReport?: MK1ExecutableLayoutReport,
): Promise<MK1WatcomPermanentClassesReport> {
  const opId = createOperationId();
  const exePath = customExePath || 'MK1.EXE';

  logStageCheckpoint('research-mk1', 'watcom-permanent-classes', opId, 'start', {
    exePath,
  });

  if (injectedLayoutReport && !source.isSynthetic) {
    throw new Error('External layout report injection is prohibited on non-synthetic source');
  }

  // 1. Discover debug container first
  const discoveryReport = source.isSynthetic && injectedLayoutReport
    ? await discoverMK1WatcomDebugContainerForTest(source, { exePath, layoutReport: injectedLayoutReport })
    : await discoverMK1WatcomDebugContainer(source, { exePath });
  const d = discoveryReport.discovery;

  if (d.status !== 'DETECTED' || !d.masterHeader || d.sections.length === 0) {
    return {
      format: 'mk1_watcom_permanent_classes_inventory_v1',
      timestamp: new Date().toISOString(),
      operationId: opId,
      provenance: discoveryReport.provenance,
      fixture: discoveryReport.fixture,
      discoveryReport,
      result: {
        languages: {
          fileOffset: 0,
          fileOffsetHex: '0x00000000',
          declaredByteLength: 0,
          consumedByteLength: 0,
          entries: [],
          valid: false,
          errors: ['No detected Watcom debug container'],
        },
        segmentAddresses: {
          fileOffset: 0,
          fileOffsetHex: '0x00000000',
          declaredByteLength: 0,
          consumedByteLength: 0,
          entryCount: 0,
          entries: [],
          valid: false,
          errors: ['No detected Watcom debug container'],
        },
        modules: {
          fileOffsetStart: 0,
          fileOffsetStartHex: '0x00000000',
          fileOffsetEnd: 0,
          fileOffsetEndHex: '0x00000000',
          declaredByteLength: 0,
          consumedByteLength: 0,
          moduleCount: 0,
          modules: [],
          tilingValid: false,
          valid: false,
          errors: ['No detected Watcom debug container'],
        },
        globalSymbols: {
          fileOffsetStart: 0,
          fileOffsetStartHex: '0x00000000',
          fileOffsetEnd: 0,
          fileOffsetEndHex: '0x00000000',
          declaredByteLength: 0,
          consumedByteLength: 0,
          symbolCount: 0,
          symbols: [],
          tilingValid: false,
          valid: false,
          errors: ['No detected Watcom debug container'],
        },
        addressInfo: {
          fileOffsetStart: 0,
          fileOffsetStartHex: '0x00000000',
          fileOffsetEnd: 0,
          fileOffsetEndHex: '0x00000000',
          declaredByteLength: 0,
          consumedByteLength: 0,
          segmentRecordCount: 0,
          segmentRecords: [],
          tilingValid: false,
          valid: false,
          errors: ['No detected Watcom debug container'],
        },
        validation: {
          languageTableConsumed: false,
          segmentTableConsumed: false,
          moduleClassTiled: false,
          globalClassTiled: false,
          addressClassTiled: false,
          allModuleLanguagesValid: false,
          allGlobalModulesValid: false,
          allAddressModulesValid: false,
          symbolSegmentsReconciled: {
            uniqueSymbolSegments: [],
            segmentTableValues: [],
            allPresentInTable: false,
          },
          duplicateModuleNames: [],
          duplicateGlobalSymbols: [],
          allChecksPassed: false,
        },
        overallValid: false,
        errors: ['No detected Watcom debug container in executable'],
      },
      status: 'NO_DEBUG_CONTAINER',
    };
  }

  // 2. Read full bytes directly from DirectorySource
  const exeSize = discoveryReport.fixture.exeSize;
  const slice = await source.readSlice(exePath, 0, exeSize);
  if (!slice || slice.length !== exeSize) {
    throw new Error(`Unable to read full ${exePath} (${exeSize} bytes) from source: permanent class enumeration fails closed.`);
  }
  const bytes = slice;

  const reader = new BinaryReader(bytes);

  // 3. Provenance strictly from source
  let provenance: FixtureProvenance;
  if (source.isSynthetic) {
    provenance = {
      sourceKind: 'in-memory-buffer',
      fileName: exePath,
      byteLength: exeSize,
      sha256: null,
      synthetic: true,
      artifactGeneratedByTest: true,
      timestamp: new Date().toISOString(),
      operationId: opId,
    };
  } else {
    const sha256 = await computeSha256(bytes);
    if (!sha256 || /^0{64}$/.test(sha256)) {
      throw new Error('Cryptographic SHA-256 computation failed or produced invalid placeholder: failing closed for authoritative research run.');
    }
    provenance = {
      sourceKind: 'user-loaded-directory',
      fileName: exePath,
      byteLength: exeSize,
      sha256,
      synthetic: false,
      artifactGeneratedByTest: false,
      timestamp: new Date().toISOString(),
      operationId: opId,
    };
  }

  // 4. Enumerate permanent classes
  const containerStart = d.containerPhysicalStart!;
  const masterHeader = d.masterHeader;
  const rootSection = d.sections[0];

  const result = enumerateWatcomPermanentClasses(
    reader,
    containerStart,
    masterHeader,
    rootSection,
  );

  return {
    format: 'mk1_watcom_permanent_classes_inventory_v1',
    timestamp: provenance.timestamp,
    operationId: opId,
    provenance,
    fixture: discoveryReport.fixture,
    discoveryReport,
    result,
    status: result.overallValid ? 'SUCCESS' : 'STRUCTURAL_ERROR',
  };
}

/**
 * Strictly gated authoritative writer for Pass 1E.3B Permanent-Class Inventory.
 * Rejects any synthetic or test run. Requires authentic user-loaded directory.
 */
export function createMK1WatcomPermanentClassesExport(
  report: MK1WatcomPermanentClassesReport,
): object {
  const prov = report.provenance;
  if (!prov) {
    throw new Error('Missing fixture provenance: cannot export research artifact');
  }

  if (prov.synthetic) {
    throw new Error('Synthetic fixtures cannot generate authoritative research artifacts');
  }
  if (prov.artifactGeneratedByTest) {
    throw new Error('Tests cannot generate authoritative research artifacts');
  }
  if (prov.sourceKind !== 'user-loaded-directory') {
    throw new Error(
      `Invalid fixture provenance sourceKind: ${prov.sourceKind}. Must originate from user-loaded directory.`,
    );
  }
  if (!prov.sha256 || !/^[0-9a-f]{64}$/.test(prov.sha256) || /^0{64}$/.test(prov.sha256)) {
    throw new Error('Authoritative export requires valid non-zero 64-character lowercase SHA-256 hex digest');
  }
  if (prov.byteLength !== report.fixture.exeSize) {
    throw new Error(
      `Provenance byte length (${prov.byteLength}) does not match report executable size (${report.fixture.exeSize})`,
    );
  }
  if (prov.operationId !== report.operationId) {
    throw new Error(
      `Provenance operation ID (${prov.operationId}) does not match report operation ID (${report.operationId})`,
    );
  }

  const d = report.discoveryReport.discovery;
  const r = report.result;

  return {
    format: report.format,
    timestamp: prov.timestamp,
    operationId: prov.operationId,
    epistemicPolicy: [
      'AUTHORITATIVE REAL-FIXTURE RESEARCH EVIDENCE',
      'ORIGINATES EXCLUSIVELY FROM USER-LOADED DIRECTORY SOURCE',
      'BLIND STRUCTURAL ENUMERATION ONLY - NO MK1 SYMBOL HEURISTICS USED',
      'NO FUNCTION DISASSEMBLY OR CALL TARGET MAPPING PERFORMED',
    ],
    provenance: {
      sourceKind: prov.sourceKind,
      fileName: prov.fileName,
      byteLength: prov.byteLength,
      sha256: prov.sha256,
      synthetic: false,
      artifactGeneratedByTest: false,
      timestamp: prov.timestamp,
      operationId: prov.operationId,
    },
    executableTopology: {
      exePath: report.fixture.exePath,
      exeSize: report.fixture.exeSize,
      exeSizeHex: report.fixture.exeSizeHex,
    },
    container: {
      containerPhysicalStart: d.containerPhysicalStart,
      containerPhysicalStartHex: d.containerPhysicalStartHex,
      containerPhysicalEnd: d.containerPhysicalEnd,
      containerPhysicalEndHex: d.containerPhysicalEndHex,
      debugSize: d.masterHeader?.debugSize,
      debugSizeHex: d.masterHeader?.debugSizeHex,
      masterHeaderOffset: d.masterHeader?.headerOffset,
      masterHeaderOffsetHex: d.masterHeader?.headerOffsetHex,
    },
    classes: {
      languages: {
        fileOffset: r.languages.fileOffset,
        fileOffsetHex: r.languages.fileOffsetHex,
        declaredByteLength: r.languages.declaredByteLength,
        consumedByteLength: r.languages.consumedByteLength,
        count: r.languages.entries.length,
        entries: r.languages.entries,
        valid: r.languages.valid,
      },
      segmentAddresses: {
        fileOffset: r.segmentAddresses.fileOffset,
        fileOffsetHex: r.segmentAddresses.fileOffsetHex,
        declaredByteLength: r.segmentAddresses.declaredByteLength,
        consumedByteLength: r.segmentAddresses.consumedByteLength,
        entryCount: r.segmentAddresses.entryCount,
        entries: r.segmentAddresses.entries,
        valid: r.segmentAddresses.valid,
      },
      modules: {
        fileOffsetStart: r.modules.fileOffsetStart,
        fileOffsetStartHex: r.modules.fileOffsetStartHex,
        fileOffsetEnd: r.modules.fileOffsetEnd,
        fileOffsetEndHex: r.modules.fileOffsetEndHex,
        declaredByteLength: r.modules.declaredByteLength,
        consumedByteLength: r.modules.consumedByteLength,
        moduleCount: r.modules.moduleCount,
        modules: r.modules.modules.map((m) => ({
          moduleIndex: m.moduleIndex,
          fileOffset: m.fileOffset,
          fileOffsetHex: m.fileOffsetHex,
          sectionOffset: m.sectionOffset,
          sectionOffsetHex: m.sectionOffsetHex,
          recordByteLength: m.recordByteLength,
          languageOffset: m.languageOffset,
          resolvedLanguage: m.resolvedLanguage,
          locals: m.locals,
          types: m.types,
          lines: m.lines,
          nameLength: m.nameLength,
          name: m.name,
          valid: m.valid,
        })),
        tilingValid: r.modules.tilingValid,
        valid: r.modules.valid,
      },
      globalSymbols: {
        fileOffsetStart: r.globalSymbols.fileOffsetStart,
        fileOffsetStartHex: r.globalSymbols.fileOffsetStartHex,
        fileOffsetEnd: r.globalSymbols.fileOffsetEnd,
        fileOffsetEndHex: r.globalSymbols.fileOffsetEndHex,
        declaredByteLength: r.globalSymbols.declaredByteLength,
        consumedByteLength: r.globalSymbols.consumedByteLength,
        symbolCount: r.globalSymbols.symbolCount,
        symbols: r.globalSymbols.symbols.map((s) => ({
          globalIndex: s.globalIndex,
          fileOffset: s.fileOffset,
          fileOffsetHex: s.fileOffsetHex,
          sectionOffset: s.sectionOffset,
          sectionOffsetHex: s.sectionOffsetHex,
          recordByteLength: s.recordByteLength,
          addressOffset: s.addressOffset,
          addressOffsetHex: s.addressOffsetHex,
          segment: s.segment,
          segmentHex: s.segmentHex,
          moduleIndex: s.moduleIndex,
          resolvedModuleName: s.resolvedModuleName,
          kind: s.rawKind,
          kindBits: s.kindBits,
          nameLength: s.nameLength,
          name: s.name,
          valid: s.valid,
        })),
        tilingValid: r.globalSymbols.tilingValid,
        valid: r.globalSymbols.valid,
      },
      addressInfo: {
        fileOffsetStart: r.addressInfo.fileOffsetStart,
        fileOffsetStartHex: r.addressInfo.fileOffsetStartHex,
        fileOffsetEnd: r.addressInfo.fileOffsetEnd,
        fileOffsetEndHex: r.addressInfo.fileOffsetEndHex,
        declaredByteLength: r.addressInfo.declaredByteLength,
        consumedByteLength: r.addressInfo.consumedByteLength,
        segmentRecordCount: r.addressInfo.segmentRecordCount,
        segmentRecords: r.addressInfo.segmentRecords.map((seg) => ({
          segInfoIndex: seg.segInfoIndex,
          fileOffset: seg.fileOffset,
          fileOffsetHex: seg.fileOffsetHex,
          sectionOffset: seg.sectionOffset,
          sectionOffsetHex: seg.sectionOffsetHex,
          recordByteLength: seg.recordByteLength,
          startAddressOffset: seg.startAddressOffset,
          startAddressOffsetHex: seg.startAddressOffsetHex,
          segment: seg.segment,
          segmentHex: seg.segmentHex,
          entryCount: seg.entryCount,
          isNonSect: seg.isNonSect,
          entries: seg.entries,
          valid: seg.valid,
        })),
        tilingValid: r.addressInfo.tilingValid,
        valid: r.addressInfo.valid,
      },
    },
    validation: report.result.validation,
    overallValid: report.result.overallValid,
    errors: report.result.errors,
  };
}

/**
 * Non-authoritative serializer for test inspection or in-memory verification.
 */
export function serializeWatcomPermanentClassesNonAuthoritative(
  report: MK1WatcomPermanentClassesReport,
): object {
  return {
    format: report.format,
    timestamp: report.timestamp,
    operationId: report.operationId,
    nonAuthoritative: true,
    provenance: report.provenance,
    moduleCount: report.result.modules.moduleCount,
    symbolCount: report.result.globalSymbols.symbolCount,
    addressRecordCount: report.result.addressInfo.segmentRecordCount,
    validation: report.result.validation,
    overallValid: report.result.overallValid,
  };
}

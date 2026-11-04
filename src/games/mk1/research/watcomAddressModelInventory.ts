/**
 * MK1.EXE Watcom-to-LE Address Model Qualification Inventory (Pass 1E.3C.1).
 *
 * Grounded in:
 * - Authoritative LE object table and page-map mechanics (Pass 1E.1 / Pass 1E.2).
 * - Watcom permanent debug-information classes (Pass 1E.3B).
 * - Blind mechanical qualification (no MK1 symbol names or expected addresses).
 * - Distinguishes structural qualification from unresolved runtime address mapping.
 * - Complete symbol coordinate inventory and physical backing breakdown (no BSS).
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  createOperationId,
  logStageCheckpoint,
} from '../../../core/diagnostics/diagnosticLogger';
import { FixtureProvenance } from '../../../core/executable/watcomDebug/watcomDebugTypes';
import {
  computeSha256,
} from './watcomDebugContainerDiscovery';
import {
  enumerateMK1WatcomPermanentClasses,
  enumerateMK1WatcomPermanentClassesForTest,
  MK1WatcomPermanentClassesReport,
} from './watcomPermanentClassInventory';
import {
  probeMK1ExecutableLayout,
} from './executableLayoutProbe';
import { MK1ExecutableLayoutReport } from './executableLayoutTypes';
import { qualifyWatcomAddressModel } from '../../../core/executable/watcomDebug/watcomAddressModelQualifier';
import {
  LEObjectSummaryExport,
  MK1WatcomAddressModelExportV2,
  WatcomAddressModelQualificationResult,
  WatcomSegmentSummaryExport,
} from '../../../core/executable/watcomDebug/watcomAddressModelTypes';

export interface MK1WatcomAddressModelReport {
  format: 'mk1_watcom_address_model_qualification_v2';
  timestamp: string;
  operationId: string;
  provenance: FixtureProvenance;
  fixture: {
    exePath: string;
    exeSize: number;
    exeSizeHex: string;
  };
  permanentClassesReport?: MK1WatcomPermanentClassesReport;
  layoutReport?: MK1ExecutableLayoutReport;
  layoutSummary?: {
    objectCount: number;
    pageSize: number;
    pageMapEntryCount: number;
    initialStackObject?: number;
    initialStackEsp?: number;
  };
  qualification: WatcomAddressModelQualificationResult;
  status: 'SUCCESS' | 'STRUCTURAL_ERROR' | 'NO_DEBUG_CONTAINER';
}

/**
 * Executes Pass 1E.3C.1 Watcom-to-LE address model qualification against MK1.EXE.
 * Production orchestrator always reads executable bytes directly from DirectorySource.
 */
export async function qualifyMK1WatcomAddressModel(
  source: DirectorySource,
  options?: {
    exePath?: string;
  },
): Promise<MK1WatcomAddressModelReport> {
  return executeAddressModelQualification(source, options?.exePath);
}

/**
 * Internal/test-only orchestrator for synthetic test fixtures.
 * Gated: strictly throws if source is not synthetic.
 */
export async function qualifyMK1WatcomAddressModelForTest(
  source: DirectorySource,
  testOptions?: {
    exePath?: string;
    layoutReport?: MK1ExecutableLayoutReport;
    permanentClassesReport?: MK1WatcomPermanentClassesReport;
  },
): Promise<MK1WatcomAddressModelReport> {
  if (!source.isSynthetic) {
    throw new Error('qualifyMK1WatcomAddressModelForTest cannot be invoked on non-synthetic source');
  }
  return executeAddressModelQualification(
    source,
    testOptions?.exePath,
    testOptions?.layoutReport,
    testOptions?.permanentClassesReport,
  );
}

async function executeAddressModelQualification(
  source: DirectorySource,
  customExePath?: string,
  injectedLayoutReport?: MK1ExecutableLayoutReport,
  injectedPermanentReport?: MK1WatcomPermanentClassesReport,
): Promise<MK1WatcomAddressModelReport> {
  const opId = createOperationId();
  const exePath = customExePath || 'MK1.EXE';

  logStageCheckpoint('research-mk1', 'watcom-address-model', opId, 'start', {
    exePath,
  });

  if ((injectedLayoutReport || injectedPermanentReport) && !source.isSynthetic) {
    throw new Error('External report injection is prohibited on non-synthetic source');
  }

  // 1. Probe LE executable layout
  const layoutReport =
    injectedLayoutReport || (await probeMK1ExecutableLayout(source, { exePath }));
  const exeSize = layoutReport.exeSize;
  const leObjects = layoutReport.objects || [];
  const pageSize = layoutReport.parsedHeader?.pageSize || 4096;
  const pageMap = layoutReport.pageMap || [];
  const initialStackObject = layoutReport.parsedHeader?.stackObject;
  const initialStackEsp = layoutReport.parsedHeader?.stackEsp;

  // 2. Enumerate Watcom permanent classes
  const permanentReport =
    injectedPermanentReport ||
    (source.isSynthetic && injectedLayoutReport
      ? await enumerateMK1WatcomPermanentClassesForTest(source, { exePath, layoutReport: injectedLayoutReport })
      : await enumerateMK1WatcomPermanentClasses(source, { exePath }));

  const d = permanentReport.discoveryReport.discovery;
  const r = permanentReport.result;

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
    const bytes = await source.readSlice(exePath, 0, exeSize);
    if (!bytes || bytes.length !== exeSize) {
      throw new Error(`Unable to read full ${exePath} (${exeSize} bytes) for provenance calculation.`);
    }
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

  // 4. If no debug container, return early
  if (d.status !== 'DETECTED' || !r.overallValid) {
    return {
      format: 'mk1_watcom_address_model_qualification_v2',
      timestamp: provenance.timestamp,
      operationId: opId,
      provenance,
      fixture: permanentReport.fixture,
      permanentClassesReport: permanentReport,
      layoutSummary: {
        objectCount: leObjects.length,
        pageSize,
        pageMapEntryCount: pageMap.length,
        initialStackObject,
        initialStackEsp,
      },
      qualification: {
        segmentQualifications: [],
        uniqueMappingCount: 0,
        ambiguousMappingCount: 0,
        unmappedSegmentCount: 0,
        overallMappingState: 'FAILED',
        physicalBackingSummary: {
          fileBacked: 0,
          pagePadding: 0,
          zeroFilledPage: 0,
          virtualUnbackedBeyondPageTable: 0,
          pageMapEntryUnavailable: 0,
          outsideObject: 0,
          unknownNonFileBacked: 0,
          totalSymbols: 0,
        },
        unresolvedCoverage: [],
        moduleRangeReconciliation: {
          summary: {
            insideDefiningModuleSpanCount: 0,
            atDefiningModuleEndCount: 0,
            insideDifferentModuleSpanCount: 0,
            outsideAddressInfoCoverageCount: 0,
            noDefiningModuleSpanCount: 0,
            totalSymbolsReconciled: 0,
          },
          exceptions: [],
        },
        symbolCoordinateInventory: [],
        symbolCoordinatesSample: [],
        addressInfoReconciliations: [],
        addressInfoAllContained: false,
        errors: ['Permanent classes are invalid or debug container not detected'],
      },
      status: d.status !== 'DETECTED' ? 'NO_DEBUG_CONTAINER' : 'STRUCTURAL_ERROR',
    };
  }

  // 5. Execute qualification
  const qualification = qualifyWatcomAddressModel(
    r.segmentAddresses,
    r.globalSymbols,
    r.addressInfo,
    leObjects,
    pageSize,
    pageMap,
    initialStackObject,
    initialStackEsp,
  );

  return {
    format: 'mk1_watcom_address_model_qualification_v2',
    timestamp: provenance.timestamp,
    operationId: opId,
    provenance,
    fixture: permanentReport.fixture,
    permanentClassesReport: permanentReport,
    layoutReport,
    layoutSummary: {
      objectCount: leObjects.length,
      pageSize,
      pageMapEntryCount: pageMap.length,
      initialStackObject,
      initialStackEsp,
    },
    qualification,
    status: qualification.errors.length === 0 ? 'SUCCESS' : 'STRUCTURAL_ERROR',
  };
}

/**
 * Strictly gated authoritative export for Pass 1E.3C.1 Address Model Qualification.
 * Fails closed on any synthetic or test provenance. Requires authentic user-loaded directory.
 */
export function createMK1WatcomAddressModelExport(
  report: MK1WatcomAddressModelReport,
): MK1WatcomAddressModelExportV2 {
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

  const q = report.qualification;
  const perm = report.permanentClassesReport?.result;

  // Watcom Segments export summary
  const watcomSegments: WatcomSegmentSummaryExport[] = q.segmentQualifications.map((sq) => {
    const pairings = sq.testedPairings[0];
    return {
      watcomSegment: sq.watcomSegment,
      watcomSegmentHex: sq.watcomSegmentHex,
      symbolCount: pairings?.totalSymbolsInSegment ?? 0,
      codeCount: pairings?.codeSymbolCount ?? 0,
      dataCount: pairings?.dataSymbolCount ?? 0,
      staticCount: pairings?.staticSymbolCount ?? 0,
      addressInfoRecordCount: pairings?.addressInfoRecordCount ?? 0,
      addressInfoDeclaredSpan: pairings?.addressInfoDeclaredSpan ?? 0,
      addressInfoDeclaredSpanHex: pairings?.addressInfoDeclaredSpanHex ?? '0x00000000',
      qualificationStatus: sq.qualificationStatus,
      qualifiedLeObjectNumber: sq.qualifiedObjectNumber,
    };
  });

  // LE Objects export summary
  const leObjects: LEObjectSummaryExport[] = [];
  const candidateObjectMap = new Map<number, boolean>();
  for (const sq of q.segmentQualifications) {
    for (const p of sq.testedPairings) {
      if (!candidateObjectMap.has(p.leObjectNumber)) {
        candidateObjectMap.set(p.leObjectNumber, true);
        leObjects.push({
          objectNumber: p.leObjectNumber,
          virtualSize: p.leObjectVirtualSize,
          virtualSizeHex: p.leObjectVirtualSizeHex,
          relocationBaseAddress: p.leObjectRelocBase,
          relocationBaseAddressHex: p.leObjectRelocBaseHex,
          flags: p.leObjectFlags,
          flagsHex: p.leObjectFlagsHex,
          isExecutable: p.leObjectIsExecutable,
          isWritable: p.leObjectIsWritable,
          isReadable: p.leObjectIsReadable,
          pageMapIndex: p.leObjectPageMapIndex,
          pageMapEntryCount: p.leObjectPageMapEntryCount,
        });
      }
    }
  }

  // Verify exported LE objects against parsed LE object table if available
  if (report.layoutReport?.objects) {
    for (const expObj of leObjects) {
      const orig = report.layoutReport.objects.find((o) => o.objectNumber === expObj.objectNumber);
      if (orig) {
        if (
          expObj.pageMapIndex !== orig.pageMapIndex ||
          expObj.pageMapEntryCount !== orig.pageMapEntryCount ||
          expObj.virtualSize !== orig.virtualSize
        ) {
          throw new Error(
            `Exported LE object ${expObj.objectNumber} does not reconcile with parsed LE object table: pageMapIndex ${expObj.pageMapIndex} vs ${orig.pageMapIndex}, count ${expObj.pageMapEntryCount} vs ${orig.pageMapEntryCount}`,
          );
        }
      }
    }
  }

  // Invariant validation: counts from every exported symbol's moduleRangeReconciliation must exactly reproduce aggregate summary
  const perSymbolModuleCounts = {
    insideDefiningModuleSpanCount: 0,
    atDefiningModuleEndCount: 0,
    insideDifferentModuleSpanCount: 0,
    outsideAddressInfoCoverageCount: 0,
    noDefiningModuleSpanCount: 0,
  };
  for (const sym of q.symbolCoordinateInventory) {
    switch (sym.moduleRangeReconciliation) {
      case 'INSIDE_DEFINING_MODULE_SPAN':
        perSymbolModuleCounts.insideDefiningModuleSpanCount++;
        break;
      case 'AT_DEFINING_MODULE_END':
        perSymbolModuleCounts.atDefiningModuleEndCount++;
        break;
      case 'INSIDE_DIFFERENT_MODULE_SPAN':
        perSymbolModuleCounts.insideDifferentModuleSpanCount++;
        break;
      case 'OUTSIDE_ADDRESS_INFO_COVERAGE':
        perSymbolModuleCounts.outsideAddressInfoCoverageCount++;
        break;
      case 'NO_DEFINING_MODULE_SPAN':
        perSymbolModuleCounts.noDefiningModuleSpanCount++;
        break;
    }
  }

  const modSum = q.moduleRangeReconciliation.summary;
  const moduleCountsMatch =
    perSymbolModuleCounts.insideDefiningModuleSpanCount === modSum.insideDefiningModuleSpanCount &&
    perSymbolModuleCounts.atDefiningModuleEndCount === modSum.atDefiningModuleEndCount &&
    perSymbolModuleCounts.insideDifferentModuleSpanCount === modSum.insideDifferentModuleSpanCount &&
    perSymbolModuleCounts.outsideAddressInfoCoverageCount === modSum.outsideAddressInfoCoverageCount &&
    perSymbolModuleCounts.noDefiningModuleSpanCount === modSum.noDefiningModuleSpanCount;

  if (!moduleCountsMatch) {
    throw new Error(
      `Per-symbol module range reconciliation counts do not reconcile with aggregate summary: aggregate=${JSON.stringify(
        modSum,
      )}, perSymbol=${JSON.stringify(perSymbolModuleCounts)}`,
    );
  }

  // Validation checks
  const checks = [
    {
      checkId: 'PROVENANCE_REAL_USER_LOADED',
      name: 'Fixture loaded from authentic user directory',
      passed: !prov.synthetic && !prov.artifactGeneratedByTest && prov.sourceKind === 'user-loaded-directory',
      detail: `Source: ${prov.sourceKind}`,
    },
    {
      checkId: 'SHA256_VALID_HEX',
      name: 'Cryptographic SHA-256 present and non-zero',
      passed: Boolean(prov.sha256 && /^[0-9a-f]{64}$/.test(prov.sha256) && !/^0{64}$/.test(prov.sha256)),
      detail: `SHA-256: ${prov.sha256 ?? 'missing'}`,
    },
    {
      checkId: 'STRUCTURAL_QUALIFICATION_NON_EMPTY',
      name: 'Segment qualifications non-empty',
      passed: q.segmentQualifications.length > 0,
      detail: `${q.segmentQualifications.length} segments evaluated`,
    },
    {
      checkId: 'ALL_ADDRESS_INFO_CONTAINED',
      name: 'Address-information declared spans fit within virtual size',
      passed: q.addressInfoAllContained,
      detail: q.addressInfoAllContained ? 'All spans contained' : 'Address-info span overrun detected',
    },
    {
      checkId: 'SYMBOL_INVENTORY_COMPLETE',
      name: 'Complete symbol coordinate inventory generated',
      passed: perm ? q.symbolCoordinateInventory.length === perm.globalSymbols.symbols.length : q.symbolCoordinateInventory.length > 0,
      detail: perm ? `${q.symbolCoordinateInventory.length}/${perm.globalSymbols.symbols.length} symbols present` : `${q.symbolCoordinateInventory.length} symbols present`,
    },
    {
      checkId: 'MODULE_RECONCILIATION_PER_SYMBOL_PARITY',
      name: 'Per-symbol module reconciliation status counts exactly match aggregate summary',
      passed: moduleCountsMatch,
      detail: `All ${q.symbolCoordinateInventory.length} symbol statuses strictly reconcile with aggregate counts`,
    },
    {
      checkId: 'LE_OBJECTS_AUTHENTIC_PAGE_MAP',
      name: 'Exported LE objects contain authentic non-zero pageMapIndex and pageMapEntryCount',
      passed: leObjects.length > 0 && leObjects.every((o) => o.pageMapIndex > 0 && o.pageMapEntryCount > 0),
      detail: `${leObjects.length} LE objects verified with non-zero page map properties`,
    },
  ];

  const allChecksPassed = checks.every((c) => c.passed) && q.errors.length === 0;

  // Selected mappings (structurally unique only)
  const selectedMappings = q.segmentQualifications
    .filter((sq) => sq.qualificationStatus === 'UNIQUELY_QUALIFIED' && sq.qualifiedObjectNumber !== null)
    .map((sq) => ({
      watcomSegment: sq.watcomSegment,
      watcomSegmentHex: sq.watcomSegmentHex,
      qualifiedLeObjectNumber: sq.qualifiedObjectNumber!,
      status: 'UNIQUELY_QUALIFIED' as const,
      reason: sq.qualificationReason,
      runtimeAddressVerified: false as const,
    }));

  // Mapping candidates (every tested pairing)
  const mappingCandidates = q.segmentQualifications.flatMap((sq) => sq.testedPairings);

  return {
    metadata: {
      name: 'MK1 Watcom to LE Address Model Qualification',
      version: '1.0.0',
      milestone: 'Pass 1E.3C.1',
      formatVersion: 'mk1_watcom_address_model_qualification_v2',
      exportTimestamp: prov.timestamp,
    },
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
    fixture: {
      exePath: report.fixture.exePath,
      exeSize: report.fixture.exeSize,
      exeSizeHex: report.fixture.exeSizeHex,
    },
    watcomSegments,
    leObjects,
    mappingCandidates,
    selectedMappings,
    moduleRangeReconciliation: {
      summary: q.moduleRangeReconciliation.summary,
      exceptions: q.moduleRangeReconciliation.exceptions.map((exc) => ({
        globalIndex: exc.globalIndex,
        name: exc.name,
        watcomMapSegment: exc.watcomMapSegment,
        watcomMapOffsetHex: exc.watcomMapOffsetHex,
        moduleIndex: exc.moduleIndex,
        moduleName: exc.moduleName,
        status: exc.status,
        detail: exc.detail,
      })),
    },
    physicalBackingSummary: q.physicalBackingSummary,
    unresolvedCoverage: q.unresolvedCoverage,
    symbolCoordinateInventory: q.symbolCoordinateInventory,
    symbolCoordinatesSample: q.symbolCoordinatesSample,
    validation: {
      allChecksPassed,
      overallMappingState: q.overallMappingState,
      allSymbolsMappedToUniqueObjects: q.symbolCoordinateInventory.every((s) => s.qualifiedLeObjectNumber !== null),
      runtimeAddressVerified: false,
      checks,
    },
  };
}

/**
 * Non-authoritative serializer for inspectable synthetic test data.
 */
export function serializeWatcomAddressModelNonAuthoritative(
  report: MK1WatcomAddressModelReport,
): object {
  return {
    nonAuthoritative: true,
    note: 'SYNTHETIC TEST FIXTURE DATA - NOT REAL MK1 EVIDENCE',
    ...report,
  };
}

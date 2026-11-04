import { BinaryReader } from '../../../core/binary/BinaryReader';
import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  parseLEHeader,
  scanForLeSignatures,
} from '../../../core/executable/le/leHeader';
import {
  computeObjectBackingSummary,
  parseLEObjectTable,
  parseLEPageMap,
  resolveObjectPhysicalSpans,
} from '../../../core/executable/le/leObjects';
import {
  checkRangeObjectContainment,
  fileOffsetToLoadedAddress,
} from '../../../core/executable/le/leAddressMap';
import {
  LEHeader,
  LEObjectBackingSummary,
  LEObjectEntry,
  LEPageMapEntry,
  LESignatureCandidate,
} from '../../../core/executable/le/leTypes';
import { MK1PaletteCandidate } from './paletteTypes';
import {
  MK1BoundExecutableLayout,
  MK1CompactExecutableLayoutExport,
  MK1DebugInfoSummary,
  MK1ExecutableLayoutReport,
  MK1KnownAnchorMapping,
  MK1MzWrapperLayout,
  MK1PageMapDiagnostics,
  MK1PageMapDiagnosticEntry,
  MK1PaletteObjectDistribution,
  MK1PaletteReferenceOccurrence,
} from './executableLayoutTypes';
import {
  deriveMK1ExecutableTopology,
  MK1ExecutablePhysicalTopology,
} from './executableRegionTopology';
import {
  createOperationId,
  logStageCheckpoint,
  logInfo,
  logError,
} from '../../../core/diagnostics/diagnosticLogger';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Standard known physical anchors in MK1.EXE identified through prior passes.
 */
export const MK1_KNOWN_RESEARCH_ANCHORS = [
  {
    name: 'Kano First Sprite Descriptor',
    description: 'First WITH_XY sprite descriptor of 187-member array run (0x000A7464 point; File ID 35)',
    startOffset: 0x000a7464,
    endOffset: 0x000a7464,
  },
  {
    name: 'Kano Last Run Descriptor Start',
    description: 'Start of 187th WITH_XY sprite descriptor in array run (0x000A7D20 point)',
    startOffset: 0x000a7d20,
    endOffset: 0x000a7d20,
  },
  {
    name: 'Graphics Handle Table',
    description: 'File ID to GRA metadata handle array (0x000B0C5C..0x000B11CC exclusive, 58 entries, 24-byte stride)',
    startOffset: 0x000b0c5c,
    endOffset: 0x000b11cc,
  },
  {
    name: 'Filename / String Area Base',
    description: 'Verified base anchor of internal asset path string pool (0x0008CA54 point; extent provisional)',
    startOffset: 0x0008ca54,
    endOffset: 0x0008ca54,
  },
];

/**
 * Reads the DOS MZ header and extracts e_lfanew if present.
 */
export async function inspectMzWrapper(
  source: DirectorySource,
  path: string,
  fileSize: number,
): Promise<MK1MzWrapperLayout> {
  const mzSlice = await source.readSlice(path, 0, Math.min(64, fileSize));
  if (mzSlice.length < 64) {
    return {
      mzHeaderOffset: 0,
      mzExtendedHeaderOffset: null,
      mzExtendedHeaderOffsetHex: null,
      eLfanewDiscrepancy: true,
      eLfanewNote: 'MZ header slice is smaller than 64 bytes.',
    };
  }

  const reader = new BinaryReader(mzSlice);
  const sig = reader.readUint16LE();
  const isMz = sig === 0x5a4d || sig === 0x4d5a;

  let eLfanew: number | null = null;
  if (isMz) {
    reader.seek(0x3c);
    const candidate = reader.readUint32LE();
    if (candidate >= 0x40 && candidate < fileSize) {
      eLfanew = candidate;
    }
  }

  return {
    mzHeaderOffset: 0,
    mzExtendedHeaderOffset: eLfanew,
    mzExtendedHeaderOffsetHex: eLfanew !== null ? toHex32(eLfanew) : null,
    eLfanewDiscrepancy: false,
    eLfanewNote: eLfanew !== null
      ? `DOS header e_lfanew points to 0x${eLfanew.toString(16).toUpperCase()}`
      : 'No valid e_lfanew extended header pointer found in DOS stub',
  };
}

/**
 * Maps known MK1 research anchors into the parsed LE object, page layout, and physical topology.
 */
export function mapKnownAnchors(
  objects: LEObjectEntry[],
  pageSize: number,
  pageMap?: LEPageMapEntry[],
  topology?: MK1ExecutablePhysicalTopology,
): MK1KnownAnchorMapping[] {
  return MK1_KNOWN_RESEARCH_ANCHORS.map((anchor) => {
    const containment = checkRangeObjectContainment(
      anchor.startOffset,
      anchor.endOffset,
      objects,
      pageSize,
      pageMap,
    );

    const mappedObject = containment.objectNumber !== null
      ? objects.find((o) => o.objectNumber === containment.objectNumber)
      : null;

    const startCand = containment.startCandidate;

    const isPoint = anchor.startOffset === anchor.endOffset;
    const byteLength = isPoint ? 1 : anchor.endOffset - anchor.startOffset;

    let leMappingStatus: 'mapped' | 'unmapped' | 'padding' | 'crosses-boundary';
    if (containment.isFullyContained) {
      leMappingStatus = 'mapped';
    } else if (containment.containmentStatus === 'crosses-page-padding') {
      leMappingStatus = 'padding';
    } else if (containment.containmentStatus === 'outside-mapped-objects') {
      leMappingStatus = 'unmapped';
    } else {
      leMappingStatus = 'crosses-boundary';
    }

    // Determine physical region from topology
    let physicalRegion = 'Unknown Region';
    if (topology) {
      const coveringRegion = topology.regions.find(
        (r) => anchor.startOffset >= r.fileStart && anchor.startOffset < r.fileEnd,
      );
      if (coveringRegion) {
        physicalRegion = coveringRegion.name;
      }
    }

    const containmentNote =
      containment.notes ||
      (containment.isFullyContained
        ? `Fully contained in Object ${containment.objectNumber}`
        : 'Outside mapped LE objects');

    return {
      name: anchor.name,
      description: anchor.description,
      physicalStartOffset: anchor.startOffset,
      physicalStartOffsetHex: toHex32(anchor.startOffset),
      physicalEndOffset: anchor.endOffset,
      physicalEndOffsetHex: toHex32(anchor.endOffset),
      byteLength,
      mappedObjectNumber: containment.objectNumber,
      mappedObjectOffset: startCand ? startCand.objectOffset : null,
      mappedObjectOffsetHex: startCand ? startCand.objectOffsetHex : null,
      linearAddressCandidate: startCand ? startCand.linearAddressCandidate : null,
      linearAddressCandidateHex: startCand ? startCand.linearAddressCandidateHex : null,
      objectCapabilities: mappedObject ? mappedObject.capabilities : null,
      objectRoleEvidence: mappedObject ? mappedObject.roleEvidence : null,
      isContainedInSingleSpan: containment.isFullyContained,
      physicalAnchorConfidence: 'verified',
      leMappingStatus,
      physicalRegion,
      containmentNote,
      status: 'VERIFIED',
    };
  });
}

/**
 * Correlates existing palette candidates with LE objects.
 */
export function computePaletteObjectDistribution(
  candidates: MK1PaletteCandidate[],
  objects: LEObjectEntry[],
  pageSize: number,
): MK1PaletteObjectDistribution {
  const distributionMap = new Map<number | null, {
    structuralCount: number;
    uniqueContentCount: number;
    researchShortlistCount: number;
  }>();

  // Initialize slots for each object and outside (null)
  for (const obj of objects) {
    distributionMap.set(obj.objectNumber, {
      structuralCount: 0,
      uniqueContentCount: 0,
      researchShortlistCount: 0,
    });
  }
  distributionMap.set(null, {
    structuralCount: 0,
    uniqueContentCount: 0,
    researchShortlistCount: 0,
  });

  const seenHashesByObject = new Map<number | null, Set<string>>();
  for (const obj of objects) {
    seenHashesByObject.set(obj.objectNumber, new Set<string>());
  }
  seenHashesByObject.set(null, new Set<string>());

  let totalStructural = 0;
  let totalResearch = 0;

  for (const cand of candidates) {
    totalStructural++;
    if (cand.tier === 'research') {
      totalResearch++;
    }

    const matches = fileOffsetToLoadedAddress(cand.exeOffset, objects, pageSize);
    const objNum = matches.length > 0 ? matches[0].objectNumber : null;

    const stats = distributionMap.get(objNum)!;
    stats.structuralCount++;

    const hashSet = seenHashesByObject.get(objNum)!;
    if (!hashSet.has(cand.contentHash)) {
      hashSet.add(cand.contentHash);
      stats.uniqueContentCount++;
    }

    if (cand.tier === 'research') {
      stats.researchShortlistCount++;
    }
  }

  // Calculate distinct content across the entire set
  const allUniqueHashes = new Set(candidates.map((c) => c.contentHash));

  const items = Array.from(distributionMap.entries()).map(([objNum, stats]) => {
    const matchedObj = objNum !== null ? objects.find((o) => o.objectNumber === objNum) : null;
    const key = objNum !== null ? `Object ${objNum}` : 'Outside Mapped Objects';
    const capabilities = matchedObj ? matchedObj.capabilities : 'N/A';
    const roleEvidence = matchedObj ? matchedObj.roleEvidence : 'unmapped-file-region';
    const structuralPercentage = totalStructural > 0
      ? Math.round((stats.structuralCount / totalStructural) * 1000) / 10
      : 0;

    return {
      key,
      objectNumber: objNum,
      capabilities,
      roleEvidence,
      structuralCount: stats.structuralCount,
      uniqueContentCount: stats.uniqueContentCount,
      researchShortlistCount: stats.researchShortlistCount,
      structuralPercentage,
    };
  });

  return {
    totalStructuralCandidates: totalStructural,
    totalUniqueContents: allUniqueHashes.size,
    totalResearchCandidates: totalResearch,
    distribution: items,
  };
}

/**
 * Searches mapped executable payload spans for exact 32-bit little-endian occurrences
 * of candidate palette linear addresses (experimental reconnaissance, top 20 candidates max).
 */
export async function performAddressReconnaissance(
  source: DirectorySource,
  exePath: string,
  topCandidates: MK1PaletteCandidate[],
  objects: LEObjectEntry[],
  pageSize: number,
  maxCandidates = 20,
): Promise<MK1PaletteReferenceOccurrence[]> {
  const results: MK1PaletteReferenceOccurrence[] = [];
  const candidatesToScan = topCandidates.slice(0, maxCandidates);

  for (const cand of candidatesToScan) {
    const addressMatches = fileOffsetToLoadedAddress(cand.exeOffset, objects, pageSize);
    if (addressMatches.length === 0) continue;

    const targetAddress = addressMatches[0].linearAddressCandidate;
    const targetAddressHex = addressMatches[0].linearAddressCandidateHex;

    const occurrences: { fileOffset: number; fileOffsetHex: string; containingObjectNumber: number | null }[] = [];

    // Scan through all mapped physical spans of all objects
    for (const obj of objects) {
      for (const span of obj.physicalSpans) {
        // Read span in chunks
        const chunkSize = 65536;
        let spanOffset = span.fileStart;

        while (spanOffset + 4 <= span.fileEnd && occurrences.length < 50) {
          const toRead = Math.min(chunkSize, span.fileEnd - spanOffset);
          const chunk = await source.readSlice(exePath, spanOffset, toRead);
          if (chunk.length < 4) break;

          const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          for (let i = 0; i <= chunk.length - 4; i++) {
            if (view.getUint32(i, true) === targetAddress) {
              const fileOffset = spanOffset + i;
              occurrences.push({
                fileOffset,
                fileOffsetHex: toHex32(fileOffset),
                containingObjectNumber: obj.objectNumber,
              });
              if (occurrences.length >= 50) break;
            }
          }

          if (spanOffset + toRead >= span.fileEnd) break;
          spanOffset += toRead - 3;
        }
      }
    }

    results.push({
      paletteId: cand.id,
      paletteExeOffset: cand.exeOffset,
      paletteExeOffsetHex: cand.exeOffsetHex,
      paletteLinearAddress: targetAddress,
      paletteLinearAddressHex: targetAddressHex,
      paletteLength: cand.length,
      researchScore: cand.researchScore,
      occurrenceCount: occurrences.length,
      occurrences,
      terminologyNote: 'raw address-value occurrence (NOT verified pointer reference)',
    });
  }

  return results;
}

export interface ProbeOptions {
  exePath?: string;
  paletteCandidates?: MK1PaletteCandidate[];
  runReconnaissance?: boolean;
  operationId?: string;
  onProgress?: (step: string, progress: number) => void;
}

/**
 * Main probe function to analyze the MK1 bound executable and LE object map.
 */
export async function probeMK1ExecutableLayout(
  source: DirectorySource,
  options: ProbeOptions = {},
): Promise<MK1ExecutableLayoutReport> {
  const targetPath = options.exePath || 'MK1.EXE';
  const operationId = options.operationId || createOperationId('exe-layout');

  logInfo('research-mk1', 'executable-layout', operationId, 'Starting MK1 executable layout analysis', {
    targetPath,
    runReconnaissance: options.runReconnaissance,
  });

  try {
    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Locating executable', { targetPath });
    options.onProgress?.('Locating executable...', 0.05);

    const fileList = await source.listRecursive();
    const exeEntry = fileList.find((e) => e.path.toUpperCase() === targetPath.toUpperCase());
    if (!exeEntry) {
      throw new Error(`Executable not found in directory: ${targetPath}`);
    }

    const fileSize = exeEntry.size;
    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Executable located', {
      exePath: exeEntry.path,
      fileSize,
    });

    // 1. Inspect DOS MZ stub
    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Inspecting DOS MZ wrapper stub');
    options.onProgress?.('Inspecting DOS MZ wrapper stub...', 0.15);
    const mzWrapper = await inspectMzWrapper(source, exeEntry.path, fileSize);

    // 2. Scan for raw "LE" ASCII signatures & validate
    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Scanning for embedded LE signatures');
    options.onProgress?.('Scanning for embedded LE signatures...', 0.3);
    const leCandidates = await scanForLeSignatures(source, exeEntry.path, fileSize);

    // Select best valid LE payload
    const validCandidates = leCandidates.filter(
      (c) => c.validation.isValid && c.validation.confidence === 'strong',
    );
    const selectedCandidate = validCandidates.length > 0
      ? validCandidates[0]
      : leCandidates.find((c) => c.validation.isValid) || null;

    if (selectedCandidate && mzWrapper.mzExtendedHeaderOffset !== selectedCandidate.fileOffset) {
      mzWrapper.eLfanewDiscrepancy = true;
      mzWrapper.eLfanewNote = `DOS header e_lfanew (${mzWrapper.mzExtendedHeaderOffsetHex || 'none'}) does not match embedded LE payload offset (${selectedCandidate.fileOffsetHex}). The 32-bit LE payload is bound internally.`;
    }

    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'LE payload selection complete', {
      rawOccurrencesCount: leCandidates.length,
      selectedPayloadOffset: selectedCandidate?.fileOffsetHex || null,
    });

    const boundLayout: MK1BoundExecutableLayout = {
      mzWrapper,
      rawLeOccurrencesCount: leCandidates.length,
      rawLeOccurrences: leCandidates,
      selectedPayloadCandidate: selectedCandidate,
    };

    let parsedHeader: LEHeader | null = null;
    let objects: LEObjectEntry[] = [];
    let pageMap: LEPageMapEntry[] = [];
    let debugInfo: MK1DebugInfoSummary = {
      debugInfoFileOffset: 0,
      debugInfoFileOffsetHex: '0x00000000',
      debugInfoLength: 0,
      debugInfoPresent: false,
      notes: 'No valid LE payload identified',
      status: 'UNKNOWN',
    };

    if (selectedCandidate && selectedCandidate.header) {
      parsedHeader = selectedCandidate.header;

      // 3. Parse Object Table
      logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Parsing LE Object Table', {
        objectCount: parsedHeader.objectCount,
      });
      options.onProgress?.('Parsing LE Object Table...', 0.55);
      const objectTableSlice = await source.readSlice(
        exeEntry.path,
        parsedHeader.objectTableFileOffset,
        parsedHeader.objectCount * 24,
      );
      const objReader = new BinaryReader(objectTableSlice);
      const rawObjects = parseLEObjectTable(objReader, 0, parsedHeader.objectCount);

      // 4. Parse Page Map
      logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Parsing LE Page Map', {
        modulePageCount: parsedHeader.modulePageCount,
      });
      options.onProgress?.('Parsing LE Page Map...', 0.7);
      const pageMapSlice = await source.readSlice(
        exeEntry.path,
        parsedHeader.objectPageMapFileOffset,
        parsedHeader.modulePageCount * 4,
      );
      const pageReader = new BinaryReader(pageMapSlice);
      pageMap = parseLEPageMap(
        pageReader,
        0,
        parsedHeader.modulePageCount,
        parsedHeader.dataPagesFileOffset,
        parsedHeader.pageSize,
        fileSize,
        parsedHeader.bytesOnLastPage,
      );

      // 5. Resolve Object Physical Spans
      logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Resolving Object Physical Spans');
      objects = resolveObjectPhysicalSpans(rawObjects, pageMap);

      // 6. Debug Info
      const hasDebug = parsedHeader.debugInfoFileOffset > 0 && parsedHeader.debugInfoLength > 0;
      debugInfo = {
        debugInfoFileOffset: parsedHeader.debugInfoFileOffset,
        debugInfoFileOffsetHex: toHex32(parsedHeader.debugInfoFileOffset),
        debugInfoLength: parsedHeader.debugInfoLength,
        debugInfoPresent: hasDebug,
        notes: hasDebug
          ? `Watcom/LE debug section declared at offset 0x${parsedHeader.debugInfoFileOffset.toString(16)} (${parsedHeader.debugInfoLength} bytes)`
          : 'No separate debug section declared in LE header',
        status: hasDebug ? 'VERIFIED' : 'UNKNOWN',
      };
    }

    const pageSize = parsedHeader?.pageSize || 4096;

    // 7. Object Backing Metrics
    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Computing Object Backing Metrics');
    const objectBackingSummary = objects.map((obj) =>
      computeObjectBackingSummary(obj, pageMap, pageSize),
    );

    // 8. Executable Region Topology & Module Boundary Derivation
    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Deriving Executable Region Topology');
    const topology = deriveMK1ExecutableTopology(
      fileSize,
      selectedCandidate?.fileOffset ?? null,
      parsedHeader,
      objects,
      pageMap,
      pageSize,
      MK1_KNOWN_RESEARCH_ANCHORS,
    );

    // 9. Map known MK1 anchors
    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Mapping Known MK1 Anchors');
    options.onProgress?.('Cross-checking known MK1 anchors...', 0.85);
    const knownAnchors = mapKnownAnchors(objects, pageSize, pageMap, topology);

    // 10. Correlate palette distribution
    let paletteDistribution: MK1PaletteObjectDistribution | undefined = undefined;
    if (options.paletteCandidates && options.paletteCandidates.length > 0 && parsedHeader) {
      logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Correlating Palette Distribution');
      options.onProgress?.('Correlating palette candidates with LE objects...', 0.9);
      paletteDistribution = computePaletteObjectDistribution(
        options.paletteCandidates,
        objects,
        pageSize,
      );
    }

    // 11. Optional reference reconnaissance
    let referenceReconnaissance: MK1PaletteReferenceOccurrence[] | undefined = undefined;
    if (
      options.runReconnaissance &&
      options.paletteCandidates &&
      options.paletteCandidates.length > 0 &&
      parsedHeader
    ) {
      logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Performing Address Reconnaissance');
      options.onProgress?.('Performing address-value reconnaissance...', 0.95);
      const topResearch = options.paletteCandidates
        .filter((c) => c.tier === 'research')
        .slice(0, 20);
      referenceReconnaissance = await performAddressReconnaissance(
        source,
        exeEntry.path,
        topResearch,
        objects,
        pageSize,
        20,
      );
    }

    options.onProgress?.('Executable layout probe completed', 1.0);
    const pageMapDiagnostics = createPageMapDiagnostics(pageMap);

    logStageCheckpoint(operationId, 'research-mk1', 'executable-layout', 'Report Constructed', {
      objectsCount: objects.length,
      regionsCount: topology.regions.length,
      knownAnchorsCount: knownAnchors.length,
    });

    return {
      timestamp: new Date().toISOString(),
      exePath: exeEntry.path,
      exeSize: fileSize,
      boundLayout,
      parsedHeader,
      objects,
      objectBackingSummary,
      pageMap,
      pageMapDiagnostics,
      topology,
      validation: selectedCandidate?.validation || null,
      debugInfo,
      knownAnchors,
      paletteDistribution,
      referenceReconnaissance,
    };
  } catch (err: unknown) {
    logError('research-mk1', 'executable-layout', operationId, err, {
      targetPath,
    });
    throw err;
  }
}

/**
 * Creates forensic summary counts and lightweight diagnostic records for LE page map entries.
 */
export function createPageMapDiagnostics(pageMap: LEPageMapEntry[]): MK1PageMapDiagnostics {
  let validEntries = 0;
  let mappedValidEntries = 0;
  let iteratedEntries = 0;
  let invalidEntries = 0;
  let zeroFilledEntries = 0;
  let rangeEntries = 0;
  let unknownEntries = 0;
  let minDecoded: number | null = null;
  let maxDecoded: number | null = null;

  const entries: MK1PageMapDiagnosticEntry[] = pageMap.map((p) => {
    switch (p.pageType) {
      case 'valid':
        validEntries++;
        if (p.physicalFileStart !== undefined) {
          mappedValidEntries++;
        }
        break;
      case 'iterated':
        iteratedEntries++;
        break;
      case 'invalid':
        invalidEntries++;
        break;
      case 'zero-filled':
        zeroFilledEntries++;
        break;
      case 'range':
        rangeEntries++;
        break;
      default:
        unknownEntries++;
        break;
    }

    if (p.physicalPageNumber > 0) {
      if (minDecoded === null || p.physicalPageNumber < minDecoded) {
        minDecoded = p.physicalPageNumber;
      }
      if (maxDecoded === null || p.physicalPageNumber > maxDecoded) {
        maxDecoded = p.physicalPageNumber;
      }
    }

    const b0Hex = p.rawBytes[0].toString(16).padStart(2, '0').toUpperCase();
    const b1Hex = p.rawBytes[1].toString(16).padStart(2, '0').toUpperCase();
    const b2Hex = p.rawBytes[2].toString(16).padStart(2, '0').toUpperCase();
    const rawBytesHex = `${b0Hex} ${b1Hex} ${b2Hex}`;
    const rawFlagsHex = '0x' + p.rawFlags.toString(16).padStart(2, '0').toUpperCase();

    return {
      pageMapIndex: p.pageMapIndex,
      rawBytesHex,
      rawFlagsHex,
      pageType: p.pageType,
      physicalPageNumber: p.physicalPageNumber,
      physicalFileStartHex: p.physicalFileStart !== undefined ? toHex32(p.physicalFileStart) : null,
      physicalByteLength: p.physicalByteLength !== undefined ? p.physicalByteLength : null,
    };
  });

  return {
    totalEntries: pageMap.length,
    validEntries,
    mappedValidEntries,
    iteratedEntries,
    invalidEntries,
    zeroFilledEntries,
    rangeEntries,
    unknownEntries,
    minDecodedPhysicalPageNumber: minDecoded,
    maxDecodedPhysicalPageNumber: maxDecoded,
    entries,
  };
}

/**
 * Creates a deterministic compact JSON export of the executable layout.
 */
export function createMK1ExecutableLayoutExport(
  report: MK1ExecutableLayoutReport,
  metadata: { name: string; version: string; milestone: string },
): MK1CompactExecutableLayoutExport {
  return {
    metadata: {
      name: metadata.name,
      version: metadata.version,
      milestone: metadata.milestone,
      formatVersion: 'mk1_compact_executable_layout_v3',
      exportTimestamp: report.timestamp,
    },
    fixture: {
      exePath: report.exePath,
      exeSize: report.exeSize,
    },
    mzWrapper: report.boundLayout.mzWrapper,
    leDiscovery: {
      rawOccurrencesCount: report.boundLayout.rawLeOccurrencesCount,
      candidates: report.boundLayout.rawLeOccurrences.map((c) => ({
        fileOffset: c.fileOffset,
        fileOffsetHex: c.fileOffsetHex,
        isValid: c.validation.isValid,
        confidence: c.validation.confidence,
        passedRuleCount: c.validation.passedRuleCount,
        totalRuleCount: c.validation.totalRuleCount,
      })),
      selectedPayloadOffset: report.boundLayout.selectedPayloadCandidate?.fileOffset || null,
      selectedPayloadOffsetHex: report.boundLayout.selectedPayloadCandidate?.fileOffsetHex || null,
    },
    headerSummary: report.parsedHeader
      ? {
          signature: report.parsedHeader.signature,
          cpuType: report.parsedHeader.cpuTypeDescription,
          targetOs: report.parsedHeader.targetOsDescription,
          pageSize: report.parsedHeader.pageSize,
          modulePageCount: report.parsedHeader.modulePageCount,
          objectCount: report.parsedHeader.objectCount,
          dataPagesFileOffset: report.parsedHeader.dataPagesFileOffset,
          dataPagesFileOffsetHex: toHex32(report.parsedHeader.dataPagesFileOffset),
          entryPoint: {
            object: report.parsedHeader.entryObject,
            eip: report.parsedHeader.entryEipHex,
          },
          stack: {
            object: report.parsedHeader.stackObject,
            esp: report.parsedHeader.stackEspHex,
          },
          debugInfo: {
            fileOffset: report.debugInfo.debugInfoFileOffset,
            fileOffsetHex: report.debugInfo.debugInfoFileOffsetHex,
            length: report.debugInfo.debugInfoLength,
            present: report.debugInfo.debugInfoPresent,
          },
        }
      : undefined,
    objects: report.objects.map((obj) => ({
      objectNumber: obj.objectNumber,
      virtualSize: obj.virtualSize,
      virtualSizeHex: obj.virtualSizeHex,
      relocationBaseAddress: obj.relocationBaseAddress,
      relocationBaseAddressHex: obj.relocationBaseAddressHex,
      capabilities: obj.capabilities,
      roleEvidence: obj.roleEvidence,
      rawFlagsHex: toHex32(obj.rawFlags),
      pageMapIndex: obj.pageMapIndex,
      pageMapEntryCount: obj.pageMapEntryCount,
      mappedPageCount: obj.mappedPageCount,
      zeroFilledPageCount: obj.zeroFilledPageCount,
      physicalSpans: obj.physicalSpans.map((s) => ({
        fileStart: s.fileStart,
        fileStartHex: toHex32(s.fileStart),
        fileEnd: s.fileEnd,
        fileEndHex: toHex32(s.fileEnd),
        byteLength: s.byteLength,
        objectPageStart: s.objectPageStart,
        pageCount: s.pageCount,
      })),
    })),
    objectBackingSummary: report.objectBackingSummary,
    pageMapDiagnostics: report.pageMapDiagnostics,
    moduleBoundaries: report.topology.boundaries,
    postModuleTail: report.topology.postModuleTail,
    executableRegions: report.topology.regions,
    knownAnchors: report.knownAnchors,
    paletteDistribution: report.paletteDistribution,
    referenceReconnaissance: report.referenceReconnaissance?.map((r) => ({
      paletteId: r.paletteId,
      paletteExeOffsetHex: r.paletteExeOffsetHex,
      paletteLinearAddressHex: r.paletteLinearAddressHex,
      researchScore: r.researchScore,
      occurrenceCount: r.occurrenceCount,
      occurrences: r.occurrences.map((o) => ({
        fileOffsetHex: o.fileOffsetHex,
        containingObjectNumber: o.containingObjectNumber,
      })),
    })),
  };
}

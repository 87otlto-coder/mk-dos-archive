import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { scanUint32LE, scanAsciiPattern, readNullTerminatedAscii } from '../../../core/binary/chunkedScanner';
import {
  parseCandidateFileEntry,
  isPlausibleFileEntryRecord,
  MK1_FILE_ENTRY_SIZE,
  MK1FileEntryValidation,
} from './fileEntryProbe';
import { APP_NAME, APP_VERSION } from '../../../appMetadata';
import {
  KnownFixtureAnchor,
  MK1_KNOWN_FIXTURE_ANCHORS,
  MK1PathResolutionMethod,
  MK1EntryConfidence,
  MK1EntryPresence,
  MK1HandleTableEntry,
  MK1TableComparison,
  MK1DirectoryComparison,
  MK1HandleTableResult,
  MK1HandleTableExportData,
  MK1TableReconstructionOptions,
  MAX_HANDLE_TABLE_ENTRIES,
} from './handleTableTypes';

export * from './handleTableTypes';

/**
 * Reconstructs the full contiguous MK1 GRA Handle Table from MK1.EXE.
 */
export async function reconstructMK1HandleTable(
  source: DirectorySource,
  options: MK1TableReconstructionOptions = {},
): Promise<MK1HandleTableResult> {
  const toHex32 = (v: number) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
  const toHex8 = (v: number) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`;

  const maxEntries = options.maxEntries ?? MAX_HANDLE_TABLE_ENTRIES;
  const files = await source.listRecursive();

  // 1. Identify primary executable
  let exeEntry = options.exePath
    ? files.find((f) => f.path.toUpperCase() === options.exePath?.toUpperCase())
    : undefined;

  if (!exeEntry) {
    exeEntry = files.find((f) => {
      const u = f.name.toUpperCase();
      return u === 'MK1.EXE' || u === 'MK.EXE';
    });
  }

  if (!exeEntry) {
    throw new Error('Primary MK1 executable (MK1.EXE / MK.EXE) not found');
  }

  options.onProgress?.('Locating handle table anchor...', 0.1);

  // 2. Identify target anchor GRA resource
  let anchorGraPath = options.targetAnchorGraPath;
  if (!anchorGraPath) {
    const jcatt = files.find((f) => f.name.toUpperCase() === 'JCATT.GRA');
    anchorGraPath = jcatt ? jcatt.path : undefined;
  }

  let anchorOffset: number | null = null;
  let targetAnchorSize = 0;

  if (anchorGraPath) {
    const graEntry = files.find(
      (f) => f.path.toUpperCase() === anchorGraPath?.toUpperCase() || f.name.toUpperCase() === anchorGraPath?.toUpperCase(),
    );
    if (graEntry) {
      targetAnchorSize = graEntry.size;
      const matchOffsets = await scanUint32LE(source, exeEntry.path, targetAnchorSize, {
        fileSize: exeEntry.size,
      });

      for (const match of matchOffsets) {
        const candidateOffset = match - 4;
        if (candidateOffset >= 0 && candidateOffset + MK1_FILE_ENTRY_SIZE <= exeEntry.size) {
          const slice = await source.readSlice(exeEntry.path, candidateOffset, MK1_FILE_ENTRY_SIZE);
          const cand = parseCandidateFileEntry(slice, candidateOffset, targetAnchorSize);
          if (cand && cand.validation.allRulesPassed) {
            anchorOffset = candidateOffset;
            break;
          }
        }
      }
    }
  }

  // Fallback anchor search if JCATT not found
  if (anchorOffset === null) {
    for (let offset = 0; offset + MK1_FILE_ENTRY_SIZE <= exeEntry.size; offset += 4) {
      const slice = await source.readSlice(exeEntry.path, offset, MK1_FILE_ENTRY_SIZE);
      if (isPlausibleFileEntryRecord(slice).isValid) {
        anchorOffset = offset;
        break;
      }
    }
  }

  if (anchorOffset === null) {
    throw new Error('Could not locate a valid FileEntry anchor in MK1 executable');
  }

  options.onProgress?.('Scanning contiguous table bounds...', 0.3);

  // 3. Backward scan to table start
  let tableStartOffset = anchorOffset;
  let backwardCount = 0;

  while (backwardCount < maxEntries) {
    const prevOffset = tableStartOffset - MK1_FILE_ENTRY_SIZE;
    if (prevOffset < 0) break;

    const slice = await source.readSlice(exeEntry.path, prevOffset, MK1_FILE_ENTRY_SIZE);
    if (!isPlausibleFileEntryRecord(slice).isValid) {
      break;
    }
    tableStartOffset = prevOffset;
    backwardCount++;
  }

  // 4. Forward scan to table end
  let curOffset = tableStartOffset;
  const rawEntries: Array<{
    offset: number;
    rawFilenameOffset: number;
    fileSize: number;
    flags: number;
    pad0: number;
    pad1: number;
    pad2: number;
    unknown0: number;
    bufferPointer: number;
    unknown1: number;
    validation: MK1FileEntryValidation;
  }> = [];

  while (rawEntries.length < maxEntries && curOffset + MK1_FILE_ENTRY_SIZE <= exeEntry.size) {
    const slice = await source.readSlice(exeEntry.path, curOffset, MK1_FILE_ENTRY_SIZE);
    if (!isPlausibleFileEntryRecord(slice).isValid) {
      break;
    }
    const cand = parseCandidateFileEntry(slice, curOffset);
    if (!cand) break;

    rawEntries.push({
      offset: curOffset,
      rawFilenameOffset: cand.raw.rawFilenameOffset,
      fileSize: cand.raw.fileSize,
      flags: cand.raw.flags,
      pad0: cand.raw.padding[0],
      pad1: cand.raw.padding[1],
      pad2: cand.raw.padding[2],
      unknown0: cand.raw.unknown0,
      bufferPointer: cand.raw.bufferPointer,
      unknown1: cand.raw.unknown1,
      validation: cand.validation,
    });

    curOffset += MK1_FILE_ENTRY_SIZE;
  }

  const tableEndOffset = curOffset;

  options.onProgress?.('Correlating table against directory GRA inventory...', 0.5);

  // 5. Index directory GRA files by size
  const graFiles = files.filter((f) => f.name.toUpperCase().endsWith('.GRA'));
  const sizeToGra = new Map<number, SourceFileEntry[]>();

  for (const f of graFiles) {
    const list = sizeToGra.get(f.size) ?? [];
    list.push(f);
    sizeToGra.set(f.size, list);
  }

  // 6. Build handle table entries with initial correlations
  const entries: MK1HandleTableEntry[] = rawEntries.map((raw, idx) => {
    const matches = sizeToGra.get(raw.fileSize) ?? [];
    const candidatePaths = matches.map((m) => m.path);

    let pathResolution: MK1PathResolutionMethod = 'unresolved';
    let resolvedPath: string | undefined = undefined;
    let confidence: MK1EntryConfidence = 'hypothesis';

    if (candidatePaths.length === 1) {
      pathResolution = 'unique-size';
      resolvedPath = candidatePaths[0];
      confidence = 'inferred';
    } else if (candidatePaths.length > 1) {
      pathResolution = 'ambiguous';
      confidence = 'hypothesis';
    }

    return {
      fileId: idx,
      entryOffset: raw.offset,
      entryOffsetHex: toHex32(raw.offset),
      rawFilenameOffset: raw.rawFilenameOffset,
      rawFilenameOffsetHex: toHex32(raw.rawFilenameOffset),
      fileSize: raw.fileSize,
      fileSizeHex: toHex32(raw.fileSize),
      flags: raw.flags,
      flagsHex: toHex8(raw.flags),
      padding: [raw.pad0, raw.pad1, raw.pad2],
      unknown0: raw.unknown0,
      bufferPointer: raw.bufferPointer,
      unknown1: raw.unknown1,
      validation: raw.validation,
      candidatePaths,
      resolvedPath,
      presence: resolvedPath ? 'present' : (candidatePaths.length > 1 ? 'ambiguous' : 'missing'),
      pathResolution,
      confidence,
    };
  });

  // 7. Calculate filename offset deltas to disambiguate identical sizes
  for (let i = 0; i < entries.length; i++) {
    const current = entries[i];
    const next = entries[i + 1];

    if (next) {
      const delta = next.rawFilenameOffset - current.rawFilenameOffset;
      current.filenameOffsetDelta = delta;

      if (current.pathResolution === 'ambiguous' && current.candidatePaths.length > 0) {
        const matchesWithDelta = current.candidatePaths.filter((path) => {
          const dosPath = path.replace(/\//g, '\\');
          const expectedLength = dosPath.length + 1; // +1 for null terminator
          return expectedLength === delta;
        });

        if (matchesWithDelta.length === 1) {
          current.resolvedPath = matchesWithDelta[0];
          current.pathResolution = 'size-and-offset-delta';
          current.presence = 'present';
          current.confidence = 'inferred';
          current.filenameOffsetDeltaMatches = true;
          current.filenameOffsetDeltaExpected = delta;
        }
      } else if (current.resolvedPath) {
        const dosPath = current.resolvedPath.replace(/\//g, '\\');
        current.filenameOffsetDeltaExpected = dosPath.length + 1;
        current.filenameOffsetDeltaMatches = current.filenameOffsetDeltaExpected === delta;
      }
    }
  }

  options.onProgress?.('Attempting binary string-area discovery in executable...', 0.7);

  // 8. Locate ASCII path string area in executable
  let stringResolutionBase: number | undefined = undefined;
  let stringResolutionConfidence: 'verified' | 'inferred' | 'hypothesis' | 'unresolved' = 'unresolved';
  let stringStatusNarrative = '';
  let discoveredViaString: string | undefined = undefined;
  let resolvedCount = 0;
  let mismatchedCount = 0;
  let unresolvedCount = 0;

  const searchStrings: Array<{ path: string; entry: MK1HandleTableEntry }> = [];
  for (const entry of entries) {
    if (entry.resolvedPath) {
      const dosPath = entry.resolvedPath.replace(/\//g, '\\');
      searchStrings.push({ path: `${dosPath}\0`, entry });
      searchStrings.push({ path: dosPath, entry });
    }
  }

  if (searchStrings.length === 0) {
    const jcatt = entries.find((e) => e.fileSize === 49402);
    if (jcatt) {
      searchStrings.push({ path: 'GRAPHICS\\JCATT.GRA\0', entry: jcatt });
      searchStrings.push({ path: 'GRAPHICS\\JCATT.GRA', entry: jcatt });
    }
  }

  interface CandidateBaseScore {
    base: number;
    discoveredVia: string;
    score: number;
  }

  const baseScores: CandidateBaseScore[] = [];

  for (const { path: searchStr, entry } of searchStrings) {
    try {
      const matchOffsets = await scanAsciiPattern(source, exeEntry.path, searchStr, {
        fileSize: exeEntry.size,
        caseInsensitive: true,
        maxMatches: 5,
      });

      for (const matchOffset of matchOffsets) {
        const candidateBase = matchOffset - entry.rawFilenameOffset;
        if (candidateBase < 0 || candidateBase >= exeEntry.size) continue;

        let score = 0;
        for (const e of entries) {
          const strOffset = candidateBase + e.rawFilenameOffset;
          if (strOffset < 0 || strOffset >= exeEntry.size) continue;

          const readStr = await readNullTerminatedAscii(source, exeEntry.path, strOffset, 260);
          if (readStr) {
            const normalizedRead = readStr.replace(/\\/g, '/').toUpperCase();
            const matchedFile = files.find(
              (f) => f.path.toUpperCase() === normalizedRead || f.name.toUpperCase() === normalizedRead,
            );
            if (matchedFile) {
              score++;
            }
          }
        }

        if (score > 0) {
          baseScores.push({
            base: candidateBase,
            discoveredVia: `${searchStr} @ ${toHex32(matchOffset)}`,
            score,
          });
        }
      }
    } catch {
      // Gracefully continue searching
    }
  }

  baseScores.sort((a, b) => b.score - a.score);

  if (baseScores.length > 0 && baseScores[0].score >= 1) {
    const best = baseScores[0];
    stringResolutionBase = best.base;
    discoveredViaString = best.discoveredVia;

    if (
      entries.length >= 10 &&
      (best.score >= 10 || best.score >= Math.floor(entries.length * 0.5))
    ) {
      stringResolutionConfidence = 'verified';
    } else if (best.score >= 2) {
      stringResolutionConfidence = 'inferred';
    } else {
      stringResolutionConfidence = 'hypothesis';
    }

    // Read and preserve every string from the executable at base + rawFilenameOffset
    for (const e of entries) {
      const strOffset = stringResolutionBase + e.rawFilenameOffset;
      if (strOffset >= 0 && strOffset < exeEntry.size) {
        const rawStr = await readNullTerminatedAscii(source, exeEntry.path, strOffset, 260);
        if (rawStr !== null && rawStr.length >= 3 && /[a-zA-Z0-9]/.test(rawStr)) {
          e.exeFilenameString = rawStr;
          e.resolvedStringFromExe = rawStr;

          const normalized = rawStr.replace(/\\/g, '/').toUpperCase();
          const matchedFile = files.find(
            (f) => f.path.toUpperCase() === normalized || f.name.toUpperCase() === normalized,
          );

          if (matchedFile) {
            e.resolvedPath = matchedFile.path;
            e.presence = 'present';
            e.pathResolution = 'exact-string';
            e.confidence = stringResolutionConfidence === 'verified' ? 'verified' : 'inferred';
            resolvedCount++;
          } else {
            // Valid string exists in executable, but file is not present on disk
            e.resolvedPath = undefined;
            e.presence = 'missing';
            e.pathResolution = 'exact-string';
            e.confidence = stringResolutionConfidence === 'verified' ? 'verified' : 'inferred';
            unresolvedCount++;
          }
        } else {
          // If no string found at this offset, keep prior resolution if any
          if (e.resolvedPath !== undefined) {
            resolvedCount++;
          } else if (e.candidatePaths.length > 0) {
            mismatchedCount++;
          } else {
            unresolvedCount++;
          }
        }
      } else {
        if (e.resolvedPath !== undefined) {
          resolvedCount++;
        } else {
          unresolvedCount++;
        }
      }
    }

    stringStatusNarrative = `Discovered string-area base ${toHex32(stringResolutionBase)} via ${discoveredViaString}. Preserved EXE strings across all entries; matched ${resolvedCount} against installed directory files.`;
  } else {
    resolvedCount = entries.filter((e) => e.resolvedPath !== undefined).length;
    unresolvedCount = entries.filter((e) => e.resolvedPath === undefined).length;
    stringStatusNarrative = 'Direct ASCII path search in executable image did not yield a qualifying string-area base.';
  }

  // 9. Independent Comparisons
  // Comparison A: Table Entries
  const installedMatches = entries.filter((e) => e.presence === 'present').length;
  const missingFromDirectory = entries.filter((e) => e.presence === 'missing').length;
  const tableAmbiguous = entries.filter((e) => e.presence === 'ambiguous').length;

  const tableComparison: MK1TableComparison = {
    totalEntries: entries.length,
    installedMatches,
    missingFromDirectory,
    ambiguous: tableAmbiguous,
  };

  // Comparison B: Directory GRA Files
  const mappedGraPaths = new Set<string>();
  for (const e of entries) {
    if (e.resolvedPath) {
      mappedGraPaths.add(e.resolvedPath.toUpperCase());
    }
  }

  const extraPaths: string[] = [];
  for (const g of graFiles) {
    if (!mappedGraPaths.has(g.path.toUpperCase())) {
      extraPaths.push(g.path);
    }
  }

  const directoryComparison: MK1DirectoryComparison = {
    totalGraFiles: graFiles.length,
    referenced: mappedGraPaths.size,
    extra: extraPaths.length,
    extraPaths,
    // Deprecated compatibility fields
    totalGraInDirectory: graFiles.length,
    matchedCount: mappedGraPaths.size,
    unmatchedCount: missingFromDirectory,
    ambiguousCount: tableAmbiguous,
    unmatchedDirectoryGraPaths: extraPaths,
    extraDirectoryGraCount: extraPaths.length,
  };

  // 10. Anchor Validations
  const jcattEntry = entries.find(
    (e) => e.fileSize === 49402 || (e.exeFilenameString && e.exeFilenameString.toUpperCase().endsWith('JCATT.GRA')),
  );

  let knownAnchorsValidated = true;
  for (const anchor of MK1_KNOWN_FIXTURE_ANCHORS) {
    const entry = entries.find((e) => e.fileId === anchor.expectedFileId);
    if (!entry) {
      knownAnchorsValidated = false;
      break;
    }
    const checkStr = entry.exeFilenameString ?? entry.resolvedPath;
    if (checkStr && !checkStr.toUpperCase().endsWith(anchor.expectedFilename)) {
      knownAnchorsValidated = false;
      break;
    }
  }

  let reconstructionStatus: 'VERIFIED_FIXTURE' | 'INFERRED' | 'FAILED' = 'INFERRED';
  if (entries.length > 0 && jcattEntry?.fileId === 4 && knownAnchorsValidated) {
    reconstructionStatus = 'VERIFIED_FIXTURE';
  }

  let narrative = `Reconstructed contiguous handle table spanning ${entries.length} entries (${toHex32(tableStartOffset)} to ${toHex32(tableEndOffset)}). `;
  if (jcattEntry) {
    narrative += `JCATT.GRA identified at File ID ${jcattEntry.fileId} (${toHex32(jcattEntry.entryOffset)}). `;
  }
  narrative += `Table correlation: ${installedMatches}/${entries.length} entries matched to disk files. Directory comparison: ${mappedGraPaths.size}/${graFiles.length} GRA files referenced (${extraPaths.length} unreferenced files on disk).`;

  options.onProgress?.('Reconstruction complete.', 1.0);

  return {
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      reconstructedAt: new Date().toISOString(),
    },
    gameFixture: 'Mortal Kombat (DOS)',
    executable: {
      path: exeEntry.path,
      size: exeEntry.size,
      sizeHex: toHex32(exeEntry.size),
    },
    table: {
      startOffset: tableStartOffset,
      startOffsetHex: toHex32(tableStartOffset),
      endOffset: tableEndOffset,
      endOffsetHex: toHex32(tableEndOffset),
      entryCount: entries.length,
      stride: MK1_FILE_ENTRY_SIZE,
    },
    stringResolution: {
      attempted: true,
      baseOffset: stringResolutionBase,
      baseOffsetHex: stringResolutionBase !== undefined ? toHex32(stringResolutionBase) : undefined,
      discoveredVia: discoveredViaString,
      confidence: stringResolutionConfidence,
      resolvedCount,
      mismatchedCount,
      unresolvedCount,
      statusNarrative: stringStatusNarrative,
    },
    tableComparison,
    directoryComparison,
    entries,
    summary: {
      reconstructionStatus,
      jcattFileId: jcattEntry?.fileId,
      knownAnchorsValidated,
      narrative,
    },
  };
}

/**
 * Builds clean export JSON for full MK1 handle table research.
 */
export function createMK1HandleTableExport(result: MK1HandleTableResult): MK1HandleTableExportData {
  return {
    app: {
      name: result.app.name,
      version: result.app.version,
      exportedAt: new Date().toISOString(),
    },
    fixtureIdentity: result.gameFixture,
    executable: {
      path: result.executable.path,
      sizeDecimal: result.executable.size,
      sizeHex: result.executable.sizeHex,
    },
    table: {
      startOffsetHex: result.table.startOffsetHex,
      endOffsetHex: result.table.endOffsetHex,
      entryCount: result.table.entryCount,
      strideBytes: result.table.stride,
    },
    stringResolution: {
      baseOffsetHex: result.stringResolution.baseOffsetHex,
      confidence: result.stringResolution.confidence,
      resolvedCount: result.stringResolution.resolvedCount,
      statusNarrative: result.stringResolution.statusNarrative,
    },
    tableComparison: result.tableComparison,
    directoryComparison: {
      totalGraFiles: result.directoryComparison.totalGraFiles,
      referenced: result.directoryComparison.referenced,
      extra: result.directoryComparison.extra,
      extraPaths: result.directoryComparison.extraPaths,
    },
    entries: result.entries.map((e) => ({
      fileId: e.fileId,
      entryOffsetHex: e.entryOffsetHex,
      rawFilenameOffsetHex: e.rawFilenameOffsetHex,
      fileSizeDecimal: e.fileSize,
      fileSizeHex: e.fileSizeHex,
      flagsHex: e.flagsHex,
      exeFilenameString: e.exeFilenameString,
      directoryPath: e.resolvedPath,
      presence: e.presence,
      candidatePaths: e.candidatePaths,
      resolvedPath: e.resolvedPath,
      pathResolution: e.pathResolution,
      confidence: e.confidence,
      filenameOffsetDelta: e.filenameOffsetDelta,
      filenameOffsetDeltaMatches: e.filenameOffsetDeltaMatches,
      resolvedStringFromExe: e.exeFilenameString ?? e.resolvedStringFromExe,
    })),
    summary: {
      reconstructionStatus: result.summary.reconstructionStatus,
      jcattFileId: result.summary.jcattFileId,
      knownAnchorsValidated: result.summary.knownAnchorsValidated,
      narrative: result.summary.narrative,
    },
  };
}

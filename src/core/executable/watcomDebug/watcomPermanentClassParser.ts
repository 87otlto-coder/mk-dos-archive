import { BinaryReader } from '../../binary/BinaryReader';
import {
  WatcomSourceLanguageEntry,
  WatcomSourceLanguageTable,
  WatcomSegmentAddressEntry,
  WatcomSegmentAddressTable,
  WatcomModuleInfo,
  WatcomModuleClass,
  WatcomGlobalSymbol,
  WatcomGlobalSymbolClass,
  WatcomAddressInfoEntry,
  WatcomSegmentInfo,
  WatcomAddressInfoClass,
  WatcomPermanentClassValidation,
  WatcomPermanentClassesResult,
} from './watcomPermanentClassTypes';
import {
  WatcomMasterDebugHeader,
  WatcomSectionDebugHeader,
} from './watcomDebugTypes';

function toHex16(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(4, '0').toUpperCase();
}

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * 1. Source-Language Table Parser
 * Sequence of unique zero-terminated strings occupying exactly `lang_size` bytes.
 */
export function parseWatcomLanguageTable(
  reader: BinaryReader,
  startOffset: number,
  langSize: number,
): WatcomSourceLanguageTable {
  const entries: WatcomSourceLanguageEntry[] = [];
  const errors: string[] = [];

  if (langSize === 0) {
    return {
      fileOffset: startOffset,
      fileOffsetHex: toHex32(startOffset),
      declaredByteLength: 0,
      consumedByteLength: 0,
      entries: [],
      valid: true,
      errors: [],
    };
  }

  const endOffset = startOffset + langSize;
  let curr = startOffset;
  let entryIndex = 0;

  while (curr < endOffset) {
    reader.seek(curr);
    const entryStart = curr;
    let str = '';
    let foundNul = false;

    while (curr < endOffset) {
      const b = reader.readUint8();
      curr++;
      if (b === 0) {
        foundNul = true;
        break;
      }
      str += String.fromCharCode(b);
    }

    const byteLength = curr - entryStart;

    if (!foundNul) {
      errors.push(
        `Language entry #${entryIndex} at offset ${toHex32(entryStart)} lacks terminating NUL before table boundary (${toHex32(endOffset)})`,
      );
      entries.push({
        index: entryIndex,
        tableOffset: entryStart - startOffset,
        byteLength,
        language: str,
        fileOffset: entryStart,
        fileOffsetHex: toHex32(entryStart),
        valid: false,
        error: 'Missing terminating NUL byte before end of declared table',
      });
      break;
    }

    entries.push({
      index: entryIndex,
      tableOffset: entryStart - startOffset,
      byteLength,
      language: str,
      fileOffset: entryStart,
      fileOffsetHex: toHex32(entryStart),
      valid: true,
    });

    entryIndex++;
  }

  const consumedByteLength = curr - startOffset;
  const valid = errors.length === 0 && consumedByteLength === langSize;

  if (consumedByteLength !== langSize) {
    errors.push(
      `Language table declared ${langSize} bytes but consumed ${consumedByteLength} bytes`,
    );
  }

  return {
    fileOffset: startOffset,
    fileOffsetHex: toHex32(startOffset),
    declaredByteLength: langSize,
    consumedByteLength,
    entries,
    valid,
    errors,
  };
}

/**
 * 2. Segment-Address Table Parser
 * Array of 16-bit segment selectors/numbers occupying exactly `segment_size` bytes.
 */
export function parseWatcomSegmentAddressTable(
  reader: BinaryReader,
  startOffset: number,
  segmentSize: number,
): WatcomSegmentAddressTable {
  const entries: WatcomSegmentAddressEntry[] = [];
  const errors: string[] = [];

  if (segmentSize === 0) {
    return {
      fileOffset: startOffset,
      fileOffsetHex: toHex32(startOffset),
      declaredByteLength: 0,
      consumedByteLength: 0,
      entryCount: 0,
      entries: [],
      valid: true,
      errors: [],
    };
  }

  if (segmentSize % 2 !== 0) {
    errors.push(
      `Segment address table size (${segmentSize} bytes) is not an even multiple of 2-byte segment entries`,
    );
  }

  const entryCount = Math.floor(segmentSize / 2);
  reader.seek(startOffset);

  for (let i = 0; i < entryCount; i++) {
    const fileOffset = startOffset + i * 2;
    const segment = reader.readUint16LE();
    entries.push({
      entryIndex: i,
      segment,
      segmentHex: toHex16(segment),
      fileOffset,
      fileOffsetHex: toHex32(fileOffset),
      tableOffset: i * 2,
    });
  }

  const consumedByteLength = entryCount * 2;
  const valid = errors.length === 0 && consumedByteLength === segmentSize;

  return {
    fileOffset: startOffset,
    fileOffsetHex: toHex32(startOffset),
    declaredByteLength: segmentSize,
    consumedByteLength,
    entryCount,
    entries,
    valid,
    errors,
  };
}

/**
 * 3. Module-Information Class Parser
 * Spans `sectionStart + mod_offset` through `sectionStart + gbl_offset`.
 */
export function parseWatcomModuleClass(
  reader: BinaryReader,
  startOffset: number,
  endOffset: number,
  sectionStart: number,
  languages?: WatcomSourceLanguageTable,
): WatcomModuleClass {
  const modules: WatcomModuleInfo[] = [];
  const errors: string[] = [];
  const declaredByteLength = Math.max(0, endOffset - startOffset);

  let curr = startOffset;
  let moduleIndex = 0;

  while (curr < endOffset) {
    const remaining = endOffset - curr;
    // Fixed header: 2 (language) + 6 (locals) + 6 (types) + 6 (lines) = 20 bytes + 1 (nameLen) = 21 bytes min
    if (remaining < 21) {
      errors.push(
        `Truncated module record #${moduleIndex} at offset ${toHex32(curr)}: only ${remaining} bytes remain before gbl_offset (min 21)`,
      );
      break;
    }

    reader.seek(curr);
    const fixedSlice = Array.from(reader.readSlice(20));
    const fixedHeaderRawBytesHex = fixedSlice
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    reader.seek(curr);
    const languageOffset = reader.readUint16LE();
    const localsOffset = reader.readUint32LE();
    const localsNum = reader.readUint16LE();
    const typesOffset = reader.readUint32LE();
    const typesNum = reader.readUint16LE();
    const linesOffset = reader.readUint32LE();
    const linesNum = reader.readUint16LE();
    const nameLength = reader.readUint8();

    const recordByteLength = 21 + nameLength;

    if (curr + recordByteLength > endOffset) {
      errors.push(
        `Module record #${moduleIndex} name length (${nameLength}) overruns module class boundary by ${curr + recordByteLength - endOffset} bytes`,
      );
      modules.push({
        moduleIndex,
        fileOffset: curr,
        fileOffsetHex: toHex32(curr),
        sectionOffset: curr - sectionStart,
        sectionOffsetHex: toHex32(curr - sectionStart),
        recordByteLength,
        languageOffset,
        resolvedLanguage: null,
        locals: {
          offset: localsOffset,
          offsetHex: toHex32(localsOffset),
          numEntries: localsNum,
        },
        types: {
          offset: typesOffset,
          offsetHex: toHex32(typesOffset),
          numEntries: typesNum,
        },
        lines: {
          offset: linesOffset,
          offsetHex: toHex32(linesOffset),
          numEntries: linesNum,
        },
        nameLength,
        name: '',
        fixedHeaderRawBytesHex,
        valid: false,
        error: 'Record overruns module class boundary',
      });
      break;
    }

    const name = reader.readAscii(nameLength);

    // Resolve language from language table
    let resolvedLanguage: string | null = null;
    let languageValid = true;
    if (languages && languages.entries.length > 0) {
      const match = languages.entries.find((e) => e.tableOffset === languageOffset);
      if (match) {
        resolvedLanguage = match.language;
      } else {
        languageValid = false;
        errors.push(
          `Module #${moduleIndex} ("${name}") references invalid language table offset ${languageOffset}`,
        );
      }
    }

    modules.push({
      moduleIndex,
      fileOffset: curr,
      fileOffsetHex: toHex32(curr),
      sectionOffset: curr - sectionStart,
      sectionOffsetHex: toHex32(curr - sectionStart),
      recordByteLength,
      languageOffset,
      resolvedLanguage,
      locals: {
        offset: localsOffset,
        offsetHex: toHex32(localsOffset),
        numEntries: localsNum,
      },
      types: {
        offset: typesOffset,
        offsetHex: toHex32(typesOffset),
        numEntries: typesNum,
      },
      lines: {
        offset: linesOffset,
        offsetHex: toHex32(linesOffset),
        numEntries: linesNum,
      },
      nameLength,
      name,
      fixedHeaderRawBytesHex,
      valid: languageValid,
      error: languageValid ? undefined : `Invalid language offset ${languageOffset}`,
    });

    curr += recordByteLength;
    moduleIndex++;
  }

  const consumedByteLength = curr - startOffset;
  const tilingValid = consumedByteLength === declaredByteLength;
  const valid = errors.length === 0 && tilingValid;

  return {
    fileOffsetStart: startOffset,
    fileOffsetStartHex: toHex32(startOffset),
    fileOffsetEnd: endOffset,
    fileOffsetEndHex: toHex32(endOffset),
    declaredByteLength,
    consumedByteLength,
    moduleCount: modules.length,
    modules,
    tilingValid,
    valid,
    errors,
  };
}

/**
 * 4. Global-Symbol Class Parser
 * Spans `sectionStart + gbl_offset` through `sectionStart + addr_offset`.
 */
export function parseWatcomGlobalSymbolClass(
  reader: BinaryReader,
  startOffset: number,
  endOffset: number,
  sectionStart: number,
  modules?: WatcomModuleInfo[],
): WatcomGlobalSymbolClass {
  const symbols: WatcomGlobalSymbol[] = [];
  const errors: string[] = [];
  const declaredByteLength = Math.max(0, endOffset - startOffset);

  let curr = startOffset;
  let symbolIndex = 0;

  while (curr < endOffset) {
    const remaining = endOffset - curr;
    // Fixed header: addr48 (4 + 2) + mod (2) + kind (1) + nameLen (1) = 10 bytes min
    if (remaining < 10) {
      errors.push(
        `Truncated global symbol record #${symbolIndex} at offset ${toHex32(curr)}: only ${remaining} bytes remain before addr_offset (min 10)`,
      );
      break;
    }

    reader.seek(curr);
    const addressOffset = reader.readUint32LE();
    const segment = reader.readUint16LE();
    const moduleIndex = reader.readUint16LE();
    const rawKind = reader.readUint8();
    const nameLength = reader.readUint8();

    const recordByteLength = 10 + nameLength;

    if (curr + recordByteLength > endOffset) {
      errors.push(
        `Global symbol record #${symbolIndex} name length (${nameLength}) overruns global class boundary by ${curr + recordByteLength - endOffset} bytes`,
      );
      break;
    }

    const name = reader.readAscii(nameLength);

    const kindBits = {
      isStatic: (rawKind & 0x01) !== 0,
      isData: (rawKind & 0x02) !== 0,
      isCode: (rawKind & 0x04) !== 0,
      rawKind,
      rawKindHex: '0x' + rawKind.toString(16).padStart(2, '0').toUpperCase(),
    };

    // Resolve module name if modules are provided (strictly zero-based: 0 <= moduleIndex < modules.length)
    let resolvedModuleName: string | null = null;
    let modValid = true;
    if (modules && modules.length > 0) {
      if (moduleIndex >= 0 && moduleIndex < modules.length) {
        resolvedModuleName = modules[moduleIndex].name;
      } else {
        modValid = false;
        errors.push(
          `Global symbol #${symbolIndex} ("${name}") references out-of-range module index ${moduleIndex} (total modules: ${modules.length})`,
        );
      }
    }

    symbols.push({
      globalIndex: symbolIndex,
      fileOffset: curr,
      fileOffsetHex: toHex32(curr),
      sectionOffset: curr - sectionStart,
      sectionOffsetHex: toHex32(curr - sectionStart),
      recordByteLength,
      addressOffset,
      addressOffsetHex: toHex32(addressOffset),
      segment,
      segmentHex: toHex16(segment),
      moduleIndex,
      resolvedModuleName,
      rawKind,
      kindBits,
      nameLength,
      name,
      valid: modValid,
      error: modValid ? undefined : `Invalid module index ${moduleIndex}`,
    });

    curr += recordByteLength;
    symbolIndex++;
  }

  const consumedByteLength = curr - startOffset;
  const tilingValid = consumedByteLength === declaredByteLength;
  const valid = errors.length === 0 && tilingValid;

  return {
    fileOffsetStart: startOffset,
    fileOffsetStartHex: toHex32(startOffset),
    fileOffsetEnd: endOffset,
    fileOffsetEndHex: toHex32(endOffset),
    declaredByteLength,
    consumedByteLength,
    symbolCount: symbols.length,
    symbols,
    tilingValid,
    valid,
    errors,
  };
}

/**
 * 5. Address-Information Class Parser
 * Spans `sectionStart + addr_offset` through `sectionStart + section_size`.
 */
export function parseWatcomAddressInfoClass(
  reader: BinaryReader,
  startOffset: number,
  endOffset: number,
  sectionStart: number,
  modules?: WatcomModuleInfo[],
): WatcomAddressInfoClass {
  const segmentRecords: WatcomSegmentInfo[] = [];
  const errors: string[] = [];
  const declaredByteLength = Math.max(0, endOffset - startOffset);

  let curr = startOffset;
  let segInfoIndex = 0;

  while (curr < endOffset) {
    const remaining = endOffset - curr;
    // Fixed header: addr48 (4 + 2) + num (2) = 8 bytes
    if (remaining < 8) {
      errors.push(
        `Truncated seg_info record #${segInfoIndex} at offset ${toHex32(curr)}: only ${remaining} bytes remain before section end (min 8)`,
      );
      break;
    }

    reader.seek(curr);
    const startAddressOffset = reader.readUint32LE();
    const segment = reader.readUint16LE();
    const rawNum = reader.readUint16LE();

    const entryCount = rawNum & 0x7fff;
    const isNonSect = (rawNum & 0x8000) !== 0;

    const childBytesNeeded = entryCount * 6; // 4 (size) + 2 (mod) = 6 bytes per entry
    const totalRecordLength = 8 + childBytesNeeded;

    if (curr + totalRecordLength > endOffset) {
      errors.push(
        `seg_info record #${segInfoIndex} entries (${entryCount} * 6 = ${childBytesNeeded} bytes) overrun section boundary by ${curr + totalRecordLength - endOffset} bytes`,
      );
      segmentRecords.push({
        segInfoIndex,
        fileOffset: curr,
        fileOffsetHex: toHex32(curr),
        sectionOffset: curr - sectionStart,
        sectionOffsetHex: toHex32(curr - sectionStart),
        recordByteLength: totalRecordLength,
        startAddressOffset,
        startAddressOffsetHex: toHex32(startAddressOffset),
        segment,
        segmentHex: toHex16(segment),
        rawNum,
        rawNumHex: toHex16(rawNum),
        entryCount,
        isNonSect,
        entries: [],
        valid: false,
        error: 'Entry count overruns section boundary',
      });
      break;
    }

    const entries: WatcomAddressInfoEntry[] = [];
    let childValid = true;

    for (let c = 0; c < entryCount; c++) {
      const size = reader.readUint32LE();
      const moduleIndex = reader.readUint16LE();

      let resolvedModuleName: string | null = null;
      if (modules && modules.length > 0) {
        if (moduleIndex >= 0 && moduleIndex < modules.length) {
          resolvedModuleName = modules[moduleIndex].name;
        } else {
          childValid = false;
          errors.push(
            `seg_info #${segInfoIndex} child entry #${c} references invalid module index ${moduleIndex} (total modules: ${modules.length})`,
          );
        }
      }

      entries.push({
        entryIndex: c,
        size,
        sizeHex: toHex32(size),
        moduleIndex,
        resolvedModuleName,
      });
    }

    segmentRecords.push({
      segInfoIndex,
      fileOffset: curr,
      fileOffsetHex: toHex32(curr),
      sectionOffset: curr - sectionStart,
      sectionOffsetHex: toHex32(curr - sectionStart),
      recordByteLength: totalRecordLength,
      startAddressOffset,
      startAddressOffsetHex: toHex32(startAddressOffset),
      segment,
      segmentHex: toHex16(segment),
      rawNum,
      rawNumHex: toHex16(rawNum),
      entryCount,
      isNonSect,
      entries,
      valid: childValid,
      error: childValid ? undefined : 'Contains child entry with invalid module index',
    });

    curr += totalRecordLength;
    segInfoIndex++;
  }

  const consumedByteLength = curr - startOffset;
  const tilingValid = consumedByteLength === declaredByteLength;
  const valid = errors.length === 0 && tilingValid;

  return {
    fileOffsetStart: startOffset,
    fileOffsetStartHex: toHex32(startOffset),
    fileOffsetEnd: endOffset,
    fileOffsetEndHex: toHex32(endOffset),
    declaredByteLength,
    consumedByteLength,
    segmentRecordCount: segmentRecords.length,
    segmentRecords,
    tilingValid,
    valid,
    errors,
  };
}

/**
 * 6. Cross-Class Structural Reconciliation
 */
export function reconcileWatcomPermanentClasses(
  languages: WatcomSourceLanguageTable,
  segmentAddresses: WatcomSegmentAddressTable,
  modules: WatcomModuleClass,
  globalSymbols: WatcomGlobalSymbolClass,
  addressInfo: WatcomAddressInfoClass,
): WatcomPermanentClassValidation {
  const languageTableConsumed = languages.consumedByteLength === languages.declaredByteLength;
  const segmentTableConsumed =
    segmentAddresses.consumedByteLength === segmentAddresses.declaredByteLength;
  const moduleClassTiled = modules.tilingValid;
  const globalClassTiled = globalSymbols.tilingValid;
  const addressClassTiled = addressInfo.tilingValid;

  const allModuleLanguagesValid = modules.modules.every(
    (m) => m.valid && (languages.entries.length === 0 || m.resolvedLanguage !== null),
  );
  const allGlobalModulesValid = globalSymbols.symbols.every((s) => s.valid);
  const allAddressModulesValid = addressInfo.segmentRecords.every((s) => s.valid);

  // Compare symbol segments against parsed segment table
  const segTableValues = segmentAddresses.entries.map((e) => e.segment);
  const uniqueSymbolSegments = Array.from(
    new Set(globalSymbols.symbols.map((s) => s.segment)),
  ).sort((a, b) => a - b);
  const allPresentInTable =
    segTableValues.length === 0 ||
    uniqueSymbolSegments.every((seg) => segTableValues.includes(seg));

  // Count duplicate module names neutrally
  const modNameCounts = new Map<string, number>();
  for (const m of modules.modules) {
    modNameCounts.set(m.name, (modNameCounts.get(m.name) || 0) + 1);
  }
  const duplicateModuleNames = Array.from(modNameCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Count duplicate global symbol names neutrally
  const symNameCounts = new Map<string, number>();
  for (const s of globalSymbols.symbols) {
    symNameCounts.set(s.name, (symNameCounts.get(s.name) || 0) + 1);
  }
  const duplicateGlobalSymbols = Array.from(symNameCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const allChecksPassed =
    languageTableConsumed &&
    segmentTableConsumed &&
    moduleClassTiled &&
    globalClassTiled &&
    addressClassTiled &&
    allModuleLanguagesValid &&
    allGlobalModulesValid &&
    allAddressModulesValid &&
    allPresentInTable;

  return {
    languageTableConsumed,
    segmentTableConsumed,
    moduleClassTiled,
    globalClassTiled,
    addressClassTiled,
    allModuleLanguagesValid,
    allGlobalModulesValid,
    allAddressModulesValid,
    symbolSegmentsReconciled: {
      uniqueSymbolSegments,
      segmentTableValues: segTableValues,
      allPresentInTable,
    },
    duplicateModuleNames,
    duplicateGlobalSymbols,
    allChecksPassed,
  };
}

/**
 * High-level permanent-class enumerator coordinating all 5 classes across a qualified container.
 */
export function enumerateWatcomPermanentClasses(
  reader: BinaryReader,
  containerStart: number,
  masterHeader: WatcomMasterDebugHeader,
  rootSection: WatcomSectionDebugHeader,
): WatcomPermanentClassesResult {
  const errors: string[] = [];

  // 1. Languages
  const langStart = containerStart;
  const languages = parseWatcomLanguageTable(reader, langStart, masterHeader.langSize);
  if (!languages.valid) {
    errors.push(...languages.errors);
  }

  // 2. Segment Table
  const segStart = langStart + masterHeader.langSize;
  const segmentAddresses = parseWatcomSegmentAddressTable(
    reader,
    segStart,
    masterHeader.segmentSize,
  );
  if (!segmentAddresses.valid) {
    errors.push(...segmentAddresses.errors);
  }

  // 3. Module Class
  const sectionStart = rootSection.fileOffset;
  const modStart = sectionStart + rootSection.modOffset;
  const modEnd = sectionStart + rootSection.gblOffset;
  const modules = parseWatcomModuleClass(
    reader,
    modStart,
    modEnd,
    sectionStart,
    languages,
  );
  if (!modules.valid) {
    errors.push(...modules.errors);
  }

  // 4. Global Class
  const gblStart = sectionStart + rootSection.gblOffset;
  const gblEnd = sectionStart + rootSection.addrOffset;
  const globalSymbols = parseWatcomGlobalSymbolClass(
    reader,
    gblStart,
    gblEnd,
    sectionStart,
    modules.modules,
  );
  if (!globalSymbols.valid) {
    errors.push(...globalSymbols.errors);
  }

  // 5. Address Class
  const addrStart = sectionStart + rootSection.addrOffset;
  const addrEnd = sectionStart + rootSection.sectionSize;
  const addressInfo = parseWatcomAddressInfoClass(
    reader,
    addrStart,
    addrEnd,
    sectionStart,
    modules.modules,
  );
  if (!addressInfo.valid) {
    errors.push(...addressInfo.errors);
  }

  // 6. Cross-class reconciliation
  const validation = reconcileWatcomPermanentClasses(
    languages,
    segmentAddresses,
    modules,
    globalSymbols,
    addressInfo,
  );
  if (!validation.symbolSegmentsReconciled.allPresentInTable) {
    errors.push('Global symbol references segment not present in Watcom segment-address table');
  }

  const overallValid = errors.length === 0 && validation.allChecksPassed;

  return {
    languages,
    segmentAddresses,
    modules,
    globalSymbols,
    addressInfo,
    validation,
    overallValid,
    errors,
  };
}

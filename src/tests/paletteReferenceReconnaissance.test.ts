import { describe, expect, it } from 'vitest';
import {
  deriveCandidateRepresentations,
  performPaletteReferenceReconnaissance,
  scanBytesForTargetValues,
  scanExecutableChunks,
} from '../games/mk1/research/paletteReferenceReconnaissance';
import { MK1PaletteCandidate, MK1PaletteScanResult } from '../games/mk1/research/paletteTypes';
import { MK1ExecutablePhysicalTopology } from '../games/mk1/research/executableRegionTopology';
import { LEObjectEntry } from '../core/executable/le/leTypes';
import { correlatePalettesWithExecutableRegions } from '../games/mk1/research/paletteRegionCorrelation';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';

function createSyntheticCandidate(
  id: string,
  byteStart: number,
  length: number,
  tier: 'raw' | 'structural' | 'research' = 'research',
  contentHash = 'hash-1',
): MK1PaletteCandidate {
  return {
    id,
    exeOffset: byteStart,
    exeOffsetHex: '0x' + byteStart.toString(16).padStart(8, '0').toUpperCase(),
    byteStart,
    byteEnd: byteStart + 2 + length * 2,
    length,
    colors15: new Uint16Array(length),
    rgbColors: [],
    uniqueColorCount: length,
    uniqueColorRatio: 1.0,
    contentHash,
    confidence: 'candidate',
    validation: { lengthValid: true, colors15Bit: true, diversityValid: true },
    researchScore: 75,
    zeroShiftKanoCompatible: true,
    tier,
    textLikeScore: 0,
    containsLikelyAsciiData: false,
    overlapRelationships: { overlappingCount: 0 },
  };
}

function createSyntheticTopology(totalFileSize: number): MK1ExecutablePhysicalTopology {
  return {
    totalFileSize,
    totalFileSizeHex: '0x' + totalFileSize.toString(16).padStart(8, '0').toUpperCase(),
    boundaries: {
      highestFileBackedPageEnd: 1000,
      highestFileBackedPageEndHex: '0x000003E8',
      headerDerivedPageDataEnd: 1000,
      headerDerivedPageDataEndHex: '0x000003E8',
      discrepancyBytes: 0,
      discrepancyExplanation: 'Exact match',
    },
    postModuleTail: {
      startOffset: 1000,
      startOffsetHex: '0x000003E8',
      endOffset: totalFileSize,
      endOffsetHex: '0x' + totalFileSize.toString(16).padStart(8, '0').toUpperCase(),
      byteLength: totalFileSize - 1000,
      percentageOfTotalExecutable: 50,
      containedAnchorNames: [],
      purpose: 'UNKNOWN',
      notes: 'Synthetic tail',
    },
    regions: [
      {
        regionId: 'obj1-code',
        regionClass: 'le-object-file-backed',
        name: 'Object 1 Code',
        fileStart: 100,
        fileStartHex: '0x00000064',
        fileEnd: 500,
        fileEndHex: '0x000001F4',
        byteLength: 400,
        percentageOfFile: 20,
        objectNumber: 1,
        purpose: 'Code',
        notes: '',
      },
      {
        regionId: 'obj2-data',
        regionClass: 'le-object-file-backed',
        name: 'Object 2 Data',
        fileStart: 500,
        fileStartHex: '0x000001F4',
        fileEnd: 1000,
        fileEndHex: '0x000003E8',
        byteLength: 500,
        percentageOfFile: 25,
        objectNumber: 2,
        purpose: 'Data',
        notes: '',
      },
      {
        regionId: 'post-module-tail',
        regionClass: 'post-module-tail',
        name: 'Post-Module Tail',
        fileStart: 1000,
        fileStartHex: '0x000003E8',
        fileEnd: totalFileSize,
        fileEndHex: '0x' + totalFileSize.toString(16).padStart(8, '0').toUpperCase(),
        byteLength: totalFileSize - 1000,
        percentageOfFile: 55,
        objectNumber: null,
        purpose: 'UNKNOWN',
        notes: '',
      },
    ],
    gapCount: 0,
    totalGapBytes: 0,
  };
}

function createSyntheticObjects(): LEObjectEntry[] {
  const flags = {
    readable: true,
    writable: true,
    executable: true,
    resource: false,
    discardable: false,
    shared: false,
    preload: false,
    invalid: false,
    swappable: false,
    resident: true,
    big32Bit: true,
  };

  return [
    {
      objectNumber: 1,
      virtualSize: 400,
      virtualSizeHex: '0x00000190',
      relocationBaseAddress: 0x00010000,
      relocationBaseAddressHex: '0x00010000',
      rawFlags: 0,
      flags,
      pageMapIndex: 1,
      pageMapEntryCount: 1,
      capabilities: 'Readable, Executable',
      roleEvidence: 'executable-code-like',
      physicalSpans: [
        {
          fileStart: 100,
          fileEnd: 500,
          byteLength: 400,
          objectPageStart: 0,
          pageCount: 1,
        },
      ],
      mappedPageCount: 1,
      zeroFilledPageCount: 0,
    },
    {
      objectNumber: 2,
      virtualSize: 500,
      virtualSizeHex: '0x000001F4',
      relocationBaseAddress: 0x00050000,
      relocationBaseAddressHex: '0x00050000',
      rawFlags: 0,
      flags,
      pageMapIndex: 2,
      pageMapEntryCount: 1,
      capabilities: 'Readable, Writable',
      roleEvidence: 'read-write-data-like',
      physicalSpans: [
        {
          fileStart: 500,
          fileEnd: 1000,
          byteLength: 500,
          objectPageStart: 0,
          pageCount: 1,
        },
      ],
      mappedPageCount: 1,
      zeroFilledPageCount: 0,
    },
  ];
}

function createSyntheticScanResult(
  candidates: MK1PaletteCandidate[],
  exeSize = 2000,
  exePath = 'MK1.EXE',
): MK1PaletteScanResult {
  return {
    exePath,
    exeSize,
    counts: {
      rawLengthCandidatesCount: candidates.length,
      colors15BitValidCount: candidates.length,
      diversityValidCount: candidates.length,
      structuralCandidatesCount: candidates.length,
      finalCandidatesCount: candidates.length,
      researchCandidatesCount: candidates.filter((c) => c.tier === 'research').length,
      uniqueContentsCount: new Set(candidates.map((c) => c.contentHash)).size,
      duplicateCount: 0,
    },
    candidates,
    uniqueContents: [],
  };
}

describe('Milestone 1E.2B.1 — Palette Reference / Context Reconnaissance', () => {
  it('53 — derives all 6 representations cleanly and does not invent unmapped addresses', () => {
    const objects = createSyntheticObjects();
    const pageSize = 4096;

    // Candidate 1 inside Object 2: byteStart = 600 (mapped)
    const mappedCand = createSyntheticCandidate('mapped-c1', 600, 16);
    const mappedReps = deriveCandidateRepresentations(mappedCand, objects, pageSize);

    expect(mappedReps['physical-structure-start'].status).toBe('generated');
    expect(mappedReps['physical-structure-start'].value).toBe(600);

    expect(mappedReps['physical-payload-start'].status).toBe('generated');
    expect(mappedReps['physical-payload-start'].value).toBe(602);

    // Object 2 starts at file 500 -> object offset is 100
    expect(mappedReps['object-relative-structure'].status).toBe('generated');
    expect(mappedReps['object-relative-structure'].value).toBe(100);

    expect(mappedReps['object-relative-payload'].status).toBe('generated');
    expect(mappedReps['object-relative-payload'].value).toBe(102);

    // Relocation base of Object 2 is 0x00050000 -> linear is 0x00050000 + 100 = 0x00050064
    expect(mappedReps['linear-structure-address'].status).toBe('generated');
    expect(mappedReps['linear-structure-address'].value).toBe(0x00050064);

    expect(mappedReps['linear-payload-address'].status).toBe('generated');
    expect(mappedReps['linear-payload-address'].value).toBe(0x00050066);

    // Candidate 2 in post-module tail: byteStart = 1200 (unmapped)
    const unmappedCand = createSyntheticCandidate('unmapped-c2', 1200, 16);
    const unmappedReps = deriveCandidateRepresentations(unmappedCand, objects, pageSize);

    expect(unmappedReps['physical-structure-start'].status).toBe('generated');
    expect(unmappedReps['physical-structure-start'].value).toBe(1200);

    expect(unmappedReps['physical-payload-start'].status).toBe('generated');
    expect(unmappedReps['physical-payload-start'].value).toBe(1202);

    // Unmapped MUST NOT invent object-relative or linear addresses!
    expect(unmappedReps['object-relative-structure'].status).toBe('not-applicable');
    expect(unmappedReps['object-relative-structure'].value).toBeNull();

    expect(unmappedReps['object-relative-payload'].status).toBe('not-applicable');
    expect(unmappedReps['object-relative-payload'].value).toBeNull();

    expect(unmappedReps['linear-structure-address'].status).toBe('not-applicable');
    expect(unmappedReps['linear-structure-address'].value).toBeNull();

    expect(unmappedReps['linear-payload-address'].status).toBe('not-applicable');
    expect(unmappedReps['linear-payload-address'].value).toBeNull();
  });

  it('54 — detects exact 32-bit values aligned, unaligned, at offset 0, and at end of file', () => {
    const buffer = new Uint8Array(32);
    const view = new DataView(buffer.buffer);

    const targetVal1 = 0x12345678;
    const targetVal2 = 0x9abcdef0;

    // Offset 0 (aligned mod 4)
    view.setUint32(0, targetVal1, true);

    // Offset 7 (unaligned mod 4 == 3, mod 2 == 1)
    view.setUint32(7, targetVal2, true);

    // Offset 28 (aligned mod 4, exactly reaches end of 32-byte buffer: 28..31)
    view.setUint32(28, targetVal1, true);

    const targetLookup = new Map();
    targetLookup.set(targetVal1, [
      {
        type: 'candidate',
        id: 'c1',
        representationKind: 'physical-structure-start',
        targetValue: targetVal1,
        targetValueHex: '0x12345678',
        byteStart: 100,
        byteEnd: 110,
        targetRegionId: 'reg1',
        targetRegionClass: 'data',
        targetObjectNumber: 2,
      },
    ]);
    targetLookup.set(targetVal2, [
      {
        type: 'candidate',
        id: 'c2',
        representationKind: 'physical-payload-start',
        targetValue: targetVal2,
        targetValueHex: '0x9ABCDEF0',
        byteStart: 200,
        byteEnd: 210,
        targetRegionId: 'reg2',
        targetRegionClass: 'data',
        targetObjectNumber: 2,
      },
    ]);

    const matches = scanBytesForTargetValues(buffer, targetLookup, 0);

    expect(matches.length).toBe(3);
    expect(matches[0].sourceFileOffset).toBe(0);
    expect(matches[0].matchedUint32Value).toBe(targetVal1);

    expect(matches[1].sourceFileOffset).toBe(7);
    expect(matches[1].matchedUint32Value).toBe(targetVal2);

    expect(matches[2].sourceFileOffset).toBe(28);
    expect(matches[2].matchedUint32Value).toBe(targetVal1);
  });

  it('55 — chunk boundary 3-byte overlap finds target spanning boundary exactly once', async () => {
    // Buffer of 30 bytes
    const buffer = new Uint8Array(30);
    const view = new DataView(buffer.buffer);
    const targetVal = 0xaabbccdd;

    // Place target value at offset 13 (covers bytes 13, 14, 15, 16)
    view.setUint32(13, targetVal, true);

    const source = new MemoryDirectorySource('Test');
    source.setFile('MK1.EXE', buffer);

    const targetLookup = new Map();
    targetLookup.set(targetVal, [
      {
        type: 'candidate',
        id: 'boundary-cand',
        representationKind: 'physical-structure-start',
        targetValue: targetVal,
        targetValueHex: '0xAABBCCDD',
        byteStart: 50,
        byteEnd: 60,
        targetRegionId: 'reg',
        targetRegionClass: 'data',
        targetObjectNumber: 1,
      },
    ]);

    const matches = await scanExecutableChunks(source, 'MK1.EXE', buffer.length, targetLookup, 16);

    expect(matches.length).toBe(1);
    expect(matches[0].sourceFileOffset).toBe(13);
    expect(matches[0].matchedUint32Value).toBe(targetVal);
  });

  it('56 — handles value collisions between multiple candidate descriptors', () => {
    const buffer = new Uint8Array(16);
    const view = new DataView(buffer.buffer);
    const collisionVal = 0x00000020;

    view.setUint32(4, collisionVal, true);

    const targetLookup = new Map();
    targetLookup.set(collisionVal, [
      {
        type: 'candidate',
        id: 'cand-A',
        representationKind: 'object-relative-structure',
        targetValue: collisionVal,
        targetValueHex: '0x00000020',
        byteStart: 100,
        byteEnd: 110,
        targetRegionId: 'obj1',
        targetRegionClass: 'code',
        targetObjectNumber: 1,
      },
      {
        type: 'candidate',
        id: 'cand-B',
        representationKind: 'object-relative-payload',
        targetValue: collisionVal,
        targetValueHex: '0x00000020',
        byteStart: 200,
        byteEnd: 210,
        targetRegionId: 'obj2',
        targetRegionClass: 'data',
        targetObjectNumber: 2,
      },
    ]);

    const matches = scanBytesForTargetValues(buffer, targetLookup, 0);

    expect(matches.length).toBe(1);
    expect(matches[0].descriptors.length).toBe(2);
    expect(matches[0].descriptors[0].id).toBe('cand-A');
    expect(matches[0].descriptors[1].id).toBe('cand-B');
  });

  it('57 — source region classification and loaded address derivation', async () => {
    const buffer = new Uint8Array(2000);
    const view = new DataView(buffer.buffer);

    const cand = createSyntheticCandidate('cand-test', 600, 16, 'research'); // in Object 2
    // Place its linear address (0x00050064) inside Object 1 (code at offset 200)
    view.setUint32(200, 0x00050064, true);

    const source = new MemoryDirectorySource('Test');
    source.setFile('MK1.EXE', buffer);
    const topology = createSyntheticTopology(2000);
    const objects = createSyntheticObjects();

    const scanResult = createSyntheticScanResult([cand], 2000, 'MK1.EXE');
    const correlationResult = correlatePalettesWithExecutableRegions(scanResult, topology, objects);

    const result = await performPaletteReferenceReconnaissance(
      source,
      scanResult,
      topology,
      objects,
      correlationResult,
      { exePath: 'MK1.EXE', exeSize: 2000 },
    );

    expect(result.status).toBe('SUCCESS');
    expect(result.globalSummary.targetsWithExternalExactOccurrences).toBe(1);
    expect(result.globalSummary.totalExternalLogicalMatches).toBe(1);

    const occ = result.detailedOccurrences.find((o) => o.targetCandidateId === 'cand-test');
    expect(occ).toBeDefined();
    expect(occ?.sourceFileOffset).toBe(200);
    expect(occ?.sourceRegionId).toBe('obj1-code');
    expect(occ?.sourceObjectNumber).toBe(1);
    expect(occ?.sourceLoadedAddressHex).toBe('0x00010064');
  });

  it('58 — flags self-occurrences inside palette range and excludes them from external metrics', async () => {
    const buffer = new Uint8Array(2000);
    const view = new DataView(buffer.buffer);

    // Candidate at 600..634
    const cand = createSyntheticCandidate('cand-self', 600, 16, 'research');
    // Put its own physical start (600 = 0x00000258) inside its own body at 610
    view.setUint32(610, 600, true);

    const source = new MemoryDirectorySource('Test');
    source.setFile('MK1.EXE', buffer);
    const topology = createSyntheticTopology(2000);
    const objects = createSyntheticObjects();

    const scanResult = createSyntheticScanResult([cand], 2000, 'MK1.EXE');
    const correlationResult = correlatePalettesWithExecutableRegions(scanResult, topology, objects);

    const result = await performPaletteReferenceReconnaissance(
      source,
      scanResult,
      topology,
      objects,
      correlationResult,
      { exePath: 'MK1.EXE', exeSize: 2000 },
    );

    expect(result.globalSummary.totalSelfOccurrences).toBe(1);
    expect(result.globalSummary.totalExternalLogicalMatches).toBe(0);
    expect(result.globalSummary.targetsWithExternalExactOccurrences).toBe(0);

    const candSum = result.candidateSummaries[0];
    expect(candSum.selfOccurrenceCount).toBe(1);
    expect(candSum.externalOccurrenceCount).toBe(0);
  });

  it('59 — enforces truncation cap and records truncation flags', async () => {
    const buffer = new Uint8Array(2000);
    const view = new DataView(buffer.buffer);

    const cand = createSyntheticCandidate('cand-trunc', 600, 16, 'research');
    const physicalVal = 600;

    // Write 5 occurrences outside candidate
    view.setUint32(200, physicalVal, true);
    view.setUint32(220, physicalVal, true);
    view.setUint32(240, physicalVal, true);
    view.setUint32(260, physicalVal, true);
    view.setUint32(280, physicalVal, true);

    const source = new MemoryDirectorySource('Test');
    source.setFile('MK1.EXE', buffer);
    const topology = createSyntheticTopology(2000);
    const objects = createSyntheticObjects();

    const scanResult = createSyntheticScanResult([cand], 2000, 'MK1.EXE');
    const correlationResult = correlatePalettesWithExecutableRegions(scanResult, topology, objects);

    const result = await performPaletteReferenceReconnaissance(
      source,
      scanResult,
      topology,
      objects,
      correlationResult,
      { exePath: 'MK1.EXE', exeSize: 2000, maxDetailedOccurrencesPerRepresentation: 2 },
    );

    const candSum = result.candidateSummaries[0];
    expect(candSum.externalOccurrenceCount).toBe(5);
    expect(candSum.detailsTruncated).toBe(true);

    const detailedForCand = result.detailedOccurrences.filter((o) => o.targetCandidateId === 'cand-trunc');
    expect(detailedForCand.length).toBe(2);
    expect(result.truncationSummary.totalCandidatesTruncated).toBe(1);
    expect(result.truncationSummary.totalOccurrencesOmitted).toBe(3);
  });

  it('60 — rejects fixture identity mismatch without scanning', async () => {
    const buffer = new Uint8Array(2000);
    const source = new MemoryDirectorySource('Test');
    source.setFile('MK1.EXE', buffer);
    const topology = createSyntheticTopology(2000);
    const objects = createSyntheticObjects();

    const scanResult = createSyntheticScanResult([], 2000, 'OTHER.EXE'); // mismatch
    const correlationResult = correlatePalettesWithExecutableRegions(scanResult, topology, objects);

    const result = await performPaletteReferenceReconnaissance(
      source,
      scanResult,
      topology,
      objects,
      correlationResult,
      { exePath: 'MK1.EXE', exeSize: 2000 },
    );

    expect(result.status).toBe('FAILED');
    expect(result.failureReason).toContain('FAILED — FIXTURE MISMATCH');
  });

  it('61 — keeps control target matches strictly segregated from candidate metrics', async () => {
    const buffer = new Uint8Array(2000);
    const view = new DataView(buffer.buffer);

    // Standard control target: Kano First Descriptor is at physical 0x000A7464 (685156)
    view.setUint32(200, 0x000a7464, true);

    const source = new MemoryDirectorySource('Test');
    source.setFile('MK1.EXE', buffer);
    const topology = createSyntheticTopology(2000);
    const objects = createSyntheticObjects();

    const scanResult = createSyntheticScanResult([], 2000, 'MK1.EXE'); // zero candidates
    const correlationResult = correlatePalettesWithExecutableRegions(scanResult, topology, objects);

    const result = await performPaletteReferenceReconnaissance(
      source,
      scanResult,
      topology,
      objects,
      correlationResult,
      { exePath: 'MK1.EXE', exeSize: 2000 },
    );

    expect(result.globalSummary.totalResearchTargets).toBe(0);
    expect(result.globalSummary.totalExternalLogicalMatches).toBe(0);
    expect(result.globalSummary.targetsWithExternalExactOccurrences).toBe(0);

    const kanoCtrl = result.controlTargets.find((c) => c.name === 'Kano First Descriptor');
    expect(kanoCtrl).toBeDefined();
    expect(kanoCtrl?.totalLogicalMatches).toBe(1);
    expect(kanoCtrl?.externalOccurrences).toBe(1);
    expect(kanoCtrl?.occurrences[0].sourceFileOffset).toBe(200);
  });

  it('62 — ensures palette candidate objects are never mutated during reconnaissance', async () => {
    const cand = createSyntheticCandidate('cand-immutable', 600, 16, 'research', 'hash-123');
    const candCopy = JSON.parse(JSON.stringify(cand));

    const buffer = new Uint8Array(2000);
    const source = new MemoryDirectorySource('Test');
    source.setFile('MK1.EXE', buffer);
    const topology = createSyntheticTopology(2000);
    const objects = createSyntheticObjects();

    const scanResult = createSyntheticScanResult([cand], 2000, 'MK1.EXE');
    const correlationResult = correlatePalettesWithExecutableRegions(scanResult, topology, objects);

    await performPaletteReferenceReconnaissance(
      source,
      scanResult,
      topology,
      objects,
      correlationResult,
      { exePath: 'MK1.EXE', exeSize: 2000 },
    );

    expect(cand.id).toBe(candCopy.id);
    expect(cand.byteStart).toBe(candCopy.byteStart);
    expect(cand.byteEnd).toBe(candCopy.byteEnd);
    expect(cand.length).toBe(candCopy.length);
    expect(cand.tier).toBe(candCopy.tier);
    expect(cand.researchScore).toBe(candCopy.researchScore);
    expect(cand.zeroShiftKanoCompatible).toBe(candCopy.zeroShiftKanoCompatible);
    expect(cand.contentHash).toBe(candCopy.contentHash);
  });
});

import { describe, it, expect } from 'vitest';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import {
  parseCandidateSpriteDescriptor,
  scanExeForSpriteDescriptors,
  createMK1SpriteDescriptorExport,
  resolveMK1GraTarget,
  resolveAllMK1GraTargets,
  getDecodedPrimaryPreviewSequence,
} from '../games/mk1/research/spriteDescriptorProbe';
import {
  MK1SpriteDescriptorKind,
  MK1ResolvedGraTarget,
  MK1SpriteDescriptorCandidate,
} from '../games/mk1/research/spriteDescriptorTypes';
import { generateDiagnosticRgba } from '../games/mk1/graphics/ugraDecoder';
import { MK1HandleTableResult } from '../games/mk1/research/handleTableTypes';

function createSyntheticHandleTable(target: MK1ResolvedGraTarget): MK1HandleTableResult {
  return {
    app: {
      name: 'MK DOS Archive',
      version: '0.1.0',
      reconstructedAt: new Date().toISOString(),
    },
    gameFixture: 'Mortal Kombat 1 (DOS)',
    executable: {
      path: 'MK1.EXE',
      size: 10000,
      sizeHex: '0x00002710',
    },
    table: {
      startOffset: target.handleEntryOffset,
      startOffsetHex: `0x${target.handleEntryOffset.toString(16).toUpperCase()}`,
      endOffset: target.handleEntryOffset + 24,
      endOffsetHex: `0x${(target.handleEntryOffset + 24).toString(16).toUpperCase()}`,
      entryCount: 1,
      stride: 24,
    },
    stringResolution: {
      attempted: false,
      confidence: 'unresolved',
      resolvedCount: 0,
      mismatchedCount: 0,
      unresolvedCount: 1,
      statusNarrative: 'Synthetic',
    },
    tableComparison: {
      totalEntries: 1,
      installedMatches: 1,
      missingFromDirectory: 0,
      ambiguous: 0,
    },
    directoryComparison: {
      totalGraFiles: 1,
      referenced: 1,
      extra: 0,
      extraPaths: [],
    },
    entries: [
      {
        fileId: target.fileId,
        entryOffset: target.handleEntryOffset,
        entryOffsetHex: `0x${target.handleEntryOffset.toString(16).toUpperCase()}`,
        rawFilenameOffset: 0,
        rawFilenameOffsetHex: '0x00000000',
        fileSize: target.fileSize,
        fileSizeHex: `0x${target.fileSize.toString(16).toUpperCase()}`,
        flags: 0x12,
        flagsHex: '0x12',
        padding: [0, 0, 0],
        unknown0: 0,
        bufferPointer: 0,
        unknown1: 0,
        validation: {
          fileSizeMatch: true,
          nonZeroFilenameOffset: true,
          flagsMatch: true,
          zeroPadding: true,
          zeroUnknown0: true,
          zeroBufferPtr: true,
          zeroUnknown1: true,
          allRulesPassed: true,
          passedRulesCount: 7,
          totalRulesCount: 7,
        },
        candidatePaths: [target.path],
        resolvedPath: target.path,
        confidence: 'verified',
        presence: 'present',
        pathResolution: 'exact-string',
      },
    ],
    summary: {
      reconstructionStatus: 'VERIFIED_FIXTURE',
      jcattFileId: target.fileId,
      knownAnchorsValidated: true,
      narrative: 'Synthetic handle table for test verification',
    },
  };
}

/**
 * Creates synthetic binary bytes for a descriptor.
 */
function createSyntheticDescriptorBytes(options: {
  kind: MK1SpriteDescriptorKind;
  width: number;
  height: number;
  x?: number;
  y?: number;
  fileId: number;
  graOffset: number;
}): Uint8Array {
  const size = options.kind === 'with-xy' ? 12 : 8;
  const buffer = new Uint8Array(size);
  const view = new DataView(buffer.buffer);

  const packed = ((options.fileId & 0xff) << 24) | (options.graOffset & 0x00ffffff);

  if (options.kind === 'with-xy') {
    view.setUint16(0, options.width, true);
    view.setUint16(2, options.height, true);
    view.setInt16(4, options.x ?? 0, true);
    view.setInt16(6, options.y ?? 0, true);
    view.setUint32(8, packed, true);
  } else {
    view.setUint16(0, options.width, true);
    view.setUint16(2, options.height, true);
    view.setUint32(4, packed, true);
  }

  return buffer;
}

describe('MK1 Sprite Descriptor Probe — Unit & Synthetic Validation', () => {
  const targetFileId = 4;
  const targetGraSize = 49402;
  const targetGraPath = 'GRAPHICS/JCATT.GRA';

  it('correctly extracts packed file ID and 24-bit GRA offset', () => {
    const bytes = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 72,
      height: 104,
      x: -31,
      y: -98,
      fileId: 4,
      graOffset: 0x001234,
    });

    const candidate = parseCandidateSpriteDescriptor(
      bytes,
      0x1000,
      'with-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );

    expect(candidate).not.toBeNull();
    expect(candidate?.fileId).toBe(4);
    expect(candidate?.graOffset).toBe(0x001234);
    expect(candidate?.packedFileReference).toBe(0x04001234);
    expect(candidate?.validation.allRulesPassed).toBe(true);
    expect(candidate?.confidence).toBe('candidate');
  });

  it('validates valid WITH_XY descriptor structure', () => {
    const bytes = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 64,
      height: 128,
      x: -20,
      y: 45,
      fileId: 4,
      graOffset: 500,
    });

    const candidate = parseCandidateSpriteDescriptor(
      bytes,
      0x2000,
      'with-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );

    expect(candidate).not.toBeNull();
    expect(candidate?.kind).toBe('with-xy');
    expect(candidate?.width).toBe(64);
    expect(candidate?.height).toBe(128);
    expect(candidate?.x).toBe(-20);
    expect(candidate?.y).toBe(45);
    expect(candidate?.validation.allRulesPassed).toBe(true);
  });

  it('validates valid NO_XY descriptor structure', () => {
    const bytes = createSyntheticDescriptorBytes({
      kind: 'no-xy',
      width: 32,
      height: 32,
      fileId: 4,
      graOffset: 1200,
    });

    const candidate = parseCandidateSpriteDescriptor(
      bytes,
      0x3000,
      'no-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );

    expect(candidate).not.toBeNull();
    expect(candidate?.kind).toBe('no-xy');
    expect(candidate?.width).toBe(32);
    expect(candidate?.height).toBe(32);
    expect(candidate?.x).toBeUndefined();
    expect(candidate?.y).toBeUndefined();
    expect(candidate?.validation.allRulesPassed).toBe(true);
  });

  it('rejects zero width and oversized width >= 320', () => {
    const zeroWidth = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 0,
      height: 100,
      fileId: 4,
      graOffset: 100,
    });
    const candZero = parseCandidateSpriteDescriptor(
      zeroWidth,
      0,
      'with-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );
    expect(candZero?.validation.widthValid).toBe(false);
    expect(candZero?.validation.allRulesPassed).toBe(false);

    const overWidth = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 320,
      height: 100,
      fileId: 4,
      graOffset: 100,
    });
    const candOver = parseCandidateSpriteDescriptor(
      overWidth,
      0,
      'with-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );
    expect(candOver?.validation.widthValid).toBe(false);
    expect(candOver?.validation.allRulesPassed).toBe(false);
  });

  it('rejects zero height and oversized height >= 240', () => {
    const zeroHeight = createSyntheticDescriptorBytes({
      kind: 'no-xy',
      width: 50,
      height: 0,
      fileId: 4,
      graOffset: 100,
    });
    const candZero = parseCandidateSpriteDescriptor(
      zeroHeight,
      0,
      'no-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );
    expect(candZero?.validation.heightValid).toBe(false);
    expect(candZero?.validation.allRulesPassed).toBe(false);

    const overHeight = createSyntheticDescriptorBytes({
      kind: 'no-xy',
      width: 50,
      height: 240,
      fileId: 4,
      graOffset: 100,
    });
    const candOver = parseCandidateSpriteDescriptor(
      overHeight,
      0,
      'no-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );
    expect(candOver?.validation.heightValid).toBe(false);
    expect(candOver?.validation.allRulesPassed).toBe(false);
  });

  it('handles x/y out-of-range bounds (-256 to +256)', () => {
    const outOfRangeX = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 50,
      height: 50,
      x: -257,
      y: 0,
      fileId: 4,
      graOffset: 100,
    });
    const candX = parseCandidateSpriteDescriptor(
      outOfRangeX,
      0,
      'with-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );
    expect(candX?.validation.xyValid).toBe(false);

    const outOfRangeY = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 50,
      height: 50,
      x: 0,
      y: 257,
      fileId: 4,
      graOffset: 100,
    });
    const candY = parseCandidateSpriteDescriptor(
      outOfRangeY,
      0,
      'with-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );
    expect(candY?.validation.xyValid).toBe(false);
  });

  it('rejects wrong file ID', () => {
    const wrongId = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 50,
      height: 50,
      fileId: 5, // Expected 4
      graOffset: 100,
    });
    const cand = parseCandidateSpriteDescriptor(
      wrongId,
      0,
      'with-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );
    expect(cand?.validation.fileIdMatch).toBe(false);
    expect(cand?.validation.allRulesPassed).toBe(false);
  });

  it('rejects GRA offset >= target file size', () => {
    const outOfBoundsOffset = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 50,
      height: 50,
      fileId: 4,
      graOffset: 49402, // Exactly targetGraSize
    });
    const cand = parseCandidateSpriteDescriptor(
      outOfBoundsOffset,
      0,
      'with-xy',
      targetFileId,
      targetGraSize,
      targetGraPath,
    );
    expect(cand?.validation.graOffsetValid).toBe(false);
    expect(cand?.validation.allRulesPassed).toBe(false);
  });

  it('scans unaligned descriptors and detects chunk boundary crossing', async () => {
    const mem = new MemoryDirectorySource();
    const exe = new Uint8Array(2000);

    // Place an unaligned WITH_XY descriptor at offset 13 (odd, unaligned)
    const unalignedDesc = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 70,
      height: 90,
      x: -10,
      y: -20,
      fileId: 4,
      graOffset: 200,
    });
    exe.set(unalignedDesc, 13);

    // Place a descriptor right at a 1024-byte chunk boundary (e.g. starting at offset 1020, ending at 1032)
    const boundaryDesc = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 80,
      height: 110,
      x: 5,
      y: -15,
      fileId: 4,
      graOffset: 400,
    });
    exe.set(boundaryDesc, 1020);

    mem.setFile('MK1.EXE', exe);
    mem.setFile('GRAPHICS/JCATT.GRA', new Uint8Array(targetGraSize));

    const target: MK1ResolvedGraTarget = {
      path: 'GRAPHICS/JCATT.GRA',
      fileId: 4,
      fileSize: targetGraSize,
      handleEntryOffset: 0x000B0CBC,
      confidence: 'verified',
      status: 'Verified Handle Table Match',
      presentOnDisk: true,
    };

    const syntheticTable = createSyntheticHandleTable(target);

    const result = await scanExeForSpriteDescriptors(mem, {
      target,
      cachedHandleTable: syntheticTable,
      chunkSize: 1024, // small chunk size to trigger boundary logic
    });

    expect(result.candidates.length).toBe(2);
    expect(result.candidates[0].exeOffset).toBe(13);
    expect(result.candidates[0].graOffset).toBe(200);

    expect(result.candidates[1].exeOffset).toBe(1020);
    expect(result.candidates[1].graOffset).toBe(400);
  });

  it('records overlapping interpretations at same offset without discarding either', async () => {
    const mem = new MemoryDirectorySource();
    const exe = new Uint8Array(1000);

    // Construct bytes that validate as WITH_XY (12 bytes)
    // and where the first 8 bytes also happen to validate as NO_XY (with fileId 0)
    const view = new DataView(exe.buffer, 100, 12);
    view.setUint16(0, 50, true); // width = 50
    view.setUint16(2, 60, true); // height = 60
    view.setInt16(4, 100, true); // x = 100 (graOffset for no-xy)
    view.setInt16(6, 0, true); // y = 0 (fileId = 0 for no-xy)
    view.setUint32(8, 0x00000300, true); // packed for with-xy: fileId 0, offset 0x300

    mem.setFile('MK1.EXE', exe);
    mem.setFile('GRAPHICS/STANCE.GRA', new Uint8Array(10000));

    const target: MK1ResolvedGraTarget = {
      path: 'GRAPHICS/STANCE.GRA',
      fileId: 0,
      fileSize: 10000,
      handleEntryOffset: 0x000B0C5C,
      confidence: 'verified',
      status: 'Verified Handle Table Match',
      presentOnDisk: true,
    };

    const syntheticTable = createSyntheticHandleTable(target);

    const result = await scanExeForSpriteDescriptors(mem, {
      target,
      cachedHandleTable: syntheticTable,
    });

    const atOffset100 = result.candidates.filter((c) => c.exeOffset === 100);
    expect(atOffset100.length).toBe(2);

    const withXy = atOffset100.find((c) => c.kind === 'with-xy');
    const noXy = atOffset100.find((c) => c.kind === 'no-xy');

    expect(withXy?.overlapsCandidateAtSameOffset).toBe(true);
    expect(noXy?.overlapsCandidateAtSameOffset).toBe(true);
    expect(withXy?.alternateInterpretation?.kind).toBe('no-xy');
    expect(noXy?.alternateInterpretation?.kind).toBe('with-xy');
  });

  it('groups duplicate GRA offsets and detects variations', async () => {
    const mem = new MemoryDirectorySource();
    const exe = new Uint8Array(2000);

    // Three descriptors referencing the same graOffset 0x500 with different X/Y coordinates
    const d1 = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 70,
      height: 90,
      x: -10,
      y: -20,
      fileId: 4,
      graOffset: 0x500,
    });
    const d2 = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 70,
      height: 90,
      x: -15,
      y: -25,
      fileId: 4,
      graOffset: 0x500,
    });
    const d3 = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 70,
      height: 90,
      x: -10,
      y: -20,
      fileId: 4,
      graOffset: 0x700,
    });

    exe.set(d1, 200);
    exe.set(d2, 212);
    exe.set(d3, 400);

    const graBytes = new Uint8Array(targetGraSize);
    graBytes.set([0xAA, 0xBB, 0xCC, 0xDD], 0x500);

    mem.setFile('MK1.EXE', exe);
    mem.setFile('GRAPHICS/JCATT.GRA', graBytes);

    const target: MK1ResolvedGraTarget = {
      path: 'GRAPHICS/JCATT.GRA',
      fileId: 4,
      fileSize: targetGraSize,
      handleEntryOffset: 0x000B0CBC,
      confidence: 'verified',
      status: 'Verified Handle Table Match',
      presentOnDisk: true,
    };

    const result = await scanExeForSpriteDescriptors(mem, {
      target,
    });

    expect(result.graOffsetGroups.length).toBe(2);
    const group500 = result.graOffsetGroups.find((g) => g.graOffset === 0x500);
    expect(group500).toBeDefined();
    expect(group500?.referenceCount).toBe(2);
    expect(group500?.hasVaryingPositions).toBe(true);
    expect(group500?.hasVaryingDimensions).toBe(false);
    expect(group500?.firstBytesHex).toBe('AA BB CC DD 00 00 00 00');
  });

  it('detects candidate clusters and identifies contiguous array stride', async () => {
    const mem = new MemoryDirectorySource();
    const exe = new Uint8Array(3000);

    // Create a contiguous array of 4 WITH_XY descriptors (stride = 12)
    for (let i = 0; i < 4; i++) {
      const desc = createSyntheticDescriptorBytes({
        kind: 'with-xy',
        width: 60 + i,
        height: 80,
        x: -5,
        y: -10,
        fileId: 4,
        graOffset: 1000 + i * 100,
      });
      exe.set(desc, 500 + i * 12);
    }

    mem.setFile('MK1.EXE', exe);
    mem.setFile('GRAPHICS/JCATT.GRA', new Uint8Array(targetGraSize));

    const target: MK1ResolvedGraTarget = {
      path: 'GRAPHICS/JCATT.GRA',
      fileId: 4,
      fileSize: targetGraSize,
      handleEntryOffset: 0x000B0CBC,
      confidence: 'verified',
      status: 'Verified Handle Table Match',
      presentOnDisk: true,
    };

    const result = await scanExeForSpriteDescriptors(mem, {
      target,
    });

    expect(result.clusters.length).toBe(1);
    const cluster = result.clusters[0];
    expect(cluster.candidateCount).toBe(4);
    expect(cluster.isContiguousArray).toBe(true);
    expect(cluster.dominantKind).toBe('with-xy');
    expect(cluster.commonStrides).toContain(12);

    // Candidates in this contiguous array should have elevated 'inferred' confidence
    const clusterCandidates = result.candidates.filter((c) => c.exeOffset >= 500 && c.exeOffset < 548);
    expect(clusterCandidates.length).toBe(4);
    for (const c of clusterCandidates) {
      expect(c.confidence).toBe('inferred');
    }

    // Export structure test
    const exportJson = createMK1SpriteDescriptorExport(result);
    expect(exportJson.scanStats.totalCandidates).toBe(4);
    expect(exportJson.clusters.length).toBe(1);
    expect(exportJson.candidates[0].kind).toBe('with-xy');
  });
});

/**
 * Creates a synthetic 24-byte FileEntry record.
 */
function createSyntheticFileEntryRecord(fileSize: number, rawFilenameOffset: number): Uint8Array {
  const buf = new Uint8Array(24);
  const view = new DataView(buf.buffer);
  view.setUint32(0, rawFilenameOffset, true);
  view.setUint32(4, fileSize, true);
  view.setUint8(8, 0x12); // flags
  view.setUint8(9, 0); // pad0
  view.setUint8(10, 0); // pad1
  view.setUint8(11, 0); // pad2
  view.setUint32(12, 0, true); // unknown0
  view.setUint32(16, 0, true); // bufferPointer
  view.setUint32(20, 0, true); // unknown1
  return buf;
}

/**
 * Creates a synthetic MK1 fixture containing an authoritative handle table matching
 * the verified fixture expectations:
 * - STANCE.GRA (ID 0, size 187,000)
 * - JCATT.GRA  (ID 4, size 49,402) -> Anchor
 * - VANDAN.GRA (ID 34, size 563,812)
 * - KANO.GRA   (ID 35, size 595,504)
 * - RAIDEN.GRA (ID 36, size 635,184)
 * - KANG.GRA   (ID 37, size 453,820)
 * - NINJA.GRA  (ID 38, size 591,928)
 */
function createSyntheticMK1Fixture(options?: { omitFiles?: string[] }): { mem: MemoryDirectorySource; exe: Uint8Array } {
  const mem = new MemoryDirectorySource();
  const exe = new Uint8Array(10000);
  const tableOffset = 0x200;

  const entries: Array<{ fileId: number; path: string; size: number }> = [
    { fileId: 0, path: 'GRAPHICS/STANCE.GRA', size: 187000 },
    { fileId: 1, path: 'GRAPHICS/FONTS.GRA', size: 124328 },
    { fileId: 2, path: 'GRAPHICS/MISC.GRA', size: 104444 },
    { fileId: 3, path: 'GRAPHICS/VICTORY.GRA', size: 25352 },
    { fileId: 4, path: 'GRAPHICS/JCATT.GRA', size: 49402 },
  ];

  for (let i = 5; i <= 33; i++) {
    entries.push({ fileId: i, path: `GRAPHICS/DUMMY${i}.GRA`, size: 10000 + i * 100 });
  }

  entries.push({ fileId: 34, path: 'GRAPHICS/VANDAN.GRA', size: 563812 });
  entries.push({ fileId: 35, path: 'GRAPHICS/KANO.GRA', size: 595504 });
  entries.push({ fileId: 36, path: 'GRAPHICS/RAIDEN.GRA', size: 635184 });
  entries.push({ fileId: 37, path: 'GRAPHICS/KANG.GRA', size: 453820 });
  entries.push({ fileId: 38, path: 'GRAPHICS/NINJA.GRA', size: 591928 });

  const stringBaseOffset = 3000;
  let stringOffset = 0;
  const encoder = new TextEncoder();

  for (let i = 0; i < entries.length; i++) {
    const item = entries[i];
    const dosPath = item.path.replace(/\//g, '\\') + '\0';
    const encoded = encoder.encode(dosPath);

    exe.set(encoded, stringBaseOffset + stringOffset);
    exe.set(
      createSyntheticFileEntryRecord(item.size, stringOffset),
      tableOffset + i * 24,
    );

    stringOffset += encoded.byteLength;
    if (!options?.omitFiles?.includes(item.path)) {
      mem.setFile(item.path, new Uint8Array(item.size));
    }
  }

  mem.setFile('MK1.EXE', exe);
  return { mem, exe };
}

describe('Milestone 1C.1 — Target Resolution & Export Integrity Regression Tests', () => {
  it('resolves real fixture expectations via handle table (JCATT, VANDAN, KANO, RAIDEN, KANG, NINJA)', async () => {
    const { mem } = createSyntheticMK1Fixture();

    const jcatt = await resolveMK1GraTarget(mem, 'GRAPHICS/JCATT.GRA');
    expect(jcatt.fileId).toBe(4);
    expect(jcatt.fileSize).toBe(49402);
    expect(jcatt.confidence).toBe('verified');
    expect(jcatt.presentOnDisk).toBe(true);

    const vandan = await resolveMK1GraTarget(mem, 'GRAPHICS/VANDAN.GRA');
    expect(vandan.fileId).toBe(34);
    expect(vandan.fileSize).toBe(563812);
    expect(vandan.confidence).toBe('verified');
    expect(vandan.presentOnDisk).toBe(true);

    const kano = await resolveMK1GraTarget(mem, 'GRAPHICS/KANO.GRA');
    expect(kano.fileId).toBe(35);
    expect(kano.fileSize).toBe(595504);
    expect(kano.confidence).toBe('verified');
    expect(kano.presentOnDisk).toBe(true);

    const raiden = await resolveMK1GraTarget(mem, 'GRAPHICS/RAIDEN.GRA');
    expect(raiden.fileId).toBe(36);
    expect(raiden.fileSize).toBe(635184);

    const kang = await resolveMK1GraTarget(mem, 'GRAPHICS/KANG.GRA');
    expect(kang.fileId).toBe(37);
    expect(kang.fileSize).toBe(453820);

    const ninja = await resolveMK1GraTarget(mem, 'GRAPHICS/NINJA.GRA');
    expect(ninja.fileId).toBe(38);
    expect(ninja.fileSize).toBe(591928);
  });

  it('supports case-insensitive path selection and bare filename matching', async () => {
    const { mem } = createSyntheticMK1Fixture();

    const lower = await resolveMK1GraTarget(mem, 'graphics/kano.gra');
    expect(lower.fileId).toBe(35);
    expect(lower.fileSize).toBe(595504);

    const bare = await resolveMK1GraTarget(mem, 'KANO.GRA');
    expect(bare.fileId).toBe(35);
    expect(bare.fileSize).toBe(595504);
  });

  it('supports slash and backslash path normalization', async () => {
    const { mem } = createSyntheticMK1Fixture();

    const backslash = await resolveMK1GraTarget(mem, 'GRAPHICS\\KANO.GRA');
    expect(backslash.fileId).toBe(35);
    expect(backslash.fileSize).toBe(595504);
  });

  it('rejects unknown/nonsense path and does not silently fall back to JCATT', async () => {
    const { mem } = createSyntheticMK1Fixture();

    // 1. Target resolution must fail
    await expect(
      resolveMK1GraTarget(mem, 'GRAPHICS/NONSENSE.GRA'),
    ).rejects.toThrow(/not present in the reconstructed MK1 handle table/i);

    // 2. Descriptor scan must not execute and must not produce a result or export
    await expect(
      scanExeForSpriteDescriptors(mem, {
        targetGraPath: 'GRAPHICS/NONSENSE.GRA',
      }),
    ).rejects.toThrow(/not present in the reconstructed MK1 handle table/i);
  });

  it('rejects GRA file present on disk but absent from handle table', async () => {
    const { mem } = createSyntheticMK1Fixture();

    // Add unreferenced file to disk
    mem.setFile('GRAPHICS/UNREFERENCED.GRA', new Uint8Array(12345));

    await expect(
      resolveMK1GraTarget(mem, 'GRAPHICS/UNREFERENCED.GRA'),
    ).rejects.toThrow(/not present in the reconstructed MK1 handle table/i);
  });

  it('rejects disk file with size mismatch compared to handle table', async () => {
    const { mem } = createSyntheticMK1Fixture();

    // Corrupt KANO.GRA on disk
    mem.setFile('GRAPHICS/KANO.GRA', new Uint8Array(12345));

    await expect(
      resolveMK1GraTarget(mem, 'GRAPHICS/KANO.GRA'),
    ).rejects.toThrow(/size mismatch/i);
  });

  it('rejects file missing from disk even if present in handle table', async () => {
    const { mem } = createSyntheticMK1Fixture({ omitFiles: ['GRAPHICS/KANO.GRA'] });

    await expect(
      resolveMK1GraTarget(mem, 'GRAPHICS/KANO.GRA'),
    ).rejects.toThrow(/missing from disk/i);
  });

  it('strictly rejects scanning KANO using stale JCATT values (ID 4 / size 49402)', async () => {
    const { mem } = createSyntheticMK1Fixture();

    // Passing targetGraPath with mismatched targetFileId
    await expect(
      scanExeForSpriteDescriptors(mem, {
        targetGraPath: 'GRAPHICS/KANO.GRA',
        targetFileId: 4,
        targetGraSize: 49402,
      }),
    ).rejects.toThrow(/Target validation failed: Requested file ID 4 does not match handle table file ID 35/i);

    // Passing manually fabricated target object with mismatched file ID & size
    const bogusTarget: MK1ResolvedGraTarget = {
      path: 'GRAPHICS/KANO.GRA',
      fileId: 4,
      fileSize: 49402,
      handleEntryOffset: 0x000B0CBC,
      confidence: 'verified',
      status: 'Verified Handle Table Match',
      presentOnDisk: true,
    };

    await expect(
      scanExeForSpriteDescriptors(mem, {
        target: bogusTarget,
      }),
    ).rejects.toThrow(/Target file size mismatch|Target validation failed/i);
  });

  it('export integrity: KANO scan export contains actual resolved target and never JCATT values', async () => {
    const { mem, exe } = createSyntheticMK1Fixture();

    // Insert a valid KANO descriptor candidate (fileId 35 = 0x23, offset 0x1000) at offset 5000 (after handle & string tables)
    const kanoDesc = createSyntheticDescriptorBytes({
      kind: 'with-xy',
      width: 65,
      height: 95,
      x: -12,
      y: -24,
      fileId: 35,
      graOffset: 0x1000,
    });
    exe.set(kanoDesc, 5000);

    const kanoTarget = await resolveMK1GraTarget(mem, 'GRAPHICS/KANO.GRA');
    expect(kanoTarget.fileId).toBe(35);
    expect(kanoTarget.fileSize).toBe(595504);

    const scanResult = await scanExeForSpriteDescriptors(mem, {
      target: kanoTarget,
    });

    expect(scanResult.targetGra.path).toBe('GRAPHICS/KANO.GRA');
    expect(scanResult.targetGra.fileId).toBe(35);
    expect(scanResult.targetGra.size).toBe(595504);
    expect(scanResult.candidates.length).toBe(1);
    expect(scanResult.candidates[0].fileId).toBe(35);
    expect(scanResult.candidates[0].graOffset).toBe(0x1000);

    const exportData = createMK1SpriteDescriptorExport(scanResult);

    // Assert export identity
    expect(exportData.targetGra.path).toBe('GRAPHICS/KANO.GRA');
    expect(exportData.targetGra.fileId).toBe(35);
    expect(exportData.targetGra.sizeDecimal).toBe(595504);

    // Negative assertions: must NEVER produce JCATT values for KANO
    expect(exportData.targetGra.fileId).not.toBe(4);
    expect(exportData.targetGra.sizeDecimal).not.toBe(49402);
  });

  describe('Milestone 1D.1: Diagnostic Sprite Preview Data Retention & Navigation', () => {
    it('retains in-memory preview payload on successful decode without serializing to JSON export', async () => {
      const { mem, exe } = createSyntheticMK1Fixture();
      // Reallocate EXE to accommodate real anchor offset 0x000A7464
      const bigExe = new Uint8Array(0x000b0000);
      bigExe.set(exe, 0);
      mem.setFile('MK1.EXE', bigExe);

      const gra = new Uint8Array(595504);
      mem.setFile('GRAPHICS/KANO.GRA', gra);

      // Encode a small 4x2 sprite at GRA offset 0x200
      // Row 0: 4 pixels color 42 (RLE) -> cmd: ((4 << 10) | (42 << 2) | 2)
      // Row 1: 4 pixels color 0 (RLE) -> cmd: ((4 << 10) | (0 << 2) | 2) (opaque black)
      const rle42 = ((4 << 10) | ((42 & 0xff) << 2) | 2) >>> 0;
      const rle0 = ((4 << 10) | ((0 & 0xff) << 2) | 2) >>> 0;

      const graOffset = 0x200;
      gra[graOffset] = rle42 & 0xff;
      gra[graOffset + 1] = (rle42 >>> 8) & 0xff;
      gra[graOffset + 2] = (rle42 >>> 16) & 0xff;
      gra[graOffset + 3] = (rle42 >>> 24) & 0xff;

      gra[graOffset + 4] = rle0 & 0xff;
      gra[graOffset + 5] = (rle0 >>> 8) & 0xff;
      gra[graOffset + 6] = (rle0 >>> 16) & 0xff;
      gra[graOffset + 7] = (rle0 >>> 24) & 0xff;

      // Insert descriptor in EXE
      const descOffset = 0x000a7464;
      const desc = createSyntheticDescriptorBytes({
        kind: 'with-xy',
        width: 4,
        height: 2,
        x: 10,
        y: -5,
        fileId: 35,
        graOffset,
      });
      bigExe.set(desc, descOffset);

      const kanoTarget = await resolveMK1GraTarget(mem, 'GRAPHICS/KANO.GRA');
      const scanResult = await scanExeForSpriteDescriptors(mem, {
        target: kanoTarget,
      });

      expect(scanResult.candidates.length).toBe(1);
      const cand = scanResult.candidates[0];
      expect(cand.decode?.success).toBe(true);

      // Verify in-memory preview payload retention
      expect(scanResult.previewPayloads).toBeDefined();
      expect(scanResult.previewPayloads?.has(descOffset)).toBe(true);

      const payload = scanResult.previewPayloads?.get(descOffset)!;
      expect(payload.exeOffset).toBe(descOffset);
      expect(payload.width).toBe(4);
      expect(payload.height).toBe(2);
      expect(payload.x).toBe(10);
      expect(payload.y).toBe(-5);
      expect(payload.graOffset).toBe(graOffset);
      expect(payload.encodedBytesConsumed).toBe(8);
      expect(payload.commandCount).toBe(2);
      expect(payload.checksum).toBeDefined();
      expect(payload.indices.length).toBe(8);
      expect(payload.opaqueMask.length).toBe(8);
      // Row 0 has color 42, row 1 has color 0 (all opaque)
      expect(Array.from(payload.indices)).toEqual([42, 42, 42, 42, 0, 0, 0, 0]);
      expect(Array.from(payload.opaqueMask)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);

      // Verify anchor proof hasPreviewPayload flag
      expect(scanResult.firstSpriteProof).toBeDefined();
      expect(scanResult.firstSpriteProof?.descriptor?.hasPreviewPayload).toBe(true);

      // JSON export constraint: previewPayloads, indices, and opaqueMask must NEVER be serialized in JSON export
      const exportData = createMK1SpriteDescriptorExport(scanResult);
      const jsonString = JSON.stringify(exportData);
      expect(jsonString).not.toContain('previewPayloads');
      expect(jsonString).not.toContain('opaqueMask');
      expect((exportData as unknown as Record<string, unknown>).previewPayloads).toBeUndefined();
    });

    it('orders navigation sequence: only successful primary candidates, array runs first', () => {
      const candidates: MK1SpriteDescriptorCandidate[] = [
        {
          exeOffset: 0x1050,
          exeOffsetHex: '0x00001050',
          kind: 'with-xy',
          width: 20,
          height: 30,
          x: 0,
          y: 0,
          packedFileReference: 0,
          packedFileReferenceHex: '0x00000000',
          fileId: 35,
          graOffset: 500,
          graOffsetHex: '0x000001F4',
          targetGraPath: 'GRAPHICS/KANO.GRA',
          targetGraSize: 500000,
          validation: { widthValid: true, heightValid: true, xyValid: true, fileIdMatch: true, graOffsetValid: true, allRulesPassed: true, failedRules: [] },
          confidence: 'candidate',
          primaryCandidate: true,
          inArrayRun: false, // Non-array run, successful
          decode: { attempted: true, success: true, encodedBytesConsumed: 100, commandCount: 10, checksum: '1111' },
        },
        {
          exeOffset: 0x1020,
          exeOffsetHex: '0x00001020',
          kind: 'with-xy',
          width: 20,
          height: 30,
          x: 0,
          y: 0,
          packedFileReference: 0,
          packedFileReferenceHex: '0x00000000',
          fileId: 35,
          graOffset: 200,
          graOffsetHex: '0x000000C8',
          targetGraPath: 'GRAPHICS/KANO.GRA',
          targetGraSize: 500000,
          validation: { widthValid: true, heightValid: true, xyValid: true, fileIdMatch: true, graOffsetValid: true, allRulesPassed: true, failedRules: [] },
          confidence: 'inferred',
          primaryCandidate: true,
          inArrayRun: true, // Array run candidate, offset 0x1020
          arrayRunStride: 12,
          decode: { attempted: true, success: true, encodedBytesConsumed: 80, commandCount: 8, checksum: '2222' },
        },
        {
          exeOffset: 0x1010,
          exeOffsetHex: '0x00001010',
          kind: 'with-xy',
          width: 20,
          height: 30,
          x: 0,
          y: 0,
          packedFileReference: 0,
          packedFileReferenceHex: '0x00000000',
          fileId: 35,
          graOffset: 100,
          graOffsetHex: '0x00000064',
          targetGraPath: 'GRAPHICS/KANO.GRA',
          targetGraSize: 500000,
          validation: { widthValid: true, heightValid: true, xyValid: true, fileIdMatch: true, graOffsetValid: true, allRulesPassed: true, failedRules: [] },
          confidence: 'inferred',
          primaryCandidate: true,
          inArrayRun: true, // Array run candidate, offset 0x1010
          arrayRunStride: 12,
          decode: { attempted: true, success: true, encodedBytesConsumed: 90, commandCount: 9, checksum: '3333' },
        },
        {
          exeOffset: 0x1014,
          exeOffsetHex: '0x00001014',
          kind: 'no-xy',
          width: 20,
          height: 30,
          packedFileReference: 0,
          packedFileReferenceHex: '0x00000000',
          fileId: 35,
          graOffset: 100,
          graOffsetHex: '0x00000064',
          targetGraPath: 'GRAPHICS/KANO.GRA',
          targetGraSize: 500000,
          validation: { widthValid: true, heightValid: true, xyValid: true, fileIdMatch: true, graOffsetValid: true, allRulesPassed: true, failedRules: [] },
          confidence: 'candidate',
          primaryCandidate: false, // Alternate interpretation -> must be EXCLUDED
          alternateInterpretationOf: '0x00001010',
          decode: { attempted: true, success: true, encodedBytesConsumed: 90, commandCount: 9, checksum: '3333' },
        },
        {
          exeOffset: 0x1090,
          exeOffsetHex: '0x00001090',
          kind: 'with-xy',
          width: 20,
          height: 30,
          x: 0,
          y: 0,
          packedFileReference: 0,
          packedFileReferenceHex: '0x00000000',
          fileId: 35,
          graOffset: 900,
          graOffsetHex: '0x00000384',
          targetGraPath: 'GRAPHICS/KANO.GRA',
          targetGraSize: 500000,
          validation: { widthValid: true, heightValid: true, xyValid: true, fileIdMatch: true, graOffsetValid: true, allRulesPassed: true, failedRules: [] },
          confidence: 'candidate',
          primaryCandidate: true,
          inArrayRun: false,
          decode: { attempted: true, success: false, encodedBytesConsumed: 0, commandCount: 0, failureReason: 'Overflow' }, // Decode failed -> must be EXCLUDED
        },
      ];

      const sequence = getDecodedPrimaryPreviewSequence(candidates);

      // Total sequence count should only include the 3 successful primary candidates
      expect(sequence.length).toBe(3);

      // Array runs must appear FIRST, sorted ascending: 0x1010, then 0x1020
      expect(sequence[0].exeOffset).toBe(0x1010);
      expect(sequence[1].exeOffset).toBe(0x1020);

      // Non-array run comes next: 0x1050
      expect(sequence[2].exeOffset).toBe(0x1050);

      // Alternates and failed decodes must never be present
      expect(sequence.find((c) => c.exeOffset === 0x1014)).toBeUndefined();
      expect(sequence.find((c) => c.exeOffset === 0x1090)).toBeUndefined();
    });

    it('diagnostic rendering preserves opaque black index 0 distinct from transparent pixels', () => {
      // 3 pixels:
      // Pixel 0: opaqueMask = 0 (transparent)
      // Pixel 1: opaqueMask = 1, index = 0 (opaque black)
      // Pixel 2: opaqueMask = 1, index = 255 (opaque white)
      const indices = new Uint8Array([0, 0, 255]);
      const opaqueMask = new Uint8Array([0, 1, 1]);

      const rgba = generateDiagnosticRgba({
        width: 3,
        height: 1,
        indices,
        opaqueMask,
      });

      // Pixel 0 (Transparent): Alpha = 0
      expect(rgba[3]).toBe(0);

      // Pixel 1 (Opaque Black): R=0, G=0, B=0, Alpha=255
      // Critical check: index 0 MUST NOT be treated as transparent when opaqueMask is 1!
      expect(rgba[4]).toBe(0); // R
      expect(rgba[5]).toBe(0); // G
      expect(rgba[6]).toBe(0); // B
      expect(rgba[7]).toBe(255); // Alpha = fully opaque!

      // Pixel 2 (Opaque White): R=255, G=255, B=255, Alpha=255
      expect(rgba[8]).toBe(255); // R
      expect(rgba[9]).toBe(255); // G
      expect(rgba[10]).toBe(255); // B
      expect(rgba[11]).toBe(255); // Alpha = fully opaque!
    });
  });
});

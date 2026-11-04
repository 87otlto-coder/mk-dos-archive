import { describe, it, expect } from 'vitest';
import {
  parseCandidateFileEntry,
  probeNeighborSequence,
  probeMK1ExecutableForGRA,
  createMK1ProbeExport,
  MK1_FILE_ENTRY_SIZE,
} from '../games/mk1/research/fileEntryProbe';
import { DirectorySource, SourceFileEntry } from '../core/filesystem/DirectorySource';

class MemoryDirectorySource implements DirectorySource {
  readonly directoryName = 'TestMemSource';
  readonly isSynthetic = true;
  private files = new Map<string, Uint8Array>();

  setFile(path: string, bytes: Uint8Array) {
    this.files.set(path.toUpperCase(), bytes);
  }

  async listRecursive(): Promise<SourceFileEntry[]> {
    const entries: SourceFileEntry[] = [];
    for (const [p, b] of this.files.entries()) {
      const parts = p.split('/');
      const name = parts[parts.length - 1];
      const ext = name.includes('.') ? name.split('.').pop()?.toUpperCase() || '' : '';
      entries.push({
        path: p,
        name,
        extension: ext,
        size: b.byteLength,
      });
    }
    return entries;
  }

  async readSlice(path: string, offset: number, length: number): Promise<Uint8Array> {
    const file = this.files.get(path.toUpperCase());
    if (!file) throw new Error(`File not found: ${path}`);
    if (offset >= file.byteLength) return new Uint8Array(0);
    const end = Math.min(file.byteLength, offset + length);
    return file.slice(offset, end);
  }
}

function createSyntheticFileEntryBytes(params: {
  rawFilenameOffset?: number;
  fileSize?: number;
  flags?: number;
  pad0?: number;
  pad1?: number;
  pad2?: number;
  unknown0?: number;
  bufferPointer?: number;
  unknown1?: number;
}): Uint8Array {
  const buf = new Uint8Array(MK1_FILE_ENTRY_SIZE);
  const view = new DataView(buf.buffer);

  view.setUint32(0, params.rawFilenameOffset ?? 0x00021000, true);
  view.setUint32(4, params.fileSize ?? 0x0000c0fa, true);
  view.setUint8(8, params.flags ?? 0x12);
  view.setUint8(9, params.pad0 ?? 0);
  view.setUint8(10, params.pad1 ?? 0);
  view.setUint8(11, params.pad2 ?? 0);
  view.setUint32(12, params.unknown0 ?? 0, true);
  view.setUint32(16, params.bufferPointer ?? 0, true);
  view.setUint32(20, params.unknown1 ?? 0, true);

  return buf;
}

describe('MK1 FileEntry Candidate Model & Validation', () => {
  it('correctly parses and validates a conforming 24-byte FileEntry candidate', () => {
    const bytes = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00045000,
      fileSize: 0x0000c0fa, // 49,402 bytes
      flags: 0x12,
      unknown0: 0,
      bufferPointer: 0,
      unknown1: 0,
    });

    const candidate = parseCandidateFileEntry(bytes, 0x1000, 0x0000c0fa);
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.raw.fileSize).toBe(49402);
    expect(candidate.raw.fileSizeHex).toBe('0x0000C0FA');
    expect(candidate.raw.rawFilenameOffsetHex).toBe('0x00045000');
    expect(candidate.raw.flags).toBe(0x12);
    expect(candidate.raw.flagsHex).toBe('0x12');
    expect(candidate.validation.allRulesPassed).toBe(true);
    expect(candidate.validation.passedRulesCount).toBe(7);
    expect(candidate.confidence).toBe('hypothesis');
    expect(candidate.filenameResolution).toBe('UNRESOLVED');
  });

  it('flags invalid flags as failing rule 3', () => {
    const bytes = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00045000,
      fileSize: 0x0000c0fa,
      flags: 0xff, // Invalid flags
    });

    const candidate = parseCandidateFileEntry(bytes, 0x2000, 0x0000c0fa);
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.validation.flagsMatch).toBe(false);
    expect(candidate.validation.allRulesPassed).toBe(false);
    expect(candidate.confidence).toBe('unknown');
  });

  it('flags out-of-range filename offset as failing rule 2', () => {
    const bytes = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0xff000000, // Invalid large offset
      fileSize: 0x0000c0fa,
      flags: 0x12,
    });

    const candidate = parseCandidateFileEntry(bytes, 0x3000, 0x0000c0fa);
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.validation.nonZeroFilenameOffset).toBe(false);
    expect(candidate.validation.allRulesPassed).toBe(false);
  });

  it('flags non-zero runtime pointers (bufferPointer, unknown0, unknown1)', () => {
    const bytes = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00045000,
      fileSize: 0x0000c0fa,
      flags: 0x12,
      bufferPointer: 0xdeadbeef, // Non-zero runtime buffer pointer
    });

    const candidate = parseCandidateFileEntry(bytes, 0x4000, 0x0000c0fa);
    expect(candidate).not.toBeNull();
    if (!candidate) return;

    expect(candidate.validation.zeroBufferPtr).toBe(false);
    expect(candidate.validation.allRulesPassed).toBe(false);
  });

  it('returns null when buffer is truncated (< 24 bytes)', () => {
    const shortBuffer = new Uint8Array(20);
    const candidate = parseCandidateFileEntry(shortBuffer, 0x100);
    expect(candidate).toBeNull();
  });
});

describe('MK1 Neighbor Table Sequence Probe', () => {
  it('probes consecutive table entries and stops at non-conforming record', async () => {
    const mem = new MemoryDirectorySource();

    // Construct an array of 5 entries:
    // Entry 0 (offset 0): valid neighbor
    // Entry 1 (offset 24): TARGET ANCHOR (JCATT.GRA)
    // Entry 2 (offset 48): valid neighbor
    // Entry 3 (offset 72): valid neighbor
    // Entry 4 (offset 96): invalid record (terminator)

    const fullBuffer = new Uint8Array(120);

    const entry0 = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00010000,
      fileSize: 32000,
      flags: 0x12,
    });
    const anchor = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00020000,
      fileSize: 49402,
      flags: 0x12,
    });
    const entry2 = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00030000,
      fileSize: 18000,
      flags: 0x12,
    });
    const entry3 = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00040000,
      fileSize: 25000,
      flags: 0x12,
    });
    // Entry 4 is all zeros (invalid file size, invalid pointer)

    fullBuffer.set(entry0, 0);
    fullBuffer.set(anchor, 24);
    fullBuffer.set(entry2, 48);
    fullBuffer.set(entry3, 72);

    mem.setFile('MK1.EXE', fullBuffer);

    const sequence = await probeNeighborSequence(
      mem,
      'MK1.EXE',
      24, // anchor offset
      fullBuffer.byteLength,
      16,
    );

    expect(sequence.backwardCount).toBe(1);
    expect(sequence.forwardCount).toBe(2);
    expect(sequence.consecutiveCount).toBe(4); // 1 backward + anchor + 2 forward
    expect(sequence.provisionalIndex).toBe(1); // 0-indexed position within contiguous block
    expect(sequence.sequenceStartOffset).toBe(0);
    expect(sequence.sequenceEndOffset).toBe(96);
  });

  it('runs end-to-end correlation probe and generates valid export JSON', async () => {
    const mem = new MemoryDirectorySource();

    // Set up JCATT.GRA file with 49,402 bytes
    const jcattBytes = new Uint8Array(49402);
    mem.setFile('GRAPHICS/JCATT.GRA', jcattBytes);

    // Set up MK1.EXE containing a valid FileEntry table
    const exeBytes = new Uint8Array(500);

    // Write anchor FileEntry at offset 100
    const anchor = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00050000,
      fileSize: 49402,
      flags: 0x12,
    });
    exeBytes.set(anchor, 100);

    // Neighbor at offset 124
    const neighbor1 = createSyntheticFileEntryBytes({
      rawFilenameOffset: 0x00050020,
      fileSize: 12000,
      flags: 0x12,
    });
    exeBytes.set(neighbor1, 124);

    mem.setFile('MK1.EXE', exeBytes);

    const probeResult = await probeMK1ExecutableForGRA(
      mem,
      'GRAPHICS/JCATT.GRA',
    );

    expect(probeResult.sizeMatchesCount).toBe(1);
    expect(probeResult.validCandidatesCount).toBe(1);
    expect(probeResult.candidates[0].entryOffset).toBe(100);
    expect(probeResult.candidates[0].confidence).toBe('hypothesis');
    expect(probeResult.candidates[0].neighborSequence?.consecutiveCount).toBe(2);

    const exportData = createMK1ProbeExport(probeResult);
    expect(exportData.targetGra.size).toBe(49402);
    expect(exportData.targetGra.sizeHex).toBe('0x0000C0FA');
    expect(exportData.candidateFileEntries.length).toBe(1);
    expect(exportData.candidateFileEntries[0].offsetHex).toBe('0x00000064');
  });
});

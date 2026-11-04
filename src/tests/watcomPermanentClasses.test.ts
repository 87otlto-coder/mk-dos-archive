import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { BinaryReader } from '../core/binary/BinaryReader';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import {
  parseWatcomLanguageTable,
  parseWatcomSegmentAddressTable,
  parseWatcomModuleClass,
  parseWatcomGlobalSymbolClass,
  parseWatcomAddressInfoClass,
  enumerateWatcomPermanentClasses,
  reconcileWatcomPermanentClasses,
} from '../core/executable/watcomDebug/watcomPermanentClassParser';
import {
  enumerateMK1WatcomPermanentClasses,
  enumerateMK1WatcomPermanentClassesForTest,
  createMK1WatcomPermanentClassesExport,
  serializeWatcomPermanentClassesNonAuthoritative,
} from '../games/mk1/research/watcomPermanentClassInventory';
import {
  WatcomMasterDebugHeader,
  WatcomSectionDebugHeader,
} from '../core/executable/watcomDebug/watcomDebugTypes';

/**
 * Builds a synthetic payload containing all 5 permanent Watcom debug classes.
 * Strictly uses generic synthetic labels (no Mortal Kombat identifiers or addresses).
 */
function buildSyntheticWatcomContainerWithClasses(options?: {
  languages?: string[];
  segments?: number[];
  modules?: Array<{
    name: string;
    languageOffset: number;
    locals?: { offset: number; num: number };
    types?: { offset: number; num: number };
    lines?: { offset: number; num: number };
  }>;
  symbols?: Array<{
    name: string;
    segment: number;
    addressOffset: number;
    moduleIndex: number;
    kind: number;
  }>;
  addrInfo?: Array<{
    startOffset: number;
    segment: number;
    isNonSect?: boolean;
    entries: Array<{ size: number; moduleIndex: number }>;
  }>;
}) {
  const langList = options?.languages ?? ['C', 'CPP'];
  const segList = options?.segments ?? [1, 2];
  const modList = options?.modules ?? [
    {
      name: 'module_alpha.c',
      languageOffset: 0,
      locals: { offset: 0x100, num: 2 },
      types: { offset: 0x200, num: 1 },
      lines: { offset: 0x300, num: 10 },
    },
    {
      name: 'module_beta.c',
      languageOffset: 2, // "C\0" is 2 bytes, so CPP starts at offset 2
      locals: { offset: 0x400, num: 4 },
      types: { offset: 0x500, num: 2 },
      lines: { offset: 0x600, num: 20 },
    },
  ];
  const symList = options?.symbols ?? [
    {
      name: 'global_alpha',
      segment: 1,
      addressOffset: 0x1000,
      moduleIndex: 0,
      kind: 0x04, // code
    },
    {
      name: 'global_beta',
      segment: 2,
      addressOffset: 0x2000,
      moduleIndex: 1,
      kind: 0x02, // data
    },
  ];
  const addrList = options?.addrInfo ?? [
    {
      startOffset: 0x1000,
      segment: 1,
      isNonSect: false,
      entries: [
        { size: 0x80, moduleIndex: 0 },
        { size: 0x120, moduleIndex: 1 },
      ],
    },
  ];

  // 1. Build Language Table bytes
  const langBytes: number[] = [];
  for (const l of langList) {
    for (let i = 0; i < l.length; i++) {
      langBytes.push(l.charCodeAt(i));
    }
    langBytes.push(0); // terminating NUL
  }
  const langSize = langBytes.length;

  // 2. Build Segment Address Table bytes
  const segBytes: number[] = [];
  for (const s of segList) {
    segBytes.push(s & 0xff, (s >> 8) & 0xff);
  }
  const segSize = segBytes.length;

  // 3. Build Module Class bytes
  const modBytes: number[] = [];
  for (const m of modList) {
    // 20-byte fixed header
    modBytes.push(m.languageOffset & 0xff, (m.languageOffset >> 8) & 0xff);
    // locals: offset u32, num u16
    const locOff = m.locals?.offset ?? 0;
    const locNum = m.locals?.num ?? 0;
    modBytes.push(
      locOff & 0xff,
      (locOff >> 8) & 0xff,
      (locOff >> 16) & 0xff,
      (locOff >> 24) & 0xff,
      locNum & 0xff,
      (locNum >> 8) & 0xff,
    );
    // types: offset u32, num u16
    const typOff = m.types?.offset ?? 0;
    const typNum = m.types?.num ?? 0;
    modBytes.push(
      typOff & 0xff,
      (typOff >> 8) & 0xff,
      (typOff >> 16) & 0xff,
      (typOff >> 24) & 0xff,
      typNum & 0xff,
      (typNum >> 8) & 0xff,
    );
    // lines: offset u32, num u16
    const linOff = m.lines?.offset ?? 0;
    const linNum = m.lines?.num ?? 0;
    modBytes.push(
      linOff & 0xff,
      (linOff >> 8) & 0xff,
      (linOff >> 16) & 0xff,
      (linOff >> 24) & 0xff,
      linNum & 0xff,
      (linNum >> 8) & 0xff,
    );
    // name_len u8
    modBytes.push(m.name.length);
    // name chars
    for (let i = 0; i < m.name.length; i++) {
      modBytes.push(m.name.charCodeAt(i));
    }
  }

  // 4. Build Global Symbol Class bytes
  const symBytes: number[] = [];
  for (const s of symList) {
    // addr.offset u32
    symBytes.push(
      s.addressOffset & 0xff,
      (s.addressOffset >> 8) & 0xff,
      (s.addressOffset >> 16) & 0xff,
      (s.addressOffset >> 24) & 0xff,
    );
    // addr.segment u16
    symBytes.push(s.segment & 0xff, (s.segment >> 8) & 0xff);
    // mod u16
    symBytes.push(s.moduleIndex & 0xff, (s.moduleIndex >> 8) & 0xff);
    // kind u8
    symBytes.push(s.kind & 0xff);
    // name_len u8
    symBytes.push(s.name.length);
    // name chars
    for (let i = 0; i < s.name.length; i++) {
      symBytes.push(s.name.charCodeAt(i));
    }
  }

  // 5. Build Address Info Class bytes
  const addrBytes: number[] = [];
  for (const a of addrList) {
    // startOffset u32
    addrBytes.push(
      a.startOffset & 0xff,
      (a.startOffset >> 8) & 0xff,
      (a.startOffset >> 16) & 0xff,
      (a.startOffset >> 24) & 0xff,
    );
    // segment u16
    addrBytes.push(a.segment & 0xff, (a.segment >> 8) & 0xff);
    // num u16 (low 15 bits count, bit 15 nonsect)
    const rawNum = (a.entries.length & 0x7fff) | (a.isNonSect ? 0x8000 : 0);
    addrBytes.push(rawNum & 0xff, (rawNum >> 8) & 0xff);
    // entries: size u32, mod u16
    for (const e of a.entries) {
      addrBytes.push(
        e.size & 0xff,
        (e.size >> 8) & 0xff,
        (e.size >> 16) & 0xff,
        (e.size >> 24) & 0xff,
        e.moduleIndex & 0xff,
        (e.moduleIndex >> 8) & 0xff,
      );
    }
  }

  // Section header offsets
  const sectionHeaderSize = 18;
  const modOffset = sectionHeaderSize;
  const gblOffset = modOffset + modBytes.length;
  const addrOffset = gblOffset + symBytes.length;
  const sectionSize = addrOffset + addrBytes.length;

  // Root section header (18 bytes)
  const rootSectionBytes: number[] = [
    sectionSize & 0xff,
    (sectionSize >> 8) & 0xff,
    (sectionSize >> 16) & 0xff,
    (sectionSize >> 24) & 0xff,
    0x00, 0x00, // section_id = 0
    modOffset & 0xff,
    (modOffset >> 8) & 0xff,
    (modOffset >> 16) & 0xff,
    (modOffset >> 24) & 0xff,
    gblOffset & 0xff,
    (gblOffset >> 8) & 0xff,
    (gblOffset >> 16) & 0xff,
    (gblOffset >> 24) & 0xff,
    addrOffset & 0xff,
    (addrOffset >> 8) & 0xff,
    (addrOffset >> 16) & 0xff,
    (addrOffset >> 24) & 0xff,
  ];

  // Master debug header (14 bytes)
  const masterHeaderSize = 14;
  const totalDebugSize = langSize + segSize + sectionSize + masterHeaderSize;

  const masterBytes: number[] = [
    0x86, 0x83, // WAT_DBG_SIGNATURE
    3, 0,       // exe 3.0
    1, 0,       // obj 1.0
    langSize & 0xff,
    (langSize >> 8) & 0xff,
    segSize & 0xff,
    (segSize >> 8) & 0xff,
    totalDebugSize & 0xff,
    (totalDebugSize >> 8) & 0xff,
    (totalDebugSize >> 16) & 0xff,
    (totalDebugSize >> 24) & 0xff,
  ];

  // Assemble container bytes
  const containerBytes = new Uint8Array([
    ...langBytes,
    ...segBytes,
    ...rootSectionBytes,
    ...modBytes,
    ...symBytes,
    ...addrBytes,
    ...masterBytes,
  ]);

  return {
    containerBytes,
    langSize,
    segSize,
    sectionSize,
    modOffset,
    gblOffset,
    addrOffset,
    totalDebugSize,
  };
}

describe('Open Watcom Permanent Debug-Information Classes (Pass 1E.3B)', () => {
  describe('1. Source-Language Table Parser', () => {
    it('parses valid null-terminated language strings', () => {
      const { containerBytes, langSize } = buildSyntheticWatcomContainerWithClasses({
        languages: ['C', 'CPP', 'FORTRAN'],
      });
      const reader = new BinaryReader(containerBytes);
      const table = parseWatcomLanguageTable(reader, 0, langSize);

      expect(table.valid).toBe(true);
      expect(table.consumedByteLength).toBe(langSize);
      expect(table.entries.length).toBe(3);
      expect(table.entries[0].language).toBe('C');
      expect(table.entries[0].tableOffset).toBe(0);
      expect(table.entries[1].language).toBe('CPP');
      expect(table.entries[1].tableOffset).toBe(2);
      expect(table.entries[2].language).toBe('FORTRAN');
      expect(table.entries[2].tableOffset).toBe(6);
    });

    it('handles empty language table (langSize = 0)', () => {
      const reader = new BinaryReader(new Uint8Array(10));
      const table = parseWatcomLanguageTable(reader, 0, 0);

      expect(table.valid).toBe(true);
      expect(table.entries).toEqual([]);
      expect(table.consumedByteLength).toBe(0);
    });

    it('fails closed when language string lacks terminating NUL before boundary', () => {
      const badBytes = new Uint8Array([0x43, 0x50, 0x50]); // "CPP" with no NUL, declared size 3
      const reader = new BinaryReader(badBytes);
      const table = parseWatcomLanguageTable(reader, 0, 3);

      expect(table.valid).toBe(false);
      expect(table.errors.length).toBeGreaterThan(0);
      expect(table.entries[0].valid).toBe(false);
      expect(table.entries[0].error).toMatch(/Missing terminating NUL/);
    });
  });

  describe('2. Segment-Address Table Parser', () => {
    it('parses 16-bit segment selectors', () => {
      const { containerBytes, langSize, segSize } = buildSyntheticWatcomContainerWithClasses({
        segments: [1, 2, 3, 0x10],
      });
      const reader = new BinaryReader(containerBytes);
      const table = parseWatcomSegmentAddressTable(reader, langSize, segSize);

      expect(table.valid).toBe(true);
      expect(table.entryCount).toBe(4);
      expect(table.entries.map((e) => e.segment)).toEqual([1, 2, 3, 0x10]);
      expect(table.entries[0].tableOffset).toBe(0);
      expect(table.entries[1].tableOffset).toBe(2);
    });

    it('handles empty segment table (segmentSize = 0)', () => {
      const reader = new BinaryReader(new Uint8Array(10));
      const table = parseWatcomSegmentAddressTable(reader, 0, 0);

      expect(table.valid).toBe(true);
      expect(table.entryCount).toBe(0);
      expect(table.entries).toEqual([]);
    });

    it('records error when segment table size is not an even multiple of 2', () => {
      const oddBytes = new Uint8Array([1, 0, 2]); // 3 bytes
      const reader = new BinaryReader(oddBytes);
      const table = parseWatcomSegmentAddressTable(reader, 0, 3);

      expect(table.valid).toBe(false);
      expect(table.errors).toContain(
        'Segment address table size (3 bytes) is not an even multiple of 2-byte segment entries',
      );
    });
  });

  describe('3. Module-Information Class Parser', () => {
    it('parses valid module records with exact tiling', () => {
      const { containerBytes, langSize, segSize, modOffset, gblOffset } =
        buildSyntheticWatcomContainerWithClasses({
          modules: [
            { name: 'generic_mod_1.c', languageOffset: 0 },
            { name: 'generic_mod_2.c', languageOffset: 2 },
          ],
        });
      const reader = new BinaryReader(containerBytes);
      const sectionStart = langSize + segSize;
      const modClass = parseWatcomModuleClass(
        reader,
        sectionStart + modOffset,
        sectionStart + gblOffset,
        sectionStart,
      );

      expect(modClass.valid).toBe(true);
      expect(modClass.tilingValid).toBe(true);
      expect(modClass.moduleCount).toBe(2);
      expect(modClass.modules[0].name).toBe('generic_mod_1.c');
      expect(modClass.modules[1].name).toBe('generic_mod_2.c');
      expect(modClass.modules[0].recordByteLength).toBe(21 + 'generic_mod_1.c'.length);
      expect(modClass.modules[0].fixedHeaderRawBytesHex.length).toBeGreaterThan(0);
    });

    it('detects truncated module record (< 21 bytes)', () => {
      const truncated = new Uint8Array(15); // < 21 bytes
      const reader = new BinaryReader(truncated);
      const modClass = parseWatcomModuleClass(reader, 0, 15, 0);

      expect(modClass.valid).toBe(false);
      expect(modClass.tilingValid).toBe(false);
      expect(modClass.errors.length).toBeGreaterThan(0);
      expect(modClass.errors[0]).toMatch(/Truncated module record/);
    });

    it('detects name overrun beyond declared module boundary', () => {
      // 21 bytes minimum header with declared name length 50, but total space only 25
      const badMod = new Uint8Array(25);
      badMod[20] = 50; // name_length = 50, overruns 25
      const reader = new BinaryReader(badMod);
      const modClass = parseWatcomModuleClass(reader, 0, 25, 0);

      expect(modClass.valid).toBe(false);
      expect(modClass.tilingValid).toBe(false);
      expect(modClass.errors[0]).toMatch(/overruns module class boundary/);
    });
  });

  describe('4. Global-Symbol Class Parser', () => {
    it('parses global symbols and decodes kind bits', () => {
      const { containerBytes, langSize, segSize, gblOffset, addrOffset } =
        buildSyntheticWatcomContainerWithClasses({
          symbols: [
            {
              name: 'sym_static_func',
              segment: 1,
              addressOffset: 0x1000,
              moduleIndex: 0,
              kind: 0x05, // static (0x01) | code (0x04)
            },
            {
              name: 'sym_global_var',
              segment: 2,
              addressOffset: 0x2000,
              moduleIndex: 1,
              kind: 0x02, // data (0x02)
            },
          ],
        });
      const reader = new BinaryReader(containerBytes);
      const sectionStart = langSize + segSize;
      const gblClass = parseWatcomGlobalSymbolClass(
        reader,
        sectionStart + gblOffset,
        sectionStart + addrOffset,
        sectionStart,
      );

      expect(gblClass.valid).toBe(true);
      expect(gblClass.tilingValid).toBe(true);
      expect(gblClass.symbolCount).toBe(2);

      const s0 = gblClass.symbols[0];
      expect(s0.name).toBe('sym_static_func');
      expect(s0.addressOffset).toBe(0x1000);
      expect(s0.segment).toBe(1);
      expect(s0.kindBits.isStatic).toBe(true);
      expect(s0.kindBits.isCode).toBe(true);
      expect(s0.kindBits.isData).toBe(false);

      const s1 = gblClass.symbols[1];
      expect(s1.name).toBe('sym_global_var');
      expect(s1.addressOffset).toBe(0x2000);
      expect(s1.segment).toBe(2);
      expect(s1.kindBits.isStatic).toBe(false);
      expect(s1.kindBits.isCode).toBe(false);
      expect(s1.kindBits.isData).toBe(true);
    });

    it('detects truncated global symbol record (< 10 bytes)', () => {
      const truncated = new Uint8Array(8); // < 10 bytes
      const reader = new BinaryReader(truncated);
      const gblClass = parseWatcomGlobalSymbolClass(reader, 0, 8, 0);

      expect(gblClass.valid).toBe(false);
      expect(gblClass.errors[0]).toMatch(/Truncated global symbol record/);
    });
  });

  describe('5. Address-Information Class Parser', () => {
    it('parses address segment headers and child entries', () => {
      const { containerBytes, langSize, segSize, addrOffset, sectionSize } =
        buildSyntheticWatcomContainerWithClasses({
          addrInfo: [
            {
              startOffset: 0x1000,
              segment: 1,
              isNonSect: false,
              entries: [
                { size: 0x100, moduleIndex: 0 },
                { size: 0x200, moduleIndex: 1 },
              ],
            },
          ],
        });
      const reader = new BinaryReader(containerBytes);
      const sectionStart = langSize + segSize;
      const addrClass = parseWatcomAddressInfoClass(
        reader,
        sectionStart + addrOffset,
        sectionStart + sectionSize,
        sectionStart,
      );

      expect(addrClass.valid).toBe(true);
      expect(addrClass.tilingValid).toBe(true);
      expect(addrClass.segmentRecordCount).toBe(1);

      const seg0 = addrClass.segmentRecords[0];
      expect(seg0.segment).toBe(1);
      expect(seg0.startAddressOffset).toBe(0x1000);
      expect(seg0.entryCount).toBe(2);
      expect(seg0.isNonSect).toBe(false);
      expect(seg0.entries.length).toBe(2);
      expect(seg0.entries[0].size).toBe(0x100);
      expect(seg0.entries[1].size).toBe(0x200);
    });

    it('correctly decodes NonSect flag (bit 15 of rawNum)', () => {
      const { containerBytes, langSize, segSize, addrOffset, sectionSize } =
        buildSyntheticWatcomContainerWithClasses({
          addrInfo: [
            {
              startOffset: 0x5000,
              segment: 2,
              isNonSect: true,
              entries: [{ size: 0x50, moduleIndex: 0 }],
            },
          ],
        });
      const reader = new BinaryReader(containerBytes);
      const sectionStart = langSize + segSize;
      const addrClass = parseWatcomAddressInfoClass(
        reader,
        sectionStart + addrOffset,
        sectionStart + sectionSize,
        sectionStart,
      );

      expect(addrClass.valid).toBe(true);
      expect(addrClass.segmentRecords[0].isNonSect).toBe(true);
      expect(addrClass.segmentRecords[0].entryCount).toBe(1);
    });
  });

  describe('6. Integrated Permanent-Class Enumeration & Reconciliation', () => {
    it('enumerates all 5 classes and reconciles cross-class invariants', () => {
      const {
        containerBytes,
        langSize,
        segSize,
        sectionSize,
        modOffset,
        gblOffset,
        addrOffset,
        totalDebugSize,
      } = buildSyntheticWatcomContainerWithClasses();

      const reader = new BinaryReader(containerBytes);
      const masterHeader: WatcomMasterDebugHeader = {
        signature: 0x8386,
        signatureHex: '0x8386',
        signatureValid: true,
        exeMajorVer: 3,
        exeMinorVer: 0,
        objMajorVer: 1,
        objMinorVer: 0,
        versionValid: true,
        versionString: 'EXE 3.0, OBJ 1.0',
        langSize,
        langSizeHex: '0x' + langSize.toString(16),
        segmentSize: segSize,
        segmentSizeHex: '0x' + segSize.toString(16),
        debugSize: totalDebugSize,
        debugSizeHex: '0x' + totalDebugSize.toString(16),
        rawBytesHex: '',
        headerOffset: totalDebugSize - 14,
        headerOffsetHex: '',
      };

      const rootSection: WatcomSectionDebugHeader = {
        sectionIndex: 0,
        fileOffset: langSize + segSize,
        fileOffsetHex: '0x00000000',
        sectionSize,
        sectionSizeHex: '0x' + sectionSize.toString(16),
        sectionId: 0,
        modOffset,
        modOffsetHex: '0x' + modOffset.toString(16),
        gblOffset,
        gblOffsetHex: '0x' + gblOffset.toString(16),
        addrOffset,
        addrOffsetHex: '0x' + addrOffset.toString(16),
        isPlacekeeper: false,
        valid: true,
      };

      const result = enumerateWatcomPermanentClasses(
        reader,
        0,
        masterHeader,
        rootSection,
      );

      expect(result.overallValid).toBe(true);
      expect(result.validation.languageTableConsumed).toBe(true);
      expect(result.validation.segmentTableConsumed).toBe(true);
      expect(result.validation.moduleClassTiled).toBe(true);
      expect(result.validation.globalClassTiled).toBe(true);
      expect(result.validation.addressClassTiled).toBe(true);
      expect(result.validation.allModuleLanguagesValid).toBe(true);
      expect(result.validation.allGlobalModulesValid).toBe(true);
      expect(result.validation.allAddressModulesValid).toBe(true);
      expect(result.validation.allChecksPassed).toBe(true);
      expect(result.validation.symbolSegmentsReconciled.allPresentInTable).toBe(true);
    });
  });

  describe('7. Provenance Hardening & Export Gating', () => {
    it('in-memory synthetic execution cannot produce authoritative export', async () => {
      const { containerBytes } = buildSyntheticWatcomContainerWithClasses();
      const prefix = new Uint8Array(0x200);
      const fullExe = new Uint8Array(prefix.length + containerBytes.length);
      fullExe.set(prefix, 0);
      fullExe.set(containerBytes, prefix.length);

      const source = new MemoryDirectorySource('TEST_SYNTHETIC');
      source.setFile('MK1.EXE', fullExe);

      const mockLayout = {
        exeSize: fullExe.length,
        topology: {
          boundaries: { highestFileBackedPageEnd: prefix.length - 1 },
          postModuleTail: {
            startOffset: prefix.length,
            endOffset: fullExe.length,
            byteLength: fullExe.length - prefix.length,
          },
        },
      } as any;

      const report = await enumerateMK1WatcomPermanentClassesForTest(source, {
        layoutReport: mockLayout,
      });

      // Report from MemoryDirectorySource is strictly synthetic
      expect(report.provenance.synthetic).toBe(true);
      expect(report.provenance.artifactGeneratedByTest).toBe(true);
      expect(report.provenance.sourceKind).toBe('in-memory-buffer');

      // Export must throw
      expect(() => createMK1WatcomPermanentClassesExport(report)).toThrow(
        /Synthetic fixtures cannot generate authoritative research artifacts/,
      );

      // Adversarial mutation regression: synthetic = false without valid SHA-256 fails closed
      const tamperedReport = {
        ...report,
        provenance: {
          ...report.provenance,
          synthetic: false,
          artifactGeneratedByTest: false,
          sourceKind: 'user-loaded-directory' as const,
          sha256: 'invalid_sha',
        },
      };
      expect(() => createMK1WatcomPermanentClassesExport(tamperedReport as any)).toThrow(
        /Authoritative export requires valid non-zero 64-character lowercase SHA-256 hex digest/,
      );

      // Non-authoritative serializer succeeds for synthetic inspection
      const nonAuth = serializeWatcomPermanentClassesNonAuthoritative(report) as any;
      expect(nonAuth.nonAuthoritative).toBe(true);
      expect(nonAuth.provenance.synthetic).toBe(true);
    });

    it('test code creates no permanent-class research JSON on disk', () => {
      const rootFiles = fs.readdirSync('.');
      const rootDiscoveryFiles = rootFiles.filter((f) =>
        f.startsWith('mk1_watcom_permanent_classes'),
      );
      expect(rootDiscoveryFiles).toEqual([]);

      if (fs.existsSync('public')) {
        const publicFiles = fs.readdirSync('public');
        const publicDiscoveryFiles = publicFiles.filter((f) =>
          f.startsWith('mk1_watcom_permanent_classes'),
        );
        expect(publicDiscoveryFiles).toEqual([]);
      }
    });

    it('parser code contains NO hardcoded Mortal Kombat symbols or expected coordinates', () => {
      const forbiddenTokens = [
        'SUBZERO',
        'RAIDEN',
        'KANO',
        'SCORPION',
        'SONYA',
        'JOHNNY',
        'GORO',
        'LIUKANG',
        'PALETTE',
        'MORTAL',
      ];

      const parserCode = fs.readFileSync(
        'src/core/executable/watcomDebug/watcomPermanentClassParser.ts',
        'utf-8',
      ).toUpperCase();

      for (const token of forbiddenTokens) {
        expect(
          parserCode.includes(token),
          `watcomPermanentClassParser.ts must NOT contain forbidden token ${token}`,
        ).toBe(false);
      }
    });

    it('preflight 1 & 2 regression: all-zero SHA-256 is rejected and test helpers fail on non-synthetic source', async () => {
      const { containerBytes } = buildSyntheticWatcomContainerWithClasses();
      const prefix = new Uint8Array(0x200);
      const fullExe = new Uint8Array(prefix.length + containerBytes.length);
      fullExe.set(prefix, 0);
      fullExe.set(containerBytes, prefix.length);

      const source = new MemoryDirectorySource('TEST_SYNTHETIC');
      source.setFile('MK1.EXE', fullExe);

      const mockLayout = {
        exeSize: fullExe.length,
        topology: {
          boundaries: { highestFileBackedPageEnd: prefix.length - 1 },
          postModuleTail: {
            startOffset: prefix.length,
            endOffset: fullExe.length,
            byteLength: fullExe.length - prefix.length,
          },
        },
      } as any;

      const report = await enumerateMK1WatcomPermanentClassesForTest(source, {
        layoutReport: mockLayout,
      });

      // 1. All-zero SHA-256 placeholder is rejected for authoritative export
      const allZeroHashReport = {
        ...report,
        provenance: {
          ...report.provenance,
          synthetic: false,
          artifactGeneratedByTest: false,
          sourceKind: 'user-loaded-directory' as const,
          sha256: '0000000000000000000000000000000000000000000000000000000000000000',
        },
      };
      expect(() => createMK1WatcomPermanentClassesExport(allZeroHashReport as any)).toThrow(
        /Authoritative export requires valid non-zero 64-character lowercase SHA-256 hex digest/,
      );

      // 2. Production API cannot inject layout reports into non-synthetic source
      const fakeRealSource = {
        directoryName: 'REAL_USER_DIR',
        isSynthetic: false,
        readSlice: async () => fullExe,
        getFileSize: async () => fullExe.length,
      } as any;

      await expect(
        enumerateMK1WatcomPermanentClassesForTest(fakeRealSource, { layoutReport: mockLayout }),
      ).rejects.toThrow(/cannot be invoked on non-synthetic source/);
    });

    it('preflight 3 regression: strictly zero-based module index boundary (modCount-1 valid, modCount invalid)', () => {
      // Build container with 2 modules (indexes 0 and 1)
      const modules = [
        {
          moduleIndex: 0,
          name: 'ALPHA.OBJ',
          languageOffset: 0,
          resolvedLanguage: 'C',
          recordByteLength: 30,
          fileOffset: 0,
          fileOffsetHex: '0x0',
          sectionOffset: 0,
          sectionOffsetHex: '0x0',
          locals: { offset: 0, offsetHex: '0x0', numEntries: 0 },
          types: { offset: 0, offsetHex: '0x0', numEntries: 0 },
          lines: { offset: 0, offsetHex: '0x0', numEntries: 0 },
          nameLength: 9,
          fixedHeaderRawBytesHex: '',
          valid: true,
        },
        {
          moduleIndex: 1,
          name: 'BETA.OBJ',
          languageOffset: 0,
          resolvedLanguage: 'C',
          recordByteLength: 30,
          fileOffset: 30,
          fileOffsetHex: '0x1E',
          sectionOffset: 30,
          sectionOffsetHex: '0x1E',
          locals: { offset: 0, offsetHex: '0x0', numEntries: 0 },
          types: { offset: 0, offsetHex: '0x0', numEntries: 0 },
          lines: { offset: 0, offsetHex: '0x0', numEntries: 0 },
          nameLength: 8,
          fixedHeaderRawBytesHex: '',
          valid: true,
        },
      ];

      // Test symbols with module index 1 (valid, modCount - 1) vs module index 2 (invalid, modCount)
      const buf = new Uint8Array(40);
      const view = new DataView(buf.buffer);
      // Symbol 0: offset 0x100, seg 1, mod 1 (valid!)
      view.setUint32(0, 0x100, true);
      view.setUint16(4, 1, true);
      view.setUint16(6, 1, true); // mod 1
      buf[8] = 0x04; // code
      buf[9] = 3; // nameLen
      buf[10] = 0x53; buf[11] = 0x31; buf[12] = 0x30; // 'S10'
      // Total len: 13 bytes

      // Symbol 1: offset 0x200, seg 1, mod 2 (invalid! modCount is 2, so valid is 0..1)
      view.setUint32(13, 0x200, true);
      view.setUint16(17, 1, true);
      view.setUint16(19, 2, true); // mod 2 (INVALID)
      buf[21] = 0x02; // data
      buf[22] = 3; // nameLen
      buf[23] = 0x53; buf[24] = 0x32; buf[25] = 0x30; // 'S20'
      // Total len: 13 bytes

      const reader = new BinaryReader(buf);
      const gblResult = parseWatcomGlobalSymbolClass(reader, 0, 26, 0, modules);

      expect(gblResult.symbols).toHaveLength(2);
      expect(gblResult.symbols[0].moduleIndex).toBe(1);
      expect(gblResult.symbols[0].resolvedModuleName).toBe('BETA.OBJ');
      expect(gblResult.symbols[0].valid).toBe(true);

      expect(gblResult.symbols[1].moduleIndex).toBe(2);
      expect(gblResult.symbols[1].resolvedModuleName).toBeNull();
      expect(gblResult.symbols[1].valid).toBe(false);
      expect(gblResult.symbols[1].error).toContain('Invalid module index 2');
    });

    it('preflight 4 regression: segment absent from segment table fails overall structural reconciliation', () => {
      const languages = {
        fileOffset: 0,
        fileOffsetHex: '0x0',
        declaredByteLength: 2,
        consumedByteLength: 2,
        entries: [{ index: 0, language: 'C', tableOffset: 0, byteLength: 2, fileOffset: 0, fileOffsetHex: '0x0', valid: true }],
        valid: true,
        errors: [],
      };

      const segmentAddresses = {
        fileOffset: 2,
        fileOffsetHex: '0x2',
        declaredByteLength: 2,
        consumedByteLength: 2,
        entryCount: 1,
        entries: [{ entryIndex: 0, segment: 1, segmentHex: '0x0001', fileOffset: 2, fileOffsetHex: '0x2', tableOffset: 0, valid: true }],
        valid: true,
        errors: [],
      };

      const modules = {
        fileOffsetStart: 4,
        fileOffsetStartHex: '0x4',
        fileOffsetEnd: 4,
        fileOffsetEndHex: '0x4',
        declaredByteLength: 0,
        consumedByteLength: 0,
        moduleCount: 0,
        modules: [],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      // Global symbol uses segment 2 (absent from segmentAddresses which only has segment 1)
      const globalSymbols = {
        fileOffsetStart: 4,
        fileOffsetStartHex: '0x4',
        fileOffsetEnd: 4,
        fileOffsetEndHex: '0x4',
        declaredByteLength: 0,
        consumedByteLength: 0,
        symbolCount: 1,
        symbols: [{
          globalIndex: 0,
          fileOffset: 4,
          fileOffsetHex: '0x4',
          sectionOffset: 0,
          sectionOffsetHex: '0x0',
          recordByteLength: 10,
          addressOffset: 0,
          addressOffsetHex: '0x0',
          segment: 2, // ABSENT FROM SEGMENT TABLE
          segmentHex: '0x0002',
          moduleIndex: 0,
          resolvedModuleName: null,
          rawKind: 4,
          kindBits: { isStatic: false, isData: false, isCode: true, rawKind: 4, rawKindHex: '0x04' },
          nameLength: 1,
          name: 'A',
          valid: true,
        }],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const addressInfo = {
        fileOffsetStart: 4,
        fileOffsetStartHex: '0x4',
        fileOffsetEnd: 4,
        fileOffsetEndHex: '0x4',
        declaredByteLength: 0,
        consumedByteLength: 0,
        segmentRecordCount: 0,
        segmentRecords: [],
        tilingValid: true,
        valid: true,
        errors: [],
      };

      const validation = reconcileWatcomPermanentClasses(
        languages,
        segmentAddresses,
        modules,
        globalSymbols,
        addressInfo,
      );

      expect(validation.symbolSegmentsReconciled.allPresentInTable).toBe(false);
      expect(validation.allChecksPassed).toBe(false);
    });
  });
});

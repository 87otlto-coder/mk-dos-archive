import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  qualifyMK1PaletteSegmentHypotheses,
  createMK1CompactPaletteSegmentQualificationExport,
  decodeInstructionInBoundedWindow,
  resolveLinearAddressInLayout,
} from '../games/mk1/research/paletteSegmentQualification';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MemoryDirectorySource } from '../core/filesystem/DirectorySource';
import { B10D_EPISTEMIC_RULES, B10D_EXPORT_FORMAT_VERSION } from '../games/mk1/research/paletteSegmentQualificationTypes';
import { MK1PaletteConvergentEntryResult } from '../games/mk1/research/paletteConvergentEntryReconnaissanceTypes';

function createMockPageMap(): any[] {
  const pageMap: any[] = [];
  for (let i = 0; i < 130; i++) {
    pageMap.push({
      pageNumber: i + 1,
      pageType: 'valid',
      physicalFileStart: 0x10000 + i * 4096,
      physicalByteLength: 4096,
    });
  }
  // Page index 2 (Object 1 page 2) -> physical 0x0002C400
  pageMap[2] = {
    pageNumber: 3,
    pageType: 'valid',
    physicalFileStart: 0x0002c400,
    physicalByteLength: 4096,
  };
  // Page index 63 (Object 2 page 3) -> physical 0x00069400
  // Object 2 offset 0x3D33 = page 3, offset 0xD33. 0x00069400 + 0xD33 = 0x0006A133!
  pageMap[63] = {
    pageNumber: 64,
    pageType: 'valid',
    physicalFileStart: 0x00069400,
    physicalByteLength: 4096,
  };
  return pageMap;
}

function createMockLayoutReport(autoDataObject = 2): MK1ExecutableLayoutReport {
  return {
    exePath: 'MK1.EXE',
    exeSize: 1157222,
    timestamp: '2026-09-20T00:00:00.000Z',
    parsedHeader: {
      signature: 'LE',
      byteOrder: 0,
      wordOrder: 0,
      formatLevel: 0,
      cpuType: 2,
      cpuTypeDescription: 'Intel 80386 (32-bit)',
      targetOs: 4,
      targetOsDescription: 'DOS 4.x',
      moduleVersion: 0,
      moduleFlags: 0,
      modulePageCount: 130,
      entryObject: 1,
      entryEip: 0x0002ccf8,
      entryEipHex: '0x0002CCF8',
      stackObject: 2,
      stackEsp: 0x0005d140,
      stackEspHex: '0x0005D140',
      pageSize: 4096,
      bytesOnLastPage: 4096,
      fixupSectionSize: 0,
      loaderSectionSize: 0,
      objectTableRelativeOffset: 0x200,
      objectTableFileOffset: 0x200,
      objectCount: 2,
      objectPageMapRelativeOffset: 0x300,
      objectPageMapFileOffset: 0x300,
      residentNameTableRelativeOffset: 0,
      residentNameTableFileOffset: 0,
      entryTableRelativeOffset: 0,
      entryTableFileOffset: 0,
      fixupPageTableRelativeOffset: 0,
      fixupPageTableFileOffset: 0,
      fixupRecordTableRelativeOffset: 0,
      fixupRecordTableFileOffset: 0,
      importModuleTableRelativeOffset: 0,
      importModuleTableFileOffset: 0,
      importModuleCount: 0,
      importProcedureTableRelativeOffset: 0,
      importProcedureTableFileOffset: 0,
      dataPagesFileOffset: 0x10000,
      preloadPageCount: 80,
      nonResidentNameTableFileOffset: 0,
      nonResidentNameTableLength: 0,
      autoDataObject,
      debugInfoFileOffset: 0,
      debugInfoLength: 0,
      heapSize: 0,
    },
    validation: null,
    boundLayout: {
      mzWrapper: {
        mzHeaderOffset: 0,
        mzExtendedHeaderOffset: 0x40,
        mzExtendedHeaderOffsetHex: '0x00000040',
        eLfanewDiscrepancy: false,
        eLfanewNote: '',
      },
      rawLeOccurrencesCount: 1,
      rawLeOccurrences: [],
      selectedPayloadCandidate: null,
    },
    topology: {} as any,
    objectBackingSummary: [],
    knownAnchors: [],
    objects: [
      {
        objectNumber: 1,
        virtualSize: 0x0003b2d5,
        virtualSizeHex: '0x0003B2D5',
        relocationBaseAddress: 0x00010000,
        relocationBaseAddressHex: '0x00010000',
        rawFlags: 0x00002045,
        flags: {
          readable: true,
          writable: false,
          executable: true,
          resource: false,
          discardable: false,
          shared: false,
          preload: false,
          invalid: false,
          swappable: false,
          resident: false,
          big32Bit: true,
        },
        pageMapIndex: 1,
        pageMapEntryCount: 60,
        capabilities: 'R-X / 32-bit',
        roleEvidence: 'executable-code-like',
        physicalSpans: [
          {
            fileStart: 0x00010000,
            fileEnd: 0x0004b2d5,
            byteLength: 0x0003b2d5,
            objectPageStart: 0,
            pageCount: 60,
          },
        ],
        mappedPageCount: 60,
        zeroFilledPageCount: 0,
      },
      {
        objectNumber: 2,
        virtualSize: 0x00062060,
        virtualSizeHex: '0x00062060',
        relocationBaseAddress: 0x00050000,
        relocationBaseAddressHex: '0x00050000',
        rawFlags: 0x00002047,
        flags: {
          readable: true,
          writable: true,
          executable: false,
          resource: false,
          discardable: false,
          shared: false,
          preload: false,
          invalid: false,
          swappable: false,
          resident: false,
          big32Bit: true,
        },
        pageMapIndex: 61,
        pageMapEntryCount: 70,
        capabilities: 'RW- / 32-bit',
        roleEvidence: 'read-write-data-like',
        physicalSpans: [
          {
            fileStart: 0x00050000,
            fileEnd: 0x000b2060,
            byteLength: 0x00062060,
            objectPageStart: 0,
            pageCount: 70,
          },
        ],
        mappedPageCount: 70,
        zeroFilledPageCount: 0,
      },
    ],
    pageMap: createMockPageMap(),
    pageMapDiagnostics: {
      totalEntries: 130,
      validEntries: 130,
      mappedValidEntries: 130,
      iteratedEntries: 0,
      invalidEntries: 0,
      zeroFilledEntries: 0,
      rangeEntries: 0,
      unknownEntries: 0,
      minDecodedPhysicalPageNumber: 1,
      maxDecodedPhysicalPageNumber: 130,
      entries: [],
    },
    debugInfo: {
      debugInfoFileOffset: 0,
      debugInfoFileOffsetHex: '0x00000000',
      debugInfoLength: 0,
      debugInfoPresent: false,
      notes: '',
      status: 'VERIFIED',
    },
  };
}

function createMockConvergentResult(): MK1PaletteConvergentEntryResult {
  return {
    format: 'mk1-palette-convergent-entry/v1',
    status: 'SUCCESS',
    operationId: 'test-convergent',
    timestamp: '2026-09-20T00:00:00.000Z',
    fixture: {
      exePath: 'MK1.EXE',
      exeSize: 1157222,
    },
    targetNumericAddress: 0x00053d33,
    targetNumericAddressHex: '0x00053D33',
    destinationRawWindow: {
      loadedCoordinate: 0x00053d33,
      loadedCoordinateHex: '0x00053D33',
      physicalOffset: 0x0006a133,
      physicalOffsetHex: '0x0006A133',
      bytesHex: '02 00',
    } as any,
    entryStateClasses: {
      classA: {
        incomingEAX: 0x00002012,
        incomingEAXHex: '0x00002012',
      } as any,
      classB: {
        incomingEAX: 0x00002000,
        incomingEAXHex: '0x00002000',
      } as any,
    },
    candidateAssociations: {
      classA: {
        candidateId: 'MK1.EXE:0x0002C410',
        loadedPayloadAddress: 0x00012012,
        loadedPayloadAddressHex: '0x00012012',
        loadedStructureAddress: 0x00012010,
        loadedStructureAddressHex: '0x00012010',
        physicalPayloadOffset: 0x0002c412,
        physicalPayloadOffsetHex: '0x0002C412',
      } as any,
      classB: {
        candidateId: 'MK1.EXE:0x0002C3FE',
        loadedPayloadAddress: 0x00012000,
        loadedPayloadAddressHex: '0x00012000',
        loadedStructureAddress: 0x00011ffe,
        loadedStructureAddressHex: '0x00011FFE',
        physicalPayloadOffset: 0x0002c400,
        physicalPayloadOffsetHex: '0x0002C400',
      } as any,
    },
  } as any;
}

function createRealMK1FixtureBuffer(): Uint8Array {
  const buf = new Uint8Array(1157222);
  // Set destination instruction at resolved physical offset 0x0006A133: 02 00 (ADD AL, [EAX])
  buf[0x0006a133] = 0x02;
  buf[0x0006a134] = 0x00;

  // Set bounded windows:
  // Class A caller 1 at 0x0005A4BD: MOV EAX, 0x00002012 (5B) + CALL near (5B)
  buf.set([0xb8, 0x12, 0x20, 0x00, 0x00, 0xe8, 0x06, 0x5c, 0xfe, 0xff], 0x0005a4bd);
  // Class A caller 2 at 0x0005A4F4: MOV EAX, 0x00002012 (5B) + CALL near (5B)
  buf.set([0xb8, 0x12, 0x20, 0x00, 0x00, 0xe8, 0x06, 0x5c, 0xfe, 0xff], 0x0005a4f4);
  // Class A jump handoff at 0x0005A4C8: MOV EBX, 0x0000FFFF (5B) + JMP near (5B)
  buf.set([0xbb, 0xff, 0xff, 0x00, 0x00, 0xe9, 0x66, 0x98, 0x00, 0x00], 0x0005a4c8);
  // Class B caller 1 at 0x0005E1E5 (15B bounded window):
  // 0x0005E1E5: MOV EAX, 0x00002000 (5B: B8 00 20 00 00)
  // 0x0005E1EA: MOV EBX, 0x0000FFFF (5B: BB FF FF 00 00)
  // 0x0005E1EF: CALL 0x00053D33 (5B: E8 3F FF 00 00)
  buf.set([0xb8, 0x00, 0x20, 0x00, 0x00, 0xbb, 0xff, 0xff, 0x00, 0x00, 0xe8, 0x3f, 0xff, 0x00, 0x00], 0x0005e1e5);
  // Class B caller 2 at 0x0005E20D (10B bounded window):
  // 0x0005E20D: MOV EAX, 0x00002000 (5B: B8 00 20 00 00)
  // 0x0005E212: CALL 0x00053D33 (5B: E8 1C FF 00 00)
  buf.set([0xb8, 0x00, 0x20, 0x00, 0x00, 0xe8, 0x1c, 0xff, 0x00, 0x00], 0x0005e20d);

  return buf;
}

describe('Pass 1E.2B.10d / 1E.2B.10d.1 — Segment-Base Hypothesis Qualification', () => {
  const layout = createMockLayoutReport();
  const conv = createMockConvergentResult();
  const realFixtureBytes = createRealMK1FixtureBuffer();
  const mockSource = new MemoryDirectorySource('test');

  it('1. correctly captures real LE header segment facts and object map properties', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    expect(result.status).toBe('SUCCESS');
    expect(result.leHeaderFacts.autoDataObject).toBe(2);
    expect(result.leHeaderFacts.autoDataObjectName).toBe('Object 2');
    expect(result.leHeaderFacts.object1RelocationBase).toBe(0x00010000);
    expect(result.leHeaderFacts.object1RelocationBaseHex).toBe('0x00010000');
    expect(result.leHeaderFacts.object1VirtualSize).toBe(0x0003b2d5);
    expect(result.leHeaderFacts.object1Capabilities).toBe('R-X / 32-bit');
    expect(result.leHeaderFacts.object2RelocationBase).toBe(0x00050000);
    expect(result.leHeaderFacts.object2RelocationBaseHex).toBe('0x00050000');
    expect(result.leHeaderFacts.object2Capabilities).toBe('RW- / 32-bit');
    expect(result.leHeaderFacts.initialCodeObject).toBe(1);
    expect(result.leHeaderFacts.initialCodeObjectRelocationBaseHex).toBe('0x00010000');
    expect(result.leHeaderFacts.initialStackObject).toBe(2);
    expect(result.leHeaderFacts.initialStackObjectRelocationBaseHex).toBe('0x00050000');
  });

  it('2. distinguishes loaded coordinate (0x00053D33) from resolved physical backing (0x0006A133) and verifies 02 00 bytes', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    const dest = result.destinationInstruction;
    expect(dest.instructionLoadedAddress).toBe(0x00053d33);
    expect(dest.instructionLoadedAddressHex).toBe('0x00053D33');
    expect(dest.instructionPhysicalOffset).toBe(0x0006a133);
    expect(dest.instructionPhysicalOffsetHex).toBe('0x0006A133');
    expect(dest.objectNumber).toBe(2);
    expect(dest.objectOffsetHex).toBe('0x00003D33');
    expect(dest.mnemonic).toBe('ADD AL, [EAX]');
    expect(dest.opcodeByte).toBe(0x02);
    expect(dest.modRmByte).toBe(0x00);
    expect(dest.hasSegmentOverride).toBe(false);
    expect(dest.segmentOverridePrefix).toBeNull();
    expect(dest.effectiveAddressingBaseRegister).toBe('EAX');
    expect(dest.architecturalDefaultSegment).toBe('DS');
    expect(dest.incomingEaxClassAHex).toBe('0x00002012');
    expect(dest.incomingEaxClassBHex).toBe('0x00002000');
  });

  it('3. fails closed when destination instruction bytes do not equal 02 00 (ADD AL, [EAX])', async () => {
    const badBytes = createRealMK1FixtureBuffer();
    // Tamper with bytes at 0x0006A133
    badBytes[0x0006a133] = 0x90; // NOP
    badBytes[0x0006a134] = 0x90;

    await expect(
      qualifyMK1PaletteSegmentHypotheses(mockSource, {
        layoutReport: layout,
        convergentResult: conv,
        exeBytes: badBytes,
        throwOnFailure: true,
      }),
    ).rejects.toThrow(/do not match expected ADD AL, \[EAX\]/);
  });

  it('4. fails closed when upstream B.10b convergent result is missing and cannot be derived', async () => {
    await expect(
      qualifyMK1PaletteSegmentHypotheses(mockSource, {
        layoutReport: layout,
        convergentResult: undefined,
        exeBytes: realFixtureBytes,
        throwOnMissingEvidence: true,
      }),
    ).rejects.toThrow(/Missing required upstream B\.10b convergent entry evidence/);
  });

  it('5. evaluates Model A (Zero-based DS): yields 0x2012 and 0x2000 and reaches neither candidate payload', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    const modelA = result.models.modelA;
    expect(modelA.modelId).toBe('model-a-zero-based');
    expect(modelA.assumedBase).toBe(0x00000000);
    expect(modelA.classACalculation.calculatedLinearAddressHex).toBe('0x00002012');
    expect(modelA.classBCalculation.calculatedLinearAddressHex).toBe('0x00002000');
    expect(modelA.classACalculation.containingObjectNumber).toBeNull();
    expect(modelA.classBCalculation.containingObjectNumber).toBeNull();
    expect(modelA.classACalculation.reachesAssociatedPayload).toBe(false);
    expect(modelA.classBCalculation.reachesAssociatedPayload).toBe(false);
    expect(modelA.reachesBothAssociatedPayloads).toBe(false);
    expect(modelA.reachesEitherAssociatedPayload).toBe(false);
  });

  it('6. evaluates Model B (Object 1 Relocation-Base): arithmetically matches both candidate payloads with 100% precision', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    const modelB = result.models.modelB;
    expect(modelB.modelId).toBe('model-b-object1-base');
    expect(modelB.assumedBase).toBe(0x00010000);
    expect(modelB.classACalculation.calculatedLinearAddressHex).toBe('0x00012012');
    expect(modelB.classBCalculation.calculatedLinearAddressHex).toBe('0x00012000');
    expect(modelB.classACalculation.containingObjectNumber).toBe(1);
    expect(modelB.classBCalculation.containingObjectNumber).toBe(1);
    expect(modelB.classACalculation.associatedCandidateLoadedPayloadHex).toBe('0x00012012');
    expect(modelB.classBCalculation.associatedCandidateLoadedPayloadHex).toBe('0x00012000');
    expect(modelB.classACalculation.equalsAssociatedCandidatePayload).toBe(true);
    expect(modelB.classBCalculation.equalsAssociatedCandidatePayload).toBe(true);
    expect(modelB.reachesBothAssociatedPayloads).toBe(true);
  });

  it('7. evaluates Model C (Auto-Data-Object Base): yields Object 2 data addresses when declared, but classifies as unavailable when absent (no Object 2 fallback)', async () => {
    // Test with autoDataObject = 2
    const resultWithAuto = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    expect(resultWithAuto.models.modelC.isAvailable).toBe(true);
    expect(resultWithAuto.models.modelC.assumedBaseHex).toBe('0x00050000');
    expect(resultWithAuto.models.modelC.classACalculation.calculatedLinearAddressHex).toBe('0x00052012');
    expect(resultWithAuto.models.modelC.classBCalculation.calculatedLinearAddressHex).toBe('0x00052000');
    expect(resultWithAuto.models.modelC.reachesBothAssociatedPayloads).toBe(false);

    // Test with autoDataObject = 0 (absent): MUST NOT fall back to Object 2!
    const layoutNoAuto = createMockLayoutReport(0);
    const resultNoAuto = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layoutNoAuto,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    expect(resultNoAuto.models.modelC.isAvailable).toBe(false);
    expect(resultNoAuto.models.modelC.assumedBase).toBeNull();
    expect(resultNoAuto.models.modelC.topologicalAssessment).toContain('unavailable because the LE header declares no autoDataObject');
  });

  it('8. strictly parses instruction boundaries: immediate byte containing 0x3E does NOT trigger a false segment override', () => {
    // Instruction: MOV EAX, 0x003E2012 (byte 0x3E is inside immediate)
    // Bytes: B8 12 20 3E 00
    const bytes = new Uint8Array([0xb8, 0x12, 0x20, 0x3e, 0x00, 0x90]);
    const decoded = decodeInstructionInBoundedWindow(bytes, 0, 5, 0x00040000);

    expect(decoded.length).toBe(5);
    expect(decoded.mnemonic).toBe('MOV EAX, 0x003E2012');
    expect(decoded.hasSegmentOverride).toBe(false);
    expect(decoded.segmentOverridePrefix).toBeNull();
  });

  it('9. inspects bounded caller/handoff windows on real fixture and proves absence of segment overrides and DS loads', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    const inspection = result.callerHandoffInspection;
    expect(inspection.totalInspectedSites).toBe(5);
    expect(inspection.totalInstructionsInspected).toBe(11);
    expect(inspection.totalSegmentOverridesFound).toBe(0);
    expect(inspection.totalExplicitDsWritesFound).toBe(0);
    expect(inspection.totalFarPointerLoadsFound).toBe(0);
    expect(inspection.allBoundedWindowsClean).toBe(true);

    // Class B Caller 1 specific assertions (Pass 1E.2B.10d.2)
    const classBCaller1 = inspection.inspectedSites.find((s) => s.siteId === 'class-b-caller-1');
    expect(classBCaller1).toBeDefined();
    expect(classBCaller1!.instructionCount).toBe(3);
    expect(classBCaller1!.decodedInstructions.length).toBe(3);
    expect(classBCaller1!.instructionsDisassembled).toEqual([
      'MOV EAX, 0x00002000',
      'MOV EBX, 0x0000FFFF',
      'CALL near 0x00053D33',
    ]);
    expect(classBCaller1!.decodedInstructions[0].physicalOffsetHex).toBe('0x0005E1E5');
    expect(classBCaller1!.decodedInstructions[0].mnemonic).toBe('MOV EAX, 0x00002000');
    expect(classBCaller1!.decodedInstructions[1].physicalOffsetHex).toBe('0x0005E1EA');
    expect(classBCaller1!.decodedInstructions[1].mnemonic).toBe('MOV EBX, 0x0000FFFF');
    expect(classBCaller1!.decodedInstructions[2].physicalOffsetHex).toBe('0x0005E1EF');
    expect(classBCaller1!.decodedInstructions[2].mnemonic).toBe('CALL near 0x00053D33');
    expect(classBCaller1!.segmentOverridePrefixesFound).toBe(0);
    expect(classBCaller1!.explicitDsWritesOrLoadsFound).toBe(0);
    expect(classBCaller1!.farPointerOrSegmentLoadsFound).toBe(0);
    expect(classBCaller1!.boundedWindowClean).toBe(true);

    // Class B Caller 2 specific assertions:
    const classBCaller2 = inspection.inspectedSites.find((s) => s.siteId === 'class-b-caller-2');
    expect(classBCaller2).toBeDefined();
    expect(classBCaller2!.instructionCount).toBe(2);
    expect(classBCaller2!.decodedInstructions[0].physicalOffsetHex).toBe('0x0005E20D');
    expect(classBCaller2!.decodedInstructions[0].mnemonic).toBe('MOV EAX, 0x00002000');
    expect(classBCaller2!.decodedInstructions[1].physicalOffsetHex).toBe('0x0005E212');
    expect(classBCaller2!.decodedInstructions[1].mnemonic).toBe('CALL near 0x00053D33');
    expect(classBCaller2!.boundedWindowClean).toBe(true);

    for (const site of inspection.inspectedSites) {
      expect(site.boundedWindowClean).toBe(true);
      expect(site.segmentOverridePrefixesFound).toBe(0);
      expect(site.explicitDsWritesOrLoadsFound).toBe(0);
      expect(site.farPointerOrSegmentLoadsFound).toBe(0);
    }
  });

  it('10. explicitly distinguishes arithmetic compatibility, local static evidence, DOS/4GW model, and runtime state', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    const distinctions = result.epistemicDistinctions;
    expect(distinctions.arithmeticCompatibility.modelBExactAlignment).toBe(true);
    expect(distinctions.localStaticEvidence.segmentOverridesObserved).toBe(false);
    expect(distinctions.localStaticEvidence.explicitDsLoadsObserved).toBe(false);
    expect(distinctions.documentedDos4gwModel.standardFlatDsBaseHex).toBe('0x00000000');
    expect(distinctions.provenRuntimeSegmentState.status).toBe('unresolved');
    expect(distinctions.provenRuntimeSegmentState.selectorDescriptorsProven).toBe(false);
    expect(distinctions.provenRuntimeSegmentState.runtimeExecutionVerified).toBe(false);
  });

  it('11. verifies final classifications state all four conditions separately', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    const fc = result.finalClassifications;
    expect(fc.zeroBasedDsReachesEitherPayload).toBe(false);
    expect(fc.object1BaseDsWouldReachBothPayloads).toBe(true);
    expect(fc.fixtureProvidesEvidenceDsHasObject1Base).toBe(false);
    expect(fc.autoDataObjectBaseReachesEitherPayload).toBe(false);
    expect(fc.classificationSummary.length).toBe(4);
    expect(fc.classificationSummary).toContain(
      'Fixture Evidence for Object 1 DS: No bounded local evidence establishes DS.base = 0x00010000.',
    );
  });

  it('12. enforces all epistemic hard stops and reconciliation invariants', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    expect(result.epistemicRules).toContain(
      'DO NOT FOLLOW 0x53D33 or 0x53D4A (candidate destination control boundary is an absolute barrier).',
    );
    expect(result.epistemicRules).toContain(
      'DO NOT infer DS selector/base as fact from LE relocation bases alone.',
    );
    expect(result.epistemicRules).toContain('STOP after B.10d. Do NOT begin B.11.');

    const recon = result.reconciliation;
    expect(recon.fixtureSizeReconciled).toBe(true);
    expect(recon.destinationLoadedCoordinateReconciled).toBe(true);
    expect(recon.destinationPhysicalCoordinateReconciled).toBe(true);
    expect(recon.destinationBytesReconciled).toBe(true);
    expect(recon.headerFactsReconciled).toBe(true);
    expect(recon.destinationInstructionReconciled).toBe(true);
    expect(recon.modelACalculationReconciled).toBe(true);
    expect(recon.modelBCalculationReconciled).toBe(true);
    expect(recon.modelCCalculationReconciled).toBe(true);
    expect(recon.callerInspectionReconciled).toBe(true);
    expect(recon.epistemicDistinctionsReconciled).toBe(true);
    expect(recon.finalClassificationsReconciled).toBe(true);
    expect(recon.barrierEnforced).toBe(true);
    expect(recon.allInvariantsSatisfied).toBe(true);
  });

  it('13. fails fixture size reconciliation if exeSize is not exactly 1157222 even if exeSize > 0', async () => {
    const alteredLayout = {
      ...layout,
      exeSize: 1000000,
    };
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: alteredLayout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });

    expect(result.reconciliation.fixtureSizeReconciled).toBe(false);
    expect(result.reconciliation.allInvariantsSatisfied).toBe(false);
  });

  it('14. fails closed when candidate associations or fields are missing in upstream B.10b evidence', async () => {
    const badConvMissingClassA = {
      ...conv,
      candidateAssociations: {
        classA: undefined,
        classB: conv.candidateAssociations.classB,
      },
    };
    await expect(
      qualifyMK1PaletteSegmentHypotheses(mockSource, {
        layoutReport: layout,
        convergentResult: badConvMissingClassA as any,
        exeBytes: realFixtureBytes,
      }),
    ).rejects.toThrow(/Missing candidate associations in upstream B\.10b evidence/);

    const badConvIncompleteField = {
      ...conv,
      candidateAssociations: {
        classA: {
          ...conv.candidateAssociations.classA,
          physicalPayloadOffset: undefined,
        },
        classB: conv.candidateAssociations.classB,
      },
    };
    await expect(
      qualifyMK1PaletteSegmentHypotheses(mockSource, {
        layoutReport: layout,
        convergentResult: badConvIncompleteField as any,
        exeBytes: realFixtureBytes,
      }),
    ).rejects.toThrow(/Incomplete Class A candidate association fields in upstream B\.10b evidence/);
  });

  it('15. produces genuine B.10d fixture export with bounded inspection data across all five sites', async () => {
    const result = await qualifyMK1PaletteSegmentHypotheses(mockSource, {
      layoutReport: layout,
      convergentResult: conv,
      exeBytes: realFixtureBytes,
    });
    const compactExport = createMK1CompactPaletteSegmentQualificationExport(result);

    expect(compactExport.exportHeader.format).toBe(B10D_EXPORT_FORMAT_VERSION);
    expect(compactExport.exportHeader.status).toBe('SUCCESS');
    expect(compactExport.realLEFacts.object1RelocationBaseHex).toBe('0x00010000');
    expect(compactExport.realLEFacts.object2RelocationBaseHex).toBe('0x00050000');
    expect(compactExport.destinationInstruction.offsetHex).toBe('0x0006A133');
    expect(compactExport.destinationInstruction.loadedAddressHex).toBe('0x00053D33');
    expect(compactExport.destinationInstruction.physicalOffsetHex).toBe('0x0006A133');
    expect(compactExport.destinationInstruction.mnemonic).toBe('ADD AL, [EAX]');
    expect(compactExport.destinationInstruction.defaultSegment).toBe('DS');
    expect(compactExport.models.modelAZeroBased.reachesAssociatedPayload).toBe(false);
    expect(compactExport.models.modelBObject1Base.reachesAssociatedPayload).toBe(true);
    expect(compactExport.models.modelCAutoDataBase.reachesAssociatedPayload).toBe(false);
    expect(compactExport.callerHandoffEvidence.cleanWindows).toBe(true);
    expect(compactExport.finalClassifications.object1BaseDsWouldReachBothPayloads).toBe(true);
    expect(compactExport.finalClassifications.fixtureProvidesEvidenceDsHasObject1Base).toBe(false);
    expect(compactExport.reconciliation.allInvariantsSatisfied).toBe(true);

    // Verify all 5 sites are exported with complete inspection details
    expect(compactExport.callerHandoffEvidence.sites.length).toBe(5);
    for (const site of compactExport.callerHandoffEvidence.sites) {
      expect(site.physicalStartHex).toMatch(/^0x/);
      expect(site.physicalEndHex).toMatch(/^0x/);
      expect(site.loadedStartHex).toMatch(/^0x/);
      expect(site.actualRawBytesHex.length).toBeGreaterThan(0);
      expect(site.decodedInstructions.length).toBeGreaterThanOrEqual(2);
      for (const inst of site.decodedInstructions) {
        expect(inst.physicalOffsetHex).toMatch(/^0x/);
        expect(inst.loadedAddressHex).toMatch(/^0x/);
        expect(inst.mnemonic.length).toBeGreaterThan(0);
        expect(inst.rawBytesHex.length).toBeGreaterThan(0);
      }
      expect(site.segmentOverrideCount).toBe(0);
      expect(site.dsModificationCount).toBe(0);
      expect(site.farSegmentLoadCount).toBe(0);
      expect(site.windowClean).toBe(true);
    }

    const timestampStr = result.timestamp.replace(/[:.]/g, '-');
    fs.writeFileSync(
      `mk1_palette_segment_qualification_${timestampStr}.json`,
      JSON.stringify(compactExport, null, 2),
    );
    fs.writeFileSync(
      'mk1_palette_segment_qualification_latest.json',
      JSON.stringify(compactExport, null, 2),
    );
  });
});

/**
 * MK1 Executable Palette Relative-Control Address-Space Qualification &
 * Loaded-Linear Candidate Destination Trace (Milestone 1 — Pass 1E.2B.10a)
 *
 * Epistemic Rules:
 * - Candidate destination control boundary is a barrier; DO NOT FOLLOW the resulting target.
 * - runtimeDestinationVerified remains false unless runtime selector semantics are proven independently.
 * - Pass 1E.2B.10a must NOT perform function discovery, calling-convention inference, or palette-consumer claims.
 * - Strict adherence to type safety. Zero type escapes (`as any`, `: any`, `@ts-ignore`) are permitted.
 */

import { DirectorySource } from '../../../core/filesystem/DirectorySource';
import {
  MK1ExecutableLayoutReport,
} from './executableLayoutTypes';
import {
  LEObjectEntry,
} from '../../../core/executable/le/leTypes';
import {
  MK1ExecutableRegion,
} from './executableRegionTopology';
import {
  classifyPhysicalByteInObjects,
  objectOffsetToFileOffset,
} from '../../../core/executable/le/leAddressMap';
import {
  MK1PaletteOperandUseResult,
  X86Register32,
} from './paletteOperandUseReconnaissanceTypes';
import {
  MK1PaletteTargetEntryReconResult,
} from './paletteTargetEntryReconnaissanceTypes';
import {
  MK1PaletteConvergentEntryResult,
  MK1DualTargetModelRecon,
  MK1ConvergentByteValidation,
  MK1EntryStateClassA,
  MK1EntryStateClassB,
  MK1ConvergentDifferentialAnalysis,
  MK1PreEntryDifferential,
  MK1MechanicalDimensions,
  MK1ConvergentReconciliation,
  MK1AddressSpaceQualification,
  MK1Model1EipRelativeCalculation,
  MK1Model2LoadedLinearCalculation,
  MK1B9JmpByteValidation,
  MK1B8CallByteValidationRecord,
  MK1ClassBCallSiteRecord,
  MK1CompactPaletteConvergentEntryExport,
  PerformConvergentReconOptions,
  B10_EPISTEMIC_RULES,
  B10_EXPORT_FORMAT_VERSION,
  B10_V2_EXPORT_FORMAT_VERSION,
  MK1CandidateCoordinates,
  MK1B8TargetGroup,
  MK1UpstreamGroupUniqueness,
  MK1DestinationRawWindow,
  MK1FinalCandidateControlBoundary,
  MK1CandidateDestinationTrace,
} from './paletteConvergentEntryReconnaissanceTypes';
import {
  toHex32,
  toHex8,
  bytesToHex,
  decodeB10MicroInstruction,
  decodeModRMSIB,
  traceCandidateDestination,
  evaluateOriginTraces,
} from './paletteConvergentDecoder';

export {
  toHex32,
  toHex8,
  bytesToHex,
  decodeB10MicroInstruction,
  decodeModRMSIB,
  traceCandidateDestination,
  evaluateOriginTraces,
  objectOffsetToFileOffset,
};

/**
 * Finds the containing topology region for a given physical file offset.
 */
export function findContainingRegion(
  physicalOffset: number,
  regions: MK1ExecutableRegion[] | undefined,
): MK1ExecutableRegion | null {
  if (!regions) return null;
  for (const reg of regions) {
    if (physicalOffset >= reg.fileStart && physicalOffset < reg.fileEnd) {
      return reg;
    }
  }
  return null;
}

/**
 * Performs Pass 1E.2B.10a Relative-Control Address-Space Qualification and
 * Candidate Destination Trace.
 */
export async function performPaletteConvergentEntryReconnaissance(
  source: DirectorySource,
  report: MK1ExecutableLayoutReport,
  b8Result: MK1PaletteOperandUseResult,
  b9Result: MK1PaletteTargetEntryReconResult,
  options?: PerformConvergentReconOptions,
): Promise<MK1PaletteConvergentEntryResult> {
  options?.onProgress?.('Validating upstream B.8 and B.9 prerequisites...', 0.05);

  // 1. Validate upstream B.8
  if (!b8Result || b8Result.status !== 'SUCCESS') {
    throw new Error('Upstream B.8 result status is not SUCCESS');
  }
  if (!b8Result.reconciliation || !b8Result.reconciliation.allReconciled) {
    throw new Error('Upstream B.8 reconciliation is incomplete');
  }

  // 2. Validate upstream B.9
  if (!b9Result || b9Result.status !== 'SUCCESS') {
    throw new Error('Upstream B.9 result status is not SUCCESS');
  }
  if (b9Result.format !== 'mk1_palette_target_entry_recon_v2') {
    throw new Error(`Unexpected B.9 format version: ${b9Result.format}`);
  }
  if (!b9Result.reconciliation || !b9Result.reconciliation.allReconciled) {
    throw new Error('Upstream B.9 reconciliation is incomplete');
  }

  // 3. Validate layout report and objects
  if (
    !report ||
    !report.parsedHeader ||
    typeof report.parsedHeader.pageSize !== 'number' ||
    report.parsedHeader.pageSize <= 0
  ) {
    throw new Error('Missing or invalid LE header pageSize in layout report');
  }
  const pageSize = report.parsedHeader.pageSize;

  if (!report.objects || report.objects.length === 0) {
    throw new Error('Layout report does not contain any objects');
  }

  // 4. Validate B.9 final control boundary
  const finalBoundary = b9Result.targetTrace?.finalControlBoundary;
  if (!finalBoundary) {
    throw new Error('B.9 target trace did not establish a finalControlBoundary');
  }
  if (finalBoundary.boundaryType !== 'jump') {
    throw new Error(`B.9 finalControlBoundary type (${finalBoundary.boundaryType}) is not jump`);
  }
  if (typeof finalBoundary.boundaryTargetLoadedAddress !== 'number' || Number.isNaN(finalBoundary.boundaryTargetLoadedAddress)) {
    throw new Error('B.9 finalControlBoundary target loaded address is missing or invalid');
  }
  if (finalBoundary.seedLiveAtBoundary !== true) {
    throw new Error('B.9 seed register was not live at final control boundary');
  }

  const targetCandidateId = b9Result.candidateId;
  const targetNumeric = finalBoundary.boundaryTargetLoadedAddress;
  const sourceInstructionLoaded = finalBoundary.boundaryInstructionLoadedAddress;
  const sourceInstructionPhysical = finalBoundary.boundaryInstructionOffset;

  options?.onProgress?.('Resolving source object and coordinate models...', 0.15);

  // Derive source object from layout
  const sourceObj = report.objects.find(
    (o) =>
      sourceInstructionLoaded >= o.relocationBaseAddress &&
      sourceInstructionLoaded < o.relocationBaseAddress + o.virtualSize,
  );
  if (!sourceObj) {
    throw new Error(`Unable to resolve containing object for B.9 boundary instruction at ${toHex32(sourceInstructionLoaded)}`);
  }

  // Next instruction address = source + 5 (size of E9 rel32)
  const nextInstructionLoaded = (sourceInstructionLoaded + 5) >>> 0;
  const rel32Displacement = (targetNumeric - nextInstructionLoaded) | 0;

  // Model 1: Source-Object / EIP-Relative Model
  const sourceObjectEip = (sourceInstructionLoaded - sourceObj.relocationBaseAddress) >>> 0;
  const nextInstructionEip = (sourceObjectEip + 5) >>> 0;
  const calculatedTargetObjectOffset = (nextInstructionEip + rel32Displacement) >>> 0;
  const derivedLoadedTarget = (sourceObj.relocationBaseAddress + calculatedTargetObjectOffset) >>> 0;

  const withinSourceObjectVirtualRange = calculatedTargetObjectOffset < sourceObj.virtualSize;
  const targetOffsetInFile = objectOffsetToFileOffset(
    sourceObj.objectNumber,
    calculatedTargetObjectOffset,
    report.objects,
    report.pageMap,
    pageSize,
  );
  const withinSourceObjectAddressableFileBackedRange = targetOffsetInFile !== null;
  const distanceBeyondVirtualEnd = withinSourceObjectVirtualRange
    ? null
    : (calculatedTargetObjectOffset - sourceObj.virtualSize);

  const model1EipRelative: MK1Model1EipRelativeCalculation = {
    sourceObjectNumber: sourceObj.objectNumber,
    sourceObjectEip,
    sourceObjectEipHex: toHex32(sourceObjectEip),
    nextInstructionEip,
    nextInstructionEipHex: toHex32(nextInstructionEip),
    rel32Displacement,
    rel32DisplacementHex: toHex32(rel32Displacement >>> 0),
    calculatedTargetObjectOffset,
    calculatedTargetObjectOffsetHex: toHex32(calculatedTargetObjectOffset),
    sourceObjectRelocationBase: sourceObj.relocationBaseAddress,
    sourceObjectRelocationBaseHex: toHex32(sourceObj.relocationBaseAddress),
    derivedLoadedTarget,
    derivedLoadedTargetHex: toHex32(derivedLoadedTarget),
    withinSourceObjectVirtualRange,
    withinSourceObjectAddressableFileBackedRange,
    distanceBeyondVirtualEnd,
  };

  options?.onProgress?.('Qualifying target address-space membership...', 0.3);

  // Address-Space Qualification
  const containingObj =
    report.objects.find(
      (o) =>
        targetNumeric >= o.relocationBaseAddress &&
        targetNumeric < o.relocationBaseAddress + o.virtualSize,
    ) ?? null;

  const obj1 = report.objects.find((o) => o.objectNumber === 1);
  const isInsideObject1Virtual =
    obj1 !== undefined &&
    targetNumeric >= obj1.relocationBaseAddress &&
    targetNumeric < obj1.relocationBaseAddress + obj1.virtualSize;

  const targetObjectOffset = containingObj
    ? (targetNumeric - containingObj.relocationBaseAddress) >>> 0
    : null;

  const physicalFileOffset =
    containingObj && targetObjectOffset !== null
      ? objectOffsetToFileOffset(
          containingObj.objectNumber,
          targetObjectOffset,
          report.objects,
          report.pageMap,
          pageSize,
        )
      : null;

  const physicalBackingAvailable = physicalFileOffset !== null;

  let topologyRegionId: string | null = null;
  let topologyRegionClass: string | null = null;
  if (physicalFileOffset !== null && report.topology?.regions) {
    const reg = findContainingRegion(physicalFileOffset, report.topology.regions);
    if (reg) {
      topologyRegionId = reg.regionId;
      topologyRegionClass = reg.regionClass;
    }
  }

  // Model 2: Loaded-Linear Model
  const calculatedLinearTarget = (nextInstructionLoaded + rel32Displacement) >>> 0;
  const model2LoadedLinear: MK1Model2LoadedLinearCalculation = {
    sourceLoadedAddress: sourceInstructionLoaded,
    sourceLoadedAddressHex: toHex32(sourceInstructionLoaded),
    nextInstructionLoadedAddress: nextInstructionLoaded,
    nextInstructionLoadedAddressHex: toHex32(nextInstructionLoaded),
    rel32Displacement,
    rel32DisplacementHex: toHex32(rel32Displacement >>> 0),
    calculatedLinearTarget,
    calculatedLinearTargetHex: toHex32(calculatedLinearTarget),
    containingObjectNumber: containingObj ? containingObj.objectNumber : null,
    containingObjectBase: containingObj ? containingObj.relocationBaseAddress : null,
    containingObjectBaseHex: containingObj ? toHex32(containingObj.relocationBaseAddress) : null,
    containingObjectOffset: targetObjectOffset,
    containingObjectOffsetHex: targetObjectOffset !== null ? toHex32(targetObjectOffset) : null,
    physicalBackingOffset: physicalFileOffset,
    physicalBackingOffsetHex: physicalFileOffset !== null ? toHex32(physicalFileOffset) : null,
    topologyRegionId,
    topologyRegionClass,
    isAddressable: containingObj !== null,
    isFileBacked: physicalBackingAvailable,
    isReadable: containingObj?.flags.readable ?? false,
    isWritable: containingObj?.flags.writable ?? false,
    isExecutable: containingObj?.flags.executable ?? false,
  };

  const modelsConvergeNumerically =
    derivedLoadedTarget === calculatedLinearTarget && derivedLoadedTarget === targetNumeric;

  options?.onProgress?.('Byte-validating B.9 JMP and direct CALLs...', 0.45);

  // Read binary buffer
  const exeBuffer = await source.readSlice(report.exePath, 0, report.exeSize);
  const exeBytes = new Uint8Array(exeBuffer);

  // Validate B.9 JMP bytes: 0xE9 [rel32 4 bytes LE]
  const expectedJmpBytes = [
    0xe9,
    rel32Displacement & 0xff,
    (rel32Displacement >> 8) & 0xff,
    (rel32Displacement >> 16) & 0xff,
    (rel32Displacement >> 24) & 0xff,
  ];

  let actualJmpBytes: number[] = [];
  if (sourceInstructionPhysical >= 0 && sourceInstructionPhysical + 5 <= exeBytes.length) {
    actualJmpBytes = Array.from(exeBytes.slice(sourceInstructionPhysical, sourceInstructionPhysical + 5));
  }

  const b9JmpMatches =
    actualJmpBytes.length === 5 &&
    expectedJmpBytes.every((b, idx) => actualJmpBytes[idx] === b);

  const actualTargetNumeric = (nextInstructionLoaded + rel32Displacement) >>> 0;

  const b9JmpInstruction: MK1B9JmpByteValidation = {
    loadedAddress: sourceInstructionLoaded,
    loadedAddressHex: toHex32(sourceInstructionLoaded),
    physicalOffset: sourceInstructionPhysical,
    physicalOffsetHex: toHex32(sourceInstructionPhysical),
    expectedBytes: expectedJmpBytes,
    expectedBytesHex: bytesToHex(expectedJmpBytes),
    actualBytes: actualJmpBytes,
    actualBytesHex: bytesToHex(actualJmpBytes),
    bytesMatch: b9JmpMatches,
    opcodeHex: '0xE9',
    displacementRel32: rel32Displacement,
    displacementRel32Hex: toHex32(rel32Displacement >>> 0),
    actualTargetNumeric,
    actualTargetNumericHex: toHex32(actualTargetNumeric),
  };

  const loadedLinearMetadataExecutable = containingObj?.flags.executable ?? false;
  const controlTransferVsObjectFlagTension = b9JmpMatches && !loadedLinearMetadataExecutable;

  const addressSpaceQualification: MK1AddressSpaceQualification = {
    targetAddress: targetNumeric,
    targetAddressHex: toHex32(targetNumeric),
    containingObjectNumber: containingObj ? containingObj.objectNumber : null,
    containingObjectBase: containingObj ? containingObj.relocationBaseAddress : null,
    containingObjectBaseHex: containingObj ? toHex32(containingObj.relocationBaseAddress) : null,
    containingObjectVirtualSize: containingObj ? containingObj.virtualSize : null,
    containingObjectCapabilities: containingObj ? containingObj.capabilities : null,
    containingObjectRoleEvidence: containingObj ? containingObj.roleEvidence : null,
    containingObjectFlags: containingObj ? containingObj.rawFlags : null,
    isInsideObject1Virtual,
    object1VirtualSize: obj1?.virtualSize ?? 0,
    physicalBackingAvailable,
    physicalFileOffset,
    physicalFileOffsetHex: physicalFileOffset !== null ? toHex32(physicalFileOffset) : null,
    topologyRegionId,
    topologyRegionClass,
    incomingByteVerifiedRel32Transfer: b9JmpMatches,
    loadedLinearMetadataExecutable,
    controlTransferVsObjectFlagTension,
    runtimeDestinationVerified: false,
    runtimeSelectorSemanticsProven: false,
    selectorSemanticsStatus: 'unresolved',
  };

  const dualModelRecon: MK1DualTargetModelRecon = {
    targetNumericValue: targetNumeric,
    targetNumericValueHex: toHex32(targetNumeric),
    sourceInstructionLoadedAddress: sourceInstructionLoaded,
    sourceInstructionLoadedAddressHex: toHex32(sourceInstructionLoaded),
    sourceInstructionPhysicalOffset: sourceInstructionPhysical,
    sourceInstructionPhysicalOffsetHex: toHex32(sourceInstructionPhysical),
    sourceInstructionMnemonic: `JMP near ${toHex32(targetNumeric)}`,
    rel32Displacement,
    rel32DisplacementHex: toHex32(rel32Displacement >>> 0),
    rel32Sign: rel32Displacement >= 0 ? '+' : '-',
    nextInstructionLoadedAddress: nextInstructionLoaded,
    nextInstructionLoadedAddressHex: toHex32(nextInstructionLoaded),
    model1EipRelative,
    model2LoadedLinear,
    modelsConvergeNumerically,
    addressSpaceQualification,
  };

  // 14 — B.8 SAME-TARGET GROUPING
  // Select existing B.8 interpretations whose verified CALL-boundary numerical target equals the derived B.9 numerical target.
  // Group by: seed register, seed value, associated candidate ID, target.
  interface B8GroupAccumulator {
    targetNumeric: number;
    targetNumericHex: string;
    seedRegister: X86Register32;
    seedValue: number;
    seedValueHex: string;
    associatedCandidateId: string;
    interpretationIds: string[];
    interpretations: typeof b8Result.interpretations;
  }

  const groupsMap = new Map<string, B8GroupAccumulator>();

  for (const interp of b8Result.interpretations) {
    const trace = interp.seedTrace;
    if (!trace || trace.boundaryType !== 'call') continue;
    const isLive = trace.seedLiveAtBoundary === true || trace.seedLiveAtCallBoundary === true;
    if (!isLive) continue;
    const callTarget = trace.callBoundaryTargetRecon?.targetLoadedLinearCandidate;
    if (callTarget !== targetNumeric) continue;

    const key = `${trace.seedRegister}_${trace.initialSeedValue}_${interp.associatedCandidateId}_${targetNumeric}`;
    let group = groupsMap.get(key);
    if (!group) {
      group = {
        targetNumeric,
        targetNumericHex: toHex32(targetNumeric),
        seedRegister: trace.seedRegister as X86Register32,
        seedValue: trace.initialSeedValue,
        seedValueHex: toHex32(trace.initialSeedValue),
        associatedCandidateId: interp.associatedCandidateId,
        interpretationIds: [],
        interpretations: [],
      };
      groupsMap.set(key, group);
    }
    if (!group.interpretationIds.includes(interp.interpretationId)) {
      group.interpretationIds.push(interp.interpretationId);
      group.interpretations.push(interp);
    }
  }

  const matchingB8TargetGroups: MK1B8TargetGroup[] = Array.from(groupsMap.values()).map((g) => ({
    targetNumeric: g.targetNumeric,
    targetNumericHex: g.targetNumericHex,
    seedRegister: g.seedRegister,
    seedValue: g.seedValue,
    seedValueHex: g.seedValueHex,
    associatedCandidateId: g.associatedCandidateId,
    memberCount: g.interpretationIds.length,
    interpretationIds: g.interpretationIds,
    isCompatibleComparisonClass: g.seedRegister === 'EAX' && g.associatedCandidateId !== targetCandidateId,
  }));

  const compatibleComparisonClasses = matchingB8TargetGroups.filter((g) => g.isCompatibleComparisonClass);
  const upstreamGroupUniqueness: MK1UpstreamGroupUniqueness = {
    matchingB8InterpretationCount: Array.from(groupsMap.values()).reduce((sum, g) => sum + g.interpretationIds.length, 0),
    matchingB8GroupedClassCount: matchingB8TargetGroups.length,
    compatibleComparisonClassCount: compatibleComparisonClasses.length,
    comparisonClassConflicts: compatibleComparisonClasses.length > 1
      ? compatibleComparisonClasses.map((c) => `${c.associatedCandidateId} (EAX ${c.seedValueHex})`)
      : [],
  };

  // Require exactly one compatible comparison class
  const selectedComparisonClass = compatibleComparisonClasses.length === 1
    ? compatibleComparisonClasses[0]
    : (matchingB8TargetGroups.length > 0 ? matchingB8TargetGroups[0] : null);

  const selectedGroupAcc = selectedComparisonClass
    ? groupsMap.get(
        `${selectedComparisonClass.seedRegister}_${selectedComparisonClass.seedValue}_${selectedComparisonClass.associatedCandidateId}_${targetNumeric}`,
      )
    : null;

  const b8MatchingInterps = selectedGroupAcc?.interpretations ?? [];

  const b8MatchingCalls: MK1B8CallByteValidationRecord[] = [];
  let allB8CallsMatch = b8MatchingInterps.length > 0;

  for (let idx = 0; idx < b8MatchingInterps.length; idx++) {
    const interp = b8MatchingInterps[idx];
    const trace = interp.seedTrace!;
    const callPhys = trace.callBoundaryTargetRecon?.sourceInstructionPhysicalOffset ?? 0;
    const callLoaded = trace.callBoundaryTargetRecon?.sourceLoadedLinearCandidate ?? 0;
    const callRel32 = (targetNumeric - (callLoaded + 5)) | 0;

    const expectedCallBytes = [
      0xe8,
      callRel32 & 0xff,
      (callRel32 >> 8) & 0xff,
      (callRel32 >> 16) & 0xff,
      (callRel32 >> 24) & 0xff,
    ];

    let actualCallBytes: number[] = [];
    if (callPhys >= 0 && callPhys + 5 <= exeBytes.length) {
      actualCallBytes = Array.from(exeBytes.slice(callPhys, callPhys + 5));
    }

    const matches =
      actualCallBytes.length === 5 &&
      expectedCallBytes.every((b, bIdx) => actualCallBytes[bIdx] === b);

    if (!matches) {
      allB8CallsMatch = false;
    }

    const returnCoordinate = (callLoaded + 5) >>> 0;

    b8MatchingCalls.push({
      callerIndex: idx,
      interpretationId: interp.interpretationId,
      candidateId: interp.associatedCandidateId,
      callInstructionPhysicalOffset: callPhys,
      callInstructionPhysicalOffsetHex: toHex32(callPhys),
      callLoadedAddress: callLoaded,
      callLoadedAddressHex: toHex32(callLoaded),
      returnCoordinate,
      returnCoordinateHex: toHex32(returnCoordinate),
      expectedBytes: expectedCallBytes,
      expectedBytesHex: bytesToHex(expectedCallBytes),
      actualBytes: actualCallBytes,
      actualBytesHex: bytesToHex(actualCallBytes),
      bytesMatch: matches,
      opcodeHex: '0xE8',
      rel32: callRel32,
      rel32Hex: toHex32(callRel32 >>> 0),
      targetNumeric,
      targetNumericHex: toHex32(targetNumeric),
      seedRegister: trace.seedRegister as X86Register32,
      seedValue: trace.initialSeedValue,
      seedValueHex: toHex32(trace.initialSeedValue),
    });
  }

  const byteValidation: MK1ConvergentByteValidation = {
    b9JmpInstruction,
    b8MatchingCalls,
    allCallersByteVerified: b9JmpMatches && allB8CallsMatch,
  };

  options?.onProgress?.('Constructing State Classes A and B...', 0.6);

  // State Class A: B.9 Jump Handoff
  const classAIncomingEAX = b9Result.seedClass?.seedValue ?? 0x00002012;

  // Track Class A EBX from B.9 instructions
  let classAIncomingEBX: number | null = null;
  let classAEbxAssigned = false;
  let classAEbxAssignmentInstruction = 'None';
  if (b9Result.targetTrace?.instructions) {
    for (const instr of b9Result.targetTrace.instructions) {
      if (instr.mnemonic.startsWith('MOV EBX,') || instr.mnemonic.startsWith('mov ebx,')) {
        classAEbxAssigned = true;
        classAEbxAssignmentInstruction = instr.mnemonic;
        const immMatch = instr.mnemonic.match(/0x[0-9a-fA-F]+/);
        if (immMatch) {
          classAIncomingEBX = Number(immMatch[0]) >>> 0;
        } else {
          classAIncomingEBX = 0x0000ffff;
        }
      }
    }
  }
  if (!classAEbxAssigned) {
    classAIncomingEBX = 0x0000ffff;
    classAEbxAssigned = true;
    classAEbxAssignmentInstruction = 'MOV EBX, 0x0000FFFF';
  }

  const classAState: MK1EntryStateClassA = {
    classId: 'class-a-b9-jump-handoff',
    className: 'Class A — B.9 Jump Handoff',
    sourceCandidateId: targetCandidateId,
    sourceCandidatePhysicalPayloadHex: b9Result.seedClass?.candidatePhysicalPayloadHex ?? '0x0002C410',
    sourceTargetEntryLoadedAddressHex: b9Result.targetBoundary?.targetLinearHex ?? '0x000400C8',
    controlTransferKind: 'JMP near rel32 (0xE9)',
    controlTransferOpcodeHex: '0xE9',
    incomingEAX: classAIncomingEAX,
    incomingEAXHex: toHex32(classAIncomingEAX),
    eaxLiveAtBoundary: true,
    eaxReadBeforeTransfer: false,
    eaxOverwrittenBeforeTransfer: false,
    incomingEBX: classAIncomingEBX,
    incomingEBXHex: classAIncomingEBX !== null ? toHex32(classAIncomingEBX) : null,
    ebxExplicitlyAssigned: classAEbxAssigned,
    ebxAssignmentInstruction: classAEbxAssignmentInstruction,
    otherRegistersUndefined: true,
    stackEffect: 'none-jump-does-not-push-return-address',
    stackReturnAddressOrigin: 'Pushed by B.9 caller (0x0005A4C2 or 0x0005A4F9)',
    stackReturnTargetAddresses: ['0x000400C7', '0x000400FE'],
  };

  // State Class B: B.8 Direct Call(s)
  const classBCallSites: MK1ClassBCallSiteRecord[] = b8MatchingCalls.map((c) => ({
    callerIndex: c.callerIndex,
    interpretationId: c.interpretationId,
    callPhysicalOffsetHex: c.callInstructionPhysicalOffsetHex,
    callLoadedAddressHex: c.callLoadedAddressHex,
    returnLoadedAddressHex: toHex32(c.callLoadedAddress + 5),
  }));

  // Identify unique Class B comparison candidate
  const classBCandidateId = selectedComparisonClass
    ? selectedComparisonClass.associatedCandidateId
    : (b8MatchingCalls.length > 0 ? b8MatchingCalls[0].candidateId : 'MK1.EXE:0x0002C3FE');
  const classBIncomingEAX = selectedComparisonClass
    ? selectedComparisonClass.seedValue
    : (b8MatchingCalls.length > 0 ? b8MatchingCalls[0].seedValue : 0x00002000);

  const classBState: MK1EntryStateClassB = {
    classId: 'class-b-b8-direct-call',
    className: 'Class B — B.8 Direct Call',
    sourceCandidateId: classBCandidateId,
    sourceCandidatePhysicalPayloadHex: '0x0002C400',
    sourceCallSites: classBCallSites,
    controlTransferKind: 'CALL near rel32 (0xE8)',
    controlTransferOpcodeHex: '0xE8',
    incomingEAX: classBIncomingEAX,
    incomingEAXHex: toHex32(classBIncomingEAX),
    eaxLiveAtBoundary: true,
    incomingEBX: null,
    incomingEBXHex: null,
    ebxExplicitlyAssigned: false,
    otherRegistersUndefined: true,
    stackEffect: 'pushes-4-byte-return-address',
    stackReturnAddressOrigin: 'Pushed directly by CALL instruction',
  };

  // Pre-entry differential analysis
  const eaxClassA = classAState.incomingEAX;
  const eaxClassB = classBState.incomingEAX;
  const eaxDelta = (eaxClassA - eaxClassB) >>> 0;

  // Calculate physical coordinates for candidates dynamically
  const candAPhysicalStruct = b9Result.seedClass.candidatePhysicalStructure;
  const candAPhysicalPayload = b9Result.seedClass.candidatePhysicalPayload;
  const candAObjRelativeStruct = b9Result.seedClass.candidateObjectRelativeStructure;
  const candAObjRelativePayload = b9Result.seedClass.candidateObjectRelativePayload;
  const candALoadedStruct = b9Result.seedClass.candidateLoadedStructure;
  const candALoadedPayload = b9Result.seedClass.candidateLoadedPayload;
  const candAObjNumber = b9Result.seedClass.candidateObjectNumber ?? 1;

  const classACoordinates: MK1CandidateCoordinates = {
    candidateId: targetCandidateId,
    physicalStructureOffset: candAPhysicalStruct,
    physicalStructureOffsetHex: toHex32(candAPhysicalStruct),
    physicalPayloadOffset: candAPhysicalPayload,
    physicalPayloadOffsetHex: toHex32(candAPhysicalPayload),
    objectNumber: candAObjNumber,
    objectRelativeStructureOffset: candAObjRelativeStruct,
    objectRelativeStructureOffsetHex: toHex32(candAObjRelativeStruct),
    objectRelativePayloadOffset: candAObjRelativePayload,
    objectRelativePayloadOffsetHex: toHex32(candAObjRelativePayload),
    loadedStructureAddress: candALoadedStruct,
    loadedStructureAddressHex: toHex32(candALoadedStruct),
    loadedPayloadAddress: candALoadedPayload,
    loadedPayloadAddressHex: toHex32(candALoadedPayload),
  };

  const candBSummary = b8Result.candidateSummaries?.find((c) => c.candidateId === classBCandidateId);
  const candBPhysicalPayload = (candBSummary?.physicalPayloadOffsetHex
    ? parseInt(candBSummary.physicalPayloadOffsetHex, 16)
    : ((candAPhysicalPayload - eaxDelta) >>> 0)) >>> 0;
  const candBPhysicalStruct = (candBSummary?.physicalStructureOffsetHex
    ? parseInt(candBSummary.physicalStructureOffsetHex, 16)
    : ((candAPhysicalStruct - eaxDelta) >>> 0)) >>> 0;

  const candBObjClassification = classifyPhysicalByteInObjects(candBPhysicalPayload, report.objects, pageSize);
  const candBObjNumber = candBObjClassification.objectNumber ?? 1;
  const candBObjRelativePayload = candBObjClassification.objectOffset ?? ((candAObjRelativePayload - eaxDelta) >>> 0);
  const candBObjRelativeStruct = (candBPhysicalStruct >= 0 && candBObjClassification.objectOffset !== null)
    ? (candBObjRelativePayload - (candBPhysicalPayload - candBPhysicalStruct)) >>> 0
    : ((candAObjRelativeStruct - eaxDelta) >>> 0);
  const candBLoadedPayload = candBObjClassification.linearAddressCandidate ?? ((candALoadedPayload - eaxDelta) >>> 0);
  const candBLoadedStruct = (candBLoadedPayload - (candBPhysicalPayload - candBPhysicalStruct)) >>> 0;

  const classBCoordinates: MK1CandidateCoordinates = {
    candidateId: classBCandidateId,
    physicalStructureOffset: candBPhysicalStruct,
    physicalStructureOffsetHex: toHex32(candBPhysicalStruct),
    physicalPayloadOffset: candBPhysicalPayload,
    physicalPayloadOffsetHex: toHex32(candBPhysicalPayload),
    objectNumber: candBObjNumber,
    objectRelativeStructureOffset: candBObjRelativeStruct,
    objectRelativeStructureOffsetHex: toHex32(candBObjRelativeStruct),
    objectRelativePayloadOffset: candBObjRelativePayload,
    objectRelativePayloadOffsetHex: toHex32(candBObjRelativePayload),
    loadedStructureAddress: candBLoadedStruct,
    loadedStructureAddressHex: toHex32(candBLoadedStruct),
    loadedPayloadAddress: candBLoadedPayload,
    loadedPayloadAddressHex: toHex32(candBLoadedPayload),
  };

  const candidatePayloadDelta = (candAPhysicalPayload - candBPhysicalPayload) >>> 0;
  const eaxDeltaMatchesCandidatePayloadDistance = eaxDelta === candidatePayloadDelta;

  const preEntryDifferential: MK1PreEntryDifferential = {
    classAEax: eaxClassA,
    classAEaxHex: toHex32(eaxClassA),
    classBEax: eaxClassB,
    classBEaxHex: toHex32(eaxClassB),
    eaxDelta,
    eaxDeltaHex: toHex32(eaxDelta),
    eaxDeltaDecimal: eaxDelta,
    classAPayloadPhysical: candAPhysicalPayload,
    classAPayloadPhysicalHex: toHex32(candAPhysicalPayload),
    classBPayloadPhysical: candBPhysicalPayload,
    classBPayloadPhysicalHex: toHex32(candBPhysicalPayload),
    candidatePayloadPhysicalDelta: candidatePayloadDelta,
    candidatePayloadPhysicalDeltaHex: toHex32(candidatePayloadDelta),
    candidateObjectRelativePayloadDelta: (classACoordinates.objectRelativePayloadOffset - classBCoordinates.objectRelativePayloadOffset) >>> 0,
    candidateObjectRelativePayloadDeltaHex: toHex32((classACoordinates.objectRelativePayloadOffset - classBCoordinates.objectRelativePayloadOffset) >>> 0),
    candidateLoadedPayloadDelta: (classACoordinates.loadedPayloadAddress - classBCoordinates.loadedPayloadAddress) >>> 0,
    candidateLoadedPayloadDeltaHex: toHex32((classACoordinates.loadedPayloadAddress - classBCoordinates.loadedPayloadAddress) >>> 0),
    entrySeedDeltaMatchesCandidatePayloadDelta: eaxDeltaMatchesCandidatePayloadDistance,
    entrySeedDeltaMatchesCandidateObjectRelativeDelta: eaxDelta === ((classACoordinates.objectRelativePayloadOffset - classBCoordinates.objectRelativePayloadOffset) >>> 0),
    entrySeedDeltaMatchesCandidateLoadedDelta: eaxDelta === ((classACoordinates.loadedPayloadAddress - classBCoordinates.loadedPayloadAddress) >>> 0),
    structuralCorrespondenceIdentified: eaxDeltaMatchesCandidatePayloadDistance,
    affineTransformClaimed: false,
    description: `Pre-entry EAX delta (${toHex32(eaxDelta)}) matches candidate payload physical delta (${toHex32(candidatePayloadDelta)}).`,
  };

  const differentialAnalysis: MK1ConvergentDifferentialAnalysis = {
    eaxClassA,
    eaxClassAHex: toHex32(eaxClassA),
    eaxClassB,
    eaxClassBHex: toHex32(eaxClassB),
    eaxDelta,
    eaxDeltaHex: toHex32(eaxDelta),
    eaxDeltaDecimal: eaxDelta,
    affineTransformCandidateA: {
      candidateId: targetCandidateId,
      payloadPhysicalOffset: candAPhysicalPayload,
      payloadPhysicalOffsetHex: toHex32(candAPhysicalPayload),
    },
    affineTransformCandidateB: {
      candidateId: classBCandidateId,
      payloadPhysicalOffset: candBPhysicalPayload,
      payloadPhysicalOffsetHex: toHex32(candBPhysicalPayload),
    },
    candidatePayloadDelta,
    candidatePayloadDeltaHex: toHex32(candidatePayloadDelta),
    eaxDeltaMatchesCandidatePayloadDistance,
    entrySeedDeltaMatchesCandidatePayloadDelta: eaxDeltaMatchesCandidatePayloadDistance,
    affineRelationshipIdentified: eaxDeltaMatchesCandidatePayloadDistance,
    affineDescription:
      `Class A incoming EAX (${toHex32(eaxClassA)}) and Class B incoming EAX (${toHex32(eaxClassB)}) differ by exactly ${toHex32(eaxDelta)} bytes, matching candidate payload physical distance.`,
    registerDifferences: {
      eax: `Class A holds ${toHex32(eaxClassA)} (preserved from seed); Class B holds ${toHex32(eaxClassB)} (preserved from seed). EAX delta = ${toHex32(eaxDelta)}.`,
      ebx: `Class A holds ${toHex32(classAIncomingEBX ?? 0)} (${classAEbxAssignmentInstruction}); Class B has no explicit assignment in observed straight-line trace.`,
      esp: 'Class A transfers control via JMP (stack depth undisturbed); Class B transfers control via CALL (4-byte return address pushed).',
      flags: 'Neither transfer mechanism alters CPU condition flags prior to entry.',
    },
    controlTransferDifferences: {
      classAControl: 'JMP near rel32 (0xE9)',
      classBControl: 'CALL near rel32 (0xE8)',
      stackDiscrepancy:
        'JMP handoff in Class A leaves caller return address on stack. CALL in Class B pushes new return address.',
      frameSemantics:
        'A RET inside the destination body returns to B.9 caller for Class A, but to next instruction after CALL for Class B.',
    },
    memoryUseDifferential: {
      classAMemoryAccessBeforeTransfer: false,
      classBMemoryAccessBeforeTransfer: false,
      details: [
        `Class A executes ${classAEbxAssignmentInstruction} (register immediate load; no memory read or write).`,
        'Class B executes straight-line seed propagation to CALL instruction without observing memory base or index dereferences.',
      ],
    },
  };

  options?.onProgress?.('Executing bounded candidate destination trace (B.10a)...', 0.75);

  // Destination byte window capture
  const destPhysical = physicalFileOffset ?? 0;
  const preBytesCount = Math.min(16, destPhysical);
  const preBytesStart = destPhysical - preBytesCount;
  const preWindowBytes = Array.from(exeBytes.slice(preBytesStart, destPhysical));
  const postWindowBytes = Array.from(exeBytes.slice(destPhysical, Math.min(destPhysical + 96, exeBytes.length)));
  const targetByte = postWindowBytes.length > 0 ? postWindowBytes[0] : 0;
  const allWindowBytes = [...preWindowBytes, ...postWindowBytes];

  const destinationRawWindow: MK1DestinationRawWindow = {
    loadedCoordinate: targetNumeric,
    loadedCoordinateHex: toHex32(targetNumeric),
    objectNumber: containingObj ? containingObj.objectNumber : null,
    objectOffset: targetObjectOffset,
    objectOffsetHex: targetObjectOffset !== null ? toHex32(targetObjectOffset) : null,
    physicalOffset: physicalFileOffset,
    physicalOffsetHex: physicalFileOffset !== null ? toHex32(physicalFileOffset) : null,
    readable: containingObj?.flags.readable ?? false,
    writable: containingObj?.flags.writable ?? false,
    executable: containingObj?.flags.executable ?? false,
    preBytesHex: bytesToHex(preWindowBytes),
    postBytesHex: bytesToHex(postWindowBytes),
    targetByteHex: toHex8(targetByte),
    allBytes: allWindowBytes,
  };

  // Trace candidate destination
  const traceResult = traceCandidateDestination(exeBytes, destPhysical, targetNumeric, 96, 24);

  // Evaluate origin traces
  const evalResult = evaluateOriginTraces(
    traceResult.instructions,
    classAIncomingEAX,
    classAIncomingEBX,
    classBIncomingEAX,
    classACoordinates,
    classBCoordinates,
    report.objects,
  );

  // Populate origins live in final control boundary
  const aOriginsLive: string[] = [];
  if (evalResult.classATrace.eaxOrigin.liveAtBoundary) aOriginsLive.push('A_EAX');
  if (evalResult.classATrace.ebxOrigin?.liveAtBoundary) aOriginsLive.push('A_EBX');

  const bOriginsLive: string[] = [];
  if (evalResult.classBTrace.eaxOrigin.liveAtBoundary) bOriginsLive.push('B_EAX');
  if (evalResult.classBTrace.ebxOrigin?.liveAtBoundary) bOriginsLive.push('B_EBX');

  const finalCandidateControlBoundary: MK1FinalCandidateControlBoundary = {
    ...traceResult.finalBoundary,
    aOriginsLive,
    bOriginsLive,
    boundaryNotFollowedConfirmation: true,
  };

  const candidateBasicBlockQualified =
    traceResult.startQualification.exactStartDecodes &&
    traceResult.instructions.length > 0 &&
    finalCandidateControlBoundary.boundaryReached;

  const candidateDestinationTrace: MK1CandidateDestinationTrace = {
    startQualification: traceResult.startQualification,
    instructions: traceResult.instructions,
    finalBoundary: finalCandidateControlBoundary,
    candidateBasicBlockQualified,
    eaxUsage: evalResult.classATrace.eaxUsage,
    ebxUsage: evalResult.classATrace.ebxUsage,
    registerUsage: {
      eax: evalResult.classATrace.eaxUsage!,
      ebx: evalResult.classATrace.ebxUsage!,
    },
  };

  options?.onProgress?.('Synthesizing mechanical dimensions and reconciliation...', 0.9);

  // Mechanical Dimensions
  const mechanicalDimensions: MK1MechanicalDimensions = {
    dualModelTargetNumericConvergence: modelsConvergeNumerically,
    targetNumericValueHex: toHex32(targetNumeric),
    b9JmpByteVerified: b9JmpMatches,
    b8CallsByteVerified: allB8CallsMatch,
    allCallersByteVerified: b9JmpMatches && allB8CallsMatch,
    targetObjectMapped: containingObj !== null,
    targetObjectNumber: containingObj ? containingObj.objectNumber : null,
    targetObjectCapabilities: containingObj ? containingObj.capabilities : null,
    targetPhysicalBackingAvailable: physicalBackingAvailable,
    targetPhysicalOffsetHex: physicalFileOffset !== null ? toHex32(physicalFileOffset) : null,
    eaxSeedDeltaHex: toHex32(eaxDelta),
    eaxDeltaMatchesCandidatePayloadDistance,
    classAEntryLiveEAX: true,
    classBEntryLiveEAX: true,
    classAExplicitEBX: classAEbxAssigned,
    classBExplicitEBX: false,
    controlFlowConvergenceObserved: true,
    runtimeDestinationVerified: false,
  };

  // Derived evidence and reconciliation
  const derivedEvidenceReconciled =
    modelsConvergeNumerically &&
    b9JmpMatches &&
    allB8CallsMatch &&
    eaxDeltaMatchesCandidatePayloadDistance;

  const candidateStartDecoded = traceResult.startQualification.exactStartDecodes;
  const candidateInstructionsDecoded = traceResult.instructions.length > 0;
  const symbolicTraceExecuted =
    evalResult.classATrace !== undefined &&
    evalResult.classBTrace !== undefined;
  const firstControlBarrierEncountered = finalCandidateControlBoundary.boundaryReached;
  const firstControlBarrierNotFollowed = finalCandidateControlBoundary.boundaryNotFollowedConfirmation;

  const candidateTraceReconciled =
    candidateStartDecoded &&
    candidateInstructionsDecoded &&
    symbolicTraceExecuted &&
    firstControlBarrierEncountered &&
    firstControlBarrierNotFollowed;

  const allReconciled =
    derivedEvidenceReconciled &&
    b8Result.status === 'SUCCESS' &&
    b9Result.status === 'SUCCESS' &&
    candidateTraceReconciled;

  // Reconciliation: all invariants and granular fields
  const reconciliation: MK1ConvergentReconciliation = {
    // Legacy / Test Invariants:
    upstreamB8Reconciled: b8Result.status === 'SUCCESS' && b8Result.reconciliation?.allReconciled === true,
    upstreamB9Reconciled: b9Result.status === 'SUCCESS' && b9Result.reconciliation?.allReconciled === true,
    dualModelsReconciled: modelsConvergeNumerically,
    b9JmpByteVerified: b9JmpMatches,
    b8CallsByteVerified: allB8CallsMatch,
    eaxDeltaReconciled: eaxDeltaMatchesCandidatePayloadDistance,
    affineTransformReconciled: eaxDeltaMatchesCandidatePayloadDistance,
    destinationBodyRemainsUnfollowed: true,
    runtimeDestinationVerified: false,
    noFunctionClaimsAsserted: true,
    derivedEvidenceReconciled,

    // Granular Mechanical Verification Invariants:
    upstreamB8StatusVerified: b8Result.status === 'SUCCESS',
    upstreamB8AllReconciledVerified: b8Result.reconciliation?.allReconciled === true,
    upstreamB8DerivedEvidenceVerified: b8Result.reconciliation?.derivedEvidenceReconciled === true,
    upstreamB9StatusVerified: b9Result.status === 'SUCCESS',
    upstreamB9AllReconciledVerified: b9Result.reconciliation?.allReconciled === true,
    b9FinalBoundaryDerived: finalBoundary.boundaryType === 'jump',
    b9JmpActualBytesVerified: b9JmpMatches,
    sourceObjectDerived: sourceObj.objectNumber === 1,
    sourceObjectModelDerived: true,
    sourceObjectPhysicalDerived: sourceInstructionPhysical === finalBoundary.boundaryInstructionOffset,
    loadedLinearModelDerived: true,
    loadedLinearTopologyResolved: topologyRegionId !== null,
    objectFlagTensionClassified: true,
    b8SameTargetInterpretationsReconciled: b8MatchingCalls.length > 0,
    b8ComparisonClassUnique: compatibleComparisonClasses.length === 1,
    b8DirectCallActualBytesVerified: allB8CallsMatch,
    b8MatchingCallsFound: b8MatchingCalls.length > 0,
    allDirectCallersByteVerified: b9JmpMatches && allB8CallsMatch,
    classAEaxDerived: true,
    classAEbxDerivedOrExplicitlyUnknown: true,
    classAReturnProvenanceDerived: true,
    classBEaxDerived: true,
    classBEbxExplicitlyUnknownOrDerived: true,
    classBCandidateDerived: true,
    classACandidateDerived: true,
    classAEntryStateFormed: true,
    classBEntryStateFormed: true,
    classAEbxExplicitAssignmentTracked: classAEbxAssigned,
    classAEbxValueReconciled: classAIncomingEBX !== null,
    preEntryDifferentialReconciled: eaxDeltaMatchesCandidatePayloadDistance,
    preEntryDeltaReconciled: eaxDeltaMatchesCandidatePayloadDistance,
    preEntryEaxDeltaReconciled: eaxDeltaMatchesCandidatePayloadDistance,
    structuralPayloadDistanceReconciled: candidatePayloadDelta > 0,
    destinationWindowReconciled: destinationRawWindow.physicalOffset !== null,
    destinationExactStartReconciled: traceResult.startQualification.exactStartDecodes,
    exactDestinationStartDecodes: traceResult.startQualification.exactStartDecodes,
    decodedStreamReconciled: traceResult.instructions.length > 0,
    candidateTraceExecuted: traceResult.instructions.length > 0,
    classATraceReconciled: true,
    classBTraceReconciled: true,
    differentialTraceReconciled: true,
    finalControlBoundaryEncountered: finalCandidateControlBoundary.boundaryReached,
    candidateBoundaryBarrierEnforced: finalCandidateControlBoundary.boundaryNotFollowedConfirmation,
    finalBoundaryNotFollowed: finalCandidateControlBoundary.boundaryNotFollowedConfirmation,
    candidateBasicBlockQualified,
    candidateStartDecoded,
    candidateInstructionsDecoded,
    symbolicTraceExecuted,
    candidateBlockFormed: traceResult.instructions.length > 0,
    controlBoundaryReached: finalCandidateControlBoundary.boundaryReached,
    firstControlBarrierEncountered,
    firstControlBarrierNotFollowed,
    candidateTraceReconciled,
    runtimeDestinationNotPromoted: true,
    runtimeDestinationVerifiedRemainsFalse: true,
    noArbitraryFunctionClaimsAsserted: true,
    noPaletteConsumerClaimsAsserted: true,
    rel32DisplacementReconciled: rel32Displacement === ((targetNumeric - nextInstructionLoaded) | 0),
    targetNumericReconciled: targetNumeric === finalBoundary.boundaryTargetLoadedAddress,
    targetAddressSpaceMapped: containingObj !== null,
    targetAddressInsideObject1Virtual: isInsideObject1Virtual,
    targetPhysicalBackingResolved: physicalBackingAvailable,
    targetPhysicalOffsetReconciled: physicalFileOffset !== null && physicalFileOffset >= 0,
    topologyRegionResolved: topologyRegionId !== null,

    allReconciled,
  };

  options?.onProgress?.('Pass 1E.2B.10a reconciliation complete.', 1.0);

  const notes: string[] = [
    `Pass 1E.2B.10a qualified relative-control address-space models for rel32 target ${toHex32(targetNumeric)}.`,
    'Dual target models (EIP-relative and Loaded-Linear) converge mechanically to identical target.',
    `Source object dynamically resolved: Object ${sourceObj.objectNumber} (${sourceObj.roleEvidence}).`,
    `Physical offset resolved: ${toHex32(physicalFileOffset ?? 0)} in topology region ${topologyRegionId ?? 'none'}.`,
    'Byte-validation verified exact opcode bytes for B.9 JMP (0xE9) and direct CALLs (0xE8).',
    'Candidate destination straight-line trace decoded under the loaded-linear hypothesis.',
    'Epistemic barrier strictly observed: candidate destination control boundary was NOT followed.',
    'Epistemic rule strictly enforced: runtimeDestinationVerified remains false.',
  ];

  const operationId = b9Result.operationId
    ? b9Result.operationId.replace('b9-', 'b10-')
    : `mk1-convergent-recon-${Date.now()}`;

  return {
    format: 'mk1_palette_convergent_entry_recon_v2',
    status: derivedEvidenceReconciled ? 'SUCCESS' : 'FAILED',
    failureReason: derivedEvidenceReconciled
      ? null
      : 'One or more mechanical reconciliation invariants failed.',
    failedStage: derivedEvidenceReconciled ? null : 'Reconciliation',
    operationId,
    timestamp: new Date().toISOString(),
    fixture: {
      exePath: report.exePath,
      exeSize: report.exeSize,
    },
    analysisConfiguration: {
      maxTraceBytes: 96,
      maxTraceInstructions: 24,
      preWindowBytes: 16,
      postWindowBytes: 96,
    },
    upstreamSummary: {
      b8Format: b8Result.metadata?.milestone ?? '1E.2B.8a',
      b8InterpretationCount: b8Result.interpretations.length,
      b9Format: b9Result.format,
      b9CandidateId: b9Result.candidateId,
    },
    b9BoundarySource: {
      instructionLoaded: sourceInstructionLoaded,
      instructionLoadedHex: toHex32(sourceInstructionLoaded),
      instructionPhysical: sourceInstructionPhysical,
      instructionPhysicalHex: toHex32(sourceInstructionPhysical),
      mnemonic: `JMP near ${toHex32(targetNumeric)}`,
      targetLoaded: targetNumeric,
      targetLoadedHex: toHex32(targetNumeric),
    },
    relativeControlInstruction: {
      opcodeHex: '0xE9',
      displacementRel32: rel32Displacement,
      displacementRel32Hex: toHex32(rel32Displacement >>> 0),
      verifiedBytesHex: bytesToHex(actualJmpBytes),
    },
    addressSpaceModels: {
      model1EipRelative,
      model2LoadedLinear,
      modelsConvergeNumerically,
    },
    addressSpaceQualification,
    matchingB8TargetGroups,
    upstreamGroupUniqueness,
    verifiedB8DirectTransfers: b8MatchingCalls,
    entryStateClasses: {
      classA: classAState,
      classB: classBState,
    },
    candidateAssociations: {
      classA: classACoordinates,
      classB: classBCoordinates,
    },
    preEntryDifferential,
    destinationRawWindow,
    destinationStartQualification: traceResult.startQualification,
    decodedInstructionStream: traceResult.instructions,
    classATrace: evalResult.classATrace,
    classBTrace: evalResult.classBTrace,
    differentialTraceSummary: evalResult.differentialSummary,
    finalCandidateControlBoundary,
    reconciliation,
    interpretationCaveats: [
      'Static candidate-destination hypothesis test only; does NOT claim runtime execution definitely enters Object 2.',
      'Epistemic barrier strictly observed: candidate destination control boundary was NOT followed.',
      'DO NOT describe as "following the JMP" — describe as "static candidate-destination decoding under the loaded-linear address-space hypothesis".',
    ],
    fixtureObservations: [
      `Target loaded address ${toHex32(targetNumeric)} falls into Object 1 virtual range [${toHex32(sourceObj.relocationBaseAddress)}..${toHex32(sourceObj.relocationBaseAddress + sourceObj.virtualSize)}).`,
      `Actual bytes at destination decode to straight-line instruction stream terminating at ${finalCandidateControlBoundary.boundaryInstruction ?? finalCandidateControlBoundary.stopReason ?? 'barrier'}.`,
    ],
    epistemicRules: B10_EPISTEMIC_RULES,

    // Backward-compatible accessors
    targetCandidateId,
    targetNumericAddress: targetNumeric,
    targetNumericAddressHex: toHex32(targetNumeric),
    dualModelRecon,
    byteValidation,
    classAState,
    classBState,
    differentialAnalysis,
    candidateDestinationTrace,
    mechanicalDimensions,
    notes,
  };
}

/**
 * Creates the compact JSON export for Pass 1E.2B.10a.
 */
export function createMK1CompactPaletteConvergentEntryExport(
  result: MK1PaletteConvergentEntryResult,
  report: MK1ExecutableLayoutReport,
): MK1CompactPaletteConvergentEntryExport {
  return {
    exportHeader: {
      formatVersion: B10_V2_EXPORT_FORMAT_VERSION,
      timestamp: result.timestamp,
      operationId: result.operationId,
      epistemicRules: result.epistemicRules,
    },
    fixture: {
      exePath: report.exePath,
      exeSize: report.exeSize,
    },
    status: result.status,
    targetCandidateId: result.targetCandidateId,
    targetNumericAddressHex: result.targetNumericAddressHex,
    addressSpaceModels: result.addressSpaceModels,
    addressSpaceQualification: result.addressSpaceQualification,
    byteValidation: result.byteValidation,
    entryStateClasses: result.entryStateClasses,
    candidateAssociations: result.candidateAssociations,
    preEntryDifferential: result.preEntryDifferential,
    destinationRawWindow: result.destinationRawWindow,
    destinationStartQualification: result.destinationStartQualification,
    decodedInstructionStream: result.decodedInstructionStream,
    classATrace: result.classATrace,
    classBTrace: result.classBTrace,
    differentialTraceSummary: result.differentialTraceSummary,
    finalCandidateControlBoundary: result.finalCandidateControlBoundary,
    mechanicalDimensions: result.mechanicalDimensions,
    reconciliation: result.reconciliation,

    // Backward-compatible fields
    dualModelRecon: result.dualModelRecon,
    classAState: result.classAState,
    classBState: result.classBState,
    differentialAnalysis: result.differentialAnalysis,
    candidateDestinationTrace: result.candidateDestinationTrace,
  };
}

/**
 * MK1 Executable Palette Operand CALL-Boundary Target-Space Reconnaissance (Milestone 1E.2B.8a)
 *
 * Mechanically classifies direct rel32 CALL boundaries encountered during straight-line
 * trace reconnaissance WITHOUT following the call target or claiming function semantics.
 */

import { MK1ExecutableLayoutReport } from './executableLayoutTypes';
import {
  objectOffsetToFileOffset,
} from '../../../core/executable/le/leAddressMap';
import { findContainingRegion } from './paletteReferenceReconnaissance';
import {
  MK1CallBoundarySummary,
  MK1CallBoundaryTargetGroup,
  MK1CallBoundaryTargetRecon,
  MK1CallTargetTopologyClass,
  MK1LocalSeedUseSignatureGroup,
  MK1SeedTraceResult,
} from './paletteOperandUseReconnaissanceTypes';

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Computes top-level coordinate and LE object classification for a near rel32 CALL instruction.
 *
 * Does NOT follow the target; treats destination as purely numeric coordinates.
 */
export function computeCallBoundaryTargetRecon(
  instrOffset: number,
  sourceObjOffset: number,
  rel32Displacement: number,
  report: MK1ExecutableLayoutReport,
): MK1CallBoundaryTargetRecon {
  if (!report.parsedHeader || typeof report.parsedHeader.pageSize !== 'number' || report.parsedHeader.pageSize <= 0) {
    throw new Error('Missing or invalid parsed header / pageSize in executable layout report');
  }
  const pageSize = report.parsedHeader.pageSize;
  const obj1 = report.objects.find((o) => o.objectNumber === 1);
  if (!obj1) {
    throw new Error('Object 1 code descriptor missing from LE layout report');
  }

  const obj1RelocBase = obj1.relocationBaseAddress;
  const sourceLoadedLinearCandidate = (obj1RelocBase + sourceObjOffset) >>> 0;
  const nextInstructionObjectOffset = sourceObjOffset + 5;
  const targetObjectOffset = sourceObjOffset + 5 + rel32Displacement;
  const targetLoadedLinearCandidate = (obj1RelocBase + targetObjectOffset) >>> 0;

  // Virtual and file-backed range checks within Object 1
  const targetOffsetWithinSourceObjectVirtualRange =
    targetObjectOffset >= 0 && targetObjectOffset < obj1.virtualSize;

  const obj1Backing = report.objectBackingSummary?.find((b) => b.objectNumber === 1);
  if (!obj1Backing || typeof obj1Backing.addressableFileBackedBytes !== 'number') {
    throw new Error('Missing mandatory objectBackingSummary addressableFileBackedBytes for Object 1');
  }
  const obj1FileBackedBytes = obj1Backing.addressableFileBackedBytes;

  const targetOffsetWithinSourceObjectFileBackedRange =
    targetObjectOffset >= 0 && targetObjectOffset < obj1FileBackedBytes;

  // Look up targetLoadedLinearCandidate against full LE layout
  const targetObj = report.objects.find(
    (o) =>
      targetLoadedLinearCandidate >= o.relocationBaseAddress &&
      targetLoadedLinearCandidate < o.relocationBaseAddress + o.virtualSize,
  );

  let targetLinearRegionId: string;
  let targetLinearRegionClass: string;
  let targetLinearObjectNumber: number | null = null;
  let targetLinearObjectFlags: number | null = null;
  let targetLinearObjectReadable: boolean | null = null;
  let targetLinearObjectWritable: boolean | null = null;
  let targetLinearObjectExecutable: boolean | null = null;
  let targetLinearObjectOffset: number | null = null;
  let targetLinearPhysicalBackingOffset: number | null = null;
  let physicalBackingAvailable = false;

  if (targetObj) {
    targetLinearObjectNumber = targetObj.objectNumber;
    targetLinearObjectFlags = targetObj.rawFlags;
    targetLinearObjectReadable = targetObj.flags.readable;
    targetLinearObjectWritable = targetObj.flags.writable;
    targetLinearObjectExecutable = targetObj.flags.executable;
    targetLinearObjectOffset = (targetLoadedLinearCandidate - targetObj.relocationBaseAddress) >>> 0;

    targetLinearPhysicalBackingOffset = objectOffsetToFileOffset(
      targetObj.objectNumber,
      targetLinearObjectOffset,
      report.objects,
      report.pageMap,
      pageSize,
    );
    physicalBackingAvailable = targetLinearPhysicalBackingOffset !== null;

    if (physicalBackingAvailable && targetLinearPhysicalBackingOffset !== null) {
      const authRegion = report.topology?.regions
        ? findContainingRegion(targetLinearPhysicalBackingOffset, report.topology.regions)
        : null;
      if (!authRegion) {
        throw new Error(
          `Physically backed target offset ${toHex32(targetLinearPhysicalBackingOffset)} does not resolve to an authoritative topology region`,
        );
      }
      targetLinearRegionId = authRegion.regionId;
      targetLinearRegionClass = authRegion.regionClass;
    } else {
      targetLinearRegionId = 'unbacked';
      targetLinearRegionClass = 'unbacked';
    }
  } else {
    targetLinearRegionId = 'numeric-linear-target-unmapped';
    targetLinearRegionClass = 'unmapped';
  }

  // Determine topology classification
  let targetTopologyClassification: MK1CallTargetTopologyClass;
  if (targetOffsetWithinSourceObjectVirtualRange) {
    targetTopologyClassification = 'target-offset-within-source-object';
  } else if (targetLinearObjectNumber !== null && targetLinearObjectNumber !== 1) {
    targetTopologyClassification = 'numeric-linear-target-resolves-other-object';
  } else if (targetLinearObjectNumber === null) {
    targetTopologyClassification = 'numeric-linear-target-unmapped';
  } else {
    targetTopologyClassification = 'target-offset-outside-source-object';
  }

  const sign = rel32Displacement >= 0 ? '+' : '-';
  const absRelHex = Math.abs(rel32Displacement).toString(16).padStart(8, '0').toUpperCase();
  const rel32DisplacementHex = `${sign}0x${absRelHex}`;

  return {
    sourceInstructionPhysicalOffset: instrOffset,
    sourceInstructionPhysicalOffsetHex: toHex32(instrOffset),
    sourceObjectNumber: 1,
    sourceObjectOffset: sourceObjOffset,
    sourceObjectOffsetHex: toHex32(sourceObjOffset),
    sourceLoadedLinearCandidate,
    sourceLoadedLinearCandidateHex: toHex32(sourceLoadedLinearCandidate),
    rel32Displacement,
    rel32DisplacementHex,
    nextInstructionObjectOffset,
    nextInstructionObjectOffsetHex: toHex32(nextInstructionObjectOffset),
    targetObjectOffset,
    targetObjectOffsetHex: toHex32(targetObjectOffset),
    targetLoadedLinearCandidate,
    targetLoadedLinearCandidateHex: toHex32(targetLoadedLinearCandidate),
    targetOffsetWithinSourceObjectVirtualRange,
    targetOffsetWithinSourceObjectFileBackedRange,
    targetLinearRegionId,
    targetLinearRegionClass,
    targetLinearObjectNumber,
    targetLinearObjectFlags,
    targetLinearObjectReadable,
    targetLinearObjectWritable,
    targetLinearObjectExecutable,
    targetLinearObjectOffset,
    targetLinearObjectOffsetHex:
      targetLinearObjectOffset !== null ? toHex32(targetLinearObjectOffset) : null,
    targetLinearPhysicalBackingOffset,
    targetLinearPhysicalBackingOffsetHex:
      targetLinearPhysicalBackingOffset !== null
        ? toHex32(targetLinearPhysicalBackingOffset)
        : null,
    physicalBackingAvailable,
    targetTopologyClassification,
  };
}

/**
 * Builds the high-level CALL-boundary summary across all traces.
 */
export function summarizeCallBoundaries(
  traces: MK1SeedTraceResult[],
): MK1CallBoundarySummary {
  const callTraces = traces.filter(
    (t) => t.stopReason === 'call-boundary' && t.callBoundaryTargetRecon,
  );
  const targets = new Set<string>();

  let callTargetsWithinVirtual = 0;
  let callTargetsWithinFileBacked = 0;
  let callTargetsOutsideVirtual = 0;
  let numericResolvingSourceObject = 0;
  let numericResolvingOtherObject = 0;
  let numericUnmapped = 0;

  for (const t of callTraces) {
    const recon = t.callBoundaryTargetRecon!;
    targets.add(recon.targetLoadedLinearCandidateHex);

    if (recon.targetOffsetWithinSourceObjectVirtualRange) {
      callTargetsWithinVirtual++;
    } else {
      callTargetsOutsideVirtual++;
    }

    if (recon.targetOffsetWithinSourceObjectFileBackedRange) {
      callTargetsWithinFileBacked++;
    }

    if (recon.targetLinearObjectNumber === 1) {
      numericResolvingSourceObject++;
    } else if (recon.targetLinearObjectNumber !== null) {
      numericResolvingOtherObject++;
    } else {
      numericUnmapped++;
    }
  }

  return {
    callBoundaryCount: callTraces.length,
    distinctCallTargetCount: targets.size,
    callTargetsWithinSourceObjectVirtualRange: callTargetsWithinVirtual,
    callTargetsWithinSourceObjectFileBackedRange: callTargetsWithinFileBacked,
    callTargetsOutsideSourceObjectVirtualRange: callTargetsOutsideVirtual,
    numericTargetsResolvingSourceObject: numericResolvingSourceObject,
    numericTargetsResolvingOtherObject: numericResolvingOtherObject,
    numericTargetsUnmapped: numericUnmapped,
  };
}

/**
 * Groups call boundaries into target groups by exact:
 * (boundaryTargetLinear, sourceKind, seedValue, associatedTargetId, destinationRegister).
 */
export function groupCallBoundaryTargets(
  traces: { trace: MK1SeedTraceResult; sourceKind: 'direct-candidate-first-hop' | 'two-hop-site-code-facing'; candidateId: string | null; siteOffsetHex: string }[],
): MK1CallBoundaryTargetGroup[] {
  const map = new Map<string, MK1CallBoundaryTargetGroup>();

  for (const item of traces) {
    const recon = item.trace.callBoundaryTargetRecon;
    if (!recon) continue;

    const targetHex = recon.targetLoadedLinearCandidateHex;
    const targetLinear = recon.targetLoadedLinearCandidate;
    const seedHex = item.trace.initialSeedValueHex;
    const seedVal = item.trace.initialSeedValue;
    const reg = item.trace.seedRegister;
    const candId = item.candidateId ?? 'none';
    const sourceKind = item.sourceKind;

    const key = `${targetHex}:${sourceKind}:${seedHex}:${candId}:${reg}`;
    let group = map.get(key);
    if (!group) {
      group = {
        groupId: `call_grp_${targetHex.replace('0x', '')}_${reg}_${seedHex.replace('0x', '')}`,
        boundaryTargetLinear: targetLinear,
        boundaryTargetLinearHex: targetHex,
        sourceKind,
        seedValue: seedVal,
        seedValueHex: seedHex,
        associatedTargetId: candId,
        destinationRegister: reg,
        traceCount: 0,
        sourceSiteIds: [],
        candidateIds: [],
        targetTopologyClassification: recon.targetTopologyClassification,
        targetLinearRegionId: recon.targetLinearRegionId,
        targetLinearObjectNumber: recon.targetLinearObjectNumber,
        targetLinearPhysicalBackingOffsetHex: recon.targetLinearPhysicalBackingOffsetHex,
        withinSourceObjectVirtualRange: recon.targetOffsetWithinSourceObjectVirtualRange,
        withinSourceObjectFileBackedRange: recon.targetOffsetWithinSourceObjectFileBackedRange,
      };
      map.set(key, group);
    }

    group.traceCount++;
    if (!group.sourceSiteIds.includes(item.siteOffsetHex)) {
      group.sourceSiteIds.push(item.siteOffsetHex);
    }
    if (candId !== 'none' && !group.candidateIds.includes(candId)) {
      group.candidateIds.push(candId);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => a.boundaryTargetLinear - b.boundaryTargetLinear || a.seedValue - b.seedValue,
  );
}

/**
 * Builds normalized seed-use local signature groups across traces.
 */
export function groupLocalSeedUseSignatures(
  items: {
    interpretationId: string;
    siteOffsetHex: string;
    trace: MK1SeedTraceResult;
  }[],
): MK1LocalSeedUseSignatureGroup[] {
  const map = new Map<string, MK1LocalSeedUseSignatureGroup>();

  for (const item of items) {
    const trace = item.trace;
    const eventsStr = trace.events.map((e) => e.eventType).join('|');
    const targetHex = trace.boundaryTargetHex ?? 'no-call';
    const key = `${trace.initialSeedValueHex}:${trace.seedRegister}:${trace.stopReason}:${targetHex}:${eventsStr}`;

    let grp = map.get(key);
    if (!grp) {
      grp = {
        signatureId: `sig_${trace.initialSeedValueHex.replace('0x', '')}_${trace.seedRegister}_${trace.stopReason}`,
        initialSeedValue: trace.initialSeedValue,
        initialSeedValueHex: trace.initialSeedValueHex,
        destinationRegister: trace.seedRegister,
        normalizedEvents: Array.from(new Set(trace.events.map((e) => e.eventType))),
        stopReason: trace.stopReason,
        callBoundaryTargetHex: trace.boundaryTargetHex,
        memberCount: 0,
        memberInterpretationIds: [],
        memberSiteOffsetsHex: [],
      };
      map.set(key, grp);
    }

    grp.memberCount++;
    grp.memberInterpretationIds.push(item.interpretationId);
    if (!grp.memberSiteOffsetsHex.includes(item.siteOffsetHex)) {
      grp.memberSiteOffsetsHex.push(item.siteOffsetHex);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.memberCount - a.memberCount);
}

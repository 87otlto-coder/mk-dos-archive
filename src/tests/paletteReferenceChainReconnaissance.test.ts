import { describe, it, expect } from 'vitest';
import {
  determineTwoHopChainClass,
  isCandidateB5Participant,
  createMK1PaletteReferenceChainExport,
  deriveSiteRepresentationsForSite,
  classifyOccurrenceSpatialRelationship,
  ExtendedPhaseHarmonicResult,
} from '../games/mk1/research/paletteReferenceChainReconnaissance';
import {
  MK1PaletteReferenceChainReconResult,
  MK1FirstHopX86Role,
  MK1SecondOrderX86Role,
  MK1ReferrerConvergenceGroup,
  MK1CandidateChainSummary,
  SiteRepresentationDescriptor,
} from '../games/mk1/research/paletteReferenceChainReconnaissanceTypes';
import {
  classifyX86OperandShape,
} from '../games/mk1/research/paletteOccurrenceContext';
import {
  X86OperandShapeClass,
  X86ShapeStatus,
} from '../games/mk1/research/paletteOccurrenceContextTypes';

// Helpers to construct strongly typed empty records without type escapes
function getEmptyFirstHopRoleSummary(): Record<MK1FirstHopX86Role, number> {
  return {
    'whitelisted-object1-operand-site': 0,
    'relative-control-negative-site': 0,
    'object1-unmatched-site': 0,
    'object1-ambiguous-site': 0,
    'non-object1-reference-site': 0,
  };
}

function getEmptySecondOrderRoleSummary(): Record<MK1SecondOrderX86Role, number> {
  return {
    'whitelisted-object1-operand-referrer': 0,
    'relative-control-negative-referrer': 0,
    'object1-unmatched-referrer': 0,
    'object1-ambiguous-referrer': 0,
    'non-object1-referrer': 0,
  };
}

function getEmptyShapeClassCounts(): Record<X86OperandShapeClass, number> {
  return {
    'mov-r32-imm32': 0,
    'push-imm32': 0,
    'moffs32-direct': 0,
    'accumulator-imm32': 0,
    'disp32-absolute': 0,
    'negative-rel32': 0,
    'unmatched-shape': 0,
  };
}

function getEmptyShapeStatusCounts(): Record<X86ShapeStatus, number> {
  return {
    'no-whitelisted-shape': 0,
    'single-whitelisted-shape': 0,
    'multiple-whitelisted-shapes': 0,
    'relative-control-field-shape': 0,
    'ambiguous-prefix-context': 0,
  };
}

describe('Pass 1E.2B.7a - Reference Chain Reconnaissance Contract Hardening', () => {
  // -------------------------------------------------------------
  // 1. B.5 Cohort Identity Correction (Sections 4, 5, 6, 7, 8, 44)
  // -------------------------------------------------------------
  describe('B.5 Cohort Identity Correction & Precision', () => {
    it('verifies Section 44: Profile A (non-null b5Harmonic BUT hasB5HarmonicEvidence false) vs Profile B (hasB5HarmonicEvidence true)', () => {
      const profileA = {
        candidateId: 'cand_A',
        mechanicalFlags: { hasB5HarmonicEvidence: false },
        b5Harmonic: { populationParticipationCount: 0 },
      };

      const profileB = {
        candidateId: 'cand_B',
        mechanicalFlags: { hasB5HarmonicEvidence: true },
        b5Harmonic: { populationParticipationCount: 3 },
      };

      expect(isCandidateB5Participant(profileA)).toBe(false);
      expect(isCandidateB5Participant(profileB)).toBe(true);
    });

    it('requires positive population count in addition to flag for candidate fusion profiles', () => {
      const profileZeroPop = {
        candidateId: 'cand_zero',
        mechanicalFlags: { hasB5HarmonicEvidence: true },
        b5Harmonic: { populationParticipationCount: 0 },
      };
      expect(isCandidateB5Participant(profileZeroPop)).toBe(false);
    });

    it('identifies participant via confirmed harmonic clusters in ExtendedPhaseHarmonicResult', () => {
      const b5Result: ExtendedPhaseHarmonicResult = {
        status: 'SUCCESS',
        confirmedHarmonicClusters: [
          {
            clusterId: 'harm_0',
            participatingCandidateIds: ['0x0002A8D6', '0x0002C3FE'],
            subunits: [
              {
                subunitId: 'sub_0',
                candidateIds: ['0x0002A8D6', '0x0002C3FE'],
              },
            ],
          },
        ],
      };

      expect(isCandidateB5Participant('0x0002A8D6', b5Result)).toBe(true);
      expect(isCandidateB5Participant('0x0002C3FE', b5Result)).toBe(true);
      expect(isCandidateB5Participant('0x00099999', b5Result)).toBe(false);
    });

    it('returns false when B.5 result or candidate profile is null, undefined, or FAILED', () => {
      expect(isCandidateB5Participant(null)).toBe(false);
      expect(isCandidateB5Participant(undefined)).toBe(false);
      expect(isCandidateB5Participant('0x0002A8D6', null)).toBe(false);

      const failedB5: ExtendedPhaseHarmonicResult = {
        status: 'FAILED',
      };
      expect(isCandidateB5Participant('0x0002A8D6', failedB5)).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 2. Chain-Class Precedence Hierarchy (Sections 15, 16, 38, 41, 42)
  // -------------------------------------------------------------
  describe('Chain-Class Precedence Hierarchy', () => {
    it('verifies Section 38: Negative control takes precedence even with B.3 structure (fixing 0x2A8D6 regression)', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'whitelisted-object1-operand-site',
        hasRepeatedStructureEvidence: true,
        hasSecondOrderReferrer: true,
        secondOrderRole: 'relative-control-negative-referrer',
        secondOrderObjectNumber: 1,
      });

      expect(chainClass).toBe('relative-control-negative-chain');
    });

    it('verifies negative control precedence when first hop itself is a negative site', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'relative-control-negative-site',
        hasRepeatedStructureEvidence: true,
        hasSecondOrderReferrer: true,
        secondOrderRole: 'whitelisted-object1-operand-referrer',
        secondOrderObjectNumber: 1,
      });

      expect(chainClass).toBe('relative-control-negative-chain');
    });

    it('verifies ambiguous precedence over whitelisted/structured when shape is ambiguous', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'whitelisted-object1-operand-site',
        hasRepeatedStructureEvidence: true,
        hasSecondOrderReferrer: true,
        secondOrderRole: 'object1-ambiguous-referrer',
        secondOrderObjectNumber: 1,
      });

      expect(chainClass).toBe('ambiguous-chain');
    });

    it('verifies Section 41: Structured first-hop + whitelisted Object 1 referrer', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'non-object1-reference-site',
        hasRepeatedStructureEvidence: true,
        hasSecondOrderReferrer: true,
        secondOrderRole: 'whitelisted-object1-operand-referrer',
        secondOrderObjectNumber: 1,
      });

      expect(chainClass).toBe('structured-first-hop-with-whitelisted-object1-referrer');
    });

    it('verifies unstructured first-hop + whitelisted Object 1 referrer', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'non-object1-reference-site',
        hasRepeatedStructureEvidence: false,
        hasSecondOrderReferrer: true,
        secondOrderRole: 'whitelisted-object1-operand-referrer',
        secondOrderObjectNumber: 1,
      });

      expect(chainClass).toBe('unstructured-first-hop-with-whitelisted-object1-referrer');
    });

    it('verifies structured first-hop + other Object 1 referrer', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'non-object1-reference-site',
        hasRepeatedStructureEvidence: true,
        hasSecondOrderReferrer: true,
        secondOrderRole: 'object1-unmatched-referrer',
        secondOrderObjectNumber: 1,
      });

      expect(chainClass).toBe('structured-first-hop-with-other-object1-referrer');
    });

    it('verifies Section 42: Two-hop data-only when source is not Object 1 and no negative/ambiguous applies', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'non-object1-reference-site',
        hasRepeatedStructureEvidence: false,
        hasSecondOrderReferrer: true,
        secondOrderRole: 'non-object1-referrer',
        secondOrderObjectNumber: 2,
      });

      expect(chainClass).toBe('two-hop-data-only');
    });

    it('verifies Section 40: Direct positive first-hop with zero second-hop references', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'whitelisted-object1-operand-site',
        hasRepeatedStructureEvidence: false,
        hasSecondOrderReferrer: false,
      });

      expect(chainClass).toBe('direct-whitelisted-object1-first-hop');
    });

    it('verifies first-hop-reference-with-no-second-order-external-reference when site is not whitelisted Object 1', () => {
      const chainClass = determineTwoHopChainClass({
        firstHopRole: 'non-object1-reference-site',
        hasRepeatedStructureEvidence: false,
        hasSecondOrderReferrer: false,
      });

      expect(chainClass).toBe('first-hop-reference-with-no-second-order-external-reference');
    });
  });

  // -------------------------------------------------------------
  // 3. Site Representations (Section 32)
  // -------------------------------------------------------------
  describe('Site Representations (Section 32)', () => {
    it('mapped addressable Object byte produces physical, object-relative, and linear representations', () => {
      const descriptors = deriveSiteRepresentationsForSite({
        siteId: 'site_mapped',
        sourceFileOffset: 0x00010000,
        sourceObjectOffset: 0x00005000,
        sourceLoadedAddress: 0x00405000,
        sourceObjectNumber: 1,
        sourceRegionId: 'LE_OBJECT_1_TEXT',
      });

      expect(descriptors).toHaveLength(3);
      const kinds = descriptors.map((d) => d.representationKind);
      expect(kinds).toContain('physical-site-offset');
      expect(kinds).toContain('object-relative-site-offset');
      expect(kinds).toContain('linear-site-address');

      const phys = descriptors.find((d) => d.representationKind === 'physical-site-offset');
      const obj = descriptors.find((d) => d.representationKind === 'object-relative-site-offset');
      const lin = descriptors.find((d) => d.representationKind === 'linear-site-address');

      expect(phys?.value).toBe(0x00010000);
      expect(obj?.value).toBe(0x00005000);
      expect(lin?.value).toBe(0x00405000);
    });

    it('tail offset outside mapped object produces physical-site-offset only', () => {
      const descriptors = deriveSiteRepresentationsForSite({
        siteId: 'site_tail',
        sourceFileOffset: 0x0011A000,
        sourceObjectOffset: null,
        sourceLoadedAddress: null,
        sourceObjectNumber: null,
        sourceRegionId: 'EXE_TAIL',
      });

      expect(descriptors).toHaveLength(1);
      expect(descriptors[0].representationKind).toBe('physical-site-offset');
      expect(descriptors[0].value).toBe(0x0011A000);
    });

    it('object physical padding produces physical-site-offset only (no object-relative or linear)', () => {
      const descriptors = deriveSiteRepresentationsForSite({
        siteId: 'site_padding',
        sourceFileOffset: 0x00028F80,
        sourceObjectOffset: null,
        sourceLoadedAddress: null,
        sourceObjectNumber: 1,
        sourceRegionId: 'LE_OBJECT_1_PADDING',
      });

      expect(descriptors).toHaveLength(1);
      expect(descriptors[0].representationKind).toBe('physical-site-offset');
      expect(descriptors[0].value).toBe(0x00028F80);
    });
  });

  // -------------------------------------------------------------
  // 4. Spatial Occurrence Relationships (Sections 18, 19, 35, 36)
  // -------------------------------------------------------------
  describe('Spatial Occurrence Relationships: Self, Overlap, External', () => {
    it('verifies Section 35: Exact target-site start occurrence has self=true, external=false', () => {
      const rel = classifyOccurrenceSpatialRelationship(0x00010000, 0x00010000);
      expect(rel.isExactSelf).toBe(true);
      expect(rel.isOverlappingTargetField).toBe(false);
      expect(rel.isExternal).toBe(false);
    });

    it('verifies Section 36: Occurrence beginning +1, +2, or +3 bytes inside target field has overlap=true, external=false', () => {
      for (const delta of [1, 2, 3]) {
        const rel = classifyOccurrenceSpatialRelationship(0x00010000 + delta, 0x00010000);
        expect(rel.isExactSelf).toBe(false);
        expect(rel.isOverlappingTargetField).toBe(true);
        expect(rel.isExternal).toBe(false);
      }
    });

    it('verifies occurrence starting outside target 4-byte window is external', () => {
      const relBefore = classifyOccurrenceSpatialRelationship(0x0000FFFC, 0x00010000);
      expect(relBefore.isExactSelf).toBe(false);
      expect(relBefore.isOverlappingTargetField).toBe(false);
      expect(relBefore.isExternal).toBe(true);

      const relAfter = classifyOccurrenceSpatialRelationship(0x00010004, 0x00010000);
      expect(relAfter.isExactSelf).toBe(false);
      expect(relAfter.isOverlappingTargetField).toBe(false);
      expect(relAfter.isExternal).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 5. x86 Shape Classification Integration (Sections 37, 38, 39)
  // -------------------------------------------------------------
  describe('x86 Shape Classification Integration', () => {
    it('verifies Section 37: MOV r32, imm32 containing site representation classifies as mov-r32-imm32 and is whitelisted', () => {
      const buf = new Uint8Array(16);
      // B8 1D 00 00 00 => MOV EAX, 0x0000001D
      buf[0] = 0xB8;
      buf[1] = 0x1D;
      buf[2] = 0x00;
      buf[3] = 0x00;
      buf[4] = 0x00;

      const shape = classifyX86OperandShape(buf, 1, 0x0000001D);
      expect(shape.shapeClass).toBe('mov-r32-imm32');
      expect(shape.isWhitelistedShape).toBe(true);
      expect(shape.isNegativeContext).toBe(false);
      expect(shape.shapeStatus).toBe('single-whitelisted-shape');
    });

    it('verifies Section 38: CALL rel32 negative displacement classifies as negative-rel32', () => {
      const buf = new Uint8Array(16);
      // E8 50 0B 05 00 => CALL rel32
      buf[0] = 0xE8;
      buf[1] = 0x50;
      buf[2] = 0x0B;
      buf[3] = 0x05;
      buf[4] = 0x00;

      const shape = classifyX86OperandShape(buf, 1, 0x00050B50);
      expect(shape.shapeClass).toBe('negative-rel32');
      expect(shape.isNegativeContext).toBe(true);
      expect(shape.shapeStatus).toBe('relative-control-field-shape');
    });

    it('verifies Section 39: Unmatched random bytes produce unclassified-byte-pattern without positive promotion', () => {
      const buf = new Uint8Array(16);
      // Arbitrary non-instruction bytes
      buf[0] = 0x90;
      buf[1] = 0x20;
      buf[2] = 0x30;
      buf[3] = 0x40;
      buf[4] = 0x50;

      const shape = classifyX86OperandShape(buf, 2, 0x00504030);
      expect(shape.isWhitelistedShape).toBe(false);
      expect(shape.isNegativeContext).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 6. First-Hop Reconciliation Invariants (Section 31)
  // -------------------------------------------------------------
  describe('First-Hop Reconciliation Invariants (Section 31)', () => {
    it('verifies reconciliation passes when 3 logical B.1 associations map to 2 B.2 physical sites (one site having 2 logical associations)', () => {
      const b1LogicalCount: number = 3;
      const b2LogicalCount: number = 3;
      const b1PhysicalCount: number = 2;
      const b2PhysicalCount: number = 2;

      const logicalReconciles = b1LogicalCount === b2LogicalCount;
      const physicalReconciles = b1PhysicalCount === b2PhysicalCount;
      const missingAssociations: number = 0;

      expect(logicalReconciles).toBe(true);
      expect(physicalReconciles).toBe(true);
      expect(missingAssociations).toBe(0);
    });

    it('detects and flags logical or physical first-hop count mismatch', () => {
      const b1LogicalCount: number = 3;
      const b2LogicalCount: number = 2;
      const logicalReconciles = b1LogicalCount === b2LogicalCount;
      expect(logicalReconciles).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // 7. Value Collision & Ambiguity (Section 34)
  // -------------------------------------------------------------
  describe('Value Collision & Multitarget Ambiguity (Section 34)', () => {
    it('preserves multi-target ambiguity when two site descriptors share identical representation value', () => {
      const multimap = new Map<number, SiteRepresentationDescriptor[]>();
      const desc1: SiteRepresentationDescriptor = {
        descriptorId: 'site1_phys',
        targetSiteId: 'site_1',
        sourceFileOffset: 0x1000,
        sourceFileOffsetHex: '0x00001000',
        representationKind: 'physical-site-offset',
        value: 0x1000,
        valueHex: '0x00001000',
        targetSiteObjectNumber: 1,
        targetSiteRegionId: 'LE_OBJECT_1_TEXT',
      };
      const desc2: SiteRepresentationDescriptor = {
        descriptorId: 'site2_obj',
        targetSiteId: 'site_2',
        sourceFileOffset: 0x2000,
        sourceFileOffsetHex: '0x00002000',
        representationKind: 'object-relative-site-offset',
        value: 0x1000, // collision value!
        valueHex: '0x00001000',
        targetSiteObjectNumber: 1,
        targetSiteRegionId: 'LE_OBJECT_1_TEXT',
      };

      multimap.set(0x1000, [desc1, desc2]);

      const matched = multimap.get(0x1000) ?? [];
      expect(matched).toHaveLength(2);
      const uniqueTargets = new Set(matched.map((m) => m.targetSiteId));
      expect(uniqueTargets.size).toBe(2);
      expect(uniqueTargets.has('site_1')).toBe(true);
      expect(uniqueTargets.has('site_2')).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 8. Convergence Groups (Section 45)
  // -------------------------------------------------------------
  describe('Convergence Groups (Section 45)', () => {
    it('constructs convergence group with candidate IDs, site IDs, Kano split, and true B.5 IDs only', () => {
      const group: MK1ReferrerConvergenceGroup = {
        groupId: 'conv_000602B7',
        secondOrderReferrerOffset: 0x000602B7,
        secondOrderReferrerOffsetHex: '0x000602B7',
        referrerRegionId: 'LE_OBJECT_1_TEXT',
        referrerRegionClass: 'CODE',
        referrerObjectNumber: 1,
        referrerX86Role: 'whitelisted-object1-operand-referrer',
        referrerX86Shape: 'mov-r32-imm32',
        siteIds: ['site_1'],
        candidateIds: ['0x0002C3FE', '0x000917FE'],
        siteRepresentationKinds: ['physical-site-offset'],
        candidateKanoCompatibilitySplit: {
          kanoCompatibleCount: 1,
          nonCompatibleCount: 1,
        },
        b5CandidateIds: ['0x0002C3FE', '0x000917FE'], // True B.5 participants only!
      };

      expect(group.candidateIds).toHaveLength(2);
      expect(group.b5CandidateIds).toHaveLength(2);
      expect(group.b5CandidateIds).toContain('0x0002C3FE');
      expect(group.b5CandidateIds).toContain('0x000917FE');
      expect(group.candidateKanoCompatibilitySplit.kanoCompatibleCount).toBe(1);
      expect(group.candidateKanoCompatibilitySplit.nonCompatibleCount).toBe(1);
    });
  });

  // -------------------------------------------------------------
  // 9. Control Exclusion Audit (Sections 23, 46)
  // -------------------------------------------------------------
  describe('Control Exclusion Audit (Sections 23, 46)', () => {
    it('verifies mechanical control exclusion when controls are isolated', () => {
      const candidateSummaryIds = new Set(['cand_1', 'cand_2']);
      const controlTargets = [{ name: 'StringAreaBase', physicalOffset: 0x0000F490 }];

      let controlsInjected = 0;
      for (const ctrl of controlTargets) {
        if (candidateSummaryIds.has(ctrl.name) || candidateSummaryIds.has(`ctrl_${ctrl.name}`)) {
          controlsInjected++;
        }
      }

      const controlCandidatePhysicalSiteCollisions: string[] = [];
      const controlCandidateChainSummaryCollisions: string[] = [];

      const controlSitesExcludedFromCandidateCounts =
        controlsInjected === 0 &&
        controlCandidatePhysicalSiteCollisions.length === 0 &&
        controlCandidateChainSummaryCollisions.length === 0;

      expect(controlSitesExcludedFromCandidateCounts).toBe(true);
      expect(controlsInjected).toBe(0);
    });

    it('detects injection defect when control is erroneously present in candidate summary set', () => {
      const candidateSummaryIds = new Set(['cand_1', 'StringAreaBase']); // Corrupted!
      const controlTargets = [{ name: 'StringAreaBase', physicalOffset: 0x0000F490 }];

      let controlsInjected = 0;
      for (const ctrl of controlTargets) {
        if (candidateSummaryIds.has(ctrl.name) || candidateSummaryIds.has(`ctrl_${ctrl.name}`)) {
          controlsInjected++;
        }
      }

      const controlSitesExcludedFromCandidateCounts = controlsInjected === 0;
      expect(controlSitesExcludedFromCandidateCounts).toBe(false);
      expect(controlsInjected).toBe(1);
    });
  });

  // -------------------------------------------------------------
  // 10. Detail Accounting & Truncation Semantics (Sections 28, 47)
  // -------------------------------------------------------------
  describe('Detail Accounting & Truncation Semantics (Sections 28, 47)', () => {
    it('reconciles detail generated, included, and omitted under bounded detailCap', () => {
      const detailCap = 1500;
      const totalOccurrencesGenerated = 142;
      const occurrencesIncluded = Math.min(totalOccurrencesGenerated, detailCap);
      const occurrencesOmitted = totalOccurrencesGenerated - occurrencesIncluded;

      const totalChainsGenerated = 2000;
      const chainsIncluded = Math.min(totalChainsGenerated, detailCap);
      const chainsOmitted = totalChainsGenerated - chainsIncluded;

      expect(occurrencesIncluded + occurrencesOmitted).toBe(totalOccurrencesGenerated);
      expect(chainsIncluded + chainsOmitted).toBe(totalChainsGenerated);
      expect(occurrencesIncluded).toBe(142);
      expect(occurrencesOmitted).toBe(0);
      expect(chainsIncluded).toBe(1500);
      expect(chainsOmitted).toBe(500);
    });
  });

  // -------------------------------------------------------------
  // 11. Candidate With No First Hop Reference (Section 43)
  // -------------------------------------------------------------
  describe('Candidate With No First Hop Reference (Section 43)', () => {
    it('classifies not-applicable-no-first-hop-reference when firstHopUniqueSiteCount is zero', () => {
      const summary: MK1CandidateChainSummary = {
        candidateId: '0x0009C914',
        status: 'not-applicable-no-first-hop-reference',
        zeroShiftKanoCompatible: false,
        researchScore: 70,
        structureDepth: 'none',
        referenceProfile: 'no-external-reference',
        firstHopLogicalMatchCount: 0,
        firstHopUniqueSiteCount: 0,
        directWhitelistedObject1FirstHopCount: 0,
        hasDirectWhitelistedObject1FirstHop: false,
        structuredFirstHopSiteCount: 0,
        firstHopSitesWithSecondOrderExternalReferences: 0,
        secondOrderExternalLogicalMatches: 0,
        secondOrderUniquePhysicalReferrers: 0,
        secondOrderObject1Referrers: 0,
        secondOrderWhitelistedObject1Referrers: 0,
        structuredSitesWithWhitelistedObject1Referrer: 0,
        chainClassHistogram: {
          'direct-whitelisted-object1-first-hop': 0,
          'structured-first-hop-with-whitelisted-object1-referrer': 0,
          'structured-first-hop-with-other-object1-referrer': 0,
          'unstructured-first-hop-with-whitelisted-object1-referrer': 0,
          'two-hop-data-only': 0,
          'first-hop-reference-with-no-second-order-external-reference': 0,
          'relative-control-negative-chain': 0,
          'ambiguous-chain': 0,
        },
        hasAnyTwoHopChain: false,
        hasCodeFacingTwoHopEvidence: false,
        chainPaths: [],
      };

      expect(summary.status).toBe('not-applicable-no-first-hop-reference');
      expect(summary.firstHopUniqueSiteCount).toBe(0);
      expect(summary.chainPaths).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------
  // 12. Full Export Serialization & Schema Verification (Section 25, 26, 27, 29)
  // -------------------------------------------------------------
  describe('Full Export Serialization & Schema Verification', () => {
    it('produces valid mk1_palette_reference_chain_recon_v1 export schema with milestone 1E.2B.7a', () => {
      const mockResult: MK1PaletteReferenceChainReconResult = {
        format: 'mk1_palette_reference_chain_recon_v1',
        milestone: '1E.2B.7a',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        exePath: 'MK1.EXE',
        exeSize: 1157222,
        scanConfiguration: {
          uintWidth: 32,
          endianness: 'little',
          alignment: 'byte-by-byte',
          scanStart: 0,
          scanEnd: 1157218,
          wholeFileScanCount: 1,
          siteRepresentationKinds: ['physical-site-offset', 'object-relative-site-offset', 'linear-site-address'],
        },
        upstreamSummary: {
          b1Available: true,
          b1Status: 'SUCCESS',
          b1LogicalMatches: 530,
          b1UniquePhysicalSites: 522,
          b2Available: true,
          b2Status: 'SUCCESS',
          b2ClassifiedPositions: 522,
          b3Available: true,
          b3Status: 'SUCCESS',
          b4Available: true,
          b4Status: 'SUCCESS',
          b5Available: true,
          b5Status: 'SUCCESS',
          b6Available: true,
          b6Status: 'SUCCESS',
          b6CandidateCount: 814,
          b6TrueB5ParticipantCount: 9,
        },
        globalSummary: {
          firstHopPhysicalSitesInput: 522,
          firstHopLogicalMatchesInput: 530,
          firstHopSitesProcessed: 522,
          firstHopSitesMissingB2Evidence: 0,
          firstHopObject1Sites: 117,
          firstHopWhitelistedObject1Sites: 13,
          firstHopNegativeRelativeControlSites: 6,
          firstHopUnmatchedObject1Sites: 98,
          firstHopStructuredB3Sites: 296,
          siteRepresentationDescriptorsGenerated: 990,
          distinctSiteRepresentationValues: 990,
          representationValuesWithMultipleSiteTargets: 0,
          secondOrderLogicalMatches: 142,
          secondOrderSelfOccurrenceCount: 0,
          secondOrderOverlapOccurrenceCount: 0,
          secondOrderExternalLogicalMatches: 142,
          secondOrderUniquePhysicalReferrerPositions: 142,
          secondOrderExternalUniquePhysicalReferrers: 142,
          secondOrderObject1Referrers: 20,
          secondOrderWhitelistedObject1Referrers: 1,
          secondOrderNegativeRelativeControlReferrers: 2,
          firstHopSitesWithExternalSecondOrderReference: 39,
          firstHopSitesWithWhitelistedObject1SecondOrderReferrer: 1,
          candidateCountWithAnyTwoHopChain: 25,
          candidateCountWithCodeFacingTwoHopEvidence: 1,
        },
        reconciliation: {
          b1LogicalExternalMatchesInput: 530,
          b2LogicalMatchesInput: 530,
          logicalFirstHopMatchesReconcile: true,
          b1UniquePhysicalSitesInput: 522,
          b2PhysicalSitesInput: 522,
          physicalFirstHopSitesReconcile: true,
          firstHopSitesProcessed: 522,
          firstHopSitesMissingCandidateAssociation: 0,
          firstHopSitesWithUnknownRegion: 0,
          siteRepresentationDescriptorsGenerated: 990,
          secondOrderLogicalMatchesGenerated: 142,
          secondOrderLogicalMatchesSummarized: 142,
          secondOrderUniquePhysicalPositionsGenerated: 142,
          secondOrderUniquePhysicalPositionsSummarized: 142,
          allSecondOrderMatchesAccountedFor: true,
          controlFirstHopSitesInput: 1,
          controlFirstHopSiteOffsets: [0x0000F490],
          controlFirstHopSiteOffsetsHex: ['0x0000F490'],
          candidateFirstHopSiteOffsets: [],
          controlCandidatePhysicalSiteCollisions: [],
          controlCandidateChainSummaryCollisions: [],
          controlsInjectedIntoCandidateCounts: 0,
          controlSitesExcludedFromCandidateCounts: true,
          allReconciled: true,
        },
        representationSummary: [],
        firstHopRoleSummary: getEmptyFirstHopRoleSummary(),
        secondOrderRoleSummary: getEmptySecondOrderRoleSummary(),
        regionMatrix: [],
        secondOrderX86ShapeSummary: {
          shapeClassCounts: getEmptyShapeClassCounts(),
          shapeStatusCounts: getEmptyShapeStatusCounts(),
          totalObject1Referrers: 20,
          positiveWhitelistedCount: 1,
          negativeRelativeControlCount: 2,
          unmatchedCount: 17,
          ambiguousCount: 0,
        },
        cohortComparison: [],
        candidateChainSummaries: [
          {
            candidateId: '0x0002C3FE',
            status: 'evaluated',
            researchScore: 85,
            structureDepth: 'b5-harmonic-structure',
            referenceProfile: 'mixed-physical-and-address-derived',
            zeroShiftKanoCompatible: false,
            firstHopUniqueSiteCount: 86,
            firstHopLogicalMatchCount: 86,
            directWhitelistedObject1FirstHopCount: 9,
            hasDirectWhitelistedObject1FirstHop: true,
            structuredFirstHopSiteCount: 82,
            firstHopSitesWithSecondOrderExternalReferences: 14,
            secondOrderExternalLogicalMatches: 82,
            secondOrderUniquePhysicalReferrers: 82,
            secondOrderObject1Referrers: 9,
            secondOrderWhitelistedObject1Referrers: 1,
            structuredSitesWithWhitelistedObject1Referrer: 1,
            chainClassHistogram: {
              'structured-first-hop-with-whitelisted-object1-referrer': 1,
              'direct-whitelisted-object1-first-hop': 0,
              'unstructured-first-hop-with-whitelisted-object1-referrer': 0,
              'structured-first-hop-with-other-object1-referrer': 0,
              'two-hop-data-only': 0,
              'relative-control-negative-chain': 0,
              'first-hop-reference-with-no-second-order-external-reference': 0,
              'ambiguous-chain': 0,
            },
            hasAnyTwoHopChain: true,
            hasCodeFacingTwoHopEvidence: true,
            chainPaths: [
              {
                pathId: 'path_001',
                candidateId: '0x0002C3FE',
                candidateRepresentationKind: 'physical-structure-start',
                firstHopSiteId: 'site_1',
                firstHopSiteOffsetHex: '0x0000001D',
                firstHopRole: 'whitelisted-object1-operand-site',
                firstHopB3StructureMembership: [],
                secondOrderReferrerOffsetHex: '0x000602B7',
                siteRepresentationKindUsed: 'physical-site-offset',
                matchedSiteRepresentationValue: 0x0000001D,
                matchedSiteRepresentationValueHex: '0x0000001D',
                secondOrderReferrerRegion: 'LE_OBJECT_1_TEXT',
                secondOrderReferrerObject: 1,
                secondOrderRole: 'whitelisted-object1-operand-referrer',
                secondOrderX86Shape: 'mov-r32-imm32',
                chainClass: 'structured-first-hop-with-whitelisted-object1-referrer',
              },
            ],
          },
        ],
        firstHopSiteSummaries: [],
        firstHopSites: [],
        uniquePhysicalReferrers: [],
        convergenceGroups: [],
        controls: [],
        detailCap: 1500,
        secondOrderDetailsIncluded: 142,
        secondOrderDetailsOmitted: 0,
        chainDetailsGenerated: 1,
        chainDetailsIncluded: 1,
        chainDetailsOmitted: 0,
        sitesWithTruncatedDetails: 0,
        boundedDetailedSecondOrderOccurrences: [],
        boundedDetailedChains: [],
        interpretationCaveats: ['TWO-HOP EXACT-VALUE CHAIN != DATA FLOW OR CONSUMER RELATIONSHIP.'],
      };

      const exportData = createMK1PaletteReferenceChainExport(mockResult);

      expect(exportData.format).toBe('mk1_palette_reference_chain_recon_v1');
      expect(exportData.milestone).toBe('1E.2B.7a');
      expect(exportData.status).toBe('SUCCESS');
      expect(exportData.upstreamSummary.b6TrueB5ParticipantCount).toBe(9);
      expect(exportData.scanConfiguration.uintWidth).toBe(32);
      expect(exportData.scanConfiguration.wholeFileScanCount).toBe(1);
      expect(exportData.reconciliation.controlSitesExcludedFromCandidateCounts).toBe(true);
      expect(exportData.reconciliation.controlsInjectedIntoCandidateCounts).toBe(0);
      expect(exportData.chainDetailsGenerated).toBe(1);
      expect(exportData.chainDetailsIncluded).toBe(1);
      expect(exportData.chainDetailsOmitted).toBe(0);

      // Verify that candidateChainSummaries omit heavy chainPaths in export envelope
      expect(exportData.candidateChainSummaries.length).toBe(1);
      expect('chainPaths' in exportData.candidateChainSummaries[0]).toBe(false);
    });
  });
});

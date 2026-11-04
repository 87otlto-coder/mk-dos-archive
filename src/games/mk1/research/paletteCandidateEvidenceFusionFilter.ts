/**
 * Palette Candidate Evidence Fusion Filter Helpers (Milestone 1E.2B.6b)
 *
 * Pure filter and search composition logic for candidate evidence profiles.
 * Implements strict logical AND composition across all active filter dimensions.
 */

import {
  CandidateReferenceProfile,
  MK1PaletteCandidateEvidenceProfile,
  StructureDepthLevel,
} from './paletteCandidateEvidenceFusionTypes';

export type KanoFilterOption = 'all' | 'yes' | 'no';
export type ExternalReferenceFilterOption = 'all' | 'active' | 'none';
export type ReferenceProfileFilterOption =
  | 'all'
  | CandidateReferenceProfile;
export type TargetObjectFilterOption = 'all' | 'Object 1' | 'Object 2' | 'unmapped';
export type VeryShortFilterOption = 'all' | 'yes' | 'no';
export type StructureDepthFilterOption = 'all' | StructureDepthLevel;

export interface PaletteEvidenceFusionFilterCriteria {
  kanoCompatibility?: KanoFilterOption;
  externalReference?: ExternalReferenceFilterOption;
  referenceProfile?: ReferenceProfileFilterOption;
  targetRegion?: string;
  targetObject?: TargetObjectFilterOption;
  veryShort?: VeryShortFilterOption;
  structureDepth?: StructureDepthFilterOption;
  evidenceFlag?: string;
  searchTerm?: string;
}

/**
 * Evaluates whether a candidate profile matches the given search term.
 * Matches:
 * - candidate ID
 * - hex offset
 * - content hash
 * - target region ID
 * - target region class
 * Case-insensitive.
 */
export function matchesCandidateSearch(
  profile: MK1PaletteCandidateEvidenceProfile,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (profile.candidateId.toLowerCase().includes(q)) return true;
  if (profile.intrinsic.byteStartHex.toLowerCase().includes(q)) return true;
  if (profile.intrinsic.byteEndHex.toLowerCase().includes(q)) return true;
  if (profile.provenance.contentHash.toLowerCase().includes(q)) return true;
  if (profile.topology.targetRegionId.toLowerCase().includes(q)) return true;
  if (profile.topology.targetRegionClass.toLowerCase().includes(q)) return true;

  return false;
}

/**
 * Filters a list of candidate evidence profiles against multiple criteria using logical AND composition.
 */
export function filterCandidateProfiles(
  profiles: MK1PaletteCandidateEvidenceProfile[],
  criteria: PaletteEvidenceFusionFilterCriteria
): MK1PaletteCandidateEvidenceProfile[] {
  return profiles.filter((p) => {
    // 1. Kano compatibility
    if (criteria.kanoCompatibility && criteria.kanoCompatibility !== 'all') {
      if (criteria.kanoCompatibility === 'yes' && !p.intrinsic.zeroShiftKanoCompatible) {
        return false;
      }
      if (criteria.kanoCompatibility === 'no' && p.intrinsic.zeroShiftKanoCompatible) {
        return false;
      }
    }

    // 2. External reference
    if (criteria.externalReference && criteria.externalReference !== 'all') {
      if (criteria.externalReference === 'active' && !p.mechanicalFlags.hasExternalReferences) {
        return false;
      }
      if (criteria.externalReference === 'none' && p.mechanicalFlags.hasExternalReferences) {
        return false;
      }
    }

    // 3. Reference profile
    if (criteria.referenceProfile && criteria.referenceProfile !== 'all') {
      if (p.exactReference.referenceProfile !== criteria.referenceProfile) {
        return false;
      }
    }

    // 4. Target region
    if (criteria.targetRegion && criteria.targetRegion !== 'all') {
      if (p.topology.targetRegionId !== criteria.targetRegion) {
        return false;
      }
    }

    // 5. Target object
    if (criteria.targetObject && criteria.targetObject !== 'all') {
      if (criteria.targetObject === 'Object 1' && p.topology.targetObjectNumber !== 1) {
        return false;
      }
      if (criteria.targetObject === 'Object 2' && p.topology.targetObjectNumber !== 2) {
        return false;
      }
      if (criteria.targetObject === 'unmapped' && p.topology.targetObjectNumber !== null) {
        return false;
      }
    }

    // 6. Very short (length <= 3)
    if (criteria.veryShort && criteria.veryShort !== 'all') {
      if (criteria.veryShort === 'yes' && !p.mechanicalFlags.isVeryShortCandidate) {
        return false;
      }
      if (criteria.veryShort === 'no' && p.mechanicalFlags.isVeryShortCandidate) {
        return false;
      }
    }

    // 7. Structure depth
    if (criteria.structureDepth && criteria.structureDepth !== 'all') {
      if (p.structureDepth !== criteria.structureDepth) {
        return false;
      }
    }

    // 8. Evidence / tension flag
    if (criteria.evidenceFlag && criteria.evidenceFlag !== 'all') {
      const flag = criteria.evidenceFlag;
      const inTension = flag in p.tensionFlags && p.tensionFlags[flag as keyof typeof p.tensionFlags] === true;
      const inMechanical =
        flag in p.mechanicalFlags && p.mechanicalFlags[flag as keyof typeof p.mechanicalFlags] === true;
      const isContentDuplicate = flag === 'isContentDuplicate' && p.provenance.isContentDuplicate;

      if (!inTension && !inMechanical && !isContentDuplicate) {
        return false;
      }
    }

    // 9. Search term
    if (criteria.searchTerm && criteria.searchTerm.trim() !== '') {
      if (!matchesCandidateSearch(p, criteria.searchTerm)) {
        return false;
      }
    }

    return true;
  });
}

import { InventoryEntry } from '../models/InventoryEntry';
import {
  GameDetectionResult,
  DetectionConfidenceLevel,
} from '../models/GameDetection';
import { evaluateMK1Detection } from '../../games/mk1/detection';
import { evaluateMK2Detection } from '../../games/mk2/detection';
import { evaluateMK3Detection } from '../../games/mk3/detection';

/**
 * Runs all game detectors against inventory entries and computes evidence-based detection result.
 */
export function detectGameFromInventory(
  entries: InventoryEntry[],
): GameDetectionResult {
  if (!entries || entries.length === 0) {
    return {
      game: 'unknown',
      gameName: 'Unknown Game Directory',
      confidence: 'unknown',
      evidence: [
        {
          description: 'No files present in directory to analyze',
          weight: 0,
          status: 'unknown',
        },
      ],
      score: 0,
    };
  }

  const eval1 = evaluateMK1Detection(entries);
  const eval2 = evaluateMK2Detection(entries);
  const eval3 = evaluateMK3Detection(entries);

  // Check for ambiguous / mixed directory (multiple conflicting primary executables)
  const primariesFound = [
    eval1.hasPrimaryExecutable ? 'MK1 (MK1.EXE / MK.EXE)' : null,
    eval2.hasPrimaryExecutable ? 'MK2 (MK2.EXE)' : null,
    eval3.hasPrimaryExecutable ? 'MK3 (MK3.EXE)' : null,
  ].filter(Boolean) as string[];

  if (primariesFound.length > 1) {
    return {
      game: 'unknown',
      gameName: 'Ambiguous / Mixed MK Directory',
      confidence: 'unknown',
      evidence: [
        {
          description: `Detected conflicting primary executables for multiple games: ${primariesFound.join(', ')}`,
          weight: 0,
          status: 'inferred',
        },
        {
          description:
            'Directory appears to be a parent collection or mixed folder. Please select a specific game installation directory.',
          weight: 0,
          status: 'inferred',
        },
        ...eval1.evidence.slice(0, 2),
        ...eval2.evidence.slice(0, 2),
        ...eval3.evidence.slice(0, 2),
      ],
      score: 0,
    };
  }

  const evaluations = [eval1, eval2, eval3].sort((a, b) => b.score - a.score);
  const best = evaluations[0];

  if (best.score < 15) {
    return {
      game: 'unknown',
      gameName: 'Unknown / Unrecognized DOS Game',
      confidence: 'unknown',
      evidence:
        best.evidence.length > 0
          ? best.evidence
          : [
              {
                description:
                  'Directory does not contain recognized Mortal Kombat DOS executables or resource fingerprints',
                weight: 0,
                status: 'unknown',
              },
            ],
      score: best.score,
    };
  }

  // Determine confidence level:
  // High confidence strictly requires BOTH primary executable AND supporting resource cluster (score >= 50)
  let confidence: DetectionConfidenceLevel = 'low';
  const verifiedEvidenceCount = best.evidence.filter(
    (e) => e.status === 'verified',
  ).length;

  if (best.score >= 50 && best.hasPrimaryExecutable && verifiedEvidenceCount >= 2) {
    confidence = 'high';
  } else if (best.score >= 30 || best.hasPrimaryExecutable) {
    confidence = 'medium';
  }

  return {
    game: best.gameId,
    gameName: best.gameName,
    confidence,
    evidence: best.evidence,
    score: best.score,
  };
}

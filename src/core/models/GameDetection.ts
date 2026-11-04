import { ResearchConfidence } from './InventoryEntry';

export type DetectedGameId = 'mk1' | 'mk2' | 'mk3' | 'unknown';

export type DetectionConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface DetectionEvidence {
  description: string;
  weight: number;
  status: ResearchConfidence;
}

export interface GameDetectionResult {
  game: DetectedGameId;
  gameName: string;
  confidence: DetectionConfidenceLevel;
  evidence: DetectionEvidence[];
  score: number;
}

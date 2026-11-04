import { InventoryEntry } from '../../core/models/InventoryEntry';
import { DetectionEvidence } from '../../core/models/GameDetection';

export interface GameDetectorEvaluation {
  gameId: 'mk1';
  gameName: string;
  score: number;
  evidence: DetectionEvidence[];
  hasPrimaryExecutable: boolean;
}

const VERIFIED_MK1_GRAPHICS = [
  'ACT1HDRS.GRA',
  'KANO.GRA',
  'RAIDEN.GRA',
  'NINJA.GRA',
  'JCATT.GRA',
  'T1HDRS.GRA',
  'T2HDRS.GRA',
  'GORO.GRA',
  'TSUNG.GRA',
  'REPTILE.GRA',
  'CAGE.GRA',
  'SONYA.GRA',
  'LIUKANG.GRA',
];

/**
 * Evaluates inventory entries against verified Mortal Kombat (DOS) fixture fingerprints.
 */
export function evaluateMK1Detection(
  entries: InventoryEntry[],
): GameDetectorEvaluation {
  const evidence: DetectionEvidence[] = [];
  let score = 0;

  const namesUpper = entries.map((e) => e.name.toUpperCase());
  const pathsUpper = entries.map((e) => e.path.toUpperCase());
  const executables = entries.filter((e) => e.classification === 'executable');

  // 1. Primary Executable Check
  const mk1Exe = executables.find((e) => {
    const uName = e.name.toUpperCase();
    return uName === 'MK1.EXE' || uName === 'MK.EXE';
  });

  const hasPrimaryExecutable = Boolean(mk1Exe);

  if (mk1Exe) {
    const uName = mk1Exe.name.toUpperCase();
    evidence.push({
      description: `Discovered primary MK1 executable: ${uName}`,
      weight: 25,
      status: 'verified',
    });
    score += 25;

    // Extended signature verification
    if (mk1Exe.signature.kind.includes('DOS MZ')) {
      evidence.push({
        description: `Executable ${uName} exhibits verified DOS executable signature (${mk1Exe.signature.kind})`,
        weight: 10,
        status: 'verified',
      });
      score += 10;
    }

    // Observed fixture exact executable size check (1,157,222 bytes)
    if (mk1Exe.size === 1157222) {
      evidence.push({
        description: `Executable ${uName} exactly matches verified MK1 DOS fixture executable size (1,157,222 bytes)`,
        weight: 10,
        status: 'verified',
      });
      score += 10;
    }
  }

  // 2. Verified MK1 Graphics Cluster (GRAPHICS/*.GRA)
  const matchedGraphics = namesUpper.filter((name) =>
    VERIFIED_MK1_GRAPHICS.includes(name),
  );

  if (matchedGraphics.length > 0) {
    const sampleNames = matchedGraphics.slice(0, 4).join(', ');
    const moreSuffix = matchedGraphics.length > 4 ? ` (+${matchedGraphics.length - 4} more)` : '';
    const isVerifiedCluster = matchedGraphics.length >= 3;

    evidence.push({
      description: `Found ${matchedGraphics.length} verified MK1 graphics resource candidate(s): ${sampleNames}${moreSuffix}`,
      weight: Math.min(30, matchedGraphics.length * 6),
      status: isVerifiedCluster ? 'verified' : 'inferred',
    });
    score += Math.min(30, matchedGraphics.length * 6);
  }

  // Check for GRAPHICS/ or SFX/ directory structure
  const hasGraphicsDir = pathsUpper.some((p) => p.startsWith('GRAPHICS/'));
  const hasSfxDir = pathsUpper.some((p) => p.startsWith('SFX/'));

  if (hasGraphicsDir) {
    evidence.push({
      description: 'Directory layout contains GRAPHICS/ subdirectory characteristic of MK1 DOS',
      weight: 15,
      status: 'verified',
    });
    score += 15;
  }

  if (hasSfxDir) {
    evidence.push({
      description: 'Directory layout contains SFX/ subdirectory characteristic of MK1 DOS',
      weight: 10,
      status: 'verified',
    });
    score += 10;
  }

  // 3. Supporting MK1 files (SAMPLES.DAT, SETSOUND.EXE, DOS4GW.EXE)
  if (namesUpper.includes('SAMPLES.DAT')) {
    evidence.push({
      description: 'Found SAMPLES.DAT audio package characteristic of MK1 DOS',
      weight: 10,
      status: 'verified',
    });
    score += 10;
  }

  // 4. Negative / Sequel conflict indicators
  const mk2Indicators = ['MK2.EXE', 'BARAKA.GRA', 'MILEENA.GRA', 'KUNGLAO.GRA', 'KINTARO.GRA'];
  const mk3Indicators = ['MK3.EXE', 'DATA.MK3', 'BLADE.FTR', 'CYRAX.GRA', 'SEKTOR.GRA'];

  const foundMk2 = namesUpper.filter((n) => mk2Indicators.includes(n));
  const foundMk3 = namesUpper.filter((n) => mk3Indicators.includes(n));

  if (foundMk2.length > 0 || foundMk3.length > 0) {
    const conflicts = [...foundMk2, ...foundMk3].join(', ');
    evidence.push({
      description: `Contains files associated with sequels (MK2/MK3): ${conflicts}; reducing MK1 score`,
      weight: -35,
      status: 'inferred',
    });
    score -= 35;
  }

  return {
    gameId: 'mk1',
    gameName: 'Mortal Kombat',
    score: Math.max(0, score),
    evidence,
    hasPrimaryExecutable,
  };
}

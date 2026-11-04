import { InventoryEntry } from '../../core/models/InventoryEntry';
import { DetectionEvidence } from '../../core/models/GameDetection';

export interface GameDetectorEvaluation {
  gameId: 'mk3';
  gameName: string;
  score: number;
  evidence: DetectionEvidence[];
  hasPrimaryExecutable: boolean;
}

const VERIFIED_MK3_FTR_FILES = [
  'BLADE.FTR',
  'INDIAN.FTR',
  'JAX.FTR',
  'KAHN.FTR',
  'KANG.FTR',
  'KANO.FTR',
  'LAO.FTR',
  'LIA.FTR',
  'MISC.FTR',
  'MOTARO.FTR',
  'ROBO.FTR',
  'SHANG.FTR',
  'SHEEVA.FTR',
  'STANCES.FTR',
  'SWAT.FTR',
  'TURK.FTR',
  'TUSK.FTR',
];

/**
 * Evaluates inventory entries against verified Mortal Kombat 3 (DOS) fixture fingerprints.
 */
export function evaluateMK3Detection(
  entries: InventoryEntry[],
): GameDetectorEvaluation {
  const evidence: DetectionEvidence[] = [];
  let score = 0;

  const namesUpper = entries.map((e) => e.name.toUpperCase());
  const pathsUpper = entries.map((e) => e.path.toUpperCase());
  const executables = entries.filter((e) => e.classification === 'executable');

  // 1. Primary Executable Check
  const mk3Exe = executables.find((e) => {
    const uName = e.name.toUpperCase();
    return (
      uName === 'MK3.EXE' ||
      uName === 'MK3DOS.EXE' ||
      uName === 'MK3CD.EXE' ||
      uName === 'MK3_32.EXE'
    );
  });

  const hasPrimaryExecutable = Boolean(mk3Exe);

  if (mk3Exe) {
    const uName = mk3Exe.name.toUpperCase();
    evidence.push({
      description: `Discovered primary MK3 executable: ${uName}`,
      weight: 25,
      status: 'verified',
    });
    score += 25;

    // 32-bit extender check (LE / PE)
    if (
      mk3Exe.signature.kind.includes('LE') ||
      mk3Exe.signature.kind.includes('PE')
    ) {
      evidence.push({
        description: `Executable ${uName} exhibits 32-bit protected-mode binary signature (${mk3Exe.signature.kind})`,
        weight: 15,
        status: 'verified',
      });
      score += 15;
    } else if (mk3Exe.signature.kind.includes('DOS MZ')) {
      evidence.push({
        description: `Executable ${uName} exhibits DOS MZ binary signature`,
        weight: 10,
        status: 'verified',
      });
      score += 10;
    }

    // Observed fixture exact executable size check (1,496,497 bytes)
    if (mk3Exe.size === 1496497) {
      evidence.push({
        description: `Executable ${uName} exactly matches verified MK3 DOS fixture executable size (1,496,497 bytes)`,
        weight: 10,
        status: 'verified',
      });
      score += 10;
    }
  }

  // 2. DATA.MK3 Container Check
  const dataMk3 = entries.find((e) => e.name.toUpperCase() === 'DATA.MK3');
  if (dataMk3) {
    const isForm = dataMk3.signature.kind.includes('FORM');
    evidence.push({
      description: `Found core MK3 data container: DATA.MK3${isForm ? ' (FORM container prefix verified)' : ''}`,
      weight: isForm ? 20 : 15,
      status: 'verified',
    });
    score += isForm ? 20 : 15;
  }

  // 3. Verified MK3 Fighter Archive Files (*.FTR with MFIL header)
  const matchedFtr = entries.filter((e) => {
    const uName = e.name.toUpperCase();
    return VERIFIED_MK3_FTR_FILES.includes(uName);
  });

  if (matchedFtr.length > 0) {
    const hasMfil = matchedFtr.some((f) => f.signature.kind.includes('MFIL'));
    const sampleNames = matchedFtr.slice(0, 4).map((f) => f.name).join(', ');
    const moreSuffix = matchedFtr.length > 4 ? ` (+${matchedFtr.length - 4} more)` : '';

    evidence.push({
      description: `Found ${matchedFtr.length} verified MK3 fighter container file(s): ${sampleNames}${moreSuffix}${hasMfil ? ' (MFIL header verified)' : ''}`,
      weight: Math.min(35, matchedFtr.length * 6),
      status: 'verified',
    });
    score += Math.min(35, matchedFtr.length * 6);
  }

  // 4. Optional CD / distribution packaging (OGG / CUE / IMAGE) — NOT required for detection, but noted as supporting
  const hasOggOrCue = pathsUpper.some((p) => p.endsWith('.OGG') || p.endsWith('.CUE'));
  if (hasOggOrCue) {
    evidence.push({
      description: 'Found distribution wrapper files (CD audio tracks / cue sheets)',
      weight: 5,
      status: 'inferred',
    });
    score += 5;
  }

  // 5. Negative checks against MK1/MK2
  const mk1SpecificFiles = ['MK1.EXE', 'GRAPHICS/ACT1HDRS.GRA', 'GRAPHICS/T1HDRS.GRA'];
  const mk2SpecificFiles = ['MK2.EXE', 'ARENA.GRA', 'BARAKA.GRA', 'MILEENA.GRA', 'KUNGLAO.GRA'];

  const foundMk1 = pathsUpper.filter((p) => mk1SpecificFiles.includes(p));
  const foundMk2 = namesUpper.filter((n) => mk2SpecificFiles.includes(n));

  if (foundMk1.length > 0 || foundMk2.length > 0) {
    const conflicts = [...foundMk1, ...foundMk2].join(', ');
    evidence.push({
      description: `Contains files associated with earlier MK titles: ${conflicts}; reducing MK3 score`,
      weight: -35,
      status: 'inferred',
    });
    score -= 35;
  }

  return {
    gameId: 'mk3',
    gameName: 'Mortal Kombat 3',
    score: Math.max(0, score),
    evidence,
    hasPrimaryExecutable,
  };
}

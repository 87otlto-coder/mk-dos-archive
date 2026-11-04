import { InventoryEntry } from '../../core/models/InventoryEntry';
import { DetectionEvidence } from '../../core/models/GameDetection';

export interface GameDetectorEvaluation {
  gameId: 'mk2';
  gameName: string;
  score: number;
  evidence: DetectionEvidence[];
  hasPrimaryExecutable: boolean;
}

const VERIFIED_MK2_ROOT_GRAPHICS = [
  'ARENA.GRA',
  'ARMORY.GRA',
  'BLOOD.GRA',
  'FOREST.GRA',
  'MOUNTAIN.GRA',
  'PIT.GRA',
  'PORTAL.GRA',
  'JC0.GRA',
  'JX0.GRA',
  'LK0.GRA',
  'NJ0.GRA',
  'BARAKA.GRA',
  'MILEENA.GRA',
  'KITANA.GRA',
  'KUNGLAO.GRA',
  'KINTARO.GRA',
  'SHAOKAHN.GRA',
  'SHANG.GRA',
  'SMOKE.GRA',
  'JADE.GRA',
  'NOOB.GRA',
];

/**
 * Evaluates inventory entries against verified Mortal Kombat II (DOS) fixture fingerprints.
 */
export function evaluateMK2Detection(
  entries: InventoryEntry[],
): GameDetectorEvaluation {
  const evidence: DetectionEvidence[] = [];
  let score = 0;

  const namesUpper = entries.map((e) => e.name.toUpperCase());
  const pathsUpper = entries.map((e) => e.path.toUpperCase());
  const executables = entries.filter((e) => e.classification === 'executable');

  // 1. Primary Executable Check
  const mk2Exe = executables.find((e) => {
    const uName = e.name.toUpperCase();
    return uName === 'MK2.EXE' || uName === 'MK2DOS.EXE';
  });

  const hasPrimaryExecutable = Boolean(mk2Exe);

  if (mk2Exe) {
    const uName = mk2Exe.name.toUpperCase();
    evidence.push({
      description: `Discovered primary MK2 executable: ${uName}`,
      weight: 25,
      status: 'verified',
    });
    score += 25;

    // Watcom LE header check
    if (mk2Exe.signature.kind.includes('LE')) {
      evidence.push({
        description: `Executable ${uName} exhibits Watcom Linear Executable (LE/DOS4GW) 32-bit extender header`,
        weight: 15,
        status: 'verified',
      });
      score += 15;
    } else if (mk2Exe.signature.kind.includes('DOS MZ')) {
      evidence.push({
        description: `Executable ${uName} exhibits DOS MZ binary signature`,
        weight: 10,
        status: 'verified',
      });
      score += 10;
    }

    // Observed fixture exact executable size check (861,133 bytes)
    if (mk2Exe.size === 861133) {
      evidence.push({
        description: `Executable ${uName} exactly matches verified MK2 DOS fixture executable size (861,133 bytes)`,
        weight: 10,
        status: 'verified',
      });
      score += 10;
    }
  }

  // 2. Verified MK2 Graphic Resources (*.GRA in root)
  const matchedGraphics = namesUpper.filter((name) =>
    VERIFIED_MK2_ROOT_GRAPHICS.includes(name),
  );

  if (matchedGraphics.length > 0) {
    const sampleNames = matchedGraphics.slice(0, 4).join(', ');
    const moreSuffix = matchedGraphics.length > 4 ? ` (+${matchedGraphics.length - 4} more)` : '';
    const isVerifiedCluster = matchedGraphics.length >= 3;

    evidence.push({
      description: `Found ${matchedGraphics.length} verified MK2 graphics resource candidate(s): ${sampleNames}${moreSuffix}`,
      weight: Math.min(30, matchedGraphics.length * 6),
      status: isVerifiedCluster ? 'verified' : 'inferred',
    });
    score += Math.min(30, matchedGraphics.length * 6);
  }

  // 3. MK2 Sound & FX resource families (fx/*.u8 and sound/* multi-extension files)
  const u8Count = entries.filter((e) => e.extension.toUpperCase() === 'U8' || e.path.toUpperCase().startsWith('FX/')).length;
  if (u8Count > 0) {
    evidence.push({
      description: `Found ${u8Count} MK2 sound / voice sample file(s) in fx/*.u8 structure`,
      weight: 15,
      status: 'verified',
    });
    score += 15;
  }

  const soundMultiExt = pathsUpper.filter(
    (p) =>
      p.startsWith('SOUND/') &&
      (p.endsWith('.AWE') ||
        p.endsWith('.GVS') ||
        p.endsWith('.LAP') ||
        p.endsWith('.MID') ||
        p.endsWith('.SBL')),
  );

  if (soundMultiExt.length > 0) {
    evidence.push({
      description: `Found ${soundMultiExt.length} MK2 hardware-specific sound stem file(s) in sound/ (*.AWE, *.GVS, *.LAP, *.MID, *.SBL)`,
      weight: 15,
      status: 'verified',
    });
    score += 15;
  }

  // 4. Negative checks against MK1/MK3
  const mk3Indicators = ['MK3.EXE', 'DATA.MK3', 'BLADE.FTR', 'CYRAX.GRA', 'SEKTOR.GRA', 'ROBO.FTR'];
  const mk1SpecificFiles = ['MK1.EXE', 'GRAPHICS/ACT1HDRS.GRA', 'GRAPHICS/T1HDRS.GRA'];

  const foundMk3 = namesUpper.filter((n) => mk3Indicators.includes(n));
  const foundMk1 = pathsUpper.filter((p) => mk1SpecificFiles.includes(p));

  if (foundMk3.length > 0 || foundMk1.length > 0) {
    const conflicts = [...foundMk3, ...foundMk1].join(', ');
    evidence.push({
      description: `Contains files associated with other MK versions: ${conflicts}; reducing MK2 score`,
      weight: -35,
      status: 'inferred',
    });
    score -= 35;
  }

  return {
    gameId: 'mk2',
    gameName: 'Mortal Kombat II',
    score: Math.max(0, score),
    evidence,
    hasPrimaryExecutable,
  };
}

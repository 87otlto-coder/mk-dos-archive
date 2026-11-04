import { NegativeControlRepeatedStructureSummary } from '../games/mk1/research/paletteRepeatedStructureTypes';

export type B3RepeatedContextStatus =
  NegativeControlRepeatedStructureSummary['B3RepeatedContextStatus'];

export interface NegativeControlBadgeInfo {
  label: string;
  className: string;
  status: B3RepeatedContextStatus;
  isContradiction: boolean;
  isConfirmedZero: boolean;
}

/**
 * Returns typed visual badge properties for negative control verification based strictly
 * on the engine's dynamic B3RepeatedContextStatus.
 */
export function getNegativeControlBadgeInfo(status: B3RepeatedContextStatus): NegativeControlBadgeInfo {
  switch (status) {
    case 'not-applicable-no-occurrences':
      return {
        label: 'CONFIRMED ZERO OCCURRENCES',
        className: 'bg-emerald-950 border-emerald-800 text-emerald-300',
        status,
        isContradiction: false,
        isConfirmedZero: true,
      };
    case 'unexpected-occurrences-found':
      return {
        label: 'CONTRADICTION — OCCURRENCES FOUND',
        className: 'bg-amber-950/80 border-amber-700 text-amber-300',
        status,
        isContradiction: true,
        isConfirmedZero: false,
      };
    case 'unavailable-upstream-uninspected':
    default:
      return {
        label: 'UPSTREAM EVIDENCE UNAVAILABLE',
        className: 'bg-zinc-800 border-zinc-700 text-zinc-400',
        status,
        isContradiction: false,
        isConfirmedZero: false,
      };
  }
}

/**
 * Formats occurrence and context counts safely, handling null/undefined without manufacturing zero.
 */
export function formatNegativeControlCount(count: number | null | undefined): string {
  if (count === null || count === undefined) {
    return 'UNAVAILABLE';
  }
  return String(count);
}

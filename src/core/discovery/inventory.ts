import { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import {
  InventoryEntry,
  generateEntryId,
} from '../models/InventoryEntry';
import {
  detectFileSignature,
  getExtendedHeaderOffset,
} from './signatures';
import { GameDetectionResult, DetectedGameId } from '../models/GameDetection';
import { APP_NAME, APP_VERSION } from '../../appMetadata';

export interface InventoryOptions {
  headerSliceSize?: number;
  concurrency?: number;
  onProgress?: (scanned: number, total: number) => void;
}

export interface InventoryExportData {
  app: {
    name: string;
    version: string;
    exportedAt: string;
  };
  directory: {
    name: string;
    totalFiles: number;
    totalSize: number;
  };
  detection: GameDetectionResult;
  inventory: Array<{
    path: string;
    name: string;
    extension: string;
    size: number;
    classification: string;
    signature: {
      kind: string;
      confidence: string;
      details?: string;
      headerHex?: string;
    };
    error?: string;
  }>;
}

/**
 * Executes recursive inventory scan over DirectorySource with bounded two-stage slice reading.
 */
export async function buildDirectoryInventory(
  source: DirectorySource,
  options: InventoryOptions = {},
): Promise<InventoryEntry[]> {
  const sliceSize = options.headerSliceSize ?? 64;
  const concurrency = Math.max(1, options.concurrency ?? 6);
  const onProgress = options.onProgress;

  const rawEntries: SourceFileEntry[] = await source.listRecursive();
  const total = rawEntries.length;

  if (total === 0) {
    onProgress?.(0, 0);
    return [];
  }

  // Sort raw entries deterministically by normalized path
  rawEntries.sort((a, b) => a.path.localeCompare(b.path));

  const results: InventoryEntry[] = new Array(total);
  let scannedCount = 0;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < total) {
      const idx = currentIndex++;
      const entry = rawEntries[idx];

      try {
        let headerSlice = new Uint8Array(0);
        if (entry.size > 0) {
          const bytesToRead = Math.min(entry.size, sliceSize);
          headerSlice = await source.readSlice(entry.path, 0, bytesToRead);
        }

        // Two-stage read: check if executable has an extended header beyond the initial slice
        let secondaryHeaderSlice: Uint8Array | undefined;
        let extendedOffset: number | undefined;

        const extOffset = getExtendedHeaderOffset(headerSlice, entry.size);
        if (extOffset !== null) {
          extendedOffset = extOffset;
          try {
            // Read 8 bytes for secondary header identifier (LE, LX, NE, PE\0\0)
            const secBytesToRead = Math.min(8, Math.max(0, entry.size - extendedOffset));
            if (secBytesToRead >= 2) {
              secondaryHeaderSlice = await source.readSlice(
                entry.path,
                extendedOffset,
                secBytesToRead,
              );
            }
          } catch {
            // If secondary slice read fails, gracefully fall back to base header
            secondaryHeaderSlice = undefined;
          }
        }

        const detected = detectFileSignature(
          headerSlice,
          entry.name,
          entry.extension,
          secondaryHeaderSlice,
          extendedOffset,
        );

        results[idx] = {
          id: generateEntryId(entry.path),
          path: entry.path,
          name: entry.name,
          extension: entry.extension,
          size: entry.size,
          classification: detected.classification,
          signature: detected.signature,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results[idx] = {
          id: generateEntryId(entry.path),
          path: entry.path,
          name: entry.name,
          extension: entry.extension,
          size: entry.size,
          classification: 'read_error',
          signature: {
            kind: 'Unreadable Header',
            confidence: 'unknown',
            details: `Failed to read header slice: ${errorMsg}`,
          },
          error: errorMsg,
        };
      }

      scannedCount++;
      onProgress?.(scannedCount, total);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, total) },
    () => worker(),
  );
  await Promise.all(workers);

  // Return deterministically sorted inventory
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Enriches inventory entries with game-specific forensic context without polluting generic signature rules.
 */
export function enrichInventoryWithGameContext(
  inventory: InventoryEntry[],
  game: DetectedGameId,
): InventoryEntry[] {
  if (game === 'unknown') {
    return inventory;
  }

  return inventory.map((entry) => {
    const upperPath = entry.path.toUpperCase();
    const upperName = entry.name.toUpperCase();
    const ext = entry.extension.toUpperCase();

    // MK2 context: FX/*.U8 are sound resources
    if (game === 'mk2') {
      if (ext === 'U8' || upperPath.startsWith('FX/')) {
        return {
          ...entry,
          classification: 'audio_candidate',
          signature: {
            ...entry.signature,
            details: 'Observed MK2 sound resource candidate (.U8 in fx/ directory)',
          },
        };
      }
    }

    // MK3 context: FTR with MFIL header are MK3 fighter data containers
    if (game === 'mk3') {
      if (ext === 'FTR' && entry.signature.kind.includes('MFIL')) {
        return {
          ...entry,
          classification: 'data_candidate',
          signature: {
            ...entry.signature,
            confidence: 'verified',
            details: 'Verified MK3 fighter data container (.FTR with MFIL prefix)',
          },
        };
      }
      if (upperName === 'DATA.MK3' && entry.signature.kind.includes('FORM')) {
        return {
          ...entry,
          classification: 'data_candidate',
          signature: {
            ...entry.signature,
            confidence: 'verified',
            details: 'Verified MK3 game data container (DATA.MK3 with FORM prefix)',
          },
        };
      }
    }

    // MK1 context: GRAPHICS/*.GRA files
    if (game === 'mk1') {
      if (ext === 'GRA' && upperPath.startsWith('GRAPHICS/')) {
        return {
          ...entry,
          classification: 'graphics_candidate',
          signature: {
            ...entry.signature,
            details: 'MK1 graphic resource candidate (.GRA in GRAPHICS/ directory)',
          },
        };
      }
    }

    return entry;
  });
}

/**
 * Builds deterministic export payload object for inventory JSON export.
 */
export function createInventoryExport(
  directoryName: string,
  inventory: InventoryEntry[],
  detection: GameDetectionResult,
): InventoryExportData {
  const totalSize = inventory.reduce((acc, e) => acc + e.size, 0);

  // Deterministic file listing
  const sortedFiles = [...inventory].sort((a, b) =>
    a.path.localeCompare(b.path),
  );

  return {
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
    },
    directory: {
      name: directoryName,
      totalFiles: inventory.length,
      totalSize,
    },
    detection,
    inventory: sortedFiles.map((entry) => ({
      path: entry.path,
      name: entry.name,
      extension: entry.extension,
      size: entry.size,
      classification: entry.classification,
      signature: {
        kind: entry.signature.kind,
        confidence: entry.signature.confidence,
        ...(entry.signature.details
          ? { details: entry.signature.details }
          : {}),
        ...(entry.signature.headerHex
          ? { headerHex: entry.signature.headerHex }
          : {}),
      },
      ...(entry.error ? { error: entry.error } : {}),
    })),
  };
}

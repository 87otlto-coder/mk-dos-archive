export type ResearchConfidence = 'verified' | 'inferred' | 'hypothesis' | 'unknown';

export type FileClassification =
  | 'executable'
  | 'support_driver'
  | 'graphics_candidate'
  | 'audio_candidate'
  | 'data_candidate'
  | 'text_document'
  | 'unknown'
  | 'read_error';

export interface FileSignatureInfo {
  kind: string;
  confidence: ResearchConfidence;
  details?: string;
  headerHex?: string;
}

export interface InventoryEntry {
  id: string;
  path: string;
  name: string;
  extension: string;
  size: number;
  classification: FileClassification;
  signature: FileSignatureInfo;
  error?: string;
}

/**
 * Creates a deterministic, stable identifier from normalized path.
 */
export function generateEntryId(normalizedPath: string): string {
  // Simple deterministic djb2/FNV-1a hybrid hash formatted as hex prefix + clean path slug
  let hash = 2166136261;
  for (let i = 0; i < normalizedPath.length; i++) {
    hash ^= normalizedPath.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hashHex = (hash >>> 0).toString(16).padStart(8, '0');
  const cleanSlug = normalizedPath.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `entry_${hashHex}_${cleanSlug}`;
}

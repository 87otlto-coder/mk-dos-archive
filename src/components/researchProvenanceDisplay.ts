/** Presentation-only guard. Never supplies missing provenance to forensic validators. */
export function describeResearchProvenance(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  const label = typeof obj.fileName === 'string' && obj.fileName.trim() ? obj.fileName.trim() : 'Source record';
  const size = typeof obj.byteLength === 'number' && Number.isSafeInteger(obj.byteLength) && obj.byteLength >= 0
    ? `${obj.byteLength.toLocaleString('en-US')} B` : 'size not reported';
  const sha = typeof obj.sha256 === 'string' && /^[a-f\d]{64}$/i.test(obj.sha256)
    ? `SHA ${obj.sha256.slice(0, 12)}…` : 'hash not reported';
  return `${label} · ${size} · ${sha}`;
}

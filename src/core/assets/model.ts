export type Game = 'mk1' | 'mk2' | 'mk3';
export interface Asset {
  id: string;
  name: string;
  group: string;
  kind: 'sprite' | 'image' | 'stage' | 'audio' | 'music' | 'sequence' | 'raw';
  format: string;
  confidence: string;
  source: { path: string; offset: number; length: number; sha256?: string };
  metadata: Record<string, unknown>;
  width?: number;
  height?: number;
  rgba?: Uint8Array;
  bytes?: Uint8Array;
  mime?: string;
  filename: string;
}
export interface AssetCollection {
  game: Game;
  assets: Asset[];
  reports: Record<string, unknown>;
  packages: Array<{ name: string; bytes: Uint8Array }>;
  limitations: string[];
}
export const utf8 = new TextEncoder();
export const textAt = (b: Uint8Array, p: number, n: number) => new TextDecoder().decode(b.subarray(p, p + n));
export function view(b: Uint8Array) { return new DataView(b.buffer, b.byteOffset, b.byteLength); }
export async function hash(b: Uint8Array) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', b.slice().buffer))].map(x => x.toString(16).padStart(2, '0')).join('');
}
export function safeName(s: string) { return s.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 180); }

/** Independent validation of the O70 MK2 indexed graphics browser ZIP. */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK2BroadIndexedGraphicsCorpusCensusReport } from './broadIndexedGraphicsCorpusCensus';
import { MK2BrowserIndexedGraphicsExportBundleResult, MK2IndexedGraphicsAssetManifestV1 } from './browserIndexedGraphicsExportBundle';

const decoder = new TextDecoder();
function le16(b: Uint8Array, o: number) { return b[o] | (b[o + 1] << 8); }
function le32(b: Uint8Array, o: number) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
function u32(v: DataView, o: number) { return v.getUint32(o, true); }
function norm(s: string) { return s.replace(/\\/g, '/'); }
function crc32(bytes: Uint8Array) { let c = 0xffffffff; for (const x of bytes) { c ^= x; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
async function sha256(bytes: Uint8Array) { const d = await crypto.subtle.digest('SHA-256', bytes.slice().buffer); return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join(''); }
function findEntry(entries: SourceFileEntry[], name: string) { const e = entries.find((x) => norm(x.path).toUpperCase() === name.toUpperCase()); if (!e) throw new Error(`Required MK2 file missing: ${name}`); return e; }
function equal(a: Uint8Array, b: Uint8Array) { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }

function stableO69Evidence(report: MK2BroadIndexedGraphicsCorpusCensusReport) {
  const copy = JSON.parse(JSON.stringify(report)) as any;
  delete copy.timestamp; delete copy.operationId;
  if (copy.provenance) { delete copy.provenance.o67OperationId; delete copy.provenance.o68OperationId; }
  return copy;
}

export function parseMK2IndexedGraphicsStoreZip(bytes: Uint8Array) {
  const out = new Map<string, Uint8Array>(); let o = 0;
  while (o + 4 <= bytes.length && le32(bytes, o) === 0x04034b50) {
    const method = le16(bytes, o + 8), crc = le32(bytes, o + 14), size = le32(bytes, o + 18), nameLen = le16(bytes, o + 26), extraLen = le16(bytes, o + 28);
    if (method !== 0) throw new Error('O70 ZIP entry not STORE'); const name = decoder.decode(bytes.subarray(o + 30, o + 30 + nameLen)), start = o + 30 + nameLen + extraLen, data = bytes.slice(start, start + size);
    if (data.length !== size || crc32(data) !== crc || out.has(name)) throw new Error(`O70 ZIP size/CRC/duplicate failure ${name}`); out.set(name, data); o = start + size;
  }
  return out;
}
function decode(data: Uint8Array, offset: number, width: number, height: number) {
  let pos = offset, out = 0; const indices = new Uint8Array(width * height), mask = new Uint8Array(width * height), v = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let row = 0; row < height; row++) { let x = 0; while (x < width) { if (pos + 4 > data.length) throw new Error('validator truncated'); const cmd = u32(v, pos); if (cmd & 1) { const n = cmd >>> 1; pos += 4; if (n < 1 || x + n > width) throw new Error('validator skip'); out += n; x += n; } else if (cmd & 2) { const n = cmd >>> 10, c = (cmd >>> 2) & 255; pos += 4; if (n < 1 || x + n > width) throw new Error('validator rle'); for (let i = 0; i < n; i++) { indices[out] = c; mask[out] = 1; out++; } x += n; } else { const n = cmd >>> 2; pos += 4; if (n < 1 || n > 64 || x + n > width || pos + n > data.length) throw new Error('validator literal'); for (let i = 0; i < n; i++) { indices[out] = data[pos + i]; mask[out] = 1; out++; } pos += (n + 3) & ~3; x += n; } } }
  if (out !== width * height) throw new Error('validator pixel mismatch'); return { indices, mask, encodedByteLength: pos - offset };
}

export interface MK2BrowserIndexedGraphicsExportBundleValidationReport {
  format: 'mk2_browser_indexed_graphics_export_bundle_validation_v1'; timestamp: string; operationId: string;
  summary: { zipEntryCount: 7678; rawGraValidated: 94; streamsValidated: 3790; indexedPayloadsValidated: 3790; maskPayloadsValidated: 3790; metadataEntriesValidated: 4; unexpectedEntryCount: 0; };
  decision: { packageValidatedAgainstAuthenticSourceAndO69: true; all94RawGraByteExact: true; all3790DecodedPayloadPairsExact: true; paletteBoundaryPreserved: true; verdict: 'MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_BUNDLE_VALIDATED'; narrative: string; };
  status: 'SUCCESS'; validation: { allChecksPassed: true; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
}

export async function executeMK2BrowserIndexedGraphicsExportBundleValidation(source: DirectorySource, o69: MK2BroadIndexedGraphicsCorpusCensusReport, o70: MK2BrowserIndexedGraphicsExportBundleResult): Promise<MK2BrowserIndexedGraphicsExportBundleValidationReport> {
  if (source.isSynthetic || o69.status !== 'SUCCESS' || !o69.validation.allChecksPassed || o70.report.status !== 'SUCCESS' || !o70.report.validation.allChecksPassed) throw new Error('O70 validation requires authentic verified inputs');
  const z = parseMK2IndexedGraphicsStoreZip(o70.zipBytes); if (z.size !== 7678) throw new Error(`O70 ZIP entry count mismatch ${z.size}`);
  const manifestEntry = z.get('manifests/indexed_graphics_assets.json'), packageEntry = z.get('manifests/package_manifest.json'), reportEntry = z.get('reports/o69_broad_indexed_graphics_corpus_census.json'), readmeEntry = z.get('README.md'); if (!manifestEntry || !packageEntry || !reportEntry || !readmeEntry) throw new Error('O70 metadata missing');
  const manifest = JSON.parse(decoder.decode(manifestEntry)) as MK2IndexedGraphicsAssetManifestV1, packageManifest = JSON.parse(decoder.decode(packageEntry)) as any, embeddedO69 = JSON.parse(decoder.decode(reportEntry)) as MK2BroadIndexedGraphicsCorpusCensusReport;
  const sourceEntries = await source.listRecursive(), expected = new Set<string>(['manifests/indexed_graphics_assets.json','manifests/package_manifest.json','reports/o69_broad_indexed_graphics_corpus_census.json','README.md']); let rawGraValidated = 0, streamsValidated = 0;
  for (const r of manifest.resources) {
    expected.add(r.rawPath); const rawZip = z.get(r.rawPath), e = findEntry(sourceEntries, r.resourceName); if (!rawZip) throw new Error(`O70 raw GRA missing ${r.resourceName}`); const rawSource = await source.readSlice(e.path, 0, e.size);
    if (!equal(rawZip, rawSource) || await sha256(rawZip) !== r.sha256) throw new Error(`O70 raw GRA mismatch ${r.resourceName}`); rawGraValidated++;
    for (const s of r.streams) {
      expected.add(s.indicesPath); expected.add(s.maskPath); const ib = z.get(s.indicesPath), mb = z.get(s.maskPath); if (!ib || !mb) throw new Error(`O70 stream payload missing ${r.resourceName}@${s.graOffset}`); const d = decode(rawSource, s.graOffset, s.width, s.height);
      if (d.encodedByteLength !== s.encodedByteLength || !equal(ib, d.indices) || !equal(mb, d.mask) || await sha256(ib) !== s.indicesSha256 || await sha256(mb) !== s.maskSha256) throw new Error(`O70 decoded stream mismatch ${r.resourceName}@${s.graOffset}`); streamsValidated++;
    }
  }
  const unexpected = [...z.keys()].filter((x) => !expected.has(x)), missing = [...expected].filter((x) => !z.has(x)); const readme = decoder.decode(readmeEntry);
  const o69Exact = JSON.stringify(embeddedO69) === JSON.stringify(stableO69Evidence(o69)), manifestContract = manifest.resources.length === 94 && manifest.resources.reduce((n, r) => n + r.streams.length, 0) === 3790 && !manifest.semantics.paletteOwnershipEstablished && !manifest.semantics.correctColorRgbaEstablished;
  const packageContract = packageManifest?.format === 'mk2_browser_indexed_graphics_export_package_manifest_v1' && packageManifest?.counts?.totalEntries === 7678 && packageManifest?.boundaries?.partialOrAmbiguousResourcesIncluded === false && packageManifest?.boundaries?.paletteOwnershipEstablished === false;
  const checks = [
    { checkId: 'EXACT_ZIP_ENTRY_SET', passed: z.size === 7678 && unexpected.length === 0 && missing.length === 0, detail: `entries=${z.size};unexpected=${unexpected.length};missing=${missing.length}` },
    { checkId: 'ALL_94_RAW_GRA_BYTE_EXACT', passed: rawGraValidated === 94, detail: String(rawGraValidated) },
    { checkId: 'ALL_3790_INDEX_MASK_PAIRS_RECONSTRUCT', passed: streamsValidated === 3790, detail: String(streamsValidated) },
    { checkId: 'MANIFEST_CONTRACT_PRESERVED', passed: manifestContract },
    { checkId: 'PACKAGE_MANIFEST_BOUNDARIES_PRESERVED', passed: packageContract },
    { checkId: 'EMBEDDED_O69_REPORT_EXACT', passed: o69Exact },
    { checkId: 'README_PRESERVES_PALETTE_AND_OVERLAY_BOUNDARIES', passed: readme.includes('Palette ownership and correct-color RGBA are NOT established') && readme.includes('unresolved post-LE overlay') },
    { checkId: 'NO_UNEXPECTED_ENTRIES', passed: unexpected.length === 0 },
  ];
  if (!checks.every((c) => c.passed)) throw new Error(`O70 bundle validation failed: ${checks.filter((c) => !c.passed).map((c) => c.checkId).join(', ')}`);
  const timestamp = new Date().toISOString(), operationId = createOperationId('mk2_browser_indexed_graphics_export_bundle_validation');
  return { format: 'mk2_browser_indexed_graphics_export_bundle_validation_v1', timestamp, operationId, summary: { zipEntryCount: 7678, rawGraValidated: 94, streamsValidated: 3790, indexedPayloadsValidated: 3790, maskPayloadsValidated: 3790, metadataEntriesValidated: 4, unexpectedEntryCount: 0 }, decision: { packageValidatedAgainstAuthenticSourceAndO69: true, all94RawGraByteExact: true, all3790DecodedPayloadPairsExact: true, paletteBoundaryPreserved: true, verdict: 'MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_BUNDLE_VALIDATED', narrative: 'O70 independently parses the produced STORE ZIP, validates all entry CRCs, compares all 94 packaged raw GRA files byte-for-byte with the authentic MK2 installation, independently decodes all 3,790 streams from those authentic GRA bytes, and matches every packaged indexed-pixel and opacity-mask payload plus manifest hash. No palette, RGBA or overlay-runtime claim is strengthened.' }, status: 'SUCCESS', validation: { allChecksPassed: true, checks } };
}

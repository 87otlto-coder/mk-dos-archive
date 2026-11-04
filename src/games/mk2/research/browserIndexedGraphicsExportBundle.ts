/** Browser-downloadable lossless MK2 indexed graphics package — Pass 1E.3O.70. */
import { DirectorySource, SourceFileEntry } from '../../../core/filesystem/DirectorySource';
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { buildStoredZip } from '../../../core/research/researchArtifactDownloads';
import { MK2BroadIndexedGraphicsCorpusCensusReport, MK2BroadIndexedStreamRecord } from './broadIndexedGraphicsCorpusCensus';

const encoder = new TextEncoder();
function u32(v: DataView, o: number) { return v.getUint32(o, true); }
function norm(s: string) { return s.replace(/\\/g, '/'); }
function safeName(s: string) { return s.replace(/[^A-Za-z0-9_.-]+/g, '_'); }
function findEntry(entries: SourceFileEntry[], name: string) { const e = entries.find((x) => norm(x.path).toUpperCase() === name.toUpperCase()); if (!e) throw new Error(`Required MK2 file missing: ${name}`); return e; }
async function sha256(bytes: Uint8Array) { const d = await crypto.subtle.digest('SHA-256', bytes.slice().buffer); return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join(''); }

function stableO69Evidence(report: MK2BroadIndexedGraphicsCorpusCensusReport) {
  const copy = JSON.parse(JSON.stringify(report)) as any;
  delete copy.timestamp; delete copy.operationId;
  if (copy.provenance) { delete copy.provenance.o67OperationId; delete copy.provenance.o68OperationId; }
  return copy;
}

function decode(data: Uint8Array, offset: number, width: number, height: number) {
  let pos = offset, out = 0; const indices = new Uint8Array(width * height), mask = new Uint8Array(width * height); const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let row = 0; row < height; row++) {
    let x = 0;
    while (x < width) {
      if (pos + 4 > data.length) throw new Error('O70 truncated MK2 graphics command');
      const cmd = u32(view, pos);
      if (cmd & 1) { const n = cmd >>> 1; pos += 4; if (n <= 0 || x + n > width) throw new Error('O70 invalid skip'); out += n; x += n; }
      else if (cmd & 2) { const n = cmd >>> 10, c = (cmd >>> 2) & 0xff; pos += 4; if (n <= 0 || x + n > width) throw new Error('O70 invalid RLE'); for (let i = 0; i < n; i++) { indices[out] = c; mask[out] = 1; out++; } x += n; }
      else { const n = cmd >>> 2; pos += 4; if (n <= 0 || n > 0x40 || x + n > width || pos + n > data.length) throw new Error('O70 invalid literal'); for (let i = 0; i < n; i++) { indices[out] = data[pos + i]; mask[out] = 1; out++; } pos += (n + 3) & ~3; x += n; }
    }
  }
  if (out !== width * height) throw new Error('O70 decoded pixel count mismatch');
  return { indices, mask, encodedByteLength: pos - offset };
}

export interface MK2IndexedGraphicsAssetManifestStreamV1 {
  ordinal: number; descriptorPhysical: number; graOffset: number; width: number; height: number; x: number; y: number; encodedByteLength: number;
  indicesPath: string; maskPath: string; indicesSha256: string; maskSha256: string;
}
export interface MK2IndexedGraphicsAssetManifestResourceV1 {
  resourceId: number; resourceName: string; rawPath: string; byteLength: number; sha256: string; streamCount: number; streams: MK2IndexedGraphicsAssetManifestStreamV1[];
}
export interface MK2IndexedGraphicsAssetManifestV1 {
  format: 'mk2_indexed_graphics_asset_manifest_v1';
  sourceContract: { pass: '1E.3O.69'; verdict: string; exactFullResourceCount: 94; qualifiedUniqueStreamCount: 3790; qualifiedEncodedBytes: 11385532; };
  semantics: { payloadKind: 'INDEXED_PIXELS_PLUS_OPACITY_MASK'; rawGraPreservedByteExact: true; paletteOwnershipEstablished: false; correctColorRgbaEstablished: false; runtimeConsumerForOverlayDescriptorCorpusEstablished: false; sharedMkDosAbstractionPromoted: false; };
  resources: MK2IndexedGraphicsAssetManifestResourceV1[];
}
export interface MK2BrowserIndexedGraphicsExportBundleReport {
  format: 'mk2_browser_indexed_graphics_export_bundle_v1'; timestamp: string; operationId: string;
  provenance: { sourceKind: 'user-loaded-directory'; exeSha256: string; o69OperationId: string; synthetic: false; };
  package: { fileName: 'MK2_O70_INDEXED_GRAPHICS_EXPORT_PACKAGE.zip'; byteLength: number; sha256: string; zipEntryCount: 7678; rawGraEntryCount: 94; indexedPayloadEntryCount: 3790; maskPayloadEntryCount: 3790; metadataEntryCount: 4; };
  coverage: { exactFullResourceCount: 94; qualifiedUniqueStreamCount: 3790; rawEncodedBytesPreserved: 11385532; decodedPixelCount: 15953739; paletteOwnershipEstablished: false; correctColorRgbaEstablished: false; };
  decision: { browserIndexedGraphicsPackageEstablished: true; all94QualifiedGraFilesPreservedByteExact: true; all3790StreamsMaterializedAsIndexedPixelsAndMasks: true; partialOrAmbiguousResourcesExcluded: true; paletteSemanticsUnchanged: true; verdict: 'MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_PACKAGE_ESTABLISHED'; narrative: string; };
  status: 'SUCCESS'; validation: { allChecksPassed: true; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
}
export interface MK2BrowserIndexedGraphicsExportBundleResult { report: MK2BrowserIndexedGraphicsExportBundleReport; manifest: MK2IndexedGraphicsAssetManifestV1; zipBytes: Uint8Array; }

export async function executeMK2BrowserIndexedGraphicsExportBundle(source: DirectorySource, o69: MK2BroadIndexedGraphicsCorpusCensusReport): Promise<MK2BrowserIndexedGraphicsExportBundleResult> {
  if (source.isSynthetic || o69.status !== 'SUCCESS' || !o69.validation.allChecksPassed || o69.decision.verdict !== 'MK2_BROAD_INDEXED_GRA_CORPUS_CENSUS_ESTABLISHED') throw new Error('O70 requires authentic verified O69 prerequisite');
  if (o69.coverage.exactFullResourceCount !== 94 || o69.coverage.qualifiedUniqueStreamCount !== 3790 || o69.coverage.qualifiedEncodedBytes !== 11385532) throw new Error('O70 O69 coverage contract mismatch');
  const timestamp = new Date().toISOString(), operationId = createOperationId('mk2_browser_indexed_graphics_export_bundle');
  const sourceEntries = await source.listRecursive(); const files: Array<{ name: string; bytes: Uint8Array }> = []; const resources: MK2IndexedGraphicsAssetManifestResourceV1[] = [];
  let streamCount = 0, rawBytes = 0, decodedPixels = 0;
  for (const r of o69.qualifiedResources) {
    const e = findEntry(sourceEntries, r.resourceName), raw = await source.readSlice(e.path, 0, e.size), rawSha = await sha256(raw);
    if (raw.length !== r.fileSize || r.coveredEncodedBytes !== r.fileSize || r.qualification !== 'EXACT_FULL_RESOURCE_TILING') throw new Error(`O70 resource contract mismatch ${r.resourceName}`);
    const stem = `${String(r.resourceId).padStart(3, '0')}_${safeName(r.resourceName)}`, rawPath = `resources/${stem}/raw/${safeName(r.resourceName)}`;
    files.push({ name: rawPath, bytes: raw }); rawBytes += raw.length;
    const streams: MK2IndexedGraphicsAssetManifestStreamV1[] = [];
    for (let i = 0; i < r.streams.length; i++) {
      const s: MK2BroadIndexedStreamRecord = r.streams[i], d = decode(raw, s.graOffset, s.width, s.height);
      if (d.encodedByteLength !== s.encodedByteLength || s.encodedEndExclusive !== s.graOffset + s.encodedByteLength) throw new Error(`O70 stream boundary mismatch ${r.resourceName}@${s.graOffset}`);
      const base = `resources/${stem}/streams/${String(i).padStart(4, '0')}_${s.graOffset.toString(16).padStart(6, '0')}`;
      const indicesPath = `${base}.indices.bin`, maskPath = `${base}.mask.bin`, indicesSha256 = await sha256(d.indices), maskSha256 = await sha256(d.mask);
      files.push({ name: indicesPath, bytes: d.indices }, { name: maskPath, bytes: d.mask });
      streams.push({ ordinal: i, descriptorPhysical: s.descriptorPhysical, graOffset: s.graOffset, width: s.width, height: s.height, x: s.x, y: s.y, encodedByteLength: s.encodedByteLength, indicesPath, maskPath, indicesSha256, maskSha256 });
      streamCount++; decodedPixels += d.indices.length;
    }
    resources.push({ resourceId: r.resourceId, resourceName: r.resourceName, rawPath, byteLength: raw.length, sha256: rawSha, streamCount: streams.length, streams });
  }
  const manifest: MK2IndexedGraphicsAssetManifestV1 = {
    format: 'mk2_indexed_graphics_asset_manifest_v1',
    sourceContract: { pass: '1E.3O.69', verdict: o69.decision.verdict, exactFullResourceCount: 94, qualifiedUniqueStreamCount: 3790, qualifiedEncodedBytes: 11385532 },
    semantics: { payloadKind: 'INDEXED_PIXELS_PLUS_OPACITY_MASK', rawGraPreservedByteExact: true, paletteOwnershipEstablished: false, correctColorRgbaEstablished: false, runtimeConsumerForOverlayDescriptorCorpusEstablished: false, sharedMkDosAbstractionPromoted: false },
    resources,
  };
  const packageManifest = {
    format: 'mk2_browser_indexed_graphics_export_package_manifest_v1', pass: '1E.3O.70',
    counts: { resources: 94, streams: 3790, rawGraEntries: 94, indicesEntries: 3790, maskEntries: 3790, metadataEntries: 4, totalEntries: 7678 },
    bytes: { authenticEncodedGraBytesPreserved: 11385532, decodedIndexedPixels: 15953739 },
    boundaries: { paletteOwnershipEstablished: false, correctColorRgbaEstablished: false, partialOrAmbiguousResourcesIncluded: false, runtimeConsumerForOverlayDescriptorCorpusEstablished: false, sharedMkDosAbstractionPromoted: false },
  };
  const readme = `# MK2 indexed graphics export package — O70\n\nThis package materializes only the 94 O69 resources whose discovered MK2 streams tile authentic GRA bytes exactly from offset 0 to EOF.\n\n- 94 raw GRA resources are preserved byte-for-byte.\n- 3,790 streams are exported as one-byte indexed pixels plus a separate one-byte opacity mask.\n- The mask is authoritative for transparency; palette index values are not treated as colors here.\n- 15 partial/ambiguous resources and 14 pooled resources with no qualifying O69 overlay candidates are excluded.\n- Palette ownership and correct-color RGBA are NOT established.\n- The descriptor corpus remains in an unresolved post-LE overlay; runtime consumer semantics are NOT established.\n- No MK1 palette/index assumptions or shared cross-game abstraction are promoted.\n- The embedded O69 evidence snapshot omits only run-specific timestamp/operation IDs so identical inputs yield identical package bytes.\n`;
  files.push(
    { name: 'manifests/indexed_graphics_assets.json', bytes: encoder.encode(JSON.stringify(manifest, null, 2)) },
    { name: 'manifests/package_manifest.json', bytes: encoder.encode(JSON.stringify(packageManifest, null, 2)) },
    { name: 'reports/o69_broad_indexed_graphics_corpus_census.json', bytes: encoder.encode(JSON.stringify(stableO69Evidence(o69), null, 2)) },
    { name: 'README.md', bytes: encoder.encode(readme) },
  );
  if (resources.length !== 94 || streamCount !== 3790 || rawBytes !== 11385532 || decodedPixels !== 15953739 || files.length !== 7678) throw new Error('O70 aggregate/package entry contract mismatch');
  const zipBytes = buildStoredZip(files), zipSha = await sha256(zipBytes);
  const checks = [
    { checkId: 'O69_VERIFIED_PREREQUISITE', passed: true, detail: o69.decision.verdict },
    { checkId: 'EXACT_94_RESOURCES', passed: resources.length === 94, detail: String(resources.length) },
    { checkId: 'EXACT_3790_STREAMS', passed: streamCount === 3790, detail: String(streamCount) },
    { checkId: 'ALL_QUALIFIED_GRA_BYTES_PRESERVED', passed: rawBytes === 11385532, detail: String(rawBytes) },
    { checkId: 'ALL_DECODED_PIXELS_MATERIALIZED', passed: decodedPixels === 15953739, detail: String(decodedPixels) },
    { checkId: 'EXACT_7678_ZIP_ENTRIES', passed: files.length === 7678, detail: String(files.length) },
    { checkId: 'PALETTE_BOUNDARY_PRESERVED', passed: !manifest.semantics.paletteOwnershipEstablished && !manifest.semantics.correctColorRgbaEstablished },
    { checkId: 'PARTIAL_RESOURCES_EXCLUDED', passed: o69.partialOrAmbiguousResources.every((r) => !resources.some((x) => x.resourceName === r.resourceName)), detail: `${o69.partialOrAmbiguousResources.length} unresolved resources excluded` },
  ];
  if (!checks.every((c) => c.passed)) throw new Error('O70 validation failed');
  const report: MK2BrowserIndexedGraphicsExportBundleReport = {
    format: 'mk2_browser_indexed_graphics_export_bundle_v1', timestamp, operationId,
    provenance: { sourceKind: 'user-loaded-directory', exeSha256: o69.provenance.exeSha256, o69OperationId: o69.operationId, synthetic: false },
    package: { fileName: 'MK2_O70_INDEXED_GRAPHICS_EXPORT_PACKAGE.zip', byteLength: zipBytes.length, sha256: zipSha, zipEntryCount: 7678, rawGraEntryCount: 94, indexedPayloadEntryCount: 3790, maskPayloadEntryCount: 3790, metadataEntryCount: 4 },
    coverage: { exactFullResourceCount: 94, qualifiedUniqueStreamCount: 3790, rawEncodedBytesPreserved: rawBytes, decodedPixelCount: decodedPixels, paletteOwnershipEstablished: false, correctColorRgbaEstablished: false },
    decision: { browserIndexedGraphicsPackageEstablished: true, all94QualifiedGraFilesPreservedByteExact: true, all3790StreamsMaterializedAsIndexedPixelsAndMasks: true, partialOrAmbiguousResourcesExcluded: true, paletteSemanticsUnchanged: true, verdict: 'MK2_BROWSER_INDEXED_GRAPHICS_EXPORT_PACKAGE_ESTABLISHED', narrative: 'O70 materializes the exact O69 qualified surface without semantic expansion: all 94 exact-full authentic GRA resources are preserved byte-for-byte and all 3,790 streams are exported as lossless indexed pixels plus explicit opacity masks. Partial/ambiguous resources remain excluded and palette ownership, correct-color RGBA, overlay runtime consumers and shared MK1/MK2 abstractions remain unestablished.' },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks },
  };
  return { report, manifest, zipBytes };
}

export function createMK2BrowserIndexedGraphicsExportBundleExport(result: MK2BrowserIndexedGraphicsExportBundleResult) { if (result.report.status !== 'SUCCESS' || !result.report.validation.allChecksPassed) throw new Error('O70 export blocked'); return result.report; }

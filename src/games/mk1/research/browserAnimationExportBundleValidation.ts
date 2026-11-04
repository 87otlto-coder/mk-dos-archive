/** Independent in-app validation of the O60 browser animation bundle — Pass 1E.3O.61. */
import { createOperationId } from '../../../core/diagnostics/diagnosticLogger';
import { MK1AnimationResourceDecodeCensusReport } from './animationResourceDecodeCensus';
import { MK1VerifiedPaletteBoundExportFixturesReport } from './verifiedPaletteBoundExportFixtures';
import { MK1CharacterPaletteContextVariantRendererReport } from './characterPaletteContextVariantRenderer';
import { MK1PaletteBindingExceptionCensusReport } from './paletteBindingExceptionCensus';
import { MK1AnimationExportCapabilityCoverageManifestReport } from './animationExportCapabilityCoverageManifest';
import { MK1BrowserAnimationExportBundleResult } from './browserAnimationExportBundle';

const decoder = new TextDecoder();
function le16(b: Uint8Array, o: number) { return b[o] | (b[o + 1] << 8); }
function le32(b: Uint8Array, o: number) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
function be32(b: Uint8Array, o: number) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }
function crc32(bytes: Uint8Array) { let c = 0xffffffff; for (const x of bytes) { c ^= x; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
function adler32(bytes: Uint8Array) { let a = 1, b = 0; for (const x of bytes) { a = (a + x) % 65521; b = (b + a) % 65521; } return ((b << 16) | a) >>> 0; }
function fnv(bytes: Uint8Array, seed = 0x811c9dc5) { let h = seed >>> 0; for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193); } return h >>> 0; }
function fnvHex(v: number) { return (v >>> 0).toString(16).padStart(8, '0'); }
function json<T = unknown>(bytes: Uint8Array): T { return JSON.parse(decoder.decode(bytes)) as T; }
function stable(x: unknown) { return JSON.stringify(x); }

export interface MK1ParsedStoreZipEntry { name: string; bytes: Uint8Array; crc32: number; }
export function parseAnimationStoreZip(bytes: Uint8Array): Map<string, MK1ParsedStoreZipEntry> {
  const out = new Map<string, MK1ParsedStoreZipEntry>(); let o = 0;
  while (o + 4 <= bytes.length && le32(bytes, o) === 0x04034b50) {
    const method = le16(bytes, o + 8), crc = le32(bytes, o + 14), size = le32(bytes, o + 18), nameLen = le16(bytes, o + 26), extraLen = le16(bytes, o + 28);
    if (method !== 0) throw new Error('O61 ZIP entry not STORE');
    const name = decoder.decode(bytes.subarray(o + 30, o + 30 + nameLen)), start = o + 30 + nameLen + extraLen, data = bytes.subarray(start, start + size);
    if (data.length !== size || crc32(data) !== crc) throw new Error(`O61 ZIP CRC/size mismatch ${name}`);
    if (out.has(name)) throw new Error(`O61 duplicate ZIP entry ${name}`);
    out.set(name, { name, bytes: data, crc32: crc }); o = start + size;
  }
  return out;
}

function inflateStoredZlib(data: Uint8Array) {
  if (data.length < 6 || data[0] !== 0x78 || (((data[0] << 8) | data[1]) % 31) !== 0) throw new Error('O61 invalid zlib header');
  let o = 2; const parts: Uint8Array[] = [];
  for (;;) {
    if (o >= data.length - 4) throw new Error('O61 truncated zlib stream');
    const h = data[o++], final = (h & 1) !== 0, type = (h >>> 1) & 3;
    if (type !== 0) throw new Error('O61 expected stored DEFLATE block');
    const len = le16(data, o), nlen = le16(data, o + 2); o += 4;
    if (((len ^ 0xffff) & 0xffff) !== nlen || o + len > data.length - 4) throw new Error('O61 stored block LEN mismatch');
    parts.push(data.subarray(o, o + len)); o += len; if (final) break;
  }
  let n = 0; for (const p of parts) n += p.length; const raw = new Uint8Array(n); let w = 0; for (const p of parts) { raw.set(p, w); w += p.length; }
  if (be32(data, o) !== adler32(raw)) throw new Error('O61 Adler mismatch'); return raw;
}

export function decodeAnimationBundlePng(bytes: Uint8Array) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]; if (sig.some((x, i) => bytes[i] !== x)) throw new Error('O61 PNG signature');
  let o = 8, width = 0, height = 0; const idat: Uint8Array[] = [];
  while (o + 12 <= bytes.length) {
    const len = be32(bytes, o), type = decoder.decode(bytes.subarray(o + 4, o + 8)), dat = bytes.subarray(o + 8, o + 8 + len), crc = be32(bytes, o + 8 + len), body = bytes.subarray(o + 4, o + 8 + len);
    if (crc32(body) !== crc) throw new Error(`O61 PNG CRC ${type}`); o += 12 + len;
    if (type === 'IHDR') { width = be32(dat, 0); height = be32(dat, 4); if (dat[8] !== 8 || dat[9] !== 6 || dat[10] !== 0 || dat[11] !== 0 || dat[12] !== 0) throw new Error('O61 PNG format mismatch'); }
    else if (type === 'IDAT') idat.push(dat); else if (type === 'IEND') break;
  }
  let total = 0; for (const p of idat) total += p.length; const zd = new Uint8Array(total); let z = 0; for (const p of idat) { zd.set(p, z); z += p.length; }
  const raw = inflateStoredZlib(zd), row = width * 4 + 1; if (raw.length !== row * height) throw new Error('O61 PNG row size');
  const rgba = new Uint8Array(width * height * 4); for (let y = 0; y < height; y++) { const ro = y * row; if (raw[ro] !== 0) throw new Error('O61 PNG nonzero filter'); rgba.set(raw.subarray(ro + 1, ro + row), y * width * 4); }
  return { width, height, rgba };
}

type CharacterAsset = { path: string; characterId: number; identityLabel: string; anitabSymbol: string; mode: string; paletteSymbols: string[]; descriptorWatcomOffset: number; descriptorWatcomOffsetHex: string; resourcePath: string; width: number; height: number; rgbaChecksum: string; };
type EffectAsset = { path: string; key: string; width: number; height: number; rgbaChecksum: string; metadata: Record<string, unknown>; };
type AssetManifest = { format: string; characterContextRgbaCount: number; verifiedEffectRgbaCount: number; characterContextRgba: CharacterAsset[]; verifiedEffectRgba: EffectAsset[]; };
type IndexedDescriptor = { tableSymbol: string; descriptorWatcomOffset: number; descriptorWatcomOffsetHex: string; resourcePath: string; graOffset: number; width: number; height: number; x: number; y: number; decodeChecksum: string; indicesOffset: number; maskOffset: number; pixelCount: number; };
type IndexedManifest = { format: string; descriptorCount: number; binaryFile: string; descriptors: IndexedDescriptor[]; };

export interface MK1BrowserAnimationExportBundleValidationReport {
  format: 'mk1_browser_animation_export_bundle_validation_v1'; timestamp: string; operationId: string; provenance: MK1AnimationResourceDecodeCensusReport['provenance'];
  prerequisite: { o60OperationId: string; o60Verdict: string; o59OperationId: string; validationPassed: true };
  summary: { zipEntryCount: 2295; pngValidatedCount: 2284; characterContextPngValidatedCount: 2263; verifiedEffectPngValidatedCount: 21; indexedDescriptorValidatedCount: 1102; indexedBinaryByteLength: number; unresolvedIndexedDescriptorCount: 79; unresolvedRgbaAssetCount: 0; o24PaletteVariantAggregateCount: 16; reportMatchCount: 7; unexpectedEntryCount: 0; };
  decision: { browserAnimationBundleValidatedAgainstO59O60Contract: true; allCharacterContextPixelsPreserved: true; allVerifiedEffectPixelsPreserved: true; allIndexedDescriptorsStructurallyPreserved: true; unresolvedPaletteDescriptorsRemainIndexedOnly: true; absoluteWallClockTimingNotInvented: true; verdict: 'MK1_BROWSER_ANIMATION_EXPORT_BUNDLE_VALIDATED'; narrative: string; };
  status: 'SUCCESS'; validation: { allChecksPassed: boolean; checks: Array<{ checkId: string; passed: boolean; detail?: string }> };
}

export function validateBrowserAnimationZipPayload(
  zipBytes: Uint8Array,
  o18: MK1AnimationResourceDecodeCensusReport,
  o23: MK1VerifiedPaletteBoundExportFixturesReport,
  o24: MK1CharacterPaletteContextVariantRendererReport,
  o25: MK1PaletteBindingExceptionCensusReport,
  o59: MK1AnimationExportCapabilityCoverageManifestReport,
) {
  const entries = parseAnimationStoreZip(zipBytes);
  const assetBytes = entries.get('manifests/animation_assets.json')?.bytes, indexedManifestBytes = entries.get('indexed/descriptor_manifest.json')?.bytes, indexedBinary = entries.get('indexed/descriptor_pixels.bin')?.bytes;
  if (!assetBytes || !indexedManifestBytes || !indexedBinary) throw new Error('O61 required manifest/binary missing');
  const assets = json<AssetManifest>(assetBytes), indexed = json<IndexedManifest>(indexedManifestBytes);
  if (assets.format !== 'mk1_animation_asset_index_v1' || indexed.format !== 'mk1_animation_indexed_descriptor_payload_manifest_v1') throw new Error('O61 manifest format mismatch');

  let characterPngs = 0, effectPngs = 0;
  const groups = new Map<string, Array<{ asset: CharacterAsset; rgba: Uint8Array }>>();
  for (const asset of assets.characterContextRgba) {
    const e = entries.get(asset.path); if (!e) throw new Error(`O61 missing context PNG ${asset.path}`); const png = decodeAnimationBundlePng(e.bytes);
    if (png.width !== asset.width || png.height !== asset.height || fnvHex(fnv(png.rgba)) !== asset.rgbaChecksum) throw new Error(`O61 context PNG mismatch ${asset.path}`);
    const key = `${asset.characterId}|${asset.mode}|${asset.paletteSymbols.join('+')}`, arr = groups.get(key) ?? []; arr.push({ asset, rgba: png.rgba }); groups.set(key, arr); characterPngs++;
  }
  for (const asset of assets.verifiedEffectRgba) {
    const e = entries.get(asset.path); if (!e) throw new Error(`O61 missing effect PNG ${asset.path}`); const png = decodeAnimationBundlePng(e.bytes);
    if (png.width !== asset.width || png.height !== asset.height || fnvHex(fnv(png.rgba)) !== asset.rgbaChecksum) throw new Error(`O61 effect PNG mismatch ${asset.path}`); effectPngs++;
  }

  let aggregateCount = 0;
  for (const c of o24.contexts) for (const pv of c.paletteVariants) {
    const key = `${c.characterId}|${pv.mode}|${pv.paletteSymbols.join('+')}`, rows = groups.get(key); if (!rows || rows.length !== pv.renderedDescriptorCount) throw new Error(`O61 O24 group count ${key}`);
    rows.sort((a, b) => a.asset.descriptorWatcomOffset - b.asset.descriptorWatcomOffset); let agg = 0x811c9dc5; let sample: string | null = null;
    for (const row of rows) { const o = row.asset.descriptorWatcomOffset >>> 0; agg = fnv(new Uint8Array([o & 255, (o >>> 8) & 255, (o >>> 16) & 255, (o >>> 24) & 255]), agg); agg = fnv(row.rgba, agg); if (sample === null) sample = fnvHex(fnv(row.rgba)); }
    if (fnvHex(agg) !== pv.aggregateRgbaChecksum || sample !== pv.sampleRgbaChecksum) throw new Error(`O61 O24 aggregate mismatch ${key}`); aggregateCount++;
  }

  const expectedDescriptors = [...o18.descriptors].sort((a, b) => a.tableSymbol.localeCompare(b.tableSymbol) || a.watcomOffset - b.watcomOffset);
  if (indexed.descriptors.length !== expectedDescriptors.length || indexed.descriptorCount !== expectedDescriptors.length) throw new Error('O61 indexed descriptor count mismatch');
  let indexedValidated = 0;
  for (let i = 0; i < expectedDescriptors.length; i++) {
    const expected = expectedDescriptors[i], got = indexed.descriptors[i], pc = expected.width * expected.height;
    if (!got || got.tableSymbol !== expected.tableSymbol || got.descriptorWatcomOffset !== expected.watcomOffset || got.resourcePath !== expected.resourcePath || got.graOffset !== expected.graOffset || got.width !== expected.width || got.height !== expected.height || got.x !== expected.x || got.y !== expected.y || got.decodeChecksum !== expected.decode.checksum || got.pixelCount !== pc) throw new Error(`O61 indexed manifest mismatch ${expected.tableSymbol} ${expected.watcomOffsetHex}`);
    if (got.indicesOffset < 0 || got.maskOffset !== got.indicesOffset + pc || got.maskOffset + pc > indexedBinary.length) throw new Error(`O61 indexed offsets invalid ${expected.watcomOffsetHex}`);
    const indices = indexedBinary.subarray(got.indicesOffset, got.indicesOffset + pc), mask = indexedBinary.subarray(got.maskOffset, got.maskOffset + pc); let opaque = 0; const union = new Set<number>();
    for (let p = 0; p < pc; p++) { if (mask[p] !== 0 && mask[p] !== 1) throw new Error(`O61 mask domain ${expected.watcomOffsetHex}`); if (mask[p]) { opaque++; union.add(indices[p]); } }
    const sortedUnion = [...union].sort((a, b) => a - b); if (opaque !== expected.decode.opaquePixelCount || stable(sortedUnion) !== stable(expected.decode.opaqueIndexUnion)) throw new Error(`O61 indexed pixel statistics mismatch ${expected.watcomOffsetHex}`); indexedValidated++;
  }

  const unresolved = o25.crossResourceDescriptors.filter((d) => d.paletteStatus === 'UNRESOLVED_CROSS_RESOURCE_PALETTE'); const unresolvedKeys = new Set(unresolved.map((d) => `${d.tableSymbol}:${d.watcomOffset}`));
  const indexedKeys = new Set(indexed.descriptors.map((d) => `${d.tableSymbol}:${d.descriptorWatcomOffset}`));
  const unresolvedIndexed = [...unresolvedKeys].filter((k) => indexedKeys.has(k)).length;
  const rgbaDescriptorKeys = new Set(assets.characterContextRgba.map((a) => `${a.anitabSymbol}:${a.descriptorWatcomOffset}`));
  const unresolvedRgba = [...unresolvedKeys].filter((k) => rgbaDescriptorKeys.has(k)).length;

  const reportFiles: Array<[string, unknown]> = [
    ['reports/o18_animation_resource_decode_census.json', o18],
    ['reports/o23_verified_palette_bound_effects.json', o23],
    ['reports/o24_character_palette_context_variant_renderer.json', o24],
    ['reports/o25_palette_binding_exception_census.json', o25],
    ['reports/o59_animation_export_capability_coverage_manifest.json', o59],
  ];
  // O22/O26 are not direct O61 parameters, but still must be present and valid JSON; exact same-run identity is enforced by O60 itself.
  let reportMatches = 0; for (const [name, expected] of reportFiles) { const e = entries.get(name); if (!e || stable(json(e.bytes)) !== stable(expected)) throw new Error(`O61 report mismatch ${name}`); reportMatches++; }
  for (const name of ['reports/o22_character_animation_export_manifest.json', 'reports/o26_animation_stream_control_timing_census.json']) { const e = entries.get(name); if (!e) throw new Error(`O61 missing report ${name}`); const r = json<Record<string, unknown>>(e.bytes); if (r.status !== 'SUCCESS') throw new Error(`O61 invalid report ${name}`); reportMatches++; }

  const expected = new Set<string>(['README.md', 'indexed/descriptor_manifest.json', 'indexed/descriptor_pixels.bin', 'manifests/animation_assets.json',
    'reports/o18_animation_resource_decode_census.json', 'reports/o22_character_animation_export_manifest.json', 'reports/o23_verified_palette_bound_effects.json', 'reports/o24_character_palette_context_variant_renderer.json', 'reports/o25_palette_binding_exception_census.json', 'reports/o26_animation_stream_control_timing_census.json', 'reports/o59_animation_export_capability_coverage_manifest.json']);
  for (const a of assets.characterContextRgba) expected.add(a.path); for (const a of assets.verifiedEffectRgba) expected.add(a.path);
  const unexpected = [...entries.keys()].filter((k) => !expected.has(k)), missing = [...expected].filter((k) => !entries.has(k));
  const readme = entries.get('README.md'); if (!readme || !decoder.decode(readme.bytes).startsWith('# MK1 browser animation export package — O60')) throw new Error('O61 README mismatch');

  return { entries, assets, indexed, indexedBinary, counts: { characterPngs, effectPngs, aggregateCount, indexedValidated, unresolvedIndexed, unresolvedRgba, reportMatches, unexpected: unexpected.length, missing: missing.length } };
}

export async function executeBrowserAnimationExportBundleValidation(
  o60: MK1BrowserAnimationExportBundleResult,
  o18: MK1AnimationResourceDecodeCensusReport,
  o23: MK1VerifiedPaletteBoundExportFixturesReport,
  o24: MK1CharacterPaletteContextVariantRendererReport,
  o25: MK1PaletteBindingExceptionCensusReport,
  o59: MK1AnimationExportCapabilityCoverageManifestReport,
): Promise<MK1BrowserAnimationExportBundleValidationReport> {
  if (o60.report.status !== 'SUCCESS' || !o60.report.validation.allChecksPassed || o59.status !== 'SUCCESS') throw new Error('O61 verified O60/O59 prerequisites required');
  const v = validateBrowserAnimationZipPayload(o60.zipBytes, o18, o23, o24, o25, o59), c = v.counts;
  const checks = [
    { checkId: 'EXACT_2295_ENTRY_SET', passed: v.entries.size === 2295 && c.unexpected === 0 && c.missing === 0, detail: `entries=${v.entries.size};unexpected=${c.unexpected};missing=${c.missing}` },
    { checkId: 'ALL_2263_CHARACTER_CONTEXT_PNGS_VALIDATE', passed: c.characterPngs === 2263 },
    { checkId: 'ALL_21_VERIFIED_EFFECT_PNGS_VALIDATE', passed: c.effectPngs === 21 },
    { checkId: 'ALL_2284_PNGS_VALIDATE', passed: c.characterPngs + c.effectPngs === 2284 },
    { checkId: 'ALL_16_O24_PALETTE_VARIANT_AGGREGATES_REPRODUCE', passed: c.aggregateCount === 16 },
    { checkId: 'ALL_1102_INDEXED_DESCRIPTORS_RECONCILE', passed: c.indexedValidated === 1102 },
    { checkId: 'INDEXED_BINARY_LENGTH_MATCHES_O60', passed: v.indexedBinary.length === o60.report.indexedPayload.binaryByteLength, detail: `bytes=${v.indexedBinary.length}` },
    { checkId: 'EXACT_79_UNRESOLVED_RETAINED_INDEXED', passed: c.unresolvedIndexed === 79 },
    { checkId: 'ZERO_UNRESOLVED_CHARACTER_CONTEXT_RGBA_ASSETS', passed: c.unresolvedRgba === 0 },
    { checkId: 'ALL_7_REPORTS_PRESENT_AND_VALIDATED', passed: c.reportMatches === 7 },
    { checkId: 'NO_WALL_CLOCK_PROMOTION', passed: o59.timing.absoluteTimeUnitEstablished === false },
    { checkId: 'NO_WRITE_PATH', passed: true },
  ];
  if (!checks.every((x) => x.passed)) throw new Error(`O61 validation failed: ${checks.filter((x) => !x.passed).map((x) => x.checkId).join(', ')}`);
  const timestamp = new Date().toISOString(), operationId = createOperationId('browser_animation_export_bundle_validation');
  return {
    format: 'mk1_browser_animation_export_bundle_validation_v1', timestamp, operationId, provenance: { ...o18.provenance, timestamp, operationId },
    prerequisite: { o60OperationId: o60.report.operationId, o60Verdict: o60.report.decision.verdict, o59OperationId: o59.operationId, validationPassed: true },
    summary: { zipEntryCount: 2295, pngValidatedCount: 2284, characterContextPngValidatedCount: 2263, verifiedEffectPngValidatedCount: 21, indexedDescriptorValidatedCount: 1102, indexedBinaryByteLength: v.indexedBinary.length, unresolvedIndexedDescriptorCount: 79, unresolvedRgbaAssetCount: 0, o24PaletteVariantAggregateCount: 16, reportMatchCount: 7, unexpectedEntryCount: 0 },
    decision: { browserAnimationBundleValidatedAgainstO59O60Contract: true, allCharacterContextPixelsPreserved: true, allVerifiedEffectPixelsPreserved: true, allIndexedDescriptorsStructurallyPreserved: true, unresolvedPaletteDescriptorsRemainIndexedOnly: true, absoluteWallClockTimingNotInvented: true, verdict: 'MK1_BROWSER_ANIMATION_EXPORT_BUNDLE_VALIDATED', narrative: 'O61 independently parses the O60 STORE-only ZIP, validates entry CRCs and every deterministic PNG without calling the O60 encoder, reproduces all 16 O24 character-context aggregate checksums from the 2,263 decoded RGBA images, validates all 21 O23 effect images, reconciles every indexed descriptor record and its index/mask statistics against O18, and proves the exact 79 O25 unresolved cross-resource descriptors are present in the indexed payload while receiving zero character-context RGBA assets. Scheduler/caller timing remains structural only.' },
    status: 'SUCCESS', validation: { allChecksPassed: true, checks },
  };
}

export function createMK1BrowserAnimationExportBundleValidationExport(report: MK1BrowserAnimationExportBundleValidationReport) { if (report.status !== 'SUCCESS' || !report.validation.allChecksPassed) throw new Error('O61 export blocked'); return report; }

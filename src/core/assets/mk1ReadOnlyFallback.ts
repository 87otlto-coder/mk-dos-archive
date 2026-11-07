/**
 * O191: a deliberately independent, read-only MK1 resource-browser path.
 *
 * The forensic authoring/reassembly workflows are tied to one exact MK1.EXE
 * hash. A patched executable must NOT be passed to those workflows, but
 * neither should their canonical-file guard prevent ordinary asset browsing.
 *
 * No source bytes are modified here. Known Kano geometry is checked against
 * the provided executable and GRA before any optional index previews are
 * admitted. The index previews are grayscale, NOT asserted palette ownership.
 */
import { DirectorySource } from '../filesystem/DirectorySource';
import { Asset, AssetCollection, hash, safeName } from './model';
import { indexedRgba } from './mk3Collection';
import { decodeUgraSprite } from '../../games/mk1/graphics/ugraDecoder';

const KANO_FIRST_DESCRIPTOR = 0x000a7464;
const KANO_LAST_DESCRIPTOR = 0x000a7d20;
const KANO_ARRAY_INTERRUPTION = 0x000a7b30;
const ORIGINAL_KANO_GRA_SIZE = 595504;
const ORIGINAL_EXE_SIZE = 1157222;
const MAX_GRA_SIZE = 32 * 1024 * 1024;

function le16(b: Uint8Array, p: number) { return b[p] | (b[p + 1] << 8); }
function le32(b: Uint8Array, p: number) {
  return (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0;
}
function i16(b: Uint8Array, p: number) {
  const v = le16(b, p);
  return v >= 0x8000 ? v - 0x10000 : v;
}

export async function scanMK1ReadOnlyFallback(
  source: DirectorySource,
  progress: (message: string) => void,
  signal?: AbortSignal,
  fullPipelineFailure?: string,
): Promise<AssetCollection> {
  const entries = await source.listRecursive();
  const exeEntry = entries.find(e => e.name.toUpperCase() === 'MK1.EXE');
  if (!exeEntry) throw new Error('MK1.EXE is required to identify the read-only MK1 resource layout.');
  const graEntries = entries.filter(e => e.extension.toUpperCase() === 'GRA')
    .sort((a, b) => a.path.localeCompare(b.path));
  if (!graEntries.length) throw new Error('No MK1 .GRA graphics resources were found.');

  const assets: Asset[] = [];
  const failures: string[] = [];
  let knownKanoFrames = 0;
  for (const entry of graEntries) {
    signal?.throwIfAborted();
    if (entry.size > MAX_GRA_SIZE) {
      failures.push(`${entry.path}: over conservative 32 MiB read-only resource limit`);
      continue;
    }
    progress(`Read-only catalogue: ${entry.path}`);
    const bytes = await source.readSlice(entry.path, 0, entry.size);
    if (bytes.length !== entry.size) {
      failures.push(`${entry.path}: incomplete read`);
      continue;
    }
    const sha256 = await hash(bytes);
    assets.push({
      id: `mk1-resource:${entry.path}`,
      name: entry.name,
      group: 'MK1 original graphics resources',
      kind: 'raw', format: 'GRA',
      confidence: 'Original resource bytes; no palette/animation semantics inferred',
      source: { path: entry.path, offset: 0, length: bytes.length, sha256 },
      metadata: { mode: 'READ_ONLY_FALLBACK', originalFile: true, decodeStatus: 'Uninterpreted resource; selectable for lossless export' },
      bytes, filename: entry.name,
    });

    // The previously documented Kano run may be decoded independently of the
    // Rayden projectile experiment. It is never inferred for arbitrary GRA files.
    if (entry.name.toUpperCase() !== 'KANO.GRA' || entry.size !== ORIGINAL_KANO_GRA_SIZE ||
        exeEntry.size !== ORIGINAL_EXE_SIZE) continue;
    signal?.throwIfAborted();
    const exe = await source.readSlice(exeEntry.path, 0, exeEntry.size);
    if (exe.length !== exeEntry.size) { failures.push('Kano descriptor preview: MK1.EXE read incomplete'); continue; }
    const p = KANO_FIRST_DESCRIPTOR;
    const canonicalAnchor = le16(exe, p) === 58 && le16(exe, p + 2) === 104 &&
      i16(exe, p + 4) === 23 && i16(exe, p + 6) === -7 && le32(exe, p + 8) === 0x23000000;
    if (!canonicalAnchor) {
      failures.push('Kano indexed previews omitted: original descriptor anchor not present');
      continue;
    }
    const pending: Asset[] = [];
    for (let offset = KANO_FIRST_DESCRIPTOR; offset <= KANO_LAST_DESCRIPTOR;) {
      signal?.throwIfAborted();
      const width = le16(exe, offset), height = le16(exe, offset + 2);
      const x = i16(exe, offset + 4), y = i16(exe, offset + 6), packed = le32(exe, offset + 8);
      const graOffset = packed & 0xffffff;
      if (width < 1 || width > 319 || height < 1 || height > 239 ||
          x < -256 || x > 256 || y < -256 || y > 256 ||
          (packed >>> 24) !== 35 || graOffset >= bytes.length) {
        failures.push(`Kano preview stopped: descriptor structural mismatch at 0x${offset.toString(16)}`);
        break;
      }
      const decoded = decodeUgraSprite(bytes, graOffset, width, height);
      if (!decoded.success || decoded.indices.length !== width * height) {
        failures.push(`Kano preview stopped: bounded decode failed at 0x${offset.toString(16)}`);
        break;
      }
      pending.push({
        id: `mk1-kano-index:${offset.toString(16)}`,
        name: `KANO descriptor 0x${offset.toString(16).toUpperCase()}`,
        group: 'MK1 Kano · indexed sprite previews',
        kind: 'sprite', format: 'Grayscale index PNG',
        confidence: 'Bounded source descriptor/uGRA decode; original color palette unassigned',
        source: { path: entry.path, offset: graOffset, length: decoded.encodedBytesConsumed, sha256 },
        metadata: { mode: 'READ_ONLY_FALLBACK', descriptorPhysical: offset, width, height, x, y,
          graOffset, checksum: decoded.checksum, palette: 'UNRESOLVED', indexedPreviewOnly: true,
          indices: decoded.indices, mask: decoded.opaqueMask },
        width, height, rgba: indexedRgba(decoded.indices, decoded.opaqueMask),
        filename: `KANO_${offset.toString(16)}_index-preview.png`,
      });
      offset += offset === KANO_ARRAY_INTERRUPTION ? 16 : 12;
    }
    // Do not publish a partial run as if it established the canonical 187.
    if (pending.length === 187) { assets.push(...pending); knownKanoFrames = pending.length; }
    else failures.push(`Kano preview omitted: only ${pending.length}/187 descriptor frames independently decoded`);
  }
  const limitations = [
    'Read-only fallback: strict canonical-fixture research/editors were not executed. Original files are unchanged.',
    'This catalogue exposes GRA resource bytes. Only the separately anchored Kano descriptor run receives optional grayscale pixel previews.',
    'Index previews do not establish original palette ownership, gameplay animation membership, or general replacement/reassembly safety.',
  ];
  if (fullPipelineFailure) limitations.unshift(`Full canonical research pipeline unavailable: ${fullPipelineFailure}`);
  if (failures.length) limitations.push(`${failures.length} read-only limitations are recorded in exported evidence.`);
  return {
    game: 'mk1', assets, packages: [],
    reports: { mode: 'MK1_READ_ONLY_FALLBACK', source: source.directoryName,
      originalExeSize: exeEntry.size, originalGraFiles: graEntries.length,
      indexedKanoFrames: knownKanoFrames, fullPipelineFailure: fullPipelineFailure ?? null, failures },
    limitations,
  };
}

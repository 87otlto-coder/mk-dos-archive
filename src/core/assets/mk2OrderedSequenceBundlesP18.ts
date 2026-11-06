/** P18: make original MK2 source-order frame groups usable as single previews/exports.
 * Applies previously qualified O136/O177/O176 (six effect tracks) and O220/O221
 * (two Pit II bridge loops). Does NOT invent native playback rate or placement.
 * This adapter consumes validated source assets; it does not decode game bytes.
 */
import type { Asset } from './model';
import { safeName, utf8 } from './model';
import { selectedZip } from './export';
import { parseAnimationStoreZip } from '../../games/mk1/research/browserAnimationExportBundleValidation';
import { buildStoredZip } from '../research/researchArtifactDownloads';

const TRACKS = [
  { name: 'tomb_flying_a', family: 'effect', count: 8, list: 0x17814, control: 'ONE_MARKER_BACK_REFERENCE', resource: 'tomb.gra' },
  { name: 'tomb_flying_b', family: 'effect', count: 8, list: 0x177ec, control: 'ONE_MARKER_BACK_REFERENCE', resource: 'tomb.gra' },
  { name: 'portal_swaying', family: 'effect', count: 7, list: 0x164b4, control: 'ONE_MARKER_BACK_REFERENCE', resource: 'portal.gra' },
  { name: 'portal_hanging', family: 'effect', count: 7, list: 0x164d8, control: 'ZERO_TERMINATED', resource: 'portal.gra' },
  { name: 'portal_electric', family: 'effect', count: 6, list: 0x164f8, control: 'ZERO_TERMINATED', resource: 'portal.gra' },
  { name: 'tower_original_effect', family: 'effect', count: 7, list: 0x16490, control: 'ONE_MARKER_BACK_REFERENCE', resource: 'tower.gra' },
  { name: 'green', family: 'bridge', count: 7, list: 0x18afc, control: 'ONE_MARKER_BACK_REFERENCE', resource: 'pit.gra' },
  { name: 'flame', family: 'bridge', count: 7, list: 0x18b20, control: 'ONE_MARKER_BACK_REFERENCE', resource: 'pit.gra' },
] as const;

export const MK2_P18_SOURCE_SEQUENCE_LIMITATION =
  'P18 ordered contact sheets and frame ZIPs are sourced from verified O136/O177/O176 and O220/O221 ' +
  'original executable lists. Cells are a DIAGNOSTIC layout, not original world positions. ' +
  'Frame order and original loop/zero markers are established; frame milliseconds, activation, ' +
  'stage composition, live camera, draw order and runtime DAC palette selection are NOT established. ' +
  'Frame ZIPs retain each original indexed pixel plane and opacity mask; user must choose any presentation timing.';

export interface P18OrderedSequenceResult {
  assets: Asset[];
  packages: Array<{ name: string; bytes: Uint8Array }>;
  status: { status: 'VERIFIED' | 'UNAVAILABLE'; count: number; tracks: number; sourceFrames: number; detail?: string };
}
function requireFact(ok: unknown, reason: string): asserts ok {
  if (!ok) throw Error('P18 original MK2 source sequence: ' + reason);
}
function orderedFrames(spec: typeof TRACKS[number], stageAssets: Asset[], bridgeAssets: Asset[]) {
  return Array.from({ length: spec.count }, (_, i) => {
    const id = spec.family === 'effect'
      ? `mk2-stage-effect:${spec.name}:${String(i).padStart(2, '0')}`
      : `mk2-pit-bridge:${spec.name}:${i}`;
    const list = spec.family === 'effect' ? stageAssets : bridgeAssets;
    const hits = list.filter(asset => asset.id === id);
    requireFact(hits.length === 1, `exactly one verified source frame ${id}`);
    const frame = hits[0];
    requireFact(frame.rgba instanceof Uint8Array, 'opaque frame metadata contract');
    const indexes = frame.metadata.indices, mask = frame.metadata.mask;
    requireFact(indexes instanceof Uint8Array && mask instanceof Uint8Array, `original indexed sidecars ${id}`);
    requireFact(Number.isSafeInteger(frame.width) && Number.isSafeInteger(frame.height)
      && frame.width! > 0 && frame.height! > 0, `source native dimensions ${id}`);
    requireFact(indexes.length === frame.width! * frame.height! && mask.length === indexes.length
      && frame.rgba!.length === indexes.length * 4, `source index/RGBA extents ${id}`);
    requireFact(frame.source.path.toLowerCase() === spec.resource, `source resource path ${id}`);
    if (spec.family === 'effect') {
      requireFact(frame.metadata.sourceFrameOrdinal === i && frame.metadata.sequence === spec.name,
        `O136 source order ${id}`);
      requireFact(frame.metadata.sourcePointerObject2 === spec.list && frame.metadata.controlType === spec.control,
        `O136 original EXE pointer/control ${id}`);
      requireFact(frame.metadata.animationFPSKnown === false && frame.metadata.runtimeActivationKnown === false,
        `original O136 frame time/activation unknown ${id}`);
    } else {
      requireFact(frame.metadata.sourcePoseOrdinal === i && frame.metadata.originalListObject2 === spec.list,
        `O221 original order/list ${id}`);
      requireFact(frame.metadata.sourceLoopEstablished === true
        && frame.metadata.nativeFrameDurationVerified === false, `O221 source-loop timing boundary ${id}`);
    }
    return frame;
  });
}
function sheet(frames: Asset[]) {
  const cellWidth = Math.max(...frames.map(a => a.width!));
  const cellHeight = Math.max(...frames.map(a => a.height!));
  const width = cellWidth * frames.length, height = cellHeight;
  const rgba = new Uint8Array(width * height * 4);
  const indices = new Uint8Array(width * height), mask = new Uint8Array(width * height);
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i], ix = f.metadata.indices as Uint8Array, m = f.metadata.mask as Uint8Array;
    for (let y = 0; y < f.height!; y++) for (let x = 0; x < f.width!; x++) {
      const src = y * f.width! + x, dst = y * width + i * cellWidth + x;
      indices[dst] = ix[src];mask[dst] = m[src];
      rgba.set(f.rgba!.subarray(src*4,src*4+4),dst*4);
    }
  }
  return { width, height, rgba, indices, mask, cellWidth, cellHeight };
}
export function buildMK2OrderedSequenceBundlesP18(stageAssets: Asset[], bridgeAssets: Asset[]): P18OrderedSequenceResult {
  try {
    const effectCount = stageAssets.filter(a => a.id.startsWith('mk2-stage-effect:')).length;
    const bridgeCount = bridgeAssets.filter(a => a.id.startsWith('mk2-pit-bridge:')).length;
    requireFact(effectCount === 43 && bridgeCount === 14, 'all 43 O136/O177 + 14 O220/O221 original sprites required');
    const assets: Asset[] = [], packages: P18OrderedSequenceResult['packages'] = [];
    for (const spec of TRACKS) {
      const frames = orderedFrames(spec, stageAssets, bridgeAssets);
      const mosaic = sheet(frames);
      const list = spec.list;
      const manifest = {
        format: 'mkdos_p18_original_ordered_animation_bundle_v1',
        sourceQualification: spec.family === 'effect' ? 'O136/O177 source descriptor and list' : 'O220/O221 source list and callback',
        resource: spec.resource, sourceListObject2: list, sourceListHex: `0x${list.toString(16)}`,
        originalControl: spec.control, sourceLoopBack: spec.control === 'ONE_MARKER_BACK_REFERENCE',
        sourceFrameCount: frames.length, frameTimingVerified: false, nativeFrameDurationMilliseconds: null,
        activationVerified: false, finalStagePlacementVerified: false, runtimeDacSelectionVerified: false,
        contactSheet: { cells: frames.length, cellWidth: mosaic.cellWidth, cellHeight: mosaic.cellHeight,
          arrangement: 'diagnostic strip only; not runtime placement or timing' },
        frames: frames.map((f, i) => ({ sourceOrder: i, assetId: f.id,
          originalGraOffset: f.source.offset, originalEncodedBytes: f.source.length,
          originalResourceSha256: f.source.sha256,
          originalDescriptor: f.metadata.descriptorObject2 ?? f.metadata.originalDescriptorPhysical,
          sourceX: f.metadata.sourceX ?? null, sourceY: f.metadata.sourceY ?? null,
          width: f.width, height: f.height, sourceIndicesFile: `indexed/${String(i).padStart(5,'0')}_indices.bin`,
          sourceMaskFile: `indexed/${String(i).padStart(5,'0')}_mask.bin`,
          previewPngFile: `assets/${String(i).padStart(5,'0')}_${safeName(f.filename)}` })),
        limitation: MK2_P18_SOURCE_SEQUENCE_LIMITATION,
      };
      const files: Array<{name:string;bytes:Uint8Array}> = [
        { name:'sequence.json', bytes:utf8.encode(JSON.stringify(manifest,null,2)) },
        { name:'README.txt', bytes:utf8.encode(MK2_P18_SOURCE_SEQUENCE_LIMITATION+'\n') },
      ];
      // Reuse the same PNG encoder as the browser's individual frame downloads.
      // Selected ZIP embeds the original per-frame source planes and metadata.
      const selected = parseAnimationStoreZip(selectedZip(frames));
      for (const [name, value] of selected) files.push({name, bytes:value.bytes});
      const archive = buildStoredZip(files);
      const label=spec.family==='effect'?`stage_${spec.name}`:`pit_bridge_${spec.name}`;
      packages.push({name:`MK2_P18_${safeName(label)}_SOURCE_ORDER.zip`,bytes:archive});
      assets.push({
        id:`mk2-source-animation-sheet:${label}`,
        name:`MK2 ${label.replaceAll('_',' ')} · ${frames.length} source poses`,
        group:'MK2 original source-ordered animation contact sheets (timing unknown)',
        kind:'image',format:'PNG · original source-ordered contact sheet (NOT timed animation)',
        confidence:'O136/O177 or O220/O221 source order VERIFIED; runtime timing/placement/palette UNVERIFIED',
        source:{path:spec.resource,offset:0,length:0,sha256:frames[0].source.sha256},
        metadata:{sourceResearch:manifest.sourceQualification,sourceListObject2:list,
          sourceControl:spec.control,frameCount:frames.length,sourceOrderAssetIds:frames.map(f=>f.id),
          contactSheetCellWidth:mosaic.cellWidth,contactSheetCellHeight:mosaic.cellHeight,
          indices:mosaic.indices,mask:mosaic.mask,paletteKnownMask:new Uint8Array(mosaic.indices.length),
          originalFrameZip:packages.at(-1)!.name,sourceFrameTimingKnown:false,
          livePlaybackKnown:false,completeStageComposition:false,sourcePreviewPaletteIsRuntimeVerified:false,
          contactSheetIsDiagnostic:true},
        rgba:mosaic.rgba,width:mosaic.width,height:mosaic.height,
        filename:`MK2_P18_${safeName(label)}_source_order_contact_sheet.png`,
      });
    }
    requireFact(assets.length === 8 && packages.length === 8, 'all eight source lists assembled');
    return {assets,packages,status:{status:'VERIFIED',count:8,tracks:8,sourceFrames:57}};
  } catch (error) {
    return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,tracks:0,sourceFrames:0,detail:String(error)}};
  }
}

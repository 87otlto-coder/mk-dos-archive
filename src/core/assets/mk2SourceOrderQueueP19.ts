/** P19: transfer verified P18 MK2 source-list frames into the existing
 * user-timed presentation queue. This is NOT an original game animation clock.
 * Does not alter pixel data, palette masks, source order or game files.
 */
import type { Asset } from './model';

export interface MK2SourceOrderPresentation {
  sourceSheetId: string;
  sourceListObject2: number;
  originalControl: 'ONE_MARKER_BACK_REFERENCE' | 'ZERO_TERMINATED';
  frames: Asset[];
  timing: 'USER_SELECTED_PRESENTATION_ONLY';
}

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw new Error(`P19 verified source-order queue: ${reason}`);
}

export function resolveMK2OriginalSourceOrder(
  sheet: Asset,
  lookup: ReadonlyMap<string, Asset>,
): MK2SourceOrderPresentation {
  demand(sheet.id.startsWith('mk2-source-animation-sheet:'), 'not a P18 original source-list contact sheet');
  const m = sheet.metadata;
  const ids = m.sourceOrderAssetIds;
  demand(Array.isArray(ids) && ids.length >= 2 && ids.length <= 16 &&
    ids.every((id: unknown) => typeof id === 'string' && id.length > 0), 'source frame ID list');
  demand(ids.length === m.frameCount && new Set(ids).size === ids.length, 'exact ordered source frame count/uniqueness');
  demand(Number.isSafeInteger(m.sourceListObject2) && Number(m.sourceListObject2) > 0, 'original EXE source-list pointer');
  demand(m.sourceControl === 'ONE_MARKER_BACK_REFERENCE' || m.sourceControl === 'ZERO_TERMINATED', 'original control marker');
  demand(m.sourceFrameTimingKnown === false && m.livePlaybackKnown === false &&
    m.completeStageComposition === false && m.sourcePreviewPaletteIsRuntimeVerified === false &&
    m.contactSheetIsDiagnostic === true, 'original runtime uncertainty retained');
  demand(typeof m.originalFrameZip === 'string' && m.originalFrameZip.endsWith('_SOURCE_ORDER.zip'),
    'original source-order evidence package identifier');
  demand(Number.isSafeInteger(m.contactSheetCellWidth) && Number(m.contactSheetCellWidth) > 0 &&
    Number.isSafeInteger(m.contactSheetCellHeight) && Number(m.contactSheetCellHeight) > 0 &&
    sheet.width === Number(m.contactSheetCellWidth) * ids.length &&
    sheet.height === Number(m.contactSheetCellHeight), 'diagnostic contact-sheet geometry');

  const frames: Asset[] = [];
  const pointer = Number(m.sourceListObject2);
  for (let ordinal = 0; ordinal < ids.length; ordinal++) {
    const id = ids[ordinal] as string;
    const frame = lookup.get(id);
    demand(frame && frame.id === id && frame.kind === 'sprite' &&
      frame.rgba instanceof Uint8Array && Number.isSafeInteger(frame.width) &&
      Number.isSafeInteger(frame.height) && frame.width! > 0 && frame.height! > 0,
      `authentic, previewable source frame ${ordinal}`);
    const indexes = frame.metadata.indices, mask = frame.metadata.mask;
    demand(indexes instanceof Uint8Array && mask instanceof Uint8Array &&
      indexes.length === frame.width! * frame.height! && mask.length === indexes.length &&
      frame.rgba!.length === 4 * indexes.length, `lossless original index and transparency planes ${id}`);
    demand(frame.source.path.toLowerCase() === sheet.source.path.toLowerCase() &&
      frame.source.sha256 && frame.source.sha256 === sheet.source.sha256,
      `original resource provenance ${id}`);
    if (id.startsWith('mk2-stage-effect:')) {
      demand(frame.metadata.sourceFrameOrdinal === ordinal &&
        frame.metadata.sourcePointerObject2 === pointer &&
        frame.metadata.controlType === m.sourceControl &&
        frame.metadata.animationFPSKnown === false &&
        frame.metadata.runtimeActivationKnown === false,
        `O136 original source ordering/control without invented timing ${id}`);
    } else if (id.startsWith('mk2-pit-bridge:')) {
      demand(frame.metadata.sourcePoseOrdinal === ordinal &&
        frame.metadata.originalListObject2 === pointer &&
        frame.metadata.sourceLoopEstablished === true &&
        frame.metadata.nativeFrameDurationVerified === false &&
        m.sourceControl === 'ONE_MARKER_BACK_REFERENCE',
        `O221 bridge source ordering/control without invented timing ${id}`);
    } else {
      throw new Error(`P19 verified source-order queue: unsupported source frame identity ${id}`);
    }
    frames.push(frame);
  }
  demand(frames.length === ids.length, 'all original frames resolved');
  return {
    sourceSheetId: sheet.id,
    sourceListObject2: pointer,
    originalControl: m.sourceControl as MK2SourceOrderPresentation['originalControl'],
    frames,
    timing: 'USER_SELECTED_PRESENTATION_ONLY',
  };
}

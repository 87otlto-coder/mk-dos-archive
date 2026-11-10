import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { Asset, AssetCollection, Game, utf8 } from '../core/assets/model';
import { scanAssets } from '../core/assets/collection';
import { matchesAssetSearchP55 } from '../core/assets/assetSearchP55';
import { buildMK3FighterIndexedBundleP69 } from '../core/assets/mk3FighterIndexedBundleP69';
import { buildMK3CueMusicBundleP70 } from '../core/assets/mk3CueAudioBundleP70';
import { recoverMK3P76RowMappedAssets } from '../core/assets/mk3NonIffRowMappedP76';
import { recoverMK3P80LeadingAssets, MK3_P80_BASE_GROUP, MK3_P80_RAW_GROUP } from '../core/assets/mk3LeadingSpanP80';
import {
  recoverMK3P78AdditionalChainedAssets,
  MK3_P78_ADDITIONAL_GROUP,
} from '../core/assets/mk3ChainedSourceImagesP78';
import {
  compareMK3FighterWithIffCmapP72,
  exportMK3PaletteComparisonP72,
  listMK3IffPaletteComparisonsP72,
} from '../core/assets/mk3SourcePaletteComparisonP72';
import { resolveMK2OriginalSourceOrder } from '../core/assets/mk2SourceOrderQueueP19';
import { importMK2P83StageZip } from '../core/assets/mk2NativeStageZipP83';
import {
  animatedPng,
  assetBytes,
  indexedAssetZip,
  compose,
  download,
  metadata,
  Placement,
  png,
  selectedZip,
  spriteSheet,
} from '../core/assets/export';
import './AssetBrowser.css';
import { MidiPreview } from './MidiPreview';

interface QueueItem {
  key: string;
  assetId: string;
}

function Picture({ asset }: { asset: Asset }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [pngUrl,setPngUrl] = useState('');
  useEffect(() => {
    if (!asset.rgba || !asset.width || !asset.height || !ref.current) return;
    const c = ref.current;
    c.width = asset.width;
    c.height = asset.height;
    c.getContext('2d')!.putImageData(
      new ImageData(new Uint8ClampedArray(asset.rgba), asset.width, asset.height),
      0,
      0,
    );
  }, [asset]);
  useEffect(() => {
    if(asset.rgba || asset.mime!=='image/png' || !asset.bytes) {
      setPngUrl('');
      return;
    }
    const url=URL.createObjectURL(new Blob([asset.bytes.slice().buffer],{type:'image/png'}));
    setPngUrl(url);
    return ()=>URL.revokeObjectURL(url);
  }, [asset]);
  return asset.rgba ? (
    <canvas ref={ref} />
  ) : asset.mime==='image/png' && asset.bytes && pngUrl ? (
    <img src={pngUrl} alt={asset.name} loading="lazy" />
  ) : (
    <span className="asset-symbol">
      {asset.kind === 'audio' ? '♫' : asset.kind === 'music' ? '♪' : '▤'}
    </span>
  );
      {asset.kind === 'audio' ? '♫' : asset.kind === 'music' ? '♪' : '▤'}
    </span>
  );
}

function AudioPreview({ asset }: { asset: Asset }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!asset.bytes) return;
    const u = URL.createObjectURL(new Blob([asset.bytes.slice().buffer], { type: asset.mime }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [asset]);
  return <audio controls src={url} />;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function AssetBrowser({ source, game, initialSearch = '', navigationRevision = 0, initialCollection = null, onCollectionLoaded }: { source: DirectorySource; game: Game; initialSearch?: string; navigationRevision?: number; initialCollection?: AssetCollection | null; onCollectionLoaded?: (collection:AssetCollection)=>void }) {
  const [collection, setCollection] = useState<AssetCollection | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialSearch);
  const [kind, setKind] = useState('');
  const [group, setGroup] = useState('');
  const [page, setPage] = useState(0);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [focus, setFocus] = useState<Asset | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [layers, setLayers] = useState<Placement[]>([]);
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(400);
  const [frameMs, setFrameMs] = useState(100);
  const [columns, setColumns] = useState(8);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const [loadedSourceOrder, setLoadedSourceOrder] = useState<{ sheetId: string; frameIds: string[]; originalControl: string } | null>(null);
  const [indexedFtrBusy, setIndexedFtrBusy] = useState(false);
  const indexedFtrRun = useRef(0);
  const [cueAudioBusy, setCueAudioBusy] = useState(false);
  const cueAudioRun = useRef(0);
  const [selectedComparisonIffId, setSelectedComparisonIffId] = useState('');
  const [comparisonBusy, setComparisonBusy] = useState(false);
  const comparisonRun = useRef(0);
  const [rowMapsBusy, setRowMapsBusy] = useState(false);
  const rowMapsRun = useRef(0);
  const rowMapsAbort = useRef<AbortController | null>(null);
  const [chainedBusy, setChainedBusy] = useState(false);
  const chainedRun = useRef(0);
  const chainedAbort = useRef<AbortController | null>(null);
  const [leadingBusy, setLeadingBusy] = useState(false);
  const leadingRun = useRef(0);
  const leadingAbort = useRef<AbortController | null>(null);
  const [p83Busy,setP83Busy] = useState(false);
  const p83Run = useRef(0);
  const p83Abort = useRef<AbortController | null>(null);

  const abort = useRef<AbortController | null>(null);
  const scanRun = useRef(0);
  const queueSerial = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const layerDrag = useRef<{ index: number; dx: number; dy: number; pointerId: number } | null>(null);

  const makeQueueItem = (assetId: string): QueueItem => ({
    key: `queue-${++queueSerial.current}`,
    assetId,
  });

  useEffect(() => {
    scanRun.current += 1;
    indexedFtrRun.current += 1;
    cueAudioRun.current += 1;
    comparisonRun.current += 1;
    rowMapsRun.current += 1;
    chainedRun.current += 1;
    leadingRun.current += 1;
    p83Run.current += 1;
    p83Abort.current?.abort();
    p83Abort.current = null;
    setP83Busy(false);
    leadingAbort.current?.abort();
    leadingAbort.current = null;
    setLeadingBusy(false);
    chainedAbort.current?.abort();
    chainedAbort.current = null;
    setChainedBusy(false);
    rowMapsAbort.current?.abort();
    rowMapsAbort.current = null;
    setRowMapsBusy(false);
    setSelectedComparisonIffId('');
    setComparisonBusy(false);
    setIndexedFtrBusy(false);
    setCueAudioBusy(false);
    abort.current?.abort();
    abort.current = null;
    setCollection(null);
    setQueue([]);
    setLayers([]);
    setFocus(null);
    setAnchor(null);
    setPlaying(false);
    setFrame(0);
    setLoadedSourceOrder(null);
    setSelectedComparisonIffId('');
    setProgress('');
    setError('');
    setBusy(false);
    return () => { abort.current?.abort(); p83Abort.current?.abort(); p83Run.current += 1; leadingAbort.current?.abort(); leadingRun.current += 1; chainedAbort.current?.abort(); chainedRun.current += 1; rowMapsAbort.current?.abort(); rowMapsRun.current += 1; indexedFtrRun.current += 1; cueAudioRun.current += 1; comparisonRun.current += 1; };
  }, [source, game]);

  // O194: Compilation results arrive independently of this view. Preserve local browsing state.
  useEffect(() => { if (initialCollection) setCollection(current => current ?? initialCollection); }, [initialCollection]);
  const assets = collection?.assets ?? [];
  const lookup = useMemo(() => new Map(assets.map(a => [a.id, a])), [assets]);
  const originalIffCmaps = useMemo(
    () => game === 'mk3' ? listMK3IffPaletteComparisonsP72(assets) : [],
    [assets, game],
  );
  const selectedIffCmap = originalIffCmaps.find(
    choice => choice.sourceIffAsset.id === selectedComparisonIffId,
  )?.sourceIffAsset;
  const comparison = useMemo(() => {
    if (!focus || !selectedIffCmap || focus.kind !== 'sprite' || game !== 'mk3') return null;
    try {
      return { value: compareMK3FighterWithIffCmapP72(focus, selectedIffCmap) };
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }, [focus, selectedIffCmap, game]);
  const selectedRows = useMemo(
    () => queue.flatMap(item => {
      const asset = lookup.get(item.assetId);
      return asset ? [{ item, asset }] : [];
    }),
    [queue, lookup],
  );
  const selected = useMemo(() => selectedRows.map(row => row.asset), [selectedRows]);
  const selectedAssetIds = useMemo(() => new Set(queue.map(item => item.assetId)), [queue]);
  const filtered = useMemo(
    () =>
      assets.filter(
        a =>
          (!kind || a.kind === kind) &&
          (!group || a.group === group) &&
          matchesAssetSearchP55(a,search),
      ),
    [assets, kind, group, search],
  );
  const selectedGraphicsOnly = selected.length > 0 && selected.every(a => !!a.rgba && !!a.width && !!a.height);

  useEffect(() => setPage(0), [kind, group, search]);
  // Navigation into Asset Library resets stale Stage Gallery deep-link filters without clearing the export queue.
  useEffect(() => { setSearch(initialSearch); setKind(''); setGroup(''); setFocus(null); setAnchor(null); setPage(0); }, [initialSearch, navigationRevision]);
  useEffect(() => {
    if (!selected.length) {
      setPlaying(false);
      setFrame(0);
      return;
    }
    setFrame(current => Math.min(current, selected.length - 1));
  }, [selected.length]);
  useEffect(() => {
    if (!playing || !selected.length) return;
    const timer = setInterval(
      () => setFrame(n => (n + 1) % selected.length),
      Math.max(10, frameMs),
    );
    return () => clearInterval(timer);
  }, [playing, frameMs, selected.length]);
  useEffect(() => {
    try {
      if (!canvas.current) return;
      canvas.current.width = width;
      canvas.current.height = height;
      canvas.current
        .getContext('2d')!
        .putImageData(
          new ImageData(new Uint8ClampedArray(compose(width, height, layers)), width, height),
          0,
          0,
        );
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [width, height, layers]);

  const attempt = (fn: () => void) => {
    try {
      setError('');
      fn();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  async function exportFighterIndexedBundle(asset: Asset) {
    const run = ++indexedFtrRun.current;
    setIndexedFtrBusy(true);
    setError('');
    try {
      const bundle = await buildMK3FighterIndexedBundleP69(assets, asset.source.path);
      if (indexedFtrRun.current !== run) return;
      download(bundle.bytes, bundle.name, 'application/zip');
    } catch (error) {
      if (indexedFtrRun.current === run) setError(errorMessage(error));
    } finally {
      if (indexedFtrRun.current === run) setIndexedFtrBusy(false);
    }
  }

  async function exportCueAudioTracks() {
    const run = ++cueAudioRun.current;
    setCueAudioBusy(true);
    setError('');
    try {
      const bundle = await buildMK3CueMusicBundleP70(assets);
      if (cueAudioRun.current !== run) return;
      download(bundle.bytes,bundle.name,'application/zip');
    } catch(error) {
      if(cueAudioRun.current === run)setError(errorMessage(error));
    } finally {
      if(cueAudioRun.current === run)setCueAudioBusy(false);
    }
  }

  async function exportPaletteComparison() {
    const current = focus;
    const palette = selectedIffCmap;
    if (!current || !palette) {
      setError('Select an original IFF CMAP for this comparison.');
      return;
    }
    const run = ++comparisonRun.current;
    setComparisonBusy(true);
    setError('');
    try {
      const bundle = await exportMK3PaletteComparisonP72(current, palette);
      if (comparisonRun.current !== run) return;
      download(bundle.bytes, bundle.name, 'application/zip');
    } catch(error) {
      if (comparisonRun.current === run) setError(errorMessage(error));
    } finally {
      if (comparisonRun.current === run) setComparisonBusy(false);
    }
  }

  function exportSelectionZip() {
    attempt(() => download(selectedZip(selected), 'MKDOS_selection.zip', 'application/zip'));
  }

  async function scan() {
    leadingRun.current += 1;
    p83Run.current += 1;
    p83Abort.current?.abort();
    p83Abort.current = null;
    setP83Busy(false);
    leadingAbort.current?.abort();
    leadingAbort.current = null;
    setLeadingBusy(false);
    chainedRun.current += 1;
    chainedAbort.current?.abort();
    chainedAbort.current = null;
    setChainedBusy(false);
    rowMapsRun.current += 1;
    rowMapsAbort.current?.abort();
    rowMapsAbort.current = null;
    setRowMapsBusy(false);
    const run = ++scanRun.current;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError('');
    setProgress('Starting…');
    try {
      const c = await scanAssets(
        source,
        game,
        status => {
          if (scanRun.current === run && !controller.signal.aborted) setProgress(status);
        },
        controller.signal,
      );
      if (scanRun.current !== run || controller.signal.aborted) return;
      setCollection(c);
      onCollectionLoaded?.(c);
      setQueue([]);
      setLayers([]);
      setFocus(null);
      setAnchor(null);
      setPlaying(false);
      setFrame(0);
      setLoadedSourceOrder(null);
      setSelectedComparisonIffId('');
    } catch (e) {
      if (!controller.signal.aborted && scanRun.current === run) setError(errorMessage(e));
    } finally {
      if (scanRun.current === run) {
        setBusy(false);
        abort.current = null;
      }
    }
  }

  async function revealMK3P76SourceImages() {
    if (game !== 'mk3' || !collection || collection.assets.length !== 9186 || busy || rowMapsBusy) return;
    const run=++rowMapsRun.current, baseline=collection;
    const sourceRun=scanRun.current, controller=new AbortController();
    rowMapsAbort.current=controller;
    setRowMapsBusy(true);
    setError('');
    try {
      const result=await recoverMK3P76RowMappedAssets(source,baseline.assets,controller.signal);
      if (controller.signal.aborted || run!==rowMapsRun.current || sourceRun!==scanRun.current) return;
      setCollection(current => {
        if (current !== baseline) return current;
        return {...current,
          assets:[...current.assets,...result.assets],
          reports:{...current.reports, p76RecoveredNonIffSourceRows:result.report},
          limitations:[...current.limitations,
            'P76: 19 original source-row-mapped indexed interpretations added by explicit user action; native RGB palette, renderer, stage membership and animation timing remain UNKNOWN. All 20 original raw non-IFF source regions remain preserved.']};
      });
      setSearch('');
      setKind('image');
      setGroup('DATA.MK3 · recovered indexed (P76)');
      setPage(0);
      setFocus(null);
      setAnchor(null);
    } catch (e) {
      if (!controller.signal.aborted && run===rowMapsRun.current) setError(errorMessage(e));
    } finally {
      if (run===rowMapsRun.current) {
        setRowMapsBusy(false);
        rowMapsAbort.current=null;
      }
    }
  }

  async function revealMK3P78AdditionalImages() {
    if (game !== 'mk3' || !collection || collection.assets.length !== 9205 ||
        !collection.reports.p76RecoveredNonIffSourceRows || busy || chainedBusy) return;
    const run=++chainedRun.current, baseline=collection;
    const sourceRun=scanRun.current, controller=new AbortController();
    chainedAbort.current=controller;
    setChainedBusy(true);
    setError('');
    try {
      const result=await recoverMK3P78AdditionalChainedAssets(
        source,baseline.assets,controller.signal);
      if(controller.signal.aborted || run!==chainedRun.current ||
          sourceRun!==scanRun.current) return;
      setCollection(current=>{
        if(current!==baseline) return current;
        return {...current,
          assets:[...current.assets,...result.assets],
          reports:{...current.reports,p78AdditionalChainedIndexedSource:result.report},
          limitations:[...current.limitations,
            'P78: 197 additional original DATA.MK3 chained source records were explicitly added as indexed/mask images. Source record encounter order does NOT establish native animation order/timing, character or stage assembly. The adjacent source RGB8 candidate is NOT a verified native palette. All original raw intervals are still preserved.']};
      });
      setSearch('');
      setKind('image');
      setGroup(MK3_P78_ADDITIONAL_GROUP);
      setPage(0);
      setFocus(null);
      setAnchor(null);
    } catch(e) {
      if(!controller.signal.aborted && run===chainedRun.current) setError(errorMessage(e));
    } finally {
      if(run===chainedRun.current){
        setChainedBusy(false);
        chainedAbort.current=null;
      }
    }
  }

  async function revealMK3P80LeadingSource() {
    if (game !== 'mk3' || !collection || collection.assets.length !== 9402 ||
        !collection.reports.p78AdditionalChainedIndexedSource || busy || leadingBusy) return;
    const run=++leadingRun.current, baseline=collection;
    const sourceRun=scanRun.current, controller=new AbortController();
    leadingAbort.current=controller;
    setLeadingBusy(true);
    setError('');
    try {
      const result=await recoverMK3P80LeadingAssets(source,baseline.assets,controller.signal);
      if (controller.signal.aborted || run!==leadingRun.current ||
          sourceRun!==scanRun.current) return;
      setCollection(current=>{
        if (current!==baseline) return current;
        return {...current,
          assets:[...current.assets,...result.assets],
          reports:{...current.reports,p80OriginalLeadingSource:result.report},
          limitations:[...current.limitations,
            'P80: 320×200 original source indices shown with grayscale/opaque preview ONLY. Original alpha, native palette, stage/animation associations and all 216 continuation payload renderings are UNKNOWN. Each continuation remains a separately exportable original raw record; the original unresolved raw span remains preserved.']};
      });
      setSearch('');
      setKind('image');
      setGroup(MK3_P80_BASE_GROUP);
      setPage(0);
      setFocus(null);
      setAnchor(null);
    }catch(e){
      if(!controller.signal.aborted && run===leadingRun.current)
        setError(errorMessage(e));
    }finally{
      if(run===leadingRun.current){
        setLeadingBusy(false);
        leadingAbort.current=null;
      }
    }
  }

  async function importP83SourceZip(file:File) {
    if(game!=='mk2' || !collection || collection.assets.length!==5369 ||
      busy || p83Busy || file.size>128*1024*1024) {
      if(file.size>128*1024*1024)setError('P83 stage ZIP exceeds 128 MiB');
      return;
    }
    const run=++p83Run.current,baseline=collection,sourceRun=scanRun.current;
    const controller=new AbortController();
    p83Abort.current=controller;
    setP83Busy(true);
    setError('');
    try {
      const bytes=new Uint8Array(await file.arrayBuffer());
      controller.signal.throwIfAborted();
      const result=await importMK2P83StageZip(source,baseline.assets,bytes,controller.signal);
      if(controller.signal.aborted || run!==p83Run.current ||
         sourceRun!==scanRun.current) return;
      setCollection(current=>current===baseline?{
        ...current,
        assets:[...current.assets,...result.assets],
        reports:{...current.reports,p83NativeSourceLayerZip:result.report},
        limitations:[...current.limitations,
          'P83: selected original MK2 P82 archive provides 115 separate native source PNGs, including 896-column floors. Index and opacity files are preserved byte-exact. This is not a final native stage composite, verified live palette, parallax or animation. The default MK2 5,369-item catalogue remains unchanged.'],
      }:current);
      setSearch('');
      setKind('image');
      setGroup('P83 Kombat Tomb · native-width floor');
      setPage(0);
      setFocus(null);
      setAnchor(null);
    } catch(e) {
      if(!controller.signal.aborted && run===p83Run.current)setError(errorMessage(e));
    } finally {
      if(run===p83Run.current){
        setP83Busy(false);
        p83Abort.current=null;
      }
    }
  }

  function select(a: Asset, e: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) {
    setFocus(a);
    if (e.shiftKey && anchor) {
      const x = filtered.findIndex(v => v.id === anchor);
      const y = filtered.findIndex(v => v.id === a.id);
      if (x >= 0 && y >= 0) {
        const range = filtered.slice(Math.min(x, y), Math.max(x, y) + 1).map(v => v.id);
        setQueue(current => {
          if (!(e.ctrlKey || e.metaKey)) return range.map(makeQueueItem);
          const present = new Set(current.map(item => item.assetId));
          return [...current, ...range.filter(id => !present.has(id)).map(makeQueueItem)];
        });
        return;
      }
    }
    setAnchor(a.id);
    setQueue(current => {
      if (e.ctrlKey || e.metaKey) {
        if (current.some(item => item.assetId === a.id)) {
          return current.filter(item => item.assetId !== a.id);
        }
        return [...current, makeQueueItem(a.id)];
      }
      return [makeQueueItem(a.id)];
    });
  }

  function loadSourceOrder(sheet: Asset) {
    attempt(() => {
      const presentation = resolveMK2OriginalSourceOrder(sheet, lookup);
      setQueue(presentation.frames.map(a => makeQueueItem(a.id)));
      setPlaying(false);
      setFrame(0);
      setLoadedSourceOrder({ sheetId: sheet.id, frameIds: presentation.frames.map(a => a.id), originalControl: presentation.originalControl });
    });
  }

  function addFiltered() {
    setQueue(current => {
      const present = new Set(current.map(item => item.assetId));
      return [...current, ...filtered.filter(a => !present.has(a.id)).map(a => makeQueueItem(a.id))];
    });
  }

  function moveQueue(index: number, delta: number) {
    setQueue(current => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function duplicateQueue(index: number) {
    setQueue(current => {
      const item = current[index];
      if (!item) return current;
      const next = [...current];
      next.splice(index + 1, 0, makeQueueItem(item.assetId));
      return next;
    });
  }

  function moveLayer(index: number, delta: number) {
    setLayers(current => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function canvasPoint(e: React.PointerEvent<HTMLCanvasElement> | React.DragEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - r.left) * width) / r.width),
      y: Math.round(((e.clientY - r.top) * height) / r.height),
    };
  }

  function drop(e: React.DragEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const a = lookup.get(e.dataTransfer.getData('application/x-mkdos-asset'));
    if (!a?.rgba) return;
    const point = canvasPoint(e);
    setLayers(current => [...current, { asset: a, x: point.x, y: point.y, flip: false }]);
  }

  function hitLayer(x: number, y: number) {
    for (let index = layers.length - 1; index >= 0; index--) {
      const layer = layers[index];
      const a = layer.asset;
      if (!a.rgba || !a.width || !a.height) continue;
      const localX = x - Math.round(layer.x);
      const localY = y - Math.round(layer.y);
      if (localX < 0 || localY < 0 || localX >= a.width || localY >= a.height) continue;
      const sourceX = layer.flip ? a.width - 1 - localX : localX;
      if (a.rgba[(localY * a.width + sourceX) * 4 + 3] > 0) return index;
    }
    return -1;
  }

  function pointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const point = canvasPoint(e);
    const index = hitLayer(point.x, point.y);
    if (index < 0) return;
    const layer = layers[index];
    layerDrag.current = {
      index,
      dx: point.x - layer.x,
      dy: point.y - layer.y,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function pointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const drag = layerDrag.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const point = canvasPoint(e);
    setLayers(current =>
      current.map((layer, index) =>
        index === drag.index
          ? { ...layer, x: Math.round(point.x - drag.dx), y: Math.round(point.y - drag.dy) }
          : layer,
      ),
    );
  }

  function pointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const drag = layerDrag.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    layerDrag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function setCanvasWidth(raw: string) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const max = Math.min(4096, Math.max(1, Math.floor(16_000_000 / height)));
    setWidth(Math.max(1, Math.min(max, Math.trunc(value || 1))));
  }

  function setCanvasHeight(raw: string) {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const max = Math.min(4096, Math.max(1, Math.floor(16_000_000 / width)));
    setHeight(Math.max(1, Math.min(max, Math.trunc(value || 1))));
  }

  return (
    <section className="asset-browser">
      <div className="asset-heading">
        <div>
          <h2>Asset browser</h2>
          <p>{game.toUpperCase()} · {source.directoryName} · local, read-only decoding</p>
        </div>
        <button disabled={busy} onClick={scan}>{collection ? 'Rescan assets' : 'Decode & browse'}</button>
        {busy && <button onClick={() => abort.current?.abort()}>Cancel</button>}
      </div>
      {busy && <p role="status">Decoding: {progress}. Large evidence passes can take several minutes.</p>}
      {error && <p role="alert" className="asset-error">{error}</p>}
      {collection && <>
        {collection.reports.mode === 'MK1_READ_ONLY_FALLBACK' && (
          <div role="status" className="asset-fallback-notice">
            <strong>MK1 read-only browsing mode</strong>
            <p>The full MK1 research scan was unavailable for this installation. You can inspect and export original GRA resources and any independently checked indexed previews.</p>
            <p>See Coverage &amp; evidence for the precise identity/validation reason.</p>
          </div>
        )}
        {game === 'mk2' && collection.assets.length === 5369 && (
          <section className="asset-fallback-notice" aria-label="Import original MK2 native-width stage layer archive">
            <strong>P83 MK2 Tomb and Portal native-width source layers</strong>
            <p>Import the independently verified P82 ZIP from FIXTURES/VALIDATION to browse
              115 original indexed/opacity/RGB source PNGs, including both uncropped
              896-column floors. The accepted 5,369 original MK2 resources remain unchanged.
              Native compositing, live palette assignment, animation and parallax are UNKNOWN.</p>
            <label>
              Import verified P82 stage-layer ZIP
              <input aria-label="Import P82 stage-layer ZIP" type="file"
                accept=".zip,application/zip" disabled={busy || p83Busy}
                onChange={e=>{const file=e.currentTarget.files?.[0];
                  e.currentTarget.value='';
                  if(file)void importP83SourceZip(file);}} />
            </label>
            {p83Busy && <p role="status">Validating the original MK2 sources and 115 source PNGs…</p>}
          </section>
        )}
        {game === 'mk2' && collection.reports.p83NativeSourceLayerZip && (
          <p role="status">P83 imported: 115 original Tomb/Portal source PNGs,
            two uncropped native-width floors, 29 separate sprites and eight setup-local layers.
            Native animation, parallax and stage composition remain UNKNOWN.</p>
        )}
        {game === 'mk3' && collection.assets.length === 9186 && (
          <section className="asset-fallback-notice" aria-label="Original MK3 source-row graphics">
            <strong>P76 recovered indexed graphics (source-row interpretation)</strong>
            <p>19 additional original DATA.MK3 row-mapped source graphics can be opened on demand.
              Their indexed pixels and masks have reproducible original source provenance.
              Colors, native renderer positioning, stage membership and animation timing are not verified.
              The existing 9,186-item baseline and all raw source intervals stay intact until you choose to add them.</p>
            <button type="button" disabled={rowMapsBusy || busy} onClick={() => void revealMK3P76SourceImages()}>
              {rowMapsBusy ? 'Checking original source and mapping rows…' : 'Show 19 recovered indexed graphics'}
            </button>
          </section>
        )}
        {game === 'mk3' && collection.reports.p76RecoveredNonIffSourceRows && (
          <p role="status">P76 source-row graphics added: 19 separate indexed images.
            Preview is grayscale index-map only; native palettes and renderer positions remain UNKNOWN.</p>
        )}
        {game === 'mk3' && collection.assets.length === 9205 &&
          collection.reports.p76RecoveredNonIffSourceRows && (
          <section className="asset-fallback-notice" aria-label="Additional original MK3 chained indexed graphics">
            <strong>P78 additional source-chained indexed graphics</strong>
            <p>The original DATA.MK3 source contains 197 further source-indexed image records
              after the 19 P76 first images. Open them separately without changing the
              original 9,186 assets or the accepted P76 entries. Original palette
              ownership, stage relationships and native animation order/timing remain UNKNOWN.</p>
            <button type="button" disabled={chainedBusy || busy}
              onClick={() => void revealMK3P78AdditionalImages()}>
              {chainedBusy ? 'Checking original 216-record source chains…' :
                'Show 197 additional indexed graphics'}
            </button>
          </section>
        )}
        {game === 'mk3' && collection.reports.p78AdditionalChainedIndexedSource && (
          <p role="status">P78 original chained indexed images added: 197 separate source records.
            Grayscale index previews only; native palette, stage membership and animation timing remain UNKNOWN.</p>
        )}
        {game === 'mk3' && collection.assets.length === 9402 &&
          collection.reports.p78AdditionalChainedIndexedSource && (
          <section className="asset-fallback-notice" aria-label="Original MK3 leading indexed base and raw records">
            <strong>P80 original base index and raw continuation records</strong>
            <p>One original 320 × 200 indexed base plane can be previewed in grayscale.
              Original alpha, native palette, stage and animation use are UNKNOWN.
              All 216 original stored continuation records can be exported separately;
              they are NOT decoded frames. Accepted P76/P78 assets remain unchanged.</p>
            <button type="button" disabled={busy || leadingBusy}
              onClick={() => void revealMK3P80LeadingSource()}>
              {leadingBusy ? 'Checking original leading source and raw records…' :
                'Show leading base image + 216 raw records'}
            </button>
          </section>
        )}
        {game === 'mk3' && collection.reports.p80OriginalLeadingSource && (
          <p role="status">P80 source recovered: 1 original indexed base image and 216 raw continuation records.
            Choose Asset type Raw and Resource group {MK3_P80_RAW_GROUP} to inspect the stored records. No decoded animation frames claimed.</p>
        )}
        <details className="asset-evidence">
          <summary>Coverage & evidence · {assets.length.toLocaleString()} assets</summary>
          {collection.limitations.map(x => <p key={x}>{x}</p>)}
          <button onClick={() => download(utf8.encode(JSON.stringify(collection.reports, null, 2)), 'MKDOS_evidence.json', 'application/json')}>Export evidence JSON</button>
          {collection.packages.map(p => <button key={p.name} onClick={() => download(p.bytes, p.name, p.name.toLowerCase().endsWith('.json') ? 'application/json' : 'application/zip')}>{p.name}</button>)}
        </details>
        <div className="asset-filters">
          <input aria-label="Search assets" placeholder="Search assets or resource names" value={search} onChange={e => setSearch(e.target.value)} />
          <button type="button" onClick={() => { setSearch(''); setKind(''); setGroup(''); setFocus(null); setAnchor(null); setPage(0); }}>Reset filters</button>
          <select aria-label="Asset type" value={kind} onChange={e => setKind(e.target.value)}>
            <option value="">All types</option>
            {[...new Set(assets.map(a => a.kind))].map(k => <option key={k}>{k}</option>)}
          </select>
          <select aria-label="Resource group" value={group} onChange={e => setGroup(e.target.value)}>
            <option value="">All resource groups</option>
            {[...new Set(assets.map(a => a.group))].sort().map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="asset-toolbar" role="group" aria-label="Batch export">
          <button disabled={!filtered.length} onClick={addFiltered}>Add all {filtered.length.toLocaleString()} matches to selection</button>
          <button disabled={!selected.length} onClick={exportSelectionZip}>Export selection ZIP ({selected.length.toLocaleString()})</button>
        </div>
        <p className="asset-help">Click to select. Ctrl/⌘+click adds or removes; Shift+click selects a range. Drag graphics to the canvas independently.</p>
        <div className="asset-workspace">
          <div className="asset-results">
            <div className="asset-grid-viewport" tabIndex={0} aria-label="Scrollable asset results">
              <div className="asset-grid" role="listbox" aria-label="Assets" aria-multiselectable="true">
              {filtered.slice(page * 60, (page + 1) * 60).map(a => <button
                key={a.id}
                role="option"
                aria-selected={selectedAssetIds.has(a.id)}
                className={selectedAssetIds.has(a.id) ? 'asset-card selected' : 'asset-card'}
                draggable={!!a.rgba}
                onDragStart={e => e.dataTransfer.setData('application/x-mkdos-asset', a.id)}
                onClick={e => select(a, e)}
              >
                <Picture asset={a} />
                <strong>{a.name}</strong>
                <small>{a.group}</small>
                <small>{a.width ? `${a.width} × ${a.height} · ` : ''}{a.format}</small>
              </button>)}
              </div>
            </div>
            <div className="asset-toolbar asset-page-controls">
              <button disabled={!page} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>{filtered.length ? `${page * 60 + 1}–${Math.min((page + 1) * 60, filtered.length)} of ${filtered.length}` : 'No matches'}</span>
              <button disabled={(page + 1) * 60 >= filtered.length} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
          <aside className="asset-inspector">
            <h3>Inspect</h3>
            {focus && <button type="button" onClick={() => { setFocus(null); setAnchor(null); }}>← All assets (keep filters)</button>}
            {focus ? <>
              <Picture asset={focus} />
              <strong>{focus.name}</strong>
              <p>{focus.confidence}</p>
              <p>{focus.source.path} · offset {focus.source.offset}</p>
              {['audio', 'music'].includes(focus.kind) && <AudioPreview asset={focus} />}
              <button onClick={() => attempt(() => download(assetBytes(focus), focus.filename, focus.mime))}>Export this asset</button>
              {game === 'mk3' && focus.kind === 'music' && focus.format === 'OGG' && (
                <button disabled={cueAudioBusy} onClick={() => void exportCueAudioTracks()}>
                  {cueAudioBusy ? 'Preparing CUE-linked original audio tracks…' : 'Export original CUE-linked MK3 audio tracks 02–47'}
                </button>
              )}
              {game === 'mk3' && focus.kind === 'sprite' && /\.FTR$/i.test(focus.source.path) && (
                <button disabled={indexedFtrBusy} onClick={() => void exportFighterIndexedBundle(focus)}>
                  {indexedFtrBusy ? 'Preparing original indexed FTR sprites…' : 'Export all original indexed sprites from this FTR'}
                </button>
              )}
              {game === 'mk3' && focus.kind === 'sprite' && /\.FTR$/i.test(focus.source.path) && (
                <section className="asset-palette-comparison">
                  <h4>Original IFF CMAP comparison — not fighter palette ownership</h4>
                  <p>Choose an original DATA.MK3 image palette to compare visually.
                    These CMAPs belong to their source IFF pictures; no original fighter
                    palette assignment or gameplay color is verified.</p>
                  <label>Source IFF CMAP (experimental)
                    <select aria-label="Experimental source IFF CMAP" value={selectedComparisonIffId}
                      onChange={e => setSelectedComparisonIffId(e.target.value)}>
                      <option value="">No comparison — original indexed grayscale only</option>
                      {originalIffCmaps.map(choice => <option
                        key={choice.sourceIffAsset.id} value={choice.sourceIffAsset.id}>
                        {choice.sourceIffAsset.source.path} FORM @ {choice.sourceIffAsset.source.offset}
                        {choice.identicalSourceCmaps > 1 ? ` · ${choice.identicalSourceCmaps} identical source CMAPs` : ''}
                      </option>)}
                    </select>
                  </label>
                  {comparison && 'error' in comparison && <p role="alert">{comparison.error}</p>}
                  {comparison && 'value' in comparison && comparison.value && <>
                    <p role="status">Comparison only. Native MK3 fighter palette: UNKNOWN.</p>
                    <Picture asset={{...focus,rgba:comparison.value.rgba,
                      confidence:'USER-SELECTED IFF CMAP COMPARISON ONLY'}} />
                    <button disabled={comparisonBusy} onClick={() => void exportPaletteComparison()}>
                      {comparisonBusy ? 'Preparing comparison ZIP…' : 'Export experimental comparison PNG + original indexed evidence'}
                    </button>
                  </>}
                </section>
              )}
              {focus.metadata.indices instanceof Uint8Array && (
                <button onClick={() => attempt(() => {
                  const archive = indexedAssetZip(focus);
                  download(archive.bytes, archive.filename, 'application/zip');
                })}>Export indexed asset ZIP</button>
              )}
              {focus.id.startsWith('mk2-source-animation-sheet:') && (
                <button type="button" onClick={() => loadSourceOrder(focus)}>
                  Load verified source order into animation queue
                </button>
              )}
              {typeof focus.metadata.originalFrameZip === 'string' && collection?.packages.some(p => p.name === focus.metadata.originalFrameZip) && (
                <button onClick={() => attempt(() => {
                  const archive = collection?.packages.find(p => p.name === focus.metadata.originalFrameZip);
                  if (!archive) throw new Error('Original source frame archive unavailable');
                  download(archive.bytes, archive.name, 'application/zip');
                })}>Export source-ordered frames ZIP</button>
              )}
              {focus.rgba && <button onClick={() => setLayers(current => [...current, { asset: focus, x: 0, y: 0, flip: false }])}>Add to canvas</button>}
              <details><summary>Metadata</summary><pre>{JSON.stringify(metadata(focus), null, 2)}</pre></details>
            </> : <p>Select an asset to inspect it.</p>}
          </aside>
        </div>
        <section className="asset-export">
          <h3>Export selection · {selected.length}</h3>
          <p>This ordered list is separate from the canvas. Graphics chain in the order shown, aligned at the top left. Duplicate a queued frame when a presentation chain needs the same asset more than once.</p>
          <div className="asset-toolbar">
            <button disabled={!selected.length} onClick={() => setQueue([])}>Clear selection</button>
            <button disabled={!selected.length} onClick={exportSelectionZip}>Export ZIP + metadata</button>
            <label>Frame duration (ms) <input type="number" min={10} max={60000} value={frameMs} onChange={e => setFrameMs(Math.max(10, Math.min(60000, Math.trunc(Number(e.target.value) || 10))))} /></label>
            <button disabled={!selectedGraphicsOnly} onClick={() => attempt(() => download(animatedPng(selected, frameMs), 'MKDOS_animation.png', 'image/apng'))}>Export animated PNG</button>
            <label>Sheet columns <input type="number" min={1} max={2000} value={columns} onChange={e => setColumns(Math.max(1, Math.min(2000, Math.trunc(Number(e.target.value) || 1))))} /></label>
            <button disabled={!selectedGraphicsOnly} onClick={() => attempt(() => download(spriteSheet(selected, Math.min(columns, selected.length)).bytes, 'MKDOS_sheet.png', 'image/png'))}>Export sprite sheet</button>
            <button disabled={!selected.length} onClick={() => setPlaying(p => !p)}>{playing ? 'Stop preview' : 'Preview chain'}</button>
          </div>
          <small>Frame duration is your presentation setting; it is not verified gameplay timing.</small>
          {loadedSourceOrder && selected.length === loadedSourceOrder.frameIds.length &&
            selected.every((a, index) => a.id === loadedSourceOrder.frameIds[index]) && (
              <p role="status">Loaded {selected.length} verified original-order frames from {loadedSourceOrder.sheetId}.
                Source control: {loadedSourceOrder.originalControl}. Preview/APNG uses a user-selected interval
                and repeats even zero-terminated lists for convenience; this does not establish original runtime looping or timing.
              </p>
            )}
          {playing && selected[frame % selected.length]?.rgba && <Picture asset={selected[frame % selected.length]} />}
          <ol className="asset-queue">
            {selectedRows.map(({ item, asset }, i) => <li key={item.key}>
              <span>{i + 1}. {asset.name} · {asset.group}</span>
              <button aria-label={`Move ${asset.name} earlier`} disabled={!i} onClick={() => moveQueue(i, -1)}>↑</button>
              <button aria-label={`Move ${asset.name} later`} disabled={i === selected.length - 1} onClick={() => moveQueue(i, 1)}>↓</button>
              <button aria-label={`Duplicate ${asset.name}`} onClick={() => duplicateQueue(i)}>Duplicate</button>
              <button aria-label={`Remove ${asset.name}`} onClick={() => setQueue(current => current.filter(row => row.key !== item.key))}>×</button>
            </li>)}
          </ol>
        </section>
        {assets.some(a => a.kind === 'sequence') && <MidiPreview asset={focus} />}
        <section className="asset-composer">
          <h3>Composition canvas</h3>
          <div className="asset-toolbar">
            <label>Width <input type="number" min={1} max={4096} value={width} onChange={e => setCanvasWidth(e.target.value)} /></label>
            <label>Height <input type="number" min={1} max={4096} value={height} onChange={e => setCanvasHeight(e.target.value)} /></label>
            <button onClick={() => attempt(() => download(png(width, height, compose(width, height, layers)), 'MKDOS_composition.png', 'image/png'))}>Export canvas PNG</button>
            <button onClick={() => download(utf8.encode(JSON.stringify({ width, height, layers: layers.map(l => ({ asset: metadata(l.asset), x: l.x, y: l.y, flip: l.flip })) }, null, 2)), 'MKDOS_scene.json', 'application/json')}>Export scene metadata</button>
            <button disabled={!layers.length} onClick={() => setLayers([])}>Clear canvas</button>
          </div>
          <canvas
            className="composition-canvas"
            ref={canvas}
            style={{ touchAction: 'none' }}
            onDragOver={e => e.preventDefault()}
            onDrop={drop}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
          />
          <p>Drop graphics to place them. Drag an opaque pixel on an existing layer to reposition it. Layers are drawn from first to last; later layers are on top.</p>
          {layers.map((l, i) => <div className="asset-toolbar" key={`${l.asset.id}-${i}`}>
            <span>{i + 1}. {l.asset.name}</span>
            {(['x', 'y'] as const).map(axis => <label key={axis}>{axis} <input
              type="number"
              value={l[axis]}
              onChange={e => {
                const value = Number(e.target.value);
                if (!Number.isFinite(value)) return;
                setLayers(current => current.map((p, j) => j === i ? { ...p, [axis]: Math.trunc(value) } : p));
              }}
            /></label>)}
            <label><input type="checkbox" checked={l.flip} onChange={e => setLayers(current => current.map((p, j) => j === i ? { ...p, flip: e.target.checked } : p))} />Flip horizontal</label>
            <button disabled={!i} onClick={() => moveLayer(i, -1)}>Move back</button>
            <button disabled={i === layers.length - 1} onClick={() => moveLayer(i, 1)}>Move forward</button>
            <button onClick={() => setLayers(current => current.filter((_, j) => i !== j))}>Remove layer</button>
          </div>)}
        </section>
      </>}
    </section>
  );
}

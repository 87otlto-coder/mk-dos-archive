import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { Asset, AssetCollection, Game, utf8 } from '../core/assets/model';
import { scanAssets } from '../core/assets/collection';
import { resolveMK2OriginalSourceOrder } from '../core/assets/mk2SourceOrderQueueP19';
import {
  animatedPng,
  assetBytes,
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
  return asset.rgba ? (
    <canvas ref={ref} />
  ) : (
    <span className="asset-symbol">
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

export function AssetBrowser({ source, game, initialSearch = '', navigationRevision = 0, initialCollection = null }: { source: DirectorySource; game: Game; initialSearch?: string; navigationRevision?: number; initialCollection?: AssetCollection | null }) {
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
    setProgress('');
    setError('');
    setBusy(false);
    return () => abort.current?.abort();
  }, [source, game]);

  // O194: Compilation results arrive independently of this view. Preserve local browsing state.
  useEffect(() => { if (initialCollection) setCollection(current => current ?? initialCollection); }, [initialCollection]);
  const assets = collection?.assets ?? [];
  const lookup = useMemo(() => new Map(assets.map(a => [a.id, a])), [assets]);
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
          `${a.name} ${a.group} ${a.confidence} ${a.source.path}`.toLowerCase().includes(search.toLowerCase()),
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

  function exportSelectionZip() {
    attempt(() => download(selectedZip(selected), 'MKDOS_selection.zip', 'application/zip'));
  }

  async function scan() {
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
      setQueue([]);
      setLayers([]);
      setFocus(null);
      setAnchor(null);
      setPlaying(false);
      setFrame(0);
      setLoadedSourceOrder(null);
    } catch (e) {
      if (!controller.signal.aborted && scanRun.current === run) setError(errorMessage(e));
    } finally {
      if (scanRun.current === run) {
        setBusy(false);
        abort.current = null;
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
        <details className="asset-evidence">
          <summary>Coverage & evidence · {assets.length.toLocaleString()} assets</summary>
          {collection.limitations.map(x => <p key={x}>{x}</p>)}
          <button onClick={() => download(utf8.encode(JSON.stringify(collection.reports, null, 2)), 'MKDOS_evidence.json', 'application/json')}>Export evidence JSON</button>
          {collection.packages.map(p => <button key={p.name} onClick={() => download(p.bytes, p.name, 'application/zip')}>{p.name}</button>)}
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

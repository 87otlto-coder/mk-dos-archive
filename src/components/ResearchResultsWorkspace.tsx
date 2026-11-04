import React, { useEffect, useMemo, useState } from 'react';
import { Download, Image as ImageIcon, Layers3, Search, ShieldCheck } from 'lucide-react';
import { ResearchArtifact, downloadResearchArtifact } from '../core/research/researchArtifactDownloads';
import {
  buildResearchPassPresentationRows,
  MK1ResearchResultsWorkspaceResult,
  MK1ResearchWorkspaceStagePreview,
  MK1ResearchWorkspaceGroupId,
} from '../games/mk1/research/researchResultsWorkspace';
import { encodeBrowserDeterministicRgbaPng } from '../games/mk1/research/browserStageExportBundle';
import {
  MK1AnimationAssetsWorkspaceResult,
  MK1AnimationWorkspaceCharacterAsset,
  MK1AnimationWorkspaceEffectAsset,
  MK1AnimationWorkspaceUnresolvedAsset,
} from '../games/mk1/research/animationAssetsWorkspace';
import { MK1AudioAssetsWorkspaceResult, MK1AudioWorkspaceAsset } from '../games/mk1/research/audioAssetsWorkspace';

type WorkspaceTab = 'overview' | 'stages' | 'animations' | 'audio' | 'passes';
type AnimationTier = 'characters' | 'effects' | 'unresolved';
type PreviewMode = 'normalized' | 'ordinary';

interface Props {
  artifacts: ResearchArtifact[];
  workspace: MK1ResearchResultsWorkspaceResult;
  animationWorkspace?: MK1AnimationAssetsWorkspaceResult | null;
  audioWorkspace?: MK1AudioAssetsWorkspaceResult | null;
  isRunning: boolean;
}

function createPngUrl(width: number, height: number, rgba: Uint8Array): string {
  const png = encodeBrowserDeterministicRgbaPng(width, height, rgba);
  const stable = new Uint8Array(png);
  return URL.createObjectURL(new Blob([stable.buffer], { type: 'image/png' }));
}

function usePngUrl(width: number, height: number, rgba: Uint8Array): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const next = createPngUrl(width, height, rgba);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [width, height, rgba]);
  return url;
}

function StageThumbnail({ stage, selected, onSelect }: { stage: MK1ResearchWorkspaceStagePreview; selected: boolean; onSelect: () => void }) {
  const url = usePngUrl(stage.normalized.width, stage.normalized.height, stage.normalized.rgba);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-lg overflow-hidden border transition-colors ${selected ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'}`}
    >
      <div className="aspect-[8/5] bg-black flex items-center justify-center overflow-hidden">
        {url ? <img src={url} alt={`${stage.moduleSymbol} normalized background`} className="w-full h-full object-contain" style={{ imageRendering: 'pixelated' }} /> : <ImageIcon className="w-5 h-5 text-zinc-700" />}
      </div>
      <div className="px-2.5 py-2">
        <div className="text-[11px] font-mono font-semibold text-zinc-200 truncate">{stage.moduleSymbol}</div>
        <div className="text-[10px] text-zinc-500 mt-0.5">320×200 normalized</div>
      </div>
    </button>
  );
}

function StageDetail({ stage }: { stage: MK1ResearchWorkspaceStagePreview }) {
  const [mode, setMode] = useState<PreviewMode>('normalized');
  useEffect(() => setMode('normalized'), [stage.moduleSymbol]);
  const payload = mode === 'normalized' ? stage.normalized : stage.ordinary;
  const url = usePngUrl(payload.width, payload.height, payload.rgba);
  const coverage = stage.coverage && typeof stage.coverage === 'object' ? stage.coverage as Record<string, unknown> : {};
  const tier = typeof coverage.correctedTier === 'string' ? coverage.correctedTier : 'Verified stage package';
  const normalizedState = typeof coverage.normalizedState === 'string' ? coverage.normalizedState : null;
  const blockers = Array.isArray(coverage.capabilityBlockers) ? coverage.capabilityBlockers : [];
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-mono text-sm font-bold text-amber-300">{stage.moduleSymbol}</div>
          <div className="text-[11px] text-zinc-400 mt-1">{tier}</div>
        </div>
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden text-[10px] font-mono">
          <button type="button" onClick={() => setMode('normalized')} className={`px-3 py-1.5 ${mode === 'normalized' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}>Normalized</button>
          <button type="button" onClick={() => setMode('ordinary')} className={`px-3 py-1.5 ${mode === 'ordinary' ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}>Ordinary</button>
        </div>
      </div>
      <div className="bg-black rounded-lg border border-zinc-800 overflow-hidden flex justify-center">
        {url && <img src={url} alt={`${stage.moduleSymbol} ${mode} background`} className="w-full max-w-[640px] aspect-[8/5] object-contain" style={{ imageRendering: 'pixelated' }} />}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3 text-[10px] font-mono">
        <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2.5">
          <div className="text-zinc-500">Payload</div>
          <div className="text-zinc-300 mt-1 break-all">{payload.key}</div>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-900/60 p-2.5">
          <div className="text-zinc-500">Capability blockers</div>
          <div className={blockers.length ? 'text-amber-300 mt-1' : 'text-emerald-300 mt-1'}>{blockers.length ? `${blockers.length} preserved blocker(s)` : 'None for normalized preview'}</div>
        </div>
      </div>
      {normalizedState && <div className="mt-3 text-[10px] text-zinc-400 font-mono rounded border border-zinc-800 bg-zinc-900/50 p-2.5"><span className="text-zinc-500">Normalized state:</span> {normalizedState}</div>}
      <details className="mt-3 rounded border border-zinc-800 bg-zinc-900/40">
        <summary className="cursor-pointer px-3 py-2 text-[11px] font-mono text-cyan-300">Coverage document</summary>
        <pre className="max-h-72 overflow-auto border-t border-zinc-800 p-3 text-[10px] text-zinc-400 whitespace-pre-wrap">{JSON.stringify(stage.coverage, null, 2)}</pre>
      </details>
      <details className="mt-2 rounded border border-zinc-800 bg-zinc-900/40">
        <summary className="cursor-pointer px-3 py-2 text-[11px] font-mono text-cyan-300">Time-aware scene IR</summary>
        <pre className="max-h-72 overflow-auto border-t border-zinc-800 p-3 text-[10px] text-zinc-400 whitespace-pre-wrap">{JSON.stringify(stage.scene, null, 2)}</pre>
      </details>
    </div>
  );
}

function usePngBytesUrl(bytes: Uint8Array): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const stable = new Uint8Array(bytes);
    const next = URL.createObjectURL(new Blob([stable.buffer], { type: 'image/png' }));
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [bytes]);
  return url;
}

function CharacterAssetThumb({ asset, selected, onSelect }: { asset: MK1AnimationWorkspaceCharacterAsset; selected: boolean; onSelect: () => void }) {
  const url = usePngBytesUrl(asset.pngBytes);
  return <button type="button" onClick={onSelect} className={`text-left rounded-lg overflow-hidden border ${selected ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'}`}>
    <div className="h-28 bg-black flex items-center justify-center overflow-hidden">{url ? <img src={url} alt={`${asset.identityLabel} context variant`} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} /> : null}</div>
    <div className="p-2"><div className="text-[10px] font-mono text-zinc-200 truncate">{asset.descriptorWatcomOffsetHex}</div><div className="text-[9px] text-zinc-500 truncate">{asset.mode} · {asset.paletteSymbols.join('+')}</div></div>
  </button>;
}

function EffectAssetThumb({ asset, selected, onSelect }: { asset: MK1AnimationWorkspaceEffectAsset; selected: boolean; onSelect: () => void }) {
  const url = usePngBytesUrl(asset.pngBytes);
  return <button type="button" onClick={onSelect} className={`text-left rounded-lg overflow-hidden border ${selected ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'}`}>
    <div className="h-28 bg-black flex items-center justify-center overflow-hidden">{url ? <img src={url} alt={`${asset.key} verified effect`} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} /> : null}</div>
    <div className="p-2"><div className="text-[10px] font-mono text-zinc-200 truncate">{asset.key}</div><div className="text-[9px] text-emerald-500">Verified effect RGBA</div></div>
  </button>;
}

function UnresolvedAssetThumb({ asset, selected, onSelect }: { asset: MK1AnimationWorkspaceUnresolvedAsset; selected: boolean; onSelect: () => void }) {
  const url = usePngUrl(asset.width, asset.height, asset.indexVisualizationRgba);
  return <button type="button" onClick={onSelect} className={`text-left rounded-lg overflow-hidden border ${selected ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'}`}>
    <div className="h-28 bg-black flex items-center justify-center overflow-hidden">{url ? <img src={url} alt={`${asset.symbol ?? asset.descriptorWatcomOffsetHex} indexed-only visualization`} className="max-w-full max-h-full object-contain" style={{ imageRendering: 'pixelated' }} /> : null}</div>
    <div className="p-2"><div className="text-[10px] font-mono text-zinc-200 truncate">{asset.symbol ?? asset.descriptorWatcomOffsetHex}</div><div className="text-[9px] text-amber-500">Indexed only · palette unresolved</div></div>
  </button>;
}

function useAnimationAssetUrl(tier: AnimationTier, asset: MK1AnimationWorkspaceCharacterAsset | MK1AnimationWorkspaceEffectAsset | MK1AnimationWorkspaceUnresolvedAsset): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let bytes: Uint8Array;
    if (tier === 'characters') bytes = new Uint8Array((asset as MK1AnimationWorkspaceCharacterAsset).pngBytes);
    else if (tier === 'effects') bytes = new Uint8Array((asset as MK1AnimationWorkspaceEffectAsset).pngBytes);
    else {
      const row = asset as MK1AnimationWorkspaceUnresolvedAsset;
      bytes = encodeBrowserDeterministicRgbaPng(row.width, row.height, row.indexVisualizationRgba);
    }
    const next = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type: 'image/png' }));
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [tier, asset]);
  return url;
}

function AnimationAssetDetail({ tier, asset }: { tier: AnimationTier; asset: MK1AnimationWorkspaceCharacterAsset | MK1AnimationWorkspaceEffectAsset | MK1AnimationWorkspaceUnresolvedAsset }) {
  const char = tier === 'characters' ? asset as MK1AnimationWorkspaceCharacterAsset : null;
  const effect = tier === 'effects' ? asset as MK1AnimationWorkspaceEffectAsset : null;
  const unresolved = tier === 'unresolved' ? asset as MK1AnimationWorkspaceUnresolvedAsset : null;
  const url = useAnimationAssetUrl(tier, asset);
  const title = char ? `${char.identityLabel} · ${char.descriptorWatcomOffsetHex}` : effect ? effect.key : `${unresolved?.symbol ?? unresolved?.descriptorWatcomOffsetHex}`;
  return <div className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-4">
    <div className="font-mono text-sm font-bold text-violet-300">{title}</div>
    <div className="mt-2 bg-black rounded-lg border border-zinc-800 min-h-64 flex items-center justify-center p-3">{url && <img src={url} alt={title} className="max-w-full max-h-[420px] object-contain" style={{ imageRendering: 'pixelated' }} />}</div>
    {char && <div className="mt-3 rounded border border-violet-900 bg-violet-950/20 p-3 text-[10px] text-zinc-300"><span className="text-violet-300 font-semibold">Explicit character palette context.</span> This is a qualified {char.mode.toLowerCase()} context using {char.paletteSymbols.join(' + ')}; it is not a universal per-animation palette assignment.</div>}
    {effect && <div className="mt-3 rounded border border-emerald-900 bg-emerald-950/20 p-3 text-[10px] text-zinc-300"><span className="text-emerald-300 font-semibold">Verified effect RGBA.</span> This asset belongs to the separately qualified O23 effect tier.</div>}
    {unresolved && <div className="mt-3 rounded border border-amber-900 bg-amber-950/20 p-3 text-[10px] text-zinc-300"><span className="text-amber-300 font-semibold">Palette unresolved.</span> The image above is a grayscale visualization of raw one-based palette indices only. It is deliberately not presented as the game's colour palette.</div>}
    <div className="grid sm:grid-cols-2 gap-2 mt-3 text-[10px] font-mono">
      {char && <><div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Resource</span><div className="text-zinc-300">{char.resourcePath}</div></div><div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Dimensions</span><div className="text-zinc-300">{char.width}×{char.height}</div></div></>}
      {effect && <><div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Checksum</span><div className="text-zinc-300">{effect.rgbaChecksum}</div></div><div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Dimensions</span><div className="text-zinc-300">{effect.width}×{effect.height}</div></div></>}
      {unresolved && <><div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Resource</span><div className="text-zinc-300">{unresolved.resourcePath}</div></div><div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Indices</span><div className="text-zinc-300">{unresolved.opaqueIndexUnion.join(', ')}</div></div></>}
    </div>
  </div>;
}

function AnimationAssetsView({ workspace }: { workspace: MK1AnimationAssetsWorkspaceResult }) {
  const [tier, setTier] = useState<AnimationTier>('characters');
  const [characterId, setCharacterId] = useState<string>('all');
  const [mode, setMode] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState('');
  const pageSize = 72;
  const characterRows = useMemo(() => workspace.characterAssets.filter((asset) => {
    if (characterId !== 'all' && asset.characterId !== Number(characterId)) return false;
    if (mode !== 'all' && asset.mode !== mode) return false;
    const q = search.trim().toLowerCase(); if (!q) return true;
    return [asset.identityLabel, asset.descriptorWatcomOffsetHex, asset.resourcePath, asset.anitabSymbol, asset.paletteSymbols.join('+')].some((v) => v.toLowerCase().includes(q));
  }), [workspace, characterId, mode, search]);
  const effectRows = useMemo(() => workspace.effectAssets.filter((asset) => { const q = search.trim().toLowerCase(); return !q || [asset.key, asset.path].some((v) => v.toLowerCase().includes(q)); }), [workspace, search]);
  const unresolvedRows = useMemo(() => workspace.unresolvedAssets.filter((asset) => { const q = search.trim().toLowerCase(); return !q || [asset.symbol ?? '', asset.descriptorWatcomOffsetHex, asset.resourcePath, asset.tableSymbol].some((v) => v.toLowerCase().includes(q)); }), [workspace, search]);
  const allRows = tier === 'characters' ? characterRows : tier === 'effects' ? effectRows : unresolvedRows;
  const pageCount = Math.max(1, Math.ceil(allRows.length / pageSize));
  useEffect(() => { setPage(0); setSelectedKey(''); }, [tier, characterId, mode, search]);
  useEffect(() => { if (page >= pageCount) setPage(pageCount - 1); }, [page, pageCount]);
  const shown = allRows.slice(page * pageSize, page * pageSize + pageSize);
  const keyOf = (asset: typeof allRows[number]) => tier === 'characters' ? (asset as MK1AnimationWorkspaceCharacterAsset).path : tier === 'effects' ? (asset as MK1AnimationWorkspaceEffectAsset).path : `${(asset as MK1AnimationWorkspaceUnresolvedAsset).tableSymbol}:${(asset as MK1AnimationWorkspaceUnresolvedAsset).descriptorWatcomOffset}`;
  const selected = (selectedKey ? allRows.find((asset) => keyOf(asset) === selectedKey) : allRows[0]) as typeof allRows[number] | undefined;
  return <div className="p-4">
    <div className="flex flex-wrap gap-2 mb-3">
      <button type="button" onClick={() => setTier('characters')} className={`px-3 py-2 rounded text-xs font-mono border ${tier === 'characters' ? 'border-violet-500 bg-violet-950/50 text-violet-200' : 'border-zinc-700 text-zinc-400'}`}>Character contexts · 2,263</button>
      <button type="button" onClick={() => setTier('effects')} className={`px-3 py-2 rounded text-xs font-mono border ${tier === 'effects' ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' : 'border-zinc-700 text-zinc-400'}`}>Verified effects · 21</button>
      <button type="button" onClick={() => setTier('unresolved')} className={`px-3 py-2 rounded text-xs font-mono border ${tier === 'unresolved' ? 'border-amber-500 bg-amber-950/40 text-amber-200' : 'border-zinc-700 text-zinc-400'}`}>Indexed / unresolved · 79</button>
    </div>
    <div className="flex flex-col md:flex-row gap-2 mb-3">
      <label className="flex-1 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"><Search className="w-4 h-4 text-zinc-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search animation assets…" className="w-full bg-transparent outline-none text-xs text-zinc-200 placeholder:text-zinc-600" /></label>
      {tier === 'characters' && <><select value={characterId} onChange={(e) => setCharacterId(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 font-mono"><option value="all">All characters</option>{workspace.characterIdentities.map((c) => <option key={c.characterId} value={c.characterId}>{c.identityLabel} ({c.assetCount})</option>)}</select><select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 font-mono"><option value="all">Normal + alternate</option><option value="NORMAL">Normal</option><option value="ALTERNATE">Alternate</option></select></>}
    </div>
    <div className="mb-3 rounded border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-[10px] font-mono text-zinc-500">Showing {Math.min(page * pageSize + 1, allRows.length)}–{Math.min((page + 1) * pageSize, allRows.length)} of {allRows.length}. Animation-control dwell values remain structural units; no FPS or milliseconds are implied by this browser.</div>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)] gap-4 items-start">
      <div><div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 max-h-[760px] overflow-auto pr-1">{shown.map((asset) => { const k = keyOf(asset); return tier === 'characters' ? <CharacterAssetThumb key={k} asset={asset as MK1AnimationWorkspaceCharacterAsset} selected={k === (selected ? keyOf(selected) : '')} onSelect={() => setSelectedKey(k)} /> : tier === 'effects' ? <EffectAssetThumb key={k} asset={asset as MK1AnimationWorkspaceEffectAsset} selected={k === (selected ? keyOf(selected) : '')} onSelect={() => setSelectedKey(k)} /> : <UnresolvedAssetThumb key={k} asset={asset as MK1AnimationWorkspaceUnresolvedAsset} selected={k === (selected ? keyOf(selected) : '')} onSelect={() => setSelectedKey(k)} />; })}</div>
        {pageCount > 1 && <div className="flex items-center justify-between mt-3 text-[10px] font-mono"><button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-3 py-1.5 rounded border border-zinc-700 disabled:text-zinc-700">Previous</button><span className="text-zinc-500">Page {page + 1}/{pageCount}</span><button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} className="px-3 py-1.5 rounded border border-zinc-700 disabled:text-zinc-700">Next</button></div>}
      </div>
      {selected && <AnimationAssetDetail tier={tier} asset={selected as any} />}
    </div>
  </div>;
}


function useAudioUrl(bytes: Uint8Array): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const stable = new Uint8Array(bytes), next = URL.createObjectURL(new Blob([stable.buffer], { type: 'audio/wav' }));
    setUrl(next); return () => URL.revokeObjectURL(next);
  }, [bytes]);
  return url;
}
function durationLabel(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000)), m = Math.floor(total / 60), sec = total % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
function AudioAssetDetail({ asset }: { asset: MK1AudioWorkspaceAsset }) {
  const url = useAudioUrl(asset.wavBytes);
  return <div className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-4">
    <div className="flex flex-wrap justify-between gap-2"><div><div className="font-mono text-sm font-bold text-fuchsia-300">{asset.fileName}</div><div className="text-[10px] text-zinc-500 mt-1">{asset.soundCodeHex ?? 'No sound-code record binding'} · {asset.playbackPolicy}</div></div><div className="text-[10px] font-mono text-zinc-500">{durationLabel(asset.durationMillisecondsRounded)}</div></div>
    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">{url && <audio controls preload="metadata" src={url} className="w-full" />}</div>
    <div className="mt-3 rounded border border-fuchsia-900 bg-fuchsia-950/20 p-3 text-[10px] text-zinc-300"><span className="text-fuchsia-300 font-semibold">Installation identifier only.</span> The filename and hexadecimal sound code are authentic identifiers; O64 does not claim a gameplay/event name for this asset.</div>
    <div className="grid sm:grid-cols-2 gap-2 mt-3 text-[10px] font-mono">
      <div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Source</span><div className="text-zinc-300 break-all">{asset.sourcePath}</div></div>
      <div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Binding</span><div className="text-zinc-300">{asset.tableBinding}</div></div>
      <div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">PCM</span><div className="text-zinc-300">{asset.sampleRate} Hz · {asset.bitsPerSample}-bit · {asset.channels === 1 ? 'mono' : `${asset.channels} channels`}</div></div>
      <div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">Bytes</span><div className="text-zinc-300">{asset.byteLength.toLocaleString()} file · {asset.dataByteLength.toLocaleString()} PCM</div></div>
      <div className="sm:col-span-2 rounded border border-zinc-800 p-2"><span className="text-zinc-500">SHA-256</span><div className="text-zinc-300 break-all">{asset.sha256}</div></div>
    </div>
  </div>;
}
function AudioAssetsView({ workspace }: { workspace: MK1AudioAssetsWorkspaceResult }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'bound' | 'loop' | 'unbound'>('all');
  const [page, setPage] = useState(0), [selectedPath, setSelectedPath] = useState('');
  const pageSize = 24;
  const rows = useMemo(() => workspace.assets.filter((asset) => {
    if (filter === 'bound' && asset.tableBinding !== 'RECORD_BOUND') return false;
    if (filter === 'loop' && asset.playbackPolicy !== 'STOP_ALL_THEN_PLAY_FOREVER') return false;
    if (filter === 'unbound' && asset.tableBinding !== 'PATH_POOL_ONLY_UNBOUND') return false;
    const q = search.trim().toLowerCase(); if (!q) return true;
    return [asset.fileName, asset.sourcePath, asset.soundCodeHex ?? '', asset.playbackPolicy].some((v) => v.toLowerCase().includes(q));
  }), [workspace, filter, search]);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => { setPage(0); setSelectedPath(''); }, [filter, search]);
  useEffect(() => { if (page >= pageCount) setPage(pageCount - 1); }, [page, pageCount]);
  const shown = rows.slice(page * pageSize, page * pageSize + pageSize), selected = (selectedPath ? rows.find((a) => a.sourcePath === selectedPath) : rows[0]);
  return <div className="p-4">
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-3 text-[10px] font-mono">
      <div className="rounded border border-fuchsia-900 bg-fuchsia-950/20 p-2"><div className="text-zinc-500">WAV assets</div><div className="text-fuchsia-300 text-lg">244</div></div>
      <div className="rounded border border-zinc-800 p-2"><div className="text-zinc-500">Sound-code bound</div><div className="text-zinc-200 text-lg">243</div></div>
      <div className="rounded border border-zinc-800 p-2"><div className="text-zinc-500">Loop-forever policy</div><div className="text-zinc-200 text-lg">11</div></div>
      <div className="rounded border border-zinc-800 p-2"><div className="text-zinc-500">Path-pool only</div><div className="text-zinc-200 text-lg">1</div></div>
      <div className="rounded border border-amber-900 bg-amber-950/20 p-2"><div className="text-zinc-500">Unresolved raw</div><div className="text-amber-300 text-lg">1</div></div>
    </div>
    <div className="flex flex-col md:flex-row gap-2 mb-3"><label className="flex-1 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"><Search className="w-4 h-4 text-zinc-600" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filename, sound code or playback policy…" className="w-full bg-transparent outline-none text-xs text-zinc-200 placeholder:text-zinc-600" /></label><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 font-mono"><option value="all">All WAVs</option><option value="bound">Record-bound</option><option value="loop">Loop-forever policy</option><option value="unbound">Path-pool only</option></select></div>
    <div className="mb-3 rounded border border-amber-900 bg-amber-950/20 p-3 text-[10px] text-zinc-300"><span className="font-semibold text-amber-300">Unresolved preserved resource:</span> SAMPLES.DAT ({workspace.unresolvedResources[0]?.byteLength.toLocaleString()} bytes) is included byte-for-byte in the O64 package, but its format and executable relationship remain UNKNOWN. It is not labelled or played here as music.</div>
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,.95fr)] gap-4 items-start"><div><div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[720px] overflow-auto pr-1">{shown.map((asset) => <button key={asset.sourcePath} type="button" onClick={() => setSelectedPath(asset.sourcePath)} className={`rounded-lg border p-3 text-left ${selected?.sourcePath === asset.sourcePath ? 'border-fuchsia-500 bg-fuchsia-950/20' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-600'}`}><div className="text-[11px] font-mono font-semibold text-zinc-200">{asset.fileName}</div><div className="mt-1 text-[9px] font-mono text-fuchsia-400">{asset.soundCodeHex ?? 'UNBOUND'}</div><div className="mt-1 text-[9px] text-zinc-500 truncate">{asset.playbackPolicy}</div><div className="mt-1 text-[9px] text-zinc-600">{durationLabel(asset.durationMillisecondsRounded)}</div></button>)}</div>{pageCount > 1 && <div className="flex items-center justify-between mt-3 text-[10px] font-mono"><button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="px-3 py-1.5 rounded border border-zinc-700 disabled:text-zinc-700">Previous</button><span className="text-zinc-500">Page {page + 1}/{pageCount} · {rows.length} assets</span><button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} className="px-3 py-1.5 rounded border border-zinc-700 disabled:text-zinc-700">Next</button></div>}</div>{selected && <AudioAssetDetail asset={selected} />}</div>
  </div>;
}

function ArtifactDetails({ artifact }: { artifact: ResearchArtifact }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen((value) => !value)} className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300">{open ? 'Hide report JSON' : 'View report JSON'}</button>
      {open && <pre className="mt-2 max-h-80 overflow-auto rounded border border-zinc-800 bg-black/40 p-3 text-[10px] text-zinc-400 whitespace-pre-wrap">{JSON.stringify(artifact.data, null, 2)}</pre>}
    </div>
  );
}

export function ResearchResultsWorkspace({ artifacts, workspace, animationWorkspace, audioWorkspace, isRunning }: Props) {
  const [tab, setTab] = useState<WorkspaceTab>('overview');
  const [selectedStage, setSelectedStage] = useState(workspace.stagePreviews[0]?.moduleSymbol ?? '');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<MK1ResearchWorkspaceGroupId | 'all'>('all');
  const rows = useMemo(() => buildResearchPassPresentationRows(artifacts), [artifacts]);
  const artifactByFilename = useMemo(() => new Map(artifacts.map((artifact) => [artifact.filename, artifact])), [artifacts]);
  const selected = workspace.stagePreviews.find((stage) => stage.moduleSymbol === selectedStage) ?? workspace.stagePreviews[0];
  const groups = useMemo(() => {
    const map = new Map<MK1ResearchWorkspaceGroupId, { title: string; count: number }>();
    for (const row of rows) {
      const prior = map.get(row.groupId);
      map.set(row.groupId, { title: row.groupTitle, count: (prior?.count ?? 0) + 1 });
    }
    return [...map.entries()];
  }, [rows]);
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (groupFilter !== 'all' && row.groupId !== groupFilter) return false;
      if (!needle) return true;
      return [row.pass, row.filename, row.status, row.verdict ?? '', row.format ?? '', row.groupTitle].some((value) => value.toLowerCase().includes(needle));
    });
  }, [rows, search, groupFilter]);

  const tabButton = (id: WorkspaceTab, label: string) => (
    <button type="button" onClick={() => setTab(id)} className={`px-3 py-2 text-xs font-mono font-semibold border-b-2 ${tab === id ? 'border-amber-500 text-amber-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>{label}</button>
  );

  return (
    <section className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900/70 overflow-hidden shadow-xl">
      <div className="px-4 py-3 border-b border-zinc-800 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-zinc-100">Research Results Workspace</h3>
            <span className="text-[10px] font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-900 px-2 py-0.5">O57 + O62 + O64</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Data-driven coverage of completed passes plus verified stage, animation and audio asset views. Specialist editors remain below.</p>
        </div>
        <div className="text-right text-[10px] font-mono text-zinc-500">
          <div>{rows.length} result artifact{rows.length === 1 ? '' : 's'} visible</div>
          <div>{workspace.stagePreviews.length}/24 stage previews{animationWorkspace ? ` · ${animationWorkspace.report.summary.totalBrowsableAssetCount.toLocaleString()} animation assets` : ''}{audioWorkspace ? ` · ${audioWorkspace.report.summary.browsableWavAssetCount} audio assets` : ''}</div>
        </div>
      </div>
      <div className="px-3 border-b border-zinc-800 flex gap-1 overflow-x-auto">
        {tabButton('overview', 'Overview')}
        {tabButton('stages', 'Stage Backgrounds')}
        {animationWorkspace && tabButton('animations', 'Animation Assets')}
        {audioWorkspace && tabButton('audio', 'Audio Assets')}
        {tabButton('passes', 'Research Passes')}
      </div>

      {tab === 'overview' && (
        <div className="p-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"><div className="text-2xl font-mono font-bold text-amber-300">{rows.length}</div><div className="text-[10px] text-zinc-500 mt-1">Completed result artifacts represented</div></div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"><div className="text-2xl font-mono font-bold text-cyan-300">24/24</div><div className="text-[10px] text-zinc-500 mt-1">Stage normalized previews</div></div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"><div className="text-2xl font-mono font-bold text-emerald-300">{rows.filter((row) => row.validationPassed === true).length}</div><div className="text-[10px] text-zinc-500 mt-1">Artifacts reporting validation passed</div></div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"><div className="text-2xl font-mono font-bold text-zinc-200">{groups.length}</div><div className="text-[10px] text-zinc-500 mt-1">Automatically grouped result domains</div></div>
            {animationWorkspace && <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"><div className="text-2xl font-mono font-bold text-violet-300">{animationWorkspace.report.summary.totalBrowsableAssetCount.toLocaleString()}</div><div className="text-[10px] text-zinc-500 mt-1">Browsable animation assets across qualified + unresolved tiers</div></div>}
            {audioWorkspace && <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"><div className="text-2xl font-mono font-bold text-fuchsia-300">{audioWorkspace.report.summary.browsableWavAssetCount}</div><div className="text-[10px] text-zinc-500 mt-1">Byte-exact playable WAV assets with explicit sound-code/playback metadata</div></div>}
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            {groups.map(([id, group]) => <button key={id} type="button" onClick={() => { setGroupFilter(id); setTab('passes'); }} className="rounded-lg border border-zinc-800 bg-zinc-950/40 hover:border-zinc-600 p-3 text-left flex justify-between gap-3"><span className="text-xs text-zinc-300">{group.title}</span><span className="font-mono text-xs text-amber-300">{group.count}</span></button>)}
          </div>
          <div className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/20 p-3 flex items-start gap-2 text-[11px] text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div><span className="text-emerald-300 font-semibold">Coverage model:</span> new ResearchArtifact entries automatically appear in this workspace. A bespoke panel is only needed when a pass benefits from a specialist interactive editor.</div>
          </div>
        </div>
      )}

      {tab === 'stages' && selected && (
        <div className="p-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,1.15fr)] gap-4 items-start">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[720px] overflow-auto pr-1">
            {workspace.stagePreviews.map((stage) => <StageThumbnail key={stage.moduleSymbol} stage={stage} selected={stage.moduleSymbol === selected.moduleSymbol} onSelect={() => setSelectedStage(stage.moduleSymbol)} />)}
          </div>
          <StageDetail stage={selected} />
        </div>
      )}

      {tab === 'animations' && animationWorkspace && <AnimationAssetsView workspace={animationWorkspace} />}

      {tab === 'audio' && audioWorkspace && <AudioAssetsView workspace={audioWorkspace} />}

      {tab === 'passes' && (
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-2 mb-3">
            <label className="flex-1 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"><Search className="w-4 h-4 text-zinc-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pass, verdict, format…" className="w-full bg-transparent outline-none text-xs text-zinc-200 placeholder:text-zinc-600" /></label>
            <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value as MK1ResearchWorkspaceGroupId | 'all')} className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300 font-mono">
              <option value="all">All groups</option>
              {groups.map(([id, group]) => <option key={id} value={id}>{group.title} ({group.count})</option>)}
            </select>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mb-2">Showing {filteredRows.length} of {rows.length}</div>
          <div className="space-y-2 max-h-[880px] overflow-auto pr-1">
            {filteredRows.map((row) => {
              const artifact = artifactByFilename.get(row.filename);
              return <div key={`${row.pass}-${row.filename}`} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex flex-wrap items-start gap-2">
                  <span className="text-[10px] font-mono rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-zinc-300">{row.pass}</span>
                  <span className={`text-[10px] font-mono rounded border px-2 py-0.5 ${row.validationPassed === false || row.status === 'FAILED' ? 'border-red-900 bg-red-950/30 text-red-300' : 'border-emerald-900 bg-emerald-950/20 text-emerald-300'}`}>{row.status}</span>
                  <span className="text-[10px] text-zinc-500">{row.groupTitle}</span>
                  {artifact && <button type="button" disabled={isRunning} onClick={() => downloadResearchArtifact(artifact)} className="ml-auto flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 disabled:text-zinc-700"><Download className="w-3 h-3" />JSON</button>}
                </div>
                <div className="mt-2 text-xs font-mono text-zinc-300 break-all">{row.verdict ?? row.format ?? row.filename}</div>
                {row.summaryEntries.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{row.summaryEntries.map((item) => <span key={item.key} className="text-[9px] font-mono rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-zinc-500"><span className="text-zinc-400">{item.key}</span> {item.value}</span>)}</div>}
                {artifact && <ArtifactDetails artifact={artifact} />}
              </div>;
            })}
          </div>
        </div>
      )}
    </section>
  );
}

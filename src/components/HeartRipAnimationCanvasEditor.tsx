import React, { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Film, Link2, Move, RotateCcw, Save, Target } from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';
import {
  buildHeartRipAnimationCanvasEditBundle,
  createMK1HeartRipAnimationCanvasEditExport,
  executeHeartRipAnimationCanvasEdit,
  HeartRipDescriptorModel,
  HeartRipDescriptorSymbol,
  HeartRipFrameOccurrenceModel,
  MK1HeartRipAnimationCanvasEditResult,
  MK1HeartRipAnimationCanvasEditorReport,
} from '../games/mk1/research/heartRipAnimationCanvasEditor';

interface Props { source: DirectorySource; model: MK1HeartRipAnimationCanvasEditorReport; onExport: (artifact: ResearchArtifact) => void; }
type Coord = { x: number; y: number };

function stamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }
function clampI16(v: number) { return Math.max(-32768, Math.min(32767, Math.round(v))); }
function parseHexColor(hex: string): [number, number, number] { const h = hex.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function saveBlob(bytes: Uint8Array, name: string, type: string) { const url = URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type })); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

function spriteCanvas(model: MK1HeartRipAnimationCanvasEditorReport, d: HeartRipDescriptorModel) {
  const payload = model.previewPayloads?.get(d.symbol); if (!payload) return null;
  const palette = model.palette.rgbHex.map(parseHexColor);
  const c = document.createElement('canvas'); c.width = d.width; c.height = d.height; const ctx = c.getContext('2d'); if (!ctx) return null;
  const im = ctx.createImageData(d.width, d.height);
  for (let i = 0; i < payload.indices.length; i++) {
    if (!payload.opaqueMask[i]) continue;
    const idx = payload.indices[i]; const rgb = idx >= 1 && idx <= palette.length ? palette[idx - 1] : [255, 0, 255] as [number, number, number]; const p = i * 4;
    im.data[p] = rgb[0]; im.data[p + 1] = rgb[1]; im.data[p + 2] = rgb[2]; im.data[p + 3] = 255;
  }
  ctx.putImageData(im, 0, 0); return c;
}

function paint(
  canvas: HTMLCanvasElement,
  model: MK1HeartRipAnimationCanvasEditorReport,
  occurrence: HeartRipFrameOccurrenceModel,
  coords: Map<string, Coord>,
  selected: HeartRipDescriptorSymbol,
  showOriginal: boolean,
) {
  const scale = model.canvas.recommendedScale;
  canvas.width = model.canvas.width * scale; canvas.height = model.canvas.height * scale;
  const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.imageSmoothingEnabled = false;
  const toX = (x: number) => (x - model.canvas.minX) * scale, toY = (y: number) => (y - model.canvas.minY) * scale;
  ctx.save(); ctx.strokeStyle = 'rgba(113,113,122,.32)'; ctx.lineWidth = 1;
  const ax = toX(0) + .5, ay = toY(0) + .5; ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(canvas.width, ay); ctx.stroke(); ctx.restore();

  const visible = occurrence.descriptorSymbols.map(symbol => model.descriptors.find(d => d.symbol === symbol)!).filter(Boolean);
  if (showOriginal) {
    for (const d of visible) {
      const current = coords.get(d.symbol) ?? { x: d.x, y: d.y }; if (current.x === d.x && current.y === d.y) continue;
      const sprite = spriteCanvas(model, d); if (!sprite) continue;
      ctx.save(); ctx.globalAlpha = .20; ctx.drawImage(sprite, toX(d.x), toY(d.y), d.width * scale, d.height * scale);
      ctx.strokeStyle = 'rgba(250,204,21,.75)'; ctx.setLineDash([5, 4]); ctx.strokeRect(toX(d.x) + .5, toY(d.y) + .5, d.width * scale - 1, d.height * scale - 1); ctx.restore();
    }
  }

  // Structural linked-object order only; not promoted as universal final pixel z-order.
  for (const d of visible) {
    const current = coords.get(d.symbol) ?? { x: d.x, y: d.y }; const sprite = spriteCanvas(model, d); if (!sprite) continue;
    ctx.drawImage(sprite, toX(current.x), toY(current.y), d.width * scale, d.height * scale);
    ctx.save(); ctx.strokeStyle = d.symbol === selected ? 'rgba(34,211,238,.98)' : 'rgba(167,139,250,.65)'; ctx.lineWidth = d.symbol === selected ? 2 : 1;
    ctx.strokeRect(toX(current.x) + .5, toY(current.y) + .5, d.width * scale - 1, d.height * scale - 1);
    if (d.symbol === selected) { ctx.fillStyle = 'rgba(34,211,238,.98)'; ctx.fillRect(toX(current.x) - 2, toY(current.y) - 2, 5, 5); }
    ctx.restore();
  }
}

export function HeartRipAnimationCanvasEditor({ source, model, onExport }: Props) {
  const [coords, setCoords] = useState<Map<string, Coord>>(() => new Map(model.descriptors.map(d => [d.symbol, { x: d.x, y: d.y }])));
  const [previewKey, setPreviewKey] = useState(model.occurrences[0]?.previewKey ?? 'PRIMARY:0');
  const occurrence = model.occurrences.find(o => o.previewKey === previewKey) ?? model.occurrences[0];
  const [selected, setSelected] = useState<HeartRipDescriptorSymbol>(occurrence.descriptorSymbols[0]);
  const [showOriginal, setShowOriginal] = useState(true);
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [compiled, setCompiled] = useState<MK1HeartRipAnimationCanvasEditResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startClientX: number; startClientY: number; start: Coord; symbol: HeartRipDescriptorSymbol } | null>(null);

  useEffect(() => { if (!occurrence.descriptorSymbols.includes(selected)) setSelected(occurrence.descriptorSymbols[0]); }, [occurrence, selected]);
  const descriptor = model.descriptors.find(d => d.symbol === selected) ?? model.descriptors[0];
  const current = coords.get(descriptor.symbol) ?? { x: descriptor.x, y: descriptor.y };
  const dirty = useMemo(() => model.descriptors.filter(d => { const c = coords.get(d.symbol)!; return c.x !== d.x || c.y !== d.y; }), [coords, model]);
  const visibleDescriptors = occurrence.descriptorSymbols.map(symbol => model.descriptors.find(d => d.symbol === symbol)!).filter(Boolean);

  useEffect(() => { if (canvasRef.current) paint(canvasRef.current, model, occurrence, coords, selected, showOriginal); }, [model, occurrence, coords, selected, showOriginal]);
  useEffect(() => { setCompiled(null); setError(null); }, [coords]);

  const update = (symbol: string, next: Coord) => setCoords(prev => { const n = new Map(prev); n.set(symbol, { x: clampI16(next.x), y: clampI16(next.y) }); return n; });
  const resetSelected = () => update(descriptor.symbol, { x: descriptor.x, y: descriptor.y });
  const resetAll = () => setCoords(new Map(model.descriptors.map(d => [d.symbol, { x: d.x, y: d.y }])));
  const worldPoint = (e: ReactPointerEvent<HTMLCanvasElement>) => { const rect = e.currentTarget.getBoundingClientRect(); return { x: model.canvas.minX + (e.clientX - rect.left) * model.canvas.width / rect.width, y: model.canvas.minY + (e.clientY - rect.top) * model.canvas.height / rect.height }; };
  const pointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const p = worldPoint(e); const hit = [...visibleDescriptors].reverse().find(d => { const c = coords.get(d.symbol)!; return p.x >= c.x && p.x < c.x + d.width && p.y >= c.y && p.y < c.y + d.height; });
    if (!hit) return; setSelected(hit.symbol); const start = coords.get(hit.symbol)!;
    dragRef.current = { pointerId: e.pointerId, startClientX: e.clientX, startClientY: e.clientY, start: { ...start }, symbol: hit.symbol }; e.currentTarget.setPointerCapture(e.pointerId);
  };
  const pointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const dr = dragRef.current; if (!dr || dr.pointerId !== e.pointerId) return; const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - dr.startClientX) * model.canvas.width / rect.width, dy = (e.clientY - dr.startClientY) * model.canvas.height / rect.height;
    update(dr.symbol, { x: dr.start.x + dx, y: dr.start.y + dy });
  };
  const pointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => { if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* no-op */ } };

  const compile = async () => {
    if (!dirty.length || busy) return; setBusy(true); setError(null);
    try {
      const result = await executeHeartRipAnimationCanvasEdit(source, model, { authoringMode: 'INTERACTIVE_CANVAS', changes: dirty.map(d => { const c = coords.get(d.symbol)!; return { symbol: d.symbol, x: c.x, y: c.y }; }), note: 'Authored through Pass 1E.3O.8 full fixed-layout Kano heart-rip animation editor' });
      setCompiled(result); const data = createMK1HeartRipAnimationCanvasEditExport(result);
      onExport({ filename: `mk1_heart_rip_animation_canvas_edit_${stamp()}.json`, pass: '1E.3O.8-edit', status: result.report.status, timestamp: data.timestamp, data });
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };
  const downloadBundle = async () => { if (!compiled || busy) return; setBusy(true); setError(null); try { const zip = buildHeartRipAnimationCanvasEditBundle(compiled, model); saveBlob(zip, 'MK1-1E3O8-kano-heart-rip-animation-edit.zip', 'application/zip'); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } };
  const exportPreview = () => { if (!canvasRef.current) return; canvasRef.current.toBlob(blob => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `mk1_kano_heart_${previewKey.replace(':','_')}_preview.png`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }, 'image/png'); };

  return <section className="mt-3 p-3 rounded border border-fuchsia-700 bg-fuchsia-950/10 text-xs text-zinc-300" aria-label="Full fixed-layout heart-rip animation placement editor">
    <div className="flex flex-wrap gap-2 items-center"><h3 className="font-semibold text-fuchsia-300 flex items-center gap-2"><Film className="w-4 h-4"/>Full heart-rip fixed-layout placement · 1E.3O.8</h3><span className="ml-auto text-[10px] font-mono text-emerald-300">8 occurrences · 7 records · 9 descriptors · {model.noEditRoundTrip.exact ? 'no-edit exact' : 'round trip failed'}</span></div>
    <p className="mt-2 text-zinc-400">Edit any of the nine already-qualified KHEART descriptors across the complete primary and beat-loop sequences. Storage aliases are explicit: one descriptor edit affects every occurrence that references it.</p>
    <div className="mt-3 grid xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,.65fr)] gap-3">
      <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
        <div className="flex flex-wrap items-center gap-2"><label className="text-zinc-500">Frame occurrence</label><select value={occurrence.previewKey} onChange={e => setPreviewKey(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200">{model.occurrences.map(o => <option key={o.previewKey} value={o.previewKey}>{o.previewKey} · {o.frameRecordKey} · {o.structuralPartCount} part{o.structuralPartCount===1?'':'s'}{o.reusedFrameRecord?' · shared record':''}</option>)}</select><label className="ml-auto flex items-center gap-1 text-zinc-400"><input type="checkbox" checked={showOriginal} onChange={e => setShowOriginal(e.target.checked)}/> original ghosts</label></div>
        <div className="mt-2 flex flex-wrap gap-2 items-center"><label className="text-zinc-500">Visible part</label><select value={selected} onChange={e => setSelected(e.target.value as HeartRipDescriptorSymbol)} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200">{visibleDescriptors.map((d,i) => <option key={d.symbol} value={d.symbol}>part {i} · {d.symbol}</option>)}</select><span className="text-[10px] text-zinc-500 font-mono">record {occurrence.frameRecordWatcomOffsetHex}</span></div>
        <div className="mt-3 min-h-[360px] flex items-center justify-center overflow-auto rounded border border-zinc-800 p-2" style={{backgroundColor:'#09090b',backgroundImage:'linear-gradient(45deg,#18181b 25%,transparent 25%),linear-gradient(-45deg,#18181b 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#18181b 75%),linear-gradient(-45deg,transparent 75%,#18181b 75%)',backgroundSize:'16px 16px',backgroundPosition:'0 0,0 8px,8px -8px,-8px 0'}}><canvas ref={canvasRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} className="border border-zinc-700/60 cursor-move touch-none" style={{imageRendering:'pixelated'}}/></div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-zinc-500"><span>descriptor-local origin (0,0)</span><span>·</span><span>structural pointer-list order only</span><span>·</span><span>not a universal final z-order claim</span></div>
      </div>
      <div className="space-y-3">
        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3"><div className="font-semibold text-zinc-200 flex items-center gap-2"><Target className="w-4 h-4"/>{descriptor.symbol}</div><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-zinc-500">X<input type="number" value={current.x} onChange={e => update(descriptor.symbol,{x:Number(e.target.value),y:current.y})} className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100"/></label><label className="text-zinc-500">Y<input type="number" value={current.y} onChange={e => update(descriptor.symbol,{x:current.x,y:Number(e.target.value)})} className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100"/></label></div><div className="mt-2 font-mono text-fuchsia-300">original ({descriptor.x}, {descriptor.y}) · delta ({current.x-descriptor.x}, {current.y-descriptor.y})</div><div className="mt-3 flex flex-wrap gap-1"><button onClick={() => update(descriptor.symbol,{x:current.x-1,y:current.y})} className="px-2 py-1 rounded bg-zinc-800">←</button><button onClick={() => update(descriptor.symbol,{x:current.x+1,y:current.y})} className="px-2 py-1 rounded bg-zinc-800">→</button><button onClick={() => update(descriptor.symbol,{x:current.x,y:current.y-1})} className="px-2 py-1 rounded bg-zinc-800">↑</button><button onClick={() => update(descriptor.symbol,{x:current.x,y:current.y+1})} className="px-2 py-1 rounded bg-zinc-800">↓</button><button onClick={resetSelected} className="ml-auto px-2 py-1 rounded bg-zinc-800 flex items-center gap-1"><RotateCcw className="w-3 h-3"/>reset</button></div></div>
        <div className={`rounded border p-3 ${descriptor.aliasedAcrossOccurrences?'border-amber-800 bg-amber-950/15':'border-zinc-800 bg-zinc-950/50'}`}><div className="font-semibold flex items-center gap-2"><Link2 className="w-4 h-4"/>Storage usage</div><div className="mt-2 text-zinc-400">{descriptor.usageCount} sequence occurrence{descriptor.usageCount===1?'':'s'} reference this descriptor.</div><div className="mt-1 font-mono text-[10px] text-amber-300">{descriptor.usage.map(u => u.previewKey).join(' · ')}</div>{descriptor.symbol==='KHEART5A' && <div className="mt-2 text-amber-200">KHEART5A is shared by PRIMARY:4 and BEAT_LOOP:2. Editing it intentionally changes both appearances.</div>}</div>
        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3"><div className="flex justify-between"><span className="font-semibold text-zinc-200">Pending semantic edits</span><span className={dirty.length?'text-amber-300':'text-zinc-500'}>{dirty.length}/9 descriptors</span></div><div className="mt-2 max-h-36 overflow-auto font-mono text-[10px]">{dirty.length ? dirty.map(d => { const c=coords.get(d.symbol)!; return <div key={d.symbol} className="py-0.5"><span className="text-fuchsia-300">{d.symbol}</span> ({d.x},{d.y}) → ({c.x},{c.y}) · affects {d.usage.map(u=>u.previewKey).join(', ')}</div>; }) : <span className="text-zinc-600">No changes yet.</span>}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={compile} disabled={!dirty.length||busy} className="px-3 py-2 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-1.5"><Save className="w-4 h-4"/>{busy?'Compiling…':'Compile semantic edit'}</button><button onClick={resetAll} disabled={!dirty.length||busy} className="px-2 py-2 rounded bg-zinc-800 disabled:opacity-40">Reset all</button><button onClick={exportPreview} className="px-2 py-2 rounded bg-zinc-800">PNG preview</button></div></div>
      </div>
    </div>
    {compiled && <div className="mt-3 rounded border border-emerald-900 bg-emerald-950/20 p-3"><div className="font-semibold text-emerald-300">Compiled through the bounded animation IR</div><div className="mt-1 font-mono">{compiled.report.evidence.changedDescriptorCount} descriptors · {compiled.report.evidence.changedFieldCount} X/Y fields · {compiled.report.evidence.changedByteCount} changed EXE bytes · unexpected {compiled.report.evidence.unexpectedByteChanges} · semantic reparse {compiled.report.evidence.semanticReparseMatches?'yes':'no'} · reversal {compiled.report.evidence.reverseRestoresOriginal?'exact':'failed'}</div><div className="mt-1 text-zinc-500 break-all">edited SHA-256 {compiled.report.evidence.editedSha256}</div><button onClick={downloadBundle} disabled={busy} className="mt-3 px-3 py-2 rounded bg-fuchsia-800 hover:bg-fuchsia-700 disabled:opacity-40 text-white flex items-center gap-2"><Download className="w-4 h-4"/>Download edited MK1 test bundle</button></div>}
    {error && <div className="mt-3 rounded border border-red-900 bg-red-950/20 p-2 text-red-300">{error}</div>}
    <div className="mt-3 text-[10px] text-zinc-500 flex items-center gap-1"><Move className="w-3 h-3"/>Fail-closed boundary: descriptor X/Y only. Frame records, part counts, pointers, dimensions, packed references, pixels, palette, allocation/relocation, topology and collision/gameplay remain read-only.</div>
  </section>;
}

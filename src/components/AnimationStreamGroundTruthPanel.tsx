import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { AnimationStreamEvent, MK1AnimationStreamGroundTruthReport, MK1MorphPreviewPayload } from '../games/mk1/research/animationStreamGroundTruth';

interface Props { report: MK1AnimationStreamGroundTruthReport; }

function parseHexColor(hex: string): [number, number, number] {
  const raw = hex.replace('#', '');
  return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
}

function paintAlignedFrame(
  canvas: HTMLCanvasElement,
  payload: MK1MorphPreviewPayload,
  target: MK1AnimationStreamGroundTruthReport['targets'][number],
  scale = 1,
  showAnchor = false,
) {
  const bounds = target.compositionBounds;
  const palette = target.transitionPalette.rgbHex.map(parseHexColor);
  const base = document.createElement('canvas');
  base.width = bounds.width;
  base.height = bounds.height;
  const bctx = base.getContext('2d');
  if (!bctx) return;
  bctx.clearRect(0, 0, base.width, base.height);

  const frame = document.createElement('canvas');
  frame.width = payload.width;
  frame.height = payload.height;
  const fctx = frame.getContext('2d');
  if (!fctx) return;
  const image = fctx.createImageData(payload.width, payload.height);
  for (let i = 0; i < payload.indices.length; i++) {
    if (!payload.opaqueMask[i]) continue;
    const index = payload.indices[i];
    const color = index >= 1 && index <= palette.length ? palette[index - 1] : [255, 0, 255] as [number, number, number];
    const p = i * 4;
    image.data[p] = color[0]; image.data[p + 1] = color[1]; image.data[p + 2] = color[2]; image.data[p + 3] = 255;
  }
  fctx.putImageData(image, 0, 0);
  bctx.drawImage(frame, payload.x - bounds.minX, payload.y - bounds.minY);

  canvas.width = Math.max(1, bounds.width * scale);
  canvas.height = Math.max(1, bounds.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
  if (showAnchor) {
    const ax = bounds.anchorCanvasX * scale;
    const ay = bounds.anchorCanvasY * scale;
    ctx.save();
    ctx.strokeStyle = 'rgba(34,211,238,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(Math.max(0, ax - 6), ay + 0.5); ctx.lineTo(Math.min(canvas.width, ax + 6), ay + 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax + 0.5, Math.max(0, ay - 6)); ctx.lineTo(ax + 0.5, Math.min(canvas.height, ay + 6)); ctx.stroke();
    ctx.restore();
  }
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }, 'image/png');
}

function eventLabel(event: AnimationStreamEvent): string {
  if (event.kind === 'frame') return event.noSleep ? 'FRAME · no sleep' : 'FRAME';
  if (event.kind === 'callback') return event.semantic === 'SWITCH_MORPH_PALETTE' ? 'CALLBACK · morph palette' : event.semantic === 'RESTORE_GENERIC_FIGHTER_PALETTE' ? 'CALLBACK · fighter palette' : 'CALLBACK';
  if (event.kind === 'adjust-xy') return `ADJUST_XY · ${event.x}, ${event.y}`;
  if (event.kind === 'adjust-x') return `ADJUST_X · ${event.x}`;
  if (event.kind === 'flip-multi') return 'FLIP_MULTI';
  if (event.kind === 'jump') return `JUMP · ${event.targetWatcomOffsetHex}`;
  return 'END';
}

export function AnimationStreamGroundTruthPanel({ report }: Props) {
  const [targetId, setTargetId] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [previewDelay, setPreviewDelay] = useState(180);
  const [showAnchor, setShowAnchor] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const target = report.targets.find(item => item.targetCharacterId === targetId) ?? report.targets[0];
  const payload = report.previewPayloads?.get(`${target.targetCharacterId}:${frameIndex}`) ?? null;
  const frame = target.frames[frameIndex];

  useEffect(() => { setFrameIndex(0); setPlaying(false); }, [targetId]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setFrameIndex(index => (index + 1) % 3), previewDelay);
    return () => window.clearInterval(timer);
  }, [playing, previewDelay, targetId]);
  useEffect(() => {
    if (canvasRef.current && payload) paintAlignedFrame(canvasRef.current, payload, target, 3, showAnchor);
  }, [payload, target, showAnchor]);

  const commandSummary = useMemo(() => report.executor.commands.map(command => `${command.opcode}=${command.name}`).join(' · '), [report]);

  const exportFrame = () => {
    if (!payload) return;
    const canvas = document.createElement('canvas');
    paintAlignedFrame(canvas, payload, target, 1, false);
    downloadCanvas(canvas, `mk1_${target.targetName.toLowerCase().replace(/\s+/g, '_')}_morph_frame_${frameIndex + 1}.png`);
  };
  const exportSheet = () => {
    const bounds = target.compositionBounds;
    const sheet = document.createElement('canvas');
    sheet.width = bounds.width * 3; sheet.height = bounds.height;
    const ctx = sheet.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, sheet.width, sheet.height);
    for (let i = 0; i < 3; i++) {
      const item = report.previewPayloads?.get(`${target.targetCharacterId}:${i}`);
      if (!item) continue;
      const single = document.createElement('canvas');
      paintAlignedFrame(single, item, target, 1, false);
      ctx.drawImage(single, i * bounds.width, 0);
    }
    downloadCanvas(sheet, `mk1_${target.targetName.toLowerCase().replace(/\s+/g, '_')}_morph_3frame_sheet.png`);
  };

  const ready = report.status === 'SUCCESS' && report.decision.verdict === 'MORPH_ANIMATION_STREAM_AND_FRAME_COMPOSITION_ESTABLISHED';
  if (!ready) return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300">Animation stream qualification is partial. Preview/export is disabled.</section>;

  return <section className="mt-3 p-3 rounded border border-cyan-800 text-xs text-zinc-300" aria-label="Animation stream and morph frame composition">
    <h3 className="font-semibold text-cyan-300">Animation stream / morph frame composition · 1E.3O.1</h3>
    <p className="mt-2">This is the first asset-compiler-facing animation fixture: executable bytecode → frame-record pointers → sprite descriptors → <code>{report.resource.path}</code> → transition palette → aligned canvas preview. It is intentionally read-only; multi-part frames and writable animation serialization are not promoted yet.</p>

    <div className="mt-3 p-2 rounded bg-zinc-950/70 border border-zinc-800 font-mono text-[11px] overflow-x-auto">
      <div className="text-zinc-500">Qualified animation bytecode</div>
      <div className="mt-1 whitespace-nowrap text-zinc-300">{commandSummary}</div>
      <div className="mt-1 text-zinc-500">Values &gt; 6 are ordinary frame-record pointers. MFRAMEW sleeps through PRCSLP after those frame events; the dwell value comes from the caller, not from these morph streams.</div>
    </div>

    <div className="mt-3 grid xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] gap-3">
      <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-zinc-500">Morph fixture</label>
          <select value={target.targetCharacterId} onChange={event => setTargetId(Number(event.target.value))} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200">
            {report.targets.map(item => <option key={item.targetCharacterId} value={item.targetCharacterId}>{item.targetName} · {item.transitionPalette.symbol}</option>)}
          </select>
          <label className="ml-auto flex items-center gap-1 text-zinc-400"><input type="checkbox" checked={showAnchor} onChange={event => setShowAnchor(event.target.checked)} /> anchor</label>
        </div>

        <div className="mt-3 min-h-[390px] flex items-center justify-center rounded border border-zinc-800 overflow-auto p-4" style={{ backgroundColor: '#09090b', backgroundImage: 'linear-gradient(45deg,#18181b 25%,transparent 25%),linear-gradient(-45deg,#18181b 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#18181b 75%),linear-gradient(-45deg,transparent 75%,#18181b 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0,0 8px,8px -8px,-8px 0' }}>
          {payload ? <canvas ref={canvasRef} className="border border-zinc-700/60 shadow-lg" style={{ imageRendering: 'pixelated' }} /> : <div className="text-zinc-500">Preview payload unavailable in this run.</div>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setFrameIndex(index => (index + 2) % 3)} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"><SkipBack className="w-4 h-4" /></button>
          <button onClick={() => setPlaying(value => !value)} className="px-3 py-1 rounded bg-cyan-800 hover:bg-cyan-700 text-white flex items-center gap-1.5">{playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{playing ? 'Pause preview' : 'Cycle preview'}</button>
          <button onClick={() => setFrameIndex(index => (index + 1) % 3)} className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"><SkipForward className="w-4 h-4" /></button>
          <span className="font-mono text-cyan-300">frame {frameIndex + 1}/3</span>
          <select value={previewDelay} onChange={event => setPreviewDelay(Number(event.target.value))} className="ml-auto bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-300">
            <option value={100}>100 ms UI preview</option><option value={180}>180 ms UI preview</option><option value={250}>250 ms UI preview</option><option value={400}>400 ms UI preview</option>
          </select>
        </div>
        <div className="mt-1 text-[10px] text-zinc-500">Preview timing is deliberately editor-only. The original stream does not contain a millisecond duration; MFRAMEW receives its sleep count from the caller.</div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={exportFrame} disabled={!payload} className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-emerald-300 flex items-center gap-1.5"><Download className="w-4 h-4" />PNG · aligned frame</button>
          <button onClick={exportSheet} disabled={!report.previewPayloads} className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-emerald-300 flex items-center gap-1.5"><Download className="w-4 h-4" />PNG · 3-frame sheet</button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="font-semibold text-zinc-200">Current frame</div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
            <span className="text-zinc-500">descriptor</span><span>{frame.descriptorSymbol}</span>
            <span className="text-zinc-500">dimensions</span><span>{frame.width} × {frame.height}</span>
            <span className="text-zinc-500">origin</span><span>{frame.x}, {frame.y}</span>
            <span className="text-zinc-500">GRA offset</span><span>{frame.graOffsetHex}</span>
            <span className="text-zinc-500">checksum</span><span>{frame.decode.checksum}</span>
            <span className="text-zinc-500">opaque index range</span><span>{frame.decode.minOpaqueIndex}–{frame.decode.maxOpaqueIndex}</span>
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="font-semibold text-zinc-200">Stream events</div>
          <div className="mt-2 flex flex-wrap gap-1.5">{target.events.map((event, index) => <span key={`${event.streamPhysical}-${index}`} className={`px-2 py-1 rounded border font-mono text-[10px] ${event.kind === 'frame' ? 'border-cyan-800 text-cyan-300' : event.kind === 'callback' ? 'border-fuchsia-800 text-fuchsia-300' : event.kind === 'end' ? 'border-zinc-700 text-zinc-400' : 'border-amber-800 text-amber-300'}`}>{eventLabel(event)}</span>)}</div>
          {target.events.some(event => event.kind === 'adjust-xy') && <div className="mt-2 text-amber-300">This fixture contains an explicit positioning command before palette restoration; Goro currently resolves to <code>ADJUST_XY(0, -11)</code>.</div>}
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="font-semibold text-zinc-200">Transition palette · {target.transitionPalette.symbol}</div>
          <div className="mt-2 flex flex-wrap gap-1">{target.transitionPalette.rgbHex.map((hex, index) => <div key={`${hex}-${index}`} title={`${index + 1}: ${target.transitionPalette.colorWords15Hex[index]} · ${hex}`} className="w-5 h-5 rounded-sm border border-zinc-700" style={{ backgroundColor: hex }} />)}</div>
          <div className="mt-2 text-zinc-500">All three frames fit this 23-colour palette with zero opaque index-0 pixels and zero out-of-range indices. That makes this fixture suitable for deterministic canvas reconstruction without an unresolved index-0 fallback.</div>
        </div>

        <div className="rounded border border-emerald-900 bg-emerald-950/20 p-3">
          <div className="font-semibold text-emerald-300">Compiler boundary retained</div>
          <div className="mt-1 text-zinc-400">We can now decode and export these animation frames as aligned PNG assets from the recovered structure. We have not yet generalized multi-part frame records or enabled write-back, so this panel does not pretend that animation editing is solved.</div>
        </div>
      </div>
    </div>
  </section>;
}

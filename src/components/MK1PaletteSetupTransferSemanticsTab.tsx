import React from 'react';
import { AlertTriangle, Cpu, Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { createMK1PaletteSetupTransferSemanticsExport } from '../games/mk1/research/paletteSetupTransferSemantics';
import { MK1PaletteSetupTransferSemanticsReport } from '../games/mk1/research/paletteSetupTransferSemanticsTypes';

interface Props {
  source: DirectorySource;
  report: MK1PaletteSetupTransferSemanticsReport | null;
  isRunning: boolean;
  error: string | null;
  onRun: () => void;
}

function downloadJson(report: MK1PaletteSetupTransferSemanticsReport) {
  const data = createMK1PaletteSetupTransferSemanticsExport(report);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `mk1_palette_setup_transfer_semantics_${stamp}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function MK1PaletteSetupTransferSemanticsTab({ source, report, isRunning, error, onRun }: Props) {
  const q = report?.paletteTransferQueue ?? null;
  const a = report?.paletteRamAllocator ?? null;
  const t = report?.transferHardware ?? null;
  const r = report?.rendererPaletteShiftBridge ?? null;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
      <div>
        <div className="flex items-center gap-2"><Cpu className="w-5 h-5 text-orange-400" /><h3 className="font-bold text-zinc-100">Palette Setup / Transfer Semantics</h3><span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800 text-xs font-mono">Pass 1E.3G</span></div>
        <p className="text-xs text-zinc-400 mt-1 max-w-3xl">Follows the verified GETPAL → PALSET boundary through the transfer queue, dynamic hardware-index allocation, index-0 IRQ color path, DAC writes, and the renderer palette-shift bridge. Full rasterizer internals remain deliberately out of scope.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onRun} disabled={isRunning} className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 ${isRunning ? 'bg-zinc-800 text-zinc-500' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}><RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />{isRunning ? 'Tracing...' : report ? 'Re-run 1E.3G' : 'Run 1E.3G'}</button>
        {report && !source.isSynthetic && <button onClick={() => downloadJson(report)} className="px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-orange-900 text-orange-300"><Download className="w-4 h-4" />Export JSON</button>}
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs font-mono flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

    {report && <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Transfer ring</div><div className="mt-1 font-mono text-orange-300 font-bold">{q ? `${q.capacity} × ${q.entryStride} B` : 'UNRESOLVED'}</div><div className="text-[10px] text-zinc-500">pointer / start / count</div></div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Palette handles</div><div className="mt-1 font-mono text-orange-300 font-bold">{a ? `${a.entryCount} slots` : 'UNRESOLVED'}</div><div className="text-[10px] text-zinc-500">dynamic ranges start at {a?.initialHardwareStartIndex ?? '?'}</div></div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Hardware transfer</div><div className="mt-1 font-mono text-orange-300 font-bold">{t ? `${t.dacIndexPortHex} / ${t.dacDataPortHex}` : 'UNRESOLVED'}</div><div className="text-[10px] text-zinc-500">index / data ports</div></div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Index 0</div><div className="mt-1 font-mono text-orange-300 font-bold">{t?.irqColorStateSymbol?.name ?? 'UNRESOLVED'}</div><div className="text-[10px] text-zinc-500">low 15 bits, latch {t?.transferLatchMaskHex ?? '?'}</div></div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Renderer bridge</div><div className="mt-1 font-mono text-orange-300 font-bold">{r?.wrtNonZeroFunction?.name ?? 'UNRESOLVED'}</div><div className="text-[10px] text-zinc-500">shift via {r?.tupleTableSymbol?.name ?? 'Tuple table'}</div></div>
      </div>

      {q && a && <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-emerald-400" /><h4 className="font-semibold text-sm">Verified queued palette allocation path</h4></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div><span className="text-zinc-500">PALL ring:</span> {q.queueStartHex}..{q.queueEndExclusiveHex}</div>
          <div><span className="text-zinc-500">Read / write ptr:</span> {q.consumerPointerAddressHex} / {q.producerPointerAddressHex}</div>
          <div><span className="text-zinc-500">Changed flag:</span> {q.changedFlagSymbol?.name ?? '?'} {q.changedFlagAddressHex}</div>
          <div><span className="text-zinc-500">PALRAM:</span> {a.palRamBaseHex}, {a.entryCount} × {a.entryStride}</div>
          <div><span className="text-zinc-500">PALRAM fields:</span> ptr +0, refs +{a.fields.referenceCountOffset}, start +{a.fields.hardwareStartIndexOffset}</div>
          <div><span className="text-zinc-500">Index zero:</span> reserved by allocator = {String(a.reservesIndexZero)}</div>
        </div>
      </div>}

      {t && <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <h4 className="font-semibold text-sm mb-3">Hardware-facing transfer</h4>
        <div className="text-xs font-mono grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><span className="text-zinc-500">Routine:</span> {t.transferFunction.name}</div>
          <div><span className="text-zinc-500">Status poll:</span> {t.statusPortHex} & {t.statusBitMaskHex}</div>
          <div><span className="text-zinc-500">DAC ports:</span> {t.dacIndexPortHex} → {t.dacDataPortHex}</div>
          <div><span className="text-zinc-500">Index 0:</span> {t.specialIndexZeroWrite ? 'separate IRQ color path' : 'unresolved'}</div>
        </div>
        <div className="mt-3 text-xs text-zinc-400 font-mono">15-bit → 6-bit channels: {t.colorWordConversion.first.expression} · {t.colorWordConversion.second.expression} · {t.colorWordConversion.third.expression}</div>
      </div>}

      {r && <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <h4 className="font-semibold text-sm mb-3">Renderer palette shift bridge</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div><span className="text-zinc-500">Containing function:</span> {r.containingFunction?.name ?? '?'}</div>
          <div><span className="text-zinc-500">Shift:</span> startIndex − 1</div>
          <div><span className="text-zinc-500">Dispatch table:</span> {r.dispatchTableOffsetHex}</div>
          <div><span className="text-zinc-500">Tuple table:</span> {r.tupleTableSymbol?.name ?? '?'} {r.tupleTableOffsetHex}</div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">The unflagged renderer path resolves the palette handle to its hardware start index, subtracts one, masks to a byte, and dispatches with that value intact. The discovered non-zero renderer path consumes it through the 256-entry repeated-byte tuple table and adds the shift to literal source-byte values.</p>
      </div>}

      <div className={`p-4 rounded-xl border text-sm ${report.status === 'SUCCESS' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' : 'bg-amber-950/30 border-amber-800 text-amber-200'}`}><div className="font-bold font-mono">{report.decision.verdict}</div><div className="text-xs mt-1">{report.decision.narrative}</div></div>
    </>}
  </div>;
}

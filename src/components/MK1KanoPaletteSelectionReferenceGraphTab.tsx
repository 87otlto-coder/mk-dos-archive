import React from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  createMK1KanoPaletteSelectionReferenceGraphExport,
} from '../games/mk1/research/kanoPaletteSelectionReferenceGraph';
import { MK1KanoPaletteSelectionReferenceGraphReport } from '../games/mk1/research/kanoPaletteSelectionReferenceGraphTypes';
import { AlertTriangle, Download, GitBranch, RefreshCw, ShieldCheck } from 'lucide-react';

interface Props {
  source: DirectorySource;
  report: MK1KanoPaletteSelectionReferenceGraphReport | null;
  isRunning: boolean;
  error: string | null;
  onRun: () => void;
}

export function MK1KanoPaletteSelectionReferenceGraphTab({ source, report, isRunning, error, onRun }: Props) {
  const isReal = !source.isSynthetic;
  const exportJson = () => {
    if (!report) return;
    try {
      const data = createMK1KanoPaletteSelectionReferenceGraphExport(report);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mk1_kano_palette_selection_reference_graph_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e: unknown) {
      alert(`Authoritative export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const pair = report?.pairedPaletteTableRelationship ?? null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-zinc-100">Kano Palette Selection Reference Graph</h3>
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono">Pass 1E.3E</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Starts from verified KANO_P/KANO3_P records, discovers the static-data symbols that contain their exact offsets, then tests whether paired table bases are used by indexed x86 operand shapes. The gameplay trigger remains deliberately unresolved.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRun} disabled={isRunning} className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 ${isRunning ? 'bg-zinc-800 text-zinc-500' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />{isRunning ? 'Tracing...' : report ? 'Re-run 1E.3E' : 'Run 1E.3E'}
          </button>
          {report && isReal && <button onClick={exportJson} className="px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-cyan-900 text-cyan-300"><Download className="w-4 h-4" />Export JSON</button>}
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs font-mono flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      {report && <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Ground truth</div><div className="mt-1 font-mono text-emerald-300 font-bold">{report.prerequisite.validationPassed ? 'VERIFIED' : 'FAILED'}</div></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Palette tables</div><div className="mt-1 font-mono text-sm font-bold text-cyan-300">{pair?.classification ?? 'UNRESOLVED'}</div></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Kano slot</div><div className="mt-1 font-mono text-sm font-bold text-cyan-300">{pair?.kanoSlotIndex ?? 'N/A'}</div></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Shared indexed clusters</div><div className="mt-1 font-mono text-sm font-bold text-cyan-300">{report.indexedTablePairClusters.filter(c => c.classification === 'VERIFIED_SHARED_INDEX_TABLE_CLUSTER').length}</div></div>
        </div>

        {pair && <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-emerald-400" /><h4 className="font-semibold text-sm">Mechanically paired palette tables</h4></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono mb-4">
            <div><span className="text-zinc-500">Table A:</span> {pair.tableA} ({`0x${pair.tableAWatcomOffset.toString(16).toUpperCase()}`})</div>
            <div><span className="text-zinc-500">Table B:</span> {pair.tableB} ({`0x${pair.tableBWatcomOffset.toString(16).toUpperCase()}`})</div>
            <div><span className="text-zinc-500">Slots:</span> {pair.dwordCount} / Kano slot {pair.kanoSlotIndex ?? 'N/A'}</div>
          </div>
          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full text-xs font-mono"><thead className="bg-zinc-950 text-zinc-500"><tr><th className="p-2 text-left">Slot</th><th className="p-2 text-left">{pair.tableA}</th><th className="p-2 text-left">{pair.tableB}</th></tr></thead><tbody className="divide-y divide-zinc-800">{pair.correspondingSlotPairs.map(row => <tr key={row.slotIndex} className={row.slotIndex === pair.kanoSlotIndex ? 'bg-cyan-950/30' : ''}><td className="p-2">{row.slotIndex}</td><td className="p-2">{row.tableASymbolNames.join(', ') || 'unresolved'}</td><td className="p-2">{row.tableBSymbolNames.join(', ') || 'unresolved'}</td></tr>)}</tbody></table>
          </div>
        </div>}

        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
          <h4 className="font-semibold text-sm mb-3">Executable table-base references</h4>
          <div className="overflow-x-auto rounded border border-zinc-800"><table className="w-full text-xs font-mono"><thead className="bg-zinc-950 text-zinc-500"><tr><th className="p-2 text-left">Table</th><th className="p-2 text-left">Physical</th><th className="p-2 text-left">Shape</th><th className="p-2 text-left">Index</th><th className="p-2 text-left">LE Obj</th></tr></thead><tbody className="divide-y divide-zinc-800">{report.tableCodeReferenceSites.map((s,i)=><tr key={`${s.tableSymbolName}-${s.physicalFileOffset}-${i}`}><td className="p-2">{s.tableSymbolName}</td><td className="p-2 text-amber-300">{s.physicalFileOffsetHex}</td><td className="p-2">{s.decodedShape ?? s.classification}</td><td className="p-2">{s.indexRegister ?? '—'}</td><td className="p-2">{s.mappedLeObjectNumber ?? '—'}</td></tr>)}</tbody></table></div>
        </div>

        <div className={`p-4 rounded-xl border text-sm ${report.status === 'SUCCESS' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' : 'bg-amber-950/30 border-amber-800 text-amber-200'}`}>
          <div className="font-bold font-mono">{report.decision.verdict}</div><div className="text-xs mt-1">{report.decision.narrative}</div>
        </div>
      </>}
    </div>
  );
}

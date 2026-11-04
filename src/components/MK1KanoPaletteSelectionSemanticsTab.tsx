import React from 'react';
import { Download, RefreshCw, ShieldCheck, AlertTriangle, GitMerge, Repeat2 } from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  createMK1KanoPaletteSelectionSemanticsExport,
} from '../games/mk1/research/kanoPaletteSelectionSemantics';
import { MK1KanoPaletteSelectionSemanticsReport } from '../games/mk1/research/kanoPaletteSelectionSemanticsTypes';

interface Props {
  source: DirectorySource;
  report: MK1KanoPaletteSelectionSemanticsReport | null;
  isRunning: boolean;
  error: string | null;
  onRun: () => void;
}

function downloadJson(report: MK1KanoPaletteSelectionSemanticsReport) {
  const data = createMK1KanoPaletteSelectionSemanticsExport(report);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `mk1_kano_palette_selection_semantics_${stamp}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function MK1KanoPaletteSelectionSemanticsTab({ source, report, isRunning, error, onRun }: Props) {
  const isReal = !source.isSynthetic;
  const machine = report?.selectionStateMachine ?? null;
  const rebind = report?.commonPaletteRebind ?? null;
  const getPal = report?.getPalEvidence ?? null;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-violet-400" />
            <h3 className="font-bold text-zinc-100">Kano Palette Selection Semantics</h3>
            <span className="px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800 text-xs font-mono">Pass 1E.3F</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Qualifies the local Segment-1 code file-image coordinate system, reconstructs the equal/unequal character palette-switch state machine, and follows the common call through palette-handle release/acquire mechanics. Hardware transfer and index-0 semantics remain out of scope.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRun} disabled={isRunning} className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 ${isRunning ? 'bg-zinc-800 text-zinc-500' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />{isRunning ? 'Tracing...' : report ? 'Re-run 1E.3F' : 'Run 1E.3F'}
          </button>
          {report && isReal && <button onClick={() => downloadJson(report)} className="px-4 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-violet-900 text-violet-300"><Download className="w-4 h-4" />Export JSON</button>}
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs font-mono flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}

      {report && <>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Code image base</div><div className="mt-1 font-mono text-emerald-300 font-bold">{report.codeImageBaseQualification.qualifiedBaseHex ?? 'UNRESOLVED'}</div><div className="text-[10px] text-zinc-500">{report.codeImageBaseQualification.agreeingAnchorCount} agreeing anchors</div></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Selector function</div><div className="mt-1 font-mono text-sm font-bold text-violet-300">{machine?.containingFunction?.name ?? 'UNRESOLVED'}</div></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Common routine</div><div className="mt-1 font-mono text-sm font-bold text-violet-300">{rebind?.function.name ?? 'UNRESOLVED'}</div></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Release / acquire</div><div className="mt-1 font-mono text-sm font-bold text-violet-300">{rebind ? `${rebind.freeFunction?.name ?? '?'} / ${rebind.getFunction?.name ?? '?'}` : 'UNRESOLVED'}</div></div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] uppercase text-zinc-500">Palette setup</div><div className="mt-1 font-mono text-sm font-bold text-violet-300">{getPal?.palsetFunction?.name ?? 'UNRESOLVED'}</div></div>
        </div>

        {machine && <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-emerald-400" /><h4 className="font-semibold text-sm">Verified character-equality palette latch</h4></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono mb-4">
            <div><span className="text-zinc-500">A11:</span> {report.selectorStateSymbols.a11?.name ?? '?'} {machine.a11OffsetHex}</div>
            <div><span className="text-zinc-500">P1:</span> {report.selectorStateSymbols.p1Char?.name ?? '?'} {machine.p1CharOffsetHex}</div>
            <div><span className="text-zinc-500">P2:</span> {report.selectorStateSymbols.p2Char?.name ?? '?'} {machine.p2CharOffsetHex}</div>
            <div><span className="text-zinc-500">Table index:</span> [EDI+{machine.tableIndexObjectFieldOffsetHex}]</div>
          </div>
          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full text-xs font-mono"><thead className="bg-zinc-950 text-zinc-500"><tr><th className="p-2 text-left">Current latch</th><th className="p-2 text-left">P1/P2</th><th className="p-2 text-left">Action</th><th className="p-2 text-left">Result</th></tr></thead><tbody className="divide-y divide-zinc-800">{machine.transitions.map((t,i)=><tr key={i}><td className="p-2">{t.currentAlternateLatch}</td><td className="p-2">{t.characterRelation}</td><td className="p-2 text-violet-300">{t.action}</td><td className="p-2">{t.resultingAlternateLatch}</td></tr>)}</tbody></table>
          </div>
        </div>}

        {rebind && <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-2 mb-3"><Repeat2 className="w-4 h-4 text-cyan-400" /><h4 className="font-semibold text-sm">Common palette rebinding path</h4></div>
          <div className="text-xs font-mono grid grid-cols-1 md:grid-cols-4 gap-3">
            <div><span className="text-zinc-500">Routine:</span> {rebind.function.name}</div>
            <div><span className="text-zinc-500">Next object:</span> +{rebind.linkedListNextFieldOffsetHex}</div>
            <div><span className="text-zinc-500">Palette handle:</span> +{rebind.paletteHandleFieldOffsetHex}</div>
            <div><span className="text-zinc-500">Acquire record:</span> {getPal?.classification ?? 'UNRESOLVED'}</div>
          </div>
          <p className="mt-3 text-xs text-zinc-400">The routine traverses the EDI-linked object list, releases each old palette handle, obtains a handle for the selected palette record, and stores the replacement handle back into the same object field.</p>
        </div>}

        <div className={`p-4 rounded-xl border text-sm ${report.status === 'SUCCESS' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' : 'bg-amber-950/30 border-amber-800 text-amber-200'}`}>
          <div className="font-bold font-mono">{report.decision.verdict}</div><div className="text-xs mt-1">{report.decision.narrative}</div>
        </div>
      </>}
    </div>
  );
}

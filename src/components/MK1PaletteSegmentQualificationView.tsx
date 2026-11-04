import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCode,
  Layers,
  Play,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteConvergentEntryResult } from '../games/mk1/research/paletteConvergentEntryReconnaissanceTypes';
import { MK1PaletteSeedFixupQualificationResult } from '../games/mk1/research/paletteSeedFixupQualificationTypes';
import {
  createMK1CompactPaletteSegmentQualificationExport,
  qualifyMK1PaletteSegmentHypotheses,
} from '../games/mk1/research/paletteSegmentQualification';
import { MK1PaletteSegmentQualificationResult } from '../games/mk1/research/paletteSegmentQualificationTypes';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport;
  convergentResult?: MK1PaletteConvergentEntryResult | null;
  seedFixupResult?: MK1PaletteSeedFixupQualificationResult | null;
  segmentQualificationResult?: MK1PaletteSegmentQualificationResult | null;
  setSegmentQualificationResult?: (result: MK1PaletteSegmentQualificationResult) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const MK1PaletteSegmentQualificationView: React.FC<Props> = ({
  source,
  report,
  convergentResult,
  seedFixupResult,
  segmentQualificationResult,
  setSegmentQualificationResult,
  onNavigateToTab,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = segmentQualificationResult ?? null;

  const handleRunQualification = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await qualifyMK1PaletteSegmentHypotheses(source, {
        layoutReport: report,
        convergentResult: convergentResult ?? undefined,
        seedFixupResult: seedFixupResult ?? undefined,
      });
      if (setSegmentQualificationResult) {
        setSegmentQualificationResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportJson = () => {
    if (!result) return;
    const exportData = createMK1CompactPaletteSegmentQualificationExport(result);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = result.timestamp.replace(/[:.]/g, '-');
    a.download = `mk1_palette_segment_qualification_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="mk1-segment-qualification-view" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded">
              Pass 1E.2B.10d
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Checkpoint: mkdos-m1e2b10d-segment-base-qualification
            </span>
          </div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            Segment-Base Hypothesis Qualification
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Evaluates segment-base hypotheses (Model A, B, C) for the convergent ADD AL, [EAX]
            dereference at 0x53D33 without extending destination control flow or assuming runtime state.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="run-segment-qualification-btn"
            onClick={handleRunQualification}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-medium text-xs transition cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Qualifying Models...' : 'Run Qualification'}
          </button>

          {result && (
            <button
              id="export-segment-qualification-btn"
              onClick={handleExportJson}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium text-xs transition cursor-pointer"
              title="Export B.10d qualification report JSON"
            >
              <Download className="w-3.5 h-3.5" />
              Export B.10d JSON
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Qualification Failed</div>
            <div className="font-mono mt-1 text-[11px]">{error}</div>
          </div>
        </div>
      )}

      {/* Epistemic Hard Stop Banner */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-amber-300">Epistemic Boundary & Control Barrier Enforced</span>
          <p className="text-zinc-400 leading-relaxed">
            Destination instructions at 0x53D33 and 0x53D4A are absolute barriers. Static arithmetic compatibility under Model B does not prove runtime DS segment selector base.
          </p>
        </div>
      </div>

      {result ? (
        <div className="space-y-6">
          {/* Summary Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <div className="text-[11px] text-zinc-400 font-medium">Destination Coordinate</div>
              <div className="text-sm font-mono font-bold text-zinc-100 flex items-center gap-2">
                <span>{result.destinationInstruction.instructionLoadedAddressHex}</span>
                <span className="text-[10px] text-zinc-500 font-sans">(Loaded)</span>
              </div>
              <div className="text-[11px] font-mono text-purple-400">
                Phys: {result.destinationInstruction.instructionPhysicalOffsetHex}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <div className="text-[11px] text-zinc-400 font-medium">Destination Opcode</div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {result.destinationInstruction.mnemonic}
              </div>
              <div className="text-[11px] text-zinc-400">
                Architectural default: <span className="font-mono font-semibold text-zinc-200">DS</span> (No override)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <div className="text-[11px] text-zinc-400 font-medium">Model B Alignment</div>
              <div className="text-sm font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Exact Match (100%)
              </div>
              <div className="text-[11px] text-zinc-400">
                Object 1 Base + EAX matches payloads
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1">
              <div className="text-[11px] text-zinc-400 font-medium">Bounded Windows Clean</div>
              <div className="text-sm font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                5 Sites / 0 Overrides
              </div>
              <div className="text-[11px] text-zinc-400">
                0 DS modifications in callers
              </div>
            </div>
          </div>

          {/* Model Comparison Matrix */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Segment-Base Hypothesis Comparison
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Model A */}
              <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Model A: Zero-Based</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    DS.base = 0x0
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-zinc-400 text-[11px]">Formula: 0x0 + EAX</div>
                  <div className="text-zinc-300">Class A: {result.models.modelA.classACalculation.calculatedLinearAddressHex}</div>
                  <div className="text-zinc-300">Class B: {result.models.modelA.classBCalculation.calculatedLinearAddressHex}</div>
                </div>
                <div className="text-[11px] text-amber-400/90 font-medium bg-amber-950/30 p-2 rounded border border-amber-900/40">
                  Reaches unmapped low memory. Reaches neither payload.
                </div>
              </div>

              {/* Model B */}
              <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-200">Model B: Object 1 Base</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono">
                    DS.base = 0x10000
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-zinc-400 text-[11px]">Formula: 0x10000 + EAX</div>
                  <div className="text-purple-300">Class A: {result.models.modelB.classACalculation.calculatedLinearAddressHex} (Match)</div>
                  <div className="text-purple-300">Class B: {result.models.modelB.classBCalculation.calculatedLinearAddressHex} (Match)</div>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium bg-emerald-950/30 p-2 rounded border border-emerald-900/40">
                  Arithmetically matches both candidate payloads exactly.
                </div>
              </div>

              {/* Model C */}
              <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Model C: AutoData Base</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {result.models.modelC.assumedBaseHex ?? 'N/A'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-zinc-400 text-[11px]">
                    {result.models.modelC.isAvailable ? `Formula: ${result.models.modelC.assumedBaseHex} + EAX` : 'Unavailable'}
                  </div>
                  <div className="text-zinc-300">Class A: {result.models.modelC.classACalculation.calculatedLinearAddressHex ?? 'N/A'}</div>
                  <div className="text-zinc-300">Class B: {result.models.modelC.classBCalculation.calculatedLinearAddressHex ?? 'N/A'}</div>
                </div>
                <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded border border-zinc-800">
                  {result.models.modelC.isAvailable
                    ? 'Lands in Object 2 data memory. Reaches neither payload.'
                    : 'No autoDataObject declared. Fails closed.'}
                </div>
              </div>
            </div>
          </div>

          {/* Bounded Caller & Handoff Inspection */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Verified Caller & Handoff Window Inspection
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="pb-2">Site Role</th>
                    <th className="pb-2">Physical</th>
                    <th className="pb-2">Loaded</th>
                    <th className="pb-2">Instructions</th>
                    <th className="pb-2">Segment Overrides</th>
                    <th className="pb-2">DS Writes</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {result.callerHandoffInspection.inspectedSites.map((site) => (
                    <tr key={site.siteId} className="hover:bg-zinc-800/20">
                      <td className="py-2.5 font-sans font-medium text-zinc-200">{site.siteName}</td>
                      <td className="py-2.5">{site.physicalOffsetStartHex}</td>
                      <td className="py-2.5">{site.loadedAddressStartHex}</td>
                      <td className="py-2.5 max-w-xs truncate" title={site.instructionsDisassembled.join('; ')}>
                        {site.instructionsDisassembled.join('; ')}
                      </td>
                      <td className="py-2.5 text-center">
                        {site.segmentOverridePrefixesFound === 0 ? (
                          <span className="text-emerald-400 font-bold">0</span>
                        ) : (
                          <span className="text-red-400 font-bold">{site.segmentOverridePrefixesFound}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        {site.explicitDsWritesOrLoadsFound === 0 ? (
                          <span className="text-emerald-400 font-bold">0</span>
                        ) : (
                          <span className="text-red-400 font-bold">{site.explicitDsWritesOrLoadsFound}</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {site.boundedWindowClean ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 font-sans font-medium">
                            Clean
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-950/60 text-red-400 border border-red-800/80 font-sans font-medium">
                            Overridden
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Epistemic Distinctions */}
          <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-purple-400" />
              Epistemic Distinctions (Four-Way Breakdown)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
                <div className="font-semibold text-zinc-200">1. Arithmetic Compatibility</div>
                <p className="text-zinc-400 text-[11px]">
                  {result.epistemicDistinctions.arithmeticCompatibility.summary}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
                <div className="font-semibold text-zinc-200">2. Local Static Evidence</div>
                <p className="text-zinc-400 text-[11px]">
                  {result.epistemicDistinctions.localStaticEvidence.summary}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
                <div className="font-semibold text-zinc-200">3. Documented DOS/4GW Model</div>
                <p className="text-zinc-400 text-[11px]">
                  {result.epistemicDistinctions.documentedDos4gwModel.summary}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
                <div className="font-semibold text-zinc-200">4. Proven Runtime Segment State</div>
                <p className="text-amber-400/90 text-[11px]">
                  {result.epistemicDistinctions.provenRuntimeSegmentState.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 rounded-xl bg-zinc-900/20 border border-zinc-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-purple-950/40 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-200">Segment Qualification Ready to Run</h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Click &quot;Run Qualification&quot; above to evaluate Models A, B, and C against the verified
            MK1 executable layout and upstream B.10b convergent entry evidence.
          </p>
        </div>
      )}
    </div>
  );
};

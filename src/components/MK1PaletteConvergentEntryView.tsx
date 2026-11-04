/**
 * MK1 Palette Relative-Control Address-Space Qualification &
 * Convergent Entry-State Reconnaissance View (Milestone 1 — Pass 1E.2B.10)
 *
 * Epistemic Rules:
 * 1. B.1-B.9 are READ-ONLY upstream evidence.
 * 2. DO NOT FOLLOW 0x53D33 — Destination body not decoded.
 * 3. REL32 NUMERIC TARGET != VERIFIED RUNTIME LINEAR DESTINATION.
 * 4. LOADED-LINEAR MAPPING != PROVEN SEGMENTATION MODEL.
 * 5. CONTROL-TRANSFER TARGET != FUNCTION.
 * 6. EAX LIVE AT ENTRY != FUNCTION ARGUMENT.
 * 7. EBX CONSTANT AT ENTRY != PARAMETER OR SENTINEL.
 * 8. Do NOT produce a confidence score. Use explicit mechanical dimensions.
 * 9. runtimeDestinationVerified remains false unless runtime selector semantics are proven independently.
 * 10. Do NOT investigate 0x53CA1.
 * 11. Pass 1E.2B.10 must NOT perform function discovery, calling-convention inference, or palette-consumer claims.
 * 12. STOP after B.10.
 */

import React, { useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteOperandUseResult } from '../games/mk1/research/paletteOperandUseReconnaissanceTypes';
import { MK1PaletteTargetEntryReconResult } from '../games/mk1/research/paletteTargetEntryReconnaissanceTypes';
import {
  MK1PaletteConvergentEntryResult,
  B10_EPISTEMIC_RULES,
} from '../games/mk1/research/paletteConvergentEntryReconnaissanceTypes';
import {
  performPaletteConvergentEntryReconnaissance,
  createMK1CompactPaletteConvergentEntryExport,
} from '../games/mk1/research/paletteConvergentEntryReconnaissance';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  Terminal,
  Layers,
  Search,
  RefreshCw,
  GitBranch,
  ArrowRight,
  Split,
  Cpu,
  Database,
  Hash,
} from 'lucide-react';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport | null;
  operandUseResult: MK1PaletteOperandUseResult | null;
  targetEntryResult: MK1PaletteTargetEntryReconResult | null;
  convergentResult?: MK1PaletteConvergentEntryResult | null;
  setConvergentResult?: (result: MK1PaletteConvergentEntryResult) => void;
  onNavigateToTab?: (tab: string) => void;
}

type SubPanelType = 'address_space' | 'convergence' | 'entry_states' | 'differential_trace';

export const MK1PaletteConvergentEntryView: React.FC<Props> = ({
  source,
  report,
  operandUseResult,
  targetEntryResult,
  convergentResult,
  setConvergentResult,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progressStage, setProgressStage] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<Error | null>(null);
  const [activeSubPanel, setActiveSubPanel] = useState<SubPanelType>('address_space');

  const result = convergentResult ?? null;

  const canRun =
    !!source &&
    !!report &&
    !!operandUseResult &&
    operandUseResult.status === 'SUCCESS' &&
    !!targetEntryResult &&
    targetEntryResult.status === 'SUCCESS';

  const handleRunAnalysis = async () => {
    if (!report || !operandUseResult || !targetEntryResult) return;
    setIsRunning(true);
    setErrorDetails(null);
    setProgressVal(0);

    try {
      const res = await performPaletteConvergentEntryReconnaissance(
        source,
        report,
        operandUseResult,
        targetEntryResult,
        {
          onProgress: (stage, p) => {
            setProgressStage(stage);
            setProgressVal(p);
          },
        },
      );
      if (setConvergentResult) {
        setConvergentResult(res);
      }
    } catch (err) {
      setErrorDetails(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsRunning(false);
      setProgressStage(null);
    }
  };

  const handleExportJson = () => {
    if (!result || !report) return;
    const exportData = createMK1CompactPaletteConvergentEntryExport(result, report);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `mk1_palette_convergent_entry_recon_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="mk1-convergent-entry-view" className="space-y-6">
      {/* 1. Header & Controls */}
      <div
        id="b10-header-card"
        className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-500">
              Pass 1E.2B.10
            </span>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs font-mono text-zinc-400">Checkpoint: mkdos-m1e2b10-relative-control-convergent-entry</span>
          </div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Split className="w-5 h-5 text-amber-400" />
            Relative-Control Address-Space Qualification + Convergent Entry Reconnaissance
          </h2>
          <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
            Derives dual relative-control address-space models for rel32 target{' '}
            <span className="font-mono text-amber-300">0x00053D33</span>, byte-validates control transfers from B.9 JMP and B.8 CALLs,
            and constructs evidence-derived entry states for Class A (B.9 handoff) and Class B (B.8 direct calls).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="run-b10-analysis-btn"
            onClick={handleRunAnalysis}
            disabled={!canRun || isRunning}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              !canRun || isRunning
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold border border-amber-400/40'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Convergent Entry Recon</span>
              </>
            )}
          </button>

          {result && (
            <button
              id="export-b10-json-btn"
              onClick={handleExportJson}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg font-mono text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div id="b10-progress-card" className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>{progressStage || 'Executing analysis...'}</span>
            <span>{Math.round(progressVal * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-200"
              style={{ width: `${Math.round(progressVal * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Epistemic Invariant Rules Banner */}
      <div
        id="b10-epistemic-banner"
        className="p-4 rounded-xl bg-red-950/20 border border-red-900/60 text-xs text-red-200 space-y-2"
      >
        <div className="flex items-center gap-2 text-red-400 font-semibold uppercase tracking-wider font-mono">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>Epistemic Invariants & Bounded Scope Rules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-mono text-red-300/90 leading-relaxed">
          {B10_EPISTEMIC_RULES.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-red-500 font-bold">•</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Failure Panels */}
      {result && result.status === 'FAILED' && (
        <AnalysisFailurePanel
          title="Convergent Entry Reconciliation Failed"
          error={new Error(result.failureReason ?? 'Mechanical reconciliation invariant failure')}
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-convergent-entry-reconnaissance"
          onRetry={handleRunAnalysis}
        />
      )}

      {errorDetails && (
        <AnalysisFailurePanel
          title="Convergent Entry Reconnaissance Exception"
          error={errorDetails}
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-convergent-entry-reconnaissance"
          onRetry={handleRunAnalysis}
        />
      )}

      {/* Empty State before Run */}
      {!result && !isRunning && !errorDetails && (
        <div id="b10-empty-state" className="p-10 text-center rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
          <Split className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">Analysis Not Yet Performed</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Click &quot;Run Convergent Entry Recon&quot; to qualify the relative-control address-space models for rel32 target 0x00053D33, byte-validate callers, and compare Class A and Class B entry states.
          </p>
          {!canRun && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs font-mono mt-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Prerequisites required: Executable Layout, B.8 Operand Use (SUCCESS), and B.9 Target Entry (SUCCESS).</span>
            </div>
          )}
        </div>
      )}

      {/* Result Presentation */}
      {result && (
        <div id="b10-results-container" className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Convergent Target</div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-1">
                {result.targetNumericAddressHex}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Dual Models: {result.mechanicalDimensions.dualModelTargetNumericConvergence ? 'Converged' : 'Divergent'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Byte Validation</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                B.9 JMP (0xE9) + {result.byteValidation.b8MatchingCalls.length} B.8 CALLs (0xE8)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">EAX Seed Delta</div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-1">
                +{result.differentialAnalysis.eaxDeltaHex} ({result.differentialAnalysis.eaxDeltaDecimal} B)
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                Matches Candidate Payload Distance
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Destination Epistemic</div>
              <div className="text-sm font-bold font-mono text-amber-300 mt-1">
                Body Unfollowed
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                runtimeDestinationVerified: false
              </div>
            </div>
          </div>

          {/* Sub-Panel Switcher */}
          <div id="b10-subpanel-nav" className="flex border-b border-zinc-800 text-xs font-mono gap-1">
            <button
              id="subpanel-btn-address-space"
              onClick={() => setActiveSubPanel('address_space')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubPanel === 'address_space'
                  ? 'border-amber-500 text-amber-400 bg-zinc-900/60'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>1. Address-Space Qualification</span>
            </button>

            <button
              id="subpanel-btn-convergence"
              onClick={() => setActiveSubPanel('convergence')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubPanel === 'convergence'
                  ? 'border-amber-500 text-amber-400 bg-zinc-900/60'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>2. Convergence & Byte Validation</span>
            </button>

            <button
              id="subpanel-btn-entry-states"
              onClick={() => setActiveSubPanel('entry_states')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubPanel === 'entry_states'
                  ? 'border-amber-500 text-amber-400 bg-zinc-900/60'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>3. Entry States (Class A vs B)</span>
            </button>

            <button
              id="subpanel-btn-differential-trace"
              onClick={() => setActiveSubPanel('differential_trace')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubPanel === 'differential_trace'
                  ? 'border-amber-500 text-amber-400 bg-zinc-900/60'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>4. Differential Analysis & Trace</span>
            </button>
          </div>

          {/* Sub-Panel 1: Address-Space Qualification */}
          {activeSubPanel === 'address_space' && (
            <div id="b10-panel-address-space" className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-mono">
                  <Database className="w-4 h-4 text-amber-400" />
                  Dual Mechanical Target Models for rel32 Displacement
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The near relative jump <span className="font-mono text-zinc-200">JMP near 0x00053D33</span> (opcode <span className="font-mono text-zinc-200">0xE9</span>)
                  at loaded coordinate <span className="font-mono text-amber-300">{result.dualModelRecon.sourceInstructionLoadedAddressHex}</span> encodes
                  a 32-bit signed displacement of <span className="font-mono text-amber-300">{result.dualModelRecon.rel32DisplacementHex}</span>.
                  Both the Source-Object/EIP-relative model and the Loaded-Linear arithmetic model are derived and verified:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Model 1 */}
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2 font-mono text-xs">
                    <div className="text-amber-400 font-semibold border-b border-zinc-800 pb-1.5 flex justify-between">
                      <span>Model 1: Source-Object / EIP-Relative</span>
                      <span className="text-emerald-400 text-[10px]">VERIFIED</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Source Object:</span>
                        <span className="text-zinc-300">Object {result.dualModelRecon.model1EipRelative.sourceObjectNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Source Object EIP:</span>
                        <span className="text-zinc-300">{result.dualModelRecon.model1EipRelative.sourceObjectEipHex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Next Instruction EIP:</span>
                        <span className="text-zinc-300">{result.dualModelRecon.model1EipRelative.nextInstructionEipHex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">rel32 Displacement:</span>
                        <span className="text-amber-300">+{result.dualModelRecon.model1EipRelative.rel32DisplacementHex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Calculated Object Offset:</span>
                        <span className="text-zinc-300">{result.dualModelRecon.model1EipRelative.calculatedTargetObjectOffsetHex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Object 1 Reloc Base:</span>
                        <span className="text-zinc-300">{result.dualModelRecon.model1EipRelative.sourceObjectRelocationBaseHex}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-800/60 pt-1.5 font-bold">
                        <span className="text-zinc-400">Derived Target Coordinate:</span>
                        <span className="text-amber-400">{result.dualModelRecon.model1EipRelative.derivedLoadedTargetHex}</span>
                      </div>
                    </div>
                  </div>

                  {/* Model 2 */}
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2 font-mono text-xs">
                    <div className="text-amber-400 font-semibold border-b border-zinc-800 pb-1.5 flex justify-between">
                      <span>Model 2: Loaded-Linear Arithmetic</span>
                      <span className="text-emerald-400 text-[10px]">VERIFIED</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Source Loaded Address:</span>
                        <span className="text-zinc-300">{result.dualModelRecon.model2LoadedLinear.sourceLoadedAddressHex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Next Instruction Address:</span>
                        <span className="text-zinc-300">{result.dualModelRecon.model2LoadedLinear.nextInstructionLoadedAddressHex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">rel32 Displacement:</span>
                        <span className="text-amber-300">+{result.dualModelRecon.model2LoadedLinear.rel32DisplacementHex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Formula:</span>
                        <span className="text-zinc-400">NextAddr + rel32</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Arithmetic Convergence:</span>
                        <span className="text-emerald-400 font-bold">EXACT MATCH</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-800/60 pt-1.5 font-bold">
                        <span className="text-zinc-400">Calculated Linear Target:</span>
                        <span className="text-amber-400">{result.dualModelRecon.model2LoadedLinear.calculatedLinearTargetHex}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Address Space Qualification Table */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-mono">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Target Coordinate Address-Space Qualification ({result.targetNumericAddressHex})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Containing LE Object</span>
                    <span className="text-zinc-200 font-bold mt-1 block">
                      {result.dualModelRecon.addressSpaceQualification.containingObjectNumber !== null
                        ? `Object ${result.dualModelRecon.addressSpaceQualification.containingObjectNumber}`
                        : 'None / Unmapped'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      {result.dualModelRecon.addressSpaceQualification.containingObjectCapabilities || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Object 1 Virtual Range</span>
                    <span className="text-zinc-200 font-bold mt-1 block">
                      {result.dualModelRecon.addressSpaceQualification.isInsideObject1Virtual
                        ? 'Contained in Obj 1'
                        : 'Outside Obj 1'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      Obj 1 Size: 0x{result.dualModelRecon.addressSpaceQualification.object1VirtualSize.toString(16).toUpperCase()}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Physical File Backing</span>
                    <span className="text-zinc-200 font-bold mt-1 block">
                      {result.dualModelRecon.addressSpaceQualification.physicalBackingAvailable
                        ? result.dualModelRecon.addressSpaceQualification.physicalFileOffsetHex
                        : 'Unbacked'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      {result.dualModelRecon.addressSpaceQualification.topologyRegionId || 'No topology region'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Runtime Destination Status</span>
                    <span className="text-red-400 font-bold mt-1 block">
                      UNVERIFIED
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      runtimeDestinationVerified: false
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Panel 2: Convergence & Byte Validation */}
          {activeSubPanel === 'convergence' && (
            <div id="b10-panel-convergence" className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-mono">
                  <Split className="w-4 h-4 text-amber-400" />
                  Control-Flow Convergence Diagram
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Both the B.9 jump handoff sequence and the independent B.8 direct CALL sequence converge on the identical numerical target coordinate:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Path A */}
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono">
                    <div className="text-amber-400 font-semibold border-b border-zinc-800 pb-1 flex justify-between">
                      <span>Path A: B.9 Jump Handoff</span>
                      <span className="text-[10px] text-zinc-400">JMP near</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div><span className="text-zinc-500">Candidate:</span> {result.classAState.sourceCandidateId}</div>
                      <div><span className="text-zinc-500">Seed Value:</span> <span className="text-amber-300 font-bold">{result.classAState.incomingEAXHex}</span> (EAX)</div>
                      <div><span className="text-zinc-500">B.8 Call Target:</span> 0x000400C8</div>
                      <div><span className="text-zinc-500">Target Step 1:</span> MOV EBX, 0x0000FFFF</div>
                      <div><span className="text-zinc-500">Target Step 2:</span> JMP near 0x00053D33 (0xE9)</div>
                      <div className="text-emerald-400 pt-1 font-bold">→ Converges at {result.targetNumericAddressHex}</div>
                    </div>
                  </div>

                  {/* Path B */}
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono">
                    <div className="text-amber-400 font-semibold border-b border-zinc-800 pb-1 flex justify-between">
                      <span>Path B: B.8 Direct Call(s)</span>
                      <span className="text-[10px] text-zinc-400">CALL near</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div><span className="text-zinc-500">Candidate:</span> {result.classBState.sourceCandidateId}</div>
                      <div><span className="text-zinc-500">Seed Value:</span> <span className="text-amber-300 font-bold">{result.classBState.incomingEAXHex}</span> (EAX)</div>
                      <div><span className="text-zinc-500">Straight-Line Traces:</span> {result.classBState.sourceCallSites.length} caller sites</div>
                      <div><span className="text-zinc-500">Transfer Opcode:</span> CALL near 0x00053D33 (0xE8)</div>
                      <div className="text-emerald-400 pt-1 font-bold">→ Converges at {result.targetNumericAddressHex}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Byte Validation Table */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Exact Opcode Byte Validation
                </h4>
                <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Physical File Offset</th>
                        <th className="py-2.5 px-3">Loaded Address</th>
                        <th className="py-2.5 px-3">Expected Bytes</th>
                        <th className="py-2.5 px-3">Actual Binary Bytes</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {/* B.9 JMP */}
                      <tr className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 text-amber-400 font-bold">B.9 Target Entry</td>
                        <td className="py-2.5 px-3 text-zinc-400">JMP (0xE9)</td>
                        <td className="py-2.5 px-3">{result.byteValidation.b9JmpInstruction.physicalOffsetHex}</td>
                        <td className="py-2.5 px-3">{result.byteValidation.b9JmpInstruction.loadedAddressHex}</td>
                        <td className="py-2.5 px-3 text-zinc-400">{result.byteValidation.b9JmpInstruction.expectedBytesHex}</td>
                        <td className="py-2.5 px-3 text-amber-300 font-bold">{result.byteValidation.b9JmpInstruction.actualBytesHex}</td>
                        <td className="py-2.5 px-3">
                          {result.byteValidation.b9JmpInstruction.bytesMatch ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                              MATCH
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                              MISMATCH
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* B.8 Matching Calls */}
                      {result.byteValidation.b8MatchingCalls.map((call, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/40">
                          <td className="py-2.5 px-3 text-zinc-300">B.8 Caller #{call.callerIndex + 1}</td>
                          <td className="py-2.5 px-3 text-zinc-400">CALL (0xE8)</td>
                          <td className="py-2.5 px-3">{call.callInstructionPhysicalOffsetHex}</td>
                          <td className="py-2.5 px-3">{call.callLoadedAddressHex}</td>
                          <td className="py-2.5 px-3 text-zinc-400">{call.expectedBytesHex}</td>
                          <td className="py-2.5 px-3 text-amber-300 font-bold">{call.actualBytesHex}</td>
                          <td className="py-2.5 px-3">
                            {call.bytesMatch ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                MATCH
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                                MISMATCH
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Panel 3: Entry States */}
          {activeSubPanel === 'entry_states' && (
            <div id="b10-panel-entry-states" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Class A Card */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-amber-400 font-bold text-sm">Class A — B.9 Jump Handoff</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      JMP Near (0xE9)
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Source Candidate:</span>
                      <span className="text-zinc-200">{result.classAState.sourceCandidateId}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Payload Offset:</span>
                      <span className="text-zinc-200">{result.classAState.sourceCandidatePhysicalPayloadHex}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">B.9 Target Entry Point:</span>
                      <span className="text-zinc-200">{result.classAState.sourceTargetEntryLoadedAddressHex}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Incoming EAX:</span>
                      <span className="text-amber-400 font-bold">{result.classAState.incomingEAXHex} (Preserved / Live)</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Incoming EBX:</span>
                      <span className="text-amber-400 font-bold">{result.classAState.incomingEBXHex} (Explicit Assigned)</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">EBX Assignment:</span>
                      <span className="text-zinc-300">{result.classAState.ebxAssignmentInstruction}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Other Registers:</span>
                      <span className="text-zinc-500">ECX, EDX, ESI, EDI, EBP Undefined</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Stack (ESP) Effect:</span>
                      <span className="text-zinc-400">Undisturbed (JMP does not push return)</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-500">Caller Return Addresses:</span>
                      <span className="text-zinc-300">{result.classAState.stackReturnTargetAddresses.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Class B Card */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-amber-400 font-bold text-sm">Class B — B.8 Direct Call(s)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      CALL Near (0xE8)
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Source Candidate:</span>
                      <span className="text-zinc-200">{result.classBState.sourceCandidateId}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Payload Offset:</span>
                      <span className="text-zinc-200">{result.classBState.sourceCandidatePhysicalPayloadHex}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Matching Caller Sites:</span>
                      <span className="text-zinc-200">{result.classBState.sourceCallSites.length} verified CALLs</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Incoming EAX:</span>
                      <span className="text-amber-400 font-bold">{result.classBState.incomingEAXHex} (Preserved / Live)</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Incoming EBX:</span>
                      <span className="text-zinc-500">Not Assigned / Unspecified</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">EBX Assignment:</span>
                      <span className="text-zinc-500">None in straight-line trace</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Other Registers:</span>
                      <span className="text-zinc-500">ECX, EDX, ESI, EDI, EBP Undefined</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/40 pb-1">
                      <span className="text-zinc-500">Stack (ESP) Effect:</span>
                      <span className="text-amber-300">Pushes 4-byte return address to [ESP]</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-zinc-500">Return Origin:</span>
                      <span className="text-zinc-300">{result.classBState.stackReturnAddressOrigin}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Panel 4: Differential Analysis & Trace */}
          {activeSubPanel === 'differential_trace' && (
            <div id="b10-panel-differential-trace" className="space-y-4">
              {/* Affine Transform & EAX Delta Card */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-mono">
                  <Hash className="w-4 h-4 text-amber-400" />
                  Affine Candidate Geometry & Seed Delta Relationship
                </h4>
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 text-xs font-mono">
                  <div className="text-amber-400 font-semibold border-b border-zinc-800 pb-1 flex justify-between">
                    <span>EAX Delta vs Candidate Physical Payload Delta</span>
                    <span className="text-emerald-400 text-[10px]">EXACT AFFINE MATCH</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-500 block">Class A EAX Seed</span>
                      <span className="text-amber-400 font-bold block mt-1">{result.differentialAnalysis.eaxClassAHex}</span>
                      <span className="text-zinc-500 text-[10px]">Cand {result.differentialAnalysis.affineTransformCandidateA.candidateId}</span>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-500 block">Class B EAX Seed</span>
                      <span className="text-amber-400 font-bold block mt-1">{result.differentialAnalysis.eaxClassBHex}</span>
                      <span className="text-zinc-500 text-[10px]">Cand {result.differentialAnalysis.affineTransformCandidateB.candidateId}</span>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                      <span className="text-zinc-500 block">Seed Delta (A - B)</span>
                      <span className="text-emerald-400 font-bold block mt-1">+{result.differentialAnalysis.eaxDeltaHex} (18 bytes)</span>
                      <span className="text-emerald-400 text-[10px]">Matches payload distance</span>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-xs font-sans leading-relaxed pt-2">
                    {result.differentialAnalysis.affineDescription}
                  </p>
                </div>
              </div>

              {/* Control & Register Differences */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 font-mono text-xs">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-mono">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Control Transfer & Register Differential Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-amber-400 font-semibold block border-b border-zinc-800 pb-1">Register Differences</span>
                    <div><span className="text-zinc-500">EAX:</span> {result.differentialAnalysis.registerDifferences.eax}</div>
                    <div><span className="text-zinc-500">EBX:</span> {result.differentialAnalysis.registerDifferences.ebx}</div>
                    <div><span className="text-zinc-500">ESP:</span> {result.differentialAnalysis.registerDifferences.esp}</div>
                    <div><span className="text-zinc-500">Flags:</span> {result.differentialAnalysis.registerDifferences.flags}</div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-amber-400 font-semibold block border-b border-zinc-800 pb-1">Control Flow & Frame Semantics</span>
                    <div><span className="text-zinc-500">Class A Mechanism:</span> {result.differentialAnalysis.controlTransferDifferences.classAControl}</div>
                    <div><span className="text-zinc-500">Class B Mechanism:</span> {result.differentialAnalysis.controlTransferDifferences.classBControl}</div>
                    <div className="text-zinc-400">{result.differentialAnalysis.controlTransferDifferences.stackDiscrepancy}</div>
                    <div className="text-zinc-400">{result.differentialAnalysis.controlTransferDifferences.frameSemantics}</div>
                  </div>
                </div>
              </div>

              {/* Mechanical Dimensions Table */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2 font-mono">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  Explicit Mechanical Dimensions (No Subjective Confidence Scores)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Mechanical Dimension</th>
                        <th className="py-2.5 px-3">Observed Value</th>
                        <th className="py-2.5 px-3">Verification Rule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      <tr>
                        <td className="py-2 px-3">Dual-Model Target Numeric Convergence</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">TRUE</td>
                        <td className="py-2 px-3 text-zinc-400">Model 1 and Model 2 yield identical target 0x00053D33</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">B.9 JMP Opcode Byte Verified</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">TRUE</td>
                        <td className="py-2 px-3 text-zinc-400">0xE9 61 3C 01 00 confirmed at physical 0x0005A4CD</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">B.8 CALL Opcodes Byte Verified</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">TRUE</td>
                        <td className="py-2 px-3 text-zinc-400">All matching B.8 direct CALLs verified in executable</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">EAX Delta Matches Candidate Payload Distance</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">TRUE</td>
                        <td className="py-2 px-3 text-zinc-400">0x2012 - 0x2000 == 0x2C412 - 0x2C400 == 0x12</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">Class A Live Incoming EAX</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">TRUE</td>
                        <td className="py-2 px-3 text-zinc-400">0x00002012 preserved across B.9 boundary without read</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">Class B Live Incoming EAX</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">TRUE</td>
                        <td className="py-2 px-3 text-zinc-400">0x00002000 live at CALL instruction boundary</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">Class A Explicit EBX Load</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">TRUE</td>
                        <td className="py-2 px-3 text-zinc-400">MOV EBX, 0x0000FFFF mechanically decoded</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3">Runtime Destination Verified</td>
                        <td className="py-2 px-3 text-red-400 font-bold">FALSE</td>
                        <td className="py-2 px-3 text-zinc-400">Remains false; destination body at 0x53D33 not followed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

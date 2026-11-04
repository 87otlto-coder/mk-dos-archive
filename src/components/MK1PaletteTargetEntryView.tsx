/**
 * MK1 Palette Target-Boundary & Incoming-EAX Consumption Qualification View
 *
 * Milestone 1 — Pass 1E.2B.9a.3: B.9 V2 Schema + UI + Documentation Final Closeout
 *
 * Epistemic Rules:
 *   TARGET ADDRESS != FUNCTION.
 *   EAX LIVE AT CALL != FUNCTION ARGUMENT.
 *   EAX READ AFTER CALL != PALETTE INPUT.
 *   OBJECT-RELATIVE COORDINATE != POINTER.
 *   NUMERIC TARGET REGION != VERIFIED EXECUTION SEMANTICS.
 *   CONTROL-TRANSFER TARGET RECORDED ONLY; TARGET BODY NOT FOLLOWED.
 *   RAW E8 MATCH != VERIFIED INSTRUCTION ENTRY.
 *   JUMP TARGET EQUALITY != SHARED PURPOSE.
 */

import React, { useState, useMemo } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteOperandUseResult } from '../games/mk1/research/paletteOperandUseReconnaissanceTypes';
import {
  MK1PaletteTargetEntryReconResult,
  MK1TargetTraceInstruction,
} from '../games/mk1/research/paletteTargetEntryReconnaissanceTypes';
import {
  executePaletteTargetEntryReconnaissance,
  createMK1PaletteTargetEntryExport,
} from '../games/mk1/research/paletteTargetEntryReconnaissance';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  Terminal,
  Layers,
  Crosshair,
  Search,
  ChevronRight,
  Activity,
  RefreshCw,
  Ban,
  GitBranch,
} from 'lucide-react';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport | null;
  operandUseResult: MK1PaletteOperandUseResult | null;
  targetEntryResult?: MK1PaletteTargetEntryReconResult | null;
  setTargetEntryResult?: (result: MK1PaletteTargetEntryReconResult) => void;
  onNavigateToTab?: (tab: string) => void;
}

type SubViewType = 'qualification' | 'trace' | 'consumption' | 'nullmodel' | 'callers' | 'reconciliation';

export const MK1PaletteTargetEntryView: React.FC<Props> = ({
  source,
  report,
  operandUseResult,
  targetEntryResult: initialResult,
  setTargetEntryResult,
}) => {
  const [internalResult, setInternalResult] = useState<MK1PaletteTargetEntryReconResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorDetails, setErrorDetails] = useState<unknown | null>(null);
  const [activeSubView, setActiveSubView] = useState<SubViewType>('qualification');
  const [selectedInstructionIdx, setSelectedInstructionIdx] = useState<number | null>(null);

  const result = initialResult || internalResult;

  // Prerequisite validation
  const hasPrerequisites = useMemo(() => {
    return (
      report !== null &&
      operandUseResult !== null &&
      operandUseResult.status === 'SUCCESS' &&
      operandUseResult.reconciliation.allReconciled &&
      operandUseResult.reconciliation.derivedEvidenceReconciled
    );
  }, [report, operandUseResult]);

  const handleRunAnalysis = async () => {
    if (!hasPrerequisites || !report || !operandUseResult) return;
    setIsRunning(true);
    setErrorDetails(null);
    try {
      const buffer = await source.readSlice(report.exePath, 0, report.exeSize);
      if (!buffer) {
        throw new Error(`Failed to read slice of ${report.exePath}`);
      }
      const res = executePaletteTargetEntryReconnaissance(buffer, report, operandUseResult);
      setInternalResult(res);
      if (setTargetEntryResult) {
        setTargetEntryResult(res);
      }
      if (res.targetTrace.instructions.length > 0) {
        setSelectedInstructionIdx(0);
      }
    } catch (err: unknown) {
      setErrorDetails(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportJson = () => {
    if (!result) return;
    const exportData = createMK1PaletteTargetEntryExport(result);
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `mk1_palette_target_entry_recon_${timestampStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedInstruction: MK1TargetTraceInstruction | null = useMemo(() => {
    if (!result || selectedInstructionIdx === null) return null;
    return result.targetTrace.instructions[selectedInstructionIdx] ?? null;
  }, [result, selectedInstructionIdx]);

  return (
    <div id="mk1-target-entry-view" className="space-y-6">
      {/* 1. Epistemic Axiom Banner */}
      <div
        id="epistemic-axiom-banner"
        className="bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-r-md text-amber-200 text-xs font-mono space-y-1 shadow-sm"
      >
        <div className="flex items-center gap-2 font-bold text-amber-300">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>PASS 1E.2B.9a.4 BOUNDARY &amp; DATA-USE EVIDENCE CONTRACT</span>
        </div>
        <p className="tracking-wide">
          TARGET ADDRESS != FUNCTION &nbsp;|&nbsp; EAX LIVE AT CALL != FUNCTION ARGUMENT &nbsp;|&nbsp; EAX READ AFTER CALL != PALETTE INPUT &nbsp;|&nbsp; OBJECT-RELATIVE COORDINATE != POINTER &nbsp;|&nbsp; CONTROL-TRANSFER TARGET RECORDED ONLY; TARGET BODY NOT FOLLOWED
        </p>
        <p className="text-amber-400/80">
          Execution modeled entering at target coordinate with qualifying incoming seed EAX. Strictly bounded to 96 bytes / 24 instructions straight-line trace. Jump destination body not decoded.
        </p>
      </div>

      {/* 2. Top Controls & Prerequisites Bar */}
      <div
        id="target-entry-controls-bar"
        className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-lg font-semibold text-neutral-100 flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-indigo-400" />
            Milestone 1 — Pass 1E.2B.9a.4: B.9 Independent-Review Final Correction
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {result ? (
              <>
                Target: <span className="font-mono text-neutral-200">{result.seedClass.targetLinearHex}</span> &nbsp;|&nbsp;
                Seed: <span className="font-mono text-neutral-200">{result.seedClass.seedRegister} = {result.seedClass.seedValueHex}</span> &nbsp;|&nbsp;
                Candidate: <span className="font-mono text-neutral-200">{result.candidateId}</span> &nbsp;|&nbsp;
                Reloc Base: <span className="font-mono text-neutral-200">{result.seedClass.relocationBaseHex}</span>
              </>
            ) : (
              'Target derived from reconciled B.8 evidence.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!hasPrerequisites && (
            <span className="text-xs text-amber-400 flex items-center gap-1.5 bg-amber-950/40 px-3 py-1.5 rounded border border-amber-800/60">
              <AlertTriangle className="w-3.5 h-3.5" />
              Requires completed Pass B.8 Operand Use Recon
            </span>
          )}

          <button
            id="run-b9-analysis-btn"
            disabled={!hasPrerequisites || isRunning}
            onClick={handleRunAnalysis}
            className={`px-4 py-2 rounded-md font-medium text-xs flex items-center gap-2 transition-colors ${
              !hasPrerequisites || isRunning
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Executing Hardened Qualification...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Execute Target Qualification
              </>
            )}
          </button>

          {result && (
            <button
              id="export-b9-json-btn"
              onClick={handleExportJson}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          )}
        </div>
      </div>

      {result && result.status === 'FAILED' && (
        <AnalysisFailurePanel
          title="Target Entry Reconciliation Failed"
          error={new Error(result.failureReason ?? 'Unknown reconciliation failure')}
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-target-entry-reconnaissance"
          onRetry={handleRunAnalysis}
        />
      )}

      {errorDetails && (
        <AnalysisFailurePanel
          title="Target Entry Analysis Failed"
          error={errorDetails}
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-target-entry-reconnaissance"
          onRetry={handleRunAnalysis}
        />
      )}

      {/* 3. Sub-Navigation Tabs */}
      {result && (
        <div id="b9-subnav" className="flex border-b border-neutral-800 gap-2 overflow-x-auto">
          {(
            [
              { id: 'qualification', label: '1. Boundary Qualification', icon: Crosshair },
              { id: 'trace', label: '2. Straight-Line Trace', icon: Terminal },
              { id: 'consumption', label: '3. EAX Consumption Events', icon: Activity },
              { id: 'nullmodel', label: '4. Raw E8 Null-Model Scan', icon: Search },
              { id: 'callers', label: '5. Caller Context Comparison', icon: Layers },
              { id: 'reconciliation', label: '6. Invariants & Reconciliation', icon: CheckCircle2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeSubView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubView(tab.id)}
                className={`px-3 py-2 text-xs font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-indigo-500 text-indigo-300 bg-neutral-900/50'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Tab 1: Boundary Qualification */}
      {result && activeSubView === 'qualification' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
              <span className="text-xs text-neutral-400">Boundary Classification</span>
              <div className="text-sm font-semibold text-emerald-400 font-mono mt-1">
                {result.targetBoundary.boundaryClassification}
              </div>
              <span className="text-[11px] text-neutral-500">Verified entry &amp; near return</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
              <span className="text-xs text-neutral-400">Target Linear Coordinate</span>
              <div className="text-sm font-semibold text-neutral-100 font-mono mt-1">
                {result.targetBoundary.targetLinearHex}
              </div>
              <span className="text-[11px] text-neutral-500">Object 1 Offset: {result.targetBoundary.objectOffsetHex}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
              <span className="text-xs text-neutral-400">Physical File Backing</span>
              <div className="text-sm font-semibold text-neutral-100 font-mono mt-1">
                {result.targetBoundary.physicalOffsetHex}
              </div>
              <span className="text-[11px] text-neutral-500">Region: {result.targetBoundary.regionId}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
              <span className="text-xs text-neutral-400">Incoming EAX Disposition</span>
              <div className="text-sm font-semibold text-indigo-300 font-mono mt-1">
                {result.targetTrace.disposition}
              </div>
              <span className="text-[11px] text-neutral-500">Preserved to JMP control boundary</span>
            </div>
          </div>

          {/* Near Return Reconciliation Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
            <h4 className="text-sm font-semibold text-neutral-200 flex items-center justify-between">
              <span>Near-Return Boundary Reconciliation</span>
              <span className="text-xs font-mono text-emerald-400 font-normal">
                {result.targetBoundary.returnInstructionEndsAtTarget ? 'RETURNS CLEANLY AT TARGET' : 'MISALIGNED'}
              </span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px]">Near Return Coordinate</div>
                <div className="text-neutral-200">{result.targetBoundary.nearReturnCoordinateHex}</div>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px]">Decoded Instruction</div>
                <div className="text-amber-300 font-bold">{result.targetBoundary.nearReturnInstruction} ({result.targetBoundary.nearReturnInstructionLength} byte)</div>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px]">Return Ends At</div>
                <div className="text-emerald-300 font-bold">{result.targetBoundary.nearReturnEndAddressHex}</div>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                <div className="text-neutral-500 text-[11px]">Overlap Classification</div>
                <div className="text-neutral-200">{result.targetBoundary.overlapClassification}</div>
              </div>
            </div>
          </div>

          {/* Raw Target Window Hexdump */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
            <h4 className="text-sm font-semibold text-neutral-200">Raw Target Window Hexdump (16B Pre [-16..-1], 96B Post [+0..+95])</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <div className="text-neutral-400 mb-1">Preceding 16 Bytes [-16..-1]:</div>
                <div className="text-amber-300 tracking-wider">
                  {result.rawTargetWindow.preBytesHex || '(none)'}
                </div>
                <div className="text-[11px] text-neutral-500 mt-2">
                  Preceding terminates at target boundary: {result.targetBoundary.precedingDecodesToBoundary ? 'YES' : 'NO'}
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded border border-neutral-800">
                <div className="text-neutral-400 mb-1">Following 96 Bytes [+0..+95] from Entry:</div>
                <div className="text-emerald-400 tracking-wider break-all">
                  {result.rawTargetWindow.postBytesHex}
                </div>
                <div className="text-[11px] text-neutral-500 mt-2">
                  Entry Byte: <span className="text-emerald-300 font-bold">{result.rawTargetWindow.targetByteHex}</span> | Forward First Instruction: {result.targetBoundary.forwardFirstInstructionMnemonic}
                </div>
              </div>
            </div>

            {result.targetBoundary.notes.length > 0 && (
              <div className="space-y-1 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                <div className="font-semibold text-neutral-300">Qualification Notes:</div>
                {result.targetBoundary.notes.map((note, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Straight-Line Target Trace */}
      {result && activeSubView === 'trace' && (
        <div className="space-y-6">
          {/* Final Control Boundary Card */}
          {result.targetTrace.finalControlBoundary && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-semibold text-neutral-200">
                    Final Control Boundary: {result.targetTrace.finalControlBoundary.boundaryInstructionMnemonic}
                  </h4>
                </div>
                <span className="px-2 py-0.5 bg-amber-950 text-amber-300 text-xs rounded border border-amber-800 font-mono">
                  DO NOT FOLLOW JMP 0x53D33
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {result.targetTrace.finalControlBoundary.notes[1] ?? result.targetTrace.finalControlBoundary.notes[0]}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[11px]">Boundary Loaded Addr</div>
                  <div className="text-neutral-200">{result.targetTrace.finalControlBoundary.boundaryInstructionLoadedAddressHex}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[11px]">Boundary Target Loaded</div>
                  <div className="text-indigo-300 font-bold">{result.targetTrace.finalControlBoundary.boundaryTargetLoadedAddressHex}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[11px]">Seed Live At Boundary</div>
                  <div className="text-emerald-400 font-bold">{result.targetTrace.finalControlBoundary.seedLiveAtBoundary ? 'YES (EAX)' : 'NO'}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[11px]">B.8 Target Cross-Ref</div>
                  <div className="text-neutral-200">
                    {result.targetTrace.b8BoundaryTargetCrossReference?.boundaryTargetAppearsInB8TargetGroups ? 'MATCHES B.8 GROUP' : 'NONE'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-neutral-200">
                  Straight-Line Target Trace (Entry: {result.targetBoundary.targetLinearHex})
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Decoded {result.targetTrace.instructions.length} instructions ({result.targetTrace.totalBytesDecoded} bytes). Stop Reason: <span className="font-mono text-amber-300">{result.targetTrace.stopReason}</span>
                </p>
              </div>
              <div className="text-xs font-mono text-neutral-400">
                Initial: EAX = {result.seedClass?.seedValueHex}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-neutral-950 text-neutral-400 uppercase text-[11px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="p-2.5 pl-4">#</th>
                    <th className="p-2.5">File Offset</th>
                    <th className="p-2.5">Loaded Linear</th>
                    <th className="p-2.5">Bytes</th>
                    <th className="p-2.5">Disassembly</th>
                    <th className="p-2.5">Seed Events</th>
                    <th className="p-2.5 pr-4">Register State After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {result.targetTrace.instructions.map((inst, idx) => {
                    const isSelected = selectedInstructionIdx === idx;
                    const hasSeedEvent = inst.eaxEvents.length > 0;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedInstructionIdx(idx)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-950/40 text-neutral-100'
                            : 'hover:bg-neutral-800/40 text-neutral-300'
                        }`}
                      >
                        <td className="p-2.5 pl-4 font-bold text-neutral-500">{inst.index}</td>
                        <td className="p-2.5 text-neutral-400">{inst.fileOffsetHex}</td>
                        <td className="p-2.5 text-indigo-300">{inst.loadedAddressHex}</td>
                        <td className="p-2.5 text-neutral-400">{inst.rawBytesHex}</td>
                        <td className="p-2.5 font-bold text-neutral-100">
                          {inst.mnemonic}
                          {inst.isBarrier && (
                            <span className="ml-2 px-1.5 py-0.5 bg-red-950/60 text-red-300 text-[10px] rounded border border-red-800">
                              BARRIER ({inst.barrierType})
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {hasSeedEvent ? (
                            <div className="space-y-0.5">
                              {inst.eaxEvents.map((ev, eIdx) => (
                                <span
                                  key={eIdx}
                                  className="inline-block px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 text-[10px] rounded border border-emerald-800 mr-1"
                                >
                                  {ev.eventType}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                        <td className="p-2.5 pr-4 text-[11px] text-neutral-400">
                          {Object.entries(inst.registerStateAfter)
                            .filter(([_, state]) => state.isTrackingSeed)
                            .map(([reg, state]) => `${reg}=${state.exactValueHex}`)
                            .join(', ') || 'none'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selected Instruction Detail */}
          {selectedInstruction && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
              <h5 className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Instruction #{selectedInstruction.index} Detail: {selectedInstruction.mnemonic}
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[11px]">Opcode</div>
                  <div className="text-neutral-200">{selectedInstruction.opcodeHex}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[11px]">Length</div>
                  <div className="text-neutral-200">{selectedInstruction.length} bytes</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[11px]">ModR/M / SIB</div>
                  <div className="text-neutral-200">
                    {selectedInstruction.modRMHex ?? 'none'} / {selectedInstruction.sibHex ?? 'none'}
                  </div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                  <div className="text-neutral-500 text-[11px]">Imm / Disp</div>
                  <div className="text-neutral-200">
                    {selectedInstruction.immValueHex ?? 'none'} / {selectedInstruction.dispValueHex ?? 'none'}
                  </div>
                </div>
              </div>

              {selectedInstruction.eaxEvents.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-300">Seed Events on this instruction:</span>
                  {selectedInstruction.eaxEvents.map((ev, idx) => (
                    <div key={idx} className="text-xs text-emerald-300 flex items-center gap-2 font-mono">
                      <ChevronRight className="w-3 h-3 text-emerald-400" />
                      <span>[{ev.eventType}] {ev.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: EAX Consumption Events */}
      {result && activeSubView === 'consumption' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
            <h4 className="text-sm font-semibold text-neutral-200">Seed Event Model (17 Verification Flags)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              {Object.entries(result.targetTrace.seedEvents).map(([flag, val], idx) => (
                <div
                  key={idx}
                  className="bg-neutral-950 p-3 rounded border border-neutral-800 flex items-center justify-between"
                >
                  <span className="text-neutral-300">{flag}</span>
                  <span className={val ? 'text-emerald-400 font-bold' : 'text-neutral-600'}>
                    {val ? 'TRUE' : 'FALSE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Raw E8 Null-Model Scan */}
      {result && activeSubView === 'nullmodel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
              <span className="text-xs text-neutral-400">Scan Range Bounds</span>
              <div className="text-sm font-bold font-mono mt-1 text-neutral-100">
                {result.nullModel.scanRangeStartPhysicalHex} – {result.nullModel.scanRangeEndPhysicalHex}
              </div>
              <span className="text-[11px] text-neutral-500">In Object 1 ({result.nullModel.scanRangeBytes.toLocaleString()} bytes)</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
              <span className="text-xs text-neutral-400">Exact Matches to Target</span>
              <div className="text-base font-bold font-mono mt-1 text-indigo-300">
                {result.nullModel.rawExactTargetMatchCount}
              </div>
              <span className="text-[11px] text-neutral-500">Matches {result.seedClass?.targetLinearHex ?? '0x000400C8'}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
              <span className="text-xs text-neutral-400">Verified B.8 CALL Boundaries</span>
              <div className="text-base font-bold font-mono mt-1 text-emerald-400">
                {result.nullModel.verifiedB8CallBoundaryMatchCount}
              </div>
              <span className="text-[11px] text-neutral-500">Verified B.8 instruction boundaries</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg">
              <span className="text-xs text-neutral-400">Raw-Only Exact Target Matches</span>
              <div className="text-base font-bold font-mono mt-1 text-neutral-300">
                {result.nullModel.rawOnlyExactTargetMatchCount}
              </div>
              <span className="text-[11px] text-neutral-500">Raw-only E8 encodings</span>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
            <h4 className="text-sm font-semibold text-neutral-200">Raw Exact-Target E8 Encodings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {result.nullModel.rawE8ExactTargetMatches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-neutral-950 border border-neutral-800 rounded flex items-center justify-between"
                >
                  <div>
                    <span className="text-neutral-500 mr-2">#{idx + 1}</span>
                    <span className="text-indigo-400 font-bold">{m.fileOffsetHex}</span>
                    <span className="text-neutral-400 ml-2">({m.loadedAddressHex})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.isVerifiedB8CallerBoundary
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                    }`}
                  >
                    {m.matchClassification}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab 5: Caller Local Context Comparison */}
      {result && activeSubView === 'callers' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs text-neutral-400">Comparison Summary</span>
              <div className="text-sm font-bold font-mono mt-0.5 flex items-center gap-4">
                <span className="text-neutral-200">
                  Verified Callers: <span className="text-indigo-400">{result.callerComparison.verifiedCallerCount}</span>
                </span>
                <span className="text-neutral-200">
                  Core Sequence Equal:{' '}
                  <span className={result.callerComparison.verifiedCoreSequenceEqual ? 'text-emerald-400' : 'text-amber-400'}>
                    {result.callerComparison.verifiedCoreSequenceEqual ? 'YES' : 'NO'}
                  </span>
                </span>
              </div>
            </div>
            <div className="text-xs text-neutral-400 font-mono text-right space-y-0.5">
              <div>
                Seed Distance: <span className="text-neutral-200">{result.callerComparison.seedInstructionPhysicalDistance} bytes</span>
                {' '}| CALL Distance: <span className="text-neutral-200">{result.callerComparison.callInstructionPhysicalDistance} bytes</span>
              </div>
              <div>
                Raw Windows Overlap: <span className={result.callerComparison.rawWindowsOverlap ? 'text-amber-400' : 'text-emerald-400'}>
                  {result.callerComparison.rawWindowsOverlap ? 'YES' : 'NO'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.callerComparison.callerRecords.map((cr, idx) => (
              <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-neutral-200">
                    Caller Site #{cr.callerIndex}
                  </h5>
                  <span className="text-xs font-mono text-indigo-400">
                    [{cr.windowStartOffsetHex} .. {cr.windowEndOffsetHex}]
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Seed Physical</span>
                    <span className="text-indigo-300 font-bold">{cr.seedInstructionPhysicalOffsetHex}</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">CALL Physical</span>
                    <span className="text-indigo-300 font-bold">{cr.callInstructionPhysicalOffsetHex}</span>
                  </div>
                  <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 block">Return Loaded</span>
                    <span className="text-emerald-400 font-bold">{cr.returnLoadedAddressHex}</span>
                  </div>
                </div>

                {/* Verified Core Card */}
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-2">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Verified Core Instruction Sequence
                  </span>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-500">Seed Instruction:</span>
                      <span className="text-emerald-300 font-bold">
                        {cr.verifiedCore.seedInstructionMnemonic} {cr.verifiedCore.seedInstruction?.destinationRegister ?? 'EAX'}, {cr.verifiedCore.seedImmediateHex}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-500">CALL Instruction:</span>
                      <span className="text-amber-300 font-bold">
                        CALL {cr.verifiedCore.actualTargetHex} (rel32 {cr.verifiedCore.actualRel32Hex})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-500">Return Coordinate:</span>
                      <span className="text-neutral-200">
                        {cr.verifiedCore.returnCoordinateHex} (object-rel {cr.verifiedCore.returnCoordinateObj?.returnObjectRelativeAddressHex ?? 'N/A'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Raw Bytes Preview */}
                <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Raw Window Bytes Preview
                  </span>
                  <p className="text-[11px] font-mono text-neutral-400 break-all leading-relaxed bg-neutral-900/60 p-2 rounded border border-neutral-800/80">
                    {cr.rawBytesHex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Tab 6: Invariants & Reconciliation */}
      {result && activeSubView === 'reconciliation' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
            <h4 className="text-sm font-semibold text-neutral-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Epistemic Contract Reconciliation ({Object.keys(result.reconciliation).length} Booleans)
              </span>
              <span className={result.reconciliation.allReconciled ? 'text-emerald-400 font-bold font-mono text-xs' : 'text-red-400 font-bold font-mono text-xs'}>
                {result.reconciliation.allReconciled ? 'ALL RECONCILED' : 'FAILED'}
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              {Object.entries(result.reconciliation).map(([key, ok], idx) => (
                <div
                  key={idx}
                  className="bg-neutral-950 p-3 rounded border border-neutral-800 flex items-center justify-between"
                >
                  <span className="text-neutral-300">{key}</span>
                  <span className={ok ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {ok ? 'RECONCILED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
            <h4 className="text-sm font-semibold text-neutral-200">Empirical Fixture Observations</h4>
            <div className="space-y-2 text-xs text-neutral-300 font-mono">
              {result.fixtureObservations.map((obs, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

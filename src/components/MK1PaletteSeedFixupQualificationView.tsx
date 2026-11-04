import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCode,
  Layers,
  Play,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import {
  createMK1CompactPaletteSeedFixupQualificationExport,
  performPaletteSeedFixupQualification,
} from '../games/mk1/research/paletteSeedFixupQualification';
import {
  MK1PaletteSeedFixupQualificationResult,
  MK1SeedFieldQualification,
} from '../games/mk1/research/paletteSeedFixupQualificationTypes';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport;
  seedFixupResult?: MK1PaletteSeedFixupQualificationResult | null;
  setSeedFixupResult?: (result: MK1PaletteSeedFixupQualificationResult) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const MK1PaletteSeedFixupQualificationView: React.FC<Props> = ({
  source,
  report,
  seedFixupResult,
  setSeedFixupResult,
  onNavigateToTab,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = seedFixupResult ?? null;

  const handleRunRecon = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await performPaletteSeedFixupQualification(source, report);
      if (setSeedFixupResult) {
        setSeedFixupResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportJson = () => {
    if (!result) return;
    const exportData = createMK1CompactPaletteSeedFixupQualificationExport(result);
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = result.timestamp.replace(/[:.]/g, '-');
    a.download = `mk1_palette_seed_fixup_qualification_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="mk1-seed-fixup-qualification-view" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              Pass 1E.2B.10c
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Checkpoint: mkdos-m1e2b10c-le-seed-fixup-qualification
            </span>
          </div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            LE Seed Fixup Qualification
          </h3>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Determines whether the four verified EAX seed immediates feeding the 0x53D33
            convergence are covered by LE loader fixups, or remain raw compile-time literals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="run-seed-fixup-qualification-btn"
            onClick={handleRunRecon}
            disabled={isRunning}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
              isRunning
                ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Parsing Fixup Records...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Fixup Qualification</span>
              </>
            )}
          </button>

          {result && (
            <button
              id="export-seed-fixup-json-btn"
              onClick={handleExportJson}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Execution Error</div>
            <div className="font-mono mt-1 text-rose-300">{error}</div>
          </div>
        </div>
      )}

      {/* Epistemic Rules Banner */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Epistemic Bounds & Constraints</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span>DO NOT FOLLOW 0x53D33 or 0x53D4A (candidate destination is an absolute barrier)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span>DO NOT EXTEND DISASSEMBLY beyond verified instruction boundaries</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span>DO NOT INSPECT 0x53CA1 or assume prologue/epilogue sequences</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span>DO NOT INFER DS/CS SEGMENTS without explicit selector relocation evidence</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span>DO NOT ASSUME DOS/4GW DEFAULTS or flat-model uniformity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span>DO NOT CALL EAX A POINTER OR ARGUMENT without explicit memory dereference proof</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">•</span>
            <span>DO NOT MAKE PALETTE CONSUMER OR OWNERSHIP CLAIMS</span>
          </li>
        </ul>
      </div>

      {!result && !isRunning && (
        <div className="p-8 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-3">
          <FileCode className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Click &quot;Run Fixup Qualification&quot; to parse the Fixup Page Table and Fixup Record
            Table for logical pages covering the four verified EAX seed immediates.
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Executive Reconciliation Summary */}
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  Reconciliation Summary
                </h4>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {result.reconciliation.allReconciled ? 'All 4 Evaluated & Reconciled' : 'Incomplete'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs font-mono text-zinc-300">
              {result.reconciliation.summary}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 text-[11px] block">Class A Sites</span>
                <span className="font-semibold text-zinc-200">
                  {result.reconciliation.classACovered ? 'Covered (Fixup)' : 'Raw Literal (No Fixup)'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 text-[11px] block">Class B Sites</span>
                <span className="font-semibold text-zinc-200">
                  {result.reconciliation.classBCovered ? 'Covered (Fixup)' : 'Raw Literal (No Fixup)'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 text-[11px] block">Evaluated Fields</span>
                <span className="font-semibold text-zinc-200">
                  {result.seedFields.length} / 4
                </span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 text-[11px] block">Parser Status</span>
                <span className="font-semibold text-emerald-400">
                  {result.mechanicalValidation.parserValidated ? 'Mechanically Validated' : 'Unvalidated'}
                </span>
              </div>
            </div>
          </div>

          {/* Four Seed Field Cards */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Verified Seed Immediate Qualification
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.seedFields.map((field) => (
                <SeedFieldCard key={field.siteId} field={field} />
              ))}
            </div>
          </div>

          {/* Logical Pages Fixup Records Summary */}
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Logical Pages Fixup Table Inspection
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
                    <th className="py-2 px-3">Logical Page</th>
                    <th className="py-2 px-3">FPT Index</th>
                    <th className="py-2 px-3">Record Range (Rel)</th>
                    <th className="py-2 px-3">File Span</th>
                    <th className="py-2 px-3">Bytes</th>
                    <th className="py-2 px-3">Records</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {Object.values(result.pageFixupSummaries).map((page) => (
                    <tr key={page.logicalPageNumber} className="hover:bg-zinc-800/20">
                      <td className="py-2 px-3 font-semibold text-zinc-200">
                        Page {page.logicalPageNumber}
                      </td>
                      <td className="py-2 px-3 text-zinc-400">
                        {page.fptTableIndex}
                      </td>
                      <td className="py-2 px-3 text-zinc-400">
                        [0x{page.recordStartOffset.toString(16).toUpperCase()}..0x{page.recordEndOffset.toString(16).toUpperCase()})
                      </td>
                      <td className="py-2 px-3 text-zinc-400">
                        [0x{page.recordFileStart.toString(16).toUpperCase()}..0x{page.recordFileEnd.toString(16).toUpperCase()})
                      </td>
                      <td className="py-2 px-3 text-zinc-300">
                        {page.recordBytesLength} B
                      </td>
                      <td className="py-2 px-3 text-zinc-200 font-semibold">
                        {page.records.length}
                      </td>
                      <td className="py-2 px-3">
                        {page.parseError ? (
                          <span className="text-rose-400">Error: {page.parseError}</span>
                        ) : page.hasFixups ? (
                          <span className="text-emerald-400">Parsed ({page.records.length} records)</span>
                        ) : (
                          <span className="text-zinc-500">0 Fixups (Literal Page)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Target Pages 49 & 52 Chaining Closeout */}
          {result.targetPagesChainingSummary && Object.keys(result.targetPagesChainingSummary).length > 0 && (
            <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                    Target Pages Internal Chaining Verification (Pages 49, 52 & Seed Pages)
                  </h4>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  FLAGS 0x08 Chaining Closeout
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(result.targetPagesChainingSummary).map((pageSummary) => (
                  <div
                    key={pageSummary.logicalPageNumber}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                      <span className="font-semibold text-zinc-200 text-sm">
                        Logical Page {pageSummary.logicalPageNumber}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Direct: {pageSummary.directFixupRecordCount} | Chained: {pageSummary.chainingRecordCount}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="text-zinc-400">
                        Chain Resolution Status:{' '}
                        <span className={pageSummary.allChainsResolved ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          {pageSummary.allChainsResolved ? 'All Chains Fully Resolved' : 'Unresolved / Incomplete'}
                        </span>
                      </div>
                      <div className="text-zinc-400">
                        Expanded Chain Member Count:{' '}
                        <span className="text-cyan-300 font-semibold">
                          {pageSummary.expandedChainMemberOffsets.length}
                        </span>
                      </div>
                      {pageSummary.expandedChainMemberOffsetsHex.length > 0 ? (
                        <div className="text-zinc-500 break-all text-[10px] bg-zinc-900/60 p-2 rounded border border-zinc-800/60">
                          Offsets: {pageSummary.expandedChainMemberOffsetsHex.join(', ')}
                        </div>
                      ) : (
                        <div className="text-zinc-500 text-[10px] italic">
                          No internal chaining members present on this page.
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                      <div className="text-zinc-400 font-semibold text-[10px] uppercase tracking-wider">
                        Seed Fields Coverage on this Page:
                      </div>
                      <div className="space-y-1">
                        {pageSummary.fieldCoverage.map((cov) => (
                          <div
                            key={cov.siteId}
                            className="flex items-center justify-between text-[11px] py-0.5"
                          >
                            <span className="text-zinc-400">{cov.siteId} ({cov.operandPhysicalOffsetHex}):</span>
                            <span className={
                              cov.isCovered
                                ? 'text-emerald-400 font-semibold'
                                : 'text-zinc-500'
                            }>
                              {cov.isCovered ? `Covered (${cov.coverageKind})` : 'Not Covered'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mechanical Validation Details */}
          <div className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Mechanical Parser Validation (Independent Control Pages)
              </h4>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {result.mechanicalValidation.notes}
            </p>

            {result.mechanicalValidation.sampledPageSummaries.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                {result.mechanicalValidation.sampledPageSummaries.map((s) => (
                  <div
                    key={s.logicalPageNumber}
                    className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="font-semibold">Logical Page {s.logicalPageNumber}</span>
                      <span className="text-emerald-400">{s.recordCount} records</span>
                    </div>
                    {s.firstRecordSummary && (
                      <div className="text-zinc-500 text-[10px] truncate" title={s.firstRecordSummary}>
                        {s.firstRecordSummary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SeedFieldCard: React.FC<{ field: MK1SeedFieldQualification }> = ({ field }) => {
  const getBadge = () => {
    switch (field.classification) {
      case 'direct':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
            Direct Fixup
          </span>
        );
      case 'chained':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-medium">
            Chained Fixup (Member #{field.chainMemberIndex ?? 0})
          </span>
        );
      case 'overlapping':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-medium">
            Overlapping Fixup
          </span>
        );
      case 'no-fixup':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium">
            No Fixup (Raw Literal)
          </span>
        );
      case 'ambiguous':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-medium">
            Ambiguous
          </span>
        );
    }
  };

  return (
    <div
      id={`seed-field-card-${field.siteId}`}
      className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">{field.siteName}</span>
            <span className="text-[10px] font-mono text-zinc-500">{field.stateClass}</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            {field.instructionMnemonic} @ {field.instructionPhysicalOffsetHex}
          </div>
        </div>
        <div>{getBadge()}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
        <div>
          <span className="text-[10px] text-zinc-500 block">Operand Physical Offset</span>
          <span className="text-zinc-300">{field.operandPhysicalOffsetHex}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block">Raw Immediate</span>
          <span className="text-amber-300 font-semibold">{field.rawImmediateValueHex}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block">Object 1 Offset</span>
          <span className="text-zinc-300">{field.objectOffsetHex}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 block">Logical Page & Span</span>
          <span className="text-zinc-300">
            Page {field.logicalPageNumber} [{field.sourceOffsetInPageHex}..
            {('0x' + (field.sourceOffsetInPage + 4).toString(16).padStart(4, '0')).toUpperCase()})
          </span>
        </div>
      </div>

      <div className="text-[11px] text-zinc-400 leading-relaxed">
        {field.classificationDescription}
      </div>

      {field.matchingFixups.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <div className="text-[11px] font-semibold text-zinc-300">
            Associated Fixup Record ({field.matchingFixups.length})
          </div>
          {field.matchingFixups.map((match, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/60 text-xs font-mono space-y-1.5"
            >
              <div className="flex items-center justify-between text-zinc-300">
                <span className="text-emerald-400">{match.fixupRecord.srcTypeDescription}</span>
                <span className="text-[10px] text-zinc-500">
                  Span: [0x{match.fixupSpanInPage[0].toString(16).toUpperCase()}..0x{match.fixupSpanInPage[1].toString(16).toUpperCase()})
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Target: {match.fixupRecord.targetType} (Object {match.fixupRecord.targetObjectNumber ?? 'N/A'}, Offset {match.fixupRecord.targetOffsetHex ?? 'N/A'})
              </div>
              {match.fixupRecord.isAdditive && (
                <div className="text-[11px] text-amber-400">
                  Additive displacement: {match.fixupRecord.additiveDisplacementHex}
                </div>
              )}
              {match.preferredLinearCandidateHex && (
                <div className="text-[11px] text-indigo-300 font-semibold">
                  Preferred Linear Candidate: {match.preferredLinearCandidateHex}
                </div>
              )}
              {match.anchorComparison && (
                <div className="text-[10px] text-zinc-400">
                  {match.anchorComparison.notes}
                </div>
              )}
              <div className="text-[10px] text-zinc-500">
                Raw bytes: {match.fixupRecord.rawBytesHex}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Download,
  Grid,
  Info,
  Layers,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteReferenceReconResult } from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import {
  MK1PaletteOccurrenceContextResult,
} from '../games/mk1/research/paletteOccurrenceContextTypes';
import {
  createMK1CompactPaletteOccurrenceContextExport,
  performPaletteOccurrenceContextReconnaissance,
} from '../games/mk1/research/paletteOccurrenceContext';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport;
  reconResult: MK1PaletteReferenceReconResult;
  contextResult: MK1PaletteOccurrenceContextResult | null;
  setContextResult: (res: MK1PaletteOccurrenceContextResult | null) => void;
  isContextRunning: boolean;
  setIsContextRunning: (v: boolean) => void;
}

export function MK1PaletteOccurrenceContextView({
  source,
  report,
  reconResult,
  contextResult,
  setContextResult,
  isContextRunning,
  setIsContextRunning,
}: Props) {
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inspector filters
  const [searchQuery, setSearchQuery] = useState('');
  const [shapeFilter, setShapeFilter] = useState<string>('all');
  const [clusterFilter, setClusterFilter] = useState<'all' | 'clustered' | 'isolated'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const handleRunContextRecon = async () => {
    setErrorMsg(null);
    setIsContextRunning(true);
    setProgressVal(0.05);
    setProgressMsg('Initializing occurrence context analysis...');

    try {
      const result = await performPaletteOccurrenceContextReconnaissance(source, reconResult, {
        exePath: report.exePath,
        exeSize: report.exeSize,
        onProgress: (stage, prog) => {
          setProgressMsg(stage);
          setProgressVal(prog);
        },
      });

      if (result.status === 'FAILED') {
        setErrorMsg(result.failureReason || 'Context reconnaissance failed');
      } else {
        setContextResult(result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Context reconnaissance exception: ${msg}`);
    } finally {
      setIsContextRunning(false);
      setProgressMsg(null);
    }
  };

  const handleExportJson = () => {
    if (!contextResult) return;

    const exportData = createMK1CompactPaletteOccurrenceContextExport(contextResult);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_palette_occurrence_context_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered positions for the inspector
  const filteredPositions = useMemo(() => {
    if (!contextResult) return [];

    return contextResult.classifiedPositions.filter((pos) => {
      if (clusterFilter === 'clustered' && !pos.isClustered) return false;
      if (clusterFilter === 'isolated' && pos.isClustered) return false;
      if (selectedClusterId && pos.clusterId !== selectedClusterId) return false;

      if (regionFilter !== 'all') {
        if (regionFilter === 'obj1' && pos.sourceObjectNumber !== 1) return false;
        if (regionFilter === 'obj2' && pos.sourceObjectNumber !== 2) return false;
        if (regionFilter === 'other' && (pos.sourceObjectNumber === 1 || pos.sourceObjectNumber === 2))
          return false;
      }

      if (shapeFilter !== 'all') {
        if (shapeFilter === 'whitelisted') {
          if (!pos.trackA_x86Shape?.isWhitelistedShape) return false;
        } else if (shapeFilter === 'multiple') {
          if (pos.shapeStatus !== 'multiple-whitelisted-shapes') return false;
        } else if (shapeFilter === 'negative') {
          if (!pos.trackA_x86Shape?.isNegativeContext) return false;
        } else if (shapeFilter === 'unmatched') {
          if (pos.trackA_x86Shape?.isWhitelistedShape || pos.trackA_x86Shape?.isNegativeContext)
            return false;
        } else {
          if (pos.trackA_x86Shape?.shapeClass !== shapeFilter) return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          pos.sourceFileOffsetHex.toLowerCase().includes(q) ||
          pos.matchedUint32Hex.toLowerCase().includes(q) ||
          (pos.trackA_x86Shape?.mnemonicHint.toLowerCase().includes(q) ?? false) ||
          pos.associatedCandidates.some((c) => c.candidateId.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [contextResult, clusterFilter, selectedClusterId, regionFilter, shapeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredPositions.length / pageSize) || 1;
  const pagedPositions = filteredPositions.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Header & Run Control */}
      <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">
              Palette Occurrence Context Reconnaissance
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-sky-400">
              Milestone 1E.2B.2
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-1">
            Narrow x86 instruction-field shape analysis (Object 1 R-X region) + spatial clustering (start delta ≤ 64B, min 3 pos).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {contextResult && (
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export compact JSON following mk1_palette_occurrence_context_v1 schema"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              Export Context JSON
            </button>
          )}

          <button
            onClick={handleRunContextRecon}
            disabled={isContextRunning}
            className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              isContextRunning
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-sky-600 hover:bg-sky-500 text-zinc-950 font-bold shadow'
            }`}
          >
            {isContextRunning ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Context...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Analyze Occurrence Context (1E.2B.2)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Display */}
      {isContextRunning && (
        <div className="p-4 rounded-lg bg-zinc-950 border border-sky-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-sky-400">
            <span>{progressMsg || 'Processing context reconnaissance...'}</span>
            <span>{Math.round(progressVal * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-sky-500 transition-all duration-200"
              style={{ width: `${Math.max(5, Math.round(progressVal * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <div>
            <div className="font-semibold">Context Reconnaissance Error</div>
            <div className="mt-0.5 font-mono">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Epistemic Guardrail Notice */}
      <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400 font-sans">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-200">Core Epistemic Principle: </span>
          <span className="font-mono text-sky-300 font-bold">STRUCTURAL COINCIDENCE != POINTER OR PALETTE OWNERSHIP</span>.
          A successful shape match indicates that an occurrence coincides with the immediate/displacement field of an explicitly whitelisted x86 instruction pattern. It does NOT prove semantic reference, routine execution, or palette ownership.
        </div>
      </div>

      {/* Negative Control Banner */}
      <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-200">Negative Control Verification:</span>
            <span className="font-mono text-emerald-400 font-bold">
              MK1.EXE:0x0009C914
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
              CONFIRMED 0 OCCURRENCES
            </span>
          </div>
          <p className="text-zinc-400 font-sans leading-relaxed">
            Candidate in Object 2 (32 bytes) yielded exactly 0 external matches in Pass 1E.2B.1 and remains at 0 occurrences. It is not rescued or special-cased.
          </p>
        </div>
      </div>

      {contextResult && (
        <div className="space-y-6">
          {/* Formal Reconciliation Card */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Formal Input & Execution Reconciliation (B.1 → B.2)
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  contextResult.reconciliation.logicalMatchesReconcile &&
                  contextResult.reconciliation.physicalPositionsReconcile &&
                  contextResult.reconciliation.object1TrackAReconciles &&
                  contextResult.reconciliation.trackBReconciles &&
                  contextResult.reconciliation.clusterMembershipReconciles
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-red-950 border border-red-800 text-red-300'
                }`}
              >
                STATUS: {contextResult.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-[11px]">
              <div>
                <div className="text-zinc-500">Logical Matches:</div>
                <div className="text-zinc-200 font-bold">
                  {contextResult.reconciliation.b2LogicalMatchesAccountedFor} / {contextResult.reconciliation.b1ExternalLogicalMatchInputCount}
                  {contextResult.reconciliation.logicalMatchesReconcile && (
                    <span className="text-emerald-400 ml-1.5">✓ Reconciled</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-zinc-500">Unique Positions:</div>
                <div className="text-zinc-200 font-bold">
                  {contextResult.reconciliation.b2UniquePhysicalPositionsAccountedFor} / {contextResult.reconciliation.b1UniquePhysicalPositionInputCount}
                  {contextResult.reconciliation.physicalPositionsReconcile && (
                    <span className="text-emerald-400 ml-1.5">✓ Reconciled</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-zinc-500">Object 1 Track A:</div>
                <div className="text-zinc-200 font-bold">
                  {contextResult.reconciliation.object1TrackAAnalyzedPositions} / {contextResult.reconciliation.object1TrackAExpectedPositions}
                  {contextResult.reconciliation.object1TrackAReconciles && (
                    <span className="text-emerald-400 ml-1.5">✓ Reconciled</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-zinc-500">Track B Hits:</div>
                <div className="text-zinc-200 font-bold">
                  {contextResult.reconciliation.trackBAnalyzedPositions} / {contextResult.reconciliation.trackBExpectedPositions}
                  {contextResult.reconciliation.trackBReconciles && (
                    <span className="text-emerald-400 ml-1.5">✓ Reconciled</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-zinc-500">Cluster Partition:</div>
                <div className="text-zinc-200 font-bold">
                  {contextResult.reconciliation.clusteredPositions} cl + {contextResult.reconciliation.unclusteredPositions} iso
                  {contextResult.reconciliation.clusterMembershipReconciles && (
                    <span className="text-emerald-400 ml-1.5">✓ Reconciled</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top-Level Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Physical Hits Analyzed</div>
              <div className="text-lg font-bold text-zinc-100 mt-1">
                {contextResult.trackB.totalPositionsAnalyzed.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Distinct EXE offsets</div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Object 1 Eligible</div>
              <div className="text-lg font-bold text-sky-400 mt-1">
                {contextResult.trackA.eligibleObject1Positions.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Object 1 R-X positions</div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Whitelisted x86 Shapes</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {contextResult.trackA.whitelistedShapePositions.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">
                {contextResult.trackA.percentageWhitelisted}% of Obj 1 ({contextResult.trackA.singleWhitelistedShapePositions} single, {contextResult.trackA.multipleWhitelistedShapePositions} multi)
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Negative Context</div>
              <div className="text-lg font-bold text-amber-400 mt-1">
                {contextResult.trackA.negativeContextPositions.toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-400/80 mt-0.5">
                CALL/JMP rel32 ({contextResult.trackA.percentageNegativeContext}%)
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Spatial Clusters</div>
              <div className="text-lg font-bold text-indigo-400 mt-1">
                {contextResult.trackB.totalClustersIdentified.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {contextResult.trackB.regularStrideClustersCount} regular stride
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Clustered Positions</div>
              <div className="text-lg font-bold text-cyan-400 mt-1">
                {contextResult.trackB.clusteredPositionsCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {contextResult.trackB.percentageClustered}% of all hits
              </div>
            </div>
          </div>

          {/* Track A: Narrow x86 Operand-Field Shape Distribution */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span>Track A — Whitelisted x86 Operand-Field Shapes (Object 1 R-X Region)</span>
                </h4>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Inspection of preceding bytes at physical hit locations in Object 1 against explicit operand encodings using bounded lookbehind [P-8..P-1].
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 self-start sm:self-auto">
                {contextResult.trackA.eligibleObject1Positions} Object 1 positions analyzed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Encoding Shape</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3">Positions</th>
                    <th className="py-2.5 px-3">% of Obj 1</th>
                    <th className="py-2.5 px-3">Logical Matches</th>
                    <th className="py-2.5 px-3">Encoding Pattern / Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {contextResult.trackA.shapeDistribution.map((item) => (
                    <tr key={item.shapeClass} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-semibold text-zinc-100">
                        {item.displayName}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.isWhitelisted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                            WHITELISTED
                          </span>
                        ) : item.isNegativeContext ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
                            NEGATIVE CONTEXT
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                            UNMATCHED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-sky-400">
                        {item.positionCount}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {item.percentageOfObject1Positions}%
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        {item.logicalMatchCount}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-400 font-sans">
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Track B: Physical Spatial Clusters */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-400" />
                  <span>Track B — Physical Spatial Cluster Analysis (All Regions)</span>
                </h4>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Proximity clustering: <span className="font-mono text-zinc-300 font-semibold">{contextResult.trackB.clusteringRule}</span>.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-indigo-300">
                  {contextResult.trackB.totalClustersIdentified} clusters
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-300">
                  {contextResult.trackB.regularStrideClustersCount} regular strides
                </span>
              </div>
            </div>

            {contextResult.trackB.clusters.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 font-mono">
                No spatial clusters meeting rule criteria (start delta ≤ 64B, min 3 positions) identified.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Cluster ID</th>
                      <th className="py-2.5 px-3">Region</th>
                      <th className="py-2.5 px-3">File Span (Start..End)</th>
                      <th className="py-2.5 px-3">Bytes</th>
                      <th className="py-2.5 px-3">Hits</th>
                      <th className="py-2.5 px-3">Density</th>
                      <th className="py-2.5 px-3">Stride Pattern</th>
                      <th className="py-2.5 px-3">Targets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {contextResult.trackB.clusters.map((c) => {
                      const isExpanded = expandedClusterId === c.clusterId;
                      const isFilterSelected = selectedClusterId === c.clusterId;

                      return (
                        <React.Fragment key={c.clusterId}>
                          <tr
                            className={`hover:bg-zinc-900/40 cursor-pointer ${
                              isFilterSelected ? 'bg-indigo-950/30' : ''
                            }`}
                            onClick={() => {
                              setSelectedClusterId(isFilterSelected ? null : c.clusterId);
                            }}
                          >
                            <td className="py-2 px-3 font-semibold text-indigo-300 flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedClusterId(isExpanded ? null : c.clusterId);
                                }}
                                className="text-zinc-500 hover:text-zinc-300"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <span>{c.clusterId}</span>
                            </td>
                            <td className="py-2 px-3 text-zinc-400">
                              {c.sourceRegionId}
                            </td>
                            <td className="py-2 px-3 font-bold text-zinc-200">
                              {c.startOffsetHex}..{c.endOffsetHex}
                            </td>
                            <td className="py-2 px-3 text-zinc-400">
                              {c.byteSpan} B
                            </td>
                            <td className="py-2 px-3 text-cyan-300 font-bold">
                              {c.positionCount}
                            </td>
                            <td className="py-2 px-3 text-zinc-400">
                              {c.densityPercentage}%
                            </td>
                            <td className="py-2 px-3 font-semibold text-amber-300">
                              {c.strideDescription}
                            </td>
                            <td className="py-2 px-3 text-zinc-400">
                              {c.candidateCount}
                            </td>
                          </tr>

                          {/* Expanded Cluster Details */}
                          {isExpanded && (
                            <tr className="bg-zinc-900/30">
                              <td colSpan={8} className="p-3 text-xs space-y-2">
                                <div className="text-[11px] font-sans text-zinc-400">
                                  Physical hit offsets in this cluster:
                                </div>
                                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                                  {c.positionsHex.map((posHex, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300"
                                    >
                                      {posHex}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-[11px] font-sans text-zinc-400 pt-1">
                                  Start-offset deltas ({c.consecutiveDeltas.length}): [{c.consecutiveDeltas.join(', ')}] bytes
                                </div>
                                <div className="text-[11px] font-sans text-zinc-400 pt-1">
                                  Associated research targets ({c.candidateCount}):
                                </div>
                                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                                  {c.candidateIds.map((cid) => (
                                    <span
                                      key={cid}
                                      className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-amber-300"
                                    >
                                      {cid}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Physical Hit Context Inspector */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                  <span>Physical Occurrence Context Inspector</span>
                </h4>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Detailed inspection of individual physical hit locations and surrounding structural context.
                </p>
              </div>

              {selectedClusterId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-300">
                    Filtered to {selectedClusterId}
                  </span>
                  <button
                    onClick={() => setSelectedClusterId(null)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 underline font-sans"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search offset, value, or target..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[11px]">Shape:</span>
                <select
                  value={shapeFilter}
                  onChange={(e) => {
                    setShapeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                >
                  <option value="all">All Shapes</option>
                  <option value="whitelisted">Whitelisted Only</option>
                  <option value="multiple">Multiple Shapes (Ambiguous)</option>
                  <option value="negative">Negative Context (Rel32)</option>
                  <option value="unmatched">Unmatched Context</option>
                  <option value="mov-r32-imm32">MOV r32, imm32</option>
                  <option value="push-imm32">PUSH imm32</option>
                  <option value="moffs32-direct">MOFFS32 Direct</option>
                  <option value="accumulator-imm32">Accumulator ALU</option>
                  <option value="disp32-absolute">Absolute [disp32]</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[11px]">Cluster:</span>
                <select
                  value={clusterFilter}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'all' || v === 'clustered' || v === 'isolated') {
                      setClusterFilter(v);
                      setPage(1);
                    }
                  }}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                >
                  <option value="all">All (Clustered & Isolated)</option>
                  <option value="clustered">Clustered Only</option>
                  <option value="isolated">Isolated Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-[11px]">Region:</span>
                <select
                  value={regionFilter}
                  onChange={(e) => {
                    setRegionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 focus:outline-none"
                >
                  <option value="all">All Regions</option>
                  <option value="obj1">Object 1 (R-X)</option>
                  <option value="obj2">Object 2 (RW-)</option>
                  <option value="other">Other Regions</option>
                </select>
              </div>
            </div>

            {/* Position Table */}
            <div className="overflow-x-auto rounded border border-zinc-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Physical Offset</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-3">Matched Uint32</th>
                    <th className="py-2.5 px-3">Context Window [P-8..P+7]</th>
                    <th className="py-2.5 px-3">x86 Operand Shape (Obj 1 R-X)</th>
                    <th className="py-2.5 px-3">Spatial Cluster</th>
                    <th className="py-2.5 px-3">Matches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {pagedPositions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-zinc-500">
                        No physical hit positions match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    pagedPositions.map((pos) => {
                      const shape = pos.trackA_x86Shape;
                      const hasMultiple = pos.shapeStatus === 'multiple-whitelisted-shapes';

                      return (
                        <tr key={pos.sourceFileOffset} className="hover:bg-zinc-900/40">
                          <td className="py-2 px-3 font-bold text-zinc-200">
                            {pos.sourceFileOffsetHex}
                          </td>
                          <td className="py-2 px-3 text-zinc-400 text-[11px]">
                            {pos.sourceRegionId}
                          </td>
                          <td className="py-2 px-3 font-semibold text-amber-400">
                            {pos.matchedUint32Hex}
                          </td>
                          <td className="py-2 px-3 text-[10px] text-zinc-500 tracking-wider">
                            {pos.contextBytesHex}
                          </td>
                          <td className="py-2 px-3">
                            {shape ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                      shape.isWhitelistedShape
                                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                        : shape.isNegativeContext
                                        ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                                    }`}
                                  >
                                    {shape.mnemonicHint}
                                  </span>
                                  {hasMultiple && (
                                    <span className="text-[9px] px-1 rounded bg-sky-950 border border-sky-800 text-sky-300">
                                      {pos.matchingShapes.length} shapes
                                    </span>
                                  )}
                                </div>
                                {hasMultiple && (
                                  <div className="text-[9px] text-zinc-500 font-sans">
                                    Multiple valid candidate starts in [P-8..P-1]
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-500 font-sans italic">
                                Outside Object 1 R-X
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {pos.isClustered ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800 text-indigo-300">
                                {pos.clusterId}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500">
                                Isolated
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-bold text-sky-400">
                            {pos.logicalMatchesCount}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs font-mono pt-2">
                <span className="text-zinc-500">
                  Page {page} of {totalPages} ({filteredPositions.length} positions)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:text-zinc-600 disabled:cursor-not-allowed hover:bg-zinc-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:text-zinc-600 disabled:cursor-not-allowed hover:bg-zinc-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

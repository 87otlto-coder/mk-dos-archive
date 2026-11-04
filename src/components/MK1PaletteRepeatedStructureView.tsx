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
  Repeat,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteReferenceReconResult } from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import {
  MK1PaletteRepeatedStructureResult,
  ClusterStructuralSummary,
  RepeatedTargetGroupSummary,
} from '../games/mk1/research/paletteRepeatedStructureTypes';
import {
  createMK1CompactPaletteRepeatedStructureReconExport,
  executePaletteRepeatedStructureReconnaissance,
} from '../games/mk1/research/paletteRepeatedStructure';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';
import {
  getNegativeControlBadgeInfo,
  formatNegativeControlCount,
} from './negativeControlUiHelper';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport;
  reconResult: MK1PaletteReferenceReconResult;
  contextResult: MK1PaletteOccurrenceContextResult | null;
  repeatedStructureResult: MK1PaletteRepeatedStructureResult | null;
  setRepeatedStructureResult: (res: MK1PaletteRepeatedStructureResult | null) => void;
  isRepeatedStructureRunning: boolean;
  setIsRepeatedStructureRunning: (v: boolean) => void;
}

export function MK1PaletteRepeatedStructureView({
  source,
  report,
  reconResult,
  contextResult,
  repeatedStructureResult,
  setRepeatedStructureResult,
  isRepeatedStructureRunning,
  setIsRepeatedStructureRunning,
}: Props) {
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [lastError, setLastError] = useState<unknown | null>(null);
  const [lastOperationId, setLastOperationId] = useState<string | null>(null);

  // Active view tab inside 1E.2B.3
  const [activeSubTab, setActiveSubTab] = useState<'clusters' | 'groups' | 'controls'>('clusters');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [motifFilter, setMotifFilter] = useState<'all' | 'constant' | 'multi-delta' | 'no-motif'>('all');
  const [consensusFilter, setConsensusFilter] = useState<'all' | 'high-consensus' | 'other'>('all');
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const hasContextResult = !!contextResult && contextResult.status === 'SUCCESS';

  const handleRunRepeatedStructure = async () => {
    if (!contextResult) return;

    setLastError(null);
    setLastOperationId(null);
    setIsRepeatedStructureRunning(true);
    setProgressVal(0.05);
    setProgressMsg('Initializing repeated structural reconnaissance pipeline...');

    try {
      const res = await executePaletteRepeatedStructureReconnaissance(
        source,
        reconResult,
        contextResult,
        report.topology,
        {
          exePath: report.exePath,
          exeSize: report.exeSize,
          onProgress: (stage, prog) => {
            setProgressMsg(stage);
            setProgressVal(prog);
          },
        }
      );

      if (res.status === 'FAILED') {
        const failureErr = new Error(res.failureReason || 'Repeated structural reconnaissance failed.');
        setLastError(failureErr);
        setLastOperationId(res.metadata?.operationId || null);
      } else {
        setRepeatedStructureResult(res);
      }
    } catch (err: unknown) {
      setLastError(err);
      setLastOperationId(null);
    } finally {
      setIsRepeatedStructureRunning(false);
      setProgressMsg(null);
    }
  };

  const handleExportJson = () => {
    if (!repeatedStructureResult) return;

    const exportData = createMK1CompactPaletteRepeatedStructureReconExport(repeatedStructureResult);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_palette_repeated_structure_recon_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered clusters
  const filteredClusters = useMemo(() => {
    if (!repeatedStructureResult) return [];
    return repeatedStructureResult.clusterStructuralSummaries.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = c.clusterId.toLowerCase().includes(q);
        const matchRegion = c.sourceRegionId.toLowerCase().includes(q);
        const matchPos = c.positionsHex.some((p) => p.toLowerCase().includes(q));
        if (!matchId && !matchRegion && !matchPos) return false;
      }

      if (motifFilter === 'constant') {
        if (!c.primaryDeltaMotif || !c.primaryDeltaMotif.isConstantStride) return false;
      } else if (motifFilter === 'multi-delta') {
        if (!c.primaryDeltaMotif || c.primaryDeltaMotif.motifLength < 2) return false;
      } else if (motifFilter === 'no-motif') {
        if (c.primaryDeltaMotif) return false;
      }

      if (consensusFilter === 'high-consensus') {
        if (!c.structuralEvidenceFlags.includes('has-high-context-consensus')) return false;
      }

      return true;
    });
  }, [repeatedStructureResult, searchQuery, motifFilter, consensusFilter]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (!repeatedStructureResult) return [];
    return repeatedStructureResult.repeatedTargetGroupSummaries.filter((g) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = g.groupId.toLowerCase().includes(q);
        const matchCand = g.candidateId.toLowerCase().includes(q);
        const matchRegion = g.sourceRegionId.toLowerCase().includes(q);
        if (!matchId && !matchCand && !matchRegion) return false;
      }
      return true;
    });
  }, [repeatedStructureResult, searchQuery]);

  return (
    <div className="space-y-6" id="repeated-structure-view-root">
      {/* Axiom Banner */}
      <div className="bg-indigo-950/30 border border-indigo-800/60 rounded p-4 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold uppercase tracking-wider">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Milestone 1E.2B.3 — Repeated Structural Context Axiom</span>
        </div>
        <p className="text-zinc-300 leading-relaxed">
          <strong className="text-indigo-200">REPEATED STRUCTURAL CONTEXT != POINTER TABLE OR PALETTE RECORD.</strong>{' '}
          Demonstrates mechanical byte-level repetition patterns across three independent evidence tracks
          (Track A: Relative-Context Consensus, Track B: Delta-Motif Detection, Track C: Repeated-Block Comparison)
          without assigning semantic meaning or palette ownership.
        </p>
      </div>

      {/* Prerequisite Check */}
      {!hasContextResult && (
        <div className="bg-amber-950/30 border border-amber-800/60 rounded p-4 text-xs font-mono space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Pass 1E.2B.2 Context Reconnaissance Required</span>
          </div>
          <p className="text-zinc-300">
            Repeated structural context reconnaissance strictly consumes verified physical clusters and classified
            contexts from Pass 1E.2B.2. Please run Pass 1E.2B.2 in the Occurrence Context tab first.
          </p>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="run-repeated-structure-btn"
            disabled={!hasContextResult || isRepeatedStructureRunning}
            onClick={handleRunRepeatedStructure}
            className={`px-4 py-2 rounded text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
              !hasContextResult || isRepeatedStructureRunning
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400'
            }`}
          >
            <Repeat className={`w-4 h-4 ${isRepeatedStructureRunning ? 'animate-spin' : ''}`} />
            <span>
              {isRepeatedStructureRunning
                ? 'Analyzing Repeated Structures...'
                : repeatedStructureResult
                ? 'Re-analyze Repeated Structures (1E.2B.3)'
                : 'Analyze Repeated Structural Context (1E.2B.3)'}
            </span>
          </button>

          {repeatedStructureResult && (
            <button
              id="export-repeated-structure-json-btn"
              onClick={handleExportJson}
              className="px-3 py-2 rounded text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download mk1_palette_repeated_structure_recon_v1 JSON"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export Compact JSON</span>
            </button>
          )}
        </div>

        {repeatedStructureResult && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className={`px-2 py-0.5 rounded border ${
                repeatedStructureResult.status === 'SUCCESS'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-800 text-amber-300'
              }`}
            >
              STATUS: {repeatedStructureResult.status}
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">
              Duration: {repeatedStructureResult.metadata.durationMs}ms
            </span>
          </div>
        )}
      </div>

      {/* Progress / Error */}
      {progressMsg && (
        <div className="bg-zinc-900 border border-indigo-800/50 rounded p-4 font-mono text-xs space-y-2">
          <div className="flex justify-between text-indigo-400">
            <span>{progressMsg}</span>
            <span>{Math.round(progressVal * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progressVal * 100)}%` }}
            />
          </div>
        </div>
      )}

      {lastError && (
        <AnalysisFailurePanel
          title="Repeated Structural Reconnaissance Failed"
          error={lastError}
          operationId={lastOperationId || undefined}
          subsystem="research-mk1"
          operation="palette-repeated-structure"
          currentGame="mk1"
          context={{
            exePath: report.exePath,
            exeSize: report.exeSize,
            milestone: '1E.2B.3',
          }}
          onRetry={handleRunRepeatedStructure}
        />
      )}

      {/* Results View */}
      {repeatedStructureResult && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">B.2 Clusters</span>
              <div className="text-lg font-semibold text-zinc-100 mt-0.5">
                {repeatedStructureResult.globalStructuralSummary.b2ClustersProcessed}
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">100% processed</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Repeating Motifs</span>
              <div className="text-lg font-semibold text-indigo-400 mt-0.5">
                {repeatedStructureResult.globalStructuralSummary.clustersWithRepeatingDeltaMotif}
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">
                {repeatedStructureResult.globalStructuralSummary.clustersWithConstantDeltaMotif} const /{' '}
                {repeatedStructureResult.globalStructuralSummary.clustersWithMultiDeltaMotif} multi
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">No Repeating Motif</span>
              <div className="text-lg font-semibold text-zinc-300 mt-0.5">
                {repeatedStructureResult.globalStructuralSummary.clustersWithNoRepeatingMotif}
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">irregular deltas</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">High Consensus</span>
              <div className="text-lg font-semibold text-sky-400 mt-0.5">
                {repeatedStructureResult.globalStructuralSummary.clustersWithHighContextConsensus}
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">sim &gt;= 0.75</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Cycle Blocks</span>
              <div className="text-lg font-semibold text-amber-400 mt-0.5">
                {repeatedStructureResult.globalStructuralSummary.repeatedCycleBlocksCompared}
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">cap &le; 256 bytes</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Repeated Groups</span>
              <div className="text-lg font-semibold text-purple-400 mt-0.5">
                {repeatedStructureResult.globalStructuralSummary.repeatedTargetGroupsDerived}
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">&ge; 3 occurrences</span>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex border-b border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('clusters')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'clusters'
                  ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>B.2 Physical Clusters ({repeatedStructureResult.clusterStructuralSummaries.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('groups')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'groups'
                  ? 'border-purple-500 text-purple-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Repeated-Target Groups ({repeatedStructureResult.repeatedTargetGroupSummaries.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('controls')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'controls'
                  ? 'border-emerald-500 text-emerald-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Controls & Strict Reconciliation</span>
            </button>
          </div>

          {/* TAB 1: B.2 PHYSICAL CLUSTERS */}
          {activeSubTab === 'clusters' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-3 bg-zinc-900 border border-zinc-800 rounded p-3 text-xs font-mono">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search cluster ID, region, offset..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-zinc-200 w-full focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Motif:</span>
                  <select
                    value={motifFilter}
                    onChange={(e) =>
                      setMotifFilter(e.target.value as 'all' | 'constant' | 'multi-delta' | 'no-motif')
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
                  >
                    <option value="all">All Motifs</option>
                    <option value="constant">Constant Stride</option>
                    <option value="multi-delta">Multi-Delta Repeating</option>
                    <option value="no-motif">No Repeating Motif</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Consensus:</span>
                  <select
                    value={consensusFilter}
                    onChange={(e) =>
                      setConsensusFilter(e.target.value as 'all' | 'high-consensus' | 'other')
                    }
                    className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-200"
                  >
                    <option value="all">All Consensus</option>
                    <option value="high-consensus">High Consensus (&ge; 0.75)</option>
                  </select>
                </div>
              </div>

              {/* Cluster List */}
              <div className="border border-zinc-800 rounded overflow-hidden divide-y divide-zinc-800/60 font-mono text-xs">
                {filteredClusters.map((cluster) => {
                  const isExpanded = expandedClusterId === cluster.clusterId;
                  const motif = cluster.primaryDeltaMotif;
                  const consensus = cluster.normalizedContextConsensus;
                  const blockComp = cluster.repeatedBlockComparison;

                  return (
                    <div key={cluster.clusterId} className="bg-zinc-900/60 hover:bg-zinc-900 transition-colors">
                      <div
                        onClick={() => setExpandedClusterId(isExpanded ? null : cluster.clusterId)}
                        className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <button className="text-zinc-500 hover:text-zinc-300">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-200">{cluster.clusterId}</span>
                              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px] border border-zinc-700">
                                {cluster.sourceRegionId}
                              </span>
                              <span className="text-zinc-500 text-[11px]">
                                {cluster.startOffsetHex}..{cluster.endOffsetHex}
                              </span>
                            </div>
                            <div className="text-zinc-400 text-[11px] mt-0.5">
                              {cluster.positionCount} positions | {cluster.logicalMatchCount} logical hits | deltas:{' '}
                              [{cluster.deltaSequence.join(', ')}]
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {motif ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border ${
                                motif.isConstantStride
                                  ? 'bg-indigo-950/70 border-indigo-800 text-indigo-300'
                                  : 'bg-purple-950/70 border-purple-800 text-purple-300'
                              }`}
                            >
                              motif [{motif.motifDeltas.join(',')}] &times; {motif.cycleCount} cyc (span {motif.cycleSpan}B)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800/80 border border-zinc-700 text-zinc-400">
                              no repeating motif
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] border ${
                              consensus.similarity.meanPairwiseSimilarity >= 0.75
                                ? 'bg-sky-950/70 border-sky-800 text-sky-300'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            sim {(consensus.similarity.meanPairwiseSimilarity * 100).toFixed(0)}%
                          </span>

                          {blockComp.performed && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950/70 border border-amber-800 text-amber-300">
                              block match {(blockComp.consensus?.identicalBytePercentage ?? 0).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Cluster Details */}
                      {isExpanded && (
                        <div className="p-4 bg-black/40 border-t border-zinc-800 space-y-4">
                          {/* Evidence Flags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-zinc-500 text-[11px]">Evidence Flags:</span>
                            {cluster.structuralEvidenceFlags.map((flag) => (
                              <span
                                key={flag}
                                className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px]"
                              >
                                {flag}
                              </span>
                            ))}
                          </div>

                          {/* Track A: Normalized Context */}
                          <div className="bg-zinc-900/80 border border-zinc-800 rounded p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-zinc-300">
                              <span>Track A — Relative Context Consensus (±32 bytes around matched field)</span>
                              <span className="text-zinc-500 font-normal">
                                Stable before: {consensus.stableBeforeRunLength}B | Stable after: {consensus.stableAfterRunLength}B
                              </span>
                            </div>
                            <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5 font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-nowrap">
                              <span className="text-zinc-500">sig: </span>
                              {consensus.contextSignature}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex gap-4">
                              <span>Pairwise Sim Min: {consensus.similarity.minimumPairwiseSimilarity}</span>
                              <span>Max: {consensus.similarity.maximumPairwiseSimilarity}</span>
                              <span>Mean: {consensus.similarity.meanPairwiseSimilarity}</span>
                              <span>Boundary Cross: {consensus.contextCrossesRegionBoundary ? 'YES' : 'NO'}</span>
                            </div>
                          </div>

                          {/* Track B: Repeating Delta Motif */}
                          <div className="bg-zinc-900/80 border border-zinc-800 rounded p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-zinc-300">
                              <span>Track B — Repeating Delta Motif</span>
                              <span className="text-zinc-500 font-normal">
                                {motif ? `${motif.coveragePercentage}% delta coverage` : 'None detected'}
                              </span>
                            </div>
                            {motif ? (
                              <div className="text-[11px] text-zinc-300 space-y-1">
                                <div>
                                  <span className="text-zinc-500">Motif deltas: </span>
                                  <span className="text-indigo-300 font-semibold">[{motif.motifDeltas.join(', ')}]</span> |{' '}
                                  <span className="text-zinc-500">Cycle span: </span>
                                  <span className="text-indigo-300 font-semibold">{motif.cycleSpan} bytes</span> |{' '}
                                  <span className="text-zinc-500">Complete cycles: </span>
                                  <span className="text-indigo-300 font-semibold">{motif.cycleCount}</span>
                                </div>
                                <div className="text-zinc-400">
                                  Cycle anchors: [{motif.anchorPositionsHex.join(', ')}]
                                </div>
                              </div>
                            ) : (
                              <div className="text-zinc-500 text-[11px]">
                                No delta sequence repeating with 2 or more complete cycles for motif lengths 1..4.
                              </div>
                            )}
                          </div>

                          {/* Track C: Repeated-Block Comparison */}
                          <div className="bg-zinc-900/80 border border-zinc-800 rounded p-3 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-zinc-300">
                              <span>Track C — Repeated Block Comparison</span>
                              <span className="text-zinc-500 font-normal">
                                {blockComp.performed ? `${blockComp.blockCount} blocks &times; ${blockComp.blockLength}B` : blockComp.notPerformedReason}
                              </span>
                            </div>

                            {blockComp.performed && blockComp.consensus && (
                              <div className="space-y-2 text-[11px]">
                                <div className="flex gap-4 text-zinc-300">
                                  <span>Identical bytes (raw): {blockComp.consensus.identicalByteCount}/{blockComp.consensus.blockLength} ({blockComp.consensus.identicalBytePercentage}%)</span>
                                  <span>Variable bytes: {blockComp.consensus.variableByteCount}</span>
                                  <span>Stable runs: {blockComp.consensus.stableRuns.length}</span>
                                </div>

                                {blockComp.contextOnlyConsensus && blockComp.contextOnlyConsensus.performed && (
                                  <div className="p-2 rounded bg-zinc-950/70 border border-zinc-800 space-y-1">
                                    <div className="flex justify-between items-center text-zinc-300">
                                      <span className="font-semibold text-emerald-400">Context-Only Consensus (Excluding Matched Field Slots):</span>
                                      <span className="text-emerald-300 font-mono font-semibold">{blockComp.contextOnlyConsensus.identicalContextBytePercentage}% match</span>
                                    </div>
                                    <div className="flex gap-4 text-zinc-400 text-[10px]">
                                      <span>Excluded matched bytes: {blockComp.contextOnlyConsensus.excludedMatchedByteCount}B</span>
                                      <span>Comparable context: {blockComp.contextOnlyConsensus.comparableContextByteCount}B</span>
                                      <span>Identical context: {blockComp.contextOnlyConsensus.identicalContextByteCount}B</span>
                                      <span>Variable context: {blockComp.contextOnlyConsensus.variableContextByteCount}B</span>
                                    </div>
                                  </div>
                                )}

                                {/* Slot stability across cycles */}
                                <div className="mt-2 space-y-1">
                                  <span className="text-zinc-400 font-semibold block">Occurrence Slot Stability across Cycles:</span>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border border-zinc-800 text-[10px]">
                                      <thead className="bg-zinc-950 text-zinc-400">
                                        <tr>
                                          <th className="p-1.5 border-b border-zinc-800">Slot</th>
                                          <th className="p-1.5 border-b border-zinc-800">Rel Offset</th>
                                          <th className="p-1.5 border-b border-zinc-800">Candidate Stability</th>
                                          <th className="p-1.5 border-b border-zinc-800">Representation</th>
                                          <th className="p-1.5 border-b border-zinc-800">Target Value</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-800/40">
                                        {blockComp.slotStability.map((slot) => (
                                          <tr key={slot.slotIndex}>
                                            <td className="p-1.5 font-semibold text-zinc-200">Slot {slot.slotIndex}</td>
                                            <td className="p-1.5 text-zinc-300">+{slot.relativeOffsetInCycle}B</td>
                                            <td className="p-1.5">
                                              <span
                                                className={`px-1.5 py-0.2 rounded border ${
                                                  slot.targetCandidateStable
                                                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                                    : 'bg-amber-950/60 border-amber-800 text-amber-300'
                                                }`}
                                              >
                                                {slot.targetCandidateStable ? 'STABLE' : 'VARIABLE'} ({slot.distinctCandidateIds.length} cand)
                                              </span>
                                            </td>
                                            <td className="p-1.5 text-zinc-400">{slot.distinctRepresentationKinds.join(', ')}</td>
                                            <td className="p-1.5 text-zinc-400">{slot.distinctTargetValuesHex.join(', ')}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: REPEATED-TARGET GROUPS */}
          {activeSubTab === 'groups' && (
            <div className="space-y-4">
              <div className="text-xs font-mono text-zinc-400">
                Secondary population: Candidate representations with &ge; 3 external physical occurrences across the executable,
                even when those positions do NOT all fall within a single 64-byte local cluster.
              </div>

              <div className="border border-zinc-800 rounded overflow-hidden divide-y divide-zinc-800/60 font-mono text-xs">
                {filteredGroups.map((group) => {
                  const isExpanded = expandedGroupId === group.groupId;
                  const motif = group.primaryDeltaMotif;
                  const consensus = group.normalizedContextConsensus;

                  return (
                    <div key={group.groupId} className="bg-zinc-900/60 hover:bg-zinc-900 transition-colors">
                      <div
                        onClick={() => setExpandedGroupId(isExpanded ? null : group.groupId)}
                        className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <button className="text-zinc-500 hover:text-zinc-300">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-purple-300">{group.candidateId}</span>
                              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px] border border-zinc-700">
                                {group.representationKind}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px] border border-zinc-700">
                                {group.sourceRegionId}
                              </span>
                            </div>
                            <div className="text-zinc-400 text-[11px] mt-0.5">
                              {group.physicalOccurrenceCount} positions | member of clusters: [{group.clusterMemberships.join(', ') || 'none'}]
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {motif ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/70 border border-purple-800 text-purple-300">
                              motif [{motif.motifDeltas.join(',')}] &times; {motif.cycleCount} cyc
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400">
                              no motif
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950/70 border border-sky-800 text-sky-300">
                            sim {(consensus.similarity.meanPairwiseSimilarity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-black/40 border-t border-zinc-800 space-y-3 text-[11px]">
                          <div>
                            <span className="text-zinc-500">Positions: </span>
                            <span className="text-zinc-300">{group.positionsHex.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Deltas: </span>
                            <span className="text-zinc-300">[{group.deltaSequence.join(', ')}]</span>
                          </div>
                          <div>
                            <span className="text-zinc-500">Context Signature: </span>
                            <span className="text-zinc-300">{consensus.contextSignature}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CONTROLS & STRICT RECONCILIATION */}
          {activeSubTab === 'controls' && (
            <div className="space-y-6">
              {/* Strict Reconciliation Checklist */}
              <div className="bg-zinc-900 border border-zinc-800 rounded p-4 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Strict Structural Reconciliation Audit</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] border ${
                      repeatedStructureResult.reconciliation.allReconciled
                        ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950 border-rose-800 text-rose-300'
                    }`}
                  >
                    {repeatedStructureResult.reconciliation.allReconciled ? 'ALL RECONCILED' : 'RECONCILIATION FAILED'}
                  </span>
                </div>

                <div className="space-y-2 text-[11px] pt-1">
                  <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <span className="text-zinc-300">B.2 Physical Clusters Input vs Processed</span>
                    <span className="text-emerald-400 font-semibold">
                      {repeatedStructureResult.reconciliation.b3ClustersProcessed} /{' '}
                      {repeatedStructureResult.reconciliation.b2ClusterInputCount} (100%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <span className="text-zinc-300">Clustered Physical Positions Accounted For</span>
                    <span className="text-emerald-400 font-semibold">
                      {repeatedStructureResult.reconciliation.b3ClusteredPhysicalPositionsReferenced} /{' '}
                      {repeatedStructureResult.reconciliation.b2ClusteredPhysicalPositions} (100%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <span className="text-zinc-300">B.1 Position Integrity (Clusters)</span>
                    <span
                      className={
                        repeatedStructureResult.reconciliation.allClusterPositionsResolveToB1
                          ? 'text-emerald-400 font-semibold'
                          : 'text-rose-400 font-semibold'
                      }
                    >
                      {repeatedStructureResult.reconciliation.clusterPositionsWithB1Evidence} /{' '}
                      {repeatedStructureResult.reconciliation.b3ClusteredPhysicalPositionsReferenced} (
                      {repeatedStructureResult.reconciliation.allClusterPositionsResolveToB1
                        ? '100% RESOLVED'
                        : 'FAILED'}
                      )
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <span className="text-zinc-300">Repeated-Target Groups Processed</span>
                    <span className="text-emerald-400 font-semibold">
                      {repeatedStructureResult.reconciliation.repeatedTargetGroupsProcessed} /{' '}
                      {repeatedStructureResult.reconciliation.repeatedTargetEligibleGroupCount} (100%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <span className="text-zinc-300">B.1 Position Integrity (Repeated-Target Groups)</span>
                    <span
                      className={
                        repeatedStructureResult.reconciliation.allRepeatedTargetGroupPositionsResolveToB1
                          ? 'text-emerald-400 font-semibold'
                          : 'text-rose-400 font-semibold'
                      }
                    >
                      {repeatedStructureResult.reconciliation.allRepeatedTargetGroupPositionsResolveToB1
                        ? '100% RESOLVED'
                        : 'FAILED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Negative Control */}
              <div className="bg-zinc-900 border border-zinc-800 rounded p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Negative Control Verification</span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] ${
                      getNegativeControlBadgeInfo(
                        repeatedStructureResult.negativeControlSummary.B3RepeatedContextStatus
                      ).className
                    }`}
                  >
                    {
                      getNegativeControlBadgeInfo(
                        repeatedStructureResult.negativeControlSummary.B3RepeatedContextStatus
                      ).label
                    }
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  <div>
                    <span className="text-zinc-500">Candidate: </span>
                    <span className="text-zinc-300">{repeatedStructureResult.negativeControlSummary.candidateId}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">B.1 Occurrences: </span>
                    <span
                      className={
                        repeatedStructureResult.negativeControlSummary.B1OccurrenceCount === null
                          ? 'text-amber-400'
                          : 'text-zinc-200'
                      }
                    >
                      {formatNegativeControlCount(
                        repeatedStructureResult.negativeControlSummary.B1OccurrenceCount
                      )}
                    </span>{' '}
                    | <span className="text-zinc-500">B.2 Contexts: </span>
                    <span
                      className={
                        repeatedStructureResult.negativeControlSummary.B2ContextCount === null
                          ? 'text-amber-400'
                          : 'text-zinc-200'
                      }
                    >
                      {formatNegativeControlCount(
                        repeatedStructureResult.negativeControlSummary.B2ContextCount
                      )}
                    </span>{' '}
                    | <span className="text-zinc-500">Status: </span>
                    <span className="text-zinc-300">{repeatedStructureResult.negativeControlSummary.B3RepeatedContextStatus}</span>
                  </div>
                  <div className="text-zinc-500 text-[10px] mt-1 italic">
                    {repeatedStructureResult.negativeControlSummary.notes}
                  </div>
                </div>
              </div>

              {/* Known Anchors */}
              <div className="bg-zinc-900 border border-zinc-800 rounded p-4 font-mono text-xs space-y-3">
                <span className="font-semibold text-zinc-200">Known Anchors Context Correlation (Authoritative B.1 Controls)</span>
                <div className="divide-y divide-zinc-800 border border-zinc-800 rounded overflow-hidden">
                  {repeatedStructureResult.knownAnchorControlSummary.map((anchor) => (
                    <div key={anchor.controlName || anchor.name} className="p-2.5 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-zinc-200 font-semibold">{anchor.controlName || anchor.name}</span>
                        <span className="text-zinc-500 ml-2 font-mono">{anchor.targetOffsetHex || anchor.physicalOffsetHex}</span>
                        <span className="text-zinc-400 ml-2 text-[10px]">
                          ({anchor.occurrenceCount ?? anchor.occurrencePositions?.length ?? 0} occurrence
                          {(anchor.occurrenceCount ?? anchor.occurrencePositions?.length ?? 0) === 1 ? '' : 's'})
                        </span>
                      </div>
                      <div>
                        {anchor.hasRepeatedStructuralContext ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px]">
                            Clusters: [{anchor.participatingClusterIds.join(', ')}]
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[10px]">no participating clusters</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

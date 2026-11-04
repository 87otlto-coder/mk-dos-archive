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
  Share2,
} from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteReferenceReconResult } from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from '../games/mk1/research/paletteRepeatedStructureTypes';
import {
  MK1PaletteCycleLayoutResult,
  PhysicalCyclePopulation,
  CrossPopulationCandidateGroup,
  TestedPeriodCandidate,
} from '../games/mk1/research/paletteCycleLayoutTypes';
import {
  createMK1CompactPaletteCycleLayoutReconExport,
  executePaletteCycleLayoutReconnaissance,
} from '../games/mk1/research/paletteCycleLayout';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport;
  reconResult: MK1PaletteReferenceReconResult;
  contextResult: MK1PaletteOccurrenceContextResult | null;
  repeatedStructureResult: MK1PaletteRepeatedStructureResult | null;
  cycleLayoutResult: MK1PaletteCycleLayoutResult | null;
  setCycleLayoutResult: (res: MK1PaletteCycleLayoutResult | null) => void;
  isCycleLayoutRunning: boolean;
  setIsCycleLayoutRunning: (v: boolean) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function MK1PaletteCycleLayoutView({
  source,
  report,
  reconResult,
  contextResult,
  repeatedStructureResult,
  cycleLayoutResult,
  setCycleLayoutResult,
  isCycleLayoutRunning,
  setIsCycleLayoutRunning,
  onNavigateToTab,
}: Props) {
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [failureState, setFailureState] = useState<{
    error: unknown;
    operationId?: string;
    fixture?: {
      exePath: string;
      exeSize: number;
    };
  } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'populations' | 'crosspop' | 'controls'>('populations');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPopulationId, setSelectedPopulationId] = useState<string | null>(null);
  const [selectedCrossGroupId, setSelectedCrossGroupId] = useState<string | null>(null);
  const [selectedPeriodMap, setSelectedPeriodMap] = useState<Record<string, number>>({});

  const handleRunAnalysis = async () => {
    if (!contextResult || !repeatedStructureResult) return;
    setIsCycleLayoutRunning(true);
    setProgressMsg('Initializing cycle layout reconnaissance...');
    setProgressVal(0.02);
    setFailureState(null);

    try {
      const res = await executePaletteCycleLayoutReconnaissance(
        source,
        report,
        reconResult,
        contextResult,
        repeatedStructureResult,
        {
          onProgress: (stage, progress) => {
            setProgressMsg(stage);
            setProgressVal(progress);
          },
        }
      );

      if (res.status === 'FAILED') {
        setCycleLayoutResult(null);
        setFailureState({
          error: new Error(res.failureReason || 'Cycle-Internal Layout Reconnaissance Failed'),
          operationId: res.metadata.operationId,
          fixture: res.fixture,
        });
        return;
      }

      setCycleLayoutResult(res);
      if (res.physicalCyclePopulations.length > 0) {
        setSelectedPopulationId(res.physicalCyclePopulations[0].populationId);
      }
    } catch (err: unknown) {
      setCycleLayoutResult(null);
      setFailureState({
        error: err,
        fixture: { exePath: report.exePath, exeSize: report.exeSize },
      });
    } finally {
      setIsCycleLayoutRunning(false);
      setProgressMsg(null);
      setProgressVal(0);
    }
  };

  const handleExportJson = () => {
    if (!cycleLayoutResult) return;
    const compactExport = createMK1CompactPaletteCycleLayoutReconExport(cycleLayoutResult);
    const jsonStr = JSON.stringify(compactExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mk1_palette_cycle_layout_recon_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredPopulations = useMemo(() => {
    if (!cycleLayoutResult) return [];
    if (!searchTerm.trim()) return cycleLayoutResult.physicalCyclePopulations;
    const q = searchTerm.toLowerCase();
    return cycleLayoutResult.physicalCyclePopulations.filter(
      (p) =>
        p.populationId.toLowerCase().includes(q) ||
        p.sourceRegionId.toLowerCase().includes(q) ||
        p.candidateIds.some((c) => c.toLowerCase().includes(q)) ||
        p.sourceClusterIds.some((c) => c.toLowerCase().includes(q)) ||
        p.sourceRepeatedTargetGroupIds.some((g) => g.toLowerCase().includes(q))
    );
  }, [cycleLayoutResult, searchTerm]);

  const filteredCrossGroups = useMemo(() => {
    if (!cycleLayoutResult) return [];
    if (!searchTerm.trim()) return cycleLayoutResult.crossPopulationCandidateGroups;
    const q = searchTerm.toLowerCase();
    return cycleLayoutResult.crossPopulationCandidateGroups.filter(
      (g) =>
        g.groupId.toLowerCase().includes(q) ||
        g.candidateId.toLowerCase().includes(q) ||
        g.representationKind.toLowerCase().includes(q) ||
        g.sourceRegionIds.some((r) => r.toLowerCase().includes(q)) ||
        g.populationIds.some((p) => p.toLowerCase().includes(q))
    );
  }, [cycleLayoutResult, searchTerm]);

  // Prerequisite check
  const hasUpstreamResults =
    reconResult.status === 'SUCCESS' &&
    contextResult?.status === 'SUCCESS' &&
    repeatedStructureResult?.status === 'SUCCESS';

  if (!hasUpstreamResults) {
    return (
      <div id="cycle-layout-prereq-missing" className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg text-slate-300">
        <div className="flex items-center gap-3 mb-3 text-amber-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold text-white">Upstream Evidence Required</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Pass 1E.2B.4 requires completed, reconciled in-memory results from Pass 1E.2B.1 (Reference Recon),
          Pass 1E.2B.2 (Context Extraction), and Pass 1E.2B.3 (Repeated Structure Recon).
        </p>
        {onNavigateToTab && (
          <button
            id="nav-to-repeated-structure-btn"
            onClick={() => onNavigateToTab('repeated_structure')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors"
          >
            Go to Pass 1E.2B.3 (Repeated Structure)
          </button>
        )}
      </div>
    );
  }

  if (failureState) {
    return (
      <AnalysisFailurePanel
        title="Cycle-Internal Layout Reconnaissance Failed"
        error={failureState.error}
        operationId={failureState.operationId}
        onRetry={handleRunAnalysis}
        currentGame="MK1"
        subsystem="research-mk1"
        operation="palette-cycle-layout"
        context={{
          exePath: failureState.fixture?.exePath ?? report.exePath,
          exeSize: failureState.fixture?.exeSize ?? report.exeSize,
          milestone: '1E.2B.4',
        }}
      />
    );
  }

  return (
    <div id="mk1-palette-cycle-layout-view" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-wide">
              Cycle-Internal Layout Reconnaissance (Pass 1E.2B.4)
            </h2>
            {cycleLayoutResult?.reconciliation?.allReconciled && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Reconciled
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Subunit periodicity testing on proper cycle divisors [2..32], dual-view byte lane consensus
            (all-B.1-masked context vs. raw), B.1 lane occupancy, and cross-population structural convergence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {cycleLayoutResult && (
            <button
              id="export-cycle-layout-json-btn"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          )}

          <button
            id="run-cycle-layout-btn"
            disabled={isCycleLayoutRunning}
            onClick={handleRunAnalysis}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
              isCycleLayoutRunning
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Repeat className={`w-4 h-4 ${isCycleLayoutRunning ? 'animate-spin' : ''}`} />
            {isCycleLayoutRunning
              ? 'Analyzing...'
              : cycleLayoutResult
              ? 'Re-analyze Cycles'
              : 'Analyze Cycle Layout'}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isCycleLayoutRunning && (
        <div id="cycle-layout-progress-bar" className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{progressMsg || 'Processing...'}</span>
            <span>{Math.round(progressVal * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, Math.round(progressVal * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Global Summary Statistics */}
      {cycleLayoutResult && (
        <div id="cycle-layout-stats-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
            <div className="text-xs text-slate-400 font-medium">Physical Populations</div>
            <div className="text-xl font-bold text-white mt-1">
              {cycleLayoutResult.globalSummary.uniquePhysicalCyclePopulations}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              from {cycleLayoutResult.globalSummary.B3RepeatedPopulationsInput} B.3 sources
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
            <div className="text-xs text-slate-400 font-medium">Divisor Periods Tested</div>
            <div className="text-xl font-bold text-white mt-1">
              {cycleLayoutResult.globalSummary.totalPeriodCandidatesTested}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">proper divisors [2..32]</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
            <div className="text-xs text-slate-400 font-medium">Notable Periodicities</div>
            <div className="text-xl font-bold text-indigo-400 mt-1">
              {cycleLayoutResult.globalSummary.populationsWithAtLeastOneNotablePeriod}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">≥75% context agreement</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
            <div className="text-xs text-slate-400 font-medium">Repeated B.1 Lanes</div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {cycleLayoutResult.globalSummary.populationsWithRepeatedB1OccurrenceLane}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">multi-subunit lane occupancy</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
            <div className="text-xs text-slate-400 font-medium">Cross-Pop Groups</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {cycleLayoutResult.globalSummary.crossPopulationCandidateGroups}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">shared candidate & rep</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
            <div className="text-xs text-slate-400 font-medium">Shared Notable Periods</div>
            <div className="text-xl font-bold text-purple-400 mt-1">
              {cycleLayoutResult.globalSummary.crossPopulationGroupsWithSharedNotablePeriod}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">groups with mutual period</div>
          </div>
        </div>
      )}

      {/* Epistemic Axiom Banner */}
      <div className="bg-slate-900/40 border border-slate-800/80 px-4 py-3 rounded-lg text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Standing Discipline:</span> Period candidates are
          mathematical divisors of verified physical cycles, NOT confirmed record structures. Repeated B.1 lane
          occupancy identifies relative byte position consistency, NOT pointer fields. Cross-population similarity
          evaluates raw contextual alignment, NOT shared semantics.
        </div>
      </div>

      {cycleLayoutResult && (
        <div className="space-y-4">
          {/* Sub-tab selection */}
          <div className="flex border-b border-slate-800 gap-6">
            <button
              id="subtab-populations-btn"
              onClick={() => setActiveSubTab('populations')}
              className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeSubTab === 'populations'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Grid className="w-4 h-4" />
              Physical Populations ({cycleLayoutResult.physicalCyclePopulations.length})
            </button>

            <button
              id="subtab-crosspop-btn"
              onClick={() => setActiveSubTab('crosspop')}
              className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeSubTab === 'crosspop'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Cross-Population Groups ({cycleLayoutResult.crossPopulationCandidateGroups.length})
            </button>

            <button
              id="subtab-controls-btn"
              onClick={() => setActiveSubTab('controls')}
              className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeSubTab === 'controls'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Controls & Reconciliation
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              id="cycle-layout-search-input"
              type="text"
              placeholder={
                activeSubTab === 'populations'
                  ? 'Filter by population ID, region, candidate ID, cluster ID...'
                  : 'Filter by candidate ID, representation, region...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          {/* TAB 1: Physical Populations */}
          {activeSubTab === 'populations' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Populations List */}
              <div className="lg:col-span-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredPopulations.map((pop) => {
                  const isSelected = selectedPopulationId === pop.populationId;
                  const topPeriod = pop.topPeriodCandidates[0];

                  return (
                    <div
                      key={pop.populationId}
                      onClick={() => setSelectedPopulationId(pop.populationId)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{pop.populationId}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {pop.cycleSpan}B cycle
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {pop.cycleBlockCount} blocks
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                        <span>Region: <span className="text-slate-300 font-mono">{pop.sourceRegionId}</span></span>
                        {pop.sourceObjectNumber !== null && (
                          <span className="text-slate-400">Object {pop.sourceObjectNumber}</span>
                        )}
                      </div>

                      {pop.B3PrimaryMotif && (
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                          Motif: [{pop.B3PrimaryMotif.motifDeltas.join(', ')}]
                        </div>
                      )}

                      {/* Top Period indicator */}
                      {topPeriod && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">
                            Best Period: <strong className="text-indigo-300 font-mono">{topPeriod.periodBytes}B</strong> ({topPeriod.subunitsPerCycle} subunits)
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                              topPeriod.hasNotableContextPeriodicity
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {topPeriod.contextDominantAgreementPercentage.toFixed(1)}% agreement
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Population Detail Inspection */}
              <div className="lg:col-span-7">
                {(() => {
                  const pop = cycleLayoutResult.physicalCyclePopulations.find(
                    (p) => p.populationId === selectedPopulationId
                  );
                  if (!pop) {
                    return (
                      <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 border border-slate-800 rounded-xl">
                        Select a physical cycle population to inspect tested divisor periodicities.
                      </div>
                    );
                  }

                  const activePeriodBytes =
                    selectedPeriodMap[pop.populationId] ??
                    pop.topPeriodCandidates[0]?.periodBytes ??
                    pop.testedPeriods[0]?.periodBytes;

                  const currentPeriod = pop.testedPeriods.find((tp) => tp.periodBytes === activePeriodBytes);

                  return (
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-mono text-sm font-bold text-white">{pop.populationId}</h3>
                            <span className="text-xs text-slate-400 font-mono">
                              ({pop.cycleSpan}-byte cycle, {pop.cycleBlockCount} blocks)
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Region: <strong className="text-slate-300 font-mono">{pop.sourceRegionId}</strong> | Provenance: Clusters [{pop.sourceClusterIds.join(', ') || 'none'}], Groups [{pop.sourceRepeatedTargetGroupIds.join(', ') || 'none'}]
                          </div>
                        </div>

                        {pop.hasAnyNotablePeriod && (
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Notable Periodicity Found
                          </span>
                        )}
                      </div>

                      {/* Period Divisors Selector */}
                      <div>
                        <div className="text-xs font-semibold text-slate-300 mb-2">
                          Tested Cycle Divisor Periods [2..32]:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {pop.testedPeriods.map((tp) => {
                            const isPeriodSelected = tp.periodBytes === activePeriodBytes;
                            return (
                              <button
                                key={tp.periodBytes}
                                onClick={() =>
                                  setSelectedPeriodMap((prev) => ({
                                    ...prev,
                                    [pop.populationId]: tp.periodBytes,
                                  }))
                                }
                                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                                  isPeriodSelected
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : tp.hasNotableContextPeriodicity
                                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/40'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                              >
                                {tp.periodBytes}B ({tp.contextDominantAgreementPercentage.toFixed(0)}%)
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Current Period Metrics */}
                      {currentPeriod && (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                            <div>
                              <span className="text-slate-500 block">Subunits / Cycle:</span>
                              <strong className="text-white font-mono">{currentPeriod.subunitsPerCycle}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Total Subunits:</span>
                              <strong className="text-white font-mono">{currentPeriod.totalSubunits}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Context Agreement:</span>
                              <strong
                                className={`font-mono ${
                                  currentPeriod.hasNotableContextPeriodicity ? 'text-emerald-400' : 'text-slate-300'
                                }`}
                              >
                                {currentPeriod.contextDominantAgreementPercentage.toFixed(2)}%
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Stable Lanes:</span>
                              <strong className="text-white font-mono">
                                {currentPeriod.contextStableLaneCount} / {currentPeriod.periodBytes}
                              </strong>
                            </div>
                          </div>

                          {/* Track B Occurrence Lane Residues */}
                          <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg text-xs space-y-1.5">
                            <div className="font-semibold text-slate-300">
                              Track B: B.1 Occurrence Lane Occupancy
                            </div>
                            <div className="text-slate-400">
                              Primary Occurrence Slots mod {currentPeriod.periodBytes}: [
                              <span className="font-mono text-indigo-300">
                                {currentPeriod.primaryOccurrenceLaneResidues.join(', ')}
                              </span>
                              ] {currentPeriod.primaryOccurrencesShareSubunitLane && (
                                <strong className="text-emerald-400 ml-1">(Consistently occupies same lane!)</strong>
                              )}
                            </div>
                            <div className="text-slate-500 text-[11px]">
                              Occupied Lanes: {currentPeriod.b1OccurrenceDensity.numberOfOccupiedLanes} / {currentPeriod.periodBytes} ({currentPeriod.b1OccurrenceDensity.occupiedLanePercentage.toFixed(0)}%) | Most Occupied: Lane {currentPeriod.b1OccurrenceDensity.mostOccupiedLane ?? 'N/A'} ({currentPeriod.b1OccurrenceDensity.mostOccupiedLaneCount} occurrences)
                            </div>
                          </div>

                          {/* Lane Consensus Table */}
                          <div>
                            <div className="text-xs font-semibold text-slate-300 mb-2">
                              Byte Lane Consensus ({currentPeriod.periodBytes} lanes, {currentPeriod.totalSubunits} subunit samples per lane):
                            </div>
                            <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-slate-800 rounded-lg">
                              <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-slate-950 text-slate-400 sticky top-0">
                                  <tr>
                                    <th className="p-2">Lane</th>
                                    <th className="p-2">Dominant Byte</th>
                                    <th className="p-2">Context Count</th>
                                    <th className="p-2">Agreement %</th>
                                    <th className="p-2">Masked Samples</th>
                                    <th className="p-2">B.1 Occurrences</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                  {currentPeriod.contextLaneConsensus.map((lane) => {
                                    const occItem = currentPeriod.occurrenceLaneHistogram.find(
                                      (h) => h.laneOffset === lane.laneOffset
                                    );
                                    return (
                                      <tr key={lane.laneOffset} className="hover:bg-slate-800/30">
                                        <td className="p-2 font-bold text-slate-400">+{lane.laneOffset}</td>
                                        <td className="p-2">
                                          {lane.dominantByteHex ? (
                                            <span className="text-indigo-300">{lane.dominantByteHex}</span>
                                          ) : (
                                            <span className="text-slate-600">masked</span>
                                          )}
                                        </td>
                                        <td className="p-2">{lane.contributingByteCount}</td>
                                        <td className="p-2">
                                          <span
                                            className={
                                              lane.dominantBytePercentage >= 75
                                                ? 'text-emerald-400 font-bold'
                                                : 'text-slate-400'
                                            }
                                          >
                                            {lane.dominantBytePercentage.toFixed(1)}%
                                          </span>
                                        </td>
                                        <td className="p-2 text-slate-500">{lane.maskedContributionCount}</td>
                                        <td className="p-2">
                                          {occItem && occItem.uniquePhysicalOccurrenceCount > 0 ? (
                                            <span className="text-amber-400 font-bold">
                                              {occItem.uniquePhysicalOccurrenceCount} occ ({occItem.logicalAssociationCount} assoc)
                                            </span>
                                          ) : (
                                            <span className="text-slate-600">-</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 2: Cross-Population Comparison */}
          {activeSubTab === 'crosspop' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Evaluating candidates participating across multiple independent repeated cycle populations.
                Identifies whether recurring targets exhibit shared period divisors or localized byte context similarity.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Groups list */}
                <div className="lg:col-span-5 space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {filteredCrossGroups.map((grp) => {
                    const isSelected = selectedCrossGroupId === grp.groupId;

                    return (
                      <div
                        key={grp.groupId}
                        onClick={() => setSelectedCrossGroupId(grp.groupId)}
                        className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-white">{grp.groupId}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {grp.populationIds.length} populations
                          </span>
                        </div>

                        <div className="text-xs font-mono text-indigo-300 mt-1.5 truncate">
                          {grp.candidateId}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1">
                          Rep: <span className="font-mono text-slate-300">{grp.representationKind}</span>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                          <span>Spans: {grp.cycleSpans.join('B, ')}B</span>
                          {grp.sharedNotablePeriodCandidates.length > 0 ? (
                            <span className="text-emerald-400 font-mono">
                              Shared Period: {grp.sharedNotablePeriodCandidates.join(', ')}B
                            </span>
                          ) : (
                            <span className="text-slate-600">No shared notable period</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Group Details */}
                <div className="lg:col-span-7">
                  {(() => {
                    const grp = cycleLayoutResult.crossPopulationCandidateGroups.find(
                      (g) => g.groupId === selectedCrossGroupId
                    );
                    if (!grp) {
                      return (
                        <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 border border-slate-800 rounded-xl">
                          Select a cross-population group to inspect pairwise context alignment and shared periods.
                        </div>
                      );
                    }

                    return (
                      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
                        <div className="border-b border-slate-800 pb-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-mono text-sm font-bold text-white">{grp.groupId}</h3>
                            <span className="text-xs text-slate-400 font-mono">
                              {grp.populationIds.length} populations
                            </span>
                          </div>
                          <div className="text-xs font-mono text-indigo-300 mt-1">{grp.candidateId}</div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                          <div>
                            <span className="text-slate-500 block">Populations:</span>
                            <span className="font-mono text-slate-300">{grp.populationIds.join(', ')}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Cycle Spans:</span>
                            <span className="font-mono text-slate-300">{grp.cycleSpans.join('B, ')}B</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Same Cycle Span:</span>
                            <span className="font-mono text-slate-300">{grp.sameCycleSpan ? 'Yes' : 'No'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Shared Periods:</span>
                            <span className="font-mono text-indigo-300">
                              {grp.sharedPeriodCandidates.join(', ') || 'none'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Shared Notable (≥75%):</span>
                            <span className="font-mono text-emerald-400">
                              {grp.sharedNotablePeriodCandidates.join(', ') || 'none'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Same Motifs:</span>
                            <span className="font-mono text-slate-300">{grp.sameMotif ? 'Yes' : 'No'}</span>
                          </div>
                        </div>

                        {/* Pairwise Context Window Comparisons */}
                        <div>
                          <div className="text-xs font-semibold text-slate-300 mb-2">
                            Pairwise Context Window Alignment (16B before, 4B match masked, 16B after):
                          </div>

                          {grp.pairwisePopulationContextComparisons.length === 0 ? (
                            <div className="text-xs text-slate-500 p-3 bg-slate-950/40 rounded border border-slate-800">
                              No occurrence pairs available for comparison.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {grp.pairwisePopulationContextComparisons.map((pair, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-xs space-y-2"
                                >
                                  <div className="flex items-center justify-between font-mono">
                                    <span className="text-slate-300 font-bold">
                                      {pair.populationAId} ↔ {pair.populationBId}
                                    </span>
                                    <span className="text-slate-400">
                                      {pair.occurrencePairsCompared} pairs compared
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                                    <div>
                                      Min Sim: <strong className="text-slate-300">{(pair.minimumSimilarity * 100).toFixed(1)}%</strong>
                                    </div>
                                    <div>
                                      Mean Sim: <strong className="text-indigo-300">{(pair.meanSimilarity * 100).toFixed(1)}%</strong>
                                    </div>
                                    <div>
                                      Max Sim: <strong className="text-emerald-400">{(pair.maximumSimilarity * 100).toFixed(1)}%</strong>
                                    </div>
                                  </div>

                                  <div className="text-[11px] text-slate-400">
                                    Stable Relative Offsets ({pair.stableRelativeBytePositions.length}/32): [
                                    <span className="font-mono text-slate-300">
                                      {pair.stableRelativeBytePositions.join(', ') || 'none'}
                                    </span>
                                    ]
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Controls & Reconciliation */}
          {activeSubTab === 'controls' && (
            <div className="space-y-6">
              {/* Reconciliation Table */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-semibold text-sm text-white">Strict Reconciliation Accounting</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      cycleLayoutResult.reconciliation.allReconciled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {cycleLayoutResult.reconciliation.allReconciled ? 'ALL RECONCILED' : 'DISCREPANCIES DETECTED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400 font-semibold mb-1">Populations & Period Divisors:</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">B.3 Repeated Inputs:</span>
                      <span className="text-white">{cycleLayoutResult.reconciliation.b3EligibleRepeatedPopulationInputs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unique Physical Populations:</span>
                      <span className="text-white">{cycleLayoutResult.reconciliation.uniquePhysicalPopulationsDerived}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Duplicate Provenance Collapsed:</span>
                      <span className="text-white">{cycleLayoutResult.reconciliation.duplicateProvenanceLinksCollapsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Divisor Periods Tested:</span>
                      <span className="text-white">{cycleLayoutResult.reconciliation.periodCandidatesProcessed}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                    <div className="text-slate-400 font-semibold mb-1">B.1 Occurrences & Cross-Population:</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">B.1 Positions Considered:</span>
                      <span className="text-white">{cycleLayoutResult.reconciliation.b1OccurrencePositionsConsidered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">B.1 Positions Resolved:</span>
                      <span className="text-white">{cycleLayoutResult.reconciliation.b1OccurrencePositionsResolved}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cross-Population Groups:</span>
                      <span className="text-white">{cycleLayoutResult.reconciliation.crossPopulationGroupsProcessed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observational Negative Control */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-semibold text-sm text-white">Observational Negative Control</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                      cycleLayoutResult.negativeControlSummary.crossPopulationStatus ===
                      'not-applicable-no-occurrences'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : cycleLayoutResult.negativeControlSummary.crossPopulationStatus ===
                          'unavailable-upstream-uninspected'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {cycleLayoutResult.negativeControlSummary.crossPopulationStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1 font-mono">
                  <div>Candidate ID: <span className="text-indigo-300">{cycleLayoutResult.negativeControlSummary.candidateId}</span></div>
                  <div>B.1 Occurrences: <span className="text-white">{cycleLayoutResult.negativeControlSummary.B1OccurrenceCount !== null ? cycleLayoutResult.negativeControlSummary.B1OccurrenceCount : 'Unavailable'}</span></div>
                  <div>B.2 Contexts: <span className="text-white">{cycleLayoutResult.negativeControlSummary.B2ContextCount !== null ? cycleLayoutResult.negativeControlSummary.B2ContextCount : 'Unavailable'}</span></div>
                  <div className="text-slate-500 mt-2">{cycleLayoutResult.negativeControlSummary.notes}</div>
                </div>
              </div>

              {/* Known Anchor Controls */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-sm text-white border-b border-slate-800 pb-3">
                  Known Anchor Controls
                </h3>
                <div className="space-y-2">
                  {cycleLayoutResult.knownAnchorControlSummary.map((ctrl, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{ctrl.controlName}</span>
                        <span className="text-slate-400">{ctrl.targetOffsetHex}</span>
                      </div>
                      {(ctrl.totalLogicalMatches !== undefined || ctrl.uniquePhysicalOccurrences !== undefined) && (
                        <div className="text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          {ctrl.totalLogicalMatches !== undefined && (
                            <span>Logical Matches: {ctrl.totalLogicalMatches}</span>
                          )}
                          {ctrl.uniquePhysicalOccurrences !== undefined && (
                            <span>Physical: {ctrl.uniquePhysicalOccurrences}</span>
                          )}
                          {ctrl.externalOccurrences !== undefined && (
                            <span>External: {ctrl.externalOccurrences}</span>
                          )}
                          {ctrl.sourceRegionDistribution && Object.keys(ctrl.sourceRegionDistribution).length > 0 && (
                            <span>Regions: {JSON.stringify(ctrl.sourceRegionDistribution)}</span>
                          )}
                        </div>
                      )}
                      <div className="text-slate-500 mt-1">
                        Participating Physical Populations: {ctrl.participatingPhysicalPopulations.length > 0 ? (
                          ctrl.participatingPhysicalPopulations.map((p) => p.populationId).join(', ')
                        ) : (
                          'none (outside repeated cycle blocks)'
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

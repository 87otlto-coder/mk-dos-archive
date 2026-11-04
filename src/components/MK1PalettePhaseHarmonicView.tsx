import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
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
import { MK1PaletteCycleLayoutResult } from '../games/mk1/research/paletteCycleLayoutTypes';
import {
  MK1PalettePhaseHarmonicResult,
  PeriodPhaseAnalysis,
  PhysicalPopulationPhaseAnalysis,
} from '../games/mk1/research/palettePhaseHarmonicTypes';
import {
  createMK1CompactPalettePhaseHarmonicExport,
  executePalettePhaseHarmonicReconnaissance,
} from '../games/mk1/research/palettePhaseHarmonic';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport;
  reconResult: MK1PaletteReferenceReconResult;
  contextResult: MK1PaletteOccurrenceContextResult | null;
  repeatedStructureResult: MK1PaletteRepeatedStructureResult | null;
  cycleLayoutResult: MK1PaletteCycleLayoutResult | null;
  phaseHarmonicResult: MK1PalettePhaseHarmonicResult | null;
  setPhaseHarmonicResult: (res: MK1PalettePhaseHarmonicResult | null) => void;
  isPhaseHarmonicRunning: boolean;
  setIsPhaseHarmonicRunning: (v: boolean) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function MK1PalettePhaseHarmonicView({
  source,
  report,
  reconResult,
  contextResult,
  repeatedStructureResult,
  cycleLayoutResult,
  phaseHarmonicResult,
  setPhaseHarmonicResult,
  isPhaseHarmonicRunning,
  setIsPhaseHarmonicRunning,
  onNavigateToTab,
}: Props) {
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [failureState, setFailureState] = useState<{
    error: unknown;
    operationId?: string;
  } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'periods' | 'harmonics' | 'crosspop' | 'controls'>('periods');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPopId, setSelectedPopId] = useState<string>('all');
  const [filterGainOnly, setFilterGainOnly] = useState(false);
  const [expandedPeriodKey, setExpandedPeriodKey] = useState<string | null>(null);
  const [expandedHarmonicKey, setExpandedHarmonicKey] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (!contextResult || !repeatedStructureResult || !cycleLayoutResult) return;
    setIsPhaseHarmonicRunning(true);
    setProgressMsg('Initializing phase-aligned reconnaissance...');
    setProgressVal(0.02);
    setFailureState(null);

    try {
      const res = await executePalettePhaseHarmonicReconnaissance(
        source,
        report,
        reconResult,
        contextResult,
        repeatedStructureResult,
        cycleLayoutResult,
        {
          onProgress: (stage, progress) => {
            setProgressMsg(stage);
            setProgressVal(progress);
          },
        }
      );

      if (res.status === 'FAILED') {
        setFailureState({
          error: res.error ?? new Error(res.failureReason ?? 'Phase recurrence analysis failed'),
          operationId: res.metadata.operationId,
        });
      } else {
        setPhaseHarmonicResult(res);
      }
    } catch (err: unknown) {
      setFailureState({
        error: err,
      });
    } finally {
      setIsPhaseHarmonicRunning(false);
      setProgressMsg(null);
    }
  };

  const handleExportJson = () => {
    if (!phaseHarmonicResult) return;
    const compactExport = createMK1CompactPalettePhaseHarmonicExport(phaseHarmonicResult);
    const jsonStr = JSON.stringify(compactExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mk1_palette_phase_harmonic_recon_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Flatten periods across populations for easy table viewing
  const flattenedPeriods = useMemo(() => {
    if (!phaseHarmonicResult) return [];
    const items: Array<{
      population: PhysicalPopulationPhaseAnalysis;
      period: PeriodPhaseAnalysis;
      key: string;
    }> = [];

    for (const pop of phaseHarmonicResult.physicalPopulationPhaseAnalyses) {
      if (selectedPopId !== 'all' && pop.populationId !== selectedPopId) continue;
      for (const p of pop.periodPhaseAnalyses) {
        if (filterGainOnly && p.phaseAlignmentGainPercentagePoints <= 0) continue;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchPop = pop.populationId.toLowerCase().includes(term);
          const matchRegion = pop.sourceRegionId.toLowerCase().includes(term);
          const matchPeriod = `p${p.periodBytes}`.toLowerCase().includes(term);
          const matchSig = p.phaseSignatureSequence.join('').toLowerCase().includes(term);
          if (!matchPop && !matchRegion && !matchPeriod && !matchSig) continue;
        }
        items.push({
          population: pop,
          period: p,
          key: `${pop.populationId}_P${p.periodBytes}`,
        });
      }
    }
    return items;
  }, [phaseHarmonicResult, selectedPopId, filterGainOnly, searchTerm]);

  // Flatten harmonics
  const flattenedHarmonics = useMemo(() => {
    if (!phaseHarmonicResult) return [];
    const items: Array<{
      population: PhysicalPopulationPhaseAnalysis;
      harmonic: PhysicalPopulationPhaseAnalysis['harmonicRelationships'][number];
    }> = [];
    for (const pop of phaseHarmonicResult.physicalPopulationPhaseAnalyses) {
      if (selectedPopId !== 'all' && pop.populationId !== selectedPopId) continue;
      for (const h of pop.harmonicRelationships) {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchPop = pop.populationId.toLowerCase().includes(term);
          const matchPair = `p${h.lowerPeriodBytes} p${h.higherPeriodBytes}`.toLowerCase().includes(term);
          if (!matchPop && !matchPair) continue;
        }
        items.push({ population: pop, harmonic: h });
      }
    }
    return items;
  }, [phaseHarmonicResult, selectedPopId, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-lg bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Pass 1E.2B.5 — Phase-Aligned Subunit Recurrence
            </h3>
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              Harmonic Divisor Recon
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-mono">
            Compares identical cycle phase positions across complete repeated cycle blocks. Tests whether
            apparent subunit byte variation is phase-locked or random, and evaluates harmonic divisor relationships.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {phaseHarmonicResult && (
            <button
              onClick={handleExportJson}
              className="px-3 py-2 rounded text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              Export JSON
            </button>
          )}

          <button
            onClick={handleRunAnalysis}
            disabled={isPhaseHarmonicRunning || !cycleLayoutResult}
            className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              isPhaseHarmonicRunning || !cycleLayoutResult
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            }`}
          >
            {isPhaseHarmonicRunning ? (
              <>
                <Repeat className="w-4 h-4 animate-spin text-white" />
                Analyzing Phase Recurrence...
              </>
            ) : (
              <>
                <Repeat className="w-4 h-4 text-white" />
                {phaseHarmonicResult ? 'Re-analyze Phase Recurrence' : 'Analyze Phase Recurrence'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isPhaseHarmonicRunning && (
        <div className="p-4 rounded-lg bg-zinc-950 border border-indigo-900/50 space-y-2">
          <div className="flex justify-between text-xs text-indigo-300 font-mono">
            <span>{progressMsg || 'Processing...'}</span>
            <span>{Math.round(progressVal * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-200"
              style={{ width: `${Math.max(5, progressVal * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Failure State Display */}
      {failureState && (
        <AnalysisFailurePanel
          title="Phase Recurrence Analysis Failed"
          error={failureState.error}
          operationId={failureState.operationId}
          onRetry={handleRunAnalysis}
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-phase-harmonic"
          context={{
            exePath: report.exePath,
            exeSize: report.exeSize,
            milestone: '1E.2B.5d',
            ...(failureState.operationId ? { operationId: failureState.operationId } : {}),
          }}
        />
      )}

      {/* Global Summary Cards (Canonical B.5b Counters - Section 27) */}
      {phaseHarmonicResult && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 font-mono">
          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Physical Pops</div>
            <div className="text-lg font-bold text-zinc-100">
              {phaseHarmonicResult.globalSummary.physicalPopulationsAnalyzed}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">verified cycles</div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Strong Abs Recurrence</div>
            <div className="text-lg font-bold text-indigo-400">
              {phaseHarmonicResult.globalSummary.populationsWithStrongAbsoluteOffsetRecurrence}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">≥75% across cycles</div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Periods</div>
            <div className="text-lg font-bold text-zinc-100">
              {phaseHarmonicResult.globalSummary.periodCandidatesAnalyzed}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">tested divisors</div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Harmonic Pairs</div>
            <div className="text-lg font-bold text-cyan-400">
              {phaseHarmonicResult.globalSummary.harmonicRelationshipsAnalyzed}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">exact multiples</div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Confirmed Cross-H</div>
            <div className="text-lg font-bold text-emerald-400">
              {phaseHarmonicResult.globalSummary.harmonicRelationshipsWithCanonicalCrossHigherRecurrence ??
                phaseHarmonicResult.globalSummary.harmonicRelationshipsWithRoleConfirmedRecurrence}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">≥75% consensus</div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Reduced Recurrence</div>
            <div className="text-lg font-bold text-rose-400">
              {phaseHarmonicResult.globalSummary.harmonicRelationshipsWithRoleReducedRecurrence}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">&lt;75% consensus</div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Insufficient Evidence</div>
            <div className="text-lg font-bold text-amber-400">
              {phaseHarmonicResult.globalSummary.harmonicRelationshipsWithInsufficientCrossHigherEvidence}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">&lt;2 higher phases</div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Comparable Roles</div>
            <div className="text-lg font-bold text-sky-400">
              {phaseHarmonicResult.globalSummary.rolesWithCrossHigherComparableLanes}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">≥2-phase lanes</div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase">Exact Motifs</div>
            <div className="text-lg font-bold text-fuchsia-400">
              {phaseHarmonicResult.globalSummary.periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif}
            </div>
            <div
              className="text-[10px] text-zinc-400 mt-0.5"
              title={`Raw repeating motifs: ${phaseHarmonicResult.globalSummary.periodsWithRepeatedExactPhaseSignatureMotif}\nEvidence-bearing motifs: ${phaseHarmonicResult.globalSummary.periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif}`}
            >
              evidence-bearing ({phaseHarmonicResult.globalSummary.periodsWithEvidenceBearingRepeatedExactPhaseSignatureMotif})
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      {phaseHarmonicResult && (
        <div className="space-y-4">
          <div className="flex border-b border-zinc-800 text-xs">
            <button
              onClick={() => setActiveSubTab('periods')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'periods'
                  ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Period Phase Recurrence ({flattenedPeriods.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('harmonics')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'harmonics'
                  ? 'border-cyan-500 text-cyan-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Harmonic Divisor Relationships ({flattenedHarmonics.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('crosspop')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'crosspop'
                  ? 'border-fuchsia-500 text-fuchsia-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Cross-Population Primary Geometry ({phaseHarmonicResult.crossPopulationGeometrySummaries.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('controls')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'controls'
                  ? 'border-zinc-400 text-zinc-200 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Controls & Reconciliation</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter by population, region, P18, signature..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedPopId}
                onChange={(e) => setSelectedPopId(e.target.value)}
                className="px-2.5 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Populations ({phaseHarmonicResult.physicalPopulationPhaseAnalyses.length})</option>
                {phaseHarmonicResult.physicalPopulationPhaseAnalyses.map((pop) => (
                  <option key={pop.populationId} value={pop.populationId}>
                    {pop.populationId} ({pop.sourceRegionId}, span {pop.cycleSpan}B)
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filterGainOnly}
                  onChange={(e) => setFilterGainOnly(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0"
                />
                <span>Mixing Penalty &gt; 0 only</span>
              </label>
            </div>

            <div className="text-zinc-500 text-[11px]">
              Showing {activeSubTab === 'periods' ? flattenedPeriods.length : flattenedHarmonics.length} items
            </div>
          </div>

          {/* Sub-tab 1: Periods Table (Section 75 & 1E.2B.5a Sections 4-8) */}
          {activeSubTab === 'periods' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/50 text-[11px] font-mono text-indigo-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-zinc-200">
                    Phase-Metric Invariance &amp; Pooled Mixing Penalty (1E.2B.5a):
                  </div>
                  <div className="text-zinc-400 leading-relaxed">
                    Because each cell <span className="text-indigo-300 font-mono">(phaseIndex, laneOffset)</span> maps 1:1 to an absolute cycle offset, the phase-aligned aggregate metric across repetitions is mathematically invariant across all period divisors P (identical to the population's absolute cycle-offset recurrence).
                    The difference from B.4 pooled recurrence represents that period&apos;s <span className="text-emerald-300 font-mono">Pooled Mixing Penalty</span>: higher penalties indicate that collapsing non-identical phases into the same lane obscured true recurrence.
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950 font-mono text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px]">
                        <th className="py-2.5 px-3">Population</th>
                        <th className="py-2.5 px-3">Period</th>
                        <th className="py-2.5 px-3 text-right" title="B.4 pooled context dominant agreement across the population span">B.4 Pooled %</th>
                        <th className="py-2.5 px-3 text-right" title="Absolute cycle-offset recurrence (invariant across all period divisors for this population)">Absolute Cycle Recurrence %</th>
                        <th className="py-2.5 px-3 text-right" title="Pooled Mixing Penalty (absolute cycle recurrence minus B.4 pooled period recurrence)">Mixing Penalty</th>
                        <th className="py-2.5 px-3 text-center">Phases</th>
                        <th className="py-2.5 px-3 text-center">Cycles</th>
                        <th className="py-2.5 px-3 text-center">Stable Cells</th>
                        <th className="py-2.5 px-3">Phase Signatures</th>
                        <th className="py-2.5 px-3">Primary B.1 Slots</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {flattenedPeriods.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-zinc-500">
                          No period candidates match the current filters.
                        </td>
                      </tr>
                    ) : (
                      flattenedPeriods.map(({ population: pop, period: p, key }) => {
                        const isExpanded = expandedPeriodKey === key;
                        const penalty = p.pooledMixingPenaltyPercentagePoints ?? p.phaseAlignmentGainPercentagePoints;
                        const hasPenalty = penalty > 0.001;

                        return (
                          <React.Fragment key={key}>
                            <tr
                              className={`hover:bg-zinc-900/40 transition-colors ${
                                isExpanded ? 'bg-zinc-900/60' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-semibold text-zinc-200">
                                <div>{pop.populationId}</div>
                                <div className="text-[10px] text-zinc-500 font-normal">
                                  {pop.sourceRegionId} (span {pop.cycleSpan}B)
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold">
                                  P{p.periodBytes}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-right text-zinc-400">
                                {p.b4PooledContextDominantAgreementPercentage.toFixed(1)}%
                              </td>

                              <td className="py-2.5 px-3 text-right font-semibold">
                                <span
                                  className={
                                    p.hasStrongPhaseAlignedRecurrence
                                      ? 'text-indigo-400'
                                      : p.phaseAlignedContextDominantAgreementPercentage >= 50
                                      ? 'text-zinc-200'
                                      : 'text-zinc-400'
                                  }
                                >
                                  {p.phaseAlignedContextDominantAgreementPercentage.toFixed(1)}%
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                                    hasPenalty
                                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold'
                                      : penalty < -0.001
                                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                      : 'text-zinc-500'
                                  }`}
                                >
                                  {penalty >= 0 ? `+${penalty.toFixed(1)} pts` : `${penalty.toFixed(1)} pts`}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-center text-zinc-400">
                                {p.phaseCount}
                              </td>

                              <td className="py-2.5 px-3 text-center text-zinc-400">
                                {p.cycleBlockCount}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <span className="text-zinc-300">
                                  {p.phaseAlignedContextStableCellCount} / {p.phaseAlignedContextComparableCellCount}
                                </span>
                                <span className="text-[10px] text-zinc-500 ml-1">
                                  ({p.phaseAlignedContextStableCellPercentage.toFixed(0)}%)
                                </span>
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold tracking-wider text-fuchsia-400">
                                    {p.phaseSignatureSequence.join(' ')}
                                  </span>
                                  {p.exactRepeatingPhaseSignatureMotif && (
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-fuchsia-950 border border-fuchsia-800 text-fuchsia-300">
                                      motif [{p.exactRepeatingPhaseSignatureMotif.motif.join(',')}], x
                                      {p.exactRepeatingPhaseSignatureMotif.repeatCount}
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-[11px]">
                                {p.primaryOccurrenceGeometry.length > 0 ? (
                                  <div>
                                    <span className="text-sky-300">
                                      {p.primaryOccurrenceGeometry
                                        .map((g) => `(Φ${g.phaseIndex}, L${g.laneOffsetWithinPhase})`)
                                        .join(', ')}
                                    </span>
                                    {p.primaryOccurrencesShareLaneAcrossDistinctPhases && (
                                      <div className="text-[9px] text-emerald-400">
                                        same-lane across distinct phases
                                      </div>
                                    )}
                                    {p.primaryOccurrencesSharePhaseDifferentLanes && (
                                      <div className="text-[9px] text-amber-400">
                                        same-phase different lanes
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-zinc-600">—</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => setExpandedPeriodKey(isExpanded ? null : key)}
                                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] cursor-pointer inline-flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                      Close
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                      Inspect
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Expandable Phase Inspection Row */}
                            {isExpanded && (
                              <tr className="bg-zinc-950/90 border-y border-zinc-800">
                                <td colSpan={11} className="p-4 space-y-4">
                                  <div className="border border-zinc-800 rounded-lg p-3 bg-zinc-900/60 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-semibold text-zinc-200 text-xs flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-indigo-400" />
                                        Phase Breakdown for {pop.populationId} — Period {p.periodBytes} Bytes ({p.phaseCount} Phases)
                                      </h5>
                                      <div className="text-[11px] text-zinc-400">
                                        Dominant: {p.phaseAlignedContextDominantSampleCount} / {p.phaseAlignedContextComparableSampleCount} samples
                                      </div>
                                    </div>

                                    {/* Phase Summaries Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                                      {p.phaseSummaries.map((ps) => (
                                        <div
                                          key={ps.phaseIndex}
                                          className="p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-1.5"
                                        >
                                          <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-bold text-zinc-300">
                                              Phase {ps.phaseIndex} (offset +{ps.phaseOffsetWithinCycle}B)
                                            </span>
                                            <span className="px-1.5 py-0.2 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 font-bold">
                                              Sig ID: {p.phaseSignatureSequence[ps.phaseIndex]}
                                            </span>
                                          </div>

                                          <div className="text-[11px] text-zinc-400 flex justify-between">
                                            <span>Agreement:</span>
                                            <span className="font-semibold text-zinc-200">
                                              {ps.contextDominantAgreementPercentage.toFixed(1)}%
                                            </span>
                                          </div>

                                          <div className="text-[11px] text-zinc-400 flex justify-between">
                                            <span>Stable Lanes:</span>
                                            <span>
                                              {ps.fullyStableContextLaneCount} / {p.periodBytes}
                                            </span>
                                          </div>

                                          <div className="text-[10px] text-zinc-500 font-mono break-all pt-1 border-t border-zinc-800/80">
                                            <span className="text-zinc-400">Template: </span>
                                            <span className="text-zinc-300">{ps.contextSignature}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Lane Grid Table for this period */}
                                    <div className="mt-3">
                                      <div className="text-[11px] text-zinc-400 mb-1 font-semibold">
                                        Phase × Lane Cell Grid (Stable byte hex or ?? / XX):
                                      </div>
                                      <div className="overflow-x-auto border border-zinc-800 rounded">
                                        <table className="w-full text-center border-collapse text-[10px]">
                                          <thead>
                                            <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                                              <th className="py-1.5 px-2 text-left">Phase Index</th>
                                              {Array.from({ length: p.periodBytes }).map((_, l) => (
                                                <th key={l} className="py-1.5 px-1 font-normal">
                                                  L{l}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-zinc-800/50">
                                            {p.phaseSummaries.map((ps) => (
                                              <tr key={ps.phaseIndex} className="hover:bg-zinc-900/30">
                                                <td className="py-1 px-2 text-left font-bold text-zinc-300">
                                                  Phase {ps.phaseIndex} ({p.phaseSignatureSequence[ps.phaseIndex]})
                                                </td>
                                                {ps.cells.map((cell) => (
                                                  <td
                                                    key={cell.laneOffset}
                                                    className={`py-1 px-1 font-mono ${
                                                      cell.isStableAcrossCycles
                                                        ? 'bg-emerald-950/40 text-emerald-300 font-bold'
                                                        : cell.comparableSampleCount >= 2
                                                        ? 'bg-amber-950/20 text-amber-300'
                                                        : 'text-zinc-600'
                                                    }`}
                                                    title={`Lane ${cell.laneOffset}: ${cell.sampleCount} samples, ${cell.maskedSampleCount} masked, dominant ${cell.dominantByteHex ?? 'none'} (${cell.dominantBytePercentage.toFixed(0)}%)`}
                                                  >
                                                    {cell.isStableAcrossCycles
                                                      ? cell.stableByteHex?.replace('0x', '')
                                                      : cell.comparableSampleCount >= 2
                                                      ? '??'
                                                      : 'XX'}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

          {/* Sub-tab 2: Harmonics Table (Section 76 & 1E.2B.5b Sections 10-24) */}
          {activeSubTab === 'harmonics' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-900/50 text-[11px] font-mono text-cyan-300 flex items-start gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-zinc-200">
                    Canonical Cross-Higher Harmonic Role-Slot Recurrence (1E.2B.5b):
                  </div>
                  <div className="text-zinc-400 leading-relaxed">
                    Evaluates lower-period phases mapped to higher-period phase role slots <span className="text-cyan-300 font-mono">lowerPhaseIndex = (h * R) + r</span>.
                    A lane is eligible for cross-higher consensus if and only if samples are contributed from at least 2 distinct higher phases.
                    Distinguishes genuine structural recurrence from pooled-sample artifacts.
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950 font-mono text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px]">
                        <th className="py-2.5 px-3">Population</th>
                        <th className="py-2.5 px-3">Lower P</th>
                        <th className="py-2.5 px-3">Higher P</th>
                        <th className="py-2.5 px-3 text-center">Ratio</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Lower Pooled %</th>
                        <th className="py-2.5 px-3 text-right">Higher Pooled %</th>
                        <th className="py-2.5 px-3 text-right">Absolute Offset %</th>
                        <th className="py-2.5 px-3 text-right">Cross-Higher Recurrence %</th>
                        <th className="py-2.5 px-3 text-center">Stable Cross-Higher Lanes</th>
                        <th className="py-2.5 px-3 text-center">Comparable Roles</th>
                        <th className="py-2.5 px-3 text-center">Cross-H &gt;= Higher?</th>
                        <th className="py-2.5 px-3 text-center">Exact Full Sig?</th>
                        <th className="py-2.5 px-3">Grouping Map</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {flattenedHarmonics.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="py-8 text-center text-zinc-500">
                            No harmonic pairs found for current filters.
                          </td>
                        </tr>
                      ) : (
                        flattenedHarmonics.map(({ population: pop, harmonic: h }, idx) => {
                          const harmonicKey = `${pop.populationId}_${h.lowerPeriodBytes}_${h.higherPeriodBytes}_${idx}`;
                          const isExpanded = expandedHarmonicKey === harmonicKey;
                          const absoluteOffsetAgreement =
                            pop.absoluteCycleOffsetRecurrence?.contextDominantAgreementPercentage ??
                            h.lowerPhaseAlignedAgreement;

                          return (
                            <React.Fragment key={harmonicKey}>
                              <tr className={`hover:bg-zinc-900/40 transition-colors ${isExpanded ? 'bg-zinc-900/60' : ''}`}>
                                <td className="py-2.5 px-3 font-semibold text-zinc-200">
                                  <div>{pop.populationId}</div>
                                  <div className="text-[10px] text-zinc-500 font-normal">
                                    {pop.sourceRegionId} (span {pop.cycleSpan}B)
                                  </div>
                                </td>

                                <td className="py-2.5 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold">
                                    P{h.lowerPeriodBytes}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3">
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold">
                                    P{h.higherPeriodBytes}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-center font-bold text-cyan-400">
                                  ×{h.ratio}
                                </td>

                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      h.roleRecurrenceStatus === 'confirmed-recurrence'
                                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                        : h.roleRecurrenceStatus === 'reduced-recurrence'
                                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                        : h.roleRecurrenceStatus === 'all-masked'
                                        ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                        : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                    }`}
                                  >
                                    {h.roleRecurrenceStatus}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-right text-zinc-400">
                                  {h.lowerB4PooledAgreement.toFixed(1)}%
                                </td>

                                <td className="py-2.5 px-3 text-right text-zinc-300 font-semibold">
                                  {h.higherB4PooledAgreement.toFixed(1)}%
                                </td>

                                <td className="py-2.5 px-3 text-right text-indigo-300">
                                  {absoluteOffsetAgreement.toFixed(1)}%
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  {h.crossHigherRoleDominantAgreementPercentage !== null ? (
                                    <span className="font-semibold text-zinc-200">
                                      {h.crossHigherRoleDominantAgreementPercentage.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 italic text-[10px]">
                                      Unavailable
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  {h.crossHigherRoleComparableLaneCount > 0 && h.crossHigherRoleStableLanePercentage !== null ? (
                                    <div>
                                      <span className="text-zinc-200 font-medium">
                                        {h.crossHigherRoleStableLaneCount} / {h.crossHigherRoleComparableLaneCount}
                                      </span>
                                      <span className="text-[10px] text-zinc-400 ml-1">
                                        ({h.crossHigherRoleStableLanePercentage.toFixed(0)}%)
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-500 italic text-[10px]">Unavailable</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center text-zinc-300">
                                  {h.rolesWithCrossHigherComparableLanes} / {h.rolesTotal}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  {h.crossHigherRoleRecurrenceAtLeastHigherPooled === true ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px]">
                                      YES
                                    </span>
                                  ) : h.crossHigherRoleRecurrenceAtLeastHigherPooled === false ? (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-bold text-[10px]">
                                      NO
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 text-[10px]">N/A</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  {h.allRolesExactContextSignatureMatchAcrossHigherPhases ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px]">
                                      YES
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 text-[10px]">
                                      NO
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-[10px] text-zinc-400 font-mono">
                                  <div className="max-w-[140px] truncate" title={h.groupingMap.map((m) => `HΦ${m.higherPhaseIndex}→[${m.lowerPhaseIndices.join(',')}]`).join(' ')}>
                                    {h.groupingMap.map((m) => `HΦ${m.higherPhaseIndex}→[${m.lowerPhaseIndices.join(',')}]`).join(' ')}
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => setExpandedHarmonicKey(isExpanded ? null : harmonicKey)}
                                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] cursor-pointer inline-flex items-center gap-1"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                        Close
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                        Inspect
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Harmonic Diagnostic Inspector */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={15} className="p-4 bg-zinc-900/90 border-b border-zinc-800 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Canonical Cross-Higher Metrics Box */}
                                      <div className="p-3 rounded bg-zinc-950 border border-cyan-900/50 space-y-2">
                                        <div className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
                                          <span>Canonical B.5b Cross-Higher Evidence</span>
                                          <span className="text-[10px] text-zinc-500 font-normal">Strict Multi-Phase Lanes</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Agreement</span>
                                            <span className="text-zinc-200 font-bold">
                                              {h.crossHigherRoleDominantAgreementPercentage !== null
                                                ? `${h.crossHigherRoleDominantAgreementPercentage.toFixed(2)}%`
                                                : 'Unavailable'}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Dominant Samples</span>
                                            <span className="text-zinc-200">
                                              {h.crossHigherRoleDominantSampleCount} / {h.crossHigherRoleComparableSampleCount}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Stable Lanes</span>
                                            <span className="text-zinc-200">
                                              {h.crossHigherRoleStableLaneCount} / {h.crossHigherRoleComparableLaneCount}
                                              {h.crossHigherRoleStableLanePercentage !== null && (
                                                <span className="text-zinc-400 ml-1">
                                                  ({h.crossHigherRoleStableLanePercentage.toFixed(1)}%)
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Comparable Roles</span>
                                            <span className="text-zinc-200">
                                              {h.rolesWithCrossHigherComparableLanes} / {h.rolesTotal}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">&gt;= Higher Pooled</span>
                                            <span className="font-bold">
                                              {h.crossHigherRoleRecurrenceAtLeastHigherPooled === true
                                                ? 'YES'
                                                : h.crossHigherRoleRecurrenceAtLeastHigherPooled === false
                                                ? 'NO'
                                                : 'N/A'}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">&gt;= Lower Pooled</span>
                                            <span className="font-bold">
                                              {h.crossHigherRoleRecurrenceAtLeastLowerPooled === true
                                                ? 'YES'
                                                : h.crossHigherRoleRecurrenceAtLeastLowerPooled === false
                                                ? 'NO'
                                                : 'N/A'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Legacy Broad Role Diagnostics Box */}
                                      <div className="p-3 rounded bg-zinc-950 border border-zinc-800 space-y-2">
                                        <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                                          <span>Secondary Diagnostic Context</span>
                                          <span className="text-[10px] text-zinc-500 font-normal">Legacy Broad Consensus</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Broad Agreement</span>
                                            <span className="text-zinc-300">
                                              {h.lowerRoleContextDominantAgreementPercentage.toFixed(2)}%
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Broad Samples</span>
                                            <span className="text-zinc-300">
                                              {h.lowerRoleContextDominantSampleCount} / {h.lowerRoleContextComparableSampleCount}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Broad Stable Lanes</span>
                                            <span className="text-zinc-300">
                                              {h.lowerRoleStableLaneCount} / {h.lowerRoleComparableLaneCount} ({h.lowerRoleStableLanePercentage.toFixed(0)}%)
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Broad Evidence Roles</span>
                                            <span className="text-zinc-300">
                                              {h.rolesWithCrossHigherPhaseEvidence} / {h.rolesTotal}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Broad &gt;= Higher Pooled</span>
                                            <span className="text-zinc-300">
                                              {h.lowerRoleRecurrenceAtLeastHigherPooled ? 'YES' : 'NO'}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-zinc-500 block text-[10px]">Absolute Offset Recurrence</span>
                                            <span className="text-indigo-300 font-semibold">
                                              {absoluteOffsetAgreement.toFixed(2)}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Role Summaries Breakdown */}
                                    <div className="space-y-2">
                                      <div className="text-xs font-semibold text-zinc-300">
                                        Subunit Role Breakdown ({h.roleSummaries.length} roles):
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {h.roleSummaries.map((r) => (
                                          <div
                                            key={r.roleIndex}
                                            className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-[11px] space-y-1.5 font-mono"
                                          >
                                            <div className="flex justify-between items-center">
                                              <span className="font-bold text-zinc-200">Role r={r.roleIndex}</span>
                                              <span
                                                className={`px-1.5 py-0.2 rounded text-[10px] ${
                                                  r.rolesCrossHigherPhaseEvidenceStatus === 'strong-cross-higher-phase-evidence'
                                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                                    : r.rolesCrossHigherPhaseEvidenceStatus === 'all-masked'
                                                    ? 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                                                }`}
                                              >
                                                {r.rolesCrossHigherPhaseEvidenceStatus}
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 text-[10px] text-zinc-400">
                                              <div>
                                                Cross-H: <span className="text-zinc-200 font-semibold">
                                                  {r.crossHigherDominantAgreementPercentage !== null
                                                    ? `${r.crossHigherDominantAgreementPercentage.toFixed(1)}%`
                                                    : 'N/A'}
                                                </span>
                                              </div>
                                              <div>
                                                Samples: <span className="text-zinc-200">{r.crossHigherDominantSampleCount}/{r.crossHigherComparableSampleCount}</span>
                                              </div>
                                              <div>
                                                Lanes: <span className="text-zinc-200">{r.crossHigherStableLaneCount}/{r.crossHigherComparableLaneCount}</span>
                                              </div>
                                              <div>
                                                Exact Sig: <span className={r.exactContextSignatureMatchAcrossHigherPhases ? 'text-emerald-400' : 'text-zinc-500'}>
                                                  {r.exactContextSignatureMatchAcrossHigherPhases ? 'YES' : 'NO'}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="text-[10px] text-zinc-500 truncate" title={r.contextSignature}>
                                              Sig: {r.contextSignature}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Cross-Population Geometry (Section 44) */}
          {activeSubTab === 'crosspop' && (
            <div className="space-y-4">
              {phaseHarmonicResult.crossPopulationGeometrySummaries.map((group) => (
                <div key={group.groupId} className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200">{group.groupId}</span>
                      <span className="text-zinc-400">Target: {group.candidateId}</span>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px]">
                        {group.representationKind}
                      </span>
                    </div>
                    <div className="text-zinc-500 text-[11px]">
                      Populations: {group.populationIds.join(', ')}
                    </div>
                  </div>

                  {group.exactPrimaryGeometryMatches.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-emerald-400">
                        Exact Primary Occurrence Geometry Matches:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.exactPrimaryGeometryMatches.map((m, idx) => (
                          <div key={idx} className="p-2 rounded bg-zinc-900 border border-zinc-800 space-y-1">
                            <div className="flex justify-between text-zinc-300">
                              <span>{m.populationAId} (P{m.periodABytes}) ↔ {m.populationBId} (P{m.periodBBytes})</span>
                              <span className="text-emerald-400 font-bold">MATCH</span>
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              Pattern: {m.patternA.map((p) => `(Φ${p.phaseIndex}, L${p.laneOffset})`).join(' → ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-xs italic">
                      No exact primary occurrence geometry matches found between tested periods.
                    </div>
                  )}

                  {group.sharedSameLaneAcrossDistinctPhasePatterns.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-sky-400">
                      Shared same-lane across distinct phase patterns present between populations.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sub-tab 4: Controls & Reconciliation (Section 64) */}
          {activeSubTab === 'controls' && (
            <div className="space-y-4 font-mono text-xs">
              {/* Reconciliation Status */}
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <h5 className="font-semibold text-zinc-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Pass 1E.2B.5 Reconciliation Status
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] pt-2">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500">Populations:</span>{' '}
                    <span className="text-zinc-200">
                      {phaseHarmonicResult.reconciliation.b5PhysicalPopulationsProcessed} /{' '}
                      {phaseHarmonicResult.reconciliation.b4PhysicalPopulationsInput}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500">Periods:</span>{' '}
                    <span className="text-zinc-200">
                      {phaseHarmonicResult.reconciliation.b5PeriodCandidatesProcessed} /{' '}
                      {phaseHarmonicResult.reconciliation.b4PeriodCandidatesInput}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500">Phase Cells:</span>{' '}
                    <span className="text-zinc-200">
                      {phaseHarmonicResult.reconciliation.phaseCellsProcessed} /{' '}
                      {phaseHarmonicResult.reconciliation.phaseCellsGenerated}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500">Harmonics:</span>{' '}
                    <span className="text-zinc-200">
                      {phaseHarmonicResult.reconciliation.harmonicRelationshipsProcessed} /{' '}
                      {phaseHarmonicResult.reconciliation.harmonicRelationshipsGenerated}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500">B.1 Positions:</span>{' '}
                    <span className="text-zinc-200">
                      {phaseHarmonicResult.reconciliation.b1EligiblePositionsResolved} /{' '}
                      {phaseHarmonicResult.reconciliation.b1PopulationPositionPairsInEligiblePopulations}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                    <span className="text-zinc-500">Period Invariants:</span>{' '}
                    <span className="text-zinc-200">
                      {phaseHarmonicResult.reconciliation.allPeriodInvariantsHold ? 'HOLDS (100%)' : 'VIOLATED'}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold mt-2">
                  allReconciled: {phaseHarmonicResult.reconciliation.allReconciled ? 'TRUE (VERIFIED)' : 'FALSE'}
                </div>
              </div>

              {/* Negative Control */}
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                <h5 className="font-semibold text-zinc-200 text-xs">Negative Control</h5>
                <div className="text-[11px] text-zinc-400">
                  Target: {phaseHarmonicResult.negativeControlSummary.candidateId}
                </div>
                <div className="text-[11px] text-zinc-400">
                  Status: <span className="text-zinc-300">{phaseHarmonicResult.negativeControlSummary.status}</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  {phaseHarmonicResult.negativeControlSummary.notes}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

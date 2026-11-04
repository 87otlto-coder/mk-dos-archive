import React, { useState, useMemo } from 'react';
import {
  Layers,
  AlertCircle,
  CheckCircle2,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Database,
  Tag,
  BarChart3,
  GitMerge,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteCandidate } from '../games/mk1/research/paletteTypes';
import { MK1PaletteReferenceReconResult } from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from '../games/mk1/research/paletteRepeatedStructureTypes';
import { MK1PaletteCycleLayoutResult } from '../games/mk1/research/paletteCycleLayoutTypes';
import { MK1PalettePhaseHarmonicResult } from '../games/mk1/research/palettePhaseHarmonicTypes';
import {
  MK1PaletteCandidateEvidenceFusionResult,
  StructureDepthLevel,
} from '../games/mk1/research/paletteCandidateEvidenceFusionTypes';
import {
  executePaletteCandidateEvidenceFusion,
  createMK1CompactCandidateEvidenceFusionExport,
} from '../games/mk1/research/paletteCandidateEvidenceFusion';
import {
  filterCandidateProfiles,
  PaletteEvidenceFusionFilterCriteria,
  KanoFilterOption,
  ExternalReferenceFilterOption,
  ReferenceProfileFilterOption,
  TargetObjectFilterOption,
  VeryShortFilterOption,
  StructureDepthFilterOption,
} from '../games/mk1/research/paletteCandidateEvidenceFusionFilter';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';

interface Props {
  report: MK1ExecutableLayoutReport;
  reconResult?: MK1PaletteReferenceReconResult | null;
  catalogueCandidates?: MK1PaletteCandidate[] | null;
  contextResult?: MK1PaletteOccurrenceContextResult | null;
  repeatedStructureResult?: MK1PaletteRepeatedStructureResult | null;
  cycleLayoutResult?: MK1PaletteCycleLayoutResult | null;
  phaseHarmonicResult?: MK1PalettePhaseHarmonicResult | null;
  fusionResult: MK1PaletteCandidateEvidenceFusionResult | null;
  setFusionResult: (res: MK1PaletteCandidateEvidenceFusionResult | null) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function MK1PaletteCandidateEvidenceFusionView({
  report,
  reconResult,
  catalogueCandidates,
  contextResult,
  repeatedStructureResult,
  cycleLayoutResult,
  phaseHarmonicResult,
  fusionResult,
  setFusionResult,
  onNavigateToTab,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKano, setFilterKano] = useState<KanoFilterOption>('all');
  const [filterExtRef, setFilterExtRef] = useState<ExternalReferenceFilterOption>('all');
  const [filterRefProfile, setFilterRefProfile] = useState<ReferenceProfileFilterOption>('all');
  const [filterTargetRegion, setFilterTargetRegion] = useState<string>('all');
  const [filterTargetObject, setFilterTargetObject] = useState<TargetObjectFilterOption>('all');
  const [filterVeryShort, setFilterVeryShort] = useState<VeryShortFilterOption>('all');
  const [filterStructureDepth, setFilterStructureDepth] = useState<StructureDepthFilterOption>('all');
  const [filterEvidenceFlag, setFilterEvidenceFlag] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<'score-desc' | 'refs-desc' | 'offset-asc' | 'length-desc'>('refs-desc');
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [caughtError, setCaughtError] = useState<Error | null>(null);

  // Live upstream availability assessment
  const catCount = catalogueCandidates?.length ?? 0;
  const catAvailable = catCount > 0;
  const b1Count = reconResult?.candidateSummaries?.length ?? 0;
  const b1Available = !!reconResult && b1Count > 0;
  const b2Count = contextResult?.trackB?.clusters?.length ?? 0;
  const b2Available = !!contextResult;
  const b3Count = repeatedStructureResult?.repeatedTargetGroupSummaries?.length ?? 0;
  const b3Available = !!repeatedStructureResult;
  const b4Count = cycleLayoutResult?.physicalCyclePopulations?.length ?? 0;
  const b4Available = !!cycleLayoutResult;
  const b5Count = phaseHarmonicResult?.physicalPopulationPhaseAnalyses?.length ?? 0;
  const b5Available = !!phaseHarmonicResult;

  const mandatoryInputsReady = catAvailable && b1Available;

  const handleRunFusion = () => {
    setCaughtError(null);
    try {
      const result = executePaletteCandidateEvidenceFusion(
        report,
        reconResult ?? null,
        catalogueCandidates ?? null,
        contextResult ?? null,
        repeatedStructureResult ?? null,
        cycleLayoutResult ?? null,
        phaseHarmonicResult ?? null,
        {
          exePath: report.exePath,
          exeSize: report.exeSize,
        }
      );
      setFusionResult(result);
    } catch (err) {
      setCaughtError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleExportJson = () => {
    if (!fusionResult) return;
    const compactExport = createMK1CompactCandidateEvidenceFusionExport(fusionResult);
    const jsonStr = JSON.stringify(compactExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mk1_palette_candidate_evidence_fusion_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterKano('all');
    setFilterExtRef('all');
    setFilterRefProfile('all');
    setFilterTargetRegion('all');
    setFilterTargetObject('all');
    setFilterVeryShort('all');
    setFilterStructureDepth('all');
    setFilterEvidenceFlag('all');
    setSelectedSort('refs-desc');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    filterKano !== 'all' ||
    filterExtRef !== 'all' ||
    filterRefProfile !== 'all' ||
    filterTargetRegion !== 'all' ||
    filterTargetObject !== 'all' ||
    filterVeryShort !== 'all' ||
    filterStructureDepth !== 'all' ||
    filterEvidenceFlag !== 'all';

  const availableTargetRegions = useMemo(() => {
    if (!fusionResult) return [];
    const set = new Set<string>();
    for (const p of fusionResult.candidateProfiles) {
      set.add(p.topology.targetRegionId);
    }
    return Array.from(set).sort();
  }, [fusionResult]);

  const filteredCandidates = useMemo(() => {
    if (!fusionResult) return [];

    const criteria: PaletteEvidenceFusionFilterCriteria = {
      kanoCompatibility: filterKano,
      externalReference: filterExtRef,
      referenceProfile: filterRefProfile,
      targetRegion: filterTargetRegion,
      targetObject: filterTargetObject,
      veryShort: filterVeryShort,
      structureDepth: filterStructureDepth,
      evidenceFlag: filterEvidenceFlag,
      searchTerm,
    };

    const list = filterCandidateProfiles(fusionResult.candidateProfiles, criteria);

    const sorted = [...list];
    if (selectedSort === 'score-desc') {
      sorted.sort((a, b) => b.provenance.researchScore - a.provenance.researchScore);
    } else if (selectedSort === 'refs-desc') {
      sorted.sort((a, b) => b.exactReference.externalOccurrenceCount - a.exactReference.externalOccurrenceCount);
    } else if (selectedSort === 'offset-asc') {
      sorted.sort((a, b) => a.intrinsic.byteStart - b.intrinsic.byteStart);
    } else if (selectedSort === 'length-desc') {
      sorted.sort((a, b) => b.intrinsic.length - a.intrinsic.length);
    }

    return sorted;
  }, [
    fusionResult,
    filterKano,
    filterExtRef,
    filterRefProfile,
    filterTargetRegion,
    filterTargetObject,
    filterVeryShort,
    filterStructureDepth,
    filterEvidenceFlag,
    searchTerm,
    selectedSort,
  ]);

  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1;
  const pagedCandidates = filteredCandidates.slice((page - 1) * pageSize, page * pageSize);

  const getDepthBadge = (depth: StructureDepthLevel) => {
    switch (depth) {
      case 'b5-harmonic-structure':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 border border-purple-800 text-purple-300 font-semibold">B.5 Harmonic</span>;
      case 'b4-cycle-layout':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 border border-indigo-800 text-indigo-300">B.4 Cycle</span>;
      case 'b3-repeated-structure':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 border border-blue-800 text-blue-300">B.3 Repeated</span>;
      case 'b2-context':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 border border-cyan-800 text-cyan-300">B.2 Context</span>;
      case 'b1-external-reference':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 border border-amber-800 text-amber-300">B.1 Exact Ref</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400">None</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-semibold text-zinc-100 font-mono">
              Pass 1E.2B.6b — Palette Candidate Evidence Fusion
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-950 border border-teal-800 text-teal-300 font-medium">
              Multidimensional Matrix
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-sans">
            Fuses heuristic candidate evidence (1E.1a) with deterministic reference (B.1), operand context (B.2),
            repeated structural motif (B.3), cycle layout (B.4), and harmonic recurrence (B.5) without assigning semantic ownership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunFusion}
            className="px-3.5 py-1.5 rounded text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white font-mono flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>{fusionResult ? 'Re-Run Evidence Fusion' : 'Execute Evidence Fusion'}</span>
          </button>

          {fusionResult && (
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Download compact mk1_palette_candidate_evidence_fusion_v1 JSON"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Compact JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* Epistemic Axiom Banner */}
      <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold font-mono">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Core Reverse-Engineering Axiom: REFERENCE ACTIVITY != PALETTE VALIDITY</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
          A byte sequence can satisfy MK1 palette heuristics while its offset participates in unrelated executable or data structures.
          Conversely, a visually and structurally plausible palette candidate (e.g., negative control <span className="font-mono text-zinc-100">0x0009C914</span>)
          can exhibit exactly zero external references under tested representations. Evidence Fusion preserves both dimensions independently without collapsing them into an arbitrary composite score.
        </p>
      </div>

      {/* Live Upstream Inputs Availability */}
      <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-200">Live Upstream Inputs Availability</span>
          </div>
          <span className="text-[11px] text-zinc-400">
            {mandatoryInputsReady ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Mandatory inputs ready
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Mandatory inputs missing
              </span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Catalogue */}
          <div className={`p-2.5 rounded border ${catAvailable ? 'bg-zinc-900/70 border-zinc-800' : 'bg-rose-950/20 border-rose-900/40'}`}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">Catalogue (1E.1a)</span>
              <span className="text-[9px] px-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800">Required</span>
            </div>
            <div className="font-bold mt-1 text-zinc-200">
              {catAvailable ? (
                <span className="text-emerald-400">{catCount} candidates</span>
              ) : (
                <span className="text-rose-400">Missing</span>
              )}
            </div>
          </div>

          {/* B.1 */}
          <div className={`p-2.5 rounded border ${b1Available ? 'bg-zinc-900/70 border-zinc-800' : 'bg-rose-950/20 border-rose-900/40'}`}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">B.1 Exact Ref</span>
              <span className="text-[9px] px-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800">Required</span>
            </div>
            <div className="font-bold mt-1 text-zinc-200">
              {b1Available ? (
                <span className="text-emerald-400">{b1Count} summaries</span>
              ) : (
                <span className="text-rose-400">Missing</span>
              )}
            </div>
          </div>

          {/* B.2 */}
          <div className={`p-2.5 rounded border ${b2Available ? 'bg-zinc-900/70 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800/40'}`}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">B.2 Context</span>
              <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Optional</span>
            </div>
            <div className="font-bold mt-1 text-zinc-200">
              {b2Available ? (
                <span className="text-cyan-400">{b2Count} clusters</span>
              ) : (
                <span className="text-zinc-500">Unavailable</span>
              )}
            </div>
          </div>

          {/* B.3 */}
          <div className={`p-2.5 rounded border ${b3Available ? 'bg-zinc-900/70 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800/40'}`}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">B.3 Repeated</span>
              <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Optional</span>
            </div>
            <div className="font-bold mt-1 text-zinc-200">
              {b3Available ? (
                <span className="text-blue-400">{b3Count} groups</span>
              ) : (
                <span className="text-zinc-500">Unavailable</span>
              )}
            </div>
          </div>

          {/* B.4 */}
          <div className={`p-2.5 rounded border ${b4Available ? 'bg-zinc-900/70 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800/40'}`}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">B.4 Cycle Layout</span>
              <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Optional</span>
            </div>
            <div className="font-bold mt-1 text-zinc-200">
              {b4Available ? (
                <span className="text-indigo-400">{b4Count} populations</span>
              ) : (
                <span className="text-zinc-500">Unavailable</span>
              )}
            </div>
          </div>

          {/* B.5 */}
          <div className={`p-2.5 rounded border ${b5Available ? 'bg-zinc-900/70 border-zinc-800' : 'bg-zinc-900/30 border-zinc-800/40'}`}>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-400">B.5 Harmonic</span>
              <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">Optional</span>
            </div>
            <div className="font-bold mt-1 text-zinc-200">
              {b5Available ? (
                <span className="text-purple-400">{b5Count} populations</span>
              ) : (
                <span className="text-zinc-500">Unavailable</span>
              )}
            </div>
          </div>
        </div>

        {!mandatoryInputsReady && (
          <div className="text-[11px] text-rose-300 font-sans p-2 rounded bg-rose-950/30 border border-rose-900 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              Palette Catalogue and B.1 Reference Reconnaissance are mandatory inputs. Without both, fusion execution will result in a FAILED contract state.
            </span>
          </div>
        )}

        {mandatoryInputsReady && (!b2Available || !b3Available || !b4Available || !b5Available) && (
          <div className="text-[11px] text-amber-300 font-sans p-2 rounded bg-amber-950/30 border border-amber-900 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Catalogue and B.1 are available. Downstream B.2–B.5 passes are optional; executing now will produce an authoritative <span className="font-semibold text-amber-200">PARTIAL</span> fusion profile matrix.
            </span>
          </div>
        )}
      </div>

      {/* Caught Error Failure Panel */}
      {caughtError && (
        <AnalysisFailurePanel
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-candidate-evidence-fusion"
          context={{
            exePath: fusionResult?.fixture.exePath ?? report.exePath ?? 'MK1.EXE',
            exeSize: fusionResult?.fixture.exeSize ?? report.exeSize ?? 0,
            milestone: '1E.2B.6b',
          }}
          operationId={fusionResult?.metadata.operationId}
          error={caughtError}
          onRetry={handleRunFusion}
        />
      )}

      {/* FAILED Status AnalysisFailurePanel */}
      {!caughtError && fusionResult && fusionResult.status === 'FAILED' && (
        <div className="space-y-4">
          <AnalysisFailurePanel
            currentGame="mk1"
            subsystem="research-mk1"
            operation="palette-candidate-evidence-fusion"
            context={{
              exePath: fusionResult.fixture.exePath,
              exeSize: fusionResult.fixture.exeSize,
              milestone: fusionResult.metadata.milestone,
            }}
            operationId={fusionResult.metadata.operationId}
            error={new Error(fusionResult.failureReason || 'Evidence fusion reconciliation integrity audit failed')}
            onRetry={handleRunFusion}
          />

          {/* Audit Details */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-rose-900/60 font-mono text-xs space-y-2">
            <div className="text-rose-400 font-semibold">Reconciliation Audit Breakdown:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-300 text-[11px]">
              <div>Duplicate Catalogue IDs: <span className="font-bold text-zinc-100">{fusionResult.reconciliation.duplicateCatalogueCandidateIds.length}</span></div>
              <div>Duplicate B.1 IDs: <span className="font-bold text-zinc-100">{fusionResult.reconciliation.duplicateB1CandidateIds.length}</span></div>
              <div>Missing Catalogue Evidence: <span className="font-bold text-zinc-100">{fusionResult.reconciliation.candidateProfilesMissingCatalogueEvidence.length}</span></div>
              <div>Missing B.1 Evidence: <span className="font-bold text-zinc-100">{fusionResult.reconciliation.candidateProfilesMissingB1Evidence.length}</span></div>
              <div>Field Mismatches: <span className="font-bold text-zinc-100">{fusionResult.reconciliation.catalogueB1FieldMismatchIds.length}</span></div>
              <div>Unexpected Candidate IDs: <span className="font-bold text-zinc-100">{fusionResult.reconciliation.unexpectedUpstreamCandidateIds.length}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS / PARTIAL Results */}
      {!caughtError && fusionResult && fusionResult.status !== 'FAILED' && (
        <>
          {/* Status & Reconciliation Integrity Audit Banner */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3 font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-semibold text-zinc-200">Reconciliation & Integrity Audit</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    fusionResult.status === 'SUCCESS'
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      : 'bg-amber-950 border border-amber-800 text-amber-300'
                  }`}
                >
                  STATUS: {fusionResult.status}
                </span>
                {fusionResult.reconciliation.allCandidatesAccountedFor && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 border border-emerald-900 text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>1:1 Reconciled ({fusionResult.reconciliation.candidateProfilesProduced} candidates)</span>
                  </span>
                )}
              </div>

              <div className="text-[11px] text-zinc-400">
                Milestone: <span className="text-zinc-200">{fusionResult.metadata.milestone}</span> | Op:{' '}
                <span className="text-zinc-300">{fusionResult.metadata.operationId.slice(0, 8)}...</span>
              </div>
            </div>

            {fusionResult.status === 'PARTIAL' && (
              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-900 text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Authoritative Partial Result:</div>
                  <div className="font-sans text-[11px] text-amber-200/90 mt-0.5">
                    Catalogue and B.1 reconciled. Some downstream B.2–B.5 evidence is unavailable. Downstream evidence fields remain null without zero-filling.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[10px] text-zinc-400">Reconciliation (Input → Output)</div>
                <div className="font-bold text-zinc-200 mt-1">
                  {fusionResult.reconciliation.researchCandidatesInput} → {fusionResult.reconciliation.candidateProfilesProduced}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  B.1 Input: {fusionResult.reconciliation.b1CandidateSummariesInput}
                </div>
              </div>

              <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[10px] text-zinc-400">Catalogue / B.1 Audit</div>
                <div className="font-bold text-zinc-200 mt-1">
                  {fusionResult.reconciliation.catalogueB1FieldMismatchIds.length === 0 ? (
                    <span className="text-emerald-400">0 Field Mismatches</span>
                  ) : (
                    <span className="text-rose-400">{fusionResult.reconciliation.catalogueB1FieldMismatchIds.length} Mismatches</span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Missing Cat: {fusionResult.reconciliation.candidateProfilesMissingCatalogueEvidence.length} | Missing B.1: {fusionResult.reconciliation.candidateProfilesMissingB1Evidence.length}
                </div>
              </div>

              <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[10px] text-zinc-400">Controls Collision Audit</div>
                <div className="font-bold text-zinc-200 mt-1">
                  {fusionResult.controlsAudit.controlsExcludedFromProfiles ? (
                    <span className="text-emerald-400">100% Excluded</span>
                  ) : (
                    <span className="text-rose-400">Collision Detected</span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  {fusionResult.controlsAudit.controlTargetsInputCount} Controls Excluded
                </div>
              </div>

              <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[10px] text-zinc-400">Upstream Fusion Depth</div>
                <div className="font-bold text-zinc-200 mt-1 flex items-center gap-1.5">
                  <span className="text-teal-400">B.1</span>
                  <span className={fusionResult.upstreamAvailability.b2Available ? 'text-cyan-400' : 'text-zinc-600'}>B.2</span>
                  <span className={fusionResult.upstreamAvailability.b3Available ? 'text-blue-400' : 'text-zinc-600'}>B.3</span>
                  <span className={fusionResult.upstreamAvailability.b4Available ? 'text-indigo-400' : 'text-zinc-600'}>B.4</span>
                  <span className={fusionResult.upstreamAvailability.b5Available ? 'text-purple-400' : 'text-zinc-600'}>B.5</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Populations: B.4({fusionResult.upstreamAvailability.b4PhysicalPopulationsCount ?? '—'}) B.5({fusionResult.upstreamAvailability.b5PhysicalPopulationsCount ?? '—'})
                </div>
              </div>
            </div>
          </div>

          {/* Cohort Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Kano-Comp + Ref Active</span>
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {fusionResult.globalCohortSummary.kanoCompatible_externalReference}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 font-sans">
                Dual candidate & reference support
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>Kano-Comp + No Ref</span>
              </div>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {fusionResult.globalCohortSummary.kanoCompatible_noExternalReference}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 font-sans">
                Includes 0x0009C914 negative control
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                <span>Non-Kano + Ref Active</span>
              </div>
              <div className="text-xl font-bold text-sky-400 mt-1">
                {fusionResult.globalCohortSummary.notKanoCompatible_externalReference}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 font-sans">
                Active code/data (e.g. 0x000324C0)
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                <span>Non-Kano + No Ref</span>
              </div>
              <div className="text-xl font-bold text-zinc-300 mt-1">
                {fusionResult.globalCohortSummary.notKanoCompatible_noExternalReference}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 font-sans">
                Inactive non-Kano candidate
              </div>
            </div>
          </div>

          {/* Key Exemplars Comparison Table */}
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-200 font-mono flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-teal-400" />
                <span>Key Research Exemplars (Deterministic Profiling)</span>
              </h4>
              <span className="text-[10px] text-zinc-400 font-mono">
                Authoritative Cross-Pass Benchmark Set
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-[11px]">
                    <th className="pb-2 font-medium">Candidate</th>
                    <th className="pb-2 font-medium">Region</th>
                    <th className="pb-2 font-medium text-center">Len</th>
                    <th className="pb-2 font-medium text-center">Score</th>
                    <th className="pb-2 font-medium text-center">Kano</th>
                    <th className="pb-2 font-medium text-center">Ext Refs</th>
                    <th className="pb-2 font-medium text-center">Profile</th>
                    <th className="pb-2 font-medium text-center">Structure Depth</th>
                    <th className="pb-2 font-medium">Key Tension Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {fusionResult.candidateProfiles
                    .filter((c) =>
                      [
                        'MK1.EXE:0x000324C0',
                        'MK1.EXE:0x0002C3FE',
                        'MK1.EXE:0x00031AD0',
                        'MK1.EXE:0x000917FE',
                        'MK1.EXE:0x00091200',
                        'MK1.EXE:0x00091000',
                        'MK1.EXE:0x0009C914',
                      ].includes(c.candidateId)
                    )
                    .map((ex) => (
                      <tr key={ex.candidateId} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 font-bold text-amber-300">{ex.intrinsic.byteStartHex}</td>
                        <td className="py-2.5 text-zinc-400">{ex.topology.targetRegionId}</td>
                        <td className="py-2.5 text-center">{ex.intrinsic.length}</td>
                        <td className="py-2.5 text-center">{ex.provenance.researchScore}</td>
                        <td className="py-2.5 text-center">
                          {ex.intrinsic.zeroShiftKanoCompatible ? (
                            <span className="text-emerald-400 font-semibold">Yes</span>
                          ) : (
                            <span className="text-zinc-400">No</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center font-bold text-zinc-100">
                          {ex.exactReference.externalOccurrenceCount}
                        </td>
                        <td className="py-2.5 text-center text-[10px] text-zinc-400">
                          {ex.exactReference.referenceProfile}
                        </td>
                        <td className="py-2.5 text-center">{getDepthBadge(ex.structureDepth)}</td>
                        <td className="py-2.5 text-[11px]">
                          {ex.tensionFlags.referenceInactiveKanoCompatible && (
                            <span className="text-amber-400">referenceInactiveKanoCompatible</span>
                          )}
                          {ex.tensionFlags.referenceActiveIntrinsicWeak && (
                            <span className="text-sky-400">referenceActiveIntrinsicWeak</span>
                          )}
                          {ex.tensionFlags.referenceActiveKanoCompatible && (
                            <span className="text-emerald-400">referenceActiveKanoCompatible</span>
                          )}
                          {ex.tensionFlags.strongCatalogueNoReference && (
                            <span className="text-purple-400">strongCatalogueNoReference</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Length Histogram Section */}
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-200 font-mono flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
                <span>Length Distributions Across Activity Cohorts</span>
              </h4>
              <span className="text-[10px] text-zinc-400 font-mono">
                Total Tested Candidates: {fusionResult.lengthHistograms.allCandidates.totalCount}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 font-mono text-xs">
              {(['2', '3', '4-7', '8-15', '16-23', '24-31', '32-63', '64+'] as const).map((bKey) => (
                <div key={bKey} className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-center">
                  <div className="text-zinc-400 text-[10px]">{bKey} colors</div>
                  <div className="text-sm font-bold text-zinc-200 mt-1">
                    {fusionResult.lengthHistograms.allCandidates.bucketCounts[bKey]}
                  </div>
                  <div className="text-[10px] text-teal-400 mt-0.5">
                    {fusionResult.lengthHistograms.referenceActiveCandidates.bucketCounts[bKey]} refs
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters & Candidate Profile Explorer */}
          <div className="space-y-3">
            {/* Filter Bar */}
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-teal-400" />
                  <span className="font-semibold text-zinc-200">Candidate Profiles Filter & Search</span>
                  <span className="text-[11px] text-zinc-400">
                    Showing <span className="text-zinc-100 font-bold">{filteredCandidates.length}</span> of {fusionResult.candidateProfiles.length} candidates
                  </span>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search candidate ID, hex offset, content hash, target region..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              {/* 8 Filter Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {/* 1. Kano Compatibility */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Kano Compatibility</label>
                  <select
                    value={filterKano}
                    onChange={(e) => {
                      setFilterKano(e.target.value as KanoFilterOption);
                      setPage(1);
                    }}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="all">All (Any Kano)</option>
                    <option value="yes">Kano-Compatible (Yes)</option>
                    <option value="no">Not Kano-Compatible (No)</option>
                  </select>
                </div>

                {/* 2. External Reference */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">External Reference</label>
                  <select
                    value={filterExtRef}
                    onChange={(e) => {
                      setFilterExtRef(e.target.value as ExternalReferenceFilterOption);
                      setPage(1);
                    }}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="all">All (Active &amp; Inactive)</option>
                    <option value="active">Active References (&gt;= 1)</option>
                    <option value="none">Zero References (0)</option>
                  </select>
                </div>

                {/* 3. Reference Profile */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Reference Profile</label>
                  <select
                    value={filterRefProfile}
                    onChange={(e) => {
                      setFilterRefProfile(e.target.value as ReferenceProfileFilterOption);
                      setPage(1);
                    }}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="all">All Reference Profiles</option>
                    <option value="no-external-reference">no-external-reference</option>
                    <option value="physical-derived-only">physical-derived-only</option>
                    <option value="address-derived-only">address-derived-only</option>
                    <option value="mixed-physical-and-address-derived">mixed-physical-and-address-derived</option>
                  </select>
                </div>

                {/* 4. Target Region */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Target Region</label>
                  <select
                    value={filterTargetRegion}
                    onChange={(e) => {
                      setFilterTargetRegion(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="all">All Target Regions</option>
                    {availableTargetRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Target Object */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Target Object</label>
                  <select
                    value={filterTargetObject}
                    onChange={(e) => {
                      setFilterTargetObject(e.target.value as TargetObjectFilterOption);
                      setPage(1);
                    }}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="all">All Objects</option>
                    <option value="Object 1">Object 1 (R-X Executable)</option>
                    <option value="Object 2">Object 2 (RW- Data)</option>
                    <option value="unmapped">Unmapped / Header</option>
                  </select>
                </div>

                {/* 6. Very Short Candidate */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Very Short (len &lt;= 3)</label>
                  <select
                    value={filterVeryShort}
                    onChange={(e) => {
                      setFilterVeryShort(e.target.value as VeryShortFilterOption);
                      setPage(1);
                    }}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="all">All Lengths</option>
                    <option value="yes">Very Short (&lt;= 3)</option>
                    <option value="no">Standard Length (&gt; 3)</option>
                  </select>
                </div>

                {/* 7. Structure Depth */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Structure Depth</label>
                  <select
                    value={filterStructureDepth}
                    onChange={(e) => {
                      setFilterStructureDepth(e.target.value as StructureDepthFilterOption);
                      setPage(1);
                    }}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="all">All Depths</option>
                    <option value="b5-harmonic-structure">B.5 Harmonic</option>
                    <option value="b4-cycle-layout">B.4 Cycle Layout</option>
                    <option value="b3-repeated-structure">B.3 Repeated</option>
                    <option value="b2-context">B.2 Context</option>
                    <option value="b1-external-reference">B.1 Exact Ref</option>
                    <option value="none">None (0 refs)</option>
                  </select>
                </div>

                {/* 8. Evidence / Tension Flag */}
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Evidence / Tension Flag</label>
                  <select
                    value={filterEvidenceFlag}
                    onChange={(e) => {
                      setFilterEvidenceFlag(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="all">All Evidence Flags</option>
                    <option value="referenceInactiveKanoCompatible">referenceInactiveKanoCompatible</option>
                    <option value="referenceActiveIntrinsicWeak">referenceActiveIntrinsicWeak</option>
                    <option value="referenceActiveKanoCompatible">referenceActiveKanoCompatible</option>
                    <option value="strongCatalogueNoReference">strongCatalogueNoReference</option>
                    <option value="shortCandidateAddressActive">shortCandidateAddressActive</option>
                    <option value="executableTargetAddressActive">executableTargetAddressActive</option>
                    <option value="writableTargetKanoCompatible">writableTargetKanoCompatible</option>
                    <option value="hasAddressDerivedReferences">hasAddressDerivedReferences</option>
                    <option value="hasPhysicalDerivedReferences">hasPhysicalDerivedReferences</option>
                    <option value="hasB5HarmonicEvidence">hasB5HarmonicEvidence</option>
                    <option value="isContentDuplicate">isContentDuplicate</option>
                  </select>
                </div>
              </div>

              {/* Sort selector */}
              <div className="flex justify-end pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400">Sort:</span>
                  <select
                    value={selectedSort}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'score-desc' || val === 'refs-desc' || val === 'offset-asc' || val === 'length-desc') {
                        setSelectedSort(val);
                      }
                    }}
                    className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-teal-500 text-xs cursor-pointer"
                  >
                    <option value="refs-desc">External Refs ↓</option>
                    <option value="score-desc">Research Score ↓</option>
                    <option value="offset-asc">File Offset ↑</option>
                    <option value="length-desc">Length ↓</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Candidate Profiles Table */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/60 font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900 text-zinc-400 text-[11px]">
                    <th className="py-2.5 px-3 font-medium">Candidate</th>
                    <th className="py-2.5 px-3 font-medium">Region</th>
                    <th className="py-2.5 px-3 font-medium text-center">Length</th>
                    <th className="py-2.5 px-3 font-medium text-center">Score</th>
                    <th className="py-2.5 px-3 font-medium text-center">Kano</th>
                    <th className="py-2.5 px-3 font-medium text-center">Ext Refs</th>
                    <th className="py-2.5 px-3 font-medium">Profile</th>
                    <th className="py-2.5 px-3 font-medium text-center">Depth</th>
                    <th className="py-2.5 px-3 font-medium text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {pagedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-400 font-sans text-xs">
                        No candidates match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    pagedCandidates.map((c) => {
                      const isExpanded = expandedCandidateId === c.candidateId;
                      return (
                        <React.Fragment key={c.candidateId}>
                          <tr
                            onClick={() => setExpandedCandidateId(isExpanded ? null : c.candidateId)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded ? 'bg-zinc-800/60' : 'hover:bg-zinc-800/30'
                            }`}
                          >
                            <td className="py-2 px-3 font-semibold text-amber-300">{c.intrinsic.byteStartHex}</td>
                            <td className="py-2 px-3 text-zinc-400">{c.topology.targetRegionId}</td>
                            <td className="py-2 px-3 text-center">{c.intrinsic.length}</td>
                            <td className="py-2 px-3 text-center">{c.provenance.researchScore}</td>
                            <td className="py-2 px-3 text-center">
                              {c.intrinsic.zeroShiftKanoCompatible ? (
                                <span className="text-emerald-400 font-semibold">Yes</span>
                              ) : (
                                <span className="text-zinc-400">No</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              {c.exactReference.externalOccurrenceCount > 0 ? (
                                <span className="text-teal-400">{c.exactReference.externalOccurrenceCount}</span>
                              ) : (
                                <span className="text-zinc-400">0</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[11px] text-zinc-400">{c.exactReference.referenceProfile}</td>
                            <td className="py-2 px-3 text-center">{getDepthBadge(c.structureDepth)}</td>
                            <td className="py-2 px-3 text-right text-zinc-400">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 inline" /> : <ChevronRight className="w-3.5 h-3.5 inline" />}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-zinc-950/80">
                              <td colSpan={9} className="p-4 space-y-3 font-mono text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {/* Intrinsic & Provenance */}
                                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1.5">
                                    <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                      <Tag className="w-3 h-3 text-teal-400" />
                                      <span>Intrinsic Evidence</span>
                                    </div>
                                    <div className="text-zinc-400 space-y-1 text-[11px]">
                                      <div>Span: {c.intrinsic.byteStartHex} - {c.intrinsic.byteEndHex} ({c.intrinsic.length} colors)</div>
                                      <div>Score: {c.provenance.researchScore} (Tier: {c.provenance.tier})</div>
                                      <div>
                                        Unique Colors:{' '}
                                        {c.intrinsic.uniqueColorCount !== null
                                          ? `${c.intrinsic.uniqueColorCount} (${Math.round((c.intrinsic.uniqueColorRatio ?? 0) * 100)}%)`
                                          : 'Unavailable (null)'}
                                      </div>
                                      <div>
                                        Kano Zero-Shift: {c.intrinsic.zeroShiftKanoCompatible ? 'Compatible' : 'Not Compatible'} (margin: {c.intrinsic.zeroShiftCoverageMargin})
                                      </div>
                                      <div>
                                        Text-like Score:{' '}
                                        {c.intrinsic.textLikeScore !== null ? c.intrinsic.textLikeScore : 'Unavailable (null)'}{' '}
                                        (Ascii:{' '}
                                        {c.intrinsic.containsLikelyAsciiData !== null
                                          ? c.intrinsic.containsLikelyAsciiData
                                            ? 'Yes'
                                            : 'No'
                                          : 'Unavailable (null)'}
                                        )
                                      </div>
                                    </div>
                                  </div>

                                  {/* Exact References */}
                                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1.5">
                                    <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                      <Database className="w-3 h-3 text-amber-400" />
                                      <span>Exact References (B.1)</span>
                                    </div>
                                    <div className="text-zinc-400 space-y-1 text-[11px]">
                                      <div>External Occurrences: <span className="text-zinc-100 font-bold">{c.exactReference.externalOccurrenceCount}</span></div>
                                      <div>Profile: {c.exactReference.referenceProfile}</div>
                                      <div>Linear Address Refs: {c.exactReference.linearAddressDerivedReferenceCount}</div>
                                      <div>Object-Relative Refs: {c.exactReference.objectRelativeDerivedReferenceCount}</div>
                                      <div>Physical-Derived Refs: {c.exactReference.physicalDerivedReferenceCount}</div>
                                      <div>First Ref Offset: {c.exactReference.firstOccurrenceOffsetHex ?? 'None'}</div>
                                    </div>
                                  </div>

                                  {/* Downstream Structure Participation */}
                                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1.5">
                                    <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                                      <Layers className="w-3 h-3 text-purple-400" />
                                      <span>Downstream Structure (B.2-B.5)</span>
                                    </div>
                                    <div className="text-zinc-400 space-y-1 text-[11px]">
                                      <div>Structure Depth: {getDepthBadge(c.structureDepth)}</div>
                                      <div>B.2 Context Positions: {c.b2Context ? c.b2Context.participationCount : 'Unavailable (null)'}</div>
                                      <div>B.3 Repeated Groups: {c.b3Structure ? c.b3Structure.repeatedTargetGroupParticipationCount : 'Unavailable (null)'}</div>
                                      <div>B.4 Cycle Populations: {c.b4Cycle ? c.b4Cycle.physicalPopulationParticipationCount : 'Unavailable (null)'}</div>
                                      <div>B.5 Harmonic Pop: {c.b5Harmonic ? c.b5Harmonic.populationParticipationCount : 'Unavailable (null)'}</div>
                                      {c.b5Harmonic && c.b5Harmonic.maxCanonicalCrossHigherRecurrence !== null && (
                                        <div>Max Harmonic Recurrence: {c.b5Harmonic.maxCanonicalCrossHigherRecurrence.toFixed(1)}%</div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Tension Flags Callout */}
                                <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 flex items-center gap-3 flex-wrap">
                                  <span className="text-zinc-400 text-[11px]">Tension Flags:</span>
                                  {c.tensionFlags.referenceInactiveKanoCompatible && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 border border-amber-800 text-amber-300">
                                      referenceInactiveKanoCompatible (Visual/Kano fit without external references)
                                    </span>
                                  )}
                                  {c.tensionFlags.referenceActiveIntrinsicWeak && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950 border border-sky-800 text-sky-300">
                                      referenceActiveIntrinsicWeak (Active code/data reference despite weak palette plausibility)
                                    </span>
                                  )}
                                  {c.tensionFlags.referenceActiveKanoCompatible && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300">
                                      referenceActiveKanoCompatible (Dual support: Kano-compatible + external reference)
                                    </span>
                                  )}
                                  {c.tensionFlags.strongCatalogueNoReference && (
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 border border-purple-800 text-purple-300">
                                      strongCatalogueNoReference (High score &gt;= 50 without references)
                                    </span>
                                  )}
                                  {!c.tensionFlags.referenceInactiveKanoCompatible &&
                                    !c.tensionFlags.referenceActiveIntrinsicWeak &&
                                    !c.tensionFlags.referenceActiveKanoCompatible &&
                                    !c.tensionFlags.strongCatalogueNoReference && (
                                      <span className="text-zinc-400 text-[10px]">No conflicting tensions</span>
                                    )}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between font-mono text-xs pt-2">
                <div className="text-zinc-400 text-[11px]">
                  Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredCandidates.length)} of {filteredCandidates.length} candidates
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="text-zinc-400 text-[11px]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

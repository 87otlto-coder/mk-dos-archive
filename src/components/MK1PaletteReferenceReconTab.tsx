import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  Download,
  FileCode,
  Info,
  Layers,
  Play,
  Search,
  SlidersHorizontal,
  Target,
} from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  ExactValueOccurrence,
  MK1PaletteReferenceReconResult,
  PaletteRepresentationKind,
} from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import {
  createMK1CompactPaletteReferenceReconExport,
  performPaletteReferenceReconnaissance,
} from '../games/mk1/research/paletteReferenceReconnaissance';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteScanResult } from '../games/mk1/research/paletteTypes';
import { MK1PaletteRegionCorrelationResult } from '../games/mk1/research/paletteRegionCorrelationTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteOccurrenceContextView } from './MK1PaletteOccurrenceContextView';
import { MK1PaletteRepeatedStructureResult } from '../games/mk1/research/paletteRepeatedStructureTypes';
import { MK1PaletteRepeatedStructureView } from './MK1PaletteRepeatedStructureView';
import { MK1PaletteCycleLayoutResult } from '../games/mk1/research/paletteCycleLayoutTypes';
import { MK1PaletteCycleLayoutView } from './MK1PaletteCycleLayoutView';
import { MK1PalettePhaseHarmonicResult } from '../games/mk1/research/palettePhaseHarmonicTypes';
import { MK1PalettePhaseHarmonicView } from './MK1PalettePhaseHarmonicView';
import { MK1PaletteCandidateEvidenceFusionResult } from '../games/mk1/research/paletteCandidateEvidenceFusionTypes';
import { MK1PaletteCandidateEvidenceFusionView } from './MK1PaletteCandidateEvidenceFusionView';
import { MK1PaletteReferenceChainReconResult } from '../games/mk1/research/paletteReferenceChainReconnaissanceTypes';
import { MK1PaletteReferenceChainView } from './MK1PaletteReferenceChainView';
import { MK1PaletteOperandUseResult } from '../games/mk1/research/paletteOperandUseReconnaissanceTypes';
import { MK1PaletteOperandUseView } from './MK1PaletteOperandUseView';
import { MK1PaletteTargetEntryReconResult } from '../games/mk1/research/paletteTargetEntryReconnaissanceTypes';
import { MK1PaletteTargetEntryView } from './MK1PaletteTargetEntryView';
import { MK1PaletteConvergentEntryResult } from '../games/mk1/research/paletteConvergentEntryReconnaissanceTypes';
import { MK1PaletteConvergentEntryView } from './MK1PaletteConvergentEntryView';
import { MK1PaletteSeedFixupQualificationResult } from '../games/mk1/research/paletteSeedFixupQualificationTypes';
import { MK1PaletteSeedFixupQualificationView } from './MK1PaletteSeedFixupQualificationView';
import { MK1PaletteSegmentQualificationResult } from '../games/mk1/research/paletteSegmentQualificationTypes';
import { MK1PaletteSegmentQualificationView } from './MK1PaletteSegmentQualificationView';

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport | null;
  sharedPaletteResult: MK1PaletteScanResult | null;
  correlationResult: MK1PaletteRegionCorrelationResult | null;
  reconResult: MK1PaletteReferenceReconResult | null;
  setReconResult: (res: MK1PaletteReferenceReconResult | null) => void;
  isReconRunning: boolean;
  setIsReconRunning: (v: boolean) => void;
  contextResult?: MK1PaletteOccurrenceContextResult | null;
  setContextResult?: (res: MK1PaletteOccurrenceContextResult | null) => void;
  isContextRunning?: boolean;
  setIsContextRunning?: (v: boolean) => void;
  repeatedStructureResult?: MK1PaletteRepeatedStructureResult | null;
  setRepeatedStructureResult?: (res: MK1PaletteRepeatedStructureResult | null) => void;
  isRepeatedStructureRunning?: boolean;
  setIsRepeatedStructureRunning?: (v: boolean) => void;
  cycleLayoutResult?: MK1PaletteCycleLayoutResult | null;
  setCycleLayoutResult?: (res: MK1PaletteCycleLayoutResult | null) => void;
  isCycleLayoutRunning?: boolean;
  setIsCycleLayoutRunning?: (v: boolean) => void;
  phaseHarmonicResult?: MK1PalettePhaseHarmonicResult | null;
  setPhaseHarmonicResult?: (res: MK1PalettePhaseHarmonicResult | null) => void;
  isPhaseHarmonicRunning?: boolean;
  setIsPhaseHarmonicRunning?: (v: boolean) => void;
  fusionResult?: MK1PaletteCandidateEvidenceFusionResult | null;
  setFusionResult?: (res: MK1PaletteCandidateEvidenceFusionResult | null) => void;
  chainResult?: MK1PaletteReferenceChainReconResult | null;
  setChainResult?: (res: MK1PaletteReferenceChainReconResult | null) => void;
  operandUseResult?: MK1PaletteOperandUseResult | null;
  setOperandUseResult?: (res: MK1PaletteOperandUseResult | null) => void;
  targetEntryResult?: MK1PaletteTargetEntryReconResult | null;
  setTargetEntryResult?: (res: MK1PaletteTargetEntryReconResult | null) => void;
  convergentResult?: MK1PaletteConvergentEntryResult | null;
  setConvergentResult?: (res: MK1PaletteConvergentEntryResult | null) => void;
  seedFixupResult?: MK1PaletteSeedFixupQualificationResult | null;
  setSeedFixupResult?: (res: MK1PaletteSeedFixupQualificationResult | null) => void;
  segmentQualificationResult?: MK1PaletteSegmentQualificationResult | null;
  setSegmentQualificationResult?: (res: MK1PaletteSegmentQualificationResult | null) => void;
}

export function MK1PaletteReferenceReconTab({
  source,
  report,
  sharedPaletteResult,
  correlationResult,
  reconResult,
  setReconResult,
  isReconRunning,
  setIsReconRunning,
  contextResult,
  setContextResult,
  isContextRunning,
  setIsContextRunning,
  repeatedStructureResult,
  setRepeatedStructureResult,
  isRepeatedStructureRunning,
  setIsRepeatedStructureRunning,
  cycleLayoutResult,
  setCycleLayoutResult,
  isCycleLayoutRunning,
  setIsCycleLayoutRunning,
  phaseHarmonicResult,
  setPhaseHarmonicResult,
  isPhaseHarmonicRunning,
  setIsPhaseHarmonicRunning,
  fusionResult,
  setFusionResult,
  chainResult,
  setChainResult,
  operandUseResult,
  setOperandUseResult,
  targetEntryResult,
  setTargetEntryResult,
  convergentResult,
  setConvergentResult,
  seedFixupResult,
  setSeedFixupResult,
  segmentQualificationResult,
  setSegmentQualificationResult,
}: Props) {
  const [internalContextResult, setInternalContextResult] = useState<MK1PaletteOccurrenceContextResult | null>(null);
  const [internalIsContextRunning, setInternalIsContextRunning] = useState(false);

  const effectiveContextResult = contextResult !== undefined ? contextResult : internalContextResult;
  const effectiveSetContextResult = setContextResult || setInternalContextResult;
  const effectiveIsContextRunning = isContextRunning !== undefined ? isContextRunning : internalIsContextRunning;
  const effectiveSetIsContextRunning = setIsContextRunning || setInternalIsContextRunning;

  const [internalRepeatedStructureResult, setInternalRepeatedStructureResult] = useState<MK1PaletteRepeatedStructureResult | null>(null);
  const [internalIsRepeatedStructureRunning, setInternalIsRepeatedStructureRunning] = useState(false);

  const effectiveRepeatedStructureResult = repeatedStructureResult !== undefined ? repeatedStructureResult : internalRepeatedStructureResult;
  const effectiveSetRepeatedStructureResult = setRepeatedStructureResult || setInternalRepeatedStructureResult;
  const effectiveIsRepeatedStructureRunning = isRepeatedStructureRunning !== undefined ? isRepeatedStructureRunning : internalIsRepeatedStructureRunning;
  const effectiveSetIsRepeatedStructureRunning = setIsRepeatedStructureRunning || setInternalIsRepeatedStructureRunning;

  const [internalCycleLayoutResult, setInternalCycleLayoutResult] = useState<MK1PaletteCycleLayoutResult | null>(null);
  const [internalIsCycleLayoutRunning, setInternalIsCycleLayoutRunning] = useState(false);

  const effectiveCycleLayoutResult = cycleLayoutResult !== undefined ? cycleLayoutResult : internalCycleLayoutResult;
  const effectiveSetCycleLayoutResult = setCycleLayoutResult || setInternalCycleLayoutResult;
  const effectiveIsCycleLayoutRunning = isCycleLayoutRunning !== undefined ? isCycleLayoutRunning : internalIsCycleLayoutRunning;
  const effectiveSetIsCycleLayoutRunning = setIsCycleLayoutRunning || setInternalIsCycleLayoutRunning;

  const [internalPhaseHarmonicResult, setInternalPhaseHarmonicResult] = useState<MK1PalettePhaseHarmonicResult | null>(null);
  const [internalIsPhaseHarmonicRunning, setInternalIsPhaseHarmonicRunning] = useState(false);

  const effectivePhaseHarmonicResult = phaseHarmonicResult !== undefined ? phaseHarmonicResult : internalPhaseHarmonicResult;
  const effectiveSetPhaseHarmonicResult = setPhaseHarmonicResult || setInternalPhaseHarmonicResult;
  const effectiveIsPhaseHarmonicRunning = isPhaseHarmonicRunning !== undefined ? isPhaseHarmonicRunning : internalIsPhaseHarmonicRunning;
  const effectiveSetIsPhaseHarmonicRunning = setIsPhaseHarmonicRunning || setInternalIsPhaseHarmonicRunning;

  const [internalFusionResult, setInternalFusionResult] = useState<MK1PaletteCandidateEvidenceFusionResult | null>(null);
  const effectiveFusionResult = fusionResult !== undefined ? fusionResult : internalFusionResult;
  const effectiveSetFusionResult = setFusionResult || setInternalFusionResult;

  const [internalChainResult, setInternalChainResult] = useState<MK1PaletteReferenceChainReconResult | null>(null);
  const effectiveChainResult = chainResult !== undefined ? chainResult : internalChainResult;
  const effectiveSetChainResult = setChainResult || setInternalChainResult;

  const [internalOperandUseResult, setInternalOperandUseResult] = useState<MK1PaletteOperandUseResult | null>(null);
  const effectiveOperandUseResult = operandUseResult !== undefined ? operandUseResult : internalOperandUseResult;
  const effectiveSetOperandUseResult = setOperandUseResult || setInternalOperandUseResult;

  const [internalTargetEntryResult, setInternalTargetEntryResult] = useState<MK1PaletteTargetEntryReconResult | null>(null);
  const effectiveTargetEntryResult = targetEntryResult !== undefined ? targetEntryResult : internalTargetEntryResult;
  const effectiveSetTargetEntryResult = setTargetEntryResult || setInternalTargetEntryResult;

  const [internalConvergentResult, setInternalConvergentResult] = useState<MK1PaletteConvergentEntryResult | null>(null);
  const effectiveConvergentResult = convergentResult !== undefined ? convergentResult : internalConvergentResult;
  const effectiveSetConvergentResult = setConvergentResult || setInternalConvergentResult;

  const [internalSeedFixupResult, setInternalSeedFixupResult] = useState<MK1PaletteSeedFixupQualificationResult | null>(null);
  const effectiveSeedFixupResult = seedFixupResult !== undefined ? seedFixupResult : internalSeedFixupResult;
  const effectiveSetSeedFixupResult = setSeedFixupResult || setInternalSeedFixupResult;

  const [internalSegmentQualificationResult, setInternalSegmentQualificationResult] = useState<MK1PaletteSegmentQualificationResult | null>(null);
  const effectiveSegmentQualificationResult = segmentQualificationResult !== undefined ? segmentQualificationResult : internalSegmentQualificationResult;
  const effectiveSetSegmentQualificationResult = setSegmentQualificationResult || setInternalSegmentQualificationResult;

  const [subPass, setSubPass] = useState<'recon' | 'context' | 'repeated_structure' | 'cycle_layout' | 'phase_harmonic' | 'evidence_fusion' | 'reference_chain' | 'operand_use' | 'target_entry' | 'convergent_entry' | 'seed_fixup' | 'segment_qualification'>('recon');

  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Candidate explorer state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with-hits' | 'zero-hits'>('all');
  const [sortBy, setSortBy] = useState<'hits-desc' | 'score-desc' | 'offset-asc'>('hits-desc');
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Prerequisite validation
  const hasPaletteScan = !!sharedPaletteResult;
  const hasTopology = !!report?.topology;
  const hasCorrelation = !!correlationResult && correlationResult.status !== 'FAILED';
  const allPrerequisitesMet = hasPaletteScan && hasTopology && hasCorrelation;

  const handleRunRecon = async () => {
    if (!report || !sharedPaletteResult || !correlationResult) return;

    setErrorMsg(null);
    setIsReconRunning(true);
    setProgressVal(0.05);
    setProgressMsg('Initializing reconnaissance pipeline...');

    try {
      const result = await performPaletteReferenceReconnaissance(
        source,
        sharedPaletteResult,
        report.topology,
        report.objects,
        correlationResult,
        {
          exePath: report.exePath,
          exeSize: report.exeSize,
          pageSize: report.parsedHeader?.pageSize ?? 4096,
          onProgress: (stage, prog) => {
            setProgressMsg(stage);
            setProgressVal(prog);
          },
        },
      );

      if (result.status === 'FAILED') {
        setErrorMsg(result.failureReason || 'Reconnaissance execution failed');
      } else {
        setReconResult(result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Reconnaissance exception: ${msg}`);
    } finally {
      setIsReconRunning(false);
      setProgressMsg(null);
    }
  };

  const handleExportJson = () => {
    if (!reconResult || !sharedPaletteResult || !report || !correlationResult) return;

    const exportData = createMK1CompactPaletteReferenceReconExport(
      reconResult,
      sharedPaletteResult,
      report.topology,
      correlationResult,
    );

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_palette_reference_recon_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter and sort candidates
  const filteredCandidates = React.useMemo(() => {
    if (!reconResult) return [];

    return reconResult.candidateSummaries
      .filter((c) => {
        if (filterMode === 'with-hits' && c.externalOccurrenceCount === 0) return false;
        if (filterMode === 'zero-hits' && c.externalOccurrenceCount > 0) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (
            c.candidateId.toLowerCase().includes(q) ||
            c.byteStartHex.toLowerCase().includes(q) ||
            c.targetRegionId.toLowerCase().includes(q) ||
            c.contentHash.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'hits-desc') {
          return b.externalOccurrenceCount - a.externalOccurrenceCount || a.byteStart - b.byteStart;
        }
        if (sortBy === 'score-desc') {
          return b.researchScore - a.researchScore || a.byteStart - b.byteStart;
        }
        return a.byteStart - b.byteStart;
      });
  }, [reconResult, filterMode, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1;
  const pagedCandidates = filteredCandidates.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Prerequisite Check Banner if Missing */}
      {!allPrerequisitesMet && (
        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Reconnaissance Prerequisites Not Met</span>
          </div>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            Palette reference reconnaissance requires three verified inputs to guarantee deterministic correlation.
            Please perform the missing prerequisite steps:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
            <div
              className={`p-3 rounded border flex items-center gap-2 ${
                hasPaletteScan
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {hasPaletteScan ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
              <span>1. Palette Scan</span>
            </div>
            <div
              className={`p-3 rounded border flex items-center gap-2 ${
                hasTopology
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {hasTopology ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
              <span>2. Executable Topology</span>
            </div>
            <div
              className={`p-3 rounded border flex items-center gap-2 ${
                hasCorrelation
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {hasCorrelation ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
              <span>3. Region Correlation</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Pass Tab Switcher */}
      <div className="flex border-b border-zinc-800 text-xs font-mono">
        <button
          onClick={() => setSubPass('recon')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'recon'
              ? 'border-amber-500 text-amber-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.1 — Exact Representation Recon</span>
          {reconResult && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-800 text-amber-300">
              {reconResult.globalSummary.targetsWithExternalExactOccurrences} hits
            </span>
          )}
        </button>

        <button
          onClick={() => setSubPass('context')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'context'
              ? 'border-sky-500 text-sky-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.2 — Occurrence Context (Shapes & Clusters)</span>
          {effectiveContextResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 border border-sky-800 text-sky-300">
              Analyzed ({effectiveContextResult.trackB.totalPositionsAnalyzed})
            </span>
          ) : reconResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setSubPass('repeated_structure')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'repeated_structure'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.3 — Repeated Structural Context</span>
          {effectiveRepeatedStructureResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
              Analyzed ({effectiveRepeatedStructureResult.globalStructuralSummary.b2ClustersProcessed} clusters)
            </span>
          ) : effectiveContextResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setSubPass('cycle_layout')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'cycle_layout'
              ? 'border-purple-500 text-purple-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.4 — Cycle Layout Recon</span>
          {effectiveCycleLayoutResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300">
              Analyzed ({effectiveCycleLayoutResult.globalSummary.uniquePhysicalCyclePopulations} populations)
            </span>
          ) : effectiveRepeatedStructureResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setSubPass('phase_harmonic')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'phase_harmonic'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.5 — Phase Recurrence</span>
          {effectivePhaseHarmonicResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
              Analyzed ({effectivePhaseHarmonicResult.globalSummary.physicalPopulationsAnalyzed} populations)
            </span>
          ) : effectiveCycleLayoutResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setSubPass('evidence_fusion')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'evidence_fusion'
              ? 'border-teal-500 text-teal-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.6 — Evidence Fusion</span>
          {effectiveFusionResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-950 border border-teal-800 text-teal-300">
              Fused ({effectiveFusionResult.candidateProfiles.length})
            </span>
          ) : reconResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setSubPass('reference_chain')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'reference_chain'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.7 — Reference Chains</span>
          {effectiveChainResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              Chains ({effectiveChainResult.candidateChainSummaries.length})
            </span>
          ) : effectiveFusionResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setSubPass('operand_use')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'operand_use'
              ? 'border-cyan-500 text-cyan-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.8 — Operand Use</span>
          {effectiveOperandUseResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              Operands ({effectiveOperandUseResult.interpretations.length})
            </span>
          ) : effectiveChainResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          id="subpass-btn-target-entry"
          onClick={() => setSubPass('target_entry')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'target_entry'
              ? 'border-indigo-500 text-indigo-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.9 — Target Entry</span>
          {effectiveTargetEntryResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
              Qualified ({effectiveTargetEntryResult.targetBoundary.boundaryClassification})
            </span>
          ) : effectiveOperandUseResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          id="subpass-btn-convergent-entry"
          onClick={() => setSubPass('convergent_entry')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'convergent_entry'
              ? 'border-amber-500 text-amber-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.10 — Convergent Entry</span>
          {effectiveConvergentResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-800 text-amber-300">
              Converged ({effectiveConvergentResult.targetNumericAddressHex})
            </span>
          ) : effectiveTargetEntryResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          id="subpass-btn-seed-fixup"
          onClick={() => setSubPass('seed_fixup')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'seed_fixup'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.10c — Seed Fixup</span>
          {effectiveSeedFixupResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
              Qualified ({effectiveSeedFixupResult.seedFields.length} Seeds)
            </span>
          ) : report ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>

        <button
          id="subpass-btn-segment-qualification"
          onClick={() => setSubPass('segment_qualification')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            subPass === 'segment_qualification'
              ? 'border-purple-500 text-purple-400 bg-zinc-900/50'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Pass 1E.2B.10d — Segment Qualification</span>
          {effectiveSegmentQualificationResult ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300">
              Qualified ({effectiveSegmentQualificationResult.models.modelB.reachesBothAssociatedPayloads ? 'Model B' : 'Evaluated'})
            </span>
          ) : report ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              Ready
            </span>
          ) : null}
        </button>
      </div>

      {subPass === 'segment_qualification' ? (
        !report ? (
          <div id="b10d-prereq-missing" className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Pipelines Not Yet Executed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Pass 1E.2B.10d requires verified executable layout analysis with parsed LE header and page map.
            </p>
          </div>
        ) : (
          <MK1PaletteSegmentQualificationView
            source={source}
            report={report}
            convergentResult={effectiveConvergentResult}
            seedFixupResult={effectiveSeedFixupResult}
            segmentQualificationResult={effectiveSegmentQualificationResult}
            setSegmentQualificationResult={effectiveSetSegmentQualificationResult}
            onNavigateToTab={(tab) => {
              if (tab === 'convergent_entry') setSubPass('convergent_entry');
              if (tab === 'seed_fixup') setSubPass('seed_fixup');
            }}
          />
        )
      ) : subPass === 'seed_fixup' ? (
        !report ? (
          <div id="b10c-prereq-missing" className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Pipelines Not Yet Executed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Pass 1E.2B.10c requires verified executable layout analysis with parsed LE header and page map.
            </p>
          </div>
        ) : (
          <MK1PaletteSeedFixupQualificationView
            source={source}
            report={report}
            seedFixupResult={effectiveSeedFixupResult}
            setSeedFixupResult={effectiveSetSeedFixupResult}
            onNavigateToTab={(tab) => {
              if (tab === 'convergent_entry') setSubPass('convergent_entry');
            }}
          />
        )
      ) : subPass === 'convergent_entry' ? (
        !reconResult || !report || !effectiveOperandUseResult || !effectiveTargetEntryResult ? (
          <div id="b10-prereq-missing" className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Pipelines Not Yet Executed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Pass 1E.2B.10 requires verified layout analysis, completed operand-use reconnaissance (Pass 1E.2B.8), and qualified target-entry reconnaissance (Pass 1E.2B.9).
            </p>
            <button
              onClick={() => setSubPass('target_entry')}
              className="px-4 py-2 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.9
            </button>
          </div>
        ) : (
          <MK1PaletteConvergentEntryView
            source={source}
            report={report}
            operandUseResult={effectiveOperandUseResult}
            targetEntryResult={effectiveTargetEntryResult}
            convergentResult={effectiveConvergentResult}
            setConvergentResult={effectiveSetConvergentResult}
            onNavigateToTab={(tab) => {
              if (tab === 'target_entry') setSubPass('target_entry');
            }}
          />
        )
      ) : subPass === 'target_entry' ? (
        !reconResult || !report || !effectiveOperandUseResult ? (
          <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Pipelines Not Yet Executed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Pass 1E.2B.9 requires verified layout analysis and completed operand-use reconnaissance (Pass 1E.2B.8).
            </p>
            <button
              onClick={() => setSubPass('operand_use')}
              className="px-4 py-2 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.8
            </button>
          </div>
        ) : (
          <MK1PaletteTargetEntryView
            source={source}
            report={report}
            operandUseResult={effectiveOperandUseResult}
            targetEntryResult={effectiveTargetEntryResult}
            setTargetEntryResult={effectiveSetTargetEntryResult}
            onNavigateToTab={(tab) => {
              if (tab === 'operand_use') setSubPass('operand_use');
            }}
          />
        )
      ) : subPass === 'operand_use' ? (
        !reconResult || !report || !effectiveContextResult || !effectiveFusionResult || !effectiveChainResult ? (
          <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Pipelines Not Yet Executed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Pass 1E.2B.8 requires verified layout analysis, occurrence context (Pass 1E.2B.2), candidate evidence fusion (Pass 1E.2B.6), and reference chain reconnaissance (Pass 1E.2B.7).
            </p>
            <button
              onClick={() => setSubPass('reference_chain')}
              className="px-4 py-2 rounded text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.7
            </button>
          </div>
        ) : (
          <MK1PaletteOperandUseView
            source={source}
            report={report}
            b1Result={reconResult}
            contextResult={effectiveContextResult}
            fusionResult={effectiveFusionResult}
            chainResult={effectiveChainResult}
            operandUseResult={effectiveOperandUseResult}
            setOperandUseResult={effectiveSetOperandUseResult}
            onNavigateToTab={(tab) => {
              if (tab === 'reference_chain') setSubPass('reference_chain');
            }}
          />
        )
      ) : subPass === 'reference_chain' ? (
        !reconResult || !report ? (
          <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Reconnaissance Not Yet Executed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Milestone 1E.2B.7 requires verified exact reference reconnaissance from Pass 1E.2B.1 and fusion profiles from Pass 1E.2B.6.
            </p>
            <button
              onClick={() => setSubPass('recon')}
              className="px-4 py-2 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.1
            </button>
          </div>
        ) : (
          <MK1PaletteReferenceChainView
            source={source}
            report={report}
            b1Result={reconResult}
            contextResult={effectiveContextResult}
            repeatedStructureResult={effectiveRepeatedStructureResult}
            cycleLayoutResult={effectiveCycleLayoutResult}
            phaseHarmonicResult={effectivePhaseHarmonicResult}
            fusionResult={effectiveFusionResult}
            chainResult={effectiveChainResult}
            setChainResult={effectiveSetChainResult}
            onNavigateToTab={(tab) => {
              if (tab === 'evidence_fusion') setSubPass('evidence_fusion');
            }}
          />
        )
      ) : subPass === 'evidence_fusion' ? (
        !reconResult || !report ? (
          <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Reconnaissance Not Yet Executed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Milestone 1E.2B.6 requires verified exact reference reconnaissance from Pass 1E.2B.1.
              Please run Pass 1E.2B.1 first.
            </p>
            <button
              onClick={() => setSubPass('recon')}
              className="px-4 py-2 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.1
            </button>
          </div>
        ) : (
          <MK1PaletteCandidateEvidenceFusionView
            report={report}
            reconResult={reconResult}
            catalogueCandidates={
              sharedPaletteResult?.candidates?.filter((c) => c.tier === 'research') ?? null
            }
            contextResult={effectiveContextResult}
            repeatedStructureResult={effectiveRepeatedStructureResult}
            cycleLayoutResult={effectiveCycleLayoutResult}
            phaseHarmonicResult={effectivePhaseHarmonicResult}
            fusionResult={effectiveFusionResult}
            setFusionResult={effectiveSetFusionResult}
            onNavigateToTab={(tab) => {
              if (tab === 'phase_harmonic') setSubPass('phase_harmonic');
            }}
          />
        )
      ) : subPass === 'phase_harmonic' ? (
        !reconResult || !report || !effectiveContextResult || !effectiveRepeatedStructureResult || !effectiveCycleLayoutResult ? (
          <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Cycle Layout Not Yet Analyzed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Milestone 1E.2B.5 requires verified physical cycle populations and period candidates from Pass 1E.2B.4.
              Please run Pass 1E.2B.4 first.
            </p>
            <button
              onClick={() => setSubPass('cycle_layout')}
              className="px-4 py-2 rounded text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.4
            </button>
          </div>
        ) : (
          <MK1PalettePhaseHarmonicView
            source={source}
            report={report}
            reconResult={reconResult}
            contextResult={effectiveContextResult}
            repeatedStructureResult={effectiveRepeatedStructureResult}
            cycleLayoutResult={effectiveCycleLayoutResult}
            phaseHarmonicResult={effectivePhaseHarmonicResult}
            setPhaseHarmonicResult={effectiveSetPhaseHarmonicResult}
            isPhaseHarmonicRunning={effectiveIsPhaseHarmonicRunning}
            setIsPhaseHarmonicRunning={effectiveSetIsPhaseHarmonicRunning}
            onNavigateToTab={(tab) => {
              if (tab === 'cycle_layout') setSubPass('cycle_layout');
            }}
          />
        )
      ) : subPass === 'cycle_layout' ? (
        !reconResult || !report || !effectiveContextResult || !effectiveRepeatedStructureResult ? (
          <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Repeated Structures Not Yet Analyzed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Milestone 1E.2B.4 requires verified repeated physical cycle populations from Pass 1E.2B.3.
              Please run Pass 1E.2B.3 first.
            </p>
            <button
              onClick={() => setSubPass('repeated_structure')}
              className="px-4 py-2 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.3
            </button>
          </div>
        ) : (
          <MK1PaletteCycleLayoutView
            source={source}
            report={report}
            reconResult={reconResult}
            contextResult={effectiveContextResult}
            repeatedStructureResult={effectiveRepeatedStructureResult}
            cycleLayoutResult={effectiveCycleLayoutResult}
            setCycleLayoutResult={effectiveSetCycleLayoutResult}
            isCycleLayoutRunning={effectiveIsCycleLayoutRunning}
            setIsCycleLayoutRunning={effectiveSetIsCycleLayoutRunning}
            onNavigateToTab={(tab) => {
              if (tab === 'repeated_structure') setSubPass('repeated_structure');
            }}
          />
        )
      ) : subPass === 'repeated_structure' ? (
        !reconResult || !report || !effectiveContextResult ? (
          <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3 font-mono">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Occurrence Context Not Yet Analyzed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Milestone 1E.2B.3 requires verified physical clusters and classified contexts from Pass 1E.2B.2.
              Please run Pass 1E.2B.2 first.
            </p>
            <button
              onClick={() => setSubPass('context')}
              className="px-4 py-2 rounded text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-zinc-950 cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.2
            </button>
          </div>
        ) : (
          <MK1PaletteRepeatedStructureView
            source={source}
            report={report}
            reconResult={reconResult}
            contextResult={effectiveContextResult}
            repeatedStructureResult={effectiveRepeatedStructureResult}
            setRepeatedStructureResult={effectiveSetRepeatedStructureResult}
            isRepeatedStructureRunning={effectiveIsRepeatedStructureRunning}
            setIsRepeatedStructureRunning={effectiveSetIsRepeatedStructureRunning}
          />
        )
      ) : subPass === 'context' ? (
        !reconResult || !report ? (
          <div className="p-6 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-semibold text-zinc-200">Prerequisite Reconnaissance Not Yet Performed</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              Milestone 1E.2B.2 investigates the structural context surrounding the occurrences discovered in Pass 1E.2B.1.
              Please run Pass 1E.2B.1 (Exact Representation Reconnaissance) first.
            </p>
            <button
              onClick={() => setSubPass('recon')}
              className="px-4 py-2 rounded text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-zinc-950 cursor-pointer font-sans"
            >
              Go to Pass 1E.2B.1
            </button>
          </div>
        ) : (
          <MK1PaletteOccurrenceContextView
            source={source}
            report={report}
            reconResult={reconResult}
            contextResult={effectiveContextResult}
            setContextResult={effectiveSetContextResult}
            isContextRunning={effectiveIsContextRunning}
            setIsContextRunning={effectiveSetIsContextRunning}
          />
        )
      ) : (
        <>
          {/* Header & Run Control */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">
              Palette Reference / Context Reconnaissance
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-400">
              Milestone 1E.2B.1
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-sans mt-1">
            Empirical search for exact 32-bit little-endian candidate address representations across MK1.EXE.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {reconResult && (
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export compact JSON following mk1_palette_reference_recon_v1 schema"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              Export Recon JSON
            </button>
          )}

          <button
            onClick={handleRunRecon}
            disabled={!allPrerequisitesMet || isReconRunning}
            className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              !allPrerequisitesMet || isReconRunning
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold shadow'
            }`}
          >
            {isReconRunning ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Reference Reconnaissance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Display */}
      {isReconRunning && (
        <div className="p-4 rounded-lg bg-zinc-950 border border-amber-900/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400">
            <span>{progressMsg || 'Processing...'}</span>
            <span>{Math.round(progressVal * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-amber-500 transition-all duration-200"
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
            <div className="font-semibold">Reconnaissance Error</div>
            <div className="mt-0.5 font-mono">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Epistemic Guardrail Notice */}
      <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400 font-sans">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-200">Core Epistemic Principle: </span>
          <span className="font-mono text-amber-300 font-bold">EXACT UINT32 OCCURRENCE != POINTER</span>.
          An exact 32-bit value occurrence is empirical evidence of a value occurrence. It is not automatically a pointer, reference, palette owner, table entry, instruction operand, runtime address, or resource relationship.
        </div>
      </div>

      {/* Main Reconnaissance Dashboard */}
      {reconResult && (
        <div className="space-y-6">
          {/* Top-Level Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Research Targets</div>
              <div className="text-lg font-bold text-zinc-100 mt-1">
                {reconResult.globalSummary.totalResearchTargets.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">100% evaluated</div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">With External Hits</div>
              <div className="text-lg font-bold text-amber-400 mt-1">
                {reconResult.globalSummary.targetsWithExternalExactOccurrences.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {reconResult.globalSummary.percentageTargetsWithExternalOccurrences}% of targets
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Zero External Hits</div>
              <div className="text-lg font-bold text-zinc-400 mt-1">
                {reconResult.globalSummary.targetsWithNoExternalExactOccurrences.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                {(100 - reconResult.globalSummary.percentageTargetsWithExternalOccurrences).toFixed(2)}% of targets
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">External Matches</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {reconResult.globalSummary.totalExternalLogicalMatches.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Logical occurrences</div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Unique Physical Hits</div>
              <div className="text-lg font-bold text-cyan-400 mt-1">
                {reconResult.globalSummary.uniqueExternalPhysicalOccurrencePositions.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Distinct EXE offsets</div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">Self Occurrences</div>
              <div className="text-lg font-bold text-zinc-300 mt-1">
                {reconResult.globalSummary.totalSelfOccurrences.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Inside palette span</div>
            </div>
          </div>

          {/* Hit Distribution Buckets */}
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              External Occurrence Distribution Across Research Targets
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs pt-1">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-500 text-[10px]">0 External Matches</div>
                <div className="text-sm font-bold text-zinc-400 mt-0.5">
                  {reconResult.globalSummary.candidatesWith0ExternalOccurrences.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-500 text-[10px]">Exactly 1 Match</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">
                  {reconResult.globalSummary.candidatesWith1ExternalOccurrence.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-500 text-[10px]">2 to 5 Matches</div>
                <div className="text-sm font-bold text-zinc-200 mt-0.5">
                  {reconResult.globalSummary.candidatesWith2To5ExternalOccurrences.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-500 text-[10px]">6 to 20 Matches</div>
                <div className="text-sm font-bold text-zinc-200 mt-0.5">
                  {reconResult.globalSummary.candidatesWith6To20ExternalOccurrences.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-zinc-500 text-[10px]">&gt; 20 Matches</div>
                <div className="text-sm font-bold text-zinc-200 mt-0.5">
                  {reconResult.globalSummary.candidatesWithMoreThan20ExternalOccurrences.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Representation Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Representation Breakdown
              </h4>
              <span className="text-[11px] text-zinc-500 font-mono">
                6 Hypothesis Representations
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Representation Kind</th>
                    <th className="py-2.5 px-3">Eligible Targets</th>
                    <th className="py-2.5 px-3">Targets With &gt;=1 Match</th>
                    <th className="py-2.5 px-3">% Targets</th>
                    <th className="py-2.5 px-3">Total External Matches</th>
                    <th className="py-2.5 px-3">Unique Physical Hit Offsets</th>
                    <th className="py-2.5 px-3">Dominant Source Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {reconResult.representationSummaries.map((rep) => {
                    const topSource = Object.entries(rep.sourceRegionHistogram).sort((a, b) => b[1] - a[1])[0];
                    return (
                      <tr key={rep.representationKind} className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 font-semibold text-amber-400">
                          {rep.representationKind}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          {rep.eligibleTargetCount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-200 font-bold">
                          {rep.targetsWithAnyExternalOccurrence.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          {rep.percentageWithAnyExternalOccurrence}%
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">
                          {rep.totalExternalLogicalMatches.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300">
                          {rep.uniquePhysicalOccurrenceCount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          {topSource ? `${topSource[0]} (${topSource[1]})` : 'None'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Target Region Summary & Source x Target Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Target Region Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Target Region Occurrence Summary
              </h4>
              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Target Region</th>
                      <th className="py-2 px-3">Candidates</th>
                      <th className="py-2 px-3">With Hits</th>
                      <th className="py-2 px-3">%</th>
                      <th className="py-2 px-3">Total External</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {reconResult.targetRegionSummaries.map((tr) => (
                      <tr key={tr.regionId} className="hover:bg-zinc-900/40">
                        <td className="py-2 px-3 font-semibold text-zinc-200">
                          {tr.regionId}
                        </td>
                        <td className="py-2 px-3 text-zinc-400">{tr.candidateCount}</td>
                        <td className="py-2 px-3 text-amber-400 font-bold">{tr.candidatesWithAnyExternalOccurrence}</td>
                        <td className="py-2 px-3 text-zinc-400">{tr.percentageWithAnyExternalOccurrence}%</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">{tr.totalExternalOccurrenceCount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Source x Target Region Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Source Region × Target Region Matrix
              </h4>
              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Target Region</th>
                      <th className="py-2 px-3">Source Region</th>
                      <th className="py-2 px-3 text-right">External Matches</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {reconResult.sourceTargetMatrix.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-zinc-500 italic">
                          No external matches recorded
                        </td>
                      </tr>
                    ) : (
                      reconResult.sourceTargetMatrix.map((cell, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/40">
                          <td className="py-1.5 px-3 text-zinc-300">{cell.targetRegionId}</td>
                          <td className="py-1.5 px-3 text-zinc-400">{cell.sourceRegionId}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-emerald-400">
                            {cell.externalOccurrenceCount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section: Known-Anchor Control Targets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Known-Anchor Control Targets (Completely Segregated)</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                NON-PALETTE CONTROL SET
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Control Anchor</th>
                    <th className="py-2.5 px-3">Physical Offset</th>
                    <th className="py-2.5 px-3">Tested Representations</th>
                    <th className="py-2.5 px-3">Logical Matches</th>
                    <th className="py-2.5 px-3">Unique Offsets</th>
                    <th className="py-2.5 px-3">External Matches</th>
                    <th className="py-2.5 px-3">Source Regions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {reconResult.controlTargets.map((ctrl) => (
                    <tr key={ctrl.name} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-semibold text-cyan-300">{ctrl.name}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{ctrl.physicalOffsetHex}</td>
                      <td className="py-2.5 px-3 text-[11px] text-zinc-400 space-y-0.5">
                        {ctrl.representationsTested.map((r, rIdx) => (
                          <div key={rIdx}>
                            <span className="text-zinc-500">{r.name}:</span> {r.valueHex}
                          </div>
                        ))}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-zinc-200">{ctrl.totalLogicalMatches}</td>
                      <td className="py-2.5 px-3 text-zinc-300">{ctrl.uniquePhysicalOccurrences}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{ctrl.externalOccurrences}</td>
                      <td className="py-2.5 px-3 text-[10px] text-zinc-400 space-y-0.5">
                        {Object.entries(ctrl.sourceRegionDistribution).map(([reg, count]) => (
                          <div key={reg}>
                            {reg}: <span className="font-bold text-zinc-300">{count}</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Next Step Milestone 1E.2B.2 Callout */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-sky-950/40 via-zinc-950 to-zinc-950 border border-sky-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Next Step: Milestone 1E.2B.2 — Palette Occurrence Context Reconnaissance</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans">
                Analyze structural context surrounding the {reconResult.globalSummary.uniqueExternalPhysicalOccurrencePositions} physical hits via whitelisted x86 operand shapes & spatial clustering.
              </p>
            </div>
            <button
              onClick={() => setSubPass('context')}
              className="px-3.5 py-1.5 rounded text-xs font-bold bg-sky-600 hover:bg-sky-500 text-zinc-950 flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto shadow font-sans"
            >
              <span>Analyze Occurrence Context (1E.2B.2)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section: Candidate Occurrence Explorer */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Candidate Occurrence Explorer
                </h4>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Showing {filteredCandidates.length} of {reconResult.candidateSummaries.length} research targets
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search candidate ID, offset, region..."
                    className="pl-8 pr-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
                  />
                </div>

                {/* Filter mode */}
                <div className="flex rounded border border-zinc-800 overflow-hidden text-xs">
                  <button
                    onClick={() => {
                      setFilterMode('all');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1.5 ${
                      filterMode === 'all' ? 'bg-zinc-800 text-amber-400 font-semibold' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All ({reconResult.candidateSummaries.length})
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('with-hits');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1.5 border-l border-zinc-800 ${
                      filterMode === 'with-hits' ? 'bg-zinc-800 text-amber-400 font-semibold' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    With Hits ({reconResult.globalSummary.targetsWithExternalExactOccurrences})
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('zero-hits');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1.5 border-l border-zinc-800 ${
                      filterMode === 'zero-hits' ? 'bg-zinc-800 text-amber-400 font-semibold' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Zero Hits ({reconResult.globalSummary.targetsWithNoExternalExactOccurrences})
                  </button>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="hits-desc">Sort: External Hits (High to Low)</option>
                  <option value="score-desc">Sort: Research Score (High to Low)</option>
                  <option value="offset-asc">Sort: Physical Offset (Ascending)</option>
                </select>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-3 w-8"></th>
                    <th className="py-2 px-3">Candidate ID / Offset</th>
                    <th className="py-2 px-3">Target Region</th>
                    <th className="py-2 px-3">Score</th>
                    <th className="py-2 px-3">External Hits</th>
                    <th className="py-2 px-3">Physical Hits</th>
                    <th className="py-2 px-3">Hits by Representation</th>
                    <th className="py-2 px-3">Source Regions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {pagedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-zinc-500 italic">
                        No candidates match current search / filter
                      </td>
                    </tr>
                  ) : (
                    pagedCandidates.map((cand) => {
                      const isExpanded = expandedCandidateId === cand.candidateId;
                      const candOccurrences = reconResult.detailedOccurrences.filter(
                        (o) => o.targetCandidateId === cand.candidateId,
                      );

                      return (
                        <React.Fragment key={cand.candidateId}>
                          <tr
                            onClick={() => setExpandedCandidateId(isExpanded ? null : cand.candidateId)}
                            className="hover:bg-zinc-900/40 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-3 text-zinc-500">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-amber-400">{cand.candidateId}</div>
                              <div className="text-[10px] text-zinc-500">
                                {cand.byteStartHex} .. {cand.byteEndHex} (len {cand.length})
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-zinc-300 font-semibold">{cand.targetRegionId}</span>
                              {cand.objectNumber && (
                                <span className="ml-1 text-[10px] text-zinc-500">(Obj {cand.objectNumber})</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-zinc-200 font-bold">{cand.researchScore}</span>
                              {cand.zeroShiftKanoCompatible && (
                                <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/70 text-emerald-300">
                                  KANO
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold ${
                                  cand.externalOccurrenceCount > 0 ? 'text-emerald-400 text-sm' : 'text-zinc-600'
                                }`}
                              >
                                {cand.externalOccurrenceCount}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400">
                              {cand.totalUniquePhysicalOccurrences}
                            </td>
                            <td className="py-2.5 px-3 text-[10px] text-zinc-400 space-y-0.5">
                              {Object.entries(cand.externalByRepresentation)
                                .filter(([, count]) => count > 0)
                                .map(([rep, count]) => (
                                  <div key={rep}>
                                    <span className="text-zinc-500">{rep}:</span>{' '}
                                    <span className="font-bold text-amber-300">{count}</span>
                                  </div>
                                ))}
                              {cand.externalOccurrenceCount === 0 && (
                                <span className="text-zinc-600 italic">None</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[10px] text-zinc-400 space-y-0.5">
                              {Object.entries(cand.externalBySourceRegion).map(([reg, count]) => (
                                <div key={reg}>
                                  {reg}: <span className="font-bold text-zinc-300">{count}</span>
                                </div>
                              ))}
                              {cand.externalOccurrenceCount === 0 && (
                                <span className="text-zinc-600 italic">None</span>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Occurrence Details */}
                          {isExpanded && (
                            <tr className="bg-zinc-950">
                              <td colSpan={8} className="p-4 border-t border-b border-zinc-800/80">
                                <div className="space-y-4">
                                  {/* Candidate Representation Values */}
                                  <div>
                                    <h5 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                                      Derived Representations for {cand.candidateId}
                                    </h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                                      {Object.values(cand.representations).map((rep) => (
                                        <div
                                          key={rep.kind}
                                          className="p-2 rounded bg-zinc-900 border border-zinc-800"
                                        >
                                          <div className="text-zinc-500 text-[10px]">{rep.kind}</div>
                                          <div className="font-bold text-zinc-200 mt-0.5">
                                            {rep.status === 'generated' ? (
                                              <span className="text-amber-300">{rep.valueHex}</span>
                                            ) : (
                                              <span className="text-zinc-600 italic">N/A ({rep.reason || 'unmapped'})</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Detailed Occurrences List */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                                        Recorded Value Occurrences in MK1.EXE ({candOccurrences.length} retained
                                        {cand.detailsTruncated ? ' - capped' : ''})
                                      </h5>
                                      {cand.detailsTruncated && (
                                        <span className="text-[10px] text-amber-400 font-mono">
                                          Detailed rows capped at 128 per representation
                                        </span>
                                      )}
                                    </div>

                                    {candOccurrences.length === 0 ? (
                                      <div className="p-3 text-center text-zinc-500 italic rounded bg-zinc-900/50 border border-zinc-800/60">
                                        No exact value occurrences detected anywhere in MK1.EXE.
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto rounded border border-zinc-800 max-h-64 overflow-y-auto">
                                        <table className="w-full text-left text-[11px] font-mono">
                                          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                                            <tr>
                                              <th className="py-1.5 px-2.5">Source File Offset</th>
                                              <th className="py-1.5 px-2.5">Source Region</th>
                                              <th className="py-1.5 px-2.5">Loaded Linear Address</th>
                                              <th className="py-1.5 px-2.5">Matched Value</th>
                                              <th className="py-1.5 px-2.5">Representation Kind</th>
                                              <th className="py-1.5 px-2.5">Alignment</th>
                                              <th className="py-1.5 px-2.5">Type</th>
                                              <th className="py-1.5 px-2.5">Context Window Hex</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
                                            {candOccurrences.map((occ, oIdx) => (
                                              <tr key={oIdx} className="hover:bg-zinc-900/30">
                                                <td className="py-1.5 px-2.5 font-bold text-zinc-200">
                                                  {occ.sourceFileOffsetHex}
                                                </td>
                                                <td className="py-1.5 px-2.5 text-zinc-400">
                                                  {occ.sourceRegionId}
                                                </td>
                                                <td className="py-1.5 px-2.5 text-cyan-300">
                                                  {occ.sourceLoadedAddressHex || 'N/A (unmapped)'}
                                                </td>
                                                <td className="py-1.5 px-2.5 text-amber-300">
                                                  {occ.matchedUint32Hex}
                                                </td>
                                                <td className="py-1.5 px-2.5 text-zinc-400">
                                                  {occ.representationKind}
                                                </td>
                                                <td className="py-1.5 px-2.5 text-zinc-500">
                                                  {occ.alignmentTag}
                                                </td>
                                                <td className="py-1.5 px-2.5">
                                                  {occ.isInsideTargetCandidateRange ? (
                                                    <span className="text-zinc-500">SELF</span>
                                                  ) : (
                                                    <span className="text-emerald-400 font-semibold">EXTERNAL</span>
                                                  )}
                                                </td>
                                                <td className="py-1.5 px-2.5 text-[10px] text-zinc-500 font-mono tracking-wider">
                                                  {occ.contextBytesHex}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-xs font-mono pt-2">
                <span className="text-zinc-500">
                  Page {page} of {totalPages}
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
        </>
      )}
    </div>
  );
}

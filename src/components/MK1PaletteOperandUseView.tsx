/**
 * MK1 Palette Operand Address-Space Compatibility &
 * Bounded Straight-Line Seed-Use Reconnaissance UI (Milestone 1E.2B.8a)
 *
 * Provides comprehensive exploration of operand semantics, linear address compatibility,
 * object-relative compatibility, straight-line trace results, and CALL-boundary target-space reconnaissance.
 */

import React, { useState, useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Cpu,
  Download,
  ExternalLink,
  Layers,
  RotateCcw,
  Search,
  ShieldAlert,
  Table,
  Terminal,
  XCircle,
} from 'lucide-react';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { MK1PaletteReferenceReconResult } from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteCandidateEvidenceFusionResult } from '../games/mk1/research/paletteCandidateEvidenceFusionTypes';
import { MK1PaletteReferenceChainReconResult } from '../games/mk1/research/paletteReferenceChainReconnaissanceTypes';
import {
  executePaletteOperandUseReconnaissance,
  createMK1PaletteOperandUseExport,
} from '../games/mk1/research/paletteOperandUseReconnaissance';
import {
  MK1PaletteOperandUseResult,
} from '../games/mk1/research/paletteOperandUseReconnaissanceTypes';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';

export interface MK1PaletteOperandUseViewProps {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport | null;
  b1Result?: MK1PaletteReferenceReconResult | null;
  contextResult: MK1PaletteOccurrenceContextResult | null;
  fusionResult: MK1PaletteCandidateEvidenceFusionResult | null;
  chainResult: MK1PaletteReferenceChainReconResult | null;
  operandUseResult: MK1PaletteOperandUseResult | null;
  setOperandUseResult?: (res: MK1PaletteOperandUseResult | null) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const MK1PaletteOperandUseView: React.FC<MK1PaletteOperandUseViewProps> = ({
  source,
  report,
  b1Result,
  contextResult,
  fusionResult,
  chainResult,
  operandUseResult: initialB8Result,
  setOperandUseResult,
}) => {
  const [internalResult, setInternalResult] = useState<MK1PaletteOperandUseResult | null>(null);
  const [selectedInterpId, setSelectedInterpId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [caughtError, setCaughtError] = useState<unknown | null>(null);
  const [activeTab, setActiveTab] = useState<
    'explorer' | 'candidates' | 'call-targets' | 'patterns' | 'reconciliation' | 'axioms'
  >('explorer');

  // 19 Composable Filters (including 15 contract filters)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSourceKind, setFilterSourceKind] = useState<string>('all'); // 1. Source Kind
  const [filterCandidate, setFilterCandidate] = useState<string>('all'); // 2. Associated Candidate
  const [filterShapeClass, setFilterShapeClass] = useState<string>('all'); // 3. Shape Class
  const [filterSemanticClass, setFilterSemanticClass] = useState<string>('all'); // 4. Semantic Class
  const [filterAssociationRepresentation, setFilterAssociationRepresentation] = useState<string>('all'); // 5. Association Representation
  const [filterAddressSpace, setFilterAddressSpace] = useState<string>('all'); // 6. Operand Address-Space
  const [filterLinearRes, setFilterLinearRes] = useState<string>('all'); // 7. Linear Address Resolution
  const [filterExactTargetMatch, setFilterExactTargetMatch] = useState<string>('all'); // 8. Exact Target Match
  const [filterRelocCompat, setFilterRelocCompat] = useState<string>('all'); // 9. Reloc Compatibility
  const [filterTraceStatus, setFilterTraceStatus] = useState<string>('all'); // 10. Seed Trace Status
  const [filterStopReason, setFilterStopReason] = useState<string>('all'); // 11. Stop Reason
  const [filterSeedLiveAtCall, setFilterSeedLiveAtCall] = useState<string>('all'); // 12. Seed Live at CALL (all/yes/no)
  const [filterRelocAdjusted, setFilterRelocAdjusted] = useState<string>('all'); // 13. Reloc Adjusted (all/yes/no)
  const [filterMemoryBaseUse, setFilterMemoryBaseUse] = useState<string>('all'); // 14. Memory Base Use (all/yes/no)
  const [filterMemoryIndexUse, setFilterMemoryIndexUse] = useState<string>('all'); // 15. Memory Index Use (all/yes/no)
  const [filterTargetCompatibleMemory, setFilterTargetCompatibleMemory] = useState<string>('all'); // 16. Target-Compatible Memory (all/yes/no)
  const [filterCallTopology, setFilterCallTopology] = useState<string>('all'); // 17. CALL Target Topology Class
  const [filterCallTarget, setFilterCallTarget] = useState<string>('all'); // 18. CALL Boundary Target Group
  const [filterDecisionPattern, setFilterDecisionPattern] = useState<string>('all'); // 19. Decision Pattern Match

  const b8Result = initialB8Result || internalResult;

  const candidateOptions = useMemo(() => {
    if (!b8Result) return [];
    const set = new Set<string>();
    for (const c of b8Result.candidateSummaries) set.add(c.candidateId);
    for (const i of b8Result.interpretations) {
      if (i.associatedCandidateId) set.add(i.associatedCandidateId);
    }
    return Array.from(set).sort();
  }, [b8Result]);

  const shapeClassOptions = useMemo(() => {
    if (!b8Result) return [];
    const set = new Set<string>();
    for (const i of b8Result.interpretations) set.add(i.shapeClass);
    return Array.from(set).sort();
  }, [b8Result]);

  const associationRepresentationOptions = useMemo(() => {
    if (!b8Result) return [];
    const set = new Set<string>();
    for (const i of b8Result.interpretations) {
      if (i.associatedRepresentationKind) set.add(i.associatedRepresentationKind);
    }
    return Array.from(set).sort();
  }, [b8Result]);

  const callTopologyOptions = useMemo(() => {
    if (!b8Result) return [];
    const set = new Set<string>();
    for (const i of b8Result.interpretations) {
      const topo = i.seedTrace?.callBoundaryTargetRecon?.targetTopologyClassification;
      if (topo) set.add(topo);
    }
    return Array.from(set).sort();
  }, [b8Result]);

  const callTargetOptions = useMemo(() => {
    if (!b8Result) return [];
    const set = new Set<string>();
    for (const g of b8Result.callBoundaryTargetGroups) set.add(g.boundaryTargetLinearHex);
    return Array.from(set).sort();
  }, [b8Result]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (filterSourceKind !== 'all') count++;
    if (filterCandidate !== 'all') count++;
    if (filterShapeClass !== 'all') count++;
    if (filterSemanticClass !== 'all') count++;
    if (filterAssociationRepresentation !== 'all') count++;
    if (filterAddressSpace !== 'all') count++;
    if (filterLinearRes !== 'all') count++;
    if (filterExactTargetMatch !== 'all') count++;
    if (filterRelocCompat !== 'all') count++;
    if (filterTraceStatus !== 'all') count++;
    if (filterStopReason !== 'all') count++;
    if (filterSeedLiveAtCall !== 'all') count++;
    if (filterRelocAdjusted !== 'all') count++;
    if (filterMemoryBaseUse !== 'all') count++;
    if (filterMemoryIndexUse !== 'all') count++;
    if (filterTargetCompatibleMemory !== 'all') count++;
    if (filterCallTopology !== 'all') count++;
    if (filterCallTarget !== 'all') count++;
    if (filterDecisionPattern !== 'all') count++;
    return count;
  }, [
    searchQuery,
    filterSourceKind,
    filterCandidate,
    filterShapeClass,
    filterSemanticClass,
    filterAssociationRepresentation,
    filterAddressSpace,
    filterLinearRes,
    filterExactTargetMatch,
    filterRelocCompat,
    filterTraceStatus,
    filterStopReason,
    filterSeedLiveAtCall,
    filterRelocAdjusted,
    filterMemoryBaseUse,
    filterMemoryIndexUse,
    filterTargetCompatibleMemory,
    filterCallTopology,
    filterCallTarget,
    filterDecisionPattern,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterSourceKind('all');
    setFilterCandidate('all');
    setFilterShapeClass('all');
    setFilterSemanticClass('all');
    setFilterAssociationRepresentation('all');
    setFilterAddressSpace('all');
    setFilterLinearRes('all');
    setFilterExactTargetMatch('all');
    setFilterRelocCompat('all');
    setFilterTraceStatus('all');
    setFilterStopReason('all');
    setFilterSeedLiveAtCall('all');
    setFilterRelocAdjusted('all');
    setFilterMemoryBaseUse('all');
    setFilterMemoryIndexUse('all');
    setFilterTargetCompatibleMemory('all');
    setFilterCallTopology('all');
    setFilterCallTarget('all');
    setFilterDecisionPattern('all');
  };

  // Prerequisites check
  const hasPrerequisites = useMemo(() => {
    return (
      report !== null &&
      contextResult !== null &&
      contextResult.status === 'SUCCESS' &&
      fusionResult !== null &&
      fusionResult.status === 'SUCCESS' &&
      chainResult !== null &&
      chainResult.status === 'SUCCESS'
    );
  }, [report, contextResult, fusionResult, chainResult]);

  const handleRunAnalysis = async () => {
    if (!hasPrerequisites || !report || !contextResult || !fusionResult || !chainResult) {
      return;
    }
    setIsRunning(true);
    setCaughtError(null);
    try {
      const buffer = await source.readSlice(report.exePath, 0, report.exeSize);
      if (!buffer) {
        throw new Error(`Failed to read ${report.exePath} from source`);
      }
      const res = executePaletteOperandUseReconnaissance(
        buffer,
        report,
        contextResult,
        fusionResult,
        chainResult,
      );
      setInternalResult(res);
      if (setOperandUseResult) {
        setOperandUseResult(res);
      }
      if (res.interpretations.length > 0) {
        setSelectedInterpId(res.interpretations[0].interpretationId);
      }
    } catch (err: unknown) {
      setCaughtError(err);
    } finally {
      setIsRunning(false);
    }
  };

  // Filtered interpretations
  const filteredInterpretations = useMemo(() => {
    if (!b8Result) return [];
    return b8Result.interpretations.filter((interp) => {
      // 1. Source Kind
      if (filterSourceKind !== 'all' && interp.sourceKind !== filterSourceKind) {
        return false;
      }
      // 2. Associated Candidate
      if (filterCandidate !== 'all' && interp.associatedCandidateId !== filterCandidate) {
        return false;
      }
      // 3. Whitelisted Shape Class
      if (filterShapeClass !== 'all' && interp.shapeClass !== filterShapeClass) {
        return false;
      }
      // 4. Semantic Class
      if (filterSemanticClass !== 'all' && interp.semanticClass !== filterSemanticClass) {
        return false;
      }
      // 5. Association Representation
      if (
        filterAssociationRepresentation !== 'all' &&
        interp.associatedRepresentationKind !== filterAssociationRepresentation
      ) {
        return false;
      }
      // 6. Operand Address-Space Interpretation
      if (filterAddressSpace !== 'all') {
        const isLoadedLinear =
          interp.associatedRepresentationKind === 'linear-structure-address' ||
          interp.associatedRepresentationKind === 'linear-payload-address';
        const isObjectRelative =
          interp.objectRelativeCompatibility.isObjectRelativeOperand ||
          interp.associatedRepresentationKind === 'object-relative-structure' ||
          interp.associatedRepresentationKind === 'object-relative-payload';
        const isPhysicalCandidate =
          interp.associatedRepresentationKind === 'physical-structure-start' ||
          interp.associatedRepresentationKind === 'physical-payload-start';

        if (filterAddressSpace === 'direct-loaded' && !isLoadedLinear) return false;
        if (filterAddressSpace === 'object-relative' && !isObjectRelative) return false;
        if (filterAddressSpace === 'physical-candidate' && !isPhysicalCandidate) return false;
      }
      // 7. Linear Address Resolution Class
      if (filterLinearRes !== 'all') {
        if (filterLinearRes === 'resolves-other' && interp.directLinearResolution !== 'resolves-other-loaded-location') return false;
        if (filterLinearRes === 'linear-unmapped' && interp.directLinearResolution !== 'linear-address-unmapped') return false;
        if (filterLinearRes !== 'resolves-other' && filterLinearRes !== 'linear-unmapped' && interp.directLinearResolution !== filterLinearRes) return false;
      }
      // 8. Exact Associated Target Match
      if (filterExactTargetMatch === 'yes' && !interp.directLinearMatchesAssociatedTarget) return false;
      if (filterExactTargetMatch === 'no' && interp.directLinearMatchesAssociatedTarget) return false;
      // 9. Object-Relative Relocation-Base Compatibility
      if (filterRelocCompat === 'compatible' && !interp.objectRelativeCompatibility.requiredBaseEqualsTargetObjectRelocationBase) return false;
      if (filterRelocCompat === 'incompatible' && interp.objectRelativeCompatibility.requiredBaseEqualsTargetObjectRelocationBase) return false;
      // 10. Seed Trace Status
      if (filterTraceStatus !== 'all') {
        if (filterTraceStatus === 'attempted' && !interp.seedTrace) return false;
        if (filterTraceStatus === 'ineligible' && !interp.seedTraceStatus.startsWith('not-applicable-')) return false;
        if (
          filterTraceStatus === 'skipped' &&
          interp.seedTraceStatus !== 'seed-traced-to-max-bytes' &&
          interp.seedTraceStatus !== 'seed-traced-to-max-instructions'
        ) {
          return false;
        }
        if (filterTraceStatus !== 'attempted' && filterTraceStatus !== 'ineligible' && filterTraceStatus !== 'skipped' && interp.seedTraceStatus !== filterTraceStatus) return false;
      }
      // 11. Seed Trace Stop Reason
      if (filterStopReason !== 'all' && (!interp.seedTrace || interp.seedTrace.stopReason !== filterStopReason)) {
        return false;
      }
      // 12. Seed Live at CALL Boundary
      if (filterSeedLiveAtCall === 'yes' && !interp.seedTrace?.seedLiveAtCallBoundary) return false;
      if (filterSeedLiveAtCall === 'no' && interp.seedTrace?.seedLiveAtCallBoundary) return false;
      // 13. Relocation-Base Adjusted
      if (filterRelocAdjusted === 'yes' && !interp.seedTrace?.seedRelocationBaseAdjusted) return false;
      if (filterRelocAdjusted === 'no' && interp.seedTrace?.seedRelocationBaseAdjusted) return false;
      // 14. Memory Base Use (all/yes/no)
      if (filterMemoryBaseUse === 'yes' && interp.seedTrace?.seedUsedAsMemoryBase !== true) return false;
      if (filterMemoryBaseUse === 'no' && interp.seedTrace?.seedUsedAsMemoryBase === true) return false;
      // 15. Memory Index Use (all/yes/no)
      if (filterMemoryIndexUse === 'yes' && interp.seedTrace?.seedUsedAsMemoryIndex !== true) return false;
      if (filterMemoryIndexUse === 'no' && interp.seedTrace?.seedUsedAsMemoryIndex === true) return false;
      // 16. Target-Compatible Memory (all/yes/no)
      if (filterTargetCompatibleMemory === 'yes' && interp.seedTrace?.seedTargetCompatibleMemoryAddressObserved !== true) return false;
      if (filterTargetCompatibleMemory === 'no' && interp.seedTrace?.seedTargetCompatibleMemoryAddressObserved === true) return false;
      // 17. CALL Target Topology Class
      if (
        filterCallTopology !== 'all' &&
        interp.seedTrace?.callBoundaryTargetRecon?.targetTopologyClassification !== filterCallTopology
      ) {
        return false;
      }
      // 18. CALL Boundary Target Group
      if (filterCallTarget !== 'all') {
        const matchesTarget =
          interp.seedTrace?.boundaryTargetHex === filterCallTarget ||
          interp.seedTrace?.callBoundaryTargetRecon?.targetLoadedLinearCandidateHex === filterCallTarget;
        if (!matchesTarget) return false;
      }
      // 19. Decision Pattern Match
      if (filterDecisionPattern !== 'all') {
        const dp = b8Result.decisionPatternTable.find((p) => p.patternId === filterDecisionPattern);
        if (dp && !dp.matchingSiteIds.includes(interp.siteFileOffsetHex)) {
          return false;
        }
      }
      // Search fields:
      // instruction mnemonic, register, opcode bytes, operand value (hex & dec), physical offset (hex & dec), candidate ID, region ID, CALL target (hex & dec), stop reason
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const hexQ = q.startsWith('0x') ? q.slice(2) : q;
        const match =
          interp.mnemonicHint.toLowerCase().includes(q) ||
          (interp.destinationRegister && interp.destinationRegister.toLowerCase().includes(q)) ||
          interp.opcodeBytesHex.toLowerCase().includes(q) ||
          interp.opcodeBytesHex.toLowerCase().includes(hexQ) ||
          interp.operandUint32Hex.toLowerCase().includes(q) ||
          interp.operandUint32Hex.toLowerCase().replace('0x', '').includes(hexQ) ||
          interp.operandUint32Value.toString().includes(q) ||
          interp.siteFileOffsetHex.toLowerCase().includes(q) ||
          interp.siteFileOffsetHex.toLowerCase().replace('0x', '').includes(hexQ) ||
          interp.siteFileOffset.toString().includes(q) ||
          interp.instructionFileOffsetHex.toLowerCase().includes(q) ||
          interp.instructionFileOffsetHex.toLowerCase().replace('0x', '').includes(hexQ) ||
          interp.instructionFileOffset.toString().includes(q) ||
          interp.operandFieldOffsetHex.toLowerCase().includes(q) ||
          interp.operandFieldOffsetHex.toLowerCase().replace('0x', '').includes(hexQ) ||
          interp.operandFieldOffset.toString().includes(q) ||
          (interp.associatedCandidateId && interp.associatedCandidateId.toLowerCase().includes(q)) ||
          interp.siteRegionId.toLowerCase().includes(q) ||
          (interp.directLinearResolvedRegionId && interp.directLinearResolvedRegionId.toLowerCase().includes(q)) ||
          (interp.seedTrace?.callBoundaryTargetRecon?.targetLinearRegionId && interp.seedTrace.callBoundaryTargetRecon.targetLinearRegionId.toLowerCase().includes(q)) ||
          (interp.seedTrace?.boundaryTargetHex && interp.seedTrace.boundaryTargetHex.toLowerCase().includes(q)) ||
          (interp.seedTrace?.callBoundaryTargetRecon?.targetLoadedLinearCandidateHex &&
            interp.seedTrace.callBoundaryTargetRecon.targetLoadedLinearCandidateHex.toLowerCase().includes(q)) ||
          (interp.seedTrace?.callBoundaryTargetRecon && interp.seedTrace.callBoundaryTargetRecon.targetLoadedLinearCandidate.toString().includes(q)) ||
          (interp.seedTrace?.stopReason && interp.seedTrace.stopReason.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [
    b8Result,
    filterSourceKind,
    filterCandidate,
    filterShapeClass,
    filterSemanticClass,
    filterAssociationRepresentation,
    filterAddressSpace,
    filterLinearRes,
    filterExactTargetMatch,
    filterRelocCompat,
    filterTraceStatus,
    filterStopReason,
    filterSeedLiveAtCall,
    filterRelocAdjusted,
    filterMemoryBaseUse,
    filterMemoryIndexUse,
    filterTargetCompatibleMemory,
    filterCallTopology,
    filterCallTarget,
    filterDecisionPattern,
    searchQuery,
  ]);

  const selectedInterpretation = useMemo(() => {
    if (!b8Result || !selectedInterpId) return null;
    return b8Result.interpretations.find((i) => i.interpretationId === selectedInterpId) || null;
  }, [b8Result, selectedInterpId]);

  const handleExportJson = () => {
    if (!b8Result) return;
    const exp = createMK1PaletteOperandUseExport(b8Result);
    const blob = new Blob([JSON.stringify(exp, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mk1_palette_operand_use_recon_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="mk1-operand-use-view">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Pass 1E.2B.8a.3.1: Operand Address-Space Hardening & CALL-Boundary Target Reconnaissance
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
              Milestone 1E.2B.8a.3.1
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Mechanically classifies x86 code-facing candidate references into operand address spaces (physical EXE offset,
            object-relative offset, loaded linear address, or immediate constant), traces straight-line seed use up to 48B/12 instr,
            and classifies CALL-boundary target spaces against LE object boundaries without claiming execution semantics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {b8Result && (
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Export JSON
            </button>
          )}
          <button
            onClick={handleRunAnalysis}
            disabled={!hasPrerequisites || isRunning}
            className={`px-4 py-2 text-xs font-semibold rounded-md flex items-center gap-2 transition-colors ${
              hasPrerequisites && !isRunning
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Cpu className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Analyzing Code Operands...' : b8Result ? 'Re-Run B.8 Analysis' : 'Run B.8 Analysis'}
          </button>
        </div>
      </div>

      {caughtError && (
        <AnalysisFailurePanel
          title="Milestone 1E.2B.8a.3.1 Execution Failed"
          error={caughtError}
          operationId={b8Result?.metadata?.operationId}
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-operand-use-reconnaissance"
          context={{
            milestone: '1E.2B.8a.3.1',
            exePath: report?.exePath ?? 'MK1.EXE',
            exeSize: report?.exeSize,
            operationId: b8Result?.metadata?.operationId,
            failedStage: 'execution',
            failureReason: caughtError instanceof Error ? caughtError.message : String(caughtError),
            guidance: 'Verify that MK1.EXE is accessible in the selected directory source and all prerequisite analyses completed successfully.'
          }}
          onRetry={handleRunAnalysis}
        />
      )}

      {/* Failure Panel when result status is FAILED */}
      {b8Result && b8Result.status === 'FAILED' && (
        <AnalysisFailurePanel
          title="Milestone 1E.2B.8a.3.1 Analysis Reconciliation Failed"
          error={new Error(b8Result.failureReason || 'Reconciliation or upstream invariant failure')}
          operationId={b8Result.metadata.operationId}
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-operand-use-reconnaissance"
          context={{
            milestone: '1E.2B.8a.3.1',
            exePath: b8Result.fixture.exePath,
            exeSize: b8Result.fixture.exeSize,
            operationId: b8Result.metadata.operationId,
            failedStage: b8Result.failedStage ?? 'reconciliation',
            failureReason: b8Result.failureReason ?? 'Invariant failure',
            guidance: b8Result.failedStage === 'upstream-validation'
              ? 'Prerequisite passes (Pass 1A, Pass 1E.2B.1, Pass 1E.2B.2, Pass 1E.2B.6, Pass 1E.2B.7) must succeed before B.8 can execute.'
              : b8Result.failedStage === 'candidate-association-reconciliation'
              ? 'Direct code-facing sites must strictly associate with exactly 1 candidate profile.'
              : b8Result.failedStage === 'direct-site-processing'
              ? 'Direct code-facing sites must adhere to Object 1 physical layout invariants.'
              : 'Review missing site associations or coordinate mismatches in the Reconciliation tab.'
          }}
          onRetry={handleRunAnalysis}
        />
      )}

      {/* Prerequisites status banner */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-lg">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Upstream Milestone Pipeline Prerequisites
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
            {report ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className={report ? 'text-slate-200' : 'text-slate-400'}>
              LE Topology (Pass 1A)
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
            {b1Result && b1Result.status === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className={b1Result ? 'text-slate-200' : 'text-slate-400'}>
              Candidate Inventory (B.1) — inherited / informational
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
            {contextResult && contextResult.status === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className={contextResult ? 'text-slate-200' : 'text-slate-400'}>
              Context Classify (B.2)
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
            {fusionResult && fusionResult.status === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className={fusionResult ? 'text-slate-200' : 'text-slate-400'}>
              Evidence Fusion (B.6)
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
            {chainResult && chainResult.status === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className={chainResult ? 'text-slate-200' : 'text-slate-400'}>
              Reference Chains (B.7)
            </span>
          </div>
        </div>
      </div>

      {/* Standing Epistemic Axioms Callout */}
      <div className="bg-amber-950/30 border border-amber-800/60 p-4 rounded-lg text-xs space-y-2 text-amber-200">
        <div className="flex items-center gap-2 font-semibold text-amber-400">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Standing Epistemic Axioms & Non-Consumer Boundaries</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-amber-300">1. NUMERIC EQUALITY != ADDRESS EQUALITY:</strong> A 32-bit integer constant matching a candidate offset does not prove the program treats that value as a pointer or address.
        </p>
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-amber-300">2. REGISTER IMMEDIATE != POINTER:</strong> Moving an immediate constant into a register does not establish address semantics without concrete base/index dereference or relocation fixup evidence.
        </p>
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-amber-300">3. CALL TARGET NUMERIC REGION != VERIFIED FUNCTION SEMANTICS:</strong> A near rel32 CALL target is classified topographically against Object 1 boundaries without following the target or claiming function semantics.
        </p>
        <p className="text-slate-300 leading-relaxed">
          <strong className="text-amber-300">4. NO PALETTE CONSUMER CLAIM:</strong> Immediate register values and memory operands discovered here must NOT be claimed as verified palette loaders, consumers, or pointer tables without active hardware/DAC color transfer proof.
        </p>
      </div>

      {/* Main Results when available */}
      {b8Result && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-xs text-slate-400">Total Unique Code Sites</div>
              <div className="text-2xl font-bold text-slate-100 mt-1">
                {b8Result.globalSummary.totalUniquePhysicalSites}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {b8Result.globalSummary.directCandidateFirstHopSites} direct +{' '}
                {b8Result.globalSummary.twoHopCodeFacingSites} two-hop
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-xs text-slate-400">Positive Interpretations</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">
                {b8Result.globalSummary.totalPositiveInterpretations}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {b8Result.globalSummary.directPositiveInterpretations} direct +{' '}
                {b8Result.globalSummary.twoHopPositiveInterpretations} two-hop
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-xs text-slate-400">Seed Traces Executed</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">
                {b8Result.globalSummary.seedTracesAttempted}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {b8Result.callBoundarySummary.callBoundaryCount} reached CALL boundary
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-xs text-slate-400">Reconciliation Status</div>
              <div className="text-2xl font-bold mt-1">
                <span className={b8Result.reconciliation.allReconciled ? 'text-emerald-400' : 'text-rose-400'}>
                  {b8Result.reconciliation.allReconciled ? 'RECONCILED' : 'UNRECONCILED'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {b8Result.callBoundarySummary.distinctCallTargetCount} distinct call targets
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-1 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'explorer'
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Operand Explorer</span>
              <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 text-[10px] text-slate-400">
                {filteredInterpretations.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'candidates'
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Candidate Summaries</span>
              <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 text-[10px] text-slate-400">
                {b8Result.candidateSummaries.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('call-targets')}
              className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'call-targets'
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>CALL Boundaries</span>
              <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 text-[10px] text-slate-400">
                {b8Result.callBoundaryTargetGroups.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'patterns'
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Decision Patterns</span>
              <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-900 text-[10px] text-slate-400">
                {b8Result.decisionPatternTable.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'reconciliation'
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Reconciliation Audit</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                  b8Result.reconciliation.allReconciled
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-rose-950 text-rose-400'
                }`}
              >
                {b8Result.reconciliation.allReconciled ? 'PASS' : 'FAIL'}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('axioms')}
              className={`px-3 py-1.5 rounded-t-md font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                activeTab === 'axioms'
                  ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Observations & Axioms</span>
            </button>
          </div>

          {/* TAB 1: OPERAND EXPLORER */}
          {activeTab === 'explorer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Filterable List */}
              <div className="lg:col-span-5 space-y-3">
                {/* Composable filter controls */}
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-300">Composable Filters</div>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={handleResetFilters}
                        className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset ({activeFilterCount})</span>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search offset, candidate, reg, target..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* 1. Source Kind */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">1. Source Kind</label>
                      <select
                        value={filterSourceKind}
                        onChange={(e) => setFilterSourceKind(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Sources</option>
                        <option value="direct-candidate-first-hop">Direct Candidate (B.2)</option>
                        <option value="two-hop-site-code-facing">Two-Hop Site (B.7)</option>
                      </select>
                    </div>

                    {/* 2. Associated Candidate */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">2. Associated Candidate</label>
                      <select
                        value={filterCandidate}
                        onChange={(e) => setFilterCandidate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Candidates</option>
                        {candidateOptions.map((candId) => (
                          <option key={candId} value={candId}>{candId}</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Whitelisted Shape Class */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">3. Whitelisted Shape Class</label>
                      <select
                        value={filterShapeClass}
                        onChange={(e) => setFilterShapeClass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Shape Classes</option>
                        {shapeClassOptions.map((sc) => (
                          <option key={sc} value={sc}>{sc}</option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Semantic Class */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">4. Semantic Class</label>
                      <select
                        value={filterSemanticClass}
                        onChange={(e) => setFilterSemanticClass(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Semantics</option>
                        <option value="register-immediate-seed">register-immediate-seed</option>
                        <option value="direct-memory-load-address">direct-memory-load-address</option>
                        <option value="direct-memory-store-address">direct-memory-store-address</option>
                        <option value="accumulator-arithmetic-immediate">accumulator-arithmetic-immediate</option>
                        <option value="push-immediate-value">push-immediate-value</option>
                        <option value="lea-address-computation">lea-address-computation</option>
                      </select>
                    </div>

                    {/* 5. Association Representation */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">5. Association Representation</label>
                      <select
                        value={filterAssociationRepresentation}
                        onChange={(e) => setFilterAssociationRepresentation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Representations</option>
                        {associationRepresentationOptions.map((rep) => (
                          <option key={rep} value={rep}>{rep}</option>
                        ))}
                      </select>
                    </div>

                    {/* 6. Operand Address-Space Interpretation */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">6. Address-Space Form</label>
                      <select
                        value={filterAddressSpace}
                        onChange={(e) => setFilterAddressSpace(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Address Spaces</option>
                        <option value="direct-loaded">direct-loaded (loaded-linear)</option>
                        <option value="object-relative">object-relative</option>
                        <option value="physical-candidate">physical-candidate</option>
                      </select>
                    </div>

                    {/* 7. Linear Address Resolution Class */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">7. Linear Resolution Class</label>
                      <select
                        value={filterLinearRes}
                        onChange={(e) => setFilterLinearRes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Linear Resolutions</option>
                        <option value="resolves-other">resolves-other-loaded-location</option>
                        <option value="linear-unmapped">linear-address-unmapped</option>
                        <option value="exact-associated-structure-linear">exact-associated-structure</option>
                        <option value="exact-associated-payload-linear">exact-associated-payload</option>
                        <option value="segment-override-unresolved">segment-override-unresolved</option>
                        <option value="not-applicable-non-address-operand">not-applicable-non-address</option>
                      </select>
                    </div>

                    {/* 8. Exact Associated Target Match */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">8. Exact Target Match</label>
                      <select
                        value={filterExactTargetMatch}
                        onChange={(e) => setFilterExactTargetMatch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All</option>
                        <option value="yes">Target Matches (Yes)</option>
                        <option value="no">Target Does Not Match (No)</option>
                      </select>
                    </div>

                    {/* 9. Object-Relative Relocation-Base Compatibility */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">9. Reloc Base Compatibility</label>
                      <select
                        value={filterRelocCompat}
                        onChange={(e) => setFilterRelocCompat(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All</option>
                        <option value="compatible">Reloc Base Compatible</option>
                        <option value="incompatible">Reloc Base Incompatible</option>
                      </select>
                    </div>

                    {/* 10. Relocation-Base Adjusted */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">10. Reloc-Base Adjusted</label>
                      <select
                        value={filterRelocAdjusted}
                        onChange={(e) => setFilterRelocAdjusted(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All</option>
                        <option value="yes">Reloc Adjusted (Yes)</option>
                        <option value="no">Reloc Adjusted (No)</option>
                      </select>
                    </div>

                    {/* 11. Seed Trace Status */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">11. Seed Trace Status</label>
                      <select
                        value={filterTraceStatus}
                        onChange={(e) => setFilterTraceStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Trace Statuses</option>
                        <option value="attempted">Attempted / Traced</option>
                        <option value="ineligible">Ineligible (non-seed)</option>
                        <option value="skipped">Skipped (limit reached)</option>
                        <option value="seed-traced-to-call">seed-traced-to-call</option>
                        <option value="seed-traced-to-jump">seed-traced-to-jump</option>
                        <option value="seed-traced-to-branch">seed-traced-to-branch</option>
                        <option value="seed-traced-to-return">seed-traced-to-return</option>
                        <option value="seed-traced-to-memory">seed-traced-to-memory</option>
                        <option value="seed-overwritten-before-use">seed-overwritten-before-use</option>
                        <option value="unsupported-opcode">unsupported-opcode</option>
                      </select>
                    </div>

                    {/* 12. Seed Trace Stop Reason */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">12. Trace Stop Reason</label>
                      <select
                        value={filterStopReason}
                        onChange={(e) => setFilterStopReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Stop Reasons</option>
                        <option value="call-boundary">call-boundary</option>
                        <option value="return-boundary">return-boundary</option>
                        <option value="jump-unconditional">jump-unconditional</option>
                        <option value="branch-conditional">branch-conditional</option>
                        <option value="memory-access">memory-access</option>
                        <option value="overwritten-before-use">overwritten-before-use</option>
                        <option value="unsupported-opcode">unsupported-opcode</option>
                        <option value="max-bytes-reached">max-bytes-reached</option>
                        <option value="max-instructions-reached">max-instructions-reached</option>
                      </select>
                    </div>

                    {/* 13. Memory Base Use */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">13. Memory Base Use</label>
                      <select
                        value={filterMemoryBaseUse}
                        onChange={(e) => setFilterMemoryBaseUse(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All</option>
                        <option value="yes">Used as Memory Base (Yes)</option>
                        <option value="no">Not Memory Base (No)</option>
                      </select>
                    </div>

                    {/* 14. Memory Index Use */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">14. Memory Index Use</label>
                      <select
                        value={filterMemoryIndexUse}
                        onChange={(e) => setFilterMemoryIndexUse(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All</option>
                        <option value="yes">Used as Memory Index (Yes)</option>
                        <option value="no">Not Memory Index (No)</option>
                      </select>
                    </div>

                    {/* 15. Target-Compatible Memory Use */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">15. Target-Compatible Memory</label>
                      <select
                        value={filterTargetCompatibleMemory}
                        onChange={(e) => setFilterTargetCompatibleMemory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All</option>
                        <option value="yes">Target Compatible (Yes)</option>
                        <option value="no">Not Compatible (No)</option>
                      </select>
                    </div>

                    {/* 16. Seed Live at CALL Boundary */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">16. Seed Live at CALL</label>
                      <select
                        value={filterSeedLiveAtCall}
                        onChange={(e) => setFilterSeedLiveAtCall(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All</option>
                        <option value="yes">Live at CALL (Yes)</option>
                        <option value="no">Not Live at CALL (No)</option>
                      </select>
                    </div>

                    {/* 17. CALL Target Topology Class */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">17. CALL Topology Class</label>
                      <select
                        value={filterCallTopology}
                        onChange={(e) => setFilterCallTopology(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Topology Classes</option>
                        {callTopologyOptions.map((topo) => (
                          <option key={topo} value={topo}>{topo}</option>
                        ))}
                      </select>
                    </div>

                    {/* 18. CALL Boundary Target Group */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">18. CALL Target Group</label>
                      <select
                        value={filterCallTarget}
                        onChange={(e) => setFilterCallTarget(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All CALL Targets</option>
                        {callTargetOptions.map((tgt) => (
                          <option key={tgt} value={tgt}>{tgt}</option>
                        ))}
                      </select>
                    </div>

                    {/* 19. Decision Pattern Match */}
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">19. Decision Pattern Match</label>
                      <select
                        value={filterDecisionPattern}
                        onChange={(e) => setFilterDecisionPattern(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                      >
                        <option value="all">All Decision Patterns</option>
                        {b8Result.decisionPatternTable.map((dp) => (
                          <option key={dp.patternId} value={dp.patternId}>
                            {dp.description} ({dp.matchedCount})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* List items */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800/70 max-h-[700px] overflow-y-auto">
                  <div className="p-2.5 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Showing {filteredInterpretations.length} of {b8Result.interpretations.length} interpretations</span>
                    <span className="font-mono text-slate-500">
                      {b8Result.globalSummary.totalUniquePhysicalSites} sites / {b8Result.globalSummary.totalPositiveInterpretations} total
                    </span>
                  </div>

                  {filteredInterpretations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No interpretations matched the current filters.
                    </div>
                  ) : (
                    filteredInterpretations.map((interp) => {
                      const isSelected = interp.interpretationId === selectedInterpId;
                      return (
                        <button
                          key={interp.interpretationId}
                          onClick={() => setSelectedInterpId(interp.interpretationId)}
                          className={`w-full text-left p-3 transition-colors flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-cyan-950/40 border-l-2 border-cyan-500'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-cyan-300">
                                {interp.siteFileOffsetHex}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 text-[10px] rounded font-mono ${
                                  interp.sourceKind === 'direct-candidate-first-hop'
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                                }`}
                              >
                                {interp.sourceKind === 'direct-candidate-first-hop' ? 'Direct' : '2-Hop'}
                              </span>
                              {interp.destinationRegister && (
                                <span className="px-1.5 py-0.2 text-[10px] rounded bg-indigo-950 text-indigo-300 font-mono">
                                  {interp.destinationRegister}
                                </span>
                              )}
                            </div>

                            <div className="font-mono text-xs text-slate-300 truncate">
                              {interp.mnemonicHint}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                              <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                val: {interp.operandUint32Hex}
                              </span>
                              <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                {interp.semanticClass}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right space-y-1">
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] rounded font-semibold ${
                                interp.seedTraceStatus.startsWith('seed-traced-to-call')
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : interp.seedTraceStatus.startsWith('seed-traced-to-jump') ||
                                    interp.seedTraceStatus.startsWith('seed-traced-to-branch')
                                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                  : interp.seedTraceStatus.startsWith('seed-traced-to-return')
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : interp.seedTraceStatus.startsWith('seed-traced-to-memory')
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {interp.seedTraceStatus.replace('seed-traced-to-', '').replace('not-applicable-', 'n/a: ')}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Selected Interpretation Details */}
              <div className="lg:col-span-7 space-y-4">
                {selectedInterpretation ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
                    {/* Title & badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-100 font-mono">
                            {selectedInterpretation.siteFileOffsetHex}
                          </h3>
                          <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded font-mono">
                            {selectedInterpretation.shapeClass}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono">
                            {selectedInterpretation.semanticClass}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-mono">
                          {selectedInterpretation.mnemonicHint} (opcode {selectedInterpretation.opcodeBytesHex}, len {selectedInterpretation.instructionLength}B)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Operand Value</div>
                        <div className="font-mono text-sm font-bold text-amber-400">
                          {selectedInterpretation.operandUint32Hex}
                        </div>
                      </div>
                    </div>

                    {/* Multi-Coordinate Address Space Matrix */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Coordinate Address-Space Evaluation
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                          <div className="text-slate-400 font-semibold">Direct Linear Resolution</div>
                          <div className="font-mono text-cyan-300">
                            {selectedInterpretation.directLinearResolution}
                          </div>
                          {selectedInterpretation.directLinearResolvedObjectNumber !== null && (
                            <div className="text-[11px] text-slate-400">
                              Resolves to Object {selectedInterpretation.directLinearResolvedObjectNumber} offset{' '}
                              <span className="font-mono text-slate-300">
                                {selectedInterpretation.directLinearResolvedObjectOffsetHex}
                              </span>
                              {selectedInterpretation.directLinearResolvedPhysicalOffsetHex && (
                                <span> (file {selectedInterpretation.directLinearResolvedPhysicalOffsetHex})</span>
                              )}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500">
                            Matches Associated Candidate: {selectedInterpretation.directLinearMatchesAssociatedTarget ? 'YES' : 'NO'}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                          <div className="text-slate-400 font-semibold">Object-Relative Compatibility</div>
                          <div className="font-mono text-indigo-300">
                            {selectedInterpretation.objectRelativeCompatibility.isObjectRelativeOperand ? 'Object-Relative Form' : 'Non-Object-Relative Form'}
                          </div>
                          {selectedInterpretation.objectRelativeCompatibility.targetObjectRelocationBaseHex && (
                            <div className="text-[11px] text-slate-400">
                              Target Reloc Base: <span className="font-mono text-slate-300">{selectedInterpretation.objectRelativeCompatibility.targetObjectRelocationBaseHex}</span>
                            </div>
                          )}
                          {selectedInterpretation.objectRelativeCompatibility.requiredBaseHex && (
                            <div className="text-[11px] text-slate-400">
                              Required Base: <span className="font-mono text-slate-300">{selectedInterpretation.objectRelativeCompatibility.requiredBaseHex}</span>
                              <span className="ml-1 text-slate-500">
                                (Matches: {selectedInterpretation.objectRelativeCompatibility.requiredBaseEqualsTargetObjectRelocationBase ? 'YES' : 'NO'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CALL-Boundary Target Reconnaissance (if reached CALL) */}
                    {selectedInterpretation.seedTrace?.callBoundaryTargetRecon && (
                      <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-semibold text-cyan-400">
                            CALL Boundary Target Topology
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            Displacement: {selectedInterpretation.seedTrace.callBoundaryTargetRecon.rel32DisplacementHex}
                          </span>
                        </div>

                        {/* Epistemic Banner */}
                        <div className="flex items-center gap-2 p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-medium">
                            CALL target classified only; target body was NOT followed.
                          </span>
                        </div>

                        {/* Source Site & Seed Context */}
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1 text-[11px]">
                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] text-cyan-300">
                            Source Site &amp; Seed Context
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>
                              <span className="text-slate-400">Source Site (Payload Offset): </span>
                              <span className="font-mono text-slate-200">
                                {selectedInterpretation.seedTrace.seedSiteOffsetHex} ({selectedInterpretation.sourceKind})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Initial Seed Value: </span>
                              <span className="font-mono text-amber-300">
                                {selectedInterpretation.seedTrace.initialSeedValueHex} ({selectedInterpretation.seedTrace.seedRegister})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Seed Instruction: </span>
                              <span className="font-mono text-slate-200">
                                [{selectedInterpretation.seedTrace.seedInstructionOffsetHex}] {selectedInterpretation.seedTrace.seedInstructionMnemonic}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Trace Coverage: </span>
                              <span className="font-mono text-slate-300">
                                {selectedInterpretation.seedTrace.traceStartOffsetHex} &rarr; {selectedInterpretation.seedTrace.traceEndOffsetHex} ({selectedInterpretation.seedTrace.totalInstructionsDecoded} instr, {selectedInterpretation.seedTrace.totalBytesExamined} B)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CALL Instruction Coordinates */}
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1 text-[11px]">
                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] text-indigo-300">
                            CALL Instruction Coordinates
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>
                              <span className="text-slate-400">CALL Physical File Offset: </span>
                              <span className="font-mono text-slate-200 font-bold">
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.sourceInstructionPhysicalOffsetHex}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">CALL Loaded Linear: </span>
                              <span className="font-mono text-slate-200 font-bold">
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.sourceLoadedLinearCandidateHex}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Source Object &amp; Offset: </span>
                              <span className="font-mono text-slate-300">
                                Object #{selectedInterpretation.seedTrace.callBoundaryTargetRecon.sourceObjectNumber} + {selectedInterpretation.seedTrace.callBoundaryTargetRecon.sourceObjectOffsetHex}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Next Instruction Offset: </span>
                              <span className="font-mono text-slate-300">
                                Object #{selectedInterpretation.seedTrace.callBoundaryTargetRecon.sourceObjectNumber} + {selectedInterpretation.seedTrace.callBoundaryTargetRecon.nextInstructionObjectOffsetHex}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Target Topology & LE Resolution */}
                        <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1 text-[11px]">
                          <div className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] text-emerald-300">
                            Target Topology &amp; LE Resolution
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div>
                              <span className="text-slate-400">Target Loaded Linear: </span>
                              <span className="font-mono text-slate-100 font-bold text-cyan-300">
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLoadedLinearCandidateHex}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Target Object &amp; Offset: </span>
                              <span className="font-mono text-slate-200">
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearObjectNumber !== null
                                  ? `Object #${selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearObjectNumber} + ${selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearObjectOffsetHex ?? selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetObjectOffsetHex}`
                                  : `Object #1 + ${selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetObjectOffsetHex}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Target Topology Class: </span>
                              <span className="font-mono text-indigo-300 font-semibold">
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetTopologyClassification}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Target Region / Class: </span>
                              <span className="font-mono text-slate-300">
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearRegionId} ({selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearRegionClass})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Within Object 1 Virtual: </span>
                              <span className={`font-mono font-semibold ${
                                selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetOffsetWithinSourceObjectVirtualRange
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}>
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetOffsetWithinSourceObjectVirtualRange ? 'YES' : 'NO'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Within Object 1 File-Backed: </span>
                              <span className={`font-mono font-semibold ${
                                selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetOffsetWithinSourceObjectFileBackedRange
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}>
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetOffsetWithinSourceObjectFileBackedRange ? 'YES' : 'NO'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Physical Backing Offset: </span>
                              <span className="font-mono text-slate-200">
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearPhysicalBackingOffsetHex || 'unbacked'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Physical Backing Available: </span>
                              <span className={`font-mono font-semibold ${
                                selectedInterpretation.seedTrace.callBoundaryTargetRecon.physicalBackingAvailable
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}>
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.physicalBackingAvailable ? 'YES' : 'NO'}
                              </span>
                            </div>
                            {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearObjectFlags !== null && (
                              <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-800/50">
                                <span className="text-slate-400">Target Object Permissions:</span>
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  Flags: 0x{selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearObjectFlags.toString(16)}
                                </span>
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearObjectReadable && (
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">R</span>
                                )}
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearObjectWritable && (
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">W</span>
                                )}
                                {selectedInterpretation.seedTrace.callBoundaryTargetRecon.targetLinearObjectExecutable && (
                                  <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">X</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Straight-Line Micro-Decoder Trace */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Straight-Line Micro-Decoder Trace (Max 48B / 12 Instr)
                        </h4>
                        {selectedInterpretation.seedTrace && (
                          <span className="text-xs font-mono text-slate-400">
                            Decoded {selectedInterpretation.seedTrace.totalInstructionsDecoded} instr (
                            {selectedInterpretation.seedTrace.totalBytesExamined} bytes)
                          </span>
                        )}
                      </div>

                      {selectedInterpretation.seedTrace ? (
                        <div className="space-y-3">
                          {/* Trace Termination Reason Banner */}
                          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-cyan-400" />
                              <span className="text-slate-300">
                                Terminal Reason:{' '}
                                <strong className="text-cyan-300">
                                  {selectedInterpretation.seedTrace.stopReason}
                                </strong>
                              </span>
                            </div>
                            <span className="font-mono text-slate-400 text-[11px]">
                              Stop Offset: {selectedInterpretation.seedTrace.stopOffsetHex}
                            </span>
                          </div>

                          {/* Instruction Table */}
                          <div className="border border-slate-800 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-950 text-slate-400 text-[11px]">
                                <tr>
                                  <th className="p-2 font-medium">#</th>
                                  <th className="p-2 font-medium">File Offset</th>
                                  <th className="p-2 font-medium">Hex Bytes</th>
                                  <th className="p-2 font-medium">Mnemonic</th>
                                  <th className="p-2 font-medium">Events</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {selectedInterpretation.seedTrace.instructions.map((instr) => (
                                  <tr
                                    key={instr.index}
                                    className={instr.isBarrier ? 'bg-amber-950/20' : 'hover:bg-slate-800/40'}
                                  >
                                    <td className="p-2 text-slate-500">{instr.index}</td>
                                    <td className="p-2 text-slate-400">{instr.fileOffsetHex}</td>
                                    <td className="p-2 text-slate-500 uppercase">{instr.rawBytesHex}</td>
                                    <td className="p-2 text-slate-200 font-semibold">{instr.mnemonic}</td>
                                    <td className="p-2 text-slate-400">
                                      {instr.events.length > 0 ? (
                                        <div className="space-y-0.5">
                                          {instr.events.map((ev, eidx) => (
                                            <div
                                              key={eidx}
                                              className={`text-[10px] ${
                                                ev.eventType.includes('target-compatible') || ev.eventType.includes('target-coordinate')
                                                  ? 'text-emerald-400 font-bold'
                                                  : ev.eventType.includes('memory')
                                                  ? 'text-cyan-400'
                                                  : ev.eventType.includes('overwritten')
                                                  ? 'text-rose-400'
                                                  : 'text-indigo-300'
                                              }`}
                                            >
                                              {ev.eventType}: {ev.description}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-slate-600">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Propagation Events Summary */}
                          {selectedInterpretation.seedTrace.events.length > 0 && (
                            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs space-y-1.5">
                              <div className="font-semibold text-slate-400">Recorded Propagation Events</div>
                              <ul className="space-y-1 text-slate-300 text-[11px]">
                                {selectedInterpretation.seedTrace.events.map((ev, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                                    <span>
                                      <strong className="text-slate-200 font-mono">[{ev.instructionOffsetHex}]</strong>{' '}
                                      <span className="text-cyan-300">{ev.eventType}</span>: {ev.description}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400">
                          Seed-use straight-line trace is only executed for <code className="text-cyan-300">register-immediate-seed</code> operands.
                          Current operand is classified as <code className="text-amber-300">{selectedInterpretation.semanticClass}</code> ({selectedInterpretation.seedTraceStatus}).
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-xs text-slate-500">
                    Select an interpretation from the list to view its multi-coordinate address space analysis, CALL-boundary topology, and straight-line micro-decoder trace.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CANDIDATE SUMMARIES */}
          {activeTab === 'candidates' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">
                      Candidate Inventory (B.1) — inherited / informational
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Deterministic accounting of direct code sites, interpretations, seed uses, and CALL boundaries per candidate.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                    {b8Result.candidateSummaries.length} Candidates Reconciled
                  </span>
                </div>

                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[11px]">
                      <tr>
                        <th className="p-3 font-medium">Candidate ID</th>
                        <th className="p-3 font-medium">Source Class</th>
                        <th className="p-3 font-medium">Physical (Struct / Payload)</th>
                        <th className="p-3 font-medium">Loaded Linear (Struct / Payload)</th>
                        <th className="p-3 font-medium">Direct Sites</th>
                        <th className="p-3 font-medium">Interps</th>
                        <th className="p-3 font-medium">Seeds</th>
                        <th className="p-3 font-medium">Calls</th>
                        <th className="p-3 font-medium">Reloc Adjustments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {b8Result.candidateSummaries.map((cand) => (
                        <tr key={cand.candidateId} className="hover:bg-slate-800/40">
                          <td className="p-3 text-cyan-300 font-bold">{cand.candidateId}</td>
                          <td className="p-3 text-slate-300">{cand.sourceClass}</td>
                          <td className="p-3 text-slate-300">
                            {cand.physicalStructureOffsetHex} /{' '}
                            <span className="text-amber-300">{cand.physicalPayloadOffsetHex}</span>
                          </td>
                          <td className="p-3 text-slate-300">
                            {cand.loadedLinearStructureCandidateHex} /{' '}
                            <span className="text-amber-300">{cand.loadedLinearPayloadCandidateHex}</span>
                          </td>
                          <td className="p-3 text-slate-200 font-bold">{cand.associatedDirectSiteCount}</td>
                          <td className="p-3 text-cyan-400 font-bold">{cand.associatedInterpretationCount}</td>
                          <td className="p-3 text-indigo-300 font-bold">{cand.associatedSeedCount}</td>
                          <td className="p-3 text-emerald-400 font-bold">{cand.associatedCallBoundaryCount}</td>
                          <td className="p-3 text-slate-400">{cand.relocationAdjustmentsObserved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CALL BOUNDARIES */}
          {activeTab === 'call-targets' && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    CALL-Boundary Target-Space Reconnaissance
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Topographical classification of near rel32 CALL boundaries reached by straight-line seed propagation.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                  {b8Result.callBoundarySummary.callBoundaryCount} Traces / {b8Result.callBoundarySummary.distinctCallTargetCount} Target Groups
                </span>
              </div>

              {/* Epistemic Banner */}
              <div className="flex items-center gap-2 p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">
                  CALL target classified only; target body was NOT followed.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-400">Within Object 1 Virtual</div>
                  <div className="text-lg font-bold text-slate-200 mt-1">
                    {b8Result.callBoundarySummary.callTargetsWithinSourceObjectVirtualRange}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-400">Within File Backed</div>
                  <div className="text-lg font-bold text-slate-200 mt-1">
                    {b8Result.callBoundarySummary.callTargetsWithinSourceObjectFileBackedRange}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-400">Resolves Source Object</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">
                    {b8Result.callBoundarySummary.numericTargetsResolvingSourceObject}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-400">Outside Virtual Range</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">
                    {b8Result.callBoundarySummary.callTargetsOutsideSourceObjectVirtualRange}
                  </div>
                </div>
              </div>

              {/* Target Groups Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-2.5 font-medium">Boundary Target (Linear)</th>
                      <th className="p-2.5 font-medium">Source Kind</th>
                      <th className="p-2.5 font-medium">Seed Value</th>
                      <th className="p-2.5 font-medium">Register</th>
                      <th className="p-2.5 font-medium">Traces</th>
                      <th className="p-2.5 font-medium">Topology Classification</th>
                      <th className="p-2.5 font-medium">Object 1 Virtual</th>
                      <th className="p-2.5 font-medium">File Backing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {b8Result.callBoundaryTargetGroups.map((grp) => (
                      <tr key={grp.groupId} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-cyan-300 font-bold">{grp.boundaryTargetLinearHex}</td>
                        <td className="p-2.5 text-slate-400">
                          {grp.sourceKind === 'direct-candidate-first-hop' ? 'Direct' : '2-Hop'}
                        </td>
                        <td className="p-2.5 text-amber-300">{grp.seedValueHex}</td>
                        <td className="p-2.5 text-indigo-300">{grp.destinationRegister}</td>
                        <td className="p-2.5 text-slate-200 font-bold">{grp.traceCount}</td>
                        <td className="p-2.5 text-slate-300">{grp.targetTopologyClassification}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              grp.withinSourceObjectVirtualRange
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {grp.withinSourceObjectVirtualRange ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-400">{grp.targetLinearPhysicalBackingOffsetHex || 'unbacked'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: DECISION PATTERNS */}
          {activeTab === 'patterns' && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Deterministic Decision Pattern Table
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    14 non-probabilistic decision patterns accounting for all direct and two-hop code sites.
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                  {b8Result.decisionPatternTable.length} Patterns Defined
                </span>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-3 font-medium">Pattern ID</th>
                      <th className="p-3 font-medium">Matched Sites</th>
                      <th className="p-3 font-medium">Matched Interps</th>
                      <th className="p-3 font-medium">Description</th>
                      <th className="p-3 font-medium">Matching Site Offsets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {b8Result.decisionPatternTable.map((dp) => (
                      <tr key={dp.patternId} className="hover:bg-slate-800/40">
                        <td className="p-3 text-cyan-300 font-bold whitespace-nowrap">{dp.patternId}</td>
                        <td className="p-3 text-slate-200 font-bold">{dp.matchedCount}</td>
                        <td className="p-3 text-indigo-300 font-bold">{dp.matchedInterpretationCount}</td>
                        <td className="p-3 text-slate-300 font-sans">{dp.description}</td>
                        <td className="p-3 text-slate-400">
                          <div className="flex flex-wrap gap-1">
                            {dp.matchingSiteIds.map((sid) => (
                              <span
                                key={sid}
                                className="px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800 text-[10px] text-cyan-400"
                              >
                                {sid}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: RECONCILIATION AUDIT */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">
                      Evidence Reconciliation & Integrity Audit
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verification of upstream-to-downstream physical site closure, interpretation preservation, and coordinate consistency.
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      b8Result.reconciliation.allReconciled
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {b8Result.reconciliation.allReconciled ? 'ALL RECONCILED (PASS)' : 'UNRECONCILED (FAIL)'}
                  </span>
                </div>

                {/* Quantitative Counters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400">Direct Physical Sites</div>
                    <div className="text-xl font-bold text-slate-100 mt-1">
                      {b8Result.reconciliation.b8DirectPhysicalSitesProduced} / {b8Result.reconciliation.b2PositivePhysicalSitesInput}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">100% Accounted For</div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400">Direct Interpretations</div>
                    <div className="text-xl font-bold text-cyan-400 mt-1">
                      {b8Result.reconciliation.b8DirectInterpretationsProduced} / {b8Result.reconciliation.b2PositiveShapeInterpretationsInput}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Preserved from B.2</div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400">Two-Hop Code Sites</div>
                    <div className="text-xl font-bold text-purple-400 mt-1">
                      {b8Result.reconciliation.b8TwoHopSitesProduced} / {b8Result.reconciliation.b7PositiveSecondOrderSitesInput}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">From B.7 Reference Chains</div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="text-slate-400">Seed Traces Executed</div>
                    <div className="text-xl font-bold text-indigo-400 mt-1">
                      {b8Result.reconciliation.seedTraceResultsProduced} / {b8Result.reconciliation.seedTraceEligibleInterpretations}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">All Eligible Traced</div>
                  </div>
                </div>

                {/* Audit Checklist */}
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-950 p-2.5 font-semibold text-xs text-slate-300 border-b border-slate-800">
                    Invariant Validation Checklist
                  </div>
                  <div className="divide-y divide-slate-800/60 text-xs">
                    {[
                      {
                        label: 'All Direct B.2 Physical Sites Accounted For',
                        pass: b8Result.reconciliation.allDirectSitesAccountedFor,
                        desc: `Produced ${b8Result.reconciliation.b8DirectPhysicalSitesProduced} out of ${b8Result.reconciliation.b2PositivePhysicalSitesInput} expected input sites.`,
                      },
                      {
                        label: 'All B.2 Shape Interpretations Preserved',
                        pass: b8Result.reconciliation.allShapeInterpretationsAccountedFor,
                        desc: `Produced ${b8Result.reconciliation.b8DirectInterpretationsProduced} direct interpretations matching upstream shapes.`,
                      },
                      {
                        label: 'All Seed-Eligible Interpretations Traced',
                        pass: b8Result.reconciliation.allSeedTracesAccountedFor,
                        desc: `Attempted straight-line micro-decoder trace for ${b8Result.reconciliation.seedTraceResultsProduced} seed sites.`,
                      },
                      {
                        label: 'All Reached CALL Boundaries Accounted For',
                        pass: b8Result.reconciliation.allCallBoundariesAccountedFor,
                        desc: `Classified ${b8Result.reconciliation.callBoundarySummariesProduced} near rel32 CALL boundaries across distinct target groups.`,
                      },
                      {
                        label: 'Candidate Summaries Fully Reconciled',
                        pass: b8Result.reconciliation.candidateSummariesReconciled,
                        desc: `Candidate summary count matches upstream candidate count exactly.`,
                      },
                      {
                        label: 'Candidate Summary Direct Sites Reconciled',
                        pass: b8Result.reconciliation.candidateSummaryDirectSitesReconciled,
                        desc: `Sum of candidate direct sites matches total direct sites.`,
                      },
                      {
                        label: 'Candidate Summary Interpretations Reconciled',
                        pass: b8Result.reconciliation.candidateSummaryInterpretationsReconciled,
                        desc: `Sum of candidate interpretations matches total direct interpretations.`,
                      },
                      {
                        label: 'Candidate Summary Seeds Reconciled',
                        pass: b8Result.reconciliation.candidateSummarySeedsReconciled,
                        desc: `Sum of candidate seeds matches total direct seeds.`,
                      },
                      {
                        label: 'Candidate Summary Calls Reconciled',
                        pass: b8Result.reconciliation.candidateSummaryCallsReconciled,
                        desc: `Sum of candidate CALL boundaries matches total direct CALL boundaries.`,
                      },
                      {
                        label: 'Physical Candidate Coordinates Invariant (Payload = Structure + 2)',
                        pass: b8Result.reconciliation.physicalCandidateCoordinatesReconciled,
                        desc: `All candidate summaries satisfy byteStart + 2 = physicalPayload.`,
                      },
                      {
                        label: 'Decision Pattern Table Complete (14 Patterns)',
                        pass: b8Result.reconciliation.decisionPatternTableReconciled,
                        desc: `All 14 decision patterns populated and all sites mapped to at least one pattern.`,
                      },
                      {
                        label: 'Relocation Observation Counts Reconciled',
                        pass: b8Result.reconciliation.relocationObservationCountsReconciled,
                        desc: `No synthetic relocation adjustments invented (count = 0 across all candidates).`,
                      },
                      {
                        label: 'Derived Fixture Observations Reconciled',
                        pass: b8Result.reconciliation.derivedEvidenceReconciled,
                        desc: `Dynamic fixture observations match computed evidence with zero contradictions.`,
                      },
                      {
                        label: 'Negative Control Sites Isolated from Positive Counts',
                        pass: !b8Result.interpretations.some((i) => i.siteFileOffsetHex === '0x0009C914' || i.siteFileOffsetHex === '0x9C914'),
                        desc: `Control site 0x0009C914 is strictly excluded from positive candidate and site counts.`,
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 flex items-start gap-3 hover:bg-slate-950/40">
                        {item.pass ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-200">{item.label}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">{item.desc}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.pass ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                          }`}
                        >
                          {item.pass ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: OBSERVATIONS & AXIOMS */}
          {activeTab === 'axioms' && (
            <div className="space-y-4">
              {/* Dynamic Fixture Observations */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-semibold text-slate-200">
                    Derived Fixture Observations (Real EXE Evidence)
                  </h3>
                  <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded font-mono">
                    {b8Result.fixtureObservations.length} Observations
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {b8Result.fixtureObservations.map((obs, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-start gap-2 text-slate-300"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interpretation Caveats */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-semibold text-slate-200">
                    Interpretation Caveats & Bounds
                  </h3>
                  <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded font-mono">
                    {b8Result.interpretationCaveats.length} Caveats
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {b8Result.interpretationCaveats.map((cav, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-start gap-2 text-slate-400"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{cav}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Epistemic Axioms */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Standing Epistemic Non-Consumer Axioms
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <div className="text-cyan-300 font-bold">1. Zero Consumer Synthesis</div>
                    <div className="text-slate-400 text-[11px]">
                      No confidence scores, consumer scores, pointer scores, or rank heuristics may be assigned.
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <div className="text-cyan-300 font-bold">2. Direct Linear Resolution</div>
                    <div className="text-slate-400 text-[11px]">
                      Immediate operand integers match flat linear offsets without inventing synthetic relocation records.
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <div className="text-cyan-300 font-bold">3. Relocation Transparency</div>
                    <div className="text-slate-400 text-[11px]">
                      Relocation adjustor fields observe actual LE relocation tables rather than fabricating fixup behaviors.
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <div className="text-cyan-300 font-bold">4. Strict Scope Discipline</div>
                    <div className="text-slate-400 text-[11px]">
                      Follow only straight-line instruction sequences up to barriers (CALL, RET, JMP) without descending into targets.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

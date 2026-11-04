import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Download,
  Filter,
  Layers,
  Link,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { MK1ExecutableLayoutReport } from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteReferenceReconResult } from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from '../games/mk1/research/paletteRepeatedStructureTypes';
import { MK1PaletteCycleLayoutResult } from '../games/mk1/research/paletteCycleLayoutTypes';
import { MK1PalettePhaseHarmonicResult } from '../games/mk1/research/palettePhaseHarmonicTypes';
import { MK1PaletteCandidateEvidenceFusionResult } from '../games/mk1/research/paletteCandidateEvidenceFusionTypes';
import {
  MK1CandidateChainSummary,
  MK1FirstHopSiteSummary,
  MK1PaletteReferenceChainReconResult,
  MK1ReferrerConvergenceGroup,
  MK1TwoHopChainClass,
  SiteRepresentationKind,
} from '../games/mk1/research/paletteReferenceChainReconnaissanceTypes';
import {
  createMK1PaletteReferenceChainExport,
  executePaletteReferenceChainReconnaissance,
} from '../games/mk1/research/paletteReferenceChainReconnaissance';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';

export interface ChainClassFilterOption {
  value: 'all' | MK1TwoHopChainClass;
  label: string;
}

export const CHAIN_CLASS_FILTER_OPTIONS: readonly ChainClassFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'direct-whitelisted-object1-first-hop', label: 'Direct Whitelisted Object 1 First-Hop' },
  { value: 'structured-first-hop-with-whitelisted-object1-referrer', label: 'Structured + Whitelisted Object 1 Referrer' },
  { value: 'structured-first-hop-with-other-object1-referrer', label: 'Structured + Other Object 1 Referrer' },
  { value: 'unstructured-first-hop-with-whitelisted-object1-referrer', label: 'Unstructured + Whitelisted Object 1 Referrer' },
  { value: 'two-hop-data-only', label: 'Two-Hop Data Only' },
  { value: 'first-hop-reference-with-no-second-order-external-reference', label: 'First-Hop / No External Second-Order' },
  { value: 'relative-control-negative-chain', label: 'Relative-Control Negative Chain' },
  { value: 'ambiguous-chain', label: 'Ambiguous Chain' },
] as const;

interface Props {
  source: DirectorySource;
  report: MK1ExecutableLayoutReport;
  b1Result: MK1PaletteReferenceReconResult;
  contextResult: MK1PaletteOccurrenceContextResult | null;
  repeatedStructureResult: MK1PaletteRepeatedStructureResult | null;
  cycleLayoutResult: MK1PaletteCycleLayoutResult | null;
  phaseHarmonicResult: MK1PalettePhaseHarmonicResult | null;
  fusionResult: MK1PaletteCandidateEvidenceFusionResult | null;
  chainResult: MK1PaletteReferenceChainReconResult | null;
  setChainResult: (res: MK1PaletteReferenceChainReconResult | null) => void;
  onNavigateToTab?: (tab: string) => void;
}

export function MK1PaletteReferenceChainView({
  source,
  report,
  b1Result,
  contextResult,
  repeatedStructureResult,
  cycleLayoutResult,
  phaseHarmonicResult,
  fusionResult,
  chainResult,
  setChainResult,
  onNavigateToTab,
}: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastErrorObj, setLastErrorObj] = useState<unknown>(null);
  const [operationId, setOperationId] = useState<string | null>(null);

  // Active view sub-section
  const [activeSubSection, setActiveSubSection] = useState<
    'overview' | 'cohorts' | 'representations' | 'matrix' | 'convergence' | 'candidates' | 'sites' | 'controls'
  >('overview');

  // Candidate explorer state: independent multi-dimensional filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [filterKano, setFilterKano] = useState<'all' | 'compatible' | 'incompatible'>('all');
  const [filterB5, setFilterB5] = useState<'all' | 'participating' | 'non-participating'>('all');
  const [filterStructureDepth, setFilterStructureDepth] = useState<string>('all');
  const [filterTwoHop, setFilterTwoHop] = useState<'all' | 'has-two-hop' | 'no-two-hop'>('all');
  const [filterCodeFacing, setFilterCodeFacing] = useState<'all' | 'code-facing' | 'data-only'>('all');
  const [filterDirectFirstHop, setFilterDirectFirstHop] = useState<'all' | 'has-direct' | 'no-direct'>('all');
  const [filterChainClass, setFilterChainClass] = useState<'all' | MK1TwoHopChainClass>('all');
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [candidatePage, setCandidatePage] = useState(1);
  const candidatePageSize = 25;

  const handleResetCandidateFilters = () => {
    setCandidateSearch('');
    setFilterKano('all');
    setFilterB5('all');
    setFilterStructureDepth('all');
    setFilterTwoHop('all');
    setFilterCodeFacing('all');
    setFilterDirectFirstHop('all');
    setFilterChainClass('all');
    setCandidatePage(1);
  };

  // Site explorer state: independent multi-dimensional filters
  const [siteSearch, setSiteSearch] = useState('');
  const [siteRegionFilter, setSiteRegionFilter] = useState<string>('all');
  const [siteObjectFilter, setSiteObjectFilter] = useState<'all' | '1' | '2' | 'unmapped'>('all');
  const [siteRoleFilter, setSiteRoleFilter] = useState<string>('all');
  const [siteStructuredFilter, setSiteStructuredFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [siteExternalSecondOrderFilter, setSiteExternalSecondOrderFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [siteAnyObject1ReferrerFilter, setSiteAnyObject1ReferrerFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sitePositiveWhitelistedFilter, setSitePositiveWhitelistedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
  const [sitePage, setSitePage] = useState(1);
  const sitePageSize = 25;

  const handleResetSiteFilters = () => {
    setSiteSearch('');
    setSiteRegionFilter('all');
    setSiteObjectFilter('all');
    setSiteRoleFilter('all');
    setSiteStructuredFilter('all');
    setSiteExternalSecondOrderFilter('all');
    setSiteAnyObject1ReferrerFilter('all');
    setSitePositiveWhitelistedFilter('all');
    setSitePage(1);
  };

  // Check prerequisites
  const hasLayout = !!report && !!report.parsedHeader;
  const hasB1 = !!b1Result && b1Result.status !== 'FAILED';
  const hasB2 = !!contextResult && contextResult.status !== 'FAILED';
  const hasB3 = !!repeatedStructureResult && repeatedStructureResult.status !== 'FAILED';
  const hasB4 = !!cycleLayoutResult && cycleLayoutResult.status !== 'FAILED';
  const hasB5 = !!phaseHarmonicResult && phaseHarmonicResult.status !== 'FAILED';
  const hasB6 = !!fusionResult && fusionResult.status === 'SUCCESS';

  const allPrerequisitesMet = hasLayout && hasB1 && hasB2 && hasB3 && hasB4 && hasB5 && hasB6;

  const handleRunScan = async () => {
    if (!allPrerequisitesMet || !fusionResult || !contextResult || !repeatedStructureResult || !cycleLayoutResult || !phaseHarmonicResult) {
      setErrorMsg('Cannot execute Pass 1E.2B.7b: One or more upstream passes (Layout, B.1–B.6) are missing or non-successful.');
      return;
    }

    setIsRunning(true);
    setProgressMsg('Loading MK1.EXE binary buffer...');
    setErrorMsg(null);
    setLastErrorObj(null);
    setOperationId(null);

    try {
      const buffer = await source.readSlice(report.exePath, 0, report.exeSize);
      if (!buffer) {
        throw new Error(`Failed to read ${report.exePath} from source filesystem`);
      }

      setProgressMsg('Executing two-hop reverse-reference scan...');
      // Allow UI to breathe
      await new Promise((r) => setTimeout(r, 20));

      const result = executePaletteReferenceChainReconnaissance(
        buffer,
        report,
        b1Result,
        contextResult,
        repeatedStructureResult,
        cycleLayoutResult,
        phaseHarmonicResult,
        fusionResult,
        {
          detailCap: 1500,
          onProgress: (stage) => setProgressMsg(stage),
        },
      );

      if (result.status === 'FAILED') {
        setErrorMsg(result.failureReason || 'Reconnaissance execution failed');
      } else {
        setChainResult(result);
      }
    } catch (err: unknown) {
      setLastErrorObj(err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Execution error: ${msg}`);
    } finally {
      setIsRunning(false);
      setProgressMsg(null);
    }
  };

  const handleExportJson = () => {
    if (!chainResult) return;
    const exportPayload = createMK1PaletteReferenceChainExport(chainResult);
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `mk1_palette_reference_chain_recon_${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fast lookup map for candidate intrinsic and provenance evidence
  const fusionCandidateMap = useMemo(() => {
    if (!fusionResult || !fusionResult.candidateProfiles) return new Map<string, (typeof fusionResult.candidateProfiles)[0]>();
    return new Map(fusionResult.candidateProfiles.map((c) => [c.candidateId, c]));
  }, [fusionResult]);

  // Filtered candidates with logical AND composition
  const filteredCandidates = useMemo(() => {
    if (!chainResult) return [];
    let list = chainResult.candidateChainSummaries;

    if (filterKano === 'compatible') {
      list = list.filter((c) => c.zeroShiftKanoCompatible);
    } else if (filterKano === 'incompatible') {
      list = list.filter((c) => !c.zeroShiftKanoCompatible);
    }

    if (filterB5 !== 'all') {
      const b5Set = new Set(
        chainResult.firstHopSites
          .flatMap((s) => s.associatedCandidateTargets)
          .filter((t) => t.participatesInB5)
          .map((t) => t.candidateId),
      );
      if (filterB5 === 'participating') {
        list = list.filter((c) => b5Set.has(c.candidateId));
      } else {
        list = list.filter((c) => !b5Set.has(c.candidateId));
      }
    }

    if (filterStructureDepth !== 'all') {
      list = list.filter((c) => c.structureDepth === filterStructureDepth);
    }

    if (filterTwoHop === 'has-two-hop') {
      list = list.filter((c) => c.hasAnyTwoHopChain);
    } else if (filterTwoHop === 'no-two-hop') {
      list = list.filter((c) => !c.hasAnyTwoHopChain);
    }

    if (filterCodeFacing === 'code-facing') {
      list = list.filter((c) => c.hasCodeFacingTwoHopEvidence);
    } else if (filterCodeFacing === 'data-only') {
      list = list.filter((c) => !c.hasCodeFacingTwoHopEvidence);
    }

    if (filterDirectFirstHop === 'has-direct') {
      list = list.filter((c) => c.hasDirectWhitelistedObject1FirstHop);
    } else if (filterDirectFirstHop === 'no-direct') {
      list = list.filter((c) => !c.hasDirectWhitelistedObject1FirstHop);
    }

    if (filterChainClass !== 'all') {
      list = list.filter((c) => (c.chainClassHistogram[filterChainClass] || 0) > 0);
    }

    if (candidateSearch.trim()) {
      const q = candidateSearch.trim().toLowerCase();
      list = list.filter((c) => {
        if (c.candidateId.toLowerCase().includes(q)) return true;
        const profile = fusionCandidateMap.get(c.candidateId);
        if (profile) {
          if (profile.intrinsic.byteStartHex.toLowerCase().includes(q)) return true;
          if (String(profile.intrinsic.byteStart).includes(q)) return true;
          if (profile.provenance.contentHash.toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }

    return list;
  }, [
    chainResult,
    filterKano,
    filterB5,
    filterStructureDepth,
    filterTwoHop,
    filterCodeFacing,
    filterDirectFirstHop,
    filterChainClass,
    candidateSearch,
    fusionCandidateMap,
  ]);

  // Dynamic options for site filters
  const dynamicSiteRegions = useMemo(() => {
    if (!chainResult) return [];
    const set = new Set(chainResult.firstHopSiteSummaries.map((s) => s.sourceRegionId));
    return Array.from(set).sort();
  }, [chainResult]);

  const dynamicSiteRoles = useMemo(() => {
    if (!chainResult) return [];
    const set = new Set(chainResult.firstHopSiteSummaries.map((s) => s.firstHopRole));
    return Array.from(set).sort();
  }, [chainResult]);

  // Filtered sites with independent multi-dimensional AND-composition
  const filteredSites = useMemo(() => {
    if (!chainResult) return [];
    let list = chainResult.firstHopSiteSummaries;

    // Source Region
    if (siteRegionFilter !== 'all') {
      list = list.filter((s) => s.sourceRegionId === siteRegionFilter);
    }

    // Source Object
    if (siteObjectFilter === '1') {
      list = list.filter((s) => s.sourceObjectNumber === 1);
    } else if (siteObjectFilter === '2') {
      list = list.filter((s) => s.sourceObjectNumber === 2);
    } else if (siteObjectFilter === 'unmapped') {
      list = list.filter((s) => s.sourceObjectNumber === null);
    }

    // B.2 Role
    if (siteRoleFilter !== 'all') {
      list = list.filter((s) => s.firstHopRole === siteRoleFilter);
    }

    // B.3 Structured
    if (siteStructuredFilter === 'yes') {
      list = list.filter((s) => s.hasRepeatedStructureEvidence);
    } else if (siteStructuredFilter === 'no') {
      list = list.filter((s) => !s.hasRepeatedStructureEvidence);
    }

    // External Second-Order
    if (siteExternalSecondOrderFilter === 'yes') {
      list = list.filter((s) => s.hasExternalSecondOrderReference);
    } else if (siteExternalSecondOrderFilter === 'no') {
      list = list.filter((s) => !s.hasExternalSecondOrderReference);
    }

    // Any Object 1 Referrer
    if (siteAnyObject1ReferrerFilter === 'yes') {
      list = list.filter((s) => s.secondOrderObject1ReferrerCount > 0);
    } else if (siteAnyObject1ReferrerFilter === 'no') {
      list = list.filter((s) => s.secondOrderObject1ReferrerCount === 0);
    }

    // Positive Whitelisted Object 1 Referrer
    if (sitePositiveWhitelistedFilter === 'yes') {
      list = list.filter((s) => s.hasWhitelistedObject1SecondOrderReferrer);
    } else if (sitePositiveWhitelistedFilter === 'no') {
      list = list.filter((s) => !s.hasWhitelistedObject1SecondOrderReferrer);
    }

    // Site search across siteId, offsets, region, role, candidates
    if (siteSearch.trim()) {
      const q = siteSearch.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.siteId.toLowerCase().includes(q) ||
          s.sourceFileOffsetHex.toLowerCase().includes(q) ||
          String(s.sourceFileOffset).includes(q) ||
          s.sourceRegionId.toLowerCase().includes(q) ||
          s.firstHopRole.toLowerCase().includes(q) ||
          s.associatedCandidateIds.some((id) => id.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [
    chainResult,
    siteRegionFilter,
    siteObjectFilter,
    siteRoleFilter,
    siteStructuredFilter,
    siteExternalSecondOrderFilter,
    siteAnyObject1ReferrerFilter,
    sitePositiveWhitelistedFilter,
    siteSearch,
  ]);

  const candidatePageCount = Math.ceil(filteredCandidates.length / candidatePageSize) || 1;
  const paginatedCandidates = filteredCandidates.slice(
    (candidatePage - 1) * candidatePageSize,
    candidatePage * candidatePageSize,
  );

  const sitePageCount = Math.ceil(filteredSites.length / sitePageSize) || 1;
  const paginatedSites = filteredSites.slice(
    (sitePage - 1) * sitePageSize,
    sitePage * sitePageSize,
  );

  return (
    <div id="mk1-b7-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
              MILESTONE 1 — PASS 1E.2B.7b
            </span>
            <span className="text-xs text-zinc-400 font-mono">mkdos-m1e2b7b-final-repository-closeout</span>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 mt-1">
            Two-Hop Reverse-Reference Chain & Code-Facing Reconnaissance
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
            Examines deterministic two-hop reverse-reference chains (candidate ← first-hop site ← second-order referrer)
            to determine whether structural reference sites connect back to code-facing Object 1 operand sites.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {chainResult && (
            <button
              id="export-b7-json-btn"
              onClick={handleExportJson}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Export B.7 JSON
            </button>
          )}

          <button
            id="run-b7-recon-btn"
            onClick={handleRunScan}
            disabled={isRunning || !allPrerequisitesMet}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              isRunning || !allPrerequisitesMet
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-white" />
                <span>{chainResult ? 'Re-run Pass 1E.2B.7b' : 'Execute Pass 1E.2B.7b'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upstream Prerequisite Status Grid (Always Visible) */}
      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            {allPrerequisitesMet ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>Upstream Reconnaissance Prerequisites</span>
          </div>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              allPrerequisitesMet
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-amber-950/60 border border-amber-800 text-amber-300'
            }`}
          >
            {allPrerequisitesMet ? 'All Prerequisites Verified' : 'Prerequisites Incomplete'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-[11px]">
          {/* Executable Layout */}
          <button
            onClick={() => onNavigateToTab?.('layout')}
            className={`px-2.5 py-1.5 rounded border text-left cursor-pointer transition-colors ${
              hasLayout
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] text-zinc-400">Layout</div>
            <div className="font-bold">{hasLayout ? 'Ready' : 'Pending'}</div>
          </button>

          {/* B.1 */}
          <button
            onClick={() => onNavigateToTab?.('b1-recon')}
            className={`px-2.5 py-1.5 rounded border text-left cursor-pointer transition-colors ${
              hasB1
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] text-zinc-400">B.1 (Ref Recon)</div>
            <div className="font-bold">{hasB1 ? 'Ready' : 'Pending'}</div>
          </button>

          {/* B.2 */}
          <button
            onClick={() => onNavigateToTab?.('b2-context')}
            className={`px-2.5 py-1.5 rounded border text-left cursor-pointer transition-colors ${
              hasB2
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] text-zinc-400">B.2 (Context)</div>
            <div className="font-bold">{hasB2 ? 'Ready' : 'Pending'}</div>
          </button>

          {/* B.3 */}
          <button
            onClick={() => onNavigateToTab?.('b3-repeated')}
            className={`px-2.5 py-1.5 rounded border text-left cursor-pointer transition-colors ${
              hasB3
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] text-zinc-400">B.3 (Repeated)</div>
            <div className="font-bold">{hasB3 ? 'Ready' : 'Pending'}</div>
          </button>

          {/* B.4 */}
          <button
            onClick={() => onNavigateToTab?.('b4-cycle')}
            className={`px-2.5 py-1.5 rounded border text-left cursor-pointer transition-colors ${
              hasB4
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] text-zinc-400">B.4 (Cycle Layout)</div>
            <div className="font-bold">{hasB4 ? 'Ready' : 'Pending'}</div>
          </button>

          {/* B.5 */}
          <button
            onClick={() => onNavigateToTab?.('b5-harmonic')}
            className={`px-2.5 py-1.5 rounded border text-left cursor-pointer transition-colors ${
              hasB5
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] text-zinc-400">B.5 (Harmonic)</div>
            <div className="font-bold">{hasB5 ? 'Ready' : 'Pending'}</div>
          </button>

          {/* B.6 (Distinguishes SUCCESS from non-SUCCESS) */}
          <button
            onClick={() => onNavigateToTab?.('b6-fusion')}
            className={`px-2.5 py-1.5 rounded border text-left cursor-pointer transition-colors ${
              fusionResult?.status === 'SUCCESS'
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                : fusionResult?.status === 'PARTIAL'
                ? 'bg-amber-950/50 border-amber-800/80 text-amber-300 hover:bg-amber-900/60'
                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
            }`}
          >
            <div className="text-[10px] text-zinc-400">B.6 (Fusion)</div>
            <div className="font-bold">
              {fusionResult ? fusionResult.status : 'Pending'}
            </div>
          </button>
        </div>
      </div>

      {/* Progress Display */}
      {isRunning && progressMsg && (
        <div className="p-3 rounded-lg bg-zinc-950 border border-emerald-900 text-emerald-300 text-xs flex items-center gap-2 font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Stage: {progressMsg}</span>
        </div>
      )}

      {/* AnalysisFailurePanel for Caught Error */}
      {errorMsg && (
        <AnalysisFailurePanel
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-reference-chain-reconnaissance"
          context={{
            exePath: report.exePath,
            exeSize: report.exeSize,
            milestone: '1E.2B.7c',
            ...(operationId ? { operationId } : {}),
          }}
          error={lastErrorObj || errorMsg}
          onRetry={handleRunScan}
        />
      )}

      {/* AnalysisFailurePanel for FAILED Status */}
      {!errorMsg && chainResult && chainResult.status === 'FAILED' && (
        <AnalysisFailurePanel
          currentGame="mk1"
          subsystem="research-mk1"
          operation="palette-reference-chain-reconnaissance"
          context={{
            exePath: chainResult.exePath,
            exeSize: chainResult.exeSize,
            milestone: '1E.2B.7c',
            operationId: operationId || chainResult.timestamp,
          }}
          error={chainResult.failureReason || 'Reconciliation invariant failure'}
          onRetry={handleRunScan}
        />
      )}

      {/* Interpretation Caveats Callout */}
      <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-400 text-xs space-y-1 font-mono">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Epistemological Discipline & Non-Semantic Caveats</span>
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-zinc-400">
          <li>TWO-HOP EXACT-VALUE CHAIN != DATA FLOW OR CONSUMER RELATIONSHIP.</li>
          <li>WHITELISTED X86 OPERAND SHAPE != VERIFIED POINTER.</li>
          <li>OBJECT 1 CODE-FACING EVIDENCE DOES NOT ESTABLISH PALETTE SEMANTICS.</li>
        </ul>
      </div>

      {/* Main Results View */}
      {chainResult && (
        <div className="space-y-6">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto text-xs font-medium pb-px">
            <button
              onClick={() => setActiveSubSection('overview')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubSection === 'overview'
                  ? 'bg-zinc-800 text-zinc-100 border-t-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Summary & Key Invariants</span>
            </button>
            <button
              onClick={() => setActiveSubSection('cohorts')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubSection === 'cohorts'
                  ? 'bg-zinc-800 text-zinc-100 border-t-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Code-Facing Cohorts</span>
            </button>
            <button
              onClick={() => setActiveSubSection('representations')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubSection === 'representations'
                  ? 'bg-zinc-800 text-zinc-100 border-t-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Representations</span>
            </button>
            <button
              onClick={() => setActiveSubSection('matrix')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubSection === 'matrix'
                  ? 'bg-zinc-800 text-zinc-100 border-t-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Region Matrix</span>
            </button>
            <button
              onClick={() => setActiveSubSection('convergence')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubSection === 'convergence'
                  ? 'bg-zinc-800 text-zinc-100 border-t-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Link className="w-3.5 h-3.5 text-purple-400" />
              <span>Convergence ({chainResult.convergenceGroups.length})</span>
            </button>
            <button
              onClick={() => setActiveSubSection('candidates')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubSection === 'candidates'
                  ? 'bg-zinc-800 text-zinc-100 border-t-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>Candidates ({chainResult.candidateChainSummaries.length})</span>
            </button>
            <button
              onClick={() => setActiveSubSection('sites')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubSection === 'sites'
                  ? 'bg-zinc-800 text-zinc-100 border-t-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>First-Hop Sites ({chainResult.firstHopSites.length})</span>
            </button>
            <button
              onClick={() => setActiveSubSection('controls')}
              className={`px-3 py-2 rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubSection === 'controls'
                  ? 'bg-zinc-800 text-zinc-100 border-t-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Controls</span>
            </button>
          </div>

          {/* 1. Overview & Key Invariants */}
          {activeSubSection === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono text-zinc-400">First-Hop Sites</div>
                  <div className="text-xl font-bold text-zinc-100 mt-1">
                    {chainResult.globalSummary.firstHopSitesProcessed}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                    {chainResult.globalSummary.firstHopStructuredB3Sites} structured (B.3)
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono text-zinc-400">Site Descriptors</div>
                  <div className="text-xl font-bold text-zinc-100 mt-1">
                    {chainResult.globalSummary.siteRepresentationDescriptorsGenerated}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                    {chainResult.globalSummary.distinctSiteRepresentationValues} distinct values
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono text-zinc-400">External Referrers</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {chainResult.globalSummary.secondOrderExternalUniquePhysicalReferrers}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                    {chainResult.globalSummary.secondOrderExternalLogicalMatches} logical matches
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono text-zinc-400">Code-Facing Referrers</div>
                  <div className="text-xl font-bold text-purple-400 mt-1">
                    {chainResult.globalSummary.secondOrderWhitelistedObject1Referrers}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                    of {chainResult.globalSummary.secondOrderObject1Referrers} Object 1 referrers
                  </div>
                </div>
              </div>

              {/* Candidate Impact Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-semibold text-zinc-200">Candidate Reach</div>
                  <div className="flex justify-between items-center text-xs font-mono py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Candidates with Any Two-Hop Chain:</span>
                    <span className="text-emerald-400 font-bold">
                      {chainResult.globalSummary.candidateCountWithAnyTwoHopChain} / {chainResult.candidateChainSummaries.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Candidates with Code-Facing Two-Hop Evidence:</span>
                    <span className="text-purple-400 font-bold">
                      {chainResult.globalSummary.candidateCountWithCodeFacingTwoHopEvidence} / {chainResult.candidateChainSummaries.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1">
                    <span className="text-zinc-400">Sites with Whitelisted Object 1 Referrer:</span>
                    <span className="text-indigo-400 font-bold">
                      {chainResult.globalSummary.firstHopSitesWithWhitelistedObject1SecondOrderReferrer} / {chainResult.globalSummary.firstHopSitesProcessed}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-semibold text-zinc-200">Reconciliation Audit</div>
                  <div className="flex justify-between items-center text-xs font-mono py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Logical First-Hop Reconciles:</span>
                    <span className={chainResult.reconciliation.logicalFirstHopMatchesReconcile ? 'text-emerald-400' : 'text-red-400'}>
                      {chainResult.reconciliation.logicalFirstHopMatchesReconcile ? 'PASS' : 'FAIL'} ({chainResult.reconciliation.b1LogicalExternalMatchesInput} matches)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400">Physical First-Hop Reconciles:</span>
                    <span className={chainResult.reconciliation.physicalFirstHopSitesReconcile ? 'text-emerald-400' : 'text-red-400'}>
                      {chainResult.reconciliation.physicalFirstHopSitesReconcile ? 'PASS' : 'FAIL'} ({chainResult.reconciliation.b1UniquePhysicalSitesInput} sites)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1">
                    <span className="text-zinc-400">All Matches Accounted For:</span>
                    <span className={chainResult.reconciliation.allReconciled ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {chainResult.reconciliation.allReconciled ? '100% RECONCILED' : 'DISCREPANCY'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Roles Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-semibold text-zinc-200">First-Hop Site X86 Roles</div>
                  <div className="space-y-1 font-mono text-xs">
                    {Object.entries(chainResult.firstHopRoleSummary).map(([role, count]) => (
                      <div key={role} className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">{role}</span>
                        <span className="text-zinc-200 font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-semibold text-zinc-200">Second-Order Physical Referrer Roles</div>
                  <div className="space-y-1 font-mono text-xs">
                    {Object.entries(chainResult.secondOrderRoleSummary).map(([role, count]) => (
                      <div key={role} className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">{role}</span>
                        <span className="text-zinc-200 font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scan Configuration & Detail Accounting Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scan Configuration */}
                {chainResult.scanConfiguration && (
                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="text-xs font-semibold text-zinc-200">Scan Configuration & Boundaries</div>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">Operand Width / Endianness</span>
                        <span className="text-zinc-200">
                          {chainResult.scanConfiguration.uintWidth}-bit {chainResult.scanConfiguration.endianness.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">Scan Alignment</span>
                        <span className="text-zinc-200">{chainResult.scanConfiguration.alignment}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">File Range</span>
                        <span className="text-zinc-200 font-mono">
                          0x{chainResult.scanConfiguration.scanStart.toString(16).toUpperCase()} – 0x{chainResult.scanConfiguration.scanEnd.toString(16).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">Whole-File Passes</span>
                        <span className="text-zinc-200">{chainResult.scanConfiguration.wholeFileScanCount} pass</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">Per-Site Detail Cap</span>
                        <span className="text-zinc-200">{chainResult.detailCap} items</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detail Cap Truncation Accounting */}
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-semibold text-zinc-200">Detail Cap & Truncation Accounting</div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-400">2nd-Order Details Included</span>
                      <span className="text-emerald-400 font-bold">{chainResult.secondOrderDetailsIncluded}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-400">2nd-Order Details Omitted</span>
                      <span className={chainResult.secondOrderDetailsOmitted > 0 ? 'text-amber-400' : 'text-zinc-400'}>
                        {chainResult.secondOrderDetailsOmitted}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-400">Two-Hop Chains Generated</span>
                      <span className="text-zinc-200">{chainResult.chainDetailsGenerated}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-400">Two-Hop Chains Included</span>
                      <span className="text-emerald-400 font-bold">{chainResult.chainDetailsIncluded}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-400">Sites with Truncated Details</span>
                      <span className={chainResult.sitesWithTruncatedDetails > 0 ? 'text-amber-400' : 'text-zinc-400'}>
                        {chainResult.sitesWithTruncatedDetails}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upstream Passes Summary & Control Exclusion Audit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upstream Summary */}
                {chainResult.upstreamSummary && (
                  <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="text-xs font-semibold text-zinc-200">Upstream Pass Verification Summary</div>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">B.1 Sites / Matches</span>
                        <span className="text-zinc-200">
                          {chainResult.upstreamSummary.b1UniquePhysicalSites} sites / {chainResult.upstreamSummary.b1LogicalMatches} matches ({chainResult.upstreamSummary.b1Status})
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">B.2 Operand Context</span>
                        <span className="text-zinc-200">
                          {chainResult.upstreamSummary.b2ClassifiedPositions} positions ({chainResult.upstreamSummary.b2Status})
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">B.3 Repeated Structure</span>
                        <span className="text-zinc-200">{chainResult.upstreamSummary.b3Status}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">B.4 Cycle Layout</span>
                        <span className="text-zinc-200">{chainResult.upstreamSummary.b4Status}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-zinc-900">
                        <span className="text-zinc-400">B.5 Recurrence Harmonic</span>
                        <span className="text-zinc-200">{chainResult.upstreamSummary.b5Status}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">B.6 Fusion Profiles (True B.5 Cohort)</span>
                        <span className="text-emerald-400 font-semibold">
                          {chainResult.upstreamSummary.b6CandidateCount} ({chainResult.upstreamSummary.b6TrueB5ParticipantCount} B.5 Cohort)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Control Exclusion Audit */}
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-xs font-semibold text-zinc-200">Control Calibration Exclusion Audit</div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-400">Control Sites Excluded from Counts</span>
                      <span className={chainResult.reconciliation.controlSitesExcludedFromCandidateCounts ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {chainResult.reconciliation.controlSitesExcludedFromCandidateCounts ? 'VERIFIED EXCLUDED' : 'CONTAMINATION'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-400">Controls Injected into Candidates</span>
                      <span className={chainResult.reconciliation.controlsInjectedIntoCandidateCounts === 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {chainResult.reconciliation.controlsInjectedIntoCandidateCounts}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-900">
                      <span className="text-zinc-400">Control-Candidate Site Collisions</span>
                      <span className={chainResult.reconciliation.controlCandidatePhysicalSiteCollisions.length === 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {chainResult.reconciliation.controlCandidatePhysicalSiteCollisions.length}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-400">Control-Candidate Chain Collisions</span>
                      <span className={chainResult.reconciliation.controlCandidateChainSummaryCollisions.length === 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {chainResult.reconciliation.controlCandidateChainSummaryCollisions.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sole Positive Endpoint & Negative Precedence Callouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sole Positive Endpoint */}
                <div className="p-4 rounded-lg bg-zinc-950 border border-emerald-900/60 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">Sole Code-Facing Positive Endpoint</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300">
                      structured-first-hop-with-whitelisted-object1-referrer
                    </span>
                  </div>
                  <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-amber-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Exact-value reverse reference only. Low-valued immediates may be coincidental.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px] pt-1 border-t border-zinc-900">
                    <div>Candidate: <span className="text-zinc-200 font-bold">MK1.EXE:0x0002C3FE</span></div>
                    <div>1st-Hop Site: <span className="text-blue-400 font-bold">0x0000001D</span></div>
                    <div>Cand Rep: <span className="text-zinc-200">object-relative-payload</span></div>
                    <div>2nd-Order Rep: <span className="text-emerald-300 font-bold">physical-site-offset</span></div>
                    <div>Matched Value: <span className="text-amber-300 font-bold">0x0000001D</span></div>
                    <div>2nd-Order Referrer: <span className="text-purple-400 font-bold">0x000602B7</span></div>
                    <div>Region: <span className="text-zinc-300">Object 1 file-backed</span></div>
                    <div>Operand Shape: <span className="text-emerald-400 font-bold">mov-r32-imm32</span></div>
                  </div>
                </div>

                {/* Negative Precedence Anchor */}
                <div className="p-4 rounded-lg bg-zinc-950 border border-amber-900/60 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">Negative Control Precedence Anchor</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 border border-amber-800 text-amber-300">
                      relative-control-negative-chain
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Negative relative branch displacement takes precedence over B.3 repeated structure.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-zinc-400 text-[11px] pt-1 border-t border-zinc-900">
                    <div>Candidate: <span className="text-zinc-200 font-bold">MK1.EXE:0x0002A8D6</span></div>
                    <div>1st-Hop Site: <span className="text-blue-400 font-bold">0x00043DC0</span></div>
                    <div>2nd-Order Referrer: <span className="text-purple-400 font-bold">0x00050B4F</span></div>
                    <div>Operand Shape: <span className="text-red-400 font-bold">negative-rel32</span></div>
                    <div>B.3 Structure: <span className="text-zinc-300">Present (Subsumed)</span></div>
                    <div>Resolved Class: <span className="text-amber-300 font-bold">relative-control-negative</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Direct vs Indirect Cohorts */}
          {activeSubSection === 'cohorts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-200">
                  Direct Code-Facing (First Hop) vs Two-Hop Code-Facing Comparison
                </div>
                <p className="text-xs text-zinc-400">
                  Compares direct Object 1 whitelisted operand references against two-hop whitelisted Object 1 operand referrers across key candidate cohorts.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-2.5">Cohort</th>
                        <th className="p-2.5 text-right">Candidates</th>
                        <th className="p-2.5 text-right">Direct Code Only</th>
                        <th className="p-2.5 text-right">Two-Hop Code Only</th>
                        <th className="p-2.5 text-right">Both</th>
                        <th className="p-2.5 text-right">Neither</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {chainResult.cohortComparison.map((entry) => (
                        <tr key={entry.cohortName} className="hover:bg-zinc-900/40">
                          <td className="p-2.5 text-zinc-200 font-semibold">{entry.cohortName}</td>
                          <td className="p-2.5 text-right text-zinc-400">{entry.totalCandidates}</td>
                          <td className="p-2.5 text-right text-blue-400">{entry.directCodeFacingOnly}</td>
                          <td className="p-2.5 text-right text-purple-400">{entry.twoHopCodeFacingOnly}</td>
                          <td className="p-2.5 text-right text-emerald-400 font-bold">{entry.both}</td>
                          <td className="p-2.5 text-right text-zinc-500">{entry.neither}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. Representation Performance */}
          {activeSubSection === 'representations' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-200">
                  Second-Order Target Representation Performance
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-2.5">Representation Kind</th>
                        <th className="p-2.5 text-right">Eligible Sites</th>
                        <th className="p-2.5 text-right">Distinct Values</th>
                        <th className="p-2.5 text-right">Sites with External Refs</th>
                        <th className="p-2.5 text-right">External Matches</th>
                        <th className="p-2.5 text-right">Unique Physical Referrers</th>
                        <th className="p-2.5 text-right">Object 1 Referrers</th>
                        <th className="p-2.5 text-right">Whitelisted Object 1</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {chainResult.representationSummary.map((rep) => (
                        <tr key={rep.representationKind} className="hover:bg-zinc-900/40">
                          <td className="p-2.5 text-zinc-200 font-semibold">{rep.representationKind}</td>
                          <td className="p-2.5 text-right text-zinc-400">{rep.eligibleSiteCount}</td>
                          <td className="p-2.5 text-right text-zinc-400">{rep.distinctValues}</td>
                          <td className="p-2.5 text-right text-emerald-400">{rep.sitesWithExternalSecondOrderReferences}</td>
                          <td className="p-2.5 text-right text-zinc-300">{rep.externalLogicalMatches}</td>
                          <td className="p-2.5 text-right text-zinc-300">{rep.uniquePhysicalReferrerPositions}</td>
                          <td className="p-2.5 text-right text-blue-400">{rep.object1ReferrerCount}</td>
                          <td className="p-2.5 text-right text-purple-400 font-bold">{rep.whitelistedObject1ReferrerCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. Region Matrix */}
          {activeSubSection === 'matrix' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-200">
                  First-Hop Region × Second-Order Referrer Region Cross-Tabulation
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <tr>
                        <th className="p-2.5">First-Hop Site Region</th>
                        <th className="p-2.5">Second-Order Referrer Region</th>
                        <th className="p-2.5 text-right">Logical Chain Matches</th>
                        <th className="p-2.5 text-right">Unique Physical Referrers</th>
                        <th className="p-2.5 text-right">First-Hop Sites</th>
                        <th className="p-2.5 text-right">Distinct Candidates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {chainResult.regionMatrix.map((cell, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/40">
                          <td className="p-2.5 text-indigo-400 font-semibold">{cell.firstHopRegionId}</td>
                          <td className="p-2.5 text-cyan-400 font-semibold">{cell.referrerRegionId}</td>
                          <td className="p-2.5 text-right text-zinc-300">{cell.logicalChainMatchCount}</td>
                          <td className="p-2.5 text-right text-zinc-300">{cell.uniquePhysicalReferrerCount}</td>
                          <td className="p-2.5 text-right text-emerald-400">{cell.distinctFirstHopSiteCount}</td>
                          <td className="p-2.5 text-right text-purple-400 font-bold">{cell.distinctCandidateCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. Referrer Convergence Groups */}
          {activeSubSection === 'convergence' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-200">
                  Referrer Convergence Groups ({chainResult.convergenceGroups.length})
                </div>
                <p className="text-xs text-zinc-400">
                  Identifies unique second-order physical referrer positions that point to multiple first-hop sites or candidates.
                </p>

                <div className="space-y-3">
                  {chainResult.convergenceGroups.map((grp) => (
                    <div key={grp.groupId} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-purple-400">{grp.groupId}</span>
                          <span className="text-zinc-400">@ {grp.secondOrderReferrerOffsetHex}</span>
                          <span className="text-zinc-500">({grp.referrerRegionId})</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300">
                            Obj {grp.referrerObjectNumber ?? 'None'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950 border border-purple-800 text-purple-300">
                            {grp.referrerX86Role}
                          </span>
                          {grp.referrerX86Shape && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 border border-indigo-800 text-indigo-300">
                              {grp.referrerX86Shape}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-zinc-400 border-t border-zinc-800/60">
                        <div>
                          Sites Target Count:{' '}
                          <span className="text-emerald-400 font-bold">{grp.siteIds.length}</span>
                        </div>
                        <div>
                          Candidates Target Count:{' '}
                          <span className="text-indigo-400 font-bold">{grp.candidateIds.length}</span>
                        </div>
                        <div>
                          Kano Compatible Split:{' '}
                          <span className="text-zinc-200">
                            {grp.candidateKanoCompatibilitySplit.kanoCompatibleCount} Kano /{' '}
                            {grp.candidateKanoCompatibilitySplit.nonCompatibleCount} Non-Kano
                          </span>
                        </div>
                      </div>

                      {grp.b5CandidateIds.length > 0 && (
                        <div className="p-2 rounded bg-amber-950/30 border border-amber-900/40 text-[11px] font-mono text-amber-300">
                          B.5 Candidates Present: {grp.b5CandidateIds.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. Candidate Explorer */}
          {activeSubSection === 'candidates' && (
            <div className="space-y-4">
              {/* Filter Controls */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-96">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Candidate ID, hex offset, content hash..."
                      value={candidateSearch}
                      onChange={(e) => {
                        setCandidateSearch(e.target.value);
                        setCandidatePage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-xs font-mono text-zinc-400">
                      Showing <strong className="text-emerald-400">{filteredCandidates.length}</strong> of {chainResult.candidateChainSummaries.length} candidates
                    </div>
                    <button
                      onClick={handleResetCandidateFilters}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reset all candidate filters"
                    >
                      <RotateCcw className="w-3 h-3 text-zinc-400" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Independent Filter Dropdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs font-mono">
                  {/* Kano Filter */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Kano Status</label>
                    <select
                      value={filterKano}
                      onChange={(e) => {
                        setFilterKano(e.target.value as typeof filterKano);
                        setCandidatePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Kano: All</option>
                      <option value="compatible">Kano: Compatible</option>
                      <option value="incompatible">Kano: Incompatible</option>
                    </select>
                  </div>

                  {/* B.5 Cohort Filter */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">B.5 Cohort</label>
                    <select
                      value={filterB5}
                      onChange={(e) => {
                        setFilterB5(e.target.value as typeof filterB5);
                        setCandidatePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">B.5: All</option>
                      <option value="participating">B.5: Participant</option>
                      <option value="non-participating">B.5: Non-Part.</option>
                    </select>
                  </div>

                  {/* Structure Depth Filter */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Structure Depth</label>
                    <select
                      value={filterStructureDepth}
                      onChange={(e) => {
                        setFilterStructureDepth(e.target.value);
                        setCandidatePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Depth: All</option>
                      <option value="b5-harmonic-structure">Harmonic (B.5)</option>
                      <option value="b4-cycle-layout">Cycle Layout (B.4)</option>
                      <option value="b3-repeated-structure">Repeated (B.3)</option>
                      <option value="b2-context">Context (B.2)</option>
                      <option value="b1-external-reference">External Ref (B.1)</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  {/* Two-Hop Filter */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Two-Hop Chain</label>
                    <select
                      value={filterTwoHop}
                      onChange={(e) => {
                        setFilterTwoHop(e.target.value as typeof filterTwoHop);
                        setCandidatePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Two-Hop: All</option>
                      <option value="has-two-hop">Has Two-Hop</option>
                      <option value="no-two-hop">No Two-Hop</option>
                    </select>
                  </div>

                  {/* Code-Facing Filter */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Code-Facing</label>
                    <select
                      value={filterCodeFacing}
                      onChange={(e) => {
                        setFilterCodeFacing(e.target.value as typeof filterCodeFacing);
                        setCandidatePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Code-Facing: All</option>
                      <option value="code-facing">Code-Facing Evid.</option>
                      <option value="data-only">Data-Only</option>
                    </select>
                  </div>

                  {/* Direct Code First-Hop Filter */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Direct Code 1st-Hop</label>
                    <select
                      value={filterDirectFirstHop}
                      onChange={(e) => {
                        setFilterDirectFirstHop(e.target.value as typeof filterDirectFirstHop);
                        setCandidatePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Direct Code: All</option>
                      <option value="has-direct">Has Direct Obj 1</option>
                      <option value="no-direct">No Direct Obj 1</option>
                    </select>
                  </div>

                  {/* Chain Class Filter */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Chain Class</label>
                    <select
                      value={filterChainClass}
                      onChange={(e) => {
                        setFilterChainClass(e.target.value as 'all' | MK1TwoHopChainClass);
                        setCandidatePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {CHAIN_CLASS_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              <div className="space-y-2">
                {paginatedCandidates.map((cand) => {
                  const isExpanded = expandedCandidateId === cand.candidateId;
                  const candChainPaths = cand.chainPaths || [];
                  return (
                    <div
                      key={cand.candidateId}
                      className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedCandidateId(isExpanded ? null : cand.candidateId)
                        }
                        className="w-full p-3 text-left flex items-center justify-between hover:bg-zinc-900/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 font-mono text-xs">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                          )}
                          <span className="font-bold text-zinc-200">{cand.candidateId}</span>
                          {cand.zeroShiftKanoCompatible && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300">
                              Kano
                            </span>
                          )}
                          <span className="text-zinc-500">|</span>
                          <span className="text-zinc-400">
                            1st Hop Sites: <strong className="text-zinc-200">{cand.firstHopUniqueSiteCount}</strong>
                          </span>
                          <span className="text-zinc-500">|</span>
                          <span className="text-zinc-400">
                            2nd Order Referrers: <strong className="text-emerald-400">{cand.secondOrderUniquePhysicalReferrers}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {cand.hasDirectWhitelistedObject1FirstHop && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                              Direct Code
                            </span>
                          )}
                          {cand.hasCodeFacingTwoHopEvidence && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-semibold">
                              Two-Hop Code
                            </span>
                          )}
                          {cand.structuredSitesWithWhitelistedObject1Referrer > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-semibold">
                              Structured+Code
                            </span>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/80 space-y-3 font-mono text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-400">
                            <div>
                              Status: <span className="text-zinc-200">{cand.status}</span>
                            </div>
                            <div>
                              Research Score: <span className="text-zinc-200">{cand.researchScore}</span>
                            </div>
                            <div>
                              Structure Depth: <span className="text-zinc-200">{cand.structureDepth}</span>
                            </div>
                            <div>
                              Reference Profile: <span className="text-zinc-200">{cand.referenceProfile}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-zinc-800/60">
                            <div className="font-semibold text-zinc-300 mb-2">
                              Chain Paths ({candChainPaths.length})
                            </div>
                            <div className="space-y-1.5 max-h-64 overflow-y-auto">
                              {candChainPaths.map((p) => (
                                <div
                                  key={p.pathId}
                                  className="p-2 rounded bg-zinc-950 border border-zinc-800/80 space-y-1 text-[11px]"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-zinc-300 font-bold">{p.candidateId}</span>
                                      <span className="text-zinc-500">←</span>
                                      <span className="text-blue-400">
                                        {p.firstHopSiteOffsetHex} ({p.firstHopRole})
                                      </span>
                                      <span className="text-zinc-500">←</span>
                                      <span className="text-purple-400">
                                        {p.secondOrderReferrerOffsetHex || 'None'}{' '}
                                        {p.secondOrderRole ? `(${p.secondOrderRole})` : ''}
                                      </span>
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                                      {p.chainClass}
                                    </span>
                                  </div>
                                  {p.chainClass === 'structured-first-hop-with-whitelisted-object1-referrer' && (
                                    <div className="text-[10px] text-amber-300/90 font-mono flex items-center gap-1 pt-0.5">
                                      <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                                      <span>Exact-value reverse reference only. Low-valued immediates may be coincidental.</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Candidate Pagination */}
              {candidatePageCount > 1 && (
                <div className="flex items-center justify-between pt-2 font-mono text-xs text-zinc-400">
                  <div>
                    Page {candidatePage} of {candidatePageCount}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCandidatePage((p) => Math.max(1, p - 1))}
                      disabled={candidatePage === 1}
                      className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCandidatePage((p) => Math.min(candidatePageCount, p + 1))}
                      disabled={candidatePage === candidatePageCount}
                      className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. First-Hop Site Explorer */}
          {activeSubSection === 'sites' && (
            <div className="space-y-4">
              {/* Independent Site Filter Controls */}
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-96">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Site ID, offset, region, role, candidates..."
                      value={siteSearch}
                      onChange={(e) => {
                        setSiteSearch(e.target.value);
                        setSitePage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-xs font-mono text-zinc-400">
                      Showing <strong className="text-emerald-400">{filteredSites.length}</strong> of {chainResult.firstHopSiteSummaries.length} sites
                    </div>
                    <button
                      onClick={handleResetSiteFilters}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reset all site filters"
                    >
                      <RotateCcw className="w-3 h-3 text-zinc-400" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Independent Filter Dropdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono">
                  {/* Source Region */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Source Region</label>
                    <select
                      value={siteRegionFilter}
                      onChange={(e) => {
                        setSiteRegionFilter(e.target.value);
                        setSitePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Region: All</option>
                      {dynamicSiteRegions.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Source Object */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Source Object</label>
                    <select
                      value={siteObjectFilter}
                      onChange={(e) => {
                        setSiteObjectFilter(e.target.value as typeof siteObjectFilter);
                        setSitePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Object: All</option>
                      <option value="1">Object 1</option>
                      <option value="2">Object 2</option>
                      <option value="unmapped">Unmapped</option>
                    </select>
                  </div>

                  {/* B.2 Role */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">B.2 Role</label>
                    <select
                      value={siteRoleFilter}
                      onChange={(e) => {
                        setSiteRoleFilter(e.target.value);
                        setSitePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Role: All</option>
                      {dynamicSiteRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* B.3 Structured */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">B.3 Structured</label>
                    <select
                      value={siteStructuredFilter}
                      onChange={(e) => {
                        setSiteStructuredFilter(e.target.value as typeof siteStructuredFilter);
                        setSitePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">B.3: All</option>
                      <option value="yes">Structured (Yes)</option>
                      <option value="no">Unstructured (No)</option>
                    </select>
                  </div>

                  {/* External 2nd-Order */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">External 2nd-Order</label>
                    <select
                      value={siteExternalSecondOrderFilter}
                      onChange={(e) => {
                        setSiteExternalSecondOrderFilter(e.target.value as typeof siteExternalSecondOrderFilter);
                        setSitePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">2nd-Order: All</option>
                      <option value="yes">Has External</option>
                      <option value="no">None</option>
                    </select>
                  </div>

                  {/* Any Object 1 Referrer */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Obj 1 Referrer</label>
                    <select
                      value={siteAnyObject1ReferrerFilter}
                      onChange={(e) => {
                        setSiteAnyObject1ReferrerFilter(e.target.value as typeof siteAnyObject1ReferrerFilter);
                        setSitePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Obj1 Ref: All</option>
                      <option value="yes">Has Obj 1 Ref</option>
                      <option value="no">No Obj 1 Ref</option>
                    </select>
                  </div>

                  {/* Positive Whitelisted Obj 1 Referrer */}
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-0.5">Whitelisted Obj 1</label>
                    <select
                      value={sitePositiveWhitelistedFilter}
                      onChange={(e) => {
                        setSitePositiveWhitelistedFilter(e.target.value as typeof sitePositiveWhitelistedFilter);
                        setSitePage(1);
                      }}
                      className="w-full px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Whitelist: All</option>
                      <option value="yes">Whitelisted</option>
                      <option value="no">Non-Whitelisted</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sites List */}
              <div className="space-y-2">
                {paginatedSites.map((s) => {
                  const isExpanded = expandedSiteId === s.siteId;
                  return (
                    <div
                      key={s.siteId}
                      className="rounded-lg bg-zinc-950 border border-zinc-800 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedSiteId(isExpanded ? null : s.siteId)}
                        className="w-full p-3 text-left flex items-center justify-between hover:bg-zinc-900/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 font-mono text-xs">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-500" />
                          )}
                          <span className="font-bold text-zinc-200">{s.siteId}</span>
                          <span className="text-zinc-400">({s.sourceRegionId})</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300">
                            Obj {s.sourceObjectNumber ?? 'None'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {s.hasRepeatedStructureEvidence && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                              B.3 Structured
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                            {s.firstHopRole}
                          </span>
                          <span className="text-emerald-400 font-bold">
                            {s.externalSecondOrderUniquePhysicalReferrers} Ext Referrers
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/80 space-y-3 font-mono text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-400">
                            <div>
                              File Offset: <span className="text-zinc-200">{s.sourceFileOffsetHex}</span>
                            </div>
                            <div>
                              Target Candidates: <span className="text-zinc-200">{s.associatedCandidateCount}</span>
                            </div>
                            <div>
                              Logical 2nd Order: <span className="text-zinc-200">{s.externalSecondOrderLogicalMatches}</span>
                            </div>
                            <div>
                              Whitelisted O1 Refs: <span className="text-purple-400 font-bold">{s.secondOrderWhitelistedObject1ReferrerCount}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-zinc-800/60">
                            <div className="font-semibold text-zinc-300 mb-1">
                              Associated Candidate IDs:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {s.associatedCandidateIds.map((cId) => (
                                <span
                                  key={cId}
                                  className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                                >
                                  {cId}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Site Pagination */}
              {sitePageCount > 1 && (
                <div className="flex items-center justify-between pt-2 font-mono text-xs text-zinc-400">
                  <div>
                    Page {sitePage} of {sitePageCount}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSitePage((p) => Math.max(1, p - 1))}
                      disabled={sitePage === 1}
                      className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setSitePage((p) => Math.min(sitePageCount, p + 1))}
                      disabled={sitePage === sitePageCount}
                      className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. Controls */}
          {activeSubSection === 'controls' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="text-xs font-semibold text-zinc-200">
                  Non-Candidate Anchor Controls Analysis
                </div>
                <p className="text-xs text-zinc-400">
                  Controls such as String Area Base are scanned separately and excluded from candidate occurrence totals.
                </p>

                <div className="space-y-2">
                  {chainResult.controls.map((ctrl) => (
                    <div
                      key={ctrl.controlName}
                      className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2 font-mono text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-200">{ctrl.controlName}</span>
                        <span className="text-zinc-500">@ {ctrl.sourceFileOffsetHex}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-400 text-[11px]">
                        <div>Status: {ctrl.status}</div>
                        <div>1st Hop Count: {ctrl.firstHopCount}</div>
                        <div>2nd Order Logical Matches: {ctrl.secondOrderLogicalMatches}</div>
                        <div>2nd Order Physical Referrers: {ctrl.secondOrderPhysicalReferrers}</div>
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

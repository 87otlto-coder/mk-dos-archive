import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  MK1PaletteCandidate,
  MK1PaletteScanResult,
  MK1SpriteColorUsageStats,
  MK1AggregateColorUsageStats,
  MK1UniquePaletteContent,
  PaletteCandidateTier,
  scanExeForPalettes,
  loadKanoFixtureSpritesAndStats,
  createMK1CompactPaletteCatalogueExport,
  createMK1PaletteCatalogueExport,
  renderPaletteAppliedSpriteToCanvas,
  UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR,
} from '../games/mk1/research/paletteProbe';
import {
  DecodedIndexedSprite,
  renderDiagnosticSpriteToCanvas,
} from '../games/mk1/graphics/ugraDecoder';
import { APP_NAME, APP_VERSION, APP_MILESTONE } from '../appMetadata';
import {
  Palette,
  Search,
  Download,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Info,
  ZoomIn,
  Sparkles,
  Copy,
  Hash,
  FileText,
} from 'lucide-react';

interface Props {
  source: DirectorySource;
  onScanResult?: (result: MK1PaletteScanResult | null) => void;
}

export type PaletteViewMode = 'shortlist' | 'unique' | 'all';

export function MK1PaletteCatalogueView({ source, onScanResult }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progressFraction, setProgressFraction] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<MK1PaletteScanResult | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // View mode: 'shortlist' (default), 'unique', or 'all'
  const [viewMode, setViewMode] = useState<PaletteViewMode>('shortlist');

  // Kano fixture sprite and statistics (authoritative pipeline)
  const [kanoProofSprite, setKanoProofSprite] = useState<DecodedIndexedSprite | null>(null);
  const [kanoProofStats, setKanoProofStats] = useState<MK1SpriteColorUsageStats | null>(null);
  const [kanoAggregateStats, setKanoAggregateStats] = useState<MK1AggregateColorUsageStats | null>(null);

  // Table filters and search
  const [searchFilter, setSearchFilter] = useState('');
  const [zeroShiftFilter, setZeroShiftFilter] = useState<'all' | 'compatible' | 'incompatible'>('all');
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'offset' | 'length' | 'unique' | 'ascii'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Preview controls
  const [zoomScale, setZoomScale] = useState<number>(3);
  const [showAdvancedExport, setShowAdvancedExport] = useState(false);

  // Canvas refs for side-by-side comparison
  const grayscaleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load Kano fixture proof sprite & aggregate stats on mount or source change
  useEffect(() => {
    let cancelled = false;
    setScanResult(null);
    onScanResult?.(null);
    const loadKano = async () => {
      try {
        const kanoData = await loadKanoFixtureSpritesAndStats(source);
        if (!cancelled && kanoData) {
          setKanoProofSprite(kanoData.anchorSprite);
          setKanoProofStats(kanoData.anchorStats);
          setKanoAggregateStats(kanoData.aggregateStats);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMsg(`Failed to load authoritative Kano data: ${msg}`);
        }
      }
    };
    loadKano();
    return () => {
      cancelled = true;
    };
  }, [source]);

  const handleRunScan = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setProgressMsg('Preparing palette catalogue scan...');
    setProgressFraction(0.05);

    try {
      // Ensure we have authoritative Kano stats first
      let currentKanoStats = kanoAggregateStats;
      if (!currentKanoStats) {
        const kanoData = await loadKanoFixtureSpritesAndStats(source);
        if (kanoData) {
          setKanoProofSprite(kanoData.anchorSprite);
          setKanoProofStats(kanoData.anchorStats);
          setKanoAggregateStats(kanoData.aggregateStats);
          currentKanoStats = kanoData.aggregateStats;
        }
      }

      const result = await scanExeForPalettes(source, {
        kanoStats: currentKanoStats ?? undefined,
        onProgress: (msg, fraction) => {
          setProgressMsg(msg);
          if (fraction !== undefined) {
            setProgressFraction(fraction);
          }
        },
      });

      setScanResult(result);
      onScanResult?.(result);

      // Select top research candidate or first compatible candidate by default
      const researchCandidates = result.candidates.filter((c) => c.tier === 'research');
      if (researchCandidates.length > 0) {
        researchCandidates.sort((a, b) => b.researchScore - a.researchScore);
        setSelectedCandidateId(researchCandidates[0].id);
      } else if (result.candidates.length > 0) {
        const firstCompatible = result.candidates.find((c) => c.zeroShiftKanoCompatible);
        setSelectedCandidateId(firstCompatible ? firstCompatible.id : result.candidates[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Palette scan failed: ${msg}`);
      setScanResult(null);
      onScanResult?.(null);
    } finally {
      setIsScanning(false);
    }
  };

  const selectedCandidate = useMemo(() => {
    if (!scanResult || !selectedCandidateId) return null;
    return scanResult.candidates.find((c) => c.id === selectedCandidateId) ?? null;
  }, [scanResult, selectedCandidateId]);

  // Candidates / contents list filtered and sorted based on current viewMode
  const displayedCandidates = useMemo(() => {
    if (!scanResult) return [];

    let list: MK1PaletteCandidate[] = [];

    if (viewMode === 'shortlist') {
      list = scanResult.candidates.filter((c) => c.tier === 'research');
    } else if (viewMode === 'all') {
      list = scanResult.candidates.slice();
    } else if (viewMode === 'unique') {
      // Map unique contents to their representative candidates
      const repOffsets = new Set(scanResult.uniqueContents.map((u) => u.representativeOffset));
      list = scanResult.candidates.filter((c) => repOffsets.has(c.exeOffset) && !c.duplicateContentOf);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.exeOffsetHex.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.contentHash.toLowerCase().includes(q) ||
          c.length.toString().includes(q),
      );
    }

    if (zeroShiftFilter === 'compatible') {
      list = list.filter((c) => c.zeroShiftKanoCompatible === true);
    } else if (zeroShiftFilter === 'incompatible') {
      list = list.filter((c) => c.zeroShiftKanoCompatible === false);
    }

    if (hideDuplicates && viewMode === 'all') {
      list = list.filter((c) => !c.duplicateContentOf);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'score') {
        cmp = a.researchScore - b.researchScore;
      } else if (sortBy === 'offset') {
        cmp = a.exeOffset - b.exeOffset;
      } else if (sortBy === 'length') {
        cmp = a.length - b.length;
      } else if (sortBy === 'unique') {
        cmp = a.uniqueColorCount - b.uniqueColorCount;
      } else if (sortBy === 'ascii') {
        cmp = a.textLikeScore - b.textLikeScore;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [scanResult, viewMode, searchFilter, zeroShiftFilter, hideDuplicates, sortBy, sortDirection]);

  // Render Kano canvases whenever selectedCandidate, kanoProofSprite, or zoom changes
  useEffect(() => {
    if (!kanoProofSprite) return;

    if (grayscaleCanvasRef.current) {
      renderDiagnosticSpriteToCanvas(grayscaleCanvasRef.current, kanoProofSprite, zoomScale);
    }

    if (paletteCanvasRef.current && selectedCandidate) {
      renderPaletteAppliedSpriteToCanvas(
        paletteCanvasRef.current,
        kanoProofSprite,
        selectedCandidate,
        zoomScale,
        { paletteShift: 0 },
      );
    }
  }, [kanoProofSprite, selectedCandidate, zoomScale]);

  const handleExportCompactJson = () => {
    if (!scanResult) return;

    const exportData = createMK1CompactPaletteCatalogueExport(scanResult, {
      name: APP_NAME,
      version: APP_VERSION,
      milestone: '1E.1a',
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanDir = source.directoryName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_palette_compact_${cleanDir}_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportFullJson = () => {
    if (!scanResult) return;

    const exportData = createMK1PaletteCatalogueExport(scanResult, {
      name: APP_NAME,
      version: APP_VERSION,
      milestone: '1E.1a',
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanDir = source.directoryName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_palette_full_diagnostic_${cleanDir}_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="mk1-palette-catalogue" className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-lg text-zinc-100 font-mono">
              MK1 Executable Palette Catalogue
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 font-mono font-semibold">
              Pass 1E.1a
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-3xl">
            Bounded byte-by-byte scan of <code className="text-zinc-300">MK1.EXE</code> for candidate 15-bit palette
            structures based on ReWolf heuristics (<code className="text-zinc-300">2 &le; length &lt; 256</code>,
            words <code className="text-zinc-300">&lt; 0x8000</code>, unique colors &ge; 2/3 length).
            Features non-destructive research ranking, ASCII density analysis, overlap resolution, and duplicate grouping.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          {scanResult && (
            <div className="flex items-center gap-2">
              <button
                id="export-palette-compact-json-btn"
                onClick={handleExportCompactJson}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600/90 hover:bg-amber-600 text-xs font-mono font-semibold text-zinc-950 transition cursor-pointer shadow-md"
                title="Export lightweight Compact Research JSON (~2MB)"
              >
                <Download className="w-4 h-4 text-zinc-950" />
                Export Compact JSON
              </button>

              <button
                id="toggle-advanced-export-btn"
                onClick={() => setShowAdvancedExport(!showAdvancedExport)}
                className="px-2.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition cursor-pointer"
                title="Advanced export options"
              >
                &hellip;
              </button>
            </div>
          )}

          <button
            id="run-palette-scan-btn"
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-xs font-mono font-medium text-zinc-200 border border-zinc-700 transition cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning MK1.EXE...' : scanResult ? 'Re-scan Palettes' : 'Run Palette Scan'}
          </button>
        </div>
      </div>

      {/* Advanced Export Dropdown Bar */}
      {showAdvancedExport && scanResult && (
        <div className="mt-4 p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Full Diagnostic Export retains expanded RGB objects for all {scanResult.candidates.length.toLocaleString()} locations (~80MB file size).
            </span>
          </div>
          <button
            onClick={handleExportFullJson}
            className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold cursor-pointer shrink-0"
          >
            Export Full Diagnostic JSON (~80MB)
          </button>
        </div>
      )}

      {/* Error notification */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs font-mono flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="text-zinc-400 hover:text-zinc-200 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Scan Progress Bar */}
      {isScanning && (
        <div className="mt-6 bg-zinc-950 border border-zinc-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>{progressMsg}</span>
            <span>{Math.round(progressFraction * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-150"
              style={{ width: `${Math.round(progressFraction * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Authoritative Kano Color Usage Statistics Evidence Card */}
      {kanoAggregateStats && (
        <div className="mt-6 bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold font-mono text-zinc-200 uppercase tracking-wider">
                Authoritative Kano Color Evidence (Single Pipeline)
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800 text-sky-300 font-semibold">
              Kano Sprites Sampled: {kanoAggregateStats.sampleCount} (VERIFIED FOR KANO FIXTURE)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-3">
            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase">Kano Sample Count</div>
              <div className="text-base font-bold text-sky-400 mt-0.5">{kanoAggregateStats.sampleCount} sprites</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Authoritative array run</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase">Kano Used Indices</div>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                {kanoAggregateStats.minSourceIndex} &ndash; {kanoAggregateStats.maxSourceIndex}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Transparent excluded</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase">Distinct Used Indices</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{kanoAggregateStats.distinctCount}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">In 187-sprite union</div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase">Zero-Shift Requirement</div>
              <div className="text-xs font-bold text-emerald-400 mt-1">Palette Length &ge; {kanoAggregateStats.maxSourceIndex}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Legacy diagnostic 1-based indexing</div>
            </div>
          </div>

          {/* Compact Chip Row of Used Indices */}
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase mb-1.5">
              Union of Used Kano Source Indices ({kanoAggregateStats.unionIndices.length} entries):
            </div>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto p-1.5 bg-zinc-900/90 border border-zinc-800/80 rounded-lg font-mono text-[10px] text-zinc-300">
              {kanoAggregateStats.unionIndices.map((idx) => (
                <span
                  key={idx}
                  className={`px-1.5 py-0.5 rounded border ${
                    idx === 0
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}
                >
                  {idx}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Catalogue Architecture Summary Cards (Pass 1E.1a Tiers & Deduplication) */}
      {scanResult && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2 text-xs font-mono text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <span>CATALOGUE SUMMARY (TIERS & FORENSIC REDUCTION)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase">Raw Candidates</div>
              <div className="text-lg font-bold text-zinc-400 mt-0.5">
                {scanResult.counts.rawLengthCandidatesCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Plausible length field</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase">Structural Candidates</div>
              <div className="text-lg font-bold text-sky-400 mt-0.5">
                {scanResult.counts.structuralCandidatesCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">15-bit valid + diversity pass</div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <div className="text-[10px] text-zinc-500 uppercase">Unique Palette Contents</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                {scanResult.counts.uniqueContentsCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{scanResult.counts.duplicateCount.toLocaleString()} duplicates grouped</div>
            </div>

            <div className="bg-zinc-950 border border-amber-900/60 p-3 rounded-lg">
              <div className="text-[10px] text-amber-400 uppercase font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Research Shortlist
              </div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">
                {scanResult.counts.researchCandidatesCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">High-confidence candidates</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: View Mode Selector & Candidate Inspector */}
      {scanResult && (
        <div className="mt-8 space-y-8">
          {/* View Mode Navigation Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                id="view-mode-shortlist-btn"
                onClick={() => setViewMode('shortlist')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                  viewMode === 'shortlist'
                    ? 'bg-amber-600 text-zinc-950 shadow-md'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Research Shortlist ({scanResult.counts.researchCandidatesCount})
              </button>

              <button
                id="view-mode-unique-btn"
                onClick={() => setViewMode('unique')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                  viewMode === 'unique'
                    ? 'bg-amber-600 text-zinc-950 shadow-md'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                Unique Palettes ({scanResult.counts.uniqueContentsCount})
              </button>

              <button
                id="view-mode-all-btn"
                onClick={() => setViewMode('all')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-amber-600 text-zinc-950 shadow-md'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All Structural Candidates ({scanResult.candidates.length})
              </button>
            </div>

            <div className="text-xs font-mono text-zinc-400">
              Showing <strong className="text-zinc-200">{displayedCandidates.length}</strong> items
            </div>
          </div>

          {/* Broad Forensic Warning for All Structural Candidates */}
          {viewMode === 'all' && (
            <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs font-mono flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <strong>Broad forensic results:</strong> contains many structural false positives, sliding-window interpretations, and program string artifacts.
                Use <strong>Research Shortlist</strong> or <strong>Unique Palettes</strong> for focused relationship research.
              </div>
            </div>
          )}

          {/* Table Controls */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search offset, hash, length..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                  <span>Zero-Shift:</span>
                  <select
                    value={zeroShiftFilter}
                    onChange={(e) => setZeroShiftFilter(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">All</option>
                    <option value="compatible">Compatible (&ge; {kanoAggregateStats?.maxSourceIndex ?? 23})</option>
                    <option value="incompatible">Incompatible Only</option>
                  </select>
                </div>

                {viewMode === 'all' && (
                  <label className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hideDuplicates}
                      onChange={(e) => setHideDuplicates(e.target.checked)}
                      className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                    />
                    <span>Hide Duplicates</span>
                  </label>
                )}

                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                  <span>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value="score">Research Score</option>
                    <option value="offset">Offset</option>
                    <option value="length">Length</option>
                    <option value="unique">Unique Colors</option>
                    <option value="ascii">ASCII Density</option>
                  </select>
                  <button
                    onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
                    className="px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {sortDirection.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Table */}
            <div className="mt-4 border border-zinc-800/80 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead className="sticky top-0 bg-zinc-900 text-zinc-400 border-b border-zinc-800 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Score & Tier</th>
                      <th className="py-2.5 px-3">EXE Offset</th>
                      <th className="py-2.5 px-3">Length</th>
                      <th className="py-2.5 px-3">Unique Colours</th>
                      <th className="py-2.5 px-3">ASCII Text %</th>
                      <th className="py-2.5 px-3">Overlaps</th>
                      <th className="py-2.5 px-3">Zero-Shift Compatible</th>
                      <th className="py-2.5 px-3">Duplicate Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {displayedCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-zinc-500">
                          No palette candidates match current filters.
                        </td>
                      </tr>
                    ) : (
                      displayedCandidates.map((cand) => {
                        const isSelected = cand.id === selectedCandidateId;
                        return (
                          <tr
                            key={cand.id}
                            onClick={() => setSelectedCandidateId(cand.id)}
                            className={`hover:bg-zinc-800/50 cursor-pointer transition ${
                              isSelected ? 'bg-amber-950/40 border-l-2 border-amber-500' : ''
                            }`}
                          >
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  cand.tier === 'research'
                                    ? 'bg-amber-950/70 border border-amber-700 text-amber-300'
                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                                }`}
                              >
                                {cand.tier === 'research' && <Sparkles className="w-2.5 h-2.5 text-amber-400" />}
                                {cand.researchScore} ({cand.tier})
                              </span>
                            </td>
                            <td className="py-2 px-3 font-semibold text-zinc-200">
                              {cand.exeOffsetHex}
                              {cand.exeOffset % 2 !== 0 && (
                                <span className="text-[10px] ml-1 text-zinc-500">(unaligned)</span>
                              )}
                            </td>
                            <td className="py-2 px-3">{cand.length}</td>
                            <td className="py-2 px-3">{cand.uniqueColorCount}</td>
                            <td className="py-2 px-3">
                              <span
                                className={
                                  cand.containsLikelyAsciiData
                                    ? 'text-red-400 font-bold'
                                    : cand.textLikeScore > 40
                                    ? 'text-amber-400'
                                    : 'text-zinc-400'
                                }
                              >
                                {cand.textLikeScore}%
                              </span>
                            </td>
                            <td className="py-2 px-3 text-[11px] text-zinc-400">
                              {cand.overlapRelationships.containedWithin ? (
                                <span className="text-red-400">Contained ({cand.overlapRelationships.containedWithin.length})</span>
                              ) : cand.overlapRelationships.overlappingCount > 0 ? (
                                <span>{cand.overlapRelationships.overlappingCount} overlaps</span>
                              ) : (
                                <span className="text-emerald-400">Clean</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {cand.zeroShiftKanoCompatible ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Compatible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
                                  <XCircle className="w-3 h-3" />
                                  Incompatible ({cand.length} &lt; {kanoAggregateStats?.maxSourceIndex ?? '?'})
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[11px]">
                              {cand.duplicateContentOf ? (
                                <span className="text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                                  Duplicate
                                </span>
                              ) : (
                                <span className="text-zinc-400 font-mono text-[10px]">{cand.contentHash.substring(0, 8)}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="py-2 px-3 bg-zinc-900/60 border-t border-zinc-800 text-[11px] font-mono text-zinc-500 flex justify-between">
                <span>Showing {displayedCandidates.length} of {scanResult.candidates.length} candidates ({viewMode} mode)</span>
                {selectedCandidate && <span>Selected: {selectedCandidate.id}</span>}
              </div>
            </div>
          </div>

          {/* Selected Palette Inspector & Kano Diagnostic Preview */}
          {selectedCandidate && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
              {/* Candidate Inspector Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-sm font-mono text-zinc-100">
                      Candidate Palette Inspector: <span className="text-amber-400">{selectedCandidate.id}</span>
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                        selectedCandidate.tier === 'research'
                          ? 'bg-amber-950 border border-amber-700 text-amber-300'
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                      }`}
                    >
                      Tier: {selectedCandidate.tier} (Score: {selectedCandidate.researchScore})
                    </span>
                  </div>
                  <div className="text-xs font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-3">
                    <span>Offset: <strong className="text-zinc-200">{selectedCandidate.exeOffsetHex}</strong></span>
                    <span>Length: <strong className="text-zinc-200">{selectedCandidate.length}</strong> entries</span>
                    <span>Unique Colors: <strong className="text-zinc-200">{selectedCandidate.uniqueColorCount}</strong></span>
                    <span>Diversity: <strong className="text-zinc-200">{Math.round(selectedCandidate.uniqueColorRatio * 100)}%</strong></span>
                    <span>ASCII Score: <strong className="text-zinc-200">{selectedCandidate.textLikeScore}%</strong></span>
                    <span>Content Hash: <code className="text-zinc-300">{selectedCandidate.contentHash}</code></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCandidate.zeroShiftKanoCompatible ? (
                    <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-mono">
                      ZERO-SHIFT KANO COMPATIBLE
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
                      ZERO-SHIFT INCOMPATIBLE ({selectedCandidate.length} &lt; {kanoAggregateStats?.maxSourceIndex ?? '?'})
                    </span>
                  )}
                </div>
              </div>

              {/* Kano Side-by-Side Diagnostic Preview Comparison */}
              {kanoProofSprite && (
                <div className="mt-6 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h5 className="font-bold text-xs font-mono text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        Kano Sprite Comparison Proof (58 &times; 104 @ GRA 0x00000000)
                      </h5>
                      <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Authoritative proof frame. Decoded via uGRA decoder (Pass 1D.1), verified against real fixture.
                      </p>
                    </div>

                    {/* Zoom Selector */}
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom:</span>
                      {[1, 2, 3, 4, 6].map((s) => (
                        <button
                          key={s}
                          onClick={() => setZoomScale(s)}
                          className={`px-2 py-0.5 rounded border text-[11px] font-mono cursor-pointer transition ${
                            zoomScale === s
                              ? 'bg-amber-600 text-zinc-950 font-bold border-amber-500'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          {s}&times;
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mandated Specification Badges */}
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold">
                      KANO SPRITE: 58 &times; 104
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold">
                      SOURCE CHECKSUM: {kanoProofSprite.checksum}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-semibold">
                      PALETTE: {selectedCandidate.id}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-300 font-semibold">
                      PALETTE RELATIONSHIP: UNKNOWN / HEURISTIC
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-semibold">
                      ASSUMED SHIFT: 0
                    </span>
                  </div>

                  {/* Side-by-side Canvases */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Diagnostic Grayscale */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
                      <div className="text-[11px] font-mono text-zinc-400 mb-2 font-semibold">
                        Diagnostic Grayscale (uGRA Index Stream)
                      </div>
                      <div
                        className="inline-block p-3 rounded bg-zinc-900 border border-zinc-800/80 overflow-auto max-w-full"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        }}
                      >
                        <canvas ref={grayscaleCanvasRef} className="block shadow-md mx-auto" />
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-2">
                        Indices 0..255 mapped to luminance. Opaque black index 0 preserved.
                      </div>
                    </div>

                    {/* Candidate Palette Applied Preview */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
                      <div className="text-[11px] font-mono text-zinc-400 mb-2 font-semibold">
                        Candidate Palette Applied: <span className="text-amber-400">{selectedCandidate.id}</span>
                      </div>
                      <div
                        className="inline-block p-3 rounded bg-zinc-900 border border-zinc-800/80 overflow-auto max-w-full"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        }}
                      >
                        <canvas ref={paletteCanvasRef} className="block shadow-md mx-auto" />
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500 mt-2">
                        1-based mapping (Index 1 &rarr; entry 0). Out-of-range indices mapped to magenta.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Palette Entries / Color Swatches List */}
              <div className="mt-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h5 className="font-bold text-xs font-mono text-zinc-200 uppercase tracking-wider">
                    Recovered Palette Entries ({selectedCandidate.length} Colors + Index 0 IRQSKYE [EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED])
                  </h5>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Source: 15-bit Little-Endian &bull; Converted: 8-bit RGB (DAC MULT = 255/63)
                  </span>
                </div>

                {/* Entry 0: Unresolved Global IRQSKYE (Explicitly Highlighted as unverified external lead) */}
                <div className="mb-3 p-3 rounded-lg bg-zinc-900/90 border border-amber-900/60 flex items-center justify-between gap-4 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded border border-zinc-700 shadow-inner shrink-0"
                      style={{ backgroundColor: UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR.hex }}
                    />
                    <div>
                      <div className="font-bold text-amber-300">
                        Index 0 (VGA Index 0): UNRESOLVED GLOBAL COLOUR (EXTERNAL LEAD: IRQSKYE — NOT INDEPENDENTLY VERIFIED)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        EXTERNAL LEAD / LEGACY DIAGNOSTIC — NOT INDEPENDENTLY VERIFIED (1-based indexing and IRQSKYE=0 unverified). Diagnostic placeholder: {UNRESOLVED_IRQSKYE_PLACEHOLDER_COLOR.hex}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                    EXTERNAL LEAD
                  </span>
                </div>

                {/* Entries 1..length */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 max-h-96 overflow-y-auto p-2 bg-zinc-900/60 border border-zinc-800/80 rounded-lg">
                  {selectedCandidate.rgbColors.map((rgb, idx) => {
                    const source15 = selectedCandidate.colors15[idx];
                    const source16Hex = `0x${source15.toString(16).toUpperCase().padStart(4, '0')}`;
                    const vgaIndex = idx + 1;

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2 rounded bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono"
                      >
                        <div
                          className="w-7 h-7 rounded border border-zinc-700 shrink-0 shadow-inner"
                          style={{ backgroundColor: rgb.hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-zinc-200 font-semibold">
                            <span>Idx {vgaIndex}</span>
                            <span className="text-zinc-400">{rgb.hex}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">
                            Word: {source16Hex} ({source15}) &bull; RGB({rgb.r},{rgb.g},{rgb.b})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

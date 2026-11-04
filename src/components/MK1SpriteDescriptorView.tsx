import React, { useState, useEffect } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { InventoryEntry } from '../core/models/InventoryEntry';
import {
  scanExeForSpriteDescriptors,
  createMK1SpriteDescriptorExport,
  resolveAllMK1GraTargets,
  getDecodedPrimaryPreviewSequence,
  MK1SpriteDescriptorScanResult,
  MK1SpriteDescriptorCandidate,
  MK1SpriteDescriptorKind,
  MK1ResolvedGraTarget,
} from '../games/mk1/research/spriteDescriptorProbe';
import { MK1HandleTableResult } from '../games/mk1/research/handleTableProbe';
import { MK1SpritePreviewModal } from './MK1SpritePreviewModal';
import {
  Sparkles,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileCode,
  ArrowRight,
  Info,
  Grid,
  Box,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ShieldCheck,
  Play,
  Maximize2,
} from 'lucide-react';

interface MK1SpriteDescriptorViewProps {
  source: DirectorySource;
  inventory: InventoryEntry[];
}

export const MK1SpriteDescriptorView: React.FC<MK1SpriteDescriptorViewProps> = ({
  source,
  inventory,
}) => {
  const [cachedHandleTable, setCachedHandleTable] = useState<MK1HandleTableResult | null>(null);
  const [resolvedTargets, setResolvedTargets] = useState<MK1ResolvedGraTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<MK1ResolvedGraTarget | null>(null);
  const [isLoadingTargets, setIsLoadingTargets] = useState<boolean>(false);
  const [targetSearchQuery, setTargetSearchQuery] = useState<string>('');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressFraction, setProgressFraction] = useState<number>(0);
  const [scanResult, setScanResult] = useState<MK1SpriteDescriptorScanResult | null>(null);
  const [targetGraBytes, setTargetGraBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'candidates' | 'decoded' | 'array-runs' | 'groups' | 'clusters'>('candidates');
  const [filterKind, setFilterKind] = useState<'all' | 'primary' | 'alternate' | 'with-xy' | 'no-xy' | 'decoded' | 'inferred'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Interactive sprite preview modal state
  const [previewCandidateIndex, setPreviewCandidateIndex] = useState<number | null>(null);
  const [previewList, setPreviewList] = useState<MK1SpriteDescriptorCandidate[]>([]);

  // Load and cache handle table & resolved targets once on mount or source change
  useEffect(() => {
    let isCancelled = false;

    async function loadHandleTableTargets() {
      if (!source) return;
      setIsLoadingTargets(true);
      setErrorMsg(null);

      try {
        const { targets, handleTable } = await resolveAllMK1GraTargets(source, cachedHandleTable ?? undefined);
        if (!isCancelled) {
          setCachedHandleTable(handleTable);
          setResolvedTargets(targets);

          // Select default target if none is selected
          setSelectedTarget((prev) => {
            if (prev) {
              const matched = targets.find((t) => t.fileId === prev.fileId);
              if (matched) return matched;
            }
            // Prefer KANO (ID 35) or JCATT (ID 4) if present
            const kano = targets.find((t) => (t.fileId === 35 || t.path.toUpperCase().includes('KANO.GRA')) && t.presentOnDisk);
            const jcatt = targets.find((t) => t.fileId === 4 && t.presentOnDisk);
            const firstPresent = kano ?? jcatt ?? targets.find((t) => t.presentOnDisk) ?? targets[0] ?? null;
            return firstPresent;
          });
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTargets(false);
        }
      }
    }

    loadHandleTableTargets();

    return () => {
      isCancelled = true;
    };
  }, [source]);

  // Handle selecting a target from the authoritative handle table list
  const handleSelectTarget = (target: MK1ResolvedGraTarget) => {
    setSelectedTarget(target);
    // Reset stale results so previous target's candidates are never displayed under a new target
    setScanResult(null);
    setTargetGraBytes(null);
    setErrorMsg(null);
    setPreviewCandidateIndex(null);
  };

  const handleRunScan = async () => {
    if (!source || !selectedTarget) return;

    setErrorMsg(null);
    setIsScanning(true);
    setProgressMsg(`Initializing sprite descriptor scan for ${selectedTarget.path}...`);
    setProgressFraction(0.05);

    try {
      // Pre-read GRA bytes for decoding and interactive previews
      let graBytes: Uint8Array | null = null;
      try {
        graBytes = await source.readSlice(selectedTarget.path, 0, selectedTarget.fileSize);
        setTargetGraBytes(graBytes);
      } catch {
        setTargetGraBytes(null);
      }

      const result = await scanExeForSpriteDescriptors(source, {
        target: selectedTarget,
        cachedHandleTable: cachedHandleTable ?? undefined,
        onProgress: (msg, fraction) => {
          setProgressMsg(msg);
          if (fraction !== undefined) {
            setProgressFraction(fraction);
          }
        },
      });
      setScanResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Scan failed: ${msg}`);
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenPreview = (candidate: MK1SpriteDescriptorCandidate, customList?: MK1SpriteDescriptorCandidate[]) => {
    if (!scanResult) return;
    const defaultSequence = getDecodedPrimaryPreviewSequence(scanResult.candidates);
    const list = customList ?? defaultSequence;
    const idx = list.findIndex((c) => c.exeOffset === candidate.exeOffset && c.kind === candidate.kind);
    setPreviewList(list);
    setPreviewCandidateIndex(idx >= 0 ? idx : 0);
  };

  const handleOpenAnchorPreview = () => {
    if (!scanResult) return;
    const anchor = scanResult.candidates.find(
      (c) => (c.exeOffset === 0x000a7464 || c.exeOffsetHex.toUpperCase() === '0X000A7464') && c.kind === 'with-xy',
    );
    if (anchor) {
      handleOpenPreview(anchor);
    }
  };

  const handleExportJson = () => {
    if (!scanResult) return;

    const exportData = createMK1SpriteDescriptorExport(scanResult);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_sprite_descriptors_${scanResult.targetGra.path.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!scanResult) return;
    const stats = scanResult.scanStats;
    const text = `MK1 Sprite Descriptor Probe Results (Pass 1D):
Target: ${scanResult.targetGra.path} (File ID: ${scanResult.targetGra.fileId}, Size: ${scanResult.targetGra.size} bytes)
Total Candidates: ${stats.totalCandidates}
Primary Candidates: ${stats.primaryCandidatesCount ?? (stats.totalCandidates - (stats.alternateInterpretationsCount ?? 0))}
Alternate Interpretations: ${stats.alternateInterpretationsCount ?? 0}
Form A (With X/Y, 12B): ${stats.withXyCount}
Form B (No X/Y, 8B): ${stats.noXyCount}
Decoded Sprites: ${stats.decodeSuccessesCount}
Decode Failures: ${stats.decodeFailuresCount}
Unique Successful GRA Offsets: ${stats.uniqueSuccessfulGraOffsetsCount}
Array Runs (12-byte WITH_XY): ${scanResult.arrayRuns.length}
Unique GRA Offsets: ${stats.uniqueGraOffsetsCount}
First Sprite Proof (0x000A7464): ${scanResult.firstSpriteProof?.found ? `Found & ${scanResult.firstSpriteProof.descriptor?.decoded ? 'Decoded' : 'Failed'}` : 'Not Found'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter candidates
  const filteredCandidates = scanResult?.candidates.filter((c) => {
    if (activeTab === 'decoded' && !c.decode?.success) return false;
    if (filterKind === 'primary' && c.primaryCandidate === false) return false;
    if (filterKind === 'alternate' && c.primaryCandidate !== false && c.alternateInterpretationOf === undefined) return false;
    if (filterKind === 'with-xy' && c.kind !== 'with-xy') return false;
    if (filterKind === 'no-xy' && c.kind !== 'no-xy') return false;
    if (filterKind === 'decoded' && !c.decode?.success) return false;
    if (filterKind === 'inferred' && c.confidence !== 'inferred') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const exeHex = c.exeOffsetHex.toLowerCase();
      const graHex = c.graOffsetHex.toLowerCase();
      const graDec = c.graOffset.toString();
      const exeDec = c.exeOffset.toString();
      const checksum = c.decode?.checksum?.toLowerCase() ?? '';
      return (
        exeHex.includes(q) ||
        graHex.includes(q) ||
        graDec.includes(q) ||
        exeDec.includes(q) ||
        `${c.width}x${c.height}`.includes(q) ||
        checksum.includes(q)
      );
    }
    return true;
  }) ?? [];

  // Filter targets for dropdown selection
  const filteredTargets = resolvedTargets.filter((t) => {
    if (!targetSearchQuery.trim()) return true;
    const q = targetSearchQuery.toLowerCase().trim();
    const idStr = t.fileId.toString();
    const idPad = t.fileId.toString().padStart(2, '0');
    return (
      t.path.toLowerCase().includes(q) ||
      idStr.includes(q) ||
      idPad.includes(q) ||
      (t.rawFilenameString && t.rawFilenameString.toLowerCase().includes(q))
    );
  });

  const isTargetValidForScan = selectedTarget && selectedTarget.presentOnDisk;

  return (
    <div
      id="mk1-sprite-descriptor-view"
      className="mb-8 rounded-xl bg-zinc-900 border border-purple-900/40 p-6 shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-zinc-100 font-mono tracking-tight">
                MK1 Research: Sprite Descriptor Reconstruction &amp; uGRA Decoder
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                Pass 1D Proof
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              WrtNonZero stream decoding, array run detection, and indexed sprite reconstruction bound to handle table.
            </p>
          </div>
        </div>

        {scanResult && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              id="copy-sprite-summary-btn"
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Summary'}
            </button>
            <button
              id="export-sprite-descriptors-btn"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-mono transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>
        )}
      </div>

      {/* Target Resource Picker & Action */}
      <div className="mt-5 p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Select Authoritative Handle-Table Resource
            </label>
            <div className="flex items-center gap-2">
              <select
                id="select-gra-resource-target"
                value={selectedTarget ? selectedTarget.fileId : ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  const found = resolvedTargets.find((t) => t.fileId === id);
                  if (found) handleSelectTarget(found);
                }}
                disabled={isLoadingTargets || resolvedTargets.length === 0}
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-purple-500 disabled:opacity-50 cursor-pointer"
              >
                {resolvedTargets.length === 0 ? (
                  <option value="">{isLoadingTargets ? 'Reconstructing handle table...' : 'No GRA entries found'}</option>
                ) : (
                  resolvedTargets.map((t) => (
                    <option key={t.fileId} value={t.fileId}>
                      ID {t.fileId.toString().padStart(2, '0')} — {t.path} ({t.fileSize.toLocaleString()} bytes)
                      {!t.presentOnDisk ? ' [Missing from disk]' : ''}
                    </option>
                  ))
                )}
              </select>

              <button
                id="run-sprite-descriptor-probe-btn"
                onClick={handleRunScan}
                disabled={isScanning || !isTargetValidForScan}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-purple-950/40 disabled:text-zinc-500 disabled:border-zinc-800 text-white font-mono text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 border border-purple-500/50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Descriptors'}
              </button>
            </div>
          </div>
        </div>

        {/* Read-Only Resolved Resource Metadata */}
        {selectedTarget && (
          <div className="pt-3 border-t border-zinc-800/80">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800/80">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Selected Resource</div>
                <div className="text-xs font-bold font-mono text-zinc-100 mt-1 truncate" title={selectedTarget.path}>
                  {selectedTarget.path}
                </div>
              </div>

              <div className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800/80">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">File ID</div>
                <div className="text-xs font-bold font-mono text-purple-300 mt-1">
                  {selectedTarget.fileId}{' '}
                  <span className="text-[10px] text-zinc-500 font-normal">
                    (0x{selectedTarget.fileId.toString(16).toUpperCase().padStart(2, '0')})
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800/80">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">File Size</div>
                <div className="text-xs font-bold font-mono text-zinc-200 mt-1">
                  {selectedTarget.fileSize.toLocaleString()} bytes
                </div>
              </div>

              <div className="p-2.5 rounded bg-zinc-900/80 border border-zinc-800/80">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Handle Entry</div>
                <div className="text-xs font-bold font-mono text-amber-300 mt-1">
                  {selectedTarget.entryOffsetHex ?? `0x${selectedTarget.handleEntryOffset.toString(16).toUpperCase()}`}
                </div>
              </div>
            </div>

            {/* Target Status Banner */}
            <div className="mt-3 flex items-center justify-between px-3 py-2 rounded bg-zinc-900/50 border border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                {selectedTarget.presentOnDisk ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className={selectedTarget.presentOnDisk ? 'text-zinc-300' : 'text-rose-300'}>
                  Target resolved:{' '}
                  <span className="text-zinc-100 font-semibold">{selectedTarget.path}</span> &bull; File ID{' '}
                  <span className="text-purple-300 font-semibold">{selectedTarget.fileId}</span> &bull;{' '}
                  <span className="text-zinc-200">{selectedTarget.fileSize.toLocaleString()} bytes</span> &bull;{' '}
                  <span className={selectedTarget.presentOnDisk ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedTarget.status}
                  </span>
                </span>
              </div>

              {!scanResult && !isScanning && (
                <span className="text-[11px] text-zinc-500 font-semibold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  Not scanned
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-4 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Progress Bar */}
      {isScanning && (
        <div className="mt-4 p-4 rounded-lg bg-zinc-950/80 border border-zinc-800">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-300 mb-2">
            <span>{progressMsg}</span>
            <span>{Math.round(progressFraction * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full transition-all duration-150"
              style={{ width: `${Math.round(progressFraction * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Results View */}
      {scanResult && !isScanning && (
        <div className="mt-6 space-y-6">
          {/* Milestone 1D Section 9: First-Sprite Proof Anchor Card */}
          {scanResult.firstSpriteProof?.found && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Validation Anchor: First Sprite Proof (EXE 0x000A7464)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Validated
                  </span>
                </div>
                <div className="text-xs text-zinc-300 space-x-2">
                  <span>
                    Dimensions: <strong className="text-emerald-400 font-mono">58 &times; 104</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Origin: <strong className="text-zinc-200 font-mono">(23, -7)</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    GRA Offset: <strong className="text-amber-300 font-mono">0x00000000</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Decode:{' '}
                    <strong className="text-purple-300 font-mono">
                      {scanResult.firstSpriteProof.descriptor?.decoded ? 'Exact Match' : 'Failed'}
                    </strong>
                  </span>
                  {scanResult.firstSpriteProof.descriptor?.checksum && (
                    <>
                      <span>&bull;</span>
                      <span>
                        Checksum:{' '}
                        <code className="text-zinc-300 font-mono">
                          {scanResult.firstSpriteProof.descriptor.checksum}
                        </code>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={handleOpenAnchorPreview}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <Eye className="w-4 h-4" />
                <span>View 58&times;104 Anchor Preview</span>
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Total Found</div>
              <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
                {scanResult.scanStats.totalCandidates}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Primary</div>
              <div className="text-lg font-bold font-mono text-zinc-100 mt-0.5">
                {scanResult.scanStats.primaryCandidatesCount ??
                  scanResult.scanStats.totalCandidates - (scanResult.scanStats.alternateInterpretationsCount ?? 0)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Alternates</div>
              <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                {scanResult.scanStats.alternateInterpretationsCount ?? 0}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Form A (12B)</div>
              <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
                {scanResult.scanStats.withXyCount}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Form B (8B)</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {scanResult.scanStats.noXyCount}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Decoded Sprites</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5 flex items-baseline gap-1">
                {scanResult.scanStats.decodeSuccessesCount}
                <span className="text-[10px] text-zinc-500 font-normal">ok</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Array Runs</div>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                {scanResult.arrayRuns.length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Unique Offsets</div>
              <div className="text-lg font-bold font-mono text-zinc-300 mt-0.5">
                {scanResult.scanStats.uniqueGraOffsetsCount}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'candidates'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                All Candidates ({scanResult.candidates.length})
              </button>

              <button
                onClick={() => setActiveTab('decoded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'decoded'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Decoded Sprites ({scanResult.scanStats.decodeSuccessesCount})
              </button>

              <button
                onClick={() => setActiveTab('array-runs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'array-runs'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Array Runs ({scanResult.arrayRuns.length})
              </button>

              <button
                onClick={() => setActiveTab('groups')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'groups'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                GRA Offset Groups ({scanResult.graOffsetGroups.length})
              </button>

              <button
                onClick={() => setActiveTab('clusters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  activeTab === 'clusters'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                Clusters ({scanResult.clusters.length})
              </button>
            </div>

            {(activeTab === 'candidates' || activeTab === 'decoded') && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search offset / size..."
                    className="pl-8 pr-3 py-1 rounded bg-zinc-950 border border-zinc-700 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500 w-44"
                  />
                </div>

                <select
                  value={filterKind}
                  onChange={(e) => setFilterKind(e.target.value as any)}
                  className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-700 text-xs font-mono text-zinc-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Items</option>
                  <option value="primary">Primary Candidates Only</option>
                  <option value="alternate">Alternate Interpretations</option>
                  <option value="with-xy">Form A (With X/Y)</option>
                  <option value="no-xy">Form B (No X/Y)</option>
                  <option value="decoded">Decoded Only</option>
                  <option value="inferred">Inferred Arrays</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1 & 2: Candidates & Decoded Sprites Table */}
          {(activeTab === 'candidates' || activeTab === 'decoded') && (
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">EXE Offset</th>
                    <th className="py-2.5 px-3">Form / Overlap</th>
                    <th className="py-2.5 px-3">Dimensions (WxH)</th>
                    <th className="py-2.5 px-3">Origin (X, Y)</th>
                    <th className="py-2.5 px-3">GRA Offset</th>
                    <th className="py-2.5 px-3">Array Run</th>
                    <th className="py-2.5 px-3">Decode Status</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-zinc-500">
                        No candidates matched the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c, idx) => (
                      <tr key={`${c.exeOffsetHex}-${c.kind}-${idx}`} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2 px-3 text-purple-300 font-semibold">
                          {c.exeOffsetHex}
                          <span className="text-[10px] text-zinc-500 ml-1.5 font-normal">({c.exeOffset})</span>
                        </td>

                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1">
                            {c.kind === 'with-xy' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                                Form A (12B)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Form B (8B)
                              </span>
                            )}
                            {c.alternateInterpretationOf && (
                              <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-amber-950 text-amber-300 border border-amber-800" title={`Alternate of ${c.alternateInterpretationOf}`}>
                                Alt
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-3 text-zinc-200">
                          {c.width} &times; {c.height}
                        </td>

                        <td className="py-2 px-3 text-zinc-400">
                          {c.kind === 'with-xy' ? `${c.x}, ${c.y}` : '—'}
                        </td>

                        <td className="py-2 px-3 text-amber-300">
                          {c.graOffsetHex}
                          <span className="text-[10px] text-zinc-500 ml-1.5 font-normal">({c.graOffset})</span>
                        </td>

                        <td className="py-2 px-3">
                          {c.inArrayRun ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                              Stride {c.arrayRunStride}B
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          {c.decode?.success ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              {c.decode.encodedBytesConsumed}B &bull; {c.decode.commandCount}c
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-400 border border-rose-800" title={c.decode?.failureReason}>
                              <XCircle className="w-3 h-3" />
                              Fail
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          {c.confidence === 'inferred' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                              Inferred
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                              Candidate
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 text-right">
                          {c.decode?.success && (
                            <button
                              onClick={() => handleOpenPreview(c)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                              title="Open interactive grayscale diagnostic preview"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Array Runs */}
          {activeTab === 'array-runs' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Detected contiguous descriptor array tables analyzed by descriptor kind (Pass 1D). Each run tracks regular stride, interruptions/gaps, and decoding completeness.
                </span>
              </div>

              {scanResult.arrayRuns.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-lg">
                  No contiguous array runs identified for this target.
                </div>
              ) : (
                <div className="space-y-4">
                  {scanResult.arrayRuns.map((run) => (
                    <div
                      key={run.runId}
                      className="p-4 rounded-xl bg-zinc-950/80 border border-purple-900/40 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-purple-950 text-purple-300 border border-purple-800">
                            Array Run #{run.runId}
                          </span>
                          <span className="text-xs font-bold text-zinc-200">
                            {run.kind === 'with-xy' ? 'Form A (12B With X/Y)' : 'Form B (8B No X/Y)'}
                          </span>
                          <span className="text-xs text-zinc-400">
                            &bull; Stride: <strong className="text-zinc-200">{run.stride} bytes</strong>
                          </span>
                        </div>

                        <div className="text-xs text-zinc-400">
                          <strong className="text-purple-300">{run.descriptorCount}</strong> Descriptors &bull;{' '}
                          Range: <span className="text-zinc-200">{run.startExeOffsetHex} &rarr; {run.endExeOffsetHex}</span>
                        </div>
                      </div>

                      {/* Interruptions */}
                      <div className="space-y-1 text-xs">
                        <div className="text-zinc-400 font-semibold">
                          Interruptions / Stride Deviations ({run.interruptions.length}):
                        </div>
                        {run.interruptions.length === 0 ? (
                          <div className="text-[11px] text-emerald-400">
                            None &bull; Perfectly continuous stride across entire run.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {run.interruptions.map((inter, idx) => (
                              <div
                                key={idx}
                                className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                              >
                                At <strong className="text-purple-300">{inter.offsetHex}</strong>: Gap of{' '}
                                <strong className="text-amber-400">{inter.gapBytes} bytes</strong> (expected {run.stride}B)
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Descriptors preview chips */}
                      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
                        {run.candidateExeOffsets.slice(0, 16).map((off) => {
                          const match = scanResult.candidates.find(
                            (c) => c.exeOffset === off && c.kind === run.kind,
                          );
                          if (!match) return null;
                          return (
                            <button
                              key={match.exeOffsetHex}
                              onClick={() => {
                                if (match.decode?.success) {
                                  handleOpenPreview(match);
                                }
                              }}
                              className="px-2 py-1 rounded bg-zinc-900 hover:bg-purple-900/50 border border-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="text-purple-300 font-semibold">{match.exeOffsetHex}</span>
                              <span className="text-zinc-500">
                                {match.width}&times;{match.height}
                              </span>
                              {match.decode?.success && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            </button>
                          );
                        })}
                        {run.candidateExeOffsets.length > 16 && (
                          <span className="text-[11px] text-zinc-500 self-center">
                            +{run.candidateExeOffsets.length - 16} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GRA Offset Groups */}
          {activeTab === 'groups' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Grouped by target GRA byte offset. Offsets referenced by multiple descriptors highlight potential animation frames, hitboxes, or re-used graphics.
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">GRA Offset</th>
                      <th className="py-2.5 px-3">Refs</th>
                      <th className="py-2.5 px-3">GRA Preview Bytes</th>
                      <th className="py-2.5 px-3">Variations Detected</th>
                      <th className="py-2.5 px-3">Referencing EXE Descriptors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
                    {scanResult.graOffsetGroups.map((g) => (
                      <tr key={g.graOffsetHex} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-amber-300 font-semibold">
                          {g.graOffsetHex}
                          <span className="text-[10px] text-zinc-500 ml-1.5 font-normal">({g.graOffset})</span>
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              g.referenceCount > 1
                                ? 'bg-purple-950 text-purple-300 border border-purple-700'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {g.referenceCount} &times;
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-emerald-400 font-mono text-[11px]">
                          {g.firstBytesHex || '—'}
                        </td>

                        <td className="py-2.5 px-3 text-[11px]">
                          <div className="flex flex-wrap gap-1.5">
                            {g.hasVaryingPositions && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                Varying X/Y
                              </span>
                            )}
                            {g.hasVaryingDimensions && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                Varying Size
                              </span>
                            )}
                            {g.hasMultipleKinds && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                Dual Forms
                              </span>
                            )}
                            {!g.hasVaryingPositions && !g.hasVaryingDimensions && !g.hasMultipleKinds && (
                              <span className="text-zinc-500">Uniform</span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-[11px] text-zinc-300">
                          <div className="flex flex-wrap gap-2 max-w-xl">
                            {g.descriptors.map((d, di) => (
                              <span
                                key={di}
                                className="inline-flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-800"
                              >
                                <span className="text-purple-300 font-semibold">{d.exeOffsetHex}</span>
                                <span className="text-zinc-500">({d.width}&times;{d.height})</span>
                                {d.x !== undefined && <span className="text-zinc-400">[{d.x},{d.y}]</span>}
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

          {/* TAB 5: Array Clusters */}
          {activeTab === 'clusters' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Discovered candidate clusters where descriptors appear sequentially with regular stride (e.g. 12-byte contiguous array in MK1.EXE data segments).
                </span>
              </div>

              {scanResult.clusters.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-lg">
                  No multi-item candidate clusters detected for this target.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scanResult.clusters.map((cl) => (
                    <div
                      key={cl.clusterId}
                      className="p-4 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Cluster #{cl.clusterId}
                          </span>
                          <span className="text-xs font-mono text-zinc-300">
                            {cl.candidateCount} Descriptors
                          </span>
                        </div>
                        {cl.isContiguousArray && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Contiguous Array
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-mono space-y-1 text-zinc-300">
                        <div>
                          <span className="text-zinc-500">Range:</span> {cl.startExeOffsetHex} &rarr; {cl.endExeOffsetHex}
                        </div>
                        <div>
                          <span className="text-zinc-500">Dominant Form:</span>{' '}
                          {cl.dominantKind === 'with-xy' ? 'Form A (12B With X/Y)' : 'Form B (8B No X/Y)'}
                        </div>
                        <div>
                          <span className="text-zinc-500">Pattern:</span> {cl.strideDescription}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap gap-1.5">
                        {cl.candidateExeOffsets.slice(0, 8).map((off) => (
                          <span
                            key={off}
                            className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-purple-300"
                          >
                            0x{off.toString(16).toUpperCase().padStart(8, '0')}
                          </span>
                        ))}
                        {cl.candidateExeOffsets.length > 8 && (
                          <span className="text-[10px] font-mono text-zinc-500 self-center">
                            +{cl.candidateExeOffsets.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Sprite Preview Modal */}
      {previewCandidateIndex !== null && previewList.length > 0 && selectedTarget && (
        <MK1SpritePreviewModal
          candidates={previewList}
          currentIndex={previewCandidateIndex}
          resolvedTarget={selectedTarget}
          previewPayloads={scanResult?.previewPayloads}
          source={source}
          onClose={() => setPreviewCandidateIndex(null)}
          onNavigate={(newIdx) => setPreviewCandidateIndex(newIdx)}
        />
      )}
    </div>
  );
};

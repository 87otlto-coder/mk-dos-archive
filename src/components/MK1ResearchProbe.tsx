import React, { useState, useMemo } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { InventoryEntry } from '../core/models/InventoryEntry';
import {
  probeMK1ExecutableForGRA,
  createMK1ProbeExport,
  MK1ProbeResult,
} from '../games/mk1/research/fileEntryProbe';
import {
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Database,
  ArrowRightLeft,
  Binary,
  Layers,
} from 'lucide-react';
import { formatBytes } from './DetectionSummary';

interface MK1ResearchProbeProps {
  source: DirectorySource;
  inventory: InventoryEntry[];
}

export const MK1ResearchProbe: React.FC<MK1ResearchProbeProps> = ({
  source,
  inventory,
}) => {
  // Filter all GRA files in inventory
  const graFiles = useMemo(() => {
    return inventory.filter(
      (e) =>
        e.extension.toUpperCase() === 'GRA' ||
        e.classification === 'graphics_candidate',
    );
  }, [inventory]);

  // Find primary executable
  const primaryExe = useMemo(() => {
    return inventory.find((e) => {
      const u = e.name.toUpperCase();
      return u === 'MK1.EXE' || u === 'MK.EXE';
    });
  }, [inventory]);

  // Default to GRAPHICS/JCATT.GRA or JCATT.GRA if found, otherwise first GRA
  const defaultGraPath = useMemo(() => {
    const jcatt = graFiles.find((f) => f.name.toUpperCase() === 'JCATT.GRA');
    return jcatt ? jcatt.path : graFiles[0]?.path || '';
  }, [graFiles]);

  const [selectedGraPath, setSelectedGraPath] = useState<string>(defaultGraPath);
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeProgress, setProbeProgress] = useState<{
    scanned: number;
    total: number;
  } | null>(null);
  const [probeResult, setProbeResult] = useState<MK1ProbeResult | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);

  const selectedGraEntry = useMemo(() => {
    return graFiles.find((f) => f.path === selectedGraPath);
  }, [graFiles, selectedGraPath]);

  const handleRunProbe = async () => {
    if (!selectedGraPath || !source) return;

    setProbeError(null);
    setIsProbing(true);
    setProbeProgress({ scanned: 0, total: primaryExe?.size || 0 });

    try {
      const result = await probeMK1ExecutableForGRA(source, selectedGraPath, {
        exePath: primaryExe?.path,
        onProgress: (scanned, total) => {
          setProbeProgress({ scanned, total });
        },
      });
      setProbeResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setProbeError(`Forensic probe failed: ${msg}`);
      setProbeResult(null);
    } finally {
      setIsProbing(false);
      setProbeProgress(null);
    }
  };

  const handleExportProbeJson = () => {
    if (!probeResult) return;

    const exportData = createMK1ProbeExport(probeResult);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const cleanGraName = (
      probeResult.gra.path.split('/').pop() || 'RESOURCE'
    ).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_probe_${cleanGraName}_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toHex32 = (v: number) =>
    `0x${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;

  return (
    <div
      id="mk1-research-probe"
      className="mb-8 rounded-xl bg-zinc-900 border border-amber-900/40 p-6 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-zinc-100 font-mono tracking-tight">
                MK1 Research: GRA → Executable Forensic Correlation
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-amber-950 text-amber-400 border border-amber-800">
                Milestone 1A
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Scans MK1.EXE for published 24-byte FileEntry structures matching
              target resource filesize.
            </p>
          </div>
        </div>

        {probeResult && (
          <button
            id="export-probe-json-btn"
            type="button"
            onClick={handleExportProbeJson}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            Export MK1 Probe JSON
          </button>
        )}
      </div>

      {/* Target Resource & Executable Selector Controls */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-zinc-950/60 p-4 rounded-lg border border-zinc-800/80">
        <div>
          <label
            htmlFor="gra-select"
            className="block text-xs font-semibold text-zinc-300 mb-1.5"
          >
            Target GRA Resource
          </label>
          <select
            id="gra-select"
            value={selectedGraPath}
            onChange={(e) => setSelectedGraPath(e.target.value)}
            disabled={isProbing}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500 transition-colors"
          >
            {graFiles.map((f) => (
              <option key={f.path} value={f.path}>
                {f.path} ({formatBytes(f.size)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs font-semibold text-zinc-300 mb-1.5">
            Resource Size Anchor
          </div>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300 flex items-center justify-between">
            <span>
              {selectedGraEntry ? `${selectedGraEntry.size.toLocaleString()} bytes` : '—'}
            </span>
            <span className="text-amber-400 font-bold">
              {selectedGraEntry ? toHex32(selectedGraEntry.size) : '—'}
            </span>
          </div>
        </div>

        <div>
          <button
            id="analyze-exe-relationship-btn"
            type="button"
            onClick={handleRunProbe}
            disabled={isProbing || !selectedGraPath}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 transition-colors cursor-pointer"
          >
            {isProbing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                Scanning MK1.EXE...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Analyze EXE Relationship
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar during Scanning */}
      {isProbing && probeProgress && (
        <div className="mt-4 bg-zinc-950/80 p-3 rounded-lg border border-zinc-800">
          <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span>Scanning binary for uint32LE match...</span>
            <span>
              {probeProgress.total > 0
                ? `${Math.round((probeProgress.scanned / probeProgress.total) * 100)}%`
                : ''}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-100"
              style={{
                width: `${
                  probeProgress.total > 0
                    ? Math.round((probeProgress.scanned / probeProgress.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Error Notice */}
      {probeError && (
        <div className="mt-4 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{probeError}</span>
        </div>
      )}

      {/* Probe Results View */}
      {probeResult && !isProbing && (
        <div className="mt-6 space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Target Resource</div>
              <div className="text-sm font-bold font-mono text-zinc-200 mt-1 truncate">
                {probeResult.gra.path.split('/').pop()}
              </div>
              <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                {probeResult.gra.sizeHex} ({formatBytes(probeResult.gra.size)})
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Raw Size Matches</div>
              <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
                {probeResult.sizeMatchesCount}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                uint32LE occurrences in {probeResult.executable.path}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Valid FileEntries</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {probeResult.validCandidatesCount}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Passed FileEntry layout checks
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Provisional Table Index</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {probeResult.summary.provisionalTableIndex !== undefined
                  ? `#${probeResult.summary.provisionalTableIndex}`
                  : 'N/A'}
              </div>
              <div className="text-[10px] font-semibold text-amber-500/80 mt-0.5 uppercase tracking-wide">
                HYPOTHESIS
              </div>
            </div>
          </div>

          {/* Research conclusion narrative */}
          <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed">
            <div className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Forensic Correlation Analysis
            </div>
            {probeResult.summary.researchConclusion}
          </div>

          {/* Candidates Breakdown Table */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5 font-mono">
              FileEntry Structure Candidates ({probeResult.candidates.length})
            </h4>

            {probeResult.candidates.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950 rounded-lg border border-zinc-800">
                No uint32LE occurrences found in executable image matching filesize {probeResult.gra.sizeHex}.
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-lg overflow-x-auto bg-zinc-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                    <tr>
                      <th className="py-2.5 px-3">Entry Offset</th>
                      <th className="py-2.5 px-3">Raw Filename Offset</th>
                      <th className="py-2.5 px-3">File Size</th>
                      <th className="py-2.5 px-3">Flags</th>
                      <th className="py-2.5 px-3">Field Validation</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3">Neighbor Sequence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {probeResult.candidates.map((cand) => (
                      <tr
                        key={cand.entryOffsetHex}
                        className={
                          cand.confidence !== 'unknown'
                            ? 'bg-amber-950/20 hover:bg-amber-950/30'
                            : 'hover:bg-zinc-900/50'
                        }
                      >
                        <td className="py-2.5 px-3 text-amber-400 font-bold">
                          {cand.entryOffsetHex}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span>{cand.raw.rawFilenameOffsetHex}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                              {cand.filenameResolution}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {cand.raw.fileSizeHex}{' '}
                          <span className="text-zinc-500">
                            ({cand.raw.fileSize.toLocaleString()})
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={
                              cand.validation.flagsMatch
                                ? 'text-emerald-400 font-semibold'
                                : 'text-zinc-400'
                            }
                          >
                            {cand.raw.flagsHex}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                cand.validation.allRulesPassed
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}
                            >
                              {cand.validation.passedRulesCount} /{' '}
                              {cand.validation.totalRulesCount} Rules
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                              cand.confidence === 'hypothesis'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : cand.confidence === 'inferred'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {cand.confidence}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {cand.neighborSequence ? (
                            <div className="text-[11px] text-zinc-300">
                              <span className="text-emerald-400 font-semibold">
                                {cand.neighborSequence.consecutiveCount} contiguous
                              </span>{' '}
                              (idx #{cand.neighborSequence.provisionalIndex})
                            </div>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Neighbor Array Table Inspector */}
          {probeResult.candidates.find((c) => c.neighborSequence) && (
            <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-semibold text-zinc-200 font-mono">
                    Handle Table Neighbor Sequence Probe (±16 records)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  Record size: 24 bytes (0x18)
                </span>
              </div>

              {(() => {
                const primary = probeResult.candidates.find(
                  (c) => c.neighborSequence,
                );
                if (!primary || !primary.neighborSequence) return null;

                const seq = primary.neighborSequence;
                return (
                  <div className="space-y-3">
                    <div className="text-xs text-zinc-400 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                      <div>
                        Array Start:{' '}
                        <span className="text-zinc-200 font-bold">
                          {seq.sequenceStartOffsetHex}
                        </span>
                      </div>
                      <div>
                        Array End:{' '}
                        <span className="text-zinc-200 font-bold">
                          {seq.sequenceEndOffsetHex}
                        </span>
                      </div>
                      <div>
                        Total Span:{' '}
                        <span className="text-emerald-400 font-bold">
                          {seq.consecutiveCount} entries
                        </span>
                      </div>
                      <div>
                        Target Index:{' '}
                        <span className="text-amber-400 font-bold">
                          #{seq.provisionalIndex} (HYPOTHESIS)
                        </span>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-zinc-800/80 rounded bg-zinc-900/30">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Delta</th>
                            <th className="py-2 px-3">File Offset</th>
                            <th className="py-2 px-3">Raw Filename Offset</th>
                            <th className="py-2 px-3">File Size</th>
                            <th className="py-2 px-3">Flags</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {seq.neighbors.map((nb) => {
                            const isAnchor = nb.offset === primary.entryOffset;
                            return (
                              <tr
                                key={nb.offsetHex}
                                className={
                                  isAnchor
                                    ? 'bg-amber-950/40 text-amber-300 font-semibold'
                                    : nb.isValidCandidate
                                    ? 'hover:bg-zinc-900/50 text-zinc-300'
                                    : 'bg-red-950/20 text-zinc-500 italic'
                                }
                              >
                                <td className="py-1.5 px-3">
                                  {nb.indexDelta === 0
                                    ? '★ 0 (ANCHOR)'
                                    : nb.indexDelta > 0
                                    ? `+${nb.indexDelta}`
                                    : `${nb.indexDelta}`}
                                </td>
                                <td className="py-1.5 px-3 font-bold">
                                  {nb.offsetHex}
                                </td>
                                <td className="py-1.5 px-3">
                                  {nb.rawFilenameOffsetHex}
                                </td>
                                <td className="py-1.5 px-3">
                                  {nb.fileSizeHex} ({nb.fileSize.toLocaleString()})
                                </td>
                                <td className="py-1.5 px-3">{nb.flagsHex}</td>
                                <td className="py-1.5 px-3">
                                  {isAnchor ? (
                                    <span className="text-amber-400 font-bold text-[10px]">
                                      ANCHOR RESOURCE
                                    </span>
                                  ) : nb.isValidCandidate ? (
                                    <span className="text-emerald-400 text-[10px]">
                                      VALID RECORD
                                    </span>
                                  ) : (
                                    <span className="text-red-400 text-[10px]">
                                      TERMINATOR ({nb.notes || 'invalid'})
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

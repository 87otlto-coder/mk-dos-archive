import React, { useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { InventoryEntry } from '../core/models/InventoryEntry';
import {
  reconstructMK1HandleTable,
  createMK1HandleTableExport,
  MK1HandleTableResult,
} from '../games/mk1/research/handleTableProbe';
import {
  Table,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Database,
  Layers,
  FileCode,
  ArrowRight,
  Info,
} from 'lucide-react';
import { formatBytes } from './DetectionSummary';

interface MK1HandleTableViewProps {
  source: DirectorySource;
  inventory: InventoryEntry[];
}

export const MK1HandleTableView: React.FC<MK1HandleTableViewProps> = ({
  source,
  inventory,
}) => {
  const [isReconstructing, setIsReconstructing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressFraction, setProgressFraction] = useState<number>(0);
  const [tableResult, setTableResult] = useState<MK1HandleTableResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReconstruct = async () => {
    if (!source) return;

    setErrorMsg(null);
    setIsReconstructing(true);
    setProgressMsg('Starting handle table reconstruction...');
    setProgressFraction(0.05);

    try {
      const result = await reconstructMK1HandleTable(source, {
        onProgress: (msg, fraction) => {
          setProgressMsg(msg);
          if (fraction !== undefined) {
            setProgressFraction(fraction);
          }
        },
      });
      setTableResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Table reconstruction failed: ${msg}`);
      setTableResult(null);
    } finally {
      setIsReconstructing(false);
    }
  };

  const handleExportJson = () => {
    if (!tableResult) return;

    const exportData = createMK1HandleTableExport(tableResult);
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_handle_table_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="mk1-handle-table-view"
      className="mb-8 rounded-xl bg-zinc-900 border border-amber-900/40 p-6 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-zinc-100 font-mono tracking-tight">
                MK1 Research: Full GRA Handle Table Reconstruction
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Milestone 1B
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enumerates complete contiguous FileEntry table from table start (0x000B0C5C in fixture) and correlates with directory GRA inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {tableResult && (
            <button
              id="export-handle-table-json-btn"
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/30 transition-colors cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export MK1 Handle Table JSON
            </button>
          )}

          <button
            id="reconstruct-handle-table-btn"
            type="button"
            onClick={handleReconstruct}
            disabled={isReconstructing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 transition-colors cursor-pointer shadow-sm"
          >
            {isReconstructing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                Reconstructing...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Reconstruct Full Handle Table
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {isReconstructing && (
        <div className="mt-4 bg-zinc-950/80 p-3 rounded-lg border border-zinc-800">
          <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span>{progressMsg}</span>
            <span>{Math.round(progressFraction * 100)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-150"
              style={{ width: `${Math.round(progressFraction * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error View */}
      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Initial Guidance Card when no table reconstructed yet */}
      {!tableResult && !isReconstructing && !errorMsg && (
        <div className="mt-5 p-5 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-semibold text-zinc-200 font-mono">
            <Info className="w-4 h-4 text-amber-400" />
            Verified Empirical Baseline (Fixture MK1.EXE)
          </div>
          <p>
            Pass 1A verified that <code className="text-amber-400 font-mono">JCATT.GRA</code> (49,402 bytes / 0x0000C0FA) resides at FileEntry <code className="text-amber-400 font-mono">0x000B0CBC</code> (File ID 4), in a contiguous table starting at <code className="text-amber-400 font-mono">0x000B0C5C</code>.
          </p>
          <p>
            Click <strong className="text-zinc-200">Reconstruct Full Handle Table</strong> to scan the full array, evaluate filename-offset deltas, probe the binary for string-area base offsets, and correlate all entries against the directory inventory.
          </p>
        </div>
      )}

      {/* Reconstructed Results View */}
      {tableResult && !isReconstructing && (
        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Table Start Offset</div>
              <div className="text-sm font-bold font-mono text-amber-400 mt-1">
                {tableResult.table.startOffsetHex}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                End: {tableResult.table.endOffsetHex}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Table Entry Count</div>
              <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
                {tableResult.table.entryCount}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Stride: {tableResult.table.stride} bytes (0x18)
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Directory GRA Files</div>
              <div className="text-xl font-bold font-mono text-zinc-100 mt-1">
                {tableResult.directoryComparison.totalGraInDirectory}
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                {tableResult.directoryComparison.matchedCount} mapped
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">String Area Base</div>
              <div className="text-sm font-bold font-mono text-zinc-200 mt-1">
                {tableResult.stringResolution.baseOffsetHex || 'UNRESOLVED'}
              </div>
              <div className="text-[10px] font-semibold text-amber-500/90 mt-0.5 uppercase">
                {tableResult.stringResolution.confidence}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Anchor Validation</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
                {tableResult.summary.knownAnchorsValidated ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>VERIFIED</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>MISMATCH</span>
                  </>
                )}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                JCATT: ID #{tableResult.summary.jcattFileId ?? '?'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-medium text-zinc-400">Reconstruction Status</div>
              <div className="text-xs font-bold font-mono mt-1 text-emerald-400">
                {tableResult.summary.reconstructionStatus}
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Observed DOS Fixture
              </div>
            </div>
          </div>

          {/* Narrative Overview */}
          <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed">
            <div className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Forensic Handle Table Reconstruction Summary
            </div>
            <p>{tableResult.summary.narrative}</p>
            <p className="mt-1 text-amber-300/80">
              {tableResult.stringResolution.statusNarrative}
            </p>
          </div>

          {/* Directory GRA Matching Balance */}
          {tableResult.directoryComparison.unmatchedDirectoryGraPaths.length > 0 && (
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
              <div className="font-semibold text-zinc-300 font-mono mb-1.5">
                Unmatched Directory GRA Files ({tableResult.directoryComparison.unmatchedDirectoryGraPaths.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tableResult.directoryComparison.unmatchedDirectoryGraPaths.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-300"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Complete Handle Table List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
                Recovered Handle Table Entries ({tableResult.entries.length})
              </h4>
              <span className="text-[11px] text-zinc-400 font-mono">
                Showing IDs 00 to {(tableResult.entries.length - 1).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="border border-zinc-800 rounded-lg overflow-x-auto bg-zinc-950 max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">EXE Offset</th>
                    <th className="py-2.5 px-3">Raw Filename Offset</th>
                    <th className="py-2.5 px-3">Size (Dec / Hex)</th>
                    <th className="py-2.5 px-3">Flags</th>
                    <th className="py-2.5 px-3">Resolved / Candidate Path</th>
                    <th className="py-2.5 px-3">Resolution Method</th>
                    <th className="py-2.5 px-3">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {tableResult.entries.map((entry) => {
                    const isJcatt = entry.fileId === 4 || entry.fileSize === 49402;
                    return (
                      <tr
                        key={entry.fileId}
                        className={
                          isJcatt
                            ? 'bg-amber-950/30 hover:bg-amber-950/40 text-amber-200'
                            : 'hover:bg-zinc-900/50'
                        }
                      >
                        <td className="py-2 px-3 font-bold text-amber-400">
                          {entry.fileId.toString().padStart(2, '0')}
                        </td>
                        <td className="py-2 px-3">{entry.entryOffsetHex}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span>{entry.rawFilenameOffsetHex}</span>
                            {entry.filenameOffsetDelta !== undefined && (
                              <span
                                className={`text-[10px] px-1 py-0.2 rounded border ${
                                  entry.filenameOffsetDeltaMatches
                                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                                }`}
                                title={`Offset Delta to next entry: ${entry.filenameOffsetDelta} bytes`}
                              >
                                Δ={entry.filenameOffsetDelta}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-zinc-200">
                            {entry.fileSize.toLocaleString()}
                          </span>{' '}
                          <span className="text-zinc-500 text-[11px]">
                            ({entry.fileSizeHex})
                          </span>
                        </td>
                        <td className="py-2 px-3 text-zinc-400">{entry.flagsHex}</td>
                        <td className="py-2 px-3">
                          {entry.resolvedPath ? (
                            <span className="font-semibold text-zinc-100">
                              {entry.resolvedPath}
                            </span>
                          ) : entry.candidatePaths.length > 0 ? (
                            <span className="text-amber-400/90 italic">
                              {entry.candidatePaths.join(' | ')}
                            </span>
                          ) : (
                            <span className="text-zinc-600 italic">Unresolved</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              entry.pathResolution === 'exact-string'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : entry.pathResolution === 'unique-size'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : entry.pathResolution === 'size-and-offset-delta'
                                ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                : entry.pathResolution === 'ambiguous'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {entry.pathResolution}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                              entry.confidence === 'verified'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : entry.confidence === 'inferred'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : entry.confidence === 'hypothesis'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {entry.confidence}
                          </span>
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
};

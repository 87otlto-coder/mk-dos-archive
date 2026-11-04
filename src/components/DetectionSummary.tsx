import React from 'react';
import {
  Download,
  FolderOpen,
  CheckCircle2,
  HelpCircle,
  Folder,
  HardDrive,
  FileCode2,
} from 'lucide-react';
import { GameDetectionResult } from '../core/models/GameDetection';

interface DetectionSummaryProps {
  directoryName: string;
  totalFiles: number;
  totalSize: number;
  detection: GameDetectionResult;
  onExportJson: () => void;
  onSelectDifferentDirectory: () => void;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export const DetectionSummary: React.FC<DetectionSummaryProps> = ({
  directoryName,
  totalFiles,
  totalSize,
  detection,
  onExportJson,
  onSelectDifferentDirectory,
}) => {
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
      case 'low':
        return 'bg-orange-950/80 text-orange-300 border-orange-700/80';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  const getGameTitle = () => {
    if (detection.game === 'mk1') return 'Mortal Kombat';
    if (detection.game === 'mk2') return 'Mortal Kombat II';
    if (detection.game === 'mk3') return 'Mortal Kombat 3';
    return detection.gameName || 'Unknown / Unrecognized DOS Game';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl mb-6">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Detected Game
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getConfidenceBadge(
                detection.confidence,
              )}`}
            >
              Confidence: {detection.confidence.toUpperCase()}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 flex items-center gap-2">
            {getGameTitle()}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="export-inventory-json-btn"
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-zinc-950 font-bold text-sm transition-colors shadow cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Inventory JSON
          </button>

          <button
            id="change-directory-btn"
            type="button"
            onClick={onSelectDifferentDirectory}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm transition-colors border border-zinc-700 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-zinc-400" />
            Open Another Directory
          </button>
        </div>
      </div>

      {/* Directory Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-zinc-800 text-sm">
        <div className="flex items-center gap-3 text-zinc-300">
          <Folder className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="text-xs text-zinc-400 block">Directory</span>
            <span className="font-semibold text-zinc-100 truncate block max-w-xs" title={directoryName}>
              {directoryName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-zinc-300">
          <FileCode2 className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="text-xs text-zinc-400 block">Files</span>
            <span className="font-semibold text-zinc-100">{totalFiles.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-zinc-300">
          <HardDrive className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="text-xs text-zinc-400 block">Total Size</span>
            <span className="font-semibold text-zinc-100">{formatBytes(totalSize)}</span>
          </div>
        </div>
      </div>

      {/* Evidence List */}
      <div className="pt-5">
        <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-300 mb-3 flex items-center gap-2">
          Detection Evidence
        </h3>

        {detection.evidence && detection.evidence.length > 0 ? (
          <div className="space-y-2">
            {detection.evidence.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-sm"
              >
                {item.weight > 0 ? (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
                    +
                  </span>
                ) : item.weight < 0 ? (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-950 text-red-400 text-xs font-bold shrink-0 mt-0.5">
                    -
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold shrink-0 mt-0.5">
                    ?
                  </span>
                )}

                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-zinc-200">{item.description}</span>
                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold ${
                        item.status === 'verified'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : item.status === 'inferred'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.weight !== 0 && (
                      <span className="text-zinc-400 font-mono text-[11px]">
                        [{item.weight > 0 ? `+${item.weight}` : item.weight}]
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400 italic">No evidence recorded.</p>
        )}
      </div>
    </div>
  );
};

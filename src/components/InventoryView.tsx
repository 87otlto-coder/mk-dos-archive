import React, { useMemo, useState } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  FileCode,
  Image,
  Music,
  FileQuestion,
  Database,
  FileText,
  Cpu,
} from 'lucide-react';
import { InventoryEntry, FileClassification } from '../core/models/InventoryEntry';
import { formatBytes } from './DetectionSummary';

interface InventoryViewProps {
  inventory: InventoryEntry[];
}

type FilterOption =
  | 'all'
  | 'executable'
  | 'support_driver'
  | 'graphics_candidate'
  | 'audio_candidate'
  | 'unknown';
type SortField = 'path' | 'extension' | 'size' | 'signature' | 'classification';
type SortDirection = 'asc' | 'desc';

export const InventoryView: React.FC<InventoryViewProps> = ({ inventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState<FilterOption>('all');
  const [sortField, setSortField] = useState<SortField>('path');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Classification filter logic
  const filteredEntries = useMemo(() => {
    return inventory.filter((entry) => {
      // 1. Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesPath = entry.path.toLowerCase().includes(term);
        const matchesSig = entry.signature.kind.toLowerCase().includes(term);
        const matchesExt = entry.extension.toLowerCase().includes(term);
        if (!matchesPath && !matchesSig && !matchesExt) return false;
      }

      // 2. Classification filter
      if (filterClassification === 'all') return true;
      if (filterClassification === 'executable') {
        return entry.classification === 'executable';
      }
      if (filterClassification === 'support_driver') {
        return entry.classification === 'support_driver';
      }
      if (filterClassification === 'graphics_candidate') {
        return entry.classification === 'graphics_candidate';
      }
      if (filterClassification === 'audio_candidate') {
        return entry.classification === 'audio_candidate';
      }
      if (filterClassification === 'unknown') {
        return (
          entry.classification === 'unknown' ||
          entry.classification === 'read_error' ||
          entry.classification === 'data_candidate' ||
          entry.classification === 'text_document'
        );
      }
      return true;
    });
  }, [inventory, searchTerm, filterClassification]);

  // Sort logic
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries];
    list.sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'path':
          comp = a.path.localeCompare(b.path);
          break;
        case 'extension':
          comp = a.extension.localeCompare(b.extension);
          break;
        case 'size':
          comp = a.size - b.size;
          break;
        case 'signature':
          comp = a.signature.kind.localeCompare(b.signature.kind);
          break;
        case 'classification':
          comp = a.classification.localeCompare(b.classification);
          break;
      }
      return sortDirection === 'asc' ? comp : -comp;
    });
    return list;
  }, [filteredEntries, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-600 inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-amber-500 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-amber-500 inline ml-1" />
    );
  };

  const getClassificationBadge = (classification: FileClassification) => {
    switch (classification) {
      case 'executable':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            <FileCode className="w-3.5 h-3.5" /> Executable
          </span>
        );
      case 'support_driver':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
            <Cpu className="w-3.5 h-3.5" /> Support / Driver
          </span>
        );
      case 'graphics_candidate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
            <Image className="w-3.5 h-3.5" /> Graphics Candidate
          </span>
        );
      case 'audio_candidate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/80">
            <Music className="w-3.5 h-3.5" /> Audio Candidate
          </span>
        );
      case 'data_candidate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80">
            <Database className="w-3.5 h-3.5" /> Data Candidate
          </span>
        );
      case 'text_document':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <FileText className="w-3.5 h-3.5" /> Text Document
          </span>
        );
      case 'read_error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800/80">
            <AlertTriangle className="w-3.5 h-3.5" /> Read Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <FileQuestion className="w-3.5 h-3.5" /> Unknown
          </span>
        );
    }
  };

  const getSignatureBadge = (entry: InventoryEntry) => {
    const isVerified = entry.signature.confidence === 'verified';
    const isInferred = entry.signature.confidence === 'inferred';

    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-zinc-200">
            {entry.signature.kind}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
              isVerified
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : isInferred
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {entry.signature.confidence}
          </span>
        </div>
        {entry.signature.headerHex && (
          <span className="font-mono text-[11px] text-zinc-400">
            [{entry.signature.headerHex}]
          </span>
        )}
        {entry.signature.details && (
          <span className="text-xs text-zinc-400 max-w-sm">
            {entry.signature.details}
          </span>
        )}
      </div>
    );
  };

  // Counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: inventory.length,
      executable: inventory.filter((e) => e.classification === 'executable').length,
      support_driver: inventory.filter((e) => e.classification === 'support_driver').length,
      graphics_candidate: inventory.filter(
        (e) => e.classification === 'graphics_candidate',
      ).length,
      audio_candidate: inventory.filter(
        (e) => e.classification === 'audio_candidate',
      ).length,
      unknown: inventory.filter(
        (e) =>
          e.classification === 'unknown' ||
          e.classification === 'read_error' ||
          e.classification === 'data_candidate' ||
          e.classification === 'text_document',
      ).length,
    };
  }, [inventory]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="inventory-search-input"
            type="text"
            placeholder="Search path, filename, extension, or signature..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Classification Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterClassification('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterClassification === 'all'
                ? 'bg-amber-600 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterClassification('executable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterClassification === 'executable'
                ? 'bg-amber-600 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Executables ({counts.executable})
          </button>
          <button
            type="button"
            onClick={() => setFilterClassification('support_driver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterClassification === 'support_driver'
                ? 'bg-amber-600 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Drivers & Support ({counts.support_driver})
          </button>
          <button
            type="button"
            onClick={() => setFilterClassification('graphics_candidate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterClassification === 'graphics_candidate'
                ? 'bg-amber-600 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Graphics Candidates ({counts.graphics_candidate})
          </button>
          <button
            type="button"
            onClick={() => setFilterClassification('audio_candidate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterClassification === 'audio_candidate'
                ? 'bg-amber-600 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Audio Candidates ({counts.audio_candidate})
          </button>
          <button
            type="button"
            onClick={() => setFilterClassification('unknown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterClassification === 'unknown'
                ? 'bg-amber-600 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            Unknown ({counts.unknown})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-950/80 border-b border-zinc-800 text-xs font-semibold uppercase text-zinc-400">
              <th
                scope="col"
                className="py-3 px-4 cursor-pointer hover:text-zinc-200"
                onClick={() => handleSort('path')}
              >
                Path {renderSortIndicator('path')}
              </th>
              <th
                scope="col"
                className="py-3 px-4 w-28 cursor-pointer hover:text-zinc-200"
                onClick={() => handleSort('extension')}
              >
                Ext {renderSortIndicator('extension')}
              </th>
              <th
                scope="col"
                className="py-3 px-4 w-28 cursor-pointer hover:text-zinc-200 text-right"
                onClick={() => handleSort('size')}
              >
                Size {renderSortIndicator('size')}
              </th>
              <th
                scope="col"
                className="py-3 px-4 cursor-pointer hover:text-zinc-200"
                onClick={() => handleSort('signature')}
              >
                Signature {renderSortIndicator('signature')}
              </th>
              <th
                scope="col"
                className="py-3 px-4 w-48 cursor-pointer hover:text-zinc-200"
                onClick={() => handleSort('classification')}
              >
                Classification {renderSortIndicator('classification')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {sortedEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-500">
                  No files match the active filters.
                </td>
              </tr>
            ) : (
              sortedEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Path */}
                  <td className="py-3 px-4 font-mono text-xs text-zinc-200 break-all">
                    {entry.path}
                  </td>

                  {/* Extension */}
                  <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                    {entry.extension ? `.${entry.extension}` : '—'}
                  </td>

                  {/* Size */}
                  <td
                    className="py-3 px-4 font-mono text-xs text-zinc-300 text-right"
                    title={`${entry.size.toLocaleString()} bytes`}
                  >
                    {formatBytes(entry.size)}
                  </td>

                  {/* Signature */}
                  <td className="py-3 px-4">{getSignatureBadge(entry)}</td>

                  {/* Classification */}
                  <td className="py-3 px-4">
                    {getClassificationBadge(entry.classification)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 px-4">
        <span>
          Showing {sortedEntries.length.toLocaleString()} of{' '}
          {inventory.length.toLocaleString()} files
        </span>
        <span className="italic">
          Candidate labels are provisional extension heuristics.
        </span>
      </div>
    </div>
  );
};

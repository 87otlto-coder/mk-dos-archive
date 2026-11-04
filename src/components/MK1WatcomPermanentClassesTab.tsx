import React, { useState, useMemo } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Search,
  FileCode,
  Terminal,
  Database,
  Layers,
  Info,
} from 'lucide-react';
import {
  enumerateMK1WatcomPermanentClasses,
  createMK1WatcomPermanentClassesExport,
  MK1WatcomPermanentClassesReport,
} from '../games/mk1/research/watcomPermanentClassInventory';

interface Props {
  source: DirectorySource;
  isRealDirectorySource: boolean;
  report: MK1WatcomPermanentClassesReport | null;
  setReport: (report: MK1WatcomPermanentClassesReport | null) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export function MK1WatcomPermanentClassesTab({
  source,
  isRealDirectorySource,
  report,
  setReport,
  isRunning,
  setIsRunning,
  error,
  setError,
}: Props) {
  const [subTab, setSubTab] = useState<'modules' | 'symbols' | 'address' | 'segments' | 'languages'>('modules');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');

  const handleRunEnumeration = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const rep = await enumerateMK1WatcomPermanentClasses(source);
      setReport(rep);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setReport(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportJson = () => {
    if (!report) return;
    if (!isRealDirectorySource || report.provenance.synthetic) {
      setError('Authoritative export is disabled: real MK1 fixture is not loaded.');
      return;
    }

    try {
      const exportData = createMK1WatcomPermanentClassesExport(report);
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `mk1_watcom_permanent_classes_inventory_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Export failed: ${msg}`);
    }
  };

  // Filter modules
  const filteredModules = useMemo(() => {
    if (!report) return [];
    const list = report.result.modules.modules;
    if (!moduleSearch.trim()) return list;
    const q = moduleSearch.toLowerCase();
    return list.filter((m) => m.name.toLowerCase().includes(q) || m.resolvedLanguage?.toLowerCase().includes(q));
  }, [report, moduleSearch]);

  // Filter symbols
  const filteredSymbols = useMemo(() => {
    if (!report) return [];
    const list = report.result.globalSymbols.symbols;
    if (!symbolSearch.trim()) return list;
    const q = symbolSearch.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.resolvedModuleName?.toLowerCase().includes(q) ||
        s.addressOffsetHex.toLowerCase().includes(q),
    );
  }, [report, symbolSearch]);

  const r = report?.result;

  return (
    <div className="space-y-6">
      {/* Provenance Safeguard Banner */}
      {!isRealDirectorySource ? (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-amber-300">
              Real MK1 Fixture Not Loaded (Synthetic / In-Memory Source)
            </h4>
            <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
              Synthetic tests or in-memory fixtures cannot produce authoritative research evidence.
              Authoritative export is strictly gated until the real game directory is loaded via the browser DirectorySource workflow.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-emerald-300">
              Authoritative Real-Fixture Source Active: {source.directoryName}
            </h4>
            <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
              Blind structural enumeration will parse all 5 permanent Open Watcom debug classes directly from your user-loaded binary files. No hardcoded MK1 symbol names or addresses guide discovery.
            </p>
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunEnumeration}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Enumerating Permanent Classes...' : 'Run Blind Permanent-Class Enumeration (1E.3B)'}</span>
          </button>

          {report && (
            <span className="text-xs text-zinc-400 font-mono">
              Completed: {report.timestamp.split('T')[1]?.replace('Z', '')}
            </span>
          )}
        </div>

        {report && (
          <div>
            {isRealDirectorySource && !report.provenance.synthetic ? (
              <button
                onClick={handleExportJson}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Authoritative Inventory JSON</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-zinc-500 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70" />
                Authoritative Export Disabled (Synthetic Fixture)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Permanent-Class Enumeration Error</h4>
            <p className="text-xs text-red-300 mt-1 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {report && r && (
        <div className="space-y-6">
          {/* Executive Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">1. Languages</div>
              <div className="text-sm font-semibold text-emerald-400 mt-1 font-mono">
                {r.languages.entries.length} entries
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                {r.languages.consumedByteLength} / {r.languages.declaredByteLength} B
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">2. Segment Table</div>
              <div className="text-sm font-semibold text-cyan-400 mt-1 font-mono">
                {r.segmentAddresses.entryCount} segments
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                {r.segmentAddresses.consumedByteLength} / {r.segmentAddresses.declaredByteLength} B
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">3. Modules</div>
              <div className="text-sm font-semibold text-amber-400 mt-1 font-mono">
                {r.modules.moduleCount} modules
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                Tiling: {r.modules.tilingValid ? 'EXACT' : 'INVALID'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">4. Global Symbols</div>
              <div className="text-sm font-semibold text-purple-400 mt-1 font-mono">
                {r.globalSymbols.symbolCount} symbols
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                Tiling: {r.globalSymbols.tilingValid ? 'EXACT' : 'INVALID'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">5. Address Info</div>
              <div className="text-sm font-semibold text-rose-400 mt-1 font-mono">
                {r.addressInfo.segmentRecordCount} records
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                Tiling: {r.addressInfo.tilingValid ? 'EXACT' : 'INVALID'}
              </div>
            </div>
          </div>

          {/* Provenance Audit Card */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-200 font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Fixture Provenance & Audit
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  report.provenance.synthetic
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {report.provenance.synthetic ? 'SYNTHETIC NON-AUTHORITATIVE' : 'AUTHENTIC REAL RUN'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px] pt-1">
              <div>
                <span className="text-zinc-500">Source:</span>{' '}
                <span className="text-zinc-300">{report.provenance.sourceKind}</span>
              </div>
              <div>
                <span className="text-zinc-500">Binary:</span>{' '}
                <span className="text-zinc-300">
                  {report.fixture.exePath} ({report.fixture.exeSize.toLocaleString()} B)
                </span>
              </div>
              <div>
                <span className="text-zinc-500">SHA-256:</span>{' '}
                <span className="text-zinc-300 truncate" title={report.provenance.sha256 || 'N/A'}>
                  {report.provenance.sha256 ? `${report.provenance.sha256.substring(0, 16)}...` : 'None'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Operation ID:</span>{' '}
                <span className="text-zinc-300">{report.operationId}</span>
              </div>
            </div>
          </div>

          {/* Cross-Class Structural Reconciliation Card */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-semibold text-zinc-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Cross-Class Structural Reconciliation
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                  r.validation.allChecksPassed
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950 text-red-300 border border-red-800'
                }`}
              >
                {r.validation.allChecksPassed ? 'ALL CHECKS PASSED' : 'STRUCTURAL DEFECTS DETECTED'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Language Table Consumed:</span>
                <span className={r.validation.languageTableConsumed ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {r.validation.languageTableConsumed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Segment Table Consumed:</span>
                <span className={r.validation.segmentTableConsumed ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {r.validation.segmentTableConsumed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Module Class Tiled:</span>
                <span className={r.validation.moduleClassTiled ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {r.validation.moduleClassTiled ? 'EXACT TILING' : 'FAILED'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Global Class Tiled:</span>
                <span className={r.validation.globalClassTiled ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {r.validation.globalClassTiled ? 'EXACT TILING' : 'FAILED'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Address Class Tiled:</span>
                <span className={r.validation.addressClassTiled ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {r.validation.addressClassTiled ? 'EXACT TILING' : 'FAILED'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Module Languages Valid:</span>
                <span className={r.validation.allModuleLanguagesValid ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {r.validation.allModuleLanguagesValid ? 'RESOLVED' : 'FAILED'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Global Module Indices Valid:</span>
                <span className={r.validation.allGlobalModulesValid ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {r.validation.allGlobalModulesValid ? 'RESOLVED' : 'FAILED'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-400">Address Module Indices Valid:</span>
                <span className={r.validation.allAddressModulesValid ? 'text-emerald-400 font-bold' : 'text-red-400'}>
                  {r.validation.allAddressModulesValid ? 'RESOLVED' : 'FAILED'}
                </span>
              </div>
            </div>

            {/* Duplicate notices if any */}
            {(r.validation.duplicateModuleNames.length > 0 || r.validation.duplicateGlobalSymbols.length > 0) && (
              <div className="p-3 rounded bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 space-y-1 font-mono">
                {r.validation.duplicateModuleNames.length > 0 && (
                  <div>
                    <span className="text-amber-400 font-semibold">Duplicate module names:</span>{' '}
                    {r.validation.duplicateModuleNames.map((d) => `"${d.name}" (${d.count})`).join(', ')}
                  </div>
                )}
                {r.validation.duplicateGlobalSymbols.length > 0 && (
                  <div>
                    <span className="text-amber-400 font-semibold">Duplicate symbol names:</span>{' '}
                    {r.validation.duplicateGlobalSymbols.slice(0, 10).map((d) => `"${d.name}" (${d.count})`).join(', ')}
                    {r.validation.duplicateGlobalSymbols.length > 10 && ` ... and ${r.validation.duplicateGlobalSymbols.length - 10} more`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sub-Tabs Navigation for Class Data */}
          <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
            <div className="flex border-b border-zinc-800 bg-zinc-900/60 overflow-x-auto text-xs">
              <button
                onClick={() => setSubTab('modules')}
                className={`px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  subTab === 'modules'
                    ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Modules ({r.modules.moduleCount})</span>
              </button>
              <button
                onClick={() => setSubTab('symbols')}
                className={`px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  subTab === 'symbols'
                    ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Global Symbols ({r.globalSymbols.symbolCount})</span>
              </button>
              <button
                onClick={() => setSubTab('address')}
                className={`px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  subTab === 'address'
                    ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Address Records ({r.addressInfo.segmentRecordCount})</span>
              </button>
              <button
                onClick={() => setSubTab('segments')}
                className={`px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  subTab === 'segments'
                    ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Segment Table ({r.segmentAddresses.entryCount})</span>
              </button>
              <button
                onClick={() => setSubTab('languages')}
                className={`px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  subTab === 'languages'
                    ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Languages ({r.languages.entries.length})</span>
              </button>
            </div>

            <div className="p-4">
              {/* SUBTAB 1: MODULES */}
              {subTab === 'modules' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        placeholder="Search module name or language..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      Showing {filteredModules.length} of {r.modules.moduleCount} modules
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Module Name</th>
                          <th className="py-2 px-3">Language</th>
                          <th className="py-2 px-3">Locals</th>
                          <th className="py-2 px-3">Types</th>
                          <th className="py-2 px-3">Lines</th>
                          <th className="py-2 px-3">File Offset</th>
                          <th className="py-2 px-3">Bytes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {filteredModules.map((m) => (
                          <tr key={m.moduleIndex} className="hover:bg-zinc-900/40">
                            <td className="py-1.5 px-3 text-zinc-500">{m.moduleIndex}</td>
                            <td className="py-1.5 px-3 font-semibold text-amber-300">{m.name}</td>
                            <td className="py-1.5 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-[10px]">
                                {m.resolvedLanguage ?? `off:${m.languageOffset}`}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-zinc-400 text-[11px]">
                              {m.locals.numEntries} @ {m.locals.offsetHex}
                            </td>
                            <td className="py-1.5 px-3 text-zinc-400 text-[11px]">
                              {m.types.numEntries} @ {m.types.offsetHex}
                            </td>
                            <td className="py-1.5 px-3 text-zinc-400 text-[11px]">
                              {m.lines.numEntries} @ {m.lines.offsetHex}
                            </td>
                            <td className="py-1.5 px-3 text-zinc-400">{m.fileOffsetHex}</td>
                            <td className="py-1.5 px-3 text-zinc-500">{m.recordByteLength} B</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: GLOBAL SYMBOLS */}
              {subTab === 'symbols' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        value={symbolSearch}
                        onChange={(e) => setSymbolSearch(e.target.value)}
                        placeholder="Search symbol name, module, or address..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      Showing {filteredSymbols.length} of {r.globalSymbols.symbolCount} symbols
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Symbol Name</th>
                          <th className="py-2 px-3">Kind</th>
                          <th className="py-2 px-3">Segment:Offset</th>
                          <th className="py-2 px-3">Module</th>
                          <th className="py-2 px-3">File Offset</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {filteredSymbols.slice(0, 1000).map((s) => (
                          <tr key={s.globalIndex} className="hover:bg-zinc-900/40">
                            <td className="py-1.5 px-3 text-zinc-500">{s.globalIndex}</td>
                            <td className="py-1.5 px-3 font-semibold text-purple-300">{s.name}</td>
                            <td className="py-1.5 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  s.kindBits.isCode
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : s.kindBits.isData
                                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {s.kindBits.isCode ? 'CODE' : s.kindBits.isData ? 'DATA' : 'STATIC'} ({s.kindBits.rawKindHex})
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-zinc-200">
                              {s.segmentHex}:{s.addressOffsetHex}
                            </td>
                            <td className="py-1.5 px-3 text-zinc-400">
                              {s.resolvedModuleName ?? `mod#${s.moduleIndex}`}
                            </td>
                            <td className="py-1.5 px-3 text-zinc-500">{s.fileOffsetHex}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredSymbols.length > 1000 && (
                    <div className="text-xs text-zinc-500 text-center font-mono">
                      Showing first 1,000 of {filteredSymbols.length} filtered symbols. Use search to filter specific symbols.
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: ADDRESS RECORDS */}
              {subTab === 'address' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Segment:StartOffset</th>
                          <th className="py-2 px-3">Entries</th>
                          <th className="py-2 px-3">NonSect</th>
                          <th className="py-2 px-3">File Offset</th>
                          <th className="py-2 px-3">First 3 Child Entries</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {r.addressInfo.segmentRecords.map((seg) => (
                          <tr key={seg.segInfoIndex} className="hover:bg-zinc-900/40">
                            <td className="py-1.5 px-3 text-zinc-500">{seg.segInfoIndex}</td>
                            <td className="py-1.5 px-3 font-semibold text-rose-300">
                              {seg.segmentHex}:{seg.startAddressOffsetHex}
                            </td>
                            <td className="py-1.5 px-3 text-zinc-200">{seg.entryCount}</td>
                            <td className="py-1.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                seg.isNonSect ? 'bg-amber-950 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {seg.isNonSect ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 text-zinc-500">{seg.fileOffsetHex}</td>
                            <td className="py-1.5 px-3 text-zinc-400 text-[11px]">
                              {seg.entries.slice(0, 3).map((e) => `mod#${e.moduleIndex} (${e.sizeHex})`).join(', ')}
                              {seg.entries.length > 3 && ` ... +${seg.entries.length - 3}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 4: SEGMENTS */}
              {subTab === 'segments' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Index</th>
                          <th className="py-2 px-3">Segment Number</th>
                          <th className="py-2 px-3">Hex</th>
                          <th className="py-2 px-3">File Offset</th>
                          <th className="py-2 px-3">Table Offset</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {r.segmentAddresses.entries.map((e) => (
                          <tr key={e.entryIndex} className="hover:bg-zinc-900/40">
                            <td className="py-1.5 px-3 text-zinc-500">{e.entryIndex}</td>
                            <td className="py-1.5 px-3 font-semibold text-cyan-300">{e.segment}</td>
                            <td className="py-1.5 px-3 text-cyan-400">{e.segmentHex}</td>
                            <td className="py-1.5 px-3 text-zinc-500">{e.fileOffsetHex}</td>
                            <td className="py-1.5 px-3 text-zinc-500">+{e.tableOffset} B</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 5: LANGUAGES */}
              {subTab === 'languages' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Index</th>
                          <th className="py-2 px-3">Language String</th>
                          <th className="py-2 px-3">Table Offset</th>
                          <th className="py-2 px-3">Byte Length</th>
                          <th className="py-2 px-3">File Offset</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                        {r.languages.entries.map((l) => (
                          <tr key={l.index} className="hover:bg-zinc-900/40">
                            <td className="py-1.5 px-3 text-zinc-500">{l.index}</td>
                            <td className="py-1.5 px-3 font-semibold text-emerald-300">"{l.language}"</td>
                            <td className="py-1.5 px-3 text-zinc-400">+{l.tableOffset} B</td>
                            <td className="py-1.5 px-3 text-zinc-500">{l.byteLength} B</td>
                            <td className="py-1.5 px-3 text-zinc-500">{l.fileOffsetHex}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Epistemic Boundaries Card */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-2">
            <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              Pass 1E.3B Epistemic Boundaries & Invariants
            </h4>
            <ul className="list-disc list-inside text-zinc-400 space-y-1 font-mono text-[11px]">
              <li>STRUCTURAL ENUMERATION ONLY != SEMANTIC INTERPRETATION</li>
              <li>NO MORTAL KOMBAT SYMBOL SEARCHES OR HEURISTICS USED</li>
              <li>NO EXPECTED SYMBOL COUNTS OR MODULE NAMES GUIDED DISCOVERY</li>
              <li>DECODED KIND BITS ARE STRUCTURAL WATCOM METADATA ONLY</li>
              <li>NO FUNCTION DISASSEMBLY OR CALL TARGET MAPPING PERFORMED</li>
              <li>REAL RESEARCH EXPORT REQUIRES AUTHENTIC USER-LOADED DIRECTORY SOURCE</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  MK1WatcomAddressModelReport,
  createMK1WatcomAddressModelExport,
  serializeWatcomAddressModelNonAuthoritative,
} from '../games/mk1/research/watcomAddressModelInventory';
import { PhysicalBackingCategory } from '../core/executable/watcomDebug/watcomAddressModelTypes';

interface Props {
  report: MK1WatcomAddressModelReport | null;
  isRunning: boolean;
  error: string | null;
  onRunQualification: () => void;
  isRealDirectorySource: boolean;
}

export const MK1WatcomAddressModelTab: React.FC<Props> = ({
  report,
  isRunning,
  error,
  onRunQualification,
  isRealDirectorySource,
}) => {
  const [symbolFilter, setSymbolFilter] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<number | 'ALL'>('ALL');
  const [selectedBacking, setSelectedBacking] = useState<PhysicalBackingCategory | 'ALL'>('ALL');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showExceptions, setShowExceptions] = useState(false);

  const handleExport = () => {
    if (!report) return;
    try {
      let exportObj: object;
      let filename: string;
      if (!report.provenance.synthetic && isRealDirectorySource) {
        exportObj = createMK1WatcomAddressModelExport(report);
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        filename = `mk1_watcom_address_model_qualification_${dateStr}.json`;
      } else {
        exportObj = serializeWatcomAddressModelNonAuthoritative(report);
        filename = `mk1_watcom_address_model_SYNTHETIC_${Date.now()}.json`;
      }

      const jsonStr = JSON.stringify(exportObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage(`Exported ${filename}`);
      setTimeout(() => setExportMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportMessage(`Export rejected: ${msg}`);
    }
  };

  const q = report?.qualification;
  const filteredSymbols = (q?.symbolCoordinateInventory || []).filter((sd) => {
    const matchesName =
      symbolFilter.trim() === '' ||
      sd.name.toLowerCase().includes(symbolFilter.trim().toLowerCase());
    const matchesSeg = selectedSegment === 'ALL' || sd.watcomMapSegment === selectedSegment;
    const matchesBacking = selectedBacking === 'ALL' || sd.physicalBackingCategory === selectedBacking;
    return matchesName && matchesSeg && matchesBacking;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">
            Pass 1E.3C.1: Watcom Address Semantics & Qualification Inventory
          </h2>
          <p className="text-xs text-zinc-400">
            Structural segment-to-object qualification, whole-span page backing analysis, module range reconciliation, and candidate preferred linear coordinates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRunQualification}
            disabled={isRunning}
            className="px-4 py-2 text-sm font-semibold rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-colors"
          >
            {isRunning ? 'Qualifying Address Model...' : 'Run Address Model Qualification'}
          </button>
          {report && (
            <button
              onClick={handleExport}
              className={`px-4 py-2 text-sm font-semibold rounded text-white transition-colors ${
                !report.provenance.synthetic && isRealDirectorySource
                  ? 'bg-emerald-700 hover:bg-emerald-600'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              {!report.provenance.synthetic && isRealDirectorySource
                ? 'Export Authoritative JSON (v2)'
                : 'Export Non-Authoritative JSON'}
            </button>
          )}
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 rounded text-sm bg-zinc-800 border border-zinc-700 text-zinc-200">
          {exportMessage}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm">
          <strong>Qualification Error:</strong> {error}
        </div>
      )}

      {report && (
        <>
          {/* Provenance Card */}
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Fixture Provenance
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  report.provenance.synthetic
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {report.provenance.synthetic
                  ? 'SYNTHETIC TEST FIXTURE (NOT FOR ARTIFACTS)'
                  : 'AUTHENTIC USER DIRECTORY SOURCE'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-zinc-500">File:</span>{' '}
                <span className="font-mono text-zinc-300">{report.fixture.exePath}</span>
              </div>
              <div>
                <span className="text-zinc-500">Executable Size:</span>{' '}
                <span className="font-mono text-zinc-300">{report.fixture.exeSize.toLocaleString()} bytes</span>
              </div>
              <div>
                <span className="text-zinc-500">SHA-256:</span>{' '}
                <span className="font-mono text-zinc-300 truncate block">
                  {report.provenance.sha256 ? report.provenance.sha256.slice(0, 16) + '...' : 'None (Synthetic)'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Operation ID:</span>{' '}
                <span className="font-mono text-zinc-300 truncate block">{report.operationId}</span>
              </div>
            </div>
          </div>

          {/* Epistemic Boundary Notice */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-amber-900/60 text-xs text-zinc-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <span>EPISTEMIC BOUNDARY: STRUCTURAL MEMBERSHIP != RUNTIME ADDRESS MAPPING</span>
            </div>
            <p>
              Watcom segments are <strong>structurally qualified</strong> to LE Objects based on containment and capabilities.
              Candidate preferred linear addresses (<code className="text-zinc-200">preferredBase + mapOffset</code>) are derived strictly under the LE preferred-base model (<code className="text-amber-300">runtimeAddressVerified: false</code>).
              Physical file backing is inspected at the page level. No unsupported BSS classification is asserted.
            </p>
          </div>

          {/* Qualification Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase font-semibold">Structural Object Qualification</div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  q?.overallMappingState === 'FULLY_QUALIFIED'
                    ? 'text-emerald-400'
                    : q?.overallMappingState === 'AMBIGUOUS'
                    ? 'text-amber-400'
                    : 'text-zinc-300'
                }`}
              >
                {q?.overallMappingState}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {q?.uniqueMappingCount} unique, {q?.ambiguousMappingCount} ambiguous, {q?.unmappedSegmentCount} unmapped
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase font-semibold">Physical Backing Distribution</div>
              <div className="text-lg font-bold font-mono text-zinc-100 mt-1">
                {q?.physicalBackingSummary.fileBacked.toLocaleString()} File-Backed
              </div>
              <div className="text-xs text-zinc-400 mt-1 space-y-0.5">
                <div>Page Padding: {q?.physicalBackingSummary.pagePadding}</div>
                <div>Zero-Filled: {q?.physicalBackingSummary.zeroFilledPage}</div>
                <div>Unbacked Beyond Table: {q?.physicalBackingSummary.virtualUnbackedBeyondPageTable}</div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase font-semibold">Module Range Reconciliation</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {q?.moduleRangeReconciliation.summary.insideDefiningModuleSpanCount.toLocaleString()} Inside Span
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {q?.moduleRangeReconciliation.summary.atDefiningModuleEndCount} at end,{' '}
                <button
                  onClick={() => setShowExceptions(!showExceptions)}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  {q?.moduleRangeReconciliation.exceptions.length} exceptions
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
              <div className="text-xs text-zinc-500 uppercase font-semibold">Address-Info Topology Coverage</div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  q?.addressInfoAllContained ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {q?.addressInfoAllContained ? '100% CONTAINED' : 'OVERRUN / UNMAPPED'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {q?.addressInfoReconciliations.length} segment record spans evaluated
              </div>
            </div>
          </div>

          {/* Module Reconciliation Exceptions Panel */}
          {showExceptions && q && q.moduleRangeReconciliation.exceptions.length > 0 && (
            <div className="p-4 rounded-lg bg-zinc-900 border border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Module Range Reconciliation Exceptions ({q.moduleRangeReconciliation.exceptions.length})
                </span>
                <button
                  onClick={() => setShowExceptions(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Close
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs text-zinc-300">
                {q.moduleRangeReconciliation.exceptions.map((exc) => (
                  <div key={exc.globalIndex} className="p-1.5 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <span className="text-amber-300 font-bold">{exc.name}</span> (Mod {exc.moduleIndex}, Seg {exc.watcomMapSegment}, Offset {exc.watcomMapOffsetHex}):{' '}
                    <span className="text-zinc-400">{exc.detail}</span> [{exc.status}]
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Segment Qualification Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Watcom Segment to LE Object Mechanical Qualifications
            </h3>
            <div className="space-y-3">
              {q?.segmentQualifications.map((sq) => (
                <div key={sq.watcomSegment} className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-zinc-200">
                        Watcom Segment {sq.watcomSegment} ({sq.watcomSegmentHex})
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                          sq.qualificationStatus === 'UNIQUELY_QUALIFIED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : sq.qualificationStatus === 'AMBIGUOUS'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {sq.qualificationStatus}
                        {sq.qualifiedObjectNumber !== null && ` -> LE Object ${sq.qualifiedObjectNumber}`}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        runtimeAddressVerified: false
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 bg-zinc-950/60 p-2 rounded border border-zinc-800/80">
                    {sq.qualificationReason}
                  </p>

                  {/* Pairings details table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-800/60 text-zinc-400 font-mono">
                        <tr>
                          <th className="p-2">LE Object</th>
                          <th className="p-2">Base / Virtual Size</th>
                          <th className="p-2">Capabilities</th>
                          <th className="p-2">Symbol Containment</th>
                          <th className="p-2">Max Symbol Offset</th>
                          <th className="p-2">Addr-Info Span</th>
                          <th className="p-2">Verdict</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 font-mono">
                        {sq.testedPairings.map((p) => (
                          <tr key={p.leObjectNumber} className="hover:bg-zinc-800/30">
                            <td className="p-2 font-bold text-zinc-300">Object {p.leObjectNumber}</td>
                            <td className="p-2 text-zinc-400">{p.leObjectRelocBaseHex} / {p.leObjectVirtualSizeHex}</td>
                            <td className="p-2 text-zinc-400">
                              {p.leObjectIsReadable ? 'R' : '-'}{p.leObjectIsWritable ? 'W' : '-'}{p.leObjectIsExecutable ? 'X' : '-'}
                            </td>
                            <td className="p-2">
                              <span className={p.allSymbolsContained ? 'text-emerald-400' : 'text-red-400'}>
                                {p.symbolsContainedInVirtualSize} / {p.totalSymbolsInSegment}
                              </span>
                            </td>
                            <td className="p-2 text-zinc-400">{p.maxSymbolOffsetHex}</td>
                            <td className="p-2 text-zinc-400">
                              {p.addressInfoDeclaredSpanHex}{' '}
                              <span className={p.addressInfoFitsVirtualSize ? 'text-emerald-400' : 'text-red-400'}>
                                ({p.addressInfoFitsVirtualSize ? 'Fits' : 'Overruns'})
                              </span>
                            </td>
                            <td className="p-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                  p.verdict === 'COMPATIBLE'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : p.verdict === 'PARTIAL_MISMATCH'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : 'bg-red-950 text-red-400 border border-red-800'
                                }`}
                              >
                                {p.verdict}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unresolved LE Coverage Intervals */}
          {q && q.unresolvedCoverage.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Unresolved LE Object Coverage Intervals ({q.unresolvedCoverage.length})
              </h3>
              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-800/80 text-zinc-400 font-mono">
                    <tr>
                      <th className="p-2">LE Object</th>
                      <th className="p-2">Interval Span</th>
                      <th className="p-2">Length</th>
                      <th className="p-2">Classification</th>
                      <th className="p-2">Initial Stack Correlation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 font-mono text-zinc-300">
                    {q.unresolvedCoverage.map((unc, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        <td className="p-2 font-bold text-zinc-200">Object {unc.leObjectNumber}</td>
                        <td className="p-2">{unc.startOffsetHex}..{unc.endOffsetHex}</td>
                        <td className="p-2">{unc.byteLengthHex} ({unc.byteLength.toLocaleString()} B)</td>
                        <td className="p-2">
                          <span className="text-amber-400 font-bold">{unc.classification}</span>
                        </td>
                        <td className="p-2 text-zinc-400">
                          {unc.initialStackEspRelation ?? 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Address-Info Coverage Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Address-Information Class Topology Coverage (Page-Level Inspection)
            </h3>
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-800/80 text-zinc-400 font-mono">
                  <tr>
                    <th className="p-2">Record #</th>
                    <th className="p-2">Segment</th>
                    <th className="p-2">Start Offset</th>
                    <th className="p-2">Declared Span</th>
                    <th className="p-2">Entries</th>
                    <th className="p-2">Matched LE Object</th>
                    <th className="p-2">Pages Inspected</th>
                    <th className="p-2">Page Breakdown</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono text-zinc-300">
                  {q?.addressInfoReconciliations.map((air) => (
                    <tr key={air.segInfoIndex} className="hover:bg-zinc-800/30">
                      <td className="p-2 text-zinc-500">#{air.segInfoIndex}</td>
                      <td className="p-2 font-bold text-zinc-200">{air.watcomSegmentHex}</td>
                      <td className="p-2">{air.startAddressOffsetHex}</td>
                      <td className="p-2">{air.totalSpanBytesHex} ({air.totalSpanBytes.toLocaleString()} B)</td>
                      <td className="p-2">{air.entryCount}</td>
                      <td className="p-2 text-zinc-300">
                        {air.matchedLeObjectNumber !== null ? `Object ${air.matchedLeObjectNumber}` : 'Unmapped'}
                      </td>
                      <td className="p-2 text-zinc-300">
                        {air.intersectingPagesCount} pages
                      </td>
                      <td className="p-2 text-zinc-400">
                        {air.fullyFileBackedPagesCount} full, {air.partiallyFileBackedPagesCount} partial, {air.zeroFilledPagesCount} zero, {air.virtualUnbackedPagesCount} unbacked
                      </td>
                      <td className="p-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            air.coverageStatus === 'FULL_CONTAINMENT'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : air.coverageStatus === 'PARTIAL_FILE_BACKED'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-red-950 text-red-400 border border-red-800'
                          }`}
                        >
                          {air.coverageStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Symbol Coordinates Inventory Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Global Symbol Coordinate Inventory ({filteredSymbols.length} / {q?.symbolCoordinateInventory.length} symbols)
              </h3>
              <div className="flex items-center gap-3">
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1"
                >
                  <option value="ALL">All Segments</option>
                  {q?.segmentQualifications.map((sq) => (
                    <option key={sq.watcomSegment} value={sq.watcomSegment}>
                      Segment {sq.watcomSegment} ({sq.watcomSegmentHex})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedBacking}
                  onChange={(e) => setSelectedBacking(e.target.value as PhysicalBackingCategory | 'ALL')}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1"
                >
                  <option value="ALL">All Backing Types</option>
                  <option value="FILE_BACKED">File Backed</option>
                  <option value="PAGE_PADDING">Page Padding</option>
                  <option value="ZERO_FILLED_PAGE">Zero Filled</option>
                  <option value="VIRTUAL_UNBACKED_BEYOND_PAGE_TABLE">Beyond Page Table</option>
                  <option value="PAGE_MAP_ENTRY_UNAVAILABLE">Unavailable</option>
                  <option value="OUTSIDE_OBJECT">Outside Object</option>
                  <option value="UNKNOWN_NON_FILE_BACKED">Unknown</option>
                </select>
                <input
                  type="text"
                  placeholder="Filter symbols..."
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-3 py-1 w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900 max-h-96">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-800/80 text-zinc-400 font-mono sticky top-0">
                  <tr>
                    <th className="p-2">Symbol Name</th>
                    <th className="p-2">Map Seg</th>
                    <th className="p-2">Map Offset</th>
                    <th className="p-2">Kind</th>
                    <th className="p-2">LE Object</th>
                    <th className="p-2">Candidate Preferred Linear</th>
                    <th className="p-2">Physical File Offset</th>
                    <th className="p-2">Backing Category</th>
                    <th className="p-2">Module Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono text-zinc-300">
                  {filteredSymbols.slice(0, 200).map((sd) => (
                    <tr key={sd.globalIndex} className="hover:bg-zinc-800/30">
                      <td className="p-2 font-bold text-zinc-200">{sd.name}</td>
                      <td className="p-2 text-zinc-400">{sd.watcomMapSegmentHex}</td>
                      <td className="p-2 text-zinc-300">{sd.watcomMapOffsetHex}</td>
                      <td className="p-2 text-zinc-400">
                        {sd.isCode ? 'Code' : sd.isData ? 'Data' : 'Other'}
                      </td>
                      <td className="p-2 font-bold">
                        {sd.qualifiedLeObjectNumber !== null ? (
                          <span className="text-emerald-400">Object {sd.qualifiedLeObjectNumber}</span>
                        ) : (
                          <span className="text-zinc-500">Unmapped</span>
                        )}
                      </td>
                      <td className="p-2 text-zinc-200 font-mono">
                        {sd.candidatePreferredLinearAddressHex ?? '-'}
                      </td>
                      <td className="p-2 font-mono">
                        {sd.physicalFileOffsetHex ? (
                          <span className="text-cyan-400">{sd.physicalFileOffsetHex}</span>
                        ) : (
                          <span className="text-zinc-500">None</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            sd.physicalBackingCategory === 'FILE_BACKED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {sd.physicalBackingCategory}
                        </span>
                      </td>
                      <td className="p-2 text-zinc-400 text-[10px]">
                        {sd.moduleRangeReconciliation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSymbols.length > 200 && (
                <div className="p-2 text-center text-xs text-zinc-500 bg-zinc-950 border-t border-zinc-800">
                  Showing first 200 of {filteredSymbols.length} matching symbols. Refine search filter to inspect others.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

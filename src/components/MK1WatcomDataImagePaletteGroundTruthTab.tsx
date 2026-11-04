import React, { useMemo, useState } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  createMK1WatcomDataImagePaletteGroundTruthExport,
} from '../games/mk1/research/watcomDataImagePaletteGroundTruth';
import {
  MK1WatcomDataImagePaletteGroundTruthReport,
} from '../games/mk1/research/watcomDataImagePaletteGroundTruthTypes';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Palette,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  source: DirectorySource;
  report: MK1WatcomDataImagePaletteGroundTruthReport | null;
  isRunning: boolean;
  error: string | null;
  onRun: () => void;
}

function boolLabel(v: boolean): string {
  return v ? 'YES' : 'NO';
}

export function MK1WatcomDataImagePaletteGroundTruthTab({
  source,
  report,
  isRunning,
  error,
  onRun,
}: Props) {
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number | null>(null);
  const isRealSource = Boolean(source && !source.isSynthetic);

  const selectedRecord = useMemo(() => {
    if (!report || report.paletteRecords.length === 0) return null;
    const idx = selectedRecordIndex ?? report.kanoPalettes.kanoP?.recordIndex ?? 0;
    return report.paletteRecords.find((r) => r.recordIndex === idx) ?? report.paletteRecords[0];
  }, [report, selectedRecordIndex]);

  const handleDownloadExport = () => {
    if (!report) return;
    try {
      const exportData = createMK1WatcomDataImagePaletteGroundTruthExport(report);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mk1_watcom_data_image_palette_ground_truth_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(`Authoritative export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-zinc-100">
              Watcom Static Data / Palette Ground Truth
            </h3>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
              Pass 1E.3D.1
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Qualifies the Segment-2 static-file base from two independent fixture anchors, then tests every unique NEWPALS.ASM DATA-symbol offset as a structural palette record. LE page-map coordinates are shown only as a competing model.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all ${
              isRunning
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Analyzing Fixture...' : report ? 'Re-run 1E.3D.1' : 'Run 1E.3D.1'}
          </button>
          {report && isRealSource && (
            <button
              onClick={handleDownloadExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-900/60"
            >
              <Download className="w-4 h-4" />
              Export v2 JSON
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3 text-xs font-mono">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Ground Truth Derivation Error</div>
            <div className="text-red-300/90 mt-1">{error}</div>
          </div>
        </div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500 font-mono">Static Base</div>
              <div className={`font-mono text-sm font-bold mt-1 ${report.decision.staticDataBaseEstablished ? 'text-emerald-300' : 'text-amber-300'}`}>
                {report.staticDataBaseQualification.status}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {report.staticDataBaseQualification.qualifiedBaseHex ?? 'unqualified'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500 font-mono">NEWPALS Tiling</div>
              <div className={`font-mono text-sm font-bold mt-1 ${report.moduleTiling?.exactTiling ? 'text-emerald-300' : 'text-amber-300'}`}>
                {report.moduleTiling?.classification ?? 'NOT RUN'}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {report.moduleTiling ? `${report.moduleTiling.parsedRecordCount}/${report.moduleTiling.uniqueOffsetCount} records` : 'No module qualification'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500 font-mono">Kano Palette</div>
              <div className={`font-mono text-sm font-bold mt-1 ${report.kanoPalettes.kanoP ? 'text-emerald-300' : 'text-zinc-500'}`}>
                {report.kanoPalettes.kanoP ? `${report.kanoPalettes.kanoP.declaredLength} colors` : 'NOT QUALIFIED'}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                KANO3 adjacency: {report.kanoPalettes.adjacent === null ? 'N/A' : boolLabel(report.kanoPalettes.adjacent)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500 font-mono">TupleTable</div>
              <div className={`font-mono text-sm font-bold mt-1 ${report.tupleTableValidation.patternVerified ? 'text-emerald-300' : 'text-amber-300'}`}>
                {report.tupleTableValidation.classification}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {report.tupleTableValidation.matchingEntries}/{report.tupleTableValidation.entriesChecked} pattern matches
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2 mb-4">
              {report.decision.staticDataBaseEstablished ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              )}
              <h4 className="font-semibold text-sm text-zinc-100">1. Independent Static-Data Base Qualification</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
                <div className="text-zinc-500">Method A: handle table delta</div>
                <div className="text-zinc-100 mt-1">{report.staticDataBaseQualification.candidateBaseAHex ?? 'N/A'}</div>
              </div>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
                <div className="text-zinc-500">Method B: string-area base</div>
                <div className="text-zinc-100 mt-1">{report.staticDataBaseQualification.candidateBaseBHex ?? 'N/A'}</div>
              </div>
              <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg">
                <div className="text-zinc-500">Independent agreement</div>
                <div className={report.staticDataBaseQualification.basesAgree ? 'text-emerald-300 mt-1' : 'text-amber-300 mt-1'}>
                  {boolLabel(report.staticDataBaseQualification.basesAgree)} / round-trip {boolLabel(report.staticDataBaseQualification.anchorRoundTripPassed)}
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800 text-xs text-zinc-400">
              LE page-map comparison: <span className="font-mono text-zinc-200">{report.lePageMapComparison.relationship}</span>{' '}
              ({report.lePageMapComparison.candidatePhysicalOffsetHex ?? 'unavailable'}). This comparison does not qualify or veto the static-file base.
            </div>
          </div>

          <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h4 className="font-semibold text-sm text-zinc-100">2. Exact NEWPALS.ASM Structural Tiling</h4>
            </div>
            {report.paletteModule && report.moduleTiling ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
                  <div><span className="text-zinc-500">Span:</span> {report.paletteModule.startOffsetHex}..{report.paletteModule.endOffsetHex}</div>
                  <div><span className="text-zinc-500">Symbols:</span> {report.paletteModule.symbolCount}</div>
                  <div><span className="text-zinc-500">Unique offsets:</span> {report.paletteModule.uniqueOffsetCount}</div>
                  <div><span className="text-zinc-500">Gaps:</span> {report.moduleTiling.gapCount}</div>
                  <div><span className="text-zinc-500">Overlaps:</span> {report.moduleTiling.overlapCount}</div>
                </div>
                <div className={`p-3 rounded-lg border text-xs ${report.moduleTiling.exactTiling ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' : 'bg-amber-950/30 border-amber-800/60 text-amber-200'}`}>
                  {report.moduleTiling.exactTiling
                    ? 'Every unique NEWPALS DATA-symbol offset parsed structurally and the records tile the complete module with no gaps or overlaps.'
                    : `Module did not qualify: ${report.moduleTiling.parseFailures.length} parse failures, ${report.moduleTiling.gapCount} gaps, ${report.moduleTiling.overlapCount} overlaps.`}
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500">Exact NEWPALS.ASM qualification did not run or failed closed.</div>
            )}
          </div>

          {report.paletteRecords.length > 0 && (
            <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <h4 className="font-semibold text-sm text-zinc-100 mb-3">3. Symbol-Derived Palette Records</h4>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto mb-4">
                {report.paletteRecords.map((record) => (
                  <button
                    key={record.recordIndex}
                    onClick={() => setSelectedRecordIndex(record.recordIndex)}
                    className={`px-2 py-1 rounded text-[10px] font-mono border ${selectedRecord?.recordIndex === record.recordIndex ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                  >
                    #{record.recordIndex} {record.symbolNames[0] ?? record.watcomStartOffsetHex} ({record.declaredLength})
                  </button>
                ))}
              </div>
              {selectedRecord && (
                <div className="p-4 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono mb-4">
                    <div><span className="text-zinc-500">Symbols:</span> {selectedRecord.symbolNames.join(', ')}</div>
                    <div><span className="text-zinc-500">Watcom:</span> {selectedRecord.watcomStartOffsetHex}</div>
                    <div><span className="text-zinc-500">Physical:</span> {selectedRecord.physicalFileOffsetHex}</div>
                    <div><span className="text-zinc-500">Length:</span> {selectedRecord.declaredLength}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedRecord.rgbColors.map((c, i) => (
                      <div key={i} title={`${i}: ${selectedRecord.rawColorWordsHex[i]} ${c.hex}`} className="w-7 h-7 rounded border border-zinc-700" style={{ backgroundColor: c.hex }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <h4 className="font-semibold text-sm text-zinc-100 mb-3">4. Kano Index-Model Comparison</h4>
              {report.kanoPaletteComparison ? (
                <div className="space-y-2 text-xs font-mono">
                  <div>Observed source range: {report.kanoPaletteComparison.spriteMinOpaqueIndex}..{report.kanoPaletteComparison.spriteMaxSourceIndex}</div>
                  <div>Palette length: {report.kanoPaletteComparison.paletteDeclaredLength}</div>
                  <div>Zero-based: <span className="text-zinc-200">{report.kanoPaletteComparison.zeroBasedModel.fitQuality}</span> ({report.kanoPaletteComparison.zeroBasedModel.outOfRangeCount} out of range)</div>
                  <div>One-based: <span className="text-zinc-200">{report.kanoPaletteComparison.oneBasedModel.fitQuality}</span> ({report.kanoPaletteComparison.oneBasedModel.outOfRangeCount} out of range)</div>
                  <div>Opaque index 0: <span className="text-amber-300">{report.kanoPaletteComparison.opaqueZeroResolution}</span></div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500">Comparison is gated on a verified NEWPALS module and qualified KANO_P record.</div>
              )}
            </div>

            <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <h4 className="font-semibold text-sm text-zinc-100 mb-3">5. Legacy Scanner Cross-Reference</h4>
              <div className="text-xs text-zinc-400 mb-2">
                Symbol/module-derived records outrank heuristic catalogue ranking. This section is diagnostic only.
              </div>
              <div className="text-xs font-mono text-zinc-300">
                Records compared: {report.legacyCatalogueComparison.length}<br />
                Found by legacy scanner: {report.legacyCatalogueComparison.filter((x) => x.foundByLegacyScanner).length}<br />
                Not found: {report.legacyCatalogueComparison.filter((x) => !x.foundByLegacyScanner).length}
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-start gap-3 ${report.status === 'SUCCESS' ? 'bg-emerald-950/30 border-emerald-800/60' : 'bg-amber-950/30 border-amber-800/60'}`}>
            {report.status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />}
            <div>
              <div className="font-mono text-xs font-bold text-zinc-100">{report.decision.verdict}</div>
              <div className="text-xs text-zinc-400 mt-1">{report.decision.narrative}</div>
              <div className="text-[10px] text-zinc-500 mt-2 font-mono">Runtime address mapping remains unverified. IRQSKYE/index-0 semantics remain an external lead, not fixture-derived ground truth.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

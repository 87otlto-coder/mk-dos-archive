import React, { useState, useMemo } from 'react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  probeMK1ExecutableLayout,
  createMK1ExecutableLayoutExport,
} from '../games/mk1/research/executableLayoutProbe';
import {
  MK1ExecutableLayoutReport,
} from '../games/mk1/research/executableLayoutTypes';
import { MK1PaletteScanResult } from '../games/mk1/research/paletteTypes';
import {
  correlatePalettesWithExecutableRegions,
  createMK1CompactPaletteRegionCorrelationExport,
} from '../games/mk1/research/paletteRegionCorrelation';
import { MK1PaletteReferenceReconResult } from '../games/mk1/research/paletteReferenceReconnaissanceTypes';
import { MK1PaletteOccurrenceContextResult } from '../games/mk1/research/paletteOccurrenceContextTypes';
import { MK1PaletteRepeatedStructureResult } from '../games/mk1/research/paletteRepeatedStructureTypes';
import { MK1PaletteCycleLayoutResult } from '../games/mk1/research/paletteCycleLayoutTypes';
import { MK1PalettePhaseHarmonicResult } from '../games/mk1/research/palettePhaseHarmonicTypes';
import { MK1PaletteReferenceReconTab } from './MK1PaletteReferenceReconTab';
import { APP_NAME, APP_VERSION, APP_MILESTONE } from '../appMetadata';
import { AnalysisFailurePanel } from './AnalysisFailurePanel';
import { ResearchErrorBoundary } from './ResearchErrorBoundary';
import { createOperationId, logError } from '../core/diagnostics/diagnosticLogger';
import {
  Layers,
  Cpu,
  FileCode,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Anchor,
  Search,
  Database,
  Info,
  Palette,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  MapPin,
  GitBranch,
  GitMerge,
} from 'lucide-react';
import {
  discoverMK1WatcomDebugContainer,
  createMK1WatcomDebugDiscoveryExport,
  MK1WatcomDebugDiscoveryReport,
} from '../games/mk1/research/watcomDebugContainerDiscovery';
import { MK1WatcomPermanentClassesTab } from './MK1WatcomPermanentClassesTab';
import { MK1WatcomPermanentClassesReport } from '../games/mk1/research/watcomPermanentClassInventory';
import { MK1WatcomAddressModelTab } from './MK1WatcomAddressModelTab';
import {
  qualifyMK1WatcomAddressModel,
  MK1WatcomAddressModelReport,
} from '../games/mk1/research/watcomAddressModelInventory';
import { MK1WatcomDataImagePaletteGroundTruthTab } from './MK1WatcomDataImagePaletteGroundTruthTab';
import {
  executeWatcomDataImagePaletteGroundTruth,
} from '../games/mk1/research/watcomDataImagePaletteGroundTruth';
import { MK1WatcomDataImagePaletteGroundTruthReport } from '../games/mk1/research/watcomDataImagePaletteGroundTruthTypes';
import { MK1KanoPaletteSelectionReferenceGraphTab } from './MK1KanoPaletteSelectionReferenceGraphTab';
import { executeKanoPaletteSelectionReferenceGraph } from '../games/mk1/research/kanoPaletteSelectionReferenceGraph';
import { MK1KanoPaletteSelectionReferenceGraphReport } from '../games/mk1/research/kanoPaletteSelectionReferenceGraphTypes';
import { MK1KanoPaletteSelectionSemanticsTab } from './MK1KanoPaletteSelectionSemanticsTab';
import { executeKanoPaletteSelectionSemantics } from '../games/mk1/research/kanoPaletteSelectionSemantics';
import { MK1KanoPaletteSelectionSemanticsReport } from '../games/mk1/research/kanoPaletteSelectionSemanticsTypes';
import { MK1PaletteSetupTransferSemanticsTab } from './MK1PaletteSetupTransferSemanticsTab';
import { executePaletteSetupTransferSemantics } from '../games/mk1/research/paletteSetupTransferSemantics';
import { MK1PaletteSetupTransferSemanticsReport } from '../games/mk1/research/paletteSetupTransferSemanticsTypes';

interface Props {
  source: DirectorySource;
  sharedPaletteResult?: MK1PaletteScanResult | null;
}

function toHex32(val: number): string {
  return '0x' + (val >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export function MK1ExecutableLayoutView({ source, sharedPaletteResult }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progressVal, setProgressVal] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastError, setLastError] = useState<unknown | null>(null);
  const [lastOperationId, setLastOperationId] = useState<string | null>(null);
  const [report, setReport] = useState<MK1ExecutableLayoutReport | null>(null);

  const [activeTab, setActiveTab] = useState<'topology' | 'objects' | 'anchors' | 'signatures' | 'pagemap' | 'palettes' | 'recon' | 'watcom' | 'watcom_classes' | 'watcom_address_model' | 'watcom_palette_ground_truth' | 'kano_palette_reference_graph' | 'kano_palette_selection_semantics' | 'palette_setup_transfer_semantics'>('topology');
  const [watcomReport, setWatcomReport] = useState<MK1WatcomDebugDiscoveryReport | null>(null);
  const [isWatcomRunning, setIsWatcomRunning] = useState(false);
  const [watcomError, setWatcomError] = useState<string | null>(null);

  const [permanentClassesReport, setPermanentClassesReport] = useState<MK1WatcomPermanentClassesReport | null>(null);
  const [isPermanentClassesRunning, setIsPermanentClassesRunning] = useState(false);
  const [permanentClassesError, setPermanentClassesError] = useState<string | null>(null);

  const [addressModelReport, setAddressModelReport] = useState<MK1WatcomAddressModelReport | null>(null);
  const [isAddressModelRunning, setIsAddressModelRunning] = useState(false);
  const [addressModelError, setAddressModelError] = useState<string | null>(null);

  const [paletteGroundTruthReport, setPaletteGroundTruthReport] = useState<MK1WatcomDataImagePaletteGroundTruthReport | null>(null);
  const [isPaletteGroundTruthRunning, setIsPaletteGroundTruthRunning] = useState(false);
  const [paletteGroundTruthError, setPaletteGroundTruthError] = useState<string | null>(null);

  const [kanoReferenceGraphReport, setKanoReferenceGraphReport] = useState<MK1KanoPaletteSelectionReferenceGraphReport | null>(null);
  const [isKanoReferenceGraphRunning, setIsKanoReferenceGraphRunning] = useState(false);
  const [kanoReferenceGraphError, setKanoReferenceGraphError] = useState<string | null>(null);

  const [kanoSelectionSemanticsReport, setKanoSelectionSemanticsReport] = useState<MK1KanoPaletteSelectionSemanticsReport | null>(null);
  const [isKanoSelectionSemanticsRunning, setIsKanoSelectionSemanticsRunning] = useState(false);
  const [kanoSelectionSemanticsError, setKanoSelectionSemanticsError] = useState<string | null>(null);

  const [paletteSetupTransferReport, setPaletteSetupTransferReport] = useState<MK1PaletteSetupTransferSemanticsReport | null>(null);
  const [isPaletteSetupTransferRunning, setIsPaletteSetupTransferRunning] = useState(false);
  const [paletteSetupTransferError, setPaletteSetupTransferError] = useState<string | null>(null);

  const isRealDirectorySource = Boolean(source && !source.isSynthetic);

  const handleRunKanoReferenceGraph = async () => {
    setIsKanoReferenceGraphRunning(true);
    setKanoReferenceGraphError(null);
    try {
      const res = await executeKanoPaletteSelectionReferenceGraph(source);
      setKanoReferenceGraphReport(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setKanoReferenceGraphError(msg);
      setKanoReferenceGraphReport(null);
    } finally {
      setIsKanoReferenceGraphRunning(false);
    }
  };


  const handleRunKanoSelectionSemantics = async () => {
    setIsKanoSelectionSemanticsRunning(true);
    setKanoSelectionSemanticsError(null);
    try {
      const res = await executeKanoPaletteSelectionSemantics(source, {
        referenceGraphReport: kanoReferenceGraphReport ?? undefined,
      });
      setKanoSelectionSemanticsReport(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setKanoSelectionSemanticsError(msg);
      setKanoSelectionSemanticsReport(null);
    } finally {
      setIsKanoSelectionSemanticsRunning(false);
    }
  };


  const handleRunPaletteSetupTransfer = async () => {
    setIsPaletteSetupTransferRunning(true);
    setPaletteSetupTransferError(null);
    try {
      const res = await executePaletteSetupTransferSemantics(source, {
        selectionSemanticsReport: kanoSelectionSemanticsReport ?? undefined,
      });
      setPaletteSetupTransferReport(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPaletteSetupTransferError(msg);
      setPaletteSetupTransferReport(null);
    } finally {
      setIsPaletteSetupTransferRunning(false);
    }
  };

  const handleRunPaletteGroundTruth = async () => {
    setIsPaletteGroundTruthRunning(true);
    setPaletteGroundTruthError(null);
    try {
      const res = await executeWatcomDataImagePaletteGroundTruth(source);
      setPaletteGroundTruthReport(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPaletteGroundTruthError(msg);
      setPaletteGroundTruthReport(null);
    } finally {
      setIsPaletteGroundTruthRunning(false);
    }
  };

  const handleRunAddressModel = async () => {
    setIsAddressModelRunning(true);
    setAddressModelError(null);
    try {
      const res = await qualifyMK1WatcomAddressModel(source);
      setAddressModelReport(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAddressModelError(msg);
      setAddressModelReport(null);
    } finally {
      setIsAddressModelRunning(false);
    }
  };

  const handleRunWatcomDiscovery = async () => {
    setIsWatcomRunning(true);
    setWatcomError(null);
    try {
      const res = await discoverMK1WatcomDebugContainer(source);
      setWatcomReport(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setWatcomError(msg);
      setWatcomReport(null);
    } finally {
      setIsWatcomRunning(false);
    }
  };

  const handleExportWatcomDiscoveryJson = () => {
    if (!watcomReport) return;
    if (!isRealDirectorySource || watcomReport.provenance.synthetic) {
      setWatcomError('Authoritative export is disabled: real MK1 fixture is not loaded.');
      return;
    }

    try {
      const exportData = createMK1WatcomDebugDiscoveryExport(watcomReport);
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `mk1_watcom_debug_container_discovery_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setWatcomError(`Export failed: ${msg}`);
    }
  };
  const [reconResult, setReconResult] = useState<MK1PaletteReferenceReconResult | null>(null);
  const [isReconRunning, setIsReconRunning] = useState(false);
  const [contextResult, setContextResult] = useState<MK1PaletteOccurrenceContextResult | null>(null);
  const [isContextRunning, setIsContextRunning] = useState(false);
  const [repeatedStructureResult, setRepeatedStructureResult] = useState<MK1PaletteRepeatedStructureResult | null>(null);
  const [isRepeatedStructureRunning, setIsRepeatedStructureRunning] = useState(false);
  const [cycleLayoutResult, setCycleLayoutResult] = useState<MK1PaletteCycleLayoutResult | null>(null);
  const [isCycleLayoutRunning, setIsCycleLayoutRunning] = useState(false);
  const [phaseHarmonicResult, setPhaseHarmonicResult] = useState<MK1PalettePhaseHarmonicResult | null>(null);
  const [isPhaseHarmonicRunning, setIsPhaseHarmonicRunning] = useState(false);
  const [runRecon, setRunRecon] = useState(false);
  const [showResearchDetail, setShowResearchDetail] = useState(false);
  const [showSecondaryRollup, setShowSecondaryRollup] = useState(true);

  // Authoritative physical region correlation derived in-memory
  const correlationResult = useMemo(() => {
    if (!report || !sharedPaletteResult) return null;
    return correlatePalettesWithExecutableRegions(
      sharedPaletteResult,
      report.topology,
      report.objects,
      {
        exePath: report.exePath,
        exeSize: report.exeSize,
        pageSize: report.parsedHeader?.pageSize || 4096,
      },
    );
  }, [report, sharedPaletteResult]);

  const handleRunProbe = async (withRecon = runRecon) => {
    const opId = createOperationId('exe-layout');
    setLastOperationId(opId);
    setLastError(null);
    setIsScanning(true);
    setErrorMsg(null);
    setProgressVal(0);

    try {
      const result = await probeMK1ExecutableLayout(source, {
        operationId: opId,
        runReconnaissance: withRecon,
        onProgress: (step, prog) => {
          setProgressMsg(step);
          setProgressVal(prog);
        },
      });

      setReport(result);
    } catch (err: unknown) {
      logError('research-mk1', 'executable-layout', opId, err, { targetPath: 'MK1.EXE' });
      setLastError(err);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Failed to analyze MK1 executable layout: ${msg}`);
      setReport(null);
    } finally {
      setIsScanning(false);
      setProgressMsg(null);
    }
  };

  const handleExportJson = () => {
    if (!report) return;

    const exportData = createMK1ExecutableLayoutExport(report, {
      name: APP_NAME,
      version: APP_VERSION,
      milestone: APP_MILESTONE,
    });

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_executable_layout_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCorrelationJson = () => {
    if (!correlationResult || !report || !sharedPaletteResult) return;

    const exportData = createMK1CompactPaletteRegionCorrelationExport(
      correlationResult,
      sharedPaletteResult,
      report.topology,
      {
        name: APP_NAME,
        version: APP_VERSION,
        milestone: APP_MILESTONE,
      },
    );

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `mk1_palette_region_correlation_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedPayload = report?.boundLayout.selectedPayloadCandidate;
  const header = report?.parsedHeader;

  return (
    <ResearchErrorBoundary
      subsystem="research-mk1"
      title="MK1 Executable Layout Viewer Error"
      onReset={() => {
        setReport(null);
        setErrorMsg(null);
        setLastError(null);
      }}
    >
      <section className="mb-8 rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-xl text-zinc-100">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                MK1 Bound Executable & LE Object Map
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Protected-mode Linear Executable (LE) payload discovery, 24-byte object table, 24-bit physical page map, and memory translation model.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunProbe(runRecon)}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Analyzing Layout...' : report ? 'Re-Analyze Layout' : 'Analyze Executable Layout'}
          </button>

          {report && (
            <button
              onClick={handleExportJson}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs tracking-wide transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              Export Layout JSON
            </button>
          )}
        </div>
      </div>

      {/* Progress & Error States */}
      {isScanning && (
        <div className="my-6 p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-400 mb-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            {progressMsg || 'Processing binary structures...'}
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden max-w-md mx-auto">
            <div
              className="bg-amber-500 h-full transition-all duration-200"
              style={{ width: `${Math.round(progressVal * 100)}%` }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <AnalysisFailurePanel
          error={lastError || errorMsg}
          operationId={lastOperationId || undefined}
          subsystem="research-mk1"
          operation="executable-layout"
          context={{ targetPath: 'MK1.EXE' }}
          onRetry={() => handleRunProbe(runRecon)}
        />
      )}

      {/* Initial Empty State */}
      {!isScanning && !report && !errorMsg && (
        <div className="py-12 text-center text-zinc-500">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-30 text-zinc-400" />
          <p className="text-sm text-zinc-300 font-medium">No Executable Layout Analysis Performed</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-lg mx-auto">
            Click &quot;Analyze Executable Layout&quot; to scan MK1.EXE for embedded 32-bit Linear Executable (LE) payloads, parse the object table, and map physical file offsets to protected-mode loaded addresses.
          </p>
        </div>
      )}

      {/* Analysis Results View */}
      {report && (
        <div className="mt-6 space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">DOS Stub Wrapper</div>
              <div className="text-sm font-semibold text-zinc-200 mt-1 font-mono">
                {report.boundLayout.mzWrapper.mzExtendedHeaderOffsetHex
                  ? `e_lfanew: ${report.boundLayout.mzWrapper.mzExtendedHeaderOffsetHex}`
                  : 'Standard MZ Stub'}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {report.boundLayout.mzWrapper.eLfanewDiscrepancy ? 'Internal Bound Payload' : 'Direct Link'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">LE Discovery</div>
              <div className="text-sm font-semibold text-amber-400 mt-1 font-mono">
                {selectedPayload ? selectedPayload.fileOffsetHex : 'None'}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {selectedPayload ? `${selectedPayload.validation.confidence.toUpperCase()} Confidence` : 'No valid header'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Target Architecture</div>
              <div className="text-sm font-semibold text-zinc-200 mt-1 font-mono">
                {header ? `${header.cpuTypeDescription}` : 'N/A'}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {header ? header.targetOsDescription : 'N/A'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Objects / Pages</div>
              <div className="text-sm font-semibold text-zinc-200 mt-1 font-mono">
                {header ? `${header.objectCount} Objects / ${header.modulePageCount} Pages` : 'N/A'}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {header ? `Page Size: ${header.pageSize} bytes` : 'N/A'}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Module Boundary / Tail</div>
              <div className="text-sm font-semibold text-amber-400 mt-1 font-mono">
                {report.topology.boundaries.highestFileBackedPageEndHex}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Post-Module Tail: {report.topology.postModuleTail.byteLength.toLocaleString()} B ({report.topology.postModuleTail.percentageOfTotalExecutable}%)
              </div>
            </div>
          </div>

          {/* Bound Payload Header Details Banner */}
          {header && (
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/90 text-xs">
              <div className="font-semibold text-zinc-200 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  LE Header Metadata (Physical File Offset {selectedPayload?.fileOffsetHex})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                  VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 font-mono text-[11px]">
                <div>
                  <span className="text-zinc-500">Entry Point:</span>{' '}
                  <span className="text-zinc-300">Obj {header.entryObject} : {header.entryEipHex}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Stack:</span>{' '}
                  <span className="text-zinc-300">Obj {header.stackObject} : {header.stackEspHex}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Data Pages Offset:</span>{' '}
                  <span className="text-zinc-300">0x{header.dataPagesFileOffset.toString(16).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Object Table Offset:</span>{' '}
                  <span className="text-zinc-300">{header.objectTableFileOffset.toString(16).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Page Map Offset:</span>{' '}
                  <span className="text-zinc-300">{header.objectPageMapFileOffset.toString(16).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Heap Size:</span>{' '}
                  <span className="text-zinc-300">{header.heapSize} bytes</span>
                </div>
                <div>
                  <span className="text-zinc-500">Debug Info:</span>{' '}
                  <span className="text-zinc-300">
                    {report.debugInfo.debugInfoPresent
                      ? `${report.debugInfo.debugInfoFileOffsetHex} (${report.debugInfo.debugInfoLength} B)`
                      : 'None declared'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Auto Data Object:</span>{' '}
                  <span className="text-zinc-300">Obj {header.autoDataObject}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-800 gap-1 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('topology')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'topology'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Executable Topology & Regions ({report.topology.regions.length})
            </button>
            <button
              onClick={() => setActiveTab('objects')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'objects'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Objects & Backing ({report.objects.length})
            </button>
            <button
              onClick={() => setActiveTab('anchors')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'anchors'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Known MK1 Anchors ({report.knownAnchors.length})
            </button>
            <button
              onClick={() => setActiveTab('signatures')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'signatures'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              LE Signature Candidates ({report.boundLayout.rawLeOccurrencesCount})
            </button>
            <button
              onClick={() => setActiveTab('pagemap')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'pagemap'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Page Map ({report.pageMapDiagnostics?.totalEntries ?? report.pageMap.length})
            </button>
            <button
              onClick={() => setActiveTab('palettes')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'palettes'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Palette × Executable Regions
            </button>
            <button
              onClick={() => setActiveTab('recon')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'recon'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Reference Recon {reconResult ? `(${reconResult.globalSummary.targetsWithExternalExactOccurrences} hits)` : ''}
            </button>
            <button
              onClick={() => setActiveTab('watcom')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'watcom'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Watcom Debug Tail (1E.3A.1)</span>
              {watcomReport && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  watcomReport.discovery.status === 'DETECTED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {watcomReport.discovery.status}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('watcom_classes')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'watcom_classes'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Watcom Classes (1E.3B)</span>
              {permanentClassesReport && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  permanentClassesReport.status === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {permanentClassesReport.status === 'SUCCESS'
                    ? `${permanentClassesReport.result.globalSymbols.symbolCount} syms`
                    : permanentClassesReport.status}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('watcom_address_model')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'watcom_address_model'
                  ? 'border-amber-500 text-amber-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Watcom Address Model (1E.3C)</span>
              {addressModelReport && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  addressModelReport.status === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {addressModelReport.qualification.overallMappingState}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('watcom_palette_ground_truth')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'watcom_palette_ground_truth'
                  ? 'border-emerald-500 text-emerald-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              <span>Palette Ground Truth (1E.3D.1)</span>
              {paletteGroundTruthReport && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  paletteGroundTruthReport.status === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {paletteGroundTruthReport.paletteRecords.length} pals
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('kano_palette_reference_graph')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'kano_palette_reference_graph'
                  ? 'border-cyan-500 text-cyan-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kano Palette Graph (1E.3E)</span>
              {kanoReferenceGraphReport && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  kanoReferenceGraphReport.status === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {kanoReferenceGraphReport.status}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('kano_palette_selection_semantics')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'kano_palette_selection_semantics'
                  ? 'border-violet-500 text-violet-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5 text-violet-400" />
              <span>Palette Selection Semantics (1E.3F)</span>
              {kanoSelectionSemanticsReport && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  kanoSelectionSemanticsReport.status === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {kanoSelectionSemanticsReport.status}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('palette_setup_transfer_semantics')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'palette_setup_transfer_semantics'
                  ? 'border-orange-500 text-orange-400 bg-zinc-800/40'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              <span>Palette Setup / Transfer (1E.3G)</span>
              {paletteSetupTransferReport && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  paletteSetupTransferReport.status === 'SUCCESS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {paletteSetupTransferReport.status}
                </span>
              )}
            </button>
          </div>

          {/* TAB 0: EXECUTABLE TOPOLOGY & REGIONS */}
          {activeTab === 'topology' && (
            <div className="space-y-6">
              {/* Module Boundary & Post-Module Tail Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      Module Boundary Derivation
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300">
                      EMPIRICALLY DERIVED
                    </span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-500">True File-Backed Module End:</span>
                      <span className="text-amber-400 font-bold">{report.topology.boundaries.highestFileBackedPageEndHex}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-500">Highest Physical Page:</span>
                      <span className="text-zinc-300">
                        {report.pageMapDiagnostics.maxDecodedPhysicalPageNumber !== null
                          ? `p.${report.pageMapDiagnostics.maxDecodedPhysicalPageNumber}`
                          : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-500">Header-Derived Page Data End:</span>
                      <span className="text-zinc-400">{report.topology.boundaries.headerDerivedPageDataEndHex}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-500">Discrepancy (Sparse / Unbacked):</span>
                      <span className="text-zinc-300">{report.topology.boundaries.discrepancyBytes.toLocaleString()} bytes</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed pt-1">
                    {report.topology.boundaries.discrepancyExplanation}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200 flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      Post-Module Tail Analysis
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300">
                      APP-NEUTRAL REGION
                    </span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-500">Tail Physical Span:</span>
                      <span className="text-cyan-300 font-bold">
                        [{report.topology.postModuleTail.startOffsetHex} .. {report.topology.postModuleTail.endOffsetHex})
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-500">Tail Size:</span>
                      <span className="text-zinc-200">
                        {report.topology.postModuleTail.byteLength.toLocaleString()} bytes ({report.topology.postModuleTail.percentageOfTotalExecutable}% of file)
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-500">Structural Purpose:</span>
                      <span className="text-zinc-400 font-sans">{report.topology.postModuleTail.purpose}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-500">Contained Known Anchors:</span>
                      <span className="text-amber-400 font-bold">
                        {report.topology.postModuleTail.containedAnchorNames.length > 0
                          ? report.topology.postModuleTail.containedAnchorNames.join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed pt-1">
                    This post-module region follows the last mapped physical LE page. It is asset-class neutral: no speculative data-type assumptions are made without runtime loader or referencing evidence.
                  </p>
                </div>
              </div>

              {/* Full Executable Regions Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Full Executable Region Topology (0x00000000 .. EOF)
                  </h4>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Total File Size: {report.exeSize.toLocaleString()} bytes
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Region Name</th>
                        <th className="py-2.5 px-3">Physical File Span</th>
                        <th className="py-2.5 px-3">Byte Length</th>
                        <th className="py-2.5 px-3">% of EXE</th>
                        <th className="py-2.5 px-3">Object</th>
                        <th className="py-2.5 px-3">Purpose / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {report.topology.regions.map((region) => {
                        const badgeStyle =
                          region.regionClass === 'pre-le-prefix'
                            ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                            : region.regionClass === 'le-header-tables'
                            ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                            : region.regionClass === 'le-object-file-backed'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                            : region.regionClass === 'physical-page-padding'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                            : region.regionClass === 'physical-gap'
                            ? 'bg-orange-950/70 text-orange-300 border border-orange-800'
                            : 'bg-cyan-950/70 text-cyan-300 border border-cyan-800';

                        return (
                          <tr key={region.regionId} className="hover:bg-zinc-900/40">
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeStyle}`}>
                                {region.regionClass}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-zinc-200">
                              {region.name}
                            </td>
                            <td className="py-2.5 px-3 text-amber-400">
                              [{region.fileStartHex} .. {region.fileEndHex})
                            </td>
                            <td className="py-2.5 px-3">
                              {region.byteLength.toLocaleString()} B
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400">
                              {region.percentageOfFile}%
                            </td>
                            <td className="py-2.5 px-3">
                              {region.objectNumber !== null ? (
                                <span className="font-bold text-zinc-200">
                                  Obj {region.objectNumber}
                                </span>
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-sans text-[11px] text-zinc-300">
                              <div>{region.purpose}</div>
                              {region.notes && (
                                <div className="text-[10px] text-zinc-500 mt-0.5">{region.notes}</div>
                              )}
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

          {/* TAB 1: OBJECTS TABLE & BACKING METRICS */}
          {activeTab === 'objects' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  LE Objects & Physical File Spans
                </h4>
                <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Object</th>
                        <th className="py-2.5 px-3">Virtual Size</th>
                        <th className="py-2.5 px-3">Reloc Base</th>
                        <th className="py-2.5 px-3">Flags / Permissions</th>
                        <th className="py-2.5 px-3">Page Range</th>
                        <th className="py-2.5 px-3">Physical File Spans</th>
                        <th className="py-2.5 px-3">Role Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {report.objects.map((obj) => (
                        <tr key={obj.objectNumber} className="hover:bg-zinc-900/40">
                          <td className="py-2.5 px-3 font-bold text-amber-400">
                            Obj {obj.objectNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            {obj.virtualSizeHex} ({obj.virtualSize.toLocaleString()} B)
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {obj.relocationBaseAddressHex}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              obj.flags.executable
                                ? 'bg-purple-950/70 text-purple-300 border border-purple-800'
                                : obj.flags.writable
                                ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {obj.capabilities}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            p.{obj.pageMapIndex}..{obj.pageMapIndex + obj.pageMapEntryCount - 1} ({obj.mappedPageCount} mapped, {obj.zeroFilledPageCount} zero-filled)
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[10px] space-y-1">
                            {obj.physicalSpans.length === 0 && (
                              <span className="text-zinc-500 italic">No physical file pages (unmapped / zero-filled)</span>
                            )}
                            {obj.physicalSpans.map((span, idx) => (
                              <div key={idx} className="text-zinc-300">
                                [{toHex32(span.fileStart)} .. {toHex32(span.fileEnd)}) ({span.byteLength.toLocaleString()} B, {span.pageCount} p.)
                              </div>
                            ))}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[11px] text-zinc-300 font-sans">
                              {obj.roleEvidence === 'executable-code-like'
                                ? 'Executable Code Candidate'
                                : obj.roleEvidence === 'read-write-data-like'
                                ? 'Writable Data Candidate'
                                : obj.roleEvidence === 'read-only-data-like'
                                ? 'Read-Only Data Candidate'
                                : 'Unclassified Object'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Object Physical-to-Virtual Backing Analysis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Object Physical-to-Virtual Backing Analysis
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Distinguishes valid addressable bytes from physical page padding & unbacked virtual extents
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Object</th>
                        <th className="py-2.5 px-3">Virtual Size</th>
                        <th className="py-2.5 px-3">Pages (M/Z)</th>
                        <th className="py-2.5 px-3">Raw Page Bytes</th>
                        <th className="py-2.5 px-3">Addressable File Bytes</th>
                        <th className="py-2.5 px-3">Page Padding Bytes</th>
                        <th className="py-2.5 px-3">Unbacked Virtual Bytes</th>
                        <th className="py-2.5 px-3">Backing Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {report.objectBackingSummary.map((b) => (
                        <tr key={b.objectNumber} className="hover:bg-zinc-900/40">
                          <td className="py-2.5 px-3 font-bold text-amber-400">
                            Obj {b.objectNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            {b.virtualSizeHex} ({b.virtualSize.toLocaleString()} B)
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">
                            {b.mappedPageCount} mapped / {b.explicitZeroFilledPageCount} zero-filled
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300">
                            {b.rawFileBackedPageBytes.toLocaleString()} B
                          </td>
                          <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                            {b.addressableFileBackedBytes.toLocaleString()} B
                          </td>
                          <td className="py-2.5 px-3">
                            {b.physicalPagePaddingBytes > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-300 text-[10px]">
                                +{b.physicalPagePaddingBytes.toLocaleString()} B padding
                              </span>
                            ) : (
                              <span className="text-zinc-500">0 B</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {b.virtualBytesWithoutFileBacking > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-blue-950/70 border border-blue-800 text-blue-300 text-[10px]">
                                {b.virtualBytesWithoutFileBacking.toLocaleString()} B unbacked
                              </span>
                            ) : (
                              <span className="text-zinc-500">0 B</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-[11px] text-zinc-400">
                            {b.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KNOWN MK1 ANCHORS */}
          {activeTab === 'anchors' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Research Anchor</th>
                      <th className="py-2.5 px-3">Physical EXE Range</th>
                      <th className="py-2.5 px-3">Physical Region</th>
                      <th className="py-2.5 px-3">LE Mapping Status</th>
                      <th className="py-2.5 px-3">Mapped LE Object</th>
                      <th className="py-2.5 px-3">Object Offset</th>
                      <th className="py-2.5 px-3">Linear Address</th>
                      <th className="py-2.5 px-3">Containment / Boundaries</th>
                      <th className="py-2.5 px-3">Anchor Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {report.knownAnchors.map((anchor, idx) => {
                      const statusBadge =
                        anchor.leMappingStatus === 'mapped'
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                          : anchor.leMappingStatus === 'unmapped'
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          : anchor.leMappingStatus === 'padding'
                          ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                          : 'bg-rose-950/70 text-rose-300 border border-rose-800';

                      return (
                        <tr key={idx} className="hover:bg-zinc-900/40">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-zinc-200">{anchor.name}</div>
                            <div className="text-[10px] text-zinc-500 font-sans">{anchor.description}</div>
                          </td>
                          <td className="py-2.5 px-3 text-amber-400">
                            {anchor.physicalStartOffsetHex} .. {anchor.physicalEndOffsetHex}
                            <div className="text-[10px] text-zinc-500">({anchor.byteLength} bytes)</div>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-[11px] text-zinc-300">
                            {anchor.physicalRegion || 'Unknown Region'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusBadge}`}>
                              {anchor.leMappingStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {anchor.mappedObjectNumber !== null ? (
                              <span className="font-bold text-zinc-200">
                                Obj {anchor.mappedObjectNumber} ({anchor.objectCapabilities})
                              </span>
                            ) : (
                              <span className="text-zinc-500">Unmapped</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300">
                            {anchor.mappedObjectOffsetHex || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-200">
                            {anchor.linearAddressCandidateHex || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-[11px]">
                            {anchor.isContainedInSingleSpan ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Single Span
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Crossed / Uncontained
                              </span>
                            )}
                            {anchor.containmentNote && (
                              <div className="text-[10px] text-zinc-500 mt-0.5">{anchor.containmentNote}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              anchor.status === 'VERIFIED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {anchor.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LE SIGNATURE CANDIDATES */}
          {activeTab === 'signatures' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">EXE Offset</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3">Passed Rules</th>
                      <th className="py-2.5 px-3">Validation Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {report.boundLayout.rawLeOccurrences.map((cand, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/40">
                        <td className="py-2.5 px-3 font-bold text-amber-400">
                          {cand.fileOffsetHex}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            cand.validation.confidence === 'strong'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : cand.validation.confidence === 'weak'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {cand.validation.confidence}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">
                          {cand.validation.passedRuleCount} / {cand.validation.totalRuleCount}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] font-sans text-zinc-400">
                          {cand.validation.rules.map((r, rIdx) => (
                            <div key={rIdx} className={r.passed ? 'text-zinc-400' : 'text-red-400'}>
                              {r.passed ? '✓' : '✗'} {r.rule}: {r.details}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PAGE MAP DIAGNOSTICS */}
          {activeTab === 'pagemap' && report.pageMapDiagnostics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Total Entries</div>
                  <div className="text-base font-bold text-zinc-200 mt-1 font-mono">
                    {report.pageMapDiagnostics.totalEntries}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Mapped Valid Pages</div>
                  <div className="text-base font-bold text-emerald-400 mt-1 font-mono">
                    {report.pageMapDiagnostics.mappedValidEntries} / {report.pageMapDiagnostics.validEntries} valid
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Zero-Filled (BSS)</div>
                  <div className="text-base font-bold text-blue-400 mt-1 font-mono">
                    {report.pageMapDiagnostics.zeroFilledEntries}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Phys Page Range</div>
                  <div className="text-base font-bold text-amber-400 mt-1 font-mono">
                    {report.pageMapDiagnostics.minDecodedPhysicalPageNumber !== null
                      ? `${report.pageMapDiagnostics.minDecodedPhysicalPageNumber} .. ${report.pageMapDiagnostics.maxDecodedPhysicalPageNumber}`
                      : 'None'}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Idx</th>
                      <th className="py-2.5 px-3">Raw Bytes</th>
                      <th className="py-2.5 px-3">Raw Flags</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Decoded Phys Page</th>
                      <th className="py-2.5 px-3">Physical File Start</th>
                      <th className="py-2.5 px-3">Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {report.pageMapDiagnostics.entries.map((entry) => (
                      <tr key={entry.pageMapIndex} className="hover:bg-zinc-900/40">
                        <td className="py-2 px-3 font-bold text-amber-400">
                          p.{entry.pageMapIndex}
                        </td>
                        <td className="py-2 px-3 text-zinc-400">
                          {entry.rawBytesHex}
                        </td>
                        <td className="py-2 px-3 text-zinc-400">
                          {entry.rawFlagsHex}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            entry.pageType === 'valid'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                              : entry.pageType === 'zero-filled'
                              ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {entry.pageType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-zinc-200">
                          {entry.physicalPageNumber > 0 ? entry.physicalPageNumber : '—'}
                        </td>
                        <td className="py-2 px-3 text-zinc-300">
                          {entry.physicalFileStartHex || <span className="text-zinc-600 italic">None</span>}
                        </td>
                        <td className="py-2 px-3 text-zinc-400">
                          {entry.physicalByteLength !== null ? `${entry.physicalByteLength.toLocaleString()} B` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PALETTE × EXECUTABLE REGIONS CORRELATION */}
          {activeTab === 'palettes' && (
            <div className="space-y-6">
              {!sharedPaletteResult ? (
                <div className="p-8 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-3">
                  <Palette className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="text-sm font-semibold text-zinc-300">
                    Palette Region Correlation Unavailable
                  </div>
                  <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                    The MK1 Palette Catalogue has not yet been built. Run <span className="text-amber-400 font-mono">Build Palette Catalogue</span> in the panel below to correlate existing physical candidates with this executable topology. No re-scanning or destructive modification will occur.
                  </p>
                </div>
              ) : correlationResult?.status === 'FAILED' ? (
                <div className="p-5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    Fixture Identity Mismatch
                  </div>
                  <p className="text-xs text-red-300 font-mono">
                    {correlationResult.failureReason}
                  </p>
                </div>
              ) : correlationResult ? (
                <>
                  {/* Action and Summary Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100">Physical Executable Region Correlation</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-400 font-bold">
                          AUTHORITATIVE PRIMARY MODEL
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Correlating {correlationResult.reconciliation.totalInputCount.toLocaleString()} palette candidates with {report.topology.regions.length} verified physical regions.
                      </p>
                    </div>

                    <button
                      onClick={handleExportCorrelationJson}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-medium transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Region Correlation (JSON)</span>
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Structural Total</div>
                      <div className="text-base font-bold text-zinc-200 mt-1 font-mono">
                        {correlationResult.reconciliation.structuralInputCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">100% evaluated</div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Research Shortlist</div>
                      <div className="text-base font-bold text-amber-400 mt-1 font-mono">
                        {correlationResult.reconciliation.researchInputCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">High-confidence</div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Global Unique</div>
                      <div className="text-base font-bold text-zinc-200 mt-1 font-mono">
                        {sharedPaletteResult.counts.uniqueContentsCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Distinct byte hashes</div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Multi-Region Hashes</div>
                      <div className="text-base font-bold text-purple-400 mt-1 font-mono">
                        {correlationResult.multiRegionContentSummary.uniqueContentsPresentInMultipleRegionsCount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Across multiple regions</div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Cross-Region</div>
                      <div className="text-base font-bold text-zinc-200 mt-1 font-mono">
                        {correlationResult.crossRegionSummary.totalCrossRegionCandidates.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Boundary crossings</div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Reconciliation</div>
                      <div className={`text-base font-bold mt-1 font-mono ${
                        correlationResult.reconciliation.totalReconciles ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {correlationResult.reconciliation.totalReconciles ? '100% Reconciled' : 'Discrepancy'}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {correlationResult.reconciliation.totalClassifiedCount.toLocaleString()} / {correlationResult.reconciliation.totalInputCount.toLocaleString()} candidates
                      </div>
                    </div>
                  </div>

                  {/* Primary Physical Executable Region Distribution Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-300">Authoritative Physical Executable Regions</span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        Candidates classified by full [byteStart, byteEnd) interval
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Physical Region</th>
                            <th className="py-2.5 px-3">Class</th>
                            <th className="py-2.5 px-3">Object</th>
                            <th className="py-2.5 px-3">Physical Span</th>
                            <th className="py-2.5 px-3 text-right">Structural</th>
                            <th className="py-2.5 px-3 text-right">Structural %</th>
                            <th className="py-2.5 px-3 text-right">Research</th>
                            <th className="py-2.5 px-3 text-right">Research %</th>
                            <th className="py-2.5 px-3 text-right">Unique</th>
                            <th className="py-2.5 px-3 text-right">Duplicates</th>
                            <th className="py-2.5 px-3 text-right">Zero-Shift Kano</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {correlationResult.regionDistribution.map((row) => (
                            <tr key={row.regionId} className="hover:bg-zinc-900/40">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-zinc-200">{row.regionName}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{row.regionId}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                                  row.regionClass === 'le-object-mapped'
                                    ? row.objectNumber === 2
                                      ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                                      : 'bg-purple-950/70 text-purple-400 border-purple-800'
                                    : row.regionClass === 'le-object-padding'
                                    ? 'bg-amber-950/70 text-amber-400 border-amber-800'
                                    : row.regionClass === 'post-module-tail'
                                    ? 'bg-fuchsia-950/70 text-fuchsia-400 border-fuchsia-800'
                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                  {row.regionClass}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-zinc-400">
                                {row.objectNumber !== null ? `Obj ${row.objectNumber}` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                                <div>{row.fileStartHex} .. {row.fileEndHex}</div>
                                <div className="text-[10px] text-zinc-500">{row.byteLength.toLocaleString()} B</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-zinc-100">
                                {row.structuralCandidateCount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right text-zinc-400">
                                {row.structuralPercentageOfTotal}%
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                                {row.researchCandidateCount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right text-zinc-400">
                                {row.researchPercentageOfTotal}%
                              </td>
                              <td className="py-2.5 px-3 text-right text-zinc-300">
                                {row.uniqueContentCount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right text-zinc-400">
                                {row.duplicateCandidateCount.toLocaleString()}
                              </td>
                              <td className={`py-2.5 px-3 text-right font-bold ${
                                row.zeroShiftKanoCompatibleCount > 0 ? 'text-emerald-400' : 'text-zinc-500'
                              }`}>
                                {row.zeroShiftKanoCompatibleCount.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-zinc-900/90 border-t border-zinc-700 font-bold text-zinc-200">
                          <tr>
                            <td colSpan={4} className="py-2.5 px-3 text-zinc-300">
                              Total Contained in Regions
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-100">
                              {correlationResult.reconciliation.structuralAssignedCount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-400">
                              100%
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-400">
                              {correlationResult.reconciliation.researchAssignedCount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-400">
                              100%
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-400 text-[10px] font-sans">
                              (Non-additive)
                            </td>
                            <td className="py-2.5 px-3 text-right text-zinc-300">
                              {correlationResult.regionDistribution.reduce((a, b) => a + b.duplicateCandidateCount, 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-400">
                              {correlationResult.regionDistribution.reduce((a, b) => a + b.zeroShiftKanoCompatibleCount, 0).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Boundary and Multi-Region Analysis Callouts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Boundary Integrity Verification
                      </div>
                      {correlationResult.crossRegionSummary.totalCrossRegionCandidates === 0 ? (
                        <p className="text-xs text-zinc-400">
                          <span className="text-emerald-400 font-medium">0 candidates</span> cross physical region boundaries. Every one of the {correlationResult.reconciliation.structuralInputCount.toLocaleString()} palette candidates resides strictly within a single physical region.
                        </p>
                      ) : (
                        <div className="space-y-1 text-xs text-amber-400">
                          <p>{correlationResult.crossRegionSummary.totalCrossRegionCandidates} candidates span boundary transitions between regions.</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                        <Info className="w-4 h-4 text-purple-400" />
                        Multi-Region Content Semantics
                      </div>
                      <p className="text-xs text-zinc-400">
                        <span className="text-purple-400 font-medium font-mono">{correlationResult.multiRegionContentSummary.uniqueContentsPresentInMultipleRegionsCount}</span> unique content hashes occur at distinct physical sites across different regions ({correlationResult.multiRegionContentSummary.researchContentsPresentInMultipleRegionsCount} research-tier). Per-region unique counts are therefore not additive to the global unique total of {sharedPaletteResult.counts.uniqueContentsCount.toLocaleString()}.
                      </p>
                    </div>
                  </div>

                  {/* Collapsible Research Candidate Regional Detail */}
                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden">
                    <button
                      onClick={() => setShowResearchDetail(!showResearchDetail)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-zinc-200 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {showResearchDetail ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4 text-amber-400" />}
                        <span>Research Shortlist Regional Distribution ({correlationResult.researchCandidateAssignments.length})</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 font-normal">
                        {showResearchDetail ? 'Click to collapse' : 'Click to expand detail'}
                      </span>
                    </button>

                    {showResearchDetail && (
                      <div className="border-t border-zinc-800 max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-zinc-900/80 sticky top-0 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Palette ID</th>
                              <th className="py-2 px-3">Physical Region</th>
                              <th className="py-2 px-3">Offset</th>
                              <th className="py-2 px-3">Byte Span [Start..End)</th>
                              <th className="py-2 px-3">Length</th>
                              <th className="py-2 px-3">Score</th>
                              <th className="py-2 px-3">Kano Compatible</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
                            {correlationResult.researchCandidateAssignments.map((cand) => (
                              <tr key={cand.candidateId} className="hover:bg-zinc-900/30">
                                <td className="py-1.5 px-3 font-bold text-amber-400">
                                  {cand.candidateId}
                                </td>
                                <td className="py-1.5 px-3">
                                  <span className="text-zinc-300">{cand.regionName || '—'}</span>
                                </td>
                                <td className="py-1.5 px-3 text-zinc-400">
                                  {cand.exeOffsetHex}
                                </td>
                                <td className="py-1.5 px-3 text-zinc-400 text-[11px]">
                                  {cand.byteStartHex} .. {cand.byteEndHex}
                                </td>
                                <td className="py-1.5 px-3 text-zinc-300">
                                  {cand.length} B
                                </td>
                                <td className="py-1.5 px-3 font-bold text-amber-400">
                                  {cand.researchScore.toFixed(1)}
                                </td>
                                <td className="py-1.5 px-3">
                                  {cand.zeroShiftKanoCompatible ? (
                                    <span className="text-emerald-400 font-bold">YES</span>
                                  ) : (
                                    <span className="text-zinc-500">NO</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Secondary Perspective: LE Object Rollup */}
                  <div className="border border-zinc-800/80 rounded-lg bg-zinc-950/70 overflow-hidden">
                    <button
                      onClick={() => setShowSecondaryRollup(!showSecondaryRollup)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {showSecondaryRollup ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                        <span>LE Object Rollup (Secondary Perspective)</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500 font-normal">
                        {showSecondaryRollup ? 'Hide secondary view' : 'Show secondary view'}
                      </span>
                    </button>

                    {showSecondaryRollup && (
                      <div className="p-4 border-t border-zinc-800 space-y-3">
                        <p className="text-xs text-zinc-400">
                          The LE object rollup presents candidate distribution grouped by linear executable objects. Note that <span className="text-zinc-200 font-mono">"Outside Mapped Objects"</span> collapses DOS stub, pre-LE padding, physical padding, and post-module tail into a single bucket, whereas the primary table above separates them into discrete physical regions.
                        </p>

                        {correlationResult.secondaryObjectRollup && (
                          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                            <table className="w-full text-left text-xs font-mono">
                              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                                <tr>
                                  <th className="py-2.5 px-3">Object / Group</th>
                                  <th className="py-2.5 px-3">Capabilities</th>
                                  <th className="py-2.5 px-3">Role Evidence</th>
                                  <th className="py-2.5 px-3 text-right">Structural</th>
                                  <th className="py-2.5 px-3 text-right">Unique</th>
                                  <th className="py-2.5 px-3 text-right">Research Shortlist</th>
                                  <th className="py-2.5 px-3 text-right">% of Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                                {correlationResult.secondaryObjectRollup.distribution.map((dist, idx) => (
                                  <tr key={idx} className="hover:bg-zinc-900/40">
                                    <td className="py-2.5 px-3 font-bold text-amber-400">
                                      {dist.key}
                                    </td>
                                    <td className="py-2.5 px-3 text-zinc-400">
                                      {dist.capabilities}
                                    </td>
                                    <td className="py-2.5 px-3 font-sans text-[11px]">
                                      {dist.roleEvidence === 'read-write-data-like' ? (
                                        <span className="text-emerald-400 font-medium">Writable Data</span>
                                      ) : dist.roleEvidence === 'executable-code-like' ? (
                                        <span className="text-purple-400">Executable Code</span>
                                      ) : (
                                        <span className="text-zinc-500">{dist.roleEvidence}</span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-zinc-200">
                                      {dist.structuralCount.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-zinc-300">
                                      {dist.uniqueContentCount.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                                      {dist.researchShortlistCount.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-zinc-400">
                                      {dist.structuralPercentage}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* TAB 6: PALETTE REFERENCE RECONNAISSANCE */}
          {activeTab === 'recon' && (
            <MK1PaletteReferenceReconTab
              source={source}
              report={report}
              sharedPaletteResult={sharedPaletteResult ?? null}
              correlationResult={correlationResult}
              reconResult={reconResult}
              setReconResult={setReconResult}
              isReconRunning={isReconRunning}
              setIsReconRunning={setIsReconRunning}
              contextResult={contextResult}
              setContextResult={setContextResult}
              isContextRunning={isContextRunning}
              setIsContextRunning={setIsContextRunning}
              repeatedStructureResult={repeatedStructureResult}
              setRepeatedStructureResult={setRepeatedStructureResult}
              isRepeatedStructureRunning={isRepeatedStructureRunning}
              setIsRepeatedStructureRunning={setIsRepeatedStructureRunning}
              cycleLayoutResult={cycleLayoutResult}
              setCycleLayoutResult={setCycleLayoutResult}
              isCycleLayoutRunning={isCycleLayoutRunning}
              setIsCycleLayoutRunning={setIsCycleLayoutRunning}
              phaseHarmonicResult={phaseHarmonicResult}
              setPhaseHarmonicResult={setPhaseHarmonicResult}
              isPhaseHarmonicRunning={isPhaseHarmonicRunning}
              setIsPhaseHarmonicRunning={setIsPhaseHarmonicRunning}
            />
          )}

          {/* TAB 7: WATCOM DEBUG TAIL QUALIFICATION (PASS 1E.3A.1) */}
          {activeTab === 'watcom' && (
            <div className="space-y-6">
              {/* Provenance Warning & Safeguard Banner */}
              {!isRealDirectorySource ? (
                <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-amber-300">
                      Real MK1 Fixture Not Loaded (Synthetic / In-Memory Source)
                    </h4>
                    <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                      Synthetic tests or in-memory fixtures cannot produce authoritative research evidence.
                      Authoritative export is disabled until the real game directory is loaded via the normal browser DirectorySource workflow.
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
                      All Watcom container boundaries, raw bytes, and section records will be extracted directly from your user-loaded binary files and qualified against the verified executable topology.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRunWatcomDiscovery}
                    disabled={isWatcomRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isWatcomRunning ? 'animate-spin' : ''}`} />
                    <span>{isWatcomRunning ? 'Qualifying Debug Tail...' : 'Run Watcom Debug Tail Qualification'}</span>
                  </button>

                  {watcomReport && (
                    <span className="text-xs text-zinc-400 font-mono">
                      Completed: {watcomReport.timestamp.split('T')[1]?.replace('Z', '')}
                    </span>
                  )}
                </div>

                {watcomReport && (
                  <div>
                    {isRealDirectorySource && !watcomReport.provenance.synthetic ? (
                      <button
                        onClick={handleExportWatcomDiscoveryJson}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono text-xs transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Export Authoritative Discovery JSON</span>
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
              {watcomError && (
                <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Watcom Tail Qualification Error</h4>
                    <p className="text-xs text-red-300 mt-1 font-mono">{watcomError}</p>
                  </div>
                </div>
              )}

              {/* Discovery Report Display */}
              {watcomReport && (
                <div className="space-y-6">
                  {/* Executive Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Container Status</div>
                      <div className={`text-sm font-semibold mt-1 font-mono ${
                        watcomReport.discovery.status === 'DETECTED' ? 'text-emerald-400' : 'text-zinc-400'
                      }`}>
                        {watcomReport.discovery.status} ({watcomReport.discovery.format})
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Candidates: {watcomReport.discovery.candidateCount} / Bypassed: {watcomReport.discovery.resourceTrailersBypassed}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Master Header Offset</div>
                      <div className="text-sm font-semibold text-amber-400 mt-1 font-mono">
                        {watcomReport.discovery.masterHeader?.headerOffsetHex ?? 'N/A'}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 font-mono truncate" title={watcomReport.discovery.masterHeader?.rawBytesHex}>
                        Bytes: {watcomReport.discovery.masterHeader?.rawBytesHex ?? 'N/A'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Container Physical Span</div>
                      <div className="text-sm font-semibold text-zinc-200 mt-1 font-mono">
                        [{watcomReport.discovery.containerPhysicalStartHex ?? 'N/A'} .. {watcomReport.discovery.containerPhysicalEndHex ?? 'N/A'})
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Size: {watcomReport.discovery.containerByteLength?.toLocaleString() ?? 0} B
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Tail Correlation</div>
                      <div className="text-sm font-semibold text-cyan-400 mt-1 font-mono truncate" title={watcomReport.discovery.tailCorrelation?.verdict}>
                        {watcomReport.discovery.tailCorrelation?.verdict ?? 'N/A'}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Coverage: {watcomReport.discovery.tailCorrelation?.tailCoveragePercentage ?? 0}%
                      </div>
                    </div>
                  </div>

                  {/* Provenance Audit Card */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <span className="font-semibold text-zinc-200 font-mono flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        Fixture Provenance & Epistemic Audit
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        watcomReport.provenance.synthetic
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {watcomReport.provenance.synthetic ? 'SYNTHETIC NON-AUTHORITATIVE' : 'AUTHENTIC REAL RUN'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px] pt-1">
                      <div>
                        <span className="text-zinc-500">Source Kind:</span>{' '}
                        <span className="text-zinc-300">{watcomReport.provenance.sourceKind}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Target File:</span>{' '}
                        <span className="text-zinc-300">{watcomReport.provenance.fileName} ({watcomReport.provenance.byteLength.toLocaleString()} B)</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">SHA-256:</span>{' '}
                        <span className="text-zinc-300 truncate" title={watcomReport.provenance.sha256 || 'N/A'}>
                          {watcomReport.provenance.sha256 ? `${watcomReport.provenance.sha256.substring(0, 16)}...` : 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Operation ID:</span>{' '}
                        <span className="text-zinc-300">{watcomReport.operationId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Unresolved Pre-Debug Tail Alert */}
                  {watcomReport.discovery.unresolvedPreDebugTail && (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-700/80 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Unresolved Post-Module / Pre-Debug Tail Region Discovered
                      </div>
                      <div className="font-mono text-zinc-300">
                        Span: [{watcomReport.discovery.unresolvedPreDebugTail.startOffsetHex} .. {watcomReport.discovery.unresolvedPreDebugTail.endOffsetHex}) ({watcomReport.discovery.unresolvedPreDebugTail.byteLength.toLocaleString()} bytes)
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Classification: <span className="font-mono text-amber-200 font-semibold">{watcomReport.discovery.unresolvedPreDebugTail.classification}</span>.
                        These bytes exist between the LE module boundary and the validated Watcom container start. In accordance with Pass 1E.3A.1 epistemic policy, their purpose is not inferred or speculated upon.
                      </div>
                    </div>
                  )}

                  {/* Sub-Table Breakdowns */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Watcom Container Tables & Raw Byte Breakdown
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Table Structure</th>
                            <th className="py-2.5 px-3">Physical Span</th>
                            <th className="py-2.5 px-3">Byte Length</th>
                            <th className="py-2.5 px-3">Bounded Raw Bytes (Hex)</th>
                            <th className="py-2.5 px-3">Epistemic Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          <tr className="hover:bg-zinc-900/40">
                            <td className="py-2.5 px-3 font-semibold text-zinc-200">Language Table</td>
                            <td className="py-2.5 px-3 text-amber-400">
                              {watcomReport.discovery.langTableStartHex ? `${watcomReport.discovery.langTableStartHex} .. +${watcomReport.discovery.langTableByteLength} B` : 'N/A'}
                            </td>
                            <td className="py-2.5 px-3">{watcomReport.discovery.langTableByteLength} B</td>
                            <td className="py-2.5 px-3 text-zinc-400 truncate max-w-xs" title={watcomReport.discovery.langTableRawBytesHex}>
                              {watcomReport.discovery.langTableRawBytesHex || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400">Table geometry qualified; entries unparsed</td>
                          </tr>
                          <tr className="hover:bg-zinc-900/40">
                            <td className="py-2.5 px-3 font-semibold text-zinc-200">Segment Address Table</td>
                            <td className="py-2.5 px-3 text-amber-400">
                              {watcomReport.discovery.segmentTableStartHex ? `${watcomReport.discovery.segmentTableStartHex} .. +${watcomReport.discovery.segmentTableByteLength} B` : 'N/A'}
                            </td>
                            <td className="py-2.5 px-3">{watcomReport.discovery.segmentTableByteLength} B</td>
                            <td className="py-2.5 px-3 text-zinc-400 truncate max-w-xs" title={watcomReport.discovery.segmentTableRawBytesHex}>
                              {watcomReport.discovery.segmentTableRawBytesHex || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400">Table geometry qualified; entries unparsed</td>
                          </tr>
                          <tr className="hover:bg-zinc-900/40">
                            <td className="py-2.5 px-3 font-semibold text-zinc-200">Master Debug Header</td>
                            <td className="py-2.5 px-3 text-amber-400">
                              {watcomReport.discovery.masterHeader?.headerOffsetHex} .. +14 B
                            </td>
                            <td className="py-2.5 px-3">14 B</td>
                            <td className="py-2.5 px-3 text-zinc-400 font-mono">
                              {watcomReport.discovery.masterHeader?.rawBytesHex || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-emerald-400">Verified Open Watcom master header</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section Tiling Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Section Debug Header Enumeration & Tiling ({watcomReport.discovery.sectionCount} sections)
                      </h4>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        watcomReport.discovery.tilingValid ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                      }`}>
                        {watcomReport.discovery.tilingValid ? 'TILING VALID (NO OVERLAPS / GAPS)' : 'TILING DEFECT DETECTED'}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Index</th>
                            <th className="py-2.5 px-3">Physical File Offset</th>
                            <th className="py-2.5 px-3">Section ID</th>
                            <th className="py-2.5 px-3">mod_offset</th>
                            <th className="py-2.5 px-3">gbl_offset</th>
                            <th className="py-2.5 px-3">addr_offset</th>
                            <th className="py-2.5 px-3">Section Size</th>
                            <th className="py-2.5 px-3">Raw Bytes (18B)</th>
                            <th className="py-2.5 px-3">Validity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {watcomReport.discovery.sections.map((sec) => (
                            <tr key={sec.sectionIndex} className="hover:bg-zinc-900/40">
                              <td className="py-2.5 px-3 font-semibold text-zinc-200">
                                #{sec.sectionIndex}
                              </td>
                              <td className="py-2.5 px-3 text-amber-400">
                                {sec.fileOffsetHex}
                              </td>
                              <td className="py-2.5 px-3 font-bold">
                                {sec.sectionId === 0 ? (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                    0 (Root)
                                  </span>
                                ) : (
                                  sec.sectionId
                                )}
                              </td>
                              <td className="py-2.5 px-3">{sec.modOffsetHex} ({sec.modOffset})</td>
                              <td className="py-2.5 px-3">{sec.gblOffsetHex} ({sec.gblOffset})</td>
                              <td className="py-2.5 px-3">{sec.addrOffsetHex} ({sec.addrOffset})</td>
                              <td className="py-2.5 px-3 font-bold text-zinc-200">{sec.sectionSize.toLocaleString()} B</td>
                              <td className="py-2.5 px-3 text-zinc-400 font-mono text-[10px] truncate max-w-xs" title={sec.rawBytesHex}>
                                {sec.rawBytesHex || '—'}
                              </td>
                              <td className="py-2.5 px-3">
                                {sec.valid ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">
                                    Valid
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 text-[10px]" title={sec.validationError}>
                                    Invalid
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Validation Checks Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Discovery Validation Gates ({watcomReport.discovery.validationChecks.filter((c) => c.passed).length} / {watcomReport.discovery.validationChecks.length} Passed)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {watcomReport.discovery.validationChecks.map((chk) => (
                        <div key={chk.checkId} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start gap-2.5 text-xs">
                          {chk.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold text-zinc-200 font-mono text-[11px]">{chk.name}</div>
                            <div className="text-zinc-400 text-[10px] mt-0.5">{chk.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Epistemic Boundaries Card */}
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-2">
                    <h4 className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-400" />
                      Pass 1E.3A.1 Epistemic Boundaries & Invariants
                    </h4>
                    <ul className="list-disc list-inside text-zinc-400 space-y-1 font-mono text-[11px]">
                      <li>FORMAT DISCOVERY ONLY != SYMBOL ENUMERATION</li>
                      <li>CONTAINER DETECTED != MORTAL KOMBAT SYMBOL VERIFIED</li>
                      <li>SECTIONS DISCOVERED != CALL TARGET RESOLVED</li>
                      <li>NO MK SYMBOL SEARCHES PERFORMED IN 1E.3A.1</li>
                      <li>OPEN WATCOM SPECIFICATION != OBSERVED FIXTURE BYTES</li>
                      <li>SYNTHETIC TEST EVIDENCE IS STRICTLY ISOLATED FROM AUTHORITATIVE RESEARCH FACT</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: WATCOM PERMANENT CLASSES / SYMBOL INVENTORY (PASS 1E.3B) */}
          {activeTab === 'watcom_classes' && (
            <MK1WatcomPermanentClassesTab
              source={source}
              isRealDirectorySource={isRealDirectorySource}
              report={permanentClassesReport}
              setReport={setPermanentClassesReport}
              isRunning={isPermanentClassesRunning}
              setIsRunning={setIsPermanentClassesRunning}
              error={permanentClassesError}
              setError={setPermanentClassesError}
            />
          )}

          {/* TAB 9: WATCOM TO LE ADDRESS MODEL QUALIFICATION (PASS 1E.3C) */}
          {activeTab === 'watcom_address_model' && (
            <MK1WatcomAddressModelTab
              report={addressModelReport}
              isRunning={isAddressModelRunning}
              error={addressModelError}
              onRunQualification={handleRunAddressModel}
              isRealDirectorySource={isRealDirectorySource}
            />
          )}

          {/* TAB 10: WATCOM DATA-IMAGE BASE & PALETTE GROUND TRUTH (PASS 1E.3D.1) */}
          {activeTab === 'watcom_palette_ground_truth' && (
            <MK1WatcomDataImagePaletteGroundTruthTab
              source={source}
              report={paletteGroundTruthReport}
              isRunning={isPaletteGroundTruthRunning}
              error={paletteGroundTruthError}
              onRun={handleRunPaletteGroundTruth}
            />
          )}


          {/* TAB 11: KANO PALETTE SELECTION REFERENCE GRAPH (PASS 1E.3E) */}
          {activeTab === 'kano_palette_reference_graph' && (
            <MK1KanoPaletteSelectionReferenceGraphTab
              source={source}
              report={kanoReferenceGraphReport}
              isRunning={isKanoReferenceGraphRunning}
              error={kanoReferenceGraphError}
              onRun={handleRunKanoReferenceGraph}
            />
          )}



          {/* TAB 12: KANO PALETTE SELECTION SEMANTICS (PASS 1E.3F) */}
          {activeTab === 'kano_palette_selection_semantics' && (
            <MK1KanoPaletteSelectionSemanticsTab
              source={source}
              report={kanoSelectionSemanticsReport}
              isRunning={isKanoSelectionSemanticsRunning}
              error={kanoSelectionSemanticsError}
              onRun={handleRunKanoSelectionSemantics}
            />
          )}


          {/* TAB 13: PALETTE SETUP / TRANSFER SEMANTICS (PASS 1E.3G) */}
          {activeTab === 'palette_setup_transfer_semantics' && (
            <MK1PaletteSetupTransferSemanticsTab
              source={source}
              report={paletteSetupTransferReport}
              isRunning={isPaletteSetupTransferRunning}
              error={paletteSetupTransferError}
              onRun={handleRunPaletteSetupTransfer}
            />
          )}
        </div>
      )}
    </section>
    </ResearchErrorBoundary>
  );
}

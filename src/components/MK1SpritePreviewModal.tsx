import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  MK1SpriteDescriptorCandidate,
  MK1DecodedSpritePreview,
  MK1ResolvedGraTarget,
} from '../games/mk1/research/spriteDescriptorTypes';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  decodeUgraSprite,
  renderDiagnosticSpriteToCanvas,
} from '../games/mk1/graphics/ugraDecoder';
import {
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

export interface MK1SpritePreviewModalProps {
  candidates: MK1SpriteDescriptorCandidate[];
  currentIndex: number;
  resolvedTarget: MK1ResolvedGraTarget;
  previewPayloads?: Map<number, MK1DecodedSpritePreview>;
  source?: DirectorySource | null;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const MK1SpritePreviewModal: React.FC<MK1SpritePreviewModalProps> = ({
  candidates,
  currentIndex,
  resolvedTarget,
  previewPayloads,
  source,
  onClose,
  onNavigate,
}) => {
  const [zoom, setZoom] = useState<number>(3);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const candidate = candidates[currentIndex];

  // Milestone 1D.1: Retrieve in-memory decoded preview directly from scan session.
  // Single source of truth: no re-reading or re-decoding if already decoded.
  const inMemoryPayload = useMemo(() => {
    if (!candidate || !previewPayloads) return null;
    return previewPayloads.get(candidate.exeOffset) ?? null;
  }, [candidate, previewPayloads]);

  // Milestone 1D.1 Section 6: Optional fallback if preview payload was unexpectedly unavailable
  const [fallbackPayload, setFallbackPayload] = useState<MK1DecodedSpritePreview | null>(null);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [isFallbackLoading, setIsFallbackLoading] = useState<boolean>(false);

  useEffect(() => {
    setFallbackPayload(null);
    setFallbackError(null);
    setIsFallbackLoading(false);

    if (candidate && candidate.decode?.success && !inMemoryPayload && source) {
      let isCancelled = false;
      setIsFallbackLoading(true);

      (async () => {
        try {
          const sliceLen = Math.min(resolvedTarget.fileSize - candidate.graOffset, 250000);
          const slice = await source.readSlice(
            resolvedTarget.path,
            candidate.graOffset,
            sliceLen,
          );
          const decoded = decodeUgraSprite(slice, 0, candidate.width, candidate.height);
          if (isCancelled) return;

          if (!decoded.success) {
            setFallbackError(decoded.failureReason ?? 'Fallback decode failed');
          } else if (candidate.decode?.checksum && decoded.checksum !== candidate.decode.checksum) {
            // Milestone 1D.1 Section 6: Checksum verification
            setFallbackError(
              `RESEARCH ERROR: Fallback checksum mismatch (${decoded.checksum} vs scan ${candidate.decode.checksum})`,
            );
          } else {
            setFallbackPayload({
              exeOffset: candidate.exeOffset,
              width: candidate.width,
              height: candidate.height,
              x: candidate.x,
              y: candidate.y,
              graOffset: candidate.graOffset,
              indices: decoded.indices,
              opaqueMask: decoded.opaqueMask,
              encodedBytesConsumed: decoded.encodedBytesConsumed,
              commandCount: decoded.commandCount,
              checksum: decoded.checksum!,
            });
          }
        } catch (err: unknown) {
          if (!isCancelled) {
            const msg = err instanceof Error ? err.message : String(err);
            setFallbackError(`Fallback read error: ${msg}`);
          }
        } finally {
          if (!isCancelled) {
            setIsFallbackLoading(false);
          }
        }
      })();

      return () => {
        isCancelled = true;
      };
    }
  }, [candidate, inMemoryPayload, source, resolvedTarget]);

  const activePayload = inMemoryPayload ?? fallbackPayload;

  // Render to canvas whenever activePayload or zoom changes
  useEffect(() => {
    if (canvasRef.current && activePayload) {
      renderDiagnosticSpriteToCanvas(canvasRef.current, activePayload, zoom);
    }
  }, [activePayload, zoom]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < candidates.length - 1) onNavigate(currentIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, candidates.length, onClose, onNavigate]);

  if (!candidate) return null;

  return (
    <div
      id="sprite-preview-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl bg-zinc-900 border border-purple-800/60 shadow-2xl overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h3 className="font-bold text-sm text-zinc-100">
              Diagnostic Sprite Preview
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-purple-950 text-purple-300 border border-purple-800">
              Pass 1D Proof
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-400">
              Sprite <span className="text-purple-300 font-bold">{currentIndex + 1}</span> of{' '}
              <span className="text-zinc-300">{candidates.length}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Milestone 1D Notice Banner */}
        <div className="px-5 py-2 bg-amber-950/50 border-b border-amber-800/60 text-[11px] text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold tracking-wide">
              DIAGNOSTIC INDEX PREVIEW — PALETTE NOT APPLIED
            </span>
          </div>
          <span className="text-[10px] text-amber-400/80">
            Raw palette index &rarr; grayscale intensity (index 0 is distinct from transparent)
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left / Center: Interactive Canvas Stage */}
          <div className="md:col-span-7 flex flex-col items-center justify-center space-y-3">
            <div
              className="relative w-full min-h-[320px] max-h-[460px] flex items-center justify-center p-4 rounded-lg border border-zinc-800 overflow-auto"
              style={{
                backgroundColor: '#09090b',
                backgroundImage: `
                  linear-gradient(45deg, #141416 25%, transparent 25%),
                  linear-gradient(-45deg, #141416 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #141416 75%),
                  linear-gradient(-45deg, transparent 75%, #141416 75%)
                `,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            >
              {activePayload ? (
                <canvas
                  ref={canvasRef}
                  style={{ imageRendering: 'pixelated' }}
                  className="rounded shadow-xl border border-zinc-700/50"
                />
              ) : isFallbackLoading ? (
                <div className="text-center p-6 space-y-2">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                  <div className="text-xs text-purple-300 font-semibold">
                    Re-reading fallback stream...
                  </div>
                </div>
              ) : fallbackError ? (
                <div className="text-center p-6 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="text-xs text-amber-300 font-semibold uppercase">
                    Checksum Mismatch / Fallback Error
                  </div>
                  <div className="text-[11px] text-zinc-400 max-w-xs">
                    {fallbackError}
                  </div>
                </div>
              ) : candidate.decode?.success ? (
                /* Milestone 1D.1 Section 12: PREVIEW PAYLOAD UNAVAILABLE distinct state */
                <div className="text-center p-6 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                    PREVIEW PAYLOAD UNAVAILABLE
                  </div>
                  <div className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                    The sprite decoded successfully but its runtime preview data was not retained.
                  </div>
                </div>
              ) : (
                /* Milestone 1D.1 Section 12: DECODE FAILURE distinct state */
                <div className="text-center p-6 space-y-2">
                  <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <div className="text-xs text-rose-300 font-semibold uppercase tracking-wider">
                    DECODE FAILURE
                  </div>
                  <div className="text-[11px] text-zinc-400 max-w-xs leading-relaxed">
                    {candidate.decode?.failureReason ?? 'Sprite decoder rejected byte stream'}
                  </div>
                </div>
              )}
            </div>

            {/* Canvas Zoom & Navigation Controls */}
            <div className="w-full flex items-center justify-between px-2">
              {/* Zoom Controls (Milestone 1D.1 Section 9: Nearest-neighbor scaling) */}
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider mr-1">Zoom:</span>
                {[1, 2, 3, 4, 6].map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      zoom === z
                        ? 'bg-purple-600 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {z}x
                  </button>
                ))}
              </div>

              {/* Stepper Buttons (Milestone 1D.1 Section 10) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>
                <button
                  onClick={() => onNavigate(currentIndex + 1)}
                  disabled={currentIndex >= candidates.length - 1}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs transition-colors cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Descriptor Metadata Panel (Milestone 1D.1 Section 4: Single Source of Truth) */}
          <div className="md:col-span-5 flex flex-col space-y-4">
            <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <div className="text-xs font-bold text-zinc-200">
                  Descriptor Identity
                </div>
                {candidate.confidence === 'inferred' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Inferred
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Candidate
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">EXE Offset</div>
                  <div className="font-bold text-purple-300">{candidate.exeOffsetHex}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Form</div>
                  <div className="font-bold text-zinc-200">
                    {candidate.kind === 'with-xy' ? 'Form A (12B With X/Y)' : 'Form B (8B No X/Y)'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Dimensions</div>
                  <div className="font-bold text-emerald-400">
                    {candidate.width} &times; {candidate.height} px
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Origin (X, Y)</div>
                  <div className="font-bold text-zinc-300">
                    {candidate.kind === 'with-xy' ? `${candidate.x}, ${candidate.y}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">GRA Offset</div>
                  <div className="font-bold text-amber-300">
                    {candidate.graOffsetHex}{' '}
                    <span className="text-[10px] text-zinc-500 font-normal">({candidate.graOffset})</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Target Resource</div>
                  <div className="font-bold text-zinc-300 truncate" title={resolvedTarget.path}>
                    {resolvedTarget.path.split('/').pop()}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    ID {resolvedTarget.fileId} · {resolvedTarget.fileSize.toLocaleString()}B
                  </div>
                </div>
              </div>
            </div>

            {/* Decoding Proof Metrics */}
            <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold text-zinc-200 pb-2 border-b border-zinc-800/80 flex items-center justify-between">
                <span>Decoding Metrics</span>
                {candidate.decode?.success ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Row Exact Match
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold">
                    <XCircle className="w-3 h-3" />
                    Decode Failed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Stream Consumed</div>
                  <div className="font-bold text-zinc-200">
                    {activePayload?.encodedBytesConsumed ?? candidate.decode?.encodedBytesConsumed ?? 0} bytes
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">32-bit LE Commands</div>
                  <div className="font-bold text-zinc-200">
                    {activePayload?.commandCount ?? candidate.decode?.commandCount ?? 0}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-zinc-500 uppercase">FNV-1a Checksum</div>
                  <div className="font-mono text-purple-300 font-bold tracking-wider">
                    {activePayload?.checksum ?? candidate.decode?.checksum ?? '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Array Run Details */}
            {candidate.inArrayRun && (
              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300">
                <div className="font-semibold text-purple-200 mb-0.5">
                  Array Member (Stride: {candidate.arrayRunStride}B)
                </div>
                <div className="text-[11px] text-purple-400/90">
                  Candidate belongs to a detected contiguous descriptor array table.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="text-[11px]">
            Use <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">&larr;</kbd> and{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">&rarr;</kbd> to step through sprites.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { AlertCircle, Copy, Download, Check, RefreshCw } from 'lucide-react';
import {
  copyDiagnosticLog,
  downloadDiagnosticLog,
  formatErrorDetails,
} from '../core/diagnostics/diagnosticLogger';

interface Props {
  title?: string;
  error: unknown;
  operationId?: string;
  onRetry?: () => void;
  currentGame?: string;
  subsystem?: string;
  operation?: string;
  context?: Record<string, unknown>;
}

export function AnalysisFailurePanel({
  title = 'Analysis Failed',
  error,
  operationId,
  onRetry,
  currentGame,
  subsystem,
  operation,
  context,
}: Props) {
  const [copied, setCopied] = useState(false);
  const details = formatErrorDetails(error);

  const handleCopy = async () => {
    const success = await copyDiagnosticLog(currentGame);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExport = () => {
    downloadDiagnosticLog(currentGame);
  };

  return (
    <div className="my-4 p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 space-y-3 shadow-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-bold tracking-wide uppercase text-red-300">
              {title}
            </h3>
            {operationId && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-400">
                Run ID: {operationId}
              </span>
            )}
          </div>

          <div className="mt-1.5 text-xs text-red-200 font-mono bg-zinc-950/80 p-2.5 rounded-lg border border-red-900/60 break-words whitespace-pre-wrap">
            {details.errorName ? <span className="text-red-400 font-bold">{details.errorName}: </span> : null}
            {details.message}
          </div>

          {details.cause && (
            <div className="mt-2 text-[11px] text-zinc-400 font-mono bg-zinc-950/60 p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 font-semibold">Underlying Cause: </span>
              {details.cause}
            </div>
          )}

          {context && Object.keys(context).length > 0 && (
            <div className="mt-2 text-[11px] text-zinc-300 font-mono bg-zinc-950/60 p-2 rounded border border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-semibold block">Context Metadata:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                {Object.entries(context).map(([k, v]) => (
                  <div key={k} className="flex gap-1.5 overflow-hidden text-ellipsis">
                    <span className="text-zinc-500 shrink-0">{k}:</span>
                    <span className="text-zinc-200 truncate">
                      {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {details.stack && (
            <details className="mt-2 text-[10px] text-zinc-400 font-mono">
              <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors">
                View Stack Trace
              </summary>
              <pre className="mt-1 p-2 rounded bg-zinc-950/90 border border-zinc-800 overflow-x-auto max-h-40 text-[10px] text-zinc-400">
                {details.stack}
              </pre>
            </details>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-900/40">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              Copy Error Log
            </>
          )}
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700/80 font-medium text-xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-red-300" />
          Export Error Log
        </button>
      </div>
    </div>
  );
}

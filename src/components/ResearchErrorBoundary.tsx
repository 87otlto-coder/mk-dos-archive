import React, { Component, ReactNode } from 'react';
import { AlertOctagon, Copy, Download, RefreshCw, Check } from 'lucide-react';
import {
  copyDiagnosticLog,
  downloadDiagnosticLog,
  formatErrorDetails,
  logFatal,
  createOperationId,
} from '../core/diagnostics/diagnosticLogger';

interface Props {
  children: ReactNode;
  boundaryName?: string;
  subsystem?: string;
  title?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copied: boolean;
}

export class ResearchErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    const opId = createOperationId('render-crash');
    logFatal(
      this.props.subsystem || 'ui-render',
      'react-render',
      opId,
      error,
      {
        view: this.props.boundaryName || this.props.title || 'ResearchView',
        componentStack: errorInfo.componentStack || undefined,
      },
    );
  }

  private handleCopy = async () => {
    const success = await copyDiagnosticLog();
    if (success) {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }
  };

  private handleExport = () => {
    downloadDiagnosticLog();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const details = formatErrorDetails(this.state.error);

      return (
        <div className="m-4 p-6 rounded-xl bg-red-950 border-2 border-red-700 text-red-100 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-900/80 border border-red-600 text-red-200">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-red-100 uppercase">
                {this.props.title || 'Research UI Crashed'}
              </h2>
              <p className="text-xs text-red-300 mt-0.5">
                A render failure occurred in{' '}
                <span className="font-mono text-red-200">{this.props.boundaryName || this.props.title || 'Research View'}</span>.
                Technical diagnostic evidence has been recorded.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-red-900/80 font-mono text-xs space-y-2">
            <div className="text-red-400 font-bold">
              {details.errorName ? `${details.errorName}: ` : ''}{details.message}
            </div>
            {details.stack && (
              <pre className="mt-2 p-2 rounded bg-zinc-900 text-[11px] text-zinc-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {details.stack}
              </pre>
            )}
            {this.state.errorInfo?.componentStack && (
              <details className="mt-2 text-[10px] text-zinc-400">
                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300">
                  Component Stack
                </summary>
                <pre className="mt-1 p-2 rounded bg-zinc-900 text-zinc-400 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-600 font-medium text-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Return to Research View
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={this.handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-600 font-medium text-xs transition-all cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    Copy Error Log
                  </>
                )}
              </button>

              <button
                onClick={this.handleExport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                Export Error Log
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

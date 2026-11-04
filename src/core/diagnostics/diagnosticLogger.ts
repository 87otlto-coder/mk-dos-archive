import {
  DiagnosticContext,
  DiagnosticEntry,
  DiagnosticExportJson,
  DiagnosticSeverity,
} from './types';
import { APP_NAME, APP_VERSION, APP_MILESTONE } from '../../appMetadata';

const MAX_IN_MEMORY_ENTRIES = 500;
const MAX_SESSION_STORAGE_ENTRIES = 100;
const SESSION_STORAGE_KEY = 'mkdos_diagnostic_log_v1';

let inMemoryEntries: DiagnosticEntry[] = [];
let nextEntrySeq = 1;
const listeners = new Set<(entry: DiagnosticEntry) => void>();
let globalCaptureInitialized = false;

// Attempt to restore prior entries from sessionStorage on startup
try {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryEntries = parsed.slice(-MAX_IN_MEMORY_ENTRIES);
        nextEntrySeq = inMemoryEntries.length + 1;
      }
    }
  }
} catch {
  // Session storage unavailable or corrupt; ignore gracefully
}

function persistToSessionStorage(): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const slice = inMemoryEntries.slice(-MAX_SESSION_STORAGE_ENTRIES);
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(slice));
    }
  } catch {
    // Quota exceeded or storage blocked; ignore gracefully
  }
}

/**
 * Creates a unique operation / run ID for tracing correlated research actions.
 */
export function createOperationId(prefix = 'op'): string {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

/**
 * Robust extraction of technical error details from an unknown thrown value.
 * Preserves message, error name/type, stack trace, and cause chain.
 */
export function formatErrorDetails(err: unknown): {
  message: string;
  errorName?: string;
  stack?: string;
  cause?: string;
} {
  if (err instanceof Error) {
    let causeStr: string | undefined;
    if (err.cause !== undefined) {
      if (err.cause instanceof Error) {
        causeStr = `${err.cause.name}: ${err.cause.message}${err.cause.stack ? `\n${err.cause.stack}` : ''}`;
      } else if (typeof err.cause === 'object' && err.cause !== null) {
        try {
          causeStr = JSON.stringify(err.cause);
        } catch {
          causeStr = String(err.cause);
        }
      } else {
        causeStr = String(err.cause);
      }
    }

    return {
      message: err.message || err.name || 'Unknown Error',
      errorName: err.name || 'Error',
      stack: err.stack,
      cause: causeStr,
    };
  }

  if (typeof err === 'string') {
    return {
      message: err,
      errorName: 'StringError',
    };
  }

  if (typeof err === 'object' && err !== null) {
    try {
      return {
        message: JSON.stringify(err),
        errorName: 'ObjectError',
      };
    } catch {
      return {
        message: Object.prototype.toString.call(err),
        errorName: 'ObjectError',
      };
    }
  }

  return {
    message: String(err),
    errorName: typeof err,
  };
}

/**
 * Appends a diagnostic entry into the bounded log and notifies subscribers.
 */
export function logDiagnostic(
  entryInput: Omit<DiagnosticEntry, 'id' | 'timestamp'> & { timestamp?: string },
): DiagnosticEntry {
  const entry: DiagnosticEntry = {
    ...entryInput,
    id: `diag-${Date.now()}-${nextEntrySeq++}`,
    timestamp: entryInput.timestamp || new Date().toISOString(),
  };

  inMemoryEntries.push(entry);
  if (inMemoryEntries.length > MAX_IN_MEMORY_ENTRIES) {
    inMemoryEntries.shift();
  }

  persistToSessionStorage();

  for (const listener of listeners) {
    try {
      listener(entry);
    } catch {
      // Listener errors must not disrupt diagnostic logging
    }
  }

  return entry;
}

export function logInfo(
  subsystem: string,
  operation: string,
  operationId: string,
  message: string,
  context?: DiagnosticContext,
): DiagnosticEntry {
  return logDiagnostic({
    severity: 'info',
    subsystem,
    operation,
    operationId,
    message,
    context,
  });
}

export function logWarning(
  subsystem: string,
  operation: string,
  operationId: string,
  message: string,
  context?: DiagnosticContext,
): DiagnosticEntry {
  return logDiagnostic({
    severity: 'warning',
    subsystem,
    operation,
    operationId,
    message,
    context,
  });
}

export function logError(
  subsystem: string,
  operation: string,
  operationId: string,
  err: unknown,
  context?: DiagnosticContext,
): DiagnosticEntry {
  const details = formatErrorDetails(err);
  return logDiagnostic({
    severity: 'error',
    subsystem,
    operation,
    operationId,
    message: details.message,
    errorName: details.errorName,
    stack: details.stack,
    cause: details.cause,
    context,
  });
}

export function logFatal(
  subsystem: string,
  operation: string,
  operationId: string,
  err: unknown,
  context?: DiagnosticContext,
): DiagnosticEntry {
  const details = formatErrorDetails(err);
  return logDiagnostic({
    severity: 'fatal',
    subsystem,
    operation,
    operationId,
    message: details.message,
    errorName: details.errorName,
    stack: details.stack,
    cause: details.cause,
    context,
  });
}

/**
 * Logs a discrete milestone/checkpoint transition within a research operation.
 */
export function logStageCheckpoint(
  operationId: string,
  subsystem: string,
  operation: string,
  stageName: string,
  context?: DiagnosticContext,
): DiagnosticEntry {
  return logDiagnostic({
    severity: 'info',
    subsystem,
    operation,
    operationId,
    message: `Stage: ${stageName}`,
    context: {
      ...context,
      stage: stageName,
    },
  });
}

/**
 * Retrieves all currently retained diagnostic entries.
 */
export function getDiagnosticEntries(): DiagnosticEntry[] {
  return [...inMemoryEntries];
}

/**
 * Clears retained diagnostics from memory and session storage.
 */
export function clearDiagnostics(): void {
  inMemoryEntries = [];
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}

/**
 * Subscribes to new diagnostic entries as they occur.
 */
export function subscribeDiagnostics(callback: (entry: DiagnosticEntry) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Constructs the authoritative diagnostic export JSON document.
 */
export function exportDiagnosticJson(currentGame?: string): DiagnosticExportJson {
  return {
    metadata: {
      app: APP_NAME,
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      game: currentGame,
      currentMilestone: APP_MILESTONE,
    },
    environment: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js / non-browser',
      platform: typeof navigator !== 'undefined' ? navigator.platform : typeof process !== 'undefined' ? process.platform : 'unknown',
    },
    entries: getDiagnosticEntries(),
  };
}

/**
 * Copies formatted diagnostic export JSON to the user's clipboard.
 */
export async function copyDiagnosticLog(currentGame?: string): Promise<boolean> {
  const exportData = exportDiagnosticJson(currentGame);
  const jsonStr = JSON.stringify(exportData, null, 2);
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(jsonStr);
      return true;
    } catch {
      // Fall through to legacy textarea copy if available
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = jsonStr;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Triggers a user download of the diagnostic log in JSON format.
 */
export function downloadDiagnosticLog(currentGame?: string): void {
  if (typeof document === 'undefined') return;

  const exportData = exportDiagnosticJson(currentGame);
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = url;
  link.download = `mkdos_diagnostic_log_${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Initializes global uncaught error and unhandled rejection listeners.
 * Idempotent: safe to invoke multiple times.
 */
export function initGlobalErrorCapture(): void {
  if (globalCaptureInitialized) return;
  if (typeof window === 'undefined') return;

  globalCaptureInitialized = true;

  window.addEventListener('error', (event) => {
    logDiagnostic({
      severity: 'fatal',
      subsystem: 'window-runtime',
      operation: 'uncaught-error',
      operationId: createOperationId('uncaught'),
      message: event.message || 'Uncaught window error',
      errorName: event.error?.name || 'UncaughtError',
      stack: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const details = formatErrorDetails(event.reason);
    logDiagnostic({
      severity: 'error',
      subsystem: 'promise-runtime',
      operation: 'unhandled-rejection',
      operationId: createOperationId('rejection'),
      message: details.message,
      errorName: details.errorName || 'UnhandledPromiseRejection',
      stack: details.stack,
      cause: details.cause,
    });
  });
}

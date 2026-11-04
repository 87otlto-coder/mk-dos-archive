import { describe, it, expect, beforeEach } from 'vitest';
import {
  logInfo,
  logWarning,
  logError,
  logFatal,
  logStageCheckpoint,
  getDiagnosticEntries,
  clearDiagnostics,
  formatErrorDetails,
  createOperationId,
  exportDiagnosticJson,
} from '../core/diagnostics/diagnosticLogger';

describe('Global Diagnostic Logger & Error Capture Infrastructure', () => {
  beforeEach(() => {
    clearDiagnostics();
  });

  it('generates unique traceable operation IDs with specified prefix', () => {
    const op1 = createOperationId('test-op');
    const op2 = createOperationId('test-op');
    expect(op1).toMatch(/^test-op-[a-z0-9]+-[a-z0-9]+$/);
    expect(op2).toMatch(/^test-op-[a-z0-9]+-[a-z0-9]+$/);
    expect(op1).not.toBe(op2);
  });

  it('formats standard Error instances with stack and name', () => {
    const err = new Error('Test filesystem failure');
    const details = formatErrorDetails(err);
    expect(details.message).toBe('Test filesystem failure');
    expect(details.errorName).toBe('Error');
    expect(details.stack).toBeDefined();
    expect(details.stack).toContain('Test filesystem failure');
  });

  it('formats non-Error values and nested causes gracefully', () => {
    const strDetails = formatErrorDetails('Direct string failure');
    expect(strDetails.message).toBe('Direct string failure');
    expect(strDetails.errorName).toBe('StringError');

    const nullDetails = formatErrorDetails(null);
    expect(nullDetails.message).toBe('null');

    const errorWithCause = new Error('Top level failure', {
      cause: new Error('Deep underlying I/O fault'),
    });
    const causeDetails = formatErrorDetails(errorWithCause);
    expect(causeDetails.message).toBe('Top level failure');
    expect(causeDetails.cause).toContain('Deep underlying I/O fault');
  });

  it('records info, warning, error, and fatal events with timestamp and operationId', () => {
    const opId = createOperationId('probe');

    logInfo('filesystem', 'readSlice', opId, 'Read bytes', { path: 'MK1.EXE', offset: 0, length: 64 });
    logWarning('filesystem', 'listRecursive', opId, 'Slow enumeration detected');
    logError('research-mk1', 'executable-layout', opId, new Error('Invalid LE magic'));
    logFatal('ui-render', 'react-render', opId, new Error('Unhandled view crash'));

    const entries = getDiagnosticEntries();
    expect(entries.length).toBe(4);

    expect(entries[0].severity).toBe('info');
    expect(entries[0].subsystem).toBe('filesystem');
    expect(entries[0].operation).toBe('readSlice');
    expect(entries[0].operationId).toBe(opId);
    expect(entries[0].context).toEqual({ path: 'MK1.EXE', offset: 0, length: 64 });

    expect(entries[1].severity).toBe('warning');
    expect(entries[2].severity).toBe('error');
    expect(entries[2].message).toBe('Invalid LE magic');

    expect(entries[3].severity).toBe('fatal');
    expect(entries[3].message).toBe('Unhandled view crash');
  });

  it('records stage checkpoints with progress details and metadata', () => {
    const opId = createOperationId('stage-test');

    logStageCheckpoint(opId, 'research-mk1', 'executable-layout', 'reading-header', {
      bytesRead: 2048,
    });

    const entries = getDiagnosticEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].severity).toBe('info');
    expect(entries[0].message).toBe('Stage: reading-header');
    expect(entries[0].context).toEqual({ stage: 'reading-header', bytesRead: 2048 });
  });

  it('exports structured JSON diagnostic package with environment and event log', () => {
    const opId = createOperationId('export-test');
    logInfo('probe', 'init', opId, 'Initialized fixture probe', { fixture: 'MK1-PC' });
    logError('probe', 'parse', opId, new Error('Simulated failure'));

    const exportData = exportDiagnosticJson('mk1');

    expect(exportData.metadata).toBeDefined();
    expect(exportData.metadata.game).toBe('mk1');
    expect(exportData.environment).toBeDefined();
    expect(exportData.entries.length).toBe(2);
    expect(exportData.entries[1].message).toBe('Simulated failure');
  });

  it('maintains a bounded ring buffer of maximum 500 entries', () => {
    for (let i = 0; i < 550; i++) {
      logInfo('perf', 'op', `op-${i}`, `Message index ${i}`);
    }

    const entries = getDiagnosticEntries();
    expect(entries.length).toBe(500);
    // Should retain the latest 500 (index 50 to 549)
    expect(entries[0].message).toBe('Message index 50');
    expect(entries[499].message).toBe('Message index 549');
  });
});

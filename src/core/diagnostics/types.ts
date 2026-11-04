export type DiagnosticSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface DiagnosticContext {
  view?: string;
  game?: string;
  probe?: string;
  targetResource?: string;
  requestedPath?: string;
  readOffset?: number;
  readLength?: number;
  milestone?: string;
  exportSchemaVersion?: string;
  appVersion?: string;
  userAgent?: string;
  sourceImplementation?: string;
  fileExistedInListing?: boolean;
  stage?: string;
  componentStack?: string;
  [key: string]: unknown;
}

export interface DiagnosticEntry {
  id: string;
  timestamp: string;
  severity: DiagnosticSeverity;
  subsystem: string;
  operation: string;
  operationId: string;
  message: string;
  errorName?: string;
  stack?: string;
  cause?: string;
  context?: DiagnosticContext;
}

export interface DiagnosticExportMetadata {
  app: string;
  version: string;
  exportedAt: string;
  game?: string;
  currentMilestone: string;
}

export interface DiagnosticExportEnvironment {
  userAgent: string;
  platform: string;
}

export interface DiagnosticExportJson {
  metadata: DiagnosticExportMetadata;
  environment: DiagnosticExportEnvironment;
  entries: DiagnosticEntry[];
}

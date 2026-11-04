import React from 'react';
import { MK1HeartRipRelocationCensusReport } from '../games/mk1/research/heartRipRelocationCensus';

export function HeartRipRelocationCensusPanel({ report }: { report: MK1HeartRipRelocationCensusReport }) {
  const target = report.target;
  const targetCensus = report.framePointerCensus.find(x => x.frameKey === 'heart_2');
  return (
    <div className="mt-3 p-3 rounded border border-violet-900 bg-violet-950/20 text-xs font-mono text-zinc-300">
      <div className="font-semibold text-violet-300">Heart-rip structural growth / relocation census · 1E.3O.9</div>
      <div className="mt-1">
        heart_2: {target.currentPartCount} parts → mechanically supports 4 · record {target.currentRecordByteLength} B → {target.proposedFourPartRecordByteLength} B · in-place slack {target.bytesAvailableInPlace} B
      </div>
      <div className="mt-1 text-zinc-400">
        Qualified inbound refs: {report.targetInboundSummary.qualifiedSemanticInboundCount} · raw whole-EXE dword matches: {report.targetInboundSummary.rawWholeExeOccurrenceCount} · unexplained raw equalities: {report.targetInboundSummary.unexplainedRawOccurrenceCount}
      </div>
      <div className="mt-1 text-zinc-400">
        Object-2 zero-run candidates ≥20 B: {report.storageReconnaissance.runtimeAddressableObject2ZeroRunCandidateCount} · promoted safe: {report.storageReconnaissance.safeCandidateCount}
      </div>
      {targetCensus && targetCensus.semanticInboundReferences.map(ref => (
        <div key={`${ref.sequence}-${ref.sequenceFrameIndex}`} className="mt-2 text-violet-200">
          Structured inbound: {ref.sequence}[{ref.sequenceFrameIndex}] cell {ref.sequenceCellWatcomOffsetHex} → heart_2 {target.frameRecordWatcomOffsetHex} · EXE {ref.physicalStartHex}
        </div>
      ))}
      <div className="mt-2 text-amber-300">
        Result: fourth-part grammar is available, but relocation storage remains unqualified. No add-part or pointer writer is enabled.
      </div>
    </div>
  );
}

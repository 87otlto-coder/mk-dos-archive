import React from 'react';
import { MK1ReshapeMultiFullCapacitySemanticsReport } from '../games/mk1/research/reshapeMultiFullCapacitySemantics';

export function ReshapeMultiFullCapacitySemanticsPanel({report}:{report:MK1ReshapeMultiFullCapacitySemanticsReport}){
  const r=report.reshapeMulti,b=report.boundedHeartCase;
  return <div className="mt-3 p-3 rounded border border-cyan-900 bg-cyan-950/20 text-xs font-mono text-zinc-300">
    <div className="font-semibold text-cyan-300">RESHAPE_MULTI full-capacity termination semantics · 1E.3O.10</div>
    <div className="mt-1">Linked-object loop: {r.loopBranchPhysicalHex} → {r.loopBranchTargetHex} · descriptor load {r.descriptorLoadPhysicalHex}</div>
    <div className="mt-1 text-zinc-400">Chain exhaustion returns before another descriptor read: {r.chainExhaustionReturnsBeforeNextDescriptorRead?'yes':'no'} · fallthrough RET {r.fallthroughRetPhysicalHex ?? 'unresolved'}</div>
    <div className="mt-1 text-zinc-400">heart_2 existing slot {b.currentTerminatorWatcomOffsetHex} / EXE {b.currentTerminatorPhysicalHex}: 0 → fourth descriptor pointer</div>
    <div className="mt-2 text-emerald-300">{report.decision.fourthPartFitsExistingRecordAllocation?'Result: 4 parts fit in the existing 16-byte record; bounded fourth-part relocation is not required.':'Result unresolved; keep relocation/topology writing disabled.'}</div>
    <div className="mt-1 text-amber-300">Read-only qualification. No fourth-part writer is enabled in O10.</div>
  </div>;
}

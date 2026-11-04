import React from 'react';
import { Download } from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import {
  buildHeartRipFourthPartTopologyBundle,
  MK1HeartRipFourthPartTopologyResult,
} from '../games/mk1/research/heartRipFourthPartTopologyWriter';

export function HeartRipFourthPartTopologyPanel({source,result}:{source:DirectorySource;result:MK1HeartRipFourthPartTopologyResult}){
  const r=result.report;
  const downloadBundle=()=>{
    const zip=buildHeartRipFourthPartTopologyBundle(result);
    const url=URL.createObjectURL(new Blob([new Uint8Array(zip).buffer],{type:'application/zip'}));
    const a=document.createElement('a');a.href=url;a.download='mk1-1E3O11-heart-rip-fourth-part-runtime-test.zip';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  };
  return <div className="mt-3 p-3 rounded border border-fuchsia-900 bg-fuchsia-950/20 text-xs font-mono text-zinc-300">
    <div className="font-semibold text-fuchsia-300">Controlled fourth-part topology write · 1E.3O.11</div>
    <div className="mt-1">heart_2: [{r.insertion.beforeParts.join(', ')}, 0] → [{r.insertion.afterParts.join(', ')}]</div>
    <div className="mt-1 text-zinc-400">Fourth slot: {r.target.slotWatcomOffsetHex} / EXE {r.target.slotPhysicalHex} · {r.insertion.beforeDwordHex} → {r.insertion.afterDwordHex}</div>
    <div className="mt-1 text-zinc-400">Allocation: 16 bytes unchanged · termination: linked-object chain exhaustion · relocation: no · sequence rewrite: no</div>
    <div className="mt-1 text-emerald-300">{r.evidence.changedByteCount} changed EXE bytes · {r.evidence.unexpectedByteChanges} unexpected · semantic reparse {r.evidence.semanticReparseMatches?'yes':'no'} · reversal {r.evidence.reverseRestoresOriginal?'exact':'failed'}</div>
    <div className="mt-1 text-amber-300">Static compiler validation passed. Project runtime closeout verified the bounded fourth-part mechanism: the fatality completed normally with a visible heart-animation difference and no crash/corruption.</div>
    <button onClick={downloadBundle} className="mt-3 px-3 py-2 rounded bg-fuchsia-800 hover:bg-fuchsia-700 text-white flex items-center gap-2"><Download className="w-4 h-4"/>Download O11 Runtime Test Bundle</button>
    <div className="mt-2 text-zinc-500">Use only in a separate copy of {source.directoryName}. The untouched source directory is never overwritten.</div>
  </div>;
}

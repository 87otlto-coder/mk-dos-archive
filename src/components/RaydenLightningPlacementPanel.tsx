import React, { useState } from 'react';
import { Download, Zap } from 'lucide-react';
import { buildRaydenLightningRuntimeBundle, MK1RaydenLightningPlacementResult } from '../games/mk1/research/raydenLightningPlacementFixture';

export function RaydenLightningPlacementPanel({ result }: { result: MK1RaydenLightningPlacementResult }) {
  const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null); const r=result.report;
  const download=async()=>{setBusy(true);setError(null);try{const zip=await buildRaydenLightningRuntimeBundle(result);const url=URL.createObjectURL(new Blob([new Uint8Array(zip).buffer],{type:'application/zip'}));const a=document.createElement('a');a.href=url;a.download='MK1-1E3O4-rayden-lightning-y24-runtime-test.zip';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
  return <div className="mt-3 p-3 rounded border border-cyan-900 bg-cyan-950/10 text-xs font-mono text-zinc-300">
    <div className="flex items-center gap-2 font-semibold text-cyan-300"><Zap className="w-4 h-4"/>Rayden lightning persistent placement fixture · 1E.3O.4</div>
    <div className="mt-2">Route: Rayden ID 2 → projectile setup #{r.route.setupIndex} → <b>HANDBO22</b> · travel #{r.route.travelIndex} → HANDBO4…17.</div>
    <div className="mt-1 text-zinc-400">Persistent animation loop: {r.route.loopDescriptors.join(' → ')}. Setup palette: {r.palette.symbol} ({r.palette.declaredLength} colors).</div>
    <div className="mt-2">Controlled edit: <b>+{r.edit.delta}px Y</b> across {r.edit.descriptorCount} qualified local descriptors · {r.evidence.changedByteCount} executable bytes differ · exact reversal {r.evidence.reverseRestoresOriginal?'passes':'fails'}.</div>
    <div className="mt-1 text-zinc-400">World position, velocity and collision data are untouched. Project closeout note: the user subsequently runtime-verified this +24px visual displacement successfully; the generated O4 report itself remains the static qualification artifact.</div>
    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-1 text-[10px]">
      {r.descriptors.map(d=><div key={d.symbol} className="rounded border border-zinc-800 p-1.5"><span className="text-cyan-200">{d.symbol}</span><br/>y {d.y} → {d.editedY}</div>)}
    </div>
    <button onClick={download} disabled={busy} className="mt-3 px-3 py-2 rounded bg-cyan-800 hover:bg-cyan-700 disabled:opacity-50 text-white flex items-center gap-2"><Download className="w-4 h-4"/>{busy?'Building bundle…':'Download Rayden lightning +24px Y test bundle'}</button>
    {error&&<div className="mt-2 text-red-300">{error}</div>}
  </div>;
}

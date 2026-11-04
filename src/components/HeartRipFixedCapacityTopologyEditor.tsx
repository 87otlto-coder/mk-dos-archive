import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';
import {
  buildHeartRipFixedCapacityTopologyBundle,
  createMK1HeartRipFixedCapacityTopologyEditExport,
  executeHeartRipFixedCapacityTopologyEdit,
  MK1HeartRipFixedCapacityTopologyEditResult,
  MK1HeartRipFixedCapacityTopologyEditorReport,
} from '../games/mk1/research/heartRipFixedCapacityTopologyEditor';
import { HeartRipDescriptorSymbol } from '../games/mk1/research/heartRipAnimationCanvasEditor';

interface Props { source: DirectorySource; model: MK1HeartRipFixedCapacityTopologyEditorReport; onExport: (artifact: ResearchArtifact) => void; }
function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
function saveBlob(bytes:Uint8Array,name:string,type:string){const url=URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}

export function HeartRipFixedCapacityTopologyEditor({source,model,onExport}:Props){
  const baseline=[...model.target.baselineParts];
  const [parts,setParts]=useState<HeartRipDescriptorSymbol[]>(baseline);
  const [addSymbol,setAddSymbol]=useState<HeartRipDescriptorSymbol>(model.availableDescriptors.find(d=>!baseline.includes(d.symbol))?.symbol ?? model.availableDescriptors[0].symbol);
  const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const [compiled,setCompiled]=useState<MK1HeartRipFixedCapacityTopologyEditResult|null>(null);
  const dirty=parts.join('|')!==baseline.join('|');
  const unused=useMemo(()=>model.availableDescriptors.map(d=>d.symbol).filter(s=>!parts.includes(s)),[model,parts]);
  const descriptor=(s:HeartRipDescriptorSymbol)=>model.availableDescriptors.find(d=>d.symbol===s)!;
  const move=(i:number,delta:number)=>{setParts(prev=>{const j=i+delta;if(j<0||j>=prev.length)return prev;const next=[...prev];[next[i],next[j]]=[next[j],next[i]];return next;});setCompiled(null);};
  const remove=(i:number)=>{if(parts.length<=1)return;setParts(prev=>prev.filter((_,idx)=>idx!==i));setCompiled(null);};
  const replace=(i:number,s:HeartRipDescriptorSymbol)=>setParts(prev=>{if(prev.includes(s)&&prev[i]!==s)return prev;const next=[...prev];next[i]=s;return next;});
  const effectiveAddSymbol=unused.includes(addSymbol)?addSymbol:unused[0];
  const add=()=>{if(parts.length>=4||!effectiveAddSymbol||parts.includes(effectiveAddSymbol))return;setParts(prev=>[...prev,effectiveAddSymbol]);setAddSymbol(unused.find(s=>s!==effectiveAddSymbol)??effectiveAddSymbol);setCompiled(null);};
  const reset=()=>{setParts(baseline);setCompiled(null);setError(null);};
  const compile=async()=>{if(!dirty||busy)return;setBusy(true);setError(null);try{const result=await executeHeartRipFixedCapacityTopologyEdit(source,model,{parts:[...parts],note:'Authored through Pass 1E.3O.12 fixed-capacity heart_2 topology editor'});setCompiled(result);const data=createMK1HeartRipFixedCapacityTopologyEditExport(result);onExport({filename:`mk1_heart_rip_fixed_capacity_topology_edit_${stamp()}.json`,pass:'1E.3O.12-edit',status:result.report.status,timestamp:data.timestamp,data});}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
  const download=()=>{if(!compiled||busy)return;saveBlob(buildHeartRipFixedCapacityTopologyBundle(compiled),'MK1-1E3O12-heart-rip-fixed-capacity-topology-edit.zip','application/zip');};
  const termination=parts.length===4?'linked-object chain exhaustion':'zero terminator';

  return <section className="mt-3 p-3 rounded border border-sky-800 bg-sky-950/10 text-xs text-zinc-300" aria-label="Heart-rip fixed-capacity topology editor">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-sky-300">Heart-rip fixed-capacity topology authoring · 1E.3O.12</h3><span className="ml-auto text-[10px] font-mono text-emerald-300">heart_2 · 16 bytes · 1–4 parts · no relocation</span></div>
    <p className="mt-2 text-zinc-400">Add, remove, replace or reorder parts inside the already-qualified four-object heart burst. Only the nine established KHEART descriptors are selectable. Duplicate descriptor pointers remain blocked.</p>
    <div className="mt-3 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-3">
      <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
        <div className="font-semibold text-zinc-200">Structural pointer order</div>
        <div className="mt-2 space-y-2">{parts.map((symbol,i)=>{const d=descriptor(symbol);return <div key={`${symbol}-${i}`} className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 bg-zinc-900/70 p-2"><span className="w-7 text-zinc-500 font-mono">{i+1}.</span><select value={symbol} onChange={e=>{replace(i,e.target.value as HeartRipDescriptorSymbol);setCompiled(null);}} className="min-w-[180px] bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-100">{model.availableDescriptors.map(opt=><option key={opt.symbol} value={opt.symbol} disabled={parts.includes(opt.symbol)&&opt.symbol!==symbol}>{opt.symbol}</option>)}</select><span className="font-mono text-[10px] text-zinc-500">{d.descriptorRefHex} · {d.width}×{d.height} · ({d.x},{d.y})</span><div className="ml-auto flex gap-1"><button onClick={()=>move(i,-1)} disabled={i===0} className="p-1 rounded bg-zinc-800 disabled:opacity-30"><ArrowUp className="w-3 h-3"/></button><button onClick={()=>move(i,1)} disabled={i===parts.length-1} className="p-1 rounded bg-zinc-800 disabled:opacity-30"><ArrowDown className="w-3 h-3"/></button><button onClick={()=>remove(i)} disabled={parts.length<=1} className="p-1 rounded bg-red-950/70 text-red-300 disabled:opacity-30"><Trash2 className="w-3 h-3"/></button></div></div>;})}</div>
        <div className="mt-3 flex flex-wrap gap-2 items-center"><select value={effectiveAddSymbol??addSymbol} onChange={e=>setAddSymbol(e.target.value as HeartRipDescriptorSymbol)} disabled={parts.length>=4||unused.length===0} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 disabled:opacity-40">{unused.map(s=><option key={s} value={s}>{s}</option>)}</select><button onClick={add} disabled={parts.length>=4||unused.length===0} className="px-2 py-1 rounded bg-sky-800 hover:bg-sky-700 disabled:opacity-40 flex items-center gap-1"><Plus className="w-3 h-3"/>Add part</button></div>
      </div>
      <div className="space-y-3">
        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3"><div className="font-semibold text-zinc-200">Encoding</div><div className="mt-2 font-mono text-sky-300">[{parts.join(', ')}]</div><div className="mt-2 text-zinc-400">{parts.length}/4 linked objects · termination: <span className="text-zinc-200">{termination}</span></div><div className="mt-1 text-zinc-500">Allocation stays 16 bytes at {model.target.physicalStartHex}. No sequence pointer rewrite.</div></div>
        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3"><div className="font-semibold text-zinc-200">Baseline</div><div className="mt-2 font-mono text-zinc-400">[{baseline.join(', ')}]</div><button onClick={reset} disabled={!dirty||busy} className="mt-3 px-2 py-1 rounded bg-zinc-800 disabled:opacity-40 flex items-center gap-1"><RotateCcw className="w-3 h-3"/>Reset</button></div>
        <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3"><button onClick={compile} disabled={!dirty||busy} className="px-3 py-2 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-2"><Save className="w-4 h-4"/>{busy?'Compiling…':'Compile topology edit'}</button><div className="mt-2 text-[10px] text-zinc-500">Compiler fresh-reads canonical MK1.EXE, diffs the whole file, reparses the four-slot topology and requires exact reversal.</div></div>
      </div>
    </div>
    {compiled&&<div className="mt-3 rounded border border-emerald-900 bg-emerald-950/20 p-3"><div className="font-semibold text-emerald-300">Fixed-capacity topology edit compiled</div><div className="mt-1 font-mono">{compiled.report.topology.beforePartCount} → {compiled.report.topology.afterPartCount} parts · {compiled.report.evidence.changedByteCount} changed EXE bytes · unexpected {compiled.report.evidence.unexpectedByteChanges} · reparse {compiled.report.evidence.semanticReparseMatches?'yes':'no'} · reversal {compiled.report.evidence.reverseRestoresOriginal?'exact':'failed'}</div><div className="mt-1 text-zinc-500 break-all">edited SHA-256 {compiled.report.evidence.editedSha256}</div><button onClick={download} className="mt-3 px-3 py-2 rounded bg-sky-800 hover:bg-sky-700 text-white flex items-center gap-2"><Download className="w-4 h-4"/>Download edited MK1 test bundle</button></div>}
    {error&&<div className="mt-3 rounded border border-red-900 bg-red-950/20 p-2 text-red-300">{error}</div>}
    <div className="mt-3 text-[10px] text-zinc-500">Fail-closed boundary: heart_2 only, 1–4 unique qualified KHEART descriptors. Other frame records, duplicate pointers, arbitrary pointers, relocation/allocation, descriptor bytes, pixels, palette and gameplay/collision remain blocked.</div>
  </section>;
}

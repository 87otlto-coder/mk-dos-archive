import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';
import {
  buildHeartRipAtomicCompositionBundle,
  createMK1HeartRipAtomicCompositionEditExport,
  executeHeartRipAtomicCompositionEdit,
  MK1HeartRipAtomicCompositionEditResult,
  MK1HeartRipAtomicCompositionEditorReport,
} from '../games/mk1/research/heartRipAtomicCompositionEditor';
import { HeartRipDescriptorSymbol } from '../games/mk1/research/heartRipAnimationCanvasEditor';

interface Props { source:DirectorySource; model:MK1HeartRipAtomicCompositionEditorReport; onExport:(artifact:ResearchArtifact)=>void; }
function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
function saveBlob(bytes:Uint8Array,name:string,type:string){const url=URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}

type Coord={x:number;y:number};

export function HeartRipAtomicCompositionEditor({source,model,onExport}:Props){
  const baseline=[...model.target.baselineParts];
  const baselineCoords=useMemo(()=>Object.fromEntries(model.descriptors.map(d=>[d.symbol,{x:d.x,y:d.y}])) as Record<HeartRipDescriptorSymbol,Coord>,[model]);
  const [parts,setParts]=useState<HeartRipDescriptorSymbol[]>(baseline);
  const [coords,setCoords]=useState<Record<HeartRipDescriptorSymbol,Coord>>(()=>JSON.parse(JSON.stringify(baselineCoords)) as Record<HeartRipDescriptorSymbol,Coord>);
  const [addSymbol,setAddSymbol]=useState<HeartRipDescriptorSymbol>(model.descriptors.find(d=>!baseline.includes(d.symbol))?.symbol??model.descriptors[0].symbol);
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[compiled,setCompiled]=useState<MK1HeartRipAtomicCompositionEditResult|null>(null);
  const descriptor=(s:HeartRipDescriptorSymbol)=>model.descriptors.find(d=>d.symbol===s)!;
  const unused=useMemo(()=>model.descriptors.map(d=>d.symbol).filter(s=>!parts.includes(s)),[model,parts]);
  const topologyDirty=parts.join('|')!==baseline.join('|');
  const placementDirty=parts.some(s=>coords[s].x!==baselineCoords[s].x||coords[s].y!==baselineCoords[s].y);
  const dirty=topologyDirty||placementDirty;
  const effectiveAddSymbol=unused.includes(addSymbol)?addSymbol:unused[0];
  const clearCompile=()=>{setCompiled(null);setError(null);};
  const move=(i:number,delta:number)=>{setParts(prev=>{const j=i+delta;if(j<0||j>=prev.length)return prev;const next=[...prev];[next[i],next[j]]=[next[j],next[i]];return next;});clearCompile();};
  const remove=(i:number)=>{if(parts.length<=1)return;setParts(prev=>prev.filter((_,idx)=>idx!==i));clearCompile();};
  const replace=(i:number,s:HeartRipDescriptorSymbol)=>{setParts(prev=>{if(prev.includes(s)&&prev[i]!==s)return prev;const next=[...prev];next[i]=s;return next;});clearCompile();};
  const add=()=>{if(parts.length>=4||!effectiveAddSymbol||parts.includes(effectiveAddSymbol))return;setParts(prev=>[...prev,effectiveAddSymbol]);setAddSymbol(unused.find(s=>s!==effectiveAddSymbol)??effectiveAddSymbol);clearCompile();};
  const setCoord=(s:HeartRipDescriptorSymbol,field:'x'|'y',value:number)=>{setCoords(prev=>({...prev,[s]:{...prev[s],[field]:value}}));clearCompile();};
  const reset=()=>{setParts([...baseline]);setCoords(JSON.parse(JSON.stringify(baselineCoords)) as Record<HeartRipDescriptorSymbol,Coord>);setCompiled(null);setError(null);};
  const placements=parts.filter(s=>coords[s].x!==baselineCoords[s].x||coords[s].y!==baselineCoords[s].y).map(symbol=>({symbol,x:coords[symbol].x,y:coords[symbol].y}));
  const compile=async()=>{if(!dirty||busy)return;setBusy(true);setError(null);try{const result=await executeHeartRipAtomicCompositionEdit(source,model,{parts:[...parts],placements,note:'Authored through Pass 1E.3O.13 atomic heart_2 composition editor'});setCompiled(result);const data=createMK1HeartRipAtomicCompositionEditExport(result);onExport({filename:`mk1_heart_rip_atomic_composition_edit_${stamp()}.json`,pass:'1E.3O.13-edit',status:result.report.status,timestamp:data.timestamp,data});}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
  const download=()=>{if(compiled&&!busy)saveBlob(buildHeartRipAtomicCompositionBundle(compiled),'MK1-1E3O13-heart-rip-atomic-composition-edit.zip','application/zip');};
  const termination=parts.length===4?'linked-object chain exhaustion':'zero terminator';

  return <section className="mt-3 p-3 rounded border border-violet-800 bg-violet-950/10 text-xs text-zinc-300" aria-label="Heart-rip atomic composition editor">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-violet-300">Heart-rip atomic topology + placement authoring · 1E.3O.13</h3><span className="ml-auto text-[10px] font-mono text-emerald-300">heart_2 · 16 bytes · atomic semantic transaction</span></div>
    <p className="mt-2 text-zinc-400">Compose the verified fixed-capacity topology writer and descriptor-local X/Y placement writer in one compile. Placement changes use shared descriptor storage, so aliases elsewhere in the heart-rip animation are shown explicitly.</p>
    <div className="mt-3 space-y-2">{parts.map((symbol,i)=>{const d=descriptor(symbol),c=coords[symbol],aliases=Array.from(new Set([...d.existingPreviewKeys,model.target.previewKey]));return <div key={`${symbol}-${i}`} className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
      <div className="flex flex-wrap items-center gap-2"><span className="w-7 font-mono text-zinc-500">{i+1}.</span><select value={symbol} onChange={e=>replace(i,e.target.value as HeartRipDescriptorSymbol)} className="min-w-[170px] bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100">{model.descriptors.map(opt=><option key={opt.symbol} value={opt.symbol} disabled={parts.includes(opt.symbol)&&opt.symbol!==symbol}>{opt.symbol}</option>)}</select><span className="text-[10px] font-mono text-zinc-500">{d.descriptorRefHex} · {d.width}×{d.height}</span><div className="ml-auto flex gap-1"><button onClick={()=>move(i,-1)} disabled={i===0} className="p-1 rounded bg-zinc-800 disabled:opacity-30"><ArrowUp className="w-3 h-3"/></button><button onClick={()=>move(i,1)} disabled={i===parts.length-1} className="p-1 rounded bg-zinc-800 disabled:opacity-30"><ArrowDown className="w-3 h-3"/></button><button onClick={()=>remove(i)} disabled={parts.length<=1} className="p-1 rounded bg-red-950/70 text-red-300 disabled:opacity-30"><Trash2 className="w-3 h-3"/></button></div></div>
      <div className="mt-2 flex flex-wrap gap-3 items-end"><label className="text-[10px] text-zinc-500">X<input type="number" min={-32768} max={32767} value={c.x} onChange={e=>setCoord(symbol,'x',Number(e.target.value))} className="mt-1 block w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono"/></label><label className="text-[10px] text-zinc-500">Y<input type="number" min={-32768} max={32767} value={c.y} onChange={e=>setCoord(symbol,'y',Number(e.target.value))} className="mt-1 block w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono"/></label><button onClick={()=>{setCoord(symbol,'x',baselineCoords[symbol].x);setCoord(symbol,'y',baselineCoords[symbol].y);}} disabled={c.x===baselineCoords[symbol].x&&c.y===baselineCoords[symbol].y} className="px-2 py-1 rounded bg-zinc-800 disabled:opacity-30">Reset X/Y</button><div className="text-[10px] text-zinc-500">baseline ({baselineCoords[symbol].x},{baselineCoords[symbol].y}) · affected occurrences: <span className="text-amber-300">{aliases.join(', ')}</span></div></div>
    </div>;})}</div>
    <div className="mt-3 flex flex-wrap gap-2 items-center"><select value={effectiveAddSymbol??addSymbol} onChange={e=>setAddSymbol(e.target.value as HeartRipDescriptorSymbol)} disabled={parts.length>=4||unused.length===0} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 disabled:opacity-40">{unused.map(s=><option key={s} value={s}>{s}</option>)}</select><button onClick={add} disabled={parts.length>=4||unused.length===0} className="px-2 py-1 rounded bg-violet-800 hover:bg-violet-700 disabled:opacity-40 flex items-center gap-1"><Plus className="w-3 h-3"/>Add part</button><span className="text-zinc-500">{parts.length}/4 parts · termination: {termination}</span></div>
    <div className="mt-3 flex flex-wrap gap-2"><button onClick={reset} disabled={!dirty||busy} className="px-3 py-2 rounded bg-zinc-800 disabled:opacity-40 flex items-center gap-2"><RotateCcw className="w-4 h-4"/>Reset transaction</button><button onClick={compile} disabled={!dirty||busy} className="px-3 py-2 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-2"><Save className="w-4 h-4"/>{busy?'Compiling…':'Compile atomic edit'}</button></div>
    <div className="mt-2 text-[10px] text-zinc-500">Topology changes are limited to the existing heart_2 16-byte allocation. X/Y changes are limited to descriptors currently selected into the authored topology. The compiler derives expected topology and placement bytes independently, diffs the whole EXE, reparses both semantic layers and requires exact canonical reversal.</div>
    {compiled&&<div className="mt-3 rounded border border-emerald-900 bg-emerald-950/20 p-3"><div className="font-semibold text-emerald-300">Atomic composition edit compiled</div><div className="mt-1 font-mono">{compiled.report.topology.beforePartCount} → {compiled.report.topology.afterPartCount} parts · {compiled.report.placements.length} placement edits · {compiled.report.evidence.changedByteCount} EXE bytes · unexpected {compiled.report.evidence.unexpectedByteChanges} · topology reparse {compiled.report.evidence.topologyReparseMatches?'yes':'no'} · placement reparse {compiled.report.evidence.placementReparseMatches?'yes':'no'} · reversal {compiled.report.evidence.reverseRestoresOriginal?'exact':'failed'}</div><div className="mt-1 text-zinc-500 break-all">edited SHA-256 {compiled.report.evidence.editedSha256}</div>{compiled.report.placements.some(p=>p.aliasSideEffectOutsideHeart2)&&<div className="mt-2 text-amber-300">Alias note: one or more X/Y edits also affect existing heart-rip occurrences outside PRIMARY:2. See exported JSON for exact preview keys.</div>}<button onClick={download} className="mt-3 px-3 py-2 rounded bg-violet-800 hover:bg-violet-700 text-white flex items-center gap-2"><Download className="w-4 h-4"/>Download edited MK1 test bundle</button></div>}
    {error&&<div className="mt-3 rounded border border-red-900 bg-red-950/20 p-2 text-red-300">{error}</div>}
    <div className="mt-3 text-[10px] text-zinc-500">Fail-closed boundary: heart_2 topology only; 1–4 unique qualified KHEART descriptors; signed-int16 X/Y only for selected descriptors. Other topology, arbitrary pointers, duplicate pointers, relocation, dimensions, packed refs, pixels, palette and gameplay/collision remain blocked.</div>
  </section>;
}

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { DirectorySource } from '../core/filesystem/DirectorySource';
import { ResearchArtifact } from '../core/research/researchArtifactDownloads';
import { HeartRipDescriptorSymbol } from '../games/mk1/research/heartRipAnimationCanvasEditor';
import {
  buildHeartRipFullFixedLayoutCompositionBundle,
  createMK1HeartRipFullFixedLayoutCompositionEditExport,
  executeHeartRipFullFixedLayoutCompositionEdit,
  HEART_RIP_FRAME_KEYS,
  HeartRipFrameKey,
  MK1HeartRipFullFixedLayoutCompositionEditResult,
  MK1HeartRipFullFixedLayoutCompositionEditorReport,
} from '../games/mk1/research/heartRipFullFixedLayoutCompositionEditor';

interface Props { source:DirectorySource; model:MK1HeartRipFullFixedLayoutCompositionEditorReport; onExport:(artifact:ResearchArtifact)=>void; }
type Coord={x:number;y:number};
type FrameState=Record<HeartRipFrameKey,HeartRipDescriptorSymbol[]>;
function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
function saveBlob(bytes:Uint8Array,name:string,type:string){const url=URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}

export function HeartRipFullFixedLayoutCompositionEditor({source,model,onExport}:Props){
  const baselineFrames=useMemo(()=>Object.fromEntries(model.frames.map(f=>[f.frameKey,[...f.baselineParts]])) as FrameState,[model]);
  const baselineCoords=useMemo(()=>Object.fromEntries(model.descriptors.map(d=>[d.symbol,{x:d.x,y:d.y}])) as Record<HeartRipDescriptorSymbol,Coord>,[model]);
  const [frames,setFrames]=useState<FrameState>(()=>JSON.parse(JSON.stringify(baselineFrames)) as FrameState);
  const [coords,setCoords]=useState<Record<HeartRipDescriptorSymbol,Coord>>(()=>JSON.parse(JSON.stringify(baselineCoords)) as Record<HeartRipDescriptorSymbol,Coord>);
  const [addSymbol,setAddSymbol]=useState<HeartRipDescriptorSymbol>(model.descriptors.find(d=>!baselineFrames.heart_2.includes(d.symbol))?.symbol??model.descriptors[0].symbol);
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[compiled,setCompiled]=useState<MK1HeartRipFullFixedLayoutCompositionEditResult|null>(null);
  const descriptor=(s:HeartRipDescriptorSymbol)=>model.descriptors.find(d=>d.symbol===s)!;
  const frameModel=(k:HeartRipFrameKey)=>model.frames.find(f=>f.frameKey===k)!;
  const clearCompile=()=>{setCompiled(null);setError(null);};
  const selectedSymbols=useMemo(()=>Array.from(new Set(HEART_RIP_FRAME_KEYS.flatMap(k=>frames[k]))),[frames]);
  const authoredPreviewKeys=(s:HeartRipDescriptorSymbol)=>{const keys=new Set<string>();for(const k of HEART_RIP_FRAME_KEYS)if(frames[k].includes(s))for(const p of frameModel(k).previewKeys)keys.add(p);return [...keys].sort();};
  const compositionDirty=HEART_RIP_FRAME_KEYS.some(k=>frames[k].join('|')!==baselineFrames[k].join('|'));
  const placementDirty=selectedSymbols.some(s=>coords[s].x!==baselineCoords[s].x||coords[s].y!==baselineCoords[s].y);
  const dirty=compositionDirty||placementDirty;
  const unusedHeart2=model.descriptors.map(d=>d.symbol).filter(s=>!frames.heart_2.includes(s));
  const effectiveAddSymbol=unusedHeart2.includes(addSymbol)?addSymbol:unusedHeart2[0];

  const replaceSingle=(k:HeartRipFrameKey,s:HeartRipDescriptorSymbol)=>{setFrames(prev=>({...prev,[k]:[s]}));clearCompile();};
  const replaceHeart2=(i:number,s:HeartRipDescriptorSymbol)=>{setFrames(prev=>{if(prev.heart_2.includes(s)&&prev.heart_2[i]!==s)return prev;const next=[...prev.heart_2];next[i]=s;return{...prev,heart_2:next};});clearCompile();};
  const moveHeart2=(i:number,delta:number)=>{setFrames(prev=>{const next=[...prev.heart_2],j=i+delta;if(j<0||j>=next.length)return prev;[next[i],next[j]]=[next[j],next[i]];return{...prev,heart_2:next};});clearCompile();};
  const removeHeart2=(i:number)=>{if(frames.heart_2.length<=1)return;setFrames(prev=>({...prev,heart_2:prev.heart_2.filter((_,idx)=>idx!==i)}));clearCompile();};
  const addHeart2=()=>{if(frames.heart_2.length>=4||!effectiveAddSymbol||frames.heart_2.includes(effectiveAddSymbol))return;setFrames(prev=>({...prev,heart_2:[...prev.heart_2,effectiveAddSymbol]}));setAddSymbol(unusedHeart2.find(s=>s!==effectiveAddSymbol)??effectiveAddSymbol);clearCompile();};
  const setCoord=(s:HeartRipDescriptorSymbol,field:'x'|'y',value:number)=>{setCoords(prev=>({...prev,[s]:{...prev[s],[field]:value}}));clearCompile();};
  const reset=()=>{setFrames(JSON.parse(JSON.stringify(baselineFrames)) as FrameState);setCoords(JSON.parse(JSON.stringify(baselineCoords)) as Record<HeartRipDescriptorSymbol,Coord>);setCompiled(null);setError(null);};
  const placements=selectedSymbols.filter(s=>coords[s].x!==baselineCoords[s].x||coords[s].y!==baselineCoords[s].y).map(symbol=>({symbol,x:coords[symbol].x,y:coords[symbol].y}));
  const requestFrames=HEART_RIP_FRAME_KEYS.map(frameKey=>({frameKey,parts:[...frames[frameKey]]}));
  const compile=async()=>{if(!dirty||busy)return;setBusy(true);setError(null);try{const result=await executeHeartRipFullFixedLayoutCompositionEdit(source,model,{frames:requestFrames,placements,note:'Authored through Pass 1E.3O.14 full heart-rip fixed-layout composition editor'});setCompiled(result);const data=createMK1HeartRipFullFixedLayoutCompositionEditExport(result);onExport({filename:`mk1_heart_rip_full_fixed_layout_composition_edit_${stamp()}.json`,pass:'1E.3O.14-edit',status:result.report.status,timestamp:data.timestamp,data});}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
  const download=()=>{if(compiled&&!busy)saveBlob(buildHeartRipFullFixedLayoutCompositionBundle(compiled),'MK1-1E3O14-heart-rip-full-fixed-layout-composition-edit.zip','application/zip');};

  return <section className="mt-3 p-3 rounded border border-violet-800 bg-violet-950/10 text-xs text-zinc-300" aria-label="Full heart-rip fixed-layout composition editor">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-violet-300">Full heart-rip fixed-layout composition authoring · 1E.3O.14</h3><span className="ml-auto text-[10px] font-mono text-emerald-300">7 frame records · fixed allocations · atomic compile</span></div>
    <p className="mt-2 text-zinc-400">Edit the complete qualified Kano heart-rip animation without relocating records. The six 8-byte records remain one-part pointer+zero records; heart_2 retains the verified 1–4-part 16-byte topology. Descriptor X/Y is shared storage, so every authored occurrence affected by a move is shown.</p>

    <div className="mt-3 space-y-2">{HEART_RIP_FRAME_KEYS.map(k=>{const fm=frameModel(k),parts=frames[k];return <div key={k} className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
      <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-zinc-200">{k}</span><span className="text-[10px] font-mono text-zinc-500">{fm.recordWatcomOffsetHex} · {fm.allocationByteLength} bytes · {fm.previewKeys.join(', ')}</span><span className="ml-auto text-[10px] text-zinc-500">{k==='heart_2'?'1–4 parts':'single-part replacement only'}</span></div>
      {k!=='heart_2' ? <div className="mt-2"><select value={parts[0]} onChange={e=>replaceSingle(k,e.target.value as HeartRipDescriptorSymbol)} className="min-w-[190px] bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100">{model.descriptors.map(d=><option key={d.symbol} value={d.symbol}>{d.symbol}</option>)}</select></div> : <>
        <div className="mt-2 space-y-2">{parts.map((symbol,i)=><div key={`${symbol}-${i}`} className="flex flex-wrap items-center gap-2"><span className="w-7 font-mono text-zinc-500">{i+1}.</span><select value={symbol} onChange={e=>replaceHeart2(i,e.target.value as HeartRipDescriptorSymbol)} className="min-w-[190px] bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100">{model.descriptors.map(opt=><option key={opt.symbol} value={opt.symbol} disabled={parts.includes(opt.symbol)&&opt.symbol!==symbol}>{opt.symbol}</option>)}</select><span className="text-[10px] font-mono text-zinc-500">{descriptor(symbol).descriptorRefHex}</span><div className="ml-auto flex gap-1"><button onClick={()=>moveHeart2(i,-1)} disabled={i===0} className="p-1 rounded bg-zinc-800 disabled:opacity-30"><ArrowUp className="w-3 h-3"/></button><button onClick={()=>moveHeart2(i,1)} disabled={i===parts.length-1} className="p-1 rounded bg-zinc-800 disabled:opacity-30"><ArrowDown className="w-3 h-3"/></button><button onClick={()=>removeHeart2(i)} disabled={parts.length<=1} className="p-1 rounded bg-red-950/70 text-red-300 disabled:opacity-30"><Trash2 className="w-3 h-3"/></button></div></div>)}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2"><select value={effectiveAddSymbol??addSymbol} onChange={e=>setAddSymbol(e.target.value as HeartRipDescriptorSymbol)} disabled={parts.length>=4||unusedHeart2.length===0} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 disabled:opacity-40">{unusedHeart2.map(s=><option key={s} value={s}>{s}</option>)}</select><button onClick={addHeart2} disabled={parts.length>=4||unusedHeart2.length===0} className="px-2 py-1 rounded bg-violet-800 hover:bg-violet-700 disabled:opacity-40 flex items-center gap-1"><Plus className="w-3 h-3"/>Add part</button><span className="text-zinc-500">{parts.length}/4 · {parts.length===4?'chain exhaustion':'zero terminator'}</span></div>
      </>}
    </div>;})}</div>

    <div className="mt-4 rounded border border-zinc-800 bg-zinc-950/40 p-3"><div className="font-semibold text-zinc-200">Descriptor placement used by authored animation</div><div className="mt-1 text-[10px] text-zinc-500">A descriptor can be referenced by several frame records/sequence occurrences. One X/Y edit changes that shared descriptor everywhere listed below.</div>
      <div className="mt-3 grid gap-2">{selectedSymbols.map(symbol=>{const d=descriptor(symbol),c=coords[symbol],keys=authoredPreviewKeys(symbol);return <div key={symbol} className="rounded border border-zinc-800 p-2 flex flex-wrap gap-3 items-end"><div className="min-w-[140px]"><div className="font-mono text-zinc-200">{symbol}</div><div className="text-[10px] text-zinc-500">{d.width}×{d.height} · {d.descriptorRefHex}</div></div><label className="text-[10px] text-zinc-500">X<input type="number" min={-32768} max={32767} value={c.x} onChange={e=>setCoord(symbol,'x',Number(e.target.value))} className="mt-1 block w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono"/></label><label className="text-[10px] text-zinc-500">Y<input type="number" min={-32768} max={32767} value={c.y} onChange={e=>setCoord(symbol,'y',Number(e.target.value))} className="mt-1 block w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-100 font-mono"/></label><button onClick={()=>{setCoord(symbol,'x',baselineCoords[symbol].x);setCoord(symbol,'y',baselineCoords[symbol].y);}} disabled={c.x===baselineCoords[symbol].x&&c.y===baselineCoords[symbol].y} className="px-2 py-1 rounded bg-zinc-800 disabled:opacity-30">Reset X/Y</button><div className="text-[10px] text-zinc-500 flex-1 min-w-[220px]">baseline ({baselineCoords[symbol].x},{baselineCoords[symbol].y}) · authored occurrences: <span className="text-amber-300">{keys.join(', ')}</span></div></div>;})}</div>
    </div>

    <div className="mt-3 flex flex-wrap gap-2"><button onClick={reset} disabled={!dirty||busy} className="px-3 py-2 rounded bg-zinc-800 disabled:opacity-40 flex items-center gap-2"><RotateCcw className="w-4 h-4"/>Reset transaction</button><button onClick={compile} disabled={!dirty||busy} className="px-3 py-2 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center gap-2"><Save className="w-4 h-4"/>{busy?'Compiling…':'Compile full heart-rip edit'}</button></div>
    <div className="mt-2 text-[10px] text-zinc-500">The compiler derives every expected frame-pointer byte and placement byte independently, diffs the entire executable, reparses all seven frame records plus requested coordinates, and requires exact canonical reversal.</div>
    {compiled&&<div className="mt-3 rounded border border-emerald-900 bg-emerald-950/20 p-3"><div className="font-semibold text-emerald-300">Full heart-rip composition edit compiled</div><div className="mt-1 font-mono">{compiled.report.frames.filter(f=>f.changed).length} frame records changed · {compiled.report.placements.length} placement edits · {compiled.report.evidence.changedByteCount} EXE bytes · unexpected {compiled.report.evidence.unexpectedByteChanges} · composition reparse {compiled.report.evidence.compositionReparseMatches?'yes':'no'} · placement reparse {compiled.report.evidence.placementReparseMatches?'yes':'no'} · reversal {compiled.report.evidence.reverseRestoresOriginal?'exact':'failed'}</div><div className="mt-1 text-zinc-500 break-all">edited SHA-256 {compiled.report.evidence.editedSha256}</div>{compiled.report.aliasingAfter.some(a=>a.sharedAcrossFrameRecords)&&<div className="mt-2 text-amber-300">Alias note: one or more descriptors are shared across multiple authored frame records. The JSON report lists the exact frame and preview keys.</div>}<button onClick={download} className="mt-3 px-3 py-2 rounded bg-violet-800 hover:bg-violet-700 text-white flex items-center gap-2"><Download className="w-4 h-4"/>Download edited MK1 test bundle</button></div>}
    {error&&<div className="mt-3 rounded border border-red-900 bg-red-950/20 p-2 text-red-300">{error}</div>}
    <div className="mt-3 text-[10px] text-zinc-500">Fail-closed boundary: only the seven existing heart-rip frame allocations are writable. heart_2 remains 1–4 unique pointers; every other frame remains exactly one pointer plus zero. Record growth/relocation, arbitrary pointers, duplicate heart_2 pointers, dimensions, packed refs, pixels, palette and gameplay/collision remain blocked.</div>
  </section>;
}

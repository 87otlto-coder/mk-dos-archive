import React,{useEffect,useState} from 'react';
import {Download,GitBranch,ShieldCheck} from 'lucide-react';
import type {DirectorySource} from '../core/filesystem/DirectorySource';
import {runO198ForestConditionalRoots,exportO198ForestForensicZip,o198ModeSchematicSvg as graphSvg,type O198Report} from '../core/experiments/o198';
import {o197LayerPng} from '../core/experiments/o197';
export function O198ForestModeWorkbench({source}:{source:DirectorySource}){
 const [busy,setBusy]=useState(false),[report,setReport]=useState<O198Report|null>(null),[error,setError]=useState('');
 const [mode,setMode]=useState(0),[urls,setUrls]=useState<string[]>([]),[diagram,setDiagram]=useState('');
 useEffect(()=>{if(!report){setUrls([]);setDiagram('');return;}
  const all=report.layers.map(l=>URL.createObjectURL(new Blob([o197LayerPng(l).slice().buffer],{type:'image/png'})));
  const svg=URL.createObjectURL(new Blob([graphSvg(report).slice().buffer],{type:'image/svg+xml'}));
  setUrls(all);setDiagram(svg);return()=>{all.forEach(u=>URL.revokeObjectURL(u));URL.revokeObjectURL(svg);};
 },[report]);
 const run=async()=>{setBusy(true);setError('');setReport(null);try{setReport(await runO198ForestConditionalRoots(source));setMode(0);}
  catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const selected=report?.modes[mode];
 return <section className="o194-panel">
  <div className="o194-title"><GitBranch size={25}/><div><h2>O198 · Forest conditional configuration graph</h2><p>Compare original mode-dependent setup references. Each layer is displayed independently, never as an invented combined stage.</p></div></div>
  <div className="o194-actions"><button disabled={busy} onClick={run}>{busy?'Tracing original Forest roots…':'Trace conditional Forest roots'}</button>
   {report&&<button className="o194-secondary" onClick={()=>exportO198ForestForensicZip(report)}><Download size={15}/> Export O198 complete forensic ZIP</button>}</div>
  {error&&<p className="mw-error" role="alert">{error}</p>}
  {report&&<div className="o194-results">
   <p className="o194-status"><ShieldCheck size={16}/> Original source links verified. Conditional references are not proof of live mode, palette, layer placement or draw order.</p>
   <div className="o194-actions" role="group" aria-label="Original Forest mode selection">
    {report.modes.map((m,i)=><button className="o194-secondary" key={m.mode} disabled={i===mode} onClick={()=>setMode(i)}>{m.mode.replaceAll('_',' ')} · {m.selectedVariants.length} layers</button>)}</div>
   {diagram&&<img src={diagram} alt="Source-backed conditional graph of Forest setup references across three original mode roots" style={{width:'100%',maxWidth:970}}/>}
   {selected&&<><p><strong>Mode root:</strong> Object-2 0x{selected.rootObject2.toString(16)} · physical MK2.EXE 0x{selected.rootPhysical.toString(16)} · {selected.staticPairs.length} setup/numeric pairs · {selected.accumulatorPairs.length} setup/accumulator pairs</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12}}>
    {selected.selectedVariants.map(v=>{const layer=report.layers[v-1];const url=urls[v-1];return <div key={v} style={{padding:12,border:'1px solid #3d4a58',borderRadius:8}}>
      <strong>Source layer {v}</strong> · {layer.width}×{layer.height}
      <div style={{minHeight:105,display:'flex',alignItems:'center',background:'#111720',marginTop:8,overflow:'hidden'}}>
       {url&&<img src={url} alt={`Original Forest setup-local layer ${v}, candidate palette`} style={{width:'100%',height:'auto',imageRendering:'pixelated'}}/>}</div>
      <p style={{fontSize:11,color:'#aeb6c5'}}>Original indexed pixels; candidate RGB. This is not its game-screen position.</p>
      <p style={{fontSize:11,color:'#b9dbcc'}}>Source channel {selected.accumulatorPairs.find(p=>p.setupVariant===v)?.motionChannelIndex} · raw 16.16 input {selected.accumulatorPairs.find(p=>p.setupVariant===v)?.originalChannelInput16_16} (not verified parallax)</p>
     </div>;})}</div>
   <details><summary>Original setup pointer pairs, numeric operands, accumulator references and physical offsets</summary>
    <pre style={{fontSize:11,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(selected,null,2)}</pre></details>
   <details><summary>Original nine signed 16.16 motion source words</summary><pre>{JSON.stringify(report.sourceReferences.originalMotionWords.map((raw,i)=>({index:i,raw,value:raw/65536})),null,2)}</pre></details>
   </>}
   <details><summary>Interpretation limits</summary>{report.limitations.map((x,i)=><p key={i}>{x}</p>)}</details>
  </div>}
 </section>;
}

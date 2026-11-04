import React,{useEffect,useState} from 'react';
import {Download,Layers3,ShieldCheck} from 'lucide-react';
import type {DirectorySource} from '../core/filesystem/DirectorySource';
import {runO197ForestLayers,exportO197ForestForensicZip,o197LayerPng,type O197Report} from '../core/experiments/o197';
export function O197ForestLayersWorkbench({source}:{source:DirectorySource}){
 const [running,setRunning]=useState(false),[report,setReport]=useState<O197Report|null>(null),[error,setError]=useState('');
 const [variant,setVariant]=useState(0),[visual,setVisual]=useState<'color'|'index'|'mask'>('color'),[url,setUrl]=useState('');
 const layer=report?.layers[variant]??null;
 useEffect(()=>{if(!layer){setUrl('');return;}const bytes=o197LayerPng(layer,visual);
  const blob=new Blob([bytes.slice().buffer],{type:'image/png'});const objectUrl=URL.createObjectURL(blob);
  setUrl(objectUrl);return()=>URL.revokeObjectURL(objectUrl);
 },[layer,visual]);
 const run=async()=>{setRunning(true);setError('');setReport(null);try{setReport(await runO197ForestLayers(source));setVariant(0);}
 catch(e){setError(e instanceof Error?e.message:String(e));}finally{setRunning(false);}};
 return <section className="o194-panel">
  <div className="o194-title"><Layers3 size={25}/><div><h2>O197 · Forest's five original indexed layers</h2>
  <p>Rebuild each independently from its original indexed sprite commands and setup-local placement table. No inferred layer stacking.</p></div></div>
  <div className="o194-sources"><span><strong>Original:</strong> MK2.EXE + FOREST.GRA (strict SHA-256)</span>
   <span><strong>Source-backed:</strong> 5 setups / 60 placements / 43 unique sprite streams</span></div>
  <div className="o194-actions"><button onClick={run} disabled={running}>{running?'Decoding original Forest layers…':'Decode original Forest layers'}</button>
    {report&&<button className="o194-secondary" onClick={()=>exportO197ForestForensicZip(report)}><Download size={15}/> Export complete five-layer forensic ZIP</button>}</div>
  {error&&<p className="mw-error" role="alert">{error}</p>}
  {report&&<div className="o194-results"><p className="o194-status"><ShieldCheck size={16}/> Source-local indexed pixels and transparency masks verified. Candidate RGB coloring and scene-level arrangement remain unverified.</p>
    <div className="o194-actions" role="group" aria-label="Forest original source layer">
     {report.layers.map((r,i)=><button key={r.setupObject2Offset} onClick={()=>setVariant(i)} disabled={variant===i} className="o194-secondary">Layer {i+1} · {r.width}×{r.height}</button>)}</div>
    <div className="o194-actions" role="group" aria-label="Forest layer visualization">
     <button className="o194-secondary" disabled={visual==='color'} onClick={()=>setVisual('color')}>Source-linked candidate color</button>
     <button className="o194-secondary" disabled={visual==='index'} onClick={()=>setVisual('index')}>Indices / alpha</button>
     <button className="o194-secondary" disabled={visual==='mask'} onClick={()=>setVisual('mask')}>Opacity mask</button></div>
    {layer&&<><div style={{overflowX:'auto',padding:8,background:'repeating-conic-gradient(#232b36 0 25%, #121820 0 50%) 0 / 24px 24px'}}>
      {url&&<img src={url} width={layer.width} height={layer.height} style={{display:'block',width:'100%',maxWidth:layer.width,minWidth:Math.min(layer.width,360),height:'auto',imageRendering:'pixelated'}} alt={`Original Forest local setup ${layer.variant}, ${layer.width} by ${layer.height}, ${visual==='color'?'source-linked palette candidate':visual==='index'?'source indices and source alpha':'source opacity mask'}`}/>}</div>
      <p style={{fontSize:12,color:'#a1a1aa'}}>Independent native layer ({layer.width}×{layer.height}). Transparent background is unpainted source. Not a screen composition or verified live DOS palette.</p>
      <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',fontSize:12}}><tbody>
       <tr><th>Source setup Obj2</th><td>0x{layer.setupObject2Offset.toString(16)}</td><th>Placement records</th><td>{layer.placementCount}</td></tr>
       <tr><th>Unique encoded streams</th><td>{layer.streams.length}</td><th>Opaque output pixels</th><td>{layer.opaquePixels.toLocaleString()}</td></tr>
       <tr><th>Clipped opaque writes</th><td>{layer.clippedOpaquePixels.toLocaleString()}</td><th>Overdraws</th><td>{layer.overdrawOpaquePixels.toLocaleString()}</td></tr>
      </tbody></table></div>
      <details><summary>Original placement records and physical executable references</summary><pre style={{fontSize:11,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(layer.placements,null,2)}</pre></details>
      <details><summary>Decoded original stream byte spans and SHA-256 (full command trace included in forensic ZIP)</summary>
       <pre style={{fontSize:11,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify(layer.streams.map(({commands,...m})=>({...m,commandCount:commands.length})),null,2)}</pre></details>
     </>}
    <details><summary>Experiment boundaries and interpretation</summary>{report.limitations.map((x,i)=><p key={i}>{x}</p>)}</details>
   </div>}
 </section>;
}

import React,{useEffect,useState} from 'react';
import {Download,Leaf,ShieldCheck} from 'lucide-react';
import type {DirectorySource} from '../core/filesystem/DirectorySource';
import {runO196ForestFloor,exportO196ForestForensicZip,o196ColorPng,o196IndexPreviewPng,type O196ForestReport} from '../core/experiments/o196';

export function O196ForestFloorWorkbench({source}:{source:DirectorySource}){
 const [running,setRunning]=useState(false),[report,setReport]=useState<O196ForestReport|null>(null),[error,setError]=useState('');
 const [visual,setVisual]=useState<'candidate'|'indices'>('candidate');
 const [uri,setUri]=useState('');
 useEffect(()=>{if(!report)return;const bytes=visual==='indices'?o196IndexPreviewPng(report):o196ColorPng(report);
  const url=URL.createObjectURL(new Blob([bytes.slice().buffer],{type:'image/png'}));setUri(url);return()=>URL.revokeObjectURL(url);
 },[report,visual]);
 const run=async()=>{setRunning(true);setError('');setReport(null);try{setReport(await runO196ForestFloor(source));}
 catch(e){setError(e instanceof Error?e.message:String(e));}finally{setRunning(false);}};
 return <section className="o194-panel">
  <div className="o194-title"><Leaf size={25}/><div><h2>O196 · Forest source floor & palette candidate</h2>
   <p>Reconstruct all 896 original source columns. A source-linked palette is used only for a clearly labeled candidate-color preview.</p></div></div>
  <div className="o194-sources"><span><strong>Original source:</strong> MK2.EXE + FOREST.GRA (SHA-256 guarded)</span>
   <span><strong>Evidence:</strong> O131/O195 packed plane, five Forest setups, 80-color source record</span></div>
  <div className="o194-actions"><button disabled={running} onClick={run}>{running?'Authenticating original files…':'Inspect Forest original floor'}</button>
   {report&&<button className="o194-secondary" onClick={()=>exportO196ForestForensicZip(report)}><Download size={15}/> Full forensic ZIP + source index plane</button>}</div>
  {error&&<p role="alert" className="mw-error">{error}</p>}
  {report&&<div className="o194-results">
   <p className="o194-status"><ShieldCheck size={16}/> Source index bytes verified. Palette relationship is static; actual runtime selection has not been observed.</p>
   <div className="o194-actions"><button className="o194-secondary" disabled={visual==='candidate'} onClick={()=>setVisual('candidate')}>Forest palette candidate</button>
    <button className="o194-secondary" disabled={visual==='indices'} onClick={()=>setVisual('indices')}>Uninterpreted index preview</button></div>
   {uri&&<div style={{overflowX:'auto'}}><img alt={visual==='candidate'?'Authentic full 896-column Forest floor pixels, colored with original EXE-linked candidate palette, not runtime verified':'Uninterpreted grayscale visualization of authentic Forest floor source indices'} src={uri} width={896} height={160} style={{width:'100%',maxWidth:896,minWidth:448,height:160,imageRendering:'pixelated',display:'block'}}/></div>}
   <p style={{fontSize:12,color:'#a1a1aa'}}>Native source is <strong>896×32 pixels</strong>; the preview stretches vertically for inspection only. No camera crop or stage compositing is applied. Switching to indices shows original palette-index numbers as grayscale—not alternate colors.</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',fontSize:12}}><tbody>
    <tr><th>Original GRA offset</th><td>0x{report.floor.sourceGRAOffset.toString(16)}</td><th>Source pixels</th><td>{report.floor.indices.length.toLocaleString()}</td></tr>
    <tr><th>Forest palette record</th><td>0x{report.palette.sourcePhysical.toString(16)}</td><th>Palette table (Obj2)</th><td>0x{report.palette.pointerTableObject2.toString(16)}</td></tr>
    <tr><th>Setup variants</th><td>{report.setups.length}</td><th>Source indices used</th><td>{report.floor.histogram.length}</td></tr>
   </tbody></table></div>
   <details><summary>Original setup variant pointers (not confirmed runtime selections)</summary>
    <pre style={{fontSize:11,whiteSpace:'pre-wrap'}}>{JSON.stringify(report.setups.map(({controls,...other})=>({...other,controlRecordCount:controls.length})),null,2)}</pre></details>
   <details><summary>Provenance, source SHA-256, histogram and research limitations</summary>
    <pre style={{fontSize:11,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify({original:report.original,sourcePlaneSHA:report.floor.indicesSHA256,palette:report.palette,sourceHistogram:report.floor.histogram,limitations:report.limitations},null,2)}</pre></details>
  </div>}
 </section>;
}

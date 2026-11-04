import React, {useState} from 'react';
import {Download, Layers, ShieldCheck} from 'lucide-react';
import type {DirectorySource} from '../core/filesystem/DirectorySource';
import {runO195CrossStageFloor, exportO195ForensicZip, o195FloorGeometrySvg, type O195Report} from '../core/experiments/o195';

/** Public read-only experimental diagram. Never treats pixel geometry as observed stage image. */
export function O195FloorWorkbench({source}:{source:DirectorySource}) {
 const [scrollPixels,setScrollPixels]=useState(0);
 const [cameraWord,setCameraWord]=useState(288);
 const [running,setRunning]=useState(false);
 const [report,setReport]=useState<O195Report|null>(null);
 const [error,setError]=useState('');
 const run=async()=>{
  setRunning(true);setError('');setReport(null);
  try{setReport(await runO195CrossStageFloor(source,scrollPixels*65536,cameraWord));}
  catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setRunning(false);}
 };
 const image=report?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new TextDecoder().decode(o195FloorGeometrySvg(report))):'';
 return <section className="o194-panel">
  <div className="o194-title"><Layers size={25}/><div><h2>O195 · Cross-stage packed-floor hypothesis</h2>
   <p>Compare seven authenticated MK2 floor-control streams. Adjustable row visibility is an illustration of O131 arithmetic, never a reconstructed background image.</p></div></div>
  <div className="o194-sources"><span><strong>Source:</strong> original MK2.EXE / O130 + O131</span><span><strong>Targets:</strong> Portal, Battle, Arena, Forest + three contrast stages</span></div>
  <div className="o194-actions" style={{alignItems:'end',flexWrap:'wrap'}}>
   <label style={{display:'grid',gap:4,fontSize:12}}>Hypothetical vertical scroll (pixels)
    <select aria-label="Hypothetical vertical scroll" value={scrollPixels} onChange={e=>setScrollPixels(Number(e.target.value))}>
     {[-12,-8,-4,0,4,8,12].map(n=><option key={n} value={n}>{n}</option>)}
    </select></label>
   <label style={{display:'grid',gap:4,fontSize:12}}>Hypothetical camera word
    <select aria-label="Hypothetical camera word" value={cameraWord} onChange={e=>setCameraWord(Number(e.target.value))}>
     {[256,272,288,304,320].map(n=><option key={n} value={n}>{n}</option>)}
    </select></label>
   <button disabled={running} onClick={run}>{running?'Authenticating source…':'Run cross-stage comparison'}</button>
   {report&&<button className="o194-secondary" onClick={()=>exportO195ForensicZip(report)}><Download size={15}/> Export full forensic ZIP</button>}
  </div>
  <p style={{fontSize:12,color:"#a1a1aa"}}>Changing the camera word affects the computed per-row source correction, not the vertical row count. None of these values are captured live runtime values.</p>
  {error&&<p role="alert" className="mw-error">{error}</p>}
  {report&&<div className="o194-results">
    <p className="o194-status"><ShieldCheck size={16}/> Original stream and renderer operand evidence verified. Row positions are hypothetical.</p>
    <div style={{overflowX:'auto'}}><img src={image} alt="Hypothetical comparison of seven original MK2 packed-floor command row spans and clipping, not actual background artwork" style={{display:'block',width:'100%',minWidth:650,maxWidth:1000}}/></div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',fontSize:12,borderCollapse:'collapse'}}>
     <thead><tr><th>Stage</th><th>EXE physical command</th><th>Raw Y</th><th>Rows</th><th>Visible</th><th>Clipped</th><th>Pointer operand</th><th>Last source row correction</th></tr></thead>
     <tbody>{report.rows.map(r=><tr key={r.stage} style={{borderTop:'1px solid #394150'}}>
      <td style={{padding:'7px 4px'}}>{r.stage}</td><td>0x{r.originalPackedCommandPhysical.toString(16)}</td>
      <td>{r.rawDestinationY}</td><td>{r.requestedRows}</td><td>{r.visibleRows}</td><td>{r.clippedRows}</td><td>0x{r.sourcePointer.toString(16)}</td><td>{r.rowSourceCorrection.length?r.rowSourceCorrection[r.rowSourceCorrection.length-1]:"—"}</td></tr>)}</tbody>
    </table></div>
    <details><summary>Original command token evidence and limitations</summary>
     <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',fontSize:11}}>{JSON.stringify({observations:report.observations,limitations:report.limitations,rawStreams:report.rows.map(r=>({stage:r.stage,stream:r.streamObject2,tokens:r.controlTokens}))},null,2)}</pre>
    </details>
  </div>}
 </section>;
}

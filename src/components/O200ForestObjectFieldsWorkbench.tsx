import React,{useEffect,useState} from 'react';
import {Download,GitBranch,ShieldCheck} from 'lucide-react';
import type {DirectorySource} from '../core/filesystem/DirectorySource';
import {runO200ForestCallbackCoordinates,exportO200ForestEvidence,o200CoordinatesSvg,type O200Report} from '../core/experiments/o200';

export function O200ForestObjectFieldsWorkbench({source}:{source:DirectorySource}){
 const [busy,setBusy]=useState(false),[report,setReport]=useState<O200Report|null>(null),[error,setError]=useState('');
 const [diagram,setDiagram]=useState('');
 useEffect(()=>{if(!report){setDiagram('');return;}
  const bytes=o200CoordinatesSvg(report),url=URL.createObjectURL(new Blob([bytes.slice().buffer],{type:'image/svg+xml'}));
  setDiagram(url);return()=>URL.revokeObjectURL(url);
 },[report]);
 async function inspect(){setBusy(true);setError('');setReport(null);
  try{setReport(await runO200ForestCallbackCoordinates(source));}
  catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 return <section className="o194-panel">
  <div className="o194-title"><GitBranch size={25}/><div><h2>O200 · Forest callback object-field derivation</h2>
   <p>Trace the second original Forest callback's three packed operands through the original signed coordinate helper. Values are object fields, not verified screen coordinates.</p></div></div>
  <div className="o194-actions"><button disabled={busy} onClick={inspect}>{busy?'Authenticating Forest callback…':'Trace source field writes'}</button>
   {report&&<button className="o194-secondary" onClick={()=>exportO200ForestEvidence(report)}><Download size={15}/> Export O200 complete forensic ZIP</button>}</div>
  {error&&<p role="alert" className="mw-error">{error}</p>}
  {report&&<div className="o194-results">
   <p className="o194-status"><ShieldCheck size={16}/> Canonical executable instruction bytes verified; live callback scheduling and final positions are unobserved.</p>
   {diagram&&<img src={diagram} style={{width:'100%',maxWidth:980}} alt="Three Forest source-derived object field coordinate pairs, not gameplay screen positions"/>}
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderSpacing:'10px 8px',textAlign:'left'}}><thead><tr><th>Record</th><th>Original EDX</th><th>Field +0x1A</th><th>Field +0x1E</th><th>Instruction offset</th></tr></thead>
    <tbody>{report.objects.map(o=><tr key={o.index}><td>{o.index}</td><td>0x{o.packedEdx.toString(16).padStart(8,'0')}</td><td>{o.outputField1A}</td><td>{o.outputField1E}</td><td>0x{o.instructionPhysical.toString(16)}</td></tr>)}</tbody></table></div>
   <p>Original conversion: signed high word → field <code>+0x1E</code>; signed low word → field <code>+0x1A</code>. Each half uses <code>n - (n &gt;&gt; 2)</code>. The original callback calls object setup, writes both fields and passes the record to a list insertion routine.</p>
   <details><summary>First callback's independent guarded loop</summary><p>Original state read operand 0x{report.firstCallback.guardReadOperand.toString(16)}, comparison {report.firstCallback.guardComparison}; source-coded loop count {report.firstCallback.originalLoopCount}. This is not a measured duration or frame count.</p></details>
   <details><summary>Original instruction windows, helper calls and limitations</summary>
    <pre style={{fontSize:11,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify({source:report.source,second:report.secondCallback,limitations:report.limits},null,2)}</pre></details>
  </div>}
 </section>;
}

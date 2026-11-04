import React,{useState} from 'react';
import {Download,GitBranch,ShieldCheck} from 'lucide-react';
import type {DirectorySource} from '../core/filesystem/DirectorySource';
import {runO199ForestInitializer,exportO199ForestEvidence,type O199Report} from '../core/experiments/o199';

export function O199ForestBehaviorWorkbench({source}:{source:DirectorySource}){
 const [report,setReport]=useState<O199Report|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function inspect(){setBusy(true);setReport(null);setError('');try{setReport(await runO199ForestInitializer(source));}
  catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 return <section className="o194-panel">
  <div className="o194-title"><GitBranch size={25}/><div><h2>O199 · Forest conditional initializer behavior</h2><p>Compare stage-root selection with the separate source-code branch that registers original callback functions. No live activation inferred.</p></div></div>
  <div className="o194-actions"><button disabled={busy} onClick={inspect}>{busy?'Authenticating executable…':'Trace Forest initializer'}</button>
   {report&&<button className="o194-secondary" onClick={()=>exportO199ForestEvidence(report)}><Download size={15}/> Export O199 forensic ZIP</button>}</div>
  {error&&<p className="mw-error" role="alert">{error}</p>}
  {report&&<div className="o194-results">
   <p className="o194-status"><ShieldCheck size={16}/> Original executable paths checked. Mode selections below are conditional simulations, not live witnesses.</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',borderCollapse:'separate',borderSpacing:'10px 9px'}}><thead><tr><th>Mode value</th><th>Original root</th><th>Setup references</th><th>Reachable registration sites</th></tr></thead>
    <tbody>{report.modes.map(m=><tr key={m.modeValue}><td>{m.modeValue}</td><td>0x{m.rootObject2.toString(16).toUpperCase()}</td>
     <td>{m.setupVariantsReferenced.join(', ')}</td><td>{m.initializerRegistrationsReached.join(' + ')}</td></tr>)}</tbody></table></div>
   <p style={{fontSize:13}}>Mode 1 and fallback reference identical three-layer root payloads, but <strong>mode 0 skips the second callback registration</strong>. The helper stores function pointers in a pool object when available.</p>
   {report.registrations.map(r=><details key={r.name}><summary>{r.name} registration — original target 0x{r.targetPhysical.toString(16).toUpperCase()} ({r.condition})</summary>
    <p>Instruction 0x{r.instructionPhysical.toString(16)} · source operand Object 1+0x{r.pointerSourceObject1.toString(16)} · call 0x{r.registrationCallPhysical.toString(16)} → 0x67222</p>
    <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-all',fontSize:11}}>{JSON.stringify({originalRegistrationBytes:r.codeBytesHex,originalFunctionSHA256:r.targetFunctionSHA256,targetFunctionBytesHex:r.targetFunctionBytesHex},null,2)}</pre>
   </details>)}
   <details><summary>Original helper, function operands and known limitations</summary><pre style={{fontSize:11,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{JSON.stringify({helper:report.helperEvidence,functionObservations:report.functionObservations,limitations:report.limitations},null,2)}</pre></details>
  </div>}
 </section>;
}

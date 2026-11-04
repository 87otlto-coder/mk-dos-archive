import React, { useRef, useState } from 'react';
import { Database, Download, FlaskConical, ShieldCheck, AlertTriangle, Search, XCircle } from 'lucide-react';
import type { DirectorySource } from '../core/filesystem/DirectorySource';
import type { Game } from '../core/assets/model';
import { compileAllKnowns, exportHypothesisEvidence, exportKnownEvidence, runPortalForestHypothesis, importHypothesisZip,
  type Assumption, type EvidenceStep, type HypothesisReport, type KnownCompilation } from '../core/experiments/o194';
import './O194Workbench.css';
import {O195FloorWorkbench} from './O195FloorWorkbench';
import {O196ForestFloorWorkbench} from './O196ForestFloorWorkbench';
import {O197ForestLayersWorkbench} from './O197ForestLayersWorkbench';
import {O198ForestModeWorkbench} from './O198ForestModeWorkbench';
import {O199ForestBehaviorWorkbench} from './O199ForestBehaviorWorkbench';
import {O200ForestObjectFieldsWorkbench} from './O200ForestObjectFieldsWorkbench';

const assumptions: {id:Assumption;label:string;description:string}[]=[
  {id:'packed-draw',label:'Packed-draw control grammar',description:'Compare authenticated Portal and Forest control-stream structure and original operands'},
  {id:'portal-frame-list',label:'Portal effect-list model',description:'Test whether descriptor ownership is established for the Forest resource'},
  {id:'palette',label:'Palette selection',description:'Check whether Portal palette ownership can safely transfer'},
  {id:'placement',label:'Object positioning',description:'Examine whether Portal placement semantics have validated Forest equivalents'},
];
function Status({step}:{step:EvidenceStep}) {return <div className="o194-step"><span className={`o194-tag o194-${step.status}`}>{step.status}</span>
  <div><strong>{step.title}</strong><p>{step.detail}</p>{step.error&&<details><summary>Failure evidence</summary><pre>{step.error}</pre></details>}
    {step.id==='packed-draw'&&<details><summary>Authenticated operands</summary><pre>{JSON.stringify(step.evidence,null,2)}</pre></details>}
  </div></div>;}

export function O194Workbench({source,game,known,onKnown,experiment,onExperiment}: {source:DirectorySource;game:Game;
  known:KnownCompilation|null;onKnown:(r:KnownCompilation|null)=>void;
  experiment:HypothesisReport|null;onExperiment:(report:HypothesisReport|null)=>void}) {
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState<EvidenceStep[]>([]),[error,setError]=useState(''),[activity,setActivity]=useState('');
  const [experimentBusy,setExperimentBusy]=useState(false);
  const [selected,setSelected]=useState<Assumption[]>(['packed-draw','portal-frame-list','palette','placement']);
  const [imported,setImported]=useState(false);
  const [query,setQuery]=useState('');
  const abort=useRef<AbortController|null>(null);
  async function runCompilation(){
    const control=new AbortController();abort.current=control;setBusy(true);setError('');setProgress([]);setActivity('Indexing source…');
    try{const r=await compileAllKnowns(source,game,control.signal,s=>setProgress(prev=>[...prev,s]),true,setActivity);onKnown(r);}
    catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);abort.current=null;}
  }
  async function runExperiment(){
    setExperimentBusy(true);onExperiment(null);setImported(false);setError('');
    try{onExperiment(await runPortalForestHypothesis(source,selected));}
    catch(e){setError(e instanceof Error?e.message:String(e));}
    finally{setExperimentBusy(false);}
  }
  const safely=(action:()=>void)=>{try{setError('');action();}catch(e){setError(e instanceof Error?e.message:String(e));}};
  const view=known?.assets.filter(a=>`${a.name} ${a.group} ${a.source.path}`.toLowerCase().includes(query.toLowerCase())).slice(0,250)??[];
  return <div className="mw-page o194-page">
    <div className="mw-intro"><span className="mw-eyebrow mw-lab-accent">LABORATORY / O200</span><h1>Compilation & hypotheses</h1>
      <p>Compile the capabilities we have independently verified, then challenge uncertain interpretations in a separate read-only experiment. Results never modify your game files.</p></div>
    <section className="o194-panel"><div className="o194-title"><Database size={25}/><div><h2>Compile All Knowns · {game.toUpperCase()}</h2><p>Independent resource and authenticity passes, followed by the inherited verified decoder catalogue. Failures are isolated.</p></div></div>
      <div className="o194-actions"><button disabled={busy} onClick={runCompilation}>{busy?'Compiling…':'Compile All Knowns'}</button>
      {busy&&<button className="o194-secondary" onClick={()=>abort.current?.abort()}>Cancel</button>}
      {known&&<><button className="o194-secondary" onClick={()=>safely(()=>exportKnownEvidence(known,'forensic'))}><Download size={15}/> Complete forensic ZIP</button>
        <button className="o194-secondary" onClick={()=>safely(()=>exportKnownEvidence(known,'visual'))}><Download size={15}/> Visual review ZIP</button></>}</div>
      {error&&<p role="alert" className="mw-error">{error}</p>}
      {(busy||known)&&<div role="status" className="o194-status">{busy?`Running each source-backed capability separately… ${activity}`:`${known?.steps.length} recorded operations · ${known?.assets.length} browseable assets`}</div>}
      {(busy?progress:(known?.steps??[])).map((s,i)=><Status key={s.id+'-'+i} step={s}/>)}
      {known&&<div className="o194-results"><h3>Compilation catalogue</h3>
        <label className="o194-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search compiled asset names, groups or source paths"/></label>
        <p>Showing {view.length} of {known.assets.length} assets (first 250 matches). Exact source locations and unverified properties are retained.</p>
        <div className="o194-catalogue">{view.map(a=><div key={a.id}><strong>{a.name}</strong><span>{a.group} · {a.format}</span>
          <small>{a.source.path} @ {a.source.offset.toString(16)} · {a.confidence}</small></div>)}</div>
      </div>}
    </section>
    <section className="o194-panel"><div className="o194-title"><FlaskConical size={25}/><div><h2>Hypothesis Workbench</h2><p>Portal → Forest original structural test; the O195 comparison below extends verified packed-floor operands across seven stages. Reports explain what transfers, fails or cannot yet be tested.</p></div></div>
      {game!=='mk2' ? <p className="o194-status">Portal → Forest experiments require an original MK2 installation. MK1/MK3 experimental decoders are not asserted.</p> : <>
        <div className="o194-sources"><span><strong>Reference:</strong> PORTAL.GRA / O130</span><span><strong>Target:</strong> FOREST.GRA</span></div>
        {assumptions.map(a=><label key={a.id} className="o194-choice"><input type="checkbox" checked={selected.includes(a.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,a.id]:v.filter(x=>x!==a.id))}/>
          <span><strong>{a.label}</strong><small>{a.description}</small></span></label>)}
        <div className="o194-actions"><button disabled={experimentBusy||!selected.length} onClick={runExperiment}>{experimentBusy?'Inspecting source…':'Run bounded experiment'}</button>
        <label className="o194-import">Import forensic ZIP (review only)
          <input type="file" accept=".zip,application/zip" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{onExperiment(importHypothesisZip(new Uint8Array(await f.arrayBuffer())));setImported(true);setError('');}catch(err){setError(err instanceof Error?err.message:String(err));}e.target.value='';}}/>
        </label>
        {experiment&&<><button className="o194-secondary" onClick={()=>safely(()=>exportHypothesisEvidence(experiment,'forensic'))}><Download size={15}/> Complete forensic ZIP</button>
        <button className="o194-secondary" onClick={()=>safely(()=>exportHypothesisEvidence(experiment,'visual'))}><Download size={15}/> Review ZIP</button></>}</div>
        {experiment&&<>{(imported||experiment.startedAt.startsWith('imported'))&&<p className="o194-status">Imported package — display-only, not source-verified. Rerun against matching installation to verify.</p>}<p className="o194-status"><AlertTriangle size={16}/> Experimental only — no reconstructed Forest image or validated animation timing is claimed.</p>
          {experiment.assumptions.map(s=><Status key={s.id} step={s}/>)}
          {experiment.observations.map((v,i)=><p key={i} className="mw-error"><XCircle size={15}/>{v}</p>)}
          <details><summary>Experiment limitations</summary>{experiment.limitations.map(x=><p key={x}>{x}</p>)}</details>
        </>}
      </>}
    </section>
    {game==='mk2'&&<><O200ForestObjectFieldsWorkbench source={source}/><O199ForestBehaviorWorkbench source={source}/><O198ForestModeWorkbench source={source}/><O197ForestLayersWorkbench source={source}/><O196ForestFloorWorkbench source={source}/><O195FloorWorkbench source={source}/></>}
    <div className="mw-evidence-callout"><ShieldCheck size={20}/><div><strong>Evidence first</strong><p>A compiled original frame is source-backed; a shared control-stream shape is only a partial structural finding. Unsupported or failed experiments never become verified catalogue assets.</p></div></div>
  </div>;
}

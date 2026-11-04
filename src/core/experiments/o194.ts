/** O194: read-only bounded catalogue compilation and hypothesis experiment records.
 * This layer consumes verified decoders without changing their underlying validation rules.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Game, AssetCollection, Asset } from '../assets/model';
import { hash, safeName, utf8 } from '../assets/model';
import { scanAssets } from '../assets/collection';
import { readMK2OriginalEffectFramesO136 } from '../../games/mk2/research/stageOriginalEffectFramesO136';
import { readMK2StageDynamicStreamsO130 } from '../../games/mk2/research/stageDynamicStreamsO130';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { png, download, metadata } from '../assets/export';
import { parseAnimationStoreZip } from '../../games/mk1/research/browserAnimationExportBundleValidation';

export type StepStatus = 'compiled' | 'partial' | 'unsupported' | 'failed' | 'unverified';
export type EvidenceStep = { id: string; title: string; status: StepStatus; detail: string; inputs: string[]; evidence: Record<string, unknown>; error?: string };
export type SourceWitness = { path: string; bytes: number; sha256: string };
export interface KnownCompilation {
  format: 'mkdos_known_catalogue_o194';
  game: Game; directoryName: string; startedAt: string; finishedAt: string;
  steps: EvidenceStep[]; sourceWitnesses: SourceWitness[];
  assets: Asset[]; collection: AssetCollection | null;
}
export type CompileUpdate = (step: EvidenceStep) => void;
function message(err: unknown) { return err instanceof Error ? err.message : String(err); }
function guard(signal?: AbortSignal) { if (signal?.aborted) throw new Error('Compilation cancelled'); }
async function witness(source: DirectorySource, f: SourceFileEntry, signal?: AbortSignal): Promise<SourceWitness> {
  guard(signal);
  const data = await source.readSlice(f.path, 0, f.size);
  if (data.length !== f.size) throw new Error(`Short read for ${f.path}: ${data.length}/${f.size}`);
  return { path: f.path, bytes: f.size, sha256: await hash(data) };
}
function sourceMatch(files: SourceFileEntry[], name: string): SourceFileEntry {
  const matches = files.filter(f => f.name.toUpperCase() === name.toUpperCase());
  if (matches.length !== 1) throw new Error(`Expected exactly one ${name}, found ${matches.length}`);
  return matches[0];
}
function addStep(out: KnownCompilation, cb: CompileUpdate | undefined, step: EvidenceStep) { out.steps.push(step); cb?.(step); }

/** A failed high-level decoder never prevents validated resource or effect discoveries from being retained. */
export async function compileAllKnowns(source: DirectorySource, game: Game, signal?: AbortSignal, update?: CompileUpdate, includeDeepScan = true, onActivity?: (message:string)=>void): Promise<KnownCompilation> {
  const out: KnownCompilation = { format: 'mkdos_known_catalogue_o194', game, directoryName: source.directoryName,
    startedAt: new Date().toISOString(), finishedAt: '', steps: [], sourceWitnesses: [], assets: [], collection: null };
  try {
  const files = await source.listRecursive();
  guard(signal);
  addStep(out, update, { id:'inventory', title:'Resource inventory', status:'compiled', detail:`${files.length} original files indexed`,
    inputs:[], evidence:{ count: files.length, resources: files.map(f=>({path:f.path,size:f.size,extension:f.extension})) } });
  const stageNames = game === 'mk1' ? files.filter(f=>/^[A-Z0-9_]+HDRS\.GRA$/i.test(f.name)) :
    game === 'mk2' ? files.filter(f=>/^(PORTAL|TOMB|TOWER|FOREST|ARMORY|ARENA|BATTLE|DEDPOOL|PIT|CAVE)\.GRA$/i.test(f.name)) : [];
  addStep(out, update, {id:'stage-resources',title:'Recognized background resources',status:stageNames.length?'partial':'unsupported',
    detail:`${stageNames.length} source-backed stage candidates; not all are compiled scenes`, inputs:stageNames.map(f=>f.path),
    evidence:{stageResources:stageNames.map(f=>({path:f.path,size:f.size,stageIdentity: game==='mk1'?'unresolved candidate':'known from research index'}))}});
  // All selected game-source files are fingerprinted, not just the animated stage
  // examples. This lets a receiving researcher identify the *entire* installation
  // without embedding copyrighted bytes in a research package.
  const maxFileBytes=48*1024*1024, maxTotalBytes=512*1024*1024;
  let budget=0;const skipped:{path:string;size:number;reason:string}[]=[];
  for (let i=0;i<files.length;i++) {
    guard(signal);
    const f=files[i];
    if(f.size>maxFileBytes || budget+f.size>maxTotalBytes){
      skipped.push({path:f.path,size:f.size,reason:'Resource exceeds the read-only fingerprint budget'});continue;
    }
    budget+=f.size;
    if(i%16===0)onActivity?.(`Fingerprinting original resources ${i+1}/${files.length}`);
    try {out.sourceWitnesses.push(await witness(source,f,signal));}
    catch(e) {addStep(out,update,{id:`witness-${f.path}`,title:`Hash ${f.path}`,status:'failed',detail:'Cannot fingerprint exact source bytes',inputs:[f.path],evidence:{size:f.size},error:message(e)});}
  }
  addStep(out,update,{id:'source-provenance',title:'Source identity witnesses',
    status:skipped.length?'partial':out.sourceWitnesses.length?'compiled':'unsupported',
    detail:`${out.sourceWitnesses.length}/${files.length} exact source SHA-256 fingerprints${skipped.length?`; ${skipped.length} budget-limited`:''}`,
    inputs:out.sourceWitnesses.map(x=>x.path),evidence:{witnesses:out.sourceWitnesses,skipped}});
  if (game==='mk2') {
    let exe:Uint8Array|undefined;
    try { const f=sourceMatch(files,'MK2.EXE'); exe=await source.readSlice(f.path,0,f.size); }
    catch(e) {addStep(out,update,{id:'effect-source',title:'Original MK2 effect frames',status:'failed',detail:'Cannot load canonical executable',inputs:['MK2.EXE'],evidence:{},error:message(e)});}
    if(exe) for(const stage of ['portal','tomb','tower'] as const) {
      guard(signal);
      const id=`effects-${stage}`;
      try {
        const f=sourceMatch(files,`${stage.toUpperCase()}.GRA`),gra=await source.readSlice(f.path,0,f.size);
        const tracks=await readMK2OriginalEffectFramesO136(exe,gra,stage);
        for(const track of tracks) for(const frame of track.frames) out.assets.push({
          id:`o194:${stage}:${track.name}:${frame.ordinal}`,name:`${track.name} frame ${frame.ordinal+1}`,
          group:`${stage.toUpperCase()} · original effects`,kind:'sprite',format:'Original indexed RLE frame / RGBA preview',
          confidence:'Source-verified frame pixels; timing and final placement unverified',
          source:{path:f.path,offset:frame.graStart,length:frame.graEnd-frame.graStart,
            sha256:out.sourceWitnesses.find(w=>w.path===f.path)?.sha256},
          metadata:{sourceX:frame.sourceX,sourceY:frame.sourceY,descriptorObject2:frame.descriptorObject2,
            controlType:track.controlType,sequence:track.name,paletteIsSourceLinkedCandidate:track.paletteIsSourceLinkedCandidate,
            ordinal:frame.ordinal,indices:frame.indices,mask:frame.mask},
          width:frame.width,height:frame.height,rgba:frame.rgba,filename:`${stage}_${track.name}_${frame.ordinal}.png`
        });
        addStep(out,update,{id,title:`${stage.toUpperCase()} original effects`,status:'compiled',
          detail:`${tracks.length} authenticated sequences, ${tracks.reduce((n,t)=>n+t.frames.length,0)} source frames`,
          inputs:['MK2.EXE',f.path],evidence:{tracks:tracks.map(t=>({name:t.name,controlType:t.controlType,frames:t.frames.map(fr=>({ordinal:fr.ordinal,graStart:fr.graStart,graEnd:fr.graEnd,width:fr.width,height:fr.height,descriptorObject2:fr.descriptorObject2}))})),nativeFPS:'unverified'}});
      } catch(e) {addStep(out,update,{id,title:`${stage.toUpperCase()} original effects`,status:'unsupported',
        detail:'Canonical-qualified frame decoding unavailable for this source',inputs:['MK2.EXE',`${stage.toUpperCase()}.GRA`],evidence:{strictVerificationPreserved:true},error:message(e)});}
    }
  }
  guard(signal);
  if (includeDeepScan) try {
    const collection=await scanAssets(source,game,(stage)=>{guard(signal);onActivity?.(stage);},signal);
    guard(signal);
    out.collection=collection;
    const baseIds=new Set(collection.assets.map(x=>x.id));
    out.assets=[...collection.assets,...out.assets.filter(a=>!baseIds.has(a.id))];
    addStep(out,update,{id:'deep-catalogue',title:'Verified decoder catalogue',status:collection.reports.mode==='MK1_READ_ONLY_FALLBACK'?'partial':'compiled',
      detail:`${collection.assets.length} assets available through the inherited read-only asset scanner`,
      inputs:files.map(f=>f.path),evidence:{mode:collection.reports.mode??'original research pipeline',
        assets:collection.assets.length,limitations:collection.limitations,packages:collection.packages.map(p=>p.name)}});
  } catch(e) {
    if(signal?.aborted) throw e;
    addStep(out,update,{id:'deep-catalogue',title:'Verified decoder catalogue',status:'failed',
      detail:'Deep scan failed; earlier verified assets and resource evidence remain available',inputs:[],
      evidence:{independentResultsPreserved:out.assets.length},error:message(e)});
  }
  if (!includeDeepScan) addStep(out,update,{id:'deep-catalogue',title:'Verified decoder catalogue',status:'unverified',detail:'Skipped in fixture smoke test; production Compile All Knowns runs this step',inputs:[],evidence:{skippedByTestHarness:true}});
  } catch(e) {
    addStep(out,update,{id:'compilation-interruption',title:'Compilation interruption',
      status:signal?.aborted?'partial':'failed',
      detail:signal?.aborted?'User cancelled the next pending operation; earlier discoveries are still exportable':'Unexpected compilation error; prior successful steps are retained',
      inputs:[],evidence:{completedSteps:out.steps.length,retainedAssets:out.assets.length},error:message(e)});
  }
  out.finishedAt=new Date().toISOString();
  return out;
}

export type Assumption = 'packed-draw' | 'portal-frame-list' | 'palette' | 'placement';
export interface HypothesisReport {
  format:'mkdos_hypothesis_o194'; game:'mk2'; target:'forest'; reference:'portal';
  startedAt:string; finishedAt:string; status:'experimental';
  sourceWitnesses:SourceWitness[]; assumptions:EvidenceStep[];
  observations:string[]; limitations:string[]; sourcePaths:string[];
}
/** Portal=>Forest experiment: test source-qualified common stream grammar, record all failures.
 * No "Forest sprite animation" or fabricated rendering is emitted by this static test. */
export async function runPortalForestHypothesis(source: DirectorySource, chosen: Assumption[], signal?:AbortSignal):Promise<HypothesisReport> {
  const files=await source.listRecursive();
  const report:HypothesisReport={format:'mkdos_hypothesis_o194',game:'mk2',target:'forest',reference:'portal',
    startedAt:new Date().toISOString(),finishedAt:'',status:'experimental',sourceWitnesses:[],assumptions:[],
    observations:[],limitations:['No Forest animation sequence has been decoded or runtime-verified by this experiment.',
      'Source control-token similarities do not prove runtime activation, screen placement, parallax or palette ownership.',
      'This workbench does not write or patch source game resources.'],sourcePaths:[]};
  let exe:Uint8Array|undefined;
  for (const name of ['MK2.EXE','PORTAL.GRA','FOREST.GRA']) {
    guard(signal);
    try {const f=sourceMatch(files,name);report.sourcePaths.push(f.path);report.sourceWitnesses.push(await witness(source,f,signal));if(name==='MK2.EXE')exe=await source.readSlice(f.path,0,f.size);}
    catch(e) {report.observations.push(`Source ${name} unavailable: ${message(e)}`);}
  }
  let stream: Awaited<ReturnType<typeof readMK2StageDynamicStreamsO130>> | null=null;
  try{ if(!exe)throw new Error('MK2.EXE missing');stream=await readMK2StageDynamicStreamsO130(exe); }
  catch(e){report.observations.push(`Cannot authenticate O130 control grammar: ${message(e)}`);}
  for(const assumption of chosen){
    guard(signal);
    const evidence:Record<string,unknown>={reference:'O130 original stage dynamic control stream',experimental:true};
    let status:StepStatus='unsupported',detail='No validated cross-stage transformation for this assumption';
    if(assumption==='packed-draw') {
      if(stream){
        const portal=stream.stages.find(s=>s.resourceName.toUpperCase()==='PORTAL.GRA');
        const forest=stream.stages.find(s=>s.resourceName.toUpperCase()==='FOREST.GRA');
        Object.assign(evidence,{portal,forest,sourceOffsetModel:'Object-2 relative offsets; original MK2.EXE SHA verified'});
        if(portal&&forest){
          status=forest.drawCommands.length===portal.drawCommands.length&&forest.drawCommands.length>0?'partial':'unsupported';
          detail=status==='partial'?`Both streams contain ${forest.drawCommands.length} packed-draw command(s), but the sources and parameters differ`:'Stage control streams do not share the assumed packed-draw shape';
        } else detail='Missing Portal or Forest from authenticated stage control table';
      }else {status='failed';detail='Canonical source verification failed; cannot test borrowed control grammar';}
    }else if(assumption==='portal-frame-list'){
      detail='Portal effect-list pointers are Portal-specific; Forest sequence ownership not verified. Decoder not applied.';
      evidence.reason='Never decode Forest.GRA using Portal literal offsets without Forest descriptors';
    }else if(assumption==='palette'){
      detail='A Portal-selected palette cannot be attributed to Forest without source palette ownership and runtime selection';
      evidence.reason='No verified shared stage palette selection';
    }else if(assumption==='placement'){
      detail='Portal initialization coordinates are object-specific, not a transferable Forest placement contract';
      evidence.reason='World/screen placement for Forest not runtime-verified';
    }
    report.assumptions.push({id:assumption,title:assumption,status,detail,inputs:report.sourcePaths,evidence});
  }
  report.finishedAt=new Date().toISOString();
  return report;
}

function redact(value:unknown):unknown {
  if(value instanceof Uint8Array)return `[Uint8Array ${value.byteLength} bytes omitted; source file referenced by SHA-256]`;
  if(Array.isArray(value))return value.map(redact);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redact(v)]));
  return value;
}
const asJson=(v:unknown)=>utf8.encode(JSON.stringify(redact(v),null,2));
const clean=(s:string)=>safeName(s).slice(0,90);
export function buildKnownEvidenceZip(run: KnownCompilation, mode:'visual'|'forensic'):Uint8Array {
  const assets=run.assets.map(a=>metadata(a));
  const sources=run.sourceWitnesses;
  const summary=`# MK DOS Archive O194 — Compile All Knowns\n\nGame: ${run.game.toUpperCase()}\nStarted: ${run.startedAt}\nFinished: ${run.finishedAt}\n\n${run.steps.map(s=>`- ${s.title}: ${s.status.toUpperCase()} — ${s.detail}${s.error?` — ${s.error}`:''}`).join('\n')}\n\nAssets listed: ${run.assets.length}\n\nThis read-only catalogue contains source-verified and partial results. It does not recompile the original game executable.\n`;
  const files=[{name:'SUMMARY.md',bytes:utf8.encode(summary)},
    {name:'MANIFEST.json',bytes:asJson({format:'mkdos_o194_evidence_zip_v1',mode,game:run.game,assetCount:run.assets.length,sourceCount:sources.length,sourceGameFilesBundled:false})},
    {name:'results/catalogue.json',bytes:asJson(assets)},
    {name:'results/steps.json',bytes:asJson(run.steps)},
    {name:'evidence/source_hashes.json',bytes:asJson(sources)},
    {name:'reproduce/parameters.json',bytes:asJson({game:run.game,workflow:'Compile All Knowns O194',strictCanonicalChecks:true})},
    {name:'reproduce/README.md',bytes:utf8.encode('Select the original matching MK game installation in MK DOS Archive O194. Compare the SHA-256 hashes in evidence/source_hashes.json, then run Compile All Knowns. Gameplay/runtime is not implied.')}];
  if(mode==='forensic'){
    files.push({name:'diagnostics/execution_trace.json',bytes:asJson(run.steps.map((s,i)=>({sequence:i+1,id:s.id,inputs:s.inputs,status:s.status,detail:s.detail,error:s.error??null})))},
      {name:'evidence/decoder_reports.json',bytes:asJson(run.collection?.reports??{reason:'Deep scan failed or was skipped'})},
      {name:'evidence/limitations.json',bytes:asJson(run.collection?.limitations??[])},
      {name:'diagnostics/failures.json',bytes:asJson(run.steps.filter(s=>s.status==='failed'||s.status==='unsupported'))},
      {name:'diagnostics/warnings.json',bytes:asJson(run.steps.filter(s=>s.status==='partial'||s.status==='unverified'))});
  }
  // Bound preview export to keep UI responsive and never bundle source GRA/EXE bytes.
  let n=0;
  for(const a of run.assets){if(n>=24)break;if(!a.rgba||!a.width||!a.height||a.width*a.height>500000)continue;
    try{files.push({name:`results/previews/${String(n).padStart(3,'0')}_${clean(a.name)}.png`,bytes:png(a.width,a.height,a.rgba)});n++;}catch{/* Preserve evidence if a PNG encoder cannot handle one asset. */}
  }
  return buildStoredZip(files);
}
export function exportKnownEvidence(run: KnownCompilation, mode:'visual'|'forensic') {
  download(buildKnownEvidenceZip(run,mode),`MKDOS_O194_${run.game.toUpperCase()}_${mode}_evidence.zip`,'application/zip');
}
/** Source-control diagnostic illustration only. No visual Forest stage is synthesized. */
export function controlComparisonSvg(report:HypothesisReport):Uint8Array|null {
  const packed=report.assumptions.find(a=>a.id==='packed-draw');
  if(!packed||packed.status!=='partial')return null;
  const a=packed.evidence.portal as {pairCount:number;drawCommands:unknown[];streamObject2:number}|undefined;
  const b=packed.evidence.forest as {pairCount:number;drawCommands:unknown[];streamObject2:number}|undefined;
  if(!a||!b)return null;
  const max=Math.max(1,a.pairCount,b.pairCount,a.drawCommands.length,b.drawCommands.length);
  const bar=(n:number,y:number,color:string)=>`<rect x="240" y="${y}" width="${Math.round(280*n/max)}" height="17" fill="${color}"/>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240">
    <rect width="600" height="240" fill="#111821"/><text x="20" y="28" fill="#f0d1a5" font-size="17" font-family="monospace">Portal vs Forest: source control stream</text>
    <text x="20" y="49" fill="#aab9c8" font-size="12" font-family="monospace">Diagnostic counts, NOT reconstructed stage pixels</text>
    <text x="18" y="83" fill="#fff" font-size="12" font-family="monospace">Portal pointer pairs: ${a.pairCount}</text>${bar(a.pairCount,70,'#8ab7d8')}
    <text x="18" y="114" fill="#fff" font-size="12" font-family="monospace">Forest pointer pairs: ${b.pairCount}</text>${bar(b.pairCount,101,'#7ac9a7')}
    <text x="18" y="145" fill="#fff" font-size="12" font-family="monospace">Portal draw commands: ${a.drawCommands.length}</text>${bar(a.drawCommands.length,132,'#8ab7d8')}
    <text x="18" y="176" fill="#fff" font-size="12" font-family="monospace">Forest draw commands: ${b.drawCommands.length}</text>${bar(b.drawCommands.length,163,'#7ac9a7')}
    <text x="18" y="208" fill="#aab9c8" font-size="12" font-family="monospace">Object-2 stream offsets: 0x${a.streamObject2.toString(16)} / 0x${b.streamObject2.toString(16)}</text>
    <text x="18" y="225" fill="#dda87d" font-size="11" font-family="monospace">Borrowed interpretation remains experimental</text>
  </svg>`;
  return utf8.encode(svg);
}

export function buildHypothesisEvidenceZip(report:HypothesisReport, mode:'visual'|'forensic'):Uint8Array {
  const md=`# Portal → Forest experimental reconstruction\n\nThis is an unverified cross-stage experiment, not a reconstructed Forest image.\n\n${report.assumptions.map(a=>`- ${a.title}: **${a.status}** — ${a.detail}`).join('\n')}\n\n## Limits\n${report.limitations.join('\n')}\n`;
  const files=[{name:'SUMMARY.md',bytes:utf8.encode(md)},
    {name:'MANIFEST.json',bytes:asJson({format:'mkdos_o194_hypothesis_zip_v1',mode,sourceGameFilesBundled:false,experiment:'Portal to Forest'})},
    {name:'EXPERIMENT.json',bytes:asJson({game:report.game,reference:report.reference,target:report.target,selectedAssumptions:report.assumptions.map(a=>a.id),status:'experimental'})},
    {name:'evidence/source_hashes.json',bytes:asJson(report.sourceWitnesses)},
    {name:'evidence/assumptions.json',bytes:asJson(report.assumptions)},
    {name:'results/results.json',bytes:asJson({observations:report.observations,limitations:report.limitations})},
    {name:'reproduce/parameters.json',bytes:asJson({game:'mk2',reference:'portal',target:'forest',assumptions:report.assumptions.map(a=>a.id),reader:'readMK2StageDynamicStreamsO130',strictCanonicalChecks:true})},
    {name:'reproduce/README.md',bytes:utf8.encode('Provide unmodified MK2.EXE and original PORTAL.GRA and FOREST.GRA with the listed SHA-256 digests. Open Laboratory > Hypothesis Workbench in MK DOS Archive O194, select the same assumptions, and run. These results do not imply Forest animation decoding.')}];
  const compare=controlComparisonSvg(report);
  if(compare)files.push({name:'results/control_stream_comparison.svg',bytes:compare});
  if(mode==='forensic')files.push({name:'diagnostics/execution_trace.json',bytes:asJson(report.assumptions)},
    {name:'diagnostics/warnings.json',bytes:asJson(report.limitations)},
    {name:'diagnostics/failures.json',bytes:asJson(report.observations)});
  return buildStoredZip(files);
}
export function exportHypothesisEvidence(report:HypothesisReport, mode:'visual'|'forensic') {
  download(buildHypothesisEvidenceZip(report,mode),`MKDOS_O194_Portal_to_Forest_${mode}_evidence.zip`,'application/zip');
}

/** Import evidence for comparison only. Imported claims never update verified source state. */
export function importHypothesisZip(bytes:Uint8Array): HypothesisReport {
  if(bytes.length>24*1024*1024)throw new Error('Research package exceeds 24 MiB import limit');
  const entries=parseAnimationStoreZip(bytes);
  function jsonFile(path:string){const entry=entries.get(path);if(!entry)throw new Error(`Missing evidence entry: ${path}`);return JSON.parse(new TextDecoder().decode(entry.bytes));}
  const manifest=jsonFile('MANIFEST.json');
  if(manifest.format!=='mkdos_o194_hypothesis_zip_v1')throw new Error('Not an O194 Hypothesis Evidence Package');
  const experiment=jsonFile('EXPERIMENT.json');
  const assumptions=jsonFile('evidence/assumptions.json');
  const hashes=jsonFile('evidence/source_hashes.json');
  const results=jsonFile('results/results.json');
  if(experiment.game!=='mk2'||experiment.target!=='forest'||experiment.reference!=='portal'||!Array.isArray(assumptions)||assumptions.length>4||!Array.isArray(hashes))throw new Error('Unexpected experiment shape');
  if(!assumptions.every((a:EvidenceStep)=>typeof a.id==='string'&&typeof a.status==='string'&&typeof a.detail==='string'))throw new Error('Invalid assumption evidence');
  if(!hashes.every((h:SourceWitness)=>typeof h.path==='string'&&/^[a-f0-9]{64}$/.test(h.sha256)))throw new Error('Missing or invalid source hashes');
  if(!Array.isArray(results.observations)||!Array.isArray(results.limitations))throw new Error('Malformed experiment conclusions');
  return {format:'mkdos_hypothesis_o194',game:'mk2',target:'forest',reference:'portal',status:'experimental',
    startedAt:'imported from evidence package',finishedAt:'imported from evidence package',
    sourceWitnesses:hashes,assumptions,observations:results.observations,limitations:[...results.limitations,'Imported evidence is untrusted until rerun with matching source hashes.'],sourcePaths:hashes.map((x:SourceWitness)=>x.path)};
}

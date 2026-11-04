import React,{useEffect,useRef,useState} from 'react';
import type {DirectorySource} from '../core/filesystem/DirectorySource';
import {O122_SETUP_ROWS,type O122Stage} from '../games/mk2/research/stageIndexedPlacementsO122';
import {renderMK2IndexedSetupLayerO122,O122_QUALIFICATION,type O122IndexedLayerPreview} from '../games/mk2/research/stageIndexedMosaicsO122';
import {readMK2ConditionalStageRootTablesO125,type O125Routing} from '../games/mk2/research/stageConfigDispatchO125';
import {readMK2StageIndexConsumersO127,type O127StageIndexSource} from '../games/mk2/research/stageIndexConsumersO127';
import {readMK2RendererBoundaryO128,type O128RendererBoundary} from '../games/mk2/research/stageRenderGateBoundaryO128';
import {readMK2FixedControlStreamsO129,type O129StreamEvidence} from '../games/mk2/research/stageControlStreamsO129';
import {readMK2StageDynamicStreamsO130,type O130StageEvidence} from '../games/mk2/research/stageDynamicStreamsO130';
import {readMK2StageRowGeometryO131,type O131StageRowGeometry} from '../games/mk2/research/stagePackedFloorGeometryO131';
import {renderMK2FullSourceFloorO132} from '../games/mk2/research/stageNativeSourceFloorO132';
import {readMK2StageMotionSourceO133} from '../games/mk2/research/stageMotionSourceInputsO133';
import {readMK2StageBehaviorCallbacksO134} from '../games/mk2/research/stageBehaviorCallbacksO134';
import {readMK2StageEffectCoroutinesO135} from '../games/mk2/research/stageEffectCoroutineO135';
import {readMK2OriginalEffectFramesO136,type O136EffectTrack} from '../games/mk2/research/stageOriginalEffectFramesO136';
import {buildAllOriginalEffectFramesArchiveO177} from '../games/mk2/research/stageOriginalEffectArchiveO177';

/** The user's original DOS files are loaded read-only. No prebundled game assets. */
export function MK2IndexedStageMosaicsO122({source}:{source:DirectorySource}){
 const [stage,setStage]=useState<O122Stage>('portal');
 const [setup,setSetup]=useState(0x16526);
 const [preview,setPreview]=useState<O122IndexedLayerPreview|null>(null);
 const [loading,setLoading]=useState(false);const [error,setError]=useState<string|null>(null);
 const [routes,setRoutes]=useState<O125Routing|null>(null);
 const [indexSource,setIndexSource]=useState<O127StageIndexSource|null>(null);
 const [renderBound,setRenderBound]=useState<O128RendererBoundary|null>(null);
 const [controlStreams,setControlStreams]=useState<O129StreamEvidence|null>(null);
 const [dynamicStreams,setDynamicStreams]=useState<O130StageEvidence|null>(null);
 const [floorGeometry,setFloorGeometry]=useState<readonly O131StageRowGeometry[]|null>(null);
 const canvas=useRef<HTMLCanvasElement>(null);
 const floorCanvas=useRef<HTMLCanvasElement>(null);
 const effectCanvas=useRef<HTMLCanvasElement>(null);
 const [effectTracks,setEffectTracks]=useState<O136EffectTrack[]>([]);
 const [towerNotice,setTowerNotice]=useState<string|null>(null);
 const [otherStageNotice,setOtherStageNotice]=useState<string|null>(null);
 const [effectArchiveBusy,setEffectArchiveBusy]=useState(false);
 const [activeTrack,setActiveTrack]=useState(0),[activeFrame,setActiveFrame]=useState(0);
 const [motionSource,setMotionSource]=useState<Awaited<ReturnType<typeof readMK2StageMotionSourceO133>>|null>(null);
 const [behaviorSource,setBehaviorSource]=useState<Awaited<ReturnType<typeof readMK2StageBehaviorCallbacksO134>>|null>(null);
 const [effectSource,setEffectSource]=useState<Awaited<ReturnType<typeof readMK2StageEffectCoroutinesO135>>|null>(null);
 const [nativeFloor,setNativeFloor]=useState<Awaited<ReturnType<typeof renderMK2FullSourceFloorO132>>|null>(null);
 const load=async()=>{
  setLoading(true);setError(null);setPreview(null);setRoutes(null);setIndexSource(null);setRenderBound(null);setControlStreams(null);setDynamicStreams(null);setFloorGeometry(null);setNativeFloor(null);setMotionSource(null);setBehaviorSource(null);setEffectSource(null);setEffectTracks([]);setTowerNotice(null);setOtherStageNotice(null);setActiveTrack(0);setActiveFrame(0);
  try{
   if(source.isSynthetic)throw new Error('An original user-selected DOS MK2 directory is required');
   const entries=await source.listRecursive();
   async function file(name:string){const files=entries.filter(e=>e.name.toUpperCase()===name);
    if(files.length!==1)throw new Error('Expected exactly one '+name+' in original MK2 directory');
    return await source.readSlice(files[0].path,0,files[0].size);
   }
   const exe=await file('MK2.EXE');
   const routing=await readMK2ConditionalStageRootTablesO125(exe);
   const indexed=await readMK2StageIndexConsumersO127(exe);
   const guarded=await readMK2RendererBoundaryO128(exe);
   const controls=await readMK2FixedControlStreamsO129(exe);
   const stageStreams=await readMK2StageDynamicStreamsO130(exe);
   const originalStageGRA=await file(stage==='portal'?'PORTAL.GRA':'TOMB.GRA');
   const layer=await renderMK2IndexedSetupLayerO122(exe,originalStageGRA,stage,setup);
   const fullFloor=await renderMK2FullSourceFloorO132(exe,originalStageGRA,stage);
   setRoutes(routing);setIndexSource(indexed);setRenderBound(guarded);setControlStreams(controls);setDynamicStreams(stageStreams);setFloorGeometry(readMK2StageRowGeometryO131(exe,stageStreams));setPreview(layer);setNativeFloor(fullFloor);setMotionSource(await readMK2StageMotionSourceO133(exe,stage));setBehaviorSource(await readMK2StageBehaviorCallbacksO134(exe,stage));setEffectSource(await readMK2StageEffectCoroutinesO135(exe,stage));
   const primaryEffects=await readMK2OriginalEffectFramesO136(exe,originalStageGRA,stage);
   // Tower is a separate read-only source-sequence preview. Its source-linked palette
   // is deliberately NOT presented as an observed in-game palette/DAC allocation.
   const towerFiles=entries.filter(e=>e.name.toUpperCase()==='TOWER.GRA');
   let towerEffects:O136EffectTrack[]=[];
   if(towerFiles.length>1)setTowerNotice('Tower preview skipped: multiple TOWER.GRA files found. The selected-stage export remains unchanged.');
   else if(towerFiles.length===1){
    try{towerEffects=await readMK2OriginalEffectFramesO136(exe,await source.readSlice(towerFiles[0].path,0,towerFiles[0].size),'tower');}
    catch(e){setTowerNotice('Tower preview skipped because its source qualification failed: '+(e instanceof Error?e.message:String(e)));}
   }
   // Load the other original stage only if present, without invalidating the selected stage.
   // The O177 full archive is intentionally disabled unless all six lists are authenticated.
   const otherStage=stage==='portal'?'tomb':'portal',otherName=otherStage==='portal'?'PORTAL.GRA':'TOMB.GRA';
   const otherFiles=entries.filter(e=>e.name.toUpperCase()===otherName);
   let otherEffects:O136EffectTrack[]=[];
   if(otherFiles.length!==1)setOtherStageNotice(`Full 43-frame archive unavailable: expected exactly one original ${otherName}.`);
   else try{otherEffects=await readMK2OriginalEffectFramesO136(exe,await source.readSlice(otherFiles[0].path,0,otherFiles[0].size),otherStage);}
   catch(e){setOtherStageNotice(`Full 43-frame archive unavailable: ${otherName} did not pass source validation: ${e instanceof Error?e.message:String(e)}`);}
   setEffectTracks([...primaryEffects,...otherEffects,...towerEffects]);
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setLoading(false);}
 };
 useEffect(()=>{
  const c=canvas.current;if(!preview||!c)return;
  c.width=preview.width;c.height=preview.height;
  const context=c.getContext('2d');if(context){context.imageSmoothingEnabled=false;context.putImageData(
   new ImageData(new Uint8ClampedArray(preview.rgba),preview.width,preview.height),0,0);}
 },[preview]);
 useEffect(()=>{
  const c=floorCanvas.current;if(!nativeFloor||!c)return;
  c.width=nativeFloor.width;c.height=nativeFloor.height;
  const ctx=c.getContext('2d');if(ctx){ctx.imageSmoothingEnabled=false;ctx.putImageData(
   new ImageData(new Uint8ClampedArray(nativeFloor.rgba),nativeFloor.width,nativeFloor.height),0,0);}
 },[nativeFloor]);
 const selectedFrame=effectTracks[activeTrack]?.frames[activeFrame];
 useEffect(()=>{
  const c=effectCanvas.current;if(!selectedFrame||!c)return;
  c.width=selectedFrame.width;c.height=selectedFrame.height;
  c.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(selectedFrame.rgba),selectedFrame.width,selectedFrame.height),0,0);
 },[selectedFrame]);
 const exportEffectFrame=()=>{
  if(!effectCanvas.current||!selectedFrame)return;
  const a=document.createElement('a');a.href=effectCanvas.current.toDataURL('image/png');
  a.download=`mk2_${effectTracks[activeTrack].name}_frame_${activeFrame.toString().padStart(2,'0')}_${effectTracks[activeTrack].stage==='tower'?'O176':'O136'}.png`;a.click();
 };
 const exportAllEffectFrames=async()=>{
  if(effectArchiveBusy||effectTracks.length!==6)return;
  setEffectArchiveBusy(true);
  try{
   const bundle=await buildAllOriginalEffectFramesArchiveO177(effectTracks);
   const url=URL.createObjectURL(new Blob([bundle.zipBytes.slice()],{type:'application/zip'}));
   const a=document.createElement('a');a.href=url;a.download=bundle.filename;a.click();URL.revokeObjectURL(url);
  }catch(e){setError(e instanceof Error?e.message:String(e));}
  finally{setEffectArchiveBusy(false);}
 };
 const exportNativeFloor=()=>{
  if(!nativeFloor||!floorCanvas.current)return;
  const a=document.createElement('a');a.href=floorCanvas.current.toDataURL('image/png');
  a.download=`mk2_${stage}_FULL_896x${nativeFloor.height}_original_floor_O132.png`;a.click();
 };
 const exportPng=()=>{
  if(!canvas.current||!preview)return;
  const anchor=document.createElement('a');anchor.href=canvas.current.toDataURL('image/png');
  anchor.download=`mk2_${stage}_setup_${setup.toString(16)}_O122_local_layer.png`;anchor.click();
 };
 return <section className="mt-5 rounded-xl border border-amber-900/60 bg-zinc-900/50 p-4">
   <h3 className="text-sm text-amber-200 font-semibold">MK2 original indexed stage sprite layers · O122</h3>
   <p className="text-xs text-zinc-400 mt-1">Reconstructs original sprite-command streams and setup-local placements using authenticated Tomb/Portal resources and original EXE palettes. Portal backdrop is gameplay-pixel verified; O123 also confirms the Tomb architectural (0x1737C) and sky (0x173B2) layers in separately aligned regions of an untouched fight screenshot. Other setups remain conditional. Not a whole-stage scene, live camera position, or complete runtime layer order.</p>
   <p className="text-xs text-zinc-400 mt-1">O124 source-pixel attribution tests exact screenshot RGB against these already verified source layers and the packed floors: 166,180 Tomb pixels and 102,251 Portal pixels match at least one source prediction in the two reference captures. Some colors match by coincidence; these are <strong>not</strong> whole-stage coverage percentages or runtime camera/handle observations. Full color-coded evidence is in the O124 research outputs, not this individual-layer viewer.</p>
   <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
     <label className="text-zinc-400" htmlFor="o122-stage">Stage</label>
     <select id="o122-stage" value={stage} onChange={e=>{const s=e.target.value as O122Stage;setStage(s);setSetup(s==='portal'?0x16526:0x1737c);setPreview(null);}}
       className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-200">
       <option value="portal">The Portal</option><option value="tomb">Kombat Tomb</option>
     </select>
     <label className="text-zinc-400" htmlFor="o122-setup">Original setup</label>
     <select id="o122-setup" value={setup} onChange={e=>{setSetup(Number(e.target.value));setPreview(null);}}
       className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-200">
       {O122_SETUP_ROWS[stage].map(item=><option key={item.setupObject2Offset} value={item.setupObject2Offset}>
        0x{item.setupObject2Offset.toString(16).toUpperCase()} · {item.width}×{item.height} · {item.placements.length} sprites
       </option>)}
     </select>
     <button type="button" disabled={loading||source.isSynthetic}
       className="rounded bg-amber-900/60 px-3 py-1.5 text-amber-100 border border-amber-700 disabled:opacity-50" onClick={load}>
       {loading?'Decoding…':'Verify & render layer'}
     </button>
     {preview&&<button type="button" className="rounded bg-zinc-700 px-3 py-1.5 text-zinc-100" onClick={exportPng}>Export separate sprite-layer PNG</button>}
     {nativeFloor&&<button type="button" className="rounded bg-emerald-900/60 border border-emerald-700 px-3 py-1.5 text-emerald-100" onClick={exportNativeFloor}>Export full-width 896px floor PNG</button>}
   </div>
   {error&&<p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}
   {routes&&<p className="mt-3 text-xs text-zinc-400">O125 original EXE dispatch: {stage==='tomb'?'Tomb table index 1':'Portal table index 7'}. Mode=2 root 0x{routes.stageRoots[stage].mode_equals_2.toString(16).toUpperCase()}, mode=1 root 0x{routes.stageRoots[stage].mode_equals_1.toString(16).toUpperCase()}, other modes root 0x{routes.stageRoots[stage].mode_other.toString(16).toUpperCase()}. O126: mode 2 is set by the source only on an integrity-check reset; two temporary mode=3 overrides and a separate mode backup/restore are present. Mode=1 and fallback differ at configuration indices 0 and 4 (not Tomb or Portal). These remain <strong>conditional</strong> configuration pointers; the actual runtime mode, setup and palette handle have not been observed.</p>}
   {indexSource&&renderBound&&<p className="mt-2 text-xs text-zinc-400">O127–O128 source-only path: nine direct callers reach the stage-root dispatcher; five write an immediate index. The dispatcher saves the index at Object-2 0x7747F. The separately guarded row renderer at 0x9E118 uses an indexed packed-resource DWORD from Object-2 0x2EF54 <strong>only when runtime flag 0x562D4 bit 0 is set</strong>. O128 corrects O127’s overextended “31-entry renderer table” inference: <strong>10 source DWORDs are authenticated before a separately referenced region at 0x2EF7C</strong>; neither the complete array length nor a legal runtime index maximum is proven. This stage’s source index {stage==='tomb'?1:7} has packed DWORD 0x{renderBound.firstTenDWORDs[stage==='tomb'?1:7].toString(16).toUpperCase()}. Live flag, index, camera and palette handle are <strong>not observed</strong>.</p>}
   {controlStreams&&<p className="mt-2 text-xs text-zinc-400">O129 static control-stream trace: {controlStreams.fixedStreams.length} explicitly assigned source lists contain {controlStreams.fixedStreams.reduce((sum,s)=>sum+s.pointerPairs.length,0)} positive pointer-pair commands followed by zero terminators, with no −1 packed-row command in these three lists. The executable also loads a stream pointer dynamically at 0x81F55, so <strong>these fixed lists are not an exhaustive census of draw commands</strong>. Live stream choice, activation and palette handle remain unobserved.</p>}
   {dynamicStreams&&<p className="mt-2 text-xs text-zinc-400">O130 authenticated stage-root control streams: the selected {stage==='tomb'?'Tomb (index 1)':'Portal (index 7)'} configuration has a stage-local command stream at Object-2 0x{dynamicStreams.stages[stage==='tomb'?1:7].streamObject2.toString(16).toUpperCase()}, loaded from root field +0x18. That stream contains {dynamicStreams.stages[stage==='tomb'?1:7].drawCommands.length} explicit −1 packed-render command. The −1 command supplies {dynamicStreams.stages[stage==='tomb'?1:7].drawCommands.map(c=>`${c.rawParameter2} and ${c.rawParameter3}`).join(', ')}; O131 authenticates their use for destination-row and requested-row calculations (not a measured final screen position). Seven of the first ten stage configuration families contain a −1 command (Tomb, Battle, Tower, Forest, Armory, Portal and Arena); DEDPOOL, PIT and CAVE do not in these candidate lists. This <strong>does not prove execution, flag state, draw order, camera or palette handle during a fight.</strong></p>}
   {floorGeometry&&<p className="mt-2 text-xs text-zinc-400">O131 original packed-floor geometry: the {stage==='tomb'?'Tomb':'Portal'} source command supplies row {floorGeometry.find(v=>v.stageIndex===(stage==='tomb'?1:7))?.rawDestinationY} and requests {floorGeometry.find(v=>v.stageIndex===(stage==='tomb'?1:7))?.requestedRows} rows; at <strong>hypothetical zero vertical adjustment</strong>, this would transfer {floorGeometry.find(v=>v.stageIndex===(stage==='tomb'?1:7))?.illustratedZeroScrollVisibleRows} visible 320-byte rows, clipped at Y=200. The runtime source parameter points to mutable Object-2 memory, not a constant stored in MK2.EXE. Original source scanlines are 896 bytes apart, with signed 16.16 row adjustments calculated by the renderer. The live vertical adjustment, source word, palette handle and drawn row count remain <strong>unobserved</strong>.</p>}
   {motionSource&&<p className="mt-2 text-xs text-zinc-400">O133 full-scene motion-source research: the original {stage==='tomb'?'Tomb':'Portal'} configuration carries nine signed 16.16 source words at Object-2 0x{motionSource.sourceTableObject2.toString(16).toUpperCase()}: <code>{motionSource.rawSigned16_16.map(v=>(v/65536).toFixed(4)).join(', ')}</code>. The source code has multiple transform routines and per-channel accumulation reads. These are original movement inputs, <strong>not measured parallax ratios, loop timing, layer-to-frame assignments or a playable animation</strong>. All uncropped sprites, masks and floor pixels remain separate for future exports.</p>}
   {behaviorSource&&<p className="mt-2 text-xs text-zinc-400">O134 candidate scene-init behavior references: this stage's root field +0x10 points to original executable callback 0x{behaviorSource.callbackPhysical.toString(16).toUpperCase()}; its code has {behaviorSource.registrations.length} verified routine registration sites ({behaviorSource.registrations.map(x=>`0x${x.registeredFunctionPhysical.toString(16).toUpperCase()}`).join(', ')}). These are original <strong>code/function references</strong>, not authenticated animated sprite sequences, timestamps, looping playback or proof that the routines executed during this particular fight. Complete native source sprites remain uncropped for eventual frame-by-frame research.</p>}
   {effectSource&&<p className="mt-2 text-xs text-zinc-400">O135 static behavior-code trace: a source-backed coroutine scheduler at 0x67222 saves per-function continuation and counter state; the selected stage has {effectSource.functionEntryPoints.length} distinct candidate routine entry points. {stage==='tomb'?'Tomb contains two loops with six-count coroutine yields and source comparison thresholds 48 and 108.':`Portal contains a bounded update to object field +0x${effectSource.positionOutputField?.toString(16).toUpperCase()}: source values change by 0x300 between ±0x6000 (16 ascending and 64 descending arithmetic steps in the inspected code).`} <strong>These counts are not proved frame durations, and no runtime activation, sprite-track binding, gameplay parallax or final animation export is claimed.</strong> Original layers remain uncropped.</p>}
   {towerNotice&&<p className="mt-2 text-xs text-amber-200">{towerNotice}</p>}
   {otherStageNotice&&<p className="mt-2 text-xs text-amber-200">{otherStageNotice}</p>}
   {effectTracks.length>0&&<div className="mt-4 space-y-2 rounded border border-violet-800/70 bg-zinc-950/40 p-3">
    <p className="text-sm font-semibold text-violet-200">O136/O176 · Authenticated original background-effect frames</p>
    <p className="text-xs text-zinc-300">{effectTracks.reduce((n,t)=>n+t.frames.length,0)} original sprite frames in {effectTracks.length} EXE-linked ordered sequences from all available validated original Tomb, Portal and Tower source lists. Frames retain original alpha, indexed colors, descriptor offsets and source dimensions. <strong>Actual FPS, seconds, live triggering, layering and world placement have not been observed.</strong> These are original frames, not generated animation or a camera crop.</p>
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label htmlFor="o136-track" className="text-zinc-400">Effect sequence</label>
      <select id="o136-track" value={activeTrack} onChange={e=>{setActiveTrack(Number(e.target.value));setActiveFrame(0);}} className="rounded border border-zinc-700 bg-zinc-950 p-2 text-white">
       {effectTracks.map((track,i)=><option key={track.name} value={i}>{track.stage.toUpperCase()} — {track.name} · {track.frames.length} source frames</option>)}
      </select>
      <label htmlFor="o136-frame" className="text-zinc-400">Original frame</label>
      <select id="o136-frame" value={activeFrame} onChange={e=>setActiveFrame(Number(e.target.value))} className="rounded border border-zinc-700 bg-zinc-950 p-2 text-white">
       {effectTracks[activeTrack]?.frames.map(f=><option key={f.ordinal} value={f.ordinal}>{f.ordinal+1} / {effectTracks[activeTrack].frames.length}</option>)}
      </select>
      <button type="button" className="rounded border border-violet-600 bg-violet-950/60 px-3 py-1.5 text-violet-100" onClick={exportEffectFrame}>Export selected original frame PNG</button>
      <button type="button" disabled={effectTracks.length!==6||effectArchiveBusy} className="rounded border border-violet-600 bg-violet-950/60 px-3 py-1.5 text-violet-100 disabled:opacity-40" onClick={exportAllEffectFrames}>{effectArchiveBusy?'Packaging source frames…':'Export all 43 original frames + indices/masks (ZIP)'}</button>
    </div>
    {effectTracks[activeTrack]?.paletteIsSourceLinkedCandidate&&<p className="text-xs text-amber-200"><strong>O176 Tower palette qualification:</strong> the 80-color record at MK2.EXE physical 0x89468 is linked to Tower setup data and reproduces the extracted source-color mapping. Its allocation, actual selected DAC colors and appearance during gameplay have NOT been verified. This viewer shows a source-linked candidate preview, not an authenticated gameplay screenshot.</p>}
    {effectTracks[activeTrack]&&<p className="text-xs text-zinc-400">O169 verified original sequence boundary: <strong>{effectTracks[activeTrack].controlType==='ONE_MARKER_BACK_REFERENCE'?'loops through an original 1-marker back-reference':'ends with an original zero marker and carry exit'}</strong> (Object-2 list 0x{effectTracks[activeTrack].sourcePointerObject2.toString(16).toUpperCase()}). O171 establishes a separate alternate interpreter for render objects with flag bit 1 set; these source frames must not be assigned that alternate command grammar without an observed runtime mode. <strong>Neither source loop form establishes elapsed timing, actual activation, compositing order or final positioning.</strong></p>}
    <div className="flex items-center justify-center rounded bg-zinc-900 p-4"><canvas ref={effectCanvas} style={{imageRendering:'pixelated',width:selectedFrame?Math.min(400,selectedFrame.width*6):200,height:'auto'}} aria-label="Original MK2 source-ordered effect sprite"/></div>
    {selectedFrame&&<p className="text-[11px] text-zinc-400">Original descriptor 0x{selectedFrame.descriptorObject2.toString(16).toUpperCase()} · {selectedFrame.width}×{selectedFrame.height}px · original sprite offset ({selectedFrame.sourceX},{selectedFrame.sourceY}) · encoded resource bytes 0x{selectedFrame.graStart.toString(16).toUpperCase()}–0x{selectedFrame.graEnd.toString(16).toUpperCase()} (exclusive).</p>}
  </div>}
  {nativeFloor&&<div className="mt-3 space-y-2">
     <p className="text-xs text-emerald-200">O132 native floor source: <strong>{nativeFloor.width} × {nativeFloor.height} pixels</strong>, all 896 original source columns (not the 320-pixel in-game crop). This is a separate original-index layer, not a finished scene or 16:9 composite. No made-up frames, parallax offsets or looping animation are added. For index/alpha PNGs and the full multi-layer manifest, use the O132 Python source-layer pack.</p>
     <div className="overflow-auto rounded border border-zinc-700 bg-black"><canvas ref={floorCanvas} width={896} height={nativeFloor.height} style={{imageRendering:'pixelated',width:'100%',minWidth:'600px'}} aria-label={`${stage} entire 896-column original floor source`}/></div>
   </div>}
   {preview&&<div className="mt-3 space-y-2">
      <div className="overflow-hidden rounded border border-zinc-700 bg-black">
       <canvas ref={canvas} width={preview.width} height={preview.height}
         className="w-full max-w-full" style={{imageRendering:'pixelated'}} aria-label={`${stage} original indexed setup-local layer`}/>
      </div>
      <p className="text-xs text-zinc-300">{preview.width}×{preview.height} pixels · {preview.descriptorCount} sprite-control entries · {preview.opaqueCanvasPixels.toLocaleString()} opaque pixels · source palette 0x{preview.paletteSourceRecordPhysical.toString(16).toUpperCase()}.</p>
      <p className="text-[11px] text-zinc-500 font-mono break-all">{preview.sourceSHA256}</p>
    </div>}
   <p className="mt-3 text-[10px] text-zinc-500 font-mono">{O122_QUALIFICATION}. Runtime-selected setup, palette allocation handle, camera and final compositing remain unobserved.</p>
 </section>;
}

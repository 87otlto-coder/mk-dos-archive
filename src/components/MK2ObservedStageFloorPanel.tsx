import React, { useEffect, useRef, useState } from 'react';
import type { DirectorySource } from '../core/filesystem/DirectorySource';
import { verifyO118PreviewAgainstExe } from '../games/mk2/research/nativeStageFloorPaletteO118';
import { mk2PaletteRuntimeSourceStatusO119 } from '../games/mk2/research/runtimeStagePaletteSourceO119';
import { mk2PaletteControlGraphStatusO121 } from '../games/mk2/research/stagePaletteControlO121';
import { previewMK2ObservedFloorFromDirectoryO116,renderMK2ObservedStageFloorO116,
  O116_FLOOR_QUALIFICATION, type MK2ObservedStage, type MK2ObservedFloorPreview } from '../games/mk2/research/observedStageFloorPreviewO116';

/** A bounded floor-layer view; this is NOT an entire MK2 background or live DAC palette. */
export function MK2ObservedStageFloorPanel({ source }: { source: DirectorySource }) {
 const canvasRef=useRef<HTMLCanvasElement>(null);
 const [stage,setStage]=useState<MK2ObservedStage>('portal');
 const [preview,setPreview]=useState<MK2ObservedFloorPreview|null>(null);
 const [nativeVerification,setNativeVerification]=useState<string|null>(null);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [left,setLeft]=useState(292);
 const load=async()=>{
  setPending(true);setError(null);setPreview(null);setNativeVerification(null);
  try {
   // Default path authenticates and reads the original GRA from the user-selected MK2 directory.
   const standard=await previewMK2ObservedFloorFromDirectoryO116(source,stage);
   // An alternate source crop is deliberately a separate, user-selected hypothesis.
   let selected=standard;
   if(left!==standard.sourceLeft){
    const items=(await source.listRecursive()).filter(e=>e.name.toUpperCase()===(stage==='portal'?'PORTAL.GRA':'TOMB.GRA'));
    if(items.length!==1)throw new Error('Expected one original '+stage.toUpperCase()+'.GRA');
    selected=await renderMK2ObservedStageFloorO116(stage,await source.readSlice(items[0].path,0,items[0].size),left);
   }
   const entries=await source.listRecursive();
   const exeFiles=entries.filter(e=>e.name.toUpperCase()==='MK2.EXE');
   const graFiles=entries.filter(e=>e.name.toUpperCase()===(stage==='portal'?'PORTAL.GRA':'TOMB.GRA'));
   if(exeFiles.length!==1||graFiles.length!==1)throw new Error('O118 requires exactly one original MK2.EXE and stage GRA');
   const exe=await source.readSlice(exeFiles[0].path,0,exeFiles[0].size);
   const gra=await source.readSlice(graFiles[0].path,0,graFiles[0].size);
   const confirmed=await verifyO118PreviewAgainstExe(exe,stage,gra,selected.sourceLeft,0,selected.rgba);
   setNativeVerification(`${confirmed.matched.toLocaleString()} / ${confirmed.total.toLocaleString()} floor pixels match original EXE palette record at 0x${confirmed.recordPhysical.toString(16).toUpperCase()}. ${mk2PaletteRuntimeSourceStatusO119(stage)} ${mk2PaletteControlGraphStatusO121(stage)}`);
   setPreview(selected);
  } catch(e) {setError(e instanceof Error?e.message:String(e));}
  finally{setPending(false);}
 };
 useEffect(()=>{
  const canvas=canvasRef.current;
  if(!canvas||!preview)return;
  canvas.width=preview.width;canvas.height=preview.height;
  const ctx=canvas.getContext('2d');
  if(ctx){ctx.imageSmoothingEnabled=false;ctx.putImageData(new ImageData(new Uint8ClampedArray(preview.rgba),preview.width,preview.height),0,0);}
 },[preview]);
 const downloadPng=()=>{
  const canvas=canvasRef.current;if(!canvas||!preview)return;
  const a=document.createElement('a');a.download=`mk2_${preview.stage}_O116_witnessed_floor_only.png`;
  a.href=canvas.toDataURL('image/png');a.click();
 };
 return <section className="mt-5 rounded-xl border border-amber-900/60 bg-zinc-900/50 p-4">
   <h3 className="text-sm text-amber-200 font-semibold">MK2 stage-floor previews · O116–O121</h3>
   <p className="text-xs text-zinc-400 mt-1">Authentic packed floor layer only. O119 gameplay color-perturbation tests support the native 80-color source records for Tomb and Portal. O121 further ties the authenticated 80-color stage palettes to their original GRA sprite-control records; the matching 79-color candidates belong to IMAGES.GRA, not the stage resources. No live palette handle, DAC bank or full composition is inferred.</p>
   <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
     <label className="text-zinc-400" htmlFor="o116-stage">Stage</label>
     <select id="o116-stage" value={stage} onChange={e=>{const next=e.target.value as MK2ObservedStage;setStage(next);setLeft(next==='portal'?292:290);setPreview(null);setError(null);}}
       className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-200">
       <option value="portal">The Portal</option><option value="tomb">Kombat Tomb</option>
     </select>
     <label className="text-zinc-400" htmlFor="o116-left">Source crop X (0–576)</label>
     <input id="o116-left" type="number" min={0} max={576} step={1} value={left}
       onChange={e=>{setLeft(Number(e.target.value));setPreview(null);}}
       className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"/>
     <button type="button" disabled={pending||source.isSynthetic}
       className="rounded bg-amber-900/60 px-3 py-1.5 text-amber-100 border border-amber-700 disabled:opacity-50" onClick={load}>
       {pending?'Verifying…':'Verify & preview'}
     </button>
     {preview&&<button type="button" className="rounded bg-zinc-700 px-3 py-1.5 text-zinc-100" onClick={downloadPng}>Export PNG</button>}
   </div>
   {error&&<p className="mt-3 text-xs text-red-300" role="alert">{error}</p>}
   {preview&&<div className="mt-3 space-y-2">
     <div className="overflow-hidden rounded border border-zinc-700 bg-black">
       <canvas ref={canvasRef} width={320} height={preview.height} className="w-full" style={{imageRendering:'pixelated'}} aria-label={`${preview.label}, authenticated floor-only RGB preview`}/>
     </div>
     <p className="text-xs text-zinc-300">{preview.label} · 320×{preview.height} source rows · fixed crop X={preview.sourceLeft} · original resource verified by SHA-256.</p>
     <p className="text-[11px] text-zinc-500 font-mono break-all">{preview.resourceSHA256}</p>
     {nativeVerification&&<p className="text-xs text-emerald-300">{nativeVerification}</p>}
   </div>}
   <p className="mt-3 text-[10px] text-zinc-500 font-mono">{O116_FLOOR_QUALIFICATION}. Crop position is not an authenticated camera RAM value.</p>
 </section>;
}

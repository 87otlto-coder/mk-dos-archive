import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, MoveHorizontal } from 'lucide-react';
import { MK1MultiPartFrameLosslessIrReport, MK1MultiPartPreviewPart } from '../games/mk1/research/multiPartFrameLosslessIr';
import { buildMultiPartControlledEditBundle, MK1MultiPartControlledEditResult } from '../games/mk1/research/multiPartControlledEdit';

interface Props { baseline: MK1MultiPartFrameLosslessIrReport; result: MK1MultiPartControlledEditResult; }
function parseHexColor(hex:string):[number,number,number]{const r=hex.replace('#','');return[parseInt(r.slice(0,2),16),parseInt(r.slice(2,4),16),parseInt(r.slice(4,6),16)];}
function computeBounds(parts:MK1MultiPartPreviewPart[]){const minX=Math.min(...parts.map(p=>p.x)),minY=Math.min(...parts.map(p=>p.y)),maxX=Math.max(...parts.map(p=>p.x+p.width)),maxY=Math.max(...parts.map(p=>p.y+p.height));return{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};}
function paint(canvas:HTMLCanvasElement,parts:MK1MultiPartPreviewPart[],bounds:{minX:number;minY:number;width:number;height:number},paletteHex:string[],scale=5){
  const palette=paletteHex.map(parseHexColor); const base=document.createElement('canvas');base.width=Math.max(1,bounds.width);base.height=Math.max(1,bounds.height);const bctx=base.getContext('2d');if(!bctx)return;bctx.clearRect(0,0,base.width,base.height);
  for(const part of parts){const pc=document.createElement('canvas');pc.width=part.width;pc.height=part.height;const pctx=pc.getContext('2d');if(!pctx)continue;const im=pctx.createImageData(part.width,part.height);for(let i=0;i<part.indices.length;i++){if(!part.opaqueMask[i])continue;const idx=part.indices[i];const c=idx>=1&&idx<=palette.length?palette[idx-1]:[255,0,255] as [number,number,number];const q=i*4;im.data[q]=c[0];im.data[q+1]=c[1];im.data[q+2]=c[2];im.data[q+3]=255;}pctx.putImageData(im,0,0);bctx.drawImage(pc,part.x-bounds.minX,part.y-bounds.minY);bctx.strokeStyle=part.symbol==='KHEART3B'?'rgba(250,204,21,.95)':'rgba(34,211,238,.7)';bctx.strokeRect(part.x-bounds.minX+.5,part.y-bounds.minY+.5,part.width-1,part.height-1);}
  canvas.width=Math.max(1,bounds.width*scale);canvas.height=Math.max(1,bounds.height*scale);const ctx=canvas.getContext('2d');if(!ctx)return;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,0,canvas.width,canvas.height);
}
function downloadBytes(bytes:Uint8Array,name:string,type='application/zip'){const u=URL.createObjectURL(new Blob([bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)],{type}));const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u);}

export function MultiPartControlledEditPanel({baseline,result}:Props){
  const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null);
  const originalRef=useRef<HTMLCanvasElement|null>(null),editedRef=useRef<HTMLCanvasElement|null>(null);
  const originalParts=useMemo(()=>baseline.previewPayloads?.get('PRIMARY:2')??[],[baseline]);
  const editedParts=useMemo(()=>originalParts.map(p=>p.symbol==='KHEART3B'?{...p,x:result.report.edit.after}:p),[originalParts,result.report.edit.after]);
  const sharedBounds=useMemo(()=>{const all=[...originalParts,...editedParts];return all.length?computeBounds(all):{minX:0,minY:0,maxX:1,maxY:1,width:1,height:1};},[originalParts,editedParts]);
  useEffect(()=>{if(originalRef.current&&originalParts.length)paint(originalRef.current,originalParts,sharedBounds,baseline.palette.rgbHex);if(editedRef.current&&editedParts.length)paint(editedRef.current,editedParts,sharedBounds,baseline.palette.rgbHex);},[originalParts,editedParts,sharedBounds,baseline.palette.rgbHex]);
  const download=async()=>{setBusy(true);setError(null);try{const zip=await buildMultiPartControlledEditBundle(result,baseline);downloadBytes(zip,'mk1-kano-heart-controlled-xy-edit-1E3O3.zip');}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
  const ready=result.report.status==='STATIC_VALIDATION_PASSED_RUNTIME_PENDING'&&result.report.decision.exactTwoByteWriteBackEstablished;
  if(!ready)return <section className="mt-3 p-3 rounded border border-red-900 text-xs text-red-300">1E.3O.3 static validation did not pass. Runtime bundle is disabled.</section>;
  return <section className="mt-3 p-3 rounded border border-amber-800 text-xs text-zinc-300" aria-label="Controlled multi-part XY edit">
    <h3 className="font-semibold text-amber-300 flex items-center gap-2"><MoveHorizontal className="w-4 h-4"/>Controlled multi-part XY edit / lossless write-back · 1E.3O.3</h3>
    <p className="mt-2">The qualified animation IR now performs a real semantic write. <code>KHEART3B.x</code> changes from <code>+19</code> to <code>-12</code>; the bounded serializer rewrites the executable and exactly two bytes change.</p>
    <div className="mt-2 grid sm:grid-cols-2 xl:grid-cols-4 gap-2 font-mono text-[11px]">
      <div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">semantic target</span><br/><span className="text-cyan-300">{result.report.edit.descriptorSymbol}.x</span></div>
      <div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">value</span><br/><span className="text-amber-300">{result.report.edit.before} → {result.report.edit.after}</span></div>
      <div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">byte diff</span><br/><span className="text-emerald-300">{result.report.evidence.changedByteCount} bytes only</span></div>
      <div className="rounded border border-zinc-800 p-2"><span className="text-zinc-500">reversal</span><br/><span className="text-emerald-300">{result.report.evidence.reverseRestoresOriginal?'canonical SHA restored':'FAILED'}</span></div>
    </div>
    <div className="mt-3 grid lg:grid-cols-2 gap-3">
      <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3"><div className="font-semibold text-zinc-200">Original three-part frame</div><div className="mt-2 min-h-[220px] flex items-center justify-center overflow-auto"><canvas ref={originalRef} className="border border-zinc-700/60" style={{imageRendering:'pixelated'}}/></div><div className="mt-2 text-zinc-500">KHEART3B is highlighted in yellow at x = {result.report.edit.before}.</div></div>
      <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3"><div className="font-semibold text-zinc-200">Edited IR preview</div><div className="mt-2 min-h-[220px] flex items-center justify-center overflow-auto"><canvas ref={editedRef} className="border border-zinc-700/60" style={{imageRendering:'pixelated'}}/></div><div className="mt-2 text-zinc-500">Only KHEART3B moves: x = {result.report.edit.after} ({result.report.edit.delta} px).</div></div>
    </div>
    <div className="mt-3 rounded border border-zinc-800 bg-zinc-950/50 p-3 font-mono text-[11px]">
      field @ {result.report.edit.fieldPhysicalHex} · {result.report.edit.beforeBytesHex} → {result.report.edit.afterBytesHex}<br/>
      edited SHA-256: {result.report.evidence.editedExeSha256}<br/>
      unexpected byte changes: {result.report.evidence.unexpectedByteChanges}
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={download} disabled={busy} className="px-3 py-2 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white flex items-center gap-1"><Download className="w-4 h-4"/>{busy?'Verifying bundle…':'Download controlled XY runtime bundle'}</button><span className="text-zinc-500">Runtime test: Kano heart-rip fatality; one component should visibly shift left during the brief three-part frame.</span></div>
    {error&&<div className="mt-2 text-red-300">{error}</div>}
    <div className="mt-3 rounded border border-amber-900 bg-amber-950/20 p-3"><span className="font-semibold text-amber-300">Scope boundary:</span> this proves an in-place semantic descriptor edit through the IR. It does not yet prove record growth, part insertion/removal, relocation or uGRA pixel encoding.</div>
  </section>;
}

import React, { useEffect, useRef, useState } from 'react';
import type { SourceGalleryVisual } from './stageGalleryVisualsP57';

/** Draw decoded local-memory RGBA only. No stock image, network URL or invented palette. */
export function StageThumbnailP57({ visual }: {visual:SourceGalleryVisual}) {
 const canvas=useRef<HTMLCanvasElement|null>(null);
 const [failure,setFailure]=useState<string|null>(null);
 useEffect(()=>{
  const a=visual.asset;
  try {
   if(!canvas.current || !a.rgba || !a.width || !a.height || a.rgba.length!==a.width*a.height*4)
    throw new Error('Source image geometry or pixels unavailable');
   const ctx=canvas.current.getContext('2d');
   if(!ctx)throw new Error('Canvas 2D unavailable');
   canvas.current.width=a.width;
   canvas.current.height=a.height;
   ctx.putImageData(new ImageData(new Uint8ClampedArray(a.rgba),a.width,a.height),0,0);
   setFailure(null);
  }catch(error){setFailure(error instanceof Error?error.message:String(error));}
 },[visual.asset]);
 return <div className="mw-source-thumbnail">
   {failure && <span className="mw-source-thumbnail-error" role="alert">Preview error: {failure}</span>}
   <canvas ref={canvas} className="mw-source-thumbnail-canvas" role="img"
     aria-label={`Original decoded source image: ${visual.title}; ${visual.evidence}`}/>
  </div>;
}

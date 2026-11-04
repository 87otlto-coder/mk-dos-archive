/** O122: exact indexed sprite commands for O121-qualified MK2 stage setup layers.
 * Renderer grammar from the original MK2.EXE (O68), palette records supported by
 * O119 gameplay for Tomb and Portal only. The outputs are conditional setup-local
 * layers; they are NOT final full-stage scenes, and do not identify live palette
 * handles, screen positions, draw order or camera RAM.
 */
import {paletteFromCanonicalMK2ExeO118} from './nativeStageFloorPaletteO118.ts';
import {O122_SETUP_ROWS,type O122Stage} from './stageIndexedPlacementsO122.ts';

const GRA_SHA:Record<O122Stage,string>={
 tomb:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
 portal:'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
};
const RENDERER_SIGNATURES:[number,string][]=[
 [0x3b600+0x2e90c,'8b06d1e8722ad1e8723e8d580380e3fc8d741e0483f840'],
 [0x3b600+0x2ee6c,'8bd081e2ff0000008b14958410000003d3c1e808'],
];
export const O122_QUALIFICATION='STATIC_AUTHENTICATED_INDEXED_SETUP_LAYER_NOT_FINAL_STAGE_COMPOSITION';
function req(value:boolean,message:string):asserts value {if(!value)throw new Error(`O122 mosaic: ${message}`)}
async function digest(b:Uint8Array) {
 const hash=await crypto.subtle.digest('SHA-256',b.slice().buffer);
 return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('');
}
function decode(data:Uint8Array,start:number,w:number,h:number) {
 req(Number.isInteger(start)&&start>=0&&start<data.length,'bad offset');
 req(w>0&&h>0&&w*h<=250000,'bad dimensions');
 const index=new Uint8Array(w*h),mask=new Uint8Array(w*h);let position=start,steps=0;
 const v=new DataView(data.buffer,data.byteOffset,data.byteLength);
 for(let row=0;row<h;row++){
  let x=0;
  while(x<w){
   req(position+4<=data.length,'truncated command');
   const cmd=v.getUint32(position,true);position+=4;
   let n:number;
   if(cmd&1){n=cmd>>>1;}
   else if(cmd&2){n=cmd>>>10;const paletteIndex=(cmd>>>2)&255;
    req(n>0&&n<=w-x,'RLE row overrun');
    index.fill(paletteIndex,row*w+x,row*w+x+n);mask.fill(1,row*w+x,row*w+x+n);
   }else{n=cmd>>>2;
    req(n>0&&n<=64&&n<=w-x&&position+n<=data.length,'literal row/file overrun');
    index.set(data.subarray(position,position+n),row*w+x);mask.fill(1,row*w+x,row*w+x+n);
    position+=(n+3)&~3;
   }
   req(n>0&&n<=w-x,'skip or color command crosses row');x+=n;
   req(++steps<250000,'excessive stream commands');
  }
 }
 return {index,mask,end:position};
}
export interface O122IndexedLayerPreview {
 stage:O122Stage; setupObject2Offset:number; width:number;height:number;
 rgba:Uint8Array;indices:Uint8Array;opacity:Uint8Array;
 descriptorCount:number;sourceSHA256:string;paletteSourceRecordPhysical:number;
 opaqueCanvasPixels:number;overdrawOpaquePixels:number;clippedOpaquePixels:number;qualification:typeof O122_QUALIFICATION;
}
export async function renderMK2IndexedSetupLayerO122(exe:Uint8Array,resource:Uint8Array,stage:O122Stage,setupOffset:number):Promise<O122IndexedLayerPreview>{
 req(stage==='tomb'||stage==='portal','only O119-authenticated stage palettes supported');
 req(await digest(resource)===GRA_SHA[stage],`not canonical ${stage.toUpperCase()}.GRA`);
 req(exe.length===861133,'wrong executable size');
 // A canonical executable hash is authenticated by the imported O118 function.
 const palette=await paletteFromCanonicalMK2ExeO118(exe,stage);
 for(const [off,hex] of RENDERER_SIGNATURES){
  const actual=Array.from(exe.subarray(off,off+hex.length/2),x=>x.toString(16).padStart(2,'0')).join('');
  req(actual===hex,'renderer grammar signature mismatch');
 }
 const record=O122_SETUP_ROWS[stage].find(x=>x.setupObject2Offset===setupOffset);
 req(Boolean(record),'unsupported setup offset');
 const setup=record!;const {width,height}=setup;
 req(width*height<=300000,'unbounded output');
 const rgba=new Uint8Array(width*height*4),indices=new Uint8Array(width*height),opacity=new Uint8Array(width*height);
 let overdraw=0,clipped=0;
 const decoded=new Map<string,ReturnType<typeof decode>>();
 for(const r of setup.placements){
  const key=`${r.offset}/${r.width}/${r.height}`;
  let sprite=decoded.get(key);if(!sprite){sprite=decode(resource,r.offset,r.width,r.height);decoded.set(key,sprite);}
  for(let j=0;j<sprite.index.length;j++){
   if(!sprite.mask[j])continue;
   const x=r.x+j%r.width,y=r.y+Math.floor(j/r.width);
   if(x<0||y<0||x>=width||y>=height){clipped++;continue;}
   const i=y*width+x,k=sprite.index[j],rgb=palette.get(k);
   req(Boolean(rgb),'sprite index not in O119 stage source palette');
   if(opacity[i])overdraw++;
   rgba[4*i]=rgb![0];rgba[4*i+1]=rgb![1];rgba[4*i+2]=rgb![2];rgba[4*i+3]=255;
   indices[i]=k;opacity[i]=1;
  }
 }
 return{stage,setupObject2Offset:setupOffset,width,height,rgba,indices,opacity,
  descriptorCount:setup.placements.length,sourceSHA256:GRA_SHA[stage],
  paletteSourceRecordPhysical:stage==='tomb'?0x893c6:0x891e0,
  opaqueCanvasPixels:opacity.reduce((a,v)=>a+v,0),overdrawOpaquePixels:overdraw,
  clippedOpaquePixels:clipped,qualification:O122_QUALIFICATION};
}

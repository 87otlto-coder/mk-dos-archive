/** O132: full 896-column packed floor source, NOT a camera-clipped frame.
 * Works only with the exact original MK2.EXE and original TOMB/PORTAL.GRA.
 * The matching palette is O119 runtime-source witnessed, but final stage
 * compositing, animated layers and parallax tracks are NOT recovered.
 */
import {paletteFromCanonicalMK2ExeO118} from './nativeStageFloorPaletteO118.ts';
import type {O122Stage} from './stageIndexedPlacementsO122.ts';
const GRA:Record<O122Stage,{sha:string;start:number;rows:number}>={
 tomb:{sha:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',start:63776,rows:48},
 portal:{sha:'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',start:56916,rows:40},
};
export const O132_NATIVE_SOURCE_QUALIFICATION='UNCROPPED_ORIGINAL_PACKED_STAGE_PLANE_NOT_FINAL_WIDESCREEN_SCENE_OR_ANIMATION';
async function sha(data:Uint8Array){const hash=await crypto.subtle.digest('SHA-256',data.slice().buffer);return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');}
function need(x:boolean,why:string):asserts x{if(!x)throw new Error('O132 full source floor: '+why);}
export async function renderMK2FullSourceFloorO132(exe:Uint8Array,gra:Uint8Array,stage:O122Stage){
 need(stage==='tomb'||stage==='portal','unsupported stage');
 const g=GRA[stage];need(gra.byteLength===g.start+g.rows*896,'unexpected full plane geometry');
 need(await sha(gra)===g.sha,'noncanonical stage resource');
 const palette=await paletteFromCanonicalMK2ExeO118(exe,stage);
 const indices=gra.slice(g.start),rgba=new Uint8Array(indices.length*4);
 for(let p=0;p<indices.length;p++){
  const rgb=palette.get(indices[p]);need(Boolean(rgb),'original source index not present in 80-color EXE palette');
  rgba[p*4]=rgb![0];rgba[p*4+1]=rgb![1];rgba[p*4+2]=rgb![2];rgba[p*4+3]=255;
 }
 return {stage,width:896,height:g.rows,indices,rgba,sourceSHA256:g.sha,palettePhysical:stage==='tomb'?0x893c6:0x891e0,
  cameraCropApplied:false,screenRowClippingApplied:false,animationRecovered:false,parallaxRecovered:false,
  qualification:O132_NATIVE_SOURCE_QUALIFICATION};
}

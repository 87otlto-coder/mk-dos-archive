/** O118: original EXE palette record bytes independently reproduce the O115
 * witnessed stage-floor RGB for Tomb and Portal. Static record identity only;
 * does NOT establish live handle, bank, allocation or camera state.
 * Requires user-supplied unmodified DOS MK2.EXE, not bundled assets.
 */
import type { MK2ObservedStage } from './observedStageFloorPreviewO116';
export const O118_QUALIFICATION='STATIC_EXE_COUNTED_PALETTE_RECORD_SCREENSHOT_RGB_MATCH_NOT_LIVE_RUNTIME_HANDLE';
const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const RECORDS={tomb:0x893c6,portal:0x891e0} as const;
const GRA_SHA={tomb:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',portal:'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'} as const;
function requireValid(b:boolean,reason:string):asserts b{if(!b)throw new Error(`O118 palette: ${reason}`);}
export async function paletteFromCanonicalMK2ExeO118(exe:Uint8Array,stage:MK2ObservedStage):Promise<ReadonlyMap<number,readonly [number,number,number]>>{
 requireValid(stage==='tomb'||stage==='portal','unsupported stage');
 requireValid(exe.length===861133,'original executable has wrong length');
 const digest=await crypto.subtle.digest('SHA-256',exe.slice().buffer);
 const hex=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 requireValid(hex===EXE_SHA,'EXE hash is not the canonical DOS MK2 executable');
 const offset=RECORDS[stage];requireValid(exe[offset]===80&&exe[offset+1]===0,'counted 80-color record header changed');
 const colors=new Map<number,readonly [number,number,number]>();
 for(let i=0;i<80;i++){
  const w=exe[offset+2+i*2] | (exe[offset+3+i*2]<<8);
  const d=[((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1];
  colors.set(i+1,[((d[0]<<2)|(d[0]>>4)),((d[1]<<2)|(d[1]>>4)),((d[2]<<2)|(d[2]>>4))]);
 }
 return colors;
}
export async function verifyO118PreviewAgainstExe(exe:Uint8Array,stage:MK2ObservedStage,gra:Uint8Array,
       sourceLeft:number,firstRow:number,rgba:Uint8Array):Promise<{matched:number;total:number;recordPhysical:number;qualification:string}>{
 const colors=await paletteFromCanonicalMK2ExeO118(exe,stage);
 const geometry=stage==='tomb'?{start:63776,rows:48}:{start:56916,rows:40};
 requireValid(Number.isInteger(sourceLeft)&&sourceLeft>=0&&sourceLeft<=576,'invalid source crop');
 requireValid(Number.isInteger(firstRow)&&firstRow>=0&&firstRow<geometry.rows,'invalid first row');
 const height=rgba.length/(320*4);
 requireValid(Number.isInteger(height)&&height>=1&&firstRow+height<=geometry.rows,'invalid RGBA geometry');
 requireValid(gra.length===geometry.start+geometry.rows*896,'GRA file length mismatch');
 const originalDigest=await crypto.subtle.digest('SHA-256',gra.slice().buffer);
 requireValid(Array.from(new Uint8Array(originalDigest),x=>x.toString(16).padStart(2,'0')).join('')===GRA_SHA[stage],'GRA SHA-256 is not canonical');
 let matched=0;
 for(let y=0;y<height;y++)for(let x=0;x<320;x++){
  const index=gra[geometry.start+(firstRow+y)*896+sourceLeft+x];const color=colors.get(index);
  requireValid(Boolean(color),`source palette has no index ${index}`);
  const at=(y*320+x)*4;
  if(rgba[at]===color![0]&&rgba[at+1]===color![1]&&rgba[at+2]===color![2]&&rgba[at+3]===255)matched++;
 }
 requireValid(matched===320*height,`O116 screenshot witness disagrees with original EXE colors at ${320*height-matched} pixels`);
 return {matched,total:320*height,recordPhysical:RECORDS[stage],qualification:O118_QUALIFICATION};
}

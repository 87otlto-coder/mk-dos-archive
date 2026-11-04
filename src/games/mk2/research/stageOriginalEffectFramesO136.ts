/** O136 + O176: source-backed, ordered ORIGINAL sprite frames, no invented playback clock.
 * Reads user-supplied MK2.EXE + original stage GRA. Tower palette is source-linked
 * only, NOT runtime-selected/DAC-verified, and is labeled accordingly.
 */
import {paletteFromCanonicalMK2ExeO118} from './nativeStageFloorPaletteO118.ts';
export type StageO136='tomb'|'portal'|'tower';
export const O136_EVIDENCE='ORIGINAL_ORDERED_SPRITE_FRAMES_PLAYBACK_TIMING_UNOBSERVED';
const GRA_HASH:Record<StageO136,string>={
 tomb:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
 portal:'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',
 tower:'7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'
};
const OBJ2=0xa0c54;
const DEFINITIONS={
 tomb_flying_a:{stage:'tomb',base:0x17814,count:8,end:1,writer:0x82d51},
 tomb_flying_b:{stage:'tomb',base:0x177ec,count:8,end:1,writer:0x82db3},
 portal_swaying:{stage:'portal',base:0x164b4,count:7,end:1,writer:0x82746},
 portal_hanging:{stage:'portal',base:0x164d8,count:7,end:0,writer:0x828ff},
 portal_electric:{stage:'portal',base:0x164f8,count:6,end:0,writer:0x82994},
 tower_original_effect:{stage:'tower',base:0x16490,count:7,end:1,writer:0x82e6c}
} as const;
function req(ok:boolean,msg:string):asserts ok {if(!ok)throw new Error('O136 sprite frames: '+msg)}
function sha(data:Uint8Array):Promise<string> {return crypto.subtle.digest('SHA-256',data.slice().buffer).then(v=>Array.from(new Uint8Array(v),x=>x.toString(16).padStart(2,'0')).join(''))}
function decode(raw:Uint8Array,off:number,w:number,h:number){
 req(w>0&&h>0&&w*h<=4096&&off>=0&&off<raw.length,'dimensions/offset');
 const ix=new Uint8Array(w*h),mask=new Uint8Array(w*h);const v=new DataView(raw.buffer,raw.byteOffset,raw.byteLength);let at=off;
 for(let y=0;y<h;y++){
  let x=0;
  while(x<w){
   req(at+4<=raw.length,'truncated GRA command');const cmd=v.getUint32(at,true);at+=4;
   let n:number;
   if(cmd&1)n=cmd>>>1;
   else if(cmd&2){n=cmd>>>10;ix.fill((cmd>>>2)&255,y*w+x,y*w+x+n);mask.fill(1,y*w+x,y*w+x+n);}
   else {n=cmd>>>2;req(n>0&&n<=64&&at+n<=raw.length,'bad literal');ix.set(raw.subarray(at,at+n),y*w+x);mask.fill(1,y*w+x,y*w+x+n);at+=(n+3)&~3;}
   req(n>0&&n<=w-x,'row overflow');x+=n;
  }
 }
 return {indices:ix,mask,end:at};
}
export interface O136EffectFrame {ordinal:number;width:number;height:number;sourceX:number;sourceY:number;
 graStart:number;graEnd:number;descriptorObject2:number;indices:Uint8Array;mask:Uint8Array;rgba:Uint8Array;}
export interface O136EffectTrack {name:string;stage:StageO136;sourcePointerObject2:number;
 controlType:'ONE_MARKER_BACK_REFERENCE'|'ZERO_TERMINATED';frames:O136EffectFrame[];
 animationFPSKnown:false;runtimeActivationKnown:false;worldCoordinatesKnown:false;
 paletteQualifiedByRuntime:false;paletteIsSourceLinkedCandidate:boolean;}
/** O176 Tower extension: source-associated 80-color candidate, NEVER gameplay/DAC-verified. */
async function towerSourcePaletteO176(exe:Uint8Array):Promise<ReadonlyMap<number,readonly [number,number,number]>>{
 req(exe.length===861133&&await sha(exe)==='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','not canonical Tower EXE');
 const v=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),u32=(n:number)=>v.getUint32(n,true);
 req(Array.from(exe.subarray(0x82e38,0x82e3f)).join(',')==='131,61,76,1,3,0,0','Tower mode-0 gate');
 req(Array.from(exe.subarray(0x82e54,0x82e5b)).join(',')==='131,61,76,1,3,0,1','Tower mode-1 gate');
 req(v.getUint16(0x89468,true)===80,'Tower counted 80-color record');
 req(v.getUint16(OBJ2+0x1795c,true)===0x407&&v.getUint16(OBJ2+0x1795e,true)===0x40&&v.getUint16(OBJ2+0x17960,true)===2,'Tower setup source identity');
 req(u32(OBJ2+0x1795c+0xe)===0x17a18,'Tower setup palette pointer table');
 for(let i=0;i<7;i++)req(u32(OBJ2+0x17a18+i*4)===0x89468-0x61c54,'Tower source palette record pointer');
 const colors=new Map<number,readonly [number,number,number]>();
 for(let i=0;i<80;i++){
  const w=v.getUint16(0x89468+2+i*2,true);
  const dac=[((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1];
  colors.set(i+1,[((dac[0]<<2)|(dac[0]>>4)),((dac[1]<<2)|(dac[1]>>4)),((dac[2]<<2)|(dac[2]>>4))]);
 }
 return colors;
}
export async function readMK2OriginalEffectFramesO136(exe:Uint8Array,gra:Uint8Array,stage:StageO136):Promise<O136EffectTrack[]>{
 req(stage==='tomb'||stage==='portal'||stage==='tower','unsupported stage');
 req(exe.length===861133,'incorrect original EXE size');
 const palette=stage==='tower'?await towerSourcePaletteO176(exe):await paletteFromCanonicalMK2ExeO118(exe,stage);
 req(await sha(gra)===GRA_HASH[stage],'not the original stage GRA');
 const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),u32=(p:number)=>view.getUint32(p,true);
 const tracks:O136EffectTrack[]=[];
 for(const [name,def] of Object.entries(DEFINITIONS)){
  if(def.stage!==stage)continue;
  const portalNested=name==='portal_swaying',tower=name==='tower_original_effect';
  req(Array.from(exe.subarray(def.writer,def.writer+6)).join(',')===
      (portalNested||tower?'199,5,108,90,7,0':'199,5,120,90,7,0'),'writer instruction not authenticated');
  if(portalNested){
   req(Array.from(exe.subarray(0x82764,0x8276a)).join(',')==='199,5,108,90,7,0' && u32(0x8276a)===def.base,'second nested pointer writer');
   req(Array.from(exe.subarray(0x8280c,0x82817)).join(',')==='139,86,84,139,70,92,163,120,90,7,0','source pointer transfer');
  }
  req(u32(def.writer+6)===def.base,'source list writer mismatch');
  req(u32(OBJ2+def.base+4*def.count)===def.end,'unexpected sequence terminal');
  if(def.end===1)req(u32(OBJ2+def.base+4*def.count+4)===def.base,'loop pointer mismatch');
  let previous:number|undefined;const frames:O136EffectFrame[]=[];
  for(let i=0;i<def.count;i++){
   const off=u32(OBJ2+def.base+4*i),at=OBJ2+off;
   req(at+12<=exe.length,'descriptor outside EXE');
   const w=view.getUint16(at,true),h=view.getUint16(at+2,true);
   const x=view.getInt16(at+4,true),y=view.getInt16(at+6,true);
   const packed=u32(at+8),resourceId=packed>>>24,start=packed&0xffffff;
   req(resourceId===(stage==='tomb'?28:stage==='portal'?25:30),'cross-resource descriptor');
   const item=decode(gra,start,w,h);req(previous===undefined||previous===start,'stream gap');previous=item.end;
   const rgba=new Uint8Array(w*h*4);
   for(let p=0;p<w*h;p++)if(item.mask[p]){
    const rgb=palette.get(item.indices[p]);req(Boolean(rgb),'unresolved original palette index');
    rgba.set([rgb![0],rgb![1],rgb![2],255],p*4);
   }
   frames.push({ordinal:i,width:w,height:h,sourceX:x,sourceY:y,graStart:start,graEnd:item.end,descriptorObject2:off,
     indices:item.indices,mask:item.mask,rgba});
  }
  tracks.push({name,stage,sourcePointerObject2:def.base,
   controlType:def.end===1?'ONE_MARKER_BACK_REFERENCE':'ZERO_TERMINATED',
   frames,animationFPSKnown:false,runtimeActivationKnown:false,worldCoordinatesKnown:false,
   paletteQualifiedByRuntime:false,paletteIsSourceLinkedCandidate:stage==='tower'});
 }
 return tracks;
}

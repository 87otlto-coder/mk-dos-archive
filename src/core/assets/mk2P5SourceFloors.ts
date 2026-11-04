/** P5 — exact native 896-column indexed floors for four original MK2 resources.
 * No runtime palette, camera, layer order, or timing claim is made here.
 * Original executable/resource identity is mandatory; no commercial data bundled.
 */
import type { DirectorySource } from '../filesystem/DirectorySource';
import type { Asset } from './model';

const EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const TABLE_OFFSET = 0xCFBAC;
const STRIDE = 896;
const FLOOR_SPECS = [
  {stage:'battle',name:'battle.gra',resourceId:34,tableSlot:1,offset:59436,rows:40,sha:'ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63'},
  {stage:'tower',name:'tower.gra',resourceId:30,tableSlot:2,offset:56268,rows:64,sha:'7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'},
  {stage:'armory',name:'armory.gra',resourceId:26,tableSlot:4,offset:126336,rows:56,sha:'fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612'},
  {stage:'arena',name:'arena.gra',resourceId:31,tableSlot:7,offset:90488,rows:40,sha:'37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb'},
] as const;
export const P5_MK2_SOURCE_FLOOR_LIMITATION='Exact source index plane; grayscale shows numeric indices, NOT original gameplay colors. Runtime palette/position/camera/animation unverified.';
async function digest(bytes:Uint8Array):Promise<string>{
 const value=await crypto.subtle.digest('SHA-256',bytes.slice().buffer);
 return Array.from(new Uint8Array(value),x=>x.toString(16).padStart(2,'0')).join('');
}
function preview(index:Uint8Array):Uint8Array{
 const rgba=new Uint8Array(index.length*4);
 for(let i=0;i<index.length;i++){
   rgba[i*4]=index[i];rgba[i*4+1]=index[i];rgba[i*4+2]=index[i];rgba[i*4+3]=255;
 }
 return rgba;
}
export async function buildMK2P5SourceFloorAssets(source:DirectorySource):Promise<{
 assets:Asset[];stageResults:Array<{stage:string;status:'VERIFIED'|'UNAVAILABLE';reason?:string;planeSha256?:string}>;
}>{
 const entries=await source.listRecursive();
 const exeCandidates=entries.filter(e=>e.name.toLowerCase()==='mk2.exe');
 if(exeCandidates.length!==1)throw Error('P5 requires exactly one MK2.EXE');
 const exe=await source.readSlice(exeCandidates[0].path,0,exeCandidates[0].size);
 if(exe.length!==861133||await digest(exe)!==EXE_SHA)throw Error('P5 requires canonical MK2.EXE');
 const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const assets:Asset[]=[],stageResults:Array<{stage:string;status:'VERIFIED'|'UNAVAILABLE';reason?:string;planeSha256?:string}>=[];
 for(const spec of FLOOR_SPECS){
  try{
   const pointers=(spec.resourceId<<24|spec.offset)>>>0;
   if(view.getUint32(TABLE_OFFSET+spec.tableSlot*4,true)!==pointers)throw Error('EXE resource pointer mismatch');
   const found=entries.filter(e=>e.name.toLowerCase()===spec.name);
   if(found.length!==1)throw Error(`expected exactly one ${spec.name}, got ${found.length}`);
   const e=found[0];
   if(e.size!==spec.offset+STRIDE*spec.rows)throw Error('resource size/geometry mismatch');
   const whole=await source.readSlice(e.path,0,e.size);
   if(whole.length!==e.size||await digest(whole)!==spec.sha)throw Error('canonical GRA SHA-256 mismatch');
   const plane=whole.slice(spec.offset),planeSha256=await digest(plane),group=`MK2 ${spec.stage} · original source floor`;
   const sourceRef={path:e.path,offset:spec.offset,length:plane.length,sha256:spec.sha};
   const metadata={stage:spec.stage,resourceId:spec.resourceId,sourceWidth:STRIDE,sourceRows:spec.rows,
    originalPackedOffset:spec.offset,planeSha256,sourceFormat:'index8',nativeUncropped:true,
    originalPaletteKnown:false,runtimeCameraKnown:false,runtimeLayerOrderKnown:false,
    qualifiedBy:'O111/O131 source pointer, original canonical EXE/GRA SHA-256',limitations:P5_MK2_SOURCE_FLOOR_LIMITATION};
   assets.push({id:`mk2-floor:${spec.stage}:indices-preview`,name:`${spec.stage} original index-value preview`,group,kind:'stage',format:'PNG index-value preview',confidence:'Source-exact indices; colors UNKNOWN',source:sourceRef,metadata:{...metadata,indices:plane},width:STRIDE,height:spec.rows,rgba:preview(plane),filename:`MK2_${spec.stage}_${STRIDE}x${spec.rows}_indices_preview.png`});
   assets.push({id:`mk2-floor:${spec.stage}:indices`,name:`${spec.stage} original indexed floor`,group,kind:'raw',format:'Original indexed bytes',confidence:'Original 8-bit index plane, SHA-256 verified',source:sourceRef,metadata:{...metadata},bytes:plane,mime:'application/octet-stream',filename:`MK2_${spec.stage}_${STRIDE}x${spec.rows}_original_indices.bin`});
   stageResults.push({stage:spec.stage,status:'VERIFIED',planeSha256});
  }catch(error){stageResults.push({stage:spec.stage,status:'UNAVAILABLE',reason:error instanceof Error?error.message:String(error)});}
 }
 return {assets,stageResults};
}

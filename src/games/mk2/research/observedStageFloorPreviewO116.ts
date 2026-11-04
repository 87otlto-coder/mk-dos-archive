/** O116: runtime-witnessed PACKED FLOOR ONLY. Never label as native VGA or full stage.
 * RGB entries are copied exactly from O115 original user-supplied screenshot analyses.
 * Original GRA files are supplied through a user-loaded DirectorySource; not distributed.
 */
import type { DirectorySource } from '../../../core/filesystem/DirectorySource';
export type MK2ObservedStage = 'tomb' | 'portal';
export const O116_FLOOR_QUALIFICATION='O115_CONDITIONAL_SCREENSHOT_RGB_NOT_LIVE_MK2_PALETTE_OR_FULL_STAGE';
export interface MK2ObservedFloorPreview {
 stage:MK2ObservedStage; label:string; width:320; height:number;
 rgba:Uint8Array; sourceIndexRange:[number,number]; sourceLeft:number;
 resourceSHA256:string; originalWitnessScreenshotSHA256:string; provenance:string;
}
interface StageSpec { file:string; sha256:string; offset:number; rows:number; minIndex:number; maxIndex:number; suggestedLeft:number; witnessSha256:string; label:string; colorsHex:string; }
const SPECS:Record<MK2ObservedStage,StageSpec>={
  tomb:{file:'TOMB.GRA',sha256:'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',offset:63776,rows:48,minIndex:2,maxIndex:51,suggestedLeft:290,witnessSha256:'30e1b00ba361e40a791dffd3d10abdbc2cf77402cacee78f6d07676ae0b83791',label:'Kombat Tomb',colorsHex:[
    '5d240c55340c65340c3c24044d2c04553404653c04340c043c140c4d241c5d2c1c6d3c347d4d3c',
    '8655348e5d459665459e6d4dae7555be865dbe8e75cf967ddfa67d5d453c755d5d86756da68e86',
    '75452c553424ae7d6d2c04043c04043c14044d1c0c5524145d2c245d342c6d453c7d554d965d4d',
    '8e65559e6d5da6756dbe8e75cf9e8edfa69edfaea6e7beb61c04042c0404340c0c',
  ].join('')},
  portal:{file:'PORTAL.GRA',sha256:'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82',offset:56916,rows:40,minIndex:3,maxIndex:80,suggestedLeft:292,witnessSha256:'fbce84f4c85fc608241148bafed9baac76c78bc394736ebecce8926b6648f9ed',label:'The Portal',colorsHex:[
    '240404340404450c044d140c5d140c5514045d140c6d1404651c0c7d1c0c86240c96240c9e2c0c',
    'a62c14ae2c0cc73c0cd74514df450cdf4d14e74d0cef550cef5d1cf76514f76d1cff6d14ef4d14',
    'e74514df340cd73c0cd72c0ccf340cc72c0cb6240cae1c0ca61c049e140c8e14047d0c04753414',
    '8e341c7d4514964d1cae5d1cb6651cb66d24cf7524df8e2cef962cffae34ffcf550c041414041c',
    '2c042c3c0c3445143c4d1c4555244d652c556534556d3c65045def96beff2c140c3c1c1445241c',
    '552c24653c347d4d3c7d55458e6555966565754d45865d4d96654d9e6d55553414553c1c654524',
  ].join('')},
};
function requireValid(ok:boolean,msg:string):asserts ok { if(!ok) throw new Error('O116 MK2 floor: '+msg); }
async function sha256(bytes:Uint8Array):Promise<string>{
 const input=bytes.slice().buffer;
 const digest=await globalThis.crypto.subtle.digest('SHA-256',input);
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
}
export function allowedObservedFloorStages():readonly MK2ObservedStage[]{return ['tomb','portal'];}
/** Does not need screenshot color report at browser runtime: the 128 measured colors are pinned above. */
export async function renderMK2ObservedStageFloorO116(
 stage:MK2ObservedStage,gra:Uint8Array,sourceLeft?:number,firstRow=0,height?:number
):Promise<MK2ObservedFloorPreview>{
 const spec=SPECS[stage];requireValid(Boolean(spec),'only Tomb and Portal have screenshot-verified floor colors');
 requireValid(gra.byteLength===spec.offset+spec.rows*896,'resource byte geometry mismatch');
 const digest=await sha256(gra);requireValid(digest===spec.sha256,'noncanonical GRA source (patched files require the Python receipt-verified preview path)');
 const left=sourceLeft===undefined?spec.suggestedLeft:sourceLeft;
 requireValid(Number.isInteger(left)&&left>=0&&left<=576,'source-left must be 0..576');
 requireValid(Number.isInteger(firstRow)&&firstRow>=0&&firstRow<spec.rows,'first-row invalid');
 const n=height===undefined?spec.rows-firstRow:height;
 requireValid(Number.isInteger(n)&&n>0&&firstRow+n<=spec.rows,'source height invalid');
 const colors:Uint8Array[]=[];
 for(let i=spec.minIndex;i<=spec.maxIndex;i++){
  const rgb=spec.colorsHex.slice((i-spec.minIndex)*6,(i-spec.minIndex+1)*6);
  requireValid(rgb.length===6,'embedded color evidence incomplete');
  colors[i]=Uint8Array.from([0,2,4].map(k=>Number.parseInt(rgb.slice(k,k+2),16)));
 }
 const rgba=new Uint8Array(320*n*4);
 for(let y=0;y<n;y++){
  for(let x=0;x<320;x++){
   const index=gra[spec.offset+(firstRow+y)*896+left+x],color=colors[index];
   requireValid(Boolean(color),`source index ${index} lacks a runtime color witness`);
   const out=(y*320+x)*4;
   rgba[out]=color[0];rgba[out+1]=color[1];rgba[out+2]=color[2];rgba[out+3]=255;
  }
 }
 return {stage,label:spec.label,width:320,height:n,rgba,sourceIndexRange:[spec.minIndex,spec.maxIndex],sourceLeft:left,
  resourceSHA256:digest,originalWitnessScreenshotSHA256:spec.witnessSha256,provenance:O116_FLOOR_QUALIFICATION};
}
/** Browser integration: locate exactly one original resource in the user's selected MK2 folder. */
export async function previewMK2ObservedFloorFromDirectoryO116(source:DirectorySource,stage:MK2ObservedStage):Promise<MK2ObservedFloorPreview>{
 requireValid(!source.isSynthetic,'requires original user-loaded MK2 directory');
 const spec=SPECS[stage];requireValid(Boolean(spec),'unsupported stage');
 const entries=(await source.listRecursive()).filter(e=>e.name.toUpperCase()===spec.file);
 requireValid(entries.length===1,'expected exactly one '+spec.file+' in chosen game directory');
 const entry=entries[0];requireValid(entry.size===spec.offset+spec.rows*896,'GRA byte length mismatch');
 const bytes=await source.readSlice(entry.path,0,entry.size);
 requireValid(bytes.length===entry.size,'incomplete GRA read');
 return renderMK2ObservedStageFloorO116(stage,bytes);
}

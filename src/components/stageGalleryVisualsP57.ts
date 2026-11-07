/** P57: source-backed stage-gallery thumbnails.
 * Never infer stage names, stage membership, final composite scenes or runtime palettes.
 * Only use decoded in-memory RGBA from the current original-game scan.
 */
import type { Asset, Game } from '../core/assets/model';
import { verifiedMK1HeaderPreviewLinks } from './stageGalleryModel';

export type SourceGalleryVisual = {
  asset: Asset;
  title: string;
  evidence: string;
};
export type GalleryVisualsP57 = {
  mk1ByHeader: Map<string, SourceGalleryVisual[]>;
  mk2ByResource: Map<string, SourceGalleryVisual>;
  mk3UnassignedPictures: SourceGalleryVisual[];
  errors: string[];
};
const pathBase = (name: string) => name.replace(/\\/g,'/').split('/').pop()?.toUpperCase() ?? '';
const digest = (s:unknown) => typeof s==='string' && /^[a-f0-9]{64}$/i.test(s);
function imageOK(a:Asset):boolean {
 return a.width!==undefined && Number.isSafeInteger(a.width) && a.width>0 &&
  a.height!==undefined && Number.isSafeInteger(a.height) && a.height>0 &&
  a.rgba instanceof Uint8Array && a.rgba.length===a.width*a.height*4;
}
function mk2Preference(a:Asset):number {
 // Prefer a 320x200 original setup plane over a narrow floor or an isolated tile.
 const viewport = a.width===320 && a.height===200 ? 0 : 1;
 const setup = a.id.startsWith('mk2-stage-setup:') ? 0 : 1;
 const area = (a.width??0)*(a.height??0);
 return viewport*1e10 + setup*1e9 - area;
}
export function buildGalleryVisualsP57(game:Game,assets:readonly Asset[],stageBindings:unknown):GalleryVisualsP57 {
 const result:GalleryVisualsP57={mk1ByHeader:new Map(),mk2ByResource:new Map(),mk3UnassignedPictures:[],errors:[]};
 const byID=new Map<string,Asset>();
 const duplicateIDs=new Set<string>();
 for(const asset of assets){
  if(byID.has(asset.id))duplicateIDs.add(asset.id);
  else byID.set(asset.id,asset);
 }
 if(game==='mk1'){
  const links=verifiedMK1HeaderPreviewLinks(stageBindings);
  for(const [header,modules] of links){
   const found:SourceGalleryVisual[]=[];
   let complete=true;
   for(const m of modules){
    const a=byID.get(m.assetId);
    if(!a || duplicateIDs.has(m.assetId) || a.kind!=='stage' || !imageOK(a)){
     result.errors.push('P57: invalid or missing qualified MK1 preview '+m.assetId);
     complete=false;break;
    }
    found.push({asset:a,title:m.moduleSymbol,
     evidence:'O27/O54 source module; normalized image, NOT a verified gameplay screenshot'});
   }
   if(complete && found.length)result.mk1ByHeader.set(header,found);
  }
 }else if(game==='mk2'){
  const grouped=new Map<string,Asset[]>();
  for(const a of assets){
   if(a.kind!=='stage'||!a.source?.path || !/\.GRA$/i.test(a.source.path))continue;
   // An undecoded or unqualified source candidate is not a broken decoded image.
   // Retain the visible no-thumbnail state instead of interpreting missing evidence as a fault.
   if(!digest(a.source.sha256))continue;
   if(duplicateIDs.has(a.id)){
    result.errors.push('P57: duplicate qualified MK2 stage-layer identifier '+a.id);
    continue;
   }
   if(!imageOK(a)){
    result.errors.push('P57: invalid original MK2 stage-layer preview '+a.id);
    continue;
   }
   const name=pathBase(a.source.path);
   const group=grouped.get(name)??[];group.push(a);grouped.set(name,group);
  }
  for(const [name,group] of grouped){
   const sorted=[...group].sort((a,b)=>mk2Preference(a)-mk2Preference(b)||a.id.localeCompare(b.id));
   const first=sorted[0];
   result.mk2ByResource.set(name,{asset:first,title:first.name,
    evidence:'Original source image/layer; native scene assembly and runtime palette NOT asserted'});
  }
 }else if(game==='mk3'){
  for(const a of assets){
   if(a.kind!=='image'||pathBase(a.source?.path??'')!=='DATA.MK3')continue;
   if(a.metadata.sourceImageOnly!==true||a.metadata.paletteFormat!=='IFF_CMAP_RGB8'||
    a.metadata.paletteRuntimeOwnershipKnown!==false||!digest(a.source.sha256)||
    a.id!==`${a.source.path}@${a.source.offset}`||duplicateIDs.has(a.id)||!imageOK(a)){
    result.errors.push('P57: invalid original MK3 IFF image evidence '+a.id);
    continue;
   }
   result.mk3UnassignedPictures.push({asset:a,title:`IFF @${a.source.offset.toString(16).toUpperCase()}`,
    evidence:'Original DATA.MK3 IFF + embedded CMAP; stage assignment UNKNOWN'});
  }
  result.mk3UnassignedPictures.sort((a,b)=>a.asset.source.offset-b.asset.source.offset);
 }
 return result;
}

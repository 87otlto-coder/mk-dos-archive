/** P30: O110A's original FOREST.GRA eight-byte descriptor family.
 * Native indices/opacity and source geometry only. No inferred RGB, stage
 * ownership, world placement, animation order or timing. Existing floor paths are preserved.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';
import {decodeMK2NativeIndexedRows} from './mk2NativeIndexedRows';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9';
const OBJECT2=0xa0c54,TABLE=0x16d8c,COUNT=49,PREFIX=0;
export const MK2_P30_FOREST_LIMITATION=
 'P30 FOREST.GRA: 49 standalone original components; 43 occur in existing P7 layers, six are unlinked to those setups, with exact native dimensions and transparency. '+
 'Grayscale shows source index values, NOT original runtime colors. Descriptor table order is NOT verified animation order. '+
 'Palette ownership, stage identity, scene placement, timing and full composition remain UNKNOWN. '+
 'The remaining 62036 source bytes lie outside this image family; existing original floors remain available.';
type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;newlyDiscoveredSourceImages?:number;existingSetupLayers?:number;sourceControlPlacements?:number;
 sourceImagePrefix?:{start:number;endExclusive:number;encodedBytes:number};};
export interface P30ForestResult{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('P30 FOREST.GRA: '+reason);}
function only(files:SourceFileEntry[],name:string){const matches=files.filter(f=>f.name.toLowerCase()===name);
 need(matches.length===1,`exactly one ${name} required`);return matches[0];}
export async function buildMK2ForestSourceP30(source:DirectorySource):Promise<P30ForestResult>{
 try{
  need(!source.isSynthetic,'synthetic fixture is not an authenticated source');
  const files=await source.listRecursive(),e=only(files,'mk2.exe'),g=only(files,'forest.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(exe.length===861133&&e.size===exe.length&&await hash(exe)===EXE_SHA,'original EXE hash/size mismatch');
  need(gra.length===226788&&g.size===gra.length&&await hash(gra)===GRA_SHA,'original GRA hash/size mismatch');
  need(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1,0xa13a7)).split('\0')[27]==='FOREST.GRA','resource slot 27');
  const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),assets:Asset[]=[];
  const setups=[0x16f8c,0x16f9e,0x16fb0,0x16fc2,0x16fd4].map((setupObject2Offset,i)=>{
   const at=OBJECT2+setupObject2Offset,width=view.getUint16(at,true),height=view.getUint16(at+2,true);
   const count=view.getUint16(at+4,true),control=view.getUint32(at+6,true);
   need(view.getUint32(at+10,true)===TABLE&&view.getUint32(at+14,true)===0x171d0,'original Forest setup tables');
   const placements=Array.from({length:count},(_,j)=>{
    const p=OBJECT2+control+8*j,flags=view.getUint16(p,true),pair=view.getUint16(p+6,true);
    need(((flags&15)|((pair&0xf000)>>>8))===2&&((pair&0xfff)*4)%8===0,'qualified source control');
    const ordinal=((pair&0xfff)*4)/8;need(ordinal<COUNT,'source descriptor ordinal');
    return {ordinal,x:view.getInt16(p+2,true),y:view.getInt16(p+4,true)};
   });
   return {setupObject2Offset,width,height,placements,assetId:`mk2-forest-setup:${i+1}:indices-preview`};
  });
  need(setups.reduce((n,s)=>n+s.placements.length,0)===60,'60 original placements');
  let previous=PREFIX;
  for(let ordinal=0;ordinal<COUNT;ordinal++){
   const descriptorPhysical=OBJECT2+TABLE+ordinal*8,width=view.getUint16(descriptorPhysical,true),height=view.getUint16(descriptorPhysical+2,true);
   const packed=view.getUint32(descriptorPhysical+4,true),start=packed&0xffffff;
   need((packed>>>24)===27&&start===previous,'original descriptor resource/contiguous extent');
   const decoded=decodeMK2NativeIndexedRows(gra,start,width,height);previous=decoded.end;
   const sourceSetupUses=setups.flatMap(setup=>{
    const uses=setup.placements.filter(p=>p.ordinal===ordinal);
    return uses.length?[{assetId:setup.assetId,setupObject2Offset:setup.setupObject2Offset,occurrences:uses.length,
     clippedPlacements:uses.filter(p=>p.x<0||p.y<0||p.x+width>setup.width||p.y+height>setup.height).length}]:[];
   });
   assets.push({id:`mk2-forest-source:${ordinal}:original-indices`,name:`FOREST.GRA original setup component ${String(ordinal).padStart(2,'0')}`,
    group:'MK2 FOREST.GRA original setup components (scene unknown)',kind:'sprite',format:'PNG diagnostic index-value preview',
    confidence:'O110A source descriptor and native indices VERIFIED; runtime RGB UNKNOWN',
    source:{path:g.path,offset:start,length:decoded.end-start,sha256:GRA_SHA},
    metadata:{sourceDescriptorPhysical:descriptorPhysical,sourceDescriptorObject2:TABLE+ordinal*8,sourceDescriptorOrdinal:ordinal,
     sourceDescriptorStride:8,sourceResourceId:27,sourceEncodedEndExclusive:decoded.end,
     sourceSetupUses,componentPreviouslyUsedInMosaics:sourceSetupUses.length>0,newlyDiscoveredSourceImage:false,standaloneOriginalAccessNew:true,
     setupRelationshipsAreRuntimePlacement:false,sourceExeSha256:EXE_SHA,sourceOutsideImageFamilyBytes:62036,diagnosticPreview:true,
     diagnosticFormula:'RGB=(index,index,index); alpha=255*source opacity',
     runtimePaletteKnown:false,stageOwnershipKnown:false,nativeTimingKnown:false,fullStageScene:false,
     worldPlacementKnown:false,sourceTableOrderIsAnimation:false,provenance:'O110A original 8-byte descriptors; independent P30 original-file parity',
     indices:decoded.indices,mask:decoded.mask,paletteKnownMask:new Uint8Array(width*height)},
    width,height,rgba:decoded.rgba,filename:`MK2_FOREST_original_${String(ordinal).padStart(2,'0')}_INDEX_VALUE_PREVIEW.png`});
  }
  need(assets.filter(a=>(a.metadata.sourceSetupUses as unknown[]).length>0).length===43,'43 components join P7 layers');
  need(previous===164752,'49 native streams must exactly cover the qualified prefix');
  return {assets,packages:[{name:'MK2_P30_FOREST_49_ORIGINAL_COMPONENTS.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:assets.length,newlyDiscoveredSourceImages:0,existingSetupLayers:5,sourceControlPlacements:60,sourceImagePrefix:{start:PREFIX,endExclusive:164752,encodedBytes:164752}}};
 }catch(e){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:e instanceof Error?e.message:String(e)}};}
}

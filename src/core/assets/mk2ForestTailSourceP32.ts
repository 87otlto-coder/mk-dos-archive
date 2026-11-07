/** P32: original twelve-byte FOREST descriptors for the previously unexposed interval.
 * Native indexed data only; descriptor anchors/order do not establish runtime placement/timing.
 */
import type {DirectorySource,SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';
import {decodeMK2NativeIndexedRows} from './mk2NativeIndexedRows';
const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9';
const BASE=0xa0c54,DESCRIPTORS=[0x16f14,0x16f24,0x16f30,0x16f3c,0x16f48,0x16f54,0x16f60,0x16f6c,0x16f7c];
export const MK2_P32_FOREST_TAIL_LIMITATION=
 'P32 FOREST.GRA: nine additional native indexed originals cover bytes [164752,198116). '+
 'Grayscale displays numeric source indices, NOT original runtime colors. '+
 'These descriptors have no link to the five P7 setups. Roles, activation, native palette, timing and world placement remain UNKNOWN. '+
 'Descriptor order is not verified animation order; the existing 49 components, layers and floor are retained.';
type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;newlyDiscoveredSourceImages?:number;
 sourceImageInterval?:{start:number;endExclusive:number;encodedBytes:number}};
export interface P32ForestTailResult{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('P32 FOREST.GRA: '+reason);}
function only(files:SourceFileEntry[],name:string){const found=files.filter(f=>f.name.toLowerCase()===name);need(found.length===1,`exactly one ${name} required`);return found[0];}
export async function buildMK2ForestTailSourceP32(source:DirectorySource):Promise<P32ForestTailResult>{
 try{
  need(!source.isSynthetic,'synthetic source');
  const files=await source.listRecursive(),e=only(files,'mk2.exe'),g=only(files,'forest.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(exe.length===861133&&e.size===exe.length&&await hash(exe)===EXE_SHA,'original EXE size/hash');
  need(gra.length===226788&&g.size===gra.length&&await hash(gra)===GRA_SHA,'original GRA size/hash');
  need(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1,0xa13a7)).split('\0')[27]==='FOREST.GRA','resource slot 27');
  const v=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),assets:Asset[]=[];
  let previous=164752;
  for(const [ordinal,offset] of DESCRIPTORS.entries()){
   const at=BASE+offset,width=v.getUint16(at,true),height=v.getUint16(at+2,true),packed=v.getUint32(at+8,true),start=packed&0xffffff;
   need((packed>>>24)===27&&start===previous,'original descriptor resource/contiguous interval');
   const decoded=decodeMK2NativeIndexedRows(gra,start,width,height);previous=decoded.end;
   need(previous<=198116,'indexed stream must not cross the original floor');
   assets.push({id:`mk2-forest-tail-source:${ordinal}:original-indices`,
    name:`FOREST.GRA additional original ${String(ordinal).padStart(2,'0')}`,
    group:'MK2 FOREST.GRA additional originals (role unknown)',kind:'sprite',format:'PNG diagnostic index-value preview',
    confidence:'Original O69/O110A descriptor geometry and native indices VERIFIED; roles/colors/timing UNKNOWN',
    source:{path:g.path,offset:start,length:decoded.end-start,sha256:GRA_SHA},
    metadata:{sourceDescriptorPhysical:at,sourceDescriptorObject2:offset,sourceDescriptorOrdinal:ordinal,sourceDescriptorBytes:12,
     sourceDescriptorAnchor:{x:v.getInt16(at+4,true),y:v.getInt16(at+6,true)},sourceResourceId:27,sourceEncodedEndExclusive:decoded.end,
     sourceSetupUses:[],sourceSetupCoverageScope:'five original O196/O197 Forest setups',setupRelationshipsAreRuntimePlacement:false,
     sourceExeSha256:EXE_SHA,newlyDiscoveredSourceImage:false,standaloneOriginalAccessNew:true,sourceOutsideImageFamilyBytes:193424,
     diagnosticPreview:true,diagnosticFormula:'RGB=(index,index,index); alpha=255*source opacity',
     runtimePaletteKnown:false,stageOwnershipKnown:false,nativeTimingKnown:false,worldPlacementKnown:false,fullStageScene:false,
     sourceTableOrderIsAnimation:false,provenance:'O69/O110A original twelve-byte descriptors; independent P32 original-file parity',
     indices:decoded.indices,mask:decoded.mask,paletteKnownMask:new Uint8Array(width*height)},
    width,height,rgba:decoded.rgba,filename:`MK2_FOREST_additional_${String(ordinal).padStart(2,'0')}_INDEX_VALUE_PREVIEW.png`});
  }
  need(previous===198116,'nine indexed streams must end exactly at the native floor');
  return {assets,packages:[{name:'MK2_P32_FOREST_9_ADDITIONAL_ORIGINALS.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:9,newlyDiscoveredSourceImages:0,sourceImageInterval:{start:164752,endExclusive:198116,encodedBytes:33364}}};
 }catch(e){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:e instanceof Error?e.message:String(e)}};}
}


/** P35: original twelve-byte ARENA descriptors for the previously unexposed interval.
 * Native indexed data only; descriptor anchors/order do not establish runtime placement/timing.
 */
import type {DirectorySource,SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';
import {decodeMK2NativeIndexedRows} from './mk2NativeIndexedRows';
const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb';
const BASE=0xa0c54,DESCRIPTORS=[99976, 99992, 100008, 100024, 100040, 100052, 100064, 100080, 100092, 100104, 100116, 100128, 100144, 100156, 100168, 100180];
export const MK2_P35_ARENA_TAIL_LIMITATION=
 'P35 ARENA.GRA: sixteen additional native indexed originals cover bytes [36172,90488). '+
 'Grayscale displays numeric source indices, NOT original runtime colors. '+
 'Setup relationships are not qualified by P35. Roles, activation, native palette, timing and world placement remain UNKNOWN. '+
 'Descriptor order is not verified animation order; the existing fifteen components and floor are retained.';
type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;newlyDiscoveredSourceImages?:number;
 sourceImageInterval?:{start:number;endExclusive:number;encodedBytes:number}};
export interface P35ArenaTailResult{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('P35 ARENA.GRA: '+reason);}
function only(files:SourceFileEntry[],name:string){const found=files.filter(f=>f.name.toLowerCase()===name);need(found.length===1,`exactly one ${name} required`);return found[0];}
export async function buildMK2ArenaTailSourceP35(source:DirectorySource):Promise<P35ArenaTailResult>{
 try{
  need(!source.isSynthetic,'synthetic source');
  const files=await source.listRecursive(),e=only(files,'mk2.exe'),g=only(files,'arena.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(exe.length===861133&&e.size===exe.length&&await hash(exe)===EXE_SHA,'original EXE size/hash');
  need(gra.length===126328&&g.size===gra.length&&await hash(gra)===GRA_SHA,'original GRA size/hash');
  need(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1,0xa13a7)).split('\0')[31]==='ARENA.GRA','resource slot 31');
  const v=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),assets:Asset[]=[];
  let previous=36172;
  for(const [ordinal,offset] of DESCRIPTORS.entries()){
   const at=BASE+offset,width=v.getUint16(at,true),height=v.getUint16(at+2,true),packed=v.getUint32(at+8,true),start=packed&0xffffff;
   need((packed>>>24)===31&&start===previous,'original descriptor resource/contiguous interval');
   const decoded=decodeMK2NativeIndexedRows(gra,start,width,height);previous=decoded.end;
   need(previous<=90488,'indexed stream must not cross the original floor');
   assets.push({id:`mk2-arena-tail-source:${ordinal}:original-indices`,
    name:`ARENA.GRA additional original ${String(ordinal).padStart(2,'0')}`,
    group:'MK2 ARENA.GRA additional originals (role unknown)',kind:'sprite',format:'PNG diagnostic index-value preview',
    confidence:'Original O69/O110A descriptor geometry and native indices VERIFIED; roles/colors/timing UNKNOWN',
    source:{path:g.path,offset:start,length:decoded.end-start,sha256:GRA_SHA},
    metadata:{sourceDescriptorPhysical:at,sourceDescriptorObject2:offset,sourceDescriptorOrdinal:ordinal,sourceDescriptorBytes:12,
     sourceDescriptorAnchor:{x:v.getInt16(at+4,true),y:v.getInt16(at+6,true)},sourceResourceId:31,sourceEncodedEndExclusive:decoded.end,
     sourceSetupUses:[],sourceSetupUsesKnown:false,sourceSetupCoverageScope:'Not qualified by P35',setupRelationshipsAreRuntimePlacement:false,
     maskIsRuntimeAlpha:false,maskSemantics:'Original indexed command paint coverage, not verified runtime alpha',
     sourceExeSha256:EXE_SHA,newlyDiscoveredSourceImage:false,standaloneOriginalAccessNew:true,sourceOutsideImageFamilyBytes:72012,
     diagnosticPreview:true,diagnosticFormula:'RGB=(index,index,index); alpha=255*source command paint coverage',
     runtimePaletteKnown:false,stageOwnershipKnown:false,nativeTimingKnown:false,worldPlacementKnown:false,fullStageScene:false,
     sourceTableOrderIsAnimation:false,provenance:'O69/O110A original twelve-byte descriptors; independent P35 original-file parity',
     indices:decoded.indices,mask:decoded.mask,paletteKnownMask:new Uint8Array(width*height)},
    width,height,rgba:decoded.rgba,filename:`MK2_ARENA_additional_${String(ordinal).padStart(2,'0')}_INDEX_VALUE_PREVIEW.png`});
  }
  need(previous===90488,'sixteen indexed streams must end exactly at the native floor');
  return {assets,packages:[{name:'MK2_P35_ARENA_16_ADDITIONAL_ORIGINALS.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:16,newlyDiscoveredSourceImages:0,sourceImageInterval:{start:36172,endExclusive:90488,encodedBytes:54316}}};
 }catch(e){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:e instanceof Error?e.message:String(e)}};}
}


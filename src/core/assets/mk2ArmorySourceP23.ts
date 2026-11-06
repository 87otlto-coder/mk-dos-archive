/** P23: O110A's original ARMORY.GRA eight-byte descriptor family.
 * Native indices/opacity and source geometry only. No inferred RGB, stage
 * ownership, world placement, animation order or timing. Existing floor paths are preserved.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';
import {decodeMK2NativeIndexedRows} from './mk2NativeIndexedRows';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612';
const OBJECT2=0xa0c54,TABLE=0x1695c,COUNT=18,PREFIX=0;
export const MK2_P23_ARMORY_LIMITATION=
 'P23 ARMORY.GRA: 18 original descriptor-backed indexed images, with exact native dimensions and transparency. '+
 'Grayscale shows source index values, NOT original runtime colors. Descriptor table order is NOT verified animation order. '+
 'Palette ownership, stage identity, scene placement, timing and full composition remain UNKNOWN. '+
 'The remaining 59904 source bytes lie outside this image family; existing original floors remain available.';
type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;
 sourceImagePrefix?:{start:number;endExclusive:number;encodedBytes:number};};
export interface P23ArmoryResult{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('P23 ARMORY.GRA: '+reason);}
function only(files:SourceFileEntry[],name:string){const matches=files.filter(f=>f.name.toLowerCase()===name);
 need(matches.length===1,`exactly one ${name} required`);return matches[0];}
export async function buildMK2ArmorySourceP23(source:DirectorySource):Promise<P23ArmoryResult>{
 try{
  need(!source.isSynthetic,'synthetic fixture is not an authenticated source');
  const files=await source.listRecursive(),e=only(files,'mk2.exe'),g=only(files,'armory.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(exe.length===861133&&e.size===exe.length&&await hash(exe)===EXE_SHA,'original EXE hash/size mismatch');
  need(gra.length===176512&&g.size===gra.length&&await hash(gra)===GRA_SHA,'original GRA hash/size mismatch');
  need(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1,0xa13a7)).split('\0')[26]==='ARMORY.GRA','resource slot 26');
  const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),assets:Asset[]=[];
  let previous=PREFIX;
  for(let ordinal=0;ordinal<COUNT;ordinal++){
   const descriptorPhysical=OBJECT2+TABLE+ordinal*8,width=view.getUint16(descriptorPhysical,true),height=view.getUint16(descriptorPhysical+2,true);
   const packed=view.getUint32(descriptorPhysical+4,true),start=packed&0xffffff;
   need((packed>>>24)===26&&start===previous,'original descriptor resource/contiguous extent');
   const decoded=decodeMK2NativeIndexedRows(gra,start,width,height);previous=decoded.end;
   assets.push({id:`mk2-armory-source:${ordinal}:original-indices`,name:`ARMORY.GRA original indexed image ${String(ordinal).padStart(2,'0')}`,
    group:'MK2 ARMORY.GRA original indexed images (scene unknown)',kind:'sprite',format:'PNG diagnostic index-value preview',
    confidence:'O110A source descriptor and native indices VERIFIED; runtime RGB UNKNOWN',
    source:{path:g.path,offset:start,length:decoded.end-start,sha256:GRA_SHA},
    metadata:{sourceDescriptorPhysical:descriptorPhysical,sourceDescriptorObject2:TABLE+ordinal*8,sourceDescriptorOrdinal:ordinal,
     sourceDescriptorStride:8,sourceResourceId:26,sourceEncodedEndExclusive:decoded.end,
     sourceExeSha256:EXE_SHA,sourceOutsideImageFamilyBytes:59904,diagnosticPreview:true,
     diagnosticFormula:'RGB=(index,index,index); alpha=255*source opacity',
     runtimePaletteKnown:false,stageOwnershipKnown:false,nativeTimingKnown:false,fullStageScene:false,
     worldPlacementKnown:false,sourceTableOrderIsAnimation:false,provenance:'O110A original 8-byte descriptors; independent P23 original-file parity',
     indices:decoded.indices,mask:decoded.mask,paletteKnownMask:new Uint8Array(width*height)},
    width,height,rgba:decoded.rgba,filename:`MK2_ARMORY_original_${String(ordinal).padStart(2,'0')}_INDEX_VALUE_PREVIEW.png`});
  }
  need(previous===116608,'18 native streams must exactly cover the qualified prefix');
  return {assets,packages:[{name:'MK2_P23_ARMORY_18_ORIGINAL_INDEXED_IMAGES.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:assets.length,sourceImagePrefix:{start:PREFIX,endExclusive:116608,encodedBytes:116608}}};
 }catch(e){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:e instanceof Error?e.message:String(e)}};}
}

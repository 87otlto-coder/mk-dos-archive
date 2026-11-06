/** P24: O110A's original BATTLE.GRA eight-byte descriptor family.
 * Native indices/opacity and source geometry only. No inferred RGB, stage
 * ownership, world placement, animation order or timing. Existing floor paths are preserved.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';
import {decodeMK2NativeIndexedRows} from './mk2NativeIndexedRows';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63';
const OBJECT2=0xa0c54,TABLE=0x19380,COUNT=20,PREFIX=0;
export const MK2_P24_BATTLE_LIMITATION=
 'P24 BATTLE.GRA: 20 original indexed images from 40 paired descriptor witnesses, with exact native dimensions and transparency. '+
 'Grayscale shows source index values, NOT original runtime colors. Descriptor table order is NOT verified animation order. '+
 'Palette ownership, stage identity, scene placement, timing and full composition remain UNKNOWN. '+
 'The remaining 35840 source bytes lie outside this image family; existing original floors remain available.';
type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;sourceDescriptorWitnesses?:number;duplicateWitnessesPreserved?:number;
 sourceImagePrefix?:{start:number;endExclusive:number;encodedBytes:number};};
export interface P24BattleResult{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('P24 BATTLE.GRA: '+reason);}
function only(files:SourceFileEntry[],name:string){const matches=files.filter(f=>f.name.toLowerCase()===name);
 need(matches.length===1,`exactly one ${name} required`);return matches[0];}
export async function buildMK2BattleSourceP24(source:DirectorySource):Promise<P24BattleResult>{
 try{
  need(!source.isSynthetic,'synthetic fixture is not an authenticated source');
  const files=await source.listRecursive(),e=only(files,'mk2.exe'),g=only(files,'battle.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(exe.length===861133&&e.size===exe.length&&await hash(exe)===EXE_SHA,'original EXE hash/size mismatch');
  need(gra.length===95276&&g.size===gra.length&&await hash(gra)===GRA_SHA,'original GRA hash/size mismatch');
  need(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1,0xa13a7)).split('\0')[34]==='BATTLE.GRA','resource slot 34');
  const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),assets:Asset[]=[];
  let previous=PREFIX;
  for(let ordinal=0;ordinal<COUNT;ordinal++){
   const descriptorPhysical=OBJECT2+TABLE+ordinal*8,width=view.getUint16(descriptorPhysical,true),height=view.getUint16(descriptorPhysical+2,true);
   const packed=view.getUint32(descriptorPhysical+4,true),start=packed&0xffffff;
   need((packed>>>24)===34&&start===previous,'original descriptor resource/contiguous extent');
   const secondPhysical=descriptorPhysical+20*8;
   need(view.getUint32(descriptorPhysical,true)===view.getUint32(secondPhysical,true)&&
    packed===view.getUint32(secondPhysical+4,true),'paired source witnesses must be byte-identical');
   const decoded=decodeMK2NativeIndexedRows(gra,start,width,height);previous=decoded.end;
   assets.push({id:`mk2-battle-source:${ordinal}:original-indices`,name:`BATTLE.GRA original indexed image ${String(ordinal).padStart(2,'0')}`,
    group:'MK2 BATTLE.GRA original indexed images (scene unknown)',kind:'sprite',format:'PNG diagnostic index-value preview',
    confidence:'O110A source descriptor and native indices VERIFIED; runtime RGB UNKNOWN',
    source:{path:g.path,offset:start,length:decoded.end-start,sha256:GRA_SHA},
    metadata:{sourceDescriptorPhysical:descriptorPhysical,sourceDescriptorObject2:TABLE+ordinal*8,sourceDescriptorOrdinal:ordinal,
     sourceDescriptorStride:8,sourceResourceId:34,
     sourceDescriptorOrdinals:[ordinal,ordinal+20],sourceDescriptorPhysicals:[descriptorPhysical,secondPhysical],
     sourceDescriptorObject2s:[TABLE+ordinal*8,TABLE+(ordinal+20)*8],sourceDescriptorWitnessCount:2,
     sourceDeduplication: "IDENTICAL_DESCRIPTOR_BYTES_AND_SOURCE_INTERVAL",sourceEncodedEndExclusive:decoded.end,
     sourceExeSha256:EXE_SHA,sourceOutsideImageFamilyBytes:35840,diagnosticPreview:true,
     diagnosticFormula:'RGB=(index,index,index); alpha=255*source opacity',
     runtimePaletteKnown:false,stageOwnershipKnown:false,nativeTimingKnown:false,fullStageScene:false,
     worldPlacementKnown:false,sourceTableOrderIsAnimation:false,provenance:'O110A original 8-byte descriptors; independent P24 original-file parity',
     indices:decoded.indices,mask:decoded.mask,paletteKnownMask:new Uint8Array(width*height)},
    width,height,rgba:decoded.rgba,filename:`MK2_BATTLE_original_${String(ordinal).padStart(2,'0')}_INDEX_VALUE_PREVIEW.png`});
  }
  need(previous===59436,'20 native streams must exactly cover the qualified prefix');
  return {assets,packages:[{name:'MK2_P24_BATTLE_20_ORIGINAL_INDEXED_IMAGES.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:assets.length,sourceDescriptorWitnesses:40,duplicateWitnessesPreserved:20,sourceImagePrefix:{start:PREFIX,endExclusive:59436,encodedBytes:59436}}};
 }catch(e){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:e instanceof Error?e.message:String(e)}};}
}

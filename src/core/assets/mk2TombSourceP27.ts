/** P27: O110A's original TOMB.GRA eight-byte descriptor family.
 * Native indices/opacity and source geometry only. No inferred RGB, stage
 * ownership, world placement, animation order or timing. Existing floor paths are preserved.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';
import {decodeMK2NativeIndexedRows} from './mk2NativeIndexedRows';
import {O122_SETUP_ROWS} from '../../games/mk2/research/stageIndexedPlacementsO122';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613';
const OBJECT2=0xa0c54,TABLE=0x17688,COUNT=16,PREFIX=0;
export const MK2_P27_TOMB_LIMITATION=
 'P27 TOMB.GRA: 16 standalone original components already used in the existing TOMB mosaics, with exact native dimensions and transparency. '+
 'Grayscale shows source index values, NOT original runtime colors. Descriptor table order is NOT verified animation order. '+
 'Palette ownership, stage identity, scene placement, timing and full composition remain UNKNOWN. '+
 'The remaining 52456 source bytes lie outside this image family; existing original floors remain available.';
type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;newlyDiscoveredSourceImages?:number;existingSetupLayers?:number;sourceControlPlacements?:number;
 sourceImagePrefix?:{start:number;endExclusive:number;encodedBytes:number};};
export interface P27TombResult{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('P27 TOMB.GRA: '+reason);}
function only(files:SourceFileEntry[],name:string){const matches=files.filter(f=>f.name.toLowerCase()===name);
 need(matches.length===1,`exactly one ${name} required`);return matches[0];}
export async function buildMK2TombSourceP27(source:DirectorySource):Promise<P27TombResult>{
 try{
  need(!source.isSynthetic,'synthetic fixture is not an authenticated source');
  const files=await source.listRecursive(),e=only(files,'mk2.exe'),g=only(files,'tomb.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(exe.length===861133&&e.size===exe.length&&await hash(exe)===EXE_SHA,'original EXE hash/size mismatch');
  need(gra.length===106784&&g.size===gra.length&&await hash(gra)===GRA_SHA,'original GRA hash/size mismatch');
  need(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1,0xa13a7)).split('\0')[28]==='TOMB.GRA','resource slot 28');
  const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),assets:Asset[]=[];
  let previous=PREFIX;
  for(let ordinal=0;ordinal<COUNT;ordinal++){
   const descriptorPhysical=OBJECT2+TABLE+ordinal*8,width=view.getUint16(descriptorPhysical,true),height=view.getUint16(descriptorPhysical+2,true);
   const packed=view.getUint32(descriptorPhysical+4,true),start=packed&0xffffff;
   need((packed>>>24)===28&&start===previous,'original descriptor resource/contiguous extent');
   const decoded=decodeMK2NativeIndexedRows(gra,start,width,height);previous=decoded.end;
   const sourceSetupUses=O122_SETUP_ROWS.tomb.flatMap(setup=>{
    const uses=setup.placements.filter(p=>p.offset===start&&p.width===width&&p.height===height);
    return uses.length?[{assetId:`mk2-stage-setup:tomb:object2_${setup.setupObject2Offset.toString(16).toUpperCase()}`,
     setupObject2Offset:setup.setupObject2Offset,occurrences:uses.length,
     clippedPlacements:uses.filter(p=>p.x<0||p.y<0||p.x+width>setup.width||p.y+height>setup.height).length}]:[];
   });
   need(sourceSetupUses.length>0,'component must join an existing original setup layer');
   assets.push({id:`mk2-tomb-source:${ordinal}:original-indices`,name:`TOMB.GRA original setup component ${String(ordinal).padStart(2,'0')}`,
    group:'MK2 TOMB.GRA original setup components (scene unknown)',kind:'sprite',format:'PNG diagnostic index-value preview',
    confidence:'O110A source descriptor and native indices VERIFIED; runtime RGB UNKNOWN',
    source:{path:g.path,offset:start,length:decoded.end-start,sha256:GRA_SHA},
    metadata:{sourceDescriptorPhysical:descriptorPhysical,sourceDescriptorObject2:TABLE+ordinal*8,sourceDescriptorOrdinal:ordinal,
     sourceDescriptorStride:8,sourceResourceId:28,sourceEncodedEndExclusive:decoded.end,
     sourceSetupUses,componentPreviouslyUsedInMosaics:true,newlyDiscoveredSourceImage:false,standaloneOriginalAccessNew:true,
     setupRelationshipsAreRuntimePlacement:false,sourceExeSha256:EXE_SHA,sourceOutsideImageFamilyBytes:52456,diagnosticPreview:true,
     diagnosticFormula:'RGB=(index,index,index); alpha=255*source opacity',
     runtimePaletteKnown:false,stageOwnershipKnown:false,nativeTimingKnown:false,fullStageScene:false,
     worldPlacementKnown:false,sourceTableOrderIsAnimation:false,provenance:'O110A original 8-byte descriptors; independent P27 original-file parity',
     indices:decoded.indices,mask:decoded.mask,paletteKnownMask:new Uint8Array(width*height)},
    width,height,rgba:decoded.rgba,filename:`MK2_TOMB_original_${String(ordinal).padStart(2,'0')}_INDEX_VALUE_PREVIEW.png`});
  }
  need(previous===54328,'16 native streams must exactly cover the qualified prefix');
  return {assets,packages:[{name:'MK2_P27_TOMB_16_ORIGINAL_SETUP_COMPONENTS.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:assets.length,newlyDiscoveredSourceImages:0,existingSetupLayers:6,sourceControlPlacements:87,sourceImagePrefix:{start:PREFIX,endExclusive:54328,encodedBytes:54328}}};
 }catch(e){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:e instanceof Error?e.message:String(e)}};}
}

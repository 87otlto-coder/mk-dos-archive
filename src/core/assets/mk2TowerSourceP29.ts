/** P29: standalone TOWER originals from O110A's mixed descriptor families.
 * Source indices/opacity only; setup controls are retained without inventing transforms.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';
import {decodeMK2NativeIndexedRows} from './mk2NativeIndexedRows';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8';
const OBJECT2=0xa0c54,DESCRIPTORS=[0x17980,0x17988,0x17990,0x17998,0x179a0,0x179b0];
export const MK2_P29_TOWER_LIMITATION=
 'P29 TOWER.GRA: six standalone originals from mixed eight/twelve-byte descriptors. '+
 'Grayscale shows numeric source indices, NOT runtime colors. Raw setup controls are provenance, not verified placement or transform semantics. '+
 'Native palette, timing, full scene and runtime activation remain UNKNOWN; descriptor order is not animation order. '+
 'Existing seven effect frames and original floor representations are preserved.';
type Control={setupObject2Offset:number;controlObject2Offset:number;ordinal:number;rawFlags:number;sourceX:number;sourceY:number;rawPair:number};
type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;newlyDiscoveredSourceImages?:number;sourceSetupRecords?:number;sourceSetupControls?:number;
 sourceImagePrefix?:{start:number;endExclusive:number;encodedBytes:number}};
export interface P29TowerResult{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('P29 TOWER.GRA: '+reason);}
function only(files:SourceFileEntry[],name:string){const matches=files.filter(f=>f.name.toLowerCase()===name);
 need(matches.length===1,`exactly one ${name} required`);return matches[0];}
export async function buildMK2TowerSourceP29(source:DirectorySource):Promise<P29TowerResult>{
 try{
  need(!source.isSynthetic,'synthetic source');
  const files=await source.listRecursive(),e=only(files,'mk2.exe'),g=only(files,'tower.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(exe.length===861133&&e.size===exe.length&&await hash(exe)===EXE_SHA,'original EXE size/hash');
  need(gra.length===113612&&g.size===gra.length&&await hash(gra)===GRA_SHA,'original GRA size/hash');
  need(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1,0xa13a7)).split('\0')[30]==='TOWER.GRA','resource slot 30');
  const v=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),controls:Control[]=[],assets:Asset[]=[];
  for(const setup of [0x1795c,0x1796e]){
   const at=OBJECT2+setup,count=v.getUint16(at+4,true),control=v.getUint32(at+6,true);
   need(v.getUint16(at,true)===1031&&v.getUint16(at+2,true)===64&&
    v.getUint32(at+10,true)===0x17980&&v.getUint32(at+14,true)===0x17a18,'source setup header');
   for(let ordinal=0;ordinal<count;ordinal++){
    const c=OBJECT2+control+ordinal*8,rawFlags=v.getUint16(c,true),rawPair=v.getUint16(c+6,true);
    need((rawFlags&15)===2&&[0,2,4,6].includes(rawPair),'source descriptor control');
    controls.push({setupObject2Offset:setup,controlObject2Offset:control+ordinal*8,ordinal,rawFlags,
     sourceX:v.getInt16(c+2,true),sourceY:v.getInt16(c+4,true),rawPair});
   }
  }
  need(controls.length===22,'source control census');
  let previous=0;
  for(const [ordinal,offset] of DESCRIPTORS.entries()){
   const at=OBJECT2+offset,sourceDescriptorBytes=ordinal<4?8:12;
   const width=v.getUint16(at,true),height=v.getUint16(at+2,true),packed=v.getUint32(at+sourceDescriptorBytes-4,true),start=packed&0xffffff;
   need((packed>>>24)===30&&start===previous,'original mixed descriptor extent');
   const decoded=decodeMK2NativeIndexedRows(gra,start,width,height);previous=decoded.end;
   const sourceSetupControls=ordinal<4?controls.filter(c=>c.rawPair*4===ordinal*8):[];
   need(ordinal>=4||sourceSetupControls.length>0,'source setup-control join');
   assets.push({id:`mk2-tower-source:${ordinal}:original-indices`,name:`TOWER.GRA original component ${String(ordinal).padStart(2,'0')}`,
    group:'MK2 TOWER.GRA original components (scene unknown)',kind:'sprite',format:'PNG diagnostic index-value preview',
    confidence:'Original mixed descriptors/indices VERIFIED; runtime colors and transforms UNKNOWN',
    source:{path:g.path,offset:start,length:decoded.end-start,sha256:GRA_SHA},
    metadata:{sourceDescriptorPhysical:at,sourceDescriptorObject2:offset,sourceDescriptorOrdinal:ordinal,sourceDescriptorBytes,
     sourceDescriptorAnchor:ordinal<4?null:{x:v.getInt16(at+4,true),y:v.getInt16(at+6,true)},sourceResourceId:30,
     sourceEncodedEndExclusive:decoded.end,sourceSetupControls,setupTransformSemanticsKnown:false,
     setupRelationshipsAreRuntimePlacement:false,newlyDiscoveredSourceImage:false,standaloneOriginalAccessNew:true,
     sourceExeSha256:EXE_SHA,sourceOutsideImageFamilyBytes:72836,diagnosticPreview:true,
     diagnosticFormula:'RGB=(index,index,index); alpha=255*source opacity',runtimePaletteKnown:false,
     stageOwnershipKnown:false,nativeTimingKnown:false,fullStageScene:false,worldPlacementKnown:false,sourceTableOrderIsAnimation:false,
     provenance:'O110A mixed descriptors; independent P29 original-file parity; raw setup flags uninterpreted',
     indices:decoded.indices,mask:decoded.mask,paletteKnownMask:new Uint8Array(width*height)},
    width,height,rgba:decoded.rgba,filename:`MK2_TOWER_original_${String(ordinal).padStart(2,'0')}_INDEX_VALUE_PREVIEW.png`});
  }
  need(previous===40776,'six streams exactly cover the qualified prefix');
  return {assets,packages:[{name:'MK2_P29_TOWER_6_ORIGINAL_COMPONENTS.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:6,newlyDiscoveredSourceImages:0,sourceSetupRecords:2,sourceSetupControls:22,
    sourceImagePrefix:{start:0,endExclusive:40776,encodedBytes:40776}}};
 }catch(e){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:e instanceof Error?e.message:String(e)}};}
}


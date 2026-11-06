/** P22: O110A's original CAVE.GRA eight-byte descriptor family.
 * Native indices/opacity and source geometry only. No inferred RGB, stage
 * ownership, world placement, animation order or timing. Prefix stays unqualified.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='11e7988cabae63c8ee618700da47de648ef3bb1d9f7f8a8b23332c0513c83cb7';
const OBJECT2=0xa0c54,TABLE=0x18260,COUNT=49,PREFIX=120;
export const MK2_P22_CAVE_LIMITATION=
 'P22 CAVE.GRA: 49 original descriptor-backed indexed images, with exact native dimensions and transparency. '+
 'Grayscale shows source index values, NOT original runtime colors. Descriptor table order is NOT verified animation order. '+
 'Palette ownership, stage identity, scene placement, timing and full composition remain UNKNOWN. '+
 'The first 120 source bytes remain outside this image qualification.';
type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;
 sourceSuffix?:{start:number;endExclusive:number;encodedBytes:number};};
export interface P22CaveResult{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(value:unknown,reason:string):asserts value{if(!value)throw Error('P22 CAVE.GRA: '+reason);}
function only(files:SourceFileEntry[],name:string){const matches=files.filter(f=>f.name.toLowerCase()===name);
 need(matches.length===1,`exactly one ${name} required`);return matches[0];}
function decode(gra:Uint8Array,start:number,width:number,height:number){
 need(width>0&&width<=640&&height>0&&height<=480,'native geometry out of bounds');
 const view=new DataView(gra.buffer,gra.byteOffset,gra.byteLength),indices=new Uint8Array(width*height),mask=new Uint8Array(indices.length);
 let pos=start;
 for(let y=0;y<height;y++)for(let x=0;x<width;){
  need(pos+4<=gra.length,'truncated command');const command=view.getUint32(pos,true);pos+=4;
  let count:number;const cell=y*width+x;
  if(command&1)count=command>>>1;
  else if(command&2){count=command>>>10;need(count>0&&count<=width-x,'RLE crosses row');
   indices.fill((command>>>2)&255,cell,cell+count);mask.fill(1,cell,cell+count);
  }else{count=command>>>2;const padded=(count+3)&~3;
   need(count>0&&count<=64&&count<=width-x&&pos+padded<=gra.length,'invalid literal');
   indices.set(gra.subarray(pos,pos+count),cell);mask.fill(1,cell,cell+count);pos+=padded;
  }
  need(count>0&&count<=width-x,'command crosses row');x+=count;
 }
 const rgba=new Uint8Array(indices.length*4);
 for(let i=0;i<indices.length;i++){const v=indices[i],p=i*4;rgba[p]=v;rgba[p+1]=v;rgba[p+2]=v;rgba[p+3]=mask[i]*255;}
 return {end:pos,indices,mask,rgba};
}
export async function buildMK2CaveSourceP22(source:DirectorySource):Promise<P22CaveResult>{
 try{
  need(!source.isSynthetic,'synthetic fixture is not an authenticated source');
  const files=await source.listRecursive(),e=only(files,'mk2.exe'),g=only(files,'cave.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(exe.length===861133&&e.size===exe.length&&await hash(exe)===EXE_SHA,'original EXE hash/size mismatch');
  need(gra.length===57312&&g.size===gra.length&&await hash(gra)===GRA_SHA,'original GRA hash/size mismatch');
  need(new TextDecoder('latin1').decode(exe.subarray(0xa0ef1,0xa13a7)).split('\0')[29]==='CAVE.GRA','resource slot 29');
  const view=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),assets:Asset[]=[];
  let previous=PREFIX;
  for(let ordinal=0;ordinal<COUNT;ordinal++){
   const descriptorPhysical=OBJECT2+TABLE+ordinal*8,width=view.getUint16(descriptorPhysical,true),height=view.getUint16(descriptorPhysical+2,true);
   const packed=view.getUint32(descriptorPhysical+4,true),start=packed&0xffffff;
   need((packed>>>24)===29&&start===previous,'original descriptor resource/contiguous extent');
   const decoded=decode(gra,start,width,height);previous=decoded.end;
   assets.push({id:`mk2-cave-source:${ordinal}:original-indices`,name:`CAVE.GRA original indexed image ${String(ordinal).padStart(2,'0')}`,
    group:'MK2 CAVE.GRA original indexed images (scene unknown)',kind:'sprite',format:'PNG diagnostic index-value preview',
    confidence:'O110A source descriptor and native indices VERIFIED; runtime RGB UNKNOWN',
    source:{path:g.path,offset:start,length:decoded.end-start,sha256:GRA_SHA},
    metadata:{sourceDescriptorPhysical:descriptorPhysical,sourceDescriptorObject2:TABLE+ordinal*8,sourceDescriptorOrdinal:ordinal,
     sourceDescriptorStride:8,sourceResourceId:29,sourceEncodedEndExclusive:decoded.end,
     sourceExeSha256:EXE_SHA,sourceUnqualifiedPrefixBytes:PREFIX,diagnosticPreview:true,
     diagnosticFormula:'RGB=(index,index,index); alpha=255*source opacity',
     runtimePaletteKnown:false,stageOwnershipKnown:false,nativeTimingKnown:false,fullStageScene:false,
     worldPlacementKnown:false,sourceTableOrderIsAnimation:false,provenance:'O110A original 8-byte descriptors; independent P22 original-file parity',
     indices:decoded.indices,mask:decoded.mask,paletteKnownMask:new Uint8Array(width*height)},
    width,height,rgba:decoded.rgba,filename:`MK2_CAVE_original_${String(ordinal).padStart(2,'0')}_INDEX_VALUE_PREVIEW.png`});
  }
  need(previous===gra.length,'49 native streams must exactly cover suffix');
  return {assets,packages:[{name:'MK2_P22_CAVE_49_ORIGINAL_INDEXED_IMAGES.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:assets.length,sourceSuffix:{start:PREFIX,endExclusive:gra.length,encodedBytes:gra.length-PREFIX}}};
 }catch(e){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:e instanceof Error?e.message:String(e)}};}
}

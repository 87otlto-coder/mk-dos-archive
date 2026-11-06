/** P17: two O121/O122-authenticated IMAGES.GRA setup-local indexed mosaics.
 * Original EXE source controls place ten 64x100 sprites per 320x200 setup.
 * The two 79-colour palette records were NOT verified as selected in gameplay.
 * Grayscale is an index-value diagnostic, not an original DOS palette.
 * No arena name, screen position, activation, timing or full stage is inferred.
 */
import type {DirectorySource, SourceFileEntry} from '../filesystem/DirectorySource';
import type {Asset} from './model';
import {hash} from './model';
import {selectedZip} from './export';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA_SHA='2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf';
const OBJ2=0xa0c54, RESOURCE_ID=22, IMAGE_W=320, IMAGE_H=200;
const SETUPS=[
 {label:'tomb79',offset:0x2e7e4,control:0x2e7f6,spriteTable:0x2e930,paletteTable:0x2e848,
  palettePhysical:0x8cdbe,firstStream:400084},
 {label:'portal79',offset:0x2e720,control:0x2e732,spriteTable:0x2e930,paletteTable:0x2e784,
  palettePhysical:0x8cd1e,firstStream:351472},
] as const;
// O122: 20 original streams form one exact [351472,460192) source chain.
const SOURCE_CHAIN_START=351472,SOURCE_CHAIN_END=460192;
const RENDERER_SIGNATURES:[number,string][]=[
 [0x3b600+0x2e90c,'8b06d1e8722ad1e8723e8d580380e3fc8d741e0483f840'],
 [0x3b600+0x2ee6c,'8bd081e2ff0000008b14958410000003d3c1e808'],
];
export const MK2_P17_IMAGES_SETUP_LIMITATION=
 'P17 IMAGES.GRA contains two source-authenticated 320x200 setup-local indexed mosaics. '+
 'Their O121 source labels tomb79/portal79 identify conditional 79-colour setup families, NOT verified live arenas or palette owners. '+
 'Grayscale is a diagnostic visualization of original indices; no original RGB palette, global screen location, '+
 'runtime activation, frame time, layer order or complete stage scene is inferred.';

type Status={status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string;
  sourceChain?:{start:number;endExclusive:number;streams:number};};
export interface P17Result{assets:Asset[];packages:{name:string;bytes:Uint8Array}[];status:Status}
function need(condition:unknown,detail:string):asserts condition {if(!condition)throw Error('P17 IMAGES.GRA: '+detail)}
function only(files:SourceFileEntry[],name:string){
 const matches=files.filter(f=>f.name.toLowerCase()===name);
 need(matches.length===1,`expected exactly one ${name}, found ${matches.length}`);return matches[0];
}
function u16(d:DataView,p:number){need(p>=0&&p+2<=d.byteLength,'out-of-range EXE word');return d.getUint16(p,true)}
function u32(d:DataView,p:number){need(p>=0&&p+4<=d.byteLength,'out-of-range EXE DWORD');return d.getUint32(p,true)}
function i16(d:DataView,p:number){need(p>=0&&p+2<=d.byteLength,'out-of-range EXE signed word');return d.getInt16(p,true)}
function decode(gra:Uint8Array,start:number,w:number,h:number){
 need(w>0&&h>0&&w*h<=250000,'unsupported original stream dimensions');
 const d=new DataView(gra.buffer,gra.byteOffset,gra.byteLength);
 const indices=new Uint8Array(w*h),mask=new Uint8Array(w*h);
 let pos=start,commands=0;
 for(let y=0;y<h;y++){
  let x=0;
  while(x<w){
   need(pos+4<=gra.length,'truncated original stream command');
   const cmd=d.getUint32(pos,true);pos+=4;
   let run=0;
   if(cmd&1){run=cmd>>>1;}
   else if(cmd&2){
    run=cmd>>>10;
    const index=(cmd>>>2)&255;
    need(index>=1&&index<=79,'source index beyond original 79-colour record');
    need(run>0&&run<=w-x,'RLE run exceeds source row');
    indices.fill(index,y*w+x,y*w+x+run);mask.fill(1,y*w+x,y*w+x+run);
   }else{
    run=cmd>>>2;
    need(run>0&&run<=64&&run<=w-x&&pos+run<=gra.length,'literal overrun');
    for(let n=0;n<run;n++)need(gra[pos+n]>=1&&gra[pos+n]<=79,'original literal index beyond 79-colour record');
    indices.set(gra.subarray(pos,pos+run),y*w+x);mask.fill(1,y*w+x,y*w+x+run);
    pos+=(run+3)&~3;
   }
   need(run>0&&run<=w-x,'skip/run crosses original row');x+=run;
   need(++commands<250000,'excessive stream command count');
  }
 }
 return{indices,mask,end:pos};
}
function build(exe:Uint8Array,gra:Uint8Array):Asset[]{
 need(exe.length===861133&&gra.length===526268,'original resource lengths differ');
 const d=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 for(const [at,hex]of RENDERER_SIGNATURES){
  const actual=Array.from(exe.subarray(at,at+hex.length/2),v=>v.toString(16).padStart(2,'0')).join('');
  need(actual===hex,'original MK2 command-interpreter signature mismatch');
 }
 const assets:Asset[]=[],ranges:{start:number;end:number}[]=[];
 for(const s of SETUPS){
  const start=OBJ2+s.offset;
  need(u16(d,start)===IMAGE_W&&u16(d,start+2)===IMAGE_H&&u16(d,start+4)===10,
   `original 320x200 setup / ten control count ${s.label}`);
  need(u32(d,start+6)===s.control,'original control pointer differs '+s.label);
  need(u32(d,start+10)===s.spriteTable,'original descriptor table differs '+s.label);
  need(u32(d,start+14)===s.paletteTable,'original palette table pointer differs');
  need(u16(d,s.palettePhysical)===79,'original 79-colour record count differs');
  const indices=new Uint8Array(IMAGE_W*IMAGE_H),mask=new Uint8Array(IMAGE_W*IMAGE_H);
  const descriptors:Record<string,number>[]=[];
  for(let n=0;n<10;n++){
   const cp=OBJ2+s.control+n*8,flags=u16(d,cp),x=i16(d,cp+2),y=i16(d,cp+4),pair=u16(d,cp+6);
   const slot=(flags&15)|((pair&0xf000)>>>8);
   need(slot===2,'source palette selector slot must be 2');
   const wordOff=(pair&0xfff)*4;need(wordOff%8===0,'unaligned source descriptor');
   const desc=OBJ2+s.spriteTable+wordOff;
   const w=u16(d,desc),h=u16(d,desc+2),token=u32(d,desc+4);
   const rid=token>>>24,offset=token&0xffffff;
   need(rid===RESOURCE_ID&&w===64&&h===100,'not a source-authenticated IMAGES.GRA tile descriptor');
   // The 10 original positions form a 5x2 setup-local tiled canvas, NOT a screen location.
   need(x===Math.floor(n/2)*64 && y===(n%2)*100,'unexpected source-local tile placement');
   const sprite=decode(gra,offset,w,h);ranges.push({start:offset,end:sprite.end});
   for(let j=0;j<sprite.indices.length;j++){
    if(!sprite.mask[j])continue;
    const px=x+j%w,py=y+Math.floor(j/w);
    need(px>=0&&py>=0&&px<IMAGE_W&&py<IMAGE_H,'source setup clipping unexpected');
    const dst=py*IMAGE_W+px;
    need(mask[dst]===0,'source mosaic unexpectedly overwrites opaque pixel');
    indices[dst]=sprite.indices[j];mask[dst]=1;
   }
   descriptors.push({ordinal:n,sourceOffset:offset,sourceEndExclusive:sprite.end,
    descriptorObject2:desc-OBJ2,localX:x,localY:y,width:w,height:h});
  }
  need(descriptors[0].sourceOffset===s.firstStream,'source chain family start mismatch');
  const rgba=new Uint8Array(IMAGE_W*IMAGE_H*4),paletteKnownMask=new Uint8Array(IMAGE_W*IMAGE_H);
  for(let i=0;i<indices.length;i++){
   if(mask[i]){
    const g=Math.min(255,indices[i]*3); // index-value diagnostic; not source DAC colour
    rgba.set([g,g,g,255],i*4);
   }
  }
  const hex=s.offset.toString(16);
  assets.push({id:`mk2-images-setup:object2_${hex}`,name:`IMAGES.GRA · original setup Object-2 ${hex}`,
   group:'MK2 unassigned source-local 79-colour setups / IMAGES.GRA',kind:'stage',
   format:'PNG · diagnostic indexed mosaic (palette unknown)',
   confidence:'O121/O122 original indexed setup VERIFIED; arena and runtime palette UNKNOWN',
   source:{path:'images.gra',offset:descriptors[0].sourceOffset,
    length:descriptors[9].sourceEndExclusive-descriptors[0].sourceOffset,sha256:GRA_SHA},
   metadata:{sourceFamilyLabel:s.label,setupObject2Offset:s.offset,
    paletteRecordPhysical:s.palettePhysical,paletteEntryCount:79,
    paletteSelectedAtRuntime:false,paletteKnownMask,indices,mask,
    sourceExecutable:'mk2.exe',sourceResourceId:RESOURCE_ID,controlTableObject2:s.control,
    sourceControlEntries:descriptors,originalSourceOrdering:true,sourceLocalPlacementOnly:true,
    stageOwnershipKnown:false,liveScreenPositionKnown:false,runtimePaletteKnown:false,
    nativeAnimationTimingKnown:false,fullStageScene:false,
    visualization:'diagnostic grayscale = min(255, original index * 3); transparent skips preserved',
    provenance:'O120/O121/O122'},
   width:IMAGE_W,height:IMAGE_H,rgba,filename:`MK2_IMAGES_Object2_${hex}_index_preview.png`});
 }
 ranges.sort((a,b)=>a.start-b.start);
 need(ranges.length===20 && ranges[0].start===SOURCE_CHAIN_START &&
  ranges.at(-1)?.end===SOURCE_CHAIN_END,'authenticated 20-stream chain boundary mismatch');
 for(let i=1;i<ranges.length;i++)need(ranges[i-1].end===ranges[i].start,
  'original IMAGES.GRA source streams must tile without gaps/overlap');
 return assets;
}
export async function buildMK2ImagesSetupsP17(source:DirectorySource):Promise<P17Result>{
 const unavailable=(detail:string):P17Result=>({assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail}});
 try{
  need(!source.isSynthetic,'synthetic source not authenticated');
  const files=await source.listRecursive();
  const e=only(files,'mk2.exe'),g=only(files,'images.gra');
  const exe=await source.readSlice(e.path,0,e.size),gra=await source.readSlice(g.path,0,g.size);
  need(await hash(exe)===EXE_SHA,'canonical MK2.EXE checksum mismatch');
  need(await hash(gra)===GRA_SHA,'canonical IMAGES.GRA checksum mismatch');
  const assets=build(exe,gra);
  need(assets.length===2,'expected two original setup-local canvases');
  return {assets,packages:[{name:'MK2_P17_IMAGES_TWO_UNASSIGNED_INDEXED_SETUP_LAYERS.zip',bytes:selectedZip(assets)}],
   status:{status:'VERIFIED',count:assets.length,sourceChain:{start:SOURCE_CHAIN_START,endExclusive:SOURCE_CHAIN_END,streams:20}}};
 }catch(e){return unavailable(e instanceof Error?e.message:String(e));}
}

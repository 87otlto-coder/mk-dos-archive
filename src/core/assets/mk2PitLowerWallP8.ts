/** P8: original Pit II lower-wall/crack source tiles from the unchanged O210/O214/O224
 * forensic chain. This is source-art extraction, NOT a timed/reconstructed scene.
 * O224 proves the 32-byte source selector and its 7 original palette-linked descriptors;
 * O214 independently compares the source palette against recorded DOS pixels, but
 * did NOT observe runtime DAC loading. All original buffers stay read-only.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { encodeOriginalEffectRgbaPngO177 } from '../../games/mk2/research/stageSourcePngO177';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const FALL_SHA='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0';
const RENDER_GRA_ID=123;
const PALETTE_OFFSET=0x895ac, PALETTE_COUNT=81;
const OBJECT2_IMAGE=0xa0c54;
const EXPECTED_DIMS: Record<number,[number,number]>={
 54:[96,96],55:[96,96],56:[80,80],57:[64,64],58:[96,96],59:[96,96],60:[96,96]
};
const EXPECTED_SELECTOR_COUNTS: ReadonlyArray<[number,number]> = [
 [60,12],[59,6],[58,5],[57,4],[56,3],[55,2]
];
export const P8_PIT_LOWER_WALL_LIMITATION =
 'P8 Pit II FALL.GRA 54–60 are original, source-palette-linked lower-wall/crack graphics. ' +
 'The 32-step 60→55 selector is original source order, NOT confirmed display timing or captured frame order. ' +
 'Source palette has DOS video support but no direct runtime DAC trace. ' +
 'This does not establish final tile placement, camera, transition visibility, or a complete stage composition.';

interface SourceSprite {number:number;width:number;height:number;graOffset:number;graEnd:number;
  indices:Uint8Array;mask:Uint8Array;rgba:Uint8Array;descriptorPhysical:number;}
export interface P8PitLowerWallResult {
 assets:Asset[];
 packages:Array<{name:string;bytes:Uint8Array}>;
 status:{status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string};
}
function requireFact(ok:unknown,msg:string):asserts ok {
 if(!ok) throw Error(`P8 original Pit II lower-wall source: ${msg}`);
}
function findOriginal(entries:SourceFileEntry[],name:string):SourceFileEntry {
 const found=entries.filter(x=>x.name.toLowerCase()===name.toLowerCase());
 requireFact(found.length===1,`expected one ${name}; found ${found.length}`);
 return found[0];
}
function decoder(exe:Uint8Array,gra:Uint8Array) {
 const ev=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),gv=new DataView(gra.buffer,gra.byteOffset,gra.byteLength);
 const u16=(p:number)=>ev.getUint16(p,true),u32=(p:number)=>ev.getUint32(p,true);
 requireFact(u16(PALETTE_OFFSET)===PALETTE_COUNT,'source palette count');
 requireFact(u32(OBJECT2_IMAGE+0x18d40)===PALETTE_OFFSET-0x61c54,'original palette pointer');
 const palette=new Uint8Array((PALETTE_COUNT+1)*3);
 for(let i=1;i<=PALETTE_COUNT;i++){
  const word=u16(PALETTE_OFFSET+2*i);
  const channels=[((word>>>9)&63)|1,((word>>>4)&63)|1,((word<<1)&63)|1];
  for(let c=0;c<3;c++)palette[i*3+c]=(channels[c]<<2)|(channels[c]>>>4);
 }
 const sprites:SourceSprite[]=[];let previousEnd=0;
 for(let i=0;i<=60;i++){
  const descriptor=i<54?0xc39b8+12*i:0xc3c40+16*(i-54);
  const w=u16(descriptor),h=u16(descriptor+2),packed=u32(descriptor+8),start=packed&0xffffff;
  requireFact(packed>>>24===RENDER_GRA_ID,`sprite ${i}: resource id`);
  requireFact(w>=1&&w<=160&&h>=1&&h<=140,`sprite ${i}: unreasonable dimensions`);
  requireFact(start===previousEnd,`sprite ${i}: original packed offset not contiguous`);
  if(i>=54){
   requireFact(w===EXPECTED_DIMS[i][0]&&h===EXPECTED_DIMS[i][1],`sprite ${i}: special dimensions`);
   requireFact(ev.getInt16(descriptor+4,true)===0&&ev.getInt16(descriptor+6,true)===0,`sprite ${i}: signed XY`);
   requireFact(u32(descriptor+12)===0x27958,`sprite ${i}: source palette reference`);
  }
  const ix=new Uint8Array(w*h),mask=new Uint8Array(w*h);let at=start;
  for(let y=0;y<h;y++){
   let x=0;while(x<w){
    requireFact(at+4<=gra.length,`sprite ${i}: truncated command`);
    const cmd=gv.getUint32(at,true);at+=4;
    let n:number;
    if(cmd&1) n=cmd>>>1;
    else if(cmd&2){n=cmd>>>10;requireFact(n>0&&n<=w-x,`sprite ${i}: run overflow`);
     ix.fill((cmd>>>2)&255,y*w+x,y*w+x+n);mask.fill(1,y*w+x,y*w+x+n);
    } else {n=cmd>>>2;requireFact(n>0&&n<=w-x&&at+n<=gra.length,`sprite ${i}: literal overflow`);
     ix.set(gra.subarray(at,at+n),y*w+x);mask.fill(1,y*w+x,y*w+x+n);at+=(n+3)&~3;
    }
    requireFact(n>0&&n<=w-x,`sprite ${i}: row overflow`);x+=n;
   }
  }
  previousEnd=at;
  if(i>=54){
   const rgba=new Uint8Array(w*h*4);
   for(let p=0;p<w*h;p++)if(mask[p]){
    const index=ix[p];requireFact(index>=1&&index<=PALETTE_COUNT,`sprite ${i}: palette index ${index}`);
    rgba.set(palette.subarray(index*3,index*3+3),p*4);rgba[p*4+3]=255;
   }
   sprites.push({number:i,width:w,height:h,graOffset:start,graEnd:at,indices:ix,mask,rgba,descriptorPhysical:descriptor});
  }
 }
 requireFact(previousEnd===gra.length,'all 61 original streams tile FALL.GRA exactly');
 // The six named wall graphics are indexed in source order by the 32 original
 // selector bytes; 54 is a separate post-selector crack overlay.
 const raw=[...exe.subarray(0xb4d84,0xb4da4)];
 requireFact(raw.length===32&&exe[0xb4da4]===0xff,'selector length/terminator');
 const sequence=raw.map((index,i)=>{
  requireFact(index>=0&&index<=5,`selector step ${i} out of range`);
  return {sourceStep:i,selectorIndex:index,originalSprite:55+index};
 });
 const counts:Array<[number,number]>=[];
 for(const item of sequence){const last=counts[counts.length-1];if(last&&last[0]===item.originalSprite)last[1]++;else counts.push([item.originalSprite,1]);}
 requireFact(JSON.stringify(counts)===JSON.stringify(EXPECTED_SELECTOR_COUNTS),'selector run order differs from O224');
 // The source list pairs are original, separately from duration/activation.
 for(let i=0;i<6;i++){
  requireFact(u32(OBJECT2_IMAGE+0x14151+i*8)===0x22ffc+i*16,`paired source descriptor ${i}`);
  requireFact([0x14181,0x141c1,0x14201].includes(u32(OBJECT2_IMAGE+0x14155+i*8)),`paired source grid ${i}`);
 }
 return {sprites,sequence,counts,palette};
}
export async function buildMK2PitLowerWallP8(source:DirectorySource):Promise<P8PitLowerWallResult>{
 try {
  const entries=await source.listRecursive();
  const exeEntry=findOriginal(entries,'mk2.exe'),fallEntry=findOriginal(entries,'fall.gra');
  const exe=await source.readSlice(exeEntry.path,0,exeEntry.size),gra=await source.readSlice(fallEntry.path,0,fallEntry.size);
  requireFact(exe.length===861133&&await hash(exe)===EXE_SHA,'canonical MK2 executable SHA-256');
  requireFact(gra.length===250804&&await hash(gra)===FALL_SHA,'canonical FALL.GRA SHA-256');
  const r=decoder(exe,gra);
  const files:Array<{name:string;bytes:Uint8Array}>=[];
  const assets:Asset[]=[];
  const manifestSprites:Record<string,unknown>[]=[];
  for(const s of r.sprites){
   const folder=`FALL_sprite_${s.number}`;
   const png=encodeOriginalEffectRgbaPngO177(s.width,s.height,s.rgba);
   const paths={png:`images/${folder}.png`,indices:`indexed/${folder}.indices.bin`,mask:`indexed/${folder}.mask.bin`};
   files.push({name:paths.png,bytes:png},{name:paths.indices,bytes:s.indices},{name:paths.mask,bytes:s.mask});
   manifestSprites.push({sourceSprite:s.number,width:s.width,height:s.height,
    originalDescriptorPhysical:`0x${s.descriptorPhysical.toString(16).toUpperCase()}`,
    originalPackedGraOffset:s.graOffset,originalEncodedEndExclusive:s.graEnd,
    originalPaletteRecordPhysical:'0x895AC',sourcePaletteColorCount:81,paths});
   assets.push({id:`mk2-pit-fall-source:${s.number}:palette-linked`,
    name:`The Pit II · original ${s.number===54?'crack overlay':'wall tile'} ${s.number}`,
    group:'MK2 The Pit II · original lower-wall source',kind:'stage',
    format:'PNG · original source palette preview (runtime DAC not directly witnessed)',
    confidence:'O210/O214/O224: original source-linked 81-color palette and decoded sprite; runtime frame presentation unverified',
    source:{path:fallEntry.path,offset:s.graOffset,length:s.graEnd-s.graOffset,sha256:FALL_SHA},
    metadata:{stage:'pit_ii',sourceSprite:s.number,descriptorPhysical:s.descriptorPhysical,
     sourcePalettePhysical:PALETTE_OFFSET,originalSourcePaletteLinked:true,
     originalPaletteCorroboratedByDOSVideo:true,runtimeDACDirectlyObserved:false,
     originalSourceSelectorStepCount:s.number===54?0:r.sequence.filter(x=>x.originalSprite===s.number).length,
     sourceSequencePositionKnown:s.number!==54,originalSourceFPSKnown:false,
     finalStagePlacementKnown:false,actualPresentationObservedForEveryStep:false,
     indices:s.indices,mask:s.mask,
     use:s.number===54?'post-selector crack overlay source':'source-timed wall transition tile',
     evidence:'O210 source decoder; O214 palette holdout video; O224 original 32-step selector; O225 source tile placement scripts'},
    width:s.width,height:s.height,rgba:s.rgba,
    filename:`MK2_Pit_II_FALL_sprite_${s.number}_SOURCE_PALETTE.png`});
  }
  requireFact(assets.length===7,'exactly seven original source assets');
  const manifest={schema:'mk2_p8_pit_fall_lower_wall_original_source_v1',originalExeSHA256:EXE_SHA,originalFallGraSHA256:FALL_SHA,
    originalFullResourceStreamsDecoded:61,fullResourceTiled:true,palettePhysical:'0x895AC',paletteColorCount:81,
    paletteStatus:'ORIGINAL_EXE_LINK_AND_DOS_CAPTURE_CORROBORATION_NOT_LIVE_DAC',
    originalSelectorSteps:r.sequence,originalSelectorRuns:r.counts,
    selectorStepCount:32,sourceFPSKnown:false,sourceSchedulerYieldCountPerStep:1,
    elapsedRuntimeTimingKnown:false,actualRuntimeVisibilityOfSprite58Unknown:true,
    finalStageSceneReconstructed:false,sprites:manifestSprites,limitations:P8_PIT_LOWER_WALL_LIMITATION};
  files.push({name:'manifest.json',bytes:new TextEncoder().encode(JSON.stringify(manifest,null,2))});
  files.push({name:'README.md',bytes:new TextEncoder().encode('# The Pit II original FALL.GRA lower-wall source graphics — P8\n\n' +
    'Seven original sprite sources (54 crack; 55–60 changing lower wall) are supplied as source-palette RGBA PNG, exact index and alpha masks. ' +
    'The 32-entry original selector sequence is metadata only: NOT observed video frame timing. Sprite 58 occurs in the source list but was not selected by the older sampled O214 video frames. ' + P8_PIT_LOWER_WALL_LIMITATION+'\n')});
  return {assets,packages:[{name:'MK2_P8_PIT_II_SEVEN_ORIGINAL_LOWER_WALL_SOURCES.zip',bytes:buildStoredZip(files)}],status:{status:'VERIFIED',count:7}};
 }catch(error){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:String(error)}};}
}

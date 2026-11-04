/** P9: Six original PIT.GRA source-local setups, qualified by O205/O206/O208.
 * Mirrors O205's source renderer, without relying on video, camera fitting,
 * arbitrary stage composition, or gameplay timing. Source originals are read-only.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import {hash, utf8} from './model';
import {buildStoredZip} from '../research/researchArtifactDownloads';
import {encodeOriginalEffectRgbaPngO177} from '../../games/mk2/research/stageSourcePngO177';

const EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const PIT_SHA = 'af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96';
const OBJ1 = 0x61c54, OBJ2 = 0xa0c54, RESOURCE_ID = 32;
const SETUPS = [0x18b44,0x18b56,0x18b68,0x18b7a,0x18b8c,0x18b9e];
const EXPECTED_DIMS:ReadonlyArray<readonly [number,number]> = [[1400,64],[1400,768],[832,24],[376,120],[504,120],[320,120]];
export const MK2_P9_PIT_UPPER_LIMITATION =
  'P9 The Pit II contains six authenticated PIT.GRA source-local background setup canvases. ' +
  'EXE-linked original 81-color palette is a source-compatible preview, not a directly sampled runtime DAC. ' +
  'Setup-local positions are original; final inter-layer positioning, draw order, live mode, ' +
  'camera/parallax equations, bridge-actor placement and stage animation timing are NOT inferred.';

interface OriginalSprite {indices:Uint8Array; mask:Uint8Array; end:number; commands:number;}
interface Placement {ordinal:number;x:number;y:number;descriptorObject2:number;offset:number;width:number;height:number;commands:number;}
interface OriginalLayer {ordinal:number;object2Offset:number;width:number;height:number;rgba:Uint8Array;indices:Uint8Array;mask:Uint8Array;placements:Placement[];clipped:number;painted:number;}
export interface P9PitUpperResult {
 assets:Asset[];
 packages:Array<{name:string;bytes:Uint8Array}>;
 status:{status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string};
}
function must(ok:unknown, reason:string):asserts ok {if(!ok)throw Error(`P9 original Pit upper layer: ${reason}`);}
function findFile(entries:SourceFileEntry[],basename:string) {
 const matches=entries.filter(x=>x.name.toLowerCase()===basename);
 must(matches.length===1,`expected one ${basename}, found ${matches.length}`);
 return matches[0];
}
function decode(exe:Uint8Array,gra:Uint8Array):{layers:OriginalLayer[];paletteOffset:number;paletteCount:number} {
 const ev=new DataView(exe.buffer,exe.byteOffset,exe.byteLength);
 const gv=new DataView(gra.buffer,gra.byteOffset,gra.byteLength);
 const u16=(off:number)=>{must(off>=0&&off+2<=exe.length,'EXE uint16 out of range');return ev.getUint16(off,true);};
 const u32=(off:number)=>{must(off>=0&&off+4<=exe.length,'EXE uint32 out of range');return ev.getUint32(off,true);};
 const i16=(off:number)=>{must(off>=0&&off+2<=exe.length,'EXE int16 out of range');return ev.getInt16(off,true);};
 const paletteOffset=OBJ1+u32(OBJ2+0x18d40),paletteCount=u16(paletteOffset);
 must(paletteOffset===0x895ac&&paletteCount===81,'O205 original Pit palette record identity');
 const palette=new Uint8Array((paletteCount+1)*4);
 for(let i=1;i<=paletteCount;i++){
  const word=u16(paletteOffset+2*i);
  for(let j=0;j<3;j++){
   const dac = j===0?((word>>>9)&63)|1:j===1?((word>>>4)&63)|1:((word<<1)&63)|1;
   palette[i*4+j]=(dac<<2)|(dac>>>4);
  }
  palette[i*4+3]=255;
 }
 const cache=new Map<string,OriginalSprite>();
 const layers:OriginalLayer[]=[];
 for(let k=0;k<6;k++){
  const setup=SETUPS[k],s=OBJ2+setup,w=u16(s),h=u16(s+2),n=u16(s+4);
  const controls=u32(s+6),descriptors=u32(s+10);
  must(w===EXPECTED_DIMS[k][0]&&h===EXPECTED_DIMS[k][1]&&n>0&&n<128,`setup ${k+1} dimensions/control count`);
  must(OBJ2+controls>=0&&OBJ2+controls+8*n<=exe.length,'control array out of range');
  const rgba=new Uint8Array(w*h*4),indices=new Uint8Array(w*h),mask=new Uint8Array(w*h);
  const placements:Placement[]=[];let clipped=0,painted=0;
  for(let j=0;j<n;j++){
   const c=OBJ2+controls+j*8, flags=u16(c), x=i16(c+2),y=i16(c+4), p=u16(c+6);
   const slot=(flags&15)|((p&0xf000)>>>8);
   must(slot===2,`setup ${k+1} control ${j}: palette slot`);
   const descriptor=descriptors+(p&0xfff)*4,dp=OBJ2+descriptor;
   const dw=u16(dp),dh=u16(dp+2),packed=u32(dp+4);
   must((packed>>>24)===RESOURCE_ID,`setup ${k+1} control ${j}: resource ID`);
   const start=packed&0xffffff;
   must(dw>0&&dw<=896&&dh>0&&dh<=800&&dw*dh<=250000,`setup ${k+1} control ${j}: sprite dimensions`);
   const key=`${start}/${dw}/${dh}`;let sprite=cache.get(key);
   if(!sprite){
    const decoded=new Uint8Array(dw*dh),opacity=new Uint8Array(dw*dh);
    let cursor=start,commands=0;
    for(let row=0;row<dh;row++){
     let col=0;
     while(col<dw){
      must(cursor+4<=gra.length,`setup ${k+1} control ${j}: command exceeds GRA`);
      const cmd=gv.getUint32(cursor,true);cursor+=4;
      const count=(cmd&1)?(cmd>>>1):((cmd&2)?(cmd>>>10):(cmd>>>2));
      must(count>0&&count<=dw-col,`setup ${k+1} control ${j}: command row overflow`);
      const at=row*dw+col;
      if(!(cmd&1)){
       if(cmd&2){decoded.fill((cmd>>>2)&255,at,at+count);opacity.fill(1,at,at+count);}
       else{must(cursor+count<=gra.length,`setup ${k+1} control ${j}: literal overflow`);
        decoded.set(gra.subarray(cursor,cursor+count),at);opacity.fill(1,at,at+count);cursor+=(count+3)&~3;
       }
      }
      col+=count;must(++commands<250000,'command runaway');
     }
    }
    sprite={indices:decoded,mask:opacity,end:cursor,commands};cache.set(key,sprite);
   }
   for(let py=0;py<dh;py++)for(let px=0;px<dw;px++){
    const si=py*dw+px;if(!sprite.mask[si])continue;
    const tx=x+px,ty=y+py;
    if(tx<0||ty<0||tx>=w||ty>=h){clipped++;continue;}
    const di=ty*w+tx,ix=sprite.indices[si];
    must(ix<=paletteCount,`setup ${k+1} palette index exceeds source record`);
    rgba.set(palette.subarray(ix*4,ix*4+4),di*4);
    indices[di]=ix;mask[di]=1;painted++;
   }
   placements.push({ordinal:j,x,y,descriptorObject2:descriptor,offset:start,width:dw,height:dh,commands:sprite.commands});
  }
  layers.push({ordinal:k+1,object2Offset:setup,width:w,height:h,rgba,indices,mask,placements,clipped,painted});
 }
 return {layers,paletteOffset,paletteCount};
}
export async function buildMK2PitUpperLayersP9(source:DirectorySource):Promise<P9PitUpperResult> {
 try {
  const entries=await source.listRecursive();
  const exeEntry=findFile(entries,'mk2.exe'),pitEntry=findFile(entries,'pit.gra');
  const exe=await source.readSlice(exeEntry.path,0,exeEntry.size);
  const gra=await source.readSlice(pitEntry.path,0,pitEntry.size);
  must(exe.length===861133&&await hash(exe)===EXE_SHA,'canonical MK2.EXE checksum');
  must(gra.length===69384&&await hash(gra)===PIT_SHA,'canonical PIT.GRA checksum');
  const result=decode(exe,gra);
  const assets:Asset[]=[];
  const files:Array<{name:string;bytes:Uint8Array}>=[];
  const descriptors:Record<string,unknown>[]=[];
  for(const layer of result.layers){
   const name=`PIT_source_setup_${layer.ordinal}`;
   const png=encodeOriginalEffectRgbaPngO177(layer.width,layer.height,layer.rgba);
   const paths={png:`images/${name}.png`,indices:`indexed/${name}.indices.bin`,mask:`indexed/${name}.mask.bin`};
   files.push({name:paths.png,bytes:png},{name:paths.indices,bytes:layer.indices},{name:paths.mask,bytes:layer.mask});
   const metadata={sourceSetup:layer.ordinal,originalSetupObject2:layer.object2Offset,
    sourcePaletteRecordPhysical:'0x895AC',sourcePaletteColors:81,sourcePaletteRuntimeDACVerified:false,
    stageFullyComposed:false,finalInterLayerPositionsVerified:false,finalDrawOrderVerified:false,
    nativeAnimationTimingVerified:false,sourceLocalGeometryVerified:true,
    originalControlCount:layer.placements.length,originalPlacements:layer.placements,
    clippedSourcePixelWrites:layer.clipped,paintedSourcePixelWrites:layer.painted,
    indices:layer.indices,mask:layer.mask,
    sourceResearch:'O205 original indexed setup renderer; O206 original root; O208 source-to-video parallax controls'};
   assets.push({id:`mk2-pit-upper-setup:${layer.ordinal}:source-palette`,
    name:`The Pit II · original upper background setup ${layer.ordinal}`,
    group:'MK2 The Pit II · original upper source-local layers',kind:'stage',
    format:'PNG · original source-palette preview (runtime DAC not established)',
    confidence:'O205 source-verified layer + O208 video corroboration; NO complete stage composition',
    source:{path:pitEntry.path,offset:0,length:gra.length,sha256:PIT_SHA},
    metadata,width:layer.width,height:layer.height,rgba:layer.rgba,filename:`MK2_Pit_II_Upper_Setup_${layer.ordinal}.png`});
   descriptors.push({ordinal:layer.ordinal,sourceObject2:layer.object2Offset,
    canvas:[layer.width,layer.height],controls:layer.placements.length,
    clippedPixelWrites:layer.clipped,paintedPixelWrites:layer.painted,
    originalPlacements:layer.placements,paths});
  }
  must(assets.length===6,'six verified upper source-local setups required');
  files.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify({
   format:'mkdos_p9_pit_original_upper_setup_layers_v1',source:{exeSha256:EXE_SHA,pitGraSha256:PIT_SHA,resourceId:32},
   sourcePalettePhysical:'0x895AC',sourcePaletteCount:81,
   qualification:MK2_P9_PIT_UPPER_LIMITATION,commandMaskIsSourcePaintCoverageNotAlpha:true,
   paletteIndexZeroIsTransparentInRgbaPreview:true,sourceRootModeTwoContainsSix:true,
   sourceRootReducedModeContains:[1,2,6],runtimeStageModeKnown:false,
   fullStageComposed:false,originalAnimationTimingKnown:false,
   layers:descriptors},null,2))});
  files.push({name:'README.txt',bytes:utf8.encode(MK2_P9_PIT_UPPER_LIMITATION+'\nAll six setup canvases retain ORIGINAL setup-local source positions, not shared screen coordinates.\n')});
  return {assets,packages:[{name:'MK2_P9_PIT_II_SIX_ORIGINAL_UPPER_SETUP_LAYERS.zip',bytes:buildStoredZip(files)}],status:{status:'VERIFIED',count:6}};
 } catch(error){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,detail:String(error)}};}
}

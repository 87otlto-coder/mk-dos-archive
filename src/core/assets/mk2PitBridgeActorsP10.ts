/** P10: original Pit II far-bridge actor sprites and two source-loop lists.
 * Strict source extraction from unchanged O220/O221 fixture facts; no inferred
 * animation milliseconds, activation instant or complete stage composition.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash, utf8 } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { encodeOriginalEffectRgbaPngO177 } from '../../games/mk2/research/stageSourcePngO177';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const PIT_SHA='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96';
const OBJ1=0x61c54, OBJ2=0xa0c54;
const RESOURCE_ID=32, PALETTE_PHYSICAL=0x895ac, PALETTE_COUNT=81;
const DESCRIPTORS=[0xb98e4,0xb98f4,...Array.from({length:5},(_,i)=>0xb9900+i*12),
  0xb993c,0xb994c,...Array.from({length:5},(_,i)=>0xb9958+i*12)];
const LOOPS=[{name:'green',object2:0x18afc},{name:'flame',object2:0x18b20}] as const;
export const MK2_P10_PIT_BRIDGE_LIMITATION=
 'P10 Pit II far-bridge actors: 14 exact original PIT.GRA indexed frames in two seven-pose original EXE lists, '
 +'with a source-linked 81-color palette preview. The source lists loop, but per-pose millisecond duration, '
 +'live onset, final placement/draw order, runtime DAC state and complete on-screen scene assembly are NOT established.';

interface Frame {ordinal:number;actor:'green'|'flame';pose:number;descriptor:number;offset:number;end:number;
 width:number;height:number;indices:Uint8Array;mask:Uint8Array;rgba:Uint8Array;paintedPixels:number;}
export interface P10PitBridgeResult {
 assets:Asset[];
 packages:Array<{name:string;bytes:Uint8Array}>;
 status:{status:'VERIFIED'|'UNAVAILABLE';count:number;actorGroups:number;detail?:string};
}
function must(ok:unknown,msg:string):asserts ok{if(!ok)throw Error(`P10 original Pit bridge actors: ${msg}`);}
function one(entries:SourceFileEntry[],name:string):SourceFileEntry {
 const hits=entries.filter(e=>e.name.toLowerCase()===name);
 must(hits.length===1,`expected exactly one ${name}, found ${hits.length}`);
 return hits[0];
}
function decode(exe:Uint8Array,gra:Uint8Array){
 const ev=new DataView(exe.buffer,exe.byteOffset,exe.byteLength),gv=new DataView(gra.buffer,gra.byteOffset,gra.byteLength);
 const u16=(p:number)=>{must(p>=0&&p+2<=exe.length,'EXE 16-bit access out of bounds');return ev.getUint16(p,true);};
 const u32=(p:number)=>{must(p>=0&&p+4<=exe.length,'EXE 32-bit access out of bounds');return ev.getUint32(p,true);};
 const i16=(p:number)=>{must(p>=0&&p+2<=exe.length,'EXE signed16 access out of bounds');return ev.getInt16(p,true);};
 const checkCode=(p:number,h:string)=>{const b=Uint8Array.from(h.match(/../g)!.map(x=>parseInt(x,16)));
  must(exe.subarray(p,p+b.length).every((v,i)=>v===b[i]),`O221 original callback bytes at 0x${p.toString(16)}`);};
 must(u32(OBJ2+0x18d40)===PALETTE_PHYSICAL-OBJ1,'original palette pointer');
 must(u16(PALETTE_PHYSICAL)===PALETTE_COUNT,'original 81-color palette');
 const palette=new Uint8Array((PALETTE_COUNT+1)*3);
 for(let i=1;i<=PALETTE_COUNT;i++){
  const word=u16(PALETTE_PHYSICAL+i*2),c=[((word>>>9)&63)|1,((word>>>4)&63)|1,((word<<1)&63)|1];
  for(let j=0;j<3;j++)palette[i*3+j]=(c[j]<<2)|(c[j]>>>4);
 }
 must(DESCRIPTORS.length===14,'expected exactly fourteen source descriptors');
 // O221: exact original pointer lists: seven descriptor pointers, loop token 1,
 // and a typed-back-pointer value into the same list. Original EXE hash is pinned.
 const lists=[];
 for(let group=0;group<2;group++){
  const l=LOOPS[group],base=OBJ2+l.object2;
  for(let i=0;i<7;i++)must(u32(base+i*4)===DESCRIPTORS[group*7+i]-OBJ2,
   `${l.name} original descriptor pointer ${i}`);
  must(u32(base+28)===1,`${l.name} original loop token`);
  must(u32(base+32)===l.object2,`${l.name} original list back-pointer`);
  lists.push({actor:l.name,sourceListObject2:l.object2,descriptorPhysical:DESCRIPTORS.slice(group*7,group*7+7),
   orderedFrameOrdinals:Array.from({length:7},(_,i)=>group*7+i),terminatorToken:1,loopBackToStart:true});
 }
 // Source callback identity from O221, without interpreting six scheduler yields
 // as a real-time frame duration or claiming a live presentation trace.
 for(const [p,h] of [
   [0x831d8,'c7056c5a0700908c0100'],[0x831f2,'c705805a0700fc8a0100'],
   [0x831fc,'c7056c5a0700e88c0100'],[0x83210,'c705785a0700208b0100'],
   [0x8321a,'e8a63a0000'],[0x8323a,'e8863a0000'],
   [0x83254,'b806000000e8b13efeff'],[0x8325e,'ebba']
 ] as [number,string][])checkCode(p,h);
 must(exe.subarray(0x86cc5,0x86ccb).every((v,i)=>v===[0x8b,0x15,0x78,0x5a,0x07,0x00][i]),
  'original animation cursor reader identity');
 const frames:Frame[]=[];
 let previousEnd=61620;
 for(let i=0;i<14;i++){
  const d=DESCRIPTORS[i],w=u16(d),h=u16(d+2),packed=u32(d+8),atStart=packed&0xffffff;
  must(w===16&&h===(i<7?24:32),`descriptor ${i} native dimensions`);
  must(i16(d+4)===0&&i16(d+6)===0,`descriptor ${i} local X/Y`);
  must(packed>>>24===RESOURCE_ID,`descriptor ${i} resource ID`);
  must(atStart===previousEnd,`sprite ${i} original contiguous stream`);
  const indices=new Uint8Array(w*h),mask=new Uint8Array(w*h),rgba=new Uint8Array(w*h*4);
  let at=atStart,painted=0;
  for(let y=0;y<h;y++){
   let x=0;
   while(x<w){
    must(at+4<=gra.length,`sprite ${i} command range`);
    const cmd=gv.getUint32(at,true);at+=4;
    const n=(cmd&1)?(cmd>>>1):((cmd&2)?cmd>>>10:cmd>>>2);
    must(n>0&&n<=w-x,`sprite ${i} row overflow`);
    if(!(cmd&1)){
     if(cmd&2)indices.fill((cmd>>>2)&255,y*w+x,y*w+x+n);
     else{must(at+n<=gra.length,`sprite ${i} literal range`);
      indices.set(gra.subarray(at,at+n),y*w+x);at+=(n+3)&~3;
     }
     mask.fill(1,y*w+x,y*w+x+n);painted+=n;
    }
    x+=n;
   }
  }
  must(painted>0&&painted<w*h,`sprite ${i} contains image pixels and transparency`);
  for(let p=0;p<w*h;p++)if(mask[p]){
   const ci=indices[p];must(ci<=PALETTE_COUNT,`sprite ${i} palette index range`);
   rgba.set(palette.subarray(ci*3,ci*3+3),p*4);rgba[p*4+3]=255;
  }
  frames.push({ordinal:i,actor:i<7?'green':'flame',pose:i%7,descriptor:d,offset:atStart,end:at,
   width:w,height:h,indices,mask,rgba,paintedPixels:painted});
  previousEnd=at;
 }
 must(previousEnd===gra.length,'14 source sprite streams end exactly at PIT.GRA EOF');
 return {frames,lists,palette};
}
export async function buildMK2PitBridgeActorsP10(source:DirectorySource):Promise<P10PitBridgeResult>{
 try{
  const entries=await source.listRecursive(),exeEntry=one(entries,'mk2.exe'),pitEntry=one(entries,'pit.gra');
  const exe=await source.readSlice(exeEntry.path,0,exeEntry.size),gra=await source.readSlice(pitEntry.path,0,pitEntry.size);
  must(exe.length===861133&&await hash(exe)===EXE_SHA,'canonical executable identity');
  must(gra.length===69384&&await hash(gra)===PIT_SHA,'canonical PIT.GRA identity');
  const {frames,lists,palette}=decode(exe,gra);
  const assets:Asset[]=[],files:Array<{name:string;bytes:Uint8Array}>=[],manifestFrames:Record<string,unknown>[]=[];
  for(const frame of frames){
   const name=`PIT_bridge_${frame.actor}_${String(frame.pose+1).padStart(2,'0')}`;
   const paths={png:`images/${name}.png`,indices:`indexed/${name}.indices.bin`,mask:`indexed/${name}.mask.bin`};
   const png=encodeOriginalEffectRgbaPngO177(frame.width,frame.height,frame.rgba);
   files.push({name:paths.png,bytes:png},{name:paths.indices,bytes:frame.indices},{name:paths.mask,bytes:frame.mask});
   const metadata={sourceResearch:'O220 original source sprite decode; O221 original source list/callback',
    sourceActor:frame.actor,sourcePoseOrdinal:frame.pose,sourceFrameOrdinal:frame.ordinal,
    originalDescriptorPhysical:frame.descriptor,originalGraOffset:frame.offset,originalEncodedEndExclusive:frame.end,
    paintedPixels:frame.paintedPixels,originalListObject2:LOOPS[frame.ordinal<7?0:1].object2,
    originalLoopSize:7,sourceLoopEstablished:true,nativeFrameDurationVerified:false,liveActivationVerified:false,
    finalStagePlacementVerified:false,sourcePalettePhysical:'0x895AC',sourcePaletteCount:81,
    sourcePaletteRuntimeDACVerified:false,indices:frame.indices,mask:frame.mask};
   assets.push({id:`mk2-pit-bridge:${frame.actor}:${frame.pose}`,name:`The Pit II · bridge ${frame.actor} · pose ${frame.pose+1}`,
    group:`MK2 The Pit II · original bridge ${frame.actor} background actors`,kind:'sprite',
    format:'PNG · original source-palette preview (timing unverified)',
    confidence:'O220 original sprites + O221 original seven-pose loop; no live display timing',
    source:{path:pitEntry.path,offset:frame.offset,length:frame.end-frame.offset,sha256:PIT_SHA},
    metadata,width:frame.width,height:frame.height,rgba:frame.rgba,filename:`${name}.png`});
   manifestFrames.push({actor:frame.actor,ordinal:frame.ordinal,pose:frame.pose,originalDescriptorPhysical:frame.descriptor,
    originalGraOffset:frame.offset,originalEncodedEndExclusive:frame.end,width:frame.width,height:frame.height,
    paintedPixels:frame.paintedPixels,paths});
  }
  must(assets.length===14,'all fourteen source frames required');
  files.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify({format:'mkdos_p10_pit_ii_bridge_original_actors_v1',
   source:{exeSha256:EXE_SHA,pitGraSha256:PIT_SHA,resourceId:RESOURCE_ID},
   originalPalette:{physical:'0x895AC',colorCount:PALETTE_COUNT,rgb:Array.from(palette)},
   originalFrameLists:lists,frames:manifestFrames,sourceCallbackLiteralSchedulerYieldCount:6,
   sourceLoopEstablished:true,nativeFrameDurationsKnown:false,liveActivationKnown:false,finalStageCompositionKnown:false,
   qualification:MK2_P10_PIT_BRIDGE_LIMITATION},null,2))});
  files.push({name:'README.txt',bytes:utf8.encode(MK2_P10_PIT_BRIDGE_LIMITATION+'\n'+
   'Frame lists are original EXE ordering; play with user-selected presentation timing only.\n')});
  return {assets,packages:[{name:'MK2_P10_PIT_II_ORIGINAL_BRIDGE_ACTOR_FRAMES.zip',bytes:buildStoredZip(files)}],
   status:{status:'VERIFIED',count:14,actorGroups:2}};
 }catch(error){return {assets:[],packages:[],status:{status:'UNAVAILABLE',count:0,actorGroups:0,detail:String(error)}};}
}

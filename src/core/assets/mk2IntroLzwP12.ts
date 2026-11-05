/** P12: original MK2 PROBE/ACCLAIM introductory LZW graphics.
 * Reuses the independently verified O110B index decoder and O110E source-DAC6
 * palette *grammar* without implying an observed live palette bank/colour0.
 * 
 * No original commercial resources are bundled; all input is read locally.
 */
import type { DirectorySource, SourceFileEntry } from '../filesystem/DirectorySource';
import type { Asset } from './model';
import { hash } from './model';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const SPECS = [
 {name:'probe.gra',size:327672,sha:'4e1a30228a05103972ca3838acd76b6bafcc4c4af91e341789a1d84b9338f186',frames:30,paletteGroups:4,paletteWords:255,pixelsStart:520},
 {name:'acclaim.gra',size:2036,sha:'d95976f318b22266d38511285d5a623def4c3761889a230c2dd80465eef2672e',frames:1,paletteGroups:1,paletteWords:40,pixelsStart:84},
] as const;
const W=320,H=200,PIXELS=W*H;
export const MK2_P12_INTRO_LIMITATION =
 'PROBE.GRA and ACCLAIM.GRA: exact O110B original LZW index planes in source order. ' +
 'O110E native source DAC6 color words are shown with conditional one-based bank assumption. ' +
 'Magenta means palette UNQUALIFIED (including index 0); actual live allocator, DAC state, ' +
 'presentation speed and timing are not verified. These intros are not stage backgrounds.';
export type P12IntroResult={assets:Asset[];status:{status:'VERIFIED'|'UNAVAILABLE';count:number;detail?:string}};
function need(ok:unknown, msg:string):asserts ok{if(!ok)throw Error(`P12 MK2 intro: ${msg}`);}
function one(files:SourceFileEntry[],name:string){
 const a=files.filter(f=>f.name.toLowerCase()===name);
 need(a.length===1,`expected exactly one ${name}, found ${a.length}`);return a[0];
}
function u16(b:Uint8Array,at:number){need(at+2<=b.length,'palette word truncated');return b[at]|(b[at+1]<<8);}
/** Native GIF-style 8-bit LZW in DOS source subblocks; 9–12 bit LSB-first. */
function lzw(data:Uint8Array):Uint8Array{
 const out=new Uint8Array(PIXELS),dictionary:Array<Uint8Array|undefined>=new Array(4096);
 const reset=()=>{dictionary.fill(undefined);for(let i=0;i<256;i++)dictionary[i]=Uint8Array.of(i);};
 reset();let width=9,next=258,prev:Uint8Array|undefined;
 let at=0,bitbuf=0,bits=0,written=0,stops=0;
 while(true){
  while(bits<width){need(at<data.length,'missing LZW end code');bitbuf|=data[at++]<<bits;bits+=8;}
  const code=bitbuf&((1<<width)-1);bitbuf>>>=width;bits-=width;
  if(code===256){reset();width=9;next=258;prev=undefined;continue;}
  if(code===257){stops++;break;}
  const entry = dictionary[code] ?? (code===next && prev ? Uint8Array.from([...prev,prev[0]]) : undefined);
  need(entry && entry.length>0,`invalid LZW code ${code}`);
  need(written+entry.length<=PIXELS,'decoded frame exceeds 320x200');
  out.set(entry,written);written+=entry.length;
  if(prev && next<4096){
   const pair=new Uint8Array(prev.length+1);pair.set(prev);pair[prev.length]=entry[0];dictionary[next++]=pair;
   if(next===(1<<width) && width<12)width++;
  }
  prev=entry;
 }
 need(stops===1&&written===PIXELS,'LZW frame length/end code mismatch');
 return out;
}
function decodeFrames(src:Uint8Array,start:number,count:number,finalTerminated:boolean){
 const frames:Array<{index:Uint8Array;sourceFrameStart:number;compressedStart:number;compressedEnd:number;encodedEnd:number;terminatedByZeroSubblock:boolean}>=[];
 let at=start;
 for(let ordinal=0;ordinal<count;ordinal++){
  const head=at;need(at+5<=src.length,'truncated frame header');
  need(src[at]===0x40&&src[at+1]===0x01&&src[at+2]===0xc8&&src[at+3]===0&&src[at+4]===8,`frame ${ordinal} 320x200 / LZW marker mismatch`);
  at+=5;
  const compressedStart=head+4,parts:Uint8Array[]=[];let total=0,terminated=false;
  while(at<src.length){
   const length=src[at++];if(length===0){terminated=true;break;}
   need(at+length<=src.length,'truncated source LZW subblock');
   parts.push(src.subarray(at,at+length));at+=length;total+=length;
  }
  need(total>0,'empty original LZW subblocks');
  const payload=new Uint8Array(total);let p=0;for(const part of parts){payload.set(part,p);p+=part.length;}
  const index=lzw(payload),compressedEnd=at;
  if(ordinal<count-1){
   need(terminated,'missing intermediate zero terminator');
   let pad=0;while(at<src.length&&src[at]===0){at++;pad++;}
   need(pad===1||pad===2,`source inter-frame zero padding ${pad}`);
  } else {
   need(terminated===finalTerminated&&at===src.length,'final native LZW terminator does not match O110B source');
  }
  frames.push({index,sourceFrameStart:head,compressedStart,compressedEnd,encodedEnd:at,terminatedByZeroSubblock:terminated});
 }
 need(at===src.length,'unaccounted original image bytes');return frames;
}
function palette(src:Uint8Array,spec:typeof SPECS[number]){
 const groups=u16(src,0);need(groups===spec.paletteGroups,`palette group count in ${spec.name}`);
 let p=2;const words:number[]=[];const recordCounts:number[]=[];
 for(let g=0;g<groups;g++){
  const count=u16(src,p);p+=2;need(count>0&&count<=255,`palette group ${g} count`);
  recordCounts.push(count);
  for(let i=0;i<count;i++){words.push(u16(src,p));p+=2;}
 }
 need(words.length===spec.paletteWords&&p===spec.pixelsStart,`palette / first frame boundary in ${spec.name}`);
 need(JSON.stringify(recordCounts)===(spec.name==='probe.gra'?'[64,64,64,63]':'[40]'),'original O110E palette record partition');
 const dac6=new Uint8Array(words.length*3),rgb8=new Uint8Array(words.length*3);
 for(let i=0;i<words.length;i++){
  const word=words[i],v=[((word>>>9)&63)|1,((word>>>4)&63)|1,((word<<1)&63)|1];
  for(let c=0;c<3;c++){dac6[i*3+c]=v[c];rgb8[i*3+c]=Math.floor(v[c]*255/63);}
 }
 return {words:new Uint16Array(words),recordCounts,dac6,rgb8};
}
export async function buildMK2IntroLzwP12(source:DirectorySource):Promise<P12IntroResult>{
 try{
  const entries=await source.listRecursive(),ex=one(entries,'mk2.exe');
  const exe=await source.readSlice(ex.path,0,ex.size);
  need(exe.length===861133&&await hash(exe)===EXE_SHA,'canonical original EXE required');
  // O110E original DAC6 code bytes: do not silently substitute RGB555.
  for(const [pos,hex] of [[0x7b3b1,'66ad'],[0x7b3b5,'c1e809'],[0x7b3ba,'0c01'],[0x7b3c1,'c1e804'],[0x7b3c6,'0c01'],[0x7b3cd,'d1e0'],[0x7b3d1,'0c01']] as const){
   need(Array.from(exe.subarray(pos,pos+hex.length/2),v=>v.toString(16).padStart(2,'0')).join('')===hex,`DAC6 EXE code ${pos.toString(16)}`);
  }
  const assets:Asset[]=[];
  for(const spec of SPECS){
   const e=one(entries,spec.name),src=await source.readSlice(e.path,0,e.size);
   need(src.length===spec.size&&await hash(src)===spec.sha,`original ${spec.name} identity`);
   const pal=palette(src,spec),frames=decodeFrames(src,spec.pixelsStart,spec.frames,spec.name==='acclaim.gra');
   for(let ordinal=0;ordinal<frames.length;ordinal++){
    const f=frames[ordinal],rgba=new Uint8Array(PIXELS*4),known=new Uint8Array(PIXELS),opacity=new Uint8Array(PIXELS);opacity.fill(1);
    let unknownZero=0,unknownOver=0;
    for(let i=0;i<PIXELS;i++){
     const idx=f.index[i],at=i*4;
     if(idx===0){unknownZero++;rgba[at]=255;rgba[at+2]=255;}
     else if(idx>pal.words.length){unknownOver++;rgba[at]=255;rgba[at+2]=255;}
     else {
      known[i]=1;rgba.set(pal.rgb8.subarray((idx-1)*3,idx*3),at);
     }
     rgba[at+3]=255;
    }
    const label=spec.name==='probe.gra'?'Probe intro':'Acclaim intro',stem=String(ordinal).padStart(2,'0');
    assets.push({id:`mk2-intro-lzw:${spec.name}:${ordinal}`,name:`${label} · original frame ${stem}`,
     group:`MK2 original intro LZW · ${spec.name.toUpperCase()}`,kind:'image',
     format:'PNG · exact native 320×200 indices; conditional DAC6 color preview',
     confidence:'O110B source-exact LZW indices; O110E source DAC6 arithmetic. Index0 and palette bank runtime UNKNOWN',
     source:{path:e.path,offset:f.sourceFrameStart,length:f.encodedEnd-f.sourceFrameStart,sha256:spec.sha},
     metadata:{stage:false,intro:true,sourceOrdinal:ordinal,originalFrameHeaderOffset:f.sourceFrameStart,
      originalCompressedStart:f.compressedStart,originalCompressedEnd:f.compressedEnd,
      originalLzwTerminatedByZeroSubblock:f.terminatedByZeroSubblock,
      paletteRecordCounts:pal.recordCounts,sourcePaletteCount:pal.words.length,
      paletteSourceWordStart:4,originalPaletteWords:Array.from(pal.words),sourceNativeDAC6:Array.from(pal.dac6),
      rgb8DisplayScaling:'floor(DAC6*255/63); NOT live display capture',
      paletteBankAssumption:'ONE-BASED DIAGNOSTIC ONLY',paletteIndex0Qualified:false,
      unknownIndex0PixelCount:unknownZero,unknownOtherPixelCount:unknownOver,
      frameIntervalMillisecondsKnown:false,sourceOrderOnly:true,
      indices:f.index,mask:opacity,paletteKnownMask:known,
      provenance:'O110B original LZW 31 frames / O110E original DAC6 source palette words'},
     width:W,height:H,rgba,filename:`MK2_${spec.name.split('.')[0]}_intro_source_frame_${stem}_DAC6_CONDITIONAL.png`});
   }
  }
  need(assets.length===31,'expected 31 original intro frames');
  return {assets,status:{status:'VERIFIED',count:assets.length}};
 }catch(error){return {assets:[],status:{status:'UNAVAILABLE',count:0,detail:String(error)}};}
}

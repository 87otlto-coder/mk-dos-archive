import { createHash } from 'node:crypto';
import { readdir, open, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const SPECS = [
 {name:'probe.gra',size:327672,sha:'4e1a30228a05103972ca3838acd76b6bafcc4c4af91e341789a1d84b9338f186',frames:30,paletteGroups:4,paletteWords:255,pixelsStart:520},
 {name:'acclaim.gra',size:2036,sha:'d95976f318b22266d38511285d5a623def4c3761889a230c2dd80465eef2672e',frames:1,paletteGroups:1,paletteWords:40,pixelsStart:84},
] as const;
const W=320,H=200,PIXELS=W*H;
function need(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
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
export function decodeFrames(src:Uint8Array,start:number,count:number,finalTerminated:boolean){
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

export const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');

export async function verified(root: string, name: string, size: number, digest: string) {
  const matches = (await readdir(root)).filter(entry => entry.toLowerCase() === name);
  need(matches.length === 1, `Expected exactly one ${name}`);
  const file = await open(join(root, matches[0]), 'r');
  try {
    const stat = await file.stat();
    need(stat.isFile() && stat.size === size, `${name}: unexpected input size`);
    const bytes = Buffer.alloc(size);
    const { bytesRead } = await file.read(bytes, 0, size, 0);
    need(bytesRead === size && sha(bytes) === digest, `${name}: fingerprint mismatch`);
    return bytes;
  } finally {
    await file.close();
  }
}

export async function identify(root: string) {
  await verified(root, 'mk2.exe', 861133, EXE_SHA);
  return { game: 'MK2 DOS', file: 'mk2.exe', bytes: 861133, sha256: EXE_SHA };
}

export async function intro(root: string, name: string) {
  const spec = SPECS.find(spec => spec.name === name);
  need(spec, `Unsupported intro resource: ${name}`);
  const executable = await identify(root);
  const source = await verified(root, name, spec.size, spec.sha);
  const color = palette(source, spec);
  return decodeFrames(source, spec.pixelsStart, spec.frames, name === 'acclaim.gra').map(
    ({index, ...frame}, ordinal) => ({
      indices: index,
      opacity: new Uint8Array(index.length).fill(1),
      metadata: {
        schema: 1, id: `mk2:intro:${name}:${ordinal}`, ordinal, width: W, height: H,
        source: { name, sha256: spec.sha, bytes: spec.size, executable, ...frame },
        compression: 'DOS subblocks, LSB-first LZW 9–12 bits',
        evidence: 'VERIFIED', decoder: 'P12/O110B', runtimePalette: 'UNKNOWN',
        palette: { evidence: 'VERIFIED', sourceOffset: 0, endExclusive: spec.pixelsStart,
          packing: 'O110E counted DAC6 words', counts: color.recordCounts,
          words: Array.from(color.words), dac6: Array.from(color.dac6) },
        runtimeTiming: 'UNKNOWN'
      }
    })
  );
}

export type Asset = { indices: Uint8Array; opacity: Uint8Array;
  metadata: { width: number; height: number; [field: string]: unknown } };

export async function writeAsset(output: string, asset: Asset, preview?: Uint8Array) {
  const contents = [
    ['indices.bin', asset.indices], ['opacity.bin', asset.opacity]
  ] as const;
  await mkdir(output);
  for (const [name, data] of contents) await writeFile(join(output, name), data, {flag: 'wx'});
  if (preview) await writeFile(join(output, 'preview.pam'), preview, {flag: 'wx'});
  await writeFile(join(output, 'metadata.json'), JSON.stringify({
    ...asset.metadata, sha256: Object.fromEntries(contents.map(([name, data]) => [name, sha(data)]))
  }, null, 2) + '\n', {flag: 'wx'});
}

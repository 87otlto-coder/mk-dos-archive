import { view } from '../../core/assets/model';
import { MfilChunk } from './container';

// MK3.EXE physical 0xC0C4C dispatch, consumed by 0xC0CA0 -> 0xD1BD4.
const bitDepths = [5,4,4,3,3,7,7,3,2,2,2,3,4,4,6,3,7,2,6,4,6];
export function decodeMK3Sprite(data: Uint8Array, expandedSize: number, width: number, height: number, mode: number) {
  if (mode >= bitDepths.length || mode < 0 || !width || !height || width * height > 1000000 || expandedSize > 2000000 || expandedSize < 2) throw new Error('Unsupported MK3 frame');
  const v = view(data); let bit = 0, out = 0;
  const expanded = new Uint8Array(expandedSize), depth = bitDepths[mode];
  function bits(n: number) {
    let value = 0;
    for (let i=0;i<n;i++) {
      const word = Math.floor(bit / 32) * 4;
      if (word + 4 > data.length) throw new Error('Truncated MK3 frame bitstream');
      value = value * 2 + ((v.getUint32(word,true) >>> (31-(bit%32))) & 1); bit++;
    }
    return value;
  }
  function put(x:number) { if (out >= expanded.length) throw new Error('MK3 expanded frame overflow'); expanded[out++] = x & 255; }
  while (out < expandedSize) {
    const skip = !bits(1) ? bits(5) : !bits(1) ? bits(3) : !bits(1) ? bits(6) : !bits(1) ? bits(7) : bits(8);
    put(skip);
    const count = !bits(1) ? 0 : !bits(1) ? bits(4) : bits(8); put(count);
    if (!count) continue;
    let color = bits(depth); put(color);
    for (let i=1;i<count;i++) {
      if (depth === 2) color = bits(2);
      else if (bits(1)) { if (bits(1)) color = bits(depth); else color = (color + (bits(1) ? 1 : -1)) & 255; }
      put(color);
    }
  }
  const indices = new Uint8Array(width*height), mask = new Uint8Array(indices.length); let p=0;
  for (let y=0;y<height;y++) {
    let x=0;
    for (;;) {
      if (p+2>expanded.length) throw new Error('MK3 row terminator missing');
      const skip=expanded[p++],count=expanded[p++]; x+=skip;
      if (x>width || x+count>width || p+count>expanded.length) throw new Error('MK3 row exceeds frame dimensions');
      if (!count) break;
      indices.set(expanded.subarray(p,p+count),y*width+x);mask.fill(1,y*width+x,y*width+x+count);p+=count;x+=count;
    }
  }
  if (p!==expandedSize) throw new Error('MK3 expanded frame not exactly consumed');
  // The compressor stores complete little-endian dwords, with a possible extra lookahead word.
  const consumedBytes = Math.ceil(bit / 32)*4;
  if (data.length-consumedBytes>4) throw new Error('MK3 compressed frame has unexplained trailing bytes');
  return { indices,mask,expanded,bitsConsumed:bit,consumedBytes,bitDepth:depth };
}

export function extractMK3Sprites(chunks:MfilChunk[]) {
  const frames = [], failures:Array<{header:string;index:number;error:string}>=[];
  for (const hdr of chunks.filter(c=>c.tag==='FHDS')) {
    if(hdr.size%36) throw new Error('MK3 frame header stride mismatch');
    const v=view(hdr.bytes), model=Number(hdr.name.slice(-1));
    for(let p=0;p<hdr.size;p+=36) {
      const width=v.getUint16(p,true),height=v.getUint16(p+2,true),x=v.getInt16(p+4,true),y=v.getInt16(p+6,true),expandedSize=v.getUint32(p+12,true),offset=v.getUint32(p+20,true),compression=v.getUint32(p+24,true),length=v.getUint32(p+28,true),mode=v.getUint16(p+32,true),group=v.getUint16(p+34,true);
      const chunkName=`FrDt${String(group-1).padStart(2,'0')}${String(model).padStart(2,'0')}`,payload=chunks.find(c=>c.tag==='FDAT'&&c.name===chunkName);
      try {
        if(compression!==1 || !payload || offset+length>payload.size)throw new Error('MK3 frame data join/compression unsupported');
        const decoded=decodeMK3Sprite(payload.bytes.subarray(offset,offset+length),expandedSize,width,height,mode);
        frames.push({header:hdr.name,index:p/36,headerOffset:hdr.payloadOffset+p,width,height,x,y,mode,group,model,expandedSize,chunkName,offset:payload.payloadOffset+offset,length,...decoded});
      }catch(e){failures.push({header:hdr.name,index:p/36,error:e instanceof Error?e.message:String(e)});}
    }
  }
  return {frames,failures};
}

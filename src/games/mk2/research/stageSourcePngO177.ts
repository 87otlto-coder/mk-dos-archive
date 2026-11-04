/** O177 browser- and Node-compatible deterministic RGBA PNG; no npm runtime. */
const encoder=new TextEncoder();
function u32be(n:number){return new Uint8Array([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);}
function concat(parts:Uint8Array[]){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function adler32(bytes:Uint8Array){let a=1,b=0;for(const x of bytes){a=(a+x)%65521;b=(b+a)%65521;}return ((b<<16)|a)>>>0;}
function chunk(type:string,data:Uint8Array){const t=encoder.encode(type),body=concat([t,data]);return concat([u32be(data.length),body,u32be(crc32(body))]);}
/** Deterministic browser-safe zlib stream using DEFLATE stored blocks. */
function zlibStored(bytes:Uint8Array){const parts:Uint8Array[]=[new Uint8Array([0x78,0x01])];let o=0;while(o<bytes.length){const len=Math.min(65535,bytes.length-o),final=o+len===bytes.length;parts.push(new Uint8Array([final?1:0,len&255,(len>>>8)&255,(~len)&255,((~len)>>>8)&255]));parts.push(bytes.subarray(o,o+len));o+=len;}if(bytes.length===0)parts.push(new Uint8Array([1,0,0,255,255]));parts.push(u32be(adler32(bytes)));return concat(parts);}
export function encodeOriginalEffectRgbaPngO177(width:number,height:number,rgba:Uint8Array){if(rgba.length!==width*height*4)throw new Error('O177 PNG RGBA length mismatch');const row=width*4+1,raw=new Uint8Array(row*height);for(let y=0;y<height;y++){const ro=y*row;raw[ro]=0;raw.set(rgba.subarray(y*width*4,(y+1)*width*4),ro+1);}const ihdr=new Uint8Array(13);ihdr.set(u32be(width),0);ihdr.set(u32be(height),4);ihdr[8]=8;ihdr[9]=6;return concat([new Uint8Array([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlibStored(raw)),chunk('IEND',new Uint8Array(0))]);}


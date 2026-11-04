import { DirectorySource,SourceFileEntry,extractExtension } from './DirectorySource';
interface Entry extends SourceFileEntry {offset:number;compressed:number;method:number;crc:number}
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const x of bytes){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
/** ZIP store/deflate source. Reads only; no archive paths are written to disk. */
export class ZipDirectorySource implements DirectorySource {
  readonly isSynthetic=false;private entries=new Map<string,Entry>();private cache=new Map<string,Promise<Uint8Array>>();
  constructor(readonly directoryName:string,private bytes:Uint8Array){
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let eocd=-1;
    for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(v.getUint32(p,true)===0x06054b50&&p+22+v.getUint16(p+20,true)===bytes.length){eocd=p;break;}
    if(eocd<0)throw new Error('ZIP directory not found');
    const count=v.getUint16(eocd+10,true),size=v.getUint32(eocd+12,true),start=v.getUint32(eocd+16,true);
    if(v.getUint16(eocd+4,true)||v.getUint16(eocd+6,true)||v.getUint16(eocd+8,true)!==count||count===65535||start+size!==eocd)throw new Error('Split/ZIP64 archives are not supported');
    let p=start,total=0;const names=new Set<string>();
    for(let i=0;i<count;i++){
      if(p+46>eocd||v.getUint32(p,true)!==0x02014b50)throw new Error('Invalid ZIP central directory');
      const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),crc=v.getUint32(p+16,true),compressed=v.getUint32(p+20,true),length=v.getUint32(p+24,true),n=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),offset=v.getUint32(p+42,true);
      if(p+46+n+extra+comment>eocd||flags&1||![0,8].includes(method)||v.getUint16(p+34,true))throw new Error('Unsupported/encrypted ZIP entry');
      const path=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(p+46,p+46+n)).replace(/\\/g,'/');p+=46+n+extra+comment;
      if(path.startsWith('/')||path.includes(':')||path.split('/').some(x=>x==='..'||x==='.')||path.includes('\0'))throw new Error('Unsafe archive path');
      if(path.endsWith('/'))continue;
      if(names.has(path.toUpperCase()))throw new Error('Duplicate archive path');names.add(path.toUpperCase());
      if(offset+30>start||v.getUint32(offset,true)!==0x04034b50||v.getUint16(offset+8,true)!==method)throw new Error('Invalid ZIP local header');
      const localNameLength=v.getUint16(offset+26,true),payload=offset+30+localNameLength+v.getUint16(offset+28,true);
      const localName=new TextDecoder().decode(bytes.subarray(offset+30,offset+30+localNameLength)).replace(/\\/g,'/');
      if(localName!==path||payload+compressed>start)throw new Error('ZIP entry bounds/name mismatch');
      total+=length;if(total>512*1024*1024||length>128*1024*1024)throw new Error('Archive exceeds supported size (512 MiB total / 128 MiB per file)');
      const name=path.split('/').at(-1)!;this.entries.set(path,{path,name,extension:extractExtension(name),size:length,offset:payload,compressed,method,crc});
    }
    if(p!==start+size)throw new Error('ZIP directory length mismatch');
    this.stripGameWrapperDirectory();
  }
  private stripGameWrapperDirectory(){
    const paths=[...this.entries.keys()];
    if(!paths.length)return;
    const first=paths[0].split('/')[0];
    if(!first||paths.some(path=>!path.startsWith(first+'/')))return;
    const upper=new Set(paths.map(path=>path.toUpperCase()));
    if(!['MK1.EXE','MK2.EXE','MK3.EXE'].some(exe=>upper.has(`${first}/${exe}`.toUpperCase())))return;
    const next=new Map<string,Entry>(),seen=new Set<string>();
    for(const [path,entry] of this.entries){
      const stripped=path.slice(first.length+1),key=stripped.toUpperCase();
      if(!stripped||seen.has(key))throw new Error('Duplicate archive path after root normalization');
      seen.add(key);next.set(stripped,{...entry,path:stripped,name:stripped.split('/').at(-1)!});
    }
    this.entries=next;
  }
  async listRecursive(){return [...this.entries.values()].map(({path,name,extension,size})=>({path,name,extension,size}));}
  async readSlice(path:string,offset:number,length:number){
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0)throw new Error('Invalid read range');
    const e=this.entries.get(path);if(!e)throw new Error('Archive file missing');
    if(!this.cache.has(path))this.cache.set(path,this.inflate(e));
    return (await this.cache.get(path)!).slice(offset,offset+length);
  }
  private async inflate(e:Entry){
    const compressed=this.bytes.slice(e.offset,e.offset+e.compressed);let bytes=compressed;
    if(e.method===8){const reader=new Blob([compressed.buffer]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),parts:Uint8Array[]=[];let size=0;
      try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>e.size)throw new Error('ZIP expanded size exceeded');parts.push(value);}}catch(error){await reader.cancel();throw error;}
      bytes=new Uint8Array(size);let p=0;for(const part of parts){bytes.set(part,p);p+=part.length;}
    }
    if(bytes.length!==e.size||crc32(bytes)!==e.crc)throw new Error(`ZIP integrity check failed: ${e.path}`);return bytes;
  }
}

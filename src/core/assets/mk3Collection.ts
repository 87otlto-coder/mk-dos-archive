import { DirectorySource } from '../filesystem/DirectorySource';
import { Asset, AssetCollection, hash, safeName, textAt, view } from './model';
import { decodeIff } from './iff';
import { parseWave } from './wave';
import { parseMfil } from '../../games/mk3/container';
import { extractMK3Sprites } from '../../games/mk3/sprites';

export function indexedRgba(indices:Uint8Array,mask:Uint8Array) {
  const rgba=new Uint8Array(indices.length*4);
  for(let i=0;i<indices.length;i++){const c=32+Math.round(indices[i]*223/255);rgba.set([c,c,c,mask[i]?255:0],i*4);}return rgba;
}
export async function scanMK3(source:DirectorySource,progress:(s:string)=>void,signal?:AbortSignal):Promise<AssetCollection> {
  const assets:Asset[]=[], reports:Record<string,unknown>={}, limitations=['Fighter sprite palettes, gameplay animation names/timing and full stage placement are unresolved. Sprite previews show index values in grayscale.', 'IFF pictures retain their explicit embedded palettes; they are individual source images, not a claim of assembled gameplay stages.'];
  const entries=await source.listRecursive(),containers=[],pictures=[],failures:unknown[]=[];
  const addWave=(path:string,bytes:Uint8Array,offset:number,name:string,group:string)=>{
    const info=parseWave(bytes);assets.push({id:`${path}@${offset}`,name,group,kind:'audio',format:'WAV',confidence:'Validated RIFF/PCM resource',source:{path,offset,length:bytes.length},metadata:info,bytes:bytes.slice(),mime:'audio/wav',filename:`${safeName(path)}_${offset.toString(16)}.wav`});
  };
  for(const e of entries) {
    signal?.throwIfAborted(); if(!['FTR','ASG','MK3','OGG','CUE'].includes(e.extension))continue;
    progress(`Reading ${e.path}`); const bytes=await source.readSlice(e.path,0,e.size),sha256=await hash(bytes);
    if(e.extension==='OGG') {
      if(textAt(bytes,0,4)!=='OggS')throw new Error(`Invalid Ogg stream: ${e.path}`);
      assets.push({id:e.path,name:e.name,group:'CD music',kind:'music',format:'OGG',confidence:'Original installation music track',source:{path:e.path,offset:0,length:e.size,sha256},metadata:{cueAssociation:'See original CUE resource; track names are not gameplay event names'},bytes,mime:'audio/ogg',filename:e.name});
    }else if(e.extension==='FTR') {
      const chunks=parseMfil(bytes),sprites=extractMK3Sprites(chunks);
      containers.push({path:e.path,sha256,byteLength:e.size,chunks:chunks.map(({bytes,...c})=>c),frameCount:sprites.frames.length,frameFailures:sprites.failures});
      failures.push(...sprites.failures.map(f=>({path:e.path,...f})));
      for(const f of sprites.frames)assets.push({id:`${e.path}:${f.header}:${f.index}`,name:`${e.name} / ${f.header} / ${f.index}`,group:`${e.name} · ${f.header}`,kind:'sprite',format:'Indexed sprite',confidence:'Decoded; palette unresolved',source:{path:e.path,offset:f.offset,length:f.length,sha256},metadata:{headerOffset:f.headerOffset,descriptorIndex:f.index,descriptorX:f.x,descriptorY:f.y,mode:f.mode,group:f.group,model:f.model,expandedSize:f.expandedSize,bitDepth:f.bitDepth,indices:f.indices,mask:f.mask,palette:'UNKNOWN',visualization:'GRAYSCALE_INDEX_MAP'},width:f.width,height:f.height,rgba:indexedRgba(f.indices,f.mask),filename:`${safeName(e.name)}_${f.header}_${f.index}_index-preview.png`});
      for(const c of chunks) {
        if(['SPEC','CLAS'].includes(c.tag)) {
          let p=0,index=0;
          while(p<c.bytes.length) {
            if(p+12>c.bytes.length)throw new Error('Truncated MK3 sample container');
            const n=view(c.bytes).getUint32(p+4,true)+8;
            if(n>c.bytes.length-p)throw new Error('MK3 sample exceeds container');
            addWave(e.path,c.bytes.subarray(p,p+n),c.payloadOffset+p,`${e.name} / ${c.name} / ${index++}`,`${e.name} · sound`);p+=n+(n&1);
          }
        }
        // Every chunk remains available for lossless export, including unknown fields.
        assets.push({id:`${e.path}:chunk:${c.offset}`,name:`${e.name} / ${c.name}`,group:`${e.name} · source chunks`,kind:'raw',format:c.tag,confidence:'Checksum and directory verified',source:{path:e.path,offset:c.offset,length:c.size+32,sha256},metadata:{payloadOffset:c.payloadOffset,checksum:c.checksum},bytes:bytes.slice(c.offset,c.offset+c.size+32),filename:`${safeName(e.name)}_${c.name}.${c.tag.toLowerCase()}`});
      }
    }else if(e.extension==='ASG') {
      let p=0,i=0;while(p<bytes.length){if(p+12>bytes.length)throw new Error('Truncated ASG');const n=view(bytes).getUint32(p+4,true)+8;if(n>bytes.length-p)throw new Error('ASG WAV exceeds file');addWave(e.path,bytes.subarray(p,p+n),p,`${e.name} / sample ${i++}`,'Global sound');p+=n+(n&1);}
      reports.asg={sha256,sampleCount:i,exactTiling:p===bytes.length};
    }else if(e.name.toUpperCase()==='DATA.MK3') {
      const ranges:Array<[number,number]>=[];let p=0;
      while(p+12<=bytes.length) {
        if(textAt(bytes,p,4)!=='FORM'||!['PBM ','ILBM'].includes(textAt(bytes,p+8,4))){p++;continue;}
        const n=view(bytes).getUint32(p+4)+8;
        try {
          if(n>bytes.length-p)throw new Error('IFF exceeds DATA.MK3');
          const d=decodeIff(bytes.subarray(p,p+n));
          const metadata={type:d.type,planes:d.planes,masking:d.masking,compression:d.compression,rowLayout:d.rowLayout,trailingBodyBytes:d.trailingBodyBytes,sourceImageOnly:true,
            indices:d.indices,mask:d.mask,paletteRgb:d.palette,paletteFormat:'IFF_CMAP_RGB8',paletteSource:'Embedded CMAP in this source FORM',paletteRuntimeOwnershipKnown:false};
          assets.push({id:`${e.path}@${p}`,name:`IFF ${pictures.length} · ${d.width}×${d.height}`,group:'DATA.MK3 · images',kind:'image',format:d.type.trim(),confidence:'Embedded palette and bitmap decoded',source:{path:e.path,offset:p,length:n,sha256},metadata,width:d.width,height:d.height,rgba:d.rgba,filename:`MK3_DATA_${p.toString(16)}.png`});
          const {indices:_indices,mask:_mask,paletteRgb:_palette,...reportMetadata}=metadata;
          pictures.push({offset:p,length:n,width:d.width,height:d.height,...reportMetadata});ranges.push([p,p+n]);p+=n;
        }catch(error){failures.push({path:e.path,offset:p,error:String(error)});p+=4;}
      }
      let start=0;for(const [a,b] of [...ranges,[bytes.length,bytes.length] as [number,number]]){if(a>start)assets.push({id:`${e.path}:unknown:${start}`,name:`DATA.MK3 unresolved range ${start.toString(16)}`,group:'DATA.MK3 · unresolved',kind:'raw',format:'BIN',confidence:'Unknown; preserved losslessly',source:{path:e.path,offset:start,length:a-start,sha256},metadata:{},bytes:bytes.slice(start,a),filename:`MK3_DATA_${start.toString(16)}_unknown.bin`});start=b;}
      reports.data={sha256,images:pictures,coveredImageBytes:ranges.reduce((n,[a,b])=>n+b-a,0),totalBytes:bytes.length};
    }else assets.push({id:e.path,name:e.name,group:'Music metadata',kind:'raw',format:e.extension,confidence:'Original resource',source:{path:e.path,offset:0,length:e.size,sha256},metadata:{},bytes,filename:e.name});
  }
  reports.containers=containers;reports.failures=failures;reports.summary={assets:assets.length,sprites:assets.filter(a=>a.kind==='sprite').length,images:pictures.length,waves:assets.filter(a=>a.kind==='audio').length,music:assets.filter(a=>a.kind==='music').length};
  if(failures.length)limitations.push(`${failures.length} resources failed decoding; see the evidence report.`);
  return {game:'mk3',assets,reports,packages:[],limitations};
}

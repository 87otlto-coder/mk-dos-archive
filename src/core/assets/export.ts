import { Asset, safeName, utf8, view } from './model';
import { buildStoredZip } from '../research/researchArtifactDownloads';
import { encodeBrowserDeterministicRgbaPng as png } from '../../games/mk1/research/browserStageExportBundle';
export { png };

export function download(bytes:Uint8Array,name:string,mime='application/octet-stream') {
  const url=URL.createObjectURL(new Blob([bytes.slice().buffer],{type:mime})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function assetBytes(a:Asset) { if(a.rgba&&a.width&&a.height)return png(a.width,a.height,a.rgba);if(a.bytes)return a.bytes;throw new Error(`No export data: ${a.name}`); }
export function metadata(a:Asset) {
  const {rgba,bytes,...rest}=a;
  return {...rest,metadata:Object.fromEntries(Object.entries(a.metadata).filter(([,v])=>!(v instanceof Uint8Array)))};
}
export function selectedZip(assets:Asset[]) {
  if(!assets.length)throw new Error('Select at least one asset');
  if(assets.length>10000)throw new Error('Export at most 10,000 assets at a time');
  const files=assets.map((a,i)=>({name:`assets/${String(i).padStart(5,'0')}_${safeName(a.filename)}`,bytes:assetBytes(a)}));
  for(let i=0;i<assets.length;i++)for(const field of ['indices','mask']){const b=assets[i].metadata[field];if(b instanceof Uint8Array)files.push({name:`indexed/${String(i).padStart(5,'0')}_${field}.bin`,bytes:b});}
  files.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify({format:'mkdos_selected_assets_v1',selectionOrder:assets.map(metadata)},null,2))});
  if(files.reduce((n,f)=>n+f.bytes.length,0)>512*1024*1024)throw new Error('Export exceeds 512 MiB; select a smaller batch');
  return buildStoredZip(files);
}
export interface Placement { asset:Asset;x:number;y:number;flip:boolean }
export function compose(width:number,height:number,placements:Placement[]) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>16000000)throw new Error('Canvas must contain 1–16 million pixels');
  const rgba=new Uint8Array(width*height*4);
  for(const {asset:a,x:dx,y:dy,flip}of placements){if(!a.rgba||!a.width||!a.height)throw new Error('Only graphics can be composed');if(!Number.isFinite(dx)||!Number.isFinite(dy))throw new Error('Invalid canvas coordinate');
    for(let y=0;y<a.height;y++){const ty=y+Math.round(dy);if(ty<0||ty>=height)continue;for(let x=0;x<a.width;x++){const tx=x+Math.round(dx);if(tx<0||tx>=width)continue;const s=(y*a.width+(flip?a.width-1-x:x))*4,d=(ty*width+tx)*4,alpha=a.rgba[s+3]/255;if(!alpha)continue;const destAlpha=rgba[d+3]/255,total=alpha+destAlpha*(1-alpha);for(let c=0;c<3;c++)rgba[d+c]=Math.round((a.rgba[s+c]*alpha+rgba[d+c]*destAlpha*(1-alpha))/total);rgba[d+3]=Math.round(total*255);}}
  }return rgba;
}
function concat(parts:Uint8Array[]){const out=new Uint8Array(parts.reduce((n,b)=>n+b.length,0));let p=0;for(const b of parts){out.set(b,p);p+=b.length;}return out;}
function be(n:number){const b=new Uint8Array(4);view(b).setUint32(0,n);return b;}
function crc(bytes:Uint8Array){let c=0xffffffff;for(const x of bytes){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(name:string,data:Uint8Array){const body=concat([utf8.encode(name),data]);return concat([be(data.length),body,be(crc(body))]);}
function graphics(assets:Asset[]){if(!assets.length||assets.some(a=>!a.rgba||!a.width||!a.height))throw new Error('Select graphics only');if(assets.length>2000)throw new Error('Limit animation/sheet to 2,000 frames');}
export function spriteSheet(assets:Asset[],columns:number) {
  graphics(assets);if(!Number.isInteger(columns)||columns<1||columns>assets.length)throw new Error('Invalid sheet column count');
  const cellWidth=Math.max(...assets.map(a=>a.width!)),cellHeight=Math.max(...assets.map(a=>a.height!)),width=cellWidth*columns,height=cellHeight*Math.ceil(assets.length/columns);
  const placements=assets.map((asset,i)=>({asset,x:i%columns*cellWidth,y:Math.floor(i/columns)*cellHeight,flip:false}));
  return {bytes:png(width,height,compose(width,height,placements)),width,height,cellWidth,cellHeight,columns};
}
/** Full-frame APNG, transparent canvas, replace disposal/blend; user-set presentation timing. */
export function animatedPng(assets:Asset[],frameMs:number) {
  graphics(assets);if(!Number.isInteger(frameMs)||frameMs<10||frameMs>60000)throw new Error('Frame duration must be 10–60,000 ms');
  const width=Math.max(...assets.map(a=>a.width!)),height=Math.max(...assets.map(a=>a.height!));
  if(width*height*assets.length>64000000)throw new Error('Animation exceeds 64 million total pixels; use fewer frames');
  const parts:Uint8Array[]=[];let sequence=0;
  for(let i=0;i<assets.length;i++) {
    const bytes=png(width,height,compose(width,height,[{asset:assets[i],x:0,y:0,flip:false}])),v=view(bytes);let idat:Uint8Array|undefined;
    if(!i){parts.push(bytes.slice(0,33));parts.push(chunk('acTL',concat([be(assets.length),be(0)])));}
    for(let p=8;p<bytes.length;){const n=v.getUint32(p);if(new TextDecoder().decode(bytes.subarray(p+4,p+8))==='IDAT')idat=bytes.slice(p+8,p+8+n);p+=12+n;}
    if(!idat)throw new Error('PNG IDAT missing');
    const control=new Uint8Array(26),cv=view(control);cv.setUint32(0,sequence++);cv.setUint32(4,width);cv.setUint32(8,height);cv.setUint16(20,frameMs);cv.setUint16(22,1000);control[24]=0;control[25]=0;parts.push(chunk('fcTL',control));
    parts.push(i?chunk('fdAT',concat([be(sequence++),idat])):chunk('IDAT',idat));
  }parts.push(chunk('IEND',new Uint8Array()));return concat(parts);
}

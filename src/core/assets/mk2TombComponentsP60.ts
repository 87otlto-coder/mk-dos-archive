/** P60: independent Tomb component exports, not a playable scene.
 * O123 architecture/sky and O117 floor do NOT share an authenticated registration.
 */
import {type Asset,hash,utf8} from './model';
import {buildStoredZip} from '../research/researchArtifactDownloads';
import {parseAnimationStoreZip,decodeAnimationBundlePng} from '../../games/mk1/research/browserAnimationExportBundleValidation';
import {encodeOriginalEffectRgbaPngO177} from '../../games/mk2/research/stageSourcePngO177';

const EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65';
const GRA='be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613';
const CAPTURE='5cd8f5ed5d75a4098df714b45a24ba2d7fe6ab43881add8e9c1043aa2b8e9ec9';
const SOURCES=[
 {name:'architecture',setup:0x1737c,width:850,height:224,dx:267,dy:57,samples:2650},
 {name:'sky',setup:0x173b2,width:320,height:80,dx:2,dy:-47,samples:823},
] as const;
type Pack={name:string;bytes:Uint8Array};
function requireP60(ok:unknown,why:string):asserts ok {if(!ok)throw new Error('P60 Tomb: '+why);}
const sha=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/i.test(v);
const plane=(v:unknown,n:number):v is Uint8Array=>v instanceof Uint8Array&&v.length===n;
const original=(p:string)=>p.toLowerCase().replace(/\\/g,'/').split('/').pop()==='tomb.gra';

export async function buildTombComponentsP60(p59:Pack,assets:readonly Asset[]):Promise<Pack>{
 requireP60(p59.name==='MK2_P59_TOMB_SCREENSHOT_SAMPLES.zip','P59 qualified archive name');
 const zip=parseAnimationStoreZip(p59.bytes);
 const names=['manifest.json',...SOURCES.flatMap(s=>[s.name+'.png',s.name+'.indices.bin',s.name+'.mask.bin'])];
 requireP60(zip.size===names.length&&names.every(n=>zip.has(n)),'P59 required entries or unknown members');
 const bytes=(p:string)=>{const e=zip.get(p);requireP60(e,'missing '+p);return e.bytes;};
 let manifest:any;try{manifest=JSON.parse(new TextDecoder().decode(bytes('manifest.json')));}
 catch{throw Error('P60 Tomb: malformed P59 manifest');}
 requireP60(manifest&&manifest.format==='mk2-p59-tomb-heldout-v1'&&
  manifest.exeSha256===EXE&&manifest.tombSha256===GRA&&manifest.screenshotSha256===CAPTURE&&
  Array.isArray(manifest.layers)&&manifest.layers.length===2,'P59 source and capture provenance');
 const files:Array<{name:string;bytes:Uint8Array}>=[];
 const records:Array<Record<string,unknown>>=[];
 for(let i=0;i<SOURCES.length;i++){
  const s=SOURCES[i],r=manifest.layers[i];
  const assetID='mk2-stage-setup:tomb:object2_'+s.setup.toString(16).toUpperCase();
  requireP60(r&&r.name===s.name&&r.setup===s.setup&&r.sourceAssetId===assetID&&
   r.width===s.width&&r.height===s.height&&r.dx===s.dx&&r.dy===s.dy&&
   r.count===s.samples&&sha(r.rgba)&&sha(r.indices)&&sha(r.mask)&&
   Array.isArray(r.regions)&&r.regions.length>0,'O123 '+s.name+' setup and sample provenance');
  const png=bytes(s.name+'.png'),indices=bytes(s.name+'.indices.bin'),mask=bytes(s.name+'.mask.bin');
  const decoded=decodeAnimationBundlePng(png),n=319*199;
  requireP60(decoded.width===319&&decoded.height===199&&plane(indices,n)&&plane(mask,n),
   s.name+' source-sample geometry');
  let samples=0;
  for(let j=0;j<n;j++){
   requireP60(mask[j]===0||mask[j]===1,s.name+' binary sample mask');
   if(mask[j]){samples++;requireP60(decoded.rgba[j*4+3]===255,s.name+' sampled alpha');}
   else requireP60(indices[j]===0&&decoded.rgba[j*4]===0&&decoded.rgba[j*4+1]===0&&
    decoded.rgba[j*4+2]===0&&decoded.rgba[j*4+3]===0,s.name+' unsampled pixels must be blank');
  }
  requireP60(samples===s.samples,s.name+' held-out count');
  const dir='components/'+s.name+'/';
  files.push({name:dir+'sampled.png',bytes:png},{name:dir+'indices.bin',bytes:indices},
   {name:dir+'sample-mask.bin',bytes:mask});
  records.push({component:s.name,evidence:'O123 independent screenshot-registered sample',
   originalSourceAssetID:assetID,originalSourceGRA:'TOMB.GRA',sourceSHA256:GRA,
   sourceSetupObject2:s.setup,sourceCanvas:{width:s.width,height:s.height},
   outputGeometry:{width:319,height:199},sampleCount:s.samples,
   screenshotSHA256:CAPTURE,coordinateSystem:'O123 captured screenshot 637x397, sampled at (2x,2y)',
   registration:{shiftX:s.dx,shiftY:s.dy,regions:r.regions,
    onlySampledRegionsQualified:true,runtimePlacementKnown:false},
   sourcePlaneSHA256:{rgba:r.rgba,indices:r.indices,mask:r.mask},
   projectedSHA256:{indices:await hash(indices),mask:await hash(mask),png:await hash(png)},
   files:{png:dir+'sampled.png',indices:dir+'indices.bin',mask:dir+'sample-mask.bin'},
   nativePaletteOwnershipKnown:false,stageLayerOrderKnown:false});
 }
 const hits=assets.filter(a=>a.id==='mk2-witnessed-floor:tomb:x291');
 requireP60(hits.length===1,'unique original P15 floor');
 const floor=hits[0],m=floor.metadata,n=320*48;
 requireP60(floor.kind==='stage'&&floor.width===320&&floor.height===48&&plane(floor.rgba,n*4)&&
  original(floor.source.path)&&floor.source.sha256===GRA&&
  floor.source.offset===63776&&floor.source.length===896*48,
  'P15 original floor source and geometry');
 requireP60(m.originalGRAOffset===63776&&m.originalSourceRows===48&&
  m.sourceStride===896&&m.sourceLeft===291&&m.sourceFirstRow===0&&
  m.screenshotObservedRGB===true&&m.sourceIndicesVerified===true&&
  m.originalScreenshotHeldOutExactMatches===12222&&
  m.runtimeNativeDACBankKnown===false&&m.runtimeCameraKnown===false&&
  m.fullStageScene===false&&m.originalAnimationTimingKnown===false&&m.nativePaletteKnown===false,
  'P15 floor witness and uncertainty');
 requireP60(plane(m.indices,n)&&plane(m.mask,n)&&plane(m.paletteKnownMask,n)&&
  m.mask.every((x:number)=>x===1)&&m.paletteKnownMask.every((x:number)=>x===0),
  'P15 floor indexed/paint/native-palette-known masks');
 requireP60(sha(m.sourcePixelSha256)&&sha(m.observedRgbPreviewSha256)&&
  sha(m.originalScreenshotPaletteSourceSHA256)&&
  await hash(m.indices)===m.sourcePixelSha256&&await hash(floor.rgba)===m.observedRgbPreviewSha256,
  'P15 original screenshot witness/plane hashes');
 const floorPng=encodeOriginalEffectRgbaPngO177(320,48,floor.rgba);
 files.push({name:'components/floor/conditional-rgb.png',bytes:floorPng},
  {name:'components/floor/indices.bin',bytes:m.indices},
  {name:'components/floor/paint-mask.bin',bytes:m.mask},
  {name:'components/floor/native-palette-known-mask.bin',bytes:m.paletteKnownMask});
 records.push({component:'floor',evidence:'P15/O115/O117 conditional original screenshot RGB',
  sourceAssetID:floor.id,originalSourceGRA:'TOMB.GRA',sourceSHA256:GRA,
  sourceExtent:{offset:63776,length:896*48,stride:896,rows:48},
  originalSourceLeft:291,outputGeometry:{width:320,height:48},
  coordinateSystem:'P15/O117 floor screenshot; NOT O123 architecture/sky capture',
  screenshotMatches:12222,witnessScreenshotSHA256:m.originalScreenshotPaletteSourceSHA256,
  originalIndicesSHA256:m.sourcePixelSha256,conditionalRGBSHA256:m.observedRgbPreviewSha256,
  pngSHA256:await hash(floorPng),nativePaletteKnownMaskAllZero:true,
  registeredAgainstO123:false,runtimeCameraKnown:false,stageLayerOrderKnown:false,
  files:{png:'components/floor/conditional-rgb.png',indices:'components/floor/indices.bin',
   mask:'components/floor/paint-mask.bin',
   nativePaletteKnownMask:'components/floor/native-palette-known-mask.bin'}});
 const output={format:'mk2_p60_tomb_independent_components_v1',
  sourceExecutableSHA256:EXE,sourceTombGRA_SHA256:GRA,componentCount:3,
  originalAssetCensusDelta:0,originalAssetsModified:false,
  coordinateFramesIndependent:true,commonRuntimeCameraKnown:false,
  fullStageCompositionVerified:false,nativePaletteOwnershipKnown:false,
  originalLayerOrderKnown:false,nativeAnimationTimingKnown:false,
  warning:'O123 architecture/sky samples and P15/O117 floor are NOT co-registered. Their positions, layering, runtime palettes and camera must not be combined into a supposed game scene.',
  components:records};
 files.push({name:'manifest.json',bytes:utf8.encode(JSON.stringify(output,null,2)+'\n')});
 return {name:'MK2_P60_TOMB_INDEPENDENT_COMPONENTS.zip',bytes:buildStoredZip(files)};
}
